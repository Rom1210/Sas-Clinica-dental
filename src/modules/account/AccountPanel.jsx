import React, { useMemo } from 'react';
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
   ChevronRight
} from 'lucide-react';

const AccountPanel = ({ isOpen, onClose, user, profile, onLogout }) => {
   const navigate = useNavigate();
   const { exchangeRate } = useSettings();

   const quickStats = useMemo(
      () => ({
         plan: 'Plan Pro',
         status: 'Activo',
         bcvRate: 180.23
      }),
      []
   );

   if (!isOpen) return null;

   const initials = profile?.full_name?.split(' ').map(n => n[0]).join('') || 'AK';
   const displayName = profile?.full_name || 'Admin Khoury';
   const displayEmail = (profile?.email || 'khouryromero@gmail.com').toLowerCase();

   return createPortal(
      <div className="account-panel-root" style={{ position: 'relative', zIndex: 10000 }}>
         {/* Fixed Overlay Backdrop */}
         <div 
            className="fixed inset-0 bg-slate-900/10" 
            onClick={onClose} 
            style={{ 
               position: 'fixed',
               top: 0,
               right: 0,
               bottom: 0,
               left: 0,
               backgroundColor: 'rgba(15, 23, 42, 0.1)',
               backdropFilter: 'blur(10px)', 
               WebkitBackdropFilter: 'blur(10px)',
               zIndex: 10000,
               cursor: 'pointer'
            }}
         />
         
         {/* Floating Drawer Container - Robust Inline Styles for Positioning */}
         <div 
            className="flex flex-col overflow-hidden animate-in slide-in-from-right duration-300"
            style={{ 
               position: 'fixed',
               top: '24px',
               right: '24px',
               bottom: '24px',
               width: '430px',
               backgroundColor: '#ffffff',
               borderRadius: '48px',
               boxShadow: '0 40px 100px -10px rgba(0,0,0,0.15)',
               zIndex: 10001,
               display: 'flex',
               flexDirection: 'column',
               border: 'none',
               outline: 'none',
               pointerEvents: 'auto'
            }}
         >
            {/* Header */}
            <div className="flex items-center justify-between px-10 pt-12 pb-6">
               <h2 className="text-[28px] font-black tracking-tight text-slate-900 leading-none">
                  Mi cuenta
               </h2>

               <button
                  onClick={onClose}
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-300 transition hover:bg-slate-100 hover:text-slate-900 border-none outline-none cursor-pointer"
               >
                  <X size={26} strokeWidth={2.5} />
               </button>
            </div>

            {/* Contenido Scrollable */}
            <div className="flex-1 overflow-y-auto px-10 pb-10 scrollbar-hide">
               
               {/* Perfil */}
               <div className="flex flex-col items-center">
                  <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-slate-50 text-[32px] font-black text-slate-300">
                     {initials}
                  </div>
                  
                  <h3 className="text-[26px] font-black tracking-tight text-slate-900 leading-tight">
                     {displayName}
                  </h3>
                  
                  <p className="mt-1 text-[16px] font-medium text-slate-400">
                     {displayEmail}
                  </p>
                  
                  <div className="mt-5 px-6 py-2 rounded-full bg-slate-50 text-[10px] font-bold tracking-[0.25em] text-slate-300 uppercase">
                     Administrador
                  </div>
               </div>

               {/* Acciones de Perfil */}
               <div className="mt-10 grid grid-cols-2 gap-4">
                  <button
                     onClick={() => { onClose(); navigate('/settings'); }}
                     className="flex items-center justify-center gap-2 py-6 px-4 rounded-[30px] bg-slate-50 text-slate-600 font-bold text-[15px] transition hover:bg-slate-100 border-none outline-none cursor-pointer"
                  >
                     <User size={20} />
                     Editar perfil
                  </button>
                  <button
                     onClick={() => { onClose(); navigate('/settings'); }}
                     className="flex items-center justify-center gap-2 py-6 px-4 rounded-[30px] bg-slate-50 text-slate-600 font-bold text-[15px] transition hover:bg-slate-100 border-none outline-none cursor-pointer"
                  >
                     <ShieldCheck size={20} />
                     Seguridad
                  </button>
               </div>

               {/* Tarjeta Suscripción */}
               <div className="mt-10 p-10 rounded-[44px] bg-white shadow-[0_15px_60px_rgba(0,0,0,0.04)] border border-slate-50">
                  <div className="flex items-start justify-between">
                     <div className="flex flex-col">
                        <h4 className="text-[20px] font-black text-slate-900 tracking-tight">Suscripción</h4>
                        <div className="flex items-center gap-2 mt-1">
                           <span className="text-[14px] text-slate-400 font-bold">{quickStats.plan}</span>
                           <span className="text-[14px] text-emerald-500 font-black">| Activo</span>
                        </div>
                     </div>
                     
                     <div className="px-4 py-2 rounded-full bg-emerald-50 text-[11px] font-black text-emerald-500 flex items-center gap-1 cursor-pointer transition border-none outline-none">
                        Plan Pro
                        <ChevronRight size={14} strokeWidth={3} />
                     </div>
                  </div>

                  <div className="mt-8 grid grid-cols-2 gap-4">
                     <div className="p-6 rounded-[34px] bg-slate-50/60 border-none text-center">
                        <div className="flex items-center justify-center gap-2 text-[10px] font-black text-slate-300 tracking-[0.2em] uppercase mb-1">
                           <span className="text-[14px]">🇦🇷</span> DÓLAR (HOY)
                        </div>
                        <div className="text-[22px] font-black text-slate-900 leading-none mt-1">
                           {Number(exchangeRate || 0).toLocaleString('es-VE', { minimumFractionDigits: 4 })}
                        </div>
                        <div className="text-[11px] font-black text-emerald-500 mt-2">+10,01% ↑</div>
                     </div>

                     <div className="p-6 rounded-[34px] bg-slate-50/60 border-none text-center">
                        <div className="flex items-center justify-center gap-2 text-[10px] font-black text-slate-300 tracking-[0.2em] uppercase mb-1">
                           <span className="text-[14px]">🇻🇪</span> BCV
                        </div>
                        <div className="text-[22px] font-black text-slate-900 leading-none mt-1">
                           {quickStats.bcvRate.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-[11px] font-black text-rose-500 mt-2">-20,01% ↓</div>
                     </div>
                  </div>

                  <button
                     onClick={() => { onClose(); navigate('/settings'); }}
                     className="mt-8 w-full flex items-center justify-center gap-3 py-7 rounded-[34px] bg-slate-100 text-slate-600 font-black text-[15px] hover:bg-slate-200 transition border-none outline-none cursor-pointer"
                  >
                     <Settings size={22} className="text-slate-400" />
                     Gestionar plan
                  </button>
               </div>

               {/* Atajos Rápidos */}
               <div className="mt-12">
                  <h4 className="text-[14px] font-black text-slate-300 tracking-[0.3em] uppercase mb-8 ml-1">
                     Atajos rápidos
                  </h4>
                  
                  <div className="grid grid-cols-3 gap-4">
                     <div className="p-7 rounded-[40px] bg-white shadow-[0_15px_40px_rgba(0,0,0,0.03)] border border-slate-50 flex flex-col items-center hover:shadow-xl hover:-translate-y-1 transition cursor-pointer group">
                        <div className="mb-4 p-5 rounded-[26px] bg-slate-50 text-slate-300 group-hover:bg-slate-900 group-hover:text-white transition">
                           <CalendarDays size={32} />
                        </div>
                        <span className="text-[13px] font-bold text-slate-700 text-center leading-tight">Ver citas<br/>agendadas</span>
                     </div>

                     <div className="relative p-7 rounded-[40px] bg-white shadow-[0_15px_40px_rgba(0,0,0,0.03)] border border-slate-50 flex flex-col items-center hover:shadow-xl hover:-translate-y-1 transition cursor-pointer group">
                        <div className="absolute top-5 right-5 h-8 w-8 rounded-full bg-blue-500 text-white text-[12px] font-black flex items-center justify-center shadow-lg transform translate-x-1 -translate-y-1 border-4 border-white">
                           3
                        </div>
                        <div className="mb-4 p-5 rounded-[26px] bg-slate-50 text-slate-300 group-hover:bg-slate-900 group-hover:text-white transition">
                           <UserPlus size={32} />
                        </div>
                        <span className="text-[13px] font-bold text-slate-700 text-center leading-tight">Nuevo<br/>paciente</span>
                     </div>

                     <div className="p-7 rounded-[40px] bg-white shadow-[0_15px_40px_rgba(0,0,0,0.03)] border border-slate-50 flex flex-col items-center hover:shadow-xl hover:-translate-y-1 transition cursor-pointer group">
                        <div className="mb-4 p-5 rounded-[26px] bg-slate-50 text-slate-300 group-hover:bg-slate-900 group-hover:text-white transition">
                           <BarChart3 size={32} />
                        </div>
                        <span className="text-[13px] font-bold text-slate-700 text-center leading-tight">Ver<br/>finanzas</span>
                     </div>
                  </div>
               </div>

               {/* Botón Logout */}
               <div className="mt-12">
                  <button
                     onClick={onLogout}
                     className="w-full flex items-center justify-center gap-3 py-7 rounded-[38px] bg-slate-50 text-slate-800 font-extrabold text-[17px] hover:bg-slate-100 transition border-none outline-none cursor-pointer"
                  >
                     <LogOut size={24} className="text-slate-300" />
                     Cerrar sesión
                  </button>
               </div>

               <div className="h-16" />
            </div>
         </div>
      </div>,
      document.body
   );
};

export default AccountPanel;