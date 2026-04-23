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

  const formatRelativeTime = (isoDate) => {
    if (!isoDate) return '--:--';
    const now = new Date();
    const target = new Date(isoDate);
    const diffMs = target - now;
    const diffMin = Math.round(diffMs / (1000 * 60));
    const diffHrs = Math.round(diffMin / 60);
    const diffDays = Math.round(diffHrs / 24);

    if (diffMin < 60) return `${diffMin} min`;
    if (diffHrs < 24) return `${diffHrs} horas`;
    return `${diffDays} día${diffDays !== 1 ? 's' : ''}`;
  };

  const nextAppTime = sortedAppointments.length > 0 
    ? (sortedAppointments[0].starts_at || sortedAppointments[0].start_at)
    : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Activity className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
        <div className="flex flex-col gap-4">
          <button 
            onClick={() => navigate('/scheduler')}
            className="flex items-center gap-2 text-slate-400 hover:text-primary transition-all font-black text-[10px] uppercase tracking-[0.2em] w-fit mb-2 group"
          >
            <ArrowLeft size={14} strokeWidth={3} className="group-hover:-translate-x-1 transition-transform" />
            Volver a Agenda
          </button>
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-[2.5rem] bg-white shadow-premium flex items-center justify-center text-primary border border-slate-50">
              <ClipboardList size={32} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-none mb-2">Citas Próximas</h1>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse"></div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Listado cronológico de pacientes por atender</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative group w-full md:w-[340px]">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Buscar paciente..."
            className="w-full pl-14 pr-6 py-4 bg-white/80 backdrop-blur-md border border-slate-100 rounded-full text-sm font-bold shadow-premium focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/30 transition-all placeholder:text-slate-300"
          />
        </div>
      </div>

      {/* Stats Quick View - Financial Style Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {/* Total Card */}
        <div className="bg-white border border-slate-100 rounded-[3.5rem] p-6 flex items-center gap-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-shadow hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] group">
          <div style={{ background: '#EFF6FF', color: '#2563EB' }} className="rounded-2xl p-4 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
             <Calendar size={24} strokeWidth={2.5} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Programadas</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-800 leading-none">{sortedAppointments.length}</span>
              <span className="text-[9px] font-black text-slate-400 bg-slate-50 border border-slate-100 rounded-md px-1.5 py-0.5 uppercase tracking-tighter">
                Próximos días
              </span>
            </div>
          </div>
        </div>

        {/* Next App Card */}
        <div className="bg-white border border-slate-100 rounded-[3.5rem] p-6 flex items-center gap-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-shadow hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] group">
          <div style={{ background: '#1e293b', color: '#ffffff' }} className="rounded-2xl p-4 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
             <Clock size={24} strokeWidth={2.5} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Siguiente Cita</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-800 leading-none uppercase italic">
                {nextAppTime ? formatRelativeTime(nextAppTime) : '--:--'}
              </span>
              <span className="text-[9px] font-black text-emerald-500 bg-emerald-50 border border-emerald-100 rounded-md px-1.5 py-0.5 uppercase tracking-tighter">
                En Tiempo
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Appointments Grid/List */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between px-6">
           <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Agenda Cronológica</h2>
           <div className="h-px flex-1 mx-8 bg-slate-100"></div>
        </div>

        {sortedAppointments.length === 0 ? (
          <div className="bg-white rounded-[4rem] p-24 text-center flex flex-col items-center gap-6 border border-dashed border-slate-200">
             <div className="w-24 h-24 bg-slate-50 rounded-[3rem] flex items-center justify-center text-slate-200">
               <Calendar size={48} strokeWidth={1.5} />
             </div>
             <p className="text-slate-400 font-bold text-lg">No hay citas próximas programadas aún.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {sortedAppointments.map((app, index) => {
              const appDate = new Date(app.starts_at || app.start_at);
              const isToday = appDate.toDateString() === new Date().toDateString();
              const docObj = doctors.find(d => d.id === app.doctor_id);
              const docColor = docObj?.color || '#3b82f6';
              const startTime = app.startTime || appDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
              const endTime = app.endTime || '--:--';

              return (
                <div 
                  key={app.id} 
                  className="group bg-white rounded-[3.5rem] p-6 border border-slate-100 hover:border-primary/20 hover:shadow-premium transition-all duration-300 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden"
                >
                  {/* Left: Patient Info */}
                  <div className="flex items-center gap-6 flex-1 min-w-0">
                    <div className="w-16 h-16 rounded-[2rem] bg-slate-50 flex items-center justify-center text-slate-400 font-black text-lg shadow-inner group-hover:bg-primary/5 group-hover:text-primary transition-colors border border-slate-100">
                      {app.patientName ? app.patientName.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase() : 'P'}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xl font-black text-slate-900 tracking-tight leading-none mb-2 truncate group-hover:text-primary transition-colors">
                        {app.patientName}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                          PACIENTE
                        </span>
                        <span className="text-[10px] text-slate-300 font-bold uppercase tracking-tighter">
                          ID: {app.patient_id?.slice(0, 8)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Middle: Time & Date */}
                  <div className="flex flex-col items-center md:items-start gap-2 px-8 border-x border-slate-50">
                    <div className={`flex items-center gap-2 px-4 py-1 rounded-full font-black text-[10px] uppercase tracking-widest ${isToday ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-500 border border-slate-100'}`}>
                      <Calendar size={12} strokeWidth={3} />
                      {isToday ? 'Programado para Hoy' : appDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
                    </div>
                    <div className="flex items-center gap-2 font-black text-lg text-slate-700 ml-1">
                      <Clock size={18} className="text-primary" strokeWidth={2.5} />
                      {startTime} <span className="text-slate-300 text-sm mx-1">→</span> {endTime}
                    </div>
                  </div>

                  {/* Right: Specialist & Action */}
                  <div className="flex items-center gap-6">
                     <div className="flex flex-col items-end gap-2">
                       <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mr-2">Tratado por</p>
                       <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full border border-slate-100">
                          <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: docColor }}></div>
                          <span className="text-[11px] font-black text-slate-700 uppercase tracking-tighter">{app.doctorName}</span>
                       </div>
                    </div>

                    <Link 
                      to={`/scheduler/appointment/${app.id}`}
                      className="w-14 h-14 bg-slate-900 text-white rounded-[2rem] flex items-center justify-center hover:bg-primary hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 active:scale-90"
                    >
                      <ChevronRight size={24} strokeWidth={3} />
                    </Link>
                  </div>

                  {/* Decorative corner accent */}
                  {isToday && (
                    <div className="absolute top-0 right-0 w-2 h-full bg-emerald-500"></div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
  );
};

export default UpcomingAppointments;
