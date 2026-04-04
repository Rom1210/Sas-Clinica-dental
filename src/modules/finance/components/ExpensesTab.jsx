import React from 'react';
import { TrendingDown, Plus, Receipt } from 'lucide-react';

const ExpensesTab = ({ filteredExpenses, totalFilteredExpenses, formatPrice, setShowModal, setShowPaymentModal, exchangeRate }) => {
  return (
    <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-2 duration-300">
      <div className="flex justify-between items-center bg-rose-50 px-6 py-4 rounded-2xl border border-rose-100/50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center">
            <TrendingDown className="text-rose-600" size={18} />
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] font-black text-rose-400 uppercase tracking-widest mb-0.5">Gasto del Periodo</span>
            <span className="text-2xl font-black text-rose-600 tracking-tighter">-{formatPrice(totalFilteredExpenses)}</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowPaymentModal(true)} 
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-all border-none cursor-pointer shadow-lg shadow-blue-200"
          >
             <Plus size={14} /> Registrar Pago
          </button>
          <button 
            onClick={() => setShowModal('expense')} 
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-all border-none cursor-pointer shadow-lg shadow-slate-200"
          >
             <Plus size={14} /> Registrar Gasto
          </button>
        </div>
      </div>

      <div className="professional-card p-0 overflow-hidden border-none shadow-sm bg-white">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Fecha / Proveedor</th>
              <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Concepto</th>
              <th className="px-6 py-4 text-right text-[9px] font-black text-slate-400 uppercase tracking-widest">Monto</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredExpenses.length === 0 ? (
              <tr>
                <td colSpan="3" className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center">
                      <Receipt size={22} className="text-slate-300" />
                    </div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Sin egresos registrados</p>
                    <p className="text-[10px] text-slate-300 font-medium">Registra un gasto usando el botón de arriba</p>
                  </div>
                </td>
              </tr>
            ) : filteredExpenses.map(exp => (
              <tr key={exp.id} className="hover:bg-slate-50 transition-all">
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter mb-0.5">{exp.date}</span>
                    <span className="text-xs font-bold text-slate-700">{exp.provider}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-[11px] font-medium text-slate-600 block">{exp.description}</span>
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 mt-1 inline-block bg-slate-100 px-2 py-0.5 rounded">{exp.category}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex flex-col items-end">
                    <span className="text-xs font-black text-rose-600">
                      -{formatPrice(exp.amount_usd || (exp.currency === 'VES' ? (exp.amount / (exp.exchange_rate || exchangeRate)) : exp.amount))}
                    </span>
                    {exp.currency === 'VES' && (
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                        ({exp.amount} BS)
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExpensesTab;
