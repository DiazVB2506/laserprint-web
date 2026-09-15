/**
 * ==============================================================================
 * DISEÑO LASER PRINT - SISTEMA DE INTERFAZ & ASISTENTE VIRTUAL "PIXEL AI v3.3"
 * ==============================================================================
 */

const NUMERO_WHATSAPP = "5215598788857"; // Número corregido con código de país 521

/* ==========================================================================
   1. SINTETIZADOR DE EFECTOS DE SONIDO EDITORIAL/RETRO (WEB AUDIO API)
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
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.03);
        gain.gain.setValueAtTime(0.02, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.03);
        osc.start(now);
        osc.stop(now + 0.03);
        break;

      case 'click':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.setValueAtTime(780, now + 0.03);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.06);
        osc.start(now);
        osc.stop(now + 0.06);
        break;

      case 'carousel':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(500, now + 0.06);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.06);
        osc.start(now);
        osc.stop(now + 0.06);
        break;

      case 'openModal':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(261.63, now);
        osc.frequency.setValueAtTime(329.63, now + 0.05);
        osc.frequency.setValueAtTime(392.00, now + 0.10);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
        break;

      case 'closeModal':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.12);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
        break;

      case 'menu':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(500, now);
        osc.frequency.setValueAtTime(750, now + 0.04);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
        break;

      case 'success':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.08);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
        break;

      case 'error':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.setValueAtTime(120, now + 0.08);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
        break;

      case 'typing':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600 + Math.random() * 200, now);
        gain.gain.setValueAtTime(0.01, now);
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
  document.addEventListener('mouseover', function(e) {
    if (e.target.closest('.nav-btn, .carousel-btn, .whatsapp-btn, .dot, .mobile-menu-btn, .pixel-toggle-btn, .pixel-prompt-btn, .pixel-send-btn, .pixel-quick-btn')) {
      playArcadeSound('hover');
    }
  });

  document.addEventListener('click', function(e) {
    if (e.target.closest('.nav-btn, .whatsapp-btn, .pixel-prompt-btn, .pixel-send-btn, .pixel-quick-btn')) {
      playArcadeSound('click');
    }
  });
}

/* ==========================================================================
   2. CONTROL DE VIDEO DE PRESENTACIÓN (uploads/videos/presentacion3.mp4)
   ========================================================================== */

function initVideoPlayback() {
  const videoElem = document.querySelector('.video-section video') || document.getElementById('presentacionVideo');
  if (videoElem) {
    if (!videoElem.getAttribute('src')) {
      videoElem.src = 'uploads/videos/presentacion4.mp4';
    }
    videoElem.muted = true;
    videoElem.playsInline = true;
    videoElem.play().catch(function() {
      console.log('Autoplay retenido por el navegador.');
    });
  }
}

/* ==========================================================================
   3. MENÚ MÓVIL INTERACTIVO
   ========================================================================== */

