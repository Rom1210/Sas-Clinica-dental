import React from 'react';
import { useData } from '../../context/DataContext';
import { useSettings } from '../../context/SettingsContext';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar,
  PolarRadiusAxis
} from 'recharts';
import { 
  Users, DollarSign, Target, Activity, 
  Search, ArrowUpRight, BarChart3, TrendingUp, PieChart
} from 'lucide-react';

const StatisticsModule = () => {
  const { stats, extendedStats, loading } = useData();
  const { formatPrice } = useSettings();

  if (loading || !extendedStats) {
    return (
      <div className="flex flex-col items-center justify-center p-40 gap-6">
        <Activity className="animate-spin text-primary" size={64} />
        <span className="font-black uppercase text-slate-400 tracking-[0.2em] text-sm text-center">Iniciando Motor de Inteligencia Clínica...</span>
      </div>
    );
  }

  // Data for the charts
  const radarData = extendedStats.monthlyTrends.map(m => ({
    subject: m.label,
    A: m.income > 0 ? (m.income / 100) : 10,
    B: m.expenses > 0 ? (m.expenses / 100) : 5,
  }));

  return (
    <div className="flex flex-col gap-12 animate-in fade-in slide-in-from-bottom-10 duration-700 pb-32">
      {/* High-Impact Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-4">
        <div>
          <h2 className="text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none mb-3">Estadísticas</h2>
          <div className="flex items-center gap-3">
             <div className="h-1 w-12 bg-primary rounded-full" />
             <p className="text-xs text-slate-500 font-bold uppercase tracking-[0.15em]">Visión Estratégica & Rendimiento Clínico</p>
          </div>
        </div>
        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
           <div className="px-6 py-3 border-r border-slate-100">
              <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Estado de Sincronía</span>
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Activo (Supabase)
              </span>
           </div>
           <button className="bg-primary text-white px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-primary/20 cursor-pointer">Exportar Análisis Global</button>
        </div>
      </div>

      {/* Main Stats Row: 2 Clear Blocks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        {/* Radar Block */}
        <div className="bg-white rounded-[32px] p-12 shadow-2xl shadow-slate-200/50 flex flex-col min-h-[550px]">
          <div className="flex items-center justify-between mb-10">
             <div>
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Análisis de Demanda</h3>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Comparativa Semestral (Flujo vs Gasto)</span>
             </div>
             <Target className="text-slate-200" size={32} />
          </div>
          <div className="flex-1 w-full min-h-[350px]">
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="#F1F5F9" />
                <PolarAngleAxis dataKey="subject" tick={{fill: '#94A3B8', fontSize: 12, fontWeight: 900}} />
                <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                <Radar name="Ingresos" dataKey="A" stroke="#2563EB" fill="#2563EB" fillOpacity={0.6} strokeWidth={4} />
                <Radar name="Egresos" dataKey="B" stroke="#FBBF24" fill="#FBBF24" fillOpacity={0.4} strokeWidth={3} />
                <Tooltip contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 25px 50px rgba(0,0,0,0.1)'}} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-10 pt-8 border-t border-slate-50 mt-4">
             <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-primary" />
                <span className="text-xs font-black text-slate-900 uppercase tracking-widest">Ingresos</span>
             </div>
             <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-amber-400" />
                <span className="text-xs font-black text-slate-900 uppercase tracking-widest">Egresos</span>
             </div>
          </div>
        </div>

        {/* Projection Block */}
        <div className="bg-slate-900 rounded-[32px] p-12 shadow-2xl shadow-blue-900/20 flex flex-col min-h-[550px]">
          <div className="flex items-center justify-between mb-8">
             <div>
                <h3 className="text-lg font-black text-white/50 uppercase tracking-tight">Proyección de Ingresos</h3>
                <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest underline decoration-primary decoration-2 underline-offset-4">Anualizado • 2026</span>
             </div>
             <TrendingUp className="text-white/10" size={32} />
          </div>
          <div className="flex items-baseline gap-4 mb-10">
             <span className="text-6xl font-black text-white tracking-tighter">{formatPrice(stats.currentIncome)}</span>
             <div className="bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-full text-[10px] font-black border border-emerald-500/20 tracking-widest">+12.4%</div>
          </div>
          <div className="flex-1 w-full min-h-[300px]">
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={extendedStats.monthlyTrends} margin={{top: 0, right: 0, left: -20, bottom: 0}}>
                <defs>
                  <linearGradient id="blueG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.6}/>
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 900}} padding={{left: 20, right: 20}} />
                <Tooltip contentStyle={{background: '#1F2937', border: 'none', borderRadius: '20px', color: '#fff'}} />
                <Area type="monotone" dataKey="income" stroke="#3B82F6" strokeWidth={6} fill="url(#blueG)" dot={{ r: 6, fill: '#3B82F6', strokeWidth: 4, stroke: '#0F172A' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Second Row: Detailed Metrics & Tráfico */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        {/* KPI Grid (Left Column) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
           {[
              { label: 'Eficiencia Clínca', val: stats.conversionRate, color: 'text-blue-600', sub: 'Conversión de Agenda', icon: <Target /> },
              { label: 'Pacientes Nuevos', val: stats.newPatientsCount, color: 'text-emerald-500', sub: 'Crecimiento Mensual', icon: <Users /> },
              { label: 'Retención Global', val: '58%', color: 'text-pink-500', sub: 'Fidelidad del Paciente', icon: <Activity />, isCircle: true },
              { label: 'Salud Financiera', val: '64%', color: 'text-amber-500', sub: 'Cobranza Efectiva', icon: <DollarSign />, isCircle: true }
           ].map((m, i) => (
              <div key={i} className="bg-white rounded-[24px] p-8 shadow-xl shadow-slate-100 flex flex-col items-center justify-center text-center gap-4">
                 <div className={`p-3 rounded-2xl bg-slate-50 ${m.color.replace('text', 'text')}`}>{m.icon}</div>
                 <div>
                    <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{m.label}</span>
                    <span className={`text-4xl font-black ${m.color} tracking-tighter leading-none`}>{typeof m.val === 'number' ? m.val + '%' : m.val}</span>
                 </div>
                 <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tight">{m.sub}</span>
              </div>
           ))}
        </div>

        {/* Traffic Bar Chart (Right Column) */}
        <div className="bg-white rounded-[32px] p-12 shadow-2xl shadow-slate-200/50 flex flex-col min-h-[500px]">
           <div className="flex items-center justify-between mb-10">
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Tráfico de Consultas</h3>
              <div className="flex gap-2">
                 <div className="h-6 w-1 rounded-full bg-slate-100" />
                 <div className="h-6 w-1 rounded-full bg-slate-200" />
                 <div className="h-6 w-1 rounded-full bg-primary" />
              </div>
           </div>
           <div className="flex-1 w-full min-h-[350px]">
              <ResponsiveContainer width="100%" height={350}>
                 <BarChart data={extendedStats.monthlyTrends}>
                    <defs>
                       <linearGradient id="barG" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2563EB" stopOpacity={1}/>
                          <stop offset="100%" stopColor="#10B981" stopOpacity={0.8}/>
                       </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EDF2F7" />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 11, fontWeight: 900}} />
                    <Tooltip cursor={{fill: '#F8FAFC'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'}} />
                    <Bar dataKey="income" fill="url(#barG)" radius={[12, 12, 0, 0]} barSize={45} />
                 </BarChart>
              </ResponsiveContainer>
           </div>
        </div>
      </div>

    </div>
  );
};

export default StatisticsModule;
