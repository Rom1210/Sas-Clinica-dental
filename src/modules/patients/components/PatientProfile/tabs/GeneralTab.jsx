import { Search, Calendar, FileText, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import Odontogram from '../../../Odontogram';

const GeneralTab = ({ patient, consultations, onSchedule }) => {
  return (
    <div className="flex flex-col gap-8">
      {/* Consultas Section */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-800">Consultas</h2>
          <button 
            onClick={onSchedule}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white hover:opacity-90 rounded-xl transition-all text-sm font-bold border-none cursor-pointer shadow-sm"
          >
            <Calendar size={16} /> Agendar Cita
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center w-64 bg-slate-50 border border-slate-100 rounded-xl px-4 py-1.5 focus-within:bg-white focus-within:border-primary/30 focus-within:ring-4 focus-within:ring-primary/5 transition-all shadow-sm">
              <input 
                type="text" 
                placeholder="Buscar consulta..." 
                className="flex-1 bg-transparent border-none outline-none text-[13px] font-medium text-slate-600 placeholder:text-slate-400"
              />
              <Search size={15} className="text-slate-400 transition-colors group-focus-within:text-primary ml-2" />
            </div>
          </div>

          <div className="p-4 bg-slate-50/30 overflow-y-auto flex flex-col gap-3" style={{ maxHeight: '400px' }}>
            {consultations.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 bg-white rounded-xl border border-slate-100 border-dashed">
                <h3 className="text-base font-bold text-slate-800">0 resultados.</h3>
                <p className="text-sm text-slate-500">No hay registros creados hasta ahora.</p>
                <button 
                  onClick={onSchedule}
                  className="mt-4 px-6 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors cursor-pointer text-sm border-none shadow-none"
                >
                  Agendar primera cita
                </button>
              </div>
            ) : (
              consultations.map((c) => (
                <div key={c.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow cursor-pointer flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                  <div className="flex gap-4 items-start md:items-center w-full md:w-auto">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                       <FileText size={20} />
                    </div>
                    <div className="flex flex-col gap-1">
                       <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{c.date}</span>
                       <span className="text-sm font-bold text-slate-800">{c.treatment}</span>
                       <span className="text-sm text-slate-500 line-clamp-1">{c.reason || 'Sin motivo adicional'}</span>
                       {c.doctorName && <span className="text-xs font-medium text-slate-500 mt-1 flex items-center gap-1">Doctor: {c.doctorName}</span>}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between w-full md:w-auto md:flex-col md:items-end gap-1 mt-2 md:mt-0">
                    <span className="text-base font-black text-slate-800">${(c.cost || 0).toFixed(2)}</span>
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                      c.paymentStatus === 'Pagado' ? 'bg-emerald-50 text-emerald-600' :
                      c.paymentStatus === 'Abono' ? 'bg-amber-50 text-amber-600' :
                      'bg-rose-50 text-rose-600'
                    }`}>
                      {c.paymentStatus}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-4 border-t border-slate-100 flex justify-end items-center gap-6 bg-white">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              Columnas por página
              <select className="border-none bg-transparent font-medium focus:outline-none cursor-pointer">
                <option>5</option>
                <option>10</option>
                <option>20</option>
              </select>
            </div>
            <div className="text-sm text-slate-600">
              {consultations.length}-{consultations.length} de {consultations.length}
            </div>
            <div className="flex gap-2 text-slate-400">
              <button className="p-1 border-none bg-transparent text-slate-300 cursor-not-allowed"><ChevronLeft size={16} /></button>
              <button className="p-1 border-none bg-transparent text-slate-300 cursor-not-allowed"><ChevronRight size={16} /></button>
            </div>
          </div>
        </div>
      </div>

      {/* Odontograma Section */}
      <div id="odontogram-section" className="flex flex-col gap-4 mt-6">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold text-slate-800">Odontograma</h2>
          <Info size={18} className="text-slate-400" />
        </div>
        
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex justify-center overflow-x-auto w-full">
          <div className="max-w-full">
            <Odontogram patientId={patient?.id || 1} />
          </div>
        </div>
      </div>

      {/* Notas del odontograma Sections */}
      <div className="flex flex-col gap-4">
        <h3 className="text-lg font-bold text-slate-800">Notas del odontograma</h3>
        <textarea 
          className="w-full bg-white border border-slate-200 rounded-xl p-4 min-h-[150px] text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-y text-slate-700 shadow-sm"
          placeholder="Añade notas clínicas importantes aquí..."
        ></textarea>
      </div>
    </div>
  );
};

export default GeneralTab;
