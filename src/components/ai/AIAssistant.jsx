import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, X, Mic, MicOff, Send, Loader2,
  Bot, User, ChevronDown, CheckCircle2, Volume2, VolumeX
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { usePlan } from '../../context/SubscriptionContext';
import { useNavigate, useLocation } from 'react-router-dom';

const OPENAI_KEY      = import.meta.env.VITE_OPENAI_API_KEY;
const ELEVENLABS_KEY  = import.meta.env.VITE_ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE = 'EXAVITQu4vr4xnSDxMaL'; // Sarah — warm, professional

const getModuleName = (pathname) => {
  if (pathname.startsWith('/pacientes/')) return 'Perfil de Paciente';
  if (pathname.startsWith('/pacientes')) return 'Listado de Pacientes';
  if (pathname.startsWith('/agenda')) return 'Agenda';
  if (pathname.startsWith('/finanzas')) return 'Finanzas';
  if (pathname.startsWith('/estadisticas')) return 'Estadísticas';
  if (pathname.startsWith('/maestro')) return 'Control Maestro';
  return 'Visión Global';
};

const toISODateTime = (dateStr, timeStr) =>
  new Date(`${dateStr}T${timeStr}:00.000Z`).toISOString();
const addMinutes = (iso, m) => { const d = new Date(iso); d.setMinutes(d.getMinutes() + m); return d.toISOString(); };

// ── Tool action codes for odontogram ───────────────────
const TOOTH_ACTION_MAP = {
  'sano': 'SAN_THIS', 'caries': 'CARIES', 'resina buena': 'RES_GOOD', 'resina deficiente': 'RES_DEF',
  'resina provisional': 'RES_PROV', 'exodoncia indicada': 'EXO_IND', 'exodoncia realizada': 'EXO_REA',
  'endodoncia indicada': 'END_IND', 'endodoncia realizada': 'END_REA',
  'implante indicado': 'IMP_IND', 'implante realizado': 'IMP_REA',
  'fractura': 'FRACTURE', 'ausente': 'ABSENT', 'limpiar': 'RESET',
};

