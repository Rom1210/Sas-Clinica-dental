import React, { useState } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight, MoreVertical, Calendar } from 'lucide-react';
import PatientProfile from './PatientProfile';

const PatientDashboard = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  
  const mockPatients = [
    { id: 1, name: 'Fabian Romero', dni: '31325708', email: 'fabanplay@gmail.com', lastVisit: '10 Mar 2026', status: 'Activo', debt: 0, gender: 'M' },
    { id: 2, name: 'Mariana Sosa', dni: '28123456', email: 'msosa@gmail.com', lastVisit: '05 Mar 2026', status: 'En Tratamiento', debt: 150, gender: 'F' },
    { id: 3, name: 'Juan Pérez', dni: '15456789', email: 'jperez@gmail.com', lastVisit: '28 Feb 2026', status: 'Deuda', debt: 45, gender: 'M' },
    { id: 4, name: 'Lucía Blanco', dni: '30987654', email: 'lblanco@gmail.com', lastVisit: '11 Mar 2026', status: 'Activo', debt: 0, gender: 'F' },
  ];

  const filteredPatients = mockPatients.filter(patient => {
    const term = searchTerm.toLowerCase();
    return patient.name.toLowerCase().includes(term) ||
           patient.dni.includes(term) ||
           patient.email.toLowerCase().includes(term);
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Activo': return 'bg-emerald-50 text-emerald-600';
      case 'En Tratamiento': return 'bg-blue-50 text-blue-600';
      case 'Deuda': return 'bg-rose-50 text-rose-600';
      default: return 'bg-slate-50 text-slate-600';
    }
  };

  if (selectedPatient) {
    return <PatientProfile patient={selectedPatient} onBack={() => setSelectedPatient(null)} />;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Search & Actions Bar - Pill Style */}
      <div className="bg-white p-2 rounded-2xl flex items-center justify-between shadow-sm" style={{ border: '1px solid rgba(0,0,0,0.02)' }}>
        <div className="relative flex-1 flex items-center">
          <div className="flex items-center w-full relative">
             <Search size={18} className="absolute left-6 text-slate-400" />
             <input 
               type="text" 
               className="w-full pl-14 pr-4 py-3 bg-transparent border-none text-sm focus:outline-none placeholder:text-slate-400 font-medium text-slate-800"
               placeholder="Buscar pacientes por nombre, cédula o email..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
          </div>
        </div>
        <button className="flex items-center gap-2 px-6 py-2.5 bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all text-sm font-bold border-none cursor-pointer flex-shrink-0">
          <Filter size={16} /> Filtros
        </button>
      </div>

      {/* Patient Cards List */}
      <div className="flex flex-col gap-3">
        {filteredPatients.map((patient) => (
          <div key={patient.id} className="professional-card flex items-center justify-between p-4 px-6 hover:-translate-y-1 hover:shadow-lg transition-all cursor-pointer group">
            <div className="grid grid-cols-12 gap-4 w-full items-center">
               
               {/* Col 1: Paciente */}
               <div className="col-span-3 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-xs font-black text-slate-600 uppercase">
                    {patient.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex flex-col">
                     <span className="text-sm font-bold text-slate-800">{patient.name}</span>
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">ID: {patient.id}092</span>
                  </div>
               </div>
               
               {/* Col 2: Documento */}
               <div className="col-span-2 text-sm font-bold text-slate-600">
                  {patient.dni}
               </div>

               {/* Col 3: Email */}
               <div className="col-span-3 text-sm font-semibold text-slate-500">
                  {patient.email}
               </div>

               {/* Col 4: Estatus */}
               <div className="col-span-2">
                  <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${getStatusBadge(patient.status)}`}>
                    {patient.status}
                  </span>
               </div>

               {/* Col 5: Saldo & Acciones */}
               <div className="col-span-2 flex items-center justify-between">
                  <span className="text-sm font-black text-slate-900 w-16">
                    {patient.debt > 0 ? (
                      <span className="text-rose-600">-${patient.debt}</span>
                    ) : (
                      <span className="text-emerald-600">$0.00</span>
                    )}
                  </span>
                  
                  {/* Quick Actions (visible on hover) */}
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                     <button 
                        onClick={(e) => { e.stopPropagation(); setSelectedPatient(patient); }}
                        className="px-4 py-2 bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-600 rounded-xl hover:bg-primary hover:text-white transition-all border-none cursor-pointer"
                     >
                        Ver Perfil
                     </button>
                     <button className="p-2 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-200 transition-all border-none cursor-pointer">
                        <MoreVertical size={16} />
                     </button>
                  </div>
               </div>

            </div>
          </div>
        ))}
      </div>

      {/* Minimalist Pagination */}
      <div className="flex justify-between items-center px-2 py-4 mt-2">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Página 1 de 12</p>
        <div className="flex items-center gap-2">
           <button className="p-2 bg-white shadow-sm rounded-xl text-slate-400 cursor-not-allowed border-none hover:bg-slate-50 transition-all"><ChevronLeft size={16} /></button>
           <button className="p-2 bg-white shadow-sm rounded-xl text-slate-700 cursor-pointer border-none hover:bg-slate-50 transition-all"><ChevronRight size={16} /></button>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
