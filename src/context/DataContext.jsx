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
  const [media, setMedia] = useState([]);
  const [treatmentPlans, setTreatmentPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all initial data when user and organization are available
  useEffect(() => {
    if (user && activeOrgId) {
      fetchAllData();

      // Granular real-time subscriptions
      const tables = ['patients', 'appointments', 'consultations', 'invoices', 'payments', 'services', 'doctors', 'expenses', 'patient_media', 'treatment_plans', 'treatment_plan_items'];
      
      const channel = supabase.channel('db-changes');
      
      tables.forEach(table => {
        channel.on(
          'postgres_changes',
          { event: '*', schema: 'public', table, filter: `organization_id=eq.${activeOrgId}` },
          (payload) => {
            console.log(`Real-time change in ${table}:`, payload.eventType);
            // Handle granular updates instead of refetching all
            handleGranularUpdate(table, payload);
          }
        );
      });

      channel.subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      setLoading(false);
    }
  }, [user, activeOrgId]);

  const handleGranularUpdate = (table, payload) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    const updateState = (setter) => {
      if (eventType === 'INSERT') {
        setter(prev => {
          // Filter out optimistic matches to prevent duplicates
          const filtered = prev.filter(item => {
            if (!item.isOptimistic) return true;
            const match = item.doctor_id === newRecord.doctor_id && 
                          (item.starts_at === newRecord.starts_at || item.start_at === newRecord.start_at) && 
                          (item.patient_id === newRecord.patient_id || item.patientId === newRecord.patient_id);
            return !match;
          });
          return [...filtered, newRecord];
        });
      } else if (eventType === 'UPDATE') {
        setter(prev => prev.map(item => item.id === newRecord.id ? newRecord : item));
      } else if (eventType === 'DELETE') {
        setter(prev => prev.filter(item => item.id !== (oldRecord?.id || payload.old?.id)));
      }
    };

    switch (table) {
      case 'patients': updateState(setPatients); break;
      case 'appointments': updateState(setAppointments); break;
      case 'consultations': updateState(setConsultations); break;
      case 'invoices': updateState(setInvoices); break;
      case 'payments': updateState(setPayments); break;
      case 'services': updateState(setServices); break;
      case 'doctors': updateState(setDoctors); break;
      case 'expenses': updateState(setExpenses); break;
      case 'patient_media': updateState(setMedia); break;
      case 'treatment_plans': 
      case 'treatment_plan_items': fetchAllData(); break; // Simpler for plans with nested items
      default: fetchAllData(); // Fallback if unknown table
    }
  };

  const fetchAllData = useCallback(async () => {
    if (!activeOrgId) return;
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
        { data: teamData, error: teamErr },
        { data: mediaData, error: mediaErr },
        { data: plansData, error: plansErr }
      ] = await Promise.all([
        supabase.from('doctors').select('*').eq('organization_id', activeOrgId),
        supabase.from('services').select('*').eq('organization_id', activeOrgId),
        supabase.from('patients').select('*').eq('organization_id', activeOrgId),
        supabase.from('expenses').select('*').eq('organization_id', activeOrgId),
        supabase.from('appointments').select('*').eq('organization_id', activeOrgId),
        supabase.from('consultations').select('*').eq('organization_id', activeOrgId),
        supabase.from('payments').select('*').eq('organization_id', activeOrgId),
        supabase.from('invoices').select('*').eq('organization_id', activeOrgId),
        supabase.from('organization_users').select('*, profile:profiles(id, full_name, email)').eq('organization_id', activeOrgId),
        supabase.from('patient_media').select('*').eq('organization_id', activeOrgId),
        supabase.from('treatment_plans').select('*, items:treatment_plan_items(*)').eq('organization_id', activeOrgId)
      ]);

      // We allow mediaErr and plansErr to fail gracefully if tables don't exist yet
      if (docsErr || servsErr || patsErr || expsErr || appsErr || consErr || paysErr || invsErr || teamErr) {
        console.error('Supabase Error:', { docsErr, servsErr, patsErr, expsErr, appsErr, consErr, paysErr, invsErr, teamErr });
        throw new Error('Error al cargar datos de Supabase');
      }

      if (mediaErr) console.warn('Note: patient_media table might not exist yet.');
      if (plansErr) console.warn('Note: treatment_plans table might not exist yet.');

      setDoctors((docs || []).map(d => ({ ...d, name: d.full_name, color: d.calendar_color })));
      setServices((servs || []).map(s => ({ ...s, price: s.base_price })));
      setPatients(pats || []);
      setExpenses(exps || []);
      setAppointments(apps || []);
      setConsultations(cons || []);
      setInvoices(invs || []);
      setPayments(pays || []);
      setMedia(mediaData || []);
      setTreatmentPlans(plansData || []);
      setTeam((teamData || []).map(m => ({
        id: m.id,
        user_id: m.user_id,
        name: m.profile?.full_name || m.profile?.email || 'Miembro',
        email: m.profile?.email,
        role: m.role,
        status: m.status || (m.is_active ? 'active' : 'inactive')
      })));

    } catch (err) {
      console.error("FetchAllData error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [activeOrgId]);

  // Derived state: Mapped Patients with Balances
  const patientsWithBalance = useMemo(() => {
    const now = new Date();
    return patients.map(p => {
      const pCons = consultations.filter(c => c.patient_id === p.id);
      const pPays = payments.filter(pay => pay.patient_id === p.id);
      const pApps = appointments.filter(a => a.patient_id === p.id);

      const totalDueCons = pCons.reduce((sum, c) => sum + (c.amount || 0), 0);
      
      const totalPaid = pPays.reduce((sum, pay) => {
        if (pay.amount_usd) return sum + parseFloat(pay.amount_usd);
        if (pay.exchange_rate && pay.currency === 'VES') {
          return sum + (parseFloat(pay.amount) / parseFloat(pay.exchange_rate));
        }
        const amt = parseFloat(pay.amount || 0);
        return sum + (pay.currency === 'USD' ? amt : amt / (exchangeRate || 45.50));
      }, 0);
      
      // Now using the NEW total_amount column with fallback to parsing
      const getCost = (a) => {
        if (a.total_amount !== undefined && a.total_amount !== null && a.total_amount !== 0) return parseFloat(a.total_amount);
        // Fallback for legacy
        if (!a.notes || !a.notes.includes('Total: $')) return 0;
        try {
          const amountStr = a.notes.split('Total: $')[1].trim().split(' ')[0].replace(',', '');
          return parseFloat(amountStr) || 0;
        } catch (e) { return 0; }
      };

      const totalDueApps = pApps.reduce((sum, a) => {
        const isPast = new Date(a.starts_at || a.start_at) <= now;
        return sum + (isPast ? getCost(a) : 0);
      }, 0);

      const debt = (totalDueCons + totalDueApps) - totalPaid;

      return {
        ...p,
        name: p.full_name || (p.first_name + ' ' + (p.last_name || '')).trim() || p.email || 'Paciente',
        debt: debt > 1 ? debt : 0,
        balance: debt,
        paymentCount: pPays.length
      };
    });
  }, [patients, consultations, payments, appointments, exchangeRate]);

  // Derived state: Mapped Appointments for UI
  const mappedAppointments = useMemo(() => {
    return appointments.map(app => {
      const patient = patients.find(p => p.id === app.patient_id);
      const doctor = doctors.find(d => d.id === app.doctor_id);
      
      const rawStartsAt = app.starts_at || app.start_at;
      const rawEndsAt = app.ends_at || app.end_at;
      
      const calculateBlocks = (startISO, endISO) => {
        if (!startISO || !endISO) return [];
        const start = new Date(startISO);
        const end = new Date(endISO);
        const blocks = [];
        const cur = new Date(start);
        while (cur < end) {
          const hh = String(cur.getUTCHours()).padStart(2, '0');
          const mm = String(cur.getUTCMinutes()).padStart(2, '0');
          blocks.push(`${hh}:${mm}`);
          cur.setUTCMinutes(cur.setUTCMinutes() + 15);
        }
        return blocks;
      };

      const getISOUTC = (iso) => {
        if (!iso) return '';
        const d = new Date(iso);
        const y = d.getUTCFullYear();
        const mo = String(d.getUTCMonth()+1).padStart(2,'0');
        const dy = String(d.getUTCDate()).padStart(2,'0');
        return `${y}-${mo}-${dy}`;
      };

      const getHHMMUTC = (iso) => {
        const d = new Date(iso);
        return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
      };

      return {
        ...app,
        date: getISOUTC(rawStartsAt),
        patientName: patient?.full_name || 'Paciente',
        doctorName: doctor?.full_name || 'Doctor',
        blocks: calculateBlocks(rawStartsAt, rawEndsAt),
        startTime: getHHMMUTC(rawStartsAt),
        endTime: getHHMMUTC(rawEndsAt)
      };
    });
  }, [appointments, patients, doctors]);

  // --- Real-time Stats Calculation (same as before but using derived states) ---
  const stats = useMemo(() => {
    // ... (rest of the stats logic remains similar, ideally extracting it to a hook later)
    // For now, I'll keep it integrated but using the refactored states.
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const isThisMonth = (dateStr) => {
      const d = new Date(dateStr);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    };

    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const isLastMonth = (dateStr) => {
      const d = new Date(dateStr);
      return d.getMonth() === prevMonth.getMonth() && d.getFullYear() === prevMonth.getFullYear();
    };

    const currentIncome = payments.filter(p => isThisMonth(p.created_at)).reduce((sum, p) => {
      if (p.amount_usd) return sum + parseFloat(p.amount_usd);
      if (p.exchange_rate && p.currency === 'VES') return sum + (parseFloat(p.amount) / parseFloat(p.exchange_rate));
      return sum + (p.currency === 'USD' ? parseFloat(p.amount) : parseFloat(p.amount) / (exchangeRate || 45.50));
    }, 0);

    const lastMonthIncome = payments.filter(p => isLastMonth(p.created_at)).reduce((sum, p) => {
      if (p.amount_usd) return sum + parseFloat(p.amount_usd);
      if (p.exchange_rate && p.currency === 'VES') return sum + (parseFloat(p.amount) / parseFloat(p.exchange_rate));
      return sum + (p.currency === 'USD' ? parseFloat(p.amount) : parseFloat(p.amount) / (exchangeRate || 45.50));
    }, 0);

    const incomeTrend = lastMonthIncome === 0 ? 0 : ((currentIncome - lastMonthIncome) / lastMonthIncome) * 100;

    const newPatientsCount = patients.filter(p => isThisMonth(p.created_at)).length;
    const lastMonthPatientsCount = patients.filter(p => isLastMonth(p.created_at)).length;
    const newPatientsTrend = newPatientsCount - lastMonthPatientsCount;

    const activeBalances = patientsWithBalance.filter(pf => pf.balance > 0).sort((a,b) => b.balance - a.balance);

    const totalScheduled = appointments.filter(a => isThisMonth(a.starts_at || a.start_at)).length;
    const totalCompleted = appointments.filter(a => isThisMonth(a.starts_at || a.start_at) && a.status === 'completed').length;
    const conversionRate = totalScheduled === 0 ? 0 : Math.round((totalCompleted / totalScheduled) * 100);

    return {
      currentIncome,
      incomeTrend,
      newPatientsCount,
      newPatientsTrend,
      conversionRate,
      debtors: activeBalances,
      totalIncome: payments.reduce((sum, p) => sum + (p.amount_usd ? parseFloat(p.amount_usd) : (p.currency === 'USD' ? parseFloat(p.amount) : parseFloat(p.amount) / (exchangeRate || 45.50))), 0),
      totalCuentasPorCobrar: activeBalances.reduce((sum, p) => sum + p.debt, 0),
      totalEgresos: expenses.reduce((sum, e) => sum + (e.amount_usd ? parseFloat(e.amount_usd) : (e.currency === 'USD' ? parseFloat(e.amount) : parseFloat(e.amount) / (exchangeRate || 45.50))), 0),
    };
  }, [patients, payments, expenses, appointments, patientsWithBalance, exchangeRate]);

  // --- CRUD Operations ---
  
  const addPatient = async (patient) => {
    const { data, error } = await supabase.from('patients').insert([{ ...patient, organization_id: activeOrgId }]).select();
    if (error) throw error;
    return data[0];
  };

  const updatePatient = async (id, data) => {
    const { error } = await supabase.from('patients').update(data).eq('id', id);
    if (error) throw error;
  };

  const addAppointment = async (appointment) => {
    const tempId = `opt-${Date.now()}`;
    const optimisticRecord = { ...appointment, id: tempId, isOptimistic: true, organization_id: activeOrgId };
    setAppointments(prev => [...prev, optimisticRecord]);

    try {
      const { data, error } = await supabase.from('appointments').insert([{ ...appointment, organization_id: activeOrgId }]).select();
      if (error) throw error;
      // The real-time listener will replace the optimistic record
    } catch (error) {
      setAppointments(prev => prev.filter(a => a.id !== tempId));
      throw error;
    }
  };

  const updateAppointment = async (id, data) => {
    // Optimistic update
    setAppointments(prev => prev.map(item => item.id === id ? { ...item, ...data } : item));
    
    const { error } = await supabase.from('appointments').update(data).eq('id', id);
    if (error) {
      // Revert on error (simplified: we should ideally keep previous state but here we just wait for real-time to sync back or error out)
      fetchAllData();
      throw error;
    }
  };

  const addPayment = async (patientId, payment) => {
    // Financial Immutability: Store exchange rate and calc USD at the time of insertion
    const exchangeUsed = exchangeRate || 45.50;
    const amountUsd = payment.currency === 'USD' ? payment.amount : (payment.amount / exchangeUsed);
    
    const { data, error } = await supabase.from('payments').insert([{ 
      ...payment, 
      patient_id: patientId, 
      exchange_rate: exchangeUsed,
      amount_usd: amountUsd,
      organization_id: activeOrgId 
    }]).select();
    if (error) throw error;
    return data[0];
  };

  const addConsultation = async (cons) => {
    const { data, error } = await supabase.from('consultations').insert([{ ...cons, organization_id: activeOrgId, created_by_user_id: user.id }]).select();
    if (error) throw error;
    return data[0];
  };

  const deletePatient = async (id) => {
    const { error } = await supabase.from('patients').update({ status: 'archived' }).eq('id', id);
    if (error) throw error;
  };

  const addInvoice = async (inv) => {
    const { error } = await supabase.from('invoices').insert([{ ...inv, organization_id: activeOrgId, invoice_number: `INV-${Date.now().toString().slice(-6)}` }]).select();
    if (error) throw error;
  };

  const uploadMedia = async (file, patientId, type, notes) => {
    const fileName = `${patientId}/${Date.now()}_${file.name}`;
    const { data: storageData, error: storageErr } = await supabase.storage.from('patient-media').upload(fileName, file);
    if (storageErr) throw storageErr;

    const { data: publicUrlData } = supabase.storage.from('patient-media').getPublicUrl(fileName);
    
    const { data, error } = await supabase.from('patient_media').insert([{
      patient_id: patientId,
      organization_id: activeOrgId,
      storage_path: fileName,
      url: publicUrlData.publicUrl,
      type,
      notes
    }]).select();

    if (error) throw error;
    return data[0];
  };

  const deleteMedia = async (mediaId, storagePath) => {
    await supabase.storage.from('patient-media').remove([storagePath]);
    const { error } = await supabase.from('patient_media').delete().eq('id', mediaId);
    if (error) throw error;
  };

  const saveTreatmentPlan = async (planData, items) => {
    const { data: plan, error: planErr } = await supabase.from('treatment_plans').insert([{
      patient_id: planData.patient_id,
      organization_id: activeOrgId,
      name: planData.name,
      total_amount: planData.total,
      notes: planData.notes,
      status: planData.status || 'pending'
    }]).select();

    if (planErr) throw planErr;

    const planId = plan[0].id;
    const itemsToInsert = items.map(item => ({
      plan_id: planId,
      description: item.name,
      quantity: item.quantity,
      unit_price: item.price,
      is_completed: false
    }));

    const { error: itemsErr } = await supabase.from('treatment_plan_items').insert(itemsToInsert);
    if (itemsErr) throw itemsErr;
    
    // Refresh locally
    fetchAllData();
    return plan[0];
  };

  return (
    <DataContext.Provider value={{
      services, doctors, team,
      patients: patientsWithBalance.filter(p => p.status !== 'archived'),
      allPatients: patientsWithBalance,
      appointments: mappedAppointments,
      consultations, payments, invoices, expenses,
      media, treatmentPlans,
      stats, loading, error, refresh: fetchAllData,
      addPatient, updatePatient, deletePatient,
      addAppointment, updateAppointment,
      addPayment, addConsultation, addInvoice,
      uploadMedia, deleteMedia, saveTreatmentPlan
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
