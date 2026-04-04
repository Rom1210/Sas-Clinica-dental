import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  DollarSign, CheckCircle, AlertCircle, TrendingDown, ArrowUpRight, 
  FileText, Send, Wallet, CreditCard, RefreshCw, 
  Plus, Users, Briefcase, PieChart, ShieldCheck, Clock, X, Trash2,
  Check, Loader2, User, ChevronRight, History, Receipt, TrendingUp, Minus, Search
} from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { useData } from '../../context/DataContext';
import { ChevronDown, Calendar as CalendarIcon } from 'lucide-react';

// ─── Time Filter Helpers ──────────────────────────────────────────────────
const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                 'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR - 2, CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1];

const WEEKS = [
  { label: 'Semana 1', value: 0, range: [1, 7] },
  { label: 'Semana 2', value: 1, range: [8, 14] },
  { label: 'Semana 3', value: 2, range: [15, 21] },
  { label: 'Semana 4', value: 3, range: [22, 35] }, // Up to end of month
];

// Custom Dropdown Component (SmartDental Style)
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
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {selected?.[labelKey] || value}
        </span>
        <ChevronDown size={14} style={{ color: '#94A3B8', flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 100 }} />
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


const FinanceModule = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'accounts';
  const setActiveTab = (newTab) => {
    setSearchParams({ tab: newTab });
  };
  const { exchangeRate, formatPrice } = useSettings();
  const { 
    patients, addPayment, expenses: allExpensesRaw, addExpense, payments: allPaymentsRaw, consultations,
    invoices, addInvoice, refresh, stats: globalStatsRaw, loading 
  } = useData();

  // TimeTravel Filters State
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedWeek, setSelectedWeek] = useState(0); 
  const [viewMode, setViewMode] = useState('month'); // day | week | month | annual

  const monthOptions = MONTHS.map((m, i) => ({ label: m, value: i }));
  const yearOptions = YEARS.map(y => ({ label: String(y), value: y }));
  const tabs = ['day', 'week', 'month', 'annual'];
  const tabLabels = { day: 'Día', week: 'Semana', month: 'Mes', annual: 'Anual' };

  const [showModal, setShowModal] = useState(null); // 'expense' | null
  const [notification, setNotification] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeDetail, setActiveDetail] = useState(null); // 'income' | 'expenses' | 'receivables' | 'net' | null
  
  const [formData, setFormData] = useState({
    amount: '', currency: 'USD', method: 'Zelle', ref: '',
    category: 'Laboratorio', description: '', provider: ''
  });

  const notify = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Financial Safety Guards
  const safePayments = allPaymentsRaw || [];
  const safeExpenses = allExpensesRaw || [];
  const safeStats = globalStatsRaw || { totalIncome: 0, totalEgresos: 0, totalCuentasPorCobrar: 0 };

  // Filtered Invoices & Expenses Logic
  const filteredInvoices = useMemo(() => {
    return (invoices || []).filter(inv => {
      const d = new Date(inv.created_at);
      if (viewMode === 'annual') return d.getFullYear() === selectedYear;
      if (viewMode === 'month') return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
      if (viewMode === 'week') {
         const [start, end] = WEEKS[selectedWeek].range;
         return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth && (d.getDate() >= start && d.getDate() <= end);
      }
      if (viewMode === 'day') {
         const today = new Date();
         return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
      }
      return true;
    });
  }, [invoices, viewMode, selectedYear, selectedMonth, selectedWeek]);

  const filteredExpenses = useMemo(() => {
    return safeExpenses.filter(e => {
      const d = new Date(e.date);
      if (viewMode === 'annual') return d.getFullYear() === selectedYear;
      if (viewMode === 'month') return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
      if (viewMode === 'week') {
         const [start, end] = WEEKS[selectedWeek].range;
         return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth && (d.getDate() >= start && d.getDate() <= end);
      }
      if (viewMode === 'day') {
         const today = new Date();
         return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
      }
      return true;
    });
  }, [safeExpenses, viewMode, selectedYear, selectedMonth, selectedWeek]);

  const totalFilteredIncome = useMemo(() => {
    return filteredInvoices.reduce((acc, inv) => acc + (inv.total_amount || 0), 0);
  }, [filteredInvoices]);

  const totalFilteredExpenses = useMemo(() => {
     return filteredExpenses.reduce((acc, e) => acc + e.amount, 0);
  }, [filteredExpenses]);

  // Restore Patient Financials logic
  const SYSTEM_NAME_PATTERNS = ['bloqueo de agenda', 'test realtime', 'test'];
  const patientFinancials = (patients || []).filter(p => {
    if (p.status === 'archived') return false;
    const nameLower = (p.name || '').toLowerCase();
    if (nameLower === 'paciente') return false;
    if (SYSTEM_NAME_PATTERNS.some(pattern => nameLower.includes(pattern))) return false;
    if (searchTerm && !nameLower.includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  // Derived Stats based on filter
  const statsKPI = [
    { id: 'income', label: 'Ingresos Totales', value: totalFilteredIncome, icon: <TrendingUp />, color: '#16a34a', bg: '#f0fdf4', border: '#dcfce7', sub: 'Calculado' },
    { id: 'expenses', label: 'Egresos Totales', value: totalFilteredExpenses, icon: <TrendingDown />, color: '#dc2626', bg: '#fff1f2', border: '#ffe4e6', sub: 'Gastos periodo' },
    { id: 'receivables', label: 'Por Cobrar', value: safeStats.totalCuentasPorCobrar, icon: <Clock />, color: '#d97706', bg: '#fffbeb', border: '#fef3c7', sub: 'Saldos pacientes' },
    { id: 'net', label: 'Balance Neto', value: totalFilteredIncome - totalFilteredExpenses, icon: <Wallet />, color: '#2563EB', bg: '#eff6ff', border: '#dbeafe', sub: 'Diferencial' }
  ];

  const handleRegisterExpense = (e) => {
    e.preventDefault();
    addExpense({
      category: formData.category,
      provider: formData.provider,
      description: formData.description,
      amount: parseFloat(formData.amount),
      date: new Date().toISOString().split('T')[0]
    });
    setShowModal(null);
    setFormData({ ...formData, amount: '', description: '', provider: '' });
    notify('Gasto registrado correctamente');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '1.5rem', color: '#94A3B8' }}>
        <Loader2 className="animate-spin" size={42} style={{ color: '#2563EB' }} />
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ fontSize: '0.8rem', fontWeight: 900, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0' }}>Sincronizando Finanzas</h3>
          <p style={{ fontSize: '0.65rem', fontWeight: 600, color: '#94a3b8', marginTop: '4px' }}>Cargando datos de caja y pacientes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500 pb-20 relative">
      {/* Internal Notification */}
      {notification && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[5000] px-6 py-3 bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <CheckCircle size={14} className="text-emerald-400" />
          {notification}
        </div>
      )}


      {/* TimeTravel Filter Section (Matching BIDashboard Style) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px', marginBottom: '8px' }}>
         <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <h2 className="text-2xl font-black text-slate-800 tracking-tighter uppercase leading-none">Finanzas</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Gestión de caja y balance operativo</p>
         </div>

         <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {(viewMode === 'day' || viewMode === 'week' || viewMode === 'month') && (
              <Dropdown value={selectedMonth} options={monthOptions} onChange={setSelectedMonth} width={130} />
            )}
            
            {viewMode === 'week' && (
              <Dropdown value={selectedWeek} options={WEEKS} onChange={setSelectedWeek} width={130} />
            )}

            <Dropdown value={selectedYear} options={yearOptions} onChange={setSelectedYear} width={90} />

            {/* View Mode Tabs Pill Shape */}
            <div style={{
              display: 'flex', background: '#F1F5F9', borderRadius: '0.8rem',
              padding: '4px', gap: '2px',
            }}>
              {tabs.map(tab => (
                <button
                  key={tab}
                  onClick={() => { setViewMode(tab); if(tab === 'month') setSelectedMonth(now.getMonth()); }}
                  style={{
                    padding: '0.45rem 1rem', borderRadius: '0.625rem', border: 'none',
                    fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
                    background: viewMode === tab ? '#2563EB' : 'transparent',
                    color: viewMode === tab ? 'white' : '#64748B',
                    transition: 'all 0.2s', letterSpacing: '0.02em',
                    boxShadow: viewMode === tab ? '0 4px 10px rgba(37,99,235,0.2)' : 'none',
                  }}
                >
                  {tabLabels[tab]}
                </button>
              ))}
            </div>
         </div>
      </div>

      {activeTab === 'accounts' && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
            {statsKPI.map((stat, i) => (
              <div 
                key={i} 
                onClick={() => setActiveDetail(stat.id)}
                className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer"
                style={{ 
                  padding: '18px 20px', 
                  background: 'white',
                  borderRadius: '24px',
                  border: '1px solid #f1f5f9',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.01)'
                }}
              >
                <div className="relative z-10 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                      style={{ background: stat.bg, color: stat.color, border: `1px solid ${stat.border}` }}
                    >
                      {React.cloneElement(stat.icon, { size: 18 })}
                    </div>
                    <div className="flex flex-col items-end">
                       <span className="text-[9px] font-black uppercase tracking-[0.1em]" style={{ color: stat.color, opacity: 0.8 }}>{stat.sub}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                    <p className="text-xl font-black tracking-tight text-slate-800">
                      {formatPrice(stat.value)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="professional-card p-0 overflow-hidden border-none shadow-sm bg-white">
             <div style={{ padding: '32px 40px', borderBottom: '1px solid #f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', flexWrap: 'wrap', gap: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(37, 99, 235, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <History size={16} style={{ color: '#2563EB' }} /> 
                    </div>
                    <h3 style={{ fontSize: '14px', fontWeight: 900, color: '#1e293b', margin: 0, letterSpacing: '-0.02em' }}>Historial Financiero Detallado</h3>
                  </div>
                  <p style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0 44px' }}>Resumen de saldos activos por paciente</p>
                </div>

                {/* Search Bar Perfect Centering */}
                <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '9999px', padding: '10px 20px', width: '280px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', transition: 'all 0.2s' }}>
                  <Search size={14} style={{ color: '#94a3b8', flexShrink: 0 }} />
                  <input 
                    type="text" 
                    placeholder="Buscar paciente..."
                    style={{ background: 'transparent', border: 'none', outline: 'none', marginLeft: '12px', fontSize: '11px', fontWeight: 700, color: '#334155', width: '100%', padding: 0 }}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead>
                      <tr className="bg-slate-50/30 border-b border-slate-100/50">
                         <th style={{ padding: '20px 40px', fontSize: '9px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Paciente</th>
                         <th style={{ padding: '20px 24px', textAlign: 'center', fontSize: '9px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Estado Financiero</th>
                         <th style={{ padding: '20px 24px', textAlign: 'center', fontSize: '9px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Saldo Pendiente</th>
                         <th style={{ padding: '20px 40px' }}></th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50/50">
                      {patientFinancials.length === 0 ? (
                        <tr>
                          <td colSpan="4" style={{ padding: '64px 40px', textAlign: 'center' }}>
                            <div className="flex flex-col items-center gap-4">
                              <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center">
                                <Users size={24} className="text-slate-200" />
                              </div>
                              <p className="text-xs font-black text-slate-300 uppercase tracking-widest">No se encontraron pacientes{searchTerm ? ' para esta búsqueda' : ''}</p>
                            </div>
                          </td>
                        </tr>
                      ) : patientFinancials.map(pf => (
                        <tr key={pf.id} onClick={() => navigate(`/paciente/${pf.id}/estado-cuenta`)} className="hover:bg-slate-50/80 transition-all group cursor-pointer">
                           <td style={{ padding: '20px 40px' }}>
                              <div className="flex items-center gap-4">
                                 <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all duration-300 shrink-0">
                                    <User size={16} />
                                 </div>
                                 <div className="flex flex-col">
                                     <span className="text-sm font-black text-slate-700 group-hover:text-primary transition-colors">{pf.name}</span>
                                     <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                                       {pf.paymentCount > 0 ? `${pf.paymentCount} pago${pf.paymentCount !== 1 ? 's' : ''} registrado${pf.paymentCount !== 1 ? 's' : ''}` : 'Sin pagos aún'}
                                     </span>
                                  </div>
                              </div>
                           </td>
                           <td style={{ padding: '20px 24px', textAlign: 'center' }}>
                              <div style={{ 
                                display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '7px', fontWeight: 900, textTransform: 'uppercase', 
                                padding: '4px 10px', borderRadius: '9999px', width: 'fit-content',
                                border: pf.balance <= 0 ? '1px solid #d1fae5' : '1px solid #ffe4e6',
                                backgroundColor: pf.balance <= 0 ? '#ecfdf5' : '#fff1f2',
                                color: pf.balance <= 0 ? '#059669' : '#e11d48'
                              }}>
                                 {pf.balance <= 0 ? <CheckCircle size={10} strokeWidth={3} /> : <AlertCircle size={10} strokeWidth={3} />}
                                 {pf.balance <= 0 ? 'Solvente' : 'Con Deuda'}
                              </div>
                           </td>
                            <td style={{ padding: '20px 24px', textAlign: 'center' }}>
                               <span style={{ fontSize: '13px', fontWeight: 900, letterSpacing: '-0.02em', color: pf.balance > 0 ? '#e11d48' : '#059669' }}>
                                  {formatPrice(pf.balance)}
                               </span>
                            </td>
                           <td style={{ padding: '20px 40px', textAlign: 'right' }}>
                              <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-50 text-slate-300 group-hover:bg-primary group-hover:text-white transition-all transform group-hover:translate-x-1">
                                <ChevronRight size={16} />
                              </div>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        </>
      )}

      {activeTab === 'expenses' && (
        <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-2 duration-300">
          <div className="flex justify-between items-center bg-rose-50 px-6 py-4 rounded-2xl border border-rose-100/50">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center">
                <TrendingDown className="text-rose-600" size={18} />
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-rose-400 uppercase tracking-widest mb-0.5">Gasto del Periodo</span>
                <span className="text-2xl font-black text-rose-600 tracking-tighter">-{formatPrice(totalFilteredExpenses)}</span>
              </div>
            </div>
            <button onClick={() => setShowModal('expense')} className="flex items-center gap-2 px-6 py-3 bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-rose-700 transition-all border-none cursor-pointer shadow-lg shadow-rose-200">
               <Plus size={14} /> Registrar Nuevo Gasto
            </button>
          </div>

          <div className="professional-card p-0 overflow-hidden border-none shadow-sm bg-white">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Fecha / Proveedor</th>
                  <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Concepto</th>
                  <th className="px-6 py-4 text-right text-[9px] font-black text-slate-400 uppercase tracking-widest">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center">
                          <Receipt size={22} className="text-slate-300" />
                        </div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Sin egresos registrados</p>
                        <p className="text-[10px] text-slate-300 font-medium">Registra un gasto usando el botón de arriba</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredExpenses.slice().reverse().map(exp => (
                  <tr key={exp.id} className="hover:bg-slate-50 transition-all">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter mb-0.5">{exp.date}</span>
                        <span className="text-xs font-bold text-slate-700">{exp.provider}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[11px] font-medium text-slate-600 block">{exp.description}</span>
                      <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 mt-1 inline-block bg-slate-100 px-2 py-0.5 rounded">{exp.category}</span>
                    </td>
                    <td className="px-6 py-4 text-right text-xs font-black text-rose-600">-{formatPrice(exp.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'invoices' && (
        <div className="flex flex-col gap-6 animate-in slide-in-from-right-2 duration-300">
          <div className="flex justify-between items-end">
            <div className="flex flex-col">
              <h2 className="text-2xl font-black text-slate-800 tracking-tighter uppercase">Facturación</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Documentos y comprobantes fiscales</p>
            </div>
          </div>

          <div className="professional-card p-0 overflow-hidden border-none shadow-sm bg-white">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Nº Factura / Fecha</th>
                  <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Paciente</th>
                  <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
                  <th className="px-6 py-4 text-right text-[9px] font-black text-slate-400 uppercase tracking-widest">Monto Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
               {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center">
                          <FileText size={22} className="text-slate-300" />
                        </div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Sin facturas emitidas</p>
                        <p className="text-[10px] text-slate-300 font-medium">Las facturas generadas desde consultas aparecerán aquí</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredInvoices.slice().reverse().map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50 transition-all cursor-pointer group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-slate-700">{inv.invoice_number}</span>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">{new Date(inv.created_at).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-slate-700">{inv.patientName}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${inv.status === 'paid' ? 'text-emerald-500 bg-emerald-50' : 'text-amber-500 bg-amber-50'}`}>
                        {inv.status === 'paid' ? 'Pagada' : 'Pendiente'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-xs font-black text-slate-900">{formatPrice(inv.total_amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}


      {/* Detail Modal Refined with React Portal to fix layering/transparency */}
      {activeDetail && createPortal(
        <div 
          style={{ 
            position: 'fixed', 
            inset: 0, 
            backgroundColor: 'rgba(15, 23, 42, 0.75)', 
            backdropFilter: 'blur(8px)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            zIndex: 99999, 
            padding: '24px' 
          }}
          onClick={() => setActiveDetail(null)}
        >
          <div 
            style={{ 
              backgroundColor: 'white', 
              borderRadius: '28px', 
              width: '100%', 
              maxWidth: '440px', 
              maxHeight: '85vh', 
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)', 
              display: 'flex', 
              flexDirection: 'column', 
              overflow: 'hidden',
              animation: 'modalEnter 0.3s ease-out'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header Premium */}
            <div style={{ padding: '40px 40px 24px 40px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#1e293b', margin: 0, letterSpacing: '-0.02em' }}>
                    {statsKPI.find(s => s.id === activeDetail)?.label}
                  </h3>
                  <p style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', uppercase: 'true', textTransform: 'uppercase', letterSpacing: '0.15em', margin: 0 }}>
                    {activeDetail === 'income' ? 'Historial de pagos' : 
                     activeDetail === 'expenses' ? 'Desglose de gastos' : 
                     activeDetail === 'receivables' ? 'Cuentas pendientes' : 'Resumen de balance'}
                  </p>
               </div>
               <button 
                onClick={() => setActiveDetail(null)}
                style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', border: 'none', cursor: 'pointer' }}
               >
                 <X size={16} />
               </button>
            </div>

            {/* Modal Content - Scrollable List */}
            <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '0 40px 24px 40px' }}>
               {activeDetail === 'income' && (
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {filteredInvoices.length === 0 ? (
                      <div style={{ padding: '80px 0', textAlign: 'center', color: '#cbd5e1', fontWeight: 900, textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.15em', lineHeight: '1.6' }}>No hay ingresos<br/>registrados en este periodo</div>
                    ) : filteredInvoices.slice().reverse().map((inv, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid #f8fafc' }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '12px', backgroundColor: '#f8fafc', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                               <Plus size={14} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                               <span style={{ fontSize: '13px', fontWeight: 900, color: '#334155' }}>{inv.patientName}</span>
                               <span style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Factura #{inv.invoice_number} • {new Date(inv.created_at).toLocaleDateString()}</span>
                            </div>
                         </div>
                         <span style={{ fontSize: '14px', fontWeight: 900, color: '#059669', letterSpacing: '-0.02em' }}>+{formatPrice(inv.total_amount)}</span>
                      </div>
                    ))}
                 </div>
               )}

               {activeDetail === 'expenses' && (
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {filteredExpenses.length === 0 ? (
                      <div style={{ padding: '80px 0', textAlign: 'center', color: '#cbd5e1', fontWeight: 900, textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.15em', lineHeight: '1.6' }}>No hay egresos<br/>registrados en este periodo</div>
                    ) : filteredExpenses.slice().reverse().map((e, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid #f8fafc' }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '12px', backgroundColor: '#f8fafc', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                               <TrendingDown size={14} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                               <span style={{ fontSize: '13px', fontWeight: 900, color: '#334155' }}>{e.provider || 'Proveedor'}</span>
                               <span style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>{e.category} • {e.date}</span>
                            </div>
                         </div>
                         <span style={{ fontSize: '14px', fontWeight: 900, color: '#e11d48', letterSpacing: '-0.02em' }}>-{formatPrice(e.amount)}</span>
                      </div>
                    ))}
                 </div>
               )}

               {activeDetail === 'receivables' && (
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {patientFinancials.filter(pf => pf.balance > 0).length === 0 ? (
                      <div style={{ padding: '80px 0', textAlign: 'center', color: '#cbd5e1', fontWeight: 900, textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.15em', lineHeight: '1.6' }}>Todo está al día.<br/>No hay deudas activas.</div>
                    ) : patientFinancials.filter(pf => pf.balance > 0).map((pf, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid #f8fafc' }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '12px', backgroundColor: '#fff1f2', color: '#e11d48', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                               <AlertCircle size={14} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                               <span style={{ fontSize: '13px', fontWeight: 900, color: '#334155' }}>{pf.name}</span>
                               <button 
                                onClick={() => { setActiveDetail(null); navigate(`/paciente/${pf.id}/estado-cuenta`); }}
                                style={{ background: 'none', border: 'none', padding: 0, textAlign: 'left', color: '#2563eb', fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', cursor: 'pointer', letterSpacing: '0.05em' }}
                              >
                                 Ver estado de cuenta
                              </button>
                            </div>
                         </div>
                         <span style={{ fontSize: '14px', fontWeight: 900, color: '#e11d48', letterSpacing: '-0.02em' }}>{formatPrice(pf.balance)}</span>
                      </div>
                    ))}
                 </div>
               )}

               {activeDetail === 'net' && (
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingTop: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                       <div style={{ padding: '20px', backgroundColor: '#f8fafc', borderRadius: '20px', border: '1px solid #f1f5f9' }}>
                          <span style={{ fontSize: '9px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '8px' }}>Ingresos</span>
                          <span style={{ fontSize: '20px', fontWeight: 900, color: '#059669', letterSpacing: '-0.02em' }}>{formatPrice(totalFilteredIncome)}</span>
                       </div>
                       <div style={{ padding: '20px', backgroundColor: '#f8fafc', borderRadius: '20px', border: '1px solid #f1f5f9' }}>
                          <span style={{ fontSize: '9px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '8px' }}>Egresos</span>
                          <span style={{ fontSize: '20px', fontWeight: 900, color: '#e11d48', letterSpacing: '-0.02em' }}>-{formatPrice(totalFilteredExpenses)}</span>
                       </div>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                       <h4 style={{ fontSize: '9px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 4px 4px' }}>Métodos de Pago (Estimado)</h4>
                        {['Zelle', 'Efectivo', 'Pago Móvil', 'Transferencia'].map(method => {
                         const amount = filteredInvoices.filter(inv => inv.method === method).reduce((acc, inv) => acc + (inv.total_amount || 0), 0);
                         return (
                           <div key={method} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f8fafc' }}>
                             <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>{method}</span>
                             <span style={{ fontSize: '12px', fontWeight: 900, color: '#1e293b' }}>{formatPrice(amount)}</span>
                           </div>
                         );
                       })}
                    </div>
                 </div>
               )}
            </div>

            {/* Modal Footer Premium */}
            <div style={{ padding: '16px 40px 40px 40px', backgroundColor: 'white' }}>
               <button 
                onClick={() => setActiveDetail(null)}
                style={{ 
                  width: '100%', 
                  padding: '16px 0', 
                  backgroundColor: '#1e293b', 
                  color: 'white', 
                  fontSize: '11px', 
                  fontWeight: 900, 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.2em', 
                  borderRadius: '16px', 
                  border: 'none', 
                  cursor: 'pointer',
                  boxShadow: '0 10px 25px -5px rgba(30, 41, 59, 0.3)'
                }}
               >
                 Cerrar Detalle
               </button>
            </div>
          </div>
        </div>,
         document.body
      )}

      {/* Modal Registrar Gasto Premium */}
      {showModal === 'expense' && createPortal(
         <div 
          onClick={() => setShowModal(null)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', animation: 'fadeIn 0.3s ease' }}
        >
          <div 
            onClick={e => e.stopPropagation()}
            style={{ width: '100%', maxWidth: '440px', backgroundColor: 'white', borderRadius: '32px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden', animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}
          >
            <div style={{ padding: '40px 40px 0 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#1e293b', margin: 0, letterSpacing: '-0.02em' }}>Nuevo Gasto</h3>
                  <p style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.15em', margin: 0 }}>Salida de caja menor</p>
               </div>
               <button 
                onClick={() => setShowModal(null)}
                style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', border: 'none', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleRegisterExpense} style={{ padding: '32px 40px 40px 40px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '9px', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginLeft: '4px' }}>Categoría</label>
                  <select 
                    required
                    style={{ padding: '14px 20px', borderRadius: '16px', border: '1.5px solid #f1f5f9', backgroundColor: '#f8fafc', fontSize: '13px', fontWeight: 700, color: '#334155', outline: 'none' }}
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                  >
                    <option value="Materiales">Materiales Dentales</option>
                    <option value="Servicios">Servicios Públicos</option>
                    <option value="Mantenimiento">Mantenimiento</option>
                    <option value="Sueldos">Sueldos / Honorarios</option>
                    <option value="Papelería">Papelería</option>
                    <option value="Otros">Otros Gastos</option>
                  </select>
               </div>

               <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '9px', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginLeft: '4px' }}>Proveedor</label>
                  <input 
                    required
                    type="text" 
                    placeholder="Ej. Depósito Dental"
                    style={{ padding: '14px 20px', borderRadius: '16px', border: '1.5px solid #f1f5f9', backgroundColor: '#f8fafc', fontSize: '13px', fontWeight: 700, color: '#334155', outline: 'none' }}
                    value={formData.provider}
                    onChange={(e) => setFormData({...formData, provider: e.target.value})}
                  />
               </div>

               <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '9px', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginLeft: '4px' }}>Monto ($)</label>
                  <input 
                    required
                    type="number" 
                    step="0.01"
                    placeholder="0.00"
                    style={{ padding: '14px 20px', borderRadius: '16px', border: '1.5px solid #f1f5f9', backgroundColor: '#f8fafc', fontSize: '20px', fontWeight: 900, color: '#1e293b', outline: 'none' }}
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  />
               </div>

               <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '9px', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginLeft: '4px' }}>Descripción</label>
                  <textarea 
                    placeholder="Breve descripción del gasto..."
                    rows={2}
                    style={{ padding: '14px 20px', borderRadius: '16px', border: '1.5px solid #f1f5f9', backgroundColor: '#f8fafc', fontSize: '13px', fontWeight: 700, color: '#334155', outline: 'none', resize: 'none' }}
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
               </div>

               <button 
                type="submit"
                style={{ marginTop: '10px', padding: '18px 0', borderRadius: '18px', border: 'none', backgroundColor: '#e11d48', color: 'white', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', cursor: 'pointer', boxShadow: '0 10px 25px -5px rgba(225, 29, 72, 0.3)' }}
              >
                Guardar Gasto
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default FinanceModule;
