import React, { useState, useMemo } from 'react';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, DollarSign, Calendar, ArrowRight, AlertCircle, Send, TrendingUp, TrendingDown } from 'lucide-react';

const generateDynamicData = (totalTarget, days) => {
  let rawData = [];
  let currentSum = 0;
  const baseValue = totalTarget / days;

  for (let i = 0; i < days; i++) {
    // Asumimos que el día 5 y 6 (Sab y Dom) son fin de semana
    const isWeekend = (i % 7 === 5) || (i % 7 === 6);
    // Variación aleatoria controlada +/- 20%
    const randomVariation = 1 + (Math.random() * 0.4 - 0.2); 
    // Bajón en fin de semana para mayor realismo (caída del 40% al 70%)
    const weekendMultiplier = isWeekend ? (0.3 + Math.random() * 0.3) : 1; 

    let value = baseValue * randomVariation * weekendMultiplier;
    rawData.push(value);
    currentSum += value;
  }

  const normalizationFactor = totalTarget / currentSum;
  let finalSum = 0;
  
  const dayNames = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];
  const formattedData = rawData.map((val, i) => {
    const exactValue = Math.round(val * normalizationFactor);
    finalSum += exactValue;
    return {
      name: days === 7 ? dayNames[i % 7] : `${i + 1}`,
      dayLabel: dayNames[i % 7],
      ingresos: exactValue
    };
  });

  // Ajuste fino del último día para igualar la suma exacta por los redondeos
  const difference = totalTarget - finalSum;
  if (formattedData.length > 0) {
    formattedData[formattedData.length - 1].ingresos += difference;
  }

  return formattedData;
};

const BIDashboard = () => {
  const [viewMode, setViewMode] = useState('week');

  const monthlyData = useMemo(() => generateDynamicData(14230, 30), []);
  const weeklyData = useMemo(() => {
    // Para la semana lógica, calculamos una porción equivalente a una semana promedio del mes
    return generateDynamicData(Math.round(14230 / 4.28), 7);
  }, []);

  const chartData = viewMode === 'week' ? weeklyData : monthlyData;

  const maxIngreso = Math.max(...chartData.map(d => d.ingresos)) || 1;

  const specialtyGrowth = [
    { name: 'Ortodoncia', grow: '+12%', val: 4500 },
    { name: 'Estética', grow: '+24%', val: 3200 },
    { name: 'Cirugía', grow: '-2%', val: 1800 },
  ];

  const handleGlobalReminders = () => {
    console.log('n8n Trigger: Sending batch WhatsApp reminders to all pending debtors...');
    alert('Caza-Deudores Masivo: Se ha disparado el bot para notificar a todos los pacientes con saldos pendientes mayores a $50.');
  };

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500">
      {/* 3-Column KPI Grid - Elite Style */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Ingresos Mensuales', val: '$14,230', change: '+12.5%', color: 'text-emerald-500', icon: <DollarSign />, bg: 'bg-emerald-50' },
          { label: 'Pacientes Nuevos', val: '42', change: '+5', color: 'text-blue-500', icon: <Users />, bg: 'bg-blue-50' },
          { label: 'Tasa de Conversión', val: '68%', change: '+3%', color: 'text-purple-500', icon: <TrendingUp />, bg: 'bg-purple-50' }
        ].map((kpi, i) => (
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
            <div className="absolute top-0 right-0 p-1">
               <div className="w-1 h-1 rounded-full bg-slate-100"></div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart Card */}
        <div className="lg:col-span-2 professional-card p-8 bg-white">
          <div className="flex justify-between items-start mb-10">
             <div className="flex flex-col">
                <h3 className="text-sm font-black text-slate-800 tracking-tight uppercase">
                  Rendimiento {viewMode === 'week' ? 'Semanal' : 'Mensual'} (Ingresos)
                </h3>
                <p className="text-[10px] text-slate-400 font-bold">Distribución de ingresos según el período</p>
             </div>
             <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                <button 
                  onClick={() => setViewMode('week')}
                  className={`px-4 py-1.5 text-[10px] font-black rounded-lg shadow-sm transition-all border-none cursor-pointer ${viewMode === 'week' ? 'bg-white text-primary shadow-sm' : 'bg-transparent text-slate-400 hover:text-slate-600 shadow-none'}`}
                >
                  Semana
                </button>
                <button 
                  onClick={() => setViewMode('month')}
                  className={`px-4 py-1.5 text-[10px] font-black rounded-lg shadow-sm transition-all border-none cursor-pointer ${viewMode === 'month' ? 'bg-white text-primary shadow-sm' : 'bg-transparent text-slate-400 hover:text-slate-600 shadow-none'}`}
                >
                  Mes
                </button>
             </div>
          </div>
          
          <div style={{ width: '100%', height: 300, minHeight: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 700 }}
                  dy={10}
                  minTickGap={20}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 700 }}
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                  domain={[0, 'auto']}
                  dx={-10}
                />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  formatter={(value) => [`$${value.toLocaleString()}`, 'Ingresos']}
                  labelFormatter={(label) => viewMode === 'week' ? label : `Día ${label}`}
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.05)',
                    padding: '12px'
                  }}
                  itemStyle={{ fontSize: '12px', fontWeight: '900', color: '#1E293B' }}
                />
                <Bar 
                  dataKey="ingresos" 
                  radius={[4, 4, 0, 0]}
                  animationDuration={1500}
                >
                  {chartData.map((entry, index) => {
                    const intensity = 0.2 + (0.8 * (entry.ingresos / maxIngreso));
                    return <Cell key={`cell-${index}`} fill={`rgba(37, 99, 235, ${intensity})`} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Caza-Deudores Summary */}
        <div className="flex flex-col gap-6">
           <div className="professional-card p-8 bg-white">
              <div className="flex items-center gap-2 mb-8 justify-between">
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
                    <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Caza-Deudores Live</span>
                 </div>
                 <button 
                   onClick={handleGlobalReminders}
                   className="p-2 bg-slate-50 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all border-none cursor-pointer"
                 >
                    <Send size={16} />
                 </button>
              </div>

              <div className="flex flex-col gap-6">
                 {[
                   { name: 'Fabian Romero', amt: '$120', status: 'Deuda Crítica' },
                   { name: 'Lucia Blanco', amt: '$45', status: 'Atraso 5d' },
                   { name: 'Juan Pérez', amt: '$310', status: 'Plan Detenido' }
                 ].map((d, i) => (
                   <div key={i} className="flex justify-between items-center group cursor-pointer hover:translate-x-1 transition-all">
                      <div className="flex flex-col">
                         <span className="text-sm font-bold text-slate-800 tracking-tight">{d.name}</span>
                         <span className={`text-[10px] font-bold uppercase ${d.status === 'Deuda Crítica' ? 'text-rose-500' : 'text-slate-500'}`}>{d.status}</span>
                      </div>
                      <span className="text-sm font-black text-slate-900">{d.amt}</span>
                   </div>
                 ))}
              </div>
              
              <button className="w-full mt-10 py-4 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-primary hover:text-white transition-all border-none cursor-pointer">
                 Generar Reporte de Liquidez
              </button>
           </div>

           <div className="professional-card p-6 flex flex-col gap-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Crecimiento por Especialidad</h4>
              <div className="flex flex-col gap-3">
                 {specialtyGrowth.map((s, i) => (
                   <div key={i} className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-700">{s.name}</span>
                      <div className="flex items-center gap-2">
                         <div className="w-24 h-1 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: s.val/50 + '%' }}></div>
                         </div>
                         <span className={`text-[10px] font-bold ${s.grow.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>{s.grow}</span>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default BIDashboard;
