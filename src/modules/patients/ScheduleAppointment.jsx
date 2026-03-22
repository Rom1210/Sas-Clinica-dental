import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, User, Stethoscope, FileText, CheckCircle, X, ChevronDown } from 'lucide-react';
import { useData } from '../../context/DataContext';

const ScheduleAppointment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { patients, doctors, services, addAppointment } = useData();

  const [patient, setPatient] = useState(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    time: '08:00',
    doctorId: '',
    reason: '',
    observations: '',
    selectedServices: []
  });

  useEffect(() => {
    if (id && patients) {
      let found = patients.find(p => p.id === id || p.id === parseInt(id));
      if (!found) {
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

  const activeDoctors = useMemo(() => {
    return (doctors || []).filter(d => (d.status || '').toLowerCase() === 'activo');
  }, [doctors]);

  const handleSave = () => {
    if (!formData.doctorId) return alert('Por favor selecciona un profesional.');
    
    const appointmentData = {
      date: formData.date,
      startTime: formData.time,
      patientName: patient.name,
      patientPhone: patient.phone,
      patientEmail: patient.email,
      doctorId: parseInt(formData.doctorId),
      reason: formData.reason,
      observations: formData.observations,
      services: formData.selectedServices,
      totalCost: 0, // Simplified for now
      status: 'Programada'
    };

    addAppointment(appointmentData);
    navigate(`/pacientes/${id}`);
  };

  if (!patient) return <div className="p-10 text-center font-bold text-slate-500 uppercase tracking-widest">Cargando paciente...</div>;

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      
      {/* Header & Back Button */}
      <div className="flex flex-col gap-4">
        <button 
          onClick={() => navigate(`/pacientes/${id}`)}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-semibold text-sm cursor-pointer border-none bg-transparent p-0 w-fit"
        >
          <ArrowLeft size={16} /> Volver al perfil
        </button>
        <div className="flex flex-col">
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Agendar Cita</h1>
          <p className="text-slate-500 font-medium">Nueva cita para {patient.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Main Form Area */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Section: Basic Info */}
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex flex-col gap-8">
             <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                <Calendar size={20} className="text-primary" />
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">1. Fecha y Hora</h3>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fecha de la Cita</label>
                   <input 
                     type="date" 
                     className="w-full bg-slate-50 border-2 border-transparent focus:border-primary/20 focus:bg-white rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none transition-all"
                     value={formData.date}
                     onChange={(e) => setFormData({...formData, date: e.target.value})}
                   />
                </div>
                <div className="flex flex-col gap-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Hora de inicio</label>
                   <input 
                     type="time" 
                     className="w-full bg-slate-50 border-2 border-transparent focus:border-primary/20 focus:bg-white rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none transition-all"
                     value={formData.time}
                     onChange={(e) => setFormData({...formData, time: e.target.value})}
                   />
                </div>
             </div>
          </div>

          {/* Section: Professional */}
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex flex-col gap-8">
             <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                <Stethoscope size={20} className="text-primary" />
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">2. Odont\u00f3logo / Especialista</h3>
             </div>

             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {activeDoctors.map(doc => (
                   <div 
                     key={doc.id}
                     onClick={() => setFormData({...formData, doctorId: doc.id})}
                     className={`p-5 rounded-3xl border-2 cursor-pointer transition-all flex items-center gap-4 relative group ${formData.doctorId === doc.id ? 'border-primary bg-primary/5 ring-4 ring-primary/5' : 'border-slate-50 hover:border-slate-200 hover:bg-slate-50'}`}
                   >
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-sm font-black shadow-lg shadow-black/5" style={{ backgroundColor: doc.color || '#3b82f6' }}>
                         {doc.name.split(' ').map(n=>n[0]).join('')}
                      </div>
                      <div className="flex flex-col">
                         <span className={`text-sm font-black tracking-tight ${formData.doctorId === doc.id ? 'text-primary' : 'text-slate-800'}`}>{doc.name}</span>
                         <span className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">{doc.isSpecialist ? 'Especialista' : 'General'}</span>
                      </div>
                      {formData.doctorId === doc.id && (
                        <div className="absolute top-4 right-4 text-primary">
                          <CheckCircle size={16} />
                        </div>
                      )}
                   </div>
                ))}
             </div>
          </div>

          {/* Section: Details */}
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex flex-col gap-8">
             <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                <FileText size={20} className="text-primary" />
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">3. Detalles de la Consulta</h3>
             </div>

             <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Motivo de la consulta</label>
                   <input 
                     type="text" 
                     placeholder="Ej: Limpieza de rutina, Dolor en muela..."
                     className="w-full bg-slate-50 border-2 border-transparent focus:border-primary/20 focus:bg-white rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none transition-all"
                     value={formData.reason}
                     onChange={(e) => setFormData({...formData, reason: e.target.value})}
                   />
                </div>
                <div className="flex flex-col gap-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Observaciones</label>
                   <textarea 
                     rows="4"
                     placeholder="Anota cualquier detalle relevante o antecedente para esta cita..."
                     className="w-full bg-slate-50 border-2 border-transparent focus:border-primary/20 focus:bg-white rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none transition-all resize-none"
                     value={formData.observations}
                     onChange={(e) => setFormData({...formData, observations: e.target.value})}
                   ></textarea>
                </div>
             </div>
          </div>
        </div>

        {/* Info Sidebar */}
        <div className="lg:col-span-4">
          <div className="sticky top-8 flex flex-col gap-6">
             <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl flex flex-col gap-6 border border-slate-800">
                <h3 className="text-sm font-black uppercase tracking-widest text-primary">Resumen</h3>
                
                <div className="flex flex-col gap-4">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
                         <User size={14} className="text-slate-400" />
                      </div>
                      <div className="flex flex-col">
                         <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Paciente</span>
                         <span className="text-sm font-bold">{patient.name}</span>
                      </div>
                   </div>

                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
                         <Calendar size={14} className="text-slate-400" />
                      </div>
                      <div className="flex flex-col">
                         <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Fecha y Hora</span>
                         <span className="text-sm font-bold">{formData.date} - {formData.time}</span>
                      </div>
                   </div>

                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
                         <Stethoscope size={14} className="text-slate-400" />
                      </div>
                      <div className="flex flex-col">
                         <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Doctor</span>
                         <span className="text-sm font-bold">
                            {formData.doctorId ? activeDoctors.find(d => d.id === formData.doctorId)?.name : 'Sin asignar'}
                         </span>
                      </div>
                   </div>
                </div>

                <div className="h-px bg-slate-800 my-2"></div>

                <div className="flex flex-col gap-3">
                   <button 
                     onClick={handleSave}
                     className="w-full py-4 bg-primary text-white font-black uppercase tracking-widest text-[11px] rounded-2xl hover:bg-blue-600 transition-all border-none cursor-pointer shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                   >
                      <CheckCircle size={16} /> Guardar Cita
                   </button>
                   <button 
                     onClick={() => navigate(`/pacientes/${id}`)}
                     className="w-full py-4 bg-slate-800 text-slate-400 font-black uppercase tracking-widest text-[11px] rounded-2xl hover:bg-slate-700 hover:text-white transition-all border-none cursor-pointer"
                   >
                      <X size={16} className="inline mr-1" /> Cancelar
                   </button>
                </div>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ScheduleAppointment;
