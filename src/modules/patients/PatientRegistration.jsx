import React, { useState, useEffect } from 'react';
import { X, User, Phone, Mail, Calendar, Zap, ChevronDown, ChevronUp, Fingerprint, Info, Heart, Activity, ClipboardList, ShieldCheck, Check, AlertCircle } from 'lucide-react';

const PremiumField = ({ label, icon, children, helper }) => (
  <div className="flex flex-col gap-1 group">
    <div className="flex justify-between items-center">
      <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 group-focus-within:text-primary transition-all">
        {label}
      </label>
      {helper && <span className="text-[9px] font-bold text-slate-300">{helper}</span>}
    </div>
    <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 p-1 rounded-2xl group-focus-within:bg-white group-focus-within:border-primary group-focus-within:shadow-md group-focus-within:shadow-primary/5 transition-all">
      <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-slate-400 group-focus-within:text-primary group-focus-within:shadow-sm transition-all border border-slate-50">
        {React.cloneElement(icon, { size: 16 })}
      </div>
      <div className="flex-1 pr-2">
        {children}
      </div>
    </div>
  </div>
);

const PatientRegistration = ({ onClose, onSuccess }) => {
  const [activeTab, setActiveTab] = useState('core');
  const [age, setAge] = useState(null);
  const [showMedicalHistory, setShowMedicalHistory] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dni: '',
    email: '',
    whatsapp: '',
    dob: '',
    gender: '',
    reason: '',
    flags: [],
    fuma: false,
    bruxismo: false,
    hasMedicalPrecedents: false
  });

  const flagsOptions = [
    'Alergia a Penicilina', 
    'Hipertensión', 
    'Diabetes', 
    'Embarazo'
  ];

  // Auto-age calculation
  useEffect(() => {
    if (formData.dob) {
      const birthDate = new Date(formData.dob);
      const today = new Date();
      let ageCalculated = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        ageCalculated--;
      }
      setAge(ageCalculated);
    }
  }, [formData.dob]);

  // Lock body scroll when modal mounts
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const toggleFlag = (flag) => {
    setFormData(prev => ({
      ...prev,
      flags: prev.flags.includes(flag) 
        ? prev.flags.filter(f => f !== flag) 
        : [...prev.flags, flag]
    }));
  };

  const handleSave = () => {
    onSuccess('¡Paciente registrado con éxito! Enviando link de bienvenida por WhatsApp...');
  };

  const renderTabContent = () => {
    switch(activeTab) {
      case 'core':
        return (
          <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="grid grid-cols-2 gap-4">
              <PremiumField label="Nombres" icon={<User size={18} />}>
                <input 
                  type="text" className="w-full bg-transparent border-none outline-none text-sm font-bold text-slate-700 placeholder:text-slate-300"
                  placeholder="Ej. Juan Ignacio"
                  value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                />
              </PremiumField>
              <PremiumField label="Apellidos" icon={<User size={18} />}>
                <input 
                  type="text" className="w-full bg-transparent border-none outline-none text-sm font-bold text-slate-700 placeholder:text-slate-300"
                  placeholder="Ej. Pérez Sosa"
                  value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                />
              </PremiumField>
            </div>

            <PremiumField label="Identidad (Cédula/DNI)" icon={<Fingerprint size={18} />}>
              <input 
                type="text" className="w-full bg-transparent border-none outline-none text-sm font-bold text-slate-700 placeholder:text-slate-300"
                placeholder="V-12.345.678"
                value={formData.dni} onChange={(e) => setFormData({...formData, dni: e.target.value})}
              />
            </PremiumField>

            <div className="grid grid-cols-2 gap-4">
              <PremiumField label="WhatsApp" icon={<Phone size={18} className="text-emerald-500" />}>
                <input 
                  type="text" className="w-full bg-transparent border-none outline-none text-sm font-bold text-slate-700 placeholder:text-slate-300"
                  placeholder="+58 412..."
                  value={formData.whatsapp} onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
                />
              </PremiumField>
              <PremiumField label="Email" icon={<Mail size={18} />}>
                <input 
                  type="email" className="w-full bg-transparent border-none outline-none text-sm font-bold text-slate-700 placeholder:text-slate-300"
                  placeholder="paciente@mail.com"
                  value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </PremiumField>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <PremiumField 
                label="Nacimiento" 
                icon={<Calendar size={18} />}
                helper={age !== null ? `${age} años detectados` : null}
              >
                <input 
                  type="date" className="w-full bg-transparent border-none outline-none text-sm font-bold text-slate-700 placeholder:text-slate-300 cursor-pointer"
                  value={formData.dob} onChange={(e) => setFormData({...formData, dob: e.target.value})}
                />
              </PremiumField>
              <PremiumField label="Género" icon={<Activity size={18} />}>
                <select 
                  className="w-full bg-transparent border-none outline-none text-sm font-bold text-slate-700 cursor-pointer"
                  value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value})}
                >
                  <option value="">Seleccionar...</option>
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                  <option value="Otro">Otro</option>
                </select>
              </PremiumField>
            </div>
          </div>
        );
      case 'health':
        return (
          <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-500">
            <PremiumField label="Motivo de Consulta" icon={<ClipboardList size={18} />}>
              <textarea 
                className="w-full bg-transparent border-none outline-none text-sm font-bold text-slate-700 placeholder:text-slate-300 resize-none h-20 pt-2"
                placeholder="¿Qué le trae hoy a consulta?"
                value={formData.reason} onChange={(e) => setFormData({...formData, reason: e.target.value})}
              />
            </PremiumField>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Alertas Médicas (Badges)</label>
              <div className="flex flex-wrap gap-2">
                {flagsOptions.map(flag => (
                  <button
                    key={flag}
                    className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-tight transition-all border-none cursor-pointer flex items-center gap-1.5 ${formData.flags.includes(flag) ? 'bg-rose-500 text-white shadow-md shadow-rose-200' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                    onClick={() => toggleFlag(flag)}
                  >
                    {formData.flags.includes(flag) ? <Zap size={12} /> : <div className="w-2.5 h-2.5 rounded-full border border-slate-200"></div>}
                    {flag}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-1">
               <div 
                 onClick={() => setFormData({...formData, fuma: !formData.fuma})}
                 className={`flex justify-between items-center p-3 rounded-2xl border transition-all cursor-pointer ${formData.fuma ? 'bg-rose-50 border-rose-100 shadow-sm' : 'bg-slate-50 border-transparent hover:border-slate-200'}`}
               >
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-xl bg-white flex items-center justify-center ${formData.fuma ? 'text-rose-500' : 'text-slate-300'}`}>
                      <Info size={14} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-700 uppercase tracking-tight">Fuma</span>
                      <span className="text-[7px] text-rose-400 font-bold uppercase tracking-widest">Riesgo</span>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${formData.fuma ? 'bg-rose-500 border-rose-500' : 'border-slate-200'}`}>
                    {formData.fuma && <Check size={12} className="text-white" />}
                  </div>
               </div>
               <div 
                 onClick={() => setFormData({...formData, bruxismo: !formData.bruxismo})}
                 className={`flex justify-between items-center p-3 rounded-2xl border transition-all cursor-pointer ${formData.bruxismo ? 'bg-primary/5 border-primary/20 shadow-sm' : 'bg-slate-50 border-transparent hover:border-slate-200'}`}
               >
                  <div className="items-center flex gap-2">
                    <div className={`w-8 h-8 rounded-xl bg-white flex items-center justify-center ${formData.bruxismo ? 'text-primary' : 'text-slate-300'}`}>
                      <Activity size={14} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-700 uppercase tracking-tight">Bruxismo</span>
                      <span className="text-[7px] text-slate-400 font-bold uppercase tracking-widest">Desgaste</span>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${formData.bruxismo ? 'bg-primary border-primary' : 'border-slate-200'}`}>
                    {formData.bruxismo && <Check size={12} className="text-white" />}
                  </div>
               </div>
            </div>
          </div>
        );
      case 'history':
        return (
          <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-500">
             <div className="flex flex-col gap-3">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-tight mb-1">Anamnesis y Antecedentes</h3>
                
                {/* Asma destacado */}
                <PremiumField label="Asma / Problemas Respiratorios" icon={<Activity size={16} className="text-rose-500" />}>
                  <select className="w-full bg-transparent border-none outline-none text-sm font-bold text-slate-700 cursor-pointer">
                    <option value="">Seleccionar...</option>
                    <option value="No">No</option>
                    <option value="Leve">Sí, Leve</option>
                    <option value="Grave">Sí, Grave</option>
                  </select>
                </PremiumField>

                <PremiumField label="Antecedentes Cardíacos" icon={<Heart size={16} className="text-rose-500" />}>
                  <select className="w-full bg-transparent border-none outline-none text-sm font-bold text-slate-700 cursor-pointer">
                    <option value="">Seleccionar...</option>
                    <option value="No">No</option>
                    <option value="Si">Sí</option>
                  </select>
                </PremiumField>
                
                <PremiumField label="Problemas de Coagulación" icon={<AlertCircle size={16} className="text-rose-500" />}>
                  <select className="w-full bg-transparent border-none outline-none text-sm font-bold text-slate-700 cursor-pointer">
                    <option value="">Seleccionar...</option>
                    <option value="No">No</option>
                    <option value="Si">Sí</option>
                  </select>
                </PremiumField>

                <PremiumField label="Otros Antecedentes (Opcional)" icon={<ClipboardList size={16} />}>
                  <textarea 
                    className="w-full bg-transparent border-none outline-none text-sm font-bold text-slate-700 placeholder:text-slate-300 resize-none h-16 pt-2"
                    placeholder="Especifique cualquier otra condición médica..."
                  />
                </PremiumField>
             </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="flex flex-col max-h-[85vh] bg-white px-2 relative">
      <div className="flex-shrink-0">
        {/* High-End Modal Header */}
        <div className="flex justify-between items-start mb-6 pt-2">
          <div className="flex flex-col">
             <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 bg-primary rounded-lg flex items-center justify-center text-white">
                   <Zap size={14} />
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tighter">Smart Registration</h2>
             </div>
             <div className="flex items-center gap-2">
                <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md uppercase tracking-widest">Versión 2.0</span>
                <span className="text-[9px] font-bold text-slate-400">Nivel Actual: {activeTab === 'core' ? '1. Datos Críticos' : activeTab === 'health' ? '2. Diagnóstico' : '3. Historia Médica'}</span>
             </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 bg-slate-50 hover:bg-slate-100 flex items-center justify-center rounded-2xl transition-all border-none cursor-pointer">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Premium Stepper Indicator */}
        <div className="flex items-center gap-3 mb-6">
           {[
             { id: 'core', l: 'Identidad' },
             { id: 'health', l: 'Salud' },
             { id: 'history', l: 'Historia' }
           ].map((s, i) => (
             <div key={s.id} className="flex-1 flex flex-col gap-2">
                <div className={`h-1.5 rounded-full transition-all duration-700 ${
                  (activeTab === 'core' && i === 0) || 
                  (activeTab === 'health' && i <= 1) || 
                  (activeTab === 'history') 
                    ? 'bg-primary' : 'bg-slate-100'
                }`}></div>
                <span className={`text-[8px] font-black uppercase tracking-tighter text-center transition-all ${
                   (activeTab === s.id) ? 'text-primary' : 'text-slate-300'
                }`}>{s.l}</span>
             </div>
           ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar pb-4 min-h-0">
        {renderTabContent()}
      </div>

      {/* Sticky Footer for Action Buttons */}
      <div className="flex-shrink-0 pt-5 pb-2 mt-auto bg-white z-10 border-t border-slate-50">
        {activeTab === 'core' && (
          <button 
            className="w-full py-4 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-primary/10 border-none cursor-pointer flex items-center justify-center gap-2"
            onClick={() => setActiveTab('health')}
          >
            Siguiente Paso <Info size={14} />
          </button>
        )}
        {activeTab === 'health' && (
          <div className="flex gap-3">
            <button className="flex-1 py-4 bg-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-200 transition-all border-none cursor-pointer" onClick={() => setActiveTab('core')}>Volver</button>
            <button 
              className="flex-1 py-4 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 border-none cursor-pointer"
              onClick={() => setActiveTab('history')}
            >
              Siguiente Paso
            </button>
          </div>
        )}
        {activeTab === 'history' && (
          <div className="flex gap-3">
            <button className="flex-1 py-4 bg-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-200 transition-all border-none cursor-pointer" onClick={() => setActiveTab('health')}>Atrás</button>
            <button 
              className="flex-1 py-4 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-primary/20 border-none cursor-pointer"
              onClick={handleSave}
            >
              Guardar Paciente
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientRegistration;
