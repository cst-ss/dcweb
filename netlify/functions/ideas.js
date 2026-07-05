// netlify/functions/ideas.js
//
// Genera ideas de contenido y fechas tentativas usando la API de Claude,
// con contexto real de tu rubro y de tus próximos eventos guardados.
//
// Variable de entorno requerida:
//   ANTHROPIC_API_KEY -> obtenla en https://console.anthropic.com
//
// Protegida con la misma contraseña de equipo (APP_PASSWORD) para evitar
// que cualquiera que encuentre la URL gaste tu cuota de API.

const GITHUB_API = "https://api.github.com";

async function fetchEvents() {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || "main";
  const path = process.env.EVENTS_FILE_PATH || "calendario/data/events.json";
  if (!token || !repo) return [];
  try {
    const res = await fetch(
      `${GITHUB_API}/repos/${repo}/contents/${path}?ref=${branch}`,
      { headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const content = Buffer.from(data.content, "base64").toString("utf-8");
    return JSON.parse(content).events || [];
  } catch {
    return [];
  }
}

exports.handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, X-App-Password",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers };
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Usa POST" }) };
  }

  const appPassword = process.env.APP_PASSWORD || "";
  const providedPassword = event.headers["x-app-password"] || "";
  if (!appPassword || providedPassword !== appPassword) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: "Contraseña de equipo incorrecta." }) };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Falta ANTHROPIC_API_KEY en Netlify." }) };
  }

  const { userNote } = JSON.parse(event.body || "{}");
  const events = await fetchEvents();
  const upcoming = events
    .filter((e) => e.date)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 15)
    .map((e) => `- ${e.date}${e.startTime ? " " + e.startTime : ""}: [${e.type}] ${e.title}`)
    .join("\n") || "(sin eventos cargados todavía)";

  const systemPrompt = `Eres un asistente creativo y de producción para Diego Castillo, un artista pop chileno de la Región de Valparaíso. Su estética es pop contemporáneo / soul moderno, con influencias de Dua Lipa, Adele, RAYE y Jungle. Su marca visual es dark/gold, minimalista y cinematográfica. Trabaja con un tour manager (Patricio) y una visualista (Antonia). Da ideas concretas, accionables y con fechas tentativas específicas, coordinadas con los eventos ya agendados. Responde en español de Chile, en formato de lista breve, sin relleno.`;

  const userPrompt = `Estos son los próximos eventos ya agendados:\n${upcoming}\n\nNota adicional del usuario: ${userNote || "(ninguna)"}\n\nGenera:\n1. 5 ideas de contenido para redes (Instagram/YouTube) para las próximas 2-3 semanas, cada una con una fecha tentativa de publicación coordinada con los eventos de arriba.\n2. Sugerencias de fechas para ensayos y pruebas de sonido antes de cada show agendado (ej. "2 días antes, 18:00 - ensayo de coreografía").\n3. Cualquier alerta si ves eventos muy cerca uno del otro sin tiempo de preparación.`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 1200,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return { statusCode: 502, headers, body: JSON.stringify({ error: `Anthropic API error: ${errText}` }) };
    }

    const data = await res.json();
    const text = (data.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n");

    return { statusCode: 200, headers, body: JSON.stringify({ ideas: text }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: String(err.message || err) }) };
  }
};
