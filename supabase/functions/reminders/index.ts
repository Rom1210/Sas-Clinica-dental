// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  SMARTDENTAL — APPOINTMENT REMINDERS (Recordatorios Automáticos)         ║
// ║  Función: Se ejecuta todos los días a las 9:00 AM automáticamente        ║
// ║           y envía mensajes de WhatsApp a pacientes con cita al día       ║
// ║           siguiente.                                                     ║
// ║                                                                          ║
// ║  ┌─────────────────────────────────────────────────────────────────┐     ║
// ║  │  CÓMO ACTIVAR EL CRON (ejecutar en SQL Editor de Supabase):     │     ║
// ║  │                                                                 │     ║
// ║  │  SELECT cron.schedule(                                          │     ║
// ║  │    'daily-appointment-reminders',                               │     ║
// ║  │    '0 13 * * *',  -- 9:00 AM Venezuela (UTC-4 = 13:00 UTC)      │     ║
// ║  │    $$                                                           │     ║
// ║  │    SELECT net.http_post(                                        │     ║
// ║  │      url := 'https://<proj>.supabase.co/functions/v1/reminders',│     ║
// ║  │      headers := '{"Authorization": "Bearer <SERVICE_ROLE_KEY>", │     ║
// ║  │                   "Content-Type": "application/json"}'::jsonb,  │     ║
// ║  │      body := '{}'::jsonb                                        │     ║
// ║  │    );                                                           │     ║
// ║  │    $$                                                           │     ║
// ║  │  );                                                             │     ║
// ║  │                                                                 │     ║
// ║  │  REQUISITO: Activar extensión pg_cron y pg_net en Supabase      │     ║
// ║  │  Dashboard → Database → Extensions → Activar ambas             │     ║
// ║  └─────────────────────────────────────────────────────────────────┘     ║
// ║                                                                          ║
// ║  VARIABLES DE ENTORNO:                                                   ║
// ║    MANYCHAT_API_KEY  → Para enviar mensajes desde ManyChat               ║
// ║    MANYCHAT_PAGE_ID  → Tu Page ID de ManyChat (en los settings)          ║
// ║                                                                          ║
// ║  ALTERNATIVA SIN MANYCHAT:                                               ║
// ║    Usar directamente la Meta WhatsApp Business API:                      ║
// ║    WHATSAPP_TOKEN    → Meta for Developers → WhatsApp → Token            ║
// ║    WHATSAPP_PHONE_ID → Meta for Developers → WhatsApp → Phone Number ID  ║
// ╚══════════════════════════════════════════════════════════════════════════╝

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─── Plantillas de mensajes (editar por clínica) ──────────────────────────────

function buildReminderMessage(params: {
  patientName: string;
  doctorName: string;
  dateStr: string;
  timeStr: string;
  clinicName?: string;
}): string {
  const { patientName, doctorName, dateStr, timeStr, clinicName = "SmartDental" } = params;

  return [
    `👋 Hola *${patientName}*,`,
    ``,
    `Te recordamos que mañana tienes una cita en *${clinicName}* 🦷`,
    ``,
    `📅 *Fecha:* ${dateStr}`,
    `🕐 *Hora:* ${timeStr}`,
    `👨‍⚕️ *Especialista:* ${doctorName}`,
    ``,
    `Si necesitas cancelar o reagendar, responde a este mensaje antes de las 6:00 PM de hoy.`,
    ``,
    `¡Te esperamos! 😊`,
  ].join("\n");
}

// ─── Enviar via ManyChat API ──────────────────────────────────────────────────

async function sendViaManychat(subscriberId: string, text: string): Promise<boolean> {
  // 🔌 CABLE 2: Descomentar cuando tengas MANYCHAT_API_KEY
  /*
  const response = await fetch("https://api.manychat.com/fb/sending/sendContent", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${Deno.env.get("MANYCHAT_API_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      subscriber_id: subscriberId,
      data: {
        version: "v2",
        content: {
          messages: [{ type: "text", text }],
        },
      },
      message_tag: "CONFIRMED_EVENT_UPDATE", // Permite enviar fuera de la ventana de 24h
    }),
  });
  return response.ok;
  */

  console.log(`[reminders] SIMULACIÓN — ManyChat no conectado.`);
  console.log(`[reminders] → Destinatario: ${subscriberId}`);
  console.log(`[reminders] → Mensaje:\n${text}`);
  return true;
}