// ── Tool definitions ──────────────────────────────────
const buildTools = (doctors, services) => [
  // — PATIENTS —
  {
    type: 'function', function: {
      name: 'search_patients',
      description: 'Busca pacientes por nombre o apellido. SIEMPRE úsala antes de crear cita, pago o plan.',
      parameters: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] },
    },
  },
  {
    type: 'function', function: {
      name: 'navigate_to_patient',
      description: 'Navega al perfil de un paciente específico',
      parameters: {
        type: 'object',
        properties: {
          patient_id: { type: 'string', description: 'ID del paciente' },
          patient_name: { type: 'string' },
        },
        required: ['patient_id', 'patient_name'],
      },
    },
  },
  {
    type: 'function', function: {
      name: 'register_patient',
      description: 'Registra un nuevo paciente en el sistema',
      parameters: {
        type: 'object',
        properties: {
          full_name:     { type: 'string', description: 'Nombre completo' },
          cedula:        { type: 'string', description: 'Cédula de identidad' },
          phone:         { type: 'string', description: 'Teléfono' },
          email:         { type: 'string', description: 'Email (opcional)' },
          date_of_birth: { type: 'string', description: 'Fecha nacimiento YYYY-MM-DD (opcional)' },
        },
        required: ['full_name'],
      },
    },
  },
  // — APPOINTMENTS —
  {
    type: 'function', function: {
      name: 'create_appointment',
      description: 'Crea una cita en la agenda. Llama search_patients primero para obtener el patient_id.',
      parameters: {
        type: 'object',
        properties: {
          patient_id:   { type: 'string' },
          patient_name: { type: 'string' },
          date:         { type: 'string', description: 'YYYY-MM-DD' },
          time:         { type: 'string', description: 'HH:MM (hora Venezuela UTC-4)' },
          duration:     { type: 'integer', description: 'Minutos, default 60' },
          doctor_id:    { type: 'string', description: `Doctores: ${doctors.map(d => `${d.id}=${d.name}`).join(', ')}` },
          notes:        { type: 'string' },
        },
        required: ['patient_id', 'patient_name', 'date', 'time'],
      },
    },
  },
  {
    type: 'function', function: {
      name: 'get_patient_appointments',
      description: 'Obtiene las citas de un paciente específico',
      parameters: {
        type: 'object',
        properties: {
          patient_id:   { type: 'string' },
          patient_name: { type: 'string' },
        },
        required: ['patient_id', 'patient_name'],
      },
    },
  },
  {
    type: 'function', function: {
      name: 'cancel_appointment',
      description: 'Cancela una cita de un paciente',
      parameters: {
        type: 'object',
        properties: {
          appointment_id: { type: 'string', description: 'ID de la cita' },
          patient_name:   { type: 'string' },
        },
        required: ['appointment_id', 'patient_name'],
      },
    },
  },
  {
    type: 'function', function: {
      name: 'get_agenda',
      description: 'Muestra las citas de una fecha',
      parameters: {
        type: 'object',
        properties: { date: { type: 'string', description: 'YYYY-MM-DD. Sin especificar = hoy.' } },
        required: [],
      },
    },
  },
  // — TREATMENT PLANS —
  {
    type: 'function', function: {
      name: 'get_patient_plans',
      description: 'Muestra los planes de tratamiento de un paciente',
      parameters: {
        type: 'object',
        properties: {
          patient_id:   { type: 'string' },
          patient_name: { type: 'string' },
        },
        required: ['patient_id', 'patient_name'],
      },
    },
  },
  {
    type: 'function', function: {
      name: 'create_treatment_plan',
      description: `Crea un plan de tratamiento para un paciente. Servicios del catálogo: ${services.slice(0, 10).map(s => `${s.name}($${s.price})`).join(', ')}`,
      parameters: {
        type: 'object',
        properties: {
          patient_id:   { type: 'string' },
          patient_name: { type: 'string' },
          plan_name:    { type: 'string', description: 'Nombre del plan' },
          items: {
            type: 'array',
            description: 'Procedimientos del plan',
            items: {
              type: 'object',
              properties: {
                name:     { type: 'string', description: 'Nombre del procedimiento/servicio' },
                price:    { type: 'number', description: 'Precio unitario en USD' },
                quantity: { type: 'integer', description: 'Cantidad, default 1' },
              },
              required: ['name', 'price'],
            },
          },
        },
        required: ['patient_id', 'patient_name', 'plan_name', 'items'],
      },
    },
  },
  // — FINANCE —
  {
    type: 'function', function: {
      name: 'get_patient_balance',
      description: 'Consulta el saldo/deuda de un paciente',
      parameters: {
        type: 'object',
        properties: {
          patient_id:   { type: 'string' },
          patient_name: { type: 'string' },
        },
        required: ['patient_id', 'patient_name'],
      },
    },
  },
  {
    type: 'function', function: {
      name: 'register_payment',
      description: 'Registra un pago de un paciente',
      parameters: {
        type: 'object',
        properties: {
          patient_id:   { type: 'string' },
          patient_name: { type: 'string' },
          amount:       { type: 'number', description: 'Monto del pago' },
          currency:     { type: 'string', enum: ['USD', 'VES'], description: 'Moneda' },
          method:       { type: 'string', enum: ['efectivo', 'transferencia', 'tarjeta', 'zelle', 'otro'], description: 'Método de pago' },
          notes:        { type: 'string' },
        },
        required: ['patient_id', 'patient_name', 'amount', 'currency', 'method'],
      },
    },
  },
  // — STATS & NAVIGATION —
  {
    type: 'function', function: {
      name: 'get_statistics',
      description: 'Estadísticas del mes',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function', function: {
      name: 'get_patients_with_debt',
      description: 'Lista pacientes con deuda',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function', function: {
      name: 'navigate_to',
      description: 'Navega a un módulo',
      parameters: {
        type: 'object',
        properties: {
          route: { type: 'string', enum: ['/', '/agenda', '/pacientes', '/finanzas', '/estadisticas', '/maestro', '/ajustes'] },
        },
        required: ['route'],
      },
    },
  },
  // — ODONTOGRAM —
  {
    type: 'function', function: {
      name: 'update_odontogram',
      description: 'Actualiza el estado de uno o más dientes en el odontograma de un paciente. Navega primero al perfil del paciente.',
      parameters: {
        type: 'object',
        properties: {
          patient_id: { type: 'string' },
          patient_name: { type: 'string' },
          teeth: {
            type: 'array',
            description: 'Lista de dientes a modificar',
            items: {
              type: 'object',
              properties: {
                tooth_number: { type: 'integer', description: 'Número FDI del diente (11-85)' },
                condition:    { type: 'string', description: 'Estado: sano, caries, endodoncia indicada, endodoncia realizada, exodoncia indicada, exodoncia realizada, implante indicado, implante realizado, fractura, ausente, limpiar' },
              },
              required: ['tooth_number', 'condition'],
            },
          },
        },
        required: ['patient_id', 'patient_name', 'teeth'],
      },
    },
  },
  // — CLINICAL NOTES —
  {
    type: 'function', function: {
      name: 'add_clinical_note',
      description: 'Agrega una nota clínica/consulta al historial de un paciente',
      parameters: {
        type: 'object',
        properties: {
          patient_id:   { type: 'string' },
          patient_name: { type: 'string' },
          treatment:    { type: 'string', description: 'Tratamiento realizado' },
          reason:       { type: 'string', description: 'Motivo de la consulta' },
          amount:       { type: 'number', description: 'Monto cobrado (0 si no aplica)' },
        },
        required: ['patient_id', 'patient_name', 'treatment'],
      },
    },
  },
];

