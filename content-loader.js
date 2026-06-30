/* ============================================
   DIEGO CASTILLO — content-loader.js
   Lee content.json y pinta el sitio dinámicamente.
   Se ejecuta ANTES de main.js (que maneja interacciones).
   ============================================ */

(function () {
  const CACHE_BUST = Date.now();

  fetch('content.json?v=' + CACHE_BUST)
    .then(res => {
      if (!res.ok) throw new Error('content.json no encontrado');
      return res.json();
    })
    .then(data => hydrate(data))
    .catch(err => {
      // Si content.json falla, el HTML estático de respaldo se queda tal cual.
      console.warn('No se pudo cargar content.json, usando contenido estático de respaldo.', err);
    });

  function setText(id, value) {
    if (value === undefined || value === null) return;
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function setHref(id, value) {
    if (!value) return;
    const el = document.getElementById(id);
    if (el) el.setAttribute('href', value);
  }

  function setSrc(id, value) {
    if (!value) return;
    const el = document.getElementById(id);
    if (el) el.setAttribute('src', value);
  }

  function hydrate(data) {
    /* ---------- HERO ---------- */
    if (data.hero) {
      setText('hero-eyebrow', data.hero.eyebrow);
      setText('hero-tagline', data.hero.tagline);
      setText('hero-btn-primary', data.hero.btnPrimary);
      setText('hero-btn-secondary', data.hero.btnSecondary);
      setSrc('hero-img', data.hero.image);
      // El título "Diego / Castillo" mantiene su <span class="line-accent"> intacto,
      // así que solo lo tocamos si viene un título custom de una sola línea.
    }

    /* ---------- STATS ---------- */
    if (data.stats && data.stats.length) {
      const wrap = document.getElementById('stats');
      if (wrap) {
        wrap.innerHTML = data.stats.map(s => `
          <div class="stat-item">
            <div class="stat-num">${escapeHTML(s.value)}</div>
            <div class="stat-label">${escapeHTML(s.label)}</div>
          </div>
        `).join('');
      }
    }

    /* ---------- PRÓXIMO SHOW ---------- */
    if (data.nextShow) {
      setText('nextshow-day', data.nextShow.day);
      setText('nextshow-year', data.nextShow.year);
      setText('nextshow-title', data.nextShow.title);
      setText('nextshow-venue', data.nextShow.venue);
      setText('nextshow-badge', data.nextShow.badge);
      if (data.nextShow.link) setHref('nextshow-link', data.nextShow.link);
    }

    /* ---------- SHOWS (lista filtrable) ---------- */
    if (data.shows && data.shows.length) {
      window.__shows = data.shows; // usado por el script de filtros embebido en index.html
      const list = document.getElementById('shows-list');
      if (list && typeof window.renderShows === 'function') {
        window.renderShows();
      }
    }

    /* ---------- MUNICIPALIDADES ---------- */
    if (data.municipalities && data.municipalities.length) {
      const wrap = document.querySelector('.municipalities-logos');
      if (wrap) {
        wrap.innerHTML = data.municipalities.map(m => `
          <div class="muni-item muni-text" role="listitem">${escapeHTML(m)}</div>
        `).join('');
      }
    }

    /* ---------- MÚSICA / SINGLE DESTACADO ---------- */
    if (data.music) {
      const m = data.music;
      setText('release-label', m.label);
      setText('release-title', m.title);
      setText('release-meta', `${m.type || ''} · ${m.year || ''}`);
      if (m.cover) {
        const coverWrap = document.getElementById('release-cover');
        if (coverWrap) {
          coverWrap.innerHTML = `<img src="${escapeAttr(m.cover)}" alt="${escapeAttr(m.title || 'Portada')}">`;
        }
      }
      setHref('platform-spotify', m.spotify);
      setHref('platform-apple', m.apple);
      setHref('platform-youtube', m.youtube);
      setHref('platform-untitled', m.untitled);
    }

    /* ---------- BIOGRAFÍA ---------- */
    if (data.biography) {
      const b = data.biography;
      setText('bio-lead', b.lead);
      setSrc('bio-photo', b.photo);
      if (b.paragraphs && b.paragraphs.length) {
        const wrap = document.getElementById('bio-paragraphs');
        if (wrap) {
          wrap.innerHTML = b.paragraphs.map(p => `<p class="bio-body">${escapeHTML(p)}</p>`).join('');
        }
      }
    }

    /* ---------- GALERÍA ---------- */
    if (data.gallery && data.gallery.length) {
      const grid = document.getElementById('gallery-grid');
      if (grid) {
        grid.innerHTML = data.gallery.map((g, i) => {
          const layoutClass = g.layout === 'wide' ? 'gallery-wide' : g.layout === 'tall' ? 'gallery-tall' : '';
          if (!g.src) {
            return `
              <div class="gallery-item ${layoutClass}" role="listitem">
                <div class="gallery-placeholder" aria-label="Espacio foto ${i + 1}">
                  <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden="true"><rect x="2" y="5" width="28" height="22" rx="2" stroke="#444" stroke-width="1.5"/><circle cx="11" cy="13" r="3" stroke="#444" stroke-width="1.5"/><path d="M2 22L9 16L14 21L20 14L30 22" stroke="#444" stroke-width="1.5" stroke-linejoin="round"/></svg>
                  <span>Foto ${i + 1}</span>
                </div>
              </div>`;
          }
          return `
            <div class="gallery-item ${layoutClass}" role="listitem">
              <img src="${escapeAttr(g.src)}" alt="${escapeAttr(g.alt || 'Diego Castillo')}">
            </div>`;
        }).join('');

        // Re-conectar el lightbox a las nuevas imágenes
        if (typeof window.rebindGallery === 'function') window.rebindGallery();
      }
    }

    /* ---------- VIDEOS ---------- */
    if (data.videos && data.videos.length) {
      const grid = document.getElementById('videos-grid');
      if (grid) {
        grid.innerHTML = data.videos.map(v => {
          let inner;
          if (v.embedUrl) {
            inner = `<iframe src="${escapeAttr(toEmbed(v.embedUrl))}" title="${escapeAttr(v.title)}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe>`;
          } else if (v.videoFile) {
            inner = `<video src="${escapeAttr(v.videoFile)}" loop playsinline preload="metadata" aria-label="${escapeAttr(v.title)}" class="video-el"></video>
                      <div class="video-gradient" aria-hidden="true"></div>
                      <button class="video-play-pause" aria-label="Pausar video"></button>`;
          } else {
            inner = `<div class="video-placeholder-new" aria-label="Agrega tu video aquí">
                        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true"><circle cx="24" cy="24" r="20" stroke="#333" stroke-width="1.5"/><polygon points="19,16 34,24 19,32" fill="#333"/></svg>
                      </div>`;
          }
          return `
            <div class="video-card">
              <div class="video-card-inner">${inner}</div>
              <div class="video-meta">
                <div class="video-meta-title">${escapeHTML(v.title || '')}</div>
                <div class="video-meta-sub">${escapeHTML(v.sub || '')}</div>
              </div>
            </div>`;
        }).join('');

        if (typeof window.rebindVideoPlayers === 'function') window.rebindVideoPlayers();
      }
    }

    /* ---------- REDES SOCIALES ---------- */
    if (data.socials) {
      setHref('social-youtube', data.socials.youtube);
      setHref('social-instagram', data.socials.instagram);
      setHref('platform-youtube', data.socials.youtube);
      setHref('platform-instagram', data.socials.instagram);
    }

    /* ---------- CONTACTO / BOOKING FORM ---------- */
    if (data.contact && data.contact.formEndpoint) {
      const form = document.getElementById('booking-form');
      if (form) form.setAttribute('action', data.contact.formEndpoint);
    }

    /* ---------- MODO MANTENIMIENTO ---------- */
    if (data.settings && data.settings.maintenanceMode === true) {
      showMaintenanceOverlay();
    }
  }

  function toEmbed(url) {
    // Convierte un link normal de YouTube a su versión embed
    const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
    if (m) return `https://www.youtube.com/embed/${m[1]}?rel=0`;
    return url;
  }

  function showMaintenanceOverlay() {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#080808;color:#F0EEE9;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:Plus Jakarta Sans,sans-serif;text-align:center;padding:20px';
    overlay.innerHTML = `
      <h1 style="font-size:28px;font-weight:700;margin-bottom:12px">Volvemos enseguida</h1>
      <p style="font-size:14px;color:#888">Estamos actualizando el sitio. Vuelve a intentarlo en unos minutos.</p>
    `;
    document.body.appendChild(overlay);
  }

  function escapeHTML(str) {
    if (str === undefined || str === null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function escapeAttr(str) {
    if (str === undefined || str === null) return '';
    return String(str).replace(/"/g, '&quot;');
  }
})();
