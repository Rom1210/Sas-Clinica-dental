import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Filter, Zap, LayoutGrid, CalendarDays, Calendar as CalendarIcon, CheckCircle2, User, Clock, Check, X } from 'lucide-react';
import { useData } from '../../context/DataContext';
import AppointmentModal from './AppointmentModal';

const Scheduler = () => {
  const { appointments, doctors } = useData();
  const location = useLocation();
  const navigate = useNavigate();
  const [view, setView] = useState('week'); // 'day', '3days', 'week'
  const [filterType, setFilterType] = useState('Todos'); // 'Todos', 'Odontólogo general', 'Especialista'
  const [baseDate, setBaseDate] = useState(new Date(2026, 2, 11)); // Default to March 11 2026 to fit context

  // Check if we have a prefilled patient from navigation state
  const prefilledPatient = location.state?.prefilledPatient || null;

  // Selection state
  const [isSelecting, setIsSelecting] = useState(false);
  const [dragStart, setDragStart] = useState(null); // { dateStr, timeIdx }
  const [selectionRange, setSelectionRange] = useState(null); // { date, startTime, endTime, blocks, duration }

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  const clearPrefilledContext = () => {
    navigate(location.pathname, { replace: true, state: {} });
  };

  // Time generation: 08:00 to 20:00 (12 hours = 48 blocks)
  const hours = useMemo(() => {
    return Array.from({ length: 48 }, (_, i) => {
      const totalMin = 8 * 60 + i * 15;
      const h = Math.floor(totalMin / 60);
      const m = totalMin % 60;
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    });
  }, []);

  // Compute visible days
  const activeDays = useMemo(() => {
    const count = view === 'day' ? 1 : view === '3days' ? 3 : 6;
    const daysArr = [];
    const current = new Date(baseDate);
    
    // Auto-adjust week to start on Monday if 'week' is selected
    if (view === 'week') {
      const day = current.getDay();
      const diff = current.getDate() - day + (day === 0 ? -6 : 1);
      current.setDate(diff);
    }

    const formatOptions = { weekday: 'long', day: 'numeric', month: 'short' };
    
    for (let i = 0; i < count; i++) {
        const d = new Date(current);
        d.setDate(current.getDate() + i);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;
        
        daysArr.push({
            dateObj: d,
            dateStr,
            label: d.toLocaleDateString('es-ES', formatOptions)
        });
    }
    return daysArr;
  }, [baseDate, view]);

  const headerTitle = useMemo(() => {
     if (activeDays.length === 1) return activeDays[0].label.toUpperCase();
     return `${activeDays[0].label} - ${activeDays[activeDays.length - 1].label}`.toUpperCase();
  }, [activeDays]);

  // Navigate functions
  const handlePrev = () => {
     const d = new Date(baseDate);
     d.setDate(d.getDate() - (view === 'day' ? 1 : view === '3days' ? 3 : 7));
     setBaseDate(d);
     clearSelection();
  };

  const handleNext = () => {
     const d = new Date(baseDate);
     d.setDate(d.getDate() + (view === 'day' ? 1 : view === '3days' ? 3 : 7));
     setBaseDate(d);
     clearSelection();
  };

  const clearSelection = () => {
     setIsSelecting(false);
     setDragStart(null);
     setSelectionRange(null);
  };

  // Drag select logic with Pointer Events for touch support
  // Helper to check if appointment matches current filters
  const matchesFilter = (app) => {
    if (filterType === 'Todos') return true;
    const doc = doctors.find(d => d.id === app.doctorId);
    if (!doc) return false;
    if (filterType === 'Odontólogo general' && doc.isSpecialist) return false;
    if (filterType === 'Especialista' && !doc.isSpecialist) return false;
    return true;
  };

  const hasAppointment = (dateStr, time) => {
     return appointments.some(app => app.date === dateStr && app.blocks.includes(time) && matchesFilter(app));
  };

  const getAppointmentFast = (dateStr, time) => {
     return appointments.find(app => app.date === dateStr && app.blocks.includes(time) && matchesFilter(app)) || null;
  };

  const handlePointerDown = (dateStr, timeIdx) => {
    if (hasAppointment(dateStr, hours[timeIdx])) return;
    setIsSelecting(true);
    setDragStart({ dateStr, timeIdx });
    computeSelection({ dateStr, timeIdx }, { dateStr, timeIdx });
  };

  const handlePointerEnter = (dateStr, timeIdx) => {
    if (!isSelecting || !dragStart) return;
    if (dateStr !== dragStart.dateStr) return;
    
    let validEnd = timeIdx;
    if (timeIdx > dragStart.timeIdx) {
       for (let i = dragStart.timeIdx; i <= timeIdx; i++) {
          if (hasAppointment(dateStr, hours[i])) { validEnd = i - 1; break; }
       }
    } else {
       for (let i = dragStart.timeIdx; i >= timeIdx; i--) {
          if (hasAppointment(dateStr, hours[i])) { validEnd = i + 1; break; }
       }
    }

    computeSelection(dragStart, { dateStr, timeIdx: validEnd });
  };

  const handleClick = (dateStr, timeIdx) => {
    if (hasAppointment(dateStr, hours[timeIdx])) return;
    computeSelection({ dateStr, timeIdx }, { dateStr, timeIdx });
  };

  // Global pointer up to stop selecting
  useEffect(() => {
    const handleGlobalPointerUp = () => {
       if (isSelecting) setIsSelecting(false);
    };
    window.addEventListener('pointerup', handleGlobalPointerUp);
    return () => window.removeEventListener('pointerup', handleGlobalPointerUp);
  }, [isSelecting]);

  const computeSelection = (start, end) => {
    if (!start || !end || start.dateStr !== end.dateStr) return;
    const min = Math.min(start.timeIdx, end.timeIdx);
    const max = Math.max(start.timeIdx, end.timeIdx);
    const blocks = [];
    for(let i = min; i <= max; i++){
       blocks.push(hours[i]);
    }
    
    setSelectionRange({
       date: start.dateStr,
       startTime: hours[min],
       endTime: hours[max + 1] || '20:00',
       blocks,
       duration: blocks.length * 15
    });
  };

  const isBlockSelected = (dateStr, time) => {
     if (!selectionRange) return false;
     return selectionRange.date === dateStr && selectionRange.blocks.includes(time);
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 pb-20 select-none">
      {/* Top Bar: Filters and Navigation */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center border-b border-slate-100 pb-6 gap-6">
        <div className="flex flex-col">
          <h2 className="text-2xl font-black text-slate-800 tracking-tighter uppercase">Agenda Clínica Integral</h2>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
             {headerTitle} • BLOQUES DE 15 MIN
          </span>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
           {/* Doctor Filter */}
           <div className="flex items-center bg-slate-50 p-1 rounded-2xl border border-slate-100 shadow-sm">
              {['Todos', 'Odontólogo general', 'Especialista'].map(f => (
                <button 
                  key={f}
                  onClick={() => setFilterType(f)}
                  className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border-none cursor-pointer ${filterType === f ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600 bg-transparent'}`}
                >
                  {f}
                </button>
              ))}
           </div>
           
           {/* View Modes */}
           <div className="hidden lg:flex items-center bg-slate-50 p-1 rounded-2xl border border-slate-100 shadow-sm">
              <button onClick={() => { setView('day'); clearSelection(); }} className={`px-4 py-2 text-[10px] font-black uppercase tracking-tight rounded-xl transition-all border-none cursor-pointer ${view === 'day' ? 'bg-primary text-white shadow-sm' : 'text-slate-400 bg-transparent'}`}>1 Día</button>
              <button onClick={() => { setView('3days'); clearSelection(); }} className={`px-4 py-2 text-[10px] font-black uppercase tracking-tight rounded-xl transition-all border-none cursor-pointer ${view === '3days' ? 'bg-primary text-white shadow-sm' : 'text-slate-400 bg-transparent'}`}>3 Días</button>
              <button onClick={() => { setView('week'); clearSelection(); }} className={`px-4 py-2 text-[10px] font-black uppercase tracking-tight rounded-xl transition-all border-none cursor-pointer ${view === 'week' ? 'bg-primary text-white shadow-sm' : 'text-slate-400 bg-transparent'}`}>Semana</button>
           </div>

           {/* Quick Navigation */}
           <div className="flex items-center gap-1 bg-white rounded-2xl p-1 border border-slate-200 shadow-sm">
              <button onClick={handlePrev} className="p-2 hover:bg-slate-50 rounded-xl transition-all border-none cursor-pointer text-slate-500 hover:text-primary"><ChevronLeft size={18} /></button>
              <button onClick={() => { setBaseDate(new Date()); clearSelection(); }} className="px-3 py-1 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-primary transition-all bg-transparent border-none cursor-pointer">Hoy</button>
              <button onClick={handleNext} className="p-2 hover:bg-slate-50 rounded-xl transition-all border-none cursor-pointer text-slate-500 hover:text-primary"><ChevronRight size={18} /></button>
           </div>
        </div>
      </div>

      {/* Context Banner if scheduling for specific patient */}
      {prefilledPatient && (
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-center justify-between animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <User size={20} />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-black text-slate-800 uppercase tracking-tight">Agendando para:</span>
              <span className="text-sm font-bold text-primary">{prefilledPatient.name}</span>
            </div>
          </div>
          <button 
            onClick={clearPrefilledContext}
            className="p-2 hover:bg-white rounded-xl transition-all border-none bg-transparent cursor-pointer text-slate-400 hover:text-rose-500 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
          >
            Limpiar contexto <X size={14} />
          </button>
        </div>
      )}

      {/* Main Grid container */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden relative">
        
        {/* Actions popup if selection exists */}
        {selectionRange && !isSelecting && (
           <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-slate-900 border-none shadow-[0_20px_40px_-10px_rgba(15,23,42,0.3)] p-3 rounded-full flex items-center gap-4 animate-in slide-in-from-top-4 duration-300 z-50">
              <div className="flex items-center gap-2 pl-4">
                 <Clock size={14} className="text-primary" />
                 <span className="text-xs font-black text-white">{selectionRange.startTime} - {selectionRange.endTime}</span>
                 <span className="text-[10px] text-slate-400 font-bold ml-2">({selectionRange.duration} MIN)</span>
              </div>
              <div className="w-px h-6 bg-slate-700 mx-2"></div>
              <button 
                 onClick={clearSelection}
                 className="px-5 py-2 text-[9px] font-black uppercase tracking-widest text-slate-300 hover:bg-slate-800 rounded-full transition-all border-none cursor-pointer"
              >
                 Cancelar
              </button>
              <button 
                 onClick={() => setIsModalOpen(true)}
                 className="px-6 py-2.5 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-blue-600 transition-all border-none shadow-sm cursor-pointer flex items-center gap-2"
              >
                 Seleccionar / Continuar <ChevronRight size={12} />
              </button>
           </div>
        )}

        {/* Dynamic Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: `80px repeat(${activeDays.length}, 1fr)` }} className="bg-slate-50 border-b border-slate-100">
           <div className="p-4 flex items-center justify-center border-r border-slate-200/50">
              <Clock size={16} className="text-slate-400" />
           </div>
           {activeDays.map((day, i) => (
              <div key={i} className={`p-4 text-center border-r border-slate-200/50 last:border-none ${day.dateStr === new Date().toISOString().split('T')[0] ? 'bg-primary/5' : ''}`}>
                 <span className="block text-xs font-black text-slate-800 uppercase tracking-widest">{day.label.split(',')[0]}</span>
                 <span className="block text-[10px] font-bold text-slate-400 uppercase mt-0.5">{day.label.split(',')[1]}</span>
              </div>
           ))}
        </div>

        {/* Grid Body */}
        <div className="h-[650px] overflow-y-auto overflow-x-hidden custom-scrollbar bg-white">
           {hours.map((time, tIdx) => (
             <div key={tIdx} style={{ display: 'grid', gridTemplateColumns: `80px repeat(${activeDays.length}, 1fr)` }} className="group">
                {/* Time header column */}
                <div className="p-2 border-r border-slate-100 flex justify-center items-center relative">
                   {time.endsWith('00') && (
                      <span className="text-[10px] font-black text-slate-800 absolute -top-2 bg-white px-2 rounded">{time}</span>
                   )}
                   {time.endsWith('30') && (
                      <span className="text-[9px] font-bold text-slate-400">{time}</span>
                   )}
                   <div className="absolute right-0 top-0 w-2 h-px bg-slate-200"></div>
                </div>

                {/* Day columns */}
                {activeDays.map((day, dIdx) => {
                   const app = getAppointmentFast(day.dateStr, time);
                   const isSelected = isBlockSelected(day.dateStr, time);
                   const isFirstBlock = app ? app.blocks[0] === time : false;
                   
                   let docColor = '#3b82f6';
                   let docLabel = '';
                   if (app) {
                      const doc = doctors.find(d => d.id === app.doctorId);
                      if (doc) {
                         docColor = doc.color || '#3b82f6';
                         docLabel = doc.name;
                      }
                   }

                   return (
                     <div 
                        key={dIdx} 
                        onPointerDown={() => !app && handlePointerDown(day.dateStr, tIdx)}
                        onPointerEnter={() => !app && handlePointerEnter(day.dateStr, tIdx)}
                        onClick={() => !app && handleClick(day.dateStr, tIdx)}
                        className={`
                           h-8 border-b border-r border-slate-50 last:border-r-0 relative transition-all touch-none
                           ${app ? 'cursor-default border-transparent' : 'cursor-pointer hover:bg-slate-50 bg-white'}
                           ${isSelected ? 'bg-primary/10' : ''}
                        `}
                        style={{ borderBottomStyle: time.endsWith('45') ? 'solid' : 'dashed', borderBottomColor: time.endsWith('45') ? '#e2e8f0' : '#f1f5f9' }}
                     >
                        {/* Selected overlay */}
                        {isSelected && (
                           <div className="absolute inset-0 bg-primary/20 border-l-2 border-primary z-10 transition-all flex justify-end p-1">
                               {tIdx === selectionRange?.blocks.indexOf(time) + hours.indexOf(selectionRange.blocks[0]) && <CheckCircle2 size={12} className="text-primary/70" />}
                           </div>
                        )}

                        {/* Appointment Render */}
                        {app && (
                           <div 
                              className={`absolute left-0 right-0 z-20 overflow-hidden flex flex-col p-1.5 px-3 transition-all duration-300 shadow-sm
                                 ${isFirstBlock ? 'rounded-t-xl' : ''}
                                 ${app.blocks[app.blocks.length - 1] === time ? 'rounded-b-xl border-b border-white/20' : ''}
                              `}
                              style={{ 
                                 backgroundColor: docColor, 
                                 height: '100%',
                                 top: 0
                              }}
                           >
                              {isFirstBlock && (
                                 <div className="flex flex-col gap-0.5">
                                    <span className="text-[10px] font-black text-white leading-tight truncate drop-shadow-sm">
                                       {app.patientName}
                                    </span>
                                    <span className="text-[8px] font-bold uppercase tracking-wider leading-tight truncate text-white/90">
                                       {docLabel}
                                    </span>
                                 </div>
                              )}
                              {!isFirstBlock && app.blocks.length > 2 && tIdx === hours.indexOf(app.blocks[1]) && (
                                 <span className="text-[8px] font-medium uppercase tracking-tight text-white/70 truncate">
                                    {app.services[0]?.name}
                                 </span>
                              )}
                           </div>
                        )}
                     </div>
                   );
                })}
             </div>
           ))}
        </div>
      </div>

      <AppointmentModal 
         isOpen={isModalOpen}
         onClose={() => setIsModalOpen(false)}
         selection={selectionRange}
         prefilledPatient={prefilledPatient}
         onSuccess={() => {
            setIsModalOpen(false);
            clearSelection();
            if (prefilledPatient) clearPrefilledContext();
         }}
      />
    </div>
  );
};

export default Scheduler;