// ── Execute tool (async) ──────────────────────────────
const executeTool = async (name, args, ctx) => {
  const {
    patients, stats, appointments, doctors, services, treatmentPlans,
    addAppointment, updateAppointment, addPatient, addPayment,
    saveTreatmentPlan, addConsultation, saveOdontogram, loadOdontogram,
    navigate, setConfirmation, activeOrgId,
  } = ctx;

  const findPatient = (id) => patients.find(p => p.id === id);

  switch (name) {
    // ─ PATIENTS ─────────────────────────────────────
    case 'search_patients': {
      const q = args.query.toLowerCase();
      const found = patients.filter(p => p.name?.toLowerCase().includes(q)).slice(0, 6);
      if (!found.length) return `No encontré pacientes con "${args.query}".`;
      return `**Pacientes encontrados:**\n${found.map(p => `• ${p.name} — ID: \`${p.id}\` — Deuda: $${(p.debt || 0).toFixed(2)}`).join('\n')}`;
    }

    case 'navigate_to_patient': {
      navigate(`/pacientes/${args.patient_id}`);
      return `✅ Navegando al perfil de **${args.patient_name}**.`;
    }

    case 'register_patient': {
      try {
        const newP = await addPatient({
          full_name: args.full_name,
          cedula: args.cedula || '',
          phone: args.phone || '',
          email: args.email || '',
          date_of_birth: args.date_of_birth || null,
          status: 'active',
        });
        setConfirmation({ text: `Paciente **${args.full_name}** registrado exitosamente.` });
        return `✅ Paciente **${args.full_name}** creado con ID \`${newP?.id}\`.`;
      } catch (e) { return `❌ Error: ${e.message}`; }
    }

    // ─ APPOINTMENTS ─────────────────────────────────
    case 'create_appointment': {
      try {
        const dur = args.duration || 60;
        const doctorId = args.doctor_id || doctors[0]?.id;
        if (!doctorId) return '❌ No hay doctores. Agrega uno primero en Control Maestro.';
        const startsAt = toISODateTime(args.date, args.time);
        const endsAt   = addMinutes(startsAt, dur);
        await addAppointment({ patient_id: args.patient_id, doctor_id: doctorId, starts_at: startsAt, ends_at: endsAt, notes: args.notes || 'Cita creada por IA', status: 'scheduled', total_amount: 0 });
        const doctorName = doctors.find(d => d.id === doctorId)?.name || 'Doctor';
        const dateLabel = new Date(`${args.date}T12:00:00`).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
        setConfirmation({ text: `Cita creada para **${args.patient_name}** el ${dateLabel} a las ${args.time}` });
        return `✅ Cita agendada:\n• **Paciente:** ${args.patient_name}\n• **Fecha:** ${dateLabel} a las ${args.time}\n• **Doctor:** ${doctorName}\n• **Duración:** ${dur} min`;
      } catch (e) { return `❌ Error: ${e.message}`; }
    }

    case 'get_patient_appointments': {
      const patApps = appointments.filter(a => a.patient_id === args.patient_id).slice(0, 8);
      if (!patApps.length) return `${args.patient_name} no tiene citas registradas.`;
      return `📅 **Citas de ${args.patient_name}:**\n${patApps.map(a => `• ${a.date} ${a.startTime || ''} — ${a.doctorName || 'Sin doctor'} — ${a.status || 'programada'}`).join('\n')}`;
    }

    case 'cancel_appointment': {
      try {
        await updateAppointment(args.appointment_id, { status: 'cancelled' });
        setConfirmation({ text: `Cita de **${args.patient_name}** cancelada.` });
        return `✅ Cita cancelada correctamente.`;
      } catch (e) { return `❌ Error: ${e.message}`; }
    }

    case 'get_agenda': {
      const date = args.date || new Date().toISOString().split('T')[0];
      const dayApps = appointments.filter(a => (a.date || '').startsWith(date));
      if (!dayApps.length) return `No hay citas para ${date}.`;
      return `📅 **Citas del ${date}:**\n${dayApps.slice(0, 10).map(a => `• ${a.startTime} — ${a.patientName} con ${a.doctorName}`).join('\n')}`;
    }

    // ─ TREATMENT PLANS ──────────────────────────────
    case 'get_patient_plans': {
      const plans = treatmentPlans.filter(p => p.patient_id === args.patient_id);
      if (!plans.length) return `${args.patient_name} no tiene planes de tratamiento.`;
      return `📋 **Planes de ${args.patient_name}:**\n${plans.map(p => `• **${p.name}** — $${p.total_amount?.toFixed(2)} — ${p.status}`).join('\n')}`;
    }

    case 'create_treatment_plan': {
      try {
        const items = args.items.map(i => ({
          name: i.name, price: i.price, quantity: i.quantity || 1,
          service_id: services.find(s => s.name.toLowerCase().includes(i.name.toLowerCase()))?.id || null,
        }));
        const total = items.reduce((t, i) => t + i.price * i.quantity, 0);
        await saveTreatmentPlan({
          patient_id: args.patient_id, name: args.plan_name,
          total, status: 'pending',
        }, items);
        setConfirmation({ text: `Plan **${args.plan_name}** creado para **${args.patient_name}** ($${total.toFixed(2)}).` });
        return `✅ Plan **${args.plan_name}** creado:\n${items.map(i => `• ${i.quantity}× ${i.name} — $${(i.price * i.quantity).toFixed(2)}`).join('\n')}\n**Total: $${total.toFixed(2)}**`;
      } catch (e) { return `❌ Error: ${e.message}`; }
    }

    // ─ FINANCE ──────────────────────────────────────
    case 'get_patient_balance': {
      const p = findPatient(args.patient_id);
      if (!p) return `No encontré al paciente ${args.patient_name}.`;
      return `💰 **Balance de ${args.patient_name}:**\n• Deuda: $${(p.debt || 0).toFixed(2)}\n• Pagos realizados: ${p.paymentCount || 0}`;
    }

    case 'register_payment': {
      try {
        await addPayment(args.patient_id, {
          amount: args.amount, currency: args.currency,
          method: args.method, notes: args.notes || 'Pago registrado por IA',
          created_at: new Date().toISOString(),
        });
        setConfirmation({ text: `Pago de **${args.amount} ${args.currency}** registrado para **${args.patient_name}**.` });
        return `✅ Pago registrado:\n• **Paciente:** ${args.patient_name}\n• **Monto:** ${args.amount} ${args.currency}\n• **Método:** ${args.method}`;
      } catch (e) { return `❌ Error: ${e.message}`; }
    }

    // ─ STATS ────────────────────────────────────────
    case 'get_statistics': {
      return `📊 **Estadísticas del mes:**\n• Ingresos: $${(stats.currentIncome || 0).toFixed(2)}\n• Pacientes nuevos: ${stats.newPatientsCount || 0}\n• Conversión: ${stats.conversionRate || 0}%\n• Cuentas por cobrar: $${(stats.totalCuentasPorCobrar || 0).toFixed(2)}`;
    }

    case 'get_patients_with_debt': {
      const d = stats.debtors?.slice(0, 6) || [];
      if (!d.length) return '✅ Sin deudas pendientes.';
      return `💰 **Deudores:**\n${d.map(p => `• ${p.name} — $${(p.debt || 0).toFixed(2)}`).join('\n')}`;
    }

    case 'navigate_to': {
      navigate(args.route);
      return `✅ Navegando a ${args.route}.`;
    }

    // ─ ODONTOGRAM ───────────────────────────────────
    case 'update_odontogram': {
      try {
        const current = await loadOdontogram(args.patient_id);
        const toothData = current?.tooth_data || {};
        const rowStates = current?.row_states || { permUpper: null, permLower: null, tempUpper: null, tempLower: null };
        const bridges   = current?.bridges || [];

        const summary = [];
        for (const { tooth_number, condition } of args.teeth) {
          const actionKey = condition.toLowerCase().trim();
          const action = TOOTH_ACTION_MAP[actionKey];
          if (!action) {
            summary.push(`⚠️ Diente ${tooth_number}: condición "${condition}" no reconocida.`);
            continue;
          }
          if (action === 'RESET') {
            delete toothData[tooth_number];
          } else {
            const current = toothData[tooth_number] || { surfaces: {}, wholeState: null };
            toothData[tooth_number] = { ...current, wholeState: action };
          }
          summary.push(`✅ Diente ${tooth_number}: ${condition}`);
        }

        await saveOdontogram(args.patient_id, { toothData, rowStates, bridges, notes: '' });
        navigate(`/pacientes/${args.patient_id}`);
        setConfirmation({ text: `Odontograma de **${args.patient_name}** actualizado.` });
        return `**Odontograma actualizado:**\n${summary.join('\n')}`;
      } catch (e) { return `❌ Error: ${e.message}`; }
    }

    // ─ CLINICAL NOTES ───────────────────────────────
    case 'add_clinical_note': {
      try {
        await addConsultation({
          patient_id: args.patient_id,
          treatment: args.treatment,
          reason: args.reason || '',
          amount: args.amount || 0,
          date: new Date().toISOString().split('T')[0],
          payment_status: 'Pendiente',
        });
        setConfirmation({ text: `Nota clínica agregada para **${args.patient_name}**.` });
        return `✅ Nota clínica registrada para ${args.patient_name}: "${args.treatment}"`;
      } catch (e) { return `❌ Error: ${e.message}`; }
    }

    default:
      return 'Acción no disponible.';
  }
};

