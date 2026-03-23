import React, { useState } from 'react';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, DollarSign, Calendar, ArrowRight, AlertCircle, Send, TrendingUp, TrendingDown, Loader2, Plus, BarChart3 } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useSettings } from '../../context/SettingsContext';

const BIDashboard = () => {
  const { stats, loading } = useData();
  const { formatPrice } = useSettings();
  const [viewMode, setViewMode] = useState('week');

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-slate-400">
        <Loader2 className="animate-spin" size={40} />
        <span className="text-[10px] font-black uppercase tracking-widest">Sincronizando con Supabase...</span>
      </div>
    );
  }

  const kpis = [
    { 
      label: 'Ingresos Mensuales', 
      val: formatPrice(stats.currentIncome), 
      change: stats.incomeTrend >= 0 ? `+${stats.incomeTrend.toFixed(1)}%` : `${stats.incomeTrend.toFixed(1)}%`,
      color: 'text-emerald-500', 
      icon: <DollarSign />, 
      bg: 'bg-emerald-50' 
    },
    { 
      label: 'Pacientes Nuevos', 
      val: stats.newPatientsCount.toString(), 
      change: stats.newPatientsTrend >= 0 ? `+${stats.newPatientsTrend}` : `${stats.newPatientsTrend}`,
      color: 'text-blue-500', 
      icon: <Users />, 
      bg: 'bg-blue-50' 
    },
    { 
      label: 'Tasa de Conversión', 
      val: `${stats.conversionRate}%`, 
      change: 'Real', 
      color: 'text-purple-500', 
      icon: <BarChart3 />, 
      bg: 'bg-purple-50' 
    }
  ];

  const handleGlobalReminders = () => {
    alert('Caza-Deudores Masivo: Se ha disparado el bot para notificar a todos los pacientes con saldos pendientes.');
  };

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500">

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {kpis.map((kpi, i) => (
          <div key={i} className="professional-card p-8 flex items-center gap-6 relative overflow-hidden group">
            <div className={`p-5 rounded-2xl ${kpi.bg} ${kpi.color} transition-all group-hover:scale-110`}>
              {React.cloneElement(kpi.icon, { size: 24 })}
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{kpi.label}</span>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-black text-slate-900 tracking-tighter">{kpi.val}</span>
                <span className={`text-[10px] font-bold ${kpi.color} mb-1`}>{kpi.change}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 professional-card p-8 bg-white">
          <div className="flex justify-between items-start mb-10">
             <div className="flex flex-col">
                <h3 className="text-sm font-black text-slate-800 tracking-tight uppercase">
                  Distribución por Casos (Tratamientos)
                </h3>
                <p className="text-[10px] text-slate-400 font-bold">Resumen gráfico de actividad clínica</p>
             </div>
          </div>
          
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.specialtyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 700 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 700 }} />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {stats.specialtyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#2563EB', '#10B981', '#F59E0B', '#EF4444'][index % 4]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex flex-col gap-6">
           <div className="professional-card p-8 bg-white min-h-[250px]">
              <div className="flex items-center gap-2 mb-8 justify-between">
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
                    <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Caza-Deudores Live</span>
                 </div>
                 <button onClick={handleGlobalReminders} className="p-2 bg-slate-50 text-slate-400 hover:text-primary rounded-xl border-none cursor-pointer">
                    <Send size={16} />
                 </button>
              </div>

              <div className="flex flex-col gap-6">
                 {stats.debtors.length > 0 ? stats.debtors.slice(0, 5).map((d, i) => (
                   <div key={i} className="flex justify-between items-center group transition-all">
                      <div className="flex flex-col">
                         <span className="text-sm font-bold text-slate-800 tracking-tight">{d.name}</span>
                         <span className={`text-[10px] font-bold uppercase ${d.balance > 500 ? 'text-rose-500' : 'text-slate-500'}`}>
                           Vence: {new Date(d.lastMovement).toLocaleDateString()}
                         </span>
                      </div>
                      <span className="text-sm font-black text-rose-600">{formatPrice(d.balance)}</span>
                   </div>
                 )) : (
                   <div className="py-10 text-center text-slate-300 text-[10px] font-black uppercase">Sin deudas pendientes</div>
                 )}
              </div>
           </div>

           <div className="professional-card p-6 flex flex-col gap-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Distribución por Especialidad</h4>
              <div className="flex flex-col gap-5">
                 {stats.specialtyData.map((spec, i) => (
                   <div key={i} className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-700">{spec.name}</span>
                      <div className="flex items-center gap-2">
                         <div className="w-24 h-1 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: spec.value + '%' }}></div>
                         </div>
                         <span className={`text-[10px] font-bold text-emerald-500`}>+{spec.value}%</span>
                      </div>
                   </div>
                 ))}
                 {stats.specialtyData.length === 0 && (
                   <div className="text-center py-4 text-[10px] font-black text-slate-300 uppercase">Sin datos de consulta</div>
                 )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default BIDashboard;
