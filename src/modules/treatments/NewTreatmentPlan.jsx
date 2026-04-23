import React, { useState, useEffect, useRef } from 'react';
import {
  Plus, Trash2, DollarSign, ListChecks, Search,
  ChevronRight, X, ArrowLeft, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '../../context/DataContext';
import ConfirmModal from '../../components/common/ConfirmModal';

const NewTreatmentPlan = ({ onCancel, onSave, initialData = null }) => {
  const { services } = useData();
  const [planName, setPlanName] = useState('');
  const [treatmentName, setTreatmentName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState('');
  const [currentServiceId, setCurrentServiceId] = useState(null);
  const [items, setItems] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [pendingRemoveId, setPendingRemoveId] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (initialData) {
      setPlanName(initialData.name || '');
      setItems(initialData.items || []);
    }
  }, [initialData]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setShowSuggestions(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddItem = () => {
    if (!treatmentName || !unitPrice) return;
    setItems([...items, {
      id: Date.now(),
      name: treatmentName,
      service_id: currentServiceId,
      quantity: parseInt(quantity) || 1,
      price: parseFloat(unitPrice) || 0,
    }]);
    setTreatmentName('');
    setQuantity(1);
    setUnitPrice('');
    setCurrentServiceId(null);
    setShowSuggestions(false);
  };

  const handleRemoveItem = (id) => setPendingRemoveId(id);
  const confirmRemoveItem = () => {
    setItems(items.filter(i => i.id !== pendingRemoveId));
    setPendingRemoveId(null);
  };

  const totalAmount = items.reduce((sum, i) => sum + i.quantity * i.price, 0);

  const handleCreatePlan = () => {
    if (items.length === 0) { alert('Agrega al menos un tratamiento a la lista.'); return; }
    const finalName = planName.trim() || 'Plan de Tratamiento General';
    onSave({
      id: initialData ? initialData.id : Date.now(),
      name: finalName,
      items,
      total: totalAmount,
      date: initialData?.date ?? new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }),
      notes: `Resumen de ${items.length} tratamientos.`,
    });
  };

  const filteredServices = services
    .filter(s => s.name.toLowerCase().includes(treatmentName.toLowerCase()))
    .slice(0, 6);

  const handleSelectService = (s) => {
    setTreatmentName(s.name);
    setUnitPrice(s.price);
    setCurrentServiceId(s.id);
    setShowSuggestions(false);
  };

  const isEditing = !!initialData;
  const canSave = items.length > 0;

  /* ── Shared input style ── */
  const inputStyle = {
    width: '100%',
    background: '#F8FAFC',
    border: '1.5px solid #EEF2F7',
    borderRadius: '1rem',
    padding: '0.75rem 1rem',
    fontSize: '0.875rem',
    fontWeight: 700,
    color: '#0F172A',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  };

  const inputFocusHandlers = {
    onFocus: (e) => { e.currentTarget.style.borderColor = 'rgba(37,99,235,0.4)'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(37,99,235,0.06)'; },
    onBlur:  (e) => { e.currentTarget.style.borderColor = '#EEF2F7'; e.currentTarget.style.boxShadow = 'none'; },
  };

  return (
    <>
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', paddingBottom: '3rem' }}
    >

      {/* ── Top bar ─────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '1.1rem 1.5rem',
        background: '#ffffff',
        border: '1px solid #EEF2F7',
        borderRadius: '1.5rem',
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '14px',
            background: 'rgba(37,99,235,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#2563EB',
          }}>
            <ListChecks size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '0.9375rem', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em' }}>
              {isEditing ? 'Editar Plan de Tratamiento' : 'Nuevo Plan de Tratamiento'}
            </h2>
            <p style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, marginTop: '0.1rem' }}>
              Configuración de procedimientos y costos
            </p>
          </div>
        </div>

        <button
          onClick={onCancel}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.55rem 1.1rem',
            background: '#F8FAFC', border: '1.5px solid #EEF2F7',
            borderRadius: '999px', cursor: 'pointer',
            fontSize: '0.72rem', fontWeight: 800,
            color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em',
            transition: 'all 0.2s',
          }}
          onMouseOver={e => { e.currentTarget.style.borderColor = '#FECACA'; e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.background = '#FEF2F2'; }}
          onMouseOut={e =>  { e.currentTarget.style.borderColor = '#EEF2F7'; e.currentTarget.style.color = '#64748B'; e.currentTarget.style.background = '#F8FAFC'; }}
        >
          <X size={14} /> Cancelar
        </button>
      </div>

      {/* ── Body — split layout ──────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 300px',
        gap: '1.25rem',
        alignItems: 'start',
      }}>

        {/* ══ LEFT column ══════════════════════════════════ */}
        <div style={{
          background: '#ffffff',
          border: '1px solid #EEF2F7',
          borderRadius: '1.75rem',
          padding: '2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.75rem',
          boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
        }}>

          {/* Plan name */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.68rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Nombre del plan
            </label>
            <input
              type="text"
              placeholder="Ej: Rehabilitación estética completa..."
              style={{ ...inputStyle, fontSize: '0.9375rem', padding: '0.875rem 1.1rem' }}
              value={planName}
              onChange={e => setPlanName(e.target.value)}
              {...inputFocusHandlers}
            />
          </div>

          {/* Divider */}
          <div style={{ borderTop: '1px solid #F1F5F9' }} />

          {/* Add-item row */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <label style={{ fontSize: '0.68rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Agregar procedimiento
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 110px 44px', gap: '0.6rem', alignItems: 'center' }}>

              {/* Service search */}
              <div style={{ position: 'relative' }} ref={dropdownRef}>
                <div style={{ position: 'relative' }}>
                  <Search size={15} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#CBD5E1', pointerEvents: 'none' }} />
                  <input
                    type="text"
                    placeholder="Procedimiento o servicio..."
                    style={{ ...inputStyle, paddingLeft: '2.25rem' }}
                    value={treatmentName}
                    onChange={e => { setTreatmentName(e.target.value); setShowSuggestions(true); }}
                    onFocus={e => { setShowSuggestions(true); inputFocusHandlers.onFocus(e); }}
                    onBlur={inputFocusHandlers.onBlur}
                  />
                </div>

                {/* Autocomplete dropdown */}
                <AnimatePresence>
                  {showSuggestions && filteredServices.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.98 }}
                      transition={{ duration: 0.18 }}
                      style={{
                        position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
                        background: '#ffffff', border: '1.5px solid #EEF2F7',
                        borderRadius: '1.25rem', boxShadow: '0 16px 40px rgba(0,0,0,0.1)',
                        zIndex: 200, overflow: 'hidden',
                      }}
                    >
                      <div style={{ padding: '0.6rem 1rem 0.4rem', borderBottom: '1px solid #F1F5F9' }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#CBD5E1', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                          Catálogo de servicios
                        </span>
                      </div>
                      {filteredServices.map(s => (
                        <button
                          key={s.id}
                          onClick={() => handleSelectService(s)}
                          style={{
                            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '0.75rem 1rem', background: 'transparent',
                            border: 'none', cursor: 'pointer', transition: 'background 0.15s', textAlign: 'left',
                          }}
                          onMouseOver={e => e.currentTarget.style.background = '#F8FAFC'}
                          onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#1E293B' }}>{s.name}</span>
                          <span style={{
                            fontSize: '0.75rem', fontWeight: 900, color: '#059669',
                            background: '#ECFDF5', padding: '0.2rem 0.6rem', borderRadius: '999px',
                            border: '1px solid #A7F3D0',
                          }}>
                            ${s.price}
                          </span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Quantity */}
              <input
                type="number"
                placeholder="Cant."
                min={1}
                style={{ ...inputStyle, textAlign: 'center' }}
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                {...inputFocusHandlers}
              />

              {/* Price */}
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#CBD5E1', fontWeight: 800, fontSize: '0.875rem', pointerEvents: 'none' }}>$</span>
                <input
                  type="number"
                  placeholder="0.00"
                  style={{ ...inputStyle, paddingLeft: '1.75rem' }}
                  value={unitPrice}
                  onChange={e => setUnitPrice(e.target.value)}
                  {...inputFocusHandlers}
                />
              </div>

              {/* Add button */}
              <button
                onClick={handleAddItem}
                style={{
                  width: '44px', height: '44px', borderRadius: '14px', flexShrink: 0,
                  background: treatmentName && unitPrice ? '#2563EB' : '#EEF2F7',
                  color: treatmentName && unitPrice ? '#ffffff' : '#CBD5E1',
                  border: 'none', cursor: treatmentName && unitPrice ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s', boxShadow: treatmentName && unitPrice ? '0 4px 12px rgba(37,99,235,0.25)' : 'none',
                }}
                onMouseOver={e => { if (treatmentName && unitPrice) e.currentTarget.style.transform = 'scale(1.08)'; }}
                onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                <Plus size={20} strokeWidth={3} />
              </button>
            </div>
          </div>

          {/* Items list */}
          {items.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '1.25rem' }}>
                <label style={{ fontSize: '0.68rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Procedimientos en el plan ({items.length})
                </label>
              </div>
              <AnimatePresence>
                {items.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8, scale: 0.96 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '0.875rem 1rem',
                      background: '#F8FAFC', border: '1.5px solid #EEF2F7',
                      borderRadius: '1.25rem', gap: '0.75rem',
                    }}
                  >
                    {/* Index bubble */}
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                      background: 'rgba(37,99,235,0.1)', color: '#2563EB',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.7rem', fontWeight: 900,
                    }}>
                      {idx + 1}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.name}
                      </p>
                      <p style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 600, marginTop: '0.1rem' }}>
                        {item.quantity} × ${item.price.toLocaleString()}
                      </p>
                    </div>

                    <span style={{ fontSize: '0.9375rem', fontWeight: 900, color: '#0F172A', whiteSpace: 'nowrap' }}>
                      ${(item.quantity * item.price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>

                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      style={{
                        width: '30px', height: '30px', borderRadius: '10px', flexShrink: 0,
                        background: 'transparent', border: '1.5px solid #EEF2F7',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#CBD5E1', cursor: 'pointer', transition: 'all 0.2s',
                      }}
                      onMouseOver={e => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.borderColor = '#FECACA'; }}
                      onMouseOut={e =>  { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#CBD5E1'; e.currentTarget.style.borderColor = '#EEF2F7'; }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* ══ RIGHT column ═════════════════════════════════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'sticky', top: '1rem' }}>

          {/* Summary card */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #EEF2F7',
            borderRadius: '1.75rem',
            padding: '1.5rem',
            boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
            display: 'flex', flexDirection: 'column', gap: '1.25rem',
          }}>
            <p style={{ fontSize: '0.68rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Resumen del plan
            </p>

            {/* KPI row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {[
                { label: 'Procedimientos', value: items.length, icon: <ListChecks size={16} />, color: '#2563EB', bg: 'rgba(37,99,235,0.08)' },
                { label: 'Subtotal', value: `$${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, icon: <DollarSign size={16} />, color: '#059669', bg: 'rgba(16,185,129,0.08)' },
              ].map(k => (
                <div key={k.label} style={{
                  padding: '1rem', borderRadius: '1.25rem',
                  background: '#F8FAFC', border: '1.5px solid #EEF2F7',
                  display: 'flex', flexDirection: 'column', gap: '0.5rem',
                }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: k.bg, color: k.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {k.icon}
                  </div>
                  <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em' }}>{k.value}</span>
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{k.label}</span>
                </div>
              ))}
            </div>

            {/* Total */}
            <div style={{
              padding: '1.25rem', borderRadius: '1.25rem',
              background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem',
            }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                Total estimado
              </span>
              <span style={{ fontSize: '1.875rem', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
                ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
              <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                USD
              </span>
            </div>
          </div>

          {/* Save button */}
          <button
            onClick={handleCreatePlan}
            disabled={!canSave}
            style={{
              width: '100%', padding: '0.9rem',
              borderRadius: '1.25rem', border: 'none', cursor: canSave ? 'pointer' : 'not-allowed',
              background: canSave ? 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)' : '#F1F5F9',
              color: canSave ? '#ffffff' : '#CBD5E1',
              fontSize: '0.75rem', fontWeight: 900,
              textTransform: 'uppercase', letterSpacing: '0.12em',
              boxShadow: canSave ? '0 6px 18px rgba(37,99,235,0.3)' : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              transition: 'all 0.2s',
            }}
            onMouseOver={e => { if (canSave) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 24px rgba(37,99,235,0.4)'; } }}
            onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = canSave ? '0 6px 18px rgba(37,99,235,0.3)' : 'none'; }}
          >
            <CheckCircle2 size={16} strokeWidth={2.5} />
            {isEditing ? 'Guardar cambios' : 'Crear plan'}
          </button>

          {!canSave && (
            <p style={{ textAlign: 'center', fontSize: '0.7rem', color: '#CBD5E1', fontWeight: 600 }}>
              Agrega al menos un procedimiento para continuar.
            </p>
          )}
        </div>
      </div>
    </motion.div>

      <ConfirmModal
        isOpen={!!pendingRemoveId}
        onCancel={() => setPendingRemoveId(null)}
        onConfirm={confirmRemoveItem}
        title="¿Eliminar procedimiento?"
        message="Se quitará este procedimiento del plan. Puedes volver a agregarlo si cambias de opinión."
        confirmLabel="Sí, quitar"
      />
    </>
  );
};

export default NewTreatmentPlan;
