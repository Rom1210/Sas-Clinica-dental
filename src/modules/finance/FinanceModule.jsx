import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  CheckCircle, TrendingDown, Wallet, Clock, TrendingUp, Plus, History
} from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { useData } from '../../context/DataContext';

// Components
import FinanceHeader from './components/FinanceHeader';
import FinanceKPIs from './components/FinanceKPIs';
import AccountsTab from './components/AccountsTab';
import ExpensesTab from './components/ExpensesTab';
import InvoicesTab from './components/InvoicesTab';
import RegisterExpenseModal from './components/RegisterExpenseModal';
import FinancialDetailModal from './components/FinancialDetailModal';
import RegisterPaymentModal from '../../components/finance/RegisterPaymentModal';

// ─── Time Filter Helpers ──────────────────────────────────────────────────
const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                 'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR - 2, CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1];

const WEEKS = [
  { label: 'Semana 1', value: 0, range: [1, 7] },
  { label: 'Semana 2', value: 1, range: [8, 14] },
  { label: 'Semana 3', value: 2, range: [15, 21] },
  { label: 'Semana 4', value: 3, range: [22, 35] },
];

const FinanceModule = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'accounts';
  const setActiveTab = (newTab) => {
    setSearchParams({ tab: newTab });
  };
  const { exchangeRate, formatPrice } = useSettings();
  const { 
    patients, addExpense, expenses: allExpensesRaw, payments: allPaymentsRaw, consultations,
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
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [notification, setNotification] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeDetail, setActiveDetail] = useState(null); 
  
  const [formData, setFormData] = useState({
    amount: '', currency: 'USD', method: 'Zelle', ref: '',
    category: 'Materiales', description: '', provider: ''
  });

  const notify = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // ─── USD Equivalent for Expenses ────────────────────────────────────────
  const usdEquivalent = useMemo(() => {
    if (!formData.amount) return 0;
    if (formData.currency === 'USD') return parseFloat(formData.amount);
    return parseFloat(formData.amount) / (exchangeRate || 45.50);
  }, [formData.amount, formData.currency, exchangeRate]);

  // ─── Filtered Data Logic ────────────────────────────────────────────────
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
    return (allExpensesRaw || []).filter(e => {
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
  }, [allExpensesRaw, viewMode, selectedYear, selectedMonth, selectedWeek]);

  const totalFilteredIncome = useMemo(() => {
    return filteredInvoices.reduce((acc, inv) => acc + (inv.total_amount || 0), 0);
  }, [filteredInvoices]);

  const totalFilteredExpenses = useMemo(() => {
     return filteredExpenses.reduce((acc, e) => {
       const amountUSD = e.amount_usd || (e.currency === 'VES' ? (e.amount / (e.exchange_rate || exchangeRate)) : e.amount);
       return acc + (parseFloat(amountUSD) || 0);
     }, 0);
  }, [filteredExpenses, exchangeRate]);

  const safeStats = globalStatsRaw || { totalIncome: 0, totalEgresos: 0, totalCuentasPorCobrar: 0 };

  const patientFinancials = useMemo(() => {
    const list = patients || [];
    if (!searchTerm) return list;
    return list.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [patients, searchTerm]);

  const statsKPI = [
    { id: 'income', label: 'Ingresos (Facturación)', value: totalFilteredIncome, icon: <TrendingUp />, color: '#059669', bg: '#ecfdf5', border: '#d1fae5', sub: 'Dinero Cobrado' },
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
      currency: formData.currency,
      exchange_rate: exchangeRate,
      amount_usd: usdEquivalent,
      date: new Date().toISOString().split('T')[0]
    });
    setShowModal(null);
    setFormData({ ...formData, amount: '', description: '', provider: '' });
    notify('Gasto registrado correctamente');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '1.5rem', color: '#94A3B8' }}>
        <TrendingUp className="animate-pulse" size={42} style={{ color: '#2563EB' }} />
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ fontSize: '0.8rem', fontWeight: 900, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0' }}>Sincronizando Finanzas</h3>
          <p style={{ fontSize: '0.65rem', fontWeight: 600, color: '#94a3b8', marginTop: '4px' }}>Cargando datos de caja y pacientes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500 pb-20 relative">
      {notification && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[5000] px-6 py-3 bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <CheckCircle size={14} className="text-emerald-400" />
          {notification}
        </div>
      )}

      <FinanceHeader 
        viewMode={viewMode} setViewMode={setViewMode}
        selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth}
        selectedYear={selectedYear} setSelectedYear={setSelectedYear}
        selectedWeek={selectedWeek} setSelectedWeek={setSelectedWeek}
        monthOptions={monthOptions} yearOptions={yearOptions}
        WEEKS={WEEKS} tabs={tabs} tabLabels={tabLabels} now={now}
        setShowModal={setShowModal} setShowPaymentModal={setShowPaymentModal}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        exchangeRate={exchangeRate}
      />

      {activeTab === 'accounts' && (
        <>
          <FinanceKPIs statsKPI={statsKPI} formatPrice={formatPrice} setActiveDetail={setActiveDetail} />
          <AccountsTab 
            patientFinancials={patientFinancials} 
            searchTerm={searchTerm} 
            setSearchTerm={setSearchTerm} 
            navigate={navigate} 
            formatPrice={formatPrice} 
          />
        </>
      )}

      {activeTab === 'expenses' && (
        <ExpensesTab 
          filteredExpenses={filteredExpenses} 
          totalFilteredExpenses={totalFilteredExpenses} 
          formatPrice={formatPrice} 
          setShowModal={setShowModal} 
          setShowPaymentModal={setShowPaymentModal} 
          exchangeRate={exchangeRate}
        />
      )}

      {activeTab === 'invoices' && (
        <InvoicesTab 
          filteredInvoices={filteredInvoices} 
          totalFilteredIncome={totalFilteredIncome} 
          formatPrice={formatPrice} 
          setShowPaymentModal={setShowPaymentModal} 
        />
      )}

      {/* Modals Section */}
      <FinancialDetailModal 
        activeDetail={activeDetail} setActiveDetail={setActiveDetail}
        filteredInvoices={filteredInvoices} filteredExpenses={filteredExpenses}
        patientFinancials={patientFinancials} totalFilteredIncome={totalFilteredIncome}
        totalFilteredExpenses={totalFilteredExpenses} safeStats={safeStats}
        formatPrice={formatPrice} navigate={navigate}
      />

      <RegisterExpenseModal 
        showModal={showModal} setShowModal={setShowModal}
        formData={formData} setFormData={setFormData}
        handleRegisterExpense={handleRegisterExpense}
        exchangeRate={exchangeRate} formatPrice={formatPrice}
        usdEquivalent={usdEquivalent}
      />

      {showPaymentModal && (
        <RegisterPaymentModal 
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedPatientId(null);
          }} 
          patientId={selectedPatientId} 
          onSuccess={() => {
            notify('Pago registrado correctamente');
            refresh?.();
          }}
        />
      )}
    </div>
  );
};

// Re-using icon for modularity
const Users = ({ size, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

export default FinanceModule;
