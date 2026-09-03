/* ==========================================================================
   LASERPRINT ARCADE - CATEGORIA ENGINE (CORREGIDO PARA GITHUB PAGES Y RENDER)
   ========================================================================== */

// Detecta automáticamente si está en local o en producción (Render)
const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:5000/api/productos'
  : 'https://laserprint-api.onrender.com/api/productos';

const RENDER_BASE_URL = 'https://laserprint-api.onrender.com';
const formatoMXN = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

document.addEventListener('DOMContentLoaded', () => {
  // 1. Determina la categoría actual
  let categoriaActual = document.body.dataset.categoria;
  if (!categoriaActual) {
    const urlParams = new URLSearchParams(window.location.search);
    categoriaActual = urlParams.get('cat');
  }

  // 2. Título dinámico si existe en el DOM
  const tituloArea = document.getElementById('tituloArea');
  if (tituloArea && categoriaActual) {
    tituloArea.innerText = `Sección: ${categoriaActual}`;
  }

  // 3. Inicializa eventos e interfaz
  initTabs();
  initLightbox();
  initMobileMenu();

  // 4. Carga las publicaciones
  if (categoriaActual) {
    cargarProductosPorCategoria(categoriaActual);
  }
});

/**
 * Convierte URLs relativas (/uploads/...) a URLs absolutas apuntando a Render
 */
