import React from 'react';
import { ArrowLeft, Calendar } from 'lucide-react';

const PatientHeader = ({ patient, onBack, onSchedule }) => {
  if (!patient) return null;

  return (
    <div className="flex flex-col gap-6">
      {/* Back Button & Actions */}
      <div className="flex justify-between items-center">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-600 transition-all font-black text-[10px] uppercase tracking-[0.1em] cursor-pointer border border-slate-100 bg-white px-5 py-2.5 rounded-xl shadow-sm hover:shadow-md active:scale-95 group"
        >
          <ArrowLeft size={14} strokeWidth={3} className="group-hover:-translate-x-1 transition-transform" /> VOLVER A PACIENTES
        </button>
      </div>

      {/* Top Patient Info Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col gap-6 border border-slate-100">
        <h2 className="text-xl font-bold text-slate-800">Paciente</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-y-6 gap-x-12">
          <div className="flex flex-col gap-1">
            <span className="text-sm text-slate-500">Nombre</span>
            <span className="text-base font-bold text-slate-800">{patient?.first_name || patient?.name?.split(' ')[0] || 'Fabian'}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-sm text-slate-500">Apellido</span>
            <span className="text-base font-bold text-slate-800">{patient?.last_name || patient?.name?.split(' ').slice(1).join(' ') || 'Romero'}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-sm text-slate-500">Email</span>
            <span className="text-base font-bold text-slate-800">{patient?.email || 'N/A'}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-sm text-slate-500">Número de teléfono</span>
            <span className="text-base font-bold text-slate-800">{patient?.phone || 'N/A'}</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', borderRadius: '16px', border: '1.5px dashed #e2e8f0', marginTop: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>🔔</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#334155' }}>Recordatorios Automáticos por WhatsApp</span>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', lineHeight: 1.4 }}>El paciente recibirá un aviso 24h antes de cada cita automáticamente.</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 14px', background: 'linear-gradient(135deg, #667eea, #764ba2)', borderRadius: '999px', flexShrink: 0 }}>
            <span style={{ fontSize: '9px', fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.12em', whiteSpace: 'nowrap' }}>✦ Plan Superior</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientHeader;
