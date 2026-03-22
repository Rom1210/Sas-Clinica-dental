import React, { useState } from 'react';
import { Routes, Route, useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  Users, 
  Calendar, 
  FileText, 
  CreditCard, 
  BarChart3, 
  Settings, 
  Search,
  Plus
} from 'lucide-react';

// Modules
import PatientRegistration from './modules/patients/PatientRegistration';
import PatientDashboard from './modules/patients/PatientDashboard';
import PatientProfile from './modules/patients/PatientProfile';
import ScheduleAppointment from './modules/patients/ScheduleAppointment';
import NewConsultation from './modules/consultations/NewConsultation';
import FinanceModule from './modules/finance/FinanceModule';
import PatientFinanceDetail from './modules/finance/PatientFinanceDetail';
import Scheduler from './modules/scheduler/Scheduler';
import BIDashboard from './modules/bi/BIDashboard';
import SettingsManagement from './modules/settings/SettingsManagement';
import ServiceForm from './modules/settings/ServiceForm';
import DoctorForm from './modules/settings/DoctorForm';

const App = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [toast, setToast] = useState(null);

  const menuItems = [
    { id: 'bi', path: '/', label: 'Visión Global', icon: <BarChart3 size={20} /> },
    { id: 'scheduler', path: '/scheduler', label: 'Agenda Atómica', icon: <Calendar size={20} /> },
    { id: 'patients', path: '/patients', label: 'Pacientes', icon: <Users size={20} /> },
    { id: 'finance', path: '/finance', label: 'Finanzas (USD/VES)', icon: <CreditCard size={20} /> },
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

        <div className="mt-auto pt-6 border-t border-slate-100">
          <div className="flex items-center gap-3 p-2 hover:bg-slate-50 transition-all rounded-lg" style={{ cursor: 'pointer' }}>
            <div className="avatar" style={{ width: 36, height: 36, background: '#EFF6FF', color: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem' }}>MS</div>
            <div className="flex flex-col">
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#111827' }}>Maria Silva</span>
              <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>Admin</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Structured Main Content */}
      <main className="main-content-structured">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em', color: '#111827' }}>
              {currentModule.label}
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>Gestión integral del centro odontológico</p>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="btn btn-primary shadow-sm hover:shadow-md transition-all" onClick={() => setShowPatientModal(true)} style={{ height: '2.5rem', padding: '0 1rem', borderRadius: '16px', fontWeight: 600 }}>
               <Plus size={18} className="mr-2" /> Nuevo Paciente
            </button>
          </div>
        </header>

        {/* Dynamic Content Rendering */}
        <div className="flex-1 w-full">
          <Routes>
            <Route path="/" element={<BIDashboard />} />
            <Route path="/scheduler" element={<Scheduler />} />
            <Route path="/patients" element={<PatientDashboard />} />
            <Route path="/pacientes/:id" element={<PatientProfile />} />
            <Route path="/pacientes/:id/agendar-cita" element={<ScheduleAppointment />} />
            <Route path="/pacientes/:id/nueva-consulta" element={<NewConsultation />} />
            <Route path="/finance" element={<FinanceModule />} />
            <Route path="/paciente/:id/estado-cuenta" element={<PatientFinanceDetail />} />
            <Route path="/settings" element={<SettingsManagement />} />
            <Route path="/settings/new-service" element={<ServiceForm />} />
            <Route path="/settings/edit-service/:id" element={<ServiceForm />} />
            <Route path="/settings/new-doctor" element={<DoctorForm />} />
            <Route path="/settings/edit-doctor/:id" element={<DoctorForm />} />
            <Route path="*" element={<BIDashboard />} />
          </Routes>
        </div>
      </main>

      {/* Patient Registration Modal */}
      {showPatientModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'flex-end', zIndex: 100
        }} onClick={() => setShowPatientModal(false)}>
          <div 
            style={{ width: '500px', height: '100%', background: 'white', padding: '2rem', boxShadow: '-4px 0 15px rgba(0,0,0,0.1)' }}
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

      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '2rem', right: '2rem', background: 'var(--primary)',
          color: 'white', padding: '1rem 1.5rem', borderRadius: 'var(--radius)',
          boxShadow: 'var(--shadow-md)', zIndex: 200
        }}>
          {toast}
        </div>
      )}
    </div>
  );
};

export default App;
