/**
 * ==============================================================================
 * DISEÑO LASER PRINT - SISTEMA DE INTERFAZ & ASISTENTE VIRTUAL "PIXEL AI v3.3"
 * ==============================================================================
 * ARCHIVO COMPLETO INTEGRADO Y CORREGIDO
 *
 * Tabla de Contenidos:
 * 1. Inicialización Global y Eventos DOM
 * 2. Sintetizador de Efectos de Sonido Retro 8-Bit (Web Audio API Arcade Engine)
 * 3. Control de Reproducción de GIF y Medios sin Caché
 * 4. Menú de Navegación Móvil Responsivo e Interactivo
 * 5. Carrusel 3D Infinito, Dinámico y Táctil (API / Fallback)
 * 6. Lightbox Arcade (Visor Ampliador de Muestras e Imágenes)
 * 7. Catálogo de Tarifas y Motor de Cotizaciones Dinámico
 * 8. Engine de Pre-Prensa y Validador Técnico de Archivos
 * 9. PIXEL AI ENGINE & INTERFAZ DE CHAT (INTEGRACIÓN WHATSAPP & UBICACIÓN)
 * 10. Módulo de Checkout Directo a WhatsApp
 * 11. FAQ Engine & Notificador Toast
 * 12. Bootstrapper Final
 */

const NUMERO_WHATSAPP = "5215500000000"; // Reemplaza con tu número a 10 dígitos más código de país

document.addEventListener('DOMContentLoaded', () => {
  LaserPrintApp.bootstrap();
});

/* ==========================================================================
   1. SINTETIZADOR DE EFECTOS DE SONIDO RETRO 8-BIT (WEB AUDIO API)
   ========================================================================== */

let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playArcadeSound(type) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    switch (type) {
      case 'hover':
        osc.type = 'square';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(480, now + 0.04);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.04);
        osc.start(now);
        osc.stop(now + 0.04);
        break;

      case 'click':
        osc.type = 'square';
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.setValueAtTime(780, now + 0.03);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.07);
        osc.start(now);
        osc.stop(now + 0.07);
        break;

      case 'carousel':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(660, now + 0.08);
        gain.gain.setValueAtTime(0.09, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
        break;

      case 'openModal':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(261.63, now);
        osc.frequency.setValueAtTime(329.63, now + 0.06);
        osc.frequency.setValueAtTime(392.00, now + 0.12);
        osc.frequency.setValueAtTime(523.25, now + 0.18);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
        break;

      case 'closeModal':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.15);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
        break;

      case 'menu':
        osc.type = 'square';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.setValueAtTime(900, now + 0.05);
        gain.gain.setValueAtTime(0.07, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.09);
        osc.start(now);
        osc.stop(now + 0.09);
        break;

      case 'success':
        osc.type = 'square';
        osc.frequency.setValueAtTime(987.77, now);
        osc.frequency.setValueAtTime(1318.51, now + 0.08);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
        break;

      case 'error':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.setValueAtTime(100, now + 0.08);
        gain.gain.setValueAtTime(0.09, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
        break;

      case 'typing':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(750 + Math.random() * 250, now);
        gain.gain.setValueAtTime(0.015, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.02);
        osc.start(now);
        osc.stop(now + 0.02);
        break;
    }
  } catch (e) {
    // Silenciar excepciones de audio
  }
}

function initRetroSFXSystem() {
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest('.nav-btn, .carousel-btn, .whatsapp-btn, .dot, .mobile-menu-btn, .pixel-toggle-btn, .pixel-prompt-btn, .pixel-send-btn, .pixel-quick-btn')) {
      playArcadeSound('hover');
    }
  });

  document.addEventListener('click', (e) => {
    if (e.target.closest('.nav-btn, .whatsapp-btn, .pixel-prompt-btn, .pixel-send-btn, .pixel-quick-btn')) {
      playArcadeSound('click');
    }
  });
}

/* ==========================================================================
   2. CONTROL DE REPRODUCCIÓN DE GIF EN RECARGA
   ========================================================================== */

function initGifPlayback() {
  const gifImg = document.getElementById('gifPresentacion');
  if (gifImg) {
    const timestamp = new Date().getTime();
    gifImg.src = `uploads/videos/presentacionreal.gif?v=${timestamp}`;
  }
}

/* ==========================================================================
   3. MENÚ MÓVIL INTERACTIVO
   ========================================================================== */

function initMobileMenu() {
  const menuBtn = document.getElementById('mobileMenuBtn');
  const navLinks = document.getElementById('navLinks');

  if (!menuBtn || !navLinks) return;

  menuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    playArcadeSound('menu');
    navLinks.classList.toggle('active');
    menuBtn.classList.toggle('open');
  });

  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('active');
      menuBtn.classList.remove('open');
    });
  });

  document.addEventListener('click', (e) => {
    if (!navLinks.contains(e.target) && !menuBtn.contains(e.target)) {
      navLinks.classList.remove('active');
      menuBtn.classList.remove('open');
    }
  });
}

/* ==========================================================================
   4. CARRUSEL 3D INFINITO Y DINÁMICO
   ========================================================================== */

