import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Plus, Save, X, UserPlus, Stethoscope, CheckCircle, ChevronDown
} from 'lucide-react';
import { useData } from '../../context/DataContext';

const DoctorForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { doctors, addDoctor, updateDoctor } = useData();
    
    const [formData, setFormData] = useState({
        name: '',
        isSpecialist: false,
        color: '#3b82f6',
        status: 'Activo'
    });

    const isEditing = !!id;

    useEffect(() => {
        if (isEditing) {
            const doctor = doctors.find(d => d.id.toString() === id);
            if (doctor) {
                setFormData({
                    name: doctor.name,
                    isSpecialist: doctor.isSpecialist || false,
                    color: doctor.color || '#3b82f6',
                    status: doctor.status
                });
            }
        }
    }, [id, doctors, isEditing]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.name) return;

        if (isEditing) {
            updateDoctor({ ...formData, id: parseInt(id) });
        } else {
            addDoctor(formData);
        }
        navigate('/settings');
    };

    return (
        <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-start bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-50 relative">
                <div className="flex flex-col">
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight uppercase">
                        {isEditing ? 'Editar Especialista' : 'Nuevo Especialista'}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                        Gestión del equipo médico y especialidades
                    </p>
                </div>
                <button 
                    onClick={() => navigate('/settings')}
                    className="p-3 hover:bg-slate-50 rounded-full transition-all border-none cursor-pointer text-slate-300 hover:text-rose-500"
                >
                    <X size={24} />
                </button>
            </div>

            {/* Form Container */}
            <div className="bg-white rounded-[3rem] p-12 shadow-sm border border-slate-50">
                <form onSubmit={handleSubmit} className="flex flex-col gap-10">
                    {/* Name Field */}
                    <div className="flex flex-col gap-4">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-6">
                            Nombre Completo
                        </label>
                        <div className="flex items-center bg-white border border-slate-100 rounded-full px-8 py-5 shadow-sm focus-within:ring-8 focus-within:ring-primary/5 focus-within:border-primary/20 transition-all group">
                            <input 
                                type="text" 
                                required 
                                placeholder="Ej: Dr. / Dra. ..." 
                                className="w-full bg-transparent border-none outline-none text-lg font-bold text-slate-700 placeholder:text-slate-300" 
                                value={formData.name} 
                                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                            />
                        </div>
                    </div>

                    {/* Classification Selector - Premium Dropdown */}
                    <div className="flex flex-col gap-4">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-6">
                            Categoría del Profesional
                        </label>
                        <div className="relative group">
                            <select 
                                className="w-full bg-white border border-slate-100 rounded-full px-10 py-5 shadow-sm text-lg font-bold text-slate-700 appearance-none cursor-pointer focus:ring-8 focus:ring-primary/5 focus:border-primary/20 transition-all outline-none relative z-10"
                                value={formData.isSpecialist ? 'specialist' : 'general'}
                                onChange={(e) => setFormData({...formData, isSpecialist: e.target.value === 'specialist'})}
                                style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
                            >
                                <option value="general">Odontólogo General</option>
                                <option value="specialist">Profesional Especialista</option>
                            </select>
                            <div className="absolute right-10 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300 group-hover:text-primary transition-colors z-20">
                                <ChevronDown size={22} />
                            </div>
                        </div>
                    </div>

                    {/* Color Selection - Polished */}
                    <div className="flex flex-col gap-4">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-6">
                            Color Identificador para Agenda
                        </label>
                        <div className="flex flex-wrap items-center gap-5 bg-slate-50 border border-slate-100 rounded-[2.5rem] px-10 py-5 shadow-inner">
                            {['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#0f172a'].map(color => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() => setFormData({...formData, color})}
                                    className={`w-12 h-12 rounded-2xl border-2 transition-all duration-300 ${formData.color === color ? 'border-white ring-4 ring-primary shadow-lg scale-110' : 'border-transparent hover:scale-110 opacity-70 hover:opacity-100'}`}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                            <div className="w-px h-10 bg-slate-200 mx-2 hidden sm:block"></div>
                            <div className="flex items-center gap-4 bg-white border border-slate-200 rounded-2xl px-5 py-2.5 shadow-sm group hover:border-primary/30 transition-all">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Color Libre</span>
                                <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-slate-100 flex-shrink-0">
                                    <input 
                                        type="color" 
                                        className="absolute inset-0 w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4 cursor-pointer border-none p-0 scale-150"
                                        value={formData.color}
                                        onChange={(e) => setFormData({...formData, color: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Status Select - Polished */}
                    <div className="flex flex-col gap-4 max-w-sm">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-6">
                            Estado Administrativo
                        </label>
                        <div className="relative group">
                            <select 
                                className="w-full bg-white border border-slate-100 rounded-full px-10 py-5 shadow-sm text-lg font-bold text-slate-700 appearance-none cursor-pointer focus:ring-8 focus:ring-primary/5 focus:border-primary/20 transition-all outline-none relative z-10" 
                                value={formData.status} 
                                onChange={(e) => setFormData({...formData, status: e.target.value})}
                                style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
                            >
                                <option value="Activo">Estado: Activo</option>
                                <option value="Inactivo">Estado: Inactivo</option>
                            </select>
                            <div className="absolute right-10 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300 group-hover:text-primary transition-colors z-20">
                                <ChevronDown size={22} />
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-6 pt-10 border-t border-slate-50">
                        <button 
                            type="button" 
                            onClick={() => navigate('/settings')}
                            className="px-10 py-5 bg-slate-50 text-slate-400 text-[12px] font-black uppercase tracking-widest rounded-full hover:bg-slate-100 transition-all border-none cursor-pointer min-w-[180px]"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit" 
                            className="flex-1 py-5 bg-slate-900 text-white text-[12px] font-black uppercase tracking-widest rounded-full hover:bg-primary transition-all shadow-[0_20px_40px_-10px_rgba(15,23,42,0.15)] hover:shadow-primary/30 border-none cursor-pointer flex items-center justify-center gap-3 group"
                        >
                            <UserPlus size={18} className="group-hover:scale-110 transition-transform" />
                            {isEditing ? 'Guardar Cambios' : 'Registrar Especialista'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DoctorForm;
