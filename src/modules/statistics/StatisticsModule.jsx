import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useSettings } from '../../context/SettingsContext';
import { 
  ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Cell, AreaChart, Area
} from 'recharts';
import { 
  Users, DollarSign, Activity, 
  TrendingUp, TrendingDown, Star, Loader2, Calendar, XCircle, FileText
} from 'lucide-react';

// Common Options
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const MONTHS_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const YEARS = [2025, 2026, 2027];
const WEEKS = [
  { label: 'Semana 1', value: 0, range: [1, 7] },
  { label: 'Semana 2', value: 1, range: [8, 14] },
  { label: 'Semana 3', value: 2, range: [15, 21] },
  { label: 'Semana 4', value: 3, range: [22, 31] },
];

const Dropdown = ({ value, options, onChange, labelKey = 'label', valueKey = 'value' }) => {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o[valueKey] === value);
  return (
    <div style={{ position: 'relative' }}>
      <button 
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          background: 'white', border: '1.5px solid #E2E8F0', borderRadius: '0.5rem',
          padding: '0.35rem 0.875rem', fontSize: '0.75rem', fontWeight: 800, color: '#334155', cursor: 'pointer'
        }}
      >
        {selected?.[labelKey]}
        <div style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', display: 'flex' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
        </div>
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 100 }} />
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0, 
            background: 'white', border: '1.5px solid #E2E8F0', borderRadius: '0.75rem',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 101, overflow: 'hidden', padding: '0.25rem', minWidth: '120px'
          }}>
            {options.map(opt => (
              <button
                key={opt[valueKey]}
                onClick={() => { onChange(opt[valueKey]); setOpen(false); }}
                style={{
                  width: '100%', textAlign: 'left', padding: '0.5rem 0.875rem',
                  background: opt[valueKey] === value ? '#EFF6FF' : 'transparent',
                  color: opt[valueKey] === value ? '#2563EB' : '#334155',
                  fontWeight: opt[valueKey] === value ? 700 : 500,
                  fontSize: '0.8rem', border: 'none', borderRadius: '0.5rem', cursor: 'pointer'
                }}
              >
                {opt[labelKey]}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const CustomTooltip = ({ active, payload, label, formatPrice, isCurrency }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '0.75rem', padding: '0.5rem 0.875rem', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: '90px' }}>
        <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600, marginBottom: '2px' }}>{label}</div>
        <div style={{ fontSize: '1rem', color: '#1E293B', fontWeight: 800 }}>
          {isCurrency ? formatPrice(payload[0].value) : payload[0].value}
        </div>
      </div>
    );
  }
  return null;
};

