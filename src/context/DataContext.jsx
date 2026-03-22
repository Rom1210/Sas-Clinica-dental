import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const { user, activeOrgId } = useAuth();
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
    } else {
      setLoading(false);
    }
  }, [user, activeOrgId]);

  const fetchAllData = async () => {
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
      const mappedPatients = (pats || []).map(p => ({
        ...p,
        name: p.full_name || (p.first_name + ' ' + (p.last_name || '')).trim() || p.email || 'Paciente'
      }));
      setPatients(mappedPatients); // all patients (including archived)
      setExpenses(exps || []);
      
      // Map appointments to the internal format expected by the UI
      setAppointments((apps || []).map(app => {
          const patientName = app.patient?.full_name || (app.patient?.first_name + ' ' + (app.patient?.last_name || '')).trim() || 'Desconocido';
          return {
            ...app,
            date: app.starts_at.split('T')[0],
            patientName,
            doctorName: app.doctor?.full_name || 'Desconocido',
          doctorId: app.doctor_id,
          patientId: app.patient_id,
          blocks: calculateBlocks(app.starts_at, app.ends_at)
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
        status: m.is_active ? 'active' : 'inactive'
      })));

    } catch (err) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // --- Services ---
  const addService = async (service) => {
    const { data, error } = await supabase
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
    const { data, error } = await supabase
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
    const { data, error } = await supabase
      .from('doctors')
      .insert([{ 
        full_name: doctor.name,
        calendar_color: doctor.color,
        is_specialist: doctor.isSpecialist,
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
    const { data, error } = await supabase
      .from('doctors')
      .update({
        full_name: doctor.name,
        calendar_color: doctor.color,
        is_specialist: doctor.isSpecialist,
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

  const addPayment = async (patientId, payment) => {
    const { data, error } = await supabase
      .from('payments')
      .insert([{ ...payment, patient_id: patientId, organization_id: activeOrgId }])
      .select();
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
    const { data, error } = await supabase
      .from('appointments')
      .insert([{ 
        ...appointmentData, 
        organization_id: activeOrgId
      }])
      .select();
    if (error) throw error;
    await fetchAllData();
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

  const calculateBlocks = (startsAt, endsAt) => {
    const start = new Date(startsAt);
    const end = new Date(endsAt);
    const blocks = [];
    let current = new Date(start);
    while (current < end) {
      const hours = String(current.getHours()).padStart(2, '0');
      const minutes = String(current.getMinutes()).padStart(2, '0');
      blocks.push(`${hours}:${minutes}`);
      current.setMinutes(current.getMinutes() + 15);
    }
    return blocks;
  };

  return (
    <DataContext.Provider value={{
      services, addService, removeService, updateService,
      doctors, addDoctor, removeDoctor, updateDoctor,
      patients, addPatient, deletePatient, 
      allPatients: patients, // includes archived — for finance/history views
      payments, addPayment,
      expenses, addExpense,
      appointments, addAppointment,
      consultations, addConsultation,
      invoices, addInvoice,
      team, removeTeamMember,
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
