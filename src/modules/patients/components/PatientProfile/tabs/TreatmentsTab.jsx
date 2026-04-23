import React, { useState } from 'react';
import { 
  Plus,
  ChevronRight,
  Trash2,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  Stethoscope
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmModal from '../../../../../components/common/ConfirmModal';
import PlanDetailModal from '../../../../../components/treatments/PlanDetailModal';
import { useData } from '../../../../../context/DataContext';
import NewTreatmentPlan from '../../../../treatments/NewTreatmentPlan';

// Status badge config
const STATUS_CONFIG = {
  completed: {
    label: 'Completado',
    icon: <CheckCircle2 size={13} />,
    bg: 'rgba(16,185,129,0.1)',
    color: '#059669',
    border: 'rgba(16,185,129,0.2)',
    bar: 'linear-gradient(90deg, #10B981, #34D399)',
  },
  in_progress: {
    label: 'En proceso',
    icon: <Clock size={13} />,
    bg: 'rgba(37,99,235,0.08)',
    color: '#2563EB',
    border: 'rgba(37,99,235,0.15)',
    bar: 'linear-gradient(90deg, #2563EB, #60A5FA)',
  },
  pending: {
    label: 'Pendiente',
    icon: <AlertCircle size={13} />,
    bg: 'rgba(245,158,11,0.1)',
    color: '#D97706',
    border: 'rgba(245,158,11,0.2)',
    bar: 'linear-gradient(90deg, #F59E0B, #FCD34D)',
  },
};

const TreatmentCard = ({ title, description, price, progress, status, index, onDelete, onViewDetails }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.in_progress;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      style={{
        background: '#ffffff',
        border: '1px solid #EEF2F7',
        borderRadius: '1.75rem',
        padding: '1.75rem 2rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
        transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
        cursor: 'default',
        position: 'relative',
        overflow: 'hidden',
      }}
      whileHover={{
        y: -4,
        boxShadow: '0 12px 32px rgba(0,0,0,0.08)',
        borderColor: 'rgba(37,99,235,0.2)',
        transition: { duration: 0.25 }
      }}
    >
      {/* Subtle top accent line */}
      <div style={{
        position: 'absolute', top: 0, left: '2rem', right: '2rem', height: '3px',
        borderRadius: '0 0 4px 4px',
        background: cfg.bar,
        opacity: 0.7,
      }} />

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', marginTop: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem', flex: 1, minWidth: 0 }}>
          {/* Plan icon */}
          <div style={{
            width: '40px', height: '40px', borderRadius: '14px', flexShrink: 0,
            background: 'rgba(37,99,235,0.07)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#2563EB',
          }}>
            <Stethoscope size={18} />
          </div>
          <div style={{ minWidth: 0 }}>
            <h4 style={{
              fontSize: '0.9375rem', fontWeight: 800, color: '#0F172A',
              lineHeight: 1.3, letterSpacing: '-0.015em',
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>
              {title}
            </h4>
            {description && (
              <p style={{
                fontSize: '0.78rem', color: '#64748B', fontWeight: 500,
                marginTop: '0.3rem', lineHeight: 1.5,
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }}>
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
          {onDelete && (
            <button
              onClick={onDelete}
              style={{
                width: '32px', height: '32px', borderRadius: '10px',
                background: '#F8FAFC', border: '1px solid #EEF2F7',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#94A3B8', cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseOver={e => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.borderColor = '#FECACA'; }}
              onMouseOut={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = '#94A3B8'; e.currentTarget.style.borderColor = '#EEF2F7'; }}
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Price + Status badge row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
        {/* Price */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem' }}>
          <span style={{
            fontSize: '1.5rem', fontWeight: 900, color: '#0F172A',
            letterSpacing: '-0.03em', lineHeight: 1,
          }}>
            {price}
          </span>
          <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94A3B8', letterSpacing: '0.12em', textTransform: 'uppercase' }}>USD</span>
        </div>

        {/* Status badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.35rem',
          padding: '0.3rem 0.75rem', borderRadius: '999px',
          background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
          fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.04em', whiteSpace: 'nowrap',
        }}>
          {cfg.icon}
          {cfg.label}
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Progreso del plan
          </span>
          <span style={{ fontSize: '0.75rem', fontWeight: 900, color: cfg.color }}>{progress}%</span>
        </div>
        <div style={{ width: '100%', height: '6px', background: '#F1F5F9', borderRadius: '999px', overflow: 'hidden' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ delay: 0.3 + index * 0.07, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            style={{ height: '100%', background: cfg.bar, borderRadius: '999px' }}
          />
        </div>
      </div>

      {/* Footer action */}
      <button
        onClick={onViewDetails}
        style={{
          width: '100%', padding: '0.65rem 1rem',
          background: '#F8FAFC', border: '1px solid #EEF2F7',
          borderRadius: '1rem', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
          color: '#475569', fontSize: '0.72rem', fontWeight: 800,
          textTransform: 'uppercase', letterSpacing: '0.1em',
          transition: 'all 0.2s',
        }}
        onMouseOver={e => { e.currentTarget.style.background = '#EFF6FF'; e.currentTarget.style.color = '#2563EB'; e.currentTarget.style.borderColor = 'rgba(37,99,235,0.25)'; }}
        onMouseOut={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = '#475569'; e.currentTarget.style.borderColor = '#EEF2F7'; }}
      >
        Ver detalles <ChevronRight size={14} />
      </button>
    </motion.div>
  );
};

// ─────────────────────── Empty State ────────────────────────
const EmptyState = ({ onAdd }) => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    padding: '4rem 2rem', gap: '1.5rem', textAlign: 'center',
  }}>
    <div style={{
      width: '72px', height: '72px', borderRadius: '24px',
      background: 'rgba(37,99,235,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#2563EB',
    }}>
      <FileText size={32} />
    </div>
    <div>
      <p style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#1E293B', letterSpacing: '-0.01em' }}>Sin planes de tratamiento</p>
      <p style={{ fontSize: '0.8125rem', color: '#94A3B8', fontWeight: 500, marginTop: '0.3rem' }}>
        Crea el primer plan clínico para este paciente.
      </p>
    </div>
    <button
      onClick={onAdd}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        padding: '0.7rem 1.75rem', borderRadius: '999px',
        background: '#2563EB', color: '#fff',
        border: 'none', cursor: 'pointer',
        fontSize: '0.72rem', fontWeight: 900,
        textTransform: 'uppercase', letterSpacing: '0.1em',
        boxShadow: '0 6px 18px rgba(37,99,235,0.28)',
        transition: 'all 0.2s',
      }}
      onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 24px rgba(37,99,235,0.35)'; }}
      onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(37,99,235,0.28)'; }}
    >
      <Plus size={16} strokeWidth={3} /> Nuevo Plan
    </button>
  </div>
);

