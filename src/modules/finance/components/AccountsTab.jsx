import React from 'react';
import { History, Search, User as UserIcon, CheckCircle, AlertCircle, ChevronRight, Users, MessageCircle } from 'lucide-react';
import { useSettings } from '../../../context/SettingsContext';

const AccountsTab = ({ patientFinancials, searchTerm, setSearchTerm, navigate, formatPrice, selectMode, onCancelSelection }) => {
  const { clinicName } = useSettings();

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-500">
      {selectMode && (
        <div className="bg-primary/10 border-2 border-primary/20 rounded-3xl p-6 flex items-center justify-between shadow-lg shadow-primary/5 animate-in slide-in-from-top-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30">
              <Users size={24} strokeWidth={3} />
            </div>
            <div>
              <h2 className="text-xl font-black text-primary uppercase tracking-tight leading-none mb-1">Elija un paciente</h2>
              <p className="text-[10px] font-black text-primary/60 uppercase tracking-widest">Selecciona de la lista para registrar su pago</p>
            </div>
          </div>
          <button 
            onClick={onCancelSelection}
            className="px-6 py-2.5 bg-white text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-xl border border-slate-200 hover:bg-slate-50 transition-all cursor-pointer"
          >
            Cancelar
          </button>
        </div>
      )}

      <div className="professional-card p-0 overflow-hidden border-none shadow-sm bg-white">
       <div style={{ padding: '32px 40px', borderBottom: '1px solid #f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', flexWrap: 'wrap', gap: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(37, 99, 235, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <History size={16} style={{ color: '#2563EB' }} /> 
              </div>
              <h3 style={{ fontSize: '14px', fontWeight: 900, color: '#1e293b', margin: 0, letterSpacing: '-0.02em' }}>Historial Financiero Detallado</h3>
            </div>
            <p style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0 44px' }}>Resumen de saldos activos por paciente</p>
          </div>

          {/* Search Bar Perfect Centering */}
          <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '9999px', padding: '10px 20px', width: '280px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', transition: 'all 0.2s' }}>
            <Search size={14} style={{ color: '#94a3b8', flexShrink: 0 }} />
            <input 
              type="text" 
              placeholder="Buscar paciente..."
              style={{ background: 'transparent', border: 'none', outline: 'none', marginLeft: '12px', fontSize: '11px', fontWeight: 700, color: '#334155', width: '100%', padding: 0 }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
       </div>
       <div className="overflow-x-auto">
          <table className="w-full text-left">
             <thead>
                <tr className="bg-slate-50/30 border-b border-slate-100/50">
                   <th style={{ padding: '20px 40px', fontSize: '9px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Paciente</th>
                   <th style={{ padding: '20px 24px', textAlign: 'center', fontSize: '9px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Estado Financiero</th>
                   <th style={{ padding: '20px 24px', textAlign: 'center', fontSize: '9px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Saldo Pendiente</th>
                   <th style={{ padding: '20px 40px' }}></th>
                </tr>
             </thead>
             <tbody className="divide-y divide-slate-50/50">
                {patientFinancials.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ padding: '64px 40px', textAlign: 'center' }}>
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center">
                          <Users size={24} className="text-slate-200" />
                        </div>
                        <p className="text-xs font-black text-slate-300 uppercase tracking-widest">No se encontraron pacientes{searchTerm ? ' para esta búsqueda' : ''}</p>
                      </div>
                    </td>
                  </tr>
                ) : patientFinancials.map(pf => (
                  <tr key={pf.id} onClick={() => navigate(`/paciente/${pf.id}/estado-cuenta`)} className="hover:bg-slate-50/80 transition-all group cursor-pointer">
                     <td style={{ padding: '20px 40px' }}>
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all duration-300 shrink-0">
                              <UserIcon size={16} />
                           </div>
                           <div className="flex flex-col">
                               <span className="text-sm font-black text-slate-700 group-hover:text-primary transition-colors">{pf.name}</span>
                               <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                                 {pf.paymentCount > 0 ? `${pf.paymentCount} pago${pf.paymentCount !== 1 ? 's' : ''} registrado${pf.paymentCount !== 1 ? 's' : ''}` : 'Sin pagos aún'}
                               </span>
                            </div>
                        </div>
                     </td>
                     <td style={{ padding: '20px 24px', textAlign: 'center' }}>
                        <div style={{ 
                          display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '7px', fontWeight: 900, textTransform: 'uppercase', 
                          padding: '4px 10px', borderRadius: '9999px', width: 'fit-content',
                          border: pf.balance <= 0 ? '1px solid #d1fae5' : '1px solid #ffe4e6',
                          backgroundColor: pf.balance <= 0 ? '#ecfdf5' : '#fff1f2',
                          color: pf.balance <= 0 ? '#059669' : '#e11d48'
                        }}>
                           {pf.balance <= 0 ? <CheckCircle size={10} strokeWidth={3} /> : <AlertCircle size={10} strokeWidth={3} />}
                           {pf.balance <= 0 ? 'Solvente' : 'Con Deuda'}
                        </div>
                     </td>
                      <td style={{ padding: '20px 24px', textAlign: 'center' }}>
                         <span style={{ fontSize: '13px', fontWeight: 900, letterSpacing: '-0.02em', color: pf.balance > 0 ? '#e11d48' : '#059669' }}>
                            {formatPrice(pf.balance)}
                         </span>
                      </td>
                     <td style={{ padding: '20px 40px', textAlign: 'right' }}>
                        <div className="flex items-center justify-end gap-3">
                          {pf.balance > 1 && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                const msg = `Hola ${pf.name}, te saludamos de la ${clinicName}. Te escribimos para recordarte amablemente que tienes un saldo pendiente de ${formatPrice(pf.balance)}. ¡Feliz día!`;
                                window.open(`https://wa.me/${pf.phone || ''}?text=${encodeURIComponent(msg)}`, '_blank');
                              }}
                              title="Notificar Cobro"
                              className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                            >
                              <MessageCircle size={14} fill="currentColor" className="fill-transparent group-hover:fill-white" />
                            </button>
                          )}
                          <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-50 text-slate-300 group-hover:bg-primary group-hover:text-white transition-all transform group-hover:translate-x-1">
                            <ChevronRight size={16} />
                          </div>
                        </div>
                     </td>
                  </tr>
                ))}
             </tbody>
          </table>
       </div>
      </div>
    </div>
  );
};

export default AccountsTab;
