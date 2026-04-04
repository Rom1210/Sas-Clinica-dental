import React from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, TrendingDown, AlertCircle } from 'lucide-react';

const FinancialDetailModal = ({ 
  activeDetail, setActiveDetail, 
  filteredInvoices, filteredExpenses, patientFinancials, 
  totalFilteredIncome, totalFilteredExpenses, safeStats,
  formatPrice, navigate 
}) => {
  if (!activeDetail) return null;

  const getLabel = () => {
    switch(activeDetail) {
      case 'income': return 'Ingresos Totales';
      case 'expenses': return 'Egresos Totales';
      case 'receivables': return 'Por Cobrar';
      case 'net': return 'Balance Neto';
      default: return 'Detalle';
    }
  };

  const getSub = () => {
    switch(activeDetail) {
      case 'income': return 'Historial de facturación';
      case 'expenses': return 'Desglose de gastos';
      case 'receivables': return 'Cuentas pendientes';
      default: return 'Resumen de balance';
    }
  };

  return createPortal(
    <div 
      onClick={() => setActiveDetail(null)}
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', animation: 'fadeIn 0.3s ease' }}
    >
      <div 
        onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: '500px', maxHeight: '85vh', backgroundColor: 'white', borderRadius: '32px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        <div style={{ padding: '40px 40px 24px 40px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#1e293b', margin: 0, letterSpacing: '-0.02em' }}>{getLabel()}</h3>
              <p style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.15em', margin: 0 }}>{getSub()}</p>
           </div>
           <button 
            onClick={() => setActiveDetail(null)}
            style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', border: 'none', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>

        <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '0 40px 24px 40px' }}>
           {activeDetail === 'income' && (
             <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {filteredInvoices.length === 0 ? (
                  <div style={{ padding: '80px 0', textAlign: 'center', color: '#cbd5e1', fontWeight: 900, textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.15em', lineHeight: '1.6' }}>No hay ingresos<br/>registrados en este periodo</div>
                ) : filteredInvoices.slice().reverse().map((inv, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid #f8fafc' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '12px', backgroundColor: '#f8fafc', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                           <Plus size={14} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                           <span style={{ fontSize: '13px', fontWeight: 900, color: '#334155' }}>{inv.patientName}</span>
                           <span style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Factura #{inv.invoice_number} • {new Date(inv.created_at).toLocaleDateString()}</span>
                        </div>
                     </div>
                     <span style={{ fontSize: '14px', fontWeight: 900, color: '#059669', letterSpacing: '-0.02em' }}>+{formatPrice(inv.total_amount)}</span>
                  </div>
                ))}
             </div>
           )}

           {activeDetail === 'expenses' && (
             <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {filteredExpenses.length === 0 ? (
                  <div style={{ padding: '80px 0', textAlign: 'center', color: '#cbd5e1', fontWeight: 900, textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.15em', lineHeight: '1.6' }}>No hay egresos<br/>registrados en este periodo</div>
                ) : filteredExpenses.slice().reverse().map((e, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid #f8fafc' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '12px', backgroundColor: '#f8fafc', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                           <TrendingDown size={14} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                           <span style={{ fontSize: '13px', fontWeight: 900, color: '#334155' }}>{e.provider || 'Proveedor'}</span>
                           <span style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>{e.category} • {e.date}</span>
                        </div>
                     </div>
                     <span style={{ fontSize: '14px', fontWeight: 900, color: '#e11d48', letterSpacing: '-0.02em' }}>-{formatPrice(e.currency === 'VES' ? (e.amount / (e.exchange_rate || 45)) : e.amount)}</span>
                  </div>
                ))}
             </div>
           )}

           {activeDetail === 'receivables' && (
             <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {patientFinancials.filter(pf => pf.balance > 0).length === 0 ? (
                  <div style={{ padding: '80px 0', textAlign: 'center', color: '#cbd5e1', fontWeight: 900, textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.15em', lineHeight: '1.6' }}>Todo está al día.<br/>No hay deudas activas.</div>
                ) : patientFinancials.filter(pf => pf.balance > 0).map((pf, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid #f8fafc' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '12px', backgroundColor: '#fff1f2', color: '#e11d48', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                           <AlertCircle size={14} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                           <span style={{ fontSize: '13px', fontWeight: 900, color: '#334155' }}>{pf.name}</span>
                           <button 
                            onClick={() => { setActiveDetail(null); navigate(`/paciente/${pf.id}/estado-cuenta`); }}
                            style={{ background: 'none', border: 'none', padding: 0, textAlign: 'left', color: '#2563eb', fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', cursor: 'pointer', letterSpacing: '0.05em' }}
                          >
                             Ver estado de cuenta
                          </button>
                        </div>
                     </div>
                     <span style={{ fontSize: '14px', fontWeight: 900, color: '#e11d48', letterSpacing: '-0.02em' }}>{formatPrice(pf.balance)}</span>
                  </div>
                ))}
             </div>
           )}

           {activeDetail === 'net' && (
             <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingTop: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                   <div style={{ padding: '20px', backgroundColor: '#f8fafc', borderRadius: '20px', border: '1px solid #f1f5f9' }}>
                      <span style={{ fontSize: '9px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '8px' }}>Ingresos</span>
                      <span style={{ fontSize: '20px', fontWeight: 900, color: '#059669', letterSpacing: '-0.02em' }}>{formatPrice(totalFilteredIncome)}</span>
                   </div>
                   <div style={{ padding: '20px', backgroundColor: '#f8fafc', borderRadius: '20px', border: '1px solid #f1f5f9' }}>
                      <span style={{ fontSize: '9px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '8px' }}>Egresos</span>
                      <span style={{ fontSize: '20px', fontWeight: 900, color: '#e11d48', letterSpacing: '-0.02em' }}>-{formatPrice(totalFilteredExpenses)}</span>
                   </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                   <h4 style={{ fontSize: '9px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 4px 4px' }}>Métodos de Pago (Cobrado)</h4>
                    {['Zelle', 'Efectivo', 'Pago Móvil', 'Transferencia'].map(method => {
                     const amount = filteredInvoices.filter(inv => inv.method === method).reduce((acc, inv) => acc + (inv.total_amount || 0), 0);
                     return (
                       <div key={method} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f8fafc' }}>
                         <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569' }}>{method}</span>
                         <span style={{ fontSize: '11px', fontWeight: 900, color: '#1e293b' }}>{formatPrice(amount)}</span>
                       </div>
                     );
                   })}
                </div>
             </div>
           )}
        </div>

        <div style={{ padding: '16px 40px 40px 40px', backgroundColor: 'white' }}>
           <button 
            onClick={() => setActiveDetail(null)}
            style={{ width: '100%', padding: '16px 0', backgroundColor: '#1e293b', color: 'white', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', borderRadius: '16px', border: 'none', cursor: 'pointer', boxShadow: '0 10px 25px -5px rgba(30, 41, 59, 0.3)' }}
          >
            Cerrar Detalle
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default FinancialDetailModal;
