import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Calendar, User, FileText, CheckCircle2 } from 'lucide-react';

const NewConsultationModal = ({ patient, onClose, onSave }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    reason: '',
    treatment: 'Limpieza Dental',
    tooth: '',
    cost: '',
    paymentStatus: 'Pendiente',
    notes: ''
  });

  const [errors, setErrors] = useState({
    reason: false,
    cost: false
  });

  const treatments = [
    'Consulta General', 'Limpieza Dental', 'Extracción Simple', 
    'Resina Simple', 'Resina Compuesta', 'Endodoncia', 'Blanqueamiento'
  ];

  const paymentStatuses = ['Pagado', 'Abono', 'Pendiente'];

  const handleSave = () => {
    // Validation
    const newErrors = {
      reason: formData.reason.trim() === '',
      cost: formData.cost.trim() === '' || isNaN(formData.cost)
    };
    
    setErrors(newErrors);

    if (!newErrors.reason && !newErrors.cost) {
      // Create new consultation object
      const newConsultation = {
        id: Date.now(),
        date: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }),
        reason: formData.reason,
        treatment: formData.treatment,
        cost: parseFloat(formData.cost),
        paymentStatus: formData.paymentStatus,
        tooth: formData.tooth,
      };
      
      onSave(newConsultation);
    }
  };

  const handleScheduleFollowUp = () => {
    // First save the consultation
    const newConsultation = {
      id: Date.now(),
      date: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }),
      reason: formData.reason,
      treatment: formData.treatment,
      cost: parseFloat(formData.cost || 0),
      paymentStatus: formData.paymentStatus,
      tooth: formData.tooth,
    };
    onSave(newConsultation);
    
    // Then navigate to scheduler
    navigate('/scheduler', { 
      state: { 
        prefilledPatient: {
          id: patient.id,
          name: patient.name,
          email: patient.email,
          phone: patient.phone || '04244570903'
        } 
      } 
    });
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      style={{ background: 'rgba(255, 255, 255, 0.4)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
        style={{ border: '1px solid rgba(0,0,0,0.05)', maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Registro de Nueva Consulta</h2>
            <div className="flex items-center gap-4 mt-2 text-sm text-slate-500 font-medium">
              <span className="flex items-center gap-1.5"><User size={14} /> {patient?.name || 'Paciente'}</span>
              <span className="flex items-center gap-1.5"><Calendar size={14} /> {new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 bg-white hover:bg-slate-100 rounded-xl transition-colors border-none cursor-pointer shadow-sm text-slate-400"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto flex flex-col gap-6" style={{ maxHeight: 'calc(90vh - 160px)' }}>
          
          {/* Section A: Motivo */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-[10px]">A</span>
              Motivo e Iniciales
            </h3>
            <div className="flex flex-col gap-1">
              <textarea 
                placeholder="Describe el motivo principal de la consulta y hallazgos iniciales..."
                className={`w-full bg-slate-50 border ${errors.reason ? 'border-red-300 focus:ring-red-500' : 'border-slate-200 focus:border-primary focus:ring-primary'} rounded-xl p-4 min-h-[100px] text-sm focus:outline-none focus:ring-1 transition-all resize-y text-slate-700`}
                value={formData.reason}
                onChange={e => setFormData({...formData, reason: e.target.value})}
              />
              {errors.reason && <span className="text-xs text-red-500 font-medium mt-1">El motivo es obligatorio.</span>}
            </div>
          </div>

          <div className="h-px w-full bg-slate-100"></div>

          {/* Section B: Diagnóstico & Tratamiento */}
          <div className="flex flex-col gap-3">
             <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-[10px]">B</span>
              Diagnóstico & Tratamiento
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tratamiento Principal</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-slate-700 font-medium cursor-pointer"
                  value={formData.treatment}
                  onChange={e => setFormData({...formData, treatment: e.target.value})}
                >
                  {treatments.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pieza Dental (Opcional)</label>
                <input 
                  type="text" 
                  placeholder="Ej: 18, 24..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-slate-700"
                  value={formData.tooth}
                  onChange={e => setFormData({...formData, tooth: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="h-px w-full bg-slate-100"></div>

          {/* Section C: Finanzas Rápidas */}
          <div className="flex flex-col gap-3">
             <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-[10px]">C</span>
              Finanzas Rápidas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Costo (USD)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                  <input 
                    type="number" 
                    placeholder="0.00"
                    className={`w-full bg-slate-50 pl-8 pr-4 py-3 border ${errors.cost ? 'border-red-300 focus:ring-red-500' : 'border-slate-200 focus:border-primary focus:ring-primary'} rounded-xl text-sm focus:outline-none focus:ring-1 transition-all text-slate-700 font-bold`}
                    value={formData.cost}
                    onChange={e => setFormData({...formData, cost: e.target.value})}
                  />
                </div>
                {errors.cost && <span className="text-xs text-red-500 font-medium mt-1">Ingresa un costo válido.</span>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Estado de Pago</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-slate-700 font-medium cursor-pointer"
                  value={formData.paymentStatus}
                  onChange={e => setFormData({...formData, paymentStatus: e.target.value})}
                >
                  {paymentStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="h-px w-full bg-slate-100"></div>

          {/* Section D: Notas Internas */}
          <div className="flex flex-col gap-3">
             <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-[10px]">D</span>
              Notas Internas <span className="text-[10px] text-slate-400 font-normal lowercase">(Solo Doctor)</span>
            </h3>
            <textarea 
              placeholder="Anotaciones privadas, recordatorios para la próxima sesión..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 min-h-[80px] text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-y text-slate-700"
              value={formData.notes}
              onChange={e => setFormData({...formData, notes: e.target.value})}
            />
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 px-6 border-t border-slate-100 bg-slate-50/50 flex flex-wrap justify-between gap-3 mt-auto">
          <button 
            onClick={handleScheduleFollowUp}
            className="flex items-center gap-2 px-6 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors cursor-pointer text-sm border-none shadow-sm"
          >
            <Calendar size={16} /> Programar Control
          </button>

          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors shadow-sm cursor-pointer text-sm"
            >
              Cancelar
            </button>
            <button 
              onClick={handleSave}
              className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2 border-none shadow-sm cursor-pointer text-sm"
            >
              <CheckCircle2 size={16} /> Guardar Consulta
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default NewConsultationModal;
