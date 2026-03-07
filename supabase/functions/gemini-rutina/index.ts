// ⚙️ INTRODUCE AQUÍ TU CLAVE DE GEMINI
// Mejor aún: ve a Supabase → Settings → Edge Functions → Secrets
// y añade un secret llamado GEMINI_API_KEY con tu clave
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') ?? 'PEGA_AQUI_TU_GEMINI_API_KEY';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${GEMINI_API_KEY}`;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { profile, sessions, weightLog, extra } = await req.json();

    // Build context
    const p = profile || {};
    const currentW = weightLog?.length ? weightLog[weightLog.length - 1].weight : (p.weight || '?');
    const bmi = (p.height && currentW)
      ? Math.round(parseFloat(currentW) / Math.pow(parseFloat(p.height) / 100, 2) * 10) / 10
      : '?';

    const weightTrend = weightLog?.length
      ? weightLog.map((w: any) => `${w.date}: ${w.weight}kg`).join(' → ')
      : 'Sin datos';

    const goals = (p.activeGoals?.length) ? p.activeGoals.join(', ') : (p.mainGoal || 'No especificado');
    const injuries = (p.injuries?.length)
      ? p.injuries.map((i: any) => `${i.name} (${i.severity})`).join(', ')
      : 'Ninguna';

    const sessionsText = sessions?.length
      ? sessions.map((s: any) => {
          const exList = s.exercises?.map((e: any) => {
            const rm = calcRM(e);
            return `  - ${e.name}: ${e.sets}x${e.reps}${e.weight ? ' @ ' + e.weight + 'kg' : ''}${rm ? ' [1RM~' + rm + 'kg]' : ''}${e.done ? ' ✓' : ' ✗'}`;
          }).join('\n');
          return `📅 ${s.date} — ${s.name || 'Sesión'}\n${exList}`;
        }).join('\n\n')
      : '(Sin sesiones anteriores)';

    const prompt = `Eres un entrenador personal experto. Diseña la rutina para la próxima sesión de este atleta.

⚠️ INSTRUCCIÓN CRÍTICA: Responde ÚNICAMENTE con la lista de ejercicios en este formato exacto, sin ningún texto adicional, sin saludos, sin explicaciones, sin markdown:
NombreEjercicio — SERIESxREPS @ PESOkg
(si no hay peso relevante omite "@ Xkg")

Ejemplo correcto:
Press banca — 4x8 @ 80kg
Sentadilla — 4x10 @ 70kg
Dominadas — 3xFallo

━━━ PERFIL ━━━
Nombre: ${p.name || 'Atleta'} | Edad: ${p.age || '?'} | Sexo: ${p.sex || '?'}
Altura: ${p.height || '?'}cm | Peso: ${currentW}kg | IMC: ${bmi}
Experiencia: ${p.exp || '?'} | Actividad: ${p.activity || '?'}
Días/semana: ${p.days || '?'} | Duración sesión: ${p.duration || 60}min
Equipamiento: ${p.equipment || 'Gimnasio completo'}

━━━ OBJETIVOS ━━━
${goals}
Objetivo principal: ${p.mainGoal || 'No especificado'}
Peso objetivo: ${p.targetWeight ? p.targetWeight + 'kg' : 'No especificado'}

━━━ LESIONES ━━━
${injuries}

━━━ EVOLUCIÓN PESO ━━━
${weightTrend}

━━━ HISTORIAL RECIENTE ━━━
${sessionsText}

━━━ NOTAS ADICIONALES ━━━
${extra || 'Ninguna'}

Criterios: evita sobreentrenar grupos recientes, aplica progresión inteligente, ajusta pesos a los 1RM, respeta lesiones.

Responde SOLO con los ejercicios en el formato indicado.`;

    const geminiRes = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1024 }
      })
    });

    if (!geminiRes.ok) {
      const err = await geminiRes.text();
      throw new Error('Gemini error: ' + err);
    }

    const geminiData = await geminiRes.json();
    const rutina = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

    return new Response(JSON.stringify({ rutina }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function calcRM(ex: any): number | null {
  const sd = ex.setData;
  if (sd) {
    for (const s of sd) {
      if (s?.weight && s?.reps && !isNaN(s.reps)) {
        const w = parseFloat(s.weight), r = parseInt(s.reps);
        if (w > 0 && r > 0 && r < 37) return Math.round(w * (1 + r / 30));
      }
    }
  }
  if (ex.weight && ex.reps && !isNaN(ex.reps)) {
    const w = parseFloat(ex.weight), r = parseInt(ex.reps);
    if (w > 0 && r > 0 && r < 37) return Math.round(w * (1 + r / 30));
  }
  return null;
}
