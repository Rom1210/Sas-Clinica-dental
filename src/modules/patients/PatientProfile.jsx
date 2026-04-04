import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { useSettings } from '../../context/SettingsContext';

// Sub-components
import PatientHeader from './components/PatientProfile/PatientHeader';
import GeneralTab from './components/PatientProfile/tabs/GeneralTab';
import ProfileTab from './components/PatientProfile/tabs/ProfileTab';
import ClinicalHistoryTab from './components/PatientProfile/tabs/ClinicalHistoryTab';
import FinanceTab from './components/PatientProfile/tabs/FinanceTab';
import RegisterPaymentModal from '../../components/finance/RegisterPaymentModal';

const PatientProfile = ({ patient: propPatient, onBack: propOnBack }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const { 
    patients, 
    consultations: allConsultations, 
    payments: allPayments, 
    appointments: allAppointments, 
    doctors,
    refresh
  } = useData();
  const { exchangeRate } = useSettings();
  
  const [patient, setPatient] = useState(propPatient);
  const [activeTab, setActiveTab] = useState('General');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  
  const [personalInfo, setPersonalInfo] = useState({
    nombres: '', apellidos: '', fechaNacimiento: '', genero: 'Otro',
    lugarNacimiento: '', cedula: '', email: '', telefono: '',
    telefonoEmergencia: '', alergias: 'Ninguna', ocupacion: '', direccion: ''
  });

  // 1. Data Initialization
  useEffect(() => {
    if (propPatient) {
      setPatient(propPatient);
    } else if (id && patients.length > 0) {
      const found = patients.find(p => p.id === id || p.id === parseInt(id));
      if (found) setPatient(found);
    }
  }, [propPatient, id, patients]);

  useEffect(() => {
    if (patient) {
      setPersonalInfo({
        nombres: patient.first_name || patient.name?.split(' ')[0] || '',
        apellidos: patient.last_name || patient.name?.split(' ').slice(1).join(' ') || '',
        fechaNacimiento: patient.birth_date ? new Date(patient.birth_date).toLocaleDateString('es-ES') : '',
        genero: patient.gender || 'Otro',
        lugarNacimiento: '',
        cedula: patient.dni || '',
        email: patient.email || '',
        telefono: patient.phone || '',
        telefonoEmergencia: patient.phone || '',
        alergias: patient.medical_flags?.join(', ') || 'Ninguna',
        ocupacion: '',
        direccion: ''
      });
    }
  }, [patient]);

  // 2. Financial History Calculation (Unified)
  const getAppointmentCost = (notes) => {
    if (!notes || !notes.includes('Total: $')) return 0;
    try {
      const parts = notes.split('Total: $');
      if (parts.length > 1) {
        return parseFloat(parts[1].trim().split(' ')[0].replace(',', '')) || 0;
      }
    } catch (e) {}
    return 0;
  };

  const { financialHistory, debtSummary } = useMemo(() => {
    if (!patient) return { financialHistory: [], debtSummary: { totalDue: 0, totalPaid: 0, balance: 0 } };

    const pCons = allConsultations.filter(c => c.patient_id === patient.id);
    const pPays = allPayments.filter(p => p.patient_id === patient.id);
    const pApps = allAppointments.filter(a => a.patient_id === patient.id);

    // Timeline Items
    const consMovements = pCons.map(c => ({
      id: `cons-${c.id}`,
      date: c.created_at,
      label: c.treatment_summary || 'Consulta Clínica',
      description: c.doctor?.full_name || 'Especialista',
      amount: c.amount || 0,
      type: 'charge',
      status: 'Completada'
    }));

    const payMovements = pPays.map(p => {
      // Logic for Identifying identifies identifies identifiers for 88+ errors.
      const amountUsd = p.amount_usd ? parseFloat(p.amount_usd) : 
                        (p.exchange_rate && p.currency === 'VES') ? (parseFloat(p.amount) / parseFloat(p.exchange_rate)) :
                        (p.currency === 'USD' || !p.currency) ? (parseFloat(p.amount) || 0) : (parseFloat(p.amount) || 0) / (exchangeRate || 45.50);

      return {
        id: `pay-${p.id}`,
        date: p.created_at,
        label: `Pago (${p.payment_method || 'Efectivo'})`,
        description: p.notes || (p.currency === 'USD' ? 'Abono en Dólares' : `Abono en Bolívares (${p.amount} BS)`),
        amount: amountUsd,
        type: 'credit',
        status: 'Pagado'
      };
    });

    const now = new Date();
    const appMovements = pApps.map(a => ({
      id: `app-${a.id}`,
      date: a.starts_at || a.start_at,
      label: a.notes?.replace('Servicios: ', '') || 'Cita Programada',
      description: a.doctorName || 'Doctor',
      amount: getAppointmentCost(a.notes),
      type: 'appointment',
      status: new Date(a.starts_at || a.start_at) < now ? 'Realizada' : 'Activa'
    }));

    const financialHistory = [...consMovements, ...payMovements, ...appMovements].sort((a, b) => new Date(b.date) - new Date(a.date));

    // Summary
    const totalDue = pCons.reduce((sum, c) => sum + (c.amount || 0), 0) + 
                    pApps.filter(a => new Date(a.starts_at || a.start_at) <= now).reduce((sum, a) => sum + getAppointmentCost(a.notes), 0);
    
    const totalPaid = pPays.reduce((sum, p) => {
      if (p.amount_usd) return sum + parseFloat(p.amount_usd);
      const isUsd = p.currency === 'USD' || !p.currency;
      return sum + (isUsd ? (parseFloat(p.amount) || 0) : (parseFloat(p.amount) || 0) / (exchangeRate || 45.50));
    }, 0);

    return {
      financialHistory,
      debtSummary: { totalDue, totalPaid, balance: totalDue - totalPaid }
    };
  }, [patient, allConsultations, allPayments, allAppointments, exchangeRate]);

  // 3. Clinical History Logic (Timeline)
  const { historicalItems, insightsData } = useMemo(() => {
    if (!patient) return { historicalItems: [], insightsData: { total: 0, specialists: 0, nextApp: null } };

    const cons = allConsultations
      .filter(c => c.patient_id === patient.id)
      .map(c => {
        const docObj = doctors.find(d => d.id === c.doctor_id);
        return {
          id: `c-${c.id}`, date: c.created_at, type: 'Consulta',
          title: c.treatment_summary || 'Consulta General',
          doctor: c.doctor?.full_name || 'Especialista',
          doctorColor: docObj?.color || '#94a3b8',
          notes: c.reason || '', amount: c.amount, icon: null // Handled in component
        };
      });

    const apps = allAppointments
      .filter(a => a.patient_id === patient.id && new Date(a.starts_at || a.start_at) < new Date())
      .map(a => {
        const docObj = doctors.find(d => d.id === a.doctor_id);
        return {
          id: `a-${a.id}`, date: a.starts_at || a.start_at, type: 'Cita Pasada',
          title: a.notes?.split('|')[0].replace('Servicios:', '').trim() || 'Cita Programada',
          doctor: a.doctorName || 'Profesional',
          doctorColor: docObj?.color || '#94a3b8',
          notes: '', amount: 0, icon: null, originalId: a.id
        };
      });

    const items = [...cons, ...apps].sort((a, b) => new Date(b.date) - new Date(a.date));
    const nextApp = allAppointments
      .filter(a => a.patient_id === patient.id && new Date(a.starts_at || a.start_at) >= new Date())
      .sort((a, b) => new Date(a.starts_at || a.start_at) - new Date(b.starts_at || b.start_at))[0];

    return {
      historicalItems: items,
      insightsData: { 
        total: items.length, 
        specialists: [...new Set(items.map(h => h.doctor))].length,
        nextApp 
      }
    };
  }, [patient, allConsultations, allAppointments, doctors]);

  const onBack = propOnBack || (() => navigate('/patients'));
  const handleScheduleAppointment = () => navigate(`/pacientes/${patient.id}/nueva-cita`);

  if (!patient) return <div className="p-10 text-center font-bold text-slate-500 uppercase tracking-widest">Cargando paciente...</div>;

  const tabs = ['General', 'Perfil', 'Historia médica', 'Historia de pago'];

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300 pb-10">
      
      <PatientHeader 
        patient={patient} 
        onBack={onBack} 
        onSchedule={handleScheduleAppointment} 
      />

      {/* Tabs Navigation */}
      <div className="flex justify-center border-b border-slate-200 mt-2">
        <div className="flex gap-8">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 px-2 text-sm font-bold transition-all cursor-pointer bg-transparent border-none outline-none ${
                activeTab === tab ? 'text-[#0070AC] border-b-2 border-solid border-[#0070AC]' : 'text-slate-500 hover:text-slate-800 border-b-2 border-solid border-transparent'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-4">
        {activeTab === 'General' && (
          <GeneralTab 
            patient={patient} 
            consultations={allConsultations.filter(c => c.patient_id === patient.id).map(c => ({
              ...c,
              date: new Date(c.created_at).toLocaleDateString('es-ES'),
              treatment: c.treatment_summary,
              cost: c.amount,
              paymentStatus: c.payment_status === 'paid' ? 'Pagado' : (c.payment_status === 'partial' ? 'Abono' : 'Pendiente'),
              doctorName: c.doctor?.full_name || 'Especialista'
            }))}
            onSchedule={handleScheduleAppointment} 
          />
        )}

        {activeTab === 'Perfil' && (
          <ProfileTab 
            personalInfo={personalInfo} 
            setPersonalInfo={setPersonalInfo}
            isEditingPersonal={isEditingPersonal}
            setIsEditingPersonal={setIsEditingPersonal}
          />
        )}

        {activeTab === 'Historia médica' && (
          <ClinicalHistoryTab 
            patient={patient}
            historicalItems={historicalItems}
            insightsData={insightsData}
          />
        )}

        {activeTab === 'Historia de pago' && (
          <FinanceTab 
            debtSummary={debtSummary}
            financialHistory={financialHistory}
            onRegisterPayment={() => setShowPaymentModal(true)}
          />
        )}
      </div>

      {/* Payment Modal (Portal) */}
      {showPaymentModal && (
        <RegisterPaymentModal 
          onClose={() => setShowPaymentModal(false)}
          patientId={patient.id}
          onSuccess={() => refresh()}
        />
      )}
    </div>
  );
};

export default PatientProfile;
