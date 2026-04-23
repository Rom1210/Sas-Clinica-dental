// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  SMARTDENTAL — BOT BRIDGE API                                               ║
// ║                                                                             ║
// ║  Endpoint REST para que tu plataforma externa se conecte a SmartDental.     ║
// ║  La autenticación es por EMAIL de clínica — si el email coincide en ambos  ║
// ║  sistemas, están vinculados.                                                ║
// ║                                                                             ║
// ║  URL BASE:                                                                  ║
// ║    https://gbozzxizkuiqycdirsln.supabase.co/functions/v1/bot-bridge         ║
// ║                                                                             ║
// ║  AUTENTICACIÓN (header obligatorio):                                        ║
// ║    Authorization: Bearer <SUPABASE_ANON_KEY>                                ║
// ║    x-clinic-email: <email_de_la_clinica>                                    ║
// ║                                                                             ║
// ║  ENDPOINTS:                                                                 ║
// ║    GET  /bot-bridge?action=doctors              → Lista de doctores         ║
// ║    GET  /bot-bridge?action=services             → Catálogo de servicios     ║
// ║    GET  /bot-bridge?action=availability&date=Y-M-D&doctor_id=X             ║
// ║    GET  /bot-bridge?action=patient&phone=X      → Busca paciente por tel.   ║
// ║    GET  /bot-bridge?action=appointments&patient_id=X → Próximas citas       ║
// ║    POST /bot-bridge  { action: "book", ...data }                            ║
// ║    POST /bot-bridge  { action: "cancel", appointment_id }                  ║
// ║    POST /bot-bridge  { action: "reschedule", appointment_id, ...data }      ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─── CORS ──────────────────────────────────────────────────────────────────────

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-clinic-email",
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

// ─── MAIN ──────────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // ── 1. Crear cliente con service_role para operaciones admin ──────────────
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // ── 2. Resolver clínica por email ─────────────────────────────────────────
    //    Tu plataforma envía el email de la clínica en el header x-clinic-email
    const clinicEmail = req.headers.get("x-clinic-email");
    if (!clinicEmail) return err("Header x-clinic-email es requerido", 401);

    // Buscar el user_id del propietario de la clínica por email
    const { data: users } = await supabase.auth.admin.listUsers();
    const clinicUser = users?.users?.find(
      (u) => u.email?.toLowerCase() === clinicEmail.toLowerCase()
    );

    if (!clinicUser) {
      return err(`No se encontró ninguna clínica con el email: ${clinicEmail}`, 404);
    }

    const clinicUserId = clinicUser.id;

    // ── 3. Enrutar según método y acción ──────────────────────────────────────
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    if (req.method === "GET") {
      switch (action) {
        case "doctors":
          return await getDoctors(supabase, clinicUserId);

        case "services":
          return await getServices(supabase, clinicUserId);

        case "availability": {
          const date = url.searchParams.get("date"); // "YYYY-MM-DD"
          const doctorId = url.searchParams.get("doctor_id") || null;
          if (!date) return err("Parámetro 'date' requerido");
          return await getAvailability(supabase, clinicUserId, date, doctorId);
        }

        case "patient": {
          const phone = url.searchParams.get("phone");
          if (!phone) return err("Parámetro 'phone' requerido");
          return await findPatient(supabase, clinicUserId, phone);
        }

        case "appointments": {
          const patientId = url.searchParams.get("patient_id");
          if (!patientId) return err("Parámetro 'patient_id' requerido");
          return await getUpcomingAppointments(supabase, clinicUserId, patientId);
        }

        default:
          return err(`Acción GET desconocida: ${action}`);
      }
    }

    if (req.method === "POST") {
      const body = await req.json();
      switch (body.action) {
        case "book":
          return await bookAppointment(supabase, clinicUserId, body);

        case "cancel":
          return await cancelAppointment(supabase, clinicUserId, body);

        case "reschedule":
          return await rescheduleAppointment(supabase, clinicUserId, body);

        default:
          return err(`Acción POST desconocida: ${body.action}`);
      }
    }

    return err("Método no permitido", 405);

  } catch (error) {
    console.error("[bot-bridge] Error:", error);
    return err("Error interno: " + (error as Error).message, 500);
  }
});

