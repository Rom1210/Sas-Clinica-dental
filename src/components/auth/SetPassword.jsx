import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { KeyRound, CheckCircle, ShieldCheck, Loader2 } from 'lucide-react';

const SetPassword = () => {
    const { user, profile } = useAuth();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        // If there is no user session, they shouldn't be here unless they just clicked the link
        // Supabase handle the hash fragment automatically.
    }, []);

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
            // The user metadata from invitation contains the org_id and role
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
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
                <div className="max-w-md w-full professional-card p-10 text-center animate-in zoom-in-95 duration-300">
                    <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle size={40} />
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-2">¡Contraseña Lista!</h2>
                    <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mb-8">Tu cuenta ha sido activada correctamente</p>
                    <p className="text-xs text-slate-400">Redirigiendo al panel de control...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
            <div className="max-w-md w-full professional-card p-10 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col items-center mb-10">
                    <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-4 shadow-inner">
                        <KeyRound size={32} />
                    </div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase text-center">Configura tu Acceso</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">{user?.email}</p>
                </div>

                <form onSubmit={handleSetPassword} className="flex flex-col gap-5">
                    {error && (
                        <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-[11px] font-bold uppercase text-center flex items-center gap-2">
                            <ShieldCheck size={14} className="shrink-0" /> {error}
                        </div>
                    )}

                    <div className="flex flex-col gap-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Nueva Contraseña</label>
                        <input 
                            type="password"
                            required
                            placeholder="Mínimo 6 caracteres"
                            className="px-5 py-4 bg-slate-100 border-none rounded-2xl text-sm font-bold focus:bg-white focus:shadow-xl focus:shadow-primary/5 transition-all outline-none"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Confirmar Contraseña</label>
                        <input 
                            type="password"
                            required
                            placeholder="Repite tu contraseña"
                            className="px-5 py-4 bg-slate-100 border-none rounded-2xl text-sm font-bold focus:bg-white focus:shadow-xl focus:shadow-primary/5 transition-all outline-none"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </div>

                    <button 
                        type="submit"
                        disabled={loading}
                        className="mt-6 py-5 bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest rounded-3xl hover:bg-primary transition-all shadow-xl shadow-slate-200 border-none cursor-pointer flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin" size={16} /> : <ShieldCheck size={16} />}
                        Activar mi Cuenta
                    </button>
                </form>
            </div>
        </div>
    );
};

export default SetPassword;
