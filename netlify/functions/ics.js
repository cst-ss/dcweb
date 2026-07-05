// netlify/functions/ics.js
//
// Genera un feed de calendario .ics público a partir de tus eventos guardados
// en GitHub. Este es el link que agregas en Apple Calendar ("Añadir calendario
// por suscripción") y en Google Calendar ("Otros calendarios" -> "Desde URL").
//
// Se protege con una "key" simple en la URL para que no sea totalmente público:
//   https://tu-sitio.netlify.app/.netlify/functions/ics?key=TU_ICS_KEY
//
// Variable de entorno adicional requerida:
//   ICS_SECRET -> cualquier texto largo que tú inventes, ej. un UUID

const GITHUB_API = "https://api.github.com";

function pad(n) {
  return String(n).padStart(2, "0");
}

// Convierte "2026-08-08" + "18:30" a formato ICS: 20260808T183000
function toICSDate(dateStr, timeStr) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split("-");
  const [hh, mm] = (timeStr || "00:00").split(":");
  return `${y}${pad(m)}${pad(d)}T${pad(hh || 0)}${pad(mm || 0)}00`;
}

function escapeICS(text = "") {
  return String(text)
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

exports.handler = async (event) => {
  const secret = process.env.ICS_SECRET || "";
  const providedKey = (event.queryStringParameters || {}).key || "";

  if (!secret || providedKey !== secret) {
    return { statusCode: 401, body: "Falta o es incorrecto el parámetro ?key=" };
  }

  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || "main";
  const path = process.env.EVENTS_FILE_PATH || "calendario/data/events.json";

  if (!token || !repo) {
    return { statusCode: 500, body: "Faltan GITHUB_TOKEN o GITHUB_REPO." };
  }

  let events = [];
  try {
    const res = await fetch(
      `${GITHUB_API}/repos/${repo}/contents/${path}?ref=${branch}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
        },
      }
    );
    if (res.ok) {
      const data = await res.json();
      const content = Buffer.from(data.content, "base64").toString("utf-8");
      events = JSON.parse(content).events || [];
    }
  } catch {
    events = [];
  }

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Diego Castillo//Calendario de Producción//ES",
    "CALSCALE:GREGORIAN",
    "X-WR-CALNAME:Diego Castillo — Producción",
  ];

  events.forEach((ev) => {
    const start = toICSDate(ev.date, ev.startTime);
    const end = toICSDate(ev.date, ev.endTime) || start;
    if (!start) return;
    lines.push(
      "BEGIN:VEVENT",
      `UID:${ev.id}@diego-castillo-calendario`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${escapeICS(`[${(ev.type || "evento").toUpperCase()}] ${ev.title || ""}`)}`,
      ev.location ? `LOCATION:${escapeICS(ev.location)}` : null,
      ev.notes ? `DESCRIPTION:${escapeICS(ev.notes)}` : null,
      "END:VEVENT"
    );
  });

  lines.push("END:VCALENDAR");

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="calendario-diego-castillo.ics"',
      "Cache-Control": "public, max-age=1800",
    },
    body: lines.filter(Boolean).join("\r\n"),
  };
};
