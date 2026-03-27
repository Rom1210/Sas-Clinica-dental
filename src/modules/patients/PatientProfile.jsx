import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { ArrowLeft, Search, Plus, Filter, Info, ChevronLeft, ChevronRight, CheckCircle2, FileText, User, AlertCircle, Activity, ClipboardList, Clock, Pencil, Download, ChevronDown, Calendar } from 'lucide-react';
import Odontogram from './Odontogram';


const PatientProfile = ({ patient: propPatient, onBack: propOnBack }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const { patients, consultations: allConsultations, payments: allPayments, appointments: allAppointments, doctors } = useData();
  
  // Support both prop-based and route-based patient loading
  const [patient, setPatient] = useState(propPatient);
  const [patientConsultations, setPatientConsultations] = useState([]);
  
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
      const filtered = allConsultations
        .filter(c => c.patient_id === patient.id)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .map(c => ({
          ...c,
          date: new Date(c.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }),
          treatment: c.treatment_summary,
          cost: c.amount,
          paymentStatus: c.payment_status === 'paid' ? 'Pagado' : (c.payment_status === 'partial' ? 'Abono' : 'Pendiente'),
          doctorName: c.doctor?.full_name || 'Especialista'
        }));
      setPatientConsultations(filtered);
    }
  }, [patient, allConsultations]);
  // Helper to parse 'Total: $XX' from appointment notes
  const getAppointmentCost = (notes) => {
    if (!notes || !notes.includes('Total: $')) return 0;
    try {
      const parts = notes.split('Total: $');
      if (parts.length > 1) {
        const amountStr = parts[1].trim().split(' ')[0].replace(',', '');
        return parseFloat(amountStr) || 0;
      }
    } catch (e) {}
    return 0;
  };

  // Unified financial history logic
  const financialHistory = React.useMemo(() => {
    if (!patient) return [];
    
    // 1. Get Consultations as "Cargos"
    const cons = allConsultations
      .filter(c => c.patient_id === patient.id)
      .map(c => ({
        id: `cons-${c.id}`,
        date: c.created_at,
        label: c.treatment_summary || 'Consulta Clínica',
        description: c.doctor?.full_name || 'Especialista',
        amount: c.amount || 0,
        type: 'charge',
        status: 'Completada'
      }));

    // 2. Get Payments as "Abonos"
    const pays = allPayments
      .filter(p => p.patient_id === patient.id)
      .map(p => ({
        id: `pay-${p.id}`,
        date: p.created_at,
        label: `Pago (${p.payment_method})`,
        description: p.notes || 'Abono a cuenta',
        amount: p.amount || 0,
        type: 'credit',
        status: 'Pagado'
      }));

    // 3. Get Appointments as "Próximas/Activas"
    const now = new Date();
    const apps = allAppointments
      .filter(a => a.patient_id === patient.id)
      .map(a => ({
        id: `app-${a.id}`,
        date: a.starts_at || a.start_at,
        label: a.notes?.replace('Servicios: ', '') || 'Cita Programada',
        description: a.doctorName || 'Doctor',
        amount: getAppointmentCost(a.notes),
        type: 'appointment',
        status: new Date(a.starts_at || a.start_at) < now ? 'Realizada' : 'Activa'
      }));

    return [...cons, ...pays, ...apps].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [patient, allConsultations, allPayments, allAppointments]);

  const debtSummary = React.useMemo(() => {
    if (!patient) return { totalDue: 0, totalPaid: 0, balance: 0 };
    
    const totalDueCons = allConsultations
      .filter(c => c.patient_id === patient.id)
      .reduce((sum, c) => sum + (c.amount || 0), 0);
      
    const now = new Date();
    const totalDueApps = allAppointments
      .filter(a => a.patient_id === patient.id && new Date(a.starts_at || a.start_at) <= now)
      .reduce((sum, a) => sum + getAppointmentCost(a.notes), 0);
      
    const totalPaid = allPayments
      .filter(p => p.patient_id === patient.id)
      .reduce((sum, p) => sum + (p.amount || 0), 0);
      
    const totalDue = totalDueCons + totalDueApps;
    
    return {
      totalDue,
      totalPaid,
      balance: totalDue - totalPaid
    };
  }, [patient, allConsultations, allPayments, allAppointments]);

  const onBack = propOnBack || (() => navigate('/patients'));
  const [activeTab, setActiveTab] = useState('General');
  const [showNewConsultModal, setShowNewConsultModal] = useState(false);

  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state]);

  const [toastMessage, setToastMessage] = useState(null);
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [personalInfo, setPersonalInfo] = useState({
    nombres: '',
    apellidos: '',
    fechaNacimiento: '',
    genero: 'Otro',
    lugarNacimiento: '',
    cedula: '',
    email: '',
    telefono: '',
    telefonoEmergencia: '',
    alergias: 'Ninguna',
    ocupacion: '',
    direccion: ''
  });

  const handleScheduleAppointment = () => {
    navigate(`/pacientes/${patient.id}/nueva-cita`);
  };

  React.useEffect(() => {
    if (patient) {
      setPersonalInfo({
        nombres: patient.first_name || patient.name?.split(' ')[0] || '',
        apellidos: patient.last_name || patient.name?.split(' ').slice(1).join(' ') || '',
        fechaNacimiento: patient.birth_date ? new Date(patient.birth_date).toLocaleDateString('es-ES') : '',
        genero: patient.gender || 'Otro',
        lugarNacimiento: '', // Not in schema currently, keeping as placeholder or adding to JSON
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

  const tabs = ['General', 'Perfil', 'Historia médica', 'Historia de pago'];


  const PatientHistoryView = () => {
    const historicalItems = React.useMemo(() => {
      const cons = allConsultations
        .filter(c => c.patient_id === patient.id)
        .map(c => {
          const docObj = doctors.find(d => d.id === c.doctor_id);
          const docColor = docObj?.color || '#94a3b8';

          return {
            id: `c-${c.id}`,
            date: c.created_at,
            type: 'Consulta',
            title: c.treatment_summary || 'Consulta General',
            doctor: c.doctor?.full_name || 'Especialista',
            doctorColor: docColor,
            notes: c.reason || '',
            amount: c.amount,
            icon: <FileText size={18} />
          };
        });

      const apps = allAppointments
        .filter(a => a.patient_id === patient.id && new Date(a.starts_at || a.start_at) < new Date())
        .map(a => {
          const notes = a.notes || '';
          let title = 'Cita Programada';
          if (notes.startsWith('Servicios:')) {
            title = notes.split('|')[0].replace('Servicios:', '').trim();
          }
          const docObj = doctors.find(d => d.id === a.doctor_id);
          const docColor = docObj?.color || '#94a3b8';

          return {
            id: `a-${a.id}`,
            date: a.starts_at || a.start_at,
            type: 'Cita Pasada',
            title: title,
            doctor: a.doctorName || 'Profesional',
            doctorColor: docColor,
            notes: '',
            amount: 0,
            icon: <Calendar size={18} />,
            originalId: a.id
          };
        });

      return [...cons, ...apps].sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [patient, allConsultations, allAppointments]);

    const insightsData = React.useMemo(() => {
      const total = historicalItems.length;
      const last = historicalItems[0];
      const specialists = [...new Set(historicalItems.map(h => h.doctor))].length;
      
      const nextApp = allAppointments
        .filter(a => a.patient_id === patient.id && new Date(a.starts_at || a.start_at) >= new Date())
        .sort((a, b) => new Date(a.starts_at || a.start_at) - new Date(b.starts_at || b.start_at))[0];
        
      return { total, last, specialists, nextApp };
    }, [historicalItems, allAppointments, patient]);

    return (
      <div className="flex flex-col gap-10 animate-in fade-in duration-500 max-w-5xl mx-auto py-4">
        {/* Unified Clinical Header - Premium Glassmode (Light Glassmorphism) */}
        <div className="relative overflow-hidden bg-white/60 backdrop-blur-3xl rounded-[2.5rem] p-10 shadow-[0_25px_80px_rgba(0,0,0,0.06),0_0_1px_rgba(0,0,0,0.1)] flex flex-col md:flex-row items-center justify-between gap-10 border border-white/50">
           {/* Decorative elements - softer for light mode */}
           <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full -mr-32 -mt-32 blur-[120px] opacity-40"></div>
           <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full -ml-20 -mb-20 blur-[100px] opacity-30"></div>

           <div className="flex items-center gap-10 relative z-10 w-full md:w-auto">
              <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center text-primary shadow-[0_15px_35px_rgba(37,99,235,0.12)] border border-white/80 scale-110">
                 <Activity size={44} strokeWidth={2.5} />
              </div>
              <div className="flex flex-col gap-3">
                 <div className="flex items-center gap-4">
                    <h3 className="text-[11px] font-black text-primary uppercase tracking-[0.25em] drop-shadow-sm">Estado Clínico Integral</h3>
                    <div className="h-px w-10 bg-primary/10"></div>
                    <div className="flex items-center gap-2 py-1.5 px-4 bg-emerald-500/10 rounded-full border border-emerald-500/15 shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]"></span>
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none">Activo</span>
                    </div>
                 </div>
                 
                 {historicalItems.length > 0 ? (
                    <div className="flex flex-col gap-1.5">
                        <p className="text-3xl font-black text-slate-900 leading-none tracking-tight">
                           {historicalItems[0].title.split(',')[0]}
                        </p>
                        <p className="text-slate-500 text-sm font-bold flex items-center gap-2">
                           Último trámite: <span className="text-slate-900">{new Date(historicalItems[0].date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span> con <span className="text-primary font-black uppercase text-[10px] tracking-wider">Dr. {historicalItems[0].doctor.replace('Dr. ', '').split(' ')[0]}</span>
                        </p>
                    </div>
                 ) : (
                    <p className="text-2xl font-black text-slate-400 italic">Sin registros registrados</p>
                 )}

                 {insightsData.nextApp && (
                    <div className="flex items-center gap-3 text-[11px] font-black text-slate-700 uppercase tracking-wider bg-white/80 px-4 py-2.5 rounded-2xl border border-slate-100 shadow-sm w-fit transition-all hover:shadow-md">
                       <div className="w-2 h-2 rounded-full bg-amber-500 animate-bounce"></div>
                       PRÓXIMA CITA: <span className="text-slate-900">{new Date(insightsData.nextApp.starts_at || insightsData.nextApp.start_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
                    </div>
                 )}
              </div>
           </div>

           <div className="flex items-center gap-14 relative z-10 pr-6 w-full md:w-auto justify-around md:justify-end">
              <div className="flex flex-col items-center group transition-transform hover:scale-110">
                 <span className="text-4xl font-black text-slate-900 leading-none">{insightsData.total}</span>
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">Visitas</span>
              </div>
              <div className="w-px h-12 bg-slate-100 hidden md:block"></div>
              <div className="flex flex-col items-center group transition-transform hover:scale-110">
                 <span className="text-4xl font-black text-slate-900 leading-none">{insightsData.specialists}</span>
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">Drs.</span>
              </div>
           </div>
        </div>

        {/* Premium Timeline */}
        <div className="flex flex-col gap-6 relative px-4 md:px-8">
          <div className="absolute left-[31px] md:left-[47px] top-0 bottom-0 w-1 bg-slate-100 rounded-full"></div>
          
          <h2 className="text-2xl font-black text-slate-800 ml-12 md:ml-16 mb-2">Cronología del Paciente</h2>

          {historicalItems.length === 0 ? (
            <div className="p-20 text-center bg-white rounded-3xl border border-slate-100 border-dashed text-slate-400 font-bold text-lg">
              No hay historial clínico disponible.
            </div>
          ) : (
            historicalItems.map((item, idx) => (
              <div key={item.id} className="relative flex items-start gap-6 md:gap-10 group animate-in slide-in-from-left-4 duration-300 transition-all" style={{ animationDelay: `${idx * 50}ms` }}>
                
                {/* Date Side Indicator */}
                <div className="flex flex-col items-center gap-2 z-10">
                   <div className="flex flex-col items-center justify-center w-16 h-16 bg-white border-4 border-white shadow-md rounded-2xl group-hover:shadow-lg transition-all">
                      <span className="text-[10px] font-black text-slate-400 uppercase leading-none">{new Date(item.date).toLocaleDateString('es-ES', { month: 'short' })}</span>
                      <span className="text-xl font-black text-slate-800 leading-none mt-0.5">{new Date(item.date).getDate()}</span>
                   </div>
                   <div className={`w-3 h-3 rounded-full border-2 border-white shadow-sm ring-4 ring-slate-50 ${item.type === 'Consulta' ? 'bg-teal-400' : 'bg-blue-400'}`}></div>
                </div>

                {/* Content Card */}
                <div 
                   className="flex-1 bg-white p-6 rounded-3xl shadow-sm border border-slate-100 group-hover:shadow-xl group-hover:shadow-primary/5 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden"
                   style={{ 
                      borderLeft: `4px solid ${item.doctorColor || '#cbd5e1'}`, 
                      background: `linear-gradient(to right, ${item.doctorColor || '#cbd5e1'}05, white)` 
                   }}
                >
                   {/* Background Decor */}
                   <div 
                      className="absolute top-0 right-0 w-24 h-24 opacity-5 group-hover:opacity-10 transition-opacity" 
                      style={{ 
                        background: `radial-gradient(circle at top right, ${item.doctorColor}, transparent)`,
                        borderRadius: '0 0 0 100%'
                      }}
                   ></div>
                   
                   <div className="flex gap-5 items-center">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${item.type === 'Consulta' ? 'bg-teal-50 text-teal-600' : 'bg-blue-50 text-blue-600'}`}>
                         {item.icon}
                      </div>
                      <div className="flex flex-col gap-1">
                         <div className="flex items-center gap-2">
                           <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${item.type === 'Consulta' ? 'bg-teal-50 text-teal-600' : 'bg-blue-50 text-blue-600'}`}>
                              {item.type}
                           </span>
                           <span className="text-[9px] font-black text-slate-300 uppercase">{new Date(item.date).getFullYear()}</span>
                         </div>
                         <h4 className="text-base font-bold text-slate-800 group-hover:text-primary transition-colors underline decoration-slate-100 decoration-2 underline-offset-4">{item.title}</h4>
                         <div className="flex items-center gap-2 mt-1">
                            <div className="w-5 h-5 rounded-full flex items-center justify-center text-white overflow-hidden border border-white shadow-sm" style={{ background: item.doctorColor || '#cbd5e1' }}>
                               <User size={12} />
                            </div>
                            <span className="text-[11px] font-bold" style={{ color: item.doctorColor || '#64748b' }}>{item.doctor}</span>
                            <div className="w-1 h-1 rounded-full bg-slate-300 mx-1"></div>
                            <span className="text-[10px] text-slate-400 font-black uppercase">{new Date(item.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                         </div>
                      </div>
                   </div>

                   <div className="flex flex-col items-end gap-2 w-full md:w-auto">
                      {item.amount > 0 ? (
                        <span className="text-xl font-black text-slate-800 tracking-tighter">${item.amount.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
                      ) : (
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded-md">Procedimiento incluido</span>
                      )}
                      
                      <div className="flex items-center gap-2">
                        {item.originalId && (
                           <button 
                             onClick={() => navigate('/scheduler', { state: { highlightId: item.originalId } })}
                             className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl text-[9px] font-black transition-all border-none cursor-pointer"
                           >
                              VER EN AGENDA <Calendar size={10} />
                           </button>
                        )}
                        <button 
                          onClick={() => navigate(`/scheduler/appointment/${item.originalId || item.id.replace('a-', '').replace('c-', '')}`, { state: { fromHistory: true } })}
                          className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 text-white hover:bg-black rounded-xl text-[9px] font-black transition-all border-none cursor-pointer"
                        >
                          VER DETALLES <ChevronRight size={10} />
                        </button>
                      </div>
                   </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  if (!patient) return <div className="p-10 text-center font-bold text-slate-500 uppercase tracking-widest">Cargando paciente...</div>;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300 pb-10">
      
      {/* Back Button & Actions */}
      <div className="flex justify-between items-center">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-primary transition-all font-black text-[10px] uppercase tracking-[0.15em] cursor-pointer border border-slate-100 bg-white px-4 py-2.5 rounded-xl shadow-sm hover:shadow-md active:scale-95 group"
        >
          <ArrowLeft size={14} strokeWidth={3} className="group-hover:-translate-x-1 transition-transform" /> Volver a pacientes
        </button>
      </div>

      {/* Top Patient Info Card - Hidden in Medical/Ficha tabs to match clean layout */}
      {activeTab !== 'Historia médica' && activeTab !== 'Ficha médica' && activeTab !== 'Perfil' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col gap-6 border border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">Paciente</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-y-6 gap-x-12">
            <div className="flex flex-col gap-1">
              <span className="text-sm text-slate-500">Nombre</span>
              <span className="text-base font-bold text-slate-800">{patient?.name?.split(' ')[0] || 'Fabian'}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm text-slate-500">Apellido</span>
              <span className="text-base font-bold text-slate-800">{patient?.name?.split(' ').slice(1).join(' ') || 'Romero'}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm text-slate-500">Email</span>
              <span className="text-base font-bold text-slate-800">{patient?.email || 'fabanplay@gmail.com'}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm text-slate-500">Número de teléfono</span>
              <span className="text-base font-bold text-slate-800">04244570903</span>
            </div>
          </div>

          <div className="flex flex-col gap-1 mt-2">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative flex items-center justify-center w-5 h-5 border-2 border-slate-300 rounded overflow-hidden group-hover:border-[#0070AC] transition-colors">
                <input type="checkbox" className="absolute w-full h-full opacity-0 cursor-pointer" />
              </div>
              <span className="text-sm text-slate-700 font-medium select-none text-slate-800">Activar recordatorios</span>
            </label>
            <span className="text-[11px] text-slate-500 ml-8">A este paciente se le enviará un recordatorio un día antes de cada una de sus consultas.</span>
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex justify-center border-b border-slate-200 mt-2">
        <div className="flex gap-8">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 px-2 text-sm font-bold transition-all cursor-pointer ${
                activeTab === tab 
                  ? 'text-[#0070AC]' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              style={{
                border: 'none',
                borderBottom: activeTab === tab ? '2px solid #0070AC' : '2px solid transparent',
                background: 'transparent',
                outline: 'none'
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex flex-col gap-8 mt-4">
        {activeTab === 'General' && (
          <div className="flex flex-col gap-8">
            
            {/* Consultas Section */}
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800">Consultas</h2>
                <button 
                  onClick={handleScheduleAppointment}
                  className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white hover:opacity-90 rounded-xl transition-all text-sm font-bold border-none cursor-pointer shadow-sm"
                >
                  <Calendar size={16} /> Agendar Cita
                </button>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center w-64 bg-slate-50 border border-slate-100 rounded-xl px-4 py-1.5 focus-within:bg-white focus-within:border-primary/30 focus-within:ring-4 focus-within:ring-primary/5 transition-all shadow-sm">
                    <input 
                      type="text" 
                      placeholder="Buscar consulta..." 
                      className="flex-1 bg-transparent border-none outline-none text-[13px] font-medium text-slate-600 placeholder:text-slate-400"
                    />
                    <Search size={15} className="text-slate-400 transition-colors group-focus-within:text-primary ml-2" />
                  </div>
                </div>

                {/* Card-Based Consultations List with Internal Scroll */}
                <div className="p-4 bg-slate-50/30 overflow-y-auto flex flex-col gap-3" style={{ maxHeight: '400px' }}>
                  {patientConsultations.length === 0 ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-2 bg-white rounded-xl border border-slate-100 border-dashed">
                      <h3 className="text-base font-bold text-slate-800">0 resultados.</h3>
                      <p className="text-sm text-slate-500">No hay registros creados hasta ahora.</p>
                      <button 
                        onClick={handleScheduleAppointment}
                        className="mt-4 px-6 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors cursor-pointer text-sm border-none shadow-none"
                      >
                        Agendar primera cita
                      </button>
                    </div>
                  ) : (
                    patientConsultations.map((c) => (
                      <div key={c.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow cursor-pointer flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                        <div className="flex gap-4 items-start md:items-center w-full md:w-auto">
                          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                             <FileText size={20} />
                          </div>
                          <div className="flex flex-col gap-1">
                             <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{c.date}</span>
                             <span className="text-sm font-bold text-slate-800">{c.treatment}</span>
                             <span className="text-sm text-slate-500 line-clamp-1">{c.reason || 'Sin motivo adicional'}</span>
                             {c.doctorName && <span className="text-xs font-medium text-slate-500 mt-1 flex items-center gap-1">Doctor: {c.doctorName}</span>}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between w-full md:w-auto md:flex-col md:items-end gap-1 mt-2 md:mt-0">
                          <span className="text-base font-black text-slate-800">${c.cost.toFixed(2)}</span>
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                            c.paymentStatus === 'Pagado' ? 'bg-emerald-50 text-emerald-600' :
                            c.paymentStatus === 'Abono' ? 'bg-amber-50 text-amber-600' :
                            'bg-rose-50 text-rose-600'
                          }`}>
                            {c.paymentStatus}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-4 border-t border-slate-100 flex justify-end items-center gap-6 bg-white">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    Columnas por página
                    <select className="border-none bg-transparent font-medium focus:outline-none cursor-pointer">
                      <option>5</option>
                      <option>10</option>
                      <option>20</option>
                    </select>
                  </div>
                  <div className="text-sm text-slate-600">
                    0-0 de 0
                  </div>
                  <div className="flex gap-2 text-slate-400">
                    <button className="p-1 border-none bg-transparent text-slate-300 cursor-not-allowed"><ChevronLeft size={16} /></button>
                    <button className="p-1 border-none bg-transparent text-slate-300 cursor-not-allowed"><ChevronRight size={16} /></button>
                  </div>
                </div>
              </div>
            </div>

            {/* Odontograma Section */}
            <div className="flex flex-col gap-4 mt-6">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-slate-800">Odontograma</h2>
                <Info size={18} className="text-slate-400" />
              </div>
              
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex justify-center overflow-x-auto w-full">
                <div className="max-w-full">
                  <Odontogram patientId={patient?.id || 1} />
                </div>
              </div>
            </div>

            {/* Notas del odontograma Sections */}
            <div className="flex flex-col gap-4">
              <h3 className="text-lg font-bold text-slate-800">Notas del odontograma</h3>
              <textarea 
                className="w-full bg-white border border-slate-200 rounded-xl p-4 min-h-[150px] text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-y text-slate-700 shadow-sm"
              ></textarea>
            </div>

          </div>
        )}


        {activeTab === 'Perfil' && (
          <div className="animate-in w-full max-w-6xl mx-auto px-6 py-4">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-md p-16 flex flex-col gap-10">
              
              {/* Main Header */}
              <div className="flex justify-between items-start w-full">
                <div className="flex flex-col gap-1">
                  <h2 className="text-[28px] font-bold text-slate-800 leading-tight">Perfil de paciente</h2>
                  <p className="text-sm text-slate-400 font-medium">Información clínica base y antecedentes del paciente</p>
                </div>
                <button className="btn bg-brand-blue hover:bg-brand-blue-hover text-white px-6 py-2.5 rounded-lg flex items-center gap-2 border-none">
                  <Download size={16}/>
                  <span className="font-bold tracking-tight text-[13px]">DESCARGAR PERFIL</span>
                </button>
              </div>

              <div className="flex flex-col gap-14">
                {/* Personal Information Section */}
                <div className="flex flex-col gap-8">
                  <div className="flex justify-between items-center border-b border-slate-50 pb-4">
                    <h3 className="text-lg font-bold text-slate-800">Información personal</h3>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Editar información personal</span>
                      {/* Robust Toggle Switch using standard CSS variables */}
                      <div 
                        onClick={() => setIsEditingPersonal(!isEditingPersonal)}
                        className="cursor-pointer transition-all duration-300"
                        style={{
                          width: '44px',
                          height: '24px',
                          backgroundColor: isEditingPersonal ? 'var(--brand-blue)' : 'var(--slate-200)',
                          borderRadius: '12px',
                          padding: '3px',
                          position: 'relative'
                        }}
                      >
                        <div 
                          className="bg-white shadow-sm transition-all duration-300 transform"
                          style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            translate: isEditingPersonal ? '20px' : '0'
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* High Fidelity Grid - Using new Utilities */}
                  <div className="grid grid-cols-2 gap-x-16 gap-y-10">
                    {[
                      { label: 'NOMBRES', value: personalInfo.nombres, key: 'nombres' },
                      { label: 'APELLIDOS', value: personalInfo.apellidos, key: 'apellidos' },
                      { label: 'FECHA DE NACIMIENTO', value: personalInfo.fechaNacimiento, key: 'fechaNacimiento', placeholder: 'dd/mm/aaaa' },
                      { label: 'GÉNERO', value: personalInfo.genero, key: 'genero', type: 'select', options: ['Hombre', 'Mujer', 'Otro'] },
                      { label: 'LUGAR DE NACIMIENTO', value: personalInfo.lugarNacimiento, key: 'lugarNacimiento' },
                      { label: 'CÉDULA DEL PACIENTE', value: personalInfo.cedula, key: 'cedula' },
                      { label: 'CORREO ELECTRÓNICO', value: personalInfo.email, key: 'email', type: 'email' },
                      { label: 'NÚMERO DE TELÉFONO', value: personalInfo.telefono, key: 'telefono' },
                      { label: 'TELÉFONO DE EMERGENCIA', value: personalInfo.telefonoEmergencia, key: 'telefonoEmergencia' },
                      { label: 'OCUPACIÓN', value: personalInfo.ocupacion, key: 'ocupacion' },
                    ].map((field) => (
                      <div key={field.key} className="flex flex-col gap-2 border-b border-slate-100 pb-2">
                        <label className="text-[10px] text-slate-400 font-black tracking-widest uppercase">{field.label}</label>
                        {field.type === 'select' ? (
                          <div className="relative">
                            <select 
                              disabled={!isEditingPersonal}
                              className="w-full text-base font-bold text-slate-800 bg-transparent border-none outline-none p-0 appearance-none cursor-pointer"
                              value={field.value}
                              onChange={e => setPersonalInfo({...personalInfo, [field.key]: e.target.value})}
                            >
                              {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
                              <ChevronDown size={14} />
                            </div>
                          </div>
                        ) : (
                          <input 
                            type={field.type || 'text'}
                            readOnly={!isEditingPersonal}
                            placeholder={field.placeholder}
                            className="w-full text-base font-bold text-slate-800 bg-transparent border-none outline-none p-0 focus:text-primary transition-colors placeholder:text-slate-200"
                            value={field.value}
                            onChange={e => setPersonalInfo({...personalInfo, [field.key]: e.target.value})}
                          />
                        )}
                      </div>
                    ))}
                    
                    {/* Address Legend Box */}
                    <div className="col-span-2 mt-4">
                       <div className="relative border border-slate-200 rounded-xl p-8 bg-slate-50/20">
                         <span className="absolute -top-3 left-6 bg-white px-2.5 text-[10px] text-slate-400 font-black tracking-widest uppercase">
                           DIRECCIÓN DE RESIDENCIA
                         </span>
                         <textarea 
                           readOnly={!isEditingPersonal}
                           className="w-full min-h-[60px] text-base font-bold text-slate-700 bg-transparent border-none focus:outline-none resize-none leading-relaxed"
                           value={personalInfo.direccion}
                           onChange={e => setPersonalInfo({...personalInfo, direccion: e.target.value})}
                         />
                       </div>
                    </div>
                  </div>
                </div>

                {/* Section: Anamnesis */}
                <div className="flex flex-col gap-8">
                  <div className="flex justify-between items-center border-b border-slate-50 pb-4">
                    <h3 className="text-lg font-bold text-slate-800">Anamnesis</h3>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Editar anamnesis</span>
                      <div className="cursor-pointer" style={{ width: '44px', height: '24px', backgroundColor: 'var(--slate-100)', borderRadius: '12px', padding: '3px', position: 'relative' }}>
                        <div className="bg-white" style={{ width: '18px', height: '18px', borderRadius: '50%' }} />
                      </div>
                    </div>
                  </div>

                  <div className="relative border border-slate-200 rounded-xl p-8 bg-slate-50/20">
                     <span className="absolute -top-3 left-6 bg-white px-2.5 text-[10px] text-slate-400 font-black tracking-widest uppercase">
                       Antecedentes personales
                     </span>
                     <div className="min-h-[40px] text-base font-bold text-slate-300 italic">
                       Sin antecedentes registrados...
                     </div>
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

        {activeTab === 'Historia médica' && (
          <PatientHistoryView />
        )}

        {activeTab === 'Historia de pago' && (
          <div className="flex flex-col gap-8 animate-in fade-in duration-300">
            <h2 className="text-2xl font-bold text-slate-800">Historia de Pago</h2>
            
            {/* Quick Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col gap-1 relative overflow-hidden group hover:shadow-xl transition-all">
                <div className={`absolute top-0 right-0 w-2 h-full ${debtSummary.balance > 0 ? 'bg-rose-500' : 'bg-emerald-500'}`}></div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest relative z-10">Saldo Pendiente</span>
                <span className={`text-3xl font-black relative z-10 ${debtSummary.balance > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                  ${debtSummary.balance.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                </span>
                <span className={`text-[10px] font-black uppercase tracking-tighter relative z-10 ${debtSummary.balance > 0 ? 'text-rose-300' : 'text-emerald-300'}`}>
                   {debtSummary.balance > 0 ? '• Acción requerida' : '• Estado solvente'}
                </span>
              </div>
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col gap-1 relative overflow-hidden group hover:shadow-xl transition-all">
                <div className="absolute top-0 right-0 w-2 h-full bg-slate-800"></div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest relative z-10">Total Facturado</span>
                <span className="text-3xl font-black text-slate-800 relative z-10">
                  ${debtSummary.totalDue.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-tighter relative z-10">Historial acumulado</span>
              </div>
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col gap-1 relative overflow-hidden group hover:shadow-xl transition-all">
                <div className="absolute top-0 right-0 w-2 h-full bg-emerald-400"></div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest relative z-10">Total Pagado</span>
                <span className="text-3xl font-black text-emerald-500 relative z-10">
                  ${debtSummary.totalPaid.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] font-black text-emerald-300 uppercase tracking-tighter relative z-10">Capital recuperado</span>
              </div>
            </div>

            {/* Detailed Transaction List */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
              <div className="p-5 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
                 <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest">Movimientos de Cuenta</h3>
                 <span className="text-[10px] font-black text-slate-400 bg-white px-2 py-1 rounded-lg border border-slate-100">{financialHistory.length} REGISTROS</span>
              </div>
              
              <div className="flex flex-col">
                {financialHistory.length === 0 ? (
                  <div className="p-20 flex flex-col items-center gap-3 text-center">
                    <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center">
                      <Clock size={32} />
                    </div>
                    <p className="text-slate-400 font-bold text-sm">No se encontraron movimientos registrados.</p>
                  </div>
                ) : (
                  financialHistory.map((item, idx) => (
                    <div key={item.id} className={`p-5 flex items-center justify-between border-b border-slate-50 last:border-none hover:bg-slate-50/50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/20'}`}>
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          item.type === 'charge' ? 'bg-rose-50 text-rose-500' : 
                          item.type === 'credit' ? 'bg-emerald-50 text-emerald-500' : 
                          'bg-primary/5 text-primary'
                        }`}>
                          {item.type === 'charge' ? <FileText size={18} /> : item.type === 'credit' ? <CheckCircle2 size={18} /> : <Clock size={18} />}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-slate-400 uppercase tracking-tight">
                            {new Date(item.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                          <span className="text-sm font-bold text-slate-800">{item.label}</span>
                          <span className="text-[11px] text-slate-500 font-medium">{item.description}</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-1.5">
                        <span className={`text-base font-black ${
                          item.type === 'charge' ? 'text-slate-800' : 
                          item.type === 'credit' ? 'text-emerald-600' : 
                          'text-slate-400'
                        }`}>
                          {item.type === 'credit' ? '+' : item.type === 'charge' ? '' : ''}
                          {item.amount > 0 ? `$${item.amount.toLocaleString('es-ES', { minimumFractionDigits: 2 })}` : '--'}
                        </span>
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                          item.status === 'Activa' ? 'bg-primary text-white animate-pulse' :
                          item.status === 'Pagado' ? 'bg-emerald-50 text-emerald-600' :
                          'bg-slate-100 text-slate-500'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      


      {/* Local Toast Notification Simulation */}
      {toastMessage && (
        <div style={{
          position: 'fixed', bottom: '2rem', right: '2rem', background: 'var(--primary)',
          color: 'white', padding: '1rem 1.5rem', borderRadius: 'var(--radius)',
          boxShadow: 'var(--shadow-md)', zIndex: 100
        }} className="animate-in slide-in-from-bottom-5">
          {toastMessage}
        </div>
      )}

    </div>
  );
};

export default PatientProfile;
