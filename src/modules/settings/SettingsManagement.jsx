import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext';
import { useData } from '../../context/DataContext';
import { 
  Settings, Users, ClipboardList, RefreshCw, Plus, Save, 
  Trash2, ShieldCheck, Briefcase, X, Edit2, AlertTriangle, CheckCircle, 
  Stethoscope, UserPlus, ChevronRight
} from 'lucide-react';

const SettingsManagement = () => {
    const navigate = useNavigate();
    const { exchangeRate, updateExchangeRate } = useSettings();
    const { 
        services, removeService,
        doctors, removeDoctor 
    } = useData();
    const [tempRate, setTempRate] = useState(exchangeRate);

    const [deleteConfirm, setDeleteConfirm] = useState(null);

    // Update tempRate if external exchangeRate changes
    React.useEffect(() => {
        setTempRate(exchangeRate);
    }, [exchangeRate]);

    const handleDelete = () => {
       if (deleteConfirm.type === 'service') {
          removeService(deleteConfirm.id);
       } else {
          removeDoctor(deleteConfirm.id);
       }
       setDeleteConfirm(null);
    };

    const handleSaveRate = () => {
       updateExchangeRate(parseFloat(tempRate));
       alert('Tasa de cambio actualizada globalmente.');
    };

    return (
       <div className="flex flex-col gap-8 pb-20">
          <div className="flex justify-between items-center border-b border-slate-100 pb-6">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                    <Settings size={24} />
                </div>
                <div className="flex flex-col">
                    <h2 className="text-2xl font-black text-slate-800 tracking-tighter uppercase">Configuración Maestra</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Catálogo y Gestión de Equipo</p>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             {/* Exchange Rate & Global Config */}
             <div className="professional-card p-8 bg-slate-900 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8">
                   <RefreshCw size={48} className="text-white/5" />
                </div>
                <div className="relative z-10">
                   <div className="flex items-center gap-2 mb-8">
                      <div className="p-2 bg-primary rounded-xl">
                         <RefreshCw size={16} className="text-white" />
                      </div>
                      <span className="text-xs font-black uppercase tracking-widest">Tasa de Cambio (Bimoneda)</span>
                   </div>

                   <div className="flex flex-col gap-6">
                      <div className="flex flex-col">
                         <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Valor Actual (VES/USD)</label>
                         <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
                            <input
                               type="number"
                               step="0.01"
                               className="bg-slate-800 border-none rounded-2xl px-4 py-4 text-2xl font-black text-white outline-none w-28"
                               value={tempRate}
                               onChange={(e) => setTempRate(e.target.value)}
                            />
                            <button
                               onClick={handleSaveRate}
                               className="px-5 py-4 bg-primary text-white text-[10px] whitespace-nowrap font-black uppercase tracking-widest rounded-2xl hover:bg-blue-700 transition-all border-none cursor-pointer"
                            >
                               Actualizar Tasa
                            </button>
                         </div>
                      </div>
                   </div>
                </div>
             </div>

             {/* System Integrity & Team */}
             <div className="professional-card p-8 flex flex-col gap-6 bg-slate-50 border-none relative overflow-hidden group">
                <div className="flex items-center gap-2">
                   <ShieldCheck className="text-emerald-500" size={20} />
                   <span className="text-xs font-black text-slate-800 uppercase tracking-tight">Seguridad y Equipo</span>
                </div>
                <div className="flex flex-col gap-4">
                   <div className="flex justify-between items-center py-3 border-b border-slate-200">
                      <span className="text-xs font-bold text-slate-500">Versión SmartDental</span>
                      <span className="text-xs font-black text-slate-900 uppercase">2.1 Elite</span>
                   </div>
                   <button 
                      onClick={() => navigate('/settings/team')}
                      className="w-full flex justify-between items-center py-4 px-6 bg-white border border-slate-100 rounded-2xl hover:border-primary hover:shadow-lg transition-all text-left group border-none cursor-pointer"
                   >
                      <div className="flex items-center gap-3">
                         <div className="p-2 bg-primary/10 rounded-xl text-primary font-black uppercase tracking-widest">
                            <UserPlus size={16} />
                         </div>
                         <div className="flex flex-col">
                            <span className="text-xs font-black text-slate-800 uppercase tracking-tight">Gestionar Equipo</span>
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Invitaciones y Roles</span>
                         </div>
                      </div>
                      <ChevronRight size={16} className="text-slate-200 group-hover:text-primary transition-colors" />
                   </button>
                </div>
             </div>

             {/* Doctors Management */}
             <div className="professional-card p-0 overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-50 flex justify-between items-center bg-white">
                   <div className="flex items-center gap-2">
                      <Briefcase size={16} className="text-primary" />
                      <h3 className="text-sm font-black text-slate-800 tracking-tight uppercase">Equipo Médico</h3>
                   </div>
                   <button 
                      onClick={() => navigate('/settings/new-doctor')}
                      className="p-2 hover:bg-primary/10 rounded-xl transition-all border-none cursor-pointer group"
                   >
                      <Plus size={16} className="text-slate-400 group-hover:text-primary" />
                   </button>
                </div>
                <div className="p-4 flex flex-col gap-2">
                   {doctors?.map(doc => (
                       <div key={doc.id} className="flex flex-wrap sm:flex-nowrap justify-between items-center p-5 bg-white rounded-[2rem] border border-slate-100 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all group gap-4 mb-3">
                          <div className="flex items-center gap-5">
                             <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shadow-black/5 relative overflow-hidden" style={{ backgroundColor: doc.color || '#3b82f6' }}>
                                <span className="text-white text-xs font-black relative z-10">{doc.name?.split(' ').map(n=>n[0]).join('') || 'DR'}</span>
                                <div className="absolute inset-0 bg-white/10"></div>
                             </div>
                             <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                   <span className="text-sm font-black text-slate-800 tracking-tight">{doc.name}</span>
                                   <div className="w-2 h-2 rounded-full" style={{ backgroundColor: doc.color || '#3b82f6' }}></div>
                                </div>
                                <span className={`text-[9px] font-black uppercase tracking-widest mt-1 px-2 py-0.5 rounded-md w-fit ${doc.isSpecialist ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                                   {doc.isSpecialist ? 'Especialista' : 'Odontólogo General'}
                                </span>
                             </div>
                          </div>
                         <div className="flex items-center gap-6">
                            <div className="flex flex-col items-end">
                               <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${doc.status === 'Activo' ? 'text-emerald-600 bg-emerald-50 border border-emerald-100' : 'text-slate-400 bg-slate-50 border border-slate-100'}`}>
                                  {doc.status}
                               </span>
                            </div>
                            <div className="flex gap-2">
                               <button 
                                   onClick={() => navigate(`/settings/edit-doctor/${doc.id}`)} 
                                   className="w-10 h-10 flex items-center justify-center bg-slate-50 hover:bg-primary/10 rounded-xl border-none cursor-pointer text-slate-400 hover:text-primary transition-all"
                                   title="Editar"
                               >
                                  <Edit2 size={14} />
                               </button>
                               <button 
                                   onClick={() => setDeleteConfirm({ id: doc.id, type: 'doctor', name: doc.name })} 
                                   className="w-10 h-10 flex items-center justify-center bg-slate-50 hover:bg-rose-50 rounded-xl border-none cursor-pointer text-slate-400 hover:text-rose-500 transition-all"
                                   title="Eliminar"
                               >
                                  <Trash2 size={14} />
                               </button>
                            </div>
                         </div>
                      </div>
                   ))}
                </div>
             </div>

             {/* Services & Catalog */}
             <div className="professional-card p-0 overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-50 flex justify-between items-center bg-white">
                   <div className="flex items-center gap-2">
                      <ClipboardList size={16} className="text-primary" />
                      <h3 className="text-sm font-black text-slate-800 tracking-tight uppercase">Catálogo de Servicios</h3>
                   </div>
                   <button 
                      onClick={() => navigate('/settings/new-service')}
                      className="p-2 hover:bg-primary/10 rounded-xl transition-all border-none cursor-pointer group"
                   >
                      <Plus size={16} className="text-slate-400 group-hover:text-primary" />
                   </button>
                </div>
                <div className="p-4 flex flex-col gap-2">
                   {services?.map(ser => (
                      <div key={ser.id} className="flex justify-between items-center p-5 bg-white rounded-2xl border border-slate-100 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all group gap-4 mb-2">
                         <div className="flex flex-col">
                            <span className="text-sm font-black text-slate-800 tracking-tight">{ser.name}</span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Precio por Unidad</span>
                         </div>
                         <div className="flex items-center gap-6">
                            <div className="flex flex-col items-end">
                               <span className="text-sm font-black text-primary bg-primary/5 px-3 py-1 rounded-full border border-primary/10">
                                  ${ser.price}
                               </span>
                            </div>
                            <div className="flex gap-2">
                               <button 
                                   onClick={() => navigate(`/settings/edit-service/${ser.id}`)} 
                                   className="w-9 h-9 flex items-center justify-center bg-slate-50 hover:bg-primary/10 rounded-xl border-none cursor-pointer text-slate-400 hover:text-primary transition-all"
                                   title="Editar"
                               >
                                  <Edit2 size={13} />
                               </button>
                               <button 
                                   onClick={() => setDeleteConfirm({ id: ser.id, type: 'service', name: ser.name })} 
                                   className="w-9 h-9 flex items-center justify-center bg-slate-50 hover:bg-rose-50 rounded-xl border-none cursor-pointer text-slate-400 hover:text-rose-500 transition-all"
                                   title="Eliminar"
                               >
                                  <Trash2 size={13} />
                               </button>
                            </div>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          </div>

          {/* Delete Confirmation */}
          {deleteConfirm && (
             <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[9999] p-4">
                <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl flex flex-col items-center gap-6 animate-in zoom-in-95 duration-200">
                   <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center text-rose-500">
                      <AlertTriangle size={32} />
                   </div>
                   <div className="text-center">
                      <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">¿Eliminar {deleteConfirm.type === 'service' ? 'Servicio' : 'Especialista'}?</h3>
                      <p className="text-xs text-slate-400 font-bold mt-2 text-center px-4">Estás a punto de eliminar a <b>{deleteConfirm.name}</b> de forma permanente.</p>
                   </div>
                   <div className="flex gap-3 w-full">
                      <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-4 bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-200 transition-all border-none cursor-pointer">Cancelar</button>
                      <button onClick={handleDelete} className="flex-1 py-4 bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-rose-700 transition-all border-none cursor-pointer">Eliminar</button>
                   </div>
                </div>
             </div>
          )}
       </div>
    );
};

export default SettingsManagement;


