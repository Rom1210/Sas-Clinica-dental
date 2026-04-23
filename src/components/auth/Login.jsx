import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { Lock, Mail, Loader2, ShieldCheck, ChevronRight, Calendar, CreditCard, Users } from 'lucide-react';

const Login = () => {
  const { signIn } = useAuth();
  const { clinicName } = useSettings();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error: signInError } = await signIn(email, password);
      if (signInError) throw signInError;
    } catch (err) {
      setError(err.message === 'Invalid login credentials' ? 'Credenciales incorrectas' : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full" style={{ minHeight: '100vh', backgroundColor: '#020617', overflow: 'hidden' }}>
      
      {/* LEFT COLUMN - System Preview (Hidden on Mobile) */}
      <div 
        className="flex-col justify-center items-center relative border-r border-slate-800"
        style={{ width: '55%', display: window.innerWidth < 1024 ? 'none' : 'flex', backgroundColor: '#0f172a' }}
      >
        {/* Ambient Glow */}
        <div style={{ position: 'absolute', top: '25%', left: '25%', width: '50%', height: '50%', background: 'rgba(37, 99, 235, 0.15)', borderRadius: '50%', filter: 'blur(120px)' }} className="animate-pulse" />
        <div style={{ position: 'absolute', bottom: '25%', right: '25%', width: '40%', height: '40%', background: 'rgba(79, 70, 229, 0.1)', borderRadius: '50%', filter: 'blur(100px)' }} />
        
        <div className="relative flex-col" style={{ zIndex: 10, width: '100%', maxWidth: '36rem', padding: '0 3rem', paddingTop: '2.5rem' }}>
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
              <span className="text-white font-black text-xl">S</span>
            </div>
            <span className="text-white font-black text-2xl tracking-tighter">{clinicName || 'SmartDental'}</span>
          </div>

          <h1 className="font-black text-white tracking-tighter mb-6" style={{ fontSize: '3.5rem', lineHeight: '1.1' }}>
            El estándar global para tu clínica <span className="text-primary">dental.</span>
          </h1>
          <p className="text-slate-400 font-medium mb-10" style={{ fontSize: '1.125rem', lineHeight: '1.625', maxWidth: '28rem' }}>
            Experimenta el ecosistema de gestión más avanzado del mercado. Todo tu equipo médico en perfecta sincronía.
          </p>

          {/* Dummy floating UI elements simulating the requested graphic */}
          <div className="relative w-full" style={{ height: '16rem', marginTop: '2rem' }}>
             {/* Floating Card 1 - Appointments */}
             <div 
               className="professional-card absolute p-6" 
               style={{ top: '-20px', right: '10%', width: '280px', background: 'rgba(30, 41, 59, 0.8)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.1)', transform: 'rotate(6deg)', cursor: 'default' }}
             >
                <div className="flex items-center gap-4">
                   <div className="rounded-full flex justify-center items-center" style={{ width: '40px', height: '40px', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}><Calendar size={18}/></div>
                   <div className="flex-col">
                      <span className="text-white text-sm font-black tracking-tight" style={{ display: 'block' }}>Cita Confirmada</span>
                      <span className="text-slate-400 uppercase font-bold tracking-widest mt-1" style={{ fontSize: '10px', display: 'block' }}>Hoy • 10:30 AM</span>
                   </div>
                </div>
             </div>

             {/* Floating Card 2 - Finance */}
             <div 
               className="professional-card absolute p-6" 
               style={{ top: '80px', left: '5%', width: '300px', background: 'rgba(30, 41, 59, 0.8)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.1)', transform: 'rotate(-3deg)', zIndex: 10, cursor: 'default' }}
             >
                <div className="flex items-center justify-between w-full">
                   <div className="flex items-center gap-4">
                      <div className="rounded-full flex justify-center items-center" style={{ width: '40px', height: '40px', background: 'rgba(37, 99, 235, 0.2)', color: '#60a5fa' }}><CreditCard size={18}/></div>
                      <div className="flex-col">
                        <span className="text-white text-sm font-black tracking-tight" style={{ display: 'block' }}>Ingreso Registrado</span>
                        <span className="text-slate-400 uppercase font-bold tracking-widest mt-1" style={{ fontSize: '10px', display: 'block' }}>Carillas Dentales</span>
                      </div>
                   </div>
                   <span className="font-black" style={{ color: '#34d399', fontSize: '1.125rem' }}>+$450</span>
                </div>
             </div>

             {/* Floating Card 3 - Team */}
             <div 
               className="professional-card absolute p-6" 
               style={{ top: '160px', right: '15%', width: '260px', background: 'rgba(30, 41, 59, 0.8)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.1)', transform: 'rotate(2deg)', zIndex: 0, cursor: 'default' }}
             >
                <div className="flex items-center gap-4">
                   <div className="rounded-full flex justify-center items-center" style={{ width: '40px', height: '40px', background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8' }}><Users size={18}/></div>
                   <div className="flex-col">
                      <span className="text-white text-sm font-black tracking-tight" style={{ display: 'block' }}>Equipo Médico</span>
                      <div className="flex mt-2" style={{ gap: '-8px' }}>
                        <div className="rounded-full" style={{ width: '24px', height: '24px', border: '2px solid #1e293b', background: '#10b981', marginLeft: '-8px', zIndex: 3 }}></div>
                        <div className="rounded-full" style={{ width: '24px', height: '24px', border: '2px solid #1e293b', background: '#2563eb', marginLeft: '-8px', zIndex: 2 }}></div>
                        <div className="rounded-full" style={{ width: '24px', height: '24px', border: '2px solid #1e293b', background: '#6366f1', marginLeft: '-8px', zIndex: 1 }}></div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN - Login Form */}
      <div 
        className="flex items-center justify-center relative p-6"
        style={{ width: '100%', maxWidth: window.innerWidth < 1024 ? '100%' : '45%', backgroundColor: '#020617', flex: 1 }}
      >
        <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '50%', height: '50%', background: 'rgba(37, 99, 235, 0.1)', borderRadius: '50%', filter: 'blur(120px)' }} />
        
        <div className="relative animate-in" style={{ zIndex: 10, width: '100%', maxWidth: '420px' }}>
          <div 
            className="professional-card p-10 relative overflow-hidden"
            style={{ borderRadius: '2.5rem', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}
          >
            
            {/* Header Form */}
            <div className="flex-col items-center mb-10 text-center" style={{ display: 'flex' }}>
              <h2 className="text-2xl font-black text-white tracking-tighter mb-2">Iniciar sesión</h2>
              <p className="font-black uppercase tracking-widest text-slate-400" style={{ fontSize: '11px', letterSpacing: '0.2em' }}>Acceso Seguro al Sistema</p>
            </div>

            {error && (
              <div className="mb-8 p-4 bg-rose-500 rounded-2xl text-white font-bold text-center animate-in" style={{ fontSize: '12px', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.2)', color: '#fb7185' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label className="font-black text-slate-400 uppercase tracking-widest px-2" style={{ fontSize: '10px' }}>Email Corporativo</label>
                <div className="relative">
                  <Mail style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} size={18} />
                  <input 
                    type="email" 
                    required 
                    placeholder="nombre@clinica.com"
                    className="w-full text-white font-medium outline-none"
                    style={{ background: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '1rem', padding: '1rem 1rem 1rem 3rem', fontSize: '14px', transition: 'all 0.2s' }}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={(e) => { e.target.style.borderColor = 'rgba(37, 99, 235, 0.5)'; e.target.style.boxShadow = '0 0 0 4px rgba(37, 99, 235, 0.1)'; }}
                    onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.05)'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div className="flex justify-between items-center px-1 w-full">
                  <label className="font-black text-slate-400 uppercase tracking-widest px-1" style={{ fontSize: '10px' }}>Contraseña</label>
                  <button type="button" className="font-black text-primary uppercase tracking-widest bg-white cursor-pointer border-none" style={{ fontSize: '10px', background: 'transparent' }}>Reestablecer</button>
                </div>
                <div className="relative">
                  <Lock style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} size={18} />
                  <input 
                    type="password" 
                    required 
                    placeholder="••••••••"
                    className="w-full text-white font-medium outline-none"
                    style={{ background: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '1rem', padding: '1rem 1rem 1rem 3rem', fontSize: '14px', transition: 'all 0.2s' }}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={(e) => { e.target.style.borderColor = 'rgba(37, 99, 235, 0.5)'; e.target.style.boxShadow = '0 0 0 4px rgba(37, 99, 235, 0.1)'; }}
                    onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.05)'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-3 mt-4 cursor-pointer outline-none border-none"
                style={{ padding: '1rem', borderRadius: '1rem', fontWeight: 900, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.2em', boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.2)', opacity: loading ? 0.5 : 1 }}
              >
                {loading ? <Loader2 className="animate-spin" size={20} color="white" /> : (
                  <>Acceder <ChevronRight size={16} color="white" /></>
                )}
              </button>
            </form>

            {/* Social / Admin divider */}
            <div className="flex items-center justify-between w-full mt-8" style={{ gap: '1rem' }}>
              <div style={{ height: '1px', flex: 1, background: 'rgba(255,255,255,0.05)' }}></div>
              <span className="font-black text-slate-500 uppercase tracking-widest" style={{ fontSize: '10px' }}>O</span>
              <div style={{ height: '1px', flex: 1, background: 'rgba(255,255,255,0.05)' }}></div>
            </div>

            <div className="text-center mt-8 pt-2">
              <p className="text-slate-400 font-bold uppercase tracking-widest" style={{ fontSize: '10px' }}>
                ¿Aún no tienes cuenta? <span className="text-primary cursor-pointer hover:text-white transition-all">Solicitar Acceso</span>
              </p>
            </div>
          </div>
          
          <p className="text-center text-slate-600 font-black uppercase tracking-widest mt-10" style={{ fontSize: '9px', letterSpacing: '0.3em' }}>
            Powered by SmartDental OS v2.1
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
