import React, { useState } from 'react';
import { Routes, Route, useNavigate, useLocation, Link, Navigate, useSearchParams } from 'react-router-dom';
import { 
  Users, 
  Calendar, 
  CreditCard, 
  BarChart3, 
  Settings, 
  Plus,
  LogOut,
  Loader2,
  ChevronRight,
  TrendingDown,
  FileText
} from 'lucide-react';

// Context
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider, useData } from './context/DataContext';
import { SettingsProvider } from './context/SettingsContext';

// Components
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import SetPassword from './components/auth/SetPassword';
import TeamManagement from './modules/settings/TeamManagement';
import AccountPanel from './modules/account/AccountPanel';

// Modules
import PatientRegistration from './modules/patients/PatientRegistration';
import PatientDashboard from './modules/patients/PatientDashboard';
import PatientProfile from './modules/patients/PatientProfile';
import ScheduleAppointment from './modules/patients/ScheduleAppointment';
import NewAppointmentFlow from './modules/patients/NewAppointmentFlow';
import NewConsultation from './modules/consultations/NewConsultation';
import FinanceModule from './modules/finance/FinanceModule';
import PatientFinanceDetail from './modules/finance/PatientFinanceDetail';
import Scheduler from './modules/scheduler/Scheduler';
import UpcomingAppointments from './modules/scheduler/UpcomingAppointments';
import AppointmentDetails from './modules/scheduler/AppointmentDetails';
import BIDashboard from './modules/bi/BIDashboard';
import StatisticsModule from './modules/statistics/StatisticsModule';
import ControlMaster from './modules/master/ControlMaster';
import ServiceForm from './modules/settings/ServiceForm';
import DoctorForm from './modules/settings/DoctorForm';

