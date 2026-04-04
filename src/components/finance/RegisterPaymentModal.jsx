import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Search, 
  DollarSign, 
  CreditCard, 
  FileText, 
  Calendar, 
  CheckCircle2, 
  ChevronDown,
  User,
  ArrowRight
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useSettings } from '../../context/SettingsContext';

const RegisterPaymentModal = ({ onClose, patientId: initialPatientId, onSuccess }) => {
  const { patients, addPayment, refresh } = useData();
  const { exchangeRate } = useSettings();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [method, setMethod] = useState('Efectivo');
  const [reference, setReference] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPatientList, setShowPatientList] = useState(false);

  // Initialize with the current patient if ID is provided
  useEffect(() => {
    if (initialPatientId && patients.length > 0) {
      const p = patients.find(p => p.id === initialPatientId);
      if (p) setSelectedPatient(p);
    }
  }, [initialPatientId, patients]);

  const filteredPatients = useMemo(() => {
    if (!searchTerm.trim()) return [];
    return patients.filter(p => 
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.dni?.includes(searchTerm)
    ).slice(0, 5);
  }, [searchTerm, patients]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPatient || !amount || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const paymentData = {
        patient_id: selectedPatient.id,
        amount: parseFloat(amount),
        currency,
        exchange_rate: exchangeRate,
        amount_usd: usdEquivalent,
        payment_method: method,
        notes: reference,
        created_at: date
      };

      await addPayment(paymentData);
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error("Error registering payment:", error);
      alert("Error al registrar el pago");
    } finally {
      setIsSubmitting(false);
    }
  };

  const usdEquivalent = currency === 'VES' ? (parseFloat(amount) || 0) / (exchangeRate || 1) : parseFloat(amount) || 0;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#0f172a]/75 backdrop-blur-[8px]" 
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="relative w-full max-w-[440px] bg-white rounded-[28px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="px-8 pt-8 pb-6 bg-white flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-tight">
              Registrar Pago
            </h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mt-1">
              Módulo de Finanzas / Control Maestro
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-5">
          {/* Patient Selector */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Paciente
            </label>
            {selectedPatient && !showPatientList ? (
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border-2 border-transparent">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <User size={16} strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-800">{selectedPatient.name}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Saldo: ${selectedPatient.balance?.toFixed(2)}</p>
                  </div>
                </div>
                {!initialPatientId && (
                  <button 
                    type="button" 
                    onClick={() => setShowPatientList(true)}
                    className="text-[10px] font-black text-blue-600 uppercase hover:underline"
                  >
                    Cambiar
                  </button>
                )}
              </div>
            ) : (
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                  <Search size={18} />
                </div>
                <input 
                  type="text"
                  placeholder="Buscar por nombre o DNI..."
                  autoFocus={showPatientList}
                  disabled={!!initialPatientId && !showPatientList}
                  className={`w-full border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl py-4 pl-12 pr-6 text-sm font-bold transition-all outline-none ${
                    initialPatientId ? 'bg-slate-100 text-slate-400' : 'bg-slate-50 text-slate-700 hover:bg-slate-100/50'
                  }`}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
                {filteredPatients.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-10">
                    {filteredPatients.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setSelectedPatient(p);
                          setShowPatientList(false);
                          setSearchTerm('');
                        }}
                        className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 text-left transition-colors"
                      >
                        <User size={16} className="text-slate-400" />
                        <div>
                          <p className="text-sm font-bold text-slate-700">{p.name}</p>
                          <p className="text-[10px] text-slate-400">{p.dni || 'Sin DNI'}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Currency Pill Selector */}
          <div className="flex bg-slate-50 p-1 rounded-2xl gap-1">
            <button
              type="button"
              onClick={() => setCurrency('USD')}
              className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                currency === 'USD' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              $ Dólares
            </button>
            <button
              type="button"
              onClick={() => setCurrency('VES')}
              className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                currency === 'VES' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              VE Bolívares
            </button>
          </div>

          <div className="grid grid-cols-1 gap-5">
            {/* Amount */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Monto</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                  <DollarSign size={18} strokeWidth={2.5} />
                </div>
                <input 
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl py-4 pl-12 pr-6 text-xl font-black text-slate-800 transition-all outline-none"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                />
                {currency === 'VES' && amount > 0 && (
                   <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-end">
                      <span className="text-[10px] font-black text-blue-600 uppercase">Aprox. ${usdEquivalent.toFixed(2)}</span>
                   </div>
                )}
              </div>
            </div>

            {/* Method */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Método de Pago</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <CreditCard size={18} strokeWidth={2.5} />
                </div>
                <select 
                  className="w-full bg-slate-50 border-2 border-transparent hover:border-slate-100 rounded-2xl py-4 pl-12 pr-10 text-sm font-bold text-slate-700 transition-all outline-none appearance-none cursor-pointer"
                  value={method}
                  onChange={e => setMethod(e.target.value)}
                >
                  <option value="Zelle">Zelle</option>
                  <option value="Efectivo">Efectivo</option>
                  <option value="Pago Móvil">Pago Móvil</option>
                  <option value="Transferencia">Transferencia</option>
                  <option value="Otros">Otros</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none">
                  <ChevronDown size={18} />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             {/* Reference */}
             <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Referencia / Nota</label>
               <div className="relative group">
                 <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                   <FileText size={16} />
                 </div>
                 <input 
                   type="text"
                   placeholder="Ref..."
                   className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl py-4 pl-10 pr-6 text-xs font-bold text-slate-700 transition-all outline-none"
                   value={reference}
                   onChange={e => setReference(e.target.value)}
                 />
               </div>
             </div>

             {/* Date */}
             <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fecha</label>
               <div className="relative group">
                 <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                   <Calendar size={16} />
                 </div>
                 <input 
                   type="date"
                   className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl py-4 pl-10 pr-4 text-xs font-bold text-slate-700 transition-all outline-none"
                   value={date}
                   onChange={e => setDate(e.target.value)}
                 />
               </div>
             </div>
          </div>

          {/* Action Button */}
          <button
            type="submit"
            disabled={!selectedPatient || !amount || isSubmitting}
            className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${
              selectedPatient && amount && !isSubmitting
              ? 'bg-[#1e293b] text-white shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:translate-y-0'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-slate-300 border-t-white rounded-full animate-spin" />
                Registrando...
              </span>
            ) : (
              <>
                Confirmar Registro de Pago
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default RegisterPaymentModal;