function initMobileMenu() {
  const menuBtn = document.getElementById('mobileMenuBtn');
  const navLinks = document.getElementById('navLinks');

  if (!menuBtn || !navLinks) return;

  menuBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    playArcadeSound('menu');
    navLinks.classList.toggle('active');
    menuBtn.classList.toggle('open');
  });

  navLinks.querySelectorAll('a').forEach(function(link) {
    link.addEventListener('click', function() {
      navLinks.classList.remove('active');
      menuBtn.classList.remove('open');
    });
  });

  document.addEventListener('click', function(e) {
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
          .filter(function(p) { return p.tipoArchivo === 'imagen' || !p.tipoArchivo; })
          .map(function(p) {
            return {
              url: p.archivoUrl ? (p.archivoUrl.startsWith('/') ? p.archivoUrl.slice(1) : p.archivoUrl) : (BASE_URL + 'slide1.png'),
              alt: p.nombre || 'Diseño Laser Print - Trabajo Destacado'
            };
          });
      }
    }
  } catch (error) {
    console.warn('⚡ [CARRUSEL] Usando catálogo estático.');
  }

  if (imagenesFotos.length === 0) {
    imagenesFotos = [
      { url: BASE_URL + 'slide1.png', alt: 'Diseño Laser Print - Trabajo Destacado 1' },
      { url: BASE_URL + 'slide2.png', alt: 'Diseño Laser Print - Trabajo Destacado 2' },
      { url: BASE_URL + 'slide3.png', alt: 'Diseño Laser Print - Trabajo Destacado 3' },
      { url: BASE_URL + 'slide4.png', alt: 'Diseño Laser Print - Trabajo Destacado 4' },
      { url: BASE_URL + 'slide5.png', alt: 'Diseño Laser Print - Trabajo Destacado 5' }
    ];
  }

  track.innerHTML = imagenesFotos.map(function(item, index) {
    return '<div class="carousel-slide-3d" data-index="' + index + '">' +
      '<img src="' + item.url + '" alt="' + item.alt + '" onerror="this.onerror=null; this.src=\'https://via.placeholder.com/900x550/ffffff/0f4c81?text=TRABAJO+' + (index + 1) + '\';">' +
    '</div>';
  }).join('');

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
    slides.forEach(function(_, index) {
      const dot = document.createElement('div');
      dot.classList.add('dot');
      if (index === 0) dot.classList.add('active');
      dot.addEventListener('click', function() {
        playArcadeSound('carousel');
        moveToSlide(index);
        resetAutoplay();
      });
      dotsContainer.appendChild(dot);
    });
  }

  const dots = dotsContainer ? Array.from(dotsContainer.children) : [];

  function update3DSlides() {
    slides.forEach(function(slide, index) {
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

    dots.forEach(function(dot, index) {
      dot.classList.toggle('active', index === currentIndex);
    });
  }

  function moveToSlide(index) {
    currentIndex = (index + totalSlides) % totalSlides;
    update3DSlides();
  }

  function startAutoplay() {
    autoplayTimer = setInterval(function() {
      moveToSlide(currentIndex + 1);
    }, 5000);
  }

  function resetAutoplay() {
    clearInterval(autoplayTimer);
    startAutoplay();
  }

  if (nextBtn) {
    nextBtn.onclick = function(e) {
      e.stopPropagation();
      playArcadeSound('carousel');
      moveToSlide(currentIndex + 1);
      resetAutoplay();
    };
  }

  if (prevBtn) {
    prevBtn.onclick = function(e) {
      e.stopPropagation();
      playArcadeSound('carousel');
      moveToSlide(currentIndex - 1);
      resetAutoplay();
    };
  }

  let touchStartX = 0;
  let touchEndX = 0;

  track.addEventListener('touchstart', function(e) {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  track.addEventListener('touchend', function(e) {
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
   5. VISOR DE IMÁGENES AMPLIADAS (LIGHTBOX)
   ========================================================================== */

function initLightbox() {
  const modal = document.getElementById('imageModal');
  const modalImg = document.getElementById('modalImg');
  const captionText = document.getElementById('modalCaption');
  const closeModal = document.getElementById('modalClose');

  if (!modal || !modalImg) return;

  document.body.addEventListener('click', function(e) {
    if (e.target.matches('.carousel-slide-3d img, .carousel-img')) {
      const img = e.target;
      playArcadeSound('openModal');
      modal.style.display = 'flex';
      modalImg.src = img.src;
      captionText.textContent = img.alt || 'Muestra de trabajo - Diseño Laser Print';
      document.body.style.overflow = 'hidden';
    }
  });

  const hideModal = function() {
    playArcadeSound('closeModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
  };

  if (closeModal) {
    closeModal.addEventListener('click', hideModal);
  }

  window.addEventListener('click', function(e) {
    if (e.target === modal) hideModal();
  });

  window.addEventListener('keydown', function(e) {
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
  calcularGranFormato: function(productoKey, anchoM, altoM, cantidad) {
    cantidad = cantidad || 1;
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
   7. BASE DE CONOCIMIENTO MAESTRA DE PIXEL AI
   ========================================================================== */

const AVISO_COTIZACION_VARIA = '<br><br>⚠️ <i><b>Aviso importante:</b> El costo total estimado puede variar según especificaciones finales. El servicio de diseño tiene costo extra (puede variar dependiendo la complejidad). Para una cotización exacta dirígete a la sucursal o escríbenos vía WhatsApp.</i>';

const PIXEL_KNOWLEDGE_BASE = {
  saludos: {
    keywords: ['hola', 'buenas', 'buenos dias', 'buenas tardes', 'buenas noches', 'saludos', 'hello', 'hey', 'hi'],
    title: '¡HOLA! BIENVENIDO',
    response: '<b>✦ ASESOR LASER PRINT:</b> ¡Hola! 👋 Bienvenid@ a <b>Diseño Laser Print</b>.<br><br>' +
    '¿En qué te puedo ayudar hoy? Escribe la medida que buscas cotizar o selecciona una opción rápida.<br><br>' +
    '🎨 <i>Ten en cuenta que si requieres servicio de diseño, este tiene un costo extra dependiendo la complejidad.</i>'
  },
  preparar_archivos: {
    keywords: ['como preparo mis archivos', 'preparar archivos', 'formato de archivo', 'formatos', 'preparo mis archivos', 'como mando mi archivo', 'como envio mi archivo', 'extensiones'],
    title: 'GUÍA DE PREPARACIÓN DE ARCHIVOS',
    response: '<b>📁 GUÍA DE FORMATOS ACEPTADOS:</b><br><br>' +
    '• <b>DTF Textil / UV:</b> PNG, PDF SIN FONDO<br>' +
    '• <b>Stickers:</b> PDF, AI<br>' +
    '• <b>Lona:</b> JPEG, JPG, PDF, AI<br>' +
    '• <b>Sublimación:</b> PDF, AI<br>' +
    '• <b>Corte Láser:</b> DXF, AI, PDF EN VECTOR<br>' +
    '• <b>Coroplast:</b> PDF, AI<br><br>' +
    '🎨 <i>El diseño tiene costo extra y puede variar dependiendo el diseño.</i><br><br>' +
    '📲 Para enviarnos tus archivos directos o cotizar:<br>' +
    '👉 <a href="https://wa.me/' + NUMERO_WHATSAPP + '?text=Hola,%20quiero%20enviar%20mis%20archivos%20para%20revision" target="_blank" style="color:#0f4c81; font-weight:bold; text-decoration:underline;">Enviar archivos por WhatsApp</a>'
  },
  volantes: {
    keywords: ['volante', 'volantes', 'flyer', 'flyers', 'propaganda'],
    title: 'VOLANTES PUBLICITARIOS',
    response: '<b>📄 VOLANTES:</b><br><br>' +
    'Manejamos diferentes medidas para tus impresiones:<br>' +
    '• <b>Tamaño Carta</b><br>' +
    '• <b>Media Carta</b><br>' +
    '• <b>Un Cuarto de Carta (1/4)</b><br><br>' +
    '🎨 <i>El servicio de diseño tiene costo extra y varía según la complejidad del proyecto.</i><br><br>' +
    '📲 Obtén tu cotización exacta por WhatsApp:<br>' +
    '👉 <a href="https://wa.me/' + NUMERO_WHATSAPP + '?text=Hola,%20quiero%20cotizar%20volantes" target="_blank" style="color:#0f4c81; font-weight:bold; text-decoration:underline;">Cotizar Volantes por WhatsApp</a>'
  },
  tarjetas_presentacion: {
    keywords: ['tarjeta', 'tarjetas', 'tarjetas de presentacion', 'tarjeta de presentacion', 'presentacion'],
    title: 'TARJETAS DE PRESENTACIÓN',
    response: '<b>🎴 TARJETAS DE PRESENTACIÓN:</b><br><br>' +
    'Contamos con los mejores acabados profesionales:<br>' +
    '• <b>Laminadas</b><br>' +
    '• <b>Barniz a Registro</b><br><br>' +
    '🎨 <i>El diseño tiene un costo extra dependiendo la complejidad del diseño.</i><br><br>' +
    '📲 Solicita tu cotización directa por WhatsApp:<br>' +
    '👉 <a href="https://wa.me/' + NUMERO_WHATSAPP + '?text=Hola,%20quiero%20cotizar%20tarjetas%20de%20presentacion" target="_blank" style="color:#0f4c81; font-weight:bold; text-decoration:underline;">Cotizar Tarjetas por WhatsApp</a>'
  },
  notas_remision: {
    keywords: ['nota', 'notas', 'notas de remision', 'nota de remision', 'remision', 'talonario', 'notitas'],
    title: 'NOTAS DE REMISIÓN',
    response: '<b>📝 NOTAS DE REMISIÓN:</b><br><br>' +
    'Imprimimos tus notas de remisión personalizadas para tu negocio.<br><br>' +
    '🎨 <i>El diseño tiene costo extra que puede variar según lo requieras.</i><br><br>' +
    '📲 Para obtener una cotización rápida por WhatsApp:<br>' +
    '👉 <a href="https://wa.me/' + NUMERO_WHATSAPP + '?text=Hola,%20quiero%20cotizar%20notas%20de%20remision" target="_blank" style="color:#0f4c81; font-weight:bold; text-decoration:underline;">Cotizar Notas de Remisión por WhatsApp</a>'
  },
  whatsapp: {
    keywords: ['whatsapp', 'contacto', 'celular', 'telefono', 'hablar con alguien', 'cotizar por whatsapp', 'cotizacion whatsapp'],
    title: 'CONTACTO POR WHATSAPP',
    response: '<b>📲 CONTACTO DIRECTO:</b><br><br>' +
    'Puedes realizar tu cotización y pedido en tiempo real platicando directamente con nosotros.<br><br>' +
    '👉 <a href="https://wa.me/' + NUMERO_WHATSAPP + '?text=Hola%20Dise%C3%B1o%20Laser%20Print,%20quiero%20cotizar%20un%20trabajo" target="_blank" style="color:#0f4c81; font-weight:bold; text-decoration:underline;">Haz clic aquí para abrir WhatsApp Directo</a>'
  },
  horarios_ubicacion: {
    keywords: ['horario', 'horarios', 'abierto', 'hora', 'atienden', 'dias', 'sabado', 'domingo', 'abren', 'cierran', 'ubicacion', 'ubicación', 'donde estan', 'donde quedan', 'direccion', 'dirección', 'sucursal'],
    title: 'HORARIOS Y UBICACIÓN',
    response: '<b>📍 HORARIOS Y UBICACIÓN:</b><br><br>' +
    '⏰ <b>Horarios de atención:</b><br>' +
    '• <b>Lunes a Viernes:</b> 9:00 am a 6:00 pm<br>' +
    '• <b>Sábados:</b> 9:00 am a 2:00 pm<br>' +
    '• <b>Domingos:</b> Cerrado<br><br>' +
    '📍 <b>Ubicación:</b> Encuentra la dirección exacta con mapa interactivo en la sección inferior de nuestra página.'
  },
  dtf_uv: {
    keywords: ['dtf uv', 'uv dtf', 'impresion uv', 'uv'],
    title: 'DTF UV - ATENCIÓN DIRECTA',
    response: '<b>✨ DTF UV:</b><br><br>' +
    'Para cotizar <b>DTF UV</b> o recibir atención especializada de este material, por favor comunícate directamente con nuestro equipo vía WhatsApp.<br><br>' +
    '👉 <a href="https://wa.me/' + NUMERO_WHATSAPP + '?text=Hola,%20me%20interesa%20cotizar%20DTF%20UV" target="_blank" style="color:#0f4c81; font-weight:bold; text-decoration:underline;">Hablar con contacto directo por WhatsApp</a>'
  },
  dtf_textil: {
    keywords: ['dtf', 'dtf textil', 'textil'],
    title: 'DTF TEXTIL',
    response: '<b>👕 DTF TEXTIL:</b><br><br>' +
    '📏 <b>Formato:</b> El metro mide <b>57 cm de ancho x 100 cm de alto</b>.<br>' +
    '💵 <b>Costo:</b> <b>$230 MXN</b> por metro lineal.<br>' +
    '⚠️ <b>Venta mínima:</b> Mínimo medio metro (0.5 m).<br>' +
    '📅 <b>Tiempo de entrega:</b> 2 a 3 días hábiles.<br><br>' +
    '💡 <i>Para cotizar escribe por ejemplo: <b>"1 metro de dtf textil"</b> o <b>"dtf textil 0.5m"</b>.</i>'
  },
  vinil_sticker: {
    keywords: ['sticker', 'stickers', 'vinil sticker', 'etiquetas', 'calcomania', 'calcomanias'],
    title: 'VINIL PARA STICKER',
    response: '<b>🏷️ VINIL PARA STICKERS:</b><br><br>' +
    '📏 <b>Formato:</b> El metro mide <b>1.5 m (150 cm) de ancho x 1 m (100 cm) de alto</b>.<br>' +
    '💵 <b>Costo:</b> <b>$450 MXN</b> por metro lineal.<br>' +
    '⚠️ <b>Venta mínima:</b> Mínimo medio metro (0.5 m).<br>' +
    '📅 <b>Tiempo de entrega:</b> 2 a 3 días hábiles.<br><br>' +
    '💡 <i>Para cotizar escribe por ejemplo: <b>"1 metro de vinil sticker"</b> o <b>"vinil sticker 0.5m"</b>.</i>'
  },
  letreros_led: {
    keywords: ['led', 'letrero', 'letreros', 'letrero led', 'luz led', 'mdf + lona', 'mdf y acrilico', 'letrero mdf'],
    title: 'LETREROS CON LUZ LED',
    response: '<b>💡 LETREROS LED:</b><br><br>' +
    'Manejamos letreros personalizados en <b>MDF + Lona</b>, <b>MDF</b> y <b>Acrílico</b>.<br><br>' +
    '📲 Cotízalo directamente por WhatsApp enviándonos tus referencias:<br>' +
    '👉 <a href="https://wa.me/' + NUMERO_WHATSAPP + '?text=Hola,%20me%20interesa%20cotizar%20un%20letrero%20LED" target="_blank" style="color:#0f4c81; font-weight:bold; text-decoration:underline;">Cotizar Letrero por WhatsApp</a>'
  },
  sublimacion: {
    keywords: ['sublimacion', 'sublimación', 'sublimar'],
    title: 'SUBLIMACIÓN',
    response: '<b>📊 SUBLIMACIÓN:</b><br><br>' +
    '💵 <b>Costo:</b> <b>$250 MXN por m²</b>.<br>' +
    '📅 <b>Tiempo de entrega:</b> 2 a 3 días hábiles.<br><br>' +
    '💡 <i>Para un cálculo exacto escribe por ejemplo: <b>"sublimacion de 2x2m"</b>.</i>'
  },
  lona: {
    keywords: ['lona', 'lonas', 'lona impresa', 'publicidad exterior'],
    title: 'LONA IMPRESA',
    response: '<b>📊 LONA IMPRESA:</b><br><br>' +
    '📐 <b>Regla de costo:</b> El precio base es de <b>$85 MXN por m²</b> (si tu diseño mide menos de 1 m², se cobra el m² completo).<br>' +
    '📅 <b>Tiempo de entrega:</b> 2 a 3 días hábiles.<br><br>' +
    '👉 <i>Escribe tus medidas como: <b>"lona de 1.5 x 2m"</b>.</i>'
  },
  corte_laser: {
    keywords: ['corte laser', 'grabado laser', 'laser', 'corte mdf', 'acrilico 3mm', 'corte laser mdf'],
    title: 'CORTE Y GRABADO LÁSER',
    response: '<b>✂️ CORTE & GRABADO LÁSER:</b><br><br>' +
    'Trabajamos MDF, Acrílico, Papel Cascarón y Cartón. (En Aluminio únicamente grabado).<br><br>' +
    '📲 Envíanos tu archivo para cotización directa:<br>' +
    '👉 <a href="https://wa.me/' + NUMERO_WHATSAPP + '?text=Hola,%20quiero%20cotizar%20un%20corte%20laser" target="_blank" style="color:#0f4c81; font-weight:bold; text-decoration:underline;">Enviar Archivo a WhatsApp</a>'
  }
};

/* ==========================================================================
   8. PIXEL AI ENGINE & INTERFAZ DE CHAT INTERACTIVA
   ========================================================================== */

const PixelUI = {
  chatWidget: null,
  chatBox: null,
  inputField: null,
  sendBtn: null,
  isProcessing: false,

  init: function() {
    this.chatWidget = document.getElementById('pixelChatWidget');
    this.chatBox = document.getElementById('pixelChatMessages');
    this.inputField = document.getElementById('pixelInput');
    this.sendBtn = document.querySelector('.pixel-send-btn');

    this.bindEvents();
  },

  bindEvents: function() {
    const _this = this;
    const toggleElements = document.querySelectorAll('#pixelToggleBtn, .pixel-toggle-btn');

    toggleElements.forEach(function(element) {
      element.addEventListener('click', function(e) {
        e.preventDefault();
        _this.toggleChat();
      });
    });

    const closeBtn = document.getElementById('pixelCloseBtn');
    if (closeBtn) {
      closeBtn.addEventListener('click', function() { _this.ocultarChat(); });
    }

    const form = document.getElementById('pixelChatForm');
    if (form) {
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        _this.handleUserSubmit();
      });
    }

    if (this.inputField) {
      this.inputField.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          _this.handleUserSubmit();
        } else {
          playArcadeSound('typing');
        }
      });
    }

    document.addEventListener('click', function(e) {
      const btn = e.target.closest('.pixel-prompt-btn, .pixel-quick-btn');
      if (btn) {
        e.preventDefault();
        const promptText = btn.getAttribute('data-prompt') || btn.innerText.trim();
        _this.enviarOpcion(promptText);
      }
    });
  },

  toggleChat: function() {
    if (!this.chatWidget) return;
    const isOpen = this.chatWidget.classList.contains('active') || this.chatWidget.style.display === 'flex' || this.chatWidget.classList.contains('open');
    if (isOpen) this.ocultarChat(); else this.mostrarChat();
  },

  mostrarChat: function() {
    if (!this.chatWidget) return;
    playArcadeSound('openModal');
    this.chatWidget.classList.add('active', 'open');
    this.chatWidget.style.display = 'flex';
    if (this.inputField) {
      const field = this.inputField;
      setTimeout(function() { field.focus(); }, 150);
    }
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
    const _this = this;
    this.appendMessage('user', queryText);
    playArcadeSound('click');
    this.isProcessing = true;

    setTimeout(function() {
      _this.procesarRespuestaInteligente(queryText);
      _this.isProcessing = false;
    }, 400);
  },

  appendMessage: function(sender, contentHTML) {
    if (!this.chatBox) return;

    const msgDiv = document.createElement('div');
    msgDiv.className = 'pixel-msg ' + (sender === 'user' ? 'pixel-user-msg' : 'pixel-bot-msg');

    const bubbleDiv = document.createElement('div');
    bubbleDiv.className = 'pixel-msg-bubble';
    bubbleDiv.innerHTML = contentHTML;

    msgDiv.appendChild(bubbleDiv);
    this.chatBox.appendChild(msgDiv);
    this.chatBox.scrollTop = this.chatBox.scrollHeight;
  },

  procesarRespuestaInteligente: function(query) {
    const qLower = query.toLowerCase().trim();

    // 1. Detección de medidas y cotizaciones dinámicas
    const datosMedidas = CotizadorEngine.parsearMedidasDesdeTexto(qLower);

    if (datosMedidas) {
      if (qLower.includes('dtf') || qLower.includes('textil')) {
        const m = datosMedidas.metrosLineales || datosMedidas.ancho;
        const res = CotizadorEngine.calcularDTFTextil(m);
        const msg = '<b>👕 COTIZACIÓN DTF TEXTIL:</b><br><br>' +
          '• Metros calculados: <b>' + res.metrosCobrados + ' m</b><br>' +
          '• Precio por metro: <b>$' + res.precioPorMetro + ' MXN</b><br>' +
          '• Total estimado: <b style="color:#00f0ff; font-size: 1.1em;">$' + res.total + ' MXN</b>' +
          AVISO_COTIZACION_VARIA;
        this.appendMessage('bot', msg);
        playArcadeSound('success');
        return;
      }

      if (qLower.includes('sticker') || qLower.includes('etiqueta') || qLower.includes('calcomania')) {
        const m = datosMedidas.metrosLineales || datosMedidas.ancho;
        const res = CotizadorEngine.calcularVinilSticker(m);
        const msg = '<b>🏷️ COTIZACIÓN VINIL STICKER:</b><br><br>' +
          '• Metros calculados: <b>' + res.metrosCobrados + ' m</b><br>' +
          '• Precio por metro: <b>$' + res.precioPorMetro + ' MXN</b><br>' +
          '• Total estimado: <b style="color:#00f0ff; font-size: 1.1em;">$' + res.total + ' MXN</b>' +
          AVISO_COTIZACION_VARIA;
        this.appendMessage('bot', msg);
        playArcadeSound('success');
        return;
      }

      if (qLower.includes('sublim')) {
        const res = CotizadorEngine.calcularGranFormato('SUBLIMACION_M2', datosMedidas.ancho, datosMedidas.alto);
        const msg = '<b>📊 COTIZACIÓN SUBLIMACIÓN:</b><br><br>' +
          '• Medidas: <b>' + res.ancho + 'm x ' + res.alto + 'm</b> (' + res.areaM2Unidad + ' m²)<br>' +
          '• Precio m²: <b>$' + res.precioM2 + ' MXN</b><br>' +
          '• Total estimado: <b style="color:#00f0ff; font-size: 1.1em;">$' + res.total + ' MXN</b>' +
          AVISO_COTIZACION_VARIA;
        this.appendMessage('bot', msg);
        playArcadeSound('success');
        return;
      }

      // Por defecto para lonas / viniles impresos
      const res = CotizadorEngine.calcularGranFormato('LONA_440G', datosMedidas.ancho, datosMedidas.alto);
      const msg = '<b>📊 COTIZACIÓN LONA IMPRESA:</b><br><br>' +
        '• Medidas: <b>' + res.ancho + 'm x ' + res.alto + 'm</b> (' + res.areaM2Unidad + ' m²)<br>' +
        '• Precio m²: <b>$' + res.precioM2 + ' MXN</b><br>' +
        '• Total estimado: <b style="color:#00f0ff; font-size: 1.1em;">$' + res.total + ' MXN</b>' +
        (res.aplicoMinimo ? '<br>⚠️ <i>Aplica cobro por mínimo de 1 m².</i>' : '') +
        AVISO_COTIZACION_VARIA;
      this.appendMessage('bot', msg);
      playArcadeSound('success');
      return;
    }

    // 2. Coincidencia por palabras clave en la Base de Conocimiento
    for (let key in PIXEL_KNOWLEDGE_BASE) {
      const item = PIXEL_KNOWLEDGE_BASE[key];
      const match = item.keywords.some(function(kw) { return qLower.includes(kw); });

      if (match) {
        this.appendMessage('bot', item.response);
        playArcadeSound('success');
        return;
      }
    }

    // 3. Respuesta por defecto
    const defaultMsg = '🤖 No logré entender por completo tu solicitud.<br><br>' +
      'Puedes escribir la medida que requieres cotizar (ej. <i>"lona 2x1m"</i>, <i>"1m de dtf"</i>) o contactarnos en directo por WhatsApp:<br><br>' +
      '👉 <a href="https://wa.me/' + NUMERO_WHATSAPP + '?text=Hola,%20tengo%20una%20duda%20sobre%20un%20servicio" target="_blank" style="color:#0f4c81; font-weight:bold; text-decoration:underline;">Escribir a WhatsApp Directo</a>';

    this.appendMessage('bot', defaultMsg);
    playArcadeSound('error');
  }
};

/* ==========================================================================
   9. INICIALIZACIÓN GLOBAL DEL SISTEMA AL CARGAR EL DOM
   ========================================================================== */

document.addEventListener('DOMContentLoaded', function() {
  initRetroSFXSystem();
  initVideoPlayback();
  initMobileMenu();
  cargarCarruselDinamico();
  initLightbox();
  PixelUI.init();

  console.log('✅ [DISEÑO LASER PRINT] Interfaz y PIXEL AI v3.3 cargados exitosamente.');
});