// ─── HANDLERS GET ──────────────────────────────────────────────────────────────

/** Lista todos los doctores activos de la clínica */
async function getDoctors(supabase: ReturnType<typeof createClient>, userId: string) {
  const { data, error } = await supabase
    .from("doctors")
    .select("id, name, color, isSpecialist, status")
    .eq("user_id", userId)
    .neq("status", "inactive")
    .order("name");

  if (error) throw error;
  return ok({ doctors: data });
}

/** Lista todos los servicios/precios del catálogo de la clínica */
async function getServices(supabase: ReturnType<typeof createClient>, userId: string) {
  const { data, error } = await supabase
    .from("services")
    .select("id, name, price")
    .eq("user_id", userId)
    .order("name");

  if (error) throw error;
  return ok({ services: data });
}

/**
 * Devuelve los slots disponibles para un día dado.
 * Los slots son bloques de 15 minutos entre 08:00 y 22:00.
 * Se excluyen los slots que ya tienen citas agendadas o bloqueados.
 */
async function getAvailability(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  date: string,
  doctorId: string | null
) {
  // Traer citas del día
  let query = supabase
    .from("appointments")
    .select("doctor_id, blocks, status")
    .eq("user_id", userId)
    .eq("date", date)
    .in("status", ["scheduled", "blocked", "rescheduled"]);

  if (doctorId) query = query.eq("doctor_id", doctorId);

  const { data: existing, error } = await query;
  if (error) throw error;

  // Generar todos los slots posibles (08:00 → 21:45, cada 15 min)
  const allSlots: string[] = [];
  for (let h = 8; h < 22; h++) {
    for (const m of [0, 15, 30, 45]) {
      allSlots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }

  // Marcar cuáles están ocupados
  const occupied = new Set<string>();
  (existing ?? []).forEach((app) => {
    (app.blocks ?? []).forEach((b: string) => occupied.add(b));
  });

  const available = allSlots.filter((s) => !occupied.has(s));

  return ok({
    date,
    doctor_id: doctorId,
    available_slots: available,
    occupied_slots: Array.from(occupied),
    total_available: available.length,
  });
}

/** Busca un paciente por número de teléfono */
async function findPatient(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  phone: string
) {
  // Normalizar el teléfono (quitar +, espacios, etc.)
  const normalizedPhone = phone.replace(/[\s\-\+\(\)]/g, "");

  const { data, error } = await supabase
    .from("patients")
    .select("id, full_name, phone, email, dni, status")
    .eq("user_id", userId)
    .or(`phone.ilike.%${normalizedPhone}%`)
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    return ok({ found: false, patient: null });
  }

  return ok({ found: true, patient: data });
}

/** Devuelve las próximas citas de un paciente (las que aún no han pasado) */
async function getUpcomingAppointments(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  patientId: string
) {
  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("appointments")
    .select(`
      id, date, blocks, status, notes,
      doctors!inner(name, color)
    `)
    .eq("user_id", userId)
    .eq("patient_id", patientId)
    .gte("date", today)
    .in("status", ["scheduled", "rescheduled"])
    .order("date", { ascending: true })
    .limit(5);

  if (error) throw error;

  return ok({ appointments: data ?? [] });
}

// ─── HANDLERS POST ─────────────────────────────────────────────────────────────

/**
 * Crea una nueva cita desde el bot.
 * Body esperado:
 * {
 *   action: "book",
 *   patient_id: "uuid" | null,         // si null, crea el paciente
 *   patient_name: "Nombre Apellido",   // solo si patient_id es null
 *   patient_phone: "+584...",          // solo si patient_id es null
 *   doctor_id: "uuid",
 *   date: "YYYY-MM-DD",
 *   start_time: "HH:MM",
 *   duration_minutes: 30,              // opcional, default 30
 *   service_ids: ["uuid"],             // opcional
 *   notes: "Texto libre"               // opcional
 * }
 */
