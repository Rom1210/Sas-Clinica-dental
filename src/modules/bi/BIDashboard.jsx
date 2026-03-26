import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import {
  DollarSign, Users, BarChart3, TrendingUp, TrendingDown,
  ChevronDown, Send, Loader2
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
  const { stats, invoices, loading } = useData();
  const { formatPrice } = useSettings();

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedWeek, setSelectedWeek] = useState(0); // 0-3 (Semana 1-4)
  const [viewMode, setViewMode] = useState('month'); // day | week | month | annual

  const monthOptions = MONTHS.map((m, i) => ({ label: m, value: i }));
  const yearOptions = YEARS.map(y => ({ label: String(y), value: y }));
  const tabs = ['day', 'week', 'month', 'annual'];
  const tabLabels = { day: 'Día', week: 'Semana', month: 'Mes', annual: 'Anual' };

  // ─── Chart Data Generator ───────────────────────────────────────────────
  const chartData = useMemo(() => {
    if (!invoices) return [];

    const getInvoiceTotal = (inv) => inv.total_amount || 0;

    if (viewMode === 'annual') {
      return YEARS.map(year => ({
        label: String(year),
        value: invoices
          .filter(inv => new Date(inv.created_at).getFullYear() === year)
          .reduce((s, inv) => s + getInvoiceTotal(inv), 0)
      }));
    }

    if (viewMode === 'month') {
      return MONTHS_SHORT.map((m, idx) => ({
        label: m,
        value: invoices
          .filter(inv => {
            const d = new Date(inv.created_at);
            return d.getFullYear() === selectedYear && d.getMonth() === idx;
          })
          .reduce((s, inv) => s + getInvoiceTotal(inv), 0)
      }));
    }

    if (viewMode === 'week') {
      // Days of the selected week
      const [start, end] = WEEKS[selectedWeek].range;
      return Array.from({ length: end - start + 1 }, (_, i) => {
        const day = start + i;
        return {
          label: String(day),
          value: invoices
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
        value: invoices
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
  }, [viewMode, selectedMonth, selectedYear, selectedWeek]);

  const kpis = [
    {
      label: 'Ingresos Mensuales',
      val: formatPrice(stats.currentIncome),
      change: stats.incomeTrend >= 0 ? `+${stats.incomeTrend.toFixed(1)}%` : `${stats.incomeTrend.toFixed(1)}%`,
      positive: stats.incomeTrend >= 0,
      icon: <DollarSign size={20} />,
      iconBg: '#ECFDF5',
      iconColor: '#059669',
    },
    {
      label: 'Pacientes Nuevos',
      val: String(stats.newPatientsCount),
      change: stats.newPatientsTrend >= 0 ? `+${stats.newPatientsTrend}` : `${stats.newPatientsTrend}`,
      positive: stats.newPatientsTrend >= 0,
      icon: <Users size={20} />,
      iconBg: '#EFF6FF',
      iconColor: '#2563EB',
    },
    {
      label: 'Tasa de Conversión',
      val: `${stats.conversionRate}%`,
      change: 'Real',
      positive: true,
      isLabel: true,
      icon: <BarChart3 size={20} />,
      iconBg: '#F5F3FF',
      iconColor: '#7C3AED',
    },
  ];

  const handleGlobalReminders = () =>
    alert('Caza-Deudores Masivo: Bot activado para notificar a todos los pacientes con saldos pendientes.');

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
              {(viewMode === 'day' || viewMode === 'week') && (
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
              {stats.debtors.length > 0 ? stats.debtors.slice(0, 5).map((d, i) => (
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

          {/* Specialty Distribution */}
          <div style={{
            background: 'white', border: '1px solid #E2E8F0', borderRadius: '1rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)', padding: '1.25rem 1.5rem',
          }}>
            <h4 style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>
              Por Especialidad
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {stats.specialtyData.length > 0 ? stats.specialtyData.map((spec, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.775rem', fontWeight: 600, color: '#334155' }}>{spec.name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '80px', height: '6px', background: '#F1F5F9', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${spec.value}%`, background: '#2563EB', borderRadius: '999px', transition: 'width 1s ease' }} />
                    </div>
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#059669', width: '32px', textAlign: 'right' }}>
                      {spec.value}%
                    </span>
                  </div>
                </div>
              )) : (
                <div style={{ textAlign: 'center', color: '#CBD5E1', fontSize: '0.7rem', fontWeight: 700, padding: '1rem 0' }}>
                  Sin datos de consulta
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default BIDashboard;
