// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  SMARTDENTAL — WHATSAPP BOT WEBHOOK                                      ║
// ║  Función: Recibe mensajes de ManyChat/WhatsApp y los procesa             ║
// ║                                                                          ║
// ║  ┌─────────────────────────────────────────────────────────────────┐     ║
// ║  │  CÓMO CONECTAR:                                                 │     ║
// ║  │  1. Ir a ManyChat → Automation → Webhooks                       │     ║
// ║  │  2. Endpoint URL: https://<proyecto>.supabase.co                │     ║
// ║  │                   /functions/v1/whatsapp-bot                    │     ║
// ║  │  3. Method: POST                                                │     ║
// ║  │  4. Agregar header: Authorization: Bearer <ANON_KEY>            │     ║
// ║  │  5. En cada flujo de ManyChat, al final hacer una               │     ║
// ║  │     "External Request" a este endpoint                          │     ║
// ║  └─────────────────────────────────────────────────────────────────┘     ║
// ║                                                                          ║
// ║  VARIABLES DE ENTORNO REQUERIDAS (supabase secrets set):                 ║
// ║    MANYCHAT_API_KEY   → Panel de ManyChat → Settings → API               ║
// ║    OPENAI_API_KEY     → platform.openai.com → API Keys                   ║
// ║    WHATSAPP_PHONE_ID  → Meta for Developers → WhatsApp → Phone Number ID ║
// ║    CLINIC_SLUG        → Identificador único por clínica (ej: "smartdental")║
// ╚══════════════════════════════════════════════════════════════════════════╝

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ok = (data: unknown) =>
  new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });

const err = (msg: string, status = 400) =>
  new Response(JSON.stringify({ error: msg }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });

// ─── Tipos ────────────────────────────────────────────────────────────────────

/**
 * Payload que envía ManyChat cuando un paciente activa un flujo.
 * Ajusta los campos según lo que ManyChat envíe en tu cuenta.
 */
interface ManyChatPayload {
  subscriber_id: string;      // ID interno de ManyChat del suscriptor
  phone: string;              // Número de WhatsApp del paciente (ej: "+584241234567")
  first_name: string;
  last_name?: string;
  email?: string;
  last_input_text?: string;   // Último mensaje escrito por el usuario
  custom_fields?: {           // Campos personalizados del flujo de ManyChat
    dni?: string;
    motivo?: string;
    doctor_id?: string;
    slot_date?: string;       // "2025-06-15"
    slot_time?: string;       // "09:00"
  };
  action?: "book_appointment" | "cancel" | "reschedule" | "info" | "ai_query";
}

// ─── Flujo Principal ──────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // ── 0. Autenticación mínima ──────────────────────────────────────────────
  // TODO: Cuando conectes ManyChat, agrega aquí validación del token secreto
  // para evitar abusos. ManyChat permite enviar un header personalizado.
  // const secret = req.headers.get("x-manychat-secret");
  // if (secret !== Deno.env.get("MANYCHAT_WEBHOOK_SECRET")) return err("Unauthorized", 401);

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const payload: ManyChatPayload = await req.json();
    console.log("[whatsapp-bot] Payload recibido:", JSON.stringify(payload));

    // ── 1. Ruta según la acción del flujo ────────────────────────────────────
    switch (payload.action) {

      case "book_appointment":
        return await handleBookAppointment(supabase, payload);

      case "cancel":
        return await handleCancel(supabase, payload);

      case "reschedule":
        return await handleReschedule(supabase, payload);

      case "ai_query":
        // → Redirige al motor de IA (ver función ai-assistant)
        return await handleAiQuery(supabase, payload);

      case "info":
      default:
        // Respuesta de bienvenida / menú principal
        return ok({
          message: "ok",
          response: buildWelcomeMessage(payload.first_name),
        });
    }

  } catch (error) {
    console.error("[whatsapp-bot] Error:", error);
    return err("Error interno del servidor: " + (error as Error).message, 500);
  }
});

// ─── Handlers de Acción ───────────────────────────────────────────────────────

