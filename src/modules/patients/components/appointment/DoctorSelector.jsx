import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Stethoscope, ChevronDown, Search, Check } from 'lucide-react';
import { T } from './AppointmentUI';

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
                  background: selected?.id === doc.id ? `${doc.color || T.primary}10` : 'transparent',
                  marginBottom: 2,
                }}
                onMouseEnter={e => { if (selected?.id !== doc.id) e.currentTarget.style.background = T.slate50; }}
                onMouseLeave={e => { e.currentTarget.style.background = selected?.id === doc.id ? `${doc.color || T.primary}10` : 'transparent'; }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: doc.color || T.slate100,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 900, fontSize: 13,
                  color: '#fff',
                  border: `2px solid #fff`,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                }}>
                  {doc.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: selected?.id === doc.id ? (doc.color || T.primary) : T.slate800 }}>
                    {doc.name}
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: T.slate400, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    {doc.isSpecialist ? 'Especialista' : 'Odontólogo General'}
                  </div>
                </div>
                {selected?.id === doc.id && <Check size={16} style={{ color: doc.color || T.primary }} />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorSelector;
