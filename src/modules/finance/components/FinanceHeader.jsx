import React, { useState } from 'react';
import { ChevronDown, Calendar as CalendarIcon, Plus, History, Search } from 'lucide-react';

const Dropdown = ({ value, options, onChange, labelKey = 'label', valueKey = 'value', width = 130 }) => {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o[valueKey] === value);
  return (
    <div style={{ position: 'relative', width }}>
      <button
        onClick={() => setOpen(p => !p)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0.45rem 0.875rem', background: 'white', border: '1.5px solid #E2E8F0',
          borderRadius: '0.625rem', fontSize: '0.8rem', fontWeight: 600, color: '#1E293B',
          cursor: 'pointer', gap: '0.5rem', transition: 'all 0.15s',
          boxShadow: open ? '0 0 0 3px rgba(37,99,235,0.1)' : 'none',
          borderColor: open ? '#2563EB' : '#E2E8F0'
        }}
      >
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {selected?.[labelKey] || value}
        </span>
        <ChevronDown size={14} style={{ color: '#94A3B8', flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 100 }} />
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
            background: 'white', border: '1.5px solid #E2E8F0', borderRadius: '0.75rem',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 101, overflow: 'hidden', padding: '0.25rem',
          }}>
            {options.map(opt => (
              <button
                key={opt[valueKey]}
                onClick={() => { onChange(opt[valueKey]); setOpen(false); }}
                style={{
                  width: '100%', textAlign: 'left', padding: '0.5rem 0.875rem',
                  background: opt[valueKey] === value ? '#EFF6FF' : 'transparent',
                  color: opt[valueKey] === value ? '#2563EB' : '#334155',
                  fontWeight: opt[valueKey] === value ? 700 : 500,
                  fontSize: '0.8rem', border: 'none', borderRadius: '0.5rem',
                  cursor: 'pointer', transition: 'all 0.1s',
                }}
                onMouseOver={e => { if (opt[valueKey] !== value) e.currentTarget.style.background = '#F8FAFC'; }}
                onMouseOut={e => { if (opt[valueKey] !== value) e.currentTarget.style.background = 'transparent'; }}
              >
                {opt[labelKey]}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const FinanceHeader = ({ 
  viewMode, setViewMode, 
  selectedMonth, setSelectedMonth, 
  selectedYear, setSelectedYear, 
  selectedWeek, setSelectedWeek, 
  monthOptions, yearOptions, WEEKS, tabs, tabLabels, now,
  setShowModal, setShowPaymentModal, activeTab, setActiveTab, exchangeRate
}) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px', marginBottom: '8px' }}>
       <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <h2 className="text-2xl font-black text-slate-800 tracking-tighter uppercase leading-none">Finanzas</h2>
          <div className="flex items-center gap-3">
             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Gestión de caja y balance operativo</p>
             <div className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[8px] font-black text-slate-500 uppercase tracking-widest">
                Tasa: {exchangeRate || '45.50'} BS/$
             </div>
          </div>
       </div>

       {/* Module Navigation Tabs (Saldos, Facturas, Egresos) */}
       <div style={{ display: 'flex', backgroundColor: '#f1f5f9', padding: '4px', borderRadius: '14px', gap: '2px' }}>
          {[
            { id: 'accounts', label: 'Saldos' },
            { id: 'invoices', label: 'Facturas' },
            { id: 'expenses', label: 'Egresos' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '8px 20px', borderRadius: '10px', border: 'none', fontSize: '10px', fontWeight: 900,
                textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', transition: 'all 0.2s',
                backgroundColor: activeTab === tab.id ? '#2563eb' : 'transparent',
                color: activeTab === tab.id ? 'white' : '#64748b',
                boxShadow: activeTab === tab.id ? '0 4px 12px rgba(37, 99, 235, 0.2)' : 'none'
              }}
            >
              {tab.label}
            </button>
          ))}
       </div>

       <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {(viewMode === 'day' || viewMode === 'week' || viewMode === 'month') && (
            <Dropdown value={selectedMonth} options={monthOptions} onChange={setSelectedMonth} width={130} />
          )}
          
          {viewMode === 'week' && (
            <Dropdown value={selectedWeek} options={WEEKS} onChange={setSelectedWeek} width={130} />
          )}

          <Dropdown value={selectedYear} options={yearOptions} onChange={setSelectedYear} width={90} />

          {/* View Mode Tabs Pill Shape */}
          <div style={{
            display: 'flex', background: '#F1F5F9', borderRadius: '0.8rem',
            padding: '4px', gap: '2px',
          }}>
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => { setViewMode(tab); if(tab === 'month') setSelectedMonth(now.getMonth()); }}
                style={{
                  padding: '0.45rem 1rem', borderRadius: '0.625rem', border: 'none',
                  fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
                  background: viewMode === tab ? '#2563EB' : 'transparent',
                  color: viewMode === tab ? 'white' : '#64748B',
                  transition: 'all 0.2s', letterSpacing: '0.02em',
                  boxShadow: viewMode === tab ? '0 4px 10px rgba(37,99,235,0.2)' : 'none',
                }}
              >
                {tabLabels[tab]}
              </button>
            ))}
          </div>

          {/* Action Buttons Integration */}
          {activeTab === 'expenses' && (
            <div className="flex gap-3 ml-2">
              <button 
                onClick={() => setShowPaymentModal(true)} 
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-all border-none cursor-pointer shadow-lg shadow-blue-200"
              >
                 <Plus size={14} /> Pago
              </button>
              <button 
                onClick={() => setShowModal('expense')} 
                className="flex items-center gap-2 px-6 py-2.5 bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-rose-700 transition-all border-none cursor-pointer shadow-lg shadow-rose-200"
              >
                 <Plus size={14} /> Gasto
              </button>
            </div>
          )}
       </div>
    </div>
  );
};

export default FinanceHeader;
