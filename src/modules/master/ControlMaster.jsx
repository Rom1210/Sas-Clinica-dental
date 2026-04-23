import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext';
import { useData } from '../../context/DataContext';
import {
   ClipboardList, RefreshCw, Plus,
   Trash2, Briefcase, Edit2, AlertTriangle,
   UserPlus, ChevronRight, DollarSign, Shield, Zap
} from 'lucide-react';

const ControlMaster = () => {
   const navigate = useNavigate();
   const { exchangeRate, updateExchangeRate } = useSettings();
   const { 
      services, removeService, 
      doctors, removeDoctor,
      paymentMethods, addPaymentMethod, updatePaymentMethod, removePaymentMethod 
   } = useData();
   const [tempRate, setTempRate] = useState(exchangeRate);
   const [deleteConfirm, setDeleteConfirm] = useState(null);
   const [rateSaved, setRateSaved] = useState(false);
   const [fetchingRate, setFetchingRate] = useState(false);
   const [lastUpdate, setLastUpdate] = useState(localStorage.getItem('rateLastUpdate') || null);
   const [rateSource, setRateSource] = useState(localStorage.getItem('rateSource') || null);
   const [fetchError, setFetchError] = useState(false);
   const [showMethodModal, setShowMethodModal] = useState(false);
   const [newMethod, setNewMethod] = useState({ name: '', type: 'other' });

   const fetchLiveRate = useCallback(async () => {
      setFetchingRate(true);
      setFetchError(false);
      try {
         // Try BCV official rate from Venezuelan API
         const res = await fetch('https://ve.dolarapi.com/v1/dolares/oficial');
         const data = await res.json();
         const rate = parseFloat(data.promedio);
         if (!isNaN(rate) && rate > 0) {
            setTempRate(rate);
            updateExchangeRate(rate);
            const now = new Date().toLocaleString('es-VE', { dateStyle: 'short', timeStyle: 'short' });
            setLastUpdate(now);
            setRateSource('BCV Oficial');
            localStorage.setItem('rateLastUpdate', now);
            localStorage.setItem('rateSource', 'BCV Oficial');
            localStorage.setItem('rateLastFetchTime', Date.now().toString());
            setRateSaved(true);
            setTimeout(() => setRateSaved(false), 2500);
            return;
         }
      } catch (_) {}
      // Fallback: open.er-api.com
      try {
         const res = await fetch('https://open.er-api.com/v6/latest/USD');
         const data = await res.json();
         const rate = parseFloat(data.rates?.VES);
         if (!isNaN(rate) && rate > 0) {
            setTempRate(rate);
            updateExchangeRate(rate);
            const now = new Date().toLocaleString('es-VE', { dateStyle: 'short', timeStyle: 'short' });
            setLastUpdate(now);
            setRateSource('Open Exchange');
            localStorage.setItem('rateLastUpdate', now);
            localStorage.setItem('rateSource', 'Open Exchange');
            localStorage.setItem('rateLastFetchTime', Date.now().toString());
            setRateSaved(true);
            setTimeout(() => setRateSaved(false), 2500);
            return;
         }
      } catch (_) {}
      setFetchError(true);
      setFetchingRate(false);
   }, [updateExchangeRate]);

   // Auto-fetch on mount if last fetch was more than 3 hours ago
   useEffect(() => {
      const lastFetch = parseInt(localStorage.getItem('rateLastFetchTime') || '0');
      const threeHours = 3 * 60 * 60 * 1000;
      if (Date.now() - lastFetch > threeHours) {
         fetchLiveRate();
      }
   }, [fetchLiveRate]);

   useEffect(() => {
      setTempRate(exchangeRate);
   }, [exchangeRate]);

   const handleDelete = () => {
      if (deleteConfirm.type === 'service') {
         removeService(deleteConfirm.id);
      } else {
         removeDoctor(deleteConfirm.id);
      }
      setDeleteConfirm(null);
   };

   const handleSaveRate = () => {
      updateExchangeRate(parseFloat(tempRate));
      setRateSaved(true);
      setTimeout(() => setRateSaved(false), 2000);
   };

   return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '4rem' }}>

         {/* Top config row */}
         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>

            {/* Exchange Rate Card */}
            <div style={{
               background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
               borderRadius: '1.5rem',
               padding: '1.5rem',
               position: 'relative',
               overflow: 'hidden',
               display: 'flex',
               flexDirection: 'column',
               gap: '1rem'
            }}>
               <div style={{ position: 'absolute', top: -20, right: -20, opacity: 0.05 }}>
                  <DollarSign size={120} color="white" />
               </div>

               {/* Header */}
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                     <div style={{ padding: '0.5rem', background: 'rgba(37,99,235,0.3)', borderRadius: '0.75rem', display: 'flex' }}>
                        <RefreshCw size={16} color="#60A5FA" className={fetchingRate ? 'animate-spin' : ''} style={{ animation: fetchingRate ? 'spin 1s linear infinite' : 'none' }} />
                     </div>
                     <div>
                        <p style={{ fontSize: '0.65rem', fontWeight: 800, color: '#60A5FA', textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0 }}>Tasa de Cambio</p>
                        <p style={{ fontSize: '0.8rem', fontWeight: 800, color: '#F1F5F9', margin: 0 }}>VES por 1 USD</p>
                     </div>
                  </div>
                  {/* Live fetch button */}
                  <button
                     onClick={fetchLiveRate}
                     disabled={fetchingRate}
                     style={{
                        display: 'flex', alignItems: 'center', gap: '0.375rem',
                        padding: '0.375rem 0.75rem',
                        background: fetchingRate ? 'rgba(255,255,255,0.05)' : 'rgba(16,185,129,0.2)',
                        border: '1px solid rgba(16,185,129,0.3)',
                        borderRadius: '999px', cursor: fetchingRate ? 'default' : 'pointer',
                        color: '#34d399', fontSize: '0.65rem', fontWeight: 800,
                        textTransform: 'uppercase', letterSpacing: '0.06em',
                        transition: 'all 0.2s'
                     }}
                  >
                     <Zap size={10} fill="#34d399" />
                     {fetchingRate ? 'Buscando...' : 'Live BCV'}
                  </button>
               </div>

               {/* Rate input row */}
               <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                     type="number"
                     step="0.01"
                     style={{
                        flex: 1, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '0.875rem', padding: '0.625rem 1rem',
                        fontSize: '1.25rem', fontWeight: 900, color: '#F8FAFC',
                        outline: 'none', width: '100%'
                     }}
                     value={tempRate}
                     onChange={(e) => setTempRate(e.target.value)}
                  />
                  <button
                     onClick={handleSaveRate}
                     style={{
                        padding: '0.625rem 1.25rem',
                        background: rateSaved ? '#10b981' : '#2563EB',
                        color: '#fff', fontSize: '0.7rem', fontWeight: 800,
                        textTransform: 'uppercase', letterSpacing: '0.08em',
                        borderRadius: '0.875rem', border: 'none', cursor: 'pointer',
                        whiteSpace: 'nowrap', transition: 'all 0.3s'
                     }}
                  >
                     {rateSaved ? '✓ Guardado' : 'Aplicar'}
                  </button>
               </div>

               {/* Status footer */}
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {fetchError ? (
                     <p style={{ fontSize: '0.65rem', color: '#f87171', margin: 0 }}>⚠ No se pudo conectar a la API. Edita manualmente.</p>
                  ) : lastUpdate ? (
                     <p style={{ fontSize: '0.65rem', color: '#475569', margin: 0 }}>
                        Actualizado: <span style={{ color: '#64748b', fontWeight: 700 }}>{lastUpdate}</span>
                     </p>
                  ) : (
                     <p style={{ fontSize: '0.65rem', color: '#475569', margin: 0 }}>Afecta todos los presupuestos en tiempo real.</p>
                  )}
                  {rateSource && !fetchError && (
                     <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#34d399', background: 'rgba(16,185,129,0.1)', padding: '0.125rem 0.5rem', borderRadius: '999px', border: '1px solid rgba(16,185,129,0.2)' }}>
                        {rateSource}
                     </span>
                  )}
               </div>
            </div>


            {/* Security & Team Card */}
            <div style={{
               background: '#ffffff', borderRadius: '1.5rem', padding: '1.5rem',
               border: '1px solid #f1f5f9',
               boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
               display: 'flex', flexDirection: 'column', gap: '0.875rem'
            }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <Shield size={16} color="#10b981" />
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Seguridad y Equipo</span>
               </div>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Versión SmartDental</span>
                  <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#0f172a', background: '#f8fafc', padding: '0.2rem 0.625rem', borderRadius: '999px', border: '1px solid #e2e8f0' }}>2.1 Elite</span>
               </div>
               <button
                  onClick={() => navigate('/settings/team')}
                  style={{
                     display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                     padding: '0.875rem 1rem', background: '#f8fafc',
                     borderRadius: '1rem', border: '1px solid #f1f5f9',
                     cursor: 'pointer', transition: 'all 0.2s', width: '100%', textAlign: 'left'
                  }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = '#2563EB'; e.currentTarget.style.background = '#eff6ff'; }}
                  onMouseOut={e => { e.currentTarget.style.borderColor = '#f1f5f9'; e.currentTarget.style.background = '#f8fafc'; }}
               >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                     <div style={{ padding: '0.5rem', background: '#eff6ff', borderRadius: '0.625rem', display: 'flex' }}>
                        <UserPlus size={14} color="#2563EB" />
                     </div>
                     <div>
                        <p style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Gestionar Equipo</p>
                        <p style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600, margin: 0 }}>Invitaciones y Roles</p>
                     </div>
                  </div>
                  <ChevronRight size={14} color="#cbd5e1" />
               </button>
            </div>
         </div>

         {/* Bottom grid: Doctors + Services */}
         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>

            {/* Doctors Card */}
            <div style={{ background: '#fff', borderRadius: '1.5rem', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
               <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                     <Briefcase size={15} color="#2563EB" />
                     <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Equipo Médico</span>
                  </div>
                  <button
                     onClick={() => navigate('/settings/new-doctor')}
                     style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.375rem 0.75rem', background: '#eff6ff', borderRadius: '999px', border: 'none', cursor: 'pointer', color: '#2563EB', fontSize: '0.7rem', fontWeight: 700 }}
                  >
                     <Plus size={12} /> Añadir
                  </button>
               </div>
               <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {doctors?.map(doc => (
                     <div key={doc.id} className="group hover:bg-white hover:border-primary/20 hover:shadow-lg hover:-translate-y-0.5 hover:shadow-slate-200/50" style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '0.75rem 1rem', background: '#fafafa',
                        borderRadius: '1rem', border: '1px solid #f1f5f9',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                     }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                           <div style={{
                              width: 36, height: 36, borderRadius: '0.75rem',
                              background: doc.color || '#3b82f6',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              flexShrink: 0
                           }}>
                              <span style={{ color: '#fff', fontSize: '0.65rem', fontWeight: 900 }}>
                                 {doc.name ? doc.name.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase() : 'DR'}
                              </span>
                           </div>
                           <div>
                              <p style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>{doc.name}</p>
                              <span style={{
                                 fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em',
                                 padding: '0.125rem 0.5rem', borderRadius: '4px',
                                 background: doc.isSpecialist ? '#eef2ff' : '#f1f5f9',
                                 color: doc.isSpecialist ? '#4f46e5' : '#64748b'
                              }}>
                                 {doc.isSpecialist ? 'Especialista' : 'Gral'}
                              </span>
                           </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                           <span style={{
                              fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em',
                              padding: '0.25rem 0.625rem', borderRadius: '999px',
                              background: ['active', 'Activo'].includes(doc.status) ? '#ecfdf5' : '#f8fafc',
                              color: ['active', 'Activo'].includes(doc.status) ? '#059669' : '#94a3b8',
                              border: `1px solid ${['active', 'Activo'].includes(doc.status) ? '#d1fae5' : '#e2e8f0'}`
                           }}>
                              {['active', 'Activo'].includes(doc.status) ? 'Activo' : doc.status}
                           </span>
                           <button onClick={() => navigate(`/settings/edit-doctor/${doc.id}`)} style={{ padding: '0.375rem', background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', borderRadius: '0.5rem' }}>
                              <Edit2 size={13} />
                           </button>
                           <button onClick={() => setDeleteConfirm({ id: doc.id, type: 'doctor', name: doc.name })} style={{ padding: '0.375rem', background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', borderRadius: '0.5rem' }}>
                              <Trash2 size={13} />
                           </button>
                        </div>
                     </div>
                  ))}
               </div>
            </div>

            {/* Services Card */}
            <div style={{ background: '#fff', borderRadius: '1.5rem', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
               <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                     <ClipboardList size={15} color="#2563EB" />
                     <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Catálogo de Servicios</span>
                  </div>
                  <button
                     onClick={() => navigate('/settings/new-service')}
                     style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.375rem 0.75rem', background: '#eff6ff', borderRadius: '999px', border: 'none', cursor: 'pointer', color: '#2563EB', fontSize: '0.7rem', fontWeight: 700 }}
                  >
                     <Plus size={12} /> Añadir
                  </button>
               </div>
               <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {services?.map(ser => (
                     <div key={ser.id} className="group hover:bg-white hover:border-primary/20 hover:shadow-lg hover:-translate-y-0.5 hover:shadow-slate-200/50" style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '0.75rem 1rem', background: '#fafafa',
                        borderRadius: '1rem', border: '1px solid #f1f5f9',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                     }}>
                        <div>
                           <p style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>{ser.name}</p>
                           <p style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600, margin: 0, marginTop: 2 }}>Por unidad</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                           <span style={{ fontSize: '0.8rem', fontWeight: 900, color: '#2563EB', background: '#eff6ff', padding: '0.25rem 0.75rem', borderRadius: '999px', border: '1px solid #dbeafe' }}>
                              ${ser.price}
                           </span>
                           <button onClick={() => navigate(`/settings/edit-service/${ser.id}`)} style={{ padding: '0.375rem', background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', borderRadius: '0.5rem' }}>
                              <Edit2 size={13} />
                           </button>
                           <button onClick={() => setDeleteConfirm({ id: ser.id, type: 'service', name: ser.name })} style={{ padding: '0.375rem', background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', borderRadius: '0.5rem' }}>
                              <Trash2 size={13} />
                           </button>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         </div>
         
         {/* Payment Methods Row */}
         <div style={{ background: '#fff', borderRadius: '1.5rem', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', overflow: 'hidden', marginTop: '1rem' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <DollarSign size={15} color="#2563EB" />
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Vías de Cobro (Vzla 2026)</span>
               </div>
               <button
                  onClick={() => setShowMethodModal(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.375rem 0.75rem', background: '#eff6ff', borderRadius: '999px', border: 'none', cursor: 'pointer', color: '#2563EB', fontSize: '0.7rem', fontWeight: 700 }}
               >
                  <Plus size={12} /> Añadir Vía
               </button>
            </div>
            <div style={{ padding: '0.75rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
               {paymentMethods?.slice().sort((a, b) => {
                  const priorities = { 'Efectivo': 1, 'Zelle': 2, 'Transferencia': 3, 'Pago Móvil': 4 };
                  const pa = priorities[a.name] || 99;
                  const pb = priorities[b.name] || 99;
                  if (pa !== pb) return pa - pb;
                  return a.name.localeCompare(b.name);
               }).map(method => (
                  <div key={method.id} style={{
                     display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                     padding: '0.75rem 1rem', background: '#fafafa',
                     borderRadius: '1rem', border: '1px solid #f1f5f9',
                  }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                           width: 32, height: 32, borderRadius: '0.5rem',
                           background: method.is_active ? '#eff6ff' : '#f1f5f9',
                           display: 'flex', alignItems: 'center', justifySelf: 'center',
                           display: 'flex', alignItems: 'center', justifyContent: 'center',
                           color: method.is_active ? '#2563EB' : '#94a3b8'
                        }}>
                           <DollarSign size={14} />
                        </div>
                        <div>
                           <p style={{ fontSize: '0.75rem', fontWeight: 800, color: method.is_active ? '#0f172a' : '#94a3b8', margin: 0 }}>{method.name}</p>
                           <p style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 600, margin: 0, textTransform: 'uppercase' }}>
                              {method.type === 'cash' ? 'Efectivo' : method.type === 'transfer' ? 'Transferencia' : 'Otro'}
                           </p>
                        </div>
                     </div>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button 
                           onClick={() => updatePaymentMethod(method.id, { is_active: !method.is_active })}
                           style={{
                              fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase',
                              padding: '0.25rem 0.625rem', borderRadius: '999px',
                              background: method.is_active ? '#ecfdf5' : '#f1f5f9',
                              color: method.is_active ? '#059669' : '#64748b',
                              border: 'none', cursor: 'pointer'
                           }}
                        >
                           {method.is_active ? 'Activo' : 'Pausado'}
                        </button>
                        <button onClick={() => removePaymentMethod(method.id)} style={{ padding: '0.375rem', background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                           <Trash2 size={13} />
                        </button>
                     </div>
                  </div>
               ))}
            </div>
         </div>

         {/* New Payment Method Modal */}
         {showMethodModal && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
               <div style={{ background: '#fff', borderRadius: '1.5rem', padding: '2rem', maxWidth: '400px', width: '100%', boxShadow: '0 25px 60px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <h3 style={{ fontSize: '1rem', fontWeight: 900, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '-0.02em', margin: 0 }}>Añadir Método de Pago</h3>
                     <button onClick={() => setShowMethodModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><Plus size={20} style={{ transform: 'rotate(45deg)' }} /></button>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                     <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Nombre del Método</label>
                     <input 
                        type="text" 
                        placeholder="Ej: Binance, Cashea, Zinli..." 
                        style={{ padding: '0.75rem 1rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', outline: 'none', fontSize: '0.875rem' }}
                        value={newMethod.name}
                        onChange={(e) => setNewMethod({ ...newMethod, name: e.target.value })}
                     />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                     <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Categoría</label>
                     <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                        {[
                           { id: 'cash', label: 'Efectivo' },
                           { id: 'transfer', label: 'Transf.' },
                           { id: 'other', label: 'Otro' }
                        ].map(t => (
                           <button
                              key={t.id}
                              onClick={() => setNewMethod({ ...newMethod, type: t.id })}
                              style={{
                                 padding: '0.625rem', borderRadius: '0.625rem', border: '1px solid',
                                 borderColor: newMethod.type === t.id ? '#2563EB' : '#e2e8f0',
                                 background: newMethod.type === t.id ? '#eff6ff' : '#fff',
                                 color: newMethod.type === t.id ? '#2563EB' : '#64748b',
                                 fontSize: '0.65rem', fontWeight: 800, cursor: 'pointer'
                              }}
                           >
                              {t.label}
                           </button>
                        ))}
                     </div>
                  </div>

                  <button 
                     onClick={async () => {
                        if (newMethod.name) {
                           await addPaymentMethod(newMethod);
                           setNewMethod({ name: '', type: 'other' });
                           setShowMethodModal(false);
                        }
                     }}
                     style={{ padding: '1rem', background: '#2563EB', color: '#fff', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', borderRadius: '1rem', border: 'none', cursor: 'pointer', marginTop: '0.5rem' }}
                  >
                     Confirmar y Guardar
                  </button>
               </div>
            </div>
         )}

         {/* Delete Confirm Modal */}
         {deleteConfirm && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
               <div style={{ background: '#fff', borderRadius: '1.5rem', padding: '2rem', maxWidth: '360px', width: '100%', boxShadow: '0 25px 60px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fff1f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                     <AlertTriangle size={28} color="#f43f5e" />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                     <h3 style={{ fontSize: '1rem', fontWeight: 900, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '-0.02em', margin: '0 0 0.5rem' }}>
                        ¿Eliminar {deleteConfirm.type === 'service' ? 'Servicio' : 'Especialista'}?
                     </h3>
                     <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
                        Estás a punto de eliminar <b style={{ color: '#0f172a' }}>{deleteConfirm.name}</b> de forma permanente.
                     </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.625rem', width: '100%' }}>
                     <button onClick={() => setDeleteConfirm(null)} style={{ flex: 1, padding: '0.875rem', background: '#f8fafc', color: '#64748b', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', borderRadius: '1rem', border: '1px solid #e2e8f0', cursor: 'pointer' }}>
                        Cancelar
                     </button>
                     <button onClick={handleDelete} style={{ flex: 1, padding: '0.875rem', background: '#f43f5e', color: '#fff', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', borderRadius: '1rem', border: 'none', cursor: 'pointer' }}>
                        Eliminar
                     </button>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

export default ControlMaster;