async function cargarCarruselDinamico() {
  const track = document.getElementById('carouselTrack');
  if (!track) return;

  const BASE_URL = 'uploads/fotos/';
  let imagenesFotos = [];

  try {
    const response = await fetch('/api/productos');
    if (response.ok) {
      const data = await response.json();
      if (data.productos && data.productos.length > 0) {
        imagenesFotos = data.productos
          .filter(p => p.tipoArchivo === 'imagen' || !p.tipoArchivo)
          .map(p => ({
            url: p.archivoUrl ? (p.archivoUrl.startsWith('/') ? p.archivoUrl.slice(1) : p.archivoUrl) : `${BASE_URL}slide1.png`,
            alt: p.nombre || 'Diseño Laser Print - Trabajo Destacado'
          }));
      }
    }
  } catch (error) {
    console.warn('⚡ [CARRUSEL] Servidor dinámico no disponible. Usando catálogo estático.');
  }

  if (imagenesFotos.length === 0) {
    imagenesFotos = [
      { url: `${BASE_URL}slide1.png`, alt: 'Diseño Laser Print - Trabajo Destacado 1' },
      { url: `${BASE_URL}slide2.png`, alt: 'Diseño Laser Print - Trabajo Destacado 2' },
      { url: `${BASE_URL}slide3.png`, alt: 'Diseño Laser Print - Trabajo Destacado 3' },
      { url: `${BASE_URL}slide4.png`, alt: 'Diseño Laser Print - Trabajo Destacado 4' },
      { url: `${BASE_URL}slide5.png`, alt: 'Diseño Laser Print - Trabajo Destacado 5' }
    ];
  }

  track.innerHTML = imagenesFotos.map((item, index) => `
    <div class="carousel-slide-3d" data-index="${index}">
      <img src="${item.url}" 
           alt="${item.alt}" 
           onerror="this.onerror=null; this.src='https://via.placeholder.com/900x550/06070e/00f0ff?text=PRINT+WORK+${index + 1}';">
    </div>
  `).join('');

  initCarousel3D();
}

function initCarousel3D() {
  const track = document.getElementById('carouselTrack');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const dotsContainer = document.getElementById('carouselDots');

  if (!track) return;

  const slides = Array.from(track.children);
  const totalSlides = slides.length;
  if (totalSlides === 0) return;

  let currentIndex = 0;
  let autoplayTimer = null;

  if (dotsContainer) {
    dotsContainer.innerHTML = '';
    slides.forEach((_, index) => {
      const dot = document.createElement('div');
      dot.classList.add('dot');
      if (index === 0) dot.classList.add('active');
      dot.addEventListener('click', () => {
        playArcadeSound('carousel');
        moveToSlide(index);
        resetAutoplay();
      });
      dotsContainer.appendChild(dot);
    });
  }

  const dots = dotsContainer ? Array.from(dotsContainer.children) : [];

  function update3DSlides() {
    slides.forEach((slide, index) => {
      slide.classList.remove('active', 'prev', 'next', 'hidden');

      let offset = (index - currentIndex + totalSlides) % totalSlides;

      if (offset === 0) {
        slide.classList.add('active');
      } else if (offset === 1 || offset === -(totalSlides - 1)) {
        slide.classList.add('next');
      } else if (offset === totalSlides - 1 || offset === -1) {
        slide.classList.add('prev');
      } else {
        slide.classList.add('hidden');
      }
    });

    dots.forEach((dot, index) => {
      dot.classList.toggle('active', index === currentIndex);
    });
  }

  function moveToSlide(index) {
    currentIndex = (index + totalSlides) % totalSlides;
    update3DSlides();
  }

  function startAutoplay() {
    autoplayTimer = setInterval(() => {
      moveToSlide(currentIndex + 1);
    }, 5000);
  }

  function resetAutoplay() {
    clearInterval(autoplayTimer);
    startAutoplay();
  }

  if (nextBtn) {
    nextBtn.onclick = (e) => {
      e.stopPropagation();
      playArcadeSound('carousel');
      moveToSlide(currentIndex + 1);
      resetAutoplay();
    };
  }

  if (prevBtn) {
    prevBtn.onclick = (e) => {
      e.stopPropagation();
      playArcadeSound('carousel');
      moveToSlide(currentIndex - 1);
      resetAutoplay();
    };
  }

  let touchStartX = 0;
  let touchEndX = 0;

  track.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  track.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    if (touchStartX - touchEndX > 40) {
      playArcadeSound('carousel');
      moveToSlide(currentIndex + 1);
      resetAutoplay();
    } else if (touchEndX - touchStartX > 40) {
      playArcadeSound('carousel');
      moveToSlide(currentIndex - 1);
      resetAutoplay();
    }
  }, { passive: true });

  update3DSlides();
  startAutoplay();
}

/* ==========================================================================
   5. VISOR DE IMÁGENES AMPLIADAS ARCADE (LIGHTBOX)
   ========================================================================== */

function initLightbox() {
  const modal = document.getElementById('imageModal');
  const modalImg = document.getElementById('imgModalAmpliada');
  const captionText = document.getElementById('captionModal');
  const closeModal = document.getElementById('closeModal');

  if (!modal || !modalImg) return;

  document.body.addEventListener('click', (e) => {
    if (e.target.matches('.carousel-slide-3d img')) {
      const img = e.target;
      playArcadeSound('openModal');
      modal.style.display = 'flex';
      modalImg.src = img.src;
      captionText.textContent = img.alt || '★ DISEÑO LASER PRINT DESTACADO ★';
      document.body.style.overflow = 'hidden';
    }
  });

  const hideModal = () => {
    playArcadeSound('closeModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
  };

  if (closeModal) {
    closeModal.addEventListener('click', hideModal);
  }

  window.addEventListener('click', (e) => {
    if (e.target === modal) hideModal();
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.style.display === 'flex') {
      hideModal();
    }
  });
}

/* ==========================================================================
   6. BASE DE DATOS DE PRODUCTOS Y MOTOR DE COTIZACIONES
   ========================================================================== */

