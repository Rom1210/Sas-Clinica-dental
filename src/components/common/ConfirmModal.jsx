import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

/**
 * ConfirmModal — Reusable delete confirmation dialog.
 *
 * Props:
 *   isOpen        boolean
 *   onConfirm     () => void
 *   onCancel      () => void
 *   title         string  (optional)
 *   message       string  (optional)
 *   confirmLabel  string  (optional, default "Sí, eliminar")
 *   danger        boolean (optional, default true)
 */
const ConfirmModal = ({
  isOpen,
  onConfirm,
  onCancel,
  title = '¿Confirmar eliminación?',
  message = 'Esta acción no se puede deshacer.',
  confirmLabel = 'Sí, eliminar',
  danger = true,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onCancel}
            style={{
              position: 'fixed', inset: 0, zIndex: 9900,
              background: 'rgba(15,23,42,0.45)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
            }}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -6 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'fixed',
              top: '28px',
              right: '28px',
              zIndex: 9901,
              width: '340px',
              background: '#ffffff',
              borderRadius: '1.75rem',
              padding: '1.75rem',
              boxShadow: '0 24px 64px -12px rgba(0,0,0,0.22), 0 0 0 1px rgba(0,0,0,0.04)',
            }}
          >
            {/* Close */}
            <button
              onClick={onCancel}
              style={{
                position: 'absolute', top: '1rem', right: '1rem',
                width: '30px', height: '30px', borderRadius: '50%',
                background: '#F8FAFC', border: '1px solid #EEF2F7',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#94A3B8', cursor: 'pointer', transition: 'all 0.15s',
              }}
              onMouseOver={e => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.color = '#EF4444'; }}
              onMouseOut={e =>  { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = '#94A3B8'; }}
            >
              <X size={14} />
            </button>

            {/* Icon */}
            <div style={{
              width: '52px', height: '52px', borderRadius: '18px',
              background: danger ? 'rgba(239,68,68,0.08)' : 'rgba(37,99,235,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: danger ? '#EF4444' : '#2563EB',
              marginBottom: '1rem',
            }}>
              <AlertTriangle size={24} strokeWidth={2} />
            </div>

            {/* Text */}
            <h3 style={{
              fontSize: '0.9375rem', fontWeight: 900, color: '#0F172A',
              letterSpacing: '-0.02em', marginBottom: '0.4rem',
            }}>
              {title}
            </h3>
            <p style={{
              fontSize: '0.8125rem', color: '#64748B', fontWeight: 500,
              lineHeight: 1.5, marginBottom: '1.5rem',
            }}>
              {message}
            </p>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.625rem' }}>
              <button
                onClick={onCancel}
                style={{
                  flex: 1, padding: '0.65rem',
                  background: '#F8FAFC', border: '1.5px solid #EEF2F7',
                  borderRadius: '1rem', cursor: 'pointer',
                  fontSize: '0.72rem', fontWeight: 900,
                  color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em',
                  transition: 'all 0.15s',
                }}
                onMouseOver={e => { e.currentTarget.style.background = '#F1F5F9'; }}
                onMouseOut={e =>  { e.currentTarget.style.background = '#F8FAFC'; }}
              >
                Cancelar
              </button>

              <button
                onClick={onConfirm}
                style={{
                  flex: 1, padding: '0.65rem',
                  background: danger ? '#EF4444' : '#2563EB',
                  border: 'none', borderRadius: '1rem', cursor: 'pointer',
                  fontSize: '0.72rem', fontWeight: 900,
                  color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.08em',
                  boxShadow: danger ? '0 4px 12px rgba(239,68,68,0.3)' : '0 4px 12px rgba(37,99,235,0.3)',
                  transition: 'all 0.15s',
                }}
                onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.opacity = '0.9'; }}
                onMouseOut={e =>  { e.currentTarget.style.transform = 'none'; e.currentTarget.style.opacity = '1'; }}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ConfirmModal;
