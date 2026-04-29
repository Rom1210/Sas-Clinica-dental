import React, { useState, useEffect } from 'react';
import { useSettings } from '../../../context/SettingsContext';
import { CheckCircle2 } from 'lucide-react'; // v3


const DAYS = [
  { id: 'mon', label: 'Lun' },
  { id: 'tue', label: 'Mar' },
  { id: 'wed', label: 'Mié' },
  { id: 'thu', label: 'Jue' },
  { id: 'fri', label: 'Vie' },
  { id: 'sat', label: 'Sáb' },
  { id: 'sun', label: 'Dom' },
];

const load = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
};

const input =
  'w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm font-medium outline-none focus:border-primary focus:bg-white transition-all placeholder:text-slate-300';

const ClinicSettings = () => {
  const { clinicName, updateClinicName } = useSettings();

  const [tempName, setTempName] = useState(clinicName || 'SmartDental');
  const [nameSaved, setNameSaved] = useState(false);

  const [contact, setContact] = useState(() => load('clinicContact', {
    phone: '', address: '', email: '', website: ''
  }));
  const [contactSaved, setContactSaved] = useState(false);

  const [fiscal, setFiscal] = useState(() => load('clinicFiscal', {
    rif: '', fiscalName: '', fiscalAddress: ''
  }));
  const [fiscalSaved, setFiscalSaved] = useState(false);

  const [hours, setHours] = useState(() => load('clinicHours', {
    openTime: '08:00',
    closeTime: '18:00',
    days: { mon: true, tue: true, wed: true, thu: true, fri: true, sat: false, sun: false }
  }));
  const [hoursSaved, setHoursSaved] = useState(false);

  useEffect(() => { setTempName(clinicName || 'SmartDental'); }, [clinicName]);

  const save = (fn, setSaved) => () => {
    fn(); setSaved(true); setTimeout(() => setSaved(false), 2500);
  };

  const toggleDay = (day) =>
    setHours(prev => ({ ...prev, days: { ...prev.days, [day]: !prev.days[day] } }));

  return (
    <div className="p-8 flex flex-col gap-10 animate-in fade-in duration-300">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Clínica</h1>
        <p className="text-sm text-slate-500 mt-1">Información general, contacto y horarios de la clínica.</p>
      </div>

      {/* ── IDENTIDAD ── */}
      <Block label="Identidad">
        <Label>Nombre de la clínica</Label>
        <p className="text-xs text-slate-400 mb-3">Aparece en facturas, presupuestos y mensajes enviados a pacientes.</p>
        <Row>
          <input
            type="text"
            className={input}
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && save(() => updateClinicName(tempName.trim()), setNameSaved)()}
            placeholder="Ej: Clínica Dental Romero"
          />
          <SaveBtn
            onClick={save(() => updateClinicName(tempName.trim()), setNameSaved)}
            saved={nameSaved}
            disabled={!tempName.trim() || tempName.trim() === clinicName}
          />
        </Row>
      </Block>

      {/* ── CONTACTO ── */}
      <Block label="Información de contacto">
        <p className="text-xs text-slate-400 mb-3">Usada en facturas y comunicaciones oficiales.</p>
        <div className="grid grid-cols-2 gap-3">
          <input type="text" className={input} placeholder="Teléfono principal"
            value={contact.phone} onChange={e => setContact(p => ({ ...p, phone: e.target.value }))} />
          <input type="text" className={input} placeholder="Correo de la clínica"
            value={contact.email} onChange={e => setContact(p => ({ ...p, email: e.target.value }))} />
          <input type="text" className={`${input} col-span-2`} placeholder="Dirección física"
            value={contact.address} onChange={e => setContact(p => ({ ...p, address: e.target.value }))} />
          <input type="text" className={input} placeholder="Sitio web (opcional)"
            value={contact.website} onChange={e => setContact(p => ({ ...p, website: e.target.value }))} />
        </div>
        <div className="flex justify-end mt-3">
          <SaveBtn onClick={save(() => localStorage.setItem('clinicContact', JSON.stringify(contact)), setContactSaved)} saved={contactSaved} />
        </div>
      </Block>

      {/* ── DATOS FISCALES ── */}
      <Block label="Datos fiscales">
        <p className="text-xs text-slate-400 mb-3">Información legal que aparece en facturas oficiales.</p>
        <div className="grid grid-cols-2 gap-3">
          <input type="text" className={input} placeholder="RIF (ej: J-12345678-9)"
            value={fiscal.rif} onChange={e => setFiscal(p => ({ ...p, rif: e.target.value }))} />
          <input type="text" className={input} placeholder="Razón social"
            value={fiscal.fiscalName} onChange={e => setFiscal(p => ({ ...p, fiscalName: e.target.value }))} />
          <input type="text" className={`${input} col-span-2`} placeholder="Dirección fiscal"
            value={fiscal.fiscalAddress} onChange={e => setFiscal(p => ({ ...p, fiscalAddress: e.target.value }))} />
        </div>
        <div className="flex justify-end mt-3">
          <SaveBtn onClick={save(() => localStorage.setItem('clinicFiscal', JSON.stringify(fiscal)), setFiscalSaved)} saved={fiscalSaved} />
        </div>
      </Block>

      {/* ── HORARIO ── */}
      <Block label="Horario de atención">
        <p className="text-xs text-slate-400 mb-4">Días y horas hábiles de la clínica.</p>
        <div className="flex flex-wrap gap-2 mb-5">
          {DAYS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => toggleDay(id)}
              style={{ border: 'none', cursor: 'pointer' }}
              className={`w-12 h-12 rounded-xl font-bold text-sm transition-all
                ${hours.days[id]
                  ? 'bg-primary text-white shadow-sm shadow-primary/30'
                  : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Apertura</p>
            <input type="time" className={input} value={hours.openTime}
              onChange={e => setHours(p => ({ ...p, openTime: e.target.value }))} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Cierre</p>
            <input type="time" className={input} value={hours.closeTime}
              onChange={e => setHours(p => ({ ...p, closeTime: e.target.value }))} />
          </div>
        </div>
        <div className="flex justify-end mt-3">
          <SaveBtn onClick={save(() => localStorage.setItem('clinicHours', JSON.stringify(hours)), setHoursSaved)} saved={hoursSaved} />
        </div>
      </Block>

      {/* ── SISTEMA ── */}
      <Block label="Sistema">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-sm text-slate-800">SmartDental · Antigravity</p>
            <p className="text-xs text-slate-400 mt-0.5">Sistema de gestión odontológica</p>
          </div>
          <span className="text-xs font-black text-primary bg-blue-50 px-3 py-1.5 rounded-full">v2.1 Elite</span>
        </div>
      </Block>

    </div>
  );
};

/* ── Helpers ── */
const Block = ({ label, children }) => (
  <div className="flex flex-col gap-3">
    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">{label}</p>
    {children}
  </div>
);

const Label = ({ children }) => (
  <p className="text-sm font-semibold text-slate-700">{children}</p>
);

const Row = ({ children }) => (
  <div className="flex gap-2">{children}</div>
);

const SaveBtn = ({ onClick, disabled = false, saved }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{ border: 'none', cursor: disabled ? 'not-allowed' : 'pointer' }}
    className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap disabled:opacity-40
      ${saved ? 'bg-emerald-500 text-white' : 'bg-primary text-white hover:bg-blue-700'}`}
  >
    {saved ? <><CheckCircle2 size={15} /> Guardado</> : 'Guardar'}
  </button>
);

export default ClinicSettings;
