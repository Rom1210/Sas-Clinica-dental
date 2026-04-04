import React, { useState, useMemo, useEffect, useRef } from 'react';
import { X, Search, Check } from 'lucide-react';
import { T, EyebrowLabel } from './AppointmentUI';

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
    // Limpiar campos para la siguiente adición en lugar de cerrar el modal
    setPicked(null);
    setQuery('');
    setPrice('');
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
              Añadir servicios
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
              Finalizar
            </button>
            <button
              onClick={handleAdd}
              disabled={!query.trim()}
              style={{
                flex: 2, padding: '13px 0', borderRadius: 999, border: 'none',
                background: T.primary, color: '#fff', fontWeight: 800, fontSize: 12,
                letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer',
                boxShadow: '0 6px 20px rgba(37,99,235,0.28)',
                opacity: !query.trim() ? 0.5 : 1,
              }}
            >
              + Añadir servicios
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceModal;
