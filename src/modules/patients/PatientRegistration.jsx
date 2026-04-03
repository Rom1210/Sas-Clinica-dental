import React, { useState, useEffect } from 'react';
import { Loader2, X, User, Phone, Mail, Calendar, Zap, Fingerprint, Info, Heart, Activity, ClipboardList, ShieldCheck, Check, AlertCircle, ChevronRight, UserPlus } from 'lucide-react';
import { useData } from '../../context/DataContext';
import useSoundFX from '../../hooks/useSoundFX';

// ─── Field Component ──────────────────────────────────────────────────────────
const Field = ({ label, helper, children }) => (
  <div className="flex flex-col gap-2">
    <div className="flex justify-between items-center">
      <label style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#94a3b8' }}>
        {label}
      </label>
      {helper && (
        <span style={{ fontSize: '9px', fontWeight: 700, color: '#10b981', background: '#ecfdf5', padding: '1px 8px', borderRadius: '999px' }}>
          {helper}
        </span>
      )}
    </div>
    {children}
  </div>
);

const inputStyle = {
  width: '100%',
  background: '#f8fafc',
  border: '2px solid #f1f5f9',
  borderRadius: '14px',
  padding: '12px 16px',
  fontSize: '14px',
  fontWeight: 700,
  color: '#1e293b',
  outline: 'none',
  transition: 'all 0.2s',
  fontFamily: 'inherit',
};

