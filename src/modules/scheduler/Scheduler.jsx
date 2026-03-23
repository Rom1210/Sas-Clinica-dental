import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Filter, Zap, LayoutGrid, CalendarDays, Calendar as CalendarIcon, CheckCircle2, User, Clock, Check, X } from 'lucide-react';
import { useData } from '../../context/DataContext';
import AppointmentModal from './AppointmentModal';

const Scheduler = () => {
  const { appointments, addAppointment, doctors } = useData();
  const location = useLocation();
  const navigate = useNavigate();
  
  // 1. Basic UI State
  const [view, setView] = useState('week');
  const [filterType, setFilterType] = useState('Todos');
  const [baseDate, setBaseDate] = useState(new Date());
  const [successToast, setSuccessToast] = useState(null);

  // 2. Prefilled context from NewAppointmentFlow
  const prefilledPatient  = location.state?.prefilledPatient  || null;
  const preloadedServices = location.state?.preloadedServices || location.state?.pendingConsultation?.services || [];
  const preloadedDoctor   = location.state?.preloadedDoctor   || null;

  // 3. Selection & Modal State
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingAppointment, setViewingAppointment] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartSlot, setDragStartSlot] = useState(null); // { dateStr, timeIdx }

  // 4. Core Computed Data (Memos) - Move to TOP to avoid TDZ
  
  const hours = useMemo(() => {
    return Array.from({ length: 48 }, (_, i) => {
      const totalMin = 8 * 60 + i * 15;
      const h = Math.floor(totalMin / 60);
      const m = totalMin % 60;
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    });
  }, []);

  const activeDays = useMemo(() => {
    const count = view === 'day' ? 1 : view === '3days' ? 3 : 6;
    const daysArr = [];
    const current = new Date(baseDate);
    
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

  // 5. Successors Data (Calculated from dependencies)

  const getAppointmentFast = (dateStr, time) => {
     return (appointments || []).find(app => (app.date === dateStr && app.blocks?.includes(time))) || null;
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
    return {
       ...contiguousBlocks[0],
       blocks: selectedSlots.map(s => s.split('|')[1]),
       duration: totalDuration
    };
  }, [contiguousBlocks, selectedSlots]);

  // 6. Effects

  useEffect(() => {
    const updateLine = () => {
      const line = document.getElementById('current-time-line');
      if (!line) return;

      const now = new Date();
      const todayISO = now.toISOString().split('T')[0];
      const isTodayVisible = activeDays.some(d => d.dateStr === todayISO);
      
      const currentHour = now.getHours();
      const currentMin = now.getMinutes();
      
      if (isTodayVisible && currentHour >= 8 && currentHour < 20) {
        const totalMinutesFromStart = (currentHour - 8) * 60 + currentMin;
        const topPosition = (totalMinutesFromStart / 15) * 56.5;
        
        line.style.top = `${topPosition}px`;
        line.style.display = 'block';
        
        const todayIdx = activeDays.findIndex(d => d.dateStr === todayISO);
        if (todayIdx !== -1) {
          const gridBody = line.parentElement;
          if (gridBody) {
             const colWidth = (gridBody.clientWidth - 100) / activeDays.length;
             const leftOffset = 100 + todayIdx * colWidth;
             line.style.left = `${leftOffset}px`;
             line.style.width = `${colWidth}px`;
          }
        }
      } else {
        line.style.display = 'none';
      }
    };

    updateLine();
    const interval = setInterval(updateLine, 60000);
    return () => clearInterval(interval);
  }, [activeDays]);

  useEffect(() => {
    const handleGlobalPointerUp = () => {
      if (isDragging) {
        setIsDragging(false);
        setDragStartSlot(null);
      }
    };
    window.addEventListener('pointerup', handleGlobalPointerUp);
    return () => window.removeEventListener('pointerup', handleGlobalPointerUp);
  }, [isDragging]);

  // 7. Event Handlers

  const showToast = (msg) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const clearPrefilledContext = () => {
    navigate(location.pathname, { replace: true, state: {} });
  };

  const handlePointerDown = (e, dateStr, timeIdx) => {
    if (e.button !== 0) return;
    const time = hours[timeIdx];
    const existingApp = getAppointmentFast(dateStr, time);
    if (existingApp) {
      setViewingAppointment(existingApp);
      return;
    }
    setIsDragging(true);
    setDragStartSlot({ dateStr, timeIdx });
    setSelectedSlots([`${dateStr}|${time}`]);
  };

  const handlePointerMove = (e, dateStr, timeIdx) => {
    if (!isDragging || !dragStartSlot) return;
    if (dateStr !== dragStartSlot.dateStr) return;
    const startIdx = Math.min(dragStartSlot.timeIdx, timeIdx);
    const endIdx = Math.max(dragStartSlot.timeIdx, timeIdx);
    const newSelection = [];
    for (let i = startIdx; i <= endIdx; i++) {
      const time = hours[i];
      if (getAppointmentFast(dateStr, time)) {
        if (i < dragStartSlot.timeIdx) continue; 
        else break;
      }
      newSelection.push(`${dateStr}|${time}`);
    }
    setSelectedSlots(newSelection);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    setDragStartSlot(null);
  };

  const handleScheduleAppointment = async () => {
    if (!selectedSlots.length) return alert('Por favor selecciona al menos un bloque de tiempo.');
    if (!prefilledPatient) {
      setIsModalOpen(true);
      return;
    }
    const sortedBlocks = [...selectedSlots].sort((a, b) => {
      const timeA = a.split('|')[1];
      const timeB = b.split('|')[1];
      return hours.indexOf(timeA) - hours.indexOf(timeB);
    });
    const dateStr   = sortedBlocks[0].split('|')[0];
    const timeBlocks = sortedBlocks.map(s => s.split('|')[1]);
    const lastTime  = timeBlocks[timeBlocks.length - 1];
    const lastIdx   = hours.indexOf(lastTime);
    const endTime   = hours[lastIdx + 1] || '20:00';
    const doctorId = preloadedDoctor?.id || doctors?.[0]?.id || null;
    
    const hasConflict = (appointments || []).some(app => {
      if (app.doctorId !== doctorId) return false;
      if (app.date !== dateStr) return false; 
      return timeBlocks.some(slot => app.blocks?.includes(slot));
    });

    if (hasConflict) {
      alert("Error: Este doctor ya tiene una cita agendada en una o varias de las horas seleccionadas.");
      return;
    }

    const startsAt = `${dateStr}T${timeBlocks[0]}:00`;
    const endsAt   = `${dateStr}T${endTime}:00`;
    const newAppointment = {
      starts_at: startsAt,
      ends_at: endsAt,
      start_at: startsAt,
      end_at: endsAt,
      patient_id: prefilledPatient.id,
      doctor_id: doctorId,
      status: 'scheduled',
      notes: preloadedServices.map(s => s.name).join(', '),
    };

    try {
      await addAppointment(newAppointment);
      setSelectedSlots([]);
      showToast(`✓ Cita guardada — ${prefilledPatient.name} · ${dateStr} ${timeBlocks[0]}`);
      clearPrefilledContext();
    } catch (err) {
      console.error('Error saving appointment:', err);
      alert('No se pudo guardar la cita: ' + (err?.message || JSON.stringify(err)));
    }
  };

  // Helper UI functions
  const isPastSlot = (dateStr, time) => {
    const now = new Date();
    const [y, mm, dd] = dateStr.split('-').map(Number);
    const [h, m] = time.split(':').map(Number);
    const slotDate = new Date(y, mm - 1, dd, h, m, 0, 0);
    return slotDate < now;
  };
   // 8. Final Render
  return (
    <>
      <div className="flex flex-col gap-6 animate-in fade-in duration-500 pb-20 select-none">
        {/* Header */}
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
             <div className="flex items-center bg-white p-1 rounded-xl border border-slate-100/50 shadow-sm">
                {['Todos', 'Odontólogo general', 'Especialista'].map(f => (
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

             <div className="hidden lg:flex items-center bg-white p-1 rounded-xl border border-slate-100/50 shadow-sm">
                {[
                  { id: 'day', label: '1 Día', icon: <LayoutGrid size={14} /> },
                  { id: '3days', label: '3 Días', icon: <CalendarDays size={14} /> },
                  { id: 'week', label: 'Semana', icon: <CalendarIcon size={14} /> }
                ].map(v => (
                  <button 
                    key={v.id}
                    onClick={() => { setView(v.id); setSelectedSlots([]); }} 
                    className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-tight rounded-lg transition-all border-none cursor-pointer flex items-center gap-2 ${view === v.id ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 bg-transparent hover:text-slate-600'}`}
                  >
                    {v.icon}
                    {v.label}
                  </button>
                ))}
             </div>

             <div className="flex items-center gap-1">
                <button onClick={() => {
                  const d = new Date(baseDate);
                  d.setDate(d.getDate() - (view === 'day' ? 1 : view === '3days' ? 3 : 7));
                  setBaseDate(d);
                  setSelectedSlots([]);
                }} className="p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all border-none cursor-pointer text-slate-400 hover:text-primary active:scale-95"><ChevronLeft size={18} strokeWidth={2.5} /></button>
                <div className="px-4 py-1.5 bg-white border border-slate-100 rounded-xl shadow-sm text-[10px] font-bold text-slate-700 uppercase tracking-widest min-w-[120px] text-center">
                  {headerTitle}
                </div>
                <button onClick={() => {
                  const d = new Date(baseDate);
                  d.setDate(d.getDate() + (view === 'day' ? 1 : view === '3days' ? 3 : 7));
                  setBaseDate(d);
                  setSelectedSlots([]);
                }} className="p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all border-none cursor-pointer text-slate-400 hover:text-primary active:scale-95"><ChevronRight size={18} strokeWidth={2.5} /></button>
                <button 
                  onClick={() => { setBaseDate(new Date()); setSelectedSlots([]); }} 
                  className="ml-2 px-4 py-1.5 bg-primary/5 text-primary text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-primary/10 transition-all border-none cursor-pointer"
                >
                  Hoy
                </button>
             </div>
          </div>
        </div>

        {prefilledPatient && (
          <div style={{
            background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 20,
            padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 16, flexWrap: 'wrap',
            animation: 'fadeIn 0.3s ease',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, flex: 1, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 38, height: 38, background: '#2563EB', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={18} color="#fff" />
                </div>
                <div>
                  <div style={{ fontSize: 9, fontWeight: 800, color: '#3B82F6', letterSpacing: '0.14em', textTransform: 'uppercase' }}>Paciente</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#1E293B' }}>{prefilledPatient.name}</div>
                </div>
              </div>
            </div>
            <button onClick={clearPrefilledContext} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}><X size={16} /></button>
          </div>
        )}

        {/* Main Grid Card */}
        <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/30 via-primary to-primary/30 z-30"></div>
          
          {/* Selection Floating Bar */}
          {selectionSummary && (
             <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-slate-900 border-none shadow-2xl p-3 rounded-full flex items-center gap-4 animate-in slide-in-from-top-4 duration-300 z-50">
                <div className="flex items-center gap-2 pl-4">
                   <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <Check size={14} className="text-primary" strokeWidth={3} />
                   </div>
                   <span className="text-xs font-black text-white">{selectedSlots.length} Bloque{selectedSlots.length > 1 ? 's' : ''} seleccionado{selectedSlots.length > 1 ? 's' : ''}</span>
                </div>
                <button onClick={() => setSelectedSlots([])} className="px-5 py-2 text-[9px] font-black uppercase tracking-widest text-slate-300 hover:bg-slate-800 rounded-full transition-all border-none cursor-pointer">Limpiar</button>
                <button onClick={handleScheduleAppointment} className="px-6 py-2.5 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-blue-600 transition-all border-none shadow-sm cursor-pointer flex items-center gap-2">Agendar Cita <ChevronRight size={12} /></button>
             </div>
          )}

          {/* Grid Header */}
          <div style={{ display: 'grid', gridTemplateColumns: `100px repeat(${activeDays.length}, 1fr)` }} className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-40">
             <div className="p-4 flex items-center justify-center border-r border-slate-100/50">
                <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                  <Clock size={16} strokeWidth={2.5} />
                </div>
             </div>
             {activeDays.map((day, i) => {
                const isToday = day.dateStr === new Date().toISOString().split('T')[0];
                const parts = day.label.split(',');
                const weekday = parts[0];
                const dateMonth = parts[1] || '';
                return (
                  <div key={i} className="p-4 py-5 text-center border-r border-slate-100/50 last:border-none relative group">
                     <span className={`block text-[11px] font-extrabold uppercase tracking-[0.15em] mb-1 ${isToday ? 'text-primary' : 'text-slate-400'}`}>{weekday}</span>
                     <div className={`inline-flex items-center justify-center min-w-[32px] h-[32px] px-3 rounded-xl text-sm font-bold ${isToday ? 'bg-primary text-white shadow-lg' : 'text-slate-700'}`}>{dateMonth.trim()}</div>
                  </div>
                );
             })}
          </div>

          {/* Grid Body */}
          <div className="h-[700px] overflow-y-auto overflow-x-hidden custom-scrollbar bg-white relative">
             <div className="absolute h-px bg-rose-500/50 z-30 pointer-events-none" id="current-time-line" style={{ display: 'none' }}>
                <div className="absolute -left-1.5 -top-1 w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm border-2 border-white"></div>
             </div>

             {hours.map((time, tIdx) => (
               <div key={tIdx} style={{ display: 'grid', gridTemplateColumns: `100px repeat(${activeDays.length}, 1fr)` }} className="group">
                  <div style={{ height: '56px' }} className="p-0 border-r border-slate-100/50 flex flex-col justify-center items-center relative bg-slate-50/10">
                     {time.endsWith(':00') ? (
                        <span className="text-[11px] font-extrabold text-slate-900 tracking-tight bg-white border border-slate-200 px-2 py-0.5 rounded-full shadow-sm">{time}</span>
                     ) : (
                        <span className="text-[9px] font-bold text-slate-400 tracking-widest opacity-60">{time.split(':')[1]}</span>
                     )}
                  </div>

                  {activeDays.map((day, dIdx) => {
                      const app = getAppointmentFast(day.dateStr, time);
                      const block = contiguousBlocks.find(b => b.dateStr === day.dateStr && b.slots.includes(time));
                      const isSelected = !!block;
                      const isFirstSelected = isSelected && block.slots[0] === time;
                      const isLastSelected = isSelected && block.slots[block.slots.length - 1] === time;
                      const isPast = isPastSlot(day.dateStr, time);
                      
                      let docColor = '#3b82f6';
                      let docLabel = '';
                      if (app) {
                         const doc = (doctors || []).find(d => d.id === app.doctorId);
                         if (doc) { docColor = doc.color || '#3b82f6'; docLabel = doc.name; }
                      }

                      return (
                        <div 
                           key={dIdx} 
                           onPointerDown={(e) => handlePointerDown(e, day.dateStr, tIdx)}
                           onPointerMove={(e) => handlePointerMove(e, day.dateStr, tIdx)}
                           onPointerUp={handlePointerUp}
                           style={{ height: '56px' }}
                           className={`border-b border-r relative transition-colors touch-none select-none border-slate-100/50 ${app ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-slate-50/50'} ${isPast && !isSelected && !app ? 'bg-slate-50/30' : 'bg-white'}`}
                        >
                           {isSelected && (
                              <div 
                                 className={`absolute inset-x-1.5 z-10 bg-primary ${isFirstSelected ? 'rounded-t-2xl' : ''} ${isLastSelected ? 'rounded-b-2xl' : ''}`} 
                                 style={{ 
                                    top: isFirstSelected ? '6px' : '0',
                                    height: isFirstSelected && isLastSelected 
                                      ? 'calc(100% - 12px)' 
                                      : isFirstSelected 
                                        ? 'calc(100% - 5px)' // -6px for top gap, +1px for middle overlap
                                        : isLastSelected 
                                          ? 'calc(100% - 6px)' 
                                          : 'calc(100% + 1px)' 
                                 }}
                              >
                                 {isFirstSelected && <div className="flex justify-center mt-2"><span className="text-[8px] font-black text-white bg-white/20 px-1.5 py-0.5 rounded-full">{block.duration} MIN</span></div>}
                              </div>
                           )}

                          {app && (
                              <div 
                                 className={`absolute inset-x-1.5 z-20 flex flex-col p-2 px-3 color-white ${app.blocks[0] === time ? 'rounded-t-2xl' : ''} ${app.blocks[app.blocks.length - 1] === time ? 'rounded-b-2xl' : ''}`}
                                 style={{ 
                                    backgroundColor: docColor, 
                                    top: app.blocks[0] === time ? '6px' : '0',
                                    height: app.blocks.length === 1
                                      ? 'calc(100% - 12px)'
                                      : app.blocks[0] === time
                                        ? 'calc(100% - 5px)'
                                        : app.blocks[app.blocks.length - 1] === time
                                          ? 'calc(100% - 6px)'
                                          : 'calc(100% + 1px)',
                                    color: '#fff', 
                                    borderLeft: '4px solid rgba(0,0,0,0.1)' 
                                 }}
                              >
                                 {app.blocks[0] === time && (
                                    <div className="flex justify-between items-start animate-in fade-in slide-in-from-left-2 duration-300 w-full overflow-hidden gap-2">
                                       <div className="flex flex-col shadow-sm overflow-hidden flex-1">
                                          <span className="text-[11px] font-black leading-tight truncate">
                                             {app.patientName}
                                          </span>
                                       </div>
                                       <div className="flex-shrink-0 ml-1">
                                          <div className="w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-black bg-white uppercase tracking-tight shadow-sm" style={{ color: docColor }}>
                                             {app.patientName.substring(0, 2)}
                                          </div>
                                       </div>
                                    </div>
                                 )}

                                 {/* Doctor Name - Second block if exists, else first block */}
                                 {app.blocks.indexOf(time) === (app.blocks.length > 1 ? 1 : 0) && (
                                    <div className="mt-auto w-full flex justify-center animate-in slide-in-from-bottom-2 duration-500">
                                       <div className="text-[9px] font-black uppercase tracking-widest leading-none truncate px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 shadow-sm flex items-center gap-1.5">
                                          <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_5px_rgba(255,255,255,0.8)]"></div>
                                          {docLabel}
                                       </div>
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
           onSuccess={() => { setIsModalOpen(false); setSelectedSlots([]); if (prefilledPatient) clearPrefilledContext(); }}
        />
      </div>

      {/* Quick View Modal - outside animated container for fixed positioning */}
      {viewingAppointment && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 6000,
            background: 'rgba(15, 20, 40, 0.35)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px',
            animation: 'qv-fade-in 0.22s ease',
          }}
        >
          {/* Click-outside backdrop */}
          <div style={{ position: 'absolute', inset: 0 }} onClick={() => setViewingAppointment(null)} />

          {/* Modal Card */}
          <div
            style={{
              position: 'relative', zIndex: 10,
              background: '#ffffff',
              borderRadius: '24px',
              width: '100%', maxWidth: '400px',
              padding: '32px',
              display: 'flex', flexDirection: 'column', gap: '24px',
              boxShadow: '0 32px 80px rgba(0,0,20,0.22), 0 2px 8px rgba(0,0,0,0.08)',
              border: '1px solid rgba(226,232,240,0.8)',
              animation: 'qv-scale-in 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{
                  fontSize: 9, fontWeight: 900, color: '#3B82F6',
                  textTransform: 'uppercase', letterSpacing: '0.2em',
                  marginBottom: 6,
                }}>Cita Programada</div>
                <h3 style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', margin: 0, lineHeight: 1.2 }}>
                  {viewingAppointment.patientName}
                </h3>
              </div>
              <button
                onClick={() => setViewingAppointment(null)}
                style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: '#F1F5F9', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#94A3B8', flexShrink: 0,
                  transition: 'background 0.15s',
                }}
                onMouseOver={e => e.currentTarget.style.background = '#E2E8F0'}
                onMouseOut={e => e.currentTarget.style.background = '#F1F5F9'}
              >
                <X size={16} strokeWidth={2.5} />
              </button>
            </div>

            {/* Detail Rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Date */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 12,
                  background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#6366F1', flexShrink: 0,
                }}>
                  <CalendarIcon size={17} />
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#475569' }}>
                  {viewingAppointment.date}
                </span>
              </div>

              {/* Time */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 12,
                  background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#3B82F6', flexShrink: 0,
                }}>
                  <Clock size={17} />
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#475569' }}>
                  {viewingAppointment.blocks?.[0]} – {hours[hours.indexOf(viewingAppointment.blocks?.[viewingAppointment.blocks.length - 1]) + 1] || '20:00'}
                </span>
              </div>

              {/* Doctor */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 12,
                  background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#10B981', flexShrink: 0,
                }}>
                  <User size={17} />
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#475569' }}>
                  {doctors.find(d => d.id === viewingAppointment.doctorId)?.name || viewingAppointment.doctorName || 'Profesional'}
                </span>
              </div>
            </div>

            {/* Notes / Treatment */}
            {viewingAppointment.notes && (
              <div style={{
                padding: '14px 16px',
                background: '#F8FAFC',
                borderRadius: 14,
                border: '1px solid #E2E8F0',
                fontSize: 13,
                color: '#64748B',
                fontWeight: 500,
                lineHeight: 1.5,
              }}>
                {viewingAppointment.notes}
              </div>
            )}

            {/* Close Button */}
            <button
              onClick={() => setViewingAppointment(null)}
              style={{
                width: '100%', padding: '16px 0',
                background: '#0F172A', color: '#FFFFFF',
                border: 'none', borderRadius: 16,
                fontSize: 11, fontWeight: 900,
                letterSpacing: '0.15em', textTransform: 'uppercase',
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(15,23,42,0.25)',
                transition: 'background 0.15s, transform 0.1s',
              }}
              onMouseOver={e => e.currentTarget.style.background = '#1E293B'}
              onMouseOut={e => e.currentTarget.style.background = '#0F172A'}
              onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
              onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              Cerrar Detalles
            </button>
          </div>

          {/* Keyframe animations injected via style tag */}
          <style>{`
            @keyframes qv-fade-in { from { opacity: 0 } to { opacity: 1 } }
            @keyframes qv-scale-in { from { opacity: 0; transform: scale(0.92) } to { opacity: 1; transform: scale(1) } }
          `}</style>
        </div>
      )}

      {/* Success Toast */}
      {successToast && (
        <div className="fixed bottom-8 right-8 z-[7000] bg-emerald-500 text-white px-6 py-4 rounded-2xl shadow-2xl shadow-emerald-500/20 font-black text-xs uppercase tracking-widest flex items-center gap-3 animate-in slide-in-from-bottom-5">
           <CheckCircle2 size={18} strokeWidth={3} /> {successToast}
        </div>
      )}
    </>
  );
};

export default Scheduler;
