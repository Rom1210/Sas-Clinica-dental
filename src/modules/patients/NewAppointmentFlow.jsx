import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Plus, Search, X, Check, ArrowRight,
  Stethoscope, ChevronDown, Trash2,
  Calendar, ArrowLeft, User
} from 'lucide-react';
import { useData } from '../../context/DataContext';

/* ─────────────────────────────────────────────────────────────
   MOCK CATALOG (se usa sólo si no hay datos reales de Supabase)
───────────────────────────────────────────────────────────── */
const MOCK_SERVICES = [
  { id: 's1', name: 'Consulta odontológica',     base_price: 20 },
  { id: 's2', name: 'Evaluación dental',          base_price: 15 },
  { id: 's3', name: 'Limpieza dental (profilaxis)', base_price: 35 },
  { id: 's4', name: 'Destartraje (limpieza profunda)', base_price: 50 },
  { id: 's5', name: 'Aplicación de flúor',        base_price: 10 },
  { id: 's6', name: 'Sellantes dentales',          base_price: 25 },
  { id: 's7', name: 'Resina simple',               base_price: 30 },
  { id: 's8', name: 'Extracción simple',           base_price: 40 },
  { id: 's9', name: 'Blanqueamiento dental',       base_price: 80 },
];

const MOCK_DOCTORS = [
  { id: 'd1', name: 'Dr. Specialist' },
  { id: 'd2', name: 'Dra. María González' },
  { id: 'd3', name: 'Dr. Juan Pérez' },
  { id: 'd4', name: 'Dra. Ana López' },
  { id: 'd5', name: 'Dr. Carlos Méndez' },
];

/* ─────────────────────────────────────────────────────────────
   DESIGN TOKENS (igual que index.css)
───────────────────────────────────────────────────────────── */
const T = {
  bg:       '#F4F7FE',
  white:    '#ffffff',
  primary:  '#2563EB',
  primaryH: '#1D4ED8',
  slate50:  '#f8fafc',
  slate100: '#f1f5f9',
  slate200: '#e2e8f0',
  slate300: '#cbd5e1',
  slate400: '#94a3b8',
  slate500: '#64748b',
  slate700: '#334155',
  slate800: '#1e293b',
  slate900: '#0f172a',
  shadow:   '0 2px 12px rgba(0,0,0,0.05)',
  shadowLg: '0 8px 30px rgba(0,0,0,0.08)',
};

/* ─────────────────────────────────────────────────────────────
   REUSABLE PILL LABEL
───────────────────────────────────────────────────────────── */
const EyebrowLabel = ({ children }) => (
  <span style={{
    fontSize: 10, fontWeight: 800, letterSpacing: '0.18em',
    textTransform: 'uppercase', color: T.slate400
  }}>
    {children}
  </span>
);

/* ─────────────────────────────────────────────────────────────
   CARD WRAPPER
───────────────────────────────────────────────────────────── */
const Card = ({ children, style = {} }) => (
  <div style={{
    background: T.white,
    border: `1px solid ${T.slate100}`,
    borderRadius: 24,
    boxShadow: T.shadow,
    ...style
  }}>
    {children}
  </div>
);

