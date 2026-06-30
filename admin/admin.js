/* ============================================
   DIEGO CASTILLO — admin.js
   Panel de administración que lee/escribe content.json
   directamente en GitHub vía su API REST.
   ============================================ */

const GH_API = 'https://api.github.com';
const FILE_PATH = 'content.json';

let state = {
  token: '',
  repo: '',
  branch: 'main',
  sha: null,      // necesario para actualizar el archivo en GitHub
  data: null,     // el content.json parseado
  dirty: false,
};

let pendingDelete = null; // callback para el modal de confirmación

/* ============================================
   LOGIN
   ============================================ */

const loginScreen = document.getElementById('login-screen');
const adminScreen = document.getElementById('admin-screen');
const loginError = document.getElementById('login-error');

document.getElementById('login-btn').addEventListener('click', attemptLogin);
document.getElementById('gh-token').addEventListener('keydown', e => { if (e.key === 'Enter') attemptLogin(); });
document.getElementById('gh-repo').addEventListener('keydown', e => { if (e.key === 'Enter') attemptLogin(); });

// Restaurar sesión guardada en este navegador
window.addEventListener('DOMContentLoaded', () => {
  const savedToken = localStorage.getItem('dc_admin_token');
  const savedRepo = localStorage.getItem('dc_admin_repo');
  if (savedToken && savedRepo) {
    document.getElementById('gh-token').value = savedToken;
    document.getElementById('gh-repo').value = savedRepo;
    attemptLogin();
  }
});

async function attemptLogin() {
  const token = document.getElementById('gh-token').value.trim();
  const repo = document.getElementById('gh-repo').value.trim();
  loginError.style.display = 'none';

  if (!token || !repo) {
    showLoginError('Completa el token y el repositorio.');
    return;
  }

  state.token = token;
  state.repo = repo;

  const btn = document.getElementById('login-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Verificando...';

  try {
    await loadContent();
    localStorage.setItem('dc_admin_token', token);
    localStorage.setItem('dc_admin_repo', repo);
    showAdmin();
  } catch (err) {
    showLoginError(err.message || 'No se pudo conectar. Revisa el token y el repositorio.');
    btn.disabled = false;
    btn.textContent = 'Entrar al panel';
  }
}

function showLoginError(msg) {
  loginError.textContent = msg;
  loginError.style.display = 'block';
}

function showAdmin() {
  loginScreen.style.display = 'none';
  adminScreen.style.display = 'block';
  document.getElementById('settings-repo').value = state.repo;
  populateAllForms();
}

document.getElementById('logout-btn').addEventListener('click', () => {
  adminScreen.style.display = 'none';
  loginScreen.style.display = 'flex';
});

document.getElementById('disconnect-btn').addEventListener('click', () => {
  localStorage.removeItem('dc_admin_token');
  localStorage.removeItem('dc_admin_repo');
  location.reload();
});

/* ============================================
   GITHUB API — leer y escribir content.json
   ============================================ */

async function ghRequest(path, options = {}) {
  const res = await fetch(`${GH_API}/repos/${state.repo}/${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${state.token}`,
      'Accept': 'application/vnd.github+json',
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    if (res.status === 401) throw new Error('Token inválido o sin permisos.');
    if (res.status === 404) throw new Error('Repositorio o archivo no encontrado. Revisa el nombre (usuario/repo).');
    throw new Error(body.message || `Error de GitHub (${res.status})`);
  }
  return res.json();
}

async function loadContent() {
  const fileData = await ghRequest(`contents/${FILE_PATH}?ref=${state.branch}`);
  state.sha = fileData.sha;
  const decoded = decodeURIComponent(escape(atob(fileData.content)));
  state.data = JSON.parse(decoded);
}

async function saveContent() {
  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(state.data, null, 2))));
  const result = await ghRequest(`contents/${FILE_PATH}`, {
    method: 'PUT',
    body: JSON.stringify({
      message: 'Actualización desde el panel de administración',
      content: encoded,
      sha: state.sha,
      branch: state.branch,
    }),
  });
  state.sha = result.content.sha;
}

