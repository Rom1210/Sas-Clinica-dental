/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const SubscriptionContext = createContext();

export const usePlan = () => useContext(SubscriptionContext);

// Feature gates per plan
const PLAN_FEATURES = {
  basic:  { aiText: false, aiVoice: false, maxPatients: 50, maxUsers: 1 },
  pro:    { aiText: true,  aiVoice: false, maxPatients: Infinity, maxUsers: 3 },
  elite:  { aiText: true,  aiVoice: true,  maxPatients: Infinity, maxUsers: Infinity },
  trial:  { aiText: true,  aiVoice: true,  maxPatients: Infinity, maxUsers: Infinity }, // full access during trial
};

export const SubscriptionProvider = ({ children }) => {
  const { user, activeOrgId } = useAuth();
  const [subscription, setSubscription]       = useState(null);
  const [paymentHistory, setPaymentHistory]   = useState([]);
  const [loading, setLoading]                 = useState(true);

  // ── Load subscription ───────────────────────────────
  const loadSubscription = useCallback(async () => {
    if (!activeOrgId) return;
    const { data } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('organization_id', activeOrgId)
      .maybeSingle();

    if (!data) {
      // First-time: create a 15-day trial
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 15);
      const { data: created } = await supabase
        .from('subscriptions')
        .insert({
          organization_id: activeOrgId,
          plan: 'basic',
          status: 'trial',
          trial_ends_at: trialEnd.toISOString(),
          voice_minutes_remaining: 0,
        })
        .select()
        .single();
      setSubscription(created);
    } else {
      setSubscription(data);
    }
    setLoading(false);
  }, [activeOrgId]);

  // ── Load payment history (user/admin) ───────────────
  const loadPaymentHistory = useCallback(async () => {
    if (!activeOrgId) return;
    const { data } = await supabase
      .from('payment_requests')
      .select('*')
      .eq('organization_id', activeOrgId)
      .order('created_at', { ascending: false });
    setPaymentHistory(data || []);
  }, [activeOrgId]);

  useEffect(() => {
    if (user && activeOrgId) {
      loadSubscription();
      loadPaymentHistory();
    }
  }, [user, activeOrgId, loadSubscription, loadPaymentHistory]);

  // ── Real-time updates ───────────────────────────────
  useEffect(() => {
    if (!activeOrgId) return;
    const channel = supabase
      .channel('subscription_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subscriptions', filter: `organization_id=eq.${activeOrgId}` },
        () => loadSubscription())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payment_requests', filter: `organization_id=eq.${activeOrgId}` },
        () => loadPaymentHistory())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [activeOrgId, loadSubscription, loadPaymentHistory]);

  // ── Computed values ─────────────────────────────────
  const isTrialActive = subscription?.status === 'trial' && subscription?.trial_ends_at
    ? new Date(subscription.trial_ends_at) > new Date()
    : false;

  const trialDaysLeft = isTrialActive
    ? Math.max(0, Math.ceil((new Date(subscription.trial_ends_at) - new Date()) / (1000 * 60 * 60 * 24)))
    : 0;

  const pendingPayments = paymentHistory.filter(p => p.status === 'pending');
  const effectivePlan = isTrialActive ? 'trial' : (subscription?.status === 'active' ? subscription?.plan : 'basic');
  const features      = PLAN_FEATURES[effectivePlan] || PLAN_FEATURES.basic;
  
  const voiceTotalCapacity = isTrialActive && effectivePlan === 'trial' ? 5 : (effectivePlan === 'elite' ? 30 : 0) + 
      paymentHistory.filter(p => p.plan === 'voice_credits' && p.status === 'approved').reduce((acc, curr) => acc + (curr.minutes || 0), 0) || 5;

  // ── Submit payment request ──────────────────────────
  const submitPaymentRequest = async ({ plan, amount, currency, method, screenshotFile }) => {
    let screenshot_url = null;
    if (screenshotFile) {
      const ext  = screenshotFile.name.split('.').pop();
      const path = `payment-proofs/${activeOrgId}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(path, screenshotFile, { upsert: true });
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('media').getPublicUrl(path);
        screenshot_url = urlData.publicUrl;
      }
    }

    const { data, error } = await supabase.from('payment_requests').insert({
      organization_id: activeOrgId,
      requested_by: user.id,
      plan,
      amount,
      currency,
      method,
      screenshot_url,
      status: 'pending',
    }).select().single();

    if (error) throw error;
    loadPendingPayments();
    return data;
  };

  const approvePayment = async (paymentId) => {
    const payment = pendingPayments.find(p => p.id === paymentId);
    if (!payment) return;

    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    // Update subscription
    await supabase.from('subscriptions').upsert({
      organization_id: activeOrgId,
      plan: payment.plan,
      status: 'active',
      current_period_end: periodEnd.toISOString(),
      voice_minutes_remaining: payment.plan === 'elite' ? 30 : (subscription?.voice_minutes_remaining || 0),
    }, { onConflict: 'organization_id' });

    // Mark payment as approved
    await supabase.from('payment_requests').update({
      status: 'approved',
      reviewed_at: new Date().toISOString(),
    }).eq('id', paymentId);

    loadSubscription();
    loadPaymentHistory();
  };

  // ── Admin: reject payment ───────────────────────────
  const rejectPayment = async (paymentId, reason) => {
    await supabase.from('payment_requests').update({
      status: 'rejected',
      rejection_reason: reason,
      reviewed_at: new Date().toISOString(),
    }).eq('id', paymentId);
    loadPaymentHistory();
  };

  // ── Admin: buy voice credits (manual) ──────────────
  const addVoiceCredits = async (minutes) => {
    await supabase.from('subscriptions').update({
      voice_minutes_remaining: (subscription?.voice_minutes_remaining || 0) + minutes,
    }).eq('organization_id', activeOrgId);
    loadSubscription();
  };

  // ── Consume voice minute ────────────────────────────
  const consumeVoiceMinute = async () => {
    if (!subscription || subscription.voice_minutes_remaining <= 0) return false;
    await supabase.from('subscriptions').update({
      voice_minutes_remaining: subscription.voice_minutes_remaining - 1,
    }).eq('organization_id', activeOrgId);
    setSubscription(prev => ({ ...prev, voice_minutes_remaining: prev.voice_minutes_remaining - 1 }));
    return true;
  };

  return (
    <SubscriptionContext.Provider value={{
      subscription, loading,
      isTrialActive, trialDaysLeft, effectivePlan, features,
      pendingPayments, pendingCount: pendingPayments.length,
      paymentHistory,
      canUseAI:    features.aiText || (subscription?.voice_minutes_remaining > 0),
      canUseVoice: features.aiVoice || (subscription?.voice_minutes_remaining > 0),
      voiceMinutesLeft: subscription?.voice_minutes_remaining || 0,
      voiceTotalCapacity,
      submitPaymentRequest, approvePayment, rejectPayment,
      addVoiceCredits, consumeVoiceMinute,
      reload: loadSubscription,
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export default SubscriptionProvider;