/* ─────────────────────────────────────────────────────────────
   SERVICE MODAL
───────────────────────────────────────────────────────────── */
const ServiceModal = ({ onClose, onAdd, catalog }) => {
  const [query, setQuery]   = useState('');
  const [price, setPrice]   = useState('');
  const [picked, setPicked] = useState(null);
  const inputRef            = useRef(null);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 100); }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return catalog;
    const q = query.toLowerCase();
    return catalog.filter(s => s.name.toLowerCase().includes(q));
  }, [query, catalog]);

  const handleSelect = (s) => {
    setPicked(s);
    setQuery(s.name);
    setPrice(String(s.base_price ?? s.price ?? ''));
  };

  const handleAdd = () => {
    if (!picked && !query.trim()) return;
    onAdd({
      id: picked?.id || Date.now(),
      name: picked?.name || query.trim(),
      price: parseFloat(price) || 0,
    });
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(15,23,42,0.45)',
      backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: 24,
    }} onClick={onClose}>
      <div style={{
        background: T.white, borderRadius: 32, width: '100%', maxWidth: 520,
        boxShadow: '0 32px 80px rgba(0,0,0,0.14)',
        animation: 'naf-slide-up 0.22s cubic-bezier(.22,1,.36,1) both',
      }} onClick={e => e.stopPropagation()}>
        
        {/* Modal Header */}
        <div style={{ padding: '2rem 2rem 1.25rem', borderBottom: `1px solid ${T.slate100}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ fontSize: '1.375rem', fontWeight: 900, color: T.slate900, letterSpacing: '-0.03em', margin: 0 }}>
              Añadir servicio
            </h2>
            <EyebrowLabel>Catálogo del sistema</EyebrowLabel>
          </div>
          <button onClick={onClose} style={{
            width: 38, height: 38, borderRadius: '50%', border: `1px solid ${T.slate200}`,
            background: T.slate50, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: T.slate400,
          }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '1.5rem 2rem' }}>
          {/* Search field */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 10, fontWeight: 800, color: T.slate400, letterSpacing: '0.16em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
              Buscar servicio
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={16} style={{ position: 'absolute', left: 14, color: T.slate400, flexShrink: 0 }} />
              <input
                ref={inputRef}
                type="text"
                placeholder="Ej: Limpieza, Resina, Extracción..."
                value={query}
                onChange={e => { setQuery(e.target.value); setPicked(null); setPrice(''); }}
                style={{
                  width: '100%', paddingLeft: 42, paddingRight: 14, paddingTop: 12, paddingBottom: 12,
                  border: `1.5px solid ${T.slate200}`, borderRadius: 14, fontSize: 14, fontWeight: 600,
                  color: T.slate800, background: T.slate50, outline: 'none',
                  transition: 'border 0.15s',
                }}
                onFocus={e => e.target.style.borderColor = T.primary}
                onBlur={e => e.target.style.borderColor = T.slate200}
              />
            </div>
          </div>

          {/* Scrollable dropdown list */}
          <div style={{
            maxHeight: 216, overflowY: 'auto', borderRadius: 16,
            border: `1px solid ${T.slate100}`, background: T.slate50,
            marginBottom: 20,
          }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: T.slate400, fontSize: 13, fontWeight: 600 }}>
                No se encontraron resultados
              </div>
            ) : filtered.map(s => (
              <div
                key={s.id}
                onClick={() => handleSelect(s)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.75rem 1rem', cursor: 'pointer', borderRadius: 10, margin: '4px 6px',
                  background: picked?.id === s.id ? '#EFF6FF' : 'transparent',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = picked?.id === s.id ? '#DBEAFE' : T.white}
                onMouseLeave={e => e.currentTarget.style.background = picked?.id === s.id ? '#EFF6FF' : 'transparent'}
              >
                <span style={{ fontSize: 14, fontWeight: 700, color: picked?.id === s.id ? T.primary : T.slate700 }}>
                  {s.name}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: picked?.id === s.id ? T.primary : T.slate500 }}>
                    ${s.base_price ?? s.price ?? 0}
                  </span>
                  {picked?.id === s.id && <Check size={14} style={{ color: T.primary }} />}
                </div>
              </div>
            ))}
          </div>

          {/* Price field */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 10, fontWeight: 800, color: T.slate400, letterSpacing: '0.16em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
              Precio por unidad (USD)
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: T.slate50, border: `1.5px solid ${T.slate200}`, borderRadius: 14, padding: '10px 14px' }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: T.slate500 }}>$</span>
              <input
                type="number"
                min="0"
                placeholder="0.00"
                value={price}
                onChange={e => setPrice(e.target.value)}
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 20, fontWeight: 900, color: T.slate900 }}
              />
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={onClose}
              style={{
                flex: 1, padding: '13px 0', borderRadius: 999, border: `1px solid ${T.slate200}`,
                background: T.white, color: T.slate500, fontWeight: 800, fontSize: 12,
                letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
            <button
              onClick={handleAdd}
              disabled={!query.trim()}
              style={{
                flex: 1, padding: '13px 0', borderRadius: 999, border: 'none',
                background: T.primary, color: '#fff', fontWeight: 800, fontSize: 12,
                letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer',
                boxShadow: '0 6px 20px rgba(37,99,235,0.28)',
                opacity: !query.trim() ? 0.5 : 1,
              }}
            >
              + Añadir servicio
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   DOCTOR SELECTOR
───────────────────────────────────────────────────────────── */
const DoctorSelector = ({ doctors, selected, onSelect }) => {
  const [open, setOpen]   = useState(false);
  const [query, setQuery] = useState('');
  const ref               = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return doctors;
    return doctors.filter(d => d.name.toLowerCase().includes(query.toLowerCase()));
  }, [query, doctors]);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Trigger */}
      <div
        onClick={() => { setOpen(v => !v); setQuery(''); }}
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 18px', borderRadius: 16,
          border: `1.5px solid ${open ? T.primary : T.slate200}`,
          background: open ? T.white : T.slate50,
          boxShadow: open ? `0 0 0 3px rgba(37,99,235,0.1)` : 'none',
          cursor: 'pointer', transition: 'all 0.15s',
        }}
      >
        <Stethoscope size={18} style={{ color: selected ? T.primary : T.slate400, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          {selected ? (
            <div>
              <div style={{ fontSize: 9, fontWeight: 800, color: T.primary, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
                Profesional seleccionado
              </div>
              <div style={{ fontSize: 15, fontWeight: 800, color: T.slate900 }}>{selected.name}</div>
            </div>
          ) : (
            <span style={{ fontSize: 14, fontWeight: 600, color: T.slate400 }}>Buscar especialista...</span>
          )}
        </div>
        <ChevronDown size={18} style={{ color: T.slate300, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </div>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0,
          background: T.white, border: `1px solid ${T.slate100}`, borderRadius: 20,
          boxShadow: '0 16px 48px rgba(0,0,0,0.12)', zIndex: 200,
          overflow: 'hidden',
          animation: 'naf-slide-up 0.18s ease both',
        }}>
          <div style={{ padding: '12px 12px 6px' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={15} style={{ position: 'absolute', left: 12, color: T.slate400 }} />
              <input
                autoFocus
                type="text"
                placeholder="Filtrar por nombre..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                style={{
                  width: '100%', paddingLeft: 36, paddingRight: 12, paddingTop: 10, paddingBottom: 10,
                  border: 'none', borderRadius: 12, background: T.slate50,
                  fontSize: 13, fontWeight: 600, color: T.slate800, outline: 'none',
                }}
              />
            </div>
          </div>
          <div style={{ maxHeight: 236, overflowY: 'auto', padding: '4px 8px 10px' }}>
            {filtered.map(doc => (
              <div
                key={doc.id}
                onClick={() => { onSelect(doc); setOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 12px', borderRadius: 12, cursor: 'pointer',
                  background: selected?.id === doc.id ? '#EFF6FF' : 'transparent',
                  marginBottom: 2,
                }}
                onMouseEnter={e => { if (selected?.id !== doc.id) e.currentTarget.style.background = T.slate50; }}
                onMouseLeave={e => { e.currentTarget.style.background = selected?.id === doc.id ? '#EFF6FF' : 'transparent'; }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: selected?.id === doc.id ? '#DBEAFE' : T.slate100,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 900, fontSize: 13,
                  color: selected?.id === doc.id ? T.primary : T.slate500,
                }}>
                  {doc.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: selected?.id === doc.id ? T.primary : T.slate800 }}>
                    {doc.name}
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: T.slate400, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    {doc.isSpecialist ? 'Especialista' : 'Odontólogo General'}
                  </div>
                </div>
                {selected?.id === doc.id && <Check size={16} style={{ color: T.primary }} />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────── */
const NewAppointmentFlow = () => {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const { patients, doctors: dbDoctors, services: dbServices, addAppointment } = useData();

  /* Patient resolution */
  const patient = useMemo(() => {
    const found = patients.find(p => p.id === id || p.id === parseInt(id));
    return found || null;
  }, [patients, id]);

  /* Catalog resolution */
  const catalog = useMemo(() => {
    return dbServices.length > 0 ? dbServices : MOCK_SERVICES;
  }, [dbServices]);

  const availableDoctors = useMemo(() => {
    const list = dbDoctors.filter(d => {
      const s = (d.status || '').toLowerCase();
      return s === 'activo' || s === 'active';
    });
    return list.length > 0 ? list : MOCK_DOCTORS;
  }, [dbDoctors]);

  /* Local state */
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedDoctor,   setSelectedDoctor]   = useState(null);
  const [isModalOpen,      setIsModalOpen]       = useState(false);

  const subtotal = useMemo(() => selectedServices.reduce((s, sv) => s + sv.price, 0), [selectedServices]);

  const handleAddService = (svc) => {
    setSelectedServices(prev => [...prev, { ...svc, uid: Date.now() }]);
  };

  const handleRemoveService = (uid) => {
    setSelectedServices(prev => prev.filter(s => s.uid !== uid));
  };

  const handleGoToScheduler = () => {
    if (selectedServices.length === 0) return;
    navigate('/scheduler', {
      state: {
        prefilledPatient: patient,
        preloadedServices: selectedServices,
        preloadedDoctor: selectedDoctor,
        pendingConsultation: { services: selectedServices, total: subtotal }
      }
    });
  };

  /* Styles helpers */
  const sectionHeader = {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingBottom: 18, marginBottom: 20,
    borderBottom: `1px solid ${T.slate100}`,
  };

  return (
    <div style={{ minHeight: '100%', background: T.bg, animation: 'naf-fade 0.35s ease' }}>
      
      {/* ── KEYFRAMES ── */}
      <style>{`
        @keyframes naf-fade     { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        @keyframes naf-slide-up { from { opacity: 0; transform: translateY(10px) scale(0.98); } to { opacity: 1; transform: none; } }
      `}</style>

      {/* ── HEADER ── */}
      <div style={{ marginBottom: 28 }}>
        <button
          onClick={() => navigate(`/pacientes/${id}`)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, border: 'none', background: 'none', cursor: 'pointer', color: T.slate500, fontWeight: 700, fontSize: 13, marginBottom: 16 }}
        >
          <ArrowLeft size={15} /> Volver al perfil
        </button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: T.slate400, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 4 }}>
              Gestión de agenda y tratamientos
            </div>
            <h1 style={{ fontSize: '2.25rem', fontWeight: 900, color: T.slate900, letterSpacing: '-0.04em', lineHeight: 1.1, margin: 0 }}>
              Nueva cita clínica
            </h1>
            <p style={{ fontSize: 14, color: T.slate500, fontWeight: 500, marginTop: 6 }}>
              Selecciona servicios, especialista y revisa los horarios disponibles.
            </p>
          </div>
          {/* Patient badge */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px',
            background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 99,
          }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: T.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={14} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 9, fontWeight: 800, color: '#3B82F6', letterSpacing: '0.16em', textTransform: 'uppercase' }}>Paciente</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: T.primary }}>
                {patient?.name || `Paciente #${id}`}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── BODY GRID ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24, alignItems: 'start' }}>

        {/* LEFT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* BLOQUE 1: Servicios */}
          <Card style={{ padding: '2rem' }}>
            <div style={sectionHeader}>
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 900, color: T.slate900, margin: 0, letterSpacing: '-0.02em' }}>
                  1. Servicios a realizar
                </h2>
                <EyebrowLabel>Búsqueda rápida o selección múltiple</EyebrowLabel>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '10px 20px', borderRadius: 99, border: 'none',
                  background: T.primary, color: '#fff', fontWeight: 800,
                  fontSize: 13, cursor: 'pointer', boxShadow: '0 4px 16px rgba(37,99,235,0.25)',
                  transition: 'background 0.15s',
                  flexShrink: 0,
                }}
                onMouseEnter={e => e.currentTarget.style.background = T.primaryH}
                onMouseLeave={e => e.currentTarget.style.background = T.primary}
              >
                <Plus size={15} /> Añadir servicio
              </button>
            </div>

            {/* Services list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {selectedServices.length === 0 ? (
                <div style={{
                  padding: '2.5rem 1rem', textAlign: 'center',
                  border: `2px dashed ${T.slate200}`, borderRadius: 16,
                  color: T.slate400,
                }}>
                  <Calendar size={32} style={{ margin: '0 auto 10px', opacity: 0.25 }} />
                  <div style={{ fontSize: 13, fontWeight: 700 }}>Añade los servicios de esta cita</div>
                </div>
              ) : selectedServices.map(sv => (
                <div key={sv.uid} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '16px 18px', background: T.white,
                  border: `1px solid ${T.slate100}`, borderRadius: 16,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                  transition: 'box-shadow 0.15s',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: 12,
                      background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Calendar size={18} color={T.primary} />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: T.slate900 }}>{sv.name}</div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: T.slate400, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                        Cantidad: 1
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 9, fontWeight: 800, color: T.slate400, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                        Precio unitario
                      </div>
                      <div style={{ fontSize: 22, fontWeight: 900, color: T.primary, letterSpacing: '-0.03em' }}>
                        ${sv.price}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveService(sv.uid)}
                      style={{
                        width: 36, height: 36, borderRadius: 10, border: `1px solid ${T.slate100}`,
                        background: T.white, cursor: 'pointer', color: T.slate400,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#FFF1F2'; e.currentTarget.style.color = '#F43F5E'; e.currentTarget.style.borderColor = '#FFE4E6'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = T.white; e.currentTarget.style.color = T.slate400; e.currentTarget.style.borderColor = T.slate100; }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* BLOQUE 2: Especialista */}
          <Card style={{ padding: '2rem' }}>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 17, fontWeight: 900, color: T.slate900, margin: '0 0 2px', letterSpacing: '-0.02em' }}>
                2. Especialista que atenderá
              </h2>
              <EyebrowLabel>Selección del profesional</EyebrowLabel>
            </div>
            <DoctorSelector
              doctors={availableDoctors}
              selected={selectedDoctor}
              onSelect={setSelectedDoctor}
            />
          </Card>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 24 }}>

          {/* Resumen de cita */}
          <Card style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: 16, fontWeight: 900, color: T.slate900, margin: '0 0 4px', letterSpacing: '-0.02em' }}>
              Resumen de cita
            </h3>
            <EyebrowLabel>Confirmación rápida del tratamiento</EyebrowLabel>

            <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {selectedServices.length === 0 ? (
                <div style={{ fontSize: 13, color: T.slate400, fontWeight: 600, padding: '8px 0' }}>
                  Sin servicios seleccionados
                </div>
              ) : selectedServices.map(sv => (
                <div key={sv.uid} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.slate800 }}>{sv.name}</div>
                    <div style={{ fontSize: 10, color: T.slate400, fontWeight: 600 }}>Cantidad: 1</div>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 800, color: T.slate900, flexShrink: 0, marginLeft: 12 }}>
                    ${sv.price}
                  </span>
                </div>
              ))}
            </div>

            {/* Divider */}
            <div style={{ margin: '18px 0', height: 1, background: `repeating-linear-gradient(90deg, ${T.slate200} 0, ${T.slate200} 6px, transparent 6px, transparent 12px)` }} />

            {/* Specialist + totals */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: T.slate400, textTransform: 'uppercase', letterSpacing: '0.14em' }}>Especialista</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: T.slate700 }}>
                  {selectedDoctor?.name || 'No asignado'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: T.slate400, textTransform: 'uppercase', letterSpacing: '0.14em' }}>Subtotal</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: T.slate900 }}>${subtotal}</span>
              </div>
            </div>

            {/* Total box */}
            <div style={{
              marginTop: 18, borderRadius: 18,
              background: T.primary,
              padding: '16px 20px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              boxShadow: '0 8px 24px rgba(37,99,235,0.25)',
            }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.16em' }}>
                Total final
              </span>
              <span style={{ fontSize: 32, fontWeight: 900, color: '#fff', letterSpacing: '-0.04em' }}>
                ${subtotal}
              </span>
            </div>
          </Card>

          {/* Siguiente paso */}
          <Card style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: 14, fontWeight: 900, color: T.slate900, margin: '0 0 8px', letterSpacing: '-0.01em' }}>
              Siguiente paso
            </h3>
            <p style={{ fontSize: 13, color: T.slate500, fontWeight: 500, lineHeight: 1.7, margin: '0 0 20px' }}>
              Al hacer clic en <strong style={{ color: T.slate800 }}>"Ver horarios disponibles"</strong>, el sistema te llevará a{' '}
              <span style={{ color: T.primary, fontWeight: 800 }}>Agenda Atómica</span>{' '}
              con el paciente, servicios y especialista ya precargados.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={handleGoToScheduler}
                disabled={selectedServices.length === 0}
                style={{
                  width: '100%', padding: '14px 0', borderRadius: 14, border: 'none',
                  background: selectedServices.length === 0 ? T.slate200 : T.primary,
                  color: selectedServices.length === 0 ? T.slate400 : '#fff',
                  fontWeight: 800, fontSize: 13, letterSpacing: '0.04em',
                  cursor: selectedServices.length === 0 ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: selectedServices.length > 0 ? '0 6px 20px rgba(37,99,235,0.25)' : 'none',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { if (selectedServices.length > 0) e.currentTarget.style.background = T.primaryH; }}
                onMouseLeave={e => { if (selectedServices.length > 0) e.currentTarget.style.background = T.primary; }}
              >
                Ver horarios disponibles <ArrowRight size={16} />
              </button>
              <button
                onClick={() => navigate(`/pacientes/${id}`)}
                style={{
                  width: '100%', padding: '12px 0', borderRadius: 14, border: `1px solid ${T.slate200}`,
                  background: T.white, color: T.slate500, fontWeight: 700, fontSize: 13,
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = T.slate50; }}
                onMouseLeave={e => { e.currentTarget.style.background = T.white; }}
              >
                Cancelar
              </button>
            </div>
          </Card>
        </div>
      </div>

      {/* ── SERVICE MODAL ── */}
      {isModalOpen && (
        <ServiceModal
          catalog={catalog}
          onClose={() => setIsModalOpen(false)}
          onAdd={handleAddService}
        />
      )}
    </div>
  );
};

export default NewAppointmentFlow;
