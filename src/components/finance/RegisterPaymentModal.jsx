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
  Plus
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useSettings } from '../../context/SettingsContext';

const RegisterPaymentModal = ({ onClose, patientId: initialPatientId, onSuccess }) => {
  const { patients, addPayment, refresh, paymentMethods, addPaymentMethod } = useData();
  const { exchangeRate } = useSettings();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [method, setMethod] = useState('');
  const [reference, setReference] = useState('');
  
  // Date/Time split logic
  const now = new Date();
  const [day, setDay] = useState(now.getDate());
  const [month, setMonth] = useState(now.getMonth()); // 0-indexed
  const [time, setTime] = useState(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPatientList, setShowPatientList] = useState(false);

  // Quick Add State
  const [showMethodModal, setShowMethodModal] = useState(false);
  const [newMethod, setNewMethod] = useState({ name: '', type: 'other' });

  const MONTHS = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // Initialize with the current patient if ID is provided
  useEffect(() => {
    if (initialPatientId && patients.length > 0) {
      const p = patients.find(p => p.id === initialPatientId);
      if (p) setSelectedPatient(p);
    }
  }, [initialPatientId, patients]);

  // Set default method
  useEffect(() => {
    if (paymentMethods.length > 0 && !method) {
      setMethod(paymentMethods[0].name);
    }
  }, [paymentMethods]);

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
      // Reconstruct full date
      const currentYear = new Date().getFullYear();
      const combinedDate = new Date(currentYear, month, day);
      const [hours, minutes] = time.split(':');
      combinedDate.setHours(parseInt(hours), parseInt(minutes));

      const paymentData = {
        patient_id: selectedPatient.id,
        amount: parseFloat(amount),
        currency,
        exchange_rate: exchangeRate,
        amount_usd: usdEquivalent,
        payment_method: method,
        notes: reference,
        created_at: combinedDate.toISOString()
      };

      await addPayment(selectedPatient.id, paymentData);
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

  const sortedMethods = useMemo(() => {
    return [...paymentMethods].sort((a, b) => {
      const priorities = { 'Efectivo': 1, 'Zelle': 2, 'Transferencia': 3, 'Pago Móvil': 4 };
      const pa = priorities[a.name] || 99;
      const pb = priorities[b.name] || 99;
      if (pa !== pb) return pa - pb;
      return a.name.localeCompare(b.name);
    }).filter(m => m.is_active);
  }, [paymentMethods]);

  return createPortal(
    <div 
      onClick={onClose}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#0f172a]/70 backdrop-blur-[12px] animate-in fade-in duration-300"
    >
      <div 
        onClick={e => e.stopPropagation()}
        className="w-full max-w-[480px] bg-slate-900 rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.6)] overflow-hidden animate-in zoom-in-95 duration-500 border border-slate-800"
      >
        <div className="p-10 pb-0 flex items-center justify-between">
           <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 mb-1">
                 <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                 <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Nuevo Cobro</span>
              </div>
              <h3 className="text-2xl font-black text-white m-0 tracking-tighter uppercase">Registrar Ingreso</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest m-0">Entrada a cuenta corriente del paciente</p>
           </div>
           <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 border-none cursor-pointer hover:bg-slate-700 transition-all shadow-inner"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 flex flex-col gap-6">
          
          {/* Patient Selection (if not provided) */}
          {!initialPatientId && (
            <div className="flex flex-col gap-2 relative">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Paciente</label>
              <div className="relative">
                <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input 
                  type="text" 
                  placeholder="Buscar por nombre..."
                  className="w-full pl-11 pr-4 py-4 bg-slate-800 border border-slate-700 rounded-2xl text-[13px] font-bold text-white outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all placeholder:text-slate-600"
                  value={selectedPatient ? selectedPatient.name : searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    if (selectedPatient) setSelectedPatient(null);
                    setShowPatientList(true);
                  }}
                  onFocus={() => setShowPatientList(true)}
                />
                {selectedPatient && (
                  <button 
                    onClick={() => { setSelectedPatient(null); setSearchTerm(''); }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 border-none bg-transparent cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              
              {showPatientList && filteredPatients.length > 0 && !selectedPatient && (
                <div className="absolute top-full left-0 right-0 mt-3 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-700/50">
                  {filteredPatients.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      className="w-full text-left px-5 py-3 hover:bg-slate-700/50 flex items-center justify-between group transition-all"
                      onClick={() => {
                        setSelectedPatient(p);
                        setShowPatientList(false);
                      }}
                    >
                      <div className="flex flex-col">
                        <span className="text-[12px] font-black text-slate-300 group-hover:text-white">{p.name}</span>
                        <span className="text-[9px] text-slate-500 font-bold uppercase">{p.dni || 'S/D'}</span>
                      </div>
                      <Plus size={12} className="text-slate-600 group-hover:text-blue-500" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Amount and Currency */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center px-1">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Monto Recibido</label>
              <div className="flex gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
                {['USD', 'VES'].map(curr => (
                  <button
                    key={curr}
                    type="button"
                    onClick={() => setCurrency(curr)}
                    className={`text-[8px] font-black px-3 py-1 rounded-lg transition-all border-none cursor-pointer ${currency === curr ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    {curr}
                  </button>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-600">
                {currency === 'USD' ? '$' : 'Bs'}
              </div>
              <input 
                required
                type="number" step="0.01" placeholder="0.00"
                className="w-full pl-14 pr-6 py-5 bg-slate-800 border border-slate-700 rounded-3xl text-3xl font-black text-white outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all placeholder:text-slate-700"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            {currency === 'VES' && amount && (
              <div className="flex justify-between items-center px-5 py-3 bg-blue-500/5 rounded-2xl border border-blue-500/10">
                <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Equivalente Aproximado</span>
                <span className="text-sm font-black text-blue-400">${usdEquivalent.toFixed(2)} USD</span>
              </div>
            )}
          </div>

          {/* Date Grid Refined (Image 5 Logic) */}
          <div className="grid grid-cols-3 gap-3">
             <div className="flex flex-col gap-2">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Día</label>
                <select 
                  className="w-full px-4 py-3.5 bg-slate-800 border border-slate-700 rounded-2xl text-[12px] font-black text-white outline-none appearance-none cursor-pointer focus:border-blue-500/50"
                  value={day}
                  onChange={e => setDay(parseInt(e.target.value))}
                >
                  {Array.from({ length: 31 }, (_, i) => (
                    <option key={i+1} value={i+1}>{i+1}</option>
                  ))}
                </select>
             </div>
             <div className="flex flex-col gap-2">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Mes</label>
                <select 
                  className="w-full px-4 py-3.5 bg-slate-800 border border-slate-700 rounded-2xl text-[12px] font-black text-white outline-none appearance-none cursor-pointer focus:border-blue-500/50"
                  value={month}
                  onChange={e => setMonth(parseInt(e.target.value))}
                >
                  {MONTHS.map((m, i) => (
                    <option key={m} value={i}>{m}</option>
                  ))}
                </select>
             </div>
             <div className="flex flex-col gap-2">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Hora</label>
                <input 
                  type="time"
                  className="w-full px-4 py-3.5 bg-slate-800 border border-slate-700 rounded-2xl text-[12px] font-black text-white outline-none focus:border-blue-500/50"
                  value={time}
                  onChange={e => setTime(e.target.value)}
                />
             </div>
          </div>

          {/* Method and Reference */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Vía de Pago</label>
                <button type="button" onClick={() => setShowMethodModal(true)} className="text-[8px] font-black text-blue-500 uppercase hover:underline bg-transparent border-none cursor-pointer">+ Añadir</button>
              </div>
              <div className="relative">
                <select 
                  className="w-full px-5 py-4 bg-slate-800 border border-slate-700 rounded-2xl text-[12px] font-black text-white outline-none appearance-none cursor-pointer focus:border-blue-500/50"
                  value={method}
                  onChange={e => setMethod(e.target.value)}
                >
                  {sortedMethods.map(m => (
                    <option key={m.id} value={m.name}>{m.name}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Referencia / Notas</label>
              <textarea 
                placeholder="Ej: #9403, Pago de Abril..."
                rows={2}
                className="w-full px-5 py-4 bg-slate-800 border border-slate-700 rounded-2xl text-[12px] font-bold text-white outline-none resize-none placeholder:text-slate-600 focus:border-blue-500/50"
                value={reference}
                onChange={e => setReference(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={!selectedPatient || !amount || isSubmitting}
            className={`mt-4 w-full py-5 rounded-2xl border-none text-[13px] font-black uppercase tracking-widest text-white shadow-2xl transition-all cursor-pointer flex items-center justify-center gap-3 ${!selectedPatient || !amount || isSubmitting ? 'bg-slate-800 text-slate-600 cursor-not-allowed shadow-none' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20 active:scale-[0.98]'}`}
          >
            {isSubmitting ? (
               <>Sincronizando...</>
            ) : (
               <>
                 <CheckCircle2 size={18} /> Confirmar Ingreso
               </>
            )}
          </button>
        </form>
      </div>

      {/* QUICK ADD METHOD MODAL - ALSO DARK */}
      {showMethodModal && (
        <div 
          onClick={(e) => { e.stopPropagation(); setShowMethodModal(false); }}
          className="fixed inset-0 z-[10000] bg-[#0f172a]/80 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300"
        >
          <div 
            onClick={e => e.stopPropagation()}
            className="w-full max-w-[420px] bg-slate-900 border border-slate-800 rounded-[2.5rem] p-10 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-500"
          >
            <div className="flex justify-between items-center mb-8">
               <h3 className="text-xl font-black text-white uppercase tracking-tighter m-0">Nueva Vía de Pago</h3>
               <button onClick={() => setShowMethodModal(false)} className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 hover:text-white border-none bg-transparent cursor-pointer transition-all"><X size={18} /></button>
            </div>
            
            <div className="flex flex-col gap-8">
              <div className="flex flex-col gap-2">
                 <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Nombre</label>
                 <input 
                    type="text" 
                    placeholder="Ej: Binance, Cashea..." 
                    className="w-full px-6 py-4 bg-slate-800 border border-slate-700 rounded-2xl text-[14px] font-bold text-white outline-none focus:border-blue-500/50 transition-all placeholder:text-slate-600"
                    value={newMethod.name}
                    onChange={(e) => setNewMethod({ ...newMethod, name: e.target.value })}
                 />
              </div>

              <div className="flex flex-col gap-2">
                 <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Categoría</label>
                 <div className="grid grid-cols-3 gap-3">
                    {[
                       { id: 'cash', label: 'Efectivo' },
                       { id: 'transfer', label: 'Transf.' },
                       { id: 'other', label: 'Otro' }
                    ].map(t => (
                       <button
                          key={t.id}
                          type="button"
                          onClick={() => setNewMethod({ ...newMethod, type: t.id })}
                          className={`py-4 rounded-2xl border-none text-[10px] font-black transition-all cursor-pointer ${newMethod.type === t.id ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' : 'bg-slate-800 text-slate-500 hover:bg-slate-700 hover:text-slate-300'}`}
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
                       setMethod(created.name);
                       setNewMethod({ name: '', type: 'other' });
                       setShowMethodModal(false);
                    }
                 }}
                 className="mt-2 w-full py-5 bg-blue-600 text-white text-[12px] font-black uppercase tracking-widest rounded-2xl border-none cursor-pointer shadow-2xl shadow-blue-500/20 hover:bg-blue-500 transition-all active:scale-[0.98]"
              >
                 Guardar Nueva Vía
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};

export default RegisterPaymentModal;
