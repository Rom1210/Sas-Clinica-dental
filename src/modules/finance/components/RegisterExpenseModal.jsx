import React, { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const RegisterExpenseModal = ({ showModal, setShowModal, formData, setFormData, handleRegisterExpense, exchangeRate, formatPrice }) => {
  if (showModal !== 'expense') return null;

  const usdEquivalent = useMemo(() => {
    if (!formData.amount) return 0;
    if (formData.currency === 'USD') return parseFloat(formData.amount);
    return parseFloat(formData.amount) / (exchangeRate || 45.50);
  }, [formData.amount, formData.currency, exchangeRate]);

  return createPortal(
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
                <option value="Laboratorio">Laboratorio</option>
                <option value="Servicios">Servicios / Alquiler</option>
                <option value="Nómina">Nómina / Sueldos</option>
                <option value="Mantenimiento">Mantenimiento</option>
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

           {/* Currency Selector */}
           <div className="flex bg-slate-100 p-1 rounded-xl">
              {['USD', 'VES'].map(curr => (
                <button
                  key={curr}
                  type="button"
                  onClick={() => setFormData({...formData, currency: curr})}
                  className={`flex-1 py-2 rounded-lg text-[10px] font-black transition-all border-none cursor-pointer ${formData.currency === curr ? 'bg-white text-blue-600 shadow-sm' : 'bg-transparent text-slate-400 hover:text-slate-600'}`}
                >
                  {curr}
                </button>
              ))}
           </div>

           <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '9px', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginLeft: '4px' }}>
                 Monto {formData.currency === 'VES' ? '(BS)' : '($)'}
              </label>
              <div style={{ position: 'relative' }}>
                <input 
                  required
                  type="number" 
                  step="0.01"
                  placeholder="0.00"
                  style={{ width: '100%', padding: '14px 20px', borderRadius: '16px', border: '1.5px solid #f1f5f9', backgroundColor: '#f8fafc', fontSize: '20px', fontWeight: 900, color: '#1e293b', outline: 'none' }}
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                />
                <div style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', fontSize: '10px', fontWeight: 900, color: '#CBD5E1' }}>
                   {formData.currency}
                </div>
              </div>
           </div>

           {formData.currency === 'VES' && formData.amount && (
              <div style={{ padding: '12px 16px', backgroundColor: '#eff6ff', borderRadius: '16px', border: '1px solid #dbeafe', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <span style={{ fontSize: '9px', fontWeight: 900, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Equivalente USD</span>
                 <span style={{ fontSize: '14px', fontWeight: 900, color: '#2563eb' }}>${usdEquivalent.toFixed(2)}</span>
              </div>
           )}

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
            Confirmar Registro de Gasto
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default RegisterExpenseModal;