function obtenerUrlCompleta(prod) {
  const url = prod ? (prod.fullArchivoUrl || prod.archivoUrl) : '';
  
  if (!url) return 'https://via.placeholder.com/300x200/111/d4af37?text=Sin+Archivo';
  
  // Si ya es una URL completa (http/https/Cloudinary/etc.)
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // Si es una ruta relativa de Express (/uploads/...)
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${RENDER_BASE_URL}${cleanPath}`;
}

async function cargarProductosPorCategoria(categoria) {
  const gridImg = document.getElementById('gridImagenes');
  const gridVid = document.getElementById('gridVideos');
  const gridPdf = document.getElementById('gridPdfs');
  const gridGeneral = document.getElementById('gridArea') || document.getElementById('gridProductos');

  try {
    const res = await fetch(`${API_URL}?categoria=${encodeURIComponent(categoria)}`);
    if (!res.ok) throw new Error('Error en la respuesta del servidor');

    const data = await res.json();
    const productos = data.productos || data || [];

    // Limpia los contenedores
    if (gridImg) gridImg.innerHTML = '';
    if (gridVid) gridVid.innerHTML = '';
    if (gridPdf) gridPdf.innerHTML = '';
    if (gridGeneral) gridGeneral.innerHTML = '';

    if (!Array.isArray(productos) || productos.length === 0) {
      if (gridGeneral) gridGeneral.innerHTML = '<p style="text-align:center; grid-column: 1/-1;">No hay publicaciones en esta categoría aún.</p>';
      return;
    }

    productos.forEach(prod => {
      const tipo = (prod.tipoArchivo || prod.tipo || '').toString().toLowerCase().trim();
      
      // Si el sitio usa el layout modular (3 Grids)
      if (gridImg || gridVid || gridPdf) {
        if ((tipo === 'pdf' || tipo === 'documento') && gridPdf) {
          gridPdf.appendChild(crearTarjetaArcade(prod, 'pdf'));
        } else if ((tipo === 'video' || tipo === 'mp4') && gridVid) {
          gridVid.appendChild(crearTarjetaArcade(prod, 'video'));
        } else if (gridImg) {
          gridImg.appendChild(crearTarjetaArcade(prod, 'imagen'));
        }
      } 
      // Si utiliza un layout clásico de 1 sola Grid
      else if (gridGeneral) {
        gridGeneral.appendChild(crearTarjetaGenerica(prod));
      }
    });

    // Control de visibilidad de secciones vacías
    toggleSectionVisibility('sec-imagenes', gridImg && gridImg.children.length > 0);
    toggleSectionVisibility('sec-videos', gridVid && gridVid.children.length > 0);
    toggleSectionVisibility('sec-pdfs', gridPdf && gridPdf.children.length > 0);

  } catch (error) {
    console.error('Error al cargar la categoría:', error);
  }
}

/* ==========================================================================
   CONSTRUCTORES DE TARJETAS (ESTILO ARCADE)
   ========================================================================== */

function crearTarjetaArcade(prod, tipo) {
  const card = document.createElement('div');
  card.className = 'card-arcade';
  const urlFinal = obtenerUrlCompleta(prod);
  const precioTexto = prod.precio ? formatoMXN.format(prod.precio) : '';

  if (tipo === 'pdf') {
    const canvasId = 'pdf-canvas-' + Math.random().toString(36).substr(2, 9);
    card.innerHTML = `
      <div class="media-wrapper" onclick="window.open('${urlFinal}', '_blank')">
        <div class="pdf-cover-container">
          <span class="pdf-badge">PORTADA PDF</span>
          <canvas id="${canvasId}"></canvas>
        </div>
      </div>
      <div class="card-info">
        <div class="card-title">${prod.nombre}</div>
        ${precioTexto ? `<div class="card-price">${precioTexto}</div>` : ''}
        <a href="${urlFinal}" target="_blank" class="btn-arcade">ABRIR DOCUMENTO</a>
      </div>
    `;
    setTimeout(() => renderPdfCover(urlFinal, canvasId), 150);
  } else if (tipo === 'video') {
    card.innerHTML = `
      <div class="media-wrapper" onclick="openModal('video', '${urlFinal}', '${escapeQuotes(prod.nombre)}')">
        <video src="${urlFinal}" muted preload="metadata"></video>
      </div>
      <div class="card-info">
        <div class="card-title">${prod.nombre}</div>
        <div class="card-price">${precioTexto || 'COTIZAR'}</div>
      </div>
    `;
  } else {
    card.innerHTML = `
      <div class="media-wrapper" onclick="openModal('img', '${urlFinal}', '${escapeQuotes(prod.nombre)}')">
        <img src="${urlFinal}" alt="${prod.nombre}" loading="lazy" onerror="this.onerror=null; this.src='https://via.placeholder.com/300x200/111/d4af37?text=Error+al+cargar';">
      </div>
      <div class="card-info">
        <div class="card-title">${prod.nombre}</div>
        <div class="card-price">${precioTexto || 'COTIZAR'}</div>
      </div>
    `;
  }

  return card;
}

function crearTarjetaGenerica(prod) {
  const card = document.createElement('div');
  card.className = 'card producto-card';
  const urlFinal = obtenerUrlCompleta(prod);
  const tipo = (prod.tipoArchivo || '').toLowerCase();

  let recursoHTML = '';
  if (tipo === 'video') {
    recursoHTML = `<video controls src="${urlFinal}" style="width:100%; height:200px; object-fit:cover; border-radius:6px;"></video>`;
  } else if (tipo === 'pdf') {
    recursoHTML = `<a href="${urlFinal}" target="_blank" class="pdf-link btn-pdf">📄 Ver Documento PDF</a>`;
  } else {
    recursoHTML = `<img src="${urlFinal}" alt="${prod.nombre}" style="width:100%; height:200px; object-fit:cover; border-radius:6px;">`;
  }

  const precioHTML = prod.precio 
    ? `<p class="price precio" style="color:#2ed573; font-weight:bold; font-size:1.2em; margin-top:10px;">${formatoMXN.format(prod.precio)}</p>` 
    : '';

  card.innerHTML = `
    ${recursoHTML}
    <h3 style="margin-top:10px;">${prod.nombre}</h3>
    <p style="color:#666; margin-top:5px;">${prod.descripcion || ''}</p>
    ${precioHTML}
  `;
  return card;
}

/* ==========================================================================
   RENDER PDF.JS Y CONTROLES DE INTERFAZ
   ========================================================================== */

async function renderPdfCover(pdfUrl, canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  if (typeof pdfjsLib === 'undefined') {
    canvas.parentElement.innerHTML = '<div style="color:var(--neon-cyan); font-family:var(--font-arcade); font-size:10px; text-align:center; padding:30px;">📄 DOCUMENTO PDF</div>';
    return;
  }

  try {
    const loadingTask = pdfjsLib.getDocument(pdfUrl);
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);

    const context = canvas.getContext('2d');
    const viewport = page.getViewport({ scale: 0.6 });

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({ canvasContext: context, viewport: viewport }).promise;
  } catch (error) {
    if (canvas && canvas.parentElement) {
      canvas.parentElement.innerHTML = '<div style="color:var(--neon-yellow); font-family:var(--font-arcade); font-size:9px; text-align:center; padding:30px;">📄 VISTA PREVIA PDF</div>';
    }
  }
}

function initTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const target = tab.getAttribute('data-tab');
      const secImg = document.getElementById('sec-imagenes');
      const secVid = document.getElementById('sec-videos');
      const secPdf = document.getElementById('sec-pdfs');

      if (secImg) secImg.style.display = (target === 'todos' || target === 'imagenes') ? 'block' : 'none';
      if (secVid) secVid.style.display = (target === 'todos' || target === 'videos') ? 'block' : 'none';
      if (secPdf) secPdf.style.display = (target === 'todos' || target === 'pdfs') ? 'block' : 'none';
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
      modal.style.display = 'none';
      const body = document.getElementById('modalBody');
      if (body) body.innerHTML = ''; 
    };

    modal.onclick = (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
        const body = document.getElementById('modalBody');
        if (body) body.innerHTML = '';
      }
    };
  }
}

function initMobileMenu() {
  const btn = document.getElementById('mobileMenuBtn');
  const nav = document.getElementById('navLinks');

  if (btn && nav) {
    btn.addEventListener('click', () => nav.classList.toggle('active'));
  }
}

function toggleSectionVisibility(id, visible) {
  const sec = document.getElementById(id);
  if (sec) sec.style.display = visible ? 'block' : 'none';
}

function escapeQuotes(str) {
  return str ? str.replace(/'/g, "\\'").replace(/"/g, '&quot;') : '';
}
