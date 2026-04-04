import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Plus, X, ArrowRight, ArrowLeft, User, Calendar, Trash2, AlertCircle
} from 'lucide-react';
import { useData } from '../../context/DataContext';

// Components
import { T, EyebrowLabel, Card } from './components/appointment/AppointmentUI';
import ServiceModal from './components/appointment/ServiceModal';
import DoctorSelector from './components/appointment/DoctorSelector';
import AppointmentSummary from './components/appointment/AppointmentSummary';

const MOCK_SERVICES = [
  { id: 's1', name: 'Consulta odontológica',     base_price: 20 },
  { id: 's2', name: 'Evaluación dental',          base_price: 15 },
  { id: 's3', name: 'Limpieza dental (profilaxis)', base_price: 35 },
  { id: 's4', name: 'Destartraje (limpieza profunda)', base_price: 50 },
  { id: 's5', name: 'Aplicación de flúor',        base_price: 10 },
  { id: 's6', name: 'Resina simple',               base_price: 30 },
];

const MOCK_DOCTORS = [
  { id: 'd1', name: 'Dr. Specialist' },
  { id: 'd2', name: 'Dra. María González' },
];

const NewAppointmentFlow = () => {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const { patients, doctors: dbDoctors, services: dbServices } = useData();

  /* Patient resolution */
  const patient = useMemo(() => {
    const found = patients.find(p => p.id === id || p.id === String(id) || p.id === parseInt(id));
    return found || null;
  }, [patients, id]);

  /* Catalog resolution */
  const catalog = useMemo(() => {
    if (dbServices && dbServices.length > 0) return dbServices;
    return MOCK_SERVICES;
  }, [dbServices]);

  const availableDoctors = useMemo(() => {
    const list = dbDoctors.filter(d => {
      const s = (d.status || '').toLowerCase();
      return s === 'activo' || s === 'active';
    });
    return list.length > 0 ? list : MOCK_DOCTORS;
  }, [dbDoctors]);

  /* Local state */
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedDoctor,   setSelectedDoctor]   = useState(null);
  const [isModalOpen,      setIsModalOpen]       = useState(false);
  const [errorToast,       setErrorToast]        = useState(null);

  const subtotal = useMemo(() => {
    return selectedServices.reduce((sum, sv) => sum + (parseFloat(sv.price) || 0), 0);
  }, [selectedServices]);

  const handleAddService = (svc) => {
    console.log("Añadiendo servicio:", svc);
    setSelectedServices(prev => [...prev, { ...svc, uid: `sv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` }]);
  };

  const handleRemoveService = (uid) => {
    setSelectedServices(prev => prev.filter(s => s.uid !== uid));
  };

  const handleGoToScheduler = () => {
    if (selectedServices.length === 0) return;
    if (!selectedDoctor) {
      setErrorToast("Por favor, selecciona al especialista que atenderá antes de continuar.");
      setTimeout(() => setErrorToast(null), 4000);
      return;
    }
    navigate('/scheduler', {
      state: {
        prefilledPatient: patient,
        preloadedServices: selectedServices,
        preloadedDoctor: selectedDoctor,
        pendingConsultation: { services: selectedServices, total: subtotal }
      }
    });
  };

  // Log para debug de estado
  useEffect(() => {
    console.log("Estado actualizado - Servicios:", selectedServices.length, "Doctor:", selectedDoctor?.name);
  }, [selectedServices, selectedDoctor]);

  const sectionHeader = {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingBottom: 18, marginBottom: 20,
    borderBottom: `1px solid ${T.slate100}`,
  };

  return (
    <div style={{ minHeight: '100vh', background: T.bg, padding: '2rem 2rem 5rem', animation: 'naf-fade 0.35s ease' }}>
      <style>{`
        @keyframes naf-fade     { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        @keyframes naf-slide-up { from { opacity: 0; transform: translateY(10px) scale(0.98); } to { opacity: 1; transform: none; } }
      `}</style>

      {/* HEADER */}
      <div style={{ maxWidth: 1400, margin: '0 auto', marginBottom: 28 }}>
        <button
          onClick={() => navigate(`/pacientes/${id}`)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, border: 'none', background: 'none', cursor: 'pointer', color: T.slate500, fontWeight: 700, fontSize: 13, marginBottom: 16 }}
        >
          <ArrowLeft size={15} /> Volver al perfil
        </button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: T.slate400, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 4 }}>
              Gestión de agenda y tratamientos
            </div>
            <h1 style={{ fontSize: '2.25rem', fontWeight: 900, color: T.slate900, letterSpacing: '-0.04em', lineHeight: 1.1, margin: 0 }}>
              Nueva cita clínica
            </h1>
            <p style={{ fontSize: 14, color: T.slate500, fontWeight: 500, marginTop: 6 }}>
              Selecciona servicios, especialista y revisa los horarios disponibles.
            </p>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px',
            background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 99,
          }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: T.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={14} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 9, fontWeight: 800, color: '#3B82F6', letterSpacing: '0.16em', textTransform: 'uppercase' }}>Paciente</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: T.primary }}>
                {patient?.name || `Paciente #${id}`}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BODY GRID */}
      <div style={{ maxWidth: 1400, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24, alignItems: 'start' }}>
        
        {/* LEFT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* BLOQUE 1: Servicios */}
          <Card style={{ padding: '2rem' }}>
            <div style={sectionHeader}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 900, color: T.slate900, margin: 0, letterSpacing: '-0.03em' }}>
                  1. Plan de tratamiento
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <EyebrowLabel>Configuración de servicios</EyebrowLabel>
                  <span style={{ 
                    fontSize: 8, fontWeight: 900, padding: '2px 8px', 
                    background: '#EFF6FF', color: T.primary, 
                    border: '1px solid #DBEAFE', borderRadius: 6, 
                    letterSpacing: '0.08em', textTransform: 'uppercase' 
                  }}>
                    {selectedServices.length} {selectedServices.length === 1 ? 'Procedimiento' : 'Procedimientos'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '10px 20px', borderRadius: 99, border: 'none',
                  background: T.primary, color: '#fff', fontWeight: 800,
                  fontSize: 13, cursor: 'pointer', boxShadow: '0 4px 16px rgba(37,99,235,0.25)',
                  transition: 'background 0.15s', flexShrink: 0,
                }}
                onMouseEnter={e => e.currentTarget.style.background = T.primaryH}
                onMouseLeave={e => e.currentTarget.style.background = T.primary}
              >
                <Plus size={15} /> Añadir servicios
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {selectedServices.length === 0 ? (
                <div style={{
                  padding: '2.5rem 1rem', textAlign: 'center',
                  border: `2px dashed ${T.slate200}`, borderRadius: 16,
                  color: T.slate400,
                }}>
                  <Calendar size={32} style={{ margin: '0 auto 10px', opacity: 0.25 }} />
                  <div style={{ fontSize: 13, fontWeight: 700 }}>Añade los servicios de esta cita</div>
                </div>
              ) : selectedServices.map(sv => (
                <div key={sv.uid} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '16px 18px', background: T.white,
                  border: `1px solid ${T.slate100}`, borderRadius: 16,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Calendar size={18} color={T.primary} />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: T.slate900 }}>{sv.name}</div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: T.slate400, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Cantidad: 1</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 9, fontWeight: 800, color: T.slate400, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Precio unitario</div>
                      <div style={{ fontSize: 22, fontWeight: 900, color: T.primary, letterSpacing: '-0.03em' }}>${sv.price}</div>
                    </div>
                    <button
                      onClick={() => handleRemoveService(sv.uid)}
                      style={{
                        width: 36, height: 36, borderRadius: 10, border: `1px solid ${T.slate100}`,
                        background: T.white, cursor: 'pointer', color: T.slate400,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#FFF1F2'; e.currentTarget.style.color = '#F43F5E'; e.currentTarget.style.borderColor = '#FFE4E6'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = T.white; e.currentTarget.style.color = T.slate400; e.currentTarget.style.borderColor = T.slate100; }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* BLOQUE 2: Especialista */}
          <Card style={{ padding: '2rem' }}>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 17, fontWeight: 900, color: T.slate900, margin: '0 0 2px', letterSpacing: '-0.02em' }}>
                2. Especialista que atenderá
              </h2>
              <EyebrowLabel>Selección del profesional</EyebrowLabel>
            </div>
            <DoctorSelector doctors={availableDoctors} selected={selectedDoctor} onSelect={setSelectedDoctor} />
          </Card>
        </div>

        {/* RIGHT COLUMN (SUMMARY) */}
        <AppointmentSummary 
          selectedServices={selectedServices} 
          selectedDoctor={selectedDoctor} 
          subtotal={subtotal} 
          handleGoToScheduler={handleGoToScheduler} 
          onCancel={() => navigate(`/pacientes/${id}`)}
        />
      </div>

      {/* MODALS & TOASTS */}
      {isModalOpen && (
        <ServiceModal 
          catalog={catalog} 
          onClose={() => setIsModalOpen(false)} 
          onAdd={handleAddService} 
        />
      )}
      
      {errorToast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[10000] bg-slate-900/95 backdrop-blur-xl border border-white/10 p-1.5 pl-5 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center gap-4 animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest leading-none mb-1">Error de validación</span>
            <span className="text-sm font-bold text-white leading-tight">{errorToast}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-500 flex items-center justify-center border border-rose-500/20">
            <AlertCircle size={20} strokeWidth={2.5} />
          </div>
        </div>
      )}
    </div>
  );
};

export default NewAppointmentFlow;
