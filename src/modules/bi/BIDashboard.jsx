import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import {
  DollarSign, Users, BarChart3, TrendingUp, TrendingDown, Activity,
  ChevronDown, Send, Loader2, Clock, Calendar, CheckCircle, RefreshCw, XCircle, X
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useSettings } from '../../context/SettingsContext';

// ─── Helpers ────────────────────────────────────────────────────────────────
const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                 'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const MONTHS_SHORT = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR - 2, CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1];

const WEEKS = [
  { label: 'Semana 1', value: 0, range: [1, 7] },
  { label: 'Semana 2', value: 1, range: [8, 14] },
  { label: 'Semana 3', value: 2, range: [15, 21] },
  { label: 'Semana 4', value: 3, range: [22, 31] },
];

// Custom Dropdown Component
const Dropdown = ({ value, options, onChange, labelKey = 'label', valueKey = 'value', width = 130 }) => {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o[valueKey] === value);
  return (
    <div style={{ position: 'relative', width }}>
      <button
        onClick={() => setOpen(p => !p)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0.45rem 0.875rem', background: 'white', border: '1.5px solid #E2E8F0',
          borderRadius: '0.625rem', fontSize: '0.8rem', fontWeight: 600, color: '#1E293B',
          cursor: 'pointer', gap: '0.5rem', transition: 'all 0.15s',
          boxShadow: open ? '0 0 0 3px rgba(37,99,235,0.1)' : 'none',
          borderColor: open ? '#2563EB' : '#E2E8F0'
        }}
      >
        {selected?.[labelKey] || value}
        <ChevronDown size={14} style={{ color: '#94A3B8', flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
      </button>
      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 100 }}
          />
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
            background: 'white', border: '1.5px solid #E2E8F0', borderRadius: '0.75rem',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 101, overflow: 'hidden', padding: '0.25rem',
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
                  fontSize: '0.8rem', border: 'none', borderRadius: '0.5rem',
                  cursor: 'pointer', transition: 'all 0.1s',
                }}
                onMouseOver={e => { if (opt[valueKey] !== value) e.currentTarget.style.background = '#F8FAFC'; }}
                onMouseOut={e => { if (opt[valueKey] !== value) e.currentTarget.style.background = 'transparent'; }}
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

// Custom Tooltip for chart
const CustomTooltip = ({ active, payload, label, formatPrice }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'white', border: '1px solid #E2E8F0', borderRadius: '0.75rem',
        padding: '0.5rem 0.875rem', boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        minWidth: '90px'
      }}>
        <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600, marginBottom: '2px' }}>{label}</div>
        <div style={{ fontSize: '1rem', color: '#1E293B', fontWeight: 800 }}>
          {typeof payload[0].value === 'number' && payload[0].value > 5 
            ? formatPrice(payload[0].value) 
            : payload[0].value}
        </div>
      </div>
    );
  }
  return null;
};