const LASER_PRINT_DB = {
  version: "3.3.0",
  moneda: "MXN",
  
  categorias: {
    GRAN_FORMATO: {
      id: "gf",
      nombre: "Gran Formato & Lonas",
      productos: {
        LONA_440G: {
          id: "lona_440",
          nombre: "Lona Impresa High Res",
          unidad: "m2",
          precioBaseM2: 85,
          minimoM2: 1,
          tiempoEntregaHrs: 24
        },
        VINIL_IMPRESO: {
          id: "vinil_imp",
          nombre: "Vinil Blanco Brillante/Mate",
          unidad: "m2",
          precioBaseM2: 300,
          minimoM2: 0.5,
          tiempoEntregaHrs: 24
        }
      }
    },
    SUBLIMACION: {
      id: "sub",
      nombre: "Sublimación Textil",
      productos: {
        SUBLIMACION_M2: {
          id: "sub_m2",
          nombre: "Sublimación por m2",
          unidad: "m2",
          precioBaseM2: 250,
          minimoM2: 0.1,
          tiempoEntregaHrs: 48
        }
      }
    },
    TEXTIL_DTF: {
      id: "dtf",
      nombre: "Impresión Textil & DTF",
      productos: {
        DTF_TEXTIL: {
          id: "dtf_textil",
          nombre: "DTF Textil (57 cm ancho x 100 cm alto)",
          unidad: "metro_lineal",
          precioMetro: 230,
          minimoMetros: 0.5,
          anchoM: 0.57,
          tiempoEntregaHrs: 24
        }
      }
    },
    STICKERS: {
      id: "stickers",
      nombre: "Vinil para Sticker",
      productos: {
        VINIL_STICKER: {
          id: "vinil_sticker",
          nombre: "Vinil para Sticker (1.5 m / 150 cm ancho x 1 m / 100 cm alto)",
          unidad: "metro_lineal",
          precioMetro: 450,
          minimoMetros: 0.5,
          anchoM: 1.5,
          tiempoEntregaHrs: 24
        }
      }
    }
  }
};

const CotizadorEngine = {
  calcularGranFormato: function(productoKey, anchoM, altoM, cantidad = 1) {
    let prod = LASER_PRINT_DB.categorias.GRAN_FORMATO.productos[productoKey];
    if (!prod && productoKey === 'SUBLIMACION_M2') {
      prod = LASER_PRINT_DB.categorias.SUBLIMACION.productos.SUBLIMACION_M2;
    }

    if (!prod) {
      return { error: true, mensaje: "Producto no encontrado." };
    }

    const m2Real = anchoM * altoM;
    const areaM2 = Math.max(m2Real, prod.minimoM2 || 1);
    let subtotalTotal = (areaM2 * prod.precioBaseM2) * cantidad;

    return {
      error: false,
      producto: prod.nombre,
      ancho: anchoM,
      alto: altoM,
      areaM2Unidad: areaM2.toFixed(2),
      cantidad: cantidad,
      precioM2: prod.precioBaseM2,
      total: subtotalTotal.toFixed(2),
      moneda: LASER_PRINT_DB.moneda,
      tiempoEntrega: `2 a 3 días hábiles`,
      aplicoMinimo: m2Real < prod.minimoM2
    };
  },

  calcularDTFTextil: function(metrosLineales) {
    const prod = LASER_PRINT_DB.categorias.TEXTIL_DTF.productos.DTF_TEXTIL;
    const metrosCalculo = Math.max(metrosLineales, prod.minimoMetros);
    const total = metrosCalculo * prod.precioMetro;

    return {
      error: false,
      producto: prod.nombre,
      metrosSolicitados: metrosLineales,
      metrosCobrados: metrosCalculo,
      precioPorMetro: prod.precioMetro,
      total: total.toFixed(2),
      moneda: LASER_PRINT_DB.moneda,
      aplicoMinimo: metrosLineales < prod.minimoMetros
    };
  },

  calcularVinilSticker: function(metrosLineales) {
    const prod = LASER_PRINT_DB.categorias.STICKERS.productos.VINIL_STICKER;
    const metrosCalculo = Math.max(metrosLineales, prod.minimoMetros);
    const total = metrosCalculo * prod.precioMetro;

    return {
      error: false,
      producto: prod.nombre,
      metrosSolicitados: metrosLineales,
      metrosCobrados: metrosCalculo,
      precioPorMetro: prod.precioMetro,
      total: total.toFixed(2),
      moneda: LASER_PRINT_DB.moneda,
      aplicoMinimo: metrosLineales < prod.minimoMetros
    };
  },

  parsearMedidasDesdeTexto: function(texto) {
    const regexMetros = /(\d+(?:[\.,]\d+)?)\s*(?:m|metro|metros)?\s*x\s*(\d+(?:[\.,]\d+)?)\s*(?:m|metro|metros)/i;
    const regexCM = /(\d+(?:[\.,]\d+)?)\s*cm\s*x\s*(\d+(?:[\.,]\d+)?)\s*cm/i;

    let matchCM = texto.match(regexCM);
    if (matchCM) {
      return {
        ancho: parseFloat(matchCM[1].replace(',', '.')) / 100,
        alto: parseFloat(matchCM[2].replace(',', '.')) / 100,
        unidadOriginal: 'cm'
      };
    }

    let matchM = texto.match(regexMetros);
    if (matchM) {
      return {
        ancho: parseFloat(matchM[1].replace(',', '.')),
        alto: parseFloat(matchM[2].replace(',', '.')),
        unidadOriginal: 'm'
      };
    }

    const regexMetrosLineales = /(\d+(?:[\.,]\d+)?)\s*(?:m|metro|metros)\b/i;
    let matchLineal = texto.match(regexMetrosLineales);
    if (matchLineal) {
      return {
        metrosLineales: parseFloat(matchLineal[1].replace(',', '.')),
        unidadOriginal: 'metro_lineal'
      };
    }

    return null;
  }
};

/* ==========================================================================
   7. ENGINE DE PRE-PRENSA Y VALIDACIÓN TÉCNICA
   ========================================================================== */

