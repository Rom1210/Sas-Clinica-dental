// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  SMARTDENTAL — AI ASSISTANT (Motor de Inteligencia)                      ║
// ║  Función: Procesa mensajes libres del paciente con ChatGPT               ║
// ║           y determina la intención (agendar, cancelar, consulta)        ║
// ║                                                                          ║
// ║  ┌─────────────────────────────────────────────────────────────────┐     ║
// ║  │  CÓMO CONECTAR:                                                 │     ║
// ║  │  1. Obtener API Key en: platform.openai.com → API Keys          │     ║
// ║  │  2. Ejecutar:                                                   │     ║
// ║  │     supabase secrets set OPENAI_API_KEY=sk-...                  │     ║
// ║  │  3. Esta función es llamada internamente por whatsapp-bot        │     ║
// ║  │     cuando action = "ai_query"                                  │     ║
// ║  └─────────────────────────────────────────────────────────────────┘     ║
// ║                                                                          ║
// ║  PERSONALIZACIÓN POR CLÍNICA:                                            ║
// ║  Edita la variable CLINIC_CONFIG más abajo para adaptar el bot a         ║
// ║  cada cliente. Puedes almacenar esto en la BD tabla `clinic_config`      ║
// ║  para que sea 100% dinámico y editable desde el panel.                   ║
// ╚══════════════════════════════════════════════════════════════════════════╝

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─── Configuración de la Clínica (EDITABLE POR CLIENTE) ──────────────────────
//
// 📌 INSTRUCCIÓN PARA FUTURAS PERSONALIZACIONES:
//    Cuando quieras cambiar el comportamiento del bot para una clínica,
//    simplemente edita los campos de CLINIC_CONFIG.
//    En el futuro, esto se leerá de la tabla `clinic_config` en Supabase
//    para que sea editable desde el panel de administración.
//
const CLINIC_CONFIG = {
  name: "SmartDental",
  tone: "profesional pero amigable",             // Ej: "formal", "casual", "cálido"
  specialty: "odontología general y estética",  // Lo que ofrece la clínica
  location: "Venezuela",                        // País/ciudad para contextualizar
  working_hours: "Lunes a Viernes 8:00 AM – 6:00 PM, Sábados 8:00 AM – 12:00 PM",
  services: [
    "Limpieza dental",
    "Blanqueamiento",
    "Ortodoncia",
    "Implantes dentales",
    "Extracciones",
    "Carillas",
  ],
  // Instrucciones personalizadas que definen la "personalidad" del bot
  custom_instructions: `
    Eres el asistente virtual de ${CLINIC_CONFIG_PLACEHOLDER.name}, una clínica dental de alto nivel.
    Tu tono debe ser ${CLINIC_CONFIG_PLACEHOLDER.tone}.
    Solo respondes preguntas relacionadas con la clínica, citas médicas y salud dental.
    Si el paciente pregunta algo fuera de tu alcance, dile que lo comuniques con el equipo humano.
    Siempre termina con una llamada a la acción clara (agendar, confirmar, etc.).
    No inventes precios ni diagnósticos médicos. Solo el equipo clínico puede hacerlos.
    Idioma: español latinoamericano.
  `,
};

// Palceholder para evitar referencias circulares al definir el objeto
const CLINIC_CONFIG_PLACEHOLDER = { name: "SmartDental", tone: "profesional pero amigable" };

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface AiRequest {
  patient_phone: string;
  patient_name?: string;
  message: string;          // Mensaje libre del paciente
  conversation_history?: Array<{ role: "user" | "assistant"; content: string }>;
  clinic_slug?: string;     // Para multi-clínica: identifica qué config usar
}

interface OpenAIResponse {
  choices: Array<{
    message: { role: string; content: string };
    finish_reason: string;
  }>;
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body: AiRequest = await req.json();
    console.log("[ai-assistant] Mensaje recibido:", body.message);

    // ── 1. Cargar contexto de la clínica ─────────────────────────────────
    // TODO: cuando tengas multi-clínica, leer de:
    // const { data: config } = await supabase
    //   .from("clinic_config")
    //   .select("*")
    //   .eq("slug", body.clinic_slug)
    //   .single();
    // Por ahora usamos CLINIC_CONFIG en memoria.

