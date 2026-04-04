import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { User, Mail, Lock, Building, Loader2, CheckCircle, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    orgName: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Sign Up in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Error al crear usuario');

      // 2. Create Organization
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert([{ 
          name: formData.orgName, 
          slug: formData.orgName.toLowerCase().replace(/\s+/g, '-'),
          status: 'active'
        }])
        .select()
        .single();

      if (orgError) throw orgError;

      // 3. Link User to Organization as Owner
      const { error: linkError } = await supabase
        .from('organization_users')
        .insert([{
          organization_id: orgData.id,
          user_id: authData.user.id,
          role: 'owner',
          is_active: true
        }]);

      if (linkError) throw linkError;

      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 p-6 text-center">
        <div className="glass-card p-12 rounded-[3rem] border border-emerald-500/20 bg-emerald-500/5 max-w-md animate-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-emerald-500 rounded-3xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 mx-auto mb-8">
            <CheckCircle size={40} />
          </div>
          <h2 className="text-3xl font-black text-white mb-4 tracking-tighter">¡Registro Exitoso!</h2>
          <p className="text-slate-400 text-sm font-bold leading-relaxed mb-8">
            Tu organización ha sido creada. Por favor, revisa tu correo para verificar tu cuenta antes de iniciar sesión.
          </p>
          <button onClick={() => navigate('/login')} className="w-full py-4 bg-slate-800 text-white font-black text-[11px] uppercase tracking-widest rounded-2xl hover:bg-slate-700 transition-all border-none cursor-pointer shadow-xl">
            Ir al Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-950 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
      
      <div className="w-full max-w-[480px] relative z-10 animate-in fade-in zoom-in-95 duration-500">
        <div className="glass-card p-10 border border-white/10 shadow-2xl rounded-[2.5rem] bg-slate-900/40 backdrop-blur-xl">
          <div className="flex flex-col items-center mb-8">
            <h1 className="text-3xl font-black text-white tracking-tighter mb-2">Crear Clínica</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-center">Configura tu centro odontológico digital</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-xs font-bold text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre de la Clínica</label>
              <div className="relative group">
                <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary" size={16} />
                <input 
                  type="text" required placeholder="SmartDental Valencia"
                  className="w-full bg-slate-800/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white text-sm font-medium focus:outline-none focus:ring-4 focus:ring-primary/20 transition-all"
                  value={formData.orgName}
                  onChange={(e) => setFormData({...formData, orgName: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tu Nombre Completo</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary" size={16} />
                <input 
                  type="text" required placeholder="Dr. Romero"
                  className="w-full bg-slate-800/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white text-sm font-medium focus:outline-none focus:ring-4 focus:ring-primary/20 transition-all"
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Correo Electrónico</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary" size={16} />
                <input 
                  type="email" required placeholder="admin@dentalsmart.com"
                  className="w-full bg-slate-800/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white text-sm font-medium focus:outline-none focus:ring-4 focus:ring-primary/20 transition-all"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contraseña Master</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary" size={16} />
                <input 
                  type="password" required placeholder="••••••••"
                  className="w-full bg-slate-800/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white text-sm font-medium focus:outline-none focus:ring-4 focus:ring-primary/20 transition-all"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
              </div>
            </div>

            <button 
              type="submit" disabled={loading}
              className="w-full py-4 bg-primary hover:bg-blue-600 text-white font-black text-[11px] uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-3 border-none cursor-pointer mt-6"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : (
                <>Configurar Sistema <ChevronRight size={16} /></>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
              ¿Ya tienes cuenta? <span onClick={() => navigate('/login')} className="text-primary cursor-pointer hover:text-white transition-colors">Inicia Sesión</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
