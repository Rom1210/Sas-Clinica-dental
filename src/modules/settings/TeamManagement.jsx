import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, UserPlus, Mail, Shield, CheckCircle, 
  X, Loader2, Search, Filter, Trash2, 
  ShieldCheck, CreditCard, ArrowLeft
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

const TeamManagement = () => {
  const navigate = useNavigate();
  const { activeOrgId } = useAuth();
  const { team, removeTeamMember } = useData();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('doctor');
  const [notification, setNotification] = useState(null);
  const [isDeleting, setIsDeleting] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const notify = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviteLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('invite-member', {
        body: { 
          email: inviteEmail, 
          role: inviteRole, 
          organization_id: activeOrgId,
          redirectTo: window.location.origin + '/set-password'
        }
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

  const filteredTeam = team.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '1000px', margin: '0 auto' }}
      className="animate-in fade-in duration-500 pb-20"
    >
      {notification && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[5000] px-6 py-3 bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <CheckCircle size={14} className="text-emerald-400" />
          {notification}
        </div>
      )}

      {/* Back Button */}
      <button 
        onClick={() => navigate('/settings')}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-semibold text-sm cursor-pointer border-none bg-transparent p-0 mb-2 w-fit"
      >
        <ArrowLeft size={16} /> Volver a Configuración
      </button>

      {/* ── HEADER CARD ─────────────────────────────────── */}
      <div style={{
          background: 'white', border: '1px solid #e2e8f0', borderRadius: '1.25rem',
          padding: '1.25rem 1.75rem', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', margin: 0, lineHeight: 1.2 }}>
            Gestión de equipo
          </h1>
          <p style={{ fontSize: '0.65rem', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: '0.25rem' }}>
            Control de acceso y roles corporativos
          </p>
        </div>
        <button 
          onClick={() => setShowInviteModal(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.6rem 1.5rem', background: '#2563eb', border: 'none',
            borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, color: 'white',
            textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(37,99,235,0.3)', transition: 'all 0.2s',
          }}
          onMouseOver={e => e.currentTarget.style.background = '#1d4ed8'}
          onMouseOut={e => e.currentTarget.style.background = '#2563eb'}
        >
          <UserPlus size={16} /> Añadir miembro
        </button>
      </div>

      {/* ── TABLE CARD ──────────────────────────────────── */}
      <div style={{
        background: 'white', border: '1px solid #e2e8f0', borderRadius: '1.25rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden'
      }}>
        {/* Search Bar Row */}
        <div style={{ padding: '1.25rem 1.75rem', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ position: 'relative', maxWidth: '380px' }}>
            <input 
              type="text" 
              placeholder="buscar por nombre o correo electronico" 
              style={{
                width: '100%', padding: '0.625rem 3.5rem 0.625rem 1.25rem',
                background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '9999px',
                fontSize: '0.8rem', color: '#334155', outline: 'none', transition: 'all 0.15s ease'
              }}
              onFocus={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.background = 'white'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.12)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.boxShadow = 'none'; }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search 
              size={16} 
              style={{ position: 'absolute', right: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} 
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                <th style={{ padding: '0.875rem 1.75rem', fontSize: '0.65rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Miembro</th>
                <th style={{ padding: '0.875rem 1.75rem', fontSize: '0.65rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Rol / Permisos</th>
                <th style={{ padding: '0.875rem 1.75rem', fontSize: '0.65rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Estado</th>
                <th style={{ padding: '0.875rem 1.75rem' }}></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredTeam.map(member => (
                <tr key={member.id} className="hover:bg-slate-50/40 transition-all group">
                  <td className="px-7 py-4">
                    <div className="flex items-center gap-3">
                      <div style={{
                        width: '2.5rem', height: '2.5rem', borderRadius: '0.75rem',
                        background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.875rem', fontWeight: 700, color: '#64748b', border: '1px solid #e2e8f0'
                      }}>
                        {member.name[0]}
                      </div>
                      <div className="flex flex-col">
                        <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1e293b' }}>{member.name}</span>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{member.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-7 py-4">
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                      padding: '0.25rem 0.625rem', background: '#eff6ff', borderRadius: '0.5rem',
                      border: '1px solid #dbeafe'
                    }}>
                      <Shield size={11} style={{ color: '#2563eb' }} />
                      <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#1e40af', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                        {member.role}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    {member.status === 'invited' ? (
                      <div className="flex items-center gap-1.5 text-amber-500 font-bold text-[9px] uppercase tracking-widest bg-amber-50 px-2 py-0.5 rounded-full w-fit">
                        <Loader2 size={10} className="animate-spin" />
                        Invitado
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-emerald-500 font-bold text-[9px] uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-full w-fit">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        Activo
                      </div>
                    )}
                  </td>
                  <td className="px-7 py-4 text-right">
                    <button 
                      onClick={() => handleDelete(member.id)}
                      disabled={isDeleting === member.id || member.role === 'owner'}
                      style={{
                        padding: '0.5rem', borderRadius: '0.5rem',
                        border: 'none', background: 'transparent',
                        color: member.role === 'owner' ? '#e2e8f0' : '#94a3b8',
                        cursor: member.role === 'owner' ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={e => member.role !== 'owner' && (e.currentTarget.style.color = '#ef4444', e.currentTarget.style.background = '#fef2f2')}
                      onMouseOut={e => member.role !== 'owner' && (e.currentTarget.style.color = '#94a3b8', e.currentTarget.style.background = 'transparent')}
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
        <div 
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 6000, padding: '1rem' }}
          className="animate-in fade-in duration-200"
        >
          <div style={{ background: 'white', borderRadius: '1.5rem', width: '100%', maxWidth: '420px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem 1.75rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>Invitar al equipo</h3>
                <p style={{ fontSize: '0.6rem', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Acceso corporativo</p>
              </div>
              <button onClick={() => setShowInviteModal(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '1.75rem', height: '1.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={14} />
              </button>
            </div>
            
            <form onSubmit={handleInvite} style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Correo electrónico</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={14} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input 
                      type="email" required placeholder="ejemplo@clinica.com" 
                      style={{ width: '100%', padding: '0.625rem 1rem 0.625rem 2.25rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '0.75rem', outline: 'none', fontSize: '0.875rem' }}
                      value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Rol asignado</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    {['doctor', 'receptionist', 'finance', 'admin'].map(role => (
                      <button
                        key={role} type="button" onClick={() => setInviteRole(role)}
                        style={{
                          padding: '0.5rem', borderRadius: '0.6rem', border: '1px solid',
                          borderColor: inviteRole === role ? '#3b82f6' : '#e2e8f0',
                          background: inviteRole === role ? '#eff6ff' : 'white',
                          color: inviteRole === role ? '#1e40af' : '#64748b',
                          fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.15s'
                        }}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>

                <button 
                  type="submit" disabled={inviteLoading}
                  style={{
                    marginTop: '0.5rem', padding: '0.75rem', background: '#1e293b', color: 'white',
                    borderRadius: '0.75rem', border: 'none', fontSize: '0.75rem', fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                  }}
                >
                  {inviteLoading ? <Loader2 className="animate-spin m-auto" size={18} /> : 'Enviar Invitación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamManagement;
