import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, FileText, Calendar, ChevronLeft, ChevronRight, User } from 'lucide-react';

const ClinicalHistoryTab = ({ patient, historicalItems, insightsData }) => {
  const navigate = useNavigate();
  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);
  
  const totalPages = Math.max(1, Math.ceil(historicalItems.length / PAGE_SIZE));
  const paged = useMemo(() => 
    historicalItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [historicalItems, page]
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: '860px', margin: '0 auto', paddingTop: 8 }}>
      {/* Header compacto */}
      <div style={{ background: '#fff', borderRadius: '20px', border: '1px solid #f1f5f9', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', flexShrink: 0 }}><Activity size={20} strokeWidth={2.5} /></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '11px', fontWeight: 900, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Historia Clínica</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#ecfdf5', padding: '2px 8px', borderRadius: '999px', border: '1px solid #d1fae5' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
                <span style={{ fontSize: '9px', fontWeight: 900, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Activo</span>
              </div>
            </div>
            {historicalItems.length > 0 ? (
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>Último: <strong>{historicalItems[0].title.split(',')[0]}</strong> · <span style={{ color: '#94a3b8', fontWeight: 600 }}>{new Date(historicalItems[0].date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</span></span>
            ) : (<span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600 }}>Sin registros</span>)}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexShrink: 0 }}>
          {insightsData.nextApp && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '6px 12px' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b' }} />
              <span style={{ fontSize: '10px', fontWeight: 800, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Próx. cita: {new Date(insightsData.nextApp.starts_at || insightsData.nextApp.start_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
            </div>
          )}
          {[{ value: insightsData.total, label: 'Visitas' }, { value: insightsData.specialists, label: 'Drs.' }].map(({ value, label }) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <span style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>{value}</span>
              <span style={{ fontSize: '9px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.15em' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, paddingLeft: 4 }}>
          <span style={{ fontSize: '12px', fontWeight: 900, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Cronología · {historicalItems.length} registros</span>
          {totalPages > 1 && <span style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8' }}>Página {page} de {totalPages}</span>}
        </div>
        {historicalItems.length === 0 ? (
          <div className="p-20 text-center bg-white rounded-3xl border border-slate-100 border-dashed text-slate-400 font-bold text-lg">
            No hay historial clínico disponible.
          </div>
        ) : (
          paged.map((item, idx) => (
            <div 
              key={item.id} 
              className="bg-white px-6 py-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center gap-6 group animate-in slide-in-from-bottom-2 duration-300"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              {/* 1. Date Col */}
              <div className="flex flex-col items-center w-12 shrink-0">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter leading-none">{new Date(item.date).toLocaleDateString('es-ES', { month: 'short' })}</span>
                <span className="text-xl font-black text-slate-800 leading-tight">{new Date(item.date).getDate()}</span>
              </div>

              {/* 2. Timeline Dot */}
              <div className="flex flex-col items-center shrink-0">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-blue-50 shadow-sm"></div>
              </div>

              {/* 3. Icon Box */}
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                {React.cloneElement(item.icon, { size: 16, strokeWidth: 2.5 })}
              </div>

              {/* 4. Info Bloq */}
              <div className="flex-1 flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{item.type === 'Consulta' ? 'CONSULTA' : 'CITA'}</span>
                  <span className="text-[10px] font-bold text-slate-300">{new Date(item.date).getFullYear()} · {new Date(item.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <h4 className="text-sm font-black text-slate-800 tracking-tight">
                  {item.title} {item.amount > 0 && <span className="text-slate-400 font-bold">(${item.amount})</span>}
                </h4>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full flex items-center justify-center text-white overflow-hidden shadow-sm" style={{ background: item.doctorColor || '#2563EB' }}>
                    <User size={10} />
                  </div>
                  <span className="text-[11px] font-bold text-slate-500">{item.doctor}</span>
                </div>
              </div>

              {/* 5. Included Label (Conditional) */}
              {(!item.amount || item.amount === 0) && (
                <div className="hidden md:block px-3 py-1 bg-slate-50 text-slate-400 text-[9px] font-black uppercase tracking-widest rounded-lg border border-slate-100">
                  INCLUIDO
                </div>
              )}

              {/* 6. Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                {item.originalId && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); navigate('/scheduler', { state: { highlightId: item.originalId } }); }}
                    className="px-4 py-2 bg-white text-blue-600 hover:bg-blue-50 border border-blue-100 rounded-xl text-[10px] font-black tracking-widest transition-all cursor-pointer flex items-center gap-2"
                  >
                    AGENDA <Calendar size={12} />
                  </button>
                )}
                <button 
                  onClick={(e) => { e.stopPropagation(); navigate(`/scheduler/appointment/${item.originalId || item.id.replace('a-', '').replace('c-', '')}`, { state: { fromHistory: true } }); }}
                  className="px-4 py-2 bg-slate-900 text-white hover:bg-black rounded-xl text-[10px] font-black tracking-widest transition-all cursor-pointer flex items-center gap-2 shadow-lg shadow-slate-200"
                >
                  VER <ChevronRight size={14} />
                </button>
              </div>
            </div>
          ))
        )}
        {historicalItems.length > PAGE_SIZE && (
          <div className="mt-10 flex items-center justify-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <button 
              onClick={() => { setPage(p => Math.max(1, p - 1)); }}
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
              onClick={() => { setPage(p => Math.min(totalPages, p + 1)); }}
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

export default ClinicalHistoryTab;
