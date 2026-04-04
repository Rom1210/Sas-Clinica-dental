import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Filter, Zap, LayoutGrid, CalendarDays, ClipboardList, Calendar as CalendarIcon, CheckCircle2, User, Clock, Check, X, AlertCircle, Stethoscope, DollarSign, CheckCircle, RefreshCw, Ban } from 'lucide-react';
import useSoundFX from '../../hooks/useSoundFX';
import { useData } from '../../context/DataContext';
import AppointmentModal from './AppointmentModal';

const Scheduler = () => {
  const { appointments, addAppointment, addPatient, doctors, consultations, payments, patients } = useData();
  const location = useLocation();
  const navigate = useNavigate();

  // Utility to unify doctor ID naming
  const getDocId = (app) => app?.doctor_id || app?.doctorId;

  // 1. Basic UI State
  const [view, setView] = useState('week');
  const [filterType, setFilterType] = useState(() => {
    if (location.state?.preloadedDoctor) {
      return location.state.preloadedDoctor.isSpecialist ? 'Especialista' : 'Odontólogo general';
    }
    return 'Todos';
  });
  const [selectedDoctorId, setSelectedDoctorId] = useState(() => location.state?.preloadedDoctor?.id || null);
  const [baseDate, setBaseDate] = useState(new Date());
  const [successToast, setSuccessToast] = useState(null);

  // 2. Prefilled context from NewAppointmentFlow
  const prefilledPatient = location.state?.prefilledPatient || null;
  const preloadedServices = location.state?.preloadedServices || location.state?.pendingConsultation?.services || [];
  const preloadedDoctor = location.state?.preloadedDoctor || null;

  // 3. Selection & Modal State
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartSlot, setDragStartSlot] = useState(null); // { dateStr, timeIdx }
  const [pointerPos, setPointerPos] = useState({ x: 0, y: 0 });
  const [isLongDrag, setIsLongDrag] = useState(false);

  // 4. Core Computed Data (Memos) - Move to TOP to avoid TDZ

  const hours = useMemo(() => {
    // Extend until 22:00 (10 PM) as requested
    return Array.from({ length: 57 }, (_, i) => {
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

  const getAppointmentsForSlot = (dateStr, time) => {
    let filtered = appointments || [];

    if (filterType === 'Odontólogo general') {
      filtered = filtered.filter(app => {
        const doc = doctors.find(d => d.id === getDocId(app));
        return doc && !doc.isSpecialist;
      });
    } else if (filterType === 'Especialista') {
      filtered = filtered.filter(app => {
        const doc = doctors.find(d => d.id === getDocId(app));
        return doc && doc.isSpecialist;
      });
    }

    if (selectedDoctorId) {
      filtered = filtered.filter(app => getDocId(app) === selectedDoctorId);
    }

    return filtered.filter(app => {
      if (app.date !== dateStr) return false;
      return app.blocks?.includes(time);
    }).sort((a, b) => String(getDocId(a) || '').localeCompare(String(getDocId(b) || '')));
  };

  const filteredDoctors = useMemo(() => {
    if (filterType === 'Todos') return doctors || [];
    if (filterType === 'Odontólogo general') return (doctors || []).filter(d => !d.isSpecialist);
    if (filterType === 'Especialista') return (doctors || []).filter(d => d.isSpecialist);
    return doctors || [];
  }, [doctors, filterType]);

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

      if (isTodayVisible && currentHour >= 8 && currentHour < 22) {
        // Caracas/Venezuela Time Adjustment (UTC-4)
        const totalMinutesFromStart = (currentHour - 8) * 60 + currentMin;
        const topPosition = (totalMinutesFromStart / 15) * 56; 

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
        setIsLongDrag(false);
      }
    };
    window.addEventListener('pointerup', handleGlobalPointerUp);
    return () => window.removeEventListener('pointerup', handleGlobalPointerUp);
  }, [isDragging]);

  // Handle highlighted appointment from navigation state (e.g., from Patient History)
  useEffect(() => {
    if (location.state?.highlightId && appointments?.length > 0) {
      const targetId = location.state.highlightId;
      const app = appointments.find(a => a.id === targetId || String(a.id) === String(targetId));
      if (app) {
        const appDate = new Date(app.starts_at || app.start_at);
        setBaseDate(appDate);
        setSelectedDoctorId(getDocId(app));
        setFilterType('Todos');
        // Clear highlight to avoid sticky state, but keep other state if needed
        const newState = { ...location.state };
        delete newState.highlightId;
        navigate(location.pathname, { replace: true, state: newState });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, appointments, navigate, location.pathname]);

  // 7. Event Handlers

  const showToast = (msg) => {
    setSuccessToast(msg);
    setTimeout(() => {
      setSuccessToast(null);
      // If closing a blocked operation, refreshing background data
    }, 4000);
  };

  const clearPrefilledContext = () => {
    navigate(location.pathname, { replace: true, state: {} });
  };

  const handlePointerDown = (e, dateStr, timeIdx) => {
    if (e.button !== 0) return;
    const time = hours[timeIdx];
    const existingApp = getAppointmentsForSlot(dateStr, time)[0];
    if (existingApp) {
      if (existingApp.status === 'blocked') {
        // Allow removing block or viewing it
        navigate(`/scheduler/appointment/${existingApp.id}`);
        return;
      }
      navigate(`/scheduler/appointment/${existingApp.id}`);
      return;
    }
    
    setIsDragging(true);
    setDragStartSlot({ dateStr, timeIdx });
    setPointerPos({ x: e.clientX, y: e.clientY });
    setIsLongDrag(false);
    
    setSelectedSlots(prev => {
      const slotKey = `${dateStr}|${time}`;
      if (prev.length > 0) {
        const firstDate = prev[0].split('|')[0];
        if (firstDate !== dateStr) return [slotKey];

        const existingIdxs = prev.map(s => hours.indexOf(s.split('|')[1])).sort((a,b) => a-b);
        const minIdx = existingIdxs[0];
        const maxIdx = existingIdxs[existingIdxs.length - 1];

        // Only allow adjacent selection or toggling an edge
        if (timeIdx === minIdx - 1 || timeIdx === maxIdx + 1 || prev.includes(slotKey)) {
          return prev.includes(slotKey) 
            ? prev.filter(s => s !== slotKey) 
            : [...prev, slotKey];
        } else {
          // If not adjacent, start fresh with the new slot
          return [slotKey];
        }
      }
      return [slotKey];
    });
  };

  const handlePointerMove = (e, dateStr, timeIdx) => {
    if (!isDragging || !dragStartSlot) return;
    
    // Threshold for drag selection vs click
    const dx = Math.abs(e.clientX - pointerPos.x);
    const dy = Math.abs(e.clientY - pointerPos.y);
    if (!isLongDrag && (dx > 10 || dy > 10)) {
      setIsLongDrag(true);
    }
    
    if (!isLongDrag) return;
    if (dateStr !== dragStartSlot.dateStr) return;
    
    const startIdx = Math.min(dragStartSlot.timeIdx, timeIdx);
    const endIdx = Math.max(dragStartSlot.timeIdx, timeIdx);
    
    const rangeSelection = [];
    for (let i = startIdx; i <= endIdx; i++) {
      const time = hours[i];
      if (getAppointmentsForSlot(dateStr, time).length > 0) {
        if (i < dragStartSlot.timeIdx) continue;
        else break;
      }
      rangeSelection.push(`${dateStr}|${time}`);
    }
    
    setSelectedSlots(prev => {
      const otherDates = prev.filter(s => s.split('|')[0] !== dateStr);
      const unique = new Set([...otherDates, ...rangeSelection]);
      return Array.from(unique);
    });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    setDragStartSlot(null);
    setIsLongDrag(false);
  };

  const handleBlockTime = async () => {
    if (!selectedSlots.length) return;
    const sortedBlocks = [...selectedSlots].sort((a, b) => {
      const timeA = a.split('|')[1];
      const timeB = b.split('|')[1];
      return hours.indexOf(timeA) - hours.indexOf(timeB);
    });
    const dateStr = sortedBlocks[0].split('|')[0];
    const timeBlocks = sortedBlocks.map(s => s.split('|')[1]);
    const lastTime = timeBlocks[timeBlocks.length - 1];
    const lastIdx = hours.indexOf(lastTime);
    const endTime = hours[lastIdx + 1] || '22:00';
    const doctorId = preloadedDoctor?.id || selectedDoctorId || doctors?.[0]?.id;

    // Technical Patient Logic for Blocking (to bypass DB constraints)
    let blockPatient = patients?.find(p => p.dni === 'ADMIN_BLOCK' || p.full_name?.toUpperCase().includes('AGENDA BLOQUEADA'));
    
    if (!blockPatient) {
      try {
        blockPatient = await addPatient({
          full_name: 'BLOQUEO DE AGENDA',
          dni: 'ADMIN_BLOCK',
          phone: '',
          email: 'admin@block.com',
          status: 'technical'
        });
      } catch (err) {
        console.error('Failed to create technical patient for blocking:', err);
        // Fallback to first patient if creation fails (to not block user during urgency)
        blockPatient = patients?.[0];
      }
    }

    if (!blockPatient) return alert('Error: No se pudo establecer un paciente técnico para el bloqueo.');

    const newBlock = {
      starts_at: `${dateStr}T${timeBlocks[0]}:00`,
      ends_at: `${dateStr}T${endTime}:00`,
      start_at: `${dateStr}T${timeBlocks[0]}:00`,
      end_at: `${dateStr}T${endTime}:00`,
      patient_id: blockPatient.id,
      doctor_id: doctorId,
      status: 'blocked',
      notes: 'Horario Bloqueado (Administración)',
    };

    try {
      await addAppointment(newBlock);
      setSelectedSlots([]);
      setSuccessToast(`✓ Horario Bloqueado — ${dateStr} ${timeBlocks[0]}`);
    } catch (err) {
      console.error('Error blocking time:', err);
      alert('Error: ' + err.message);
    }
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
    const dateStr = sortedBlocks[0].split('|')[0];
    const timeBlocks = sortedBlocks.map(s => s.split('|')[1]);
    const lastTime = timeBlocks[timeBlocks.length - 1];
    const lastIdx = hours.indexOf(lastTime);
    const endTime = hours[lastIdx + 1] || '20:00';
    const doctorId = preloadedDoctor?.id || doctors?.[0]?.id || null;
    const startsAt = `${dateStr}T${timeBlocks[0]}:00`;
    const endsAt = `${dateStr}T${endTime}:00`;

    const hasConflict = (appointments || []).some(app => {
      if (getDocId(app) !== doctorId) return false;
      if (app.date !== dateStr) return false;
      return timeBlocks.some(slot => app.blocks?.includes(slot));
    });

    if (hasConflict) {
      alert("Error: Este doctor ya tiene una cita agendada en una o varias de las horas seleccionadas.");
      return;
    }

    // Store services and prices in a structured format in notes
    const servicesSummary = preloadedServices.map(s => `${s.name} ($${s.price})`).join(', ');
    const totalAmount = location.state?.pendingConsultation?.total || 0;
    const structuredNotes = `Servicios: ${servicesSummary} | Total: $${totalAmount}`;

    const newAppointment = {
      starts_at: startsAt,
      ends_at: endsAt,
      start_at: startsAt,
      end_at: endsAt,
      patient_id: prefilledPatient.id,
      doctor_id: doctorId,
      status: 'scheduled',
      notes: structuredNotes,
    };

    try {
      await addAppointment(newAppointment);
      setSelectedSlots([]);
      setSuccessToast(`✓ Cita guardada — ${prefilledPatient.full_name || prefilledPatient.name || 'Paciente'} · ${dateStr} ${timeBlocks[0]}`);
      setTimeout(() => setSuccessToast(null), 5000);
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
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Agenda Atómica</h2>
                <button 
                  onClick={() => navigate('/scheduler/upcoming')}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-100 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest transition-all hover:bg-slate-900 hover:text-white hover:border-slate-900 hover:shadow-lg active:scale-95 group ml-2 shadow-sm"
                >
                  <ClipboardList size={14} strokeWidth={3} className="group-hover:rotate-12 transition-transform" />
                  Ver listado de citas próximas
                </button>
              </div>
            </div>
            <p className="text-slate-500 text-sm font-medium pl-13">Visualización y gestión de citas clínicas</p>
          </div>

          <div className="flex flex-wrap items-center gap-4 bg-slate-50/50 p-1.5 rounded-[1.5rem] border border-slate-100 shadow-sm backdrop-blur-sm">
            <div className="flex items-center bg-white p-1 rounded-xl border border-slate-100/50 shadow-sm">
              {['Todos', 'Odontólogo general', 'Especialista'].map(f => (
                <button
                  key={f}
                  onClick={() => {
                    setFilterType(f);
                    setSelectedDoctorId(null);
                  }}
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

            {filteredDoctors.length > 0 && (
              <>
                <div className="h-6 w-px bg-slate-200 hidden xl:block mx-1"></div>
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide max-w-[400px] py-1 px-1">
                  {filteredDoctors.map(doc => (
                    <button
                      key={doc.id}
                      onClick={() => setSelectedDoctorId(selectedDoctorId === doc.id ? null : doc.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-2xl transition-all border shadow-sm cursor-pointer whitespace-nowrap ${
                        selectedDoctorId === doc.id 
                          ? 'border-transparent shadow-lg scale-105' 
                          : 'border-slate-100 hover:border-slate-200'
                      }`}
                      style={{ 
                        backgroundColor: selectedDoctorId === doc.id ? (doc.color || '#3b82f6') : `${doc.color || '#3b82f6'}0F`, // 0F = 6% opacity
                        color: selectedDoctorId === doc.id ? 'white' : (doc.color || '#3b82f6')
                      }}
                    >
                      <span className="text-[10px] font-black uppercase tracking-tight">
                        {doc.name}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {prefilledPatient && (
          <div className="animate-slide-down-ribbon shadow-premium" style={{
            background: 'white', border: '1px solid #e2e8f0', borderRadius: '1.5rem',
            padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 16, flexWrap: 'wrap',
            marginBottom: '1.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 24, flex: 1, flexWrap: 'wrap' }}>
              {/* Block 1: Patient */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 38, height: 38, background: '#2563EB', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(37,99,235,0.2)' }}>
                  <User size={18} color="#fff" />
                </div>
                <div>
                  <div style={{ fontSize: 9, fontWeight: 800, color: '#3B82F6', letterSpacing: '0.14em', textTransform: 'uppercase' }}>Paciente</div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: '#1E293B' }}>{prefilledPatient.name}</div>
                </div>
              </div>

              {/* Block 2: Professional */}
              {preloadedDoctor && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 24, borderLeft: '1px solid #f1f5f9' }}>
                  <div style={{ width: 38, height: 38, background: '#10B981', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(16,185,129,0.2)' }}>
                    <Stethoscope size={18} color="#fff" />
                  </div>
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 800, color: '#10B981', letterSpacing: '0.14em', textTransform: 'uppercase' }}>Asignado a</div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: '#1E293B' }}>{preloadedDoctor.name}</div>
                  </div>
                </div>
              )}

              {/* Block 3: Financial Summary */}
              {location.state?.pendingConsultation && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 24, borderLeft: '1px solid #f1f5f9' }}>
                  <div style={{ width: 38, height: 38, background: '#F59E0B', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(245,158,11,0.2)' }}>
                    <DollarSign size={18} color="#fff" />
                  </div>
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 800, color: '#F59E0B', letterSpacing: '0.14em', textTransform: 'uppercase' }}>Presupuesto Cita</div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: '#1E293B' }}>
                       ${location.state.pendingConsultation.total}
                       {prefilledPatient.totalDue > 0 && (
                         <span style={{ fontSize: 10, color: '#EF4444', marginLeft: 8, fontWeight: 700 }}>
                           (Deuda: ${prefilledPatient.totalDue})
                         </span>
                       )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <button 
              onClick={clearPrefilledContext} 
              style={{ 
                width: 32, height: 32, borderRadius: '50%', background: '#F8FAFC', 
                border: '1px solid #E2E8F0', cursor: 'pointer', color: '#94A3B8',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              onMouseOver={e => e.currentTarget.style.background = '#F1F5F9'}
              onMouseOut={e => e.currentTarget.style.background = '#F8FAFC'}
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Main Grid Card */}
        <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/30 via-primary to-primary/30 z-30"></div>


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
                    <span className="text-[9px] font-bold text-slate-400/50 tracking-widest">{time.split(':')[1]}</span>
                  )}
                </div>

                {activeDays.map((day, dIdx) => {
                  const apps = getAppointmentsForSlot(day.dateStr, time);
                  const block = contiguousBlocks.find(b => b.dateStr === day.dateStr && b.slots.includes(time));
                  const isSelected = !!block;
                  const isFirstSelected = isSelected && block.slots[0] === time;
                  const isLastSelected = isSelected && block.slots[block.slots.length - 1] === time;
                  const isPast = isPastSlot(day.dateStr, time);

                  return (
                    <div
                      key={dIdx}
                      onPointerDown={(e) => handlePointerDown(e, day.dateStr, tIdx)}
                      onPointerMove={(e) => handlePointerMove(e, day.dateStr, tIdx)}
                      onPointerUp={handlePointerUp}
                      style={{ height: '56px' }}
                      className={`border-b border-r relative transition-colors touch-none select-none border-slate-100/50 ${apps.length > 0 ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-slate-50/50'} ${isPast && !isSelected && apps.length === 0 ? 'bg-slate-50/30' : 'bg-white'}`}
                    >
                      {isSelected && (
                        <div
                          className={`absolute z-10 backdrop-blur-sm shadow-[0_8px_24px_rgba(0,0,0,0.15)] animate-pop-in ${isFirstSelected ? 'rounded-t-[1rem]' : ''} ${isLastSelected ? 'rounded-b-[1rem]' : ''}`}
                          style={{
                            left: '4px',
                            right: '4px',
                            backgroundColor: prefilledPatient 
                              ? (doctors.find(d => d.id === selectedDoctorId)?.color || preloadedDoctor?.color || '#3b82f6') + 'e6'
                              : '#EF4444e6', 
                            top: isFirstSelected ? '4px' : '-1px',
                            height: isFirstSelected && isLastSelected
                              ? 'calc(100% - 8px)'
                              : isFirstSelected
                                ? 'calc(100% - 4px + 2px)'
                                : isLastSelected
                                  ? 'calc(100% - 3px)'
                                  : 'calc(100% + 2px)',
                            borderTopLeftRadius: isFirstSelected ? '2rem' : '0',
                            borderTopRightRadius: isFirstSelected ? '2rem' : '0',
                            borderBottomLeftRadius: isLastSelected ? '2rem' : '0',
                            borderBottomRightRadius: isLastSelected ? '2rem' : '0',
                            border: `1.5px solid ${prefilledPatient ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.7)'}`,
                            borderBottomWidth: isLastSelected ? '1.5px' : '0',
                            borderTopWidth: isFirstSelected ? '1.5px' : '0',
                          }}
                        >
                          {isFirstSelected && (
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full flex flex-col items-center justify-center pointer-events-none gap-0.5">
                              {!prefilledPatient && <span className="text-[12px]">🚫</span>}
                              <span className="text-[9px] font-black text-white bg-black/20 backdrop-blur-md px-2 py-0.5 rounded-full ring-1 ring-white/30 whitespace-nowrap shadow-sm tracking-tighter">
                                {block.duration} MIN
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {apps.length > 0 && (
                        <div className="absolute inset-0 z-20">
                          {apps.map((app, index) => {
                            const width = 100 / apps.length;
                            const left = index * width;

                            let docColor = '#3b82f6';
                            let docLabel = '';

                            const doc = doctors.find(d => d.id === getDocId(app));
                            if (doc) {
                              docColor = doc.color || '#3b82f6';
                              docLabel = doc.name;
                            }

                            const isFirst = app.blocks[0] === time;
                            const isLast = app.blocks[app.blocks.length - 1] === time;
                            const isBlocked = app.status === 'blocked';

                            return (
                              <div
                                key={`${app.id}-${time}-${index}`}
                                onClick={(e) => { e.stopPropagation(); navigate(`/scheduler/appointment/${app.id}`); }}
                                style={{
                                  position: 'absolute',
                                  top: isFirst ? '2px' : '-1px', 
                                  height: isFirst && isLast 
                                    ? 'calc(100% - 4px)' 
                                    : isFirst 
                                      ? 'calc(100% - 2px + 1px)' 
                                      : isLast 
                                        ? 'calc(100% - 2px)' 
                                        : 'calc(100% + 2px)',
                                  width: `calc(${width}% - 2px)`,
                                  left: `calc(${left}% + 1px)`,
                                  backgroundColor: isBlocked ? `${docColor}99` : docColor, // 99 = 60% opacity
                                  borderRadius: isFirst && isLast 
                                    ? '10px' 
                                    : isFirst 
                                      ? '10px 10px 0 0' 
                                      : isLast 
                                        ? '0 0 10px 10px' 
                                        : '0',
                                  padding: '4px 8px',
                                  color: '#fff',
                                  cursor: 'pointer',
                                  overflow: 'hidden',
                                  zIndex: 10 + index,
                                  boxShadow: isBlocked ? 'none' : 'inset 0 0 20px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.1)',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                  border: isBlocked ? `2px dashed ${docColor}` : '1px solid rgba(255,255,255,0.1)',
                                  filter: isBlocked ? 'saturate(0.5)' : (app.status === 'cancelled' ? 'grayscale(0.8)' : 'none'),
                                  opacity: app.status === 'cancelled' ? 0.6 : 1
                                }}
                                onMouseOver={e => e.currentTarget.style.filter = 'brightness(1.1)'}
                                onMouseOut={e => e.currentTarget.style.filter = 'none'}
                                title={isBlocked ? `Bloqueado - ${docLabel}` : `${app.patientName} - ${docLabel}`}
                              >
                                {isBlocked && isFirst && (
                                  <span className="text-lg animate-pulse">⚽</span>
                                )}
                                {!isBlocked && isFirst && (
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                                    {app.status === 'completed' && (
                                      <CheckCircle size={10} strokeWidth={3} style={{ opacity: 0.9 }} />
                                    )}
                                    {app.status === 'rescheduled' && (
                                      <RefreshCw size={10} strokeWidth={3} style={{ opacity: 0.9 }} />
                                    )}
                                    {app.status === 'cancelled' && (
                                      <Ban size={10} strokeWidth={3} style={{ opacity: 0.9 }} />
                                    )}
                                    <span className="text-[8px] font-black uppercase opacity-60 mt-1">
                                      {app.patientName.split(' ')[0]}
                                    </span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
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


      {/* Selection Floating Bar — Redesigned ‘Premium Dock’ */}
      {(selectionSummary && selectedSlots.length > 0) && createPortal(
        <div 
          className="fixed border-none shadow-[0_32px_80px_rgba(0,0,0,0.3)] rounded-full flex items-center animate-slide-up-dock z-[9999]"
          style={{
            bottom: '48px',
            left: '50%',
            transform: 'translateX(-50%)', 
            zIndex: 9999,
            backgroundColor: prefilledPatient 
              ? (doctors.find(d => d.id === selectedDoctorId)?.color || preloadedDoctor?.color || '#3b82f6')
              : '#EF4444',
            minWidth: '550px',
            padding: '10px 40px',
          }}
        >
          {/* Column 1: Info (Left) */}
          <div className="flex-1 flex flex-col items-start justify-center">
            <span className="text-[12px] font-black leading-none tracking-tight text-white mb-1">
              {selectedSlots.length} Bloque{selectedSlots.length > 1 ? 's' : ''}
            </span>
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/90 whitespace-nowrap" style={{ color: '#ffffff' }}>Selección</span>
          </div>

          {/* Column 2: Close (Exact Center) */}
          <div className="flex justify-center flex-shrink-0">
            <button 
              onClick={() => setSelectedSlots([])} 
              className="w-11 h-11 flex items-center justify-center rounded-full transition-all cursor-pointer hover:bg-white/10 active:scale-90 border-none text-white p-0"
              style={{ backgroundColor: 'transparent', border: 'none' }}
              title="Cancelar"
            >
              <X size={26} strokeWidth={4} className="hover:rotate-90 transition-transform duration-300" />
            </button>
          </div>

          {/* Column 3: Action (Right) */}
          <div className="flex-1 flex justify-end">
            <button 
              onClick={prefilledPatient ? handleScheduleAppointment : handleBlockTime} 
              className="px-6 py-3 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-full transition-all hover:bg-white/10 flex items-center gap-3 active:scale-95 border-none cursor-pointer"
              style={{ backgroundColor: 'transparent', border: 'none' }}
            >
              {prefilledPatient ? 'Agendar Cita' : 'Bloquear Horario'} 
              <ChevronRight size={18} strokeWidth={4} />
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Success Toast */}
      {successToast && (
        <div className="fixed bottom-10 right-10 z-[10000] bg-slate-900/95 backdrop-blur-xl border border-white/10 p-1.5 pl-6 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.4)] flex items-center gap-5 animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest leading-none mb-1.5">Éxito</span>
            <span className="text-sm font-bold text-white leading-tight">{successToast}</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center border border-emerald-500/30">
            <CheckCircle2 size={24} strokeWidth={2.5} />
          </div>
        </div>
      )}
    </>
  );
};

export default Scheduler;