/* ============================================
   NAVEGACIÓN ENTRE PANELES
   ============================================ */

const panelTitles = {
  shows: 'Shows y fechas',
  music: 'Single destacado',
  gallery: 'Galería',
  videos: 'Videos',
  hero: 'Hero / Portada',
  bio: 'Biografía',
  socials: 'Redes sociales',
  contact: 'Contacto y booking',
  settings: 'Ajustes',
};

document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('panel-' + btn.dataset.panel).classList.add('active');
    document.getElementById('topbar-title').textContent = panelTitles[btn.dataset.panel];
  });
});

/* ============================================
   POBLAR FORMULARIOS DESDE state.data
   ============================================ */

function populateAllForms() {
  const d = state.data;

  // HERO
  if (d.hero) {
    setVal('h-eyebrow', d.hero.eyebrow);
    setVal('h-tagline', d.hero.tagline);
    setVal('h-image', d.hero.image);
    setVal('h-btn1', d.hero.btnPrimary);
    setVal('h-btn2', d.hero.btnSecondary);
  }

  // NEXT SHOW
  if (d.nextShow) {
    setVal('ns-day', d.nextShow.day);
    setVal('ns-year', d.nextShow.year);
    setVal('ns-badge', d.nextShow.badge);
    setVal('ns-title', d.nextShow.title);
    setVal('ns-venue', d.nextShow.venue);
    setVal('ns-link', d.nextShow.link || '');
  }

  // STATS
  renderStatsEditor();

  // SHOWS
  renderShowsEditor();

  // MUSIC
  if (d.music) {
    setVal('m-title', d.music.title);
    setVal('m-type', d.music.type);
    setVal('m-year', d.music.year);
    setVal('m-label', d.music.label);
    setVal('m-cover', d.music.cover);
    setVal('m-spotify', d.music.spotify);
    setVal('m-apple', d.music.apple);
    setVal('m-youtube', d.music.youtube);
    setVal('m-untitled', d.music.untitled);
  }

  // GALLERY
  renderGalleryEditor();

  // VIDEOS
  renderVideosEditor();

  // BIO
  if (d.biography) {
    setVal('b-lead', d.biography.lead);
    setVal('b-photo', d.biography.photo);
    const p = d.biography.paragraphs || [];
    setVal('b-p1', p[0] || '');
    setVal('b-p2', p[1] || '');
    setVal('b-p3', p[2] || '');
  }

  // SOCIALS
  if (d.socials) {
    setVal('s-instagram', d.socials.instagram);
    setVal('s-youtube', d.socials.youtube);
    setVal('s-spotify', d.socials.spotify);
    setVal('s-apple', d.socials.apple);
    setVal('s-tiktok', d.socials.tiktok);
  }

  // CONTACT
  if (d.contact) {
    setVal('c-email', d.contact.email);
    setVal('c-phone', d.contact.phone);
    setVal('c-manager', d.contact.manager);
    setVal('c-form', d.contact.formEndpoint);
  }

  // SETTINGS
  const maintToggle = document.getElementById('maintenance-toggle');
  if (d.settings && d.settings.maintenanceMode) maintToggle.classList.add('on');
  else maintToggle.classList.remove('on');
}

function setVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val || '';
}
function getVal(id) {
  const el = document.getElementById(id);
  return el ? el.value : '';
}

/* ============================================
   EDITOR: STATS
   ============================================ */

function renderStatsEditor() {
  const wrap = document.getElementById('stats-editor');
  const stats = state.data.stats || [];
  wrap.innerHTML = stats.map((s, i) => `
    <div class="row2" style="margin-bottom:10px">
      <div class="field" style="margin-bottom:0"><label>Valor</label><input data-stat="${i}" data-field="value" value="${escAttr(s.value)}"></div>
      <div class="field" style="margin-bottom:0"><label>Descripción</label><input data-stat="${i}" data-field="label" value="${escAttr(s.label)}"></div>
    </div>
  `).join('');
  wrap.querySelectorAll('input').forEach(inp => {
    inp.addEventListener('input', () => {
      const i = +inp.dataset.stat;
      state.data.stats[i][inp.dataset.field] = inp.value;
      markDirty();
    });
  });
}

