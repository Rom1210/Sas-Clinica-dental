import React from 'react';

const FinanceKPIs = ({ statsKPI, formatPrice, setActiveDetail }) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
      {statsKPI.map((stat, i) => (
        <div 
          key={i} 
          onClick={() => setActiveDetail(stat.id)}
          className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer"
          style={{ 
            padding: '18px 20px', 
            background: 'white',
            borderRadius: '24px',
            border: '1px solid #f1f5f9',
            boxShadow: '0 2px 4px rgba(0,0,0,0.01)'
          }}
        >
          <div className="relative z-10 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                style={{ background: stat.bg, color: stat.color, border: `1px solid ${stat.border}` }}
              >
                {React.cloneElement(stat.icon, { size: 18 })}
              </div>
              <div className="flex flex-col items-end">
                 <span className="text-[9px] font-black uppercase tracking-[0.1em]" style={{ color: stat.color, opacity: 0.8 }}>{stat.sub}</span>
              </div>
            </div>
            
            <div className="flex flex-col">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <p className="text-xl font-black tracking-tight text-slate-800">
                {formatPrice(stat.value)}
              </p>
            </div>
          </div>
          
          {/* Subtle background pattern or hover effect can be added here */}
        </div>
      ))}
    </div>
  );
};

export default FinanceKPIs;