const StatisticsModule = () => {
  const { stats, extendedStats, loading, allPatients, expenses, appointments, doctors, invoices } = useData();
  const { formatPrice } = useSettings();
  
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedWeek, setSelectedWeek] = useState(0); 
  const [viewMode, setViewMode] = useState('month'); // day | week | month | annual
  const [appointmentTab, setAppointmentTab] = useState('completed'); // completed | rescheduled | cancelled

  if (loading || !stats) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4 text-slate-400">
        <Loader2 className="animate-spin" size={32} />
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Sincronizando Mando Global</span>
      </div>
    );
  }

  // Calculate Extra Financial KPIs
  const totalCuentasPorCobrar = (allPatients || []).reduce((sum, p) => sum + (p.balance || 0), 0);
  const gastosMesActual = (expenses || []).filter(e => {
    const d = new Date(e.date || e.created_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((sum, e) => sum + e.amount, 0);

  // Time-Filtered Appointment Data
  const isDateInFilter = (app) => {
    const dateStr = app.date || (app.starts_at || app.start_at)?.split('T')[0];
    if (!dateStr) return false;
    
    const [y, m, d] = dateStr.split('-').map(Number);
    const appYear = y;
    const appMonth = m - 1; // 0-indexed
    const appDate = d;

    if (viewMode === 'annual') return appYear === selectedYear;
    if (viewMode === 'month') return appYear === selectedYear && appMonth === selectedMonth;
    if (viewMode === 'week') {
      const [start, end] = WEEKS[selectedWeek].range;
      return appYear === selectedYear && appMonth === selectedMonth && appDate >= start && appDate <= end;
    }
    if (viewMode === 'day') {
      const today = new Date();
      return appYear === today.getFullYear() && appMonth === today.getMonth() && appDate === today.getDate();
    }
    return false;
  };

  const filteredAppointments = (appointments || []).filter(app => isDateInFilter(app));
  
  const completedApps = filteredAppointments.filter(a => a.status === 'completed');
  const rescheduledApps = filteredAppointments.filter(a => a.status === 'rescheduled');
  const cancelledApps = filteredAppointments.filter(a => a.status === 'cancelled');

  const absentRate = filteredAppointments.length > 0 
      ? Math.round(((rescheduledApps.length + cancelledApps.length) / filteredAppointments.length) * 100) 
      : 0;

  // Chart Data calculations based on viewMode
  const chartData = useMemo(() => {
    if (!appointments) return [];

    if (viewMode === 'annual') {
      return MONTHS_SHORT.map((m, idx) => ({
        label: m,
        value: appointments.filter(a => {
           const d = new Date(a.starts_at || a.start_at);
           return d.getFullYear() === selectedYear && d.getMonth() === idx;
        }).length
      }));
    }

    if (viewMode === 'month') {
      const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
      return Array.from({ length: daysInMonth }, (_, i) => ({
        label: String(i + 1),
        value: appointments.filter(a => {
           const d = new Date(a.starts_at || a.start_at);
           return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth && d.getDate() === (i + 1);
        }).length
      }));
    }

    if (viewMode === 'week') {
      const [start, end] = WEEKS[selectedWeek].range;
      return Array.from({ length: end - start + 1 }, (_, i) => ({
        label: String(start + i),
        value: appointments.filter(a => {
           const d = new Date(a.starts_at || a.start_at);
           return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth && d.getDate() === (start + i);
        }).length
      }));
    }

    return [];
  }, [appointments, viewMode, selectedYear, selectedMonth, selectedWeek]);

  // Secondary Chart Data (Flujo Económico Operativo) from invoices
  const invoicesByTime = useMemo(() => {
    if (!invoices) return [];
    
    // helper 
    const getInvoiceTotal = (inv) => {
      // Logic from your billing/payment structure context; simplified for sum:
      return Number(inv.amount || inv.total || 0);
    };

    if (viewMode === 'annual') {
      return MONTHS_SHORT.map((m, i) => ({
        label: m,
        total: invoices.filter(inv => {
          const d = new Date(inv.created_at || inv.date);
          return d.getFullYear() === selectedYear && d.getMonth() === i;
        }).reduce((acc, curr) => acc + getInvoiceTotal(curr), 0)
      }));
    }

    if (viewMode === 'month') {
      const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
      return Array.from({ length: daysInMonth }, (_, i) => ({
        label: String(i + 1),
        total: invoices.filter(inv => {
          const d = new Date(inv.created_at || inv.date);
          return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth && d.getDate() === (i + 1);
        }).reduce((acc, curr) => acc + getInvoiceTotal(curr), 0)
      }));
    }

    if (viewMode === 'week') {
      const [start, end] = WEEKS[selectedWeek].range;
      return Array.from({ length: end - start + 1 }, (_, i) => ({
        label: String(start + i),
        total: invoices.filter(inv => {
          const d = new Date(inv.created_at || inv.date);
          return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth && d.getDate() === (start + i);
        }).reduce((acc, curr) => acc + getInvoiceTotal(curr), 0)
      }));
    }

    return [];
  }, [viewMode, selectedMonth, selectedYear, selectedWeek, invoices]);


  const tabs = ['day', 'week', 'month', 'annual'];
  const tabLabels = { day: 'Día', week: 'Semana', month: 'Mes', annual: 'Anual' };

  // Generate extended 2x3 grid
  const kpis = [
    { label: 'Facturación Mes', val: formatPrice(stats.currentIncome || 0), change: stats.incomeTrend >= 0 ? `+${(stats.incomeTrend || 0).toFixed(1)}%` : `${(stats.incomeTrend || 0).toFixed(1)}%`, positive: stats.incomeTrend >= 0, icon: <DollarSign size={20} />, iconBg: '#ECFDF5', iconColor: '#059669' },
    { label: 'Cuentas Por Cobrar', val: formatPrice(totalCuentasPorCobrar), change: 'Deuda Global', positive: false, isLabel: true, icon: <Activity size={20} />, iconBg: '#FEF2F2', iconColor: '#DC2626' },
    { label: 'Egresos Mes', val: formatPrice(gastosMesActual), change: 'Gastos Ops', positive: false, isLabel: true, icon: <TrendingDown size={20} />, iconBg: '#F1F5F9', iconColor: '#64748B' },
    { label: 'Nuevos Pacientes', val: String(stats.newPatientsCount || 0), change: stats.newPatientsTrend >= 0 ? `+${stats.newPatientsTrend || 0}` : `${stats.newPatientsTrend || 0}`, positive: stats.newPatientsTrend >= 0, icon: <Users size={20} />, iconBg: '#EFF6FF', iconColor: '#2563EB' },
    { label: 'Conversión', val: `${stats.conversionRate || 0}%`, change: 'Agendados', positive: true, isLabel: true, icon: <Star size={20} />, iconBg: '#FFFBEB', iconColor: '#D97706' },
    { label: 'No-Show Rate', val: `${absentRate}%`, change: 'Ausentes', positive: absentRate < 20, isLabel: true, icon: <XCircle size={20} />, iconBg: '#FAF5FF', iconColor: '#9333EA' },
  ];

  const getDocName = (p) => {
    const doc = doctors.find(d => d.id === p.doctor_id);
    return doc?.full_name || doc?.name || p.doctorName || 'Sin Nombre';
  };

  const getPatientName = (p) => {
    const pat = allPatients.find(x => x.id === p.patient_id);
    return pat?.full_name || pat?.name || p.patientName || 'Paciente Anónimo';
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 mb-8">
      
      {/* Dynamic Advanced Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100/50 pb-4">
         <div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight">Visiometría Clínica</h3>
            <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Dashboard en vivo · Filtro temporal</p>
         </div>

         {/* Advanced Time Selector port from BIDashboard */}
         <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Dropdown value={selectedYear} options={YEARS.map(y => ({ label: String(y), value: y }))} onChange={setSelectedYear} />
              {(viewMode === 'month' || viewMode === 'week' || viewMode === 'day') && (
                <Dropdown value={selectedMonth} options={MONTHS_SHORT.map((m, i) => ({ label: m, value: i }))} onChange={setSelectedMonth} />
              )}
              {viewMode === 'week' && (
                <Dropdown value={selectedWeek} options={WEEKS} onChange={setSelectedWeek} />
              )}
            </div>
            
            <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block"></div>

            <div className="flex bg-slate-100 p-1 rounded-xl shadow-inner border border-slate-200/50">
               {tabs.map(tab => (
                 <button
                    key={tab}
                    onClick={() => setViewMode(tab)}
                    className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer border-none ${
                        viewMode === tab ? 'bg-primary text-white shadow-md' : 'bg-transparent text-slate-400 hover:text-slate-600'
                    }`}
                 >
                    {tabLabels[tab]}
                 </button>
               ))}
            </div>
         </div>
      </div>

      {/* Extended 3x2 KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((kpi, i) => (
          <div key={i} className="bg-white border border-slate-100 rounded-3xl p-6 flex items-center gap-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-shadow hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] group">
            <div style={{ background: kpi.iconBg, color: kpi.iconColor }} className="rounded-2xl p-4 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
              {kpi.icon}
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{kpi.label}</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-800 leading-none">{kpi.val}</span>
                {kpi.isLabel ? (
                  <span className="text-[9px] font-black text-slate-400 bg-slate-50 border border-slate-100 rounded-md px-1.5 py-0.5 uppercase tracking-tighter">
                    {kpi.change}
                  </span>
                ) : (
                  <span className={`text-[10px] font-black flex items-center gap-0.5 ${kpi.positive ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {kpi.positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {kpi.change}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Analysis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Transit BarChart */}
        <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm lg:col-span-7">
          <div className="flex items-center justify-between mb-8">
            <div className="flex flex-col">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Tránsito de Consulta</h3>
              <p className="text-xs font-bold text-slate-400 mt-1">Acorde al filtro temporal</p>
            </div>
          </div>

          <div className="w-full h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barSize={24} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} allowDecimals={false} />
                <Tooltip cursor={{ fill: '#f8fafc', radius: 8 }} content={<CustomTooltip formatPrice={formatPrice} />} />
                <Bar dataKey="value" radius={[6, 6, 6, 6]} fill="#3b82f6" fillOpacity={0.8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Citas Management Intelligence Panel */}
        <div className="bg-white border border-slate-100 rounded-3xl shadow-sm lg:col-span-5 flex flex-col overflow-hidden">
           <div className="p-6 border-b border-slate-50 flex items-center gap-3">
              <Calendar size={20} className="text-indigo-500" />
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Comportamiento Citas</h3>
           </div>
           
           <div className="flex bg-slate-50/50 p-2 gap-1 border-b border-slate-50">
              {[
                { id: 'completed', label: 'Exitosas', count: completedApps.length, textCol: 'text-emerald-600', bgAct: 'bg-emerald-100/50 border-emerald-200' },
                { id: 'rescheduled', label: 'Reagendadas', count: rescheduledApps.length, textCol: 'text-amber-600', bgAct: 'bg-amber-100/50 border-amber-200' },
                { id: 'cancelled', label: 'Canceladas', count: cancelledApps.length, textCol: 'text-rose-600', bgAct: 'bg-rose-100/50 border-rose-200' },
              ].map(tab => (
                 <button
                    key={tab.id}
                    onClick={() => setAppointmentTab(tab.id)}
                    className={`flex-1 flex flex-col items-center justify-center p-3 rounded-2xl border transition-all cursor-pointer ${
                       appointmentTab === tab.id ? tab.bgAct + ' shadow-sm scale-105 z-10' : 'border-transparent hover:bg-slate-100 grayscale opacity-60'
                    }`}
                 >
                    <span className={`text-[20px] font-black ${tab.textCol} leading-none mb-1`}>{tab.count}</span>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{tab.label}</span>
                 </button>
              ))}
           </div>

           <div className="p-2 overflow-y-auto max-h-[290px] custom-scrollbar bg-slate-50/30">
              {appointmentTab === 'completed' && completedApps.length === 0 && <p className="text-center py-10 text-xs font-bold text-slate-400">Sin citas exitosas en este rango.</p>}
              {appointmentTab === 'rescheduled' && rescheduledApps.length === 0 && <p className="text-center py-10 text-xs font-bold text-slate-400">No hay citas reagendadas.</p>}
              {appointmentTab === 'cancelled' && cancelledApps.length === 0 && <p className="text-center py-10 text-xs font-bold text-slate-400">No hay cancelaciones. ¡Excelente!</p>}
              
              {(appointmentTab === 'completed' ? completedApps : appointmentTab === 'rescheduled' ? rescheduledApps : cancelledApps).map(app => (
                 <div key={app.id} className="p-4 bg-white border border-slate-100 rounded-2xl text-left hover:border-indigo-100 transition-colors m-2">
                    <div className="flex justify-between items-start mb-2">
                       <div className="flex flex-col">
                          <span className="text-xs font-black text-slate-800">{getPatientName(app)}</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-0.5">Con. {getDocName(app)}</span>
                       </div>
                       <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-2 py-1 rounded-md uppercase">
                          {new Date(app.starts_at || app.start_at).toLocaleDateString()}
                       </span>
                    </div>
                    {app.status_reason && (
                       <div className="mt-2 p-3 bg-slate-50/80 border border-slate-100 rounded-xl flex items-start gap-2">
                          <FileText size={12} className="text-slate-400 mt-0.5 flex-shrink-0" />
                          <span className="text-[11px] font-bold text-slate-600 italic">"{app.status_reason}"</span>
                       </div>
                    )}
                 </div>
              ))}
           </div>
        </div>

      </div>

      {/* Financial Chart Full Width Area */}
      <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm col-span-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Rendimiento Económico Operativo</h3>
            <p className="text-xs font-bold text-slate-400 mt-1">Estimación de facturación global acorde al histórico de citas/pagos</p>
          </div>
          <div className="bg-emerald-50 rounded-xl px-4 py-2 border border-emerald-100 shadow-sm flex items-center gap-2">
             <DollarSign size={16} className="text-emerald-500" />
             <span className="text-sm font-black text-emerald-600">
               {formatPrice(invoicesByTime.reduce((a,b) => a + b.total, 0))}
             </span>
          </div>
        </div>

        <div className="w-full h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={invoicesByTime} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} tickFormatter={v => `$${v}`} />
              <Tooltip cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }} content={<CustomTooltip formatPrice={formatPrice} isCurrency={true} />} />
              <Area type="monotone" dataKey="total" stroke="#10B981" strokeWidth={4} fillOpacity={1} fill="url(#colorEarnings)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};

export default StatisticsModule;
