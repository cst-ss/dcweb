# Guía — Panel de Administración Propio
## Diego Castillo · GitHub + Netlify + Admin con content.json

---

## ¿Qué cambia respecto a la guía anterior?

Este es un **admin panel construido a medida**, no Decap CMS. La diferencia importante:

✅ Los cambios que hagas en `/admin` **sí se reflejan en el sitio** —
   no necesitas migrar a Hugo/Eleventy ni nada adicional.

✅ No usa Netlify Identity. El login es con un **token personal de GitHub**.

✅ Todo el contenido editable vive en un archivo: **`content.json`**

---

## Cómo funciona (versión simple)

```
Entras a tudominio.com/admin
        ↓
Editas shows, música, fotos, textos...
        ↓
Clic en "Guardar y publicar"
        ↓
El admin escribe content.json directo en GitHub (vía su API)
        ↓
Netlify detecta el cambio y republica el sitio (~30 segundos)
        ↓
index.html carga el content.json nuevo y se actualiza solo
```

---

## PARTE 1 — Subir los archivos a GitHub

Sube **todos** estos archivos y carpetas a tu repositorio, manteniendo
exactamente esta estructura:

```
diego-castillo-web/
├── index.html
├── style.css
├── main.js
├── content.json          ← NUEVO: aquí vive todo tu contenido
├── content-loader.js      ← NUEVO: pinta el sitio con los datos del JSON
├── admin/
│   ├── index.html         ← el panel de administración
│   └── admin.js           ← la lógica del panel
├── IMG/
│   └── (tus fotos)
└── videos/
    └── (tus videos, si usas archivos locales)
```

> ⚠️ Si ya tenías una carpeta `admin` de un intento anterior con Decap CMS
> (archivos `config.yml`), bórrala primero o sobrescribe ambos archivos.

### Cómo subir (desde el navegador):

1. Ve a tu repo en GitHub
2. **Add file → Upload files**
3. Arrastra todos los archivos de arriba (manteniendo la carpeta `admin/`)
4. Commit message: `Agrega panel de administración propio`
5. **Commit changes**

---

## PARTE 2 — Generar tu Token de GitHub

Este token reemplaza la necesidad de Netlify Identity. Es tu "llave" personal.

1. Ve a **github.com** → haz clic en tu foto de perfil (arriba a la derecha)
2. **Settings**
3. En el menú izquierdo, baja hasta el final: **Developer settings**
4. **Personal access tokens → Tokens (classic)**
5. **Generate new token → Generate new token (classic)**
6. Configura:
   - **Note:** `Admin Diego Castillo`
   - **Expiration:** elige `No expiration` (o 1 año, como prefieras)
   - **Scopes:** marca la casilla **`repo`** (esto marca automáticamente todas las subcasillas)
7. Baja hasta el final → **Generate token**
8. **¡IMPORTANTE!** GitHub te muestra el token UNA SOLA VEZ.
   Cópialo y guárdalo en un lugar seguro (Notas, gestor de contraseñas, etc.)
   Empieza con `ghp_...`

> 🔒 Este token es como una contraseña — no lo compartas ni lo subas a ningún
> repositorio público. El admin lo guarda solo en tu navegador (localStorage).

---

## PARTE 3 — Verificar que Netlify esté publicando bien

Si ya tienes Netlify conectado desde la guía anterior, no necesitas hacer
nada nuevo aquí. Solo verifica:

1. Ve a **app.netlify.com** → tu sitio
2. Pestaña **Deploys** → debería decir **"Published"** en el último deploy
3. Si no se ha actualizado, haz clic en **"Trigger deploy" → "Clear cache and deploy site"**

---

## PARTE 4 — Entrar al Admin Panel

1. Ve a: `https://tu-sitio.netlify.app/admin/`

2. Verás dos campos:
   - **Token de acceso (GitHub):** pega el token que generaste (`ghp_...`)
   - **Repositorio:** escribe `tu-usuario/diego-castillo-web`
     (reemplaza por tu usuario y nombre real del repo)

3. Haz clic en **"Entrar al panel"**

