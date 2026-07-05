# Kit de Herramientas — Diego Castillo (integrado a tu sitio actual)

Esta versión está pensada para vivir **dentro del mismo repo** de tu página, desplegado como **un solo sitio en Netlify**.

## Estructura — cómo se integra a tu repo

Copia estas carpetas dentro de tu repo actual, respetando esta ubicación:

```
tu-repo/
├── (tus archivos actuales de la página...)
├── netlify/
│   └── functions/
│       ├── events.js      ← nuevas
│       ├── ics.js         ← nuevas
│       └── ideas.js       ← nuevas
├── calendario/
│   ├── index.html         ← nueva página del calendario (mysitio.com/calendario/)
│   └── data/
│       └── events.json    ← se auto-actualiza, no lo edites a mano
└── herramientas/
    ├── rider-generator.html    ← mysitio.com/herramientas/rider-generator.html
    └── dossier-generator.html  ← mysitio.com/herramientas/dossier-generator.html
```

> **Importante:** Netlify solo lee **una** carpeta de funciones por sitio. Si ya tienes una carpeta `netlify/functions/` con otras funciones (por ejemplo, algo relacionado a tu admin panel), simplemente copia los 3 archivos nuevos (`events.js`, `ics.js`, `ideas.js`) adentro de esa misma carpeta que ya existe — no crees una segunda.

## netlify.toml

Revisa el archivo `netlify.toml.EJEMPLO` incluido aquí:

- Si **ya tienes** un `netlify.toml` en tu repo: no lo reemplaces. Solo agrégale la línea `functions = "netlify/functions"` (si no la tienes ya) y el bloque `[[redirects]]` que ves en el ejemplo.
- Si **no tienes** `netlify.toml` todavía: renombra `netlify.toml.EJEMPLO` a `netlify.toml`, ajusta `publish` a la carpeta real donde vive tu `index.html` principal, y listo.

## Variables de entorno en Netlify (Site settings → Environment variables)

Como todo vive en el mismo sitio/repo, estas variables son compartidas por toda tu página — no interfieren con nada de tu admin panel actual, solo se suman:

| Variable | Valor |
|---|---|
| `GITHUB_TOKEN` | Personal Access Token (fine-grained) con "Contents: Read and write" sobre tu repo — puede ser el mismo que ya usas para tu admin panel, si tiene los permisos correctos |
| `GITHUB_REPO` | `tu-usuario/tu-repo` (el mismo repo de tu página) |
| `GITHUB_BRANCH` | `main` (o la rama que uses) |
| `EVENTS_FILE_PATH` | `calendario/data/events.json` |
| `APP_PASSWORD` | contraseña que inventas tú, para que el equipo agregue eventos |
| `ICS_SECRET` | clave larga random que inventas tú, para el link del feed .ics |
| `ANTHROPIC_API_KEY` | tu API key de https://console.anthropic.com |

## Rutas finales de tu sitio

- `https://tu-sitio.cl/calendario/` → el calendario compartido
- `https://tu-sitio.cl/herramientas/rider-generator.html` → generador de rider
- `https://tu-sitio.cl/herramientas/dossier-generator.html` → generador de dossier
- `https://tu-sitio.cl/.netlify/functions/ics?key=TU_ICS_SECRET` → el link para suscribir en Apple/Google Calendar

## Resto de la configuración (GitHub token, Anthropic key, conectar Apple/Google Calendar)

Es exactamente igual a lo que ya te expliqué antes — nada cambia salvo que ahora es un solo sitio/repo en vez de dos. Los pasos de "cómo sacar el token de GitHub", "cómo sacar la API key de Anthropic" y "cómo suscribir el calendario en Apple/Google" son los mismos.

## Un detalle a verificar tú

No tengo acceso a tu repo real, así que no puedo confirmar 100% si ya existe un `netlify.toml` o una carpeta `netlify/functions/` con contenido previo. Antes de copiar estos archivos, dale una revisada rápida a tu repo para no pisar algo que ya tengas. Si me pegas el contenido de tu `netlify.toml` actual (si tienes uno), te dejo el merge exacto ya hecho.
