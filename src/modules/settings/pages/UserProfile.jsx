import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { LogOut, ShieldCheck, Mail, User, KeyRound } from 'lucide-react';

const UserProfile = () => {
  const { profile, signOut } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const initials = profile?.full_name
    ? profile.full_name.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : (profile?.email ? profile.email[0].toUpperCase() : 'U');

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await signOut();
  };

  return (
    <div className="p-8 flex flex-col gap-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Mi Perfil</h1>
        <p className="text-sm text-slate-500 mt-1">Información personal y acceso a la cuenta.</p>
      </div>

      {/* Profile Card */}
      <div className="flex items-center gap-5 p-5 bg-slate-50 rounded-2xl">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xl flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #2563EB, #1D4ED8)' }}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-black text-slate-900 truncate">{profile?.full_name || 'Usuario'}</h2>
          <p className="text-sm text-slate-500 truncate mt-0.5">{profile?.email || '—'}</p>
          <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-wider">
            <ShieldCheck size={11} /> Administrador
          </span>
        </div>
      </div>

      {/* Info rows */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Datos de la cuenta</p>

        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
          <div className="w-9 h-9 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-400 flex-shrink-0">
            <User size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-0.5">Nombre</p>
            <p className="font-semibold text-sm text-slate-800 truncate">{profile?.full_name || '—'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
          <div className="w-9 h-9 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-400 flex-shrink-0">
            <Mail size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-0.5">Correo electrónico</p>
            <p className="font-semibold text-sm text-slate-800 truncate">{profile?.email || '—'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
          <div className="w-9 h-9 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-400 flex-shrink-0">
            <KeyRound size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-0.5">Contraseña</p>
            <p className="font-semibold text-sm text-slate-800">••••••••</p>
          </div>
          <span className="text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full font-medium whitespace-nowrap">Supabase Auth</span>
        </div>
      </div>

      {/* Session */}
      <div className="flex flex-col gap-2 pt-4 border-t border-slate-100">
        <p className="text-xs font-bold text-rose-400 uppercase tracking-widest">Sesión</p>
        <div className="flex items-center justify-between p-4 bg-rose-50 rounded-xl">
          <div>
            <p className="font-semibold text-sm text-slate-800">Cerrar sesión</p>
            <p className="text-xs text-slate-400 mt-0.5">Tendrás que volver a ingresar tus credenciales.</p>
          </div>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            style={{ border: 'none', cursor: 'pointer' }}
            className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-rose-600 hover:text-white text-rose-600 font-bold text-sm rounded-xl transition-all disabled:opacity-50 shadow-sm"
          >
            <LogOut size={15} />
            {isLoggingOut ? 'Saliendo...' : 'Cerrar sesión'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