/* ============================================
   EDITOR: SHOWS
   ============================================ */

function renderShowsEditor() {
  const wrap = document.getElementById('shows-editor');
  const shows = state.data.shows || [];
  wrap.innerHTML = shows.map((s, i) => `
    <div class="show-edit-row" data-idx="${i}">
      <input data-field="day" value="${escAttr(s.day)}" placeholder="AGO">
      <input data-field="monthYr" value="${escAttr(s.monthYr)}" placeholder="2026">
      <input data-field="name" value="${escAttr(s.name)}" placeholder="Nombre del evento">
      <input data-field="place" value="${escAttr(s.place)}" placeholder="Ciudad">
      <select data-field="statusBundle">
        <option value="upcoming|Confirmado|" ${s.status==='upcoming'&&s.badge==='Confirmado'?'selected':''}>Confirmado</option>
        <option value="upcoming|Por confirmar|pending" ${s.badge==='Por confirmar'?'selected':''}>Por confirmar</option>
        <option value="upcoming|Agotado|sold" ${s.badge==='Agotado'?'selected':''}>Agotado</option>
        <option value="upcoming|Cancelado|cancelled" ${s.badge==='Cancelado'?'selected':''}>Cancelado</option>
        <option value="past|Pasado|past" ${s.status==='past'?'selected':''}>Pasado</option>
      </select>
      <button class="del-row-btn" data-del="${i}">✕</button>
    </div>
  `).join('');

  wrap.querySelectorAll('input, select').forEach(el => {
    el.addEventListener('input', () => updateShowField(el));
    el.addEventListener('change', () => updateShowField(el));
  });
  wrap.querySelectorAll('[data-del]').forEach(btn => {
    btn.addEventListener('click', () => {
      confirmAction('¿Eliminar este show? Esta acción no se puede deshacer.', () => {
        state.data.shows.splice(+btn.dataset.del, 1);
        renderShowsEditor();
        markDirty();
      });
    });
  });
}

function updateShowField(el) {
  const row = el.closest('.show-edit-row');
  const i = +row.dataset.idx;
  if (el.dataset.field === 'statusBundle') {
    const [status, badge, badgeClass] = el.value.split('|');
    state.data.shows[i].status = status;
    state.data.shows[i].badge = badge;
    state.data.shows[i].badgeClass = badgeClass;
  } else {
    state.data.shows[i][el.dataset.field] = el.value;
  }
  markDirty();
}

document.getElementById('add-show-btn').addEventListener('click', () => {
  state.data.shows.push({
    day: '', monthYr: '', name: 'Nuevo show', place: '',
    status: 'upcoming', badge: 'Por confirmar', badgeClass: 'pending', ticketLink: '',
  });
  renderShowsEditor();
  markDirty();
});

/* ============================================
   EDITOR: GALLERY
   ============================================ */

function renderGalleryEditor() {
  const wrap = document.getElementById('gallery-editor');
  const gallery = state.data.gallery || [];
  wrap.innerHTML = gallery.map((g, i) => `
    <div class="gallery-edit-item" data-idx="${i}">
      <div class="gallery-thumb-prev">${g.src ? `<img src="${escAttr(g.src)}" alt="">` : 'Sin foto'}</div>
      <input data-field="src" value="${escAttr(g.src)}" placeholder="URL de la imagen (Cloudinary recomendado)">
      <select data-field="layout">
        <option value="normal" ${g.layout==='normal'?'selected':''}>Normal</option>
        <option value="wide" ${g.layout==='wide'?'selected':''}>Ancha</option>
        <option value="tall" ${g.layout==='tall'?'selected':''}>Vertical</option>
      </select>
      <button class="del-row-btn" data-del="${i}">✕</button>
    </div>
  `).join('');

  wrap.querySelectorAll('input, select').forEach(el => {
    el.addEventListener('input', () => updateGalleryField(el));
    el.addEventListener('change', () => updateGalleryField(el));
  });
  wrap.querySelectorAll('[data-del]').forEach(btn => {
    btn.addEventListener('click', () => {
      confirmAction('¿Eliminar esta foto de la galería?', () => {
        state.data.gallery.splice(+btn.dataset.del, 1);
        renderGalleryEditor();
        markDirty();
      });
    });
  });
}