const PrePrensaValidator = {
  inspeccionarArchivoUsuario: function(file) {
    return new Promise((resolve) => {
      if (!file) {
        resolve({ error: true, mensaje: "No se proporcionó ningún archivo." });
        return;
      }

      const tamanoMB = file.size / (1024 * 1024);
      if (tamanoMB > 150) {
        resolve({
          error: true,
          mensaje: `❌ El archivo excede el límite máximo de 150 MB.`
        });
        return;
      }

      resolve({
        error: false,
        nombreArchivo: file.name,
        tamanoMB: tamanoMB.toFixed(2),
        diagnostico: "📄 ARCHIVO RECIBIDO: Listo para validación de impresión."
      });
    });
  }
};

/* ==========================================================================
   8. BASE DE CONOCIMIENTO MAESTRA DE PIXEL AI
   ========================================================================== */

const AVISO_COTIZACION_VARIA = `<br><br>⚠️ <i><b>Aviso importante:</b> El costo total estimado puede variar según especificaciones finales. El servicio de diseño tiene costo extra (puede variar dependiendo la complejidad). Para una cotización exacta dirígete a la sucursal o escríbenos vía WhatsApp.</i>`;

const PIXEL_KNOWLEDGE_BASE = {
  saludos: {
    keywords: ['hola', 'buenas', 'buenos dias', 'buenas tardes', 'buenas noches', 'saludos', 'hello', 'hey', 'hi'],
    title: '¡HOLA! BIENVENIDO',
    response: `<b>👾 PIXEL AI:</b> ¡Hola! 👋 Bienvenid@ a <b>Diseño Laser Print</b>.<br><br>
    ¿En qué te puedo ayudar hoy? Escribe la medida que buscas cotizar o selecciona una opción rápida.<br><br>
    🎨 <i>Ten en cuenta que si requieres servicio de diseño, este tiene un costo extra dependiendo la complejidad.</i>`
  },
  preparar_archivos: {
    keywords: ['como preparo mis archivos', 'preparar archivos', 'formato de archivo', 'formatos', 'preparo mis archivos', 'como mando mi archivo', 'como envio mi archivo', 'extensiones'],
    title: 'GUÍA DE PREPARACIÓN DE ARCHIVOS',
    response: `<b>📁 PIXEL AI - GUÍA DE FORMATOS ACEPTADOS:</b><br><br>
    • <b>DTF Textil / UV:</b> PNG, PDF SIN FONDO<br>
    • <b>Stickers:</b> PDF, AI<br>
    • <b>Lona:</b> JPEG, JPG, PDF, AI<br>
    • <b>Sublimación:</b> PDF, AI<br>
    • <b>Corte Láser:</b> DXF, AI, PDF EN VECTOR<br>
    • <b>Coroplast:</b> PDF, AI<br><br>
    🎨 <i>El diseño tiene costo extra y puede variar dependiendo el diseño.</i><br><br>
    📲 Para enviarnos tus archivos directos o cotizar:<br>
    👉 <a href="https://wa.me/${NUMERO_WHATSAPP}?text=Hola,%20quiero%20enviar%20mis%20archivos%20para%20revision" target="_blank" style="color:#00f0ff; font-weight:bold; text-decoration:underline;">Enviar archivos por WhatsApp</a>`
  },
  volantes: {
    keywords: ['volante', 'volantes', 'flyer', 'flyers', 'propaganda'],
    title: 'VOLANTES PUBLICITARIOS',
    response: `<b>📄 PIXEL AI - VOLANTES:</b><br><br>
    Manejamos diferentes medidas para tus impresiones:<br>
    • <b>Tamaño Carta</b><br>
    • <b>Media Carta</b><br>
    • <b>Un Cuarto de Carta (1/4)</b><br><br>
    🎨 <i>El servicio de diseño tiene costo extra y varía según la complejidad del proyecto.</i><br><br>
    📲 Obtén tu cotización exacta por WhatsApp:<br>
    👉 <a href="https://wa.me/${NUMERO_WHATSAPP}?text=Hola,%20quiero%20cotizar%20volantes" target="_blank" style="color:#00f0ff; font-weight:bold; text-decoration:underline;">Cotizar Volantes por WhatsApp</a>`
  },
  tarjetas_presentacion: {
    keywords: ['tarjeta', 'tarjetas', 'tarjetas de presentacion', 'tarjeta de presentacion', 'presentacion'],
    title: 'TARJETAS DE PRESENTACIÓN',
    response: `<b>🎴 PIXEL AI - TARJETAS DE PRESENTACIÓN:</b><br><br>
    Contamos con los mejores acabados profesionales:<br>
    • <b>Laminadas</b><br>
    • <b>Barniz a Registro</b><br><br>
    🎨 <i>El diseño tiene un costo extra dependiendo la complejidad del diseño.</i><br><br>
    📲 Solicita tu cotización directa por WhatsApp:<br>
    👉 <a href="https://wa.me/${NUMERO_WHATSAPP}?text=Hola,%20quiero%20cotizar%20tarjetas%20de%20presentacion" target="_blank" style="color:#00f0ff; font-weight:bold; text-decoration:underline;">Cotizar Tarjetas por WhatsApp</a>`
  },
  notas_remision: {
    keywords: ['nota', 'notas', 'notas de remision', 'nota de remision', 'remision', 'talonario', 'notitas'],
    title: 'NOTAS DE REMISIÓN',
    response: `<b>📝 PIXEL AI - NOTAS DE REMISIÓN:</b><br><br>
    Imprimimos tus notas de remisión personalizadas para tu negocio.<br><br>
    🎨 <i>El diseño tiene costo extra que puede variar según lo requieras.</i><br><br>
    📲 Para obtener una cotización rápida por WhatsApp:<br>
    👉 <a href="https://wa.me/${NUMERO_WHATSAPP}?text=Hola,%20quiero%20cotizar%20notas%20de%20remision" target="_blank" style="color:#00f0ff; font-weight:bold; text-decoration:underline;">Cotizar Notas de Remisión por WhatsApp</a>`
  },
  whatsapp: {
    keywords: ['whatsapp', 'contacto', 'celular', 'telefono', 'hablar con alguien', 'cotizar por whatsapp', 'cotizacion whatsapp'],
    title: 'CONTACTO POR WHATSAPP',
    response: `<b>📲 PIXEL AI - CONTACTO DIRECTO:</b><br><br>
    Puedes realizar tu cotización y pedido en tiempo real platicando directamente con nosotros.<br><br>
    👉 <a href="https://wa.me/${NUMERO_WHATSAPP}?text=Hola%20Dise%C3%B1o%20Laser%20Print,%20quiero%20cotizar%20un%20trabajo" target="_blank" style="color:#00f0ff; font-weight:bold; text-decoration:underline;">Haz clic aquí para abrir WhatsApp Directo</a>`
  },
  horarios_ubicacion: {
    keywords: ['horario', 'horarios', 'abierto', 'hora', 'atienden', 'dias', 'sabado', 'domingo', 'abren', 'cierran', 'ubicacion', 'ubicación', 'donde estan', 'donde quedan', 'direccion', 'dirección', 'sucursal'],
    title: 'HORARIOS Y UBICACIÓN',
    response: `<b>👾 PIXEL AI - HORARIOS Y UBICACIÓN:</b><br><br>
    ⏰ <b>Horarios de atención:</b><br>
    • <b>Lunes a Viernes:</b> 9:00 am a 6:00 pm<br>
    • <b>Sábados:</b> 9:00 am a 2:00 pm<br>
    • <b>Domingos:</b> Cerrado<br><br>
    📍 <b>Ubicación:</b> Recuerda que la dirección exacta de nuestra sucursal con mapa interactivo la encuentras <b>hasta el final de esta misma página web</b>.`
  },
  dtf_uv: {
    keywords: ['dtf uv', 'uv dtf', 'impresion uv', 'uv'],
    title: 'DTF UV - ATENCIÓN DIRECTA',
    response: `<b>✨ PIXEL AI - DTF UV:</b><br><br>
    Para cotizar <b>DTF UV</b> o recibir atención especializada de este material, por favor comunícate directamente con nuestro equipo vía WhatsApp.<br><br>
    👉 <a href="https://wa.me/${NUMERO_WHATSAPP}?text=Hola,%20me%20interesa%20cotizar%20DTF%20UV" target="_blank" style="color:#00f0ff; font-weight:bold; text-decoration:underline;">Hablar con contacto directo por WhatsApp</a>`
  },
  dtf_textil: {
    keywords: ['dtf', 'dtf textil', 'textil'],
    title: 'DTF TEXTIL',
    response: `<b>👕 PIXEL AI - DTF TEXTIL:</b><br><br>
    📏 <b>Formato:</b> El metro mide <b>57 cm de ancho x 100 cm de alto</b>.<br>
    💵 <b>Costo:</b> <b>$230 MXN</b> por metro lineal.<br>
    ⚠️ <b>Venta mínima:</b> Mínimo medio metro (0.5 m).<br>
    📅 <b>Tiempo de entrega:</b> 2 a 3 días hábiles.<br><br>
    💡 <i>Para cotizar escribe por ejemplo: <b>"1 metro de dtf textil"</b> o <b>"dtf textil 0.5m"</b>.</i>`
  },
  vinil_sticker: {
    keywords: ['sticker', 'stickers', 'vinil sticker', 'etiquetas', 'calcomania', 'calcomanias'],
    title: 'VINIL PARA STICKER',
    response: `<b>🏷️ PIXEL AI - VINIL PARA STICKERS:</b><br><br>
    📏 <b>Formato:</b> El metro mide <b>1.5 m (150 cm) de ancho x 1 m (100 cm) de alto</b>.<br>
    💵 <b>Costo:</b> <b>$450 MXN</b> por metro lineal.<br>
    ⚠️ <b>Venta mínima:</b> Mínimo medio metro (0.5 m).<br>
    📅 <b>Tiempo de entrega:</b> 2 a 3 días hábiles.<br><br>
    💡 <i>Para cotizar escribe por ejemplo: <b>"1 metro de vinil sticker"</b> o <b>"vinil sticker 0.5m"</b>.</i>`
  },
  letreros_led: {
    keywords: ['led', 'letrero', 'letreros', 'letrero led', 'luz led', 'mdf + lona', 'mdf y acrilico', 'letrero mdf'],
    title: 'LETREROS CON LUZ LED',
    response: `<b>💡 PIXEL AI - LETREROS LED:</b><br><br>
    Manejamos letreros personalizados en <b>MDF + Lona</b>, <b>MDF</b> y <b>Acrílico</b>.<br><br>
    📲 Cotízalo directamente por WhatsApp enviándonos tus referencias:<br>
    👉 <a href="https://wa.me/${NUMERO_WHATSAPP}?text=Hola,%20me%20interesa%20cotizar%20un%20letrero%20LED" target="_blank" style="color:#00f0ff; font-weight:bold; text-decoration:underline;">Cotizar Letrero por WhatsApp</a>`
  },
  sublimacion: {
    keywords: ['sublimacion', 'sublimación', 'sublimar'],
    title: 'SUBLIMACIÓN',
    response: `<b>📊 PIXEL AI - SUBLIMACIÓN:</b><br><br>
    💵 <b>Costo:</b> <b>$250 MXN por m²</b>.<br>
    📅 <b>Tiempo de entrega:</b> 2 a 3 días hábiles.<br><br>
    💡 <i>Para un cálculo exacto escribe por ejemplo: <b>"sublimacion de 2x2m"</b>.</i>`
  },
  lona: {
    keywords: ['lona', 'lonas', 'lona impresa', 'publicidad exterior'],
    title: 'LONA IMPRESA',
    response: `<b>📊 PIXEL AI - LONA IMPRESA:</b><br><br>
    📐 <b>Regla de costo:</b> El precio base es de <b>$85 MXN por m²</b> (si tu diseño mide menos de 1 m², se cobra el m² completo).<br>
    📅 <b>Tiempo de entrega:</b> 2 a 3 días hábiles.<br><br>
    👉 <i>Escribe tus medidas como: <b>"lona de 1.5 x 2m"</b>.</i>`
  },
  corte_laser: {
    keywords: ['corte laser', 'grabado laser', 'laser', 'corte mdf', 'acrilico 3mm', 'corte laser mdf'],
    title: 'CORTE Y GRABADO LÁSER',
    response: `<b>✂️ PIXEL AI - CORTE & GRABADO LÁSER:</b><br><br>
    Trabajamos MDF, Acrílico, Papel Cascarón y Cartón. (En Aluminio únicamente grabado).<br><br>
    📲 Envíanos tu archivo para cotización directa:<br>
    👉 <a href="https://wa.me/${NUMERO_WHATSAPP}?text=Hola,%20quiero%20cotizar%20un%20corte%20laser" target="_blank" style="color:#00f0ff; font-weight:bold; text-decoration:underline;">Enviar Archivo a WhatsApp</a>`
  }
};