// ── Markdown ──────────────────────────────────────────
const Markdown = ({ text }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
    {text.split('\n').map((line, i) => (
      <p key={i} style={{ margin: 0, lineHeight: 1.55 }}
        dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/`(.*?)`/g, '<code style="background:#F1F5F9;padding:0 3px;border-radius:4px;font-family:monospace;font-size:0.75em">$1</code>') }}
      />
    ))}
  </div>
);

// ─────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────
const AIAssistant = () => {
  const dataCtx = useData();
  const { patients, stats, appointments, doctors, services, treatmentPlans,
    addAppointment, updateAppointment, addPatient, addPayment,
    saveTreatmentPlan, addConsultation, saveOdontogram, loadOdontogram } = dataCtx;
  const { canUseVoice, voiceMinutesLeft, consumeVoiceMinute, canUseAI, addVoiceCredits } = usePlan();
  const navigate  = useNavigate();
  const location  = useLocation();
  const moduleName = getModuleName(location.pathname);

  const [open,         setOpen]         = useState(false);
  const [voiceMode,    setVoiceMode]    = useState(false);
  const [messages,     setMessages]     = useState([{
    role: 'assistant',
    content: '¡Hola! Soy Vivia 🦷. Háblame para agendar citas, actualizar odontogramas o consultar saldos en segundos. ¿Qué necesitas hoy?',
  }]);
  const [input,        setInput]        = useState('');
  const [loading,      setLoading]      = useState(false);
  const [listening,    setListening]    = useState(false);
  const [error,        setError]        = useState(null);
  const [confirmation, setConfirmation] = useState(null);
  const [speaking,     setSpeaking]     = useState(false);
  const audioRef = useRef(null);

  // ── ElevenLabs TTS ──────────────────────────────────
  const speakText = useCallback(async (text) => {
    if (!ELEVENLABS_KEY || !canUseVoice) return;
    if (speaking) { audioRef.current?.pause(); setSpeaking(false); return; }
    try {
      setSpeaking(true);
      const clean = text.replace(/\*\*(.*?)\*\*/g, '$1').replace(/•/g, '').substring(0, 500);
      const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE}/stream`, {
        method: 'POST',
        headers: { 'xi-api-key': ELEVENLABS_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: clean, model_id: 'eleven_flash_v2_5', voice_settings: { stability: 0.5, similarity_boost: 0.75 } }),
      });
      if (!res.ok) throw new Error('ElevenLabs error');
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => { setSpeaking(false); consumeVoiceMinute(); };
      audio.play();
    } catch { setSpeaking(false); }
  }, [canUseVoice, speaking, consumeVoiceMinute]);

  const scrollRef      = useRef(null);
  const recognitionRef = useRef(null);
  const TOOLS = buildTools(doctors, services);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  // ── Voice ─────────────────────────────────────────
  const startListening = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setError('Usa Chrome para reconocimiento de voz.'); return; }
    const r = new SR();
    r.lang = 'es-ES'; r.continuous = false; r.interimResults = false;
    r.onresult = (e) => { 
      const t = e.results[0][0].transcript;
      setInput(p => p ? p + ' ' + t : t); 
      setListening(false); 
      if (voiceMode) { setTimeout(() => sendMessage(t), 100); }
    };
    r.onerror = r.onend = () => setListening(false);
    recognitionRef.current = r; r.start(); setListening(true);
  }, [voiceMode]); // sendMessage is handled externally but passed text directly.

  const stopListening = () => { recognitionRef.current?.stop(); setListening(false); };

  // ── Send ──────────────────────────────────────────
  const sendMessage = useCallback(async (text) => {
    const userText = (text || input).trim();
    if (!userText || loading) return;
    setInput(''); setError(null); setConfirmation(null);

    const userMsg = { role: 'user', content: userText };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs); setLoading(true);

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const systemPrompt = `Eres el asistente dental de "Sas Odontológico". Módulo: ${moduleName}. Hoy: ${todayStr} (Venezuela UTC-4).
Doctores: ${doctors.map(d => d.name + '(ID:' + d.id + ')').join(', ') || 'Ninguno'}.
Servicios: ${services.slice(0, 12).map(s => s.name + ' $' + s.price).join(' | ')}.

SINÓNIMOS — entiende variaciones y errores ortográficos:
• Crear cita = agendar, programar, reservar, hacer una cita, poner una cita
• Cancelar = anular, borrar la cita, quitar, eliminar la cita
• Reagendar = mover la cita, cambiar la fecha, reprogramar, posponer
• Ver deuda/balance = cuánto debe, saldo del paciente
• Canal = endodoncia | sacar el diente = exodoncia | pieza ausente = ausente
• "sí"/"dale"/"correcto"/"bueno"/"va" = confirmación

PACIENTES (CRÍTICO):
• USA search_patients SIEMPRE antes de actuar sobre un paciente.
• Si hay MÚLTIPLES con el mismo nombre: lista todos numerados y pregunta cuál. NO actúes hasta tener respuesta.
• Si es uno solo, confirma el nombre y procede.

CREAR CITA — necesitas: paciente + fecha + hora inicio + duración:
• Si NO mencionan duración ni hora de fin: pregunta "¿Hasta qué hora dura? o ¿cuánto tiempo aproximado?"
• Calcula fechas relativas ("mañana", "el lunes", "la próxima semana") desde ${todayStr}.
• Si no especifican doctor, usa el primero disponible e indícalo.

CANCELAR CITA:
• PRIMERO pregunta: "¿Por qué deseas cancelar? Quedará registrado en el sistema."
• Espera respuesta, guarda el motivo en notas, luego cancela.
• NO pidas motivo si la cita fue exitosa/completada.

REAGENDAR CITA:
• PRIMERO pregunta: "¿Por qué necesitas reagendar?"
• Luego pregunta nueva fecha y hora.

PLANES DE TRATAMIENTO:
• Busca precios en el catálogo. Si no hay precio: pídelo.
• Muestra resumen antes de crear: "¿Confirmas: X, Y, Z? Total: $N"
• Espera confirmación antes de guardar.

ODONTOGRAMA — FDI: sup.der. 11-18, sup.izq. 21-28, inf.izq. 31-38, inf.der. 41-48.
Condiciones: sano, caries, endodoncia indicada/realizada, exodoncia indicada/realizada, implante indicado/realizado, fractura, ausente, limpiar.

GENERAL: Nunca ejecutes acciones críticas sin confirmar. Pregunta máximo 2 cosas a la vez.`;

    const apiMsgs = [
      { role: 'system', content: systemPrompt },
      ...newMsgs.map(m => ({ role: m.role, content: m.content })),
    ];

    const ctx = {
      patients, stats, appointments, doctors, services, treatmentPlans,
      addAppointment, updateAppointment, addPatient, addPayment,
      saveTreatmentPlan, addConsultation, saveOdontogram, loadOdontogram,
      navigate, setConfirmation,
    };

    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_KEY}` },
        body: JSON.stringify({ model: 'gpt-4o-mini', messages: apiMsgs, tools: TOOLS, tool_choice: 'auto', max_tokens: 800 }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error?.message || `HTTP ${res.status}`); }
      const data = await res.json();
      let choice = data.choices[0];

      if (choice.finish_reason === 'tool_calls') {
        const toolCalls = choice.message.tool_calls;
        const toolResults = await Promise.all(toolCalls.map(async tc => {
          const args   = JSON.parse(tc.function.arguments || '{}');
          const result = await executeTool(tc.function.name, args, ctx);
          return { tool_call_id: tc.id, role: 'tool', content: result };
        }));

        const followUp = [...apiMsgs, choice.message, ...toolResults];
        const res2 = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_KEY}` },
          body: JSON.stringify({ model: 'gpt-4o-mini', messages: followUp, max_tokens: 500 }),
        });
        const data2 = await res2.json();
        const finalText = data2.choices[0]?.message?.content || toolResults.map(t => t.content).join('\n');
        setMessages(prev => [...prev, { role: 'assistant', content: finalText }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: choice.message?.content || '…' }]);
      }
    } catch (err) {
      setError(err.message);
      setMessages(prev => [...prev, { role: 'assistant', content: `❌ ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, moduleName, patients, stats, appointments, doctors, services, treatmentPlans,
    addAppointment, updateAppointment, addPatient, addPayment,
    saveTreatmentPlan, addConsultation, saveOdontogram, loadOdontogram, navigate, TOOLS]);

  const handleKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

  const handleVoiceToggle = () => {
    if (!canUseAI) {
      setVoiceMode(true);
      setOpen(true);
    } else {
      if (speaking) {
        audioRef.current?.pause();
        setSpeaking(false);
      } else if (listening) {
        stopListening();
      } else {
        startListening();
      }
    }
  };

  const handleFreeTrial = () => {
    addVoiceCredits(5);
    setOpen(false);
    setTimeout(() => {
      speakText('Hola, soy Vivia tu asistenta en Smart Dental Pro, cuéntame en que puedo ayudarte justo ahora?');
    }, 500);
  };

  return (
    <>
      {/* Floating Buttons */}
      <div style={{ position: 'fixed', bottom: '1.75rem', right: '1.75rem', zIndex: 8000, display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'flex-end' }}>
        {/* Text Chat Button */}
        {!open && (
           <motion.button onClick={() => { setVoiceMode(false); setOpen(o => !o); }} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.9 }}
             style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#fff', border: '1.5px solid #EEF2F7', cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}>
              <Bot size={20} />
           </motion.button>
        )}
        
        {/* Voice Mode Button (Inline Status Pill) */}
        {!open && (
          <motion.button onClick={handleVoiceToggle} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
            style={{ 
              padding: '0 1.25rem', height: '56px', borderRadius: '28px', 
              background: listening ? '#EF4444' : speaking ? 'linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)' : loading ? '#3B82F6' : 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)', 
              border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.75rem', 
              boxShadow: listening ? '0 8px 30px rgba(239,68,68,0.5)' : speaking ? '0 8px 30px rgba(124,58,237,0.6)' : '0 12px 30px rgba(37,99,235,0.45), inset 0 2px 4px rgba(255,255,255,0.2)',
              transition: 'background 0.3s'
            }}>
            
            {speaking ? (
                <> <Volume2 size={18} className="pulse-icon" /> <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>Vivia hablando...</span> </>
            ) : listening ? (
                <> <Mic size={18} className="pulse-icon" /> <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>Te escucho...</span> </>
            ) : loading ? (
                <> <Loader2 size={18} className="spin" /> <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>Pensando...</span> </>
            ) : (
                <> <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#fff', boxShadow: '0 0 10px #fff' }} className="pulse-dot" /> <span style={{ fontWeight: 800, fontSize: '0.95rem', letterSpacing: '-0.01em' }}>Hablar con Vivia</span> </>
            )}
            
          </motion.button>
        )}
      </div>

      {/* Panel (Text Chat Mode) */}
      <AnimatePresence>
        {open && !voiceMode && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'fixed', bottom: '1.75rem', right: '1.75rem', zIndex: 8000,
              width: '400px', maxWidth: 'calc(100vw - 2rem)',
              height: '580px', maxHeight: 'calc(100vh - 4rem)',
              background: '#fff', borderRadius: '2rem',
              boxShadow: '0 32px 80px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.05)',
              display: 'flex', flexDirection: 'column', overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{ padding: '1rem 1.25rem', background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}><Sparkles size={18} /></div>
                <div>
                  <p style={{ color: '#fff', fontWeight: 900, fontSize: '0.875rem', margin: 0 }}>Asistente Dental IA</p>
                  <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.65rem', fontWeight: 600, margin: 0 }}>{moduleName} · 15 aptitudes</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} style={{ width: '30px', height: '30px', borderRadius: '10px', background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
                onMouseOut={e =>  e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
              ><ChevronDown size={16} /></button>
            </div>

            {/* Content Switcher */}
            {!canUseAI ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'linear-gradient(135deg, #F8FAFC 0%, #EEF2F7 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}>
                  <Sparkles size={32} style={{ color: '#94A3B8' }} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0F172A', margin: '0 0 0.5rem', letterSpacing: '-0.02em' }}>Asistente Dental Inteligente</h3>
                <p style={{ color: '#64748B', fontSize: '0.875rem', lineHeight: 1.6, margin: '0 0 2rem', maxWidth: '280px' }}>
                  Automatiza tu clínica con IA. Citas, pacientes y cobros desde un solo lugar usando comandos de voz.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
                  <button onClick={handleFreeTrial}
                    style={{ padding: '0.75rem 1.25rem', background: 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(239,68,68,0.05))', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '2rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'all 0.2s' }}
                    onMouseOver={e => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}
                    onMouseOut={e => e.currentTarget.style.background = 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(239,68,68,0.05))'}>
                    <Sparkles size={15} /> Probar 5 min gratis
                  </button>
                  <button onClick={() => { setOpen(false); navigate('/precios'); }}
                    style={{ padding: '0.75rem 1.25rem', background: '#F8FAFC', color: '#334155', border: '1px solid #E2E8F0', borderRadius: '2rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                    onMouseOver={e => e.currentTarget.style.background = '#F1F5F9'}
                    onMouseOut={e => e.currentTarget.style.background = '#F8FAFC'}>
                    Ver Planes Premium
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Confirmation banner */}
                <AnimatePresence>
                  {confirmation && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      style={{ background: '#ECFDF5', borderBottom: '1px solid #A7F3D0', padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <CheckCircle2 size={15} style={{ color: '#059669', flexShrink: 0 }} />
                      <p style={{ fontSize: '0.72rem', color: '#065F46', fontWeight: 700, margin: 0 }}
                        dangerouslySetInnerHTML={{ __html: confirmation.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                      <button onClick={() => setConfirmation(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#6EE7B7', cursor: 'pointer' }}><X size={13} /></button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Messages */}
                <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {messages.map((msg, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: '0.5rem' }}>
                      <div style={{ width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0, background: msg.role === 'user' ? 'linear-gradient(135deg,#2563EB,#7C3AED)' : '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: msg.role === 'user' ? '#fff' : '#64748B' }}>
                        {msg.role === 'user' ? <User size={13} /> : <Bot size={13} />}
                      </div>
                      <div style={{ maxWidth: '82%', padding: '0.6rem 0.875rem', borderRadius: msg.role === 'user' ? '1.25rem 1.25rem 0.25rem 1.25rem' : '1.25rem 1.25rem 1.25rem 0.25rem', background: msg.role === 'user' ? 'linear-gradient(135deg,#2563EB,#7C3AED)' : '#F8FAFC', border: msg.role === 'user' ? 'none' : '1px solid #EEF2F7', color: msg.role === 'user' ? '#fff' : '#0F172A', fontSize: '0.8rem', fontWeight: 500, lineHeight: 1.5 }}>
                        {msg.role === 'assistant' ? <Markdown text={msg.content} /> : msg.content}
                      </div>
                      {/* Speaker button for assistant messages */}
                      {msg.role === 'assistant' && ELEVENLABS_KEY && (
                        <motion.button onClick={() => speakText(msg.content)} whileTap={{ scale: 0.85 }} title={canUseVoice ? 'Escuchar respuesta' : 'Necesitas minutos de voz'}
                          style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'transparent', border: 'none', color: canUseVoice ? '#94A3B8' : '#CBD5E1', cursor: canUseVoice ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, alignSelf: 'center' }}>
                          {speaking ? <VolumeX size={13} /> : <Volume2 size={13} />}
                        </motion.button>
                      )}
                    </div>
                  ))}
                  {loading && (
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
                      <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}><Bot size={13} /></div>
                      <div style={{ padding: '0.6rem 0.875rem', borderRadius: '1.25rem 1.25rem 1.25rem 0.25rem', background: '#F8FAFC', border: '1px solid #EEF2F7', display: 'flex', gap: '4px', alignItems: 'center' }}>
                        {[0,1,2].map(i => <motion.div key={i} animate={{ y: [0,-5,0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i*0.15 }} style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#94A3B8' }} />)}
                      </div>
                    </div>
                  )}
                </div>

                {/* Input */}
                <div style={{ padding: '0.75rem 0.875rem', borderTop: '1px solid #EEF2F7', display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
                  <motion.button onClick={listening ? stopListening : startListening} whileTap={{ scale: 0.88 }}
                    style={{ width: '40px', height: '40px', borderRadius: '14px', flexShrink: 0, background: listening ? '#EF4444' : '#F8FAFC', border: listening ? 'none' : '1.5px solid #EEF2F7', color: listening ? '#fff' : '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', boxShadow: listening ? '0 0 0 4px rgba(239,68,68,0.2)' : 'none' }}>
                    {listening ? <motion.div animate={{ scale: [1,1.2,1] }} transition={{ duration: 1, repeat: Infinity }}><MicOff size={16} /></motion.div> : <Mic size={16} />}
                  </motion.button>
                  <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
                    placeholder={listening ? '🎤 Escuchando...' : 'Escribe o usa el micrófono...'}
                    rows={1}
                    style={{ flex: 1, resize: 'none', background: '#F8FAFC', border: '1.5px solid #EEF2F7', borderRadius: '1rem', padding: '0.6rem 0.875rem', fontSize: '0.8rem', fontWeight: 500, color: '#0F172A', outline: 'none', lineHeight: 1.5, maxHeight: '96px', fontFamily: 'Inter, sans-serif', transition: 'border-color 0.2s' }}
                    onFocus={e => e.currentTarget.style.borderColor = 'rgba(37,99,235,0.35)'}
                    onBlur={e =>  e.currentTarget.style.borderColor = '#EEF2F7'} />
                  <motion.button onClick={() => sendMessage()} disabled={!input.trim() || loading} whileTap={{ scale: 0.88 }}
                    style={{ width: '40px', height: '40px', borderRadius: '14px', flexShrink: 0, background: input.trim() && !loading ? 'linear-gradient(135deg,#2563EB,#7C3AED)' : '#EEF2F7', border: 'none', color: input.trim() && !loading ? '#fff' : '#CBD5E1', cursor: input.trim() && !loading ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', boxShadow: input.trim() && !loading ? '0 4px 12px rgba(37,99,235,0.3)' : 'none' }}>
                    {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={15} />}
                  </motion.button>
                </div>
                {error && <div style={{ padding: '0.4rem 1rem', background: '#FEF2F2', borderTop: '1px solid #FECACA' }}><p style={{ fontSize: '0.68rem', color: '#DC2626', fontWeight: 600, margin: 0 }}>{error}</p></div>}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen Voice Mode Overlay */}
      <AnimatePresence>
        {open && voiceMode && (
          <motion.div initial={{ opacity: 0, backdropFilter: 'blur(0px)' }} animate={{ opacity: 1, backdropFilter: 'blur(16px)' }} exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            style={{ position: 'fixed', inset: 0, zIndex: 9600, background: 'rgba(15,23,42,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '4rem 1rem 2rem 1rem' }}
          >
             {/* Header */}
             <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', paddingRight: '2rem' }}>
               <button onClick={() => setOpen(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '48px', height: '48px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                 <X size={24} />
               </button>
             </div>
             
             {/* The Orb Container */}
             <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
               <motion.div 
                  animate={{ 
                    scale: speaking ? [1, 1.4, 0.9, 1.3, 1] : listening ? [1, 1.15, 1] : loading ? [1, 0.9, 1] : [1, 1.05, 1],
                    rotate: loading ? 360 : 0
                  }}
                  transition={{ 
                    duration: speaking ? 0.6 : listening ? 1.5 : loading ? 1.5 : 4, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                  style={{
                    width: '180px', height: '180px', borderRadius: '50%',
                    background: speaking ? 'radial-gradient(circle, #D8B4FE 0%, #7C3AED 100%)' : listening ? 'radial-gradient(circle, #EF4444 0%, #B91C1C 100%)' : loading ? 'conic-gradient(from 0deg, #3B82F6, #8B5CF6, #EC4899, #3B82F6)' : 'radial-gradient(circle, #8B5CF6 0%, #4C1D95 100%)',
                    boxShadow: listening ? '0 0 100px rgba(239,68,68,0.7)' : loading ? '0 0 80px rgba(139,92,246,0.5)' : '0 0 60px rgba(139,92,246,0.3)',
                    filter: 'blur(10px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: '3rem'
                  }}
               />
               
               {/* Text Status */}
               <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', margin: 0, textAlign: 'center' }}>
                 {!canUseAI ? 'BLOQUEADO' : listening ? 'Te escucho...' : loading ? 'Pensando...' : speaking ? 'Hablando' : 'Vivia está Inactiva'}
               </p>
             </div>

             {/* Bottom Controls */}
             <div style={{ width: '100%', maxWidth: '800px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem', paddingBottom: '2rem' }}>
                {/* Subtitles: Last message */}
                <div style={{ textAlign: 'center', minHeight: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '0 1rem' }}>
                  <p style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 500, lineHeight: 1.6, textShadow: '0 2px 10px rgba(0,0,0,0.5)', margin: 0 }}>
                    {messages[messages.length - 1]?.content.replace(/\*\*(.*?)\*\*/g, '$1').replace(/•/g, '') || "Di 'Hola Vivia' para empezar la consulta."}
                  </p>
                </div>

               {/* Mic Toggle Button / Upgrade Button */}
               {canUseAI ? (
                 <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                   <motion.button onClick={listening ? stopListening : startListening} whileTap={{ scale: 0.9 }}
                      style={{ width: '72px', height: '72px', borderRadius: '50%', background: listening ? '#EF4444' : 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: listening ? '0 0 0 8px rgba(239,68,68,0.3)' : 'none' }}>
                      {listening ? <MicOff size={32} /> : <Mic size={32} />}
                   </motion.button>
                   {!listening && !speaking && !loading && (
                     <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', fontWeight: 500, margin: 0 }}>Toca el micrófono para comenzar</p>
                   )}
                 </div>
               ) : (
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', alignItems: 'center' }}>
                   <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem', textAlign: 'center', maxWidth: '450px', lineHeight: 1.5, margin: '0 0 0.5rem' }}>
                     Automatiza tu clínica hablando con la IA. Agendas, pacientes y cobros respondidos al instante.
                   </p>
                   <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
                     <button onClick={handleFreeTrial} style={{ padding: '0.75rem 1.5rem', background: 'rgba(239,68,68,0.15)', color: '#FCA5A5', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '2rem', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s' }}
                      onMouseOver={e => e.currentTarget.style.background = 'rgba(239,68,68,0.25)'}
                      onMouseOut={e => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}>
                       <Sparkles size={14} /> <span>Probar 5 min gratis</span>
                     </button>
                     <button onClick={() => { setOpen(false); navigate('/precios'); }} style={{ padding: '0.75rem 1.5rem', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '2rem', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s' }}
                      onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                      onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>
                       Ver Planes Premium
                     </button>
                   </div>
                 </div>
               )}
             </div>
          </motion.div>
        )}
      </AnimatePresence>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulseDot { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.8); } }
        @keyframes pulseIcon { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.15); } }
        .pulse-dot { animation: pulseDot 2s infinite ease-in-out; }
        .pulse-icon { animation: pulseIcon 1.5s infinite ease-in-out; }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </>
  );
};

export default AIAssistant;
