import React, { useState } from 'react';
import { Plus, ClipboardList, CheckCircle2, Circle, AlertCircle, TrendingUp, ChevronRight, MoreHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '../../../../../context/DataContext';
import NewTreatmentPlan from '../../../../treatments/NewTreatmentPlan';

const TreatmentsTab = ({ patient }) => {
  const { treatmentPlans, saveTreatmentPlan } = useData();
  const [showNewPlan, setShowNewPlan] = useState(false);

  const patientPlans = treatmentPlans.filter(p => p.patient_id === patient.id).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const handleSavePlan = async (planData) => {
    try {
      await saveTreatmentPlan({ ...planData, patient_id: patient.id }, planData.items);
      setShowNewPlan(false);
    } catch (error) {
      console.error('Error saving plan:', error);
      alert('Error al guardar el plan de tratamiento');
    }
  };

  if (showNewPlan) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        className="w-full"
      >
        <NewTreatmentPlan 
          onCancel={() => setShowNewPlan(false)} 
          onSave={handleSavePlan}
        />
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      
      {/* Header Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
            <ClipboardList size={22} />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Planes Totales</p>
            <h4 className="text-xl font-bold text-slate-800">{patientPlans.length}</h4>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Presupuesto Total</p>
            <h4 className="text-xl font-bold text-slate-800">
              ${patientPlans.reduce((sum, p) => sum + (parseFloat(p.total_amount) || 0), 0).toFixed(0)}
            </h4>
          </div>
        </div>

        <div className="bg-white p-2 rounded-[2rem] shadow-sm border border-slate-100 flex items-center justify-center">
          <button 
            onClick={() => setShowNewPlan(true)}
            className="w-full h-full flex flex-col items-center justify-center gap-2 py-4 text-blue-600 font-bold hover:bg-blue-50/50 rounded-[2rem] transition-all group"
          >
            <div className="p-2 bg-blue-600 text-white rounded-full group-hover:scale-110 transition-transform">
              <Plus size={20} strokeWidth={3} />
            </div>
            <span className="text-xs">Nuevo Presupuesto</span>
          </button>
        </div>
      </div>

      {patientPlans.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="p-5 bg-slate-50 text-slate-300 rounded-full mb-4">
            <ClipboardList size={48} strokeWidth={1.5} />
          </div>
          <h3 className="text-lg font-bold text-slate-800">Sin planes activos</h3>
          <p className="text-slate-500 text-sm mt-1 max-w-[300px] text-center">
            Crea un presupuesto detallado para organizar los tratamientos de este paciente.
          </p>
          <button 
            onClick={() => setShowNewPlan(true)}
            className="mt-6 px-8 py-3 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
          >
            Comenzar Plan
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {patientPlans.map((plan) => {
            const completedCount = plan.items?.filter(i => i.is_completed).length || 0;
            const totalItems = plan.items?.length || 0;
            const progress = totalItems > 0 ? (completedCount / totalItems) * 100 : 0;

            return (
              <motion.div 
                key={plan.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-md transition-all group relative overflow-hidden"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                      <h4 className="text-lg font-extrabold text-slate-800 tracking-tight">{plan.name}</h4>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest ${
                        plan.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'
                      }`}>
                        {plan.status === 'pending' ? 'Borrador' : (plan.status === 'active' ? 'En Curso' : 'Completado')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-medium">Creado el {new Date(plan.created_at).toLocaleDateString()}</p>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mb-1">Inversión Total</p>
                    <p className="text-xl font-black text-slate-900">${parseFloat(plan.total_amount).toFixed(0)}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Progreso del Tratamiento</span>
                    <span className="text-xs font-black text-blue-600">{progress.toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-3 bg-slate-50 rounded-full overflow-hidden border border-slate-100 p-0.5">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      className="h-full bg-blue-600 rounded-full shadow-[0_0_8px_rgba(37,99,235,0.4)]"
                    />
                  </div>
                </div>

                <div className="mt-8 flex justify-between items-center bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                  <div className="flex -space-x-2">
                    {plan.items?.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 shadow-sm" title={item.description}>
                        {idx + 1}
                      </div>
                    ))}
                    {totalItems > 3 && (
                      <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500 shadow-sm">
                        +{totalItems - 3}
                      </div>
                    )}
                  </div>
                  <button className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors uppercase tracking-wider">
                    Detalles completos
                    <ChevronRight size={14} strokeWidth={3} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TreatmentsTab;
