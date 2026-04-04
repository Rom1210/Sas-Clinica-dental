import React from 'react';
import { TrendingUp, Plus, Receipt, User as UserIcon } from 'lucide-react';

const InvoicesTab = ({ filteredInvoices, totalFilteredIncome, formatPrice, setShowPaymentModal }) => {
  return (
    <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-2 duration-300">
      <div className="flex justify-between items-center bg-emerald-50 px-6 py-4 rounded-2xl border border-emerald-100/50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center">
            <TrendingUp className="text-emerald-600" size={18} />
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest mb-0.5">Ingreso del Periodo (Cobrado)</span>
            <span className="text-2xl font-black text-emerald-600 tracking-tighter">+{formatPrice(totalFilteredIncome)}</span>
          </div>
        </div>
        <button 
          onClick={() => setShowPaymentModal(true)} 
          className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-700 transition-all border-none cursor-pointer shadow-lg shadow-emerald-200"
        >
           <Plus size={14} /> Registrar Pago
        </button>
      </div>

      <div className="professional-card p-0 overflow-hidden border-none shadow-sm bg-white">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Fecha / Ref</th>
              <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Paciente</th>
              <th className="px-6 py-4 text-right text-[9px] font-black text-slate-400 uppercase tracking-widest">Monto</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan="3" className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center">
                      <Receipt size={22} className="text-slate-300" />
                    </div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Sin facturaciones registradas</p>
                  </div>
                </td>
              </tr>
            ) : filteredInvoices.slice().reverse().map(inv => (
              <tr key={inv.id} className="hover:bg-slate-50 transition-all cursor-pointer group">
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter mb-0.5">{new Date(inv.created_at).toLocaleDateString()}</span>
                    <span className="text-xs font-bold text-slate-700">Factura #{inv.invoice_number || 'N/A'}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                       <UserIcon size={12} strokeWidth={2.5} />
                    </div>
                    <span className="text-[11px] font-black text-slate-700">{inv.patientName}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="text-sm font-black text-emerald-600">+{formatPrice(inv.total_amount)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InvoicesTab;