function updateGalleryField(el) {
  const item = el.closest('.gallery-edit-item');
  const i = +item.dataset.idx;
  state.data.gallery[i][el.dataset.field] = el.value;
  if (el.dataset.field === 'src') {
    item.querySelector('.gallery-thumb-prev').innerHTML = el.value
      ? `<img src="${escAttr(el.value)}" alt="">`
      : 'Sin foto';
  }
  markDirty();
}

document.getElementById('add-photo-btn').addEventListener('click', () => {
  state.data.gallery.push({ src: '', alt: 'Diego Castillo', layout: 'normal' });
  renderGalleryEditor();
  markDirty();
});

/* ============================================
   EDITOR: VIDEOS
   ============================================ */

function renderVideosEditor() {
  const wrap = document.getElementById('videos-editor');
  const videos = state.data.videos || [];
  wrap.innerHTML = videos.map((v, i) => `
    <div class="video-edit-item" data-idx="${i}">
      <div class="row2">
        <div class="field"><label>Título</label><input data-field="title" value="${escAttr(v.title)}"></div>
        <div class="field"><label>Subtítulo</label><input data-field="sub" value="${escAttr(v.sub)}"></div>
      </div>
      <div class="field"><label>Link de YouTube</label><input data-field="embedUrl" value="${escAttr(v.embedUrl)}" placeholder="https://youtube.com/watch?v=..."></div>
      <div style="display:flex;justify-content:flex-end">
        <button class="del-row-btn" data-del="${i}">✕ Eliminar video</button>
      </div>
    </div>
  `).join('');

  wrap.querySelectorAll('input').forEach(el => {
    el.addEventListener('input', () => {
      const i = +el.closest('.video-edit-item').dataset.idx;
      state.data.videos[i][el.dataset.field] = el.value;
      markDirty();
    });
  });
  wrap.querySelectorAll('[data-del]').forEach(btn => {
    btn.addEventListener('click', () => {
      confirmAction('¿Eliminar este video?', () => {
        state.data.videos.splice(+btn.dataset.del, 1);
        renderVideosEditor();
        markDirty();
      });
    });
  });
}

document.getElementById('add-video-btn').addEventListener('click', () => {
  state.data.videos.push({ title: 'Nuevo video', sub: '', embedUrl: '', videoFile: '', featured: false });
  renderVideosEditor();
  markDirty();
});

/* ============================================
   CAMPOS SIMPLES (hero, music, bio, socials, contact)
   ============================================ */

const simpleBindings = [
  ['h-eyebrow', 'hero', 'eyebrow'], ['h-tagline', 'hero', 'tagline'],
  ['h-image', 'hero', 'image'], ['h-btn1', 'hero', 'btnPrimary'], ['h-btn2', 'hero', 'btnSecondary'],
  ['ns-day', 'nextShow', 'day'], ['ns-year', 'nextShow', 'year'], ['ns-badge', 'nextShow', 'badge'],
  ['ns-title', 'nextShow', 'title'], ['ns-venue', 'nextShow', 'venue'], ['ns-link', 'nextShow', 'link'],
  ['m-title', 'music', 'title'], ['m-type', 'music', 'type'], ['m-year', 'music', 'year'],
  ['m-label', 'music', 'label'], ['m-cover', 'music', 'cover'], ['m-spotify', 'music', 'spotify'],
  ['m-apple', 'music', 'apple'], ['m-youtube', 'music', 'youtube'], ['m-untitled', 'music', 'untitled'],
  ['b-lead', 'biography', 'lead'], ['b-photo', 'biography', 'photo'],
  ['s-instagram', 'socials', 'instagram'], ['s-youtube', 'socials', 'youtube'],
  ['s-spotify', 'socials', 'spotify'], ['s-apple', 'socials', 'apple'], ['s-tiktok', 'socials', 'tiktok'],
  ['c-email', 'contact', 'email'], ['c-phone', 'contact', 'phone'],
  ['c-manager', 'contact', 'manager'], ['c-form', 'contact', 'formEndpoint'],
];

