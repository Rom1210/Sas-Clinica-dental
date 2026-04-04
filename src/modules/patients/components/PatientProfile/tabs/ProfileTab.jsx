import React from 'react';
import { Download, ChevronDown } from 'lucide-react';

const ProfileTab = ({ personalInfo, setPersonalInfo, isEditingPersonal, setIsEditingPersonal }) => {
  return (
    <div className="animate-in w-full max-w-6xl mx-auto px-6 py-4">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-md p-16 flex flex-col gap-10">
        
        {/* Main Header */}
        <div className="flex justify-between items-start w-full">
          <div className="flex flex-col gap-1">
            <h2 className="text-[28px] font-bold text-slate-800 leading-tight">Perfil de paciente</h2>
            <p className="text-sm text-slate-400 font-medium">Información clínica base y antecedentes del paciente</p>
          </div>
          <button className="bg-[#0070AC] hover:bg-[#005a8c] text-white px-6 py-2.5 rounded-lg flex items-center gap-2 border-none cursor-pointer transition-colors shadow-sm">
            <Download size={16}/>
            <span className="font-bold tracking-tight text-[13px]">DESCARGAR PERFIL</span>
          </button>
        </div>

        <div className="flex flex-col gap-14">
          {/* Personal Information Section */}
          <div className="flex flex-col gap-8">
            <div className="flex justify-between items-center border-b border-slate-50 pb-4">
              <h3 className="text-lg font-bold text-slate-800">Información personal</h3>
              <div className="flex items-center gap-4">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Editar información personal</span>
                <div 
                  onClick={() => setIsEditingPersonal(!isEditingPersonal)}
                  className="cursor-pointer transition-all duration-300"
                  style={{
                    width: '44px',
                    height: '24px',
                    backgroundColor: isEditingPersonal ? '#0070AC' : '#e2e8f0',
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-10">
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
                        className="w-full text-base font-bold text-slate-800 bg-transparent border-none outline-none p-0 appearance-none cursor-pointer disabled:cursor-default"
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
                      className="w-full text-base font-bold text-slate-800 bg-transparent border-none outline-none p-0 focus:text-[#0070AC] transition-colors placeholder:text-slate-200"
                      value={field.value}
                      onChange={e => setPersonalInfo({...personalInfo, [field.key]: e.target.value})}
                    />
                  )}
                </div>
              ))}
              
              <div className="col-span-1 md:col-span-2 mt-4">
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
                <div className="cursor-not-allowed opacity-50" style={{ width: '44px', height: '24px', backgroundColor: '#e2e8f0', borderRadius: '12px', padding: '3px', position: 'relative' }}>
                  <div className="bg-white shadow-sm" style={{ width: '18px', height: '18px', borderRadius: '50%' }} />
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
  );
};

export default ProfileTab;
