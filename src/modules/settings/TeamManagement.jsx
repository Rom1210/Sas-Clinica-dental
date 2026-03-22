import React, { useState, useMemo } from 'react';
import { 
  Users, UserPlus, Mail, Shield, CheckCircle, 
  X, Loader2, Search, Filter, Trash2, 
  MoreVertical, ShieldCheck, CreditCard
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

const TeamManagement = () => {
  const { activeOrgId } = useAuth();
  const { team, removeTeamMember, adminInvite } = useData();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('doctor');
  const [notification, setNotification] = useState(null);
  const [isDeleting, setIsDeleting] = useState(null);

  const notify = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviteLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('invite-member', {
        body: { email: inviteEmail, role: inviteRole, organization_id: activeOrgId }
      });
      
      if (error) throw error;
      
      notify(`Invitación enviada a ${inviteEmail}`);
      setShowInviteModal(false);
      setInviteEmail('');
    } catch (err) {
      notify('Error al enviar invitación: ' + err.message);
    } finally {
      setInviteLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setIsDeleting(id);
    try {
      await removeTeamMember(id);
      notify('Miembro eliminado');
    } catch (err) {
      notify('Error al eliminar: ' + err.message);
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500 pb-20">
      {notification && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[5000] px-6 py-3 bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <CheckCircle size={14} className="text-emerald-400" />
          {notification}
        </div>
      )}

      {/* Header Section */}
      <div className="flex justify-between items-end">
        <div className="flex flex-col">
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">Gestión de Equipo</h2>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Control de acceso y roles corporativos</p>
        </div>
        <button 
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-2 px-6 py-4 bg-primary text-white text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-blue-600 transition-all shadow-xl shadow-primary/20 border-none cursor-pointer"
        >
          <UserPlus size={16} /> Añadir Miembro
        </button>
      </div>

      {/* Team Table */}
      <div className="professional-card p-0 overflow-hidden border-none shadow-sm bg-white">
        <div className="px-6 py-5 border-b border-slate-50 flex justify-between items-center">
          <div style={{ display: 'flex', alignItems: 'center', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '8px 14px', gap: '8px', width: '260px' }}>
            <input 
              type="text" 
              placeholder="Buscar por nombre o correo..." 
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: '11px', fontWeight: 600, color: '#334155' }}
            />
            <Search size={14} style={{ color: '#94A3B8', flexShrink: 0 }} />
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 transition-all border-none bg-transparent cursor-pointer"><Filter size={16} /></button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Miembro</th>
                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Rol / Permisos</th>
                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {team.map(member => (
                <tr key={member.id} className="hover:bg-slate-50/50 transition-all group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 font-bold group-hover:bg-primary group-hover:text-white transition-all">
                        {member.name[0]}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-slate-700">{member.name}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{member.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full">
                      <Shield size={10} className="text-primary" />
                      <span className="text-[9px] font-black uppercase text-slate-600 tracking-widest">{member.role}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-1.5 text-emerald-500 font-black text-[9px] uppercase tracking-widest">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                      {member.status}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button 
                      onClick={() => handleDelete(member.id)}
                      disabled={isDeleting === member.id || member.role === 'owner'}
                      className="p-2 text-slate-300 hover:text-rose-500 bg-transparent border-none cursor-pointer disabled:opacity-30 transition-colors"
                    >
                      {isDeleting === member.id ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[5000] p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden border border-white/20">
            <div className="px-10 py-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <div className="flex flex-col">
                <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                  <UserPlus size={20} className="text-primary" /> Invitar al Equipo
                </h3>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Acceso Corporativo Seguro</p>
              </div>
              <button 
                onClick={() => setShowInviteModal(false)}
                className="p-2 hover:bg-slate-200 rounded-full transition-all border-none cursor-pointer text-slate-400 bg-transparent"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleInvite} className="p-10 flex flex-col gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Correo Electrónico</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="email" required 
                    placeholder="ejemplo@clinica.com" 
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Rol Asignado</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'doctor', label: 'Doctor', icon: <Shield size={12} /> },
                    { id: 'receptionist', label: 'Recepción', icon: <Users size={12} /> },
                    { id: 'finance', label: 'Finanzas', icon: <CreditCard size={12} /> },
                    { id: 'admin', label: 'Admin', icon: <ShieldCheck size={12} /> }
                  ].map(role => (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setInviteRole(role.id)}
                      className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 transition-all cursor-pointer font-black text-[9px] uppercase tracking-widest ${inviteRole === role.id ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'bg-transparent border-slate-100 text-slate-400 hover:border-slate-200'}`}
                    >
                      {role.icon} {role.label}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                type="submit" 
                disabled={inviteLoading}
                className="mt-6 w-full py-5 bg-slate-900 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-primary transition-all shadow-xl shadow-slate-200 border-none cursor-pointer disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {inviteLoading ? <Loader2 className="animate-spin" size={18} /> : 'Enviar Invitación Real'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamManagement;
