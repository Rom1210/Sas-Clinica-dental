import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Filter, Zap, LayoutGrid, CalendarDays, Calendar as CalendarIcon, CheckCircle2, User, Clock, Check, X } from 'lucide-react';
import { useData } from '../../context/DataContext';
import AppointmentModal from './AppointmentModal';

const Scheduler = () => {
  const { appointments, addAppointment, doctors } = useData();
  const location = useLocation();
  const navigate = useNavigate();
  const [view, setView] = useState('week'); // 'day', '3days', 'week'
  const [filterType, setFilterType] = useState('Todos'); // 'Todos', 'Odont\u00f3logo general', 'Especialista'
  const [baseDate, setBaseDate] = useState(new Date()); // Default to current date

  // Check if we have a prefilled patient from navigation state
  const prefilledPatient = location.state?.prefilledPatient || null;

  // Selection state (click-to-toggle)
  const [selectedSlots, setSelectedSlots] = useState([]); // Array of strings "YYYY-MM-DD|HH:mm"

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
     setSelectedSlots([]);
  };

  const matchesFilter = (app) => {
    if (filterType === 'Todos') return true;
    const doc = doctors.find(d => d.id === app.doctorId);
    if (!doc) return false;
    if (filterType === 'Odont\u00f3logo general' && doc.isSpecialist) return false;
    if (filterType === 'Especialista' && !doc.isSpecialist) return false;
    return true;
  };

  const hasAppointment = (dateStr, time) => {
     return appointments.some(app => app.date === dateStr && app.blocks.includes(time) && matchesFilter(app));
  };

  const getAppointmentFast = (dateStr, time) => {
     return appointments.find(app => app.date === dateStr && app.blocks.includes(time) && matchesFilter(app)) || null;
  };

  const handlePointerDown = (e, dateStr, timeIdx) => {
    e.preventDefault();
    if (e.target.hasPointerCapture(e.pointerId)) {
       e.target.releasePointerCapture(e.pointerId);
    }
    const time = hours[timeIdx];
    if (hasAppointment(dateStr, time)) return;
    
    const slotId = `${dateStr}|${time}`;
    
    // Toggle behavior on single click
    setSelectedSlots(prev => {
        if (prev.includes(slotId)) {
            return prev.filter(s => s !== slotId);
        }
        return [...prev, slotId];
    });
  };

  const handleScheduleAppointment = () => {
    if (!selectedSlots.length) return alert('Por favor selecciona al menos un bloque de tiempo.');
    if (!prefilledPatient) return alert('No hay paciente preseleccionado. Usa la ficha del paciente para agendar.');
    if (!location.state?.pendingConsultation?.services?.length) return alert('No hay servicios seleccionados. Usa la ficha del paciente para agendar.');

    // Sort blocks by chronological order
    const sortedBlocks = [...selectedSlots].sort((a, b) => {
      const timeA = a.split('|')[1];
      const timeB = b.split('|')[1];
      return hours.indexOf(timeA) - hours.indexOf(timeB);
    });

    const dateStr = sortedBlocks[0].split('|')[0];
    const timeBlocks = sortedBlocks.map(s => s.split('|')[1]);
    
    // Find end time
    const lastTime = timeBlocks[timeBlocks.length - 1];
    const lastIdx = hours.indexOf(lastTime);
    const endTime = hours[lastIdx + 1] || '20:00';

    const newAppointment = {
      date: dateStr,
      blocks: timeBlocks,
      startTime: timeBlocks[0],
      endTime: endTime,
      patientName: prefilledPatient.name,
      patientPhone: prefilledPatient.phone,
      patientEmail: prefilledPatient.email,
      doctorId: 1, // Fallback to general practitioner id 1
      services: location.state.pendingConsultation.services,
      totalCost: location.state.pendingConsultation.total || 0,
      status: 'Programada'
    };

    addAppointment(newAppointment);
    
    // Clear the selected blocks after successful creation
    clearSelection();
  };

  const contiguousBlocks = useMemo(() => {
    const byDate = selectedSlots.reduce((acc, slotStr) => {
      const [date, time] = slotStr.split('|');
      if (!acc[date]) acc[date] = [];
      acc[date].push(time);
      return acc;
    }, {});

    const blocks = [];
    
    Object.entries(byDate).forEach(([dateStr, times]) => {
      times.sort((a, b) => hours.indexOf(a) - hours.indexOf(b));
      
      let currentBlock = null;
      
      times.forEach(time => {
        const timeIdx = hours.indexOf(time);
        
        if (!currentBlock) {
          currentBlock = { dateStr, startTime: time, slots: [time], startIdx: timeIdx, lastIdx: timeIdx };
          blocks.push(currentBlock);
        } else {
          if (timeIdx === currentBlock.lastIdx + 1) {
            currentBlock.slots.push(time);
            currentBlock.lastIdx = timeIdx;
          } else {
             currentBlock = { dateStr, startTime: time, slots: [time], startIdx: timeIdx, lastIdx: timeIdx };
             blocks.push(currentBlock);
          }
        }
      });
    });

    blocks.forEach(block => {
      const endIdx = block.lastIdx + 1;
      block.endTime = hours[endIdx] || '20:00';
      block.duration = block.slots.length * 15;
    });

    return blocks;
  }, [selectedSlots, hours]);

  const selectionSummary = useMemo(() => {
    if (contiguousBlocks.length === 0) return null;
    const totalDuration = contiguousBlocks.reduce((acc, b) => acc + b.duration, 0);
    // For single/first block summary info in modal
    return {
       ...contiguousBlocks[0],
       blocks: selectedSlots.map(s => s.split('|')[1]), // keep format for modal
       duration: totalDuration
    };
  }, [contiguousBlocks, selectedSlots]);

  const isPastSlot = (dateStr, time) => {
    const now = new Date();
    const [y, mm, dd] = dateStr.split('-').map(Number);
    const [h, m] = time.split(':').map(Number);
    
    const slotDate = new Date(y, mm - 1, dd, h, m, 0, 0);
    return slotDate < now;
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 pb-20 select-none">
      {/* Top Bar: Filters and Navigation */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-100/50 pb-8 gap-6">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-sm shadow-primary/5">
              <CalendarIcon size={20} strokeWidth={2.5} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Agenda Atómica</h2>
          </div>
          <p className="text-slate-500 text-sm font-medium pl-13">Visualización y gestión de citas clínicas</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 bg-slate-50/50 p-1.5 rounded-[1.5rem] border border-slate-100 shadow-sm backdrop-blur-sm">
           {/* Doctor Filter */}
           <div className="flex items-center bg-white p-1 rounded-xl border border-slate-100/50 shadow-sm">
              {['Todos', 'Odont\u00f3logo general', 'Especialista'].map(f => (
                <button 
                  key={f}
                  onClick={() => setFilterType(f)}
                  className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all border-none cursor-pointer ${filterType === f ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-slate-400 hover:text-slate-600 bg-transparent'}`}
                >
                  {f}
                </button>
              ))}
           </div>
           
           <div className="h-6 w-px bg-slate-200 hidden sm:block mx-1"></div>

           {/* View Modes */}
           <div className="hidden lg:flex items-center bg-white p-1 rounded-xl border border-slate-100/50 shadow-sm">
              {[
                { id: 'day', label: '1 Día', icon: <LayoutGrid size={14} /> },
                { id: '3days', label: '3 Días', icon: <CalendarDays size={14} /> },
                { id: 'week', label: 'Semana', icon: <CalendarIcon size={14} /> }
              ].map(v => (
                <button 
                  key={v.id}
                  onClick={() => { setView(v.id); clearSelection(); }} 
                  className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-tight rounded-lg transition-all border-none cursor-pointer flex items-center gap-2 ${view === v.id ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 bg-transparent hover:text-slate-600'}`}
                >
                  {v.icon}
                  {v.label}
                </button>
              ))}
           </div>

           <div className="h-6 w-px bg-slate-200 hidden lg:block mx-1"></div>

           {/* Quick Navigation */}
           <div className="flex items-center gap-1">
              <button onClick={handlePrev} className="p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all border-none cursor-pointer text-slate-400 hover:text-primary active:scale-95"><ChevronLeft size={18} strokeWidth={2.5} /></button>
              <div className="px-4 py-1.5 bg-white border border-slate-100 rounded-xl shadow-sm text-[10px] font-bold text-slate-700 uppercase tracking-widest min-w-[120px] text-center">
                {headerTitle}
              </div>
              <button onClick={handleNext} className="p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all border-none cursor-pointer text-slate-400 hover:text-primary active:scale-95"><ChevronRight size={18} strokeWidth={2.5} /></button>
              <button 
                onClick={() => { setBaseDate(new Date()); clearSelection(); }} 
                className="ml-2 px-4 py-1.5 bg-primary/5 text-primary text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-primary/10 transition-all border-none cursor-pointer"
              >
                Hoy
              </button>
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
      <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/30 via-primary to-primary/30 z-30"></div>
        
        {/* Actions popup if selection exists */}
        {selectionSummary && (
           <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-slate-900 border-none shadow-[0_20px_40px_-10px_rgba(15,23,42,0.3)] p-3 rounded-full flex items-center gap-4 animate-in slide-in-from-top-4 duration-300 z-50">
              <div className="flex items-center gap-2 pl-4">
                 <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <Check size={14} className="text-primary" strokeWidth={3} />
                 </div>
                 <span className="text-xs font-black text-white">{selectedSlots.length} Bloque{selectedSlots.length > 1 ? 's' : ''} seleccionado{selectedSlots.length > 1 ? 's' : ''}</span>
                 <span className="text-[10px] text-slate-400 font-bold ml-2">({selectionSummary.duration} MIN TOTAL)</span>
              </div>
              <div className="w-px h-6 bg-slate-700 mx-2"></div>
              <button 
                 onClick={clearSelection}
                 className="px-5 py-2 text-[9px] font-black uppercase tracking-widest text-slate-300 hover:bg-slate-800 rounded-full transition-all border-none cursor-pointer"
              >
                 Limpiar
              </button>
              <button 
                 onClick={handleScheduleAppointment}
                 className="px-6 py-2.5 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-blue-600 transition-all border-none shadow-sm cursor-pointer flex items-center gap-2"
              >
                 Agendar Cita <ChevronRight size={12} />
              </button>
           </div>
        )}

        {/* Dynamic Grid Header */}
        <div style={{ display: 'grid', gridTemplateColumns: `100px repeat(${activeDays.length}, 1fr)` }} className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-40">
           <div className="p-4 flex items-center justify-center border-r border-slate-100/50">
              <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                <Clock size={16} strokeWidth={2.5} />
              </div>
           </div>
           {activeDays.map((day, i) => {
              const isToday = day.dateStr === new Date().toISOString().split('T')[0];
              const [weekday, dateMonth] = day.label.split(',');
              return (
                <div key={i} className={`p-4 py-5 text-center border-r border-slate-100/50 last:border-none relative group`}>
                   <span className={`block text-[11px] font-extrabold uppercase tracking-[0.15em] mb-1 ${isToday ? 'text-primary' : 'text-slate-400'}`}>
                    {weekday}
                   </span>
                   <div className={`
                    inline-flex items-center justify-center min-w-[32px] h-[32px] px-3 rounded-xl text-sm font-bold transition-all
                    ${isToday ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-110' : 'text-slate-700 group-hover:bg-slate-50'}
                   `}>
                    {dateMonth.trim()}
                   </div>
                   {isToday && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-t-full"></div>}
                </div>
              );
           })}
        </div>

        {/* Grid Body */}
        <div className="h-[700px] overflow-y-auto overflow-x-hidden custom-scrollbar bg-white relative">
           {/* Current Time Line Indicator */}
           <div className="absolute left-[100px] right-0 h-px bg-rose-500/50 z-30 pointer-events-none hidden" id="current-time-line">
              <div className="absolute -left-1 -top-1 w-2 h-2 rounded-full bg-rose-500 shadow-sm"></div>
           </div>

           {hours.map((time, tIdx) => (
             <div key={tIdx} style={{ display: 'grid', gridTemplateColumns: `100px repeat(${activeDays.length}, 1fr)` }} className="group">
                {/* Time header column (Strictly uniform height) */}
                <div style={{ height: '56px' }} className="p-0 border-r border-slate-100/50 flex flex-col justify-center items-center relative bg-slate-50/10">
                   {time.endsWith(':00') ? (
                      <div className="flex items-center justify-center w-full">
                         <span className="text-[11px] font-extrabold text-slate-900 tracking-tight bg-white border border-slate-200 px-2 py-0.5 rounded-full shadow-sm">
                            {time}
                         </span>
                      </div>
                   ) : (
                      <span className="text-[9px] font-bold text-slate-400 tracking-widest opacity-60">
                         {time.split(':')[1]}
                      </span>
                   )}
                   
                   <div className="absolute right-0 top-1/2 -track-y-1/2 w-1.5 h-px bg-slate-200"></div>
                </div>

                {/* Day columns */}
                {activeDays.map((day, dIdx) => {
                    const app = getAppointmentFast(day.dateStr, time);
                    const block = contiguousBlocks.find(b => b.dateStr === day.dateStr && b.slots.includes(time));
                    const isSelected = !!block;
                    const isFirstSelected = isSelected && block.slots[0] === time;
                    const isLastSelected = isSelected && block.slots[block.slots.length - 1] === time;
                    const isPast = isPastSlot(day.dateStr, time);
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
                         data-datestr={day.dateStr}
                         data-timeidx={tIdx}
                         onPointerDown={(e) => handlePointerDown(e, day.dateStr, tIdx)}
                         style={{ height: '56px' }}
                         className={`
                            border-b border-r relative transition-colors touch-none select-none border-slate-100/50
                            ${app ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-slate-50/50'}
                            ${isPast && !isSelected && !app ? 'bg-slate-50/30' : 'bg-white'}
                         `}
                      >
                         {/* Past slot indicator (Muted overlay) */}
                         {isPast && !app && (
                            <div className="absolute inset-0 bg-slate-100/10 pointer-events-none flex items-center justify-center opacity-40">
                               <div className="w-[1px] h-full bg-slate-200/50 rotate-45 transform scale-y-150"></div>
                            </div>
                         )}

                         {/* Selection Block Render (Visually Merged) */}
                         {isSelected && (
                            <div 
                               className={`absolute inset-x-1.5 z-10 flex flex-col items-center justify-center p-2 px-3 transition-all duration-300 pointer-events-none bg-primary
                                  ${isFirstSelected ? 'rounded-t-2xl mt-1.5' : ''}
                                  ${isLastSelected ? 'rounded-b-2xl mb-1.5 pb-3' : ''}
                               `}
                               style={{ 
                                  height: 'calc(100% + 1px)',
                                  top: 0
                               }}
                            >
                               {isFirstSelected && (
                                  <div className="flex flex-col items-center justify-center gap-1 opacity-100 mt-1">
                                     <div className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center shadow-sm border border-white/30">
                                        <span className="text-[10px] font-black text-white tracking-widest">{block.duration} MIN</span>
                                     </div>
                                  </div>
                               )}
                            </div>
                         )}

                        {/* Appointment Render */}
                        {app && (
                           <div 
                              className={`absolute inset-x-1.5 z-20 overflow-hidden flex flex-col p-2 px-3 transition-all duration-300 group/app
                                 ${isFirstBlock ? 'rounded-t-2xl mt-1.5' : ''}
                                 ${app.blocks[app.blocks.length - 1] === time ? 'rounded-b-2xl mb-1.5 pb-3' : ''}
                              `}
                              style={{ 
                                 backgroundColor: `${docColor}15`, // Translucent background
                                 borderLeft: `4px solid ${docColor}`,
                                 height: 'calc(100% + 1px)',
                                 top: 0
                              }}
                           >
                              {isFirstBlock && (
                                 <div className="flex justify-between items-start animate-in fade-in slide-in-from-left-2 duration-300 w-full overflow-hidden gap-2">
                                    <div className="flex flex-col overflow-hidden flex-1">
                                       <span className="text-[11px] font-bold text-slate-800 leading-tight truncate">
                                          {app.patientName}
                                       </span>
                                       <span className="text-[9px] font-semibold uppercase tracking-wider leading-tight truncate text-slate-500 mt-0.5">
                                          {docLabel}
                                       </span>
                                    </div>
                                    <div className="flex-shrink-0 ml-1">
                                       <div className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black text-white uppercase tracking-tight" style={{ backgroundColor: docColor }}>
                                          {app.patientName.substring(0, 2)}
                                       </div>
                                    </div>
                                 </div>
                              )}
                              
                              {/* Service name on longer appointments */}
                              {!isFirstBlock && app.blocks.length > 2 && tIdx === hours.indexOf(app.blocks[1]) && (
                                 <div className="flex items-center gap-1.5 py-1 px-1 rounded-lg bg-white/50 backdrop-blur-sm border border-white/50 shadow-sm mt-1 animate-in fade-in duration-500 overflow-hidden">
                                    <Zap size={10} style={{ color: docColor }} strokeWidth={3} />
                                    <span className="text-[8px] font-bold uppercase tracking-tight text-slate-600 truncate">
                                       {app.services[0]?.name}
                                    </span>
                                 </div>
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
         selection={selectionSummary}
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
