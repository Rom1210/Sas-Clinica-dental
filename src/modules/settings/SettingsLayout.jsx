import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  User,
  Building2,
  Briefcase,
  ClipboardList,
  DollarSign,
  Crown,
  Settings2
} from 'lucide-react';

const navItems = [
  { path: '/settings/profile',       label: 'Mi Perfil',      icon: User },
  { path: '/settings/clinic',        label: 'Clínica',        icon: Building2 },
  { path: '/settings/finance',       label: 'Finanzas',       icon: DollarSign },
  { path: '/settings/team',          label: 'Equipo Médico',  icon: Briefcase },
  { path: '/settings/services',      label: 'Servicios',      icon: ClipboardList },
  { path: '/settings/subscriptions', label: 'Suscripción',    icon: Crown },
];

const SettingsLayout = () => {
  return (
    <div
      className="flex gap-6 animate-in fade-in duration-300"
      style={{ height: 'calc(100vh - 120px)' }}
    >
      {/* Left Sidebar — fixed, no scroll */}
      <aside className="w-52 flex-shrink-0 flex flex-col gap-1 pt-2">
        <div className="flex items-center gap-2 px-3 mb-4">
          <Settings2 size={16} className="text-stone-400" />
          <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">Configuración</span>
        </div>

        {navItems.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm transition-all duration-150
               ${isActive
                 ? 'bg-primary/10 text-primary'
                 : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
               }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={16} strokeWidth={isActive ? 2.5 : 1.8} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </aside>

      {/* Content Panel — scrollable, white card that always closes around content */}
      <div className="flex-1 min-w-0 overflow-y-auto">
        <div className="min-h-full bg-white border border-slate-200/80 rounded-2xl shadow-sm">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default SettingsLayout;
