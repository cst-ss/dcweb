/* ============================================
   DIEGO CASTILLO — main.js
   ============================================ */

/* --- HAMBURGER MENU --- */
const hamburger = document.getElementById('nav-hamburger');
const mobileMenu = document.getElementById('nav-mobile');

if (hamburger && mobileMenu) {
  hamburger.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
}

/* --- SMOOTH NAV HIDE ON SCROLL --- */
let lastScroll = 0;
window.addEventListener('scroll', () => {
  const nav = document.getElementById('nav');
  const current = window.scrollY;
  if (current > lastScroll && current > 200) {
    nav.style.transform = 'translateY(-100%)';
  } else {
    nav.style.transform = 'translateY(0)';
  }
  lastScroll = current;
}, { passive: true });

/* Restore nav transition */
document.getElementById('nav').style.transition = 'transform 0.4s ease, background 0.3s ease';

/* --- ACTIVE NAV LINK --- */
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a, .nav-mobile a');

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === '#' + entry.target.id) {
          link.classList.add('active');
        }
      });
    }
  });
}, { threshold: 0.4 });

sections.forEach(s => observer.observe(s));

/* --- LIGHTBOX --- */
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');

function bindGallery() {
  document.querySelectorAll('.gallery-item').forEach(item => {
    item.addEventListener('click', () => {
      const img = item.querySelector('img');
      if (!img) return;
      lightboxImg.src = img.src;
      lightboxImg.alt = img.alt;
      lightbox.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  });
}
bindGallery();
// content-loader.js llama a esto después de regenerar la galería desde el JSON
window.rebindGallery = bindGallery;

document.getElementById('lightbox-close')?.addEventListener('click', closeLightbox);
lightbox?.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLightbox(); });

function closeLightbox() {
  lightbox.classList.remove('open');
  document.body.style.overflow = '';
}

/* --- AUDIO PLAYER --- */
const playerBar = document.getElementById('player-bar');
const playerTrack = document.getElementById('player-track');
const playerArtist = document.getElementById('player-artist');
const playBtn = document.getElementById('play-btn');
const progressFill = document.getElementById('progress-fill');
const timeEl = document.getElementById('player-time');
const timeTotalEl = document.getElementById('player-time-total');

let audio = null;
let isPlaying = false;

// Configuración de pistas (edita aquí tus tracks)
// path: ruta al archivo de audio relativo a la raíz del sitio
// title: nombre de la canción
// cover: ruta a la portada
const tracks = [
  { title: 'Próximamente', artist: 'Diego Castillo', path: null },
  { title: 'Próximamente', artist: 'Diego Castillo', path: null },
];

let currentTrack = 0;

function loadTrack(idx) {
  const t = tracks[idx];
  if (!t) return;
  playerTrack.textContent = t.title;
  playerArtist.textContent = t.artist;

  if (audio) { audio.pause(); audio = null; }
  if (!t.path) { showPlayer(); return; }

  audio = new Audio(t.path);
  audio.addEventListener('timeupdate', updateProgress);
  audio.addEventListener('ended', nextTrack);
  audio.addEventListener('loadedmetadata', () => {
    timeTotalEl.textContent = formatTime(audio.duration);
  });
  showPlayer();
  playAudio();
}

function playAudio() {
  if (!audio) return;
  audio.play().then(() => {
    isPlaying = true;
    updatePlayBtn();
  }).catch(() => {});
}

function pauseAudio() {
  if (!audio) return;
  audio.pause();
  isPlaying = false;
  updatePlayBtn();
}

function updatePlayBtn() {
  const icon = playBtn?.querySelector('.play-icon');
  if (!icon) return;
  icon.innerHTML = isPlaying
    ? '<rect x="4" y="3" width="4" height="14" rx="1" fill="currentColor"/><rect x="12" y="3" width="4" height="14" rx="1" fill="currentColor"/>'
    : '<polygon points="5,3 19,10 5,17" fill="currentColor"/>';
}