    // ── 2. Cargar historial del paciente desde la BD ──────────────────────
    let patientContext = "";
    if (body.patient_phone) {
      const { data: patient } = await supabase
        .from("patients")
        .select(`
          full_name,
          email,
          birth_date,
          appointments (
            starts_at, ends_at, status,
            doctors ( full_name )
          )
        `)
        .eq("phone", body.patient_phone)
        .order("created_at", { ascending: false })
        .maybeSingle();

      if (patient) {
        const upcomingAppts = (patient.appointments ?? [])
          .filter((a: { status: string }) => a.status === "scheduled")
          .slice(0, 3);

        patientContext = `
          INFORMACIÓN DEL PACIENTE:
          - Nombre: ${patient.full_name}
          - Próximas citas: ${upcomingAppts.length > 0
            ? upcomingAppts.map((a: { starts_at: string; doctors: { full_name: string } }) =>
                `${new Date(a.starts_at).toLocaleDateString("es-ES")} con ${a.doctors?.full_name}`
              ).join(", ")
            : "ninguna agendada"}
        `;
      }
    }

    // ── 3. Construir el System Prompt ─────────────────────────────────────
    const systemPrompt = `
      Eres el asistente virtual inteligente de la clínica ${CLINIC_CONFIG.name}.
      Especialidad: ${CLINIC_CONFIG.specialty}.
      Ubicación: ${CLINIC_CONFIG.location}.
      Horarios de atención: ${CLINIC_CONFIG.working_hours}.
      Servicios disponibles: ${CLINIC_CONFIG.services.join(", ")}.
      Tono de comunicación: ${CLINIC_CONFIG.tone}.

      ${CLINIC_CONFIG.custom_instructions}

      ${patientContext}

      Al final de tu respuesta, si detectas una intención clara del usuario, agrega en formato JSON:
      [ACCION: {"intent": "book"|"cancel"|"reschedule"|"info"|"other", "details": {...}}]
      Esto es para que el sistema lo procese automáticamente. No se lo muestres al usuario.
    `.trim();

    // ── 4. Llamada a OpenAI ───────────────────────────────────────────────
    // 🔌 CABLE 1: Descomentar cuando tengas OPENAI_API_KEY configurado
    /*
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("OPENAI_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",   // Recomendado: rápido y económico
        max_tokens: 500,
        temperature: 0.7,
        messages: [
          { role: "system", content: systemPrompt },
          ...(body.conversation_history ?? []),
          { role: "user", content: body.message },
        ],
      }),
    });

    if (!openaiResponse.ok) {
      const errBody = await openaiResponse.text();
      throw new Error(`OpenAI error ${openaiResponse.status}: ${errBody}`);
    }

    const aiData: OpenAIResponse = await openaiResponse.json();
    const rawReply = aiData.choices[0]?.message?.content ?? "";

    // Extraer la acción detectada por la IA
    const actionMatch = rawReply.match(/\[ACCION: (\{.*?\})\]/s);
    const detectedAction = actionMatch ? JSON.parse(actionMatch[1]) : null;
    const cleanReply = rawReply.replace(/\[ACCION:.*?\]/s, "").trim();

    // Guardar en historial de conversaciones
    await supabase.from("bot_conversations").insert({
      patient_phone: body.patient_phone,
      user_message: body.message,
      bot_response: cleanReply,
      detected_intent: detectedAction?.intent ?? "unknown",
      tokens_used: aiData.usage?.total_tokens ?? 0,
      created_at: new Date().toISOString(),
    });

    return new Response(JSON.stringify({
      reply: cleanReply,
      action: detectedAction,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
    */

    // ── MODO SIMULACIÓN (mientras no hay API key conectada) ───────────────
    console.log("[ai-assistant] Modo simulación — conecta OPENAI_API_KEY para activar IA");
    console.log("[ai-assistant] System Prompt construido:", systemPrompt.substring(0, 200) + "...");

    return new Response(JSON.stringify({
      reply: `Hola ${body.patient_name ?? ""}! 🦷 Soy el asistente de ${CLINIC_CONFIG.name}. Estoy en modo de configuración. Pronto podré responderte con inteligencia artificial. ¡Hasta pronto!`,
      action: { intent: "info", details: {} },
      _debug: {
        mode: "simulation",
        note: "Descomentar bloque OpenAI en ai-assistant/index.ts y configurar OPENAI_API_KEY para activar",
      },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[ai-assistant] Error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
