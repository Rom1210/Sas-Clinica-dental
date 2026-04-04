import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { 
   X, 
   CheckCircle2, 
   Upload, 
   Building2, 
   Phone, 
   User, 
   CreditCard,
   ArrowRight,
   Gem,
   Clock,
   ExternalLink
} from 'lucide-react';

import { useSettings } from '../../context/SettingsContext';

const SubscriptionModal = ({ isOpen, onClose }) => {
   const navigate = useNavigate();
   const { formatPrice } = useSettings();
   const [file, setFile] = useState(null);
   const [status, setStatus] = useState('idle'); // idle | uploading | success

   if (!isOpen) return null;

   const handleFileChange = (e) => {
      const selectedFile = e.target.files[0];
      if (selectedFile) {
         setFile(selectedFile);
      }
   };

   const handleSubmit = () => {
      if (!file) return;
      setStatus('uploading');
      // Simulate upload
      setTimeout(() => {
         setStatus('success');
         setTimeout(() => {
            setStatus('idle');
            setFile(null);
            onClose();
         }, 3000);
      }, 1500);
   };

   const bankDetails = [
      { name: 'Venezuela', icon: '🇻🇪' },
      { name: 'Banesco', icon: '🏦' },
      { name: 'Bancamiga', icon: '💳' }
   ];

   return createPortal(
      <div 
         className="fixed inset-0 z-[20000] flex items-center justify-center p-4"
         style={{ position: 'fixed', inset: 0, zIndex: 20000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
      >
         <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
            onClick={onClose}
            style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(12px)' }}
         />
         
         <div 
            className="relative w-full max-w-[460px] bg-white rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300"
            style={{ position: 'relative', width: '100%', maxWidth: '460px', backgroundColor: '#ffffff', borderRadius: '40px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden' }}
         >
            {/* Header / Banner */}
            <div style={{ background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)', padding: '16px 32px', position: 'relative', overflow: 'hidden' }}>
               <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '120px', height: '120px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
               
               <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <div style={{ padding: '6px 12px', borderRadius: '10px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '8px', color: '#FCD34D' }}>
                        <Gem size={14} />
                        <span style={{ fontSize: '10px', fontWeight: 900, color: '#FFFFFF', letterSpacing: '0.05em' }}>PRO PLAN</span>
                     </div>
                     <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#94A3B8' }}>
                        <X size={16} />
                     </button>
                  </div>
                  
                  <h2 style={{ fontSize: '18px', fontWeight: 900, color: '#FFFFFF', marginTop: '12px', marginBottom: '4px', letterSpacing: '-0.02em' }}>Suscripción Profesional</h2>
               </div>
            </div>

            {/* Body */}
            <div style={{ padding: '20px 32px 24px 32px' }}>
               
               {/* Pricing Section */}
               <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '16px' }}>
                  <span style={{ fontSize: '26px', fontWeight: 900, color: '#1E293B' }}>25$</span>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>/ mes • Tasa Euro</span>
               </div>

               {/* Bank Info Cards */}
               <div style={{ background: '#F8FAFC', borderRadius: '24px', padding: '16px', border: '1px solid #F1F5F9', marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '10px', fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '12px' }}>Datos de Pago Móvil</h4>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '24px', height: '24px', borderRadius: '8px', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB', border: '1px solid #F1F5F9' }}>
                           <User size={12} />
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 800, color: '#1E293B' }}>V-31.325.708</span>
                     </div>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '24px', height: '24px', borderRadius: '8px', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB', border: '1px solid #F1F5F9' }}>
                           <Phone size={12} />
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 800, color: '#1E293B' }}>0424 457 0903</span>
                     </div>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '24px', height: '24px', borderRadius: '8px', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB', border: '1px solid #F1F5F9' }}>
                           <Building2 size={12} />
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 800, color: '#1E293B' }}>Venezuela / Banesco / Bancamiga</span>
                     </div>
                  </div>
               </div>

               {/* Upload Section */}
               <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <label 
                     style={{ 
                        width: '100%', padding: '16px', borderRadius: '20px', 
                        border: '2px dashed #E2E8F0', background: file ? '#F0F9FF' : '#FFFFFF',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                        cursor: 'pointer', transition: 'all 0.2s'
                     }}
                     onMouseOver={e => !file && (e.currentTarget.style.borderColor = '#2563EB', e.currentTarget.style.background = '#F8FAFC')}
                     onMouseOut={e => !file && (e.currentTarget.style.borderColor = '#E2E8F0', e.currentTarget.style.background = '#FFFFFF')}
                  >
                     <input type="file" onChange={handleFileChange} style={{ display: 'none' }} accept="image/*" />
                     {file ? (
                        <>
                           <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#0EA5E9', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <CheckCircle2 size={16} />
                           </div>
                           <span style={{ fontSize: '13px', fontWeight: 700, color: '#0369A1' }}>{file.name}</span>
                        </>
                     ) : (
                        <>
                           <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#F1F5F9', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Upload size={16} />
                           </div>
                           <div style={{ textAlign: 'center' }}>
                              <span style={{ fontSize: '13px', fontWeight: 800, color: '#1E293B', display: 'block' }}>Subir comprobante</span>
                              <span style={{ fontSize: '10px', fontWeight: 600, color: '#94A3B8' }}>Formato PNG, JPG o PDF</span>
                           </div>
                        </>
                     )}
                  </label>

                  <button
                     onClick={handleSubmit}
                     disabled={!file || status !== 'idle'}
                     style={{ 
                        width: '100%', padding: '16px 0', borderRadius: '20px', 
                        background: status === 'success' ? '#10B981' : '#1E293B', color: '#FFFFFF', 
                        fontWeight: 900, fontSize: '12px', textTransform: 'uppercase', 
                        letterSpacing: '0.15em', border: 'none', cursor: file ? 'pointer' : 'not-allowed',
                        boxShadow: '0 8px 20px rgba(30, 41, 59, 0.1)', transition: 'all 0.3s ease',
                        opacity: file ? 1 : 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        marginBottom: '16px'
                     }}
                  >
                     {status === 'idle' && (<>Enviar Comprobante <ArrowRight size={16} /></>)}
                     {status === 'uploading' && 'Sincronizando pago...'}
                     {status === 'success' && (<><CheckCircle2 size={16} /> Pago Reportado</>)}
                  </button>
               </div>

               {/* Reports History Section */}
               <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                     <h4 style={{ fontSize: '10px', fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0 }}>Historial de Reportes</h4>
                      <div 
                         onClick={() => { onClose(); navigate('/finance'); }}
                         style={{ fontSize: '10px', color: '#2563EB', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                         Ver todos <ExternalLink size={10} />
                      </div>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                     {[
                        { date: 'Hoy', status: 'En revisión', amount: '25$' },
                        { date: '4 Mar 2024', status: 'Aprobado', amount: '25$' }
                     ].map((report, i) => (
                        <div 
                           key={i}
                           style={{ 
                              display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                              padding: '10px 14px', background: '#F8FAFC', borderRadius: '12px',
                              border: '1px solid #F1F5F9'
                           }}
                        >
                           <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Clock size={10} color="#94A3B8" />
                              <span style={{ fontSize: '11px', fontWeight: 700, color: '#1E293B' }}>{report.date}</span>
                           </div>
                           <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{ fontSize: '11px', fontWeight: 900, color: '#1E293B' }}>{report.amount}</span>
                              <span style={{ 
                                 fontSize: '8px', fontWeight: 900, textTransform: 'uppercase', 
                                 color: report.status === 'Aprobado' ? '#10B981' : '#F59E0B',
                                 background: report.status === 'Aprobado' ? '#ECFDF5' : '#FFFBEB',
                                 padding: '3px 6px', borderRadius: '5px'
                              }}>
                                 {report.status}
                              </span>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>

            </div>
         </div>
      </div>,
      document.body
   );
};

export default SubscriptionModal;
