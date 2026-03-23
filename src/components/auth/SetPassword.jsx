import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Loader2, ShieldCheck, ChevronRight, Calendar, CreditCard, Users, CheckCircle } from 'lucide-react';

const SetPassword = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleSetPassword = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }
        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // 1. Update the password
            const { error: updateError } = await supabase.auth.updateUser({
                password: password
            });

            if (updateError) throw updateError;

            // 2. Link to organization if metadata exists
            const metadata = user?.user_metadata || {};
            const orgId = metadata.organization_id;
            const role = metadata.role || 'doctor';

            if (orgId) {
                // Upsert profile
                const { error: profError } = await supabase
                    .from('profiles')
                    .upsert({ 
                        id: user.id, 
                        email: user.email, 
                        full_name: user.email.split('@')[0] 
                    });
                
                if (profError) console.error('Error profile:', profError);

                // Create/Update organization link to set as ACTIVE
                const { error: linkError } = await supabase
                    .from('organization_users')
                    .update({
                        is_active: true,
                        status: 'active'
                    })
                    .eq('organization_id', orgId)
                    .eq('user_id', user.id);
                
                if (linkError) console.error('Error link:', linkError);
            }

            setSuccess(true);
            setTimeout(() => navigate('/'), 3000);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="flex items-center justify-center w-full" style={{ minHeight: '100vh', backgroundColor: '#020617' }}>
                <div className="max-w-md w-full professional-card p-12 text-center animate-in zoom-in-95 duration-500" style={{ borderRadius: '2.5rem', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    <div className="w-24 h-24 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-emerald-500/5">
                        <CheckCircle size={48} strokeWidth={2.5} />
                    </div>
                    <h2 className="text-3xl font-black text-white tracking-tighter mb-3 uppercase">¡Acceso Configurado!</h2>
                    <p className="font-black text-slate-400 uppercase tracking-widest mb-10" style={{ fontSize: '11px', letterSpacing: '0.2em' }}>Tu cuenta SmartDental OS ya está operativa</p>
                    <div className="flex items-center justify-center gap-3 text-slate-500 font-bold uppercase tracking-widest" style={{ fontSize: '10px' }}>
                        <Loader2 className="animate-spin" size={14} />
                        Redirigiendo al panel...
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex w-full" style={{ minHeight: '100vh', backgroundColor: '#020617', overflow: 'hidden' }}>
            
            {/* LEFT COLUMN - System Preview (Shared with Login) */}
            <div 
                className="flex-col justify-center items-center relative border-r border-slate-800"
                style={{ width: '55%', display: window.innerWidth < 1024 ? 'none' : 'flex', backgroundColor: '#0f172a' }}
            >
                <div style={{ position: 'absolute', top: '25%', left: '25%', width: '50%', height: '50%', background: 'rgba(37, 99, 235, 0.15)', borderRadius: '50%', filter: 'blur(120px)' }} className="animate-pulse" />
                
                <div className="relative flex-col" style={{ zIndex: 10, width: '100%', maxWidth: '36rem', padding: '0 3rem' }}>
                    <div className="flex items-center gap-4 mb-6">
                        <div className="bg-primary flex items-center justify-center text-white" style={{ width: '48px', height: '48px', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.3)', transform: 'rotate(3deg)' }}>
                            <ShieldCheck size={24} strokeWidth={2.5} />
                        </div>
                        <span className="text-white font-black text-2xl tracking-tighter">SmartDental OS</span>
                    </div>

                    <h1 className="font-black text-white tracking-tighter mb-6" style={{ fontSize: '3.5rem', lineHeight: '1.1' }}>
                        Bienvenido a la red <span className="text-primary">médica.</span>
                    </h1>
                    <p className="text-slate-400 font-medium mb-10" style={{ fontSize: '1.125rem', lineHeight: '1.625', maxWidth: '28rem' }}>
                        Configura tu contraseña única para acceder al sistema de gestión clínica más avanzado.
                    </p>

                    {/* Floating Cards Mockup */}
                    <div className="relative w-full" style={{ height: '12rem' }}>
                        <div className="professional-card absolute p-6" style={{ top: '0', left: '0', width: '280px', background: 'rgba(30, 41, 59, 0.8)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.1)', transform: 'rotate(-2deg)' }}>
                            <div className="flex items-center gap-4">
                                <div className="rounded-full flex justify-center items-center" style={{ width: '40px', height: '40px', background: 'rgba(52, 211, 153, 0.2)', color: '#34d399' }}><Calendar size={18}/></div>
                                <div className="flex flex-col">
                                    <span className="text-white text-sm font-black tracking-tight">Acceso Activado</span>
                                    <span className="text-slate-400 uppercase font-bold tracking-widest mt-1" style={{ fontSize: '10px' }}>Sesión Segura</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN - Activation Form */}
            <div 
                className="flex items-center justify-center relative p-6"
                style={{ width: '100%', maxWidth: window.innerWidth < 1024 ? '100%' : '45%', backgroundColor: '#020617', flex: 1 }}
            >
                <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '50%', height: '50%', background: 'rgba(37, 99, 235, 0.1)', borderRadius: '50%', filter: 'blur(120px)' }} />
                
                <div className="relative animate-in slide-in-from-right-10 duration-700" style={{ zIndex: 10, width: '100%', maxWidth: '420px' }}>
                    <div 
                        className="professional-card p-10 relative overflow-hidden"
                        style={{ borderRadius: '2.5rem', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}
                    >
                        
                        {/* Header Form */}
                        <div className="flex-col items-center mb-10 text-center" style={{ display: 'flex' }}>
                            <h2 className="text-2xl font-black text-white tracking-tighter mb-2">Activar Acceso</h2>
                            <p className="font-black uppercase tracking-widest text-slate-400" style={{ fontSize: '11px', letterSpacing: '0.2em' }}>Configuración Final de Usuario</p>
                        </div>

                        {error && (
                            <div className="mb-8 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 font-bold text-center animate-in fade-in" style={{ fontSize: '12px' }}>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label className="font-black text-slate-500 uppercase tracking-widest px-2" style={{ fontSize: '10px' }}>Email de Invitación</label>
                                <div className="relative">
                                    <Mail style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} size={18} />
                                    <div 
                                        className="w-full text-slate-400 font-bold"
                                        style={{ background: 'rgba(30, 41, 59, 0.3)', border: '1px solid rgba(255,255,255,0.02)', borderRadius: '1.25rem', padding: '1.25rem 1.25rem 1.25rem 3.25rem', fontSize: '14px' }}
                                    >
                                        {user?.email || 'Recuperando email...'}
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-600 font-bold italic px-2">Este correo será tu identificador permanente</p>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label className="font-black text-slate-400 uppercase tracking-widest px-2" style={{ fontSize: '10px' }}>Nueva Contraseña</label>
                                <div className="relative">
                                    <Lock style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} size={18} />
                                    <input 
                                        type="password" 
                                        required 
                                        placeholder="Mínimo 6 caracteres"
                                        className="w-full text-white font-medium outline-none"
                                        style={{ background: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '1.25rem', padding: '1.25rem 1.25rem 1.25rem 3.25rem', fontSize: '14px', transition: 'all 0.2s' }}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        onFocus={(e) => { e.target.style.borderColor = 'rgba(37, 99, 235, 0.5)'; e.target.style.boxShadow = '0 0 0 4px rgba(37, 99, 235, 0.1)'; }}
                                        onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.05)'; e.target.style.boxShadow = 'none'; }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label className="font-black text-slate-400 uppercase tracking-widest px-2" style={{ fontSize: '10px' }}>Confirmar Contraseña</label>
                                <div className="relative">
                                    <ShieldCheck style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} size={18} />
                                    <input 
                                        type="password" 
                                        required 
                                        placeholder="••••••••"
                                        className="w-full text-white font-medium outline-none"
                                        style={{ background: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '1.25rem', padding: '1.25rem 1.25rem 1.25rem 3.25rem', fontSize: '14px', transition: 'all 0.2s' }}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        onFocus={(e) => { e.target.style.borderColor = 'rgba(37, 99, 235, 0.5)'; e.target.style.boxShadow = '0 0 0 4px rgba(37, 99, 235, 0.1)'; }}
                                        onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.05)'; e.target.style.boxShadow = 'none'; }}
                                    />
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-3 mt-6 cursor-pointer outline-none border-none py-5"
                                style={{ 
                                    background: 'linear-gradient(135deg, var(--primary) 0%, #1e40af 100%)',
                                    borderRadius: '1.25rem', 
                                    color: 'white',
                                    fontWeight: 900, 
                                    fontSize: '12px', 
                                    textTransform: 'uppercase', 
                                    letterSpacing: '0.2em', 
                                    boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.4)', 
                                    opacity: loading ? 0.5 : 1,
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                                }}
                            >
                                {loading ? <Loader2 className="animate-spin" size={20} /> : (
                                    <>Activar Acceso Permanente <ChevronRight size={18} /></>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SetPassword;
