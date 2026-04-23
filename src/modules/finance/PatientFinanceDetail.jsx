import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, User, DollarSign, Calendar, Clock, 
  CheckCircle, CheckCircle2, AlertCircle, History, Plus, X, FileText, Loader2
} from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { useData } from '../../context/DataContext';
import { generateReceiptPDF, generateStatementPDF } from '../../services/PdfService';

const PatientFinanceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { exchangeRate, formatPrice, clinicName } = useSettings();
  const { 
    patients, 
    allPatients, 
    addPayment, 
    payments, 
    paymentMethods,
    consultations, 
    appointments,
    addInvoice, 
    addPaymentMethod,
    refresh,
    loading
  } = useData();
  const [notification, setNotification] = useState(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    amount: '', currency_code: 'USD', payment_method_id: '', ref: ''
  });
  
  // Date/Time split logic
  const now = new Date();
  const [day, setDay] = useState(now.getDate());
  const [month, setMonth] = useState(now.getMonth());
  const [time, setTime] = useState(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));

  const MONTHS = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
  ];
  
  // States for the High-Fidelity Modal
  const [showMethodModal, setShowMethodModal] = useState(false);
  const [newMethod, setNewMethod] = useState({ name: '', type: 'other' });

  // Set default method when methods load
  useEffect(() => {
    if (paymentMethods.length > 0 && !formData.payment_method_id) {
      setFormData(prev => ({ ...prev, payment_method_id: paymentMethods[0].id }));
    }
  }, [paymentMethods]);

  // Use allPatients (includes archived) so archived patients' finance page still works
  const patient = useMemo(() => (allPatients || patients).find(p => p.id === id || p.id === parseInt(id)), [allPatients, patients, id]);

  const getAppointmentCost = (notes) => {
    if (!notes || !notes.includes('Total: $')) return 0;
    try {
      const parts = notes.split('Total: $');
      if (parts.length > 1) {
        return parseFloat(parts[1].trim().split(' ')[0].replace(',', '')) || 0;
      }
    } catch (e) {}
    return 0;
  };

  const financials = useMemo(() => {
    if (!patient) return null;
    
    const patientConsults = consultations.filter(c => String(c.patient_id) === String(patient.id));
    const patientPays = payments.filter(pay => String(pay.patient_id) === String(patient.id));
    const patientApps = appointments.filter(a => String(a.patient_id) === String(patient.id));
    
    const now = new Date();
    const consTotal = patientConsults.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0);
    const appsTotal = patientApps
      .filter(a => new Date(a.starts_at || a.start_at) <= now)
      .reduce((sum, a) => sum + getAppointmentCost(a.notes), 0);
    
    const totalDue = consTotal + appsTotal;
    const totalPaid = patientPays.reduce((sum, pay) => {
      if (pay.amount_usd) return sum + parseFloat(pay.amount_usd);
      const curr = pay.currency_code || pay.currency || 'USD';
      return sum + (curr === 'USD' ? parseFloat(pay.amount) : parseFloat(pay.amount) / (exchangeRate || 45.50));
    }, 0);
    
    const balance = totalDue - totalPaid;
    
    return { 
      ...patient, 
      name: patient.name,
      totalDue,
      totalPaid, 
      balance,
      history: patientPays.map(p => ({
        ...p,
        date: new Date(p.payment_date || p.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }),
        method: p.method,
        amount: parseFloat(p.amount),
        ref: p.reference
      })).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    };
  }, [patient, consultations, payments, appointments, exchangeRate]);

  const handleGenerateInvoice = async () => {
    if (!financials.balance || financials.balance <= 0) {
      notify('No hay saldo pendiente para facturar.');
      return;
    }
    
    setInvoiceLoading(true);
    try {
      const invoiceData = {
        patient_id: patient.id,
        total_amount: financials.balance,
        status: 'pending'
      };
      await addInvoice(patient.id, invoiceData);
      notify('Factura generada exitosamente.');
    } catch (err) {
      notify('Error al generar factura: ' + err.message);
    } finally {
      setInvoiceLoading(false);
    }
  };

  const notify = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleRegisterPayment = async (e) => {
    e.preventDefault();
    if (!formData.amount) return;
    
    try {
      // Combined date construction
      const currentYear = new Date().getFullYear();
      const combinedDate = new Date(currentYear, month, day);
      const [hours, minutes] = time.split(':');
      combinedDate.setHours(parseInt(hours), parseInt(minutes));

      const selectedMethod = paymentMethods.find(m => String(m.id) === String(formData.payment_method_id));
      const amountUSD = formData.currency_code === 'USD' ? parseFloat(formData.amount) : parseFloat(formData.amount) / (exchangeRate || 1);
      
      const payment = {
        amount: parseFloat(formData.amount),
        currency_code: formData.currency_code,
        exchange_rate: exchangeRate,
        amount_usd: amountUSD,
        payment_method_id: formData.payment_method_id,
        method: selectedMethod?.name || 'Otro',
        reference: formData.ref || 'Manual',
        payment_date: combinedDate.toISOString(),
        created_at: combinedDate.toISOString()
      };
      
      await addPayment(patient.id, payment);
      setFormData({ ...formData, amount: '', ref: '' });
      notify('Pago registrado correctamente');
    } catch (err) {
      notify('Error al registrar pago: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <Loader2 className="animate-spin text-primary" size={48} />
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cargando datos financieros...</span>
      </div>
    );
  }

  if (!financials) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <div className="text-slate-400 font-black uppercase tracking-widest">Paciente no encontrado</div>
        <button onClick={() => navigate('/finance')} className="btn btn-primary flex items-center gap-2">
          <ArrowLeft size={16} /> Volver a Finanzas
        </button>
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

      {/* Header with Navigation */}
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-50">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate('/finance')}
            className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-all border-none cursor-pointer"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
               <User size={28} />
            </div>
            <div className="flex flex-col">
               <h3 className="text-2xl font-black text-slate-800 tracking-tighter uppercase">{financials.name}</h3>
               <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado de Cuenta Individual</span>
                  <div className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${financials.balance <= 0 ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                    {financials.balance <= 0 ? 'Solvente' : 'Pendiente de Pago'}
                  </div>
               </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <button 
             onClick={() => generateStatementPDF(financials, financials.history, exchangeRate, clinicName)}
             className="btn bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest"
           >
             <FileText size={16} /> Exportar PDF
           </button>
           <button 
             onClick={handleGenerateInvoice}
             disabled={invoiceLoading}
             className="btn bg-slate-900 text-white hover:bg-slate-800 flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-200 border-none cursor-pointer"
           >
             {invoiceLoading ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />} Generar Factura
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
         <div className="lg:col-span-2 flex flex-col gap-8">
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="professional-card bg-white p-8 border-none shadow-sm flex flex-col gap-2 rounded-[2rem]">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Costo Total Plan</span>
                  <div className="flex items-baseline gap-1">
                     <span className="text-3xl font-black text-slate-800 tracking-tighter">{formatPrice(financials.totalDue)}</span>
                  </div>
               </div>
               <div className="professional-card bg-white p-8 border-none shadow-sm flex flex-col gap-2 rounded-[2rem]">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Pagado</span>
                  <div className="flex items-baseline gap-1">
                     <span className="text-3xl font-black text-emerald-600 tracking-tighter">{formatPrice(financials.totalPaid)}</span>
                  </div>
               </div>
               <div className="professional-card bg-white p-8 border-none shadow-sm flex flex-col gap-2 rounded-[2rem]">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Remanente</span>
                  <div className="flex items-baseline gap-1">
                     <span className={`text-3xl font-black tracking-tighter ${financials.balance > 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                        {formatPrice(financials.balance)}
                     </span>
                  </div>
               </div>
            </div>

            {/* Transaction History */}
            <div className="professional-card bg-white p-0 border-none shadow-sm overflow-hidden rounded-[2rem]">
               <div className="p-8 pb-4 border-b border-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <History size={16} />
                     </div>
                     <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-800 m-0">Transacciones Registradas</h4>
                  </div>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                     <thead className="bg-slate-50/50">
                        <tr>
                           <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Fecha</th>
                           <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Vía de Pago</th>
                           <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Monto</th>
                           <th className="px-8 py-4"></th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50">
                        {financials.history.length === 0 ? (
                           <tr>
                              <td colSpan="4" className="px-8 py-16 text-center text-slate-400 font-bold uppercase text-[10px]">Sin movimientos registrados</td>
                           </tr>
                        ) : financials.history.map((pay) => (
                           <tr key={pay.id} className="hover:bg-slate-50 transition-all group">
                              <td className="px-8 py-5">
                                 <span className="text-[11px] font-black text-slate-700 uppercase">{pay.date}</span>
                              </td>
                              <td className="px-8 py-5 text-center">
                                 <span className="px-3 py-1 bg-slate-100 rounded-full text-[9px] font-black text-slate-500 uppercase">
                                    {pay.method || 'Efectivo'}
                                 </span>
                              </td>
                              <td className="px-8 py-5 text-right">
                                 <div className="flex flex-col items-end">
                                    <span className="text-sm font-black text-slate-800">{formatPrice(pay.amount_usd || pay.amount)}</span>
                                    {pay.currency_code === 'VES' && (
                                       <span className="text-[9px] font-black text-slate-400">USD</span>
                                    )}
                                 </div>
                              </td>
                              <td className="px-8 py-5 text-right">
                                 <button 
                                    onClick={() => generateReceiptPDF(patient, pay, exchangeRate, clinicName)}
                                    className="p-2 rounded-xl text-slate-300 hover:text-primary hover:bg-primary/5 transition-all opacity-0 group-hover:opacity-100 border-none bg-transparent cursor-pointer"
                                 >
                                    <FileText size={16} />
                                 </button>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
         </div>

         <div className="flex flex-col gap-6">
            <div className="professional-card p-8 border-none bg-slate-900 text-white shadow-2xl flex flex-col gap-6 rounded-[2rem]">
               <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 mb-1">
                     <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                     <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Nuevo Cobro</span>
                  </div>
                  <h4 className="text-lg font-black uppercase tracking-tight text-white">Registrar Ingreso</h4>
                  <p className="text-[10px] text-slate-500 font-bold">Entrada a cuenta corriente del paciente</p>
               </div>

               <form onSubmit={handleRegisterPayment} className="flex flex-col gap-5 relative z-10">
                  <div className="flex flex-col gap-2">
                     <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">Monto Recibido</label>
                     <div className="relative">
                        <input 
                          type="number" step="0.01" required placeholder="0.00" 
                          className="w-full px-6 py-4 bg-slate-800 border border-slate-700 rounded-2xl text-xl font-black text-white focus:outline-none focus:ring-4 focus:ring-primary/20 transition-all pl-12" 
                          value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} 
                        />
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 text-lg font-black">$</span>
                     </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                       <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">Moneda</label>
                       <select 
                          className="px-4 py-3.5 bg-slate-800 border border-slate-700 rounded-2xl text-[11px] font-black text-white focus:outline-none cursor-pointer" 
                          value={formData.currency_code} 
                          onChange={(e) => setFormData({...formData, currency_code: e.target.value})}
                       >
                          <option value="USD">USD ($)</option>
                          <option value="VES">VES (Bs.)</option>
                       </select>
                    </div>
                    <div className="flex flex-col gap-2">
                       <div className="flex justify-between items-center ml-1">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Vía</label>
                          <button 
                             type="button"
                             onClick={() => setShowMethodModal(true)}
                             className="text-[9px] font-black text-primary uppercase hover:underline border-none bg-transparent cursor-pointer"
                          >
                             + Añadir
                          </button>
                       </div>
                       <select 
                          className="px-4 py-3.5 bg-slate-800 border border-slate-700 rounded-2xl text-[11px] font-black text-white focus:outline-none cursor-pointer" 
                          value={formData.payment_method_id} 
                          onChange={(e) => setFormData({...formData, payment_method_id: e.target.value})}
                       >
                          {paymentMethods.length > 0 ? (
                            paymentMethods.slice().sort((a, b) => {
                              const priorities = { 'Efectivo': 1, 'Zelle': 2, 'Transferencia': 3, 'Pago Móvil': 4 };
                              const pa = priorities[a.name] || 99;
                              const pb = priorities[b.name] || 99;
                              if (pa !== pb) return pa - pb;
                              return a.name.localeCompare(b.name);
                            }).filter(m => m.is_active).map(m => (
                              <option key={m.id} value={m.id}>{m.name}</option>
                            ))
                          ) : (
                            <option value="">Cargando métodos...</option>
                          )}
                       </select>
                    </div>
                  </div>

                  {/* Date Grid Refined (Image 5 Logic) */}
                  <div className="grid grid-cols-3 gap-2">
                     <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Día</label>
                        <select 
                          className="w-full px-3 py-3 bg-slate-800 border border-slate-700 rounded-xl text-[11px] font-black text-white outline-none appearance-none cursor-pointer focus:border-primary/50"
                          value={day}
                          onChange={e => setDay(parseInt(e.target.value))}
                        >
                          {Array.from({ length: 31 }, (_, i) => (
                            <option key={i+1} value={i+1}>{i+1}</option>
                          ))}
                        </select>
                     </div>
                     <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Mes</label>
                        <select 
                          className="w-full px-3 py-3 bg-slate-800 border border-slate-700 rounded-xl text-[11px] font-black text-white outline-none appearance-none cursor-pointer focus:border-primary/50"
                          value={month}
                          onChange={e => setMonth(parseInt(e.target.value))}
                        >
                          {MONTHS.map((m, i) => (
                            <option key={m} value={i}>{m}</option>
                          ))}
                        </select>
                     </div>
                     <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Hora</label>
                        <input 
                          type="time"
                          className="w-full px-3 py-3 bg-slate-800 border border-slate-700 rounded-xl text-[11px] font-black text-white outline-none focus:border-primary/50"
                          value={time}
                          onChange={e => setTime(e.target.value)}
                        />
                     </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">Referencia</label>
                    <input type="text" placeholder="Ej: #9403, Transferencia..." className="px-6 py-4 bg-slate-800 border border-slate-700 rounded-2xl text-[11px] font-bold text-white focus:outline-none" value={formData.ref} onChange={(e) => setFormData({...formData, ref: e.target.value})} />
                  </div>

                  <button type="submit" className="mt-2 w-full py-4 bg-primary text-white text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-blue-600 transition-all shadow-xl shadow-primary/20 border-none cursor-pointer flex items-center justify-center gap-3">
                     <CheckCircle size={16} /> Confirmar Ingreso
                  </button>
               </form>
            </div>
         </div>
      </div>

      {/* HIGH-FIDELITY ADD METHOD MODAL (matches image 3) */}
      {showMethodModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div style={{ background: '#fff', borderRadius: '2rem', padding: '2.5rem', maxWidth: '440px', width: '100%', boxShadow: '0 25px 60px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <h3 style={{ fontSize: '1.15rem', fontBlack: 900, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '-0.02em', margin: 0, fontWeight: 900 }}>Añadir Método de Pago</h3>
               <button onClick={() => setShowMethodModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><Plus size={24} style={{ transform: 'rotate(45deg)' }} /></button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
               <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nombre del Método</label>
               <input 
                  type="text" 
                  placeholder="Ej: Binance, Cashea, Zinli..." 
                  style={{ padding: '1rem 1.25rem', borderRadius: '1rem', border: '1px solid #e2e8f0', outline: 'none', fontSize: '0.9rem', fontWeight: 600, color: '#1e293b' }}
                  value={newMethod.name}
                  onChange={(e) => setNewMethod({ ...newMethod, name: e.target.value })}
               />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
               <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Categoría</label>
               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                  {[
                     { id: 'cash', label: 'Efectivo' },
                     { id: 'transfer', label: 'Transf.' },
                     { id: 'other', label: 'Otro' }
                  ].map(t => (
                     <button
                        key={t.id}
                        type="button"
                        onClick={() => setNewMethod({ ...newMethod, type: t.id })}
                        style={{
                           padding: '0.75rem', borderRadius: '0.875rem', border: '1px solid',
                           borderColor: newMethod.type === t.id ? '#2563EB' : '#e2e8f0',
                           background: newMethod.type === t.id ? '#eff6ff' : '#fff',
                           color: newMethod.type === t.id ? '#2563EB' : '#64748b',
                           fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer',
                           transition: 'all 0.2s'
                        }}
                     >
                        {t.label}
                     </button>
                  ))}
               </div>
            </div>

            <button 
               type="button"
               onClick={async () => {
                  if (newMethod.name) {
                     const created = await addPaymentMethod(newMethod);
                     setFormData({ ...formData, payment_method_id: created.id });
                     setNewMethod({ name: '', type: 'other' });
                     setShowMethodModal(false);
                     notify('Vía de pago añadida correctamente');
                  }
               }}
               style={{ 
                 padding: '1.25rem', background: '#2563EB', color: '#fff', 
                 fontSize: '0.85rem', fontWeight: 900, textTransform: 'uppercase', 
                 borderRadius: '1.25rem', border: 'none', cursor: 'pointer', 
                 marginTop: '0.5rem', boxShadow: '0 10px 25px rgba(37,99,235,0.3)',
                 letterSpacing: '0.05em'
               }}
            >
               Confirmar y Guardar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientFinanceDetail;
