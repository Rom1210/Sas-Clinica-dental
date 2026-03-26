import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Save, X, User, Stethoscope, CheckCircle, ChevronDown, UserPlus, Check
} from 'lucide-react';
import { useData } from '../../context/DataContext';

// ── Lista de especialidades (Simplificada) ────────────────────────
const SPECIALTIES = [
  'Odontólogo General',
  'Odontólogo Especialista',
];

// ── SpecialtyAutocomplete Component ───────────────────────────────
const SpecialtyAutocomplete = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value || '');
  const containerRef = useRef(null);

  useEffect(() => { setQuery(value || ''); }, [value]);

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
    if (!query.trim()) return SPECIALTIES;
    const q = query.toLowerCase();
    return SPECIALTIES.filter(s => s.toLowerCase().includes(q));
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
        <Stethoscope size={15} style={{ color: open ? '#3b82f6' : '#94a3b8', flexShrink: 0, transition: 'color 0.15s' }} />
        <input
          type="text"
          placeholder="Seleccione especialidad"
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

      {open && (
        <div
          style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
            background: 'white', border: '1px solid #e2e8f0', borderRadius: '0.75rem',
            boxShadow: '0 8px 24px rgba(0,0,0,0.10)', maxHeight: '220px', overflowY: 'auto', zIndex: 9999,
          }}
        >
          {filtered.length > 0 ? (
            filtered.map((opt) => (
              <div
                key={opt}
                onMouseDown={(e) => { e.preventDefault(); handleSelect(opt); }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.55rem 0.875rem', fontSize: '0.8rem', color: '#334155', cursor: 'pointer',
                  background: value === opt ? '#eff6ff' : 'transparent',
                  transition: 'background 0.1s',
                }}
                onMouseOver={e => e.currentTarget.style.background = value === opt ? '#dbeafe' : '#f8fafc'}
                onMouseOut={e => e.currentTarget.style.background = value === opt ? '#eff6ff' : 'transparent'}
              >
                <span>{opt}</span>
                {value === opt && <Check size={13} style={{ color: '#3b82f6', flexShrink: 0 }} />}
              </div>
            ))
          ) : (
            <div style={{ padding: '0.75rem 0.875rem', fontSize: '0.78rem', color: '#94a3b8', textAlign: 'center' }}>
              No se encontraron resultados.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── DoctorForm ─────────────────────────────────────────────────────
const DoctorForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { doctors, addDoctor, updateDoctor } = useData();
    
    const [formData, setFormData] = useState({
        name: '',
        category: '',
        color: '#3b82f6',
        status: 'active'
    });

    const isEditing = !!id;

    useEffect(() => {
        if (isEditing) {
            const doctor = doctors.find(d => d.id.toString() === id);
            if (doctor) {
                setFormData({
                    name: doctor.name,
                    category: doctor.isSpecialist ? (doctor.specialty || 'Profesional Especialista') : 'Odontólogo General',
                    color: doctor.color || '#3b82f6',
                    status: doctor.status
                });
            }
        }
    }, [id, doctors, isEditing]);

    const handleClose = () => navigate('/settings');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.name) return;

        const isSp = formData.category !== 'Odontólogo General';
        const payload = {
            ...formData,
            isSpecialist: isSp,
            specialty: formData.category,
            id: isEditing ? id : undefined
        };

        if (isEditing) {
            updateDoctor(payload);
        } else {
            addDoctor(payload);
        }
        navigate('/settings');
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '560px', margin: '0 auto' }}
          className="animate-in fade-in duration-400"
        >
            
            {/* ── HEADER CARD ── */}
            <div
                style={{
                    background: 'white', border: '1px solid #e2e8f0', borderRadius: '1.25rem',
                    padding: '1.25rem 1.75rem', display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                }}
            >
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', lineHeight: 1.2, margin: 0 }}>
                        {isEditing ? 'Editar especialista' : 'Nuevo especialista'}
                    </h1>
                    <p style={{ fontSize: '0.65rem', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: '0.25rem' }}>
                        Gestión del equipo médico y especialidades
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
            <div
                style={{
                    background: 'white', border: '1px solid #e2e8f0', borderRadius: '1.25rem',
                    padding: '1.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                }}
            >
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    
                    {/* Nombre Completo */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <label style={{ fontSize: '0.65rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            Nombre Completo
                        </label>
                        <div
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.625rem',
                                background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '0.75rem',
                                padding: '0.625rem 0.875rem', transition: 'all 0.15s ease',
                            }}
                            onFocusCapture={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.12)'; e.currentTarget.style.background = 'white'; }}
                            onBlurCapture={e => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.background = '#f8fafc'; }}
                        >
                            <User size={15} style={{ color: '#94a3b8', flexShrink: 0 }} />
                            <input 
                                type="text" required placeholder="Ej: Dr. / Dra. Juan Pérez" 
                                style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: '0.875rem', color: '#334155' }}
                                value={formData.name} 
                                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                            />
                        </div>
                    </div>

                    {/* Categoría (Autocomplete) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <label style={{ fontSize: '0.65rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            Categoría del Profesional
                        </label>
                        <SpecialtyAutocomplete 
                            value={formData.category}
                            onChange={(val) => setFormData({...formData, category: val})}
                        />
                    </div>

                    {/* Estado Administrativo */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <label style={{ fontSize: '0.65rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            Estado Administrativo
                        </label>
                        <div
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.625rem',
                                background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '0.75rem',
                                padding: '0.625rem 0.875rem', position: 'relative', transition: 'all 0.15s ease',
                            }}
                            onFocusCapture={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.12)'; e.currentTarget.style.background = 'white'; }}
                            onBlurCapture={e => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.background = '#f8fafc'; }}
                        >
                            <CheckCircle size={15} style={{ color: '#94a3b8', flexShrink: 0 }} />
                            <select 
                                style={{
                                    width: '100%', background: 'transparent', border: 'none', outline: 'none',
                                    fontSize: '0.875rem', color: '#334155', cursor: 'pointer', appearance: 'none', paddingRight: '1.5rem'
                                }}
                                value={formData.status} 
                                onChange={(e) => setFormData({...formData, status: e.target.value})}
                            >
                                <option value="active">Estado: Activo</option>
                                <option value="inactive">Estado: Inactivo</option>
                            </select>
                            <ChevronDown size={15} style={{ position: 'absolute', right: '0.875rem', color: '#94a3b8', pointerEvents: 'none' }} />
                        </div>
                    </div>

                    {/* Color Identificador */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <label style={{ fontSize: '0.65rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            Color Identificador para Agenda
                        </label>
                        <div style={{
                            display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.65rem',
                            padding: '0.875rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '1rem',
                        }}>
                            {['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#0f172a'].map(color => (
                                <button
                                    key={color} type="button" onClick={() => setFormData({...formData, color})}
                                    style={{
                                        width: '2.1rem', height: '2.1rem', borderRadius: '0.65rem',
                                        backgroundColor: color, 
                                        border: formData.color === color ? '2px solid white' : 'none',
                                        boxShadow: formData.color === color ? `0 0 0 2px ${color}` : 'none',
                                        cursor: 'pointer', transition: 'all 0.2s',
                                        transform: formData.color === color ? 'scale(1.1)' : 'scale(1)'
                                    }}
                                />
                            ))}
                            <div style={{ width: '1px', height: '1.5rem', background: '#e2e8f0', margin: '0 0.25rem' }}></div>
                            <div style={{ 
                              display: 'flex', alignItems: 'center', gap: '0.4rem', 
                              padding: '0.3rem 0.6rem', background: 'white', borderRadius: '0.6rem', border: '1px solid #e2e8f0'
                            }}>
                                <span style={{ fontSize: '0.6rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Libre</span>
                                <div style={{ width: '1.25rem', height: '1.25rem', borderRadius: '4px', overflow: 'hidden' }}>
                                    <input 
                                        type="color" 
                                        style={{ width: '200%', height: '200%', transform: 'translate(-25%, -25%)', border: 'none', padding: 0, cursor: 'pointer', background: 'transparent' }}
                                        value={formData.color}
                                        onChange={(e) => setFormData({...formData, color: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Botones */}
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
                            <UserPlus size={14} />
                            {isEditing ? 'Guardar cambios' : 'Registrar especialista'}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default DoctorForm;