async function handleBookAppointment(supabase: ReturnType<typeof createClient>, payload: ManyChatPayload) {
  const { phone, first_name, last_name, email, custom_fields } = payload;

  // ── A. Buscar o crear paciente en la BD ────────────────────────────────
  let patient = null;

  if (email || custom_fields?.dni) {
    const { data } = await supabase
      .from("patients")
      .select("id, full_name, phone")
      .or(
        [
          email ? `email.eq.${email}` : null,
          custom_fields?.dni ? `dni.eq.${custom_fields.dni}` : null,
        ].filter(Boolean).join(",")
      )
      .maybeSingle();

    patient = data;
  }

  // Si no existe, lo crea automáticamente ✨
  if (!patient) {
    const { data: newPatient, error: insertError } = await supabase
      .from("patients")
      .insert({
        full_name: `${first_name} ${last_name ?? ""}`.trim(),
        phone: phone,
        email: email ?? null,
        dni: custom_fields?.dni ?? null,
        status: "active",
        source: "whatsapp_bot",   // ← trazabilidad de origen
      })
      .select("id, full_name")
      .single();

    if (insertError) throw insertError;
    patient = newPatient;
  }

  // ── B. Crear la cita si se proveyó una franja horaria ─────────────────
  if (custom_fields?.slot_date && custom_fields?.slot_time && custom_fields?.doctor_id) {
    const startsAt = new Date(`${custom_fields.slot_date}T${custom_fields.slot_time}:00`);
    const endsAt = new Date(startsAt.getTime() + 30 * 60 * 1000); // +30 min

    const { error: apptError } = await supabase
      .from("appointments")
      .insert({
        patient_id: patient.id,
        doctor_id: custom_fields.doctor_id,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        status: "scheduled",
        notes: `Agendado por WhatsApp Bot — ManyChat ID: ${payload.subscriber_id}`,
      });

    if (apptError) throw apptError;

    // ── C. Respuesta de confirmación al paciente ──────────────────────
    const dateStr = startsAt.toLocaleDateString("es-ES", {
      weekday: "long", day: "numeric", month: "long",
    });
    const timeStr = custom_fields.slot_time;

    return ok({
      message: "appointment_created",
      patient_id: patient.id,
      // Este texto lo muestra ManyChat de vuelta al paciente
      whatsapp_reply: [
        `✅ *¡Cita confirmada, ${first_name}!*`,
        ``,
        `📅 *Fecha:* ${dateStr}`,
        `🕐 *Hora:* ${timeStr}`,
        ``,
        `Te enviaré un recordatorio automático 24 horas antes.`,
        `Si necesitas reagendar, escríbeme aquí mismo. 😊`,
      ].join("\n"),
    });
  }

  // Si no hay horario todavía, devolver horarios disponibles
  // TODO: conectar con la lógica de disponibilidad del scheduler
  return ok({
    message: "patient_found",
    patient_id: patient.id,
    whatsapp_reply: `Hola ${first_name} 👋 Ya te tengo en el sistema. ¿Qué horario prefieres?`,
  });
}

async function handleCancel(supabase: ReturnType<typeof createClient>, payload: ManyChatPayload) {
  // TODO: Buscar próxima cita del paciente por teléfono y marcarla como 'cancelled'
  console.log("[whatsapp-bot] Cancelación solicitada por:", payload.phone);

  return ok({
    message: "cancel_initiated",
    whatsapp_reply: `Entendido, ${payload.first_name}. Estamos procesando la cancelación de tu cita. ¿Quieres reagendar para otro día?`,
  });
}

async function handleReschedule(supabase: ReturnType<typeof createClient>, payload: ManyChatPayload) {
  // TODO: Marcar cita actual como 'rescheduled' y ofrecer nuevos horarios
  console.log("[whatsapp-bot] Reagendamiento por:", payload.phone);

  return ok({
    message: "reschedule_initiated",
    whatsapp_reply: `¡Claro, ${payload.first_name}! ¿Qué día y hora te quedaría mejor para tu nueva cita?`,
  });
}

async function handleAiQuery(_supabase: ReturnType<typeof createClient>, payload: ManyChatPayload) {
  // → Delega el mensaje libre al motor de IA (función ai-assistant)
  // TODO: hacer una llamada interna a la función ai-assistant
  // Por ahora, responde que está en mantenimiento
  console.log("[whatsapp-bot] AI Query:", payload.last_input_text);

  return ok({
    message: "ai_queued",
    whatsapp_reply: "🤖 Estoy procesando tu pregunta, un momento por favor...",
  });
}

// ─── Mensajes Plantilla ───────────────────────────────────────────────────────

function buildWelcomeMessage(name: string): string {
  return [
    `👋 ¡Hola, *${name}*! Bienvenido a *SmartDental* 🦷`,
    ``,
    `Puedo ayudarte con:`,
    `1️⃣ Agendar una cita nueva`,
    `2️⃣ Cancelar o reagendar tu cita`,
    `3️⃣ Consultar tus próximas citas`,
    `4️⃣ Hablar con un asesor`,
    ``,
    `Responde con el número de tu opción o escríbeme directamente.`,
  ].join("\n");
}
