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
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all initial data when user and organization are available
  useEffect(() => {
    if (user && activeOrgId) {
      fetchAllData();

      // Granular real-time subscriptions
      // Note: patient_media uses no filter to avoid WebSocket errors from unregistered columns
      const tablesWithFilter = ['patients', 'appointments', 'consultations', 'invoices', 'payments', 'services', 'doctors', 'expenses', 'treatment_plans', 'treatment_plan_items'];
      
      const channel = supabase.channel('db-changes');
      
      tablesWithFilter.forEach(table => {
        channel.on(
          'postgres_changes',
          { event: '*', schema: 'public', table, filter: `organization_id=eq.${activeOrgId}` },
          (payload) => {
            console.log(`Real-time change in ${table}:`, payload.eventType);
            handleGranularUpdate(table, payload);
          }
        );
      });

      // patient_media without filter to avoid WebSocket subscription errors
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'patient_media' },
        (payload) => {
          console.log('Real-time change in patient_media:', payload.eventType);
          handleGranularUpdate('patient_media', payload);
        }
      );

      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Realtime channel subscribed successfully');
        } else if (status === 'CHANNEL_ERROR') {
          console.warn('Realtime channel error - will rely on manual refresh');
        }
      });


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
      // Map base_price to price for services table dynamically
      let mappedNewRecord = newRecord;
      if (table === 'services' && mappedNewRecord) {
        mappedNewRecord = { ...mappedNewRecord, price: mappedNewRecord.base_price };
      }

      if (eventType === 'INSERT') {
        setter(prev => {
          // Prevent duplicates by ID, mapping safely and preserving locally enriched properties (like .items)
          if (prev.some(item => item.id === mappedNewRecord.id)) {
            return prev.map(item => item.id === mappedNewRecord.id ? { ...item, ...mappedNewRecord } : item);
          }

          // Filter out optimistic matches (legacy support)
          const filtered = prev.filter(item => {
            if (!item.isOptimistic) return true;
            if (table === 'appointments') {
               const match = item.doctor_id === mappedNewRecord.doctor_id && 
                             (item.starts_at === mappedNewRecord.starts_at || item.start_at === mappedNewRecord.start_at) && 
                             (item.patient_id === mappedNewRecord.patient_id || item.patientId === mappedNewRecord.patient_id);
               return !match;
            }
            if (table === 'doctors') {
               const match = item.full_name === mappedNewRecord.full_name && 
                             item.specialty === mappedNewRecord.specialty && 
                             item.calendar_color === mappedNewRecord.calendar_color;
               return !match;
            }
            return true;
          });
          return [mappedNewRecord, ...filtered];
        });
      } else if (eventType === 'UPDATE') {
        setter(prev => prev.map(item => item.id === mappedNewRecord.id ? { ...item, ...mappedNewRecord } : item));
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
      case 'treatment_plans': updateState(setTreatmentPlans); break;
      case 'treatment_plan_items': break; // Items managed optimistically via parent plan creation
      case 'payment_methods': updateState(setPaymentMethods); break;
      default: fetchAllData(); // Fallback if unknown table
    }
  };

  const seedPaymentMethods = async (orgId) => {
    const defaults = [
      { name: 'Efectivo', type: 'cash', is_active: true, organization_id: orgId },
      { name: 'Zelle', type: 'transfer', is_active: true, organization_id: orgId },
      { name: 'Transferencia', type: 'transfer', is_active: true, organization_id: orgId },
      { name: 'Pago Móvil', type: 'transfer', is_active: true, organization_id: orgId },
      { name: 'Cashea', type: 'bnpl', is_active: true, organization_id: orgId },
      { name: 'Krece', type: 'bnpl', is_active: true, organization_id: orgId },
      { name: 'Zinli', type: 'wallet', is_active: true, organization_id: orgId },
      { name: 'Wally', type: 'wallet', is_active: true, organization_id: orgId },
      { name: 'Airtm', type: 'wallet', is_active: true, organization_id: orgId },
      { name: 'PayPal', type: 'wallet', is_active: true, organization_id: orgId },
      { name: 'Binance (USDT)', type: 'crypto', is_active: true, organization_id: orgId },
      { name: 'USDT (Tether)', type: 'crypto', is_active: true, organization_id: orgId },
      { name: 'Visa/Mastercard (Intl)', type: 'card', is_active: true, organization_id: orgId },
      { name: 'Apple/Google Pay', type: 'contactless', is_active: true, organization_id: orgId }
    ];
    const { data, error } = await supabase.from('payment_methods').insert(defaults).select();
    if (!error && data) {
      setPaymentMethods(data);
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
        { data: plansData, error: plansErr },
        { data: methodsData, error: methodsErr }
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
        supabase.from('treatment_plans').select('*, items:treatment_plan_items(*, service:services(name))').eq('organization_id', activeOrgId),
        supabase.from('payment_methods').select('*').eq('organization_id', activeOrgId)
      ]);

      // We allow mediaErr and plansErr to fail gracefully if tables don't exist yet
      if (docsErr || servsErr || patsErr || expsErr || appsErr || consErr || paysErr || invsErr || teamErr || methodsErr) {
        console.error('Supabase Error:', { docsErr, servsErr, patsErr, expsErr, appsErr, consErr, paysErr, invsErr, teamErr, methodsErr });
        throw new Error('Error al cargar datos de Supabase');
      }

      if (mediaErr) console.warn('Note: patient_media table might not exist yet.');
      if (plansErr) console.warn('Note: treatment_plans table might not exist yet.');

      setDoctors((docs || []).map(d => ({ ...d, name: d.full_name, color: d.calendar_color, isSpecialist: d.is_specialist })));
      setServices((servs || []).map(s => ({ ...s, price: s.base_price })));
      setPatients(pats || []);
      setExpenses(exps || []);
      setAppointments(apps || []);
      setConsultations(cons || []);
      setInvoices(invs || []);
      setPayments(pays || []);
      setMedia(mediaData || []);
      setTreatmentPlans(plansData || []);
      setPaymentMethods(methodsData || []);
      if (!methodsData || methodsData.length === 0) {
        seedPaymentMethods(activeOrgId);
      }
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
        if (pay.exchange_rate && (pay.currency_code === 'VES' || pay.currency === 'VES')) {
          return sum + (parseFloat(pay.amount) / parseFloat(pay.exchange_rate));
        }
        const amt = parseFloat(pay.amount || 0);
        const curr = pay.currency_code || pay.currency || 'USD';
        return sum + (curr === 'USD' ? amt : amt / (exchangeRate || 45.50));
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

      const patientDisplayName = patient 
        ? (patient.full_name || (patient.first_name + ' ' + (patient.last_name || '')).trim() || patient.email)
        : (app.patientName || 'Paciente');

      return {
        ...app,
        date: getISOUTC(rawStartsAt),
        patientName: patientDisplayName,
        doctorName: doctor?.full_name || app.doctorName || 'Doctor',
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

    const currentIncome = payments.filter(p => isThisMonth(p.created_at || p.payment_date)).reduce((sum, p) => {
      const curr = p.currency_code || p.currency || 'USD';
      if (p.amount_usd) return sum + parseFloat(p.amount_usd);
      if (p.exchange_rate && curr === 'VES') return sum + (parseFloat(p.amount) / parseFloat(p.exchange_rate));
      return sum + (curr === 'USD' ? parseFloat(p.amount) : parseFloat(p.amount) / (exchangeRate || 45.50));
    }, 0);

    const lastMonthIncome = payments.filter(p => isLastMonth(p.created_at || p.payment_date)).reduce((sum, p) => {
      const curr = p.currency_code || p.currency || 'USD';
      if (p.amount_usd) return sum + parseFloat(p.amount_usd);
      if (p.exchange_rate && curr === 'VES') return sum + (parseFloat(p.amount) / parseFloat(p.exchange_rate));
      return sum + (curr === 'USD' ? parseFloat(p.amount) : parseFloat(p.amount) / (exchangeRate || 45.50));
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
      totalIncome: payments.reduce((sum, p) => sum + (p.amount_usd ? parseFloat(p.amount_usd) : ((p.currency_code || p.currency || 'USD') === 'USD' ? parseFloat(p.amount) : parseFloat(p.amount) / (exchangeRate || 45.50))), 0),
      totalCuentasPorCobrar: activeBalances.reduce((sum, p) => sum + p.debt, 0),
      totalEgresos: expenses.reduce((sum, e) => sum + (e.amount_usd ? parseFloat(e.amount_usd) : ((e.currency_code || e.currency || 'USD') === 'USD' ? parseFloat(e.amount) : parseFloat(e.amount) / (exchangeRate || 45.50))), 0),
    };
  }, [patients, payments, expenses, appointments, patientsWithBalance, exchangeRate]);

  // --- CRUD Operations ---
  
  const addPatient = async (patient) => {
    const { data, error } = await supabase.from('patients').insert([{ ...patient, organization_id: activeOrgId }]).select();
    if (error) throw error;
    const newPatient = data[0];
    setPatients(prev => [newPatient, ...prev]);
    return newPatient;
  };

  const updatePatient = async (id, data) => {
    const { error } = await supabase.from('patients').update(data).eq('id', id);
    if (error) throw error;
  };

  const addAppointment = async (appointment, optimisticMeta = null) => {
    const tempId = `opt-${Date.now()}`;
    const optimisticRecord = { 
      ...appointment, 
      id: tempId, 
      isOptimistic: true, 
      organization_id: activeOrgId,
      // Inject meta for immediate display before full mapping re-runs
      patientName: optimisticMeta?.patientName,
      doctorName: optimisticMeta?.doctorName
    };
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

  const addDoctor = async (doctor) => {
    const tempId = `opt-doc-${Date.now()}`;
    const payload = {
      full_name: doctor.name,
      calendar_color: doctor.color,
      specialty: doctor.specialty,
      is_specialist: doctor.isSpecialist,
      status: doctor.status,
      organization_id: activeOrgId
    };

    // Optimistic Update
    const optimisticRecord = { 
      ...payload, 
      id: tempId, 
      name: payload.full_name, 
      color: payload.calendar_color, 
      isSpecialist: payload.is_specialist,
      isOptimistic: true 
    };
    setDoctors(prev => [...prev, optimisticRecord]);

    try {
      const { data, error } = await supabase.from('doctors').insert([payload]).select();
      if (error) throw error;
      // Real-time will sync the final record
      return data[0];
    } catch (error) {
      setDoctors(prev => prev.filter(d => d.id !== tempId));
      throw error;
    }
  };

  const updateDoctor = async (doctor) => {
    const payload = {
      full_name: doctor.name,
      calendar_color: doctor.color,
      specialty: doctor.specialty,
      is_specialist: doctor.isSpecialist,
      status: doctor.status
    };

    // Optimistic update
    setDoctors(prev => prev.map(item => item.id === doctor.id ? { ...item, ...payload, name: payload.full_name, color: payload.calendar_color, isSpecialist: payload.is_specialist } : item));
    
    try {
      const { error } = await supabase.from('doctors').update(payload).eq('id', doctor.id);
      if (error) throw error;
    } catch (error) {
      fetchAllData(); // Revert on error
      throw error;
    }
  };

  const removeDoctor = async (id) => {
    // Optimistic removal
    setDoctors(prev => prev.filter(d => d.id !== id));
    
    try {
      const { error } = await supabase.from('doctors').delete().eq('id', id);
      if (error) throw error;
    } catch (error) {
      fetchAllData(); // Revert on error
      throw error;
    }
  };

  const addPayment = async (patientId, payment) => {
    // Financial Immutability: Store exchange rate and calc USD at the time of insertion
    const exchangeUsed = exchangeRate || 45.50;
    const curr = payment.currency_code || payment.currency || 'USD';
    const amountUsd = curr === 'USD' ? payment.amount : (payment.amount / exchangeUsed);
    
    // Adapt to new schema: currency_code and payment_method_id
    const payload = { 
      amount: payment.amount,
      patient_id: patientId, 
      exchange_rate: exchangeUsed,
      amount_usd: amountUsd,
      organization_id: activeOrgId,
      currency_code: curr,
      payment_method_id: payment.payment_method_id,
      payment_date: payment.payment_date || new Date().toISOString(),
      reference: payment.reference,
      notes: payment.notes
    };

    const { data, error } = await supabase.from('payments').insert([payload]).select();
    
    if (error) throw error;
    
    const newRecord = data[0];
    setPayments(prev => [newRecord, ...prev]);
    return newRecord;
  };

  // ── Odontogram persistence ────────────────────────────────────────────────
  const saveOdontogram = async (patientId, { toothData, rowStates, bridges, notes }) => {
    const { error } = await supabase
      .from('patient_odontograms')
      .upsert({
        patient_id: patientId,
        organization_id: activeOrgId,
        tooth_data: toothData,
        row_states: rowStates,
        bridges: bridges,
        notes: notes || '',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'patient_id,organization_id' });
    if (error) console.error('Error saving odontogram:', error);
  };

  const loadOdontogram = async (patientId) => {
    const { data, error } = await supabase
      .from('patient_odontograms')
      .select('*')
      .eq('patient_id', patientId)
      .eq('organization_id', activeOrgId)
      .maybeSingle();
    if (error) console.error('Error loading odontogram:', error);
    return data || null;
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
    console.log('--- STARTING UPLOAD ---', file.name, file.size);
    if (!activeOrgId) throw new Error('Sesión de organización no encontrada.');

    try {
      const fileExt = file.name.split('.').pop().toLowerCase();
      const fileName = `${patientId}/${Date.now()}.${fileExt}`;
      
      console.log('1. Uploading to storage...');
      const { data: storageData, error: storageErr } = await supabase.storage
        .from('patient-media')
        .upload(fileName, file, { upsert: false });

      if (storageErr) throw new Error(`Error de Storage: ${storageErr.message}`);
      console.log('1. Storage success');

      console.log('2. Generating URL...');
      const { data: publicUrlData } = supabase.storage.from('patient-media').getPublicUrl(fileName);
      const publicUrl = publicUrlData?.publicUrl;
      if (!publicUrl) throw new Error('Fallo al generar URL pública');

      console.log('3. Inserting into Database...');
      const { data, error: dbError } = await supabase.from('patient_media').insert([{
        patient_id: patientId,
        organization_id: activeOrgId,
        storage_path: fileName,
        url: publicUrl,
        type,
        notes: notes || ''
      }]).select();

      if (dbError) throw new Error(`Error de Base de Datos: ${dbError.message}`);
      console.log('3. Database success:', data[0]);

      // Immediately update local media state for instant UI feedback
      const newRecord = data[0];
      setMedia(prev => [newRecord, ...prev]);
      
      return newRecord;
    } catch (error) {
      console.error('CRITICAL UPLOAD ERROR:', error);
      throw error;
    }
  };

  const deleteMedia = async (mediaId, storagePath) => {
    // OPTIMISTIC: remove from UI immediately before waiting for API
    setMedia(prev => prev.filter(m => m.id !== mediaId));
    try {
      if (storagePath) {
        const { error: storageErr } = await supabase.storage.from('patient-media').remove([storagePath]);
        if (storageErr) console.warn('Storage delete warning:', storageErr.message);
      }
      const { error } = await supabase.from('patient_media').delete().eq('id', mediaId);
      if (error) throw error;
    } catch (err) {
      console.error('Delete error:', err);
      // Restore the record in state if deletion failed
      const { data: restored } = await supabase.from('patient_media').select('*').eq('id', mediaId).single();
      if (restored) setMedia(prev => [restored, ...prev]);
      throw err;
    }
  };

  const saveTreatmentPlan = async (planData, items) => {
    // 1. Prepare optimistic ID and data
    const optimisticId = crypto.randomUUID();
    const planName = planData.name || 'Plan de Tratamiento General';
    
    const itemsWithIds = items.map(item => {
      let finalServiceId = item.service_id;
      if (!finalServiceId) {
        const matched = services.find(s => s.name.toLowerCase() === item.name.toLowerCase());
        if (matched) finalServiceId = matched.id;
      }
      return {
        treatment_plan_id: optimisticId,
        service_id: finalServiceId,
        quantity: item.quantity,
        unit_price: item.price,
        service: { name: item.name }
      };
    });

    const optimisticPlan = {
      id: optimisticId,
      patient_id: planData.patient_id,
      organization_id: activeOrgId,
      name: planName,
      total_amount: planData.total,
      status: planData.status || 'pending',
      created_at: new Date().toISOString(),
      items: itemsWithIds,
      isOptimistic: true
    };

    // 2. UPDATE UI IMMEDIATELY
    setTreatmentPlans(prev => [optimisticPlan, ...prev]);

    // 3. PERSIST IN BACKGROUND
    const persist = async () => {
      try {
        const { data: plan, error: planErr } = await supabase.from('treatment_plans').insert([{
          id: optimisticId,
          patient_id: planData.patient_id,
          organization_id: activeOrgId,
          name: planName,
          total_amount: planData.total,
          status: planData.status || 'pending'
        }]).select();

        if (planErr) throw planErr;

        const itemsForDb = itemsWithIds.map(({ service, ...rest }) => rest);
        const { error: itemsErr } = await supabase.from('treatment_plan_items').insert(itemsForDb);
        if (itemsErr) throw itemsErr;
        
      } catch (err) {
        console.error("Critical Save Error:", err);
        // ROLLBACK
        setTreatmentPlans(prev => prev.filter(p => p.id !== optimisticId));
        alert("Error al guardar en el servidor. El plan se ha revertido.");
      }
    };

    persist(); 
    return optimisticPlan; 
  };

  const deleteTreatmentPlan = async (id) => {
    // Optimistic UI Removal
    setTreatmentPlans(prev => prev.filter(plan => plan.id !== id));
    
    try {
      const { error } = await supabase.from('treatment_plans').delete().eq('id', id);
      if (error) throw error;
    } catch (err) {
      // Revert if error
      fetchAllData();
      throw err;
    }
  };

  const updateTreatmentItemStatus = async (itemId, status) => {
    // Optimistic update in-memory
    setTreatmentPlans(prev => prev.map(plan => ({
      ...plan,
      items: plan.items?.map(item =>
        item.id === itemId ? { ...item, status } : item
      )
    })));
    const { error } = await supabase
      .from('treatment_plan_items')
      .update({ status })
      .eq('id', itemId);
    if (error) {
      console.warn('Error updating item status, reverting:', error);
      fetchAllData();
      throw error;
    }
  };

  const addService = async (service) => {
    // 1. Give it a temp ID for optimistic UI
    const tempId = `opt-${Date.now()}`;
    const mappedService = { ...service, id: tempId, isOptimistic: true };
    setServices(prev => [...prev, mappedService]);

    const payload = { ...service, base_price: service.price, organization_id: activeOrgId };
    delete payload.price; // Prevent sending non-existent column

    try {
      const { data, error } = await supabase.from('services').insert([payload]).select();
      if (error) throw error;
      
      const newService = { ...data[0], price: data[0].base_price };
      // Override the fake optimistic entry with the real DB entry immediately
      setServices(prev => prev.map(item => item.id === tempId ? newService : item));
      return newService;
    } catch (err) {
      // Revert the optimistic update on error
      setServices(prev => prev.filter(item => item.id !== tempId));
      throw err;
    }
  };

  const updateService = async (service) => {
    // Optimistic UI Update for editing
    setServices(prev => prev.map(item => item.id === service.id ? { ...item, ...service } : item));

    const { id, price, ...data } = service;
    if (price !== undefined) data.base_price = price;
    
    try {
       const { error } = await supabase.from('services').update(data).eq('id', id);
       if (error) throw error;
    } catch (err) {
       // Ideally we'd rollback here, but for now we fetchAllData
       fetchAllData();
       throw err;
    }
  };

  const removeService = async (id) => {
    // Optimistic UI Update for removal
    setServices(prev => prev.filter(item => item.id !== id));
    
    try {
       const { error } = await supabase.from('services').delete().eq('id', id);
       if (error) throw error;
    } catch (err) {
       fetchAllData();
       throw err;
    }
  };

  const addPaymentMethod = async (method) => {
    const { data, error } = await supabase.from('payment_methods').insert([{ ...method, organization_id: activeOrgId }]).select();
    if (error) throw error;
    setPaymentMethods(prev => [...prev, data[0]]);
    return data[0];
  };

  const updatePaymentMethod = async (id, data) => {
    const { error } = await supabase.from('payment_methods').update(data).eq('id', id);
    if (error) throw error;
    setPaymentMethods(prev => prev.map(m => m.id === id ? { ...m, ...data } : m));
  };

  const removePaymentMethod = async (id) => {
    const { error } = await supabase.from('payment_methods').delete().eq('id', id);
    if (error) throw error;
    setPaymentMethods(prev => prev.filter(m => m.id !== id));
  };

  return (
    <DataContext.Provider value={{
      services, doctors, team,
      patients: patientsWithBalance.filter(p => p.status !== 'archived'),
      allPatients: patientsWithBalance,
      appointments: mappedAppointments,
      consultations, payments, invoices, expenses,
      paymentMethods,
      media, treatmentPlans,
      stats, loading, error, refresh: fetchAllData,
      addPatient, updatePatient, deletePatient,
      addAppointment, updateAppointment,
      addDoctor, updateDoctor, removeDoctor,
      addPayment, addConsultation, saveOdontogram, loadOdontogram, addInvoice,
      uploadMedia, deleteMedia,
      saveTreatmentPlan, deleteTreatmentPlan, updateTreatmentItemStatus,
      addService, updateService, removeService,
      addPaymentMethod, updatePaymentMethod, removePaymentMethod
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
