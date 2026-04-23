import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { Search, Filter, ChevronLeft, ChevronRight, MoreVertical, Loader2, Trash2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';

const PatientDashboard = () => {
  const { patients, loading, deletePatient: deletePatientFromContext } = useData();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [patientToDelete, setPatientToDelete] = useState(null);

  const handleDelete = async () => {
    if (!patientToDelete) return;
    try {
      await deletePatientFromContext(patientToDelete.id);
      setPatientToDelete(null);
    } catch (err) {
      console.error('Error deleting patient:', err);
      const msg = err.message?.toLowerCase().includes('foreign key')
        ? 'No se puede eliminar el paciente porque tiene consultas, citas o pagos registrados.'
        : `No se pudo eliminar al paciente: ${err.message || 'Error técnico'}`;
      alert(msg);
    }
  };

  const filteredPatients = patients.filter(patient => {
    if (patient.status === 'archived') return false; // hide soft-deleted patients
    const term = searchTerm.toLowerCase();
    const fullName = patient.name || '';
    const dni = patient.dni || '';
    const email = patient.email || '';
    return (
      fullName.toLowerCase().includes(term) ||
      dni.includes(term) ||
      email.toLowerCase().includes(term)
    );
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
    <div className="flex flex-col gap-5">
      {/* Search & Actions Bar */}
      <div 
        className="bg-white/80 backdrop-blur-md flex items-center justify-between relative z-10"
        style={{
          borderRadius: '1.5rem',
          padding: '0.5rem 0.75rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
          border: '1px solid rgba(255,255,255,0.6)',
          transition: 'all 0.3s ease'
        }}
        onFocus={(e) => { e.currentTarget.style.boxShadow = '0 8px 30px rgba(37,99,235,0.08)'; e.currentTarget.style.borderColor = 'rgba(37,99,235,0.2)'; }}
        onBlur={(e) => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.6)'; }}
      >
        <div className="flex-1 flex items-center">
          <div className="flex items-center w-full">
            <div className="pl-3 pr-2 flex items-center justify-center flex-shrink-0">
              <Search size={16} className="text-slate-400" strokeWidth={2.5} />
            </div>
            <input
              type="text"
              className="w-full pr-4 bg-transparent border-none focus:outline-none font-bold text-slate-800 tracking-tight"
              style={{ fontSize: '13px', padding: '0.375rem 0' }}
              placeholder="Buscar pacientes por nombre, cédula o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <button 
          className="flex items-center gap-1.5 bg-slate-900 text-white rounded-full flex-shrink-0 cursor-pointer border-none"
          style={{ padding: '0.5rem 1.25rem', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', transition: 'all 0.3s ease', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
          onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#2563EB'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(37,99,235,0.3)'; }}
          onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#0f172a'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)'; }}
        >
          <Filter size={12} strokeWidth={2.5} /> Filtros
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex justify-center p-8">
          <Loader2 className="animate-spin text-primary" size={24} />
        </div>
      )}

      {/* Empty state */}
      {!loading && filteredPatients.length === 0 && (
        <div className="text-center p-8 bg-white rounded-[1.5rem] border border-slate-100 shadow-sm">
          <p className="font-bold uppercase tracking-widest text-slate-400" style={{ fontSize: '10px' }}>No se encontraron pacientes</p>
        </div>
      )}

      {/* Patient Cards List */}
      <div className="flex flex-col gap-3">
        {filteredPatients.map((patient) => (
          <div
            key={patient.id}
            onClick={() => navigate(`/pacientes/${patient.id}`)}
            className="relative bg-white/60 backdrop-blur-md cursor-pointer"
            style={{
              borderRadius: '1.25rem',
              padding: '0.75rem 1.5rem',
              border: '1px solid rgba(255,255,255,0.8)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            onMouseOver={(e) => { 
              e.currentTarget.style.backgroundColor = '#ffffff'; 
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.05)'; 
              e.currentTarget.style.borderColor = 'rgba(37,99,235,0.15)'; 
              e.currentTarget.style.transform = 'translateY(-2px)';
              
              const nameSpan = e.currentTarget.querySelector('.patient-name');
              if (nameSpan) nameSpan.style.color = '#2563EB';
            }}
            onMouseOut={(e) => { 
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.6)'; 
              e.currentTarget.style.boxShadow = 'none'; 
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.8)'; 
              e.currentTarget.style.transform = 'translateY(0)';
              
              const nameSpan = e.currentTarget.querySelector('.patient-name');
              if (nameSpan) nameSpan.style.color = '#1e293b';
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.99)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          >
            <div className="flex flex-wrap lg:flex-nowrap items-center gap-4 w-full pointer-events-none">
              
              {/* Col 1: Paciente Avatar & Info */}
              <div className="flex items-center gap-3 min-w-[240px] flex-[1.5]">
                <div className="relative">
                  <div className="rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-500 uppercase shadow-sm"
                       style={{ width: '40px', height: '40px', fontSize: '13px', border: '2px solid #ffffff', transition: 'all 0.5s' }}
                  >
                    {(patient.name || 'P').split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                  </div>
                  <div className="absolute bottom-0 right-0 bg-emerald-500 rounded-full shadow-sm" style={{ width: '12px', height: '12px', border: '2px solid #ffffff' }}></div>
                </div>
                <div className="flex flex-col">
                  <span className="font-black text-slate-800 leading-none mb-1 patient-name" style={{ fontSize: '14px', transition: 'color 0.2s' }}>{patient.name || patient.email}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-slate-400 uppercase tracking-widest px-2 py-0.5 rounded-full" style={{ fontSize: '8px', backgroundColor: 'rgba(241, 245, 249, 0.8)', transition: 'all 0.2s' }}>ID: {patient.id.substring(0, 6)}</span>
                  </div>
                </div>
              </div>

              {/* Col 2: Documento */}
              <div className="flex flex-col min-w-[100px] flex-1">
                <span className="font-black uppercase text-slate-400 mb-1 opacity-70" style={{ fontSize: '8px', letterSpacing: '0.15em' }}>Cédula</span>
                <span className="font-extrabold text-slate-700 tracking-tight" style={{ fontSize: '12px' }}>{patient.dni || 'S/D'}</span>
              </div>

              {/* Col 3: Contacto */}
              <div className="flex flex-col min-w-[150px] flex-[1.2]">
                <span className="font-black uppercase text-slate-400 mb-1 opacity-70" style={{ fontSize: '8px', letterSpacing: '0.15em' }}>Contacto</span>
                <span className="font-bold text-slate-500 truncate transition-colors" style={{ fontSize: '12px' }}>{patient.email || '—'}</span>
              </div>

              {/* Col 4: Estatus */}
              <div className="flex flex-col min-w-[100px] items-start">
                <span className="font-black uppercase text-slate-400 mb-1 opacity-70" style={{ fontSize: '8px', letterSpacing: '0.15em' }}>Estado</span>
                <div className={`px-3 py-1 rounded-full font-black uppercase tracking-widest ${getStatusBadge(patient.status)} shadow-sm border border-transparent transition-colors`} style={{ fontSize: '8px' }}>
                  {patient.status.replace('_', ' ')}
                </div>
              </div>

              {/* Col 5: Saldo */}
              <div className="flex flex-col items-end min-w-[100px] flex-1 ml-auto">
                <span className="font-black uppercase text-slate-400 mb-0.5 opacity-70" style={{ fontSize: '8px', letterSpacing: '0.15em' }}>Saldo Deuda</span>
                <div className="flex flex-col items-end gap-0">
                  <span className={`font-[1000] tracking-tighter ${patient.debt > 0 ? 'text-rose-500' : 'text-emerald-500'}`} style={{ fontSize: '15px' }}>
                    {patient.debt > 0 ? `-$${patient.debt.toLocaleString('es-ES', { minimumFractionDigits: 2 })}` : '$0.00'}
                  </span>
                  {patient.debt > 0 && <span className="font-black text-rose-400 uppercase tracking-widest mt-0.5" style={{ fontSize: '7px', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}>Pendiente</span>}
                </div>
              </div>

            </div>
          </div>
        ))}
      </div>

      {/* Modernized Pagination Dock */}
      <div 
        className="mx-auto mt-6 flex justify-between items-center bg-white/80 backdrop-blur-md max-w-xl w-full z-30"
        style={{ 
          position: 'sticky', bottom: '1.5rem', 
          borderRadius: '9999px', padding: '0.5rem 1rem', 
          border: '1px solid rgba(255,255,255,0.6)', 
          boxShadow: '0 8px 30px rgba(0,0,0,0.06)' 
        }}
      >
        <div className="flex items-center gap-3">
           <div className="rounded-full bg-slate-900 flex items-center justify-center text-white"
                style={{ width: '28px', height: '28px', fontSize: '10px', fontWeight: 900, boxShadow: '0 4px 6px -1px rgba(15,23,42,0.2)' }}
           >1</div>
           <p className="font-black text-slate-400 uppercase" style={{ fontSize: '8px', letterSpacing: '0.15em' }}>Página 1 de 1</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            className="flex items-center gap-1.5 bg-transparent text-slate-400 rounded-full cursor-not-allowed border-none"
            style={{ padding: '0.5rem 1rem', fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', transition: 'all 0.3s ease' }}
          >
             <ChevronLeft size={14} strokeWidth={2.5} /> Anterior
          </button>
          <button 
            className="flex items-center gap-1.5 bg-white text-slate-700 rounded-full cursor-pointer"
            style={{ padding: '0.5rem 1rem', fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', border: '1px solid rgba(226,232,240,0.6)', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', transition: 'all 0.3s ease' }}
            onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#2563EB'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#2563EB'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 12px -2px rgba(37,99,235,0.25)'; }}
            onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; e.currentTarget.style.color = '#334155'; e.currentTarget.style.borderColor = 'rgba(226,232,240,0.6)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)'; }}
          >
             Siguiente <ChevronRight size={14} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal — Portal renders at document.body to escape stacking context */}
      {patientToDelete && ReactDOM.createPortal(
        <>
          {/* Full-screen blur overlay */}
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9998,
              background: 'rgba(15, 23, 42, 0.45)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
            }}
            onClick={() => setPatientToDelete(null)}
          />
          {/* Floating card — top-right corner */}
          <div
            style={{
              position: 'fixed',
              top: '1.25rem',
              right: '1.25rem',
              zIndex: 9999,
              width: '340px',
              background: 'white',
              borderRadius: '1.5rem',
              padding: '1.75rem',
              boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
            }}
          >
            <div className="flex flex-col items-center text-center gap-5">
              <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500">
                <AlertCircle size={30} strokeWidth={2.5} />
              </div>
              <div className="flex flex-col gap-1.5">
                <h3 className="text-lg font-black text-slate-800 tracking-tight">¿Eliminar paciente?</h3>
                <p className="text-sm font-medium text-slate-500 leading-relaxed">
                  Estás a punto de borrar a <span className="text-slate-900 font-bold">{patientToDelete.name}</span>. Esta acción es definitiva y no se puede deshacer.
                </p>
              </div>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setPatientToDelete(null)}
                  className="flex-1 px-5 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all border-none cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-5 py-3 bg-rose-500 text-white rounded-xl font-bold text-sm hover:bg-rose-600 shadow-lg shadow-rose-200 transition-all border-none cursor-pointer"
                >
                  Sí, eliminar
                </button>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
};

export default PatientDashboard;
