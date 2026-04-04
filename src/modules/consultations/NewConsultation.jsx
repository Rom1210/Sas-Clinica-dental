import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, User, CheckCircle2, Phone, Mail } from 'lucide-react';
import { useData } from '../../context/DataContext';

const NewConsultation = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { patients, services, doctors } = useData();
  const [patient, setPatient] = useState(null);

  const activeDoctors = React.useMemo(() => {
    return (doctors || []).filter(d => {
      const status = (d.status || '').toLowerCase();
      return status === 'activo' || status === 'active';
    });
  }, [doctors]);

  useEffect(() => {
    if (id && patients) {
      let found = patients.find(p => p.id === id || p.id === parseInt(id));
      if (!found) {
        // Fallback for mock IDs
        const mockPatients = [
          { id: 1, name: 'Fabian Romero', dni: '31325708', email: 'fabanplay@gmail.com', phone: '04244570903' },
          { id: 2, name: 'Mariana Sosa', dni: '28123456', email: 'msosa@gmail.com', phone: '04121234567' },
          { id: 3, name: 'Juan Pérez', dni: '15456789', email: 'jperez@gmail.com', phone: '04149876543' },
          { id: 4, name: 'Lucía Blanco', dni: '30987654', email: 'lblanco@gmail.com', phone: '04165551234' },
        ];
        found = mockPatients.find(p => p.id === id || p.id === parseInt(id));
      }
      if (found) {
        setPatient(found);
      } else {
        setPatient({ id: parseInt(id), name: 'Paciente Desconocido', email: 'sn@gmail.com', phone: '0000000' });
      }
    }
  }, [id, patients]);

  const [formData, setFormData] = useState({
    doctorId: '',
    notes: '',
    paymentStatus: 'Pendiente'
  });

  const [selectedServices, setSelectedServices] = useState([]);
  const [errors, setErrors] = useState({ doctorId: false });

  const toggleService = (service) => {
    setSelectedServices(prev => 
      prev.some(s => s.id === service.id) 
        ? prev.filter(s => s.id !== service.id)
        : [...prev, service]
    );
  };

  const paymentStatuses = ['Pagado', 'Parcial', 'Pendiente'];
  const subtotal = selectedServices.reduce((sum, s) => sum + s.price, 0);

  const handleScheduleFollowUp = () => {
    if (!formData.doctorId) {
      setErrors({ doctorId: true });
      // Scroll to top to show error
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setErrors({ doctorId: false });

    // Navigate to scheduler and optionally pass the appointment data in state
    navigate('/scheduler', { 
      state: { 
        prefilledPatient: {
          id: patient?.id,
          name: patient?.name,
          email: patient?.email,
          phone: patient?.phone || '04244570903'
        },
        pendingConsultation: {
          doctorId: formData.doctorId,
          services: selectedServices,
          total: subtotal,
          notes: formData.notes
        }
      } 
    });
  };

  if (!patient || !services) return <div className="p-10 text-center font-bold text-slate-500 uppercase tracking-widest flex items-center justify-center">Cargando datos...</div>;

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 max-w-7xl mx-auto w-full">
      {/* Header & Back Button */}
      <div className="flex flex-col gap-4">
        <button 
          onClick={() => navigate(`/pacientes/${id}`)}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-semibold text-sm cursor-pointer border-none bg-transparent p-0 w-fit"
        >
          <ArrowLeft size={16} /> Volver al perfil
        </button>
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Registro de Nueva Consulta</h1>
          <p className="text-sm font-medium text-slate-500">Completa la evaluación clínica y asigna un horario.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column (Forms) */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          
          {/* Section 1: Equipo Médico */}
          <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm flex flex-col gap-6">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">1</span>
              Equipo Médico
            </h3>
            <div className="flex flex-col gap-4 ml-11">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeDoctors.length > 0 ? activeDoctors.map(doc => (
                   <div 
                     key={doc.id}
                     onClick={() => setFormData({...formData, doctorId: doc.id})}
                     className={`p-5 rounded-3xl border-2 cursor-pointer transition-all flex items-center gap-4 relative group ${formData.doctorId === doc.id ? 'border-primary bg-primary/5 ring-4 ring-primary/5' : 'border-slate-50 hover:border-slate-200 hover:bg-slate-50'}`}
                   >
                      <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-black shadow-lg shadow-black/5" style={{ backgroundColor: doc.color || '#3b82f6' }}>
                         {doc.name.split(' ').map(n=>n[0]).join('')}
                      </div>
                      <div className="flex flex-col">
                         <span className={`text-sm font-black tracking-tight ${formData.doctorId === doc.id ? 'text-primary' : 'text-slate-800'}`}>{doc.name}</span>
                         <span className={`text-[9px] font-bold uppercase tracking-widest mt-0.5 ${doc.isSpecialist ? 'text-amber-500' : 'text-slate-400'}`}>{doc.isSpecialist ? 'Especialista' : 'Odontólogo General'}</span>
                      </div>
                      {formData.doctorId === doc.id && (
                        <div className="absolute top-4 right-4 text-primary">
                          <CheckCircle2 size={16} />
                        </div>
                      )}
                   </div>
                )) : (
                  <div className="col-span-full py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center">
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No hay miembros del equipo médico registrados</p>
                  </div>
                )}
              </div>
              {errors.doctorId && <span className="text-xs text-red-500 font-bold mt-1 px-2">Selecciona un doctor.</span>}
            </div>
          </div>

          {/* Section 2: Tratamientos */}
          <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">2</span>
                Tratamientos
              </h3>
              <span className="text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg">{selectedServices.length} seleccionados</span>
            </div>
            <div className="flex flex-col gap-3 ml-11">
              {services.map(s => {
                const isSelected = selectedServices.some(sel => sel.id === s.id);
                return (
                  <div 
                    key={s.id} 
                    onClick={() => toggleService(s)}
                    className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer border-2 transition-all group ${isSelected ? 'border-primary bg-primary/5 ring-4 ring-primary/5' : 'border-slate-50 hover:border-slate-200 bg-slate-50 hover:bg-white'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${isSelected ? 'border-primary bg-primary text-white' : 'border-slate-300 bg-white group-hover:border-slate-400'}`}>
                        {isSelected && <CheckCircle2 size={14} />}
                      </div>
                      <div className="flex flex-col">
                        <span className={`text-sm font-bold ${isSelected ? 'text-primary' : 'text-slate-800'}`}>{s.name}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Precio por unidad</span>
                      </div>
                    </div>
                    <div className={`px-4 py-2 rounded-xl text-sm font-black transition-all ${isSelected ? 'bg-white shadow-sm text-primary' : 'bg-white border border-slate-100 text-slate-700'}`}>
                      ${s.price.toFixed(2)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: Finanzas & Estado de pago */}
          <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm flex flex-col gap-6">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">3</span>
              Finanzas & Estado de pago
            </h3>
            
            <div className="ml-11 flex flex-col gap-6">
              {/* Dynamic Summary */}
              <div className="bg-slate-50 rounded-2xl p-6 flex flex-col gap-4 border border-slate-100">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Servicios Seleccionados</span>
                
                {selectedServices.length === 0 ? (
                  <div className="py-4 text-center">
                     <span className="text-sm font-medium text-slate-400 italic">No hay servicios seleccionados.</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {selectedServices.map(s => (
                      <div key={s.id} className="flex justify-between items-center text-sm font-bold text-slate-600 border-b border-slate-100/50 pb-2 last:border-0 last:pb-0">
                        <span>{s.name}</span>
                        <span className="text-slate-800">${s.price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="h-px w-full bg-slate-200 my-2"></div>
                
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-slate-800 uppercase tracking-widest">Subtotal</span>
                  <span className="text-2xl font-black text-primary">${subtotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Estado de Pago</label>
                <select 
                  className="w-full bg-slate-50 border-2 border-transparent focus:bg-white focus:border-primary/20 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none transition-all cursor-pointer appearance-none"
                  value={formData.paymentStatus}
                  onChange={e => setFormData({...formData, paymentStatus: e.target.value})}
                >
                  {paymentStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Section 4: Notas internas */}
          <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">4</span>
                 Notas Internas
              </h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-50 px-2 py-1 rounded-lg">Solo Doctor</span>
            </div>
            <div className="ml-11">
              <textarea 
                placeholder="Anotaciones privadas, recordatorios para la próxima sesión..."
                className="w-full bg-slate-50 border-2 border-transparent focus:bg-white focus:border-primary/20 rounded-2xl p-5 min-h-[100px] text-sm font-medium focus:outline-none transition-all resize-y text-slate-700"
                value={formData.notes}
                onChange={e => setFormData({...formData, notes: e.target.value})}
              />
            </div>
          </div>

        </div>

        {/* Right Column (Sticky Summary) */}
        <div className="lg:col-span-4 relative">
          <div className="sticky top-8 flex flex-col gap-6">
             <div className="bg-slate-900 rounded-[2rem] p-8 shadow-2xl flex flex-col gap-8 border border-slate-800">
                
                {/* Patient summary */}
                <div className="flex flex-col gap-5">
                   <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Información del Paciente</h3>
                   <div className="flex flex-col gap-4">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-slate-800 flex items-center justify-center flex-shrink-0">
                           <User size={18} className="text-slate-300" />
                        </div>
                        <div className="flex flex-col">
                           <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nombre</span>
                           <span className="text-sm font-bold text-white line-clamp-1">{patient.name}</span>
                        </div>
                     </div>
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-slate-800 flex items-center justify-center flex-shrink-0">
                           <Phone size={18} className="text-slate-300" />
                        </div>
                        <div className="flex flex-col">
                           <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Teléfono</span>
                           <span className="text-sm font-bold text-white">{patient.phone || 'No registrado'}</span>
                        </div>
                     </div>
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-slate-800 flex items-center justify-center flex-shrink-0">
                           <Mail size={18} className="text-slate-300" />
                        </div>
                        <div className="flex flex-col">
                           <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Email</span>
                           <span className="text-sm font-bold text-white line-clamp-1">{patient.email}</span>
                        </div>
                     </div>
                   </div>
                </div>

                <div className="h-px bg-slate-800"></div>

                {/* Appointment summary */}
                <div className="flex flex-col gap-5">
                   <div className="flex items-center justify-between">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Resumen de Cita</h3>
                      <Calendar size={14} className="text-slate-500" />
                   </div>
                   
                   <div className="flex flex-col gap-3 bg-slate-800/50 p-4 rounded-2xl">
                     <div className="flex items-center justify-between">
                       <span className="text-xs font-medium text-slate-400">Servicios ({selectedServices.length})</span>
                       <span className="text-xs font-bold text-white">${subtotal.toFixed(2)}</span>
                     </div>
                     <div className="flex items-center justify-between mt-1">
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Estado P.</span>
                       <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                         formData.paymentStatus === 'Pagado' ? 'bg-emerald-500/20 text-emerald-400' : 
                         formData.paymentStatus === 'Parcial' ? 'bg-amber-500/20 text-amber-400' : 
                         'bg-slate-700 text-slate-300'
                       }`}>
                         {formData.paymentStatus}
                       </span>
                     </div>
                   </div>
                </div>

                <div className="flex flex-col gap-3 mt-4">
                   <button 
                     onClick={handleScheduleFollowUp}
                     className="w-full py-4 bg-primary text-white font-black uppercase tracking-widest text-[11px] rounded-2xl hover:bg-blue-600 transition-all border-none cursor-pointer shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.5)] transform hover:-translate-y-0.5 active:translate-y-0"
                   >
                      Ver horarios disponibles
                   </button>
                   <button 
                     onClick={() => navigate(`/pacientes/${id}`)}
                     className="w-full py-4 bg-slate-800 border border-slate-700 text-slate-400 font-black uppercase tracking-widest text-[11px] rounded-2xl hover:bg-slate-700/80 hover:text-white transition-all cursor-pointer"
                   >
                      Cancelar
                   </button>
                </div>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default NewConsultation;
