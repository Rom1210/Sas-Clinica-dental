import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, X, ClipboardList, DollarSign, ChevronDown, Check } from 'lucide-react';
import { useData } from '../../context/DataContext';

// ── Lista completa de servicios odontológicos ──────────────────────
const SERVICE_OPTIONS = [
  'Consulta odontológica',
  'Evaluación dental',
  'Limpieza dental (profilaxis)',
  'Destartraje (limpieza profunda)',
  'Aplicación de flúor',
  'Sellantes dentales',
  'Resina dental',
  'Obturación dental',
  'Reconstrucción dental',
  'Incrustaciones dentales',
  'Endodoncia (tratamiento de conducto)',
  'Retratamiento de conducto',
  'Extracción dental simple',
  'Extracción de muela',
  'Extracción de muela del juicio',
  'Cirugía de cordales',
  'Cirugía oral menor',
  'Tratamiento periodontal',
  'Curetaje dental',
  'Raspado y alisado radicular',
  'Prótesis dental removible',
  'Prótesis fija',
  'Coronas dentales',
  'Puentes dentales',
  'Blanqueamiento dental',
  'Diseño de sonrisa',
  'Carillas dentales',
  'Estética dental',
  'Ortodoncia',
  'Ortodoncia metálica',
  'Ortodoncia estética',
  'Ortodoncia invisible',
  'Retenedores',
  'Implante dental',
  'Rehabilitación sobre implantes',
  'Radiografía dental',
  'Radiografía panorámica',
  'Radiografía periapical',
  'Consulta odontopediátrica',
  'Tratamiento infantil',
  'Control infantil',
  'Urgencia odontológica',
  'Control post tratamiento',
  'Revisión dental',
];

