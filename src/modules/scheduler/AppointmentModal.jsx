import React, { useState, useEffect, useMemo } from 'react';
import { X, User, Clock, Calendar, CheckCircle, Plus, Trash2, Search, Stethoscope, ChevronDown, DollarSign } from 'lucide-react';
import { useData } from '../../context/DataContext';

const AppointmentModal = ({ isOpen, onClose, selection, onSuccess, prefilledPatient = null, preloadedServices = [], preselectedDoctorId = '' }) => {
  const { doctors, patients, services, addAppointment, addPatient } = useData();
  
  // Patient State
  const [patientMode, setPatientMode] = useState('search'); // 'search' or 'new'
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientPhone, setNewPatientPhone] = useState('');
  const [newPatientEmail, setNewPatientEmail] = useState('');
  const [selectedSlots, setSelectedSlots] = useState([]);
  
  // Professional State
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  
  // Services State
  const [selectedServices, setSelectedServices] = useState([]); // { serviceId, qty, price, name }

  // Loading state
  const [isSaving, setIsSaving] = useState(false);
  
  // Professional State
  const activeDoctors = useMemo(() => {
    const list = (doctors || []).filter(d => (d.status || '').toLowerCase() === 'activo' || (d.status || '').toLowerCase() === 'active');
    // Filter out if by some mistake the patient is in the doctors list
    return list.filter(d => d.id !== prefilledPatient?.id && d.id !== (selectedPatient?.id || ''));
  }, [doctors, prefilledPatient?.id, selectedPatient?.id]);

  const generalists = useMemo(() => {
    return activeDoctors.filter(d => !d.isSpecialist);
  }, [activeDoctors]);

  const specialists = useMemo(() => {
    return activeDoctors.filter(d => d.isSpecialist);
  }, [activeDoctors]);

  // Reset/Pre-fill state when modal opens
  useEffect(() => {
    if (!isOpen) return;

    if (prefilledPatient) {
      // Find the most recent data for this patient if possible
      const fullPatient = (patients || []).find(p => p.id === prefilledPatient.id) || prefilledPatient;
      setSelectedPatient(fullPatient);
      setPatientMode('search');
      setPatientSearch(fullPatient.full_name || fullPatient.name || '');
    } else {
      setSelectedPatient(null);
      setPatientMode('search');
      setPatientSearch('');
    }

    setNewPatientEmail('');
    setSelectedDoctorId(preselectedDoctorId || '');
    
    // Pre-populate services if available
    if (preloadedServices && preloadedServices.length > 0) {
      setSelectedServices(preloadedServices.map(s => ({
        serviceId: s.id,
        name: s.name,
        qty: 1,
        price: s.price,
        subtotal: s.price
      })));
    } else {
      setSelectedServices([]);
    }
    
    setIsSaving(false);
  }, [`${isOpen}-${prefilledPatient?.id}-${(patients || []).length}-${JSON.stringify(preloadedServices || [])}-${preselectedDoctorId}`]);

  const durationMin = selection ? selection.blocks.length * 15 : 0;

  const filteredPatients = useMemo(() => {
    if (!patientSearch || selectedPatient) return [];
    return patients.filter(p => 
      (p.full_name || '').toLowerCase().includes(patientSearch.toLowerCase()) || 
      (p.email && p.email.toLowerCase().includes(patientSearch.toLowerCase()))
    );
  }, [patientSearch, patients, selectedPatient]);

  const handleAddService = (e) => {
    const sId = e.target.value;
    if (!sId) return;
    const srv = services.find(s => s.id.toString() === sId);
    if (!srv) return;
    
    const exists = selectedServices.find(s => s.serviceId === srv.id);
    if (exists) {
      setSelectedServices(prev => prev.map(s => 
        s.serviceId === srv.id ? { ...s, qty: s.qty + 1, subtotal: (s.qty + 1) * s.price } : s
      ));
    } else {
      setSelectedServices(prev => [...prev, { 
        serviceId: srv.id, 
        name: srv.name, 
        qty: 1, 
        price: srv.price, 
        subtotal: srv.price 
      }]);
    }
    e.target.value = ""; 
  };

  const updateServiceQty = (id, delta) => {
    setSelectedServices(prev => prev.map(s => {
      if (s.serviceId === id) {
        const newQty = Math.max(1, s.qty + delta);
        return { ...s, qty: newQty, subtotal: newQty * s.price };
      }
      return s;
    }));
  };

  const removeService = (id) => {
    setSelectedServices(prev => prev.filter(s => s.serviceId !== id));
  };

  const totalCost = selectedServices.reduce((sum, s) => sum + s.subtotal, 0);

  const handleConfirm = async () => {
    if (!selectedPatient && !newPatientName) return alert('Por favor selecciona o ingresa un paciente.');
    if (!selectedDoctorId) return alert('Por favor selecciona un profesional.');
    if (selectedServices.length === 0) return alert('Por favor agrega al menos un servicio.');

    setIsSaving(true);
    try {
      let patientId = selectedPatient?.id;

      // Handle new patient creation
      if (patientMode === 'new') {
        const newPatient = await addPatient({
          full_name: newPatientName,
          phone: newPatientPhone,
          email: newPatientEmail,
          status: 'active'
        });
        patientId = newPatient.id;
      }

      const appointmentData = {
        patient_id: patientId,
        doctor_id: selectedDoctorId,
        starts_at: `${selection.dateStr}T${selection.startTime}:00`,
        ends_at: `${selection.dateStr}T${selection.endTime}:00`,
        start_at: `${selection.dateStr}T${selection.startTime}:00`,
        end_at: `${selection.dateStr}T${selection.endTime}:00`,
        status: 'scheduled',
        notes: `Servicios: ${selectedServices.map(s => s.name).join(', ')} | Total: $${totalCost}`,
        total_amount: totalCost, // NUEVA COLUMNA
      };

      // No await here for zero-latency UI
      addAppointment(appointmentData);
      onSuccess();
    } catch (error) {
      console.error('Error recording appointment:', error);
      alert('Error al agendar: ' + (error.message || error));
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !selection) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-[5000] p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-5xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 max-h-[95vh] border border-white/20">
        
        {/* Header */}
        <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-inner">
               <Calendar size={32} />
            </div>
            <div className="flex flex-col">
               <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Confirmar Agendamiento</h2>
               <div className="flex items-center gap-4 mt-1.5">
                  <div className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-full border border-slate-200">
                    <Clock size={12} className="text-primary" />
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{selection.startTime} - {selection.endTime}</span>
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{selection.dateStr}</span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">•</span>
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                     {durationMin} MINUTOS
                  </span>
               </div>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-rose-50 rounded-2xl transition-all border-none cursor-pointer text-slate-400 hover:text-rose-500 bg-slate-100 flex items-center justify-center">
             <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* Left Column: Data */}
            <div className="lg:col-span-7 flex flex-col gap-10">
              
              {/* SECTION 1: Patient */}
              <div className="flex flex-col gap-6">
                 <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                    <User size={18} className="text-primary" />
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">1. Información del Paciente</h3>
                 </div>
                 
                 <div className="flex flex-col gap-4">
                    {!prefilledPatient && (
                      <div className="flex border border-slate-200 p-1 rounded-2xl bg-slate-50 w-fit self-start">
                        <button 
                          className={`px-5 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border-none cursor-pointer ${patientMode === 'search' ? 'bg-white text-primary shadow-sm' : 'bg-transparent text-slate-400 hover:text-slate-600'}`}
                          onClick={() => { setPatientMode('search'); setSelectedPatient(null); setPatientSearch(''); }}
                        >
                           Buscar Existente
                        </button>
                        <button 
                          className={`px-5 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border-none cursor-pointer ${patientMode === 'new' ? 'bg-white text-primary shadow-sm' : 'bg-transparent text-slate-400 hover:text-slate-600'}`}
                          onClick={() => { setPatientMode('new'); setSelectedPatient(null); }}
                        >
                           Nuevo Registro
                        </button>
                      </div>
                    )}
                    
                    {patientMode === 'search' ? (
                       <div className="relative">
                          <div className={`flex items-center bg-white border-2 rounded-2xl px-5 py-4 transition-all ${selectedPatient ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-100 focus-within:border-primary/30 shadow-sm'}`}>
                             <Search size={20} className={selectedPatient ? 'text-emerald-400 mr-3' : 'text-slate-300 mr-3'} />
                             <input 
                                type="text" 
                                placeholder="Escribe nombre o email del paciente..." 
                                className="w-full bg-transparent border-none outline-none text-sm font-bold text-slate-700 placeholder:text-slate-300"
                                value={patientSearch}
                                onChange={(e) => {
                                   setPatientSearch(e.target.value);
                                   if (selectedPatient) setSelectedPatient(null);
                                }}
                                disabled={!!prefilledPatient}
                             />
                             {selectedPatient && !prefilledPatient && (
                               <button onClick={() => {setSelectedPatient(null); setPatientSearch('');}} className="p-1 hover:bg-emerald-100 rounded-lg text-emerald-500 transition-all border-none bg-transparent cursor-pointer">
                                 <X size={14} />
                               </button>
                             )}
                          </div>
                          
                          {!selectedPatient && patientSearch.length > 0 && filteredPatients.length > 0 && (
                             <div className="absolute top-full left-0 w-full mt-3 bg-white border border-slate-100 shadow-2xl rounded-2xl overflow-hidden z-[60] flex flex-col animate-in slide-in-from-top-2 duration-200">
                                {filteredPatients.map(p => (
                                   <div 
                                     key={p.id} 
                                     className="px-6 py-4 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-none flex items-center justify-between group"
                                     onClick={() => { setSelectedPatient(p); setPatientSearch(p.name); }}
                                   >
                                      <div className="flex flex-col">
                                        <span className="text-sm font-bold text-slate-800 group-hover:text-primary transition-colors">{p.full_name || p.name}</span>
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{p.email || 'Sin correo'}</span>
                                      </div>
                                      <span className="text-[10px] bg-slate-100 text-slate-500 font-black px-2 py-1 rounded-md uppercase tracking-tighter">{p.phone || 'S/T'}</span>
                                   </div>
                                ))}
                             </div>
                          )}
                          
                          {selectedPatient && (
                             <div className="mt-4 p-5 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                                    <CheckCircle size={20} />
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-xs font-black text-emerald-800 uppercase tracking-widest">Paciente Vinculado</span>
                                    <span className="text-sm font-bold text-emerald-600">{selectedPatient.full_name || selectedPatient.name}</span>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end">
                                  <span className="text-[10px] font-black text-emerald-700/50 uppercase">Saldo Pendiente</span>
                                  <span className="text-sm font-black text-emerald-700">${selectedPatient.totalDue?.toFixed(2) || '0.00'}</span>
                                </div>
                             </div>
                          )}
                       </div>
                    ) : (
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-left-2 duration-300">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Nombre Completo</label>
                            <input 
                               type="text" 
                               placeholder="Ej: Juan Pérez" 
                               className="bg-white border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-primary/30 transition-all shadow-sm"
                               value={newPatientName}
                               onChange={(e) => setNewPatientName(e.target.value)}
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Teléfono</label>
                            <input 
                               type="text" 
                               placeholder="+58 412..." 
                               className="bg-white border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-primary/30 transition-all shadow-sm"
                               value={newPatientPhone}
                               onChange={(e) => setNewPatientPhone(e.target.value)}
                            />
                          </div>
                          <div className="flex flex-col gap-1.5 md:col-span-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Correo Electrónico</label>
                            <input 
                               type="email" 
                               placeholder="paciente@ejemplo.com" 
                               className="bg-white border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-primary/30 transition-all shadow-sm"
                               value={newPatientEmail}
                               onChange={(e) => setNewPatientEmail(e.target.value)}
                            />
                          </div>
                       </div>
                    )}
                 </div>
              </div>

              {/* SECTION 2: Professional */}
              <div className="flex flex-col gap-6">
                 <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                    <Stethoscope size={18} className="text-primary" />
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">2. Profesional Asignado</h3>
                 </div>
                 
                  <div className="flex flex-col gap-8">
                    {/* Generalists */}
                    {generalists.length > 0 && (
                      <div className="flex flex-col gap-4">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Odontología General</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                           {generalists.map(doc => (
                              <div 
                                key={doc.id}
                                onClick={() => setSelectedDoctorId(doc.id)}
                                className={`p-5 rounded-3xl border-2 cursor-pointer transition-all flex items-center gap-4 relative group ${selectedDoctorId === doc.id ? 'border-primary bg-primary/5 ring-4 ring-primary/5' : 'border-slate-50 hover:border-slate-200 hover:bg-slate-50'}`}
                              >
                                 <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-sm font-black shadow-lg shadow-black/5" style={{ backgroundColor: doc.color || '#3b82f6' }}>
                                    {doc.name.split(' ').map(n=>n[0]).join('')}
                                 </div>
                                 <div className="flex flex-col">
                                    <span className={`text-sm font-black tracking-tight ${selectedDoctorId === doc.id ? 'text-primary' : 'text-slate-800'}`}>{doc.full_name || doc.name}</span>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">General</span>
                                 </div>
                                 {selectedDoctorId === doc.id && (
                                   <div className="absolute top-4 right-4 text-primary">
                                     <CheckCircle size={16} />
                                   </div>
                                 )}
                              </div>
                           ))}
                        </div>
                      </div>
                    )}

                    {/* Specialists */}
                    {specialists.length > 0 && (
                      <div className="flex flex-col gap-4">
                        <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] ml-2">Profesionales Especialistas</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                           {specialists.map(doc => (
                              <div 
                                key={doc.id}
                                onClick={() => setSelectedDoctorId(doc.id)}
                                className={`p-5 rounded-3xl border-2 cursor-pointer transition-all flex items-center gap-4 relative group ${selectedDoctorId === doc.id ? 'border-primary bg-primary/5 ring-4 ring-primary/5' : 'border-slate-50 hover:border-slate-200 hover:bg-slate-50'}`}
                              >
                                 <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-sm font-black shadow-lg shadow-black/5" style={{ backgroundColor: doc.color || '#3b82f6' }}>
                                    {doc.name.split(' ').map(n=>n[0]).join('')}
                                 </div>
                                 <div className="flex flex-col">
                                    <span className={`text-sm font-black tracking-tight ${selectedDoctorId === doc.id ? 'text-primary' : 'text-slate-800'}`}>{doc.name}</span>
                                    <span className="text-[9px] font-bold text-amber-500 uppercase mt-0.5">Especialista</span>
                                 </div>
                                 {selectedDoctorId === doc.id && (
                                   <div className="absolute top-4 right-4 text-primary">
                                     <CheckCircle size={16} />
                                   </div>
                                 )}
                              </div>
                           ))}
                        </div>
                      </div>
                    )}
                  </div>
              </div>
            </div>

            {/* Right Column: Services & Summary */}
            <div className="lg:col-span-5 flex flex-col gap-8">
               <div className="bg-slate-50 rounded-[2.5rem] p-8 flex flex-col gap-8 border border-slate-200/50 sticky top-0">
                  
                  {/* Services Header */}
                  <div className="flex flex-col gap-5">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <Plus size={18} className="text-primary" />
                          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">3. Servicios</h3>
                       </div>
                       <span className="text-[10px] font-black text-slate-400 uppercase bg-white px-2 py-1 rounded-lg border border-slate-100">{selectedServices.length} ITEMS</span>
                    </div>

                    <div className="relative">
                       <select 
                          onChange={handleAddService}
                          className="w-full appearance-none bg-white text-slate-800 text-[11px] font-black uppercase tracking-widest px-6 py-4 pr-12 rounded-2xl border-2 border-slate-100 outline-none cursor-pointer hover:border-primary/20 transition-all shadow-sm shadow-slate-200/50"
                          defaultValue=""
                       >
                          <option value="" disabled>SELECCIONAR SERVICIO PARA AGREGAR</option>
                          {services.map(s => <option key={s.id} value={s.id}>{s.name} — ${s.price}</option>)}
                       </select>
                       <ChevronDown size={16} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                    </div>
                  </div>

                  {/* Service List */}
                  <div className="flex flex-col gap-3 max-h-[280px] overflow-y-auto pr-2 custom-scrollbar">
                     {selectedServices.length === 0 ? (
                        <div className="py-10 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl gap-3">
                           <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-300">
                              <Plus size={20} />
                           </div>
                           <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No hay servicios agregados</span>
                        </div>
                     ) : (
                        selectedServices.map(srv => (
                           <div key={srv.serviceId} className="flex flex-col p-4 bg-white rounded-2xl shadow-sm border border-slate-100 group animate-in slide-in-from-right-2 duration-200">
                             <div className="flex items-center justify-between">
                                <span className="text-xs font-black text-slate-800 truncate pr-4">{srv.name}</span>
                                <button onClick={() => removeService(srv.serviceId)} className="text-slate-300 hover:text-rose-500 transition-all border-none bg-transparent cursor-pointer p-1">
                                   <Trash2 size={14} />
                                </button>
                             </div>
                             <div className="flex items-center justify-between mt-3">
                                <div className="flex items-center bg-slate-50 rounded-lg p-0.5 border border-slate-100 scale-90 -ml-2">
                                   <button type="button" onClick={() => updateServiceQty(srv.serviceId, -1)} className="w-6 h-6 flex items-center justify-center rounded-md bg-white shadow-sm border-none cursor-pointer text-slate-400 hover:text-primary font-black text-xs">-</button>
                                   <span className="w-8 text-center text-[10px] font-black text-slate-700">{srv.qty}</span>
                                   <button type="button" onClick={() => updateServiceQty(srv.serviceId, 1)} className="w-6 h-6 flex items-center justify-center rounded-md bg-white shadow-sm border-none cursor-pointer text-slate-400 hover:text-primary font-black text-xs">+</button>
                                </div>
                                <div className="flex flex-col items-end">
                                   <span className="text-[10px] text-slate-400 font-bold tracking-tight">${srv.price} x {srv.qty}</span>
                                   <span className="text-xs font-black text-slate-800">${srv.subtotal.toFixed(2)}</span>
                                </div>
                             </div>
                           </div>
                        ))
                     )}
                  </div>

                  {/* Summary Footer */}
                  <div className="mt-auto flex flex-col gap-4 bg-slate-900 rounded-3xl p-7 text-white shadow-xl shadow-slate-900/10 border border-slate-800">
                     <div className="flex justify-between items-center text-slate-400">
                        <span className="text-[10px] font-black uppercase tracking-widest">Subtotal Servicios</span>
                        <span className="text-sm font-bold tracking-tight">${totalCost.toFixed(2)}</span>
                     </div>
                     <div className="h-px bg-slate-800"></div>
                     <div className="flex justify-between items-center">
                        <div className="flex flex-col">
                           <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Total Final</span>
                           <span className="text-[8px] font-bold text-slate-500 uppercase mt-0.5">Impuestos incluidos</span>
                        </div>
                        <div className="flex items-center gap-1">
                           <DollarSign size={20} className="text-primary" />
                           <span className="text-3xl font-black tracking-tighter">{totalCost.toFixed(2)}</span>
                        </div>
                     </div>
                  </div>

               </div>
            </div>

          </div>
        </div>

        {/* Footer actions */}
        <div className="px-10 py-8 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-end gap-5">
           <button 
             onClick={onClose}
             className="px-8 py-5 bg-white text-slate-500 text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-slate-100 hover:text-slate-700 transition-all border border-slate-200 cursor-pointer"
           >
              Cancelar Cita
           </button>
           <button 
             onClick={handleConfirm}
             className="group px-12 py-5 bg-primary text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-blue-600 transition-all border-none cursor-pointer shadow-2xl shadow-primary/20 flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale"
             disabled={!selectedDoctorId || selectedServices.length === 0 || (!selectedPatient && !newPatientName)}
           >
              <CheckCircle size={18} className="group-hover:scale-110 transition-transform" />
              Confirmar Agendamiento
           </button>
        </div>

      </div>
    </div>
  );
};

export default AppointmentModal;
