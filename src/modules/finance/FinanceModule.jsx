import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  DollarSign, CheckCircle, AlertCircle, TrendingDown, ArrowUpRight, 
  FileText, Send, Wallet, CreditCard, RefreshCw, 
  Plus, Users, Briefcase, PieChart, ShieldCheck, Clock, X, Trash2,
  Check, Loader2, User, ChevronRight, History, Receipt
} from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { useData } from '../../context/DataContext';

const FinanceModule = () => {
  const navigate = useNavigate();
  const { exchangeRate, formatPrice } = useSettings();
  const { patients, addPayment, expenses, addExpense } = useData();
  const [activeTab, setActiveTab] = useState('overview');
  const [showModal, setShowModal] = useState(null); // 'expense' | null
  const [notification, setNotification] = useState(null);
  
  const [formData, setFormData] = useState({
    amount: '', currency: 'USD', method: 'Zelle', ref: '',
    category: 'Laboratorio', description: '', provider: ''
  });

  const notify = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Calculations
  const allPayments = useMemo(() => patients.flatMap(p => p.history.map(h => ({ ...h, patientName: p.name }))), [patients]);
  const totalIngresos = useMemo(() => allPayments.reduce((acc, p) => acc + (p.currency === 'USD' ? p.amount : p.amount / exchangeRate), 0), [allPayments, exchangeRate]);
  const totalEgresos = useMemo(() => expenses.reduce((acc, e) => acc + e.amount, 0), [expenses]);
  
  // Patient Financial Analysis
  const patientFinancials = useMemo(() => {
    return patients.map(p => {
      const totalPaid = p.history.reduce((sum, pay) => sum + (pay.currency === 'USD' ? pay.amount : pay.amount / exchangeRate), 0);
      const balance = p.totalDue - totalPaid;
      return { ...p, totalPaid, balance };
    });
  }, [patients, exchangeRate]);

  const totalCuentasPorCobrar = useMemo(() => patientFinancials.reduce((acc, p) => acc + Math.max(0, p.balance), 0), [patientFinancials]);

  const stats = [
    { label: 'Cuentas por Cobrar', value: totalCuentasPorCobrar, icon: <TrendingDown />, color: 'text-rose-500', bg: 'bg-rose-50' },
    { label: 'Ingresos Totales', value: totalIngresos, icon: <ArrowUpRight />, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Diferencial Operativo', value: totalIngresos - totalEgresos, icon: <PieChart />, color: 'text-primary', bg: 'bg-blue-50' }
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

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500 pb-20 relative">
      {/* Internal Notification */}
      {notification && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[5000] px-6 py-3 bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <CheckCircle size={14} className="text-emerald-400" />
          {notification}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex gap-4 border-b border-slate-100 pb-1">
        {[
          { id: 'overview', label: 'Cuentas de Pacientes', icon: <Users size={14} /> },
          { id: 'expenses', label: 'Gastos y Compras', icon: <Briefcase size={14} /> },
          { id: 'commissions', label: 'Especialistas', icon: <PieChart size={14} /> }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 text-[10px] font-black uppercase tracking-widest transition-all border-none cursor-pointer rounded-t-xl ${activeTab === tab.id ? 'bg-white border-x border-t border-slate-100 text-primary -mb-px shadow-sm' : 'text-slate-400 hover:text-slate-600 bg-transparent'}`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats.map((stat, i) => (
              <div key={i} className="professional-card p-6 flex flex-col gap-4 border-none shadow-sm transition-all hover:shadow-md">
                 <div className="flex justify-between items-start">
                    <div className={`p-2 rounded-xl ${stat.bg} ${stat.color}`}>
                       {React.cloneElement(stat.icon, { size: 18 })}
                    </div>
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Global Analytics</span>
                 </div>
                 <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{stat.label}</span>
                    <span className="text-3xl font-black text-slate-900 tracking-tighter">
                       {formatPrice(stat.value)}
                    </span>
                 </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 professional-card p-0 overflow-hidden border-none shadow-sm bg-white">
               <div className="px-6 py-5 border-b border-slate-50 flex flex-col gap-1 bg-white">
                  <h3 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-2">
                    <History size={16} className="text-primary" /> Historial Financiero Detallado
                  </h3>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                     <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100">
                           <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Paciente</th>
                           <th className="px-6 py-4 text-center text-[9px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
                           <th className="px-6 py-4 text-right text-[9px] font-black text-slate-400 uppercase tracking-widest">Faltante</th>
                           <th className="px-6 py-4"></th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50">
                        {patientFinancials.map(pf => (
                          <tr key={pf.id} onClick={() => navigate(`/paciente/${pf.id}/estado-cuenta`)} className="hover:bg-slate-50 transition-all group cursor-pointer">
                             <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                   <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all">
                                      <User size={14} />
                                   </div>
                                   <div className="flex flex-col">
                                      <span className="text-xs font-black text-slate-700">{pf.name}</span>
                                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{pf.history.length} pagos</span>
                                   </div>
                                </div>
                             </td>
                             <td className="px-6 py-4 text-center">
                                <div className={`inline-flex items-center gap-1 text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${pf.balance <= 0 ? 'text-emerald-500 bg-emerald-50' : 'text-rose-500 bg-rose-50'}`}>
                                   {pf.balance <= 0 ? <CheckCircle size={10} /> : <AlertCircle size={10} />}
                                   {pf.balance <= 0 ? 'Solvente' : 'Con Deuda'}
                                </div>
                             </td>
                             <td className="px-6 py-4 text-right">
                                <span className={`text-[11px] font-black ${pf.balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                  {formatPrice(pf.balance)}
                                </span>
                             </td>
                             <td className="px-6 py-4 text-right">
                                <ChevronRight size={14} className="text-slate-300 group-hover:text-primary transition-colors" />
                             </td>
                          </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>

            <div className="flex flex-col gap-6">
               <div className="professional-card p-6 border-none bg-slate-900 shadow-2xl relative overflow-hidden group">
                  <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                     <Wallet size={120} className="text-white" />
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                     <ShieldCheck size={18} className="text-emerald-400" />
                     <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Estado de Fondos</span>
                  </div>
                  <div className="flex flex-col gap-2 relative z-10">
                    <span className="text-2xl font-black text-white leading-none">{formatPrice(totalIngresos)}</span>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Capital Disponible Total</p>
                  </div>
               </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'expenses' && (
        <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-2 duration-300">
          <div className="flex justify-between items-end">
            <div className="flex flex-col">
              <h2 className="text-2xl font-black text-slate-800 tracking-tighter uppercase">Egresos y Compras</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Costos operativos y adquisiciones</p>
            </div>
            <button onClick={() => setShowModal('expense')} className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-all border-none cursor-pointer shadow-lg shadow-slate-200">
               <Plus size={14} /> Registrar Gasto
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
                {expenses.map(exp => (
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

      {showModal === 'expense' && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[4000] p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex flex-col">
                <h3 className="text-lg font-black text-slate-800 tracking-tight uppercase">Registrar Gasto</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Desembolso de Caja</p>
              </div>
              <button onClick={() => setShowModal(null)} className="p-2 hover:bg-slate-200 rounded-full transition-all border-none cursor-pointer text-slate-400 bg-transparent"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleRegisterExpense} className="p-8 flex flex-col gap-5">
              <input type="text" required placeholder="Nombre del proveedor..." className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:outline-none" value={formData.provider} onChange={(e) => setFormData({...formData, provider: e.target.value})} />
              <select className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:outline-none cursor-pointer" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                <option value="Laboratorio">Laboratorio</option>
                <option value="Materiales">Materiales</option>
                <option value="Servicios">Servicios / Alquiler</option>
                <option value="Nómina">Nómina</option>
              </select>
              <div className="grid grid-cols-3 gap-2">
                 <input type="text" placeholder="Concepto..." className="col-span-2 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:outline-none" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
                 <input type="number" step="0.01" required placeholder="0.00" className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-black focus:outline-none" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} />
              </div>

              <button type="submit" className="mt-4 w-full py-4 bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-primary transition-all shadow-xl shadow-slate-200 border-none cursor-pointer">
                Confirmar Gasto
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceModule;
