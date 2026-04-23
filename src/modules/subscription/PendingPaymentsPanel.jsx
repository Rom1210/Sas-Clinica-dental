import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard, CheckCircle2, XCircle, Clock, Eye,
  ExternalLink, AlertTriangle, Zap, Crown, Star
} from 'lucide-react';
import { usePlan } from '../../context/SubscriptionContext';

const PLAN_LABELS = { basic: 'Básico', pro: 'Pro', elite: 'Elite', voice_credits: 'Minutos de voz' };
const PLAN_ICONS  = { basic: Star, pro: Zap, elite: Crown, voice_credits: Zap };
const PLAN_COLORS = { basic: '#64748B', pro: '#2563EB', elite: '#7C3AED', voice_credits: '#7C3AED' };

const PaymentRow = ({ payment, onApprove, onReject }) => {
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason]         = useState('');
  const [showProof, setShowProof]   = useState(false);
  const Icon  = PLAN_ICONS[payment.plan] || Star;
  const color = PLAN_COLORS[payment.plan] || '#64748B';

  const date = new Date(payment.created_at).toLocaleDateString('es-ES', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      style={{ background: '#fff', borderRadius: '1.25rem', border: '1.5px solid #EEF2F7', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
    >
      <div style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        {/* Plan badge */}
        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={18} style={{ color }} />
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: '160px' }}>
          <p style={{ fontWeight: 900, fontSize: '0.875rem', color: '#0F172A', margin: '0 0 2px' }}>
            Plan {PLAN_LABELS[payment.plan]}
            {payment.plan === 'voice_credits' && payment.minutes && ` — ${payment.minutes} min`}
          </p>
          <p style={{ fontSize: '0.72rem', color: '#64748B', margin: 0 }}>
            {date} · {payment.method === 'crypto' ? 'Cripto USDT' : payment.method === 'bank' ? 'Transferencia' : 'Pago Móvil'} · ${payment.amount} {payment.currency}
          </p>
        </div>

        {/* Status pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.35rem 0.875rem', borderRadius: '999px', background: '#FFF7ED', border: '1px solid #FED7AA' }}>
          <Clock size={12} style={{ color: '#EA580C' }} />
          <span style={{ fontSize: '0.68rem', fontWeight: 900, color: '#EA580C', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pendiente</span>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {payment.screenshot_url && (
            <button onClick={() => setShowProof(p => !p)}
              style={{ padding: '0.5rem 0.875rem', borderRadius: '0.875rem', border: '1.5px solid #EEF2F7', background: '#F8FAFC', color: '#475569', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Eye size={13} /> Comprobante
            </button>
          )}
          <button onClick={() => onApprove(payment.id)}
            style={{ padding: '0.5rem 0.875rem', borderRadius: '0.875rem', border: 'none', background: '#ECFDF5', color: '#059669', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', transition: 'all 0.15s' }}
            onMouseOver={e => e.currentTarget.style.background = '#D1FAE5'}
            onMouseOut={e =>  e.currentTarget.style.background = '#ECFDF5'}
          >
            <CheckCircle2 size={13} /> Aprobar
          </button>
          <button onClick={() => setShowReject(r => !r)}
            style={{ padding: '0.5rem 0.875rem', borderRadius: '0.875rem', border: 'none', background: '#FEF2F2', color: '#DC2626', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', transition: 'all 0.15s' }}
            onMouseOver={e => e.currentTarget.style.background = '#FEE2E2'}
            onMouseOut={e =>  e.currentTarget.style.background = '#FEF2F2'}
          >
            <XCircle size={13} /> Rechazar
          </button>
        </div>
      </div>

      {/* Comprobante image */}
      <AnimatePresence>
        {showProof && payment.screenshot_url && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            style={{ borderTop: '1px solid #EEF2F7', padding: '1rem', background: '#F8FAFC' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <p style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Comprobante</p>
              <a href={payment.screenshot_url} target="_blank" rel="noreferrer"
                style={{ fontSize: '0.72rem', color: '#2563EB', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem', textDecoration: 'none' }}>
                <ExternalLink size={11} /> Ver original
              </a>
            </div>
            <img src={payment.screenshot_url} alt="comprobante"
              style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain', borderRadius: '0.75rem', border: '1px solid #EEF2F7' }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reject form */}
      <AnimatePresence>
        {showReject && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            style={{ borderTop: '1px solid #FECACA', padding: '1rem', background: '#FEF2F2' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 800, color: '#991B1B', margin: '0 0 0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <AlertTriangle size={14} /> Motivo de rechazo (se notificará al cliente)
            </p>
            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2}
              placeholder="Ej: El monto no coincide, la imagen no es legible, comprobante duplicado..."
              style={{ width: '100%', borderRadius: '0.75rem', border: '1.5px solid #FECACA', padding: '0.6rem 0.875rem', fontSize: '0.8rem', color: '#0F172A', outline: 'none', resize: 'vertical', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.6rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowReject(false)}
                style={{ padding: '0.5rem 1rem', borderRadius: '0.75rem', border: '1.5px solid #EEF2F7', background: '#fff', color: '#64748B', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}>
                Cancelar
              </button>
              <button onClick={() => { if (reason.trim()) { onReject(payment.id, reason); setShowReject(false); } }}
                style={{ padding: '0.5rem 1rem', borderRadius: '0.75rem', border: 'none', background: '#DC2626', color: '#fff', fontWeight: 800, fontSize: '0.78rem', cursor: reason.trim() ? 'pointer' : 'default', opacity: reason.trim() ? 1 : 0.5 }}>
                Confirmar rechazo
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ── Exported panel for ControlMaster ──────────────────
const PendingPaymentsPanel = () => {
  const { pendingPayments, pendingCount, approvePayment, rejectPayment } = usePlan();

  if (pendingCount === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: '#94A3B8' }}>
        <CheckCircle2 size={32} style={{ marginBottom: '0.5rem', color: '#D1D5DB' }} />
        <p style={{ fontWeight: 700, fontSize: '0.875rem', margin: 0 }}>Sin pagos pendientes</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {pendingPayments.map(p => (
        <PaymentRow key={p.id} payment={p}
          onApprove={approvePayment}
          onReject={rejectPayment}
        />
      ))}
    </div>
  );
};

export default PendingPaymentsPanel;
