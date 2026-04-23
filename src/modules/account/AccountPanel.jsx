import React, { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext';
import {
   X,
   User,
   ShieldCheck,
   CalendarDays,
   UserPlus,
   BarChart3,
   Settings,
   LogOut,
   ChevronRight,
   Building2,
   CheckCircle,
   Smartphone,
   Camera,
   CreditCard
} from 'lucide-react';
import SubscriptionModal from '../subscription/SubscriptionModal';

const AccountPanel = ({ isOpen, onClose, profile, onLogout }) => {
   const navigate = useNavigate();
   const { exchangeRate, clinicName, updateClinicName } = useSettings();
   const [tempClinicName, setTempClinicName] = useState(clinicName);
   const [isUpdating, setIsUpdating] = useState(false);
   const [showSuccess, setShowSuccess] = useState(false);
   const [showSubscription, setShowSubscription] = useState(false);

   const authorizedRoles = ['owner', 'admin', 'administrador', 'secretaria', 'receptionist'];
   const currentRole = profile?.role || 'Administrador';
   const isAuthorized = authorizedRoles.includes(currentRole.toLowerCase());

   useEffect(() => {
      setTempClinicName(clinicName);
   }, [clinicName]);

   const handleUpdateClinic = () => {
      setIsUpdating(true);
      updateClinicName(tempClinicName);
      setTimeout(() => {
         setIsUpdating(false);
         setShowSuccess(true);
         setTimeout(() => setShowSuccess(false), 3000);
      }, 600);
   };

   const quickStats = useMemo(
      () => ({
         plan: 'Plan Pro',
         status: 'Activo',
         bcvRate: 180.23
      }),
      []
   );

   if (!isOpen) return null;

   const initials = profile?.full_name ? profile.full_name.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase() : (profile?.email ? profile.email[0].toUpperCase() : 'AK');
   const displayName = profile?.full_name || 'Admin Khoury';
   const displayEmail = (profile?.email || 'khouryromero@gmail.com').toLowerCase();

   return createPortal(
      <div className="account-panel-root" style={{ position: 'relative', zIndex: 10000 }}>
         {/* Fixed Overlay Backdrop */}
         <div 
            className="fixed inset-0" 
            onClick={onClose} 
            style={{ 
               position: 'fixed',
               inset: 0,
               backgroundColor: 'rgba(15, 23, 42, 0.15)',
               backdropFilter: 'blur(12px)', 
               WebkitBackdropFilter: 'blur(12px)',
               zIndex: 10000,
               transition: 'all 0.3s ease'
            }}
         />
         
         {/* Floating Drawer Container */}
         <div 
            className="flex flex-col overflow-hidden animate-in slide-in-from-right duration-500 cubic-bezier(0.16, 1, 0.3, 1)"
            style={{ 
               position: 'fixed',
               top: '0',
               right: '0',
               bottom: '0',
               width: '440px',
               backgroundColor: '#ffffff',
               borderRadius: '40px 0 0 40px',
               boxShadow: '0 50px 100px -20px rgba(15, 23, 42, 0.2)',
               zIndex: 10001,
               display: 'flex',
               flexDirection: 'column',
               border: '1px solid rgba(255, 255, 255, 0.8)',
               outline: 'none',
            }}
         >
            {/* Header */}
            <div className="flex items-center px-10 pt-8 pb-3">
               <div style={{ flex: 1 }} />
               <h2 style={{ fontSize: '26px', fontWeight: 900, letterSpacing: '-0.03em', color: '#0F172A', margin: 0, textAlign: 'center' }}>
                  Mi cuenta
               </h2>
               <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                     onClick={onClose}
                     style={{ 
                        width: '48px', height: '48px', borderRadius: '50%', 
                        background: '#F8FAFC', color: '#94A3B8', border: 'none', 
                        cursor: 'pointer', display: 'flex', alignItems: 'center', 
                        justifyContent: 'center', transition: 'all 0.2s',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                     }}
                     onMouseOver={e => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#1E293B'; }}
                     onMouseOut={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = '#94A3B8'; }}
                  >
                     <X size={24} strokeWidth={2.5} />
                  </button>
               </div>
            </div>

            {/* Content Scrollable */}
            <div className="flex-1 overflow-y-auto px-10 pb-24 custom-scrollbar">
               
               {/* Profile Section */}
               <div className="flex flex-col items-center mt-2">
                  <div style={{ 
                     width: '90px', height: '90px', borderRadius: '36px', 
                     background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)', 
                     color: '#94A3B8', display: 'flex', alignItems: 'center', 
                     justifyContent: 'center', fontSize: '30px', fontWeight: 900,
                     boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)', marginBottom: '16px',
                     border: '1px solid #F1F5F9'
                  }}>
                     {initials}
                  </div>
                  
                  <h3 style={{ fontSize: '24px', fontWeight: 800, color: '#1E293B', textAlign: 'center', margin: 0, letterSpacing: '-0.02em' }}>
                     {displayName}
                  </h3>
                  
                  <p style={{ fontSize: '15px', color: '#64748B', fontWeight: 500, marginTop: '4px', textAlign: 'center', margin: '4px 0 0 0' }}>
                     {displayEmail}
                  </p>
                  
                  <div style={{ 
                     marginTop: '16px', padding: '6px 18px', borderRadius: '999px', 
                     background: '#F1F5F9', fontSize: '10px', fontWeight: 800, 
                     color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.15em'
                  }}>
                     {currentRole}
                  </div>
               </div>

               {/* Profile Actions */}
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '20px' }}>
                  <button
                     onClick={() => { onClose(); navigate('/settings'); }}
                     style={{ 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        gap: '8px', padding: '18px 0', borderRadius: '24px', 
                        background: '#FFFFFF', color: '#64748B', fontWeight: 700, 
                        fontSize: '14px', border: '1px solid #F1F5F9', cursor: 'pointer',
                        transition: 'all 0.2s'
                     }}
                     onMouseOver={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
                     onMouseOut={e => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.borderColor = '#F1F5F9'; }}
                  >
                     <User size={18} strokeWidth={2.5} />
                     Perfil
                  </button>
                  <button
                     onClick={() => { onClose(); navigate('/settings'); }}
                     style={{ 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        gap: '8px', padding: '18px 0', borderRadius: '24px', 
                        background: '#FFFFFF', color: '#64748B', fontWeight: 700, 
                        fontSize: '14px', border: '1px solid #F1F5F9', cursor: 'pointer',
                        transition: 'all 0.2s'
                     }}
                     onMouseOver={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
                     onMouseOut={e => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.borderColor = '#F1F5F9'; }}
                  >
                     <ShieldCheck size={18} strokeWidth={2.5} />
                     Seguridad
                  </button>

                  {isAuthorized && (
                     <>
                        <button
                           onClick={() => { alert("Próximamente disponible: Cambiar foto"); }}
                           style={{ 
                              display: 'flex', alignItems: 'center', justifyContent: 'center', 
                              gap: '8px', padding: '18px 0', borderRadius: '24px', 
                              background: '#FFFFFF', color: '#64748B', fontWeight: 700, 
                              fontSize: '14px', border: '1px solid #F1F5F9', cursor: 'pointer',
                              transition: 'all 0.2s'
                           }}
                           onMouseOver={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
                           onMouseOut={e => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.borderColor = '#F1F5F9'; }}
                        >
                           <Camera size={18} strokeWidth={2.5} />
                           Cambiar foto
                        </button>
                        <button
                           onClick={() => setShowSubscription(true)}
                           style={{ 
                              display: 'flex', alignItems: 'center', justifyContent: 'center', 
                              gap: '8px', padding: '18px 0', borderRadius: '24px', 
                              background: '#FFFFFF', color: '#64748B', fontWeight: 700, 
                              fontSize: '14px', border: '1px solid #F1F5F9', cursor: 'pointer',
                              transition: 'all 0.2s'
                           }}
                           onMouseOver={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
                           onMouseOut={e => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.borderColor = '#F1F5F9'; }}
                        >
                           <CreditCard size={18} strokeWidth={2.5} />
                           Ver suscripción
                        </button>
                     </>
                  )}
               </div>

               {/* Clinic Configuration */}
               {isAuthorized && (
                  <div style={{ 
                     marginTop: '20px', padding: '20px', borderRadius: '32px', 
                     background: '#F8FAFC', border: '1px solid #F1F5F9'
                  }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '14px', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #F1F5F9' }}>
                           <Building2 size={20} color="#2563EB" />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                           <span style={{ fontSize: '16px', fontWeight: 800, color: '#1E293B' }}>Nombre de la clínica</span>
                           <span style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8' }}>Identidad para mensajes y facturas</span>
                        </div>
                     </div>

                     <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <input 
                           type="text" 
                           value={tempClinicName}
                           onChange={(e) => setTempClinicName(e.target.value)}
                           placeholder="Nombre de tu clínica"
                           style={{ 
                              width: '100%', padding: '16px 20px', borderRadius: '18px', 
                              background: '#FFFFFF', border: '2px solid #F1F5F9', 
                              fontSize: '14px', fontWeight: 700, color: '#1E293B',
                              outline: 'none', transition: 'border-color 0.2s',
                              boxSizing: 'border-box'
                           }}
                        />
                        <button
                           onClick={handleUpdateClinic}
                           disabled={isUpdating}
                           style={{ 
                              width: '100%', padding: '18px 0', borderRadius: '20px', 
                              background: showSuccess ? '#10B981' : '#2563EB', color: '#FFFFFF', 
                              fontWeight: 900, fontSize: '13px', textTransform: 'uppercase', 
                              letterSpacing: '0.1em', border: 'none', cursor: 'pointer',
                              boxShadow: showSuccess ? '0 8px 20px rgba(16,185,129,0.2)' : '0 10px 25px rgba(37,99,235,0.2)',
                              transition: 'all 0.3s ease', display: 'flex', alignItems: 'center',
                              justifyContent: 'center', gap: '8px'
                           }}
                        >
                           {isUpdating ? 'Actualizando...' : showSuccess ? (<><CheckCircle size={14} /> Guardado</>) : 'Actualizar'}
                        </button>

                        <button
                           onClick={onLogout}
                           style={{ 
                              width: 'fit-content', padding: '8px 20px', 
                              borderRadius: '14px', background: 'transparent', color: '#94A3B8', 
                              fontWeight: 800, fontSize: '11px', textTransform: 'uppercase', 
                              letterSpacing: '0.1em', border: 'none', 
                              cursor: 'pointer', transition: 'all 0.2s',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                              alignSelf: 'center', marginTop: '10px'
                           }}
                           onMouseOver={e => { e.currentTarget.style.color = '#E11D48'; e.currentTarget.style.background = '#FFF1F2'; }}
                           onMouseOut={e => { e.currentTarget.style.color = '#94A3B8'; e.currentTarget.style.background = 'transparent'; }}
                        >
                           <LogOut size={13} strokeWidth={2.5} />
                           Cerrar sesión
                        </button>
                     </div>
                  </div>
               )}

               {/* Subscription & Multi-currency */}
               <div style={{ 
                  marginTop: '12px', padding: '24px', borderRadius: '36px', 
                  background: '#FFFFFF', border: '1px solid #F1F5F9',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.02)'
               }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <div>
                        <h4 style={{ fontSize: '18px', fontWeight: 800, color: '#1E293B', margin: 0 }}>Suscripción</h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                           <span style={{ fontSize: '13px', fontWeight: 700, color: '#94A3B8' }}>{quickStats.plan}</span>
                           <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#10B981' }} />
                           <span style={{ fontSize: '12px', fontWeight: 800, color: '#10B981' }}>Activo</span>
                        </div>
                     </div>
                     <div style={{ padding: '8px 16px', background: '#ECFDF5', borderRadius: '12px', fontSize: '11px', fontWeight: 900, color: '#059669', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        PROFESSIONAL
                     </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '24px' }}>
                     <div style={{ padding: '20px', borderRadius: '24px', background: '#F8FAFC', textAlign: 'center' }}>
                        <span style={{ fontSize: '10px', fontWeight: 800, color: '#94A3B8', letterSpacing: '0.1em' }}>TASA $</span>
                        <div style={{ fontSize: '18px', fontWeight: 900, color: '#0F172A', marginTop: '4px' }}>
                           {Number(exchangeRate || 0).toFixed(2)}
                        </div>
                     </div>
                     <div style={{ padding: '20px', borderRadius: '24px', background: '#F8FAFC', textAlign: 'center' }}>
                        <span style={{ fontSize: '10px', fontWeight: 800, color: '#94A3B8', letterSpacing: '0.1em' }}>BCV RATE</span>
                        <div style={{ fontSize: '18px', fontWeight: 900, color: '#0F172A', marginTop: '4px' }}>
                           {quickStats.bcvRate.toFixed(2)}
                        </div>
                     </div>
                  </div>
               </div>

               {/* Quick Shortcuts */}
               <div style={{ marginTop: '28px' }}>
                  <h4 style={{ fontSize: '11px', fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '20px', paddingLeft: '8px' }}>
                     Accesos Directos
                  </h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                     {[
                        { icon: <CalendarDays size={20} />, label: 'Citas', path: '/scheduler' },
                        { icon: <UserPlus size={20} />, label: 'Facturar', path: '/finance' },
                        { icon: <Settings size={20} />, label: 'Ajustes', path: '/settings' }
                     ].map((item, idx) => (
                        <div 
                           key={idx}
                           onClick={() => { onClose(); navigate(item.path); }}
                           style={{ 
                              padding: '24px 12px', borderRadius: '28px', background: '#FFFFFF', 
                              border: '1px solid #F1F5F9', display: 'flex', flexDirection: 'column', 
                              alignItems: 'center', gap: '12px', cursor: 'pointer', transition: 'all 0.2s',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
                           }}
                           onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.06)'; }}
                           onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.02)'; }}
                        >
                           <div style={{ width: '40px', height: '40px', borderRadius: '14px', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>
                              {item.icon}
                           </div>
                           <span style={{ fontSize: '12px', fontWeight: 800, color: '#334155' }}>{item.label}</span>
                        </div>
                     ))}
                  </div>
               </div>

               {/* Extra Info */}
               <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', background: '#F8FAFC', borderRadius: '24px', border: '1px solid #F1F5F9' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                     <span style={{ fontSize: '10px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>Sesión activa</span>
                     <span style={{ fontSize: '12px', fontWeight: 700, color: '#1E293B' }}>{profile?.email}</span>
                  </div>
                  <div style={{ padding: '6px 12px', background: '#FFFFFF', borderRadius: '10px', fontSize: '10px', fontWeight: 900, color: '#10B981', border: '1px solid #F1F5F9' }}>
                     ONLINE
                  </div>
               </div>
            </div>
         </div>
         
         <SubscriptionModal 
            isOpen={showSubscription}
            onClose={() => setShowSubscription(false)}
         />
      </div>,
      document.body
   );
};

export default AccountPanel;