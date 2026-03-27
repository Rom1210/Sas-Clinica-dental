import React, { useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  User, 
  ChevronRight, 
  Search,
  ClipboardList,
  Activity
} from 'lucide-react';
import { useData } from '../../context/DataContext';

const UpcomingAppointments = () => {
  const navigate = useNavigate();
  const { appointments, doctors, patients, loading } = useData();

  const sortedAppointments = useMemo(() => {
    const now = new Date();
    return (appointments || [])
      .filter(app => {
        const appDate = new Date(app.starts_at || app.start_at);
        return appDate >= now;
      })
      .sort((a, b) => new Date(a.starts_at || a.start_at) - new Date(b.starts_at || b.start_at));
  }, [appointments]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Activity className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div className="flex flex-col gap-2">
          <button 
            onClick={() => navigate('/scheduler')}
            className="flex items-center gap-2 text-slate-400 hover:text-primary transition-all font-black text-[10px] uppercase tracking-[0.2em] w-fit mb-2 group"
          >
            <ArrowLeft size={14} strokeWidth={3} className="group-hover:-translate-x-1 transition-transform" />
            Volver a Agenda
          </button>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-lg border border-primary/20">
              <ClipboardList size={30} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-1">Citas Próximas</h1>
              <p className="text-slate-500 text-sm font-bold uppercase tracking-widest opacity-80">Listado cronológico de pacientes por atender</p>
            </div>
          </div>
        </div>

        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Buscar paciente..."
            className="pl-12 pr-6 py-3.5 bg-white border border-slate-100 rounded-2xl w-full md:w-[300px] text-sm font-bold shadow-sm focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all"
          />
        </div>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5 translate-y-0 hover:-translate-y-1 transition-all hover:shadow-xl">
           <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black">
              {sortedAppointments.length}
           </div>
           <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Programadas</p>
              <p className="text-lg font-black text-slate-900">Próximos días</p>
           </div>
        </div>
        <div className="bg-slate-900 p-6 rounded-[2rem] shadow-xl flex items-center gap-5 translate-y-0 hover:-translate-y-1 transition-all border border-white/5">
           <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black">
              <Clock size={20} />
           </div>
           <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Próxima en</p>
              <p className="text-lg font-black text-white">
                {sortedAppointments.length > 0 
                  ? new Date(sortedAppointments[0].starts_at || sortedAppointments[0].start_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
                  : '--:--'}
              </p>
           </div>
        </div>
      </div>

      {/* Appointments List */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.04)] overflow-hidden">
        {sortedAppointments.length === 0 ? (
          <div className="p-20 text-center flex flex-col items-center gap-4">
             <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
               <Calendar size={40} />
             </div>
             <p className="text-slate-400 font-bold">No hay citas próximas programadas aún.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-50">
                  <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Paciente</th>
                  <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Fecha y Hora</th>
                  <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Especialista</th>
                  <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sortedAppointments.map((app, index) => {
                  const appDate = new Date(app.starts_at || app.start_at);
                  const isToday = appDate.toDateString() === new Date().toDateString();
                  const docObj = doctors.find(d => d.id === app.doctor_id);
                  const docColor = docObj?.color || '#3b82f6';

                  return (
                    <tr key={app.id} className="group hover:bg-slate-50/50 transition-colors border-b border-slate-50/50 last:border-none">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-xs shadow-inner">
                            {app.patientName?.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-slate-900 leading-tight group-hover:text-primary transition-colors">{app.patientName}</span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">ID: {app.patient_id?.slice(0, 8)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col gap-1">
                          <div className={`flex items-center gap-1.5 font-black text-sm ${isToday ? 'text-emerald-500' : 'text-slate-700'}`}>
                            {isToday ? 'Hoy' : appDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                            <Clock size={12} strokeWidth={3} /> {appDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                         <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-full border border-slate-100 w-fit">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: docColor }}></div>
                            <span className="text-[10px] font-black text-slate-700 uppercase">{app.doctorName}</span>
                         </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <Link 
                          to={`/scheduler/appointment/${app.id}`}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-100 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest transition-all hover:bg-primary hover:text-white hover:border-primary hover:shadow-lg active:scale-95 duration-200"
                        >
                          Ver Detalles <ChevronRight size={14} strokeWidth={3} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpcomingAppointments;
