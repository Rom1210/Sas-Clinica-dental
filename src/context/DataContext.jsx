/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useSettings } from './SettingsContext';

const DataContext = createContext();

const MONTHS_SHORT = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

export const DataProvider = ({ children }) => {
  const { user, activeOrgId } = useAuth();
  const { exchangeRate } = useSettings();
  const [doctors, setDoctors] = useState([]);
  const [services, setServices] = useState([]);
  const [patients, setPatients] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all initial data when user and organization are available
  useEffect(() => {
    if (user && activeOrgId) {
      fetchAllData();

      // Real-time subscriptions
      const channel = supabase
        .channel('db-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'patients', filter: `organization_id=eq.${activeOrgId}` },
          () => fetchAllData()
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'appointments', filter: `organization_id=eq.${activeOrgId}` },
          () => fetchAllData()
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'consultations', filter: `organization_id=eq.${activeOrgId}` },
          () => fetchAllData()
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'invoices', filter: `organization_id=eq.${activeOrgId}` },
          () => fetchAllData()
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'payments', filter: `organization_id=eq.${activeOrgId}` },
          () => fetchAllData()
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'services', filter: `organization_id=eq.${activeOrgId}` },
          () => fetchAllData()
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'doctors', filter: `organization_id=eq.${activeOrgId}` },
          () => fetchAllData()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      setLoading(false);
    }
  }, [user, activeOrgId]);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        { data: docs, error: docsErr },
        { data: servs, error: servsErr },
        { data: pats, error: patsErr },
        { data: exps, error: expsErr },
        { data: apps, error: appsErr },
        { data: cons, error: consErr },
        { data: pays, error: paysErr },
        { data: invs, error: invsErr },
        { data: teamData, error: teamErr }
      ] = await Promise.all([
        supabase.from('doctors').select('*').eq('organization_id', activeOrgId),
        supabase.from('services').select('*').eq('organization_id', activeOrgId),
        supabase.from('patients').select('*').eq('organization_id', activeOrgId),
        supabase.from('expenses').select('*').eq('organization_id', activeOrgId),
        supabase.from('appointments').select('*, patient:patients(first_name, last_name, email, full_name), doctor:doctors(full_name)').eq('organization_id', activeOrgId),
        supabase.from('consultations').select('*, doctor:doctors(full_name)').eq('organization_id', activeOrgId),
        supabase.from('payments').select('*, patient:patients(first_name, last_name, email, full_name)').eq('organization_id', activeOrgId),
        supabase.from('invoices').select('*, patient:patients(first_name, last_name, email, full_name)').eq('organization_id', activeOrgId),
        supabase.from('organization_users').select('*, profile:profiles(id, full_name, email)').eq('organization_id', activeOrgId)
      ]);

      if (docsErr || servsErr || patsErr || expsErr || appsErr || consErr || paysErr || invsErr || teamErr) {
        throw new Error('Error al cargar datos de Supabase');
      }

      setDoctors((docs || []).map(d => ({
        ...d,
        name: d.full_name, // Mapping for UI compatibility
        color: d.calendar_color
      })));
      setServices((servs || []).map(s => ({
        ...s,
        price: s.base_price // Mapping for UI compatibility
      })));
      // Helper to parse 'Total: $XX' from appointment notes
      const getAppointmentCost = (notes) => {
        if (!notes || !notes.includes('Total: $')) return 0;
        try {
          const parts = notes.split('Total: $');
          if (parts.length > 1) {
            // Take the number after the $ and before any space or end of string
            const amountStr = parts[1].trim().split(' ')[0].replace(',', '');
            return parseFloat(amountStr) || 0;
          }
        } catch (error) {
          console.error("Error parsing appointment cost:", error);
        }
        return 0;
      };

      const mappedPatients = (pats || []).map(p => {
        const pCons = (cons || []).filter(c => c.patient_id === p.id);
        const pPays = (pays || []).filter(pay => pay.patient_id === p.id);
        const pApps = (apps || []).filter(a => a.patient_id === p.id);

        const totalDueCons = pCons.reduce((sum, c) => sum + (c.amount || 0), 0);
        const totalPaid = pPays.reduce((sum, pay) => {
          // Priority 1: Use pre-calculated amount_usd if present (Financial Immutability)
          if (pay.amount_usd) return sum + parseFloat(pay.amount_usd);
          
          // Priority 2: Use saved exchange_rate from the transaction time
          if (pay.exchange_rate && pay.currency === 'VES') {
            return sum + (parseFloat(pay.amount) / parseFloat(pay.exchange_rate));
          }

          // Fallback: Use current exchange rate (for legacy records)
          const amt = parseFloat(pay.amount || 0);
          return sum + (pay.currency === 'USD' ? amt : amt / (exchangeRate || 45.50));
        }, 0);
        
        // Sum costs from appointments that have already occurred
        const now = new Date();
        const totalDueApps = pApps.reduce((sum, a) => {
          const isPast = new Date(a.starts_at || a.start_at) <= now;
          return sum + (isPast ? getAppointmentCost(a.notes) : 0);
        }, 0);

        const debt = (totalDueCons + totalDueApps) - totalPaid;

        return {
          ...p,
          name: p.full_name || (p.first_name + ' ' + (p.last_name || '')).trim() || p.email || 'Paciente',
          debt: debt > 1 ? debt : 0, // 1 USD threshold for small deviations
          balance: debt,
          paymentCount: pPays.length
        };
      });
      setPatients(mappedPatients); // all patients (including archived)
      setExpenses(exps || []);
      
      // ─── calculateBlocks ────────────────────────────────────────────────────
      // Converts ISO UTC start/end strings to an array of 15-min time labels.
      // IMPORTANT: Uses UTC methods because timestamps are stored in UTC and
      // the scheduler grid time strings ('08:00','08:15',...) are also UTC-based
      // — they represent the time the user selected, not a local-timezone interpretation.
      const calculateBlocks = (startISO, endISO) => {
        if (!startISO || !endISO) return [];
        const start = new Date(startISO);
        const end   = new Date(endISO);
        const blocks = [];
        const cur = new Date(start);
        while (cur < end) {
          const hh = String(cur.getUTCHours()).padStart(2, '0');
          const mm = String(cur.getUTCMinutes()).padStart(2, '0');
          blocks.push(`${hh}:${mm}`);
          cur.setUTCMinutes(cur.getUTCMinutes() + 15);
        }
        return blocks;
      };
      // ────────────────────────────────────────────────────────────────────────

      // Map appointments to the internal format expected by the UI
      setAppointments((apps || []).map(app => {
          const patientName = app.patient?.full_name || (app.patient?.first_name + ' ' + (app.patient?.last_name || '')).trim() || 'Desconocido';
          
          // Resilient check for both singular and plural naming conventions
          const rawStartsAt = app.starts_at || app.start_at;
          const rawEndsAt = app.ends_at || app.end_at;
          
          const sBlocks = calculateBlocks(rawStartsAt, rawEndsAt);
          // Date also derived from UTC to match the grid's dateStr format
          // (grid dateStr = the calendar date when the user selected the slot)
          const sDate = rawStartsAt ? (() => {
            const d = new Date(rawStartsAt);
            const y = d.getUTCFullYear();
            const mo = String(d.getUTCMonth()+1).padStart(2,'0');
            const dy = String(d.getUTCDate()).padStart(2,'0');
            return `${y}-${mo}-${dy}`;
          })() : '';


          
          const getHHMMUTC = (iso) => {
            if (!iso) return '';
            const d = new Date(iso);
            return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
          };

          return {
            ...app,
            date: sDate,
            patientName,
            doctorName: app.doctor?.full_name || 'Desconocido',
            doctorId: app.doctor_id,
            patientId: app.patient_id,
            blocks: sBlocks,
            // Consistently derived from UTC to match grid
            startTime: getHHMMUTC(rawStartsAt),
            endTime: getHHMMUTC(rawEndsAt)
          }
      }));

      setConsultations(cons || []);
      setInvoices((invs || []).map(i => ({
        ...i,
        patientName: i.patient?.full_name || (i.patient?.first_name + ' ' + (i.patient?.last_name || '')).trim() || 'Paciente'
      })));
      setPayments((pays || []).map(p => ({
        ...p,
        patientName: p.patient?.full_name || (p.patient?.first_name + ' ' + (p.patient?.last_name || '')).trim() || 'Paciente'
      })));
      setTeam((teamData || []).map(m => ({
        id: m.id,
        user_id: m.user_id,
        name: m.profile?.full_name || m.profile?.email || 'Miembro',
        email: m.profile?.email,
        role: m.role,
        status: m.status || (m.is_active ? 'active' : 'inactive')
      })));

    } finally {
      setLoading(false);
    }
  }, [user, activeOrgId, exchangeRate]);

  // --- Real-time Stats Calculation ---
  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    // Helper to filter by month/year
    const isThisMonth = (dateStr) => {
      const d = new Date(dateStr);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    };
    const isLastMonth = (dateStr) => {
      const d = new Date(dateStr);
      return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
    };

    // 1. Income (from Payments - more accurate for "cash on hand")
    const thisMonthPayments = payments.filter(p => isThisMonth(p.created_at));
    const lastMonthPayments = payments.filter(p => isLastMonth(p.created_at));
    
    const currentIncome = thisMonthPayments.reduce((sum, p) => {
      if (p.amount_usd) return sum + parseFloat(p.amount_usd);
      if (p.exchange_rate && p.currency === 'VES') {
        return sum + (parseFloat(p.amount) / parseFloat(p.exchange_rate));
      }
      const amt = parseFloat(p.amount || 0);
      return sum + (p.currency === 'USD' || !p.currency ? amt : amt / (exchangeRate || 45.50));
    }, 0);
    
    const lastIncome = lastMonthPayments.reduce((sum, p) => {
      if (p.amount_usd) return sum + parseFloat(p.amount_usd);
      if (p.exchange_rate && p.currency === 'VES') {
        return sum + (parseFloat(p.amount) / parseFloat(p.exchange_rate));
      }
      const amt = parseFloat(p.amount || 0);
      return sum + (p.currency === 'USD' || !p.currency ? amt : amt / (exchangeRate || 45.50));
    }, 0);
    
    const incomeTrend = lastIncome === 0 ? (currentIncome > 0 ? 100 : 0) : ((currentIncome - lastIncome) / lastIncome) * 100;

    // 2. New Patients
    const thisMonthPatients = patients.filter(p => isThisMonth(p.created_at));
    const lastMonthPatients = patients.filter(p => isLastMonth(p.created_at));
    const newPatientsTrend = thisMonthPatients.length - lastMonthPatients.length;

    // 3. Conversion Rate (Consultations / Appointments)
    const totalApps = appointments.length;
    const totalCons = consultations.length;
    const conversionRate = totalApps === 0 ? 0 : Math.round((totalCons / totalApps) * 100);
    
    // 4. Debtors List (Caza-Deudores)
    const patientBalances = patients.map(p => {
      // Use the pre-calculated balance from the patient object
      return { 
        ...p, 
        lastMovement: consultations.filter(c => c.patient_id === p.id)[0]?.created_at || p.created_at 
      };
    }).filter(pf => pf.balance > 0).sort((a, b) => b.balance - a.balance);

    // 5. Specialty Distribution
    const specialtyMap = {
      'Limpieza Dental': 'Estética',
      'Endodoncia': 'Ortodoncia',
      'Resina Simple': 'Ortodoncia',
      'Resina Compuesta': 'Ortodoncia',
      'Blanqueamiento': 'Estética',
      'Extracción Simple': 'Cirugía',
      'Consulta General': 'General'
    };
    const specialtyDist = consultations.reduce((acc, c) => {
      const spec = specialtyMap[c.treatment_summary] || 'General';
      acc[spec] = (acc[spec] || 0) + 1;
      return acc;
    }, {});
    
    const totalConsultas = consultations.length || 1;
    const specialtyData = Object.entries(specialtyDist).map(([name, count]) => ({
      name,
      value: Math.round((count / totalConsultas) * 100),
      count
    }));

    // 6. Extended Stats for RCM
    const doctorPerformance = doctors.map(doc => {
      const dApps = appointments.filter(a => (a.doctor_id === doc.id || a.doctor?.id === doc.id));
      const dCons = consultations.filter(c => (c.doctor_id === doc.id || c.doctor?.id === doc.id));
      const conv = dApps.length === 0 ? 0 : Math.round((dCons.length / dApps.length) * 100);
      return {
        id: doc.id,
        name: doc.name,
        appointments: dApps.length,
        consultations: dCons.length,
        conversionRate: conv
      };
    }).sort((a, b) => b.appointments - a.appointments);

    const servicePopularity = Object.entries(specialtyDist).map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / totalConsultas) * 100)
    })).sort((a, b) => b.count - a.count);

    // Monthly Financials (Last 12 months)
    const monthlyTrends = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      const m = d.getMonth();
      const y = d.getFullYear();
      const label = MONTHS_SHORT[m];
      
      const mPayments = payments.filter(p => {
        const pdate = new Date(p.created_at);
        return pdate.getMonth() === m && pdate.getFullYear() === y;
      });
      const mExpenses = expenses.filter(exp => {
        const edate = new Date(exp.date || exp.created_at);
        return edate.getMonth() === m && edate.getFullYear() === y;
      });

      return {
        label,
        income: mPayments.reduce((s, p) => {
          if (p.amount_usd) return s + parseFloat(p.amount_usd);
          if (p.exchange_rate && p.currency === 'VES') {
            return s + (parseFloat(p.amount) / parseFloat(p.exchange_rate));
          }
          const amt = parseFloat(p.amount || 0);
          return s + (p.currency === 'USD' || !p.currency ? amt : amt / (exchangeRate || 45.50));
        }, 0),
        expenses: mExpenses.reduce((s, e) => s + (e.currency === 'USD' || !e.currency ? (parseFloat(e.amount) || 0) : (parseFloat(e.amount) || 0) / (exchangeRate || 45.50)), 0)
      };
    });

    return {
      currentIncome,
      incomeTrend,
      newPatientsCount: thisMonthPatients.length,
      newPatientsTrend,
      conversionRate,
      debtors: patientBalances,
      specialtyData,
      totalIncome: payments.reduce((sum, p) => {
        if (p.amount_usd) return sum + parseFloat(p.amount_usd);
        if (p.exchange_rate && p.currency === 'VES') {
          return sum + (parseFloat(p.amount) / parseFloat(p.exchange_rate));
        }
        const amt = parseFloat(p.amount || 0);
        return sum + (p.currency === 'USD' || !p.currency ? amt : amt / (exchangeRate || 45.50));
      }, 0),
      totalCuentasPorCobrar: patientBalances.reduce((sum, p) => sum + (p.debt || 0), 0),
      totalEgresos: expenses.reduce((sum, e) => sum + (e.currency === 'USD' || !e.currency ? (parseFloat(e.amount) || 0) : (parseFloat(e.amount) || 0) / (exchangeRate || 45.50)), 0),
      extendedStats: {
        doctorPerformance,
        servicePopularity,
        monthlyTrends,
        patientGrowth: patients.length
      }
    };
  }, [invoices, patients, appointments, consultations, payments, expenses, doctors]);

  // --- Services ---
  const addService = async (service) => {
    const { error } = await supabase
      .from('services')
      .insert([{ 
        name: service.name,
        base_price: service.price,
        category: service.cat || 'General',
        organization_id: activeOrgId 
      }])
      .select();
    if (error) throw error;
    await fetchAllData();
  };

  const removeService = async (id) => {
    const { error } = await supabase.from('services').delete().eq('id', id);
    if (error) throw error;
    setServices(prev => prev.filter(s => s.id !== id));
  };

  const updateService = async (service) => {
    const { error } = await supabase
      .from('services')
      .update({
        name: service.name,
        base_price: service.price,
        category: service.cat || 'General'
      })
      .eq('id', service.id)
      .select();
    if (error) throw error;
    await fetchAllData();
  };

  // --- Doctors ---
  const addDoctor = async (doctor) => {
    const { error } = await supabase
      .from('doctors')
      .insert([{ 
        full_name: doctor.name,
        calendar_color: doctor.color,
        is_specialist: doctor.isSpecialist,
        specialty: doctor.specialty,
        status: (doctor.status || 'active').toLowerCase(),
        organization_id: activeOrgId 
      }])
      .select();
    if (error) throw error;
    await fetchAllData();
  };

  const removeDoctor = async (id) => {
    const { error } = await supabase.from('doctors').delete().eq('id', id);
    if (error) throw error;
    setDoctors(prev => prev.filter(d => d.id !== id));
  };

  const updateDoctor = async (doctor) => {
    const { error } = await supabase
      .from('doctors')
      .update({
        full_name: doctor.name,
        calendar_color: doctor.color,
        is_specialist: doctor.isSpecialist,
        specialty: doctor.specialty,
        status: (doctor.status || 'active').toLowerCase()
      })
      .eq('id', doctor.id)
      .select();
    if (error) throw error;
    await fetchAllData();
  };

  // --- Patients & Payments ---
  const addPatient = async (patient) => {
    // Check if we are receiving firstName/lastName or full_name
    const patientToInsert = {
      organization_id: activeOrgId,
      first_name: patient.firstName || patient.full_name?.split(' ')[0] || 'Paciente',
      last_name: patient.lastName || patient.full_name?.split(' ').slice(1).join(' ') || null,
      dni: patient.dni || null,
      email: patient.email || null,
      phone: patient.phone || null,
      whatsapp: patient.whatsapp || patient.phone || null,
      birth_date: patient.birth_date || null,
      gender: patient.gender || null,
      status: patient.status || 'active',
      medical_flags: patient.medical_history?.flags || [],
      habits: {
        fuma: patient.medical_history?.fuma || false,
        bruxismo: patient.medical_history?.bruxismo || false
      }
    };

    const { data, error } = await supabase
      .from('patients')
      .insert([patientToInsert])
      .select();
    if (error) throw error;
    await fetchAllData();
    return data[0];
  };

  const addPayment = async (paymentData) => {
    const { error } = await supabase
      .from('payments')
      .insert([{ 
        ...paymentData, 
        organization_id: activeOrgId 
      }]);
    if (error) throw error;
    // Update local state or re-fetch
    fetchAllData(); 
  };

  // --- Expenses ---
  const addExpense = async (expense) => {
    const { data, error } = await supabase
      .from('expenses')
      .insert([{ ...expense, organization_id: activeOrgId }])
      .select();
    if (error) throw error;
    setExpenses(prev => [...prev, data[0]]);
  };

  // --- Appointments ---
  const addAppointment = async (appointmentData) => {
    const { error } = await supabase
      .from('appointments')
      .insert([{ 
        ...appointmentData, 
        organization_id: activeOrgId
      }]);
    if (error) throw error;
    await fetchAllData();
  };

  const updateAppointment = async (id, updateData) => {
    const { data, error } = await supabase
      .from('appointments')
      .update(updateData)
      .eq('id', id)
      .select();
    if (error) throw error;
    await fetchAllData();
    return data[0];
  };

  const addConsultation = async (consultationData) => {
    const { data, error } = await supabase
      .from('consultations')
      .insert([{
        ...consultationData,
        organization_id: activeOrgId,
        created_by_user_id: user.id
      }])
      .select();
    if (error) throw error;
    await fetchAllData();
    return data[0];
  };

  const removeTeamMember = async (id) => {
    const { error } = await supabase.from('organization_users').delete().eq('id', id);
    if (error) throw error;
    setTeam(prev => prev.filter(m => m.id !== id));
  };

  const deletePatient = async (id) => {
    console.log('DataContext: Soft-deleting patient (archiving):', id);
    const { error } = await supabase
      .from('patients')
      .update({ status: 'archived' })
      .eq('id', id);
    if (error) {
      console.error('DataContext: Supabase archive error:', error);
      throw error;
    }
    console.log('DataContext: Patient archived successfully.');
    await fetchAllData();
  };

  const addInvoice = async (invoiceData) => {
    const { data, error } = await supabase
      .from('invoices')
      .insert([{ 
        ...invoiceData, 
        organization_id: activeOrgId,
        invoice_number: `INV-${Date.now().toString().slice(-6)}` 
      }])
      .select();
    if (error) throw error;
    await fetchAllData();
    return data[0];
  };

  return (
    <DataContext.Provider value={{
      services, addService, removeService, updateService,
      doctors, addDoctor, removeDoctor, updateDoctor,
      patients, addPatient, deletePatient, 
      allPatients: patients, // includes archived — for finance/history views
      payments, addPayment,
      expenses, addExpense,
      appointments, addAppointment, updateAppointment,
      consultations, addConsultation,
      invoices, addInvoice,
      team, removeTeamMember,
      stats,
      extendedStats: stats?.extendedStats,
      loading, error, refresh: fetchAllData
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
};
