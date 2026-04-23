import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check, Zap, Crown, Sparkles, X, Upload,
  Bitcoin, Landmark, Clock, CheckCircle2, AlertCircle,
  ChevronRight, Star
} from 'lucide-react';
import { usePlan } from '../../context/SubscriptionContext';

// ── Payment config ─────────────────────────────────────
const PAYMENT_INFO = {
  crypto: {
    label: 'Cripto (USDT/TRON TRC-20)',
    icon: Bitcoin,
    address: 'TYourWalletAddressHere123456789',
    network: 'TRON (TRC-20)',
    note: 'Envía USDT a la dirección de arriba. Confirma la red: TRC-20.',
  },
  bank: {
    label: 'Transferencia / Pago Móvil',
    icon: Landmark,
    account: '0102-0123-45-6789012345',
    bank: 'Banco de Venezuela',
    rif: 'J-12345678-9',
    pagoMovil: '04141234567',
    note: 'Envía a cualquiera de los datos anteriores y sube el comprobante.',
  },
};

const PLANS = [
  {
    id: 'basic',
    name: 'Básico',
    icon: Star,
    color: '#64748B',
    theme: {
      bg: '#ffffff',
      border: '1.5px solid #EEF2F7',
      shadow: '0 8px 24px rgba(0,0,0,0.03)',
      title: '#0F172A',
      price: '#0F172A',
      text: '#64748B',
      checkBg: '#F1F5F9',
      checkFg: '#94A3B8',
      iconBg: '#F8FAFC',
    },
    price_monthly: 0,
    price_annual: 0,
    tag: null,
    features: [
      { label: 'Hasta 50 pacientes', included: true },
      { label: 'Agenda y finanzas', included: true },
      { label: 'Odontograma', included: true },
      { label: 'Asistente IA (texto)', included: false },
      { label: 'Estadísticas avanzadas', included: false },
      { label: 'Voz IA', included: false },
      { label: '1 usuario', included: true },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    icon: Zap,
    color: '#2563EB',
    theme: {
      bg: 'linear-gradient(180deg, #ffffff 0%, #F0F9FF 100%)',
      border: '2px solid #BFDBFE',
      shadow: '0 24px 48px rgba(37,99,235,0.12)',
      title: '#0F172A',
      price: '#1D4ED8',
      text: '#475569',
      checkBg: '#DBEAFE',
      checkFg: '#2563EB',
      iconBg: '#EFF6FF',
    },
    price_monthly: 29,
    price_annual: 23,
    tag: 'Más popular',
    features: [
      { label: 'Pacientes ilimitados', included: true },
      { label: 'Agenda y finanzas', included: true },
      { label: 'Odontograma', included: true },
      { label: 'Asistente IA (texto)', included: true },
      { label: 'Estadísticas avanzadas', included: true },
      { label: 'Voz IA (pay-as-you-go)', included: true },
      { label: 'Hasta 3 usuarios', included: true },
    ],
  },
  {
    id: 'elite',
    name: 'Elite',
    icon: Crown,
    color: '#A855F7',
    theme: {
      bg: 'linear-gradient(135deg, #0F172A 0%, #020617 100%)',
      border: '1px solid #1E293B',
      shadow: '0 32px 64px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(168,85,247,0.15)',
      title: '#ffffff',
      price: '#ffffff',
      text: '#94A3B8',
      checkBg: 'rgba(168,85,247,0.15)',
      checkFg: '#A855F7',
      iconBg: 'rgba(168,85,247,0.1)',
    },
    price_monthly: 69,
    price_annual: 55,
    tag: '30 min voz IA/mes',
    features: [
      { label: 'Pacientes ilimitados', included: true },
      { label: 'Agenda y finanzas', included: true },
      { label: 'Odontograma', included: true },
      { label: 'Asistente IA (texto)', included: true },
      { label: 'Estadísticas avanzadas', included: true },
      { label: '30 min voz IA incluidos/mes', included: true },
      { label: 'Usuarios ilimitados', included: true },
    ],
  },
];

// ── Payment Modal ──────────────────────────────────────
const PaymentModal = ({ plan, annual, onClose }) => {
  const { submitPaymentRequest } = usePlan();
  const [tab, setTab]           = useState('crypto');
  const [file, setFile]         = useState(null);
  const [preview, setPreview]   = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone]         = useState(false);
  const [error, setError]       = useState(null);

  const amount   = annual ? plan.price_annual : plan.price_monthly;
  const currency = 'USD';
  const method   = PAYMENT_INFO[tab];

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async () => {
    if (!file) { setError('Por favor sube el comprobante de pago.'); return; }
    setSubmitting(true);
    setError(null);
    try {
      await submitPaymentRequest({
        plan: plan.id,
        amount,
        currency,
        method: tab,
        screenshotFile: file,
      });
      setDone(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
      onClick={onClose}
    >
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
        onClick={e => e.stopPropagation()}
        style={{ width: '480px', maxWidth: '100%', background: '#fff', borderRadius: '2rem', overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,0.25)' }}
      >
        {/* Header */}
        <div style={{ padding: '1.5rem', background: `linear-gradient(135deg, ${plan.color} 0%, ${plan.color}cc 100%)`, position: 'relative' }}>
          <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={16} />
          </button>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Activar plan</p>
          <h2 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 900, margin: '0.25rem 0 0' }}>{plan.name} — ${amount}/mes</h2>
        </div>

        {done ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <CheckCircle2 size={56} style={{ color: '#059669', margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0F172A', margin: '0 0 0.5rem' }}>¡Comprobante enviado!</h3>
            <p style={{ color: '#64748B', fontSize: '0.875rem', lineHeight: 1.6 }}>
              Revisaremos tu pago en las próximas <strong>24 horas</strong>.<br />
              Recibirás confirmación y tu plan se activará automáticamente.
            </p>
            <button onClick={onClose} style={{ marginTop: '1.5rem', padding: '0.75rem 2rem', background: '#0F172A', color: '#fff', border: 'none', borderRadius: '1rem', fontWeight: 800, cursor: 'pointer', fontSize: '0.875rem' }}>
              Entendido
            </button>
          </div>
        ) : (
          <div style={{ padding: '1.25rem 1.5rem' }}>
            {/* Method tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
              {Object.entries(PAYMENT_INFO).map(([key, m]) => (
                <button key={key} onClick={() => setTab(key)}
                  style={{ flex: 1, padding: '0.6rem', borderRadius: '0.875rem', border: tab === key ? `2px solid ${plan.color}` : '1.5px solid #EEF2F7', background: tab === key ? `${plan.color}10` : '#F8FAFC', color: tab === key ? plan.color : '#64748B', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', transition: 'all 0.2s' }}>
                  <m.icon size={14} /> {m.label}
                </button>
              ))}
            </div>

            {/* Payment details */}
            <div style={{ background: '#F8FAFC', borderRadius: '1rem', padding: '1rem', marginBottom: '1rem', border: '1px solid #EEF2F7' }}>
              {tab === 'crypto' ? (
                <>
                  <p style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 0.5rem' }}>Dirección {PAYMENT_INFO.crypto.network}</p>
                  <p style={{ fontFamily: 'monospace', fontSize: '0.78rem', wordBreak: 'break-all', color: '#0F172A', fontWeight: 700, background: '#EEF2F7', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', margin: '0 0 0.5rem' }}>{PAYMENT_INFO.crypto.address}</p>
                  <p style={{ fontSize: '0.72rem', color: '#64748B', margin: 0 }}>{PAYMENT_INFO.crypto.note}</p>
                </>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    {[
                      ['Banco', PAYMENT_INFO.bank.bank],
                      ['Cuenta', PAYMENT_INFO.bank.account],
                      ['RIF', PAYMENT_INFO.bank.rif],
                      ['Pago Móvil', PAYMENT_INFO.bank.pagoMovil],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <p style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', margin: '0 0 2px' }}>{k}</p>
                        <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>{v}</p>
                      </div>
                    ))}
                  </div>
                  <p style={{ fontSize: '0.72rem', color: '#64748B', margin: 0 }}>{PAYMENT_INFO.bank.note}</p>
                </>
              )}
              <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', background: `${plan.color}15`, borderRadius: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 900, color: plan.color }}>Monto a pagar: ${amount} USD</span>
              </div>
            </div>

            {/* Screenshot upload */}
            <div style={{ marginBottom: '1rem' }}>
              <p style={{ fontSize: '0.7rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.5rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Comprobante de pago</p>
              <label style={{ display: 'block', border: '2px dashed #CBD5E1', borderRadius: '1rem', padding: preview ? '0' : '1.5rem', cursor: 'pointer', textAlign: 'center', overflow: 'hidden', transition: 'border-color 0.2s' }}
                onMouseOver={e => e.currentTarget.style.borderColor = plan.color}
                onMouseOut={e =>  e.currentTarget.style.borderColor = '#CBD5E1'}
              >
                <input type="file" accept="image/*,application/pdf" onChange={handleFile} style={{ display: 'none' }} />
                {preview ? (
                  <img src={preview} alt="comprobante" style={{ width: '100%', maxHeight: '180px', objectFit: 'cover' }} />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                    <Upload size={24} style={{ color: '#94A3B8' }} />
                    <p style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600, margin: 0 }}>Clic o arrastra tu captura aquí</p>
                    <p style={{ fontSize: '0.68rem', color: '#94A3B8', margin: 0 }}>JPG, PNG o PDF</p>
                  </div>
                )}
              </label>
            </div>

            {error && <p style={{ fontSize: '0.75rem', color: '#DC2626', fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><AlertCircle size={14} /> {error}</p>}

            <button onClick={handleSubmit} disabled={submitting}
              style={{ width: '100%', padding: '0.875rem', background: `linear-gradient(135deg, ${plan.color}, ${plan.color}cc)`, color: '#fff', border: 'none', borderRadius: '1rem', fontWeight: 900, fontSize: '0.9rem', cursor: submitting ? 'wait' : 'pointer', boxShadow: `0 4px 16px ${plan.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              {submitting ? 'Enviando...' : <><Upload size={16} /> Enviar comprobante</>}
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

// ── Voice Credits Modal ────────────────────────────────
const VoiceCreditsModal = ({ onClose }) => {
  const { submitPaymentRequest } = usePlan();
  const [minutes, setMinutes] = useState(60);
  const [file, setFile]       = useState(null);
  const [preview, setPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone]       = useState(false);

  const price = (minutes * 0.10).toFixed(2);

  const handleSubmit = async () => {
    if (!file) return;
    setSubmitting(true);
    await submitPaymentRequest({ plan: 'voice_credits', amount: parseFloat(price), currency: 'USD', method: 'voice_credits', screenshotFile: file, minutes });
    setDone(true);
    setSubmitting(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
      onClick={onClose}
    >
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} onClick={e => e.stopPropagation()}
        style={{ width: '400px', background: '#fff', borderRadius: '2rem', overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,0.25)' }}
      >
        <div style={{ padding: '1.5rem', background: 'linear-gradient(135deg, #6D28D9, #4C1D95)' }}>
          <button onClick={onClose} style={{ float: 'right', background: 'rgba(255,255,255,0.2)', border: 'none', width: '28px', height: '28px', borderRadius: '50%', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={14} /></button>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', margin: 0 }}>Comprar minutos de voz IA</p>
          <h2 style={{ color: '#fff', fontWeight: 900, margin: '0.25rem 0 0', fontSize: '1.25rem' }}>$0.10 por minuto</h2>
        </div>

        {done ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <CheckCircle2 size={48} style={{ color: '#059669', margin: '0 auto 1rem' }} />
            <p style={{ color: '#0F172A', fontWeight: 800, fontSize: '1rem' }}>¡Comprobante enviado!</p>
            <p style={{ color: '#64748B', fontSize: '0.8rem' }}>Los minutos se acreditarán en 24h tras verificación.</p>
            <button onClick={onClose} style={{ marginTop: '1rem', padding: '0.6rem 1.5rem', background: '#0F172A', color: '#fff', border: 'none', borderRadius: '0.75rem', cursor: 'pointer', fontWeight: 800 }}>Cerrar</button>
          </div>
        ) : (
          <div style={{ padding: '1.25rem 1.5rem' }}>
            <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Minutos a comprar</label>
            <div style={{ display: 'flex', gap: '0.5rem', margin: '0.5rem 0 1rem', flexWrap: 'wrap' }}>
              {[30, 60, 120, 300].map(m => (
                <button key={m} onClick={() => setMinutes(m)}
                  style={{ padding: '0.5rem 1rem', borderRadius: '0.875rem', border: minutes === m ? '2px solid #6D28D9' : '1.5px solid #EEF2F7', background: minutes === m ? '#F5F3FF' : '#F8FAFC', color: minutes === m ? '#6D28D9' : '#64748B', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.15s' }}>
                  {m} min — ${(m * 0.10).toFixed(2)}
                </button>
              ))}
            </div>
            <div style={{ background: '#F5F3FF', borderRadius: '1rem', padding: '0.75rem 1rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: '#6D28D9', fontWeight: 700 }}>{minutes} minutos de voz IA</span>
              <span style={{ fontWeight: 900, color: '#6D28D9', fontSize: '1.1rem' }}>${price} USD</span>
            </div>

            <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Comprobante de pago</label>
            <label style={{ display: 'block', border: '2px dashed #DDD6FE', borderRadius: '0.875rem', padding: '1rem', cursor: 'pointer', textAlign: 'center', marginTop: '0.4rem', marginBottom: '1rem' }}>
              <input type="file" accept="image/*" onChange={e => { setFile(e.target.files[0]); setPreview(URL.createObjectURL(e.target.files[0])); }} style={{ display: 'none' }} />
              {preview ? <img src={preview} alt="" style={{ width: '100%', maxHeight: '120px', objectFit: 'cover', borderRadius: '0.5rem' }} /> : <><Upload size={20} style={{ color: '#A78BFA', margin: '0 auto 4px' }} /><p style={{ fontSize: '0.75rem', color: '#8B5CF6', margin: 0, fontWeight: 600 }}>Subir comprobante</p></>}
            </label>

            <button onClick={handleSubmit} disabled={!file || submitting}
              style={{ width: '100%', padding: '0.875rem', background: 'linear-gradient(135deg, #6D28D9, #4C1D95)', color: '#fff', border: 'none', borderRadius: '1rem', fontWeight: 900, cursor: file ? 'pointer' : 'default', opacity: file ? 1 : 0.6 }}>
              {submitting ? 'Enviando...' : 'Enviar comprobante'}
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

// ── Main Pricing Page ──────────────────────────────────
const PricingPage = () => {
  const { effectivePlan, isTrialActive, trialDaysLeft, voiceMinutesLeft, voiceTotalCapacity, paymentHistory } = usePlan();
  const [annual,  setAnnual]  = useState(false);
  const [payingFor, setPayingFor] = useState(null); // plan object
  const [buyingVoice, setBuyingVoice] = useState(false);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #F8FAFC 0%, #EFF6FF 100%)', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'linear-gradient(135deg, #2563EB20, #7C3AED20)', border: '1px solid #C4B5FD', borderRadius: '999px', padding: '0.4rem 1rem', marginBottom: '1rem' }}>
            <Sparkles size={14} style={{ color: '#7C3AED' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#5B21B6', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Sistema Dental IA</span>
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#0F172A', margin: '0 0 1rem', letterSpacing: '-0.02em' }}>
            Elige tu plan
          </h1>
          <p style={{ color: '#475569', fontSize: '1rem', maxWidth: '480px', margin: '0 auto 1.5rem', lineHeight: 1.6 }}>
            Empieza gratis 15 días con acceso completo. Paga solo cuando estés listo.
          </p>

          {/* Toggle anual/mensual */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', background: '#F1F5F9', borderRadius: '999px', padding: '0.3rem 0.4rem' }}>
            <button onClick={() => setAnnual(false)}
              style={{ padding: '0.4rem 1rem', borderRadius: '999px', border: 'none', background: !annual ? '#fff' : 'transparent', color: !annual ? '#0F172A' : '#64748B', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', boxShadow: !annual ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}>
              Mensual
            </button>
            <button onClick={() => setAnnual(true)}
              style={{ padding: '0.4rem 1rem', borderRadius: '999px', border: 'none', background: annual ? '#fff' : 'transparent', color: annual ? '#0F172A' : '#64748B', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', boxShadow: annual ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}>
              Anual <span style={{ color: '#059669', fontSize: '0.65rem', fontWeight: 900, marginLeft: '4px' }}>-20%</span>
            </button>
          </div>
        </div>

        {/* Trial banner */}
        {isTrialActive && (
          <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E3A5F 100%)', borderRadius: '1.5rem', padding: '1rem 1.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Clock size={20} style={{ color: '#60A5FA', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <p style={{ color: '#fff', fontWeight: 800, margin: 0, fontSize: '0.9rem' }}>
                Estás en período de prueba — {trialDaysLeft} día{trialDaysLeft !== 1 ? 's' : ''} restante{trialDaysLeft !== 1 ? 's' : ''}
              </p>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 500, margin: 0, fontSize: '0.78rem' }}>
                Acceso completo Elite durante el trial. Elige un plan antes de que expire.
              </p>
            </div>
            <div style={{ background: '#1E40AF', borderRadius: '999px', padding: '0.35rem 0.875rem' }}>
              <span style={{ color: '#fff', fontWeight: 900, fontSize: '0.78rem' }}>Trial Elite</span>
            </div>
          </motion.div>
        )}

        {/* Plan cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem', marginBottom: '3rem' }}>
          {PLANS.map((plan, i) => {
            const price = annual ? plan.price_annual : plan.price_monthly;
            const isCurrent = effectivePlan === plan.id || (effectivePlan === 'trial' && plan.id === 'elite');
            const Icon = plan.icon;
            return (
              <motion.div key={plan.id}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1, type: 'spring', stiffness: 100 }}
                style={{
                  borderRadius: '2rem', overflow: 'hidden',
                  boxShadow: plan.theme.shadow,
                  border: plan.theme.border,
                  background: plan.theme.bg,
                  transform: plan.id === 'pro' ? 'scale(1.03)' : 'scale(1)',
                  position: 'relative',
                  display: 'flex', flexDirection: 'column'
                }}
              >
                {plan.tag && (
                  <div style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: plan.id === 'elite' ? 'rgba(168,85,247,0.2)' : plan.color, color: plan.id === 'elite' ? '#D8B4FE' : '#fff', padding: '0.4rem 0.875rem', borderRadius: '999px', fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', border: plan.id === 'elite' ? '1px solid rgba(168,85,247,0.4)' : 'none' }}>
                    {plan.tag}
                  </div>
                )}

                <div style={{ padding: '2rem 1.75rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: plan.theme.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                    <Icon size={24} style={{ color: plan.color }} />
                  </div>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: plan.theme.title, margin: '0 0 0.5rem', letterSpacing: '-0.02em' }}>{plan.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', margin: '0.5rem 0 2rem' }}>
                    <span style={{ fontSize: '2.5rem', fontWeight: 900, color: plan.theme.price, letterSpacing: '-0.03em' }}>
                      {price === 0 ? 'Gratis' : `$${price}`}
                    </span>
                    {price > 0 && <span style={{ color: plan.theme.text, fontWeight: 600, fontSize: '0.9rem' }}>/mes</span>}
                  </div>

                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem', display: 'flex', flexDirection: 'column', gap: '0.875rem', flex: 1 }}>
                    {plan.features.map((f, fi) => (
                      <li key={fi} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', opacity: f.included ? 1 : 0.35, transition: 'opacity 0.2s' }}>
                        <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: f.included ? plan.theme.checkBg : plan.theme.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Check size={11} style={{ color: f.included ? plan.theme.checkFg : plan.theme.text }} />
                        </div>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: f.included ? plan.theme.title : plan.theme.text }}>{f.label}</span>
                      </li>
                    ))}
                  </ul>

                  {isCurrent ? (
                    <div style={{ width: '100%', padding: '1rem', borderRadius: '1.25rem', border: `2px solid ${plan.color}40`, textAlign: 'center', color: plan.color, fontWeight: 900, fontSize: '0.9rem', background: plan.theme.iconBg }}>
                      ✓ Plan actual
                    </div>
                  ) : plan.id === 'basic' ? (
                    <div style={{ width: '100%', padding: '1rem', borderRadius: '1.25rem', border: '1.5px solid #E2E8F0', textAlign: 'center', color: '#64748B', fontWeight: 800, fontSize: '0.9rem', background: '#F8FAFC' }}>
                      Siempre disponible
                    </div>
                  ) : (
                    <button onClick={() => setPayingFor(plan)}
                      style={{ 
                        width: '100%', padding: '1rem', 
                        background: plan.id === 'elite' ? 'linear-gradient(135deg, #9333EA, #4F46E5)' : `linear-gradient(135deg, ${plan.color}, ${plan.color}dd)`, 
                        color: '#fff', border: plan.id === 'elite' ? '1px solid #C084FC' : 'none', 
                        borderRadius: '1.25rem', fontWeight: 900, fontSize: '0.95rem', cursor: 'pointer', 
                        boxShadow: plan.id === 'elite' ? '0 8px 30px rgba(147,51,234,0.4), inset 0 2px 4px rgba(255,255,255,0.2)' : `0 8px 24px ${plan.color}40`, 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'all 0.2s',
                        textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                      }}
                      onMouseOver={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                      onMouseOut={e =>  e.currentTarget.style.transform = 'translateY(0)'}
                    >
                      Activar {plan.name} <ChevronRight size={18} />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Pay-as-you-go voice section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{ background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)', borderRadius: '2rem', padding: '2rem', marginBottom: '2rem', display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap', boxShadow: '0 20px 60px rgba(109,40,217,0.3)' }}>
          <div style={{ flex: 1, minWidth: '240px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(167,139,250,0.2)', border: '1px solid rgba(167,139,250,0.4)', borderRadius: '999px', padding: '0.3rem 0.875rem', marginBottom: '0.75rem' }}>
              <Sparkles size={12} style={{ color: '#A78BFA' }} />
              <span style={{ color: '#A78BFA', fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Agrega Minutos Reales</span>
            </div>
            <h3 style={{ color: '#fff', fontWeight: 900, fontSize: '1.2rem', margin: '0 0 0.5rem', letterSpacing: '-0.01em' }}>
              Voz de Vivia IA
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.85rem', lineHeight: 1.6, margin: '0 0 1rem' }}>
              Conversa con Vivia comprando bloques de minutos ($0.10/min) o consíguelos gratis en el Plan Elite.
            </p>
            <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '999px', height: '8px', overflow: 'hidden', marginTop: '1rem', width: '100%', border: '1px solid rgba(255,255,255,0.1)' }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, Math.max(0, (voiceMinutesLeft / (voiceTotalCapacity || 1)) * 100))}%` }} transition={{ duration: 1 }} style={{ background: 'linear-gradient(90deg, #A78BFA, #C084FC)', height: '100%', borderRadius: '999px' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#A78BFA', marginTop: '6px', fontWeight: 700 }}>
              <span>{Math.max(0, voiceTotalCapacity - voiceMinutesLeft)} min consumidos</span>
              <span>{voiceMinutesLeft} / {voiceTotalCapacity} min disponibles</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'flex-end' }}>
            {[
              { min: 30, price: '3.00' },
              { min: 60, price: '6.00' },
              { min: 120, price: '12.00' },
            ].map(({ min, price }) => (
              <div key={min} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '0.875rem', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ color: '#C4B5FD', fontWeight: 700, fontSize: '0.8rem' }}>{min} min</span>
                <span style={{ color: '#fff', fontWeight: 900 }}>${price} USD</span>
              </div>
            ))}
            <button onClick={() => setBuyingVoice(true)}
              style={{ padding: '0.75rem 1.5rem', background: 'linear-gradient(135deg, #7C3AED, #5B21B6)', color: '#fff', border: 'none', borderRadius: '1rem', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 16px rgba(124,58,237,0.5)', fontSize: '0.875rem' }}>
              <Sparkles size={16} /> Comprar minutos
            </button>
          </div>
        </motion.div>

        {/* Payment methods note */}
        <p style={{ textAlign: 'center', color: '#94A3B8', fontSize: '0.78rem', marginTop: '2rem', lineHeight: 1.6 }}>
          💳 Aceptamos <strong>USDT (TRC-20)</strong> · <strong>Transferencia bancaria</strong> · <strong>Pago Móvil</strong><br />
          Verificación manual en 24h. Comparte tu comprobante y activamos tu plan.
        </p>

        {/* Historial de Compras */}
        {paymentHistory && paymentHistory.length > 0 && (
          <div style={{ marginTop: '4rem', paddingBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0F172A', margin: '0 0 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={20} style={{ color: '#64748B' }} /> Historial de Compras
            </h3>
            <div style={{ background: '#fff', borderRadius: '1.5rem', border: '1px solid #EEF2F7', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              {paymentHistory.map((p, i) => (
                <div key={p.id} style={{ padding: '1.25rem 1.5rem', borderBottom: i < paymentHistory.length - 1 ? '1px solid #EEF2F7' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: p.status === 'approved' ? '#D1FAE5' : p.status === 'rejected' ? '#FEE2E2' : '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {p.status === 'approved' ? <Check size={18} style={{ color: '#059669' }} /> : p.status === 'rejected' ? <X size={18} style={{ color: '#DC2626' }} /> : <Clock size={18} style={{ color: '#D97706' }} />}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontWeight: 800, color: '#0F172A', fontSize: '0.95rem' }}>
                        {p.plan === 'voice_credits' ? `Minutos de Voz IA (${p.minutes} min)` : `Plan ${p.plan.charAt(0).toUpperCase() + p.plan.slice(1)}`}
                      </p>
                      <p style={{ margin: '0.2rem 0 0', color: '#64748B', fontSize: '0.8rem', fontWeight: 500 }}>
                        {new Date(p.created_at).toLocaleDateString()} a las {new Date(p.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontWeight: 900, color: '#0F172A', fontSize: '1.1rem' }}>${p.amount} USD</p>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: p.status === 'approved' ? '#059669' : p.status === 'rejected' ? '#DC2626' : '#D97706' }}>
                      {p.status === 'pending' ? 'En revisión' : p.status === 'approved' ? 'Aprobado' : 'Rechazado'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {payingFor && <PaymentModal plan={payingFor} annual={annual} onClose={() => setPayingFor(null)} />}
        {buyingVoice && <VoiceCreditsModal onClose={() => setBuyingVoice(false)} />}
      </AnimatePresence>
    </div>
  );
};

export default PricingPage;
