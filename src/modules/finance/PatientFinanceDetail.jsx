import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, User, DollarSign, Calendar, Clock, 
  CheckCircle, CheckCircle2, AlertCircle, History, Plus, X, FileText, Loader2
} from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { useData } from '../../context/DataContext';

const PatientFinanceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { exchangeRate, formatPrice } = useSettings();
  const { patients, allPatients, addPayment, payments, consultations, addInvoice, refresh } = useData();
  const [notification, setNotification] = useState(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    amount: '', currency: 'USD', method: 'Zelle', ref: ''
  });

  // Use allPatients (includes archived) so archived patients' finance page still works
  const patient = useMemo(() => (allPatients || patients).find(p => p.id === id || p.id === parseInt(id)), [allPatients, patients, id]);

  const financials = useMemo(() => {
    if (!patient) return null;
    
    const patientConsults = consultations.filter(c => c.patient_id === patient.id);
    const patientPays = payments.filter(pay => pay.patient_id === patient.id);
    
    const totalDue = patientConsults.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0);
    const totalPaid = patientPays.reduce((sum, pay) => 
      sum + (pay.currency === 'USD' ? parseFloat(pay.amount) : parseFloat(pay.amount) / exchangeRate), 0);
    
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
  }, [patient, consultations, payments, exchangeRate]);

  const handleGenerateInvoice = async () => {
    if (!financials.balance || financials.balance <= 0) {
      notify('No hay saldo pendiente para facturar.');
      return;
    }

    setInvoiceLoading(true);
    try {
      await addInvoice({
        patient_id: id,
        total_amount: financials.balance,
        status: 'pending'
      });
      notify('Factura generada exitosamente.');
      refresh(); // Refresh data to show updated invoices
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

  const handleRegisterPayment = (e) => {
    e.preventDefault();
    if (!patient) return;

    const payment = {
      amount: parseFloat(formData.amount),
      currency: formData.currency,
      method: formData.method,
      reference: formData.ref || 'Manual',
      payment_date: new Date().toISOString()
    };
    
    addPayment(patient.id, payment);
    setFormData({ ...formData, amount: '', ref: '' });
    notify('Pago registrado correctamente');
  };

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
        <button 
             onClick={handleGenerateInvoice}
             disabled={invoiceLoading || financials.balance <= 0}
             className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-all cursor-pointer shadow-sm disabled:opacity-50"
          >
             {invoiceLoading ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
             Generar Factura
          </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <div className="professional-card p-6 flex flex-col shadow-sm border-none bg-white">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Costo Total Plan</span>
                  <span className="text-2xl font-black text-slate-900 tracking-tight">{formatPrice(financials.totalDue)}</span>
               </div>
               <div className="professional-card p-6 flex flex-col shadow-sm border-none bg-emerald-50/30">
                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Total Pagado</span>
                  <span className="text-2xl font-black text-emerald-700 tracking-tight">{formatPrice(financials.totalPaid)}</span>
               </div>
               <div className="professional-card p-6 flex flex-col shadow-sm border-none bg-rose-50/30">
                  <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">Remanente</span>
                  <span className="text-2xl font-black text-rose-700 tracking-tight">{formatPrice(financials.balance)}</span>
               </div>
            </div>

            {/* History Table */}
            <div className="professional-card p-0 overflow-hidden border-none shadow-sm bg-white">
               <div className="px-6 py-5 border-b border-slate-50 bg-white">
                  <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                     <History size={14} className="text-primary" /> Transacciones Registradas
                  </h4>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                     <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100">
                           <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Fecha</th>
                           <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Vía de Pago</th>
                           <th className="px-6 py-4 text-right text-[9px] font-black text-slate-400 uppercase tracking-widest">Monto</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50">
                        {financials.history.length > 0 ? (
                           financials.history.map(pay => (
                              <tr key={pay.id} className="hover:bg-slate-50/50 transition-all">
                                 <td className="px-6 py-4 text-[11px] font-bold text-slate-600 uppercase">{pay.date}</td>
                                 <td className="px-6 py-4">
                                    <span className="text-[9px] font-black text-slate-500 px-3 py-1 bg-slate-100 rounded-full uppercase tracking-tighter">{pay.method}</span>
                                    {pay.ref && pay.ref !== 'Manual' && <span className="ml-3 text-[9px] text-slate-300 font-bold">Ref: {pay.ref}</span>}
                                 </td>
                                 <td className="px-6 py-4 text-right text-xs font-black text-slate-900">{formatPrice(pay.amount)}</td>
                              </tr>
                           ))
                        ) : (
                           <tr>
                              <td colSpan="3" className="px-6 py-12 text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">Aún no hay registros de abonos</td>
                           </tr>
                        )}
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
                       <select className="px-4 py-3.5 bg-slate-800 border border-slate-700 rounded-2xl text-[11px] font-black text-white focus:outline-none cursor-pointer" value={formData.currency} onChange={(e) => setFormData({...formData, currency: e.target.value})}>
                          <option value="USD">USD ($)</option>
                          <option value="VES">VES (Bs.)</option>
                       </select>
                    </div>
                    <div className="flex flex-col gap-2">
                       <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">Vía</label>
                       <select className="px-4 py-3.5 bg-slate-800 border border-slate-700 rounded-2xl text-[11px] font-black text-white focus:outline-none cursor-pointer" value={formData.method} onChange={(e) => setFormData({...formData, method: e.target.value})}>
                          <option value="Zelle">Zelle</option>
                          <option value="Efectivo">Efectivo</option>
                          <option value="Pago Móvil">Pago Móvil</option>
                       </select>
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
    </div>
  );
};

export default PatientFinanceDetail;
