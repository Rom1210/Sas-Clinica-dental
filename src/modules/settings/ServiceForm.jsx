import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Plus, Save, X, ClipboardList, ArrowLeft 
} from 'lucide-react';
import { useData } from '../../context/DataContext';

const ServiceForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { services, addService, updateService } = useData();
    
    const [formData, setFormData] = useState({
        name: '',
        price: '',
    });

    const isEditing = !!id;

    useEffect(() => {
        if (isEditing) {
            const service = services.find(s => s.id.toString() === id);
            if (service) {
                setFormData({
                    name: service.name,
                    price: service.price.toString(),
                });
            }
        }
    }, [id, services, isEditing]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.name || !formData.price) return;

        const data = {
            name: formData.name,
            price: parseFloat(formData.price),
            cat: 'General'
        };

        if (isEditing) {
            updateService({ ...data, id: parseInt(id) });
        } else {
            addService(data);
        }
        navigate('/settings');
    };

    return (
        <div className="flex flex-col gap-8 animate-in fade-in duration-500 pb-20 max-w-4xl mx-auto">
            {/* Header / Page Title as per image */}
            <div className="flex justify-between items-start bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-50 relative">
                <div className="flex flex-col">
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight uppercase">
                        {isEditing ? 'Guardar Cambios' : 'Nuevo Servicio'}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                        Definir parámetros del catálogo
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
                <form onSubmit={handleSubmit} className="flex flex-col gap-12">
                    {/* Name Field */}
                    <div className="flex flex-col gap-4">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-6">
                            Nombre del Servicio
                        </label>
                        <div className="flex items-center bg-white border border-slate-100 rounded-full px-8 py-5 shadow-sm focus-within:ring-8 focus-within:ring-primary/5 focus-within:border-primary/20 transition-all group">
                            <ClipboardList className="text-slate-300 mr-4 group-focus-within:text-primary transition-colors" size={22} />
                            <input 
                                type="text" 
                                required 
                                placeholder="Ej: Limpieza, Resina, Extracción..." 
                                className="w-full bg-transparent border-none outline-none text-lg font-bold text-slate-700 placeholder:text-slate-300" 
                                value={formData.name} 
                                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                            />
                        </div>
                    </div>

                    {/* Price Section */}
                    <div className="flex flex-col gap-4 max-w-sm">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-6">
                            Precio por Unidad (USD)
                        </label>
                        <div className="flex items-center bg-white border border-slate-100 rounded-full px-8 py-5 shadow-sm focus-within:ring-8 focus-within:ring-primary/5 focus-within:border-primary/20 transition-all group">
                            <span className="text-slate-300 font-black text-xl mr-4 group-focus-within:text-primary transition-colors">$</span>
                            <input 
                                type="number" 
                                step="0.01" 
                                required 
                                placeholder="0.00" 
                                className="w-full bg-transparent border-none outline-none text-xl font-black text-slate-800 placeholder:text-slate-300" 
                                value={formData.price} 
                                onChange={(e) => setFormData({...formData, price: e.target.value})} 
                            />
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider ml-6 mt-1">Este valor alimenta el cálculo de costos en la agenda</p>
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
                            <Save size={18} className="group-hover:scale-110 transition-transform" />
                            {isEditing ? 'Guardar Cambios' : 'Crear Servicio'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ServiceForm;