// ── ServiceAutocomplete component ──────────────────────────────────
const ServiceAutocomplete = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value || '');
  const containerRef = useRef(null);

  // Sync internal query when value changes externally
  useEffect(() => { setQuery(value || ''); }, [value]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return SERVICE_OPTIONS;
    const q = query.toLowerCase();
    return SERVICE_OPTIONS.filter(s => s.toLowerCase().includes(q));
  }, [query]);

  const handleSelect = (option) => {
    setQuery(option);
    onChange(option);
    setOpen(false);
  };

  const handleInputChange = (e) => {
    setQuery(e.target.value);
    onChange(e.target.value);
    setOpen(true);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {/* Input row */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: '0.625rem',
          background: open ? 'white' : '#f8fafc',
          border: `1px solid ${open ? '#3b82f6' : '#cbd5e1'}`,
          borderRadius: '0.75rem',
          padding: '0.625rem 0.875rem',
          boxShadow: open ? '0 0 0 3px rgba(59,130,246,0.12)' : 'none',
          transition: 'all 0.15s ease',
          cursor: 'text',
        }}
        onClick={() => setOpen(true)}
      >
        <ClipboardList size={15} style={{ color: open ? '#3b82f6' : '#94a3b8', flexShrink: 0, transition: 'color 0.15s' }} />
        <input
          type="text"
          placeholder="Ej: Limpieza, Resina, Extracción..."
          style={{
            flex: 1, background: 'transparent',
            border: 'none', outline: 'none',
            fontSize: '0.875rem', color: '#334155',
          }}
          value={query}
          onChange={handleInputChange}
          onFocus={() => setOpen(true)}
        />
        <ChevronDown
          size={15}
          style={{
            color: '#94a3b8', flexShrink: 0,
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
          }}
        />
      </div>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '0.75rem',
            boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
            maxHeight: '220px', overflowY: 'auto',
            zIndex: 9999,
          }}
        >
          {filtered.length > 0 ? (
            filtered.map((option) => (
              <div
                key={option}
                onMouseDown={(e) => { e.preventDefault(); handleSelect(option); }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.55rem 0.875rem',
                  fontSize: '0.8rem', color: '#334155',
                  cursor: 'pointer',
                  background: value === option ? '#eff6ff' : 'transparent',
                  transition: 'background 0.1s',
                }}
                onMouseOver={e => e.currentTarget.style.background = value === option ? '#dbeafe' : '#f8fafc'}
                onMouseOut={e => e.currentTarget.style.background = value === option ? '#eff6ff' : 'transparent'}
              >
                <span>{option}</span>
                {value === option && <Check size={13} style={{ color: '#3b82f6', flexShrink: 0 }} />}
              </div>
            ))
          ) : (
            <div style={{ padding: '0.75rem 0.875rem', fontSize: '0.78rem', color: '#94a3b8', textAlign: 'center' }}>
              No se encontraron servicios
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── ServiceForm ────────────────────────────────────────────────────
const ServiceForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { services, addService, updateService } = useData();

  const [formData, setFormData] = useState({ name: '', price: '' });
  const isEditing = !!id;

  useEffect(() => {
    if (isEditing) {
      const service = services.find(s => s.id.toString() === id);
      if (service) {
        setFormData({ name: service.name, price: service.price.toString() });
      }
    }
  }, [id, services, isEditing]);

  const handleClose = () => navigate('/settings');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price) return;
    const payload = { name: formData.name.trim(), price: parseFloat(formData.price), cat: 'General' };
    if (isEditing) {
      updateService({ ...payload, id: parseInt(id) });
    } else {
      addService(payload);
    }
    navigate('/settings');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '560px', margin: '0 auto' }}
      className="animate-in fade-in duration-400"
    >
      {/* ── HEADER CARD ── */}
      <div style={{
        background: 'white', border: '1px solid #e2e8f0', borderRadius: '1.25rem',
        padding: '1.25rem 1.75rem', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', margin: 0, lineHeight: 1.2 }}>
            {isEditing ? 'Editar servicio' : 'Nuevo servicio'}
          </h1>
          <p style={{ fontSize: '0.65rem', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: '0.25rem' }}>
            Definir parámetros del catálogo
          </p>
        </div>
        <button
          onClick={handleClose}
          style={{
            width: '2rem', height: '2rem', borderRadius: '50%',
            background: '#f1f5f9', border: '1px solid #e2e8f0',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#94a3b8', cursor: 'pointer',
          }}
          onMouseOver={e => e.currentTarget.style.background = '#e2e8f0'}
          onMouseOut={e => e.currentTarget.style.background = '#f1f5f9'}
        >
          <X size={14} />
        </button>
      </div>

      {/* ── FORM CARD ── */}
      <div style={{
        background: 'white', border: '1px solid #e2e8f0', borderRadius: '1.25rem',
        padding: '1.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Nombre — autocomplete */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.65rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Nombre del servicio
            </label>
            <ServiceAutocomplete
              value={formData.name}
              onChange={(val) => setFormData(f => ({ ...f, name: val }))}
            />
          </div>

          {/* Precio */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.65rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Precio por unidad (USD)
            </label>
            <div
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                background: '#f8fafc', border: '1px solid #cbd5e1',
                borderRadius: '0.75rem', padding: '0.625rem 0.875rem',
                maxWidth: '220px', transition: 'all 0.15s',
              }}
              onFocusCapture={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.12)'; e.currentTarget.style.background = 'white'; }}
              onBlurCapture={e => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.background = '#f8fafc'; }}
            >
              <DollarSign size={14} style={{ color: '#94a3b8', flexShrink: 0 }} />
              <input
                type="number" step="0.01" required placeholder="0.00"
                style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: '0.875rem', fontWeight: 600, color: '#1e293b' }}
                value={formData.price}
                onChange={(e) => setFormData(f => ({ ...f, price: e.target.value }))}
              />
            </div>
            <p style={{ fontSize: '0.6rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginTop: '0.1rem' }}>
              Este valor alimenta el cálculo de costos en la agenda
            </p>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.625rem', paddingTop: '0.5rem' }}>
            <button
              type="button" onClick={handleClose}
              style={{
                padding: '0.5rem 1.25rem', background: '#f1f5f9',
                border: '1px solid #e2e8f0', borderRadius: '9999px',
                fontSize: '0.8rem', fontWeight: 600, color: '#475569', cursor: 'pointer',
              }}
              onMouseOver={e => e.currentTarget.style.background = '#e2e8f0'}
              onMouseOut={e => e.currentTarget.style.background = '#f1f5f9'}
            >
              Cancelar
            </button>
            <button
              type="submit"
              style={{
                display: 'flex', alignItems: 'center', gap: '0.375rem',
                padding: '0.5rem 1.25rem', background: '#2563eb',
                border: 'none', borderRadius: '9999px',
                fontSize: '0.75rem', fontWeight: 700, color: 'white',
                textTransform: 'uppercase', letterSpacing: '0.05em',
                cursor: 'pointer', boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
              }}
              onMouseOver={e => e.currentTarget.style.background = '#1d4ed8'}
              onMouseOut={e => e.currentTarget.style.background = '#2563eb'}
            >
              <Save size={14} />
              {isEditing ? 'Guardar cambios' : 'Crear servicio'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default ServiceForm;
