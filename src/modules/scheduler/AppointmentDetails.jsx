import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import useSoundFX from '../../hooks/useSoundFX';
import { 
  ArrowLeft, 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Activity, 
  Rewind, 
  ExternalLink,
  ChevronRight,
  FileText,
  CheckCircle,
  RefreshCw,
  XCircle,
  X,
  CalendarCheck,
  Ban,
} from 'lucide-react';

const AppointmentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { appointments, consultations, patients, doctors, updateAppointment } = useData();

  const [reasonModal, setReasonModal] = useState({ isOpen: false, type: null }); // type: 'rescheduled' | 'cancelled'
  const [reasonText, setReasonText] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const appointment = useMemo(() => {
    return (appointments || []).find(a => a.id === id || a.id === parseInt(id));
  }, [appointments, id]);

  const patient = useMemo(() => {
    if (!appointment) return null;
    const pId = appointment.patient_id || appointment.patientId;
    return (patients || []).find(p => p.id === pId || p.id === parseInt(pId));
  }, [patients, appointment]);

  const pastRecords = useMemo(() => {
    if (!appointment) return [];
    const pId = appointment.patient_id || appointment.patientId;
    const patientApps = (appointments || []).filter(a => (a.patient_id === pId || a.patientId === pId) && a.id !== appointment.id);
    const patientCons = (consultations || []).filter(c => c.patient_id === pId);
    return [...patientApps, ...patientCons].sort((a, b) => new Date(b.created_at || b.starts_at || b.start_at) - new Date(a.created_at || a.starts_at || a.start_at));
  }, [appointments, consultations, appointment]);

  if (!appointment) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <div className="p-4 bg-slate-100 rounded-full text-slate-400">
           <Activity size={48} />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Cita no encontrada</h2>
        <button onClick={() => navigate('/scheduler')} className="text-primary font-bold">Volver a la agenda</button>
      </div>
    );
  }

  const notes = appointment.notes || '';
  const lastRecord = pastRecords[0];
  
  // Parse services if exists
  let services = [];
  let total = '$0';
  if (notes.startsWith('Servicios:')) {
    const parts = notes.split('|');
    const servicesPart = parts[0].replace('Servicios:', '').trim();
    total = parts[1]?.replace('Total:', '').trim() || '$0';
    services = servicesPart.split(', ').filter(s => s).map(s => {
      const [name, pricePart] = s.split(' ($');
      return { name, price: pricePart?.replace(')', '') || '0' };
    });
  }

  const handleStatusUpdate = async (newStatus, reason = null) => {
    setIsUpdating(true);
    try {
      await updateAppointment(appointment.id, { 
        status: newStatus,
        status_reason: reason 
      });
      setReasonModal({ isOpen: false, type: null });
      setReasonText('');
      
      if (newStatus === 'completed') {
        // Show success state and auto-close
        setIsUpdating(true); // Keep it "loading" essentially
        setTimeout(() => {
          navigate('/scheduler');
        }, 1500);
      }
    } catch (error) {
       console.error("Error updating status:", error);
       alert("Hubo un error al actualizar la cita.");
    } finally {
      setIsUpdating(false);
    }
  };

  const sfx = useSoundFX();

  const statusMap = {
    'scheduled': {
      label: 'Cita Programada',
      color: 'bg-blue-50 text-blue-600 border-blue-100',
      icon: <CalendarCheck size={12} strokeWidth={3} />
    },
    'completed': {
      label: 'Consulta Exitosa',
      color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      icon: <CheckCircle size={12} strokeWidth={3} />
    },
    'rescheduled': {
      label: 'CITA REPROGRAMADA',
      color: 'bg-amber-100 text-amber-700 border-amber-300',
      icon: <RefreshCw size={12} strokeWidth={3} />
    },
    'cancelled': {
      label: 'CITA CANCELADA',
      color: 'bg-rose-100 text-rose-700 border-rose-300',
      icon: <Ban size={12} strokeWidth={3} />
    },
  };

  const currStatus = appointment.status || 'scheduled';
  const statusDisplay = statusMap[currStatus] || statusMap['scheduled'];

  return (
    <div className="max-w-4xl mx-auto p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Actions */}
      <div className="flex justify-between items-center mb-8">
        <button 
          onClick={() => { sfx.navigate(); navigate(-1); }}
          className="flex items-center gap-2 text-slate-400 hover:text-primary font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100"
        >
          <ArrowLeft size={14} /> VOLVER
        </button>
        <div className="flex items-center gap-3">
           <span className={`px-4 py-1.5 border rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm flex items-center gap-2 ${statusDisplay.color}`}>
             {statusDisplay.icon} {statusDisplay.label}
           </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Core Info */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 opacity-50"></div>
            <h1 className="text-3xl font-black text-slate-900 mb-6 relative z-10">{patient?.name || 'Paciente'}</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
              <div className="flex items-center gap-4 group p-4 rounded-2xl bg-slate-50/50 border border-transparent hover:border-indigo-100 hover:bg-white transition-all">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm">
                   <CalendarIcon size={24} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha</span>
                  <span className="text-base font-bold text-slate-800">
                    {new Date(appointment.starts_at || appointment.start_at).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 group p-4 rounded-2xl bg-slate-50/50 border border-transparent hover:border-amber-100 hover:bg-white transition-all">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm">
                   <Clock size={24} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Horario</span>
                  <span className="text-base font-bold text-slate-800">
                    {appointment.startTime} - {appointment.endTime}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 group p-4 rounded-2xl bg-slate-50/50 border border-transparent hover:border-emerald-100 hover:bg-white transition-all md:col-span-2">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm">
                   <User size={24} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Especialista</span>
                  <span className="text-base font-bold text-slate-800">{appointment.doctor_name || appointment.doctorName || 'Sin asignar'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Treatment Plan Section */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-6">
               <div className="flex items-center gap-3">
                  <Activity size={20} className="text-sky-600" />
                  <h2 className="text-xl font-black text-slate-800">Plan de Tratamiento</h2>
               </div>
               <span className="px-3 py-1 bg-sky-50 text-sky-600 rounded-lg text-[10px] font-black">
                 {services.length} PROCEDIMIENTOS
               </span>
            </div>

            {services.length > 0 ? (
              <div className="flex flex-col gap-4">
                 <div className="flex flex-col gap-3">
                    {services.map((s, i) => (
                      <div key={i} className="flex justify-between items-center p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-sky-200 transition-all">
                        <div className="flex items-center gap-3">
                           <div className="w-2 h-2 rounded-full bg-sky-400"></div>
                           <span className="font-bold text-slate-700">{s.name}</span>
                        </div>
                        <span className="font-black text-slate-900">${s.price}</span>
                      </div>
                    ))}
                 </div>
                 <div className="mt-4 p-6 bg-slate-900 rounded-2xl flex justify-between items-center shadow-lg shadow-slate-900/10">
                    <span className="text-slate-400 text-sm font-bold">TOTAL ESTIMADO</span>
                    <span className="text-white text-3xl font-black">{total}</span>
                 </div>
              </div>
            ) : (
              <div className="p-10 border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center gap-3">
                <FileText size={32} className="text-slate-200" />
                <p className="text-slate-400 font-medium">Sin procedimientos detallados en esta cita.</p>
                {notes && (
                  <div className="w-full mt-4 p-4 bg-slate-50 rounded-xl text-slate-600 italic text-sm">
                    "{notes}"
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Insights & Actions */}
        <div className="flex flex-col gap-6">
          
          {/* Action Cards */}
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => navigate(`/pacientes/${patient?.id}`)}
              className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 hover:border-primary transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                  <User size={18} />
                </div>
                <span className="font-bold text-slate-700">Ver Perfil Integral</span>
              </div>
              <ChevronRight size={16} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
            </button>

            <button 
              onClick={() => navigate(`/pacientes/${patient?.id}`, { state: { activeTab: 'General', scrollSection: 'odontogram' } })}
              className="w-full flex items-center justify-between p-4 bg-sky-50 rounded-2xl border border-sky-100 hover:border-sky-400 transition-all group cursor-pointer shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white text-sky-600 flex items-center justify-center shadow-sm">
                  <Activity size={18} />
                </div>
                <span className="font-bold text-sky-700">Ver Odontograma</span>
              </div>
              <ChevronRight size={16} className="text-sky-300 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Quick History Insights Block */}
          <div className="bg-emerald-50 rounded-3xl p-6 border border-emerald-100 flex flex-col gap-4">
            <div className="flex items-center gap-3 text-emerald-800">
               <Rewind size={20} />
               <h3 className="text-sm font-black uppercase tracking-widest">Historial Rápido</h3>
            </div>
            
            {lastRecord ? (
              <div className="flex flex-col gap-2">
                <div className="p-4 bg-white rounded-2xl border border-emerald-100/50 shadow-sm">
                   <div className="text-[10px] font-black text-emerald-600 uppercase mb-1">Última vez</div>
                   <div className="font-bold text-slate-800 mb-1">
                      {lastRecord.treatment_summary || lastRecord.notes?.split('|')[0]?.replace('Servicios: ', '')?.split(',')[0] || 'Consulta'}
                   </div>
                   <div className="text-xs text-slate-500 font-medium">{new Date(lastRecord.created_at || lastRecord.starts_at || lastRecord.start_at).toLocaleDateString()}</div>
                </div>
                <button 
                  onClick={() => navigate(`/pacientes/${patient?.id}`, { state: { activeTab: 'Historia médica' } })}
                  className="mt-2 w-full flex items-center justify-center gap-2 py-3 px-4 bg-white border border-emerald-200 text-emerald-700 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all cursor-pointer shadow-sm group"
                >
                  Ver historial completo 
                  <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            ) : (
              <p className="text-emerald-700/60 text-sm font-medium italic">Sin antecedentes registrados para este paciente.</p>
            )}
          </div>

          {/* Resolution Panel (Gestión Operativa) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col gap-4 pointer-events-auto">
             <div className="flex flex-col">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Resolución Operativa</h3>
                <p className="text-slate-400 text-xs font-bold mt-2">Marca el estado final de esta cita para las estadísticas clínicas.</p>
             </div>
             
             <div className="flex flex-col gap-2">
                <button 
                  onClick={() => { sfx.success(); handleStatusUpdate('completed'); }}
                  disabled={isUpdating || currStatus === 'completed'}
                  className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all text-emerald-600 bg-emerald-50 hover:bg-emerald-600 hover:text-white border border-emerald-100 shadow-sm cursor-pointer disabled:opacity-50 disabled:grayscale"
                >
                   <CheckCircle size={16} /> Exitosa
                </button>

                <button 
                   onClick={() => { sfx.pop(); setReasonModal({ isOpen: true, type: 'rescheduled' }); }}
                   disabled={isUpdating || currStatus === 'rescheduled'}
                   className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all text-amber-600 bg-amber-50 hover:bg-amber-500 hover:text-white border border-amber-100 shadow-sm cursor-pointer disabled:opacity-50 disabled:grayscale"
                >
                   <RefreshCw size={16} /> Reagendada
                </button>

                <button 
                   onClick={() => { sfx.pop(); setReasonModal({ isOpen: true, type: 'cancelled' }); }}
                   disabled={isUpdating || currStatus === 'cancelled'}
                   className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all text-rose-600 bg-rose-50 hover:bg-rose-500 hover:text-white border border-rose-100 shadow-sm cursor-pointer disabled:opacity-50 disabled:grayscale"
                >
                   <XCircle size={16} /> Cancelada
                </button>
             </div>
          </div>

          {appointment.status_reason && (
             <div className="p-5 bg-slate-50 border border-slate-100 rounded-3xl flex flex-col gap-2">
                <div className="flex items-center gap-2">
                   <FileText size={16} className="text-slate-400" />
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Motivo Registrado</span>
                </div>
                <span className="text-sm font-bold text-slate-700 italic">"{appointment.status_reason}"</span>
             </div>
          )}

        </div>
      </div>

      {/* Modal de Motivo (Reagendar/Cancelar) */}
      {reasonModal.isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: '260px',
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100000,
          padding: '24px',
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '2.5rem',
            width: '100%',
            maxWidth: '540px',
            padding: '40px',
            boxShadow: '0 32px 80px -12px rgba(0,0,0,0.45)',
            border: '2px solid #f1f5f9',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
          }}>
             <div className="flex justify-between items-start mb-8">
                <div className="flex flex-col gap-3">
                   <div className="flex items-center gap-4">
                     <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${reasonModal.type === 'rescheduled' ? 'bg-amber-500 text-white' : 'bg-rose-500 text-white'}`}>
                       {reasonModal.type === 'rescheduled' ? <RefreshCw size={28} /> : <XCircle size={28} />}
                     </div>
                     <div className="flex flex-col">
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-none">
                          {reasonModal.type === 'rescheduled' ? 'Reagendar Cita' : 'Cancelar Cita'}
                        </h2>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">Acción Requerida</span>
                     </div>
                   </div>
                   <p className="text-sm font-bold text-slate-500 mt-2 leading-relaxed">
                     Por favor, indica el motivo detallado por el cual se está {reasonModal.type === 'rescheduled' ? 'reprogramando' : 'cancelando'} esta sesión clínica.
                   </p>
                </div>
                <button 
                  onClick={() => setReasonModal({ isOpen: false, type: null })} 
                  className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-2xl transition-all active:scale-90 border-none cursor-pointer"
                >
                   <X size={20} strokeWidth={3} />
                </button>
             </div>
             
             <div className="relative">
               <textarea 
                  autoFocus
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] p-6 text-sm font-bold text-slate-700 outline-none focus:border-primary/20 focus:bg-white transition-all resize-none h-40 shadow-inner"
                  placeholder="Ej: El paciente solicitó el cambio por motivos laborales o de salud..."
                  value={reasonText}
                  onChange={e => setReasonText(e.target.value)}
               />
               <div className="absolute bottom-4 right-4 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></div>
                  <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
                    Campo Obligatorio
                  </span>
               </div>
             </div>
             
             <div className="flex items-center justify-between gap-4 mt-10">
                <button 
                   onClick={() => { sfx.cancel(); setReasonModal({ isOpen: false, type: null }); }}
                   className="flex-1 px-8 py-4 font-black text-[11px] uppercase tracking-[0.2em] text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all border border-transparent active:scale-95 cursor-pointer"
                >
                   Volver
                </button>
                <button 
                   disabled={isUpdating || reasonText.trim().length === 0}
                   onClick={() => { sfx.confirm(); handleStatusUpdate(reasonModal.type, reasonText); }}
                   className={`flex-[2] px-8 py-4 font-black text-[11px] uppercase tracking-[0.2em] text-white rounded-2xl transition-all shadow-xl flex items-center justify-center gap-3 active:scale-95 cursor-pointer disabled:opacity-30 disabled:pointer-events-none disabled:grayscale ${
                     reasonModal.type === 'rescheduled' 
                       ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/25' 
                       : 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/25'
                   }`}
                >
                   {reasonModal.type === 'rescheduled' ? 'Confirmar Reagendamiento' : 'Confirmar Cancelación'}
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentDetails;
