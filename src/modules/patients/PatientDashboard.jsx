import React, { useState } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight, MoreVertical, Calendar, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';

const PatientDashboard = () => {
  const { patients, loading } = useData();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPatients = patients.filter(patient => {
    const term = searchTerm.toLowerCase();
    const fullName = patient.name || '';
    const dni = patient.dni || '';
    const email = patient.email || '';
    return fullName.toLowerCase().includes(term) ||
           dni.includes(term) ||
           email.toLowerCase().includes(term);
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active': return 'bg-emerald-50 text-emerald-600';
      case 'in_treatment': return 'bg-blue-50 text-blue-600';
      case 'follow_up': return 'bg-amber-50 text-amber-600';
      case 'archived': return 'bg-slate-50 text-slate-600';
      default: return 'bg-slate-50 text-slate-600';
    }
  };


  return (
    <div className="flex flex-col gap-6">
      {/* Search & Actions Bar - Pill Style */}
      <div className="bg-white p-2 rounded-2xl flex items-center justify-between shadow-sm" style={{ border: '1px solid rgba(0,0,0,0.02)' }}>
        <div className="flex-1 flex items-center">
          <div className="flex items-center w-full">
             <div className="pl-5 pr-3 flex items-center justify-center flex-shrink-0">
               <Search size={18} className="text-slate-400" />
             </div>
             <input 
               type="text" 
               className="w-full pr-4 py-3 bg-transparent border-none text-sm focus:outline-none placeholder:text-slate-400 font-medium text-slate-800 tracking-tight"
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

      {/* Loading state */}
      {loading && (
        <div className="flex justify-center p-12">
           <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      )}

      {/* Empty state */}
      {!loading && filteredPatients.length === 0 && (
        <div className="text-center p-12 bg-white rounded-3xl border border-slate-100 shadow-sm">
           <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No se encontraron pacientes</p>
        </div>
      )}

      {/* Patient Cards List */}
      <div className="flex flex-col gap-3">
        {filteredPatients.map((patient) => (
          <div 
            key={patient.id} 
            onClick={() => navigate(`/pacientes/${patient.id}`)}
            className="professional-card flex items-center justify-between p-4 px-6 hover:-translate-y-1 hover:shadow-lg transition-all cursor-pointer group"
          >
            <div className="grid grid-cols-12 gap-4 w-full items-center">
               
               {/* Col 1: Paciente */}
               <div className="col-span-3 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-xs font-black text-slate-600 uppercase">
                    {(patient.name || "P").split(' ').map(n => n[0]).join('').substring(0, 2)}
                  </div>
                  <div className="flex flex-col">
                     <span className="text-sm font-bold text-slate-800">{patient.name || patient.email}</span>
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">ID: {patient.id.substring(0, 8)}...</span>
                  </div>
               </div>
               
               {/* Col 2: Documento */}
               <div className="col-span-2 text-sm font-bold text-slate-600">
                  {patient.dni || 'S/D'}
               </div>

               {/* Col 3: Email */}
               <div className="col-span-3 text-sm font-semibold text-slate-500">
                  {patient.email || 'No cuenta con email'}
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
                        onClick={(e) => { e.stopPropagation(); navigate(`/pacientes/${patient.id}`); }}
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