async function bookAppointment(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  body: Record<string, unknown>
) {
  const {
    patient_id,
    patient_name,
    patient_phone,
    doctor_id,
    date,
    start_time,
    duration_minutes = 30,
    service_ids = [],
    notes = "",
  } = body as {
    patient_id: string | null;
    patient_name: string;
    patient_phone: string;
    doctor_id: string;
    date: string;
    start_time: string;
    duration_minutes: number;
    service_ids: string[];
    notes: string;
  };

  if (!doctor_id || !date || !start_time) {
    return err("Faltan campos: doctor_id, date, start_time");
  }

  // A. Resolver o crear paciente
  let resolvedPatientId = patient_id;
  if (!resolvedPatientId) {
    if (!patient_name) return err("patient_name requerido si patient_id es null");
    const { data: newP, error: pErr } = await supabase
      .from("patients")
      .insert({
        user_id: userId,
        full_name: patient_name,
        phone: patient_phone ?? null,
        status: "active",
        source: "bot",
      })
      .select("id")
      .single();
    if (pErr) throw pErr;
    resolvedPatientId = newP.id;
  }

  // B. Calcular bloques de 15 min
  const [startH, startM] = start_time.split(":").map(Number);
  const totalStartMin = startH * 60 + startM;
  const numBlocks = Math.ceil((duration_minutes as number) / 15);
  const blocks: string[] = [];
  for (let i = 0; i < numBlocks; i++) {
    const min = totalStartMin + i * 15;
    const h = Math.floor(min / 60);
    const m = min % 60;
    blocks.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  }

  // C. Verificar disponibilidad
  const { data: conflicts } = await supabase
    .from("appointments")
    .select("id")
    .eq("user_id", userId)
    .eq("doctor_id", doctor_id)
    .eq("date", date)
    .overlaps("blocks", blocks);

  if (conflicts && conflicts.length > 0) {
    return err(`El doctor ya tiene una cita en ese horario (${start_time})`);
  }

  // D. Obtener precios de servicios si se proveyeron
  let servicesSummary = "";
  let total = 0;
  if ((service_ids as string[]).length > 0) {
    const { data: svcs } = await supabase
      .from("services")
      .select("name, price")
      .in("id", service_ids as string[]);
    if (svcs) {
      servicesSummary = svcs.map((s) => `${s.name} ($${s.price})`).join(", ");
      total = svcs.reduce((acc, s) => acc + (s.price ?? 0), 0);
    }
  }

  const finalNotes = [
    notes,
    servicesSummary ? `Servicios: ${servicesSummary}` : "",
    total > 0 ? `Total: $${total}` : "",
  ].filter(Boolean).join(" | ");

  // E. Insertar cita
  const startsAt = `${date}T${start_time}:00`;
  const endMin = totalStartMin + (duration_minutes as number);
  const endH = Math.floor(endMin / 60);
  const endM = endMin % 60;
  const endsAt = `${date}T${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}:00`;

  const { data: appt, error: apptErr } = await supabase
    .from("appointments")
    .insert({
      user_id: userId,
      patient_id: resolvedPatientId,
      doctor_id,
      date,
      blocks,
      starts_at: startsAt,
      ends_at: endsAt,
      start_at: startsAt,
      end_at: endsAt,
      status: "scheduled",
      notes: finalNotes || "Agendado por bot",
      total_amount: total || null,
      source: "bot",
    })
    .select("id")
    .single();

  if (apptErr) throw apptErr;

  return ok({
    success: true,
    appointment_id: appt.id,
    patient_id: resolvedPatientId,
    date,
    start_time,
    doctor_id,
    blocks,
    total,
    message: `Cita agendada correctamente para el ${date} a las ${start_time}`,
  });
}