// ─── Enviar via Meta WhatsApp Business API (alternativa directa) ──────────────

async function sendViaWhatsAppDirect(phone: string, text: string): Promise<boolean> {
  // 🔌 CABLE 3: Descomentar cuando tengas WHATSAPP_TOKEN y WHATSAPP_PHONE_ID
  /*
  const phoneId = Deno.env.get("WHATSAPP_PHONE_ID");
  const token = Deno.env.get("WHATSAPP_TOKEN");

  const response = await fetch(
    `https://graph.facebook.com/v19.0/${phoneId}/messages`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: phone.replace(/\D/g, ""),  // Solo dígitos
        type: "text",
        text: { body: text },
      }),
    }
  );
  return response.ok;
  */

  console.log(`[reminders] SIMULACIÓN — WhatsApp API no conectada.`);
  console.log(`[reminders] → Teléfono: ${phone}`);
  console.log(`[reminders] → Mensaje:\n${text}`);
  return true;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // ── 1. Calcular el rango "mañana" ────────────────────────────────────
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 1);

    console.log(`[reminders] Buscando citas para: ${tomorrow.toISOString()} – ${dayAfter.toISOString()}`);

    // ── 2. Buscar citas del día siguiente ────────────────────────────────
    const { data: appointments, error } = await supabase
      .from("appointments")
      .select(`
        id,
        starts_at,
        ends_at,
        status,
        patients ( full_name, phone ),
        doctors ( full_name )
      `)
      .eq("status", "scheduled")
      .gte("starts_at", tomorrow.toISOString())
      .lt("starts_at", dayAfter.toISOString());

    if (error) throw error;
    if (!appointments || appointments.length === 0) {
      console.log("[reminders] No hay citas para mañana.");
      return new Response(JSON.stringify({ sent: 0, message: "No appointments tomorrow" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[reminders] Procesando ${appointments.length} cita(s)...`);

    // ── 3. Enviar recordatorio a cada paciente ───────────────────────────
    const results = await Promise.allSettled(
      appointments.map(async (appt) => {
        const patient = (appt as unknown as { patients: { full_name: string; phone: string | null } }).patients;
        const doctor = (appt as unknown as { doctors: { full_name: string } }).doctors;

        if (!patient?.phone) {
          console.warn(`[reminders] Paciente ${patient?.full_name} sin teléfono, omitido.`);
          return { skipped: true, reason: "no_phone" };
        }

        const startDate = new Date(appt.starts_at as string);
        const dateStr = startDate.toLocaleDateString("es-ES", {
          weekday: "long", day: "numeric", month: "long",
        });
        const timeStr = startDate.toLocaleTimeString("es-ES", {
          hour: "2-digit", minute: "2-digit", hour12: true,
        });

        const message = buildReminderMessage({
          patientName: patient.full_name.split(" ")[0],
          doctorName: doctor?.full_name ?? "nuestro especialista",
          dateStr,
          timeStr,
        });

        // Intentar envío (ManyChat primero, WhatsApp directo como fallback)
        const sent = await sendViaWhatsAppDirect(patient.phone, message);

        // Registrar resultado en la BD
        await supabase.from("reminder_logs").insert({
          appointment_id: appt.id,
          patient_phone: patient.phone,
          message,
          sent,
          sent_at: new Date().toISOString(),
          channel: "whatsapp",
        }).maybeSingle(); // No lanzar error si la tabla no existe todavía

        return { sent, patient: patient.full_name, appt_id: appt.id };
      })
    );

    const summary = {
      total: appointments.length,
      sent: results.filter(r => r.status === "fulfilled").length,
      failed: results.filter(r => r.status === "rejected").length,
    };

    console.log("[reminders] Resumen:", summary);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[reminders] Error crítico:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
