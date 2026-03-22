import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { ArrowLeft, Search, Plus, Filter, Info, ChevronLeft, ChevronRight, CheckCircle2, FileText, User, AlertCircle, Activity, ClipboardList, Clock, Pencil, Download, ChevronDown, Calendar } from 'lucide-react';
import Odontogram from './Odontogram';


const PatientProfile = ({ patient: propPatient, onBack: propOnBack }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { patients, consultations: allConsultations } = useData();
  
  // Support both prop-based and route-based patient loading
  const [patient, setPatient] = useState(propPatient);
  const [patientConsultations, setPatientConsultations] = useState([]);
  
  useEffect(() => {
    if (propPatient) {
      setPatient(propPatient);
    } else if (id && patients.length > 0) {
      const found = patients.find(p => p.id === id || p.id === parseInt(id));
      if (found) setPatient(found);
    }
  }, [propPatient, id, patients]);

  useEffect(() => {
    if (patient) {
      const filtered = allConsultations
        .filter(c => c.patient_id === patient.id)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .map(c => ({
          ...c,
          date: new Date(c.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }),
          treatment: c.treatment_summary,
          cost: c.amount,
          paymentStatus: c.payment_status === 'paid' ? 'Pagado' : (c.payment_status === 'partial' ? 'Abono' : 'Pendiente'),
          doctorName: c.doctor?.full_name || 'Especialista'
        }));
      setPatientConsultations(filtered);
    }
  }, [patient, allConsultations]);

  const onBack = propOnBack || (() => navigate('/patients'));
  const [activeTab, setActiveTab] = useState('General');
  const [showNewConsultModal, setShowNewConsultModal] = useState(false);

  const [toastMessage, setToastMessage] = useState(null);
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [personalInfo, setPersonalInfo] = useState({
    nombres: '',
    apellidos: '',
    fechaNacimiento: '',
    genero: 'Otro',
    lugarNacimiento: '',
    cedula: '',
    email: '',
    telefono: '',
    telefonoEmergencia: '',
    alergias: 'Ninguna',
    ocupacion: '',
    direccion: ''
  });

  const handleScheduleAppointment = () => {
    navigate(`/pacientes/${patient.id}/agendar-cita`);
  };

  React.useEffect(() => {
    if (patient) {
      setPersonalInfo({
        nombres: patient.first_name || patient.name?.split(' ')[0] || '',
        apellidos: patient.last_name || patient.name?.split(' ').slice(1).join(' ') || '',
        fechaNacimiento: patient.birth_date ? new Date(patient.birth_date).toLocaleDateString('es-ES') : '',
        genero: patient.gender || 'Otro',
        lugarNacimiento: '', // Not in schema currently, keeping as placeholder or adding to JSON
        cedula: patient.dni || '',
        email: patient.email || '',
        telefono: patient.phone || '',
        telefonoEmergencia: patient.phone || '',
        alergias: patient.medical_flags?.join(', ') || 'Ninguna',
        ocupacion: '',
        direccion: ''
      });
    }
  }, [patient]);

  const tabs = ['General', 'Historia médica', 'Historia de pago'];

  if (!patient) return <div className="p-10 text-center font-bold text-slate-500 uppercase tracking-widest">Cargando paciente...</div>;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300 pb-10">
      
      {/* Back Button & Actions */}
      <div className="flex justify-between items-center">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-semibold text-sm cursor-pointer border-none bg-transparent p-0"
        >
          <ArrowLeft size={16} /> Volver a pacientes
        </button>

      </div>

      {/* Top Patient Info Card - Hidden in Medical History to match Image 2's clean layout */}
      {activeTab !== 'Historia médica' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col gap-6 border border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">Paciente</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-y-6 gap-x-12">
            <div className="flex flex-col gap-1">
              <span className="text-sm text-slate-500">Nombre</span>
              <span className="text-base font-bold text-slate-800">{patient?.name?.split(' ')[0] || 'Fabian'}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm text-slate-500">Apellido</span>
              <span className="text-base font-bold text-slate-800">{patient?.name?.split(' ').slice(1).join(' ') || 'Romero'}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm text-slate-500">Email</span>
              <span className="text-base font-bold text-slate-800">{patient?.email || 'fabanplay@gmail.com'}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm text-slate-500">Número de teléfono</span>
              <span className="text-base font-bold text-slate-800">04244570903</span>
            </div>
          </div>

          <div className="flex flex-col gap-1 mt-2">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative flex items-center justify-center w-5 h-5 border-2 border-slate-300 rounded overflow-hidden group-hover:border-[#0070AC] transition-colors">
                <input type="checkbox" className="absolute w-full h-full opacity-0 cursor-pointer" />
              </div>
              <span className="text-sm text-slate-700 font-medium select-none text-slate-800">Activar recordatorios</span>
            </label>
            <span className="text-[11px] text-slate-500 ml-8">A este paciente se le enviará un recordatorio un día antes de cada una de sus consultas.</span>
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex justify-center border-b border-slate-200 mt-2">
        <div className="flex gap-8">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 px-2 text-sm font-bold transition-all cursor-pointer ${
                activeTab === tab 
                  ? 'text-[#0070AC]' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              style={{
                border: 'none',
                borderBottom: activeTab === tab ? '2px solid #0070AC' : '2px solid transparent',
                background: 'transparent',
                outline: 'none'
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex flex-col gap-8 mt-4">
        {activeTab === 'General' && (
          <div className="flex flex-col gap-8">
            
            {/* Consultas Section */}
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800">Consultas</h2>
                <button 
                  onClick={handleScheduleAppointment}
                  className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white hover:opacity-90 rounded-xl transition-all text-sm font-bold border-none cursor-pointer shadow-sm"
                >
                  <Calendar size={16} /> Agendar Cita
                </button>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center w-64 bg-slate-50 border border-slate-100 rounded-xl px-4 py-1.5 focus-within:bg-white focus-within:border-primary/30 focus-within:ring-4 focus-within:ring-primary/5 transition-all shadow-sm">
                    <input 
                      type="text" 
                      placeholder="Buscar consulta..." 
                      className="flex-1 bg-transparent border-none outline-none text-[13px] font-medium text-slate-600 placeholder:text-slate-400"
                    />
                    <Search size={15} className="text-slate-400 transition-colors group-focus-within:text-primary ml-2" />
                  </div>
                </div>

                {/* Card-Based Consultations List with Internal Scroll */}
                <div className="p-4 bg-slate-50/30 overflow-y-auto flex flex-col gap-3" style={{ maxHeight: '400px' }}>
                  {patientConsultations.length === 0 ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-2 bg-white rounded-xl border border-slate-100 border-dashed">
                      <h3 className="text-base font-bold text-slate-800">0 resultados.</h3>
                      <p className="text-sm text-slate-500">No hay registros creados hasta ahora.</p>
                      <button 
                        onClick={handleScheduleAppointment}
                        className="mt-4 px-6 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors cursor-pointer text-sm border-none shadow-none"
                      >
                        Agendar primera cita
                      </button>
                    </div>
                  ) : (
                    patientConsultations.map((c) => (
                      <div key={c.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow cursor-pointer flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                        <div className="flex gap-4 items-start md:items-center w-full md:w-auto">
                          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                             <FileText size={20} />
                          </div>
                          <div className="flex flex-col gap-1">
                             <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{c.date}</span>
                             <span className="text-sm font-bold text-slate-800">{c.treatment}</span>
                             <span className="text-sm text-slate-500 line-clamp-1">{c.reason || 'Sin motivo adicional'}</span>
                             {c.doctorName && <span className="text-xs font-medium text-slate-500 mt-1 flex items-center gap-1">Doctor: {c.doctorName}</span>}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between w-full md:w-auto md:flex-col md:items-end gap-1 mt-2 md:mt-0">
                          <span className="text-base font-black text-slate-800">${c.cost.toFixed(2)}</span>
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                            c.paymentStatus === 'Pagado' ? 'bg-emerald-50 text-emerald-600' :
                            c.paymentStatus === 'Abono' ? 'bg-amber-50 text-amber-600' :
                            'bg-rose-50 text-rose-600'
                          }`}>
                            {c.paymentStatus}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-4 border-t border-slate-100 flex justify-end items-center gap-6 bg-white">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    Columnas por página
                    <select className="border-none bg-transparent font-medium focus:outline-none cursor-pointer">
                      <option>5</option>
                      <option>10</option>
                      <option>20</option>
                    </select>
                  </div>
                  <div className="text-sm text-slate-600">
                    0-0 de 0
                  </div>
                  <div className="flex gap-2 text-slate-400">
                    <button className="p-1 border-none bg-transparent text-slate-300 cursor-not-allowed"><ChevronLeft size={16} /></button>
                    <button className="p-1 border-none bg-transparent text-slate-300 cursor-not-allowed"><ChevronRight size={16} /></button>
                  </div>
                </div>
              </div>
            </div>

            {/* Odontograma Section */}
            <div className="flex flex-col gap-4 mt-6">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-slate-800">Odontograma</h2>
                <Info size={18} className="text-slate-400" />
              </div>
              
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex justify-center overflow-x-auto w-full">
                <div className="max-w-full">
                  <Odontogram patientId={patient?.id || 1} />
                </div>
              </div>
            </div>

            {/* Notas del odontograma Sections */}
            <div className="flex flex-col gap-4">
              <h3 className="text-lg font-bold text-slate-800">Notas del odontograma</h3>
              <textarea 
                className="w-full bg-white border border-slate-200 rounded-xl p-4 min-h-[150px] text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-y text-slate-700 shadow-sm"
              ></textarea>
            </div>

          </div>
        )}


        {activeTab === 'Historia médica' && (
          <div className="animate-in w-full max-w-6xl mx-auto px-6 py-4">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-md p-16 flex flex-col gap-10">
              
              {/* Main Header */}
              <div className="flex justify-between items-start w-full">
                <div className="flex flex-col gap-1">
                  <h2 className="text-[28px] font-bold text-slate-800 leading-tight">Historia médica</h2>
                  <p className="text-sm text-slate-400 font-medium">Información detallada y antecedentes del paciente</p>
                </div>
                <button className="btn bg-brand-blue hover:bg-brand-blue-hover text-white px-6 py-2.5 rounded-lg flex items-center gap-2 border-none">
                  <Download size={16}/>
                  <span className="font-bold tracking-tight text-[13px]">DESCARGAR HISTORIA</span>
                </button>
              </div>

              <div className="flex flex-col gap-14">
                {/* Personal Information Section */}
                <div className="flex flex-col gap-8">
                  <div className="flex justify-between items-center border-b border-slate-50 pb-4">
                    <h3 className="text-lg font-bold text-slate-800">Información personal</h3>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Editar información personal</span>
                      {/* Robust Toggle Switch using standard CSS variables */}
                      <div 
                        onClick={() => setIsEditingPersonal(!isEditingPersonal)}
                        className="cursor-pointer transition-all duration-300"
                        style={{
                          width: '44px',
                          height: '24px',
                          backgroundColor: isEditingPersonal ? 'var(--brand-blue)' : 'var(--slate-200)',
                          borderRadius: '12px',
                          padding: '3px',
                          position: 'relative'
                        }}
                      >
                        <div 
                          className="bg-white shadow-sm transition-all duration-300 transform"
                          style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            translate: isEditingPersonal ? '20px' : '0'
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* High Fidelity Grid - Using new Utilities */}
                  <div className="grid grid-cols-2 gap-x-16 gap-y-10">
                    {[
                      { label: 'NOMBRES', value: personalInfo.nombres, key: 'nombres' },
                      { label: 'APELLIDOS', value: personalInfo.apellidos, key: 'apellidos' },
                      { label: 'FECHA DE NACIMIENTO', value: personalInfo.fechaNacimiento, key: 'fechaNacimiento', placeholder: 'dd/mm/aaaa' },
                      { label: 'GÉNERO', value: personalInfo.genero, key: 'genero', type: 'select', options: ['Hombre', 'Mujer', 'Otro'] },
                      { label: 'LUGAR DE NACIMIENTO', value: personalInfo.lugarNacimiento, key: 'lugarNacimiento' },
                      { label: 'CÉDULA DEL PACIENTE', value: personalInfo.cedula, key: 'cedula' },
                      { label: 'CORREO ELECTRÓNICO', value: personalInfo.email, key: 'email', type: 'email' },
                      { label: 'NÚMERO DE TELÉFONO', value: personalInfo.telefono, key: 'telefono' },
                      { label: 'TELÉFONO DE EMERGENCIA', value: personalInfo.telefonoEmergencia, key: 'telefonoEmergencia' },
                      { label: 'OCUPACIÓN', value: personalInfo.ocupacion, key: 'ocupacion' },
                    ].map((field) => (
                      <div key={field.key} className="flex flex-col gap-2 border-b border-slate-100 pb-2">
                        <label className="text-[10px] text-slate-400 font-black tracking-widest uppercase">{field.label}</label>
                        {field.type === 'select' ? (
                          <div className="relative">
                            <select 
                              disabled={!isEditingPersonal}
                              className="w-full text-base font-bold text-slate-800 bg-transparent border-none outline-none p-0 appearance-none cursor-pointer"
                              value={field.value}
                              onChange={e => setPersonalInfo({...personalInfo, [field.key]: e.target.value})}
                            >
                              {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
                              <ChevronDown size={14} />
                            </div>
                          </div>
                        ) : (
                          <input 
                            type={field.type || 'text'}
                            readOnly={!isEditingPersonal}
                            placeholder={field.placeholder}
                            className="w-full text-base font-bold text-slate-800 bg-transparent border-none outline-none p-0 focus:text-primary transition-colors placeholder:text-slate-200"
                            value={field.value}
                            onChange={e => setPersonalInfo({...personalInfo, [field.key]: e.target.value})}
                          />
                        )}
                      </div>
                    ))}
                    
                    {/* Address Legend Box */}
                    <div className="col-span-2 mt-4">
                       <div className="relative border border-slate-200 rounded-xl p-8 bg-slate-50/20">
                         <span className="absolute -top-3 left-6 bg-white px-2.5 text-[10px] text-slate-400 font-black tracking-widest uppercase">
                           DIRECCIÓN DE RESIDENCIA
                         </span>
                         <textarea 
                           readOnly={!isEditingPersonal}
                           className="w-full min-h-[60px] text-base font-bold text-slate-700 bg-transparent border-none focus:outline-none resize-none leading-relaxed"
                           value={personalInfo.direccion}
                           onChange={e => setPersonalInfo({...personalInfo, direccion: e.target.value})}
                         />
                       </div>
                    </div>
                  </div>
                </div>

                {/* Section: Anamnesis */}
                <div className="flex flex-col gap-8">
                  <div className="flex justify-between items-center border-b border-slate-50 pb-4">
                    <h3 className="text-lg font-bold text-slate-800">Anamnesis</h3>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Editar anamnesis</span>
                      <div className="cursor-pointer" style={{ width: '44px', height: '24px', backgroundColor: 'var(--slate-100)', borderRadius: '12px', padding: '3px', position: 'relative' }}>
                        <div className="bg-white" style={{ width: '18px', height: '18px', borderRadius: '50%' }} />
                      </div>
                    </div>
                  </div>

                  <div className="relative border border-slate-200 rounded-xl p-8 bg-slate-50/20">
                     <span className="absolute -top-3 left-6 bg-white px-2.5 text-[10px] text-slate-400 font-black tracking-widest uppercase">
                       Antecedentes personales
                     </span>
                     <div className="min-h-[40px] text-base font-bold text-slate-300 italic">
                       Sin antecedentes registrados...
                     </div>
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

        {activeTab === 'Historia de pago' && (
          <div className="flex flex-col gap-4 animate-in fade-in duration-300">
            <h2 className="text-2xl font-bold text-slate-800">Historia de Pago</h2>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 flex flex-col items-center justify-center gap-3 text-center mt-2">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-2">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Finanzas al corriente</h3>
              <p className="text-slate-500 text-sm max-w-sm">Este paciente no tiene deudas pendientes. Su historial de transacciones se mostrará aquí cuando se realicen pagos futuros.</p>
            </div>
          </div>
        )}
      </div>
      


      {/* Local Toast Notification Simulation */}
      {toastMessage && (
        <div style={{
          position: 'fixed', bottom: '2rem', right: '2rem', background: 'var(--primary)',
          color: 'white', padding: '1rem 1.5rem', borderRadius: 'var(--radius)',
          boxShadow: 'var(--shadow-md)', zIndex: 100
        }} className="animate-in slide-in-from-bottom-5">
          {toastMessage}
        </div>
      )}

    </div>
  );
};

export default PatientProfile;
