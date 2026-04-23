import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, CheckCircle2, Clock, AlertCircle, Calendar,
  DollarSign, Stethoscope, ChevronRight, RotateCcw
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useNavigate } from 'react-router-dom';

const ITEM_STATUS = {
  pending:     { label: 'Pendiente',   icon: AlertCircle,   color: '#D97706', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)' },
  in_progress: { label: 'En proceso',  icon: Clock,         color: '#2563EB', bg: 'rgba(37,99,235,0.08)', border: 'rgba(37,99,235,0.2)'   },
  completed:   { label: 'Completado',  icon: CheckCircle2,  color: '#059669', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)' },
};

const PLAN_STATUS_OPTIONS = ['pending', 'in_progress', 'completed'];

const StatusCycleButton = ({ status, onChange }) => {
  const cfg = ITEM_STATUS[status] || ITEM_STATUS.pending;
  const Icon = cfg.icon;
  const nextStatus = PLAN_STATUS_OPTIONS[(PLAN_STATUS_OPTIONS.indexOf(status) + 1) % PLAN_STATUS_OPTIONS.length];

  return (
    <button
      onClick={() => onChange(nextStatus)}
      title={`Cambiar a: ${ITEM_STATUS[nextStatus].label}`}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.35rem',
        padding: '0.3rem 0.75rem', borderRadius: '999px',
        background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
        fontSize: '0.68rem', fontWeight: 800,
        letterSpacing: '0.04em', whiteSpace: 'nowrap',
        cursor: 'pointer', transition: 'all 0.2s',
      }}
    >
      <Icon size={12} />
      {cfg.label}
    </button>
  );
};