// ─────────────────────── Main Component ────────────────────────
const TreatmentsTab = ({ patient }) => {
  const { treatmentPlans, saveTreatmentPlan, deleteTreatmentPlan } = useData();
  const [showNewPlan, setShowNewPlan] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const actualPlans = treatmentPlans.filter(p => p.patient_id === patient.id);
  const planToDelete = actualPlans.find(p => p.id === pendingDeleteId);

  const handleSavePlan = async (planData) => {
    try {
      await saveTreatmentPlan({ ...planData, patient_id: patient.id }, planData.items);
      setShowNewPlan(false);
    } catch (error) {
      console.error('Error saving plan:', error);
      alert('Error al guardar el plan de tratamiento');
    }
  };

  const handleDeletePlan = async () => {
    if (!pendingDeleteId) return;
    try {
      await deleteTreatmentPlan(pendingDeleteId);
    } catch (err) {
      console.error('Error al eliminar:', err);
      alert('No se pudo eliminar el plan en este momento.');
    } finally {
      setPendingDeleteId(null);
    }
  };

  if (showNewPlan) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="new-plan"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.25 }}
          style={{ width: '100%' }}
        >
          <NewTreatmentPlan
            onCancel={() => setShowNewPlan(false)}
            onSave={handleSavePlan}
          />
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <div style={{ padding: '1.75rem 0.25rem 2rem' }}>

      {/* ── Section header ──────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '1.75rem',
        paddingBottom: '1.25rem',
        borderBottom: '1px solid #EEF2F7',
      }}>
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em' }}>
            Planes de Tratamiento
          </h3>
          <p style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 500, marginTop: '0.2rem' }}>
            {actualPlans.length} {actualPlans.length === 1 ? 'plan activo' : 'planes registrados'}
          </p>
        </div>

        <button
          onClick={() => setShowNewPlan(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.6rem 1.4rem', borderRadius: '999px',
            background: '#2563EB', color: '#fff',
            border: 'none', cursor: 'pointer',
            fontSize: '0.7rem', fontWeight: 900,
            textTransform: 'uppercase', letterSpacing: '0.1em',
            boxShadow: '0 4px 14px rgba(37,99,235,0.25)',
            transition: 'all 0.2s',
          }}
          onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(37,99,235,0.35)'; }}
          onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(37,99,235,0.25)'; }}
        >
          <Plus size={15} strokeWidth={3} /> Nuevo Plan
        </button>
      </div>

      {/* ── Cards grid / empty ──────────────────────────── */}
      {actualPlans.length === 0 ? (
        <EmptyState onAdd={() => setShowNewPlan(true)} />
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1.25rem',
        }}>
          {actualPlans.map((plan, index) => {
            const itemNames = plan.items?.map(i => i.service?.name || 'Procedimiento').filter(Boolean) || [];
            const displayDesc = itemNames.length > 0
              ? `${itemNames.slice(0, 3).join(' · ')}${itemNames.length > 3 ? ` +${itemNames.length - 3} más` : ''}`
              : undefined;

            // Calculate live progress from item statuses
            const liveItems = plan.items || [];
            const completedItems = liveItems.filter(i => i.status === 'completed').length;
            const progress = liveItems.length === 0
              ? (plan.status === 'completed' ? 100 : plan.status === 'pending' ? 0 : 50)
              : Math.round((completedItems / liveItems.length) * 100);

            const status = progress === 100 ? 'completed'
              : progress === 0 ? 'pending'
              : 'in_progress';

            return (
              <TreatmentCard
                key={plan.id}
                index={index}
                title={plan.name}
                description={displayDesc}
                price={`$${plan.total_amount?.toLocaleString('en-US', { minimumFractionDigits: 2 }) ?? '0.00'}`}
                progress={progress}
                status={status}
                onDelete={() => setPendingDeleteId(plan.id)}
                onViewDetails={() => setSelectedPlan(plan)}
              />
            );
          })}
        </div>
      )}

      {/* ── Delete confirmation ── */}
      <ConfirmModal
        isOpen={!!pendingDeleteId}
        onCancel={() => setPendingDeleteId(null)}
        onConfirm={handleDeletePlan}
        title="¿Eliminar plan de tratamiento?"
        message={planToDelete ? `Estás a punto de eliminar "${planToDelete.name}". Esta acción no se puede deshacer.` : 'Esta acción no se puede deshacer.'}
        confirmLabel="Sí, eliminar plan"
      />

      {/* ── Plan detail panel ── */}
      <PlanDetailModal
        plan={selectedPlan}
        patient={patient}
        isOpen={!!selectedPlan}
        onClose={() => setSelectedPlan(null)}
      />
    </div>
  );
};

export default TreatmentsTab;
