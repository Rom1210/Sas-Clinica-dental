import React, { useState } from 'react';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';

const FinanceTab = ({ debtSummary, financialHistory, onRegisterPayment }) => {
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;
  const totalPages = Math.ceil(financialHistory.length / PAGE_SIZE);
  const pagedItems = financialHistory.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="flex flex-col gap-8">
      {/* Quick Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col gap-1 relative overflow-hidden group hover:shadow-xl transition-all">
          <div className={`absolute top-0 right-0 w-2 h-full ${debtSummary.balance > 0 ? 'bg-rose-500' : 'bg-emerald-500'}`}></div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest relative z-10">Saldo Pendiente</span>
          <span className={`text-3xl font-black relative z-10 ${debtSummary.balance > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
            ${debtSummary.balance.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
          </span>
          <span className={`text-[10px] font-black uppercase tracking-tighter relative z-10 ${debtSummary.balance > 0 ? 'text-rose-300' : 'text-emerald-300'}`}>
             {debtSummary.balance > 0 ? '• Acción requerida' : '• Estado solvente'}
          </span>
        </div>
        
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col gap-1 relative overflow-hidden group hover:shadow-xl transition-all">
          <div className="absolute top-0 right-0 w-2 h-full bg-slate-800"></div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest relative z-10">Total Facturado</span>
          <span className="text-3xl font-black text-slate-800 relative z-10">
            ${debtSummary.totalDue.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] font-black text-slate-300 uppercase tracking-tighter relative z-10">Historial acumulado</span>
        </div>
        
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col gap-1 relative overflow-hidden group hover:shadow-xl transition-all">
          <div className="absolute top-0 right-0 w-2 h-full bg-emerald-400"></div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest relative z-10">Total Pagado</span>
          <span className="text-3xl font-black text-emerald-500 relative z-10">
            ${debtSummary.totalPaid.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] font-black text-emerald-300 uppercase tracking-tighter relative z-10">Capital recuperado</span>
        </div>

        <div 
          onClick={onRegisterPayment}
          className="bg-primary rounded-3xl p-6 shadow-lg shadow-primary/20 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-blue-600 transition-all transform hover:-translate-y-1 active:translate-y-0"
        >
          <Plus size={32} className="text-white" />
          <span className="text-[11px] font-black text-white uppercase tracking-widest">Registrar Pago</span>
        </div>
      </div>

      {/* Detailed Transaction List */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center mb-2 px-4">
           <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Movimientos de Cuenta</h3>
           <span className="text-[10px] font-black text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-100 shadow-sm">{financialHistory.length} REGISTROS</span>
        </div>
        
        <div className="flex flex-col gap-3">
          {financialHistory.length === 0 ? (
            <div className="p-20 text-center bg-white rounded-[40px] border border-slate-100 border-dashed text-slate-400 font-bold text-lg">
              Sin movimientos registrados.
            </div>
          ) : (
            pagedItems.map((item, idx) => (
              <div 
                key={item.id} 
                className="bg-white px-8 py-5 rounded-[24px] border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between group animate-in slide-in-from-bottom-2 duration-300"
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                <div className="flex items-center gap-6">
                  {/* Status Indicator Pill */}
                  <div className={`w-1.5 h-10 rounded-full ${item.type === 'charge' ? 'bg-rose-100' : item.type === 'credit' ? 'bg-emerald-100' : 'bg-blue-100'}`}></div>
                  
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                       <span className={`text-[9px] font-black uppercase tracking-widest ${item.type === 'charge' ? 'text-rose-400' : item.type === 'credit' ? 'text-emerald-400' : 'text-blue-400'}`}>
                         {item.type === 'charge' ? 'CARGO' : item.type === 'credit' ? 'ABONO' : 'CITA'}
                       </span>
                       <span className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter">
                         {new Date(item.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                       </span>
                    </div>
                    <h4 className="text-sm font-black text-slate-800 tracking-tight">{item.label}</h4>
                    <span className="text-[11px] font-bold text-slate-400">{item.description}</span>
                  </div>
                </div>

                <div className="flex items-center gap-10">
                  <div className="flex flex-col items-end">
                    <span className={`text-lg font-black tracking-tighter ${item.type === 'charge' ? 'text-slate-800' : item.type === 'credit' ? 'text-emerald-500' : 'text-blue-500'}`}>
                      {item.type === 'charge' ? '-' : item.type === 'credit' ? '+' : ''}${item.amount.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{item.status}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className={`p-2 rounded-xl border border-slate-100 transition-all ${page === 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-50 cursor-pointer text-slate-600'}`}
            >
              <ChevronLeft size={20} />
            </button>
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl">
              <span className="text-xs font-black text-slate-400">PÁGINA</span>
              <span className="text-sm font-black text-slate-800">{page}</span>
              <span className="text-xs font-black text-slate-300">DE {totalPages}</span>
            </div>
            <button 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className={`p-2 rounded-xl border border-slate-100 transition-all ${page === totalPages ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-50 cursor-pointer text-slate-600'}`}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinanceTab;
