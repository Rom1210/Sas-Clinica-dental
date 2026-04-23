import React, { useState } from 'react';
import { Plus, ChevronLeft, ChevronRight, DollarSign, Wallet, FileText } from 'lucide-react';

const FinanceTab = ({ debtSummary, financialHistory, onRegisterPayment }) => {
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;
  const totalPages = Math.ceil(financialHistory.length / PAGE_SIZE);
  const pagedItems = financialHistory.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="flex flex-col gap-6">
      {/* Quick Summary Cards (Horizontal Pill Design) */}
      <div className="flex flex-col md:flex-row gap-4 mb-2">
        
        {/* Financial Stats Container */}
        <div 
          className="flex-1 bg-white/90 backdrop-blur-md shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-slate-100/50 flex items-center justify-between transition-all hover:shadow-[0_12px_40px_rgba(37,99,235,0.08)] px-8 py-5"
          style={{ borderRadius: '2.5rem' }}
        >
           {/* Saldo Pendiente */}
           <div className="flex flex-col flex-1 items-center text-center">
              <span className="font-black text-slate-400 uppercase tracking-widest mb-1.5" style={{ fontSize: '9px', letterSpacing: '0.15em' }}>Saldo Pendiente</span>
              <div className="flex items-center justify-center gap-3">
                 <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${debtSummary.balance > 0 ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`}>
                    <Wallet size={18} strokeWidth={2.5} />
                 </div>
                 <span className={`font-[1000] tracking-tighter ${debtSummary.balance > 0 ? 'text-rose-500' : 'text-emerald-500'}`} style={{ fontSize: '26px' }}>
                   ${debtSummary.balance.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                 </span>
                 {debtSummary.balance > 0 && (
                   <span className="bg-rose-50 text-rose-600 font-black uppercase tracking-widest px-2.5 py-1 rounded-full ml-1 shadow-sm border border-rose-100" style={{ fontSize: '8px' }}>Deuda</span>
                 )}
              </div>
           </div>

           <div className="h-12 w-px bg-slate-200/80 mx-6"></div>

           {/* Total Facturado */}
           <div className="flex flex-col flex-1 items-center text-center">
              <span className="font-black text-slate-400 uppercase tracking-widest mb-1.5" style={{ fontSize: '9px', letterSpacing: '0.15em' }}>Total Facturado</span>
              <div className="flex items-center justify-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center">
                    <FileText size={18} strokeWidth={2.5} />
                 </div>
                 <span className="font-[1000] tracking-tighter text-slate-800" style={{ fontSize: '26px' }}>
                   ${debtSummary.totalDue.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                 </span>
              </div>
           </div>

           <div className="h-12 w-px bg-slate-200/80 mx-6"></div>

           {/* Total Pagado */}
           <div className="flex flex-col flex-1 items-center text-center">
              <span className="font-black text-slate-400 uppercase tracking-widest mb-1.5" style={{ fontSize: '9px', letterSpacing: '0.15em' }}>Total Pagado</span>
              <div className="flex items-center justify-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
                    <DollarSign size={18} strokeWidth={2.5} />
                 </div>
                 <span className="font-[1000] tracking-tighter text-emerald-500" style={{ fontSize: '26px' }}>
                   ${debtSummary.totalPaid.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                 </span>
              </div>
           </div>
        </div>

        {/* Registrar Pago Button */}
        <button 
          onClick={onRegisterPayment}
          className="bg-slate-900 flex items-center justify-center gap-3 cursor-pointer group border-none text-white transition-all hover:bg-primary shadow-[0_10px_30px_rgba(15,23,42,0.1)] hover:shadow-[0_15px_40px_rgba(37,99,235,0.25)] hover:-translate-y-0.5 px-8"
          style={{ borderRadius: '2.5rem' }}
        >
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform duration-300">
            <Plus size={18} strokeWidth={3} className="text-white" />
          </div>
          <span className="font-black uppercase tracking-[0.15em]" style={{ fontSize: '11px' }}>Registrar<br/>Pago</span>
        </button>
      </div>

      {/* Detailed Transaction List */}
      <div className="flex flex-col gap-3 mt-4">
        <div className="flex justify-between items-center mb-1 px-2">
           <h3 className="font-black text-slate-400 uppercase" style={{ fontSize: '11px', letterSpacing: '0.2em' }}>Movimientos de Cuenta</h3>
           <span className="font-black text-slate-400 bg-white/60 px-3 py-1 rounded-full border border-slate-200/50" style={{ fontSize: '9px' }}>{financialHistory.length} REGISTROS</span>
        </div>
        
        <div className="flex flex-col gap-2">
          {financialHistory.length === 0 ? (
            <div className="p-12 text-center bg-white/50 backdrop-blur-sm border border-slate-100 border-dashed text-slate-400 font-bold" style={{ borderRadius: '1.5rem', fontSize: '13px' }}>
              Sin movimientos registrados.
            </div>
          ) : (
            pagedItems.map((item, idx) => (
              <div 
                key={item.id} 
                className="bg-white/80 backdrop-blur-md border border-white/80 shadow-sm flex items-center justify-between group transition-all"
                style={{ 
                  borderRadius: '1.25rem', 
                  padding: '1rem 1.5rem', 
                  animationDelay: `${idx * 40}ms`,
                  boxShadow: '0 4px 15px rgba(0,0,0,0.02)'
                }}
                onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.05)'; }}
                onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.02)'; }}
              >
                <div className="flex items-center gap-4">
                  {/* Status Indicator Pill */}
                  <div className={`w-1.5 h-10 rounded-full shadow-inner ${item.type === 'charge' ? 'bg-rose-200' : item.type === 'credit' ? 'bg-emerald-200' : 'bg-blue-200'}`}></div>
                  
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2 mb-0.5">
                       <span className={`font-black uppercase tracking-widest ${item.type === 'charge' ? 'text-rose-400' : item.type === 'credit' ? 'text-emerald-400' : 'text-blue-400'}`} style={{ fontSize: '8px' }}>
                         {item.type === 'charge' ? 'CARGO' : item.type === 'credit' ? 'ABONO' : 'CITA'}
                       </span>
                       <span className="font-bold text-slate-300 uppercase tracking-tighter" style={{ fontSize: '9px' }}>
                         {new Date(item.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                       </span>
                    </div>
                    <h4 className="font-black text-slate-800 tracking-tight" style={{ fontSize: '13px' }}>{item.label}</h4>
                    <span className="font-bold text-slate-400" style={{ fontSize: '11px' }}>{item.description}</span>
                  </div>
                </div>

                <div className="flex items-center gap-10">
                  <div className="flex flex-col items-end">
                    <span className={`font-[1000] tracking-tighter ${item.type === 'charge' ? 'text-slate-800' : item.type === 'credit' ? 'text-emerald-500' : 'text-blue-500'}`} style={{ fontSize: '16px' }}>
                      {item.type === 'charge' ? '-' : item.type === 'credit' ? '+' : ''}${item.amount.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="font-black text-slate-300 uppercase tracking-widest mt-0.5" style={{ fontSize: '8px' }}>{item.status}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-3 bg-white/80 backdrop-blur-md max-w-fit mx-auto" style={{ borderRadius: '9999px', padding: '0.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1px solid rgba(255,255,255,0.6)' }}>
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className={`p-2 rounded-full border-none transition-all ${page === 1 ? 'opacity-30 cursor-not-allowed bg-transparent' : 'hover:bg-slate-100 cursor-pointer text-slate-600 bg-transparent'}`}
            >
              <ChevronLeft size={16} strokeWidth={2.5} />
            </button>
            <div className="flex items-center gap-2 px-4 py-1.5 bg-slate-900 rounded-full shadow-inner text-white">
              <span className="font-black uppercase" style={{ fontSize: '9px', letterSpacing: '0.1em' }}>Pág</span>
              <span className="font-black" style={{ fontSize: '11px' }}>{page}</span>
              <span className="font-black text-slate-400" style={{ fontSize: '9px', letterSpacing: '0.1em' }}>/ {totalPages}</span>
            </div>
            <button 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className={`p-2 rounded-full border-none transition-all ${page === totalPages ? 'opacity-30 cursor-not-allowed bg-transparent' : 'hover:bg-slate-100 cursor-pointer text-slate-600 bg-transparent'}`}
            >
              <ChevronRight size={16} strokeWidth={2.5} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinanceTab;