/* ==========================================================================
   9. PIXEL AI ENGINE & INTERFAZ DE CHAT INTERACTIVA
   ========================================================================== */

const PixelUI = {
  chatWidget: null,
  chatBox: null,
  inputField: null,
  fileInput: null,
  sendBtn: null,
  statusIndicator: null,
  isProcessing: false,

  init: function() {
    this.chatWidget = document.getElementById('pixelChatWidget');
    this.chatBox = document.getElementById('pixelChatMessages');
    this.inputField = document.getElementById('pixelInput');
    this.fileInput = document.getElementById('pixelFileInput');
    this.sendBtn = document.getElementById('pixelSendBtn');
    this.statusIndicator = document.getElementById('pixelBotStatus');

    this.bindEvents();
  },

  bindEvents: function() {
    const toggleElements = document.querySelectorAll('#pixelToggleBtn, .pixel-toggle-btn, [data-action="open-pixel"]');

    toggleElements.forEach(element => {
      element.addEventListener('click', (e) => {
        e.preventDefault();
        this.toggleChat();
      });
    });

    const closeBtn = document.getElementById('pixelCloseBtn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.ocultarChat());
    }

    if (this.sendBtn) {
      this.sendBtn.addEventListener('click', () => this.handleUserSubmit());
    }

    if (this.inputField) {
      this.inputField.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.handleUserSubmit();
        } else {
          playArcadeSound('typing');
        }
      });
    }

    if (this.fileInput) {
      this.fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
    }

    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.pixel-prompt-btn, .pixel-quick-btn');
      if (btn) {
        e.preventDefault();
        const promptText = btn.getAttribute('data-prompt') || btn.innerText.trim();
        this.enviarOpcion(promptText);
      }
    });
  },

  toggleChat: function() {
    if (!this.chatWidget) return;
    const isOpen = this.chatWidget.classList.contains('active') || this.chatWidget.classList.contains('open');
    if (isOpen) this.ocultarChat(); else this.mostrarChat();
  },

  mostrarChat: function() {
    if (!this.chatWidget) return;
    playArcadeSound('openModal');
    this.chatWidget.classList.add('active', 'open');
    this.chatWidget.style.display = 'flex';
    if (this.inputField) setTimeout(() => this.inputField.focus(), 150);
  },

  ocultarChat: function() {
    if (!this.chatWidget) return;
    playArcadeSound('closeModal');
    this.chatWidget.classList.remove('active', 'open');
    this.chatWidget.style.display = 'none';
  },

  enviarOpcion: function(texto) {
    if (this.inputField) {
      this.inputField.value = texto;
      this.handleUserSubmit();
    } else {
      this.procesarMensajeDirecto(texto);
    }
  },

  handleUserSubmit: function() {
    if (this.isProcessing) return;

    const queryText = this.inputField ? this.inputField.value.trim() : '';
    if (!queryText) return;

    this.procesarMensajeDirecto(queryText);
    if (this.inputField) this.inputField.value = '';
  },

  procesarMensajeDirecto: function(queryText) {
    this.appendMessage('user', queryText);
    playArcadeSound('click');

    this.setProcessingState(true);

    setTimeout(() => {
      this.procesarRespuestaInteligente(queryText);
    }, 400);
  },

  handleFileUpload: async function(e) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    this.appendMessage('user', `📎 Adjuntando archivo: <b>${file.name}</b>`);
    
    const validacion = await PrePrensaValidator.inspeccionarArchivoUsuario(file);
    if (validacion.error) {
      this.appendMessage('bot', validacion.mensaje);
      playArcadeSound('error');
    } else {
      this.appendMessage('bot', `✅ Archivo <b>${file.name}</b> recibido correctamente.<br>Puedes enviárnoslo también a WhatsApp para confirmar detalles.`);
      playArcadeSound('success');
    }
  },

  setProcessingState: function(active) {
    this.isProcessing = active;
    if (this.statusIndicator) {
      this.statusIndicator.textContent = active ? 'Pixel AI pensando...' : 'Pixel AI - En Línea';
    }
  },

  appendMessage: function(sender, htmlContent) {
    if (!this.chatBox) return;

    const msgDiv = document.createElement('div');
    msgDiv.className = `pixel-msg ${sender === 'user' ? 'pixel-user-msg user-msg' : 'pixel-bot-msg bot-msg'}`;
    
    msgDiv.innerHTML = `
      <div class="pixel-msg-bubble">${htmlContent}</div>
    `;

    this.chatBox.appendChild(msgDiv);
    this.chatBox.scrollTop = this.chatBox.scrollHeight;
  },

  procesarRespuestaInteligente: function(textoUsuario) {
    const textoLower = textoUsuario.toLowerCase().trim();

    // 1. Solicitud directa de WhatsApp
    if (textoLower.includes('whatsapp') || textoLower.includes('cotizar por whatsapp')) {
      const urlWsp = `https://wa.me/${NUMERO_WHATSAPP}?text=Hola%20Dise%C3%B1o%20Laser%20Print,%20quiero%20cotizar%20un%20trabajo`;
      const wspHtml = `
        📲 <b>CONTACTO DIRECTO WHATSAPP</b><br><br>
        Haz clic en el siguiente enlace para abrir el chat de WhatsApp con un asesor:<br><br>
        👉 <a href="${urlWsp}" target="_blank" style="color:#00f0ff; font-weight:bold; text-decoration:underline;">Abrir Chat de WhatsApp Directo</a>
      `;
      this.appendMessage('bot', wspHtml);
      playArcadeSound('success');
      this.setProcessingState(false);
      return;
    }

    // 2. Redirección específica para DTF UV
    if (textoLower.includes('dtf uv') || textoLower.includes('uv dtf')) {
      const urlWspUv = `https://wa.me/${NUMERO_WHATSAPP}?text=Hola,%20quiero%20cotizar%20DTF%20UV%20con%20contacto%20directo`;
      const uvHtml = `
        ✨ <b>COTIZACIÓN DTF UV</b><br><br>
        Para la cotización de <b>DTF UV</b> solicitamos hablar directamente con nuestro contacto de atención personalizada.<br><br>
        👉 <a href="${urlWspUv}" target="_blank" style="color:#00f0ff; font-weight:bold; text-decoration:underline;">Hablar con contacto directo por WhatsApp</a>
      `;
      this.appendMessage('bot', uvHtml);
      playArcadeSound('success');
      this.setProcessingState(false);
      return;
    }

    // 3. Motor de Cotizaciones con cálculo dinámico
    if (typeof CotizadorEngine !== 'undefined') {

      // A) Cotización de DTF Textil
      if (textoLower.includes('dtf')) {
        const medidas = CotizadorEngine.parsearMedidasDesdeTexto(textoUsuario);
        let metros = 1;

        if (medidas) {
          if (medidas.metrosLineales) metros = medidas.metrosLineales;
          else if (medidas.alto) metros = medidas.alto;
        }

        const resDtf = CotizadorEngine.calcularDTFTextil(metros);
        const msgWsp = encodeURIComponent(`Hola, quiero solicitar cotización exacta de DTF Textil para ${resDtf.metrosSolicitados}m`);

        const dtfHtml = `
          👕 <b>COTIZACIÓN ESTIMADA - DTF TEXTIL</b><br><br>
          • <b>Especificaciones:</b> 57 cm ancho x 100 cm alto por metro.<br>
          • <b>Metros solicitados:</b> ${resDtf.metrosSolicitados} m<br>
          • <b>Metros calculados:</b> ${resDtf.metrosCobrados} m ${resDtf.aplicoMinimo ? '(Venta mínima: 0.5m)' : ''}<br>
          • <b>Precio por metro:</b> $${resDtf.precioPorMetro} MXN<br>
          • <b>Total Estimado:</b> <b>$${resDtf.total} MXN</b>
          ${AVISO_COTIZACION_VARIA}<br><br>
          📲 <a href="https://wa.me/${NUMERO_WHATSAPP}?text=${msgWsp}" target="_blank" style="color:#00f0ff; font-weight:bold; text-decoration:underline;">Confirmar cotización por WhatsApp</a>
        `;
        this.appendMessage('bot', dtfHtml);
        playArcadeSound('success');
        this.setProcessingState(false);
        return;
      }

      // B) Cotización de Vinil para Sticker
      if (textoLower.includes('sticker') || textoLower.includes('stickers') || textoLower.includes('calcomania') || textoLower.includes('calcomanías')) {
        const medidas = CotizadorEngine.parsearMedidasDesdeTexto(textoUsuario);
        let metros = 1;

        if (medidas) {
          if (medidas.metrosLineales) metros = medidas.metrosLineales;
          else if (medidas.alto) metros = medidas.alto;
        }

        const resSticker = CotizadorEngine.calcularVinilSticker(metros);
        const msgWsp = encodeURIComponent(`Hola, quiero solicitar cotización exacta de Vinil Sticker para ${resSticker.metrosSolicitados}m`);

        const stickerHtml = `
          🏷️ <b>COTIZACIÓN ESTIMADA - VINIL PARA STICKERS</b><br><br>
          • <b>Especificaciones:</b> 1.5 m (150 cm) ancho x 1 m (100 cm) alto por metro.<br>
          • <b>Metros solicitados:</b> ${resSticker.metrosSolicitados} m<br>
          • <b>Metros calculados:</b> ${resSticker.metrosCobrados} m ${resSticker.aplicoMinimo ? '(Venta mínima: 0.5m)' : ''}<br>
          • <b>Precio por metro:</b> $${resSticker.precioPorMetro} MXN<br>
          • <b>Total Estimado:</b> <b>$${resSticker.total} MXN</b>
          ${AVISO_COTIZACION_VARIA}<br><br>
          📲 <a href="https://wa.me/${NUMERO_WHATSAPP}?text=${msgWsp}" target="_blank" style="color:#00f0ff; font-weight:bold; text-decoration:underline;">Confirmar cotización por WhatsApp</a>
        `;
        this.appendMessage('bot', stickerHtml);
        playArcadeSound('success');
        this.setProcessingState(false);
        return;
      }

      // C) Gran Formato, Lona y Sublimación por m²
      const medidas = CotizadorEngine.parsearMedidasDesdeTexto(textoUsuario);
      if (medidas && medidas.ancho && medidas.alto) {
        let prodKey = 'LONA_440G';
        if (textoLower.includes('vinil')) prodKey = 'VINIL_IMPRESO';
        if (textoLower.includes('sublimacion') || textoLower.includes('sublimación')) prodKey = 'SUBLIMACION_M2';

        const res = CotizadorEngine.calcularGranFormato(prodKey, medidas.ancho, medidas.alto, 1);
        if (!res.error) {
          const msgWsp = encodeURIComponent(`Hola, solicito cotización para: ${res.producto} de ${res.ancho}m x ${res.alto}m (Total estimado: $${res.total} ${res.moneda})`);
          
          const cotizacionHtml = `
            📊 <b>COTIZACIÓN ESTIMADA</b><br><br>
            • <b>Producto:</b> ${res.producto}<br>
            • <b>Medidas:</b> ${res.ancho}m x ${res.alto}m (${res.areaM2Unidad} m²)<br>
            • <b>Total Estimado:</b> <b>$${res.total} ${res.moneda}</b><br>
            ${res.aplicoMinimo ? '⚠️ <i>Se aplica cobro mínimo por m².</i>' : ''}
            ${AVISO_COTIZACION_VARIA}<br><br>
            📲 <a href="https://wa.me/${NUMERO_WHATSAPP}?text=${msgWsp}" target="_blank" style="color:#00f0ff; font-weight:bold; text-decoration:underline;">Solicitar cotización exacta por WhatsApp</a>
          `;
          this.appendMessage('bot', cotizacionHtml);
          playArcadeSound('success');
          this.setProcessingState(false);
          return;
        }
      }
    }

    // 4. Coincidencia por Base de Conocimientos
    if (typeof PIXEL_KNOWLEDGE_BASE !== 'undefined') {
      for (const key in PIXEL_KNOWLEDGE_BASE) {
        const item = PIXEL_KNOWLEDGE_BASE[key];
        if (item.keywords.some(kw => textoLower.includes(kw))) {
          this.appendMessage('bot', item.response);
          playArcadeSound('hover');
          this.setProcessingState(false);
          return;
        }
      }
    }

    // 5. Fallback para Consultas No Entendidas (Enlace directo a WhatsApp)
    const msgFallback = encodeURIComponent(`Hola Diseño Laser Print, tengo la siguiente duda: "${textoUsuario}"`);
    const urlFallbackWsp = `https://wa.me/${NUMERO_WHATSAPP}?text=${msgFallback}`;
    
    const respuestaFallback = `
      <b>👾 PIXEL AI:</b> No pude comprender con precisión tu consulta.<br><br>
      Para asegurarte la información correcta y resolver tus dudas de inmediato, por favor escríbenos directamente a WhatsApp:<br><br>
      👉 <a href="${urlFallbackWsp}" target="_blank" style="color:#00f0ff; font-weight:bold; text-decoration:underline;">Haz clic aquí para consultarlo vía WhatsApp</a><br><br>
      📍 <i>Nota: Si buscas la dirección física de la sucursal, la puedes encontrar detallada <b>al final de esta página web</b>.</i>
    `;
    this.appendMessage('bot', respuestaFallback);
    playArcadeSound('hover');
    this.setProcessingState(false);
  }
};

