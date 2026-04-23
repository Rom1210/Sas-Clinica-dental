import { Search, Calendar, FileText, ChevronLeft, ChevronRight, Info, Clock } from 'lucide-react';
import Odontogram from '../../../Odontogram';

const GeneralTab = ({ patient, consultations, nextAppointment, onSchedule, onViewHistory }) => {
  const nextAppDate = nextAppointment ? new Date(nextAppointment.starts_at || nextAppointment.start_at) : null;
  const formattedNextDate = nextAppDate ? nextAppDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }) : null;
  const formattedNextTime = nextAppDate ? nextAppDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'UTC' }) : null;

  return (
    <div className="flex flex-col gap-8">
      {/* Resumen de Citas Widgets (Horizontal, Elegantes, Compactos) */}
      <div className="flex flex-col gap-4">
        
        {/* Próxima Cita Row */}
        <div className="bg-white/90 backdrop-blur-md p-4 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-slate-100/50 flex items-center justify-between transition-all hover:shadow-[0_12px_40px_rgba(37,99,235,0.08)] group"
             style={{ borderRadius: '2rem' }}>
          <div className="flex items-center gap-5">
            <div className={`w-14 h-14 rounded-2xl ${nextAppointment ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-50 text-slate-400 group-hover:bg-primary/5 group-hover:text-primary'} flex items-center justify-center transition-all duration-500`}>
               <Calendar size={20} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
               <span className="font-black uppercase tracking-[0.2em] text-slate-400 mb-0.5" style={{ fontSize: '9px' }}>Estado de Agenda</span>
               <div className="flex items-center gap-2">
                 <span className="font-bold text-slate-800" style={{ fontSize: '16px' }}>Próxima Cita</span>
                 {nextAppointment && (
                   <span className="bg-emerald-50 text-emerald-600 font-black uppercase tracking-widest px-2 py-0.5 rounded-full" style={{ fontSize: '8px' }}>Activa</span>
                 )}
               </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {nextAppointment ? (
              <div className="flex items-center gap-8 mr-2">
                <div className="flex flex-col text-right">
                  <span className="font-bold text-slate-800" style={{ fontSize: '14px' }}>
                    {formattedNextDate}
                  </span>
                  <div className="flex items-center justify-end gap-1.5 text-primary">
                    <Clock size={10} strokeWidth={3} />
                    <span className="font-black uppercase tracking-tighter" style={{ fontSize: '11px' }}>{formattedNextTime}</span>
                  </div>
                </div>
              </div>
            ) : (
              <span className="font-bold text-slate-400 mr-4" style={{ fontSize: '13px' }}>Ninguna cita programada</span>
            )}
            
            <button 
              onClick={onSchedule}
              className={`flex items-center gap-2 border-none cursor-pointer shadow-sm transition-all font-black uppercase tracking-[0.15em] ${nextAppointment ? 'bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary/90 hover:-translate-y-0.5' : 'bg-slate-900 text-white hover:bg-primary hover:shadow-primary/30 hover:-translate-y-0.5'}`}
              style={{ borderRadius: '1.5rem', padding: '0.875rem 1.75rem', fontSize: '10px' }}
            >
              {nextAppointment ? 'Nueva Cita' : 'Agendar Cita'}
            </button>
          </div>
        </div>

        {/* Última Visita Row */}
        <div className="bg-white/90 backdrop-blur-md p-4 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-slate-100/50 flex items-center justify-between transition-all hover:shadow-[0_12px_40px_rgba(37,99,235,0.08)] group"
             style={{ borderRadius: '2rem' }}>
          
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-500 flex items-center justify-center transition-colors group-hover:bg-slate-100">
               <FileText size={20} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
               <span className="font-black uppercase tracking-[0.2em] text-slate-400 mb-0.5" style={{ fontSize: '9px' }}>Historial Clínico</span>
               <span className="font-bold text-slate-800" style={{ fontSize: '16px' }}>Última Visita</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {consultations.length > 0 ? (
              <>
                <div className="flex flex-col text-right">
                  <span className="font-bold text-slate-800" style={{ fontSize: '14px' }}>
                    {consultations[0].treatment || 'Consulta Clínica'}
                  </span>
                  <span className="font-bold text-slate-400" style={{ fontSize: '11px' }}>
                    {consultations[0].date} · {consultations[0].doctor || 'Especialista'}
                  </span>
                </div>
                
                <div className="h-8 w-px bg-slate-200 mx-2"></div>
                
                <div className="flex items-baseline gap-1 mr-2">
                   <span className="text-2xl font-[1000] text-slate-900 tracking-tighter">
                      ${consultations[0].cost || '0.00'}
                   </span>
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">USD</span>
                </div>
                
                <button 
                  onClick={onViewHistory}
                  className="flex items-center justify-center w-12 h-12 bg-slate-50 text-slate-600 rounded-full border-none cursor-pointer transition-all hover:bg-slate-900 hover:text-white hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-900/20"
                >
                   <ChevronRight size={18} strokeWidth={3} />
                </button>
              </>
            ) : (
              <span className="font-bold text-slate-400 mr-4" style={{ fontSize: '13px' }}>Sin historial previo</span>
            )}
          </div>
        </div>

      </div>

      {/* Odontograma Section */}
      <div id="odontogram-section" className="flex flex-col gap-4 mt-6">
        <div className="flex items-center gap-2 px-1">
          <h2 className="text-2xl font-black text-slate-800 tracking-tighter">Odontograma</h2>
          <div className="bg-slate-100 text-slate-400 p-1 rounded-lg">
            <Info size={14} />
          </div>
        </div>
        
        <div className="bg-white/50 backdrop-blur-sm p-8 shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-slate-100 flex justify-center overflow-x-auto w-full"
             style={{ borderRadius: '2.5rem' }}>
          <div className="max-w-full">
            <Odontogram patientId={patient?.id || 1} />
          </div>
        </div>
      </div>

      {/* Notas del odontograma Sections */}
      <div className="flex flex-col gap-3 px-1">
        <div className="flex items-center gap-2">
           <FileText size={16} className="text-primary" />
           <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Notas del paciente</h3>
        </div>
        <textarea 
          className="w-full bg-white border border-slate-200 p-5 min-h-[120px] text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all resize-y text-slate-700 shadow-sm"
          style={{ borderRadius: '2rem' }}
          placeholder="Añade notas clínicas importantes o recordatorios para este paciente..."
        ></textarea>
      </div>
    </div>
  );
};

export default GeneralTab;