// ─── Toggle Card ──────────────────────────────────────────────────────────────
const ToggleCard = ({ label, sublabel, icon: Icon, active, color = '#f43f5e', onClick }) => (
  <div
    onClick={onClick}
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '14px 16px',
      borderRadius: '16px',
      border: `2px solid ${active ? color + '30' : '#f1f5f9'}`,
      background: active ? color + '08' : '#f8fafc',
      cursor: 'pointer',
      transition: 'all 0.2s',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{
        width: 36, height: 36, borderRadius: 12,
        background: active ? color + '20' : '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: active ? color : '#94a3b8', transition: 'all 0.2s',
      }}>
        <Icon size={16} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: '12px', fontWeight: 900, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
        <span style={{ fontSize: '9px', fontWeight: 700, color: active ? color : '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{sublabel}</span>
      </div>
    </div>
    <div style={{
      width: 20, height: 20, borderRadius: '50%',
      border: `2px solid ${active ? color : '#cbd5e1'}`,
      background: active ? color : 'transparent',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'all 0.2s',
    }}>
      {active && <Check size={11} color="#fff" strokeWidth={3} />}
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const PatientRegistration = ({ onClose, onSuccess }) => {
  const { addPatient } = useData();
  const sfx = useSoundFX();
  const [activeTab, setActiveTab] = useState('core');
  const [age, setAge] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', dni: '',
    email: '', whatsapp: '', dob: '', gender: '',
    reason: '', flags: [], fuma: false, bruxismo: false,
  });

  const flagsOptions = ['Alergia a Penicilina', 'Hipertensión', 'Diabetes', 'Embarazo'];

  useEffect(() => {
    if (formData.dob) {
      const birthDate = new Date(formData.dob);
      const today = new Date();
      let a = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) a--;
      setAge(a);
    }
  }, [formData.dob]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const set = (key, val) => setFormData(prev => ({ ...prev, [key]: val }));
  const toggleFlag = (flag) => setFormData(prev => ({
    ...prev,
    flags: prev.flags.includes(flag) ? prev.flags.filter(f => f !== flag) : [...prev.flags, flag]
  }));

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await addPatient({
        full_name: `${formData.firstName} ${formData.lastName}`.trim(),
        dni: formData.dni, email: formData.email, phone: formData.whatsapp,
        birth_date: formData.dob, gender: formData.gender, status: 'active',
        medical_history: { reason: formData.reason, flags: formData.flags, fuma: formData.fuma, bruxismo: formData.bruxismo }
      });
      sfx.success();
      onSuccess(`¡${formData.firstName} ${formData.lastName} registrado con éxito!`);
    } catch (error) {
      console.error('Error saving patient:', error);
      alert('Error al guardar el paciente: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const steps = [
    { id: 'core', label: 'Identidad', num: 1 },
    { id: 'health', label: 'Salud', num: 2 },
    { id: 'history', label: 'Historia', num: 3 },
  ];
  const stepIndex = steps.findIndex(s => s.id === activeTab);

  // ── Content per tab ────────────────────────────────────────────────────────
  const renderContent = () => {
    if (activeTab === 'core') return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label="Nombres">
            <input style={inputStyle} placeholder="Juan Ignacio"
              value={formData.firstName} onChange={e => set('firstName', e.target.value)} />
          </Field>
          <Field label="Apellidos">
            <input style={inputStyle} placeholder="Pérez Sosa"
              value={formData.lastName} onChange={e => set('lastName', e.target.value)} />
          </Field>
        </div>

        <Field label="Cédula / DNI / Pasaporte">
          <input style={inputStyle} placeholder="V-12.345.678"
            value={formData.dni} onChange={e => set('dni', e.target.value)} />
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label="WhatsApp">
            <input style={inputStyle} placeholder="+58 412..."
              value={formData.whatsapp} onChange={e => set('whatsapp', e.target.value)} />
          </Field>
          <Field label="Correo Electrónico">
            <input style={inputStyle} type="email" placeholder="paciente@mail.com"
              value={formData.email} onChange={e => set('email', e.target.value)} />
          </Field>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label="Fecha de Nacimiento" helper={age !== null ? `${age} años` : null}>
            <input style={inputStyle} type="date"
              value={formData.dob} onChange={e => set('dob', e.target.value)} />
          </Field>
          <Field label="Género">
            <select style={{ ...inputStyle, cursor: 'pointer' }}
              value={formData.gender} onChange={e => set('gender', e.target.value)}>
              <option value="">Seleccionar...</option>
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
              <option value="Otro">Otro</option>
            </select>
          </Field>
        </div>
      </div>
    );

    if (activeTab === 'health') return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <Field label="Motivo Principal de Consulta">
          <textarea
            style={{ ...inputStyle, resize: 'none', height: '90px', paddingTop: '12px' }}
            placeholder="¿Qué le trae hoy a consulta?"
            value={formData.reason} onChange={e => set('reason', e.target.value)}
          />
        </Field>

        <Field label="Alertas Médicas">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
            {flagsOptions.map(flag => {
              const active = formData.flags.includes(flag);
              return (
                <button key={flag} onClick={() => toggleFlag(flag)} style={{
                  padding: '8px 14px',
                  borderRadius: '999px',
                  border: `2px solid ${active ? '#f43f5e' : '#e2e8f0'}`,
                  background: active ? '#fff1f2' : '#f8fafc',
                  color: active ? '#f43f5e' : '#64748b',
                  fontSize: '10px', fontWeight: 900,
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                  cursor: 'pointer', transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  {active ? <Check size={10} strokeWidth={3} /> : <div style={{ width: 8, height: 8, borderRadius: '50%', border: '2px solid #cbd5e1' }} />}
                  {flag}
                </button>
              );
            })}
          </div>
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <ToggleCard label="Fuma" sublabel="Factor de riesgo" icon={Info} active={formData.fuma} color="#f43f5e"
            onClick={() => set('fuma', !formData.fuma)} />
          <ToggleCard label="Bruxismo" sublabel="Desgaste dental" icon={Activity} active={formData.bruxismo} color="#2563eb"
            onClick={() => set('bruxismo', !formData.bruxismo)} />
        </div>
      </div>
    );

    if (activeTab === 'history') return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ padding: '16px', background: '#eff6ff', borderRadius: '16px', border: '1px solid #dbeafe' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#3b82f6', lineHeight: 1.5 }}>
            Esta información clínica es confidencial y sólo accesible al equipo médico. Complétala con cuidado para garantizar tratamientos seguros.
          </p>
        </div>

        {[
          { label: 'Asma / Problemas Respiratorios', icon: Activity },
          { label: 'Antecedentes Cardíacos', icon: Heart },
          { label: 'Problemas de Coagulación', icon: AlertCircle },
        ].map(({ label, icon: Icon }) => (
          <Field key={label} label={label}>
            <select style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="">Seleccionar...</option>
              <option value="No">No</option>
              <option value="Leve">Sí, Leve</option>
              <option value="Grave">Sí, Grave / Confirmado</option>
            </select>
          </Field>
        ))}

        <Field label="Otros Antecedentes (Opcional)">
          <textarea
            style={{ ...inputStyle, resize: 'none', height: '80px', paddingTop: '12px' }}
            placeholder="Especifique cualquier otra condición médica relevante..."
          />
        </Field>
      </div>
    );
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100%', background: '#fff', overflow: 'hidden',
    }}>
      {/* ── Header ── */}
      <div style={{
        padding: '28px 28px 0',
        background: '#fff',
        borderBottom: '1px solid #f1f5f9',
        paddingBottom: '20px',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 40, height: 40, background: 'var(--primary)',
                borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 20px rgba(37,99,235,0.3)',
              }}>
                <UserPlus size={20} color="#fff" strokeWidth={2.5} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <h2 style={{ fontSize: '1.375rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', lineHeight: 1 }}>
                  Nuevo Paciente
                </h2>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.12em', marginTop: 4 }}>
                  Registro Clínico Completo
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => { sfx.cancel(); onClose(); }}
            style={{
              width: 38, height: 38, background: '#f8fafc',
              border: '2px solid #f1f5f9', borderRadius: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.15s',
              color: '#94a3b8',
            }}
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* Stepper */}
        <div style={{ display: 'flex', gap: 8 }}>
          {steps.map((s, i) => {
            const done = i < stepIndex;
            const active = i === stepIndex;
            return (
              <div key={s.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{
                  height: 4, borderRadius: 999,
                  background: done || active ? 'var(--primary)' : '#e2e8f0',
                  transition: 'all 0.5s',
                  opacity: done ? 0.5 : 1,
                }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{
                    width: 16, height: 16, borderRadius: '50%',
                    background: done ? 'var(--primary)' : active ? 'var(--primary)' : '#e2e8f0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.3s',
                  }}>
                    {done
                      ? <Check size={9} color="#fff" strokeWidth={3} />
                      : <span style={{ fontSize: '7px', fontWeight: 900, color: active ? '#fff' : '#94a3b8' }}>{s.num}</span>
                    }
                  </div>
                  <span style={{
                    fontSize: '9px', fontWeight: 900, textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: active ? 'var(--primary)' : done ? '#94a3b8' : '#cbd5e1',
                    transition: 'all 0.3s',
                  }}>
                    {s.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '24px 28px',
        scrollbarWidth: 'thin',
      }}>
        {renderContent()}
      </div>

      {/* ── Footer ── */}
      <div style={{
        flexShrink: 0,
        padding: '16px 28px 24px',
        borderTop: '1px solid #f1f5f9',
        background: '#fff',
      }}>
        {activeTab === 'core' && (
          <button
            onClick={() => { sfx.click(); setActiveTab('health'); }}
            style={{
              width: '100%', padding: '16px',
              background: 'var(--primary)', color: '#fff',
              border: 'none', borderRadius: 16,
              fontSize: '11px', fontWeight: 900,
              textTransform: 'uppercase', letterSpacing: '0.15em',
              cursor: 'pointer', transition: 'all 0.2s',
              boxShadow: '0 8px 24px rgba(37,99,235,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            Continuar — Salud <ChevronRight size={14} strokeWidth={3} />
          </button>
        )}
        {activeTab === 'health' && (
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => { sfx.navigate(); setActiveTab('core'); }} style={{
              flex: 1, padding: '16px', background: '#f1f5f9',
              color: '#64748b', border: 'none', borderRadius: 16,
              fontSize: '11px', fontWeight: 900, textTransform: 'uppercase',
              letterSpacing: '0.15em', cursor: 'pointer', transition: 'all 0.2s',
            }}>Volver</button>
            <button onClick={() => { sfx.click(); setActiveTab('history'); }} style={{
              flex: 2, padding: '16px', background: '#0f172a',
              color: '#fff', border: 'none', borderRadius: 16,
              fontSize: '11px', fontWeight: 900, textTransform: 'uppercase',
              letterSpacing: '0.15em', cursor: 'pointer', transition: 'all 0.2s',
              boxShadow: '0 8px 24px rgba(15,23,42,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              Continuar — Historia <ChevronRight size={14} strokeWidth={3} />
            </button>
          </div>
        )}
        {activeTab === 'history' && (
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => { sfx.navigate(); setActiveTab('health'); }} style={{
              flex: 1, padding: '16px', background: '#f1f5f9',
              color: '#64748b', border: 'none', borderRadius: 16,
              fontSize: '11px', fontWeight: 900, textTransform: 'uppercase',
              letterSpacing: '0.15em', cursor: 'pointer', transition: 'all 0.2s',
            }}>Volver</button>
            <button onClick={handleSave} disabled={isSaving} style={{
              flex: 2, padding: '16px',
              background: isSaving ? '#94a3b8' : 'var(--primary)',
              color: '#fff', border: 'none', borderRadius: 16,
              fontSize: '11px', fontWeight: 900, textTransform: 'uppercase',
              letterSpacing: '0.15em', cursor: isSaving ? 'default' : 'pointer',
              transition: 'all 0.2s',
              boxShadow: isSaving ? 'none' : '0 8px 24px rgba(37,99,235,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              {isSaving
                ? <><Loader2 size={14} className="animate-spin" /> Guardando...</>
                : <><ShieldCheck size={14} strokeWidth={2.5} /> Registrar Paciente</>
              }
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientRegistration;