/**
 * Cancela una cita existente.
 * Body: { action: "cancel", appointment_id: "uuid", reason?: "string" }
 */
async function cancelAppointment(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  body: Record<string, unknown>
) {
  const { appointment_id, reason = "Cancelado por solicitud del paciente vía bot" } = body as {
    appointment_id: string;
    reason: string;
  };

  if (!appointment_id) return err("appointment_id es requerido");

  const { error } = await supabase
    .from("appointments")
    .update({
      status: "cancelled",
      notes: reason,
    })
    .eq("id", appointment_id)
    .eq("user_id", userId); // Seguridad: solo puede cancelar citas de su clínica

  if (error) throw error;

  return ok({
    success: true,
    appointment_id,
    status: "cancelled",
    message: "Cita cancelada correctamente",
  });
}

/**
 * Reagenda una cita (marca la actual como 'rescheduled' y crea una nueva).
 * Body: {
 *   action: "reschedule",
 *   appointment_id: "uuid",   // la cita actual
 *   new_date: "YYYY-MM-DD",
 *   new_start_time: "HH:MM",
 *   doctor_id?: "uuid",        // si cambia de doctor
 * }
 */
async function rescheduleAppointment(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  body: Record<string, unknown>
) {
  const { appointment_id, new_date, new_start_time, doctor_id } = body as {
    appointment_id: string;
    new_date: string;
    new_start_time: string;
    doctor_id?: string;
  };

  if (!appointment_id || !new_date || !new_start_time) {
    return err("Faltan campos: appointment_id, new_date, new_start_time");
  }

  // A. Traer datos de la cita original
  const { data: original, error: fetchErr } = await supabase
    .from("appointments")
    .select("*")
    .eq("id", appointment_id)
    .eq("user_id", userId)
    .single();

  if (fetchErr || !original) return err("Cita no encontrada", 404);

  // B. Marcar original como reagendada
  await supabase
    .from("appointments")
    .update({ status: "rescheduled" })
    .eq("id", appointment_id);

  // C. Crear nueva cita con los mismos datos pero nuevo horario
  const resolvedDoctorId = doctor_id ?? original.doctor_id;
  const [startH, startM] = new_start_time.split(":").map(Number);
  const totalStartMin = startH * 60 + startM;
  const numBlocks = (original.blocks ?? []).length || 2;
  const newBlocks: string[] = [];
  for (let i = 0; i < numBlocks; i++) {
    const min = totalStartMin + i * 15;
    const h = Math.floor(min / 60);
    const m = min % 60;
    newBlocks.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  }

  const newStartsAt = `${new_date}T${new_start_time}:00`;
  const endMin = totalStartMin + numBlocks * 15;
  const endH = Math.floor(endMin / 60);
  const endM = endMin % 60;
  const newEndsAt = `${new_date}T${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}:00`;

  const { data: newAppt, error: createErr } = await supabase
    .from("appointments")
    .insert({
      user_id: userId,
      patient_id: original.patient_id,
      doctor_id: resolvedDoctorId,
      date: new_date,
      blocks: newBlocks,
      starts_at: newStartsAt,
      ends_at: newEndsAt,
      start_at: newStartsAt,
      end_at: newEndsAt,
      status: "scheduled",
      notes: `Reagendado (original: ${original.date} ${(original.blocks ?? [])[0] ?? ""}) | ${original.notes ?? ""}`.trim(),
      total_amount: original.total_amount,
      source: "bot",
    })
    .select("id")
    .single();

  if (createErr) throw createErr;

  return ok({
    success: true,
    original_appointment_id: appointment_id,
    new_appointment_id: newAppt.id,
    new_date,
    new_start_time,
    doctor_id: resolvedDoctorId,
    message: `Cita reagendada para el ${new_date} a las ${new_start_time}`,
  });
}
