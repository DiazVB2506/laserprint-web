/* ==========================================================================
   LASERPRINT ARCADE - SUBLIMACIÓN ENGINE & AUDIO SYNTHESIZER (PRODUCTION)
   ========================================================================== */

// Endpoints backend para producción (Render) y desarrollo local
const RENDER_BASE_URL = 'https://laserprint-api.onrender.com';
const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:5000/api/productos'
  : `${RENDER_BASE_URL}/api/productos`;

const ArcadeAudio = {
  ctx: null,
  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  },
  playHover() {
    try {
      this.init();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(440, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch (e) {}
  },
  playSelect() {
    try {
      this.init();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, this.ctx.currentTime);
      osc.frequency.setValueAtTime(659.25, this.ctx.currentTime + 0.08);
      osc.frequency.setValueAtTime(783.99, this.ctx.currentTime + 0.16);
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch (e) {}
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const categoria = document.body.getAttribute('data-categoria') || 'SUBLIMACION';
  
  cargarProductosCategoria(categoria);
  initTabs();
  initLightbox();
  initMobileMenu();
  initAudioEffects();
});

/**
 * Convierte rutas relativas en URLs absolutas hacia el servidor Render
 */
function obtenerUrlCompleta(url) {
  if (!url) return 'https://via.placeholder.com/300x200/0d1124/00f0ff?text=PREVIEW+NO+DISPONIBLE';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${RENDER_BASE_URL}${cleanPath}`;
}

async function cargarProductosCategoria(categoria) {
  try {
    const response = await fetch(`${API_URL}?categoria=${encodeURIComponent(categoria)}`);
    if (!response.ok) throw new Error('No se pudo conectar a la API');

    const data = await response.json();
    const productos = data.productos || data || [];

    renderSecciones(productos);
  } catch (error) {
    console.warn('⚠️ [LASERPRINT] Servidor API no detectado. Cargando datos local Mock:', error);
    renderSecciones(getDatosMOCK());
  }
}

function renderSecciones(productos) {
  const gridImg = document.getElementById('gridImagenes');
  const gridVid = document.getElementById('gridVideos');
  const gridPdf = document.getElementById('gridPdfs');

  if (gridImg) gridImg.innerHTML = '';
  if (gridVid) gridVid.innerHTML = '';
  if (gridPdf) gridPdf.innerHTML = '';

  productos.forEach(prod => {
    const rawUrl = prod.fullArchivoUrl || prod.archivoUrl;
    const urlAbsoluta = obtenerUrlCompleta(rawUrl);
    const tipo = (prod.tipoArchivo || detectTipo(urlAbsoluta)).toLowerCase();

    const productoProcesado = { ...prod, archivoUrlAbsoluta: urlAbsoluta };

    if (tipo === 'imagen' && gridImg) {
      gridImg.appendChild(createCardImagen(productoProcesado));
    } else if (tipo === 'video' && gridVid) {
      gridVid.appendChild(createCardVideo(productoProcesado));
    } else if (tipo === 'pdf' && gridPdf) {
      gridPdf.appendChild(createCardPdf(productoProcesado));
    }
  });
}

function createCardImagen(prod) {
  const card = document.createElement('div');
  card.className = 'card-arcade';
  const url = prod.archivoUrlAbsoluta;

  card.innerHTML = `
    <div class="media-wrapper arcade-sound-btn" onclick="ArcadeAudio.playSelect(); openModal('img', '${url}', '${escapeQuotes(prod.nombre)}')">
      <img src="${url}" alt="${prod.nombre}" loading="lazy" onerror="this.onerror=null; this.src='https://via.placeholder.com/300x200/0d1124/00f0ff?text=PREVIEW+NO+DISPONIBLE';">
    </div>
    <div class="card-info">
      <div class="card-title">${prod.nombre}</div>
      <div class="card-price">${prod.precio ? '$' + prod.precio + ' MXN' : 'COTIZAR'}</div>
    </div>
  `;
  return card;
}

function createCardVideo(prod) {
  const card = document.createElement('div');
  card.className = 'card-arcade';
  const url = prod.archivoUrlAbsoluta;

  card.innerHTML = `
    <div class="media-wrapper arcade-sound-btn" onclick="ArcadeAudio.playSelect(); openModal('video', '${url}', '${escapeQuotes(prod.nombre)}')">
      <video src="${url}" muted preload="metadata"></video>
    </div>
    <div class="card-info">
      <div class="card-title">${prod.nombre}</div>
      <div class="card-price">${prod.precio ? '$' + prod.precio + ' MXN' : 'COTIZAR'}</div>
    </div>
  `;
  return card;
}

function createCardPdf(prod) {
  const card = document.createElement('div');
  card.className = 'card-arcade';
  const canvasId = 'pdf-canvas-' + Math.random().toString(36).substr(2, 9);
  const url = prod.archivoUrlAbsoluta;

  card.innerHTML = `
    <div class="media-wrapper arcade-sound-btn" onclick="ArcadeAudio.playSelect(); window.open('${url}', '_blank')">
      <div class="pdf-cover-container">
        <span class="pdf-badge">PORTADA PDF</span>
        <canvas id="${canvasId}"></canvas>
      </div>
    </div>
    <div class="card-info">
      <div class="card-title">${prod.nombre}</div>
      ${prod.precio ? `<div class="card-price">$${prod.precio} MXN</div>` : ''}
      <a href="${url}" target="_blank" class="btn-arcade arcade-sound-btn" onclick="ArcadeAudio.playSelect()">ABRIR DOCUMENTO</a>
    </div>
  `;

  setTimeout(() => renderPdfCover(url, canvasId), 150);
  return card;
}

async function renderPdfCover(pdfUrl, canvasId) {
  if (typeof pdfjsLib === 'undefined') return;

  try {
    const loadingTask = pdfjsLib.getDocument(pdfUrl);
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);

    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const context = canvas.getContext('2d');
    const viewport = page.getViewport({ scale: 0.6 });

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise;

  } catch (error) {
    const canvas = document.getElementById(canvasId);
    if (canvas && canvas.parentElement) {
      canvas.parentElement.innerHTML = '<div style="color: var(--neon-magenta, #ff0055); font-family: var(--font-arcade); font-size: 8px; text-align: center; padding: 20px;">DOCUMENTO PDF</div>';
    }
  }
}

function initTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      ArcadeAudio.playSelect();
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const target = tab.getAttribute('data-tab');
      
      const secImg = document.getElementById('sec-imagenes');
      const secVid = document.getElementById('sec-videos');
      const secPdf = document.getElementById('sec-pdfs');

      if (secImg) secImg.style.display = (target === 'imagenes' || target === 'todos') ? 'block' : 'none';
      if (secVid) secVid.style.display = (target === 'videos' || target === 'todos') ? 'block' : 'none';
      if (secPdf) secPdf.style.display = (target === 'pdfs' || target === 'todos') ? 'block' : 'none';
    });
  });
}

function openModal(tipo, src, caption) {
  const modal = document.getElementById('mediaModal');
  const body = document.getElementById('modalBody');
  const cap = document.getElementById('captionModal');

  if (!modal || !body) return;

  if (tipo === 'img') {
    body.innerHTML = `<img src="${src}" alt="${caption}">`;
  } else if (tipo === 'video') {
    body.innerHTML = `<video src="${src}" controls autoplay style="width:100%; max-height:75vh;"></video>`;
  }

  if (cap) cap.textContent = caption;
  modal.style.display = 'flex';
}

function initLightbox() {
  const modal = document.getElementById('mediaModal');
  const closeBtn = document.getElementById('closeModal');

  if (closeBtn && modal) {
    closeBtn.onclick = () => {
      ArcadeAudio.playSelect();
      modal.style.display = 'none';
      const body = document.getElementById('modalBody');
      if (body) body.innerHTML = ''; 
    };

    modal.onclick = (e) => {
      if (e.target === modal) {
        ArcadeAudio.playSelect();
        modal.style.display = 'none';
        const body = document.getElementById('modalBody');
        if (body) body.innerHTML = '';
      }
    };
  }
}

function initAudioEffects() {
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest('.arcade-sound-hover') || e.target.closest('.tab-btn') || e.target.closest('.btn-arcade')) {
      ArcadeAudio.playHover();
    }
  });
}

function initMobileMenu() {
  const btn = document.getElementById('mobileMenuBtn');
  const nav = document.getElementById('navLinks');

  if (btn && nav) {
    btn.addEventListener('click', () => {
      ArcadeAudio.playSelect();
      nav.classList.toggle('active');
    });
  }
}

function detectTipo(url) {
  if (/\.(mp4|webm|ogg)$/i.test(url)) return 'video';
  if (/\.(pdf)$/i.test(url)) return 'pdf';
  return 'imagen';
}

function escapeQuotes(str) {
  return str ? str.replace(/'/g, "\\'").replace(/"/g, '&quot;') : '';
}

function getDatosMOCK() {
  return [
    { nombre: 'TAZA CERÁMICA 11OZ SUBLIMADA', archivoUrl: '/uploads/fotos/taza.png', tipoArchivo: 'imagen', precio: 85 },
    { nombre: 'TERMO ALUMINIO 600ML', archivoUrl: '/uploads/fotos/termo.png', tipoArchivo: 'imagen', precio: 160 },
    { nombre: 'PROCESO DE SUBLIMACIÓN EN PRENSA TÉRMICA', archivoUrl: '/uploads/videos/sublimacion_demo.mp4', tipoArchivo: 'video', precio: null },
    { nombre: 'CATÁLOGO DE PRODUCTOS SUBLIMABLES', archivoUrl: '/uploads/docs/catalogo_sublimacion.pdf', tipoArchivo: 'pdf', precio: null }
  ];
}
