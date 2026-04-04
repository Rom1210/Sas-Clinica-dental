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
    <div className="relative overflow-hidden rounded-[2.5rem] min-h-[400px]">
      {/* Background/Blurred content */}
      <div className="opacity-40 blur-[2px] pointer-events-none select-none">
        <div className="flex flex-col gap-6 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><ClipboardList size={22} /></div>
              <div><p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Planes Totales</p><h4 className="text-xl font-bold text-slate-800">0</h4></div>
            </div>
            <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><CheckCircle2 size={22} /></div>
              <div><p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Presupuesto</p><h4 className="text-xl font-bold text-slate-800">$0</h4></div>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
            <div className="p-5 bg-slate-50 text-slate-300 rounded-full mb-4"><ClipboardList size={48} strokeWidth={1.5} /></div>
            <h3 className="text-lg font-bold text-slate-800">Cargando módulos...</h3>
          </div>
        </div>
      </div>

      {/* Próximamente Overlay */}
      <div className="absolute inset-0 flex items-center justify-center p-6 z-10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/70 backdrop-blur-md border border-white/50 p-10 rounded-[3rem] shadow-2xl flex flex-col items-center text-center max-w-md"
        >
          <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-blue-200 animate-pulse">
            <ClipboardList size={32} />
          </div>
          <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-2">Planes Quirúrgicos</h3>
          <p className="text-slate-500 font-bold text-sm leading-relaxed mb-8">
            Estamos perfeccionando el motor de presupuestos automatizados y seguimiento de fases de tratamiento.
          </p>
          <div className="px-6 py-2 bg-slate-100 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest border border-slate-200">
            Próximamente en v2.0
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TreatmentsTab;