4. Si todo está bien, verás el dashboard completo con el menú lateral:
   Shows, Música, Galería, Videos, Hero, Biografía, Redes, Contacto, Ajustes

> 💾 Tu navegador recuerda el token — la próxima vez que entres a `/admin/`
> ya estarás logueado automáticamente. Para cerrar sesión por completo,
> usa el botón **"Cerrar sesión"** o **"Desconectar este navegador"**
> en la sección Ajustes.

---

## Cómo usar cada sección

### 📅 Shows y fechas
- Edita cualquier campo directamente en la fila
- El selector de la derecha controla el estado: Confirmado / Por confirmar / Agotado / Cancelado / Pasado
- **+ Agregar show** crea una fila nueva vacía
- El botón ✕ en cada fila la elimina (con confirmación)

### 🎵 Single destacado
- Cambia título, tipo, año y etiqueta
- Los links de Spotify/Apple Music/YouTube se actualizan en los botones del sitio

### 🖼️ Galería
- Pega URLs de tus fotos (recomendado: Cloudinary, ver sección abajo)
- El selector "Normal / Ancha / Vertical" controla el tamaño en el grid editorial
- **+ Agregar foto** suma un espacio nuevo

### 🎥 Videos
- Pega el link normal de YouTube (`youtube.com/watch?v=...`) — se convierte
  automáticamente al formato embed

### 🎭 Hero / Portada
- Edita el texto principal, la imagen de fondo y los botones
- También se edita aquí el bloque de "Próximo show destacado" y las 3 estadísticas

### 📝 Biografía
- Frase destacada (cita) + foto + 3 párrafos editables

### 📱 Redes sociales / 📩 Contacto
- Links directos, sin necesidad de tocar código

### ⚙️ Ajustes
- **Modo mantenimiento:** activa una pantalla temporal en todo el sitio
- Botón para desconectar tu token de este navegador

---

## Botón "Guardar y publicar"

Nada se sube a GitHub hasta que hagas clic en este botón. Mientras edites,
verás un indicador arriba que dice **"Cambios sin guardar"**.

Al guardar:
1. El admin escribe el `content.json` actualizado en tu repositorio de GitHub
2. Netlify lo detecta en segundos y reconstruye el sitio
3. En ~30 segundos los cambios son visibles en tu sitio público

---

## Recomendación: usa Cloudinary para las fotos

Como ya conversamos, si subes fotos pesadas directo a GitHub el sitio se
vuelve lento. La combinación ideal:

1. Sube tu foto a **cloudinary.com** (gratis)
2. Copia la URL que te da
3. Agrégale los parámetros de optimización:
   `.../upload/w_1920,q_auto,f_auto/tu-foto.jpg`
4. Pega esa URL completa en el campo correspondiente del admin
   (hero, galería, portada de música, foto de biografía)

---

## Solución de problemas

**"Token inválido o sin permisos"**
→ Verifica que el token tenga el scope `repo` marcado.
→ Genera uno nuevo si no estás seguro.

**"Repositorio o archivo no encontrado"**
→ Revisa que escribiste `usuario/repo` exactamente como aparece en la URL
  de GitHub (sin `https://github.com/`, sin barra al final).
→ Verifica que `content.json` esté en la raíz del repositorio.

**Guardé pero el sitio no cambia**
→ Espera 30-60 segundos y refresca con Ctrl+Shift+R (recarga forzada).
→ Revisa en Netlify → Deploys que se haya disparado un nuevo deploy.

**El admin se ve raro en el celular**
→ El admin está optimizado para escritorio. En celular funciona pero el
  menú lateral se oculta — sigue siendo usable, solo más compacto.

---

## Resumen de URLs

| Qué                  | URL                                              |
|-----------------------|---------------------------------------------------|
| Tu sitio              | https://tu-sitio.netlify.app                      |
| Panel admin           | https://tu-sitio.netlify.app/admin/               |
| Generar token         | github.com/settings/tokens                        |
| Tu repositorio        | github.com/TU_USUARIO/diego-castillo-web          |
| Cloudinary            | cloudinary.com                                     |

---

*Guía generada para Diego Castillo — Junio 2026*