// ─── Main Component ──────────────────────────────────────────────────────────
const BIDashboard = () => {
  const { stats, invoices, appointments, loading, updateAppointment, payments } = useData();
  const { formatPrice } = useSettings();
  const navigate = useNavigate();

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedWeek, setSelectedWeek] = useState(0); // 0-3 (Semana 1-4)
  const [viewMode, setViewMode] = useState('month'); // day | week | month | annual

  // Resolution Modal State
  const [reasonModal, setReasonModal] = useState({ isOpen: false, type: null, appId: null }); // type: 'rescheduled' | 'cancelled'
  const [reasonText, setReasonText] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const monthOptions = MONTHS.map((m, i) => ({ label: m, value: i }));
  const yearOptions = YEARS.map(y => ({ label: String(y), value: y }));
  const tabs = ['day', 'week', 'month', 'annual'];
  const tabLabels = { day: 'Día', week: 'Semana', month: 'Mes', annual: 'Anual' };

  // ─── Chart Data Generator ───────────────────────────────────────────────
  const chartData = useMemo(() => {
    const safeInvoices = invoices || [];
    const getInvoiceTotal = (inv) => inv.total_amount || 0;

    if (viewMode === 'annual') {
      return MONTHS_SHORT.map((m, idx) => ({
        label: m,
        value: safeInvoices
          .filter(inv => {
            const d = new Date(inv.created_at);
            return d.getFullYear() === selectedYear && d.getMonth() === idx;
          })
          .reduce((s, inv) => s + getInvoiceTotal(inv), 0)
      }));
    }

    if (viewMode === 'month') {
      const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
      return Array.from({ length: daysInMonth }, (_, i) => ({
        label: String(i + 1),
        value: safeInvoices
          .filter(inv => {
            const d = new Date(inv.created_at);
            return d.getFullYear() === selectedYear
              && d.getMonth() === selectedMonth
              && d.getDate() === i + 1;
          })
          .reduce((s, inv) => s + getInvoiceTotal(inv), 0)
      }));
    }

    if (viewMode === 'week') {
      const [start, end] = WEEKS[selectedWeek].range;
      return Array.from({ length: end - start + 1 }, (_, i) => {
        const day = start + i;
        return {
          label: String(day),
          value: safeInvoices
            .filter(inv => {
              const d = new Date(inv.created_at);
              return d.getFullYear() === selectedYear 
                && d.getMonth() === selectedMonth 
                && d.getDate() === day;
            })
            .reduce((s, inv) => s + getInvoiceTotal(inv), 0)
        };
      });
    }

    if (viewMode === 'day') {
      const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
      return Array.from({ length: daysInMonth }, (_, i) => ({
        label: String(i + 1),
        value: safeInvoices
          .filter(inv => {
            const d = new Date(inv.created_at);
            return d.getFullYear() === selectedYear
              && d.getMonth() === selectedMonth
              && d.getDate() === i + 1;
          })
          .reduce((s, inv) => s + getInvoiceTotal(inv), 0)
      }));
    }

    return [];
  }, [invoices, viewMode, selectedMonth, selectedYear, selectedWeek]);

  // Secondary Chart Data (Flujo de Citas Operativo)
  const appointmentTimelineData = useMemo(() => {
    if (!appointments) return [];
    
    if (viewMode === 'annual') {
      return MONTHS_SHORT.map((m, i) => ({
        label: m,
        total: appointments.filter(a => {
          const d = new Date(a.starts_at || a.start_at);
          return d.getFullYear() === selectedYear && d.getMonth() === i;
        }).length
      }));
    }

    if (viewMode === 'month') {
      const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
      return Array.from({ length: daysInMonth }, (_, i) => ({
        label: String(i + 1),
        total: appointments.filter(a => {
          const d = new Date(a.starts_at || a.start_at);
          return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth && d.getDate() === (i + 1);
        }).length
      }));
    }

    if (viewMode === 'week') {
      const [start, end] = WEEKS[selectedWeek].range;
      return Array.from({ length: end - start + 1 }, (_, i) => ({
        label: String(start + i),
        total: appointments.filter(a => {
          const d = new Date(a.starts_at || a.start_at);
          return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth && d.getDate() === (start + i);
        }).length
      }));
    }

    // day mode
    return [];
  }, [viewMode, selectedMonth, selectedYear, selectedWeek, appointments]);

  // highlightIndex
  const highlightIndex = useMemo(() => {
    if (viewMode === 'annual') return YEARS.indexOf(now.getFullYear());
    if (viewMode === 'month') return now.getMonth();
    
    const isCurrentMonthYear = now.getMonth() === selectedMonth && now.getFullYear() === selectedYear;
    if (viewMode === 'day') {
        return isCurrentMonthYear ? now.getDate() - 1 : -1;
    }
    if (viewMode === 'week') {
        const [start, end] = WEEKS[selectedWeek].range;
        if (isCurrentMonthYear && now.getDate() >= start && now.getDate() <= end) {
            return now.getDate() - start;
        }
        return -1;
    }
    return -1;
  }, [viewMode, selectedMonth, selectedYear, selectedWeek, now]);

  const upcomingAppointments = useMemo(() => {
    if (!appointments) return [];
    const nw = new Date();
    return [...appointments]
      .filter(a => new Date(a.starts_at || a.start_at) > nw && a.status === 'scheduled')
      .sort((a, b) => new Date(a.starts_at || a.start_at) - new Date(b.starts_at || b.start_at));
  }, [appointments]);

  const pastUnresolvedAppointments = useMemo(() => {
    if (!appointments) return [];
    const nw = new Date();
    return [...appointments]
      .filter(a => new Date(a.starts_at || a.start_at) < nw && a.status === 'scheduled')
      .sort((a, b) => new Date(b.starts_at || b.start_at) - new Date(a.starts_at || a.start_at));
  }, [appointments]);

  const handleStatusUpdate = async (appId, newStatus, reason = null) => {
    if (!appId) return;
    setIsUpdating(true);
    try {
      await updateAppointment(appId, { 
        status: newStatus,
        status_reason: reason 
      });
      setReasonModal({ isOpen: false, type: null, appId: null });
      setReasonText('');
    } catch (error) {
       console.error("Error updating status:", error);
       alert("Hubo un error al actualizar la cita.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleGlobalReminders = () => {
    // Implement global reminders logic or leave empty for now
    console.log("Global reminders triggered");
    alert("Función de recordatorios globales próximamente disponible");
  };

  const kpis = [
    {
      label: 'Ingresos Mensuales',
      val: formatPrice(stats?.currentIncome || 0),
      change: (stats?.incomeTrend || 0) >= 0 ? `+${(stats?.incomeTrend || 0).toFixed(1)}%` : `${(stats?.incomeTrend || 0).toFixed(1)}%`,
      positive: (stats?.incomeTrend || 0) >= 0,
      icon: <DollarSign size={20} />,
      iconBg: '#ECFDF5',
      iconColor: '#059669',
    },
    {
      label: 'Pacientes Nuevos',
      val: String(stats?.newPatientsCount || 0),
      change: (stats?.newPatientsTrend || 0) >= 0 ? `+${stats?.newPatientsTrend || 0}` : `${stats?.newPatientsTrend || 0}`,
      positive: (stats?.newPatientsTrend || 0) >= 0,
      icon: <Users size={20} />,
      iconBg: '#EFF6FF',
      iconColor: '#2563EB',
    },
    {
      label: 'Tasa de Conversión',
      val: `${stats?.conversionRate || 0}%`,
      change: 'Real',
      positive: true,
      isLabel: true,
      icon: <BarChart3 size={20} />,
      iconBg: '#F5F3FF',
      iconColor: '#7C3AED',
    },
  ];



  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '16rem', gap: '1rem', color: '#94A3B8' }}>
        <Loader2 className="animate-spin" size={36} />
        <span style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Sincronizando Dashboard…
        </span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', animation: 'fadeIn 0.4s ease' }}>

      {/* ── KPI CARDS ────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        {kpis.map((kpi, i) => (
          <div key={i} style={{
            background: 'white', border: '1px solid #E2E8F0', borderRadius: '1rem',
            padding: '1.5rem 1.75rem', display: 'flex', alignItems: 'center', gap: '1rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)', transition: 'box-shadow 0.2s',
          }}
            onMouseOver={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'}
            onMouseOut={e => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'}
          >
            <div style={{
              background: kpi.iconBg, color: kpi.iconColor,
              borderRadius: '0.75rem', padding: '0.75rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              {kpi.icon}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {kpi.label}
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.25rem' }}>
                <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>
                  {kpi.val}
                </span>
                {kpi.isLabel ? (
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94A3B8', border: '1px solid #E2E8F0', borderRadius: '999px', padding: '1px 7px' }}>
                    {kpi.change}
                  </span>
                ) : (
                  <span style={{
                    fontSize: '0.7rem', fontWeight: 700,
                    color: kpi.positive ? '#059669' : '#DC2626',
                    display: 'flex', alignItems: 'center', gap: '2px'
                  }}>
                    {kpi.positive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                    {kpi.change}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── MAIN CHART BLOCK + SIDEBAR ────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1rem', alignItems: 'start' }}>

        {/* Chart Card */}
        <div style={{
          background: 'white', border: '1px solid #E2E8F0', borderRadius: '1rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)', padding: '1.5rem 1.75rem',
        }}>
          {/* Chart Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                Distribución por Casos
              </h3>
              <p style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 500, marginTop: '0.2rem' }}>
                Resumen gráfico de actividad clínica
              </p>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              
              {/* Conditional Selectors */}
              {(viewMode === 'day' || viewMode === 'week' || viewMode === 'month') && (
                <Dropdown value={selectedMonth} options={monthOptions} onChange={setSelectedMonth} width={130} />
              )}
              
              {viewMode === 'week' && (
                <Dropdown value={selectedWeek} options={WEEKS} onChange={setSelectedWeek} width={130} />
              )}

              <Dropdown value={selectedYear} options={yearOptions} onChange={setSelectedYear} width={90} />

              {/* View Mode Tabs */}
              <div style={{
                display: 'flex', background: '#F1F5F9', borderRadius: '0.625rem',
                padding: '3px', gap: '1px',
              }}>
                {tabs.map(tab => (
                  <button
                    key={tab}
                    onClick={() => { setViewMode(tab); if(tab === 'month') setSelectedMonth(now.getMonth()); }}
                    style={{
                      padding: '0.35rem 0.75rem', borderRadius: '0.5rem', border: 'none',
                      fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer',
                      background: viewMode === tab ? '#2563EB' : 'transparent',
                      color: viewMode === tab ? 'white' : '#64748B',
                      transition: 'all 0.2s', letterSpacing: '0.02em',
                      boxShadow: viewMode === tab ? '0 2px 6px rgba(37,99,235,0.3)' : 'none',
                    }}
                  >
                    {tabLabels[tab]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Bar Chart */}
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barSize={viewMode === 'day' ? 10 : (viewMode === 'week' ? 40 : 32)} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 600 }}
                  interval={viewMode === 'day' ? 2 : 0}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 600 }}
                  tickFormatter={(v) => {
                    if (v === 0) return '0';
                    if (v >= 1000) return `$${(v / 1000).toFixed(1)}k`;
                    return `$${v}`;
                  }}
                  width={45}
                  domain={[0, 'auto']}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ fill: '#F8FAFC', radius: 6 }}
                  content={<CustomTooltip formatPrice={formatPrice} />}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {chartData.map((_, idx) => (
                    <Cell
                      key={idx}
                      fill={idx === highlightIndex ? '#2563EB' : '#BFDBFE'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Secondary Analytical Graph (Flujo de Citas) */}
          <div style={{
            background: 'white', border: '1px solid #E2E8F0', borderRadius: '1rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)', padding: '1.5rem',
            minHeight: '340px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#1E293B', margin: 0, letterSpacing: '-0.02em' }}>
                  Flujo Operativo
                </h3>
                <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94A3B8', margin: '0.25rem 0 0 0' }}>
                  Volumen de citas programadas en el tiempo
                </p>
              </div>
              <div style={{ background: '#F8FAFC', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Activity size={14} color="#3B82F6" />
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#334155' }}>
                  {appointmentTimelineData.reduce((acc, curr) => acc + curr.total, 0)} TOTALES
                </span>
              </div>
            </div>

            <div style={{ width: '100%', height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={appointmentTimelineData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis 
                    dataKey="label" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 700 }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 700 }} 
                    allowDecimals={false}
                  />
                  <Tooltip 
                    cursor={{ stroke: '#CBD5E1', strokeWidth: 1, strokeDasharray: '4 4' }} 
                    contentStyle={{ borderRadius: '0.75rem', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontWeight: 800 }}
                  />
                  <Area type="monotone" dataKey="total" stroke="#3B82F6" strokeWidth={4} fillOpacity={1} fill="url(#colorTotal)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Caza-Deudores */}
          <div style={{
            background: 'white', border: '1px solid #E2E8F0', borderRadius: '1rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)', padding: '1.25rem 1.5rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444', animation: 'pulse 2s infinite' }} />
                <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Caza-Deudores Live
                </span>
              </div>
              <button
                onClick={handleGlobalReminders}
                style={{ padding: '0.4rem', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '0.5rem', cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center', transition: 'all 0.15s' }}
                onMouseOver={e => { e.currentTarget.style.background = '#EFF6FF'; e.currentTarget.style.color = '#2563EB'; }}
                onMouseOut={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = '#64748B'; }}
              >
                <Send size={14} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {(stats?.debtors || []).length > 0 ? (stats?.debtors || []).slice(0, 5).map((d, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1E293B' }}>{d.name}</div>
                    <div style={{ fontSize: '0.65rem', fontWeight: 600, color: d.balance > 500 ? '#EF4444' : '#94A3B8', marginTop: '1px' }}>
                      {new Date(d.lastMovement).toLocaleDateString()}
                    </div>
                  </div>
                  <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#DC2626' }}>
                    {formatPrice(d.balance)}
                  </span>
                </div>
              )) : (
                <div style={{ textAlign: 'center', padding: '1.5rem 0', color: '#CBD5E1', fontSize: '0.7rem', fontWeight: 700 }}>
                  ✓ Sin deudas pendientes
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Appointments */}
          <div style={{
            background: 'white', border: '1px solid #E2E8F0', borderRadius: '1rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)', padding: '1.25rem 1.5rem',
          }}>
            <h4 style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>
              PRÓXIMAS CITAS
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {upcomingAppointments.length > 0 ? upcomingAppointments.slice(0, 3).map((app, i) => (
                <div 
                  key={i} 
                  onClick={() => navigate(`/scheduler/appointment/${app.id}`)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', padding: '0.25rem', borderRadius: '0.5rem', transition: 'background 0.2s' }}
                  onMouseOver={e => e.currentTarget.style.background = '#F8FAFC'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#F8FAFC', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Calendar size={16} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {app.patient?.full_name || app.patient?.first_name || app.patientName || 'Paciente'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '1px' }}>
                      <Clock size={10} style={{ color: '#2563EB' }} />
                      <span style={{ fontSize: '0.65rem', fontWeight: 600, color: '#64748B' }}>
                        {new Date(app.starts_at || app.start_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {app.doctor?.full_name?.split(' ')[0] || app.doctorName || 'Dr.'}
                      </span>
                    </div>
                  </div>
                </div>
              )) : (
                <div style={{ textAlign: 'center', padding: '1rem 0', color: '#CBD5E1', fontSize: '0.7rem', fontWeight: 700 }}>
                  ✕ Sin citas programadas
                </div>
              )}
              {upcomingAppointments.length > 3 && (
                <button
                  onClick={() => navigate('/scheduler')}
                  style={{ 
                    marginTop: '0.5rem', width: '100%', padding: '0.5rem', background: '#F8FAFC', border: '1px solid #E2E8F0', 
                    borderRadius: '0.5rem', color: '#64748B', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s' 
                  }}
                  onMouseOver={e => { e.currentTarget.style.background = '#EFF6FF'; e.currentTarget.style.color = '#2563EB'; }}
                  onMouseOut={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = '#64748B'; }}
                >
                  Y {upcomingAppointments.length - 3} MÁS
                </button>
              )}
            </div>
          </div>

          {/* Past Unresolved Appointments (Citas No Controladas) */}
          <div style={{
            background: 'white', border: '1px dashed #CBD5E1', borderRadius: '1rem',
            padding: '1.25rem 1.5rem',
          }}>
            <h4 style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>
              CITAS NO CONTROLADAS
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {pastUnresolvedAppointments.length > 0 ? Object.values(
                // Max 4 visible
                pastUnresolvedAppointments.slice(0, 4)
              ).map((app, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                     <div 
                        onClick={() => navigate(`/scheduler/appointment/${app.id}`)}
                        style={{ display: 'flex', flexDirection: 'column', cursor: 'pointer' }}
                     >
                       <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1E293B', textDecoration: 'underline decoration-dotted decoration-slate-300' }}>
                          {app.patient?.full_name || app.patient?.first_name || app.patientName || 'Paciente'}
                       </span>
                       <span style={{ fontSize: '0.65rem', fontWeight: 600, color: '#94A3B8' }}>
                          {new Date(app.starts_at || app.start_at).toLocaleDateString()}
                       </span>
                     </div>
                  </div>
                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      onClick={() => handleStatusUpdate(app.id, 'completed')}
                      disabled={isUpdating}
                      style={{ flex: 1, padding: '0.35rem 0', background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '0.4rem', color: '#059669', fontSize: '0.6rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.2rem', cursor: 'pointer', transition: 'all 0.15s' }}
                      onMouseOver={e => e.currentTarget.style.background = '#10B981'}
                      onMouseOut={e => e.currentTarget.style.background = '#ECFDF5'}
                    >
                      <CheckCircle size={10} /> Exitosa
                    </button>
                    <button 
                      onClick={() => setReasonModal({ isOpen: true, type: 'rescheduled', appId: app.id })}
                      disabled={isUpdating}
                      style={{ flex: 1, padding: '0.35rem 0', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '0.4rem', color: '#D97706', fontSize: '0.6rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.2rem', cursor: 'pointer', transition: 'all 0.15s' }}
                      onMouseOver={e => e.currentTarget.style.background = '#F59E0B'}
                      onMouseOut={e => e.currentTarget.style.background = '#FFFBEB'}
                    >
                      <RefreshCw size={10} /> Reagendada
                    </button>
                    <button 
                      onClick={() => setReasonModal({ isOpen: true, type: 'cancelled', appId: app.id })}
                      disabled={isUpdating}
                      style={{ flex: 1, padding: '0.35rem 0', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '0.4rem', color: '#DC2626', fontSize: '0.6rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.2rem', cursor: 'pointer', transition: 'all 0.15s' }}
                      onMouseOver={e => e.currentTarget.style.background = '#EF4444'}
                      onMouseOut={e => e.currentTarget.style.background = '#FEF2F2'}
                    >
                      <XCircle size={10} /> Cancelada
                    </button>
                  </div>
                </div>
              )) : (
                <div style={{ textAlign: 'center', padding: '1rem 0', color: '#94A3B8', fontSize: '0.7rem', fontWeight: 700 }}>
                  ✓ Sin citas rezagadas
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Reason Modal Port */}
      {reasonModal.isOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '2rem', width: '100%', maxWidth: '32rem', padding: '2rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', animation: 'fadeIn 0.2s ease' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                   <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#1E293B', margin: 0 }}>
                     {reasonModal.type === 'rescheduled' ? 'Motivo del Reagendamiento' : 'Motivo de Cancelación'}
                   </h2>
                   <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', margin: 0 }}>
                     Escribe detalladamente por qué el paciente modificó excepcionalmente esta orden.
                   </p>
                </div>
                <button onClick={() => setReasonModal({ isOpen: false, type: null, appId: null })} style={{ padding: '0.5rem', background: '#F8FAFC', color: '#94A3B8', border: 'none', borderRadius: '50%', cursor: 'pointer', transition: 'background 0.2s' }}>
                   <X size={18} />
                </button>
             </div>
             
             <textarea 
                autoFocus
                style={{ width: '100%', outline: 'none', resize: 'none', height: '8rem', background: '#F8FAFC', border: '2px solid #F1F5F9', borderRadius: '1rem', padding: '1rem', fontSize: '0.875rem', fontWeight: 700, color: '#334155', transition: 'border-color 0.2s', boxSizing: 'border-box' }}
                placeholder="Ejemplo: Se le olvidó la cita, Problemas económicos, Viaje imprevisto..."
                value={reasonText}
                onChange={e => setReasonText(e.target.value)}
             />
             
             <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button 
                   onClick={() => setReasonModal({ isOpen: false, type: null, appId: null })}
                   style={{ padding: '0.75rem 1.5rem', fontWeight: 900, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748B', background: 'transparent', border: 'none', borderRadius: '0.75rem', cursor: 'pointer', transition: 'background 0.2s' }}
                >
                   Atrás
                </button>
                <button 
                   disabled={isUpdating || reasonText.trim().length === 0}
                   onClick={() => handleStatusUpdate(reasonModal.appId, reasonModal.type, reasonText)}
                   style={{ padding: '0.75rem 2rem', fontWeight: 900, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'white', background: reasonModal.type === 'rescheduled' ? '#F59E0B' : '#EF4444', border: 'none', borderRadius: '0.75rem', cursor: 'pointer', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'transform 0.1s', opacity: (isUpdating || reasonText.trim().length === 0) ? 0.5 : 1 }}
                >
                   Finalizar
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BIDashboard;