const AppContent = () => {
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const { loading: dataLoading, error: dataError } = useData();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [isUserPanelOpen, setIsUserPanelOpen] = useState(false);
  const [toast, setToast] = useState(null);

  if (authLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/set-password" element={<SetPassword />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  const menuItems = [
    { id: 'bi', path: '/', label: 'Visión Global', icon: <BarChart3 size={20} /> },
    { id: 'scheduler', path: '/scheduler', label: 'Agenda Atómica', icon: <Calendar size={20} /> },
    { id: 'patients', path: '/patients', label: 'Pacientes', icon: <Users size={20} /> },
    { id: 'finance', path: '/finance', label: 'Finanzas (USD/VES)', icon: <CreditCard size={20} /> },
    { id: 'statistics', path: '/statistics', label: 'Estadísticas', icon: <BarChart3 size={20} /> },
    { id: 'settings', path: '/settings', label: 'Control Maestro', icon: <Settings size={20} /> },
  ];

  const showSuccessToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const currentModule = menuItems.find(item => 
    item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)
  ) || { label: 'Detalle de Paciente' };

  return (
    <div className="flex" style={{ minHeight: '100vh', background: 'var(--background)' }}>
      {/* Fixed Professional Sidebar */}
      <aside className="sidebar-fixed flex flex-col p-6">
        <div className="flex items-center gap-3 mb-10 px-2 cursor-pointer" onClick={() => navigate('/')}>
          <div style={{ 
            width: 32, height: 32, background: 'var(--primary)', 
            borderRadius: '8px', display: 'flex', 
            alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 900
          }}>S</div>
          <h1 style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.04em', color: '#111827' }}>SmartDental</h1>
        </div>

        <nav className="flex-1 flex flex-col gap-1">
          {menuItems.map(item => {
            const isActive = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.id}
                to={item.path}
                className={`flex items-center gap-3 py-2.5 px-4 w-full border-none transition-all no-underline ${isActive ? 'sidebar-item-active' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
                style={{ 
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: 500
                }}
              >
                {React.cloneElement(item.icon, { size: 18, strokeWidth: isActive ? 2.5 : 2 })}
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-100 flex flex-col gap-4">
          <div 
            className="flex items-center gap-3 p-2 hover:bg-slate-50 transition-all rounded-lg group" 
            style={{ cursor: 'pointer' }}
            onClick={() => setIsUserPanelOpen(true)}
          >
            <div className="avatar group-hover:scale-105 transition-transform" style={{ width: 36, height: 36, background: '#EFF6FF', color: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem' }}>
              {profile?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
            </div>
            <div className="flex flex-col flex-1 overflow-hidden">
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#111827' }} className="truncate">
                {profile?.full_name || user.email}
              </span>
              <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>Admin</span>
            </div>
            <div className="p-2 text-slate-300 group-hover:text-slate-500 transition-colors">
              <ChevronRight size={14} />
            </div>
          </div>
        </div>
      </aside>

      {/* Structured Main Content */}
      <main className="main-content-structured">
        <header className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-6">
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em', color: '#111827' }}>
                {currentModule.label}
              </h2>
              <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                {dataLoading ? 'Actualizando datos...' : 'Gestión integral del centro odontológico'}
              </p>
            </div>

            {location.pathname === '/finance' && (
              <ModuleSubNav />
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowPatientModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.65rem 1.5rem', borderRadius: '9999px', background: '#2563EB', color: '#fff', fontWeight: 900, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(37,99,235,0.35)', transition: 'all 0.2s' }}
              onMouseOver={e => e.currentTarget.style.boxShadow='0 6px 20px rgba(37,99,235,0.5)'}
              onMouseOut={e => e.currentTarget.style.boxShadow='0 4px 14px rgba(37,99,235,0.35)'}
            >
              <Plus size={16} /> NUEVO PACIENTE
            </button>
          </div>
        </header>

        {/* Dynamic Content Rendering */}
        <div className="flex-1 w-full">
          {dataError ? (
            <div className="p-8 bg-rose-50 border border-rose-100 rounded-3xl text-rose-600 text-center">
               <p className="font-bold">Error de conexión</p>
               <p className="text-sm">{dataError}</p>
            </div>
          ) : (
            <Routes>
              <Route path="/" element={<BIDashboard />} />
              <Route path="/scheduler" element={<Scheduler />} />
              <Route path="/scheduler/upcoming" element={<UpcomingAppointments />} />
              <Route path="/scheduler/appointment/:id" element={<AppointmentDetails />} />
              <Route path="/patients" element={<PatientDashboard />} />
              <Route path="/pacientes/:id" element={<PatientProfile />} />
              <Route path="/pacientes/:id/agendar-cita" element={<NewAppointmentFlow />} />
              <Route path="/pacientes/:id/nueva-cita" element={<NewAppointmentFlow />} />
              <Route path="/pacientes/:id/nueva-consulta" element={<NewConsultation />} />
              <Route path="/finance" element={<FinanceModule />} />
              <Route path="/paciente/:id/estado-cuenta" element={<PatientFinanceDetail />} />
              <Route path="/statistics" element={<StatisticsModule />} />
              <Route path="/settings" element={<ControlMaster />} />
              <Route path="/settings/new-service" element={<ServiceForm />} />
              <Route path="/settings/edit-service/:id" element={<ServiceForm />} />
              <Route path="/settings/new-doctor" element={<DoctorForm />} />
              <Route path="/settings/edit-doctor/:id" element={<DoctorForm />} />
              <Route path="/settings/team" element={<TeamManagement />} />
              <Route path="/set-password" element={<SetPassword />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          )}
        </div>
      </main>

      {/* Patient Registration Modal */}
      {showPatientModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(15,23,42,0.5)', display: 'flex', justifyContent: 'flex-end', zIndex: 9000,
          backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
        }} onClick={() => setShowPatientModal(false)}>
          <div 
            style={{
              width: '520px', height: '100%', background: 'white',
              boxShadow: '-20px 0 60px rgba(0,0,0,0.15)',
              display: 'flex', flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
            className="animate-in slide-in-from-right duration-300"
          >
            <PatientRegistration 
              onClose={() => setShowPatientModal(false)}
              onSuccess={(msg) => {
                setShowPatientModal(false);
                showSuccessToast(msg);
              }}
            />
          </div>
        </div>
      )}

      {/* User Panel Drawer (Account Module) */}
      <AccountPanel 
        isOpen={isUserPanelOpen}
        onClose={() => setIsUserPanelOpen(false)}
        user={user}
        profile={profile}
        onLogout={() => {
          setIsUserPanelOpen(false);
          signOut();
        }}
      />

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-10 right-10 z-[10000] bg-slate-900/95 backdrop-blur-xl border border-white/10 p-1.5 pl-6 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.4)] flex items-center gap-5 animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest leading-none mb-1.5">Mensaje del sistema</span>
            <span className="text-sm font-bold text-white leading-tight">{toast}</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center border border-emerald-500/30">
            <Loader2 size={24} className={toast.toLowerCase().includes('cargando') ? 'animate-spin' : ''} strokeWidth={2.5} />
          </div>
        </div>
      )}
    </div>
  );
};

const ModuleSubNav = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'accounts';

  const tabs = [
    { id: 'accounts', label: 'Cuentas', icon: <Users size={14} /> },
    { id: 'expenses', label: 'Egresos', icon: <TrendingDown size={14} /> },
    { id: 'invoices', label: 'Facturas', icon: <FileText size={14} /> },
  ];

  const activeIndex = tabs.findIndex(t => t.id === activeTab);

  return (
    <div className="relative flex bg-slate-100/60 p-1.5 rounded-full border border-slate-200/50 backdrop-blur-sm shadow-sm min-w-[340px]">
      {/* Sliding Background Indicator */}
      <div 
        className="absolute top-1.5 bottom-1.5 rounded-full bg-white shadow-sm transition-all duration-300 ease-out z-0"
        style={{ 
          width: `calc((100% - 12px) / 3)`,
          left: `calc(6px + ${activeIndex} * (100% - 12px) / 3)`,
        }}
      />
      
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setSearchParams({ tab: tab.id })}
            className={`
              relative z-10 flex-1 flex items-center justify-center gap-2 px-6 py-2.5 rounded-full border-none cursor-pointer transition-all duration-300
              ${isActive ? 'text-primary' : 'text-slate-500 hover:text-slate-700'}
            `}
          >
            <span className={`transition-all duration-300 ${isActive ? 'scale-110' : 'opacity-60'}`}>
              {tab.icon}
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

const App = () => (
  <SettingsProvider>
    <AuthProvider>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </AuthProvider>
  </SettingsProvider>
);

export default App;