function updateProgress() {
  if (!audio || !audio.duration) return;
  const pct = (audio.currentTime / audio.duration) * 100;
  progressFill.style.width = pct + '%';
  timeEl.textContent = formatTime(audio.currentTime);
}

function nextTrack() {
  currentTrack = (currentTrack + 1) % tracks.length;
  loadTrack(currentTrack);
}

function prevTrack() {
  if (audio && audio.currentTime > 3) { audio.currentTime = 0; return; }
  currentTrack = (currentTrack - 1 + tracks.length) % tracks.length;
  loadTrack(currentTrack);
}

function showPlayer() {
  playerBar.classList.add('visible');
}

function formatTime(s) {
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return m + ':' + (sec < 10 ? '0' : '') + sec;
}

// Click en tarjetas de track
document.querySelectorAll('.track-card').forEach((card, idx) => {
  card.addEventListener('click', () => {
    currentTrack = idx;
    loadTrack(idx);
  });
});

// Controles del player
playBtn?.addEventListener('click', () => {
  if (!audio) { loadTrack(currentTrack); return; }
  isPlaying ? pauseAudio() : playAudio();
});

document.getElementById('btn-prev')?.addEventListener('click', prevTrack);
document.getElementById('btn-next')?.addEventListener('click', nextTrack);

document.getElementById('player-close')?.addEventListener('click', () => {
  pauseAudio();
  playerBar.classList.remove('visible');
});

// Click en barra de progreso para seek
document.querySelector('.progress-track')?.addEventListener('click', (e) => {
  if (!audio) return;
  const rect = e.currentTarget.getBoundingClientRect();
  const pct = (e.clientX - rect.left) / rect.width;
  audio.currentTime = pct * audio.duration;
});

/* --- BOOKING FORM --- */
const bookingForm = document.getElementById('booking-form');
if (bookingForm) {
  bookingForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = bookingForm.querySelector('.form-submit');
    btn.textContent = '¡Mensaje enviado!';
    btn.style.background = '#2a6e40';
    btn.style.color = '#fff';
    setTimeout(() => {
      btn.textContent = 'Enviar solicitud de booking';
      btn.style.background = '';
      btn.style.color = '';
      bookingForm.reset();
    }, 3000);
  });
}

/* --- NEWSLETTER FORM --- */
const newsletterForm = document.getElementById('newsletter-form');
if (newsletterForm) {
  newsletterForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = newsletterForm.querySelector('button');
    btn.textContent = '¡Suscrito!';
    btn.style.background = '#2a6e40';
    setTimeout(() => {
      btn.textContent = 'Suscribirse';
      btn.style.background = '';
      newsletterForm.reset();
    }, 3000);
  });
}

/* --- SCROLL REVEAL (simple, sin lib externa) --- */
const revealEls = document.querySelectorAll('.reveal');

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('revealed');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

revealEls.forEach(el => revealObserver.observe(el));

/* --- VIDEO PLAY / PAUSE (estilo ciudad-loop) --- */
function bindVideoPlayers() {
  document.querySelectorAll('.video-play-pause').forEach(btn => {
    if (btn.dataset.bound === 'true') return; // evita doble-bind
    const video = btn.closest('.video-card-inner').querySelector('.video-el');
    if (!video) return;

    video.muted = true;
    video.play().catch(() => {});

    const pauseIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="14" y="3" width="5" height="18" rx="1"></rect><rect x="5" y="3" width="5" height="18" rx="1"></rect></svg>`;
    const playIcon  = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;

    btn.innerHTML = pauseIcon;
    btn.dataset.bound = 'true';

    btn.addEventListener('click', () => {
      if (video.paused) {
        video.play();
        btn.innerHTML = pauseIcon;
        btn.setAttribute('aria-label', 'Pausar video');
      } else {
        video.pause();
        btn.innerHTML = playIcon;
        btn.setAttribute('aria-label', 'Reproducir video');
      }
    });
  });
}
bindVideoPlayers();
// content-loader.js llama a esto después de regenerar los videos desde el JSON
window.rebindVideoPlayers = bindVideoPlayers;