const PlanDetailModal = ({ plan, patient, isOpen, onClose }) => {
  const { updateTreatmentItemStatus, appointments } = useData();
  const navigate = useNavigate();
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const [itemStatuses, setItemStatuses] = useState(() => {
    const initial = {};
    plan?.items?.forEach(item => {
      initial[item.id] = item.status || 'pending';
    });
    return initial;
  });

  if (!plan) return null;

  const items = plan.items || [];

  // 1. Calculate Dynamic Status based on Agenda
  const getDynamicStatus = (item) => {
    if (itemStatuses[item.id] === 'completed') return 'completed';
    
    // Check if there's an appointment for this service
    const serviceName = item.service?.name || item.name;
    const hasScheduledApp = appointments?.some(app => {
      const isSamePatient = app.patient_id === patient?.id;
      const isScheduled = app.status === 'scheduled';
      const mentionsService = app.notes?.toLowerCase().includes(serviceName?.toLowerCase());
      return isSamePatient && isScheduled && mentionsService;
    });

    if (hasScheduledApp) return 'in_progress';
    return itemStatuses[item.id] || 'pending';
  };

  const completedCount = Object.values(itemStatuses).filter(s => s === 'completed').length;
  const progress = items.length === 0 ? 0 : Math.round((completedCount / items.length) * 100);

  const toggleItemSelection = (itemId) => {
    setSelectedItemIds(prev => 
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

  const handleItemStatusChange = async (itemId, newStatus) => {
    setItemStatuses(prev => ({ ...prev, [itemId]: newStatus }));
    if (updateTreatmentItemStatus) {
      try { await updateTreatmentItemStatus(itemId, newStatus); }
      catch (err) { console.error('Error updating item status:', err); }
    }
  };

  const handleScheduleAppointment = () => {
    if (selectedItemIds.length === 0) {
      // If none selected, we can either select all or alert.
      // The user wants to select blocks/items, so let's just proceed with empty if that's the case,
      // but ideally we should map the selected items.
    }

    const selectedItemsData = items
      .filter(item => selectedItemIds.includes(item.id))
      .map(item => ({
        id: item.service_id || item.id,
        name: item.service?.name || item.name || 'Procedimiento',
        price: item.unit_price || item.price || 0,
        treatment_item_id: item.id // To link back later
      }));

    onClose();
    navigate(`/pacientes/${patient?.id}/nueva-cita`, {
      state: {
        preloadedServices: selectedItemsData,
        sourcePlanId: plan.id
      }
    });
  };

  const barColor = progress === 100
    ? 'linear-gradient(90deg, #10B981, #34D399)'
    : progress > 50
    ? 'linear-gradient(90deg, #2563EB, #60A5FA)'
    : 'linear-gradient(90deg, #F59E0B, #FCD34D)';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0, zIndex: 9800,
              background: 'rgba(15,23,42,0.5)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
            }}
          />

          {/* Side panel */}
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'fixed', top: 0, right: 0, bottom: 0,
              width: '480px', maxWidth: '95vw',
              background: '#ffffff',
              zIndex: 9801,
              display: 'flex', flexDirection: 'column',
              boxShadow: '-24px 0 80px rgba(0,0,0,0.12)',
              borderRadius: '2rem 0 0 2rem',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{
              padding: '1.75rem 2rem 1.25rem',
              borderBottom: '1px solid #EEF2F7',
              display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
              gap: '1rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', minWidth: 0 }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '14px', flexShrink: 0,
                  background: 'rgba(37,99,235,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB',
                }}>
                  <Stethoscope size={20} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <h2 style={{ fontSize: '1rem', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em', margin: 0 }}>
                    {plan.name}
                  </h2>
                  <p style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600, marginTop: '0.25rem' }}>
                    {items.length} procedimiento{items.length !== 1 ? 's' : ''} · {patient?.name}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                style={{
                  width: '36px', height: '36px', borderRadius: '12px', flexShrink: 0,
                  background: '#F8FAFC', border: '1px solid #EEF2F7',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#94A3B8', cursor: 'pointer', transition: 'all 0.2s',
                }}
                onMouseOver={e => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.color = '#EF4444'; }}
                onMouseOut={e =>  { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = '#94A3B8'; }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Progress strip */}
            <div style={{ padding: '1.25rem 2rem', borderBottom: '1px solid #EEF2F7' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Progreso del plan
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: 900, color: progress === 100 ? '#059669' : '#2563EB' }}>
                  {completedCount}/{items.length} completados · {progress}%
                </span>
              </div>
              <div style={{ height: '8px', background: '#F1F5F9', borderRadius: '999px', overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  style={{ height: '100%', background: barColor, borderRadius: '999px' }}
                />
              </div>

              {/* Summary KPIs */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginTop: '1rem' }}>
                {[
                  { label: 'Pendientes',  value: Object.values(itemStatuses).filter(s => s === 'pending').length,     color: '#D97706', bg: 'rgba(245,158,11,0.08)' },
                  { label: 'En proceso',  value: Object.values(itemStatuses).filter(s => s === 'in_progress').length, color: '#2563EB', bg: 'rgba(37,99,235,0.08)'  },
                  { label: 'Completados', value: completedCount,                                                       color: '#059669', bg: 'rgba(16,185,129,0.08)' },
                ].map(k => (
                  <div key={k.label} style={{ padding: '0.75rem', borderRadius: '1rem', background: k.bg, textAlign: 'center' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: k.color }}>{k.value}</div>
                    <div style={{ fontSize: '0.62rem', fontWeight: 700, color: k.color, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '0.1rem' }}>{k.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Items list */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <p style={{ fontSize: '0.68rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>
                Procedimientos incluidos
              </p>
              {items.length === 0 && (
                <p style={{ color: '#CBD5E1', fontSize: '0.875rem', fontWeight: 600, textAlign: 'center', padding: '2rem 0' }}>
                  No hay procedimientos registrados.
                </p>
              )}
              <AnimatePresence>
                {items.map((item, idx) => {
                  const currentStatus = getDynamicStatus(item);
                  const cfg = ITEM_STATUS[currentStatus];
                  const itemName = item.service?.name || item.name || 'Procedimiento';
                  const subtotal = (item.quantity || 1) * (item.unit_price || item.price || 0);
                  const isSelected = selectedItemIds.includes(item.id);

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      onClick={() => currentStatus !== 'completed' && toggleItemSelection(item.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.875rem',
                        padding: '1rem 1.1rem',
                        background: isSelected ? 'rgba(37,99,235,0.04)' : (currentStatus === 'completed' ? 'rgba(16,185,129,0.04)' : '#F8FAFC'),
                        border: `1.5px solid ${isSelected ? '#2563EB' : (currentStatus === 'completed' ? 'rgba(16,185,129,0.2)' : '#EEF2F7')}`,
                        borderRadius: '1.25rem',
                        transition: 'all 0.3s',
                        cursor: currentStatus === 'completed' ? 'default' : 'pointer',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                    >
                      {/* Selection indicator */}
                      {isSelected && (
                        <div style={{
                          position: 'absolute', top: 0, left: 0, width: '4px', height: '100%',
                          background: '#2563EB'
                        }} />
                      )}

                      {/* Number/Check */}
                      <div style={{
                        width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                        background: isSelected ? '#2563EB' : cfg.bg, color: isSelected ? '#fff' : cfg.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.7rem', fontWeight: 900,
                        textDecoration: currentStatus === 'completed' ? 'line-through' : 'none',
                        transition: 'all 0.2s'
                      }}>
                        {isSelected ? <CheckCircle2 size={16} strokeWidth={3} /> : idx + 1}
                      </div>

                      {/* Name + qty */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          fontSize: '0.8125rem', fontWeight: 800, color: currentStatus === 'completed' ? '#94A3B8' : '#0F172A',
                          textDecoration: currentStatus === 'completed' ? 'line-through' : 'none',
                          margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {itemName}
                        </p>
                        <p style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 600, margin: '0.1rem 0 0' }}>
                          {item.quantity || 1} × ${(item.unit_price || item.price || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                      </div>

                      {/* Subtotal */}
                      <span style={{ fontSize: '0.875rem', fontWeight: 900, color: '#0F172A', whiteSpace: 'nowrap', marginRight: '0.5rem' }}>
                        ${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>

                      {/* Status label (no longer button if dynamic) */}
                      <div
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.35rem',
                          padding: '0.3rem 0.75rem', borderRadius: '999px',
                          background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
                          fontSize: '0.62rem', fontWeight: 900,
                          textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap',
                        }}
                      >
                        <cfg.icon size={10} strokeWidth={3} />
                        {cfg.label}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div style={{
              padding: '1.25rem 2rem',
              borderTop: '1px solid #EEF2F7',
              display: 'flex', flexDirection: 'column', gap: '0.75rem',
            }}>
              {/* Total */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>Total del plan</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em' }}>
                  ${(plan.total_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} <span style={{ fontSize: '0.65rem', color: '#94A3B8', fontWeight: 800 }}>USD</span>
                </span>
              </div>

              {/* Actions */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}>
                <button
                  onClick={onClose}
                  style={{
                    padding: '0.75rem', borderRadius: '1rem', border: '1.5px solid #EEF2F7',
                    background: '#F8FAFC', color: '#64748B', cursor: 'pointer',
                    fontSize: '0.72rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em',
                    transition: 'all 0.2s',
                  }}
                  onMouseOver={e => e.currentTarget.style.background = '#F1F5F9'}
                  onMouseOut={e =>  e.currentTarget.style.background = '#F8FAFC'}
                >
                  Cerrar
                </button>
                <button
                  onClick={handleScheduleAppointment}
                  style={{
                    padding: '0.75rem', borderRadius: '1rem', border: 'none',
                    background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                    color: '#fff', cursor: 'pointer',
                    fontSize: '0.72rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em',
                    boxShadow: '0 4px 14px rgba(37,99,235,0.3)', transition: 'all 0.2s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                  }}
                  onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(37,99,235,0.4)'; }}
                  onMouseOut={e =>  { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(37,99,235,0.3)'; }}
                >
                  <Calendar size={14} strokeWidth={2.5} /> {selectedItemIds.length > 0 ? `Agendar (${selectedItemIds.length})` : 'Agendar Cita'}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default PlanDetailModal;
