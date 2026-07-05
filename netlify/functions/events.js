// netlify/functions/events.js
//
// Almacena los eventos del calendario como un archivo JSON dentro de tu propio
// repositorio de GitHub (igual que tu panel de admin ya hace con content.json).
// Lectura: pública (cualquiera con el link del sitio puede ver el calendario).
// Escritura: protegida con una contraseña compartida de equipo (APP_PASSWORD).
//
// Variables de entorno requeridas en Netlify:
//   GITHUB_TOKEN     -> Personal Access Token con permiso "Contents: Read & write"
//   GITHUB_REPO      -> "usuario/nombre-repo"
//   GITHUB_BRANCH    -> rama a usar, ej. "main" (opcional, default "main")
//   EVENTS_FILE_PATH -> ruta del archivo dentro del repo (opcional, default "calendario/data/events.json")
//   APP_PASSWORD     -> contraseña compartida para el equipo (tú la inventas)

const GITHUB_API = "https://api.github.com";

function getConfig() {
  return {
    token: process.env.GITHUB_TOKEN,
    repo: process.env.GITHUB_REPO,
    branch: process.env.GITHUB_BRANCH || "main",
    path: process.env.EVENTS_FILE_PATH || "calendario/data/events.json",
    appPassword: process.env.APP_PASSWORD || "",
  };
}

async function githubGetFile({ token, repo, branch, path }) {
  const res = await fetch(
    `${GITHUB_API}/repos/${repo}/contents/${path}?ref=${branch}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
    }
  );
  if (res.status === 404) {
    return { events: [], sha: null };
  }
  if (!res.ok) {
    throw new Error(`GitHub GET falló: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  const content = Buffer.from(data.content, "base64").toString("utf-8");
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    parsed = { events: [] };
  }
  return { events: parsed.events || [], sha: data.sha };
}

async function githubPutFile({ token, repo, branch, path }, events, sha) {
  const body = {
    message: "Actualiza calendario de eventos",
    content: Buffer.from(JSON.stringify({ events }, null, 2)).toString(
      "base64"
    ),
    branch,
  };
  if (sha) body.sha = sha;

  const res = await fetch(`${GITHUB_API}/repos/${repo}/contents/${path}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`GitHub PUT falló: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

exports.handler = async (event) => {
  const cfg = getConfig();
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, X-App-Password",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers };
  }

  if (!cfg.token || !cfg.repo) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error:
          "Faltan variables de entorno GITHUB_TOKEN o GITHUB_REPO en Netlify.",
      }),
    };
  }

  try {
    if (event.httpMethod === "GET") {
      const { events } = await githubGetFile(cfg);
      return { statusCode: 200, headers, body: JSON.stringify({ events }) };
    }

    // Todo lo que no sea GET requiere contraseña de equipo
    const providedPassword = event.headers["x-app-password"] || "";
    if (!cfg.appPassword || providedPassword !== cfg.appPassword) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: "Contraseña de equipo incorrecta." }),
      };
    }

    const payload = JSON.parse(event.body || "{}");
    const { action, newEvent, id } = payload;

    const { events, sha } = await githubGetFile(cfg);

    let updated = events;
    if (action === "create") {
      updated = [...events, { ...newEvent, id: newEvent.id || String(Date.now()) }];
    } else if (action === "update") {
      updated = events.map((ev) => (ev.id === id ? { ...ev, ...newEvent } : ev));
    } else if (action === "delete") {
      updated = events.filter((ev) => ev.id !== id);
    } else {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Acción inválida. Usa create/update/delete." }),
      };
    }

    await githubPutFile(cfg, updated, sha);
    return { statusCode: 200, headers, body: JSON.stringify({ events: updated }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: String(err.message || err) }) };
  }
};
