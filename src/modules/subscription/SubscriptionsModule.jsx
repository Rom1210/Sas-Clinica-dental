import React from 'react';
import { usePlan } from '../../context/SubscriptionContext';
import PendingPaymentsPanel from './PendingPaymentsPanel';
import { CreditCard, Crown, Star, Zap, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const SubscriptionsModule = () => {
   const { pendingCount, subscription, effectivePlan, isTrialActive, trialDaysLeft, voiceMinutesLeft, voiceTotalCapacity } = usePlan();
   const navigate = useNavigate();

   return (
      <div className="p-8 max-w-6xl mx-auto flex flex-col gap-8 animate-in fade-in duration-300">
         <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-2">Planes y Pagos</h1>
            <p className="text-slate-500 font-medium">Administra las suscripciones de los pacientes y los pagos de la plataforma.</p>
         </div>

         {/* Current Plan Overview (for the clinic) */}
         <div className="bg-white/80 backdrop-blur-md p-6 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-white/80 flex items-center justify-between flex-wrap gap-4 transition-all hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)]"
              style={{ borderRadius: '2.5rem' }}>
            <div className="flex items-center gap-5 pl-2">
               <div className={`w-14 h-14 flex items-center justify-center shadow-inner ${
                  effectivePlan === 'elite' ? 'bg-purple-100 text-purple-600' :
                  effectivePlan === 'pro' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'
               }`} style={{ borderRadius: '1.25rem' }}>
                  {effectivePlan === 'elite' ? <Crown size={28} /> : effectivePlan === 'pro' ? <Zap size={28} /> : <Star size={28} />}
               </div>
               <div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1" style={{ letterSpacing: '0.15em' }}>Plan Actual</p>
                  <h2 className="text-2xl font-black text-slate-800 capitalize tracking-tight">
                     {effectivePlan === 'basic' && isTrialActive ? 'Trial Elite' : effectivePlan}
                  </h2>
               </div>
            </div>
            <div className="flex items-center gap-4 pr-2">
               {isTrialActive && (
                  <div className="bg-amber-50 border border-amber-200 text-amber-700 px-5 py-2.5 font-bold shadow-sm" style={{ borderRadius: '1rem', fontSize: '13px' }}>
                     {trialDaysLeft} días de prueba restantes
                  </div>
               )}
               <button onClick={() => navigate('/precios')} className="bg-slate-900 text-white px-6 py-3 font-black uppercase cursor-pointer hover:bg-primary transition-all shadow-[0_4px_15px_rgba(15,23,42,0.15)] hover:-translate-y-1 hover:shadow-[0_10px_25px_rgba(37,99,235,0.25)] border-none" style={{ borderRadius: '1.25rem', fontSize: '11px', letterSpacing: '0.1em' }}>
                  Cambiar Plan
               </button>
            </div>
         </div>

         {/* Subscriptions Admin Area */}
         <div className="bg-white/80 backdrop-blur-md p-8 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-white/80 transition-all hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)]"
              style={{ borderRadius: '2.5rem' }}>
            <div className="flex items-center gap-4 mb-6 pl-2">
               <div className="w-12 h-12 bg-amber-50 flex items-center justify-center text-amber-600 shadow-inner" style={{ borderRadius: '1.25rem' }}>
                  <CreditCard size={24} />
               </div>
               <div style={{ flex: 1 }}>
                  <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight">Autorización de Pagos</h3>
                  <p className="text-sm text-slate-500 font-medium mt-0.5">Revisa y aprueba los comprobantes de pago subidos por los usuarios.</p>
               </div>
               {pendingCount > 0 && (
                  <div className="bg-rose-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shadow-md shadow-rose-500/30">
                     {pendingCount}
                  </div>
               )}
            </div>
            
            <div className="bg-slate-50/50 backdrop-blur-sm p-6 border border-white shadow-inner" style={{ borderRadius: '2rem' }}>
               <PendingPaymentsPanel />
            </div>
         </div>

         {/* Pay-as-you-go voice section (Admin overview & Quick Buy) */}
         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="w-full"
            style={{ background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)', borderRadius: '2.5rem', padding: '2rem', display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap', boxShadow: '0 20px 60px rgba(109,40,217,0.3)' }}>
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
               <button onClick={() => navigate('/precios')}
                  style={{ padding: '0.75rem 1.5rem', background: 'linear-gradient(135deg, #7C3AED, #5B21B6)', color: '#fff', border: 'none', borderRadius: '1rem', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 16px rgba(124,58,237,0.5)', fontSize: '0.875rem' }}>
                  <Sparkles size={16} /> Comprar minutos
               </button>
            </div>
         </motion.div>
      </div>
   );
};

export default SubscriptionsModule;