simpleBindings.forEach(([id, group, field]) => {
  document.addEventListener('input', e => {
    if (e.target.id === id) {
      if (!state.data[group]) state.data[group] = {};
      state.data[group][field] = e.target.value;
      markDirty();
    }
  });
});

// Párrafos de biografía (van a un array)
['b-p1', 'b-p2', 'b-p3'].forEach(id => {
  document.addEventListener('input', e => {
    if (e.target.id === id) {
      if (!state.data.biography.paragraphs) state.data.biography.paragraphs = ['', '', ''];
      const idx = id === 'b-p1' ? 0 : id === 'b-p2' ? 1 : 2;
      state.data.biography.paragraphs[idx] = e.target.value;
      markDirty();
    }
  });
});

// Toggle modo mantenimiento
document.getElementById('maintenance-toggle').addEventListener('click', (e) => {
  e.target.classList.toggle('on');
  if (!state.data.settings) state.data.settings = {};
  state.data.settings.maintenanceMode = e.target.classList.contains('on');
  markDirty();
});

/* ============================================
   GUARDAR / PUBLICAR
   ============================================ */

function markDirty() {
  state.dirty = true;
  const pill = document.getElementById('status-pill');
  pill.className = 'status-pill saving';
  pill.innerHTML = '<span class="dot"></span>Cambios sin guardar';
}

document.getElementById('save-btn').addEventListener('click', async () => {
  const btn = document.getElementById('save-btn');
  const original = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Guardando...';

  if (state.data.settings) {
    state.data.settings.lastUpdated = new Date().toISOString();
  }

  try {
    await saveContent();
    state.dirty = false;
    const pill = document.getElementById('status-pill');
    pill.className = 'status-pill ok';
    pill.innerHTML = '<span class="dot"></span>Sincronizado';
    showToast('Guardado y publicado. El sitio se actualizará en ~30 segundos.', 'success');
  } catch (err) {
    showToast(err.message || 'Error al guardar. Intenta de nuevo.', 'error');
  }

  btn.disabled = false;
  btn.innerHTML = original;
});

// Avisar antes de cerrar si hay cambios sin guardar
window.addEventListener('beforeunload', (e) => {
  if (state.dirty) {
    e.preventDefault();
    e.returnValue = '';
  }
});

/* ============================================
   UTILIDADES: toast, confirm modal, escape
   ============================================ */

function showToast(msg, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = `toast show ${type}`;
  setTimeout(() => { toast.className = 'toast'; }, 4000);
}

function confirmAction(text, onConfirm) {
  document.getElementById('confirm-text').textContent = text;
  document.getElementById('confirm-overlay').classList.add('show');
  pendingDelete = onConfirm;
}

document.getElementById('confirm-cancel').addEventListener('click', () => {
  document.getElementById('confirm-overlay').classList.remove('show');
  pendingDelete = null;
});

document.getElementById('confirm-ok').addEventListener('click', () => {
  if (pendingDelete) pendingDelete();
  document.getElementById('confirm-overlay').classList.remove('show');
  pendingDelete = null;
});

function escAttr(str) {
  if (str === undefined || str === null) return '';
  return String(str).replace(/"/g, '&quot;');
}
