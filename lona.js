/* ==========================================================================
   LASERPRINT ARCADE - LONA ENGINE & AUDIO SYNTHESIZER
   ========================================================================== */

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
  const categoria = document.body.getAttribute('data-categoria') || 'LONA';
  
  cargarProductosCategoria(categoria);
  initTabs();
  initLightbox();
  initMobileMenu();
  initAudioEffects();
});

async function cargarProductosCategoria(categoria) {
  try {
    const response = await fetch(`/api/productos?categoria=${encodeURIComponent(categoria)}`);
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
    const tipo = (prod.tipoArchivo || detectTipo(prod.archivoUrl)).toLowerCase();

    if (tipo === 'imagen' && gridImg) {
      gridImg.appendChild(createCardImagen(prod));
    } else if (tipo === 'video' && gridVid) {
      gridVid.appendChild(createCardVideo(prod));
    } else if (tipo === 'pdf' && gridPdf) {
      gridPdf.appendChild(createCardPdf(prod));
    }
  });
}

function createCardImagen(prod) {
  const card = document.createElement('div');
  card.className = 'card-arcade';
  card.innerHTML = `
    <div class="media-wrapper arcade-sound-btn" onclick="ArcadeAudio.playSelect(); openModal('img', '${prod.archivoUrl}', '${escapeQuotes(prod.nombre)}')">
      <img src="${prod.archivoUrl}" alt="${prod.nombre}" loading="lazy" onerror="this.onerror=null; this.src='https://via.placeholder.com/300x200/0d1124/00f0ff?text=PREVIEW+NO+DISPONIBLE';">
    </div>
    <div class="card-info">
      <div class="card-title">${prod.nombre}</div>
      <div class="card-price">${prod.precio ? '$' + prod.precio + ' MXN / m²' : 'COTIZAR'}</div>
    </div>
  `;
  return card;
}

function createCardVideo(prod) {
  const card = document.createElement('div');
  card.className = 'card-arcade';
  card.innerHTML = `
    <div class="media-wrapper arcade-sound-btn" onclick="ArcadeAudio.playSelect(); openModal('video', '${prod.archivoUrl}', '${escapeQuotes(prod.nombre)}')">
      <video src="${prod.archivoUrl}" muted preload="metadata"></video>
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

  card.innerHTML = `
    <div class="media-wrapper arcade-sound-btn" onclick="ArcadeAudio.playSelect(); window.open('${prod.archivoUrl}', '_blank')">
      <div class="pdf-cover-container">
        <span class="pdf-badge">PORTADA PDF</span>
        <canvas id="${canvasId}"></canvas>
      </div>
    </div>
    <div class="card-info">
      <div class="card-title">${prod.nombre}</div>
      ${prod.precio ? `<div class="card-price">$${prod.precio} MXN</div>` : ''}
      <a href="${prod.archivoUrl}" target="_blank" class="btn-arcade arcade-sound-btn" onclick="ArcadeAudio.playSelect()">ABRIR DOCUMENTO</a>
    </div>
  `;

  setTimeout(() => renderPdfCover(prod.archivoUrl, canvasId), 150);
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
      canvas.parentElement.innerHTML = '<div style="color: var(--neon-magenta); font-family: var(--font-arcade); font-size: 8px; text-align: center; padding: 20px;">DOCUMENTO PDF</div>';
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

      if (secImg) secImg.style.display = (target === 'imagenes') ? 'block' : 'none';
      if (secVid) secVid.style.display = (target === 'videos') ? 'block' : 'none';
      if (secPdf) secPdf.style.display = (target === 'pdfs') ? 'block' : 'none';
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
    { nombre: 'LONA FRONTLIT 13OZ ALTA RESOLUCIÓN', archivoUrl: '/uploads/fotos/lona_frontlit.png', tipoArchivo: 'imagen', precio: 120 },
    { nombre: 'LONA MESH (MICROPERFORADA FOR VIENTO)', archivoUrl: '/uploads/fotos/lona_mesh.png', tipoArchivo: 'imagen', precio: 150 },
    { nombre: 'PROCESO DE IMPRESIÓN Y COLOCACIÓN DE OJILLOS', archivoUrl: '/uploads/videos/lona_impresion.mp4', tipoArchivo: 'video', precio: null },
    { nombre: 'GUÍA DE PREPARACIÓN DE ARCHIVOS PARA LONA', archivoUrl: '/uploads/docs/guia_lona.pdf', tipoArchivo: 'pdf', precio: null }
  ];
}