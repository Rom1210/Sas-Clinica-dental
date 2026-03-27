import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { 
  ArrowLeft, 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Activity, 
  Rewind, 
  ExternalLink,
  ChevronRight,
  FileText
} from 'lucide-react';

const AppointmentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { appointments, consultations, patients, doctors } = useData();

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

  return (
    <div className="max-w-4xl mx-auto p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Actions */}
      <div className="flex justify-between items-center mb-8">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-400 hover:text-primary font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100"
        >
          <ArrowLeft size={14} /> VOLVER
        </button>
        <div className="flex items-center gap-3">
           <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest">
             Cita Programada
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
                    {new Date(appointment.starts_at || appointment.start_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
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
              onClick={() => navigate(`/pacientes/${patient?.id}`, { state: { activeTab: 'Odontograma' } })}
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

        </div>
      </div>
    </div>
  );
};

export default AppointmentDetails;