function initPixelAI() {
  PixelUI.init();
}

/* ==========================================================================
   10. MÓDULO DE CHECKOUT DIRECTO A WHATSAPP
   ========================================================================== */

const WhatsAppCheckout = {
  abrirChatGeneral: function() {
    const urlApi = `https://wa.me/${NUMERO_WHATSAPP}?text=Hola%20Dise%C3%B1o%20Laser%20Print,%20quiero%20mas%20informacion`;
    window.open(urlApi, '_blank');
  }
};

/* ==========================================================================
   11. FAQ ENGINE & NOTIFICADOR TOAST
   ========================================================================== */

const FAQEngine = {
  renderizarSeccionFAQ: function(contenedorId = 'faqContainer') {
    const container = document.getElementById(contenedorId);
    if (!container) return;
    container.innerHTML = `<p style="color:#a0a5b5; font-size:14px;">Centro de ayuda interactivo.</p>`;
  }
};

const PixelNotifier = {
  container: null,

  init: function() {
    this.container = document.getElementById('pixelToastContainer');
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'pixelToastContainer';
      this.container.style.cssText = `position:fixed; bottom:20px; right:20px; z-index:999999; display:flex; flex-direction:column; gap:10px;`;
      document.body.appendChild(this.container);
    }
  },

  show: function(message, duration = 3000) {
    if (!this.container) this.init();
    const toast = document.createElement('div');
    toast.style.cssText = `background:#0f111a; color:#fff; border:1px solid #00f0ff; padding:10px 15px; border-radius:5px; font-size:13px;`;
    toast.innerHTML = message;
    this.container.appendChild(toast);
    setTimeout(() => toast.remove(), duration);
  }
};

/* ==========================================================================
   12. CONTROLADOR DE BOOTSTRAP Y PUNTO DE ENTRADA
   ========================================================================== */

const LaserPrintApp = {
  isLoaded: false,

  bootstrap: function() {
    if (this.isLoaded) return;
    
    console.log(`🎮 [LASER PRINT SYSTEM v${LASER_PRINT_DB.version}] Inicializado.`);

    initRetroSFXSystem();
    initMobileMenu();
    initGifPlayback();
    cargarCarruselDinamico();
    initLightbox();
    initPixelAI();
    PixelNotifier.init();
    FAQEngine.renderizarSeccionFAQ('faqContainer');

    this.bindGlobalButtons();
    this.isLoaded = true;
  },

  bindGlobalButtons: function() {
    const sendWspBtn = document.querySelectorAll('.whatsapp-btn, .btn-whatsapp-direct');
    sendWspBtn.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        WhatsAppCheckout.abrirChatGeneral();
      });
    });
  }
};
