import React, { useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Search,
  ClipboardList,
  Activity,
  Stethoscope,
  ChevronRight,
  Zap,
  CalendarCheck,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '../../context/DataContext';

const UpcomingAppointments = () => {
  const navigate = useNavigate();
  const { appointments, doctors, patients, loading } = useData();
  const [search, setSearch] = useState('');

  const sortedAppointments = useMemo(() => {
    const now = new Date();
    return (appointments || [])
      .filter(app => {
        const appDate = new Date(app.starts_at || app.start_at);
        return appDate >= now && app.status !== 'cancelled' && app.status !== 'blocked';
      })
      .sort((a, b) => new Date(a.starts_at || a.start_at) - new Date(b.starts_at || b.start_at));
  }, [appointments]);

  const filtered = useMemo(() => {
    if (!search.trim()) return sortedAppointments;
    const q = search.toLowerCase();
    return sortedAppointments.filter(app =>
      (app.patientName || '').toLowerCase().includes(q) ||
      (app.doctorName || '').toLowerCase().includes(q)
    );
  }, [sortedAppointments, search]);

  const formatRelativeTime = (isoDate) => {
    if (!isoDate) return '--';
    const now = new Date();
    const target = new Date(isoDate);
    const diffMs = target - now;
    const diffMin = Math.round(diffMs / (1000 * 60));
    const diffHrs = Math.round(diffMin / 60);
    const diffDays = Math.round(diffHrs / 24);
    if (diffMin < 60) return `${diffMin} min`;
    if (diffHrs < 24) return `${diffHrs} h`;
    return `${diffDays} día${diffDays !== 1 ? 's' : ''}`;
  };

  const nextApp = sortedAppointments[0] || null;
  const nextAppTime = nextApp ? (nextApp.starts_at || nextApp.start_at) : null;

  const getInitials = (name = '') => {
    return name.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'P';
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'completed': return { label: 'Completada', color: '#10b981', bg: '#ecfdf5', border: '#a7f3d0' };
      case 'rescheduled': return { label: 'Reprogramada', color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' };
      case 'confirmed': return { label: 'Confirmada', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' };
      default: return { label: 'Programada', color: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe' };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-32">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center">
            <Activity className="animate-spin text-primary" size={28} />
          </div>
          <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Cargando citas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">

      {/* ── Back + Header ── */}
      <div className="mb-10">
        <button
          onClick={() => navigate('/scheduler')}
          className="flex items-center gap-2 text-slate-400 hover:text-primary transition-all font-black text-[10px] uppercase tracking-[0.2em] w-fit mb-6 group"
        >
          <ArrowLeft size={14} strokeWidth={3} className="group-hover:-translate-x-1 transition-transform" />
          Volver a Agenda
        </button>

        <div className="flex items-center gap-5">
            <div
              className="w-16 h-16 flex items-center justify-center text-primary shadow-lg shadow-primary/15 flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', borderRadius: '28px', border: '1px solid #bfdbfe' }}
            >
              <ClipboardList size={28} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">Citas Próximas</h1>
              <p className="text-slate-400 text-[11px] font-black uppercase tracking-[0.2em] mt-1.5">Listado cronológico</p>
            </div>
          </div>
      </div>

      {/* ── KPI Strip (single horizontal card) ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="bg-white border border-slate-100 shadow-lg shadow-slate-200/50 mb-6 flex items-stretch divide-x divide-slate-100"
        style={{ borderRadius: '2rem' }}
      >
        {/* KPI 1 - Total */}
        <div className="flex items-center gap-4 px-8 py-5 flex-1 group">
          <div className="w-11 h-11 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform" style={{ background: '#eff6ff', borderRadius: '14px' }}>
            <CalendarCheck size={20} style={{ color: '#2563eb' }} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Total programadas</p>
            <p className="text-2xl font-black text-slate-900 leading-none">{sortedAppointments.length}</p>
          </div>
        </div>

        {/* KPI 2 - Siguiente */}
        <div className="flex items-center gap-4 px-8 py-5 flex-1 group">
          <div className="w-11 h-11 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform" style={{ background: '#0f172a', borderRadius: '14px' }}>
            <Clock size={20} style={{ color: '#fff' }} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Siguiente cita</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-black text-slate-900 leading-none italic uppercase">
                {nextAppTime ? formatRelativeTime(nextAppTime) : '—'}
              </p>
              {nextAppTime && (
                <span className="text-[9px] font-black uppercase tracking-wider text-emerald-500 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                  En tiempo
                </span>
              )}
            </div>
          </div>
        </div>

        {/* KPI 3 - Hoy */}
        <div className="flex items-center gap-4 px-8 py-5 flex-1 group">
          <div className="w-11 h-11 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform" style={{ background: '#faf5ff', borderRadius: '14px' }}>
            <Zap size={20} style={{ color: '#8b5cf6' }} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Citas hoy</p>
            <p className="text-2xl font-black text-slate-900 leading-none">
              {sortedAppointments.filter(a => new Date(a.starts_at || a.start_at).toDateString() === new Date().toDateString()).length}
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── Search Bar ── */}
      <div className="relative group w-full mb-8">
        <Search
          className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors duration-200"
          size={17}
          strokeWidth={2.5}
        />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar pacientes por nombre, doctor o fecha..."
          className="w-full pl-12 pr-5 py-3.5 bg-white border border-slate-100 text-sm font-semibold text-slate-700 placeholder:text-slate-300 shadow-sm hover:shadow-md focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/30 transition-all"
          style={{ borderRadius: '999px' }}
        />
      </div>

      {/* ── Appointments List ── */}
      {filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="bg-white border border-slate-100 shadow-lg shadow-slate-200/50 p-20 flex flex-col items-center gap-5"
          style={{ borderRadius: '3rem' }}
        >
          <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200 border border-slate-100">
            <Calendar size={36} strokeWidth={1.5} />
          </div>
          <div className="text-center">
            <p className="text-slate-800 font-black text-lg mb-1">Sin citas próximas</p>
            <p className="text-slate-400 text-sm font-medium">No hay citas programadas para los próximos días.</p>
          </div>
          <button
            onClick={() => navigate('/scheduler')}
            className="mt-2 flex items-center gap-2 px-6 py-3 bg-primary text-white text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95"
          >
            <Calendar size={14} strokeWidth={2.5} /> Ir a la Agenda
          </button>
        </motion.div>
      ) : (
        <div className="flex flex-col gap-3">
          <AnimatePresence>
            {filtered.map((app, index) => {
              const appDate = new Date(app.starts_at || app.start_at);
              const isToday = appDate.toDateString() === new Date().toDateString();
              const isTomorrow = appDate.toDateString() === new Date(Date.now() + 86400000).toDateString();
              const docObj = doctors.find(d => d.id === app.doctor_id);
              const docColor = docObj?.color || '#3b82f6';
              const startTime = app.startTime || appDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
              const endTime = app.endTime || '—';
              const statusCfg = getStatusConfig(app.status);
              const relTime = formatRelativeTime(app.starts_at || app.start_at);

              const dayLabel = isToday
                ? 'Hoy'
                : isTomorrow
                  ? 'Mañana'
                  : appDate.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });

              return (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ delay: index * 0.04, duration: 0.3 }}
                  className="group bg-white border border-slate-100 shadow-sm hover:shadow-lg hover:shadow-slate-200/60 transition-all duration-300 overflow-hidden"
                  style={{ borderRadius: '2rem' }}
                >
                  <div className="flex items-center gap-0">
                    {/* Color accent bar */}
                    <div className="w-1.5 self-stretch flex-shrink-0 rounded-l-full" style={{ backgroundColor: docColor }} />

                    <div className="flex flex-1 items-center gap-5 px-6 py-5 min-w-0">
                      {/* Avatar */}
                      <div
                        className="w-12 h-12 flex items-center justify-center text-white font-black text-sm flex-shrink-0 shadow-md transition-transform group-hover:scale-105"
                        style={{ backgroundColor: docColor, borderRadius: '16px' }}
                      >
                        {getInitials(app.patientName)}
                      </div>

                      {/* Patient info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-black text-slate-900 leading-tight truncate group-hover:text-primary transition-colors">
                          {app.patientName || 'Paciente sin nombre'}
                        </p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span
                            className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border"
                            style={{ color: statusCfg.color, backgroundColor: statusCfg.bg, borderColor: statusCfg.border }}
                          >
                            {statusCfg.label}
                          </span>
                          {isToday && (
                            <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full text-rose-500 bg-rose-50 border border-rose-100">
                              ¡Hoy!
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Date & Time */}
                      <div className="hidden sm:flex flex-col items-center gap-1 flex-shrink-0 min-w-[110px] text-center">
                        <span className={`text-sm font-black ${isToday ? 'text-primary' : 'text-slate-800'}`}>
                          {dayLabel}
                        </span>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                          <Clock size={10} strokeWidth={3} />
                          <span>{startTime}</span>
                          {endTime !== '—' && <><span>·</span><span>{endTime}</span></>}
                        </div>
                      </div>

                      {/* Doctor badge */}
                      <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-2xl border flex-shrink-0" style={{ backgroundColor: `${docColor}12`, borderColor: `${docColor}30` }}>
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: docColor }} />
                        <span className="text-[10px] font-black uppercase tracking-tight" style={{ color: docColor }}>
                          {app.doctorName || 'Sin asignar'}
                        </span>
                      </div>

                      {/* Countdown pill */}
                      <div className="hidden lg:flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-3 py-2 rounded-2xl flex-shrink-0">
                        <AlertCircle size={11} className="text-slate-400" strokeWidth={2.5} />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-tight whitespace-nowrap">
                          En {relTime}
                        </span>
                      </div>

                      {/* CTA */}
                      <Link
                        to={`/scheduler/appointment/${app.id}`}
                        className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-primary transition-all hover:shadow-lg hover:shadow-primary/20 active:scale-95 duration-200"
                        onClick={e => e.stopPropagation()}
                      >
                        Ver
                        <ChevronRight size={13} strokeWidth={3} />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default UpcomingAppointments;
