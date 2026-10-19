/**
 * ==============================================================================
 * DISEÑO LASER PRINT — index.js v4.0
 * Interfaz del sitio + asistente virtual "PIXEL AI"
 * ==============================================================================
 *
 * Secciones:
 *   0. Configuración y utilidades
 *   1. Sonidos retro (Web Audio)
 *   2. Video de presentación
 *   3. Menú móvil
 *   4. Carrusel 3D
 *   5. Visor de imágenes (lightbox)
 *   6. Catálogo de precios y cotizador
 *   7. Base de conocimiento de PIXEL
 *   8. Chat de PIXEL
 *   9. Arranque
 */
(function () {
  'use strict';

  /* ==========================================================================
     0. CONFIGURACIÓN Y UTILIDADES
     ========================================================================== */

  const CONFIG = {
    whatsapp: '5215598788857',
    apiProductos: '/api/productos',   // solo existe si corres tu servidor Python
    fotosBase: 'uploads/fotos/',
    totalFotosRespaldo: 5,            // slide1.png ... slide5.png
    autoplayMs: 5000,
    placeholder: function (n) {
      return 'https://placehold.co/900x550/0f4c81/ffffff?text=Trabajo+' + n;
    }
  };

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esTactil = window.matchMedia('(hover: none)').matches;

  /** Quita acentos, pasa a minúsculas y limpia espacios: "Sublimación" -> "sublimacion" */
  function normalizar(texto) {
    return String(texto)
      .toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function escaparRegex(texto) {
    return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  const formatoMXN = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

  /** 1275 -> "$1,275.00 MXN" */
  function dinero(n) {
    return formatoMXN.format(n) + ' MXN';
  }

  /** 1.5000 -> "1.5" */
  function num(n) {
    return String(Number(n.toFixed(2)));
  }

  function linkWhatsApp(mensaje) {
    return 'https://wa.me/' + CONFIG.whatsapp + '?text=' + encodeURIComponent(mensaje);
  }

  function botonWhatsApp(mensaje, etiqueta) {
    return '<a class="pixel-link" href="' + linkWhatsApp(mensaje) + '" target="_blank" rel="noopener noreferrer">' + etiqueta + '</a>';
  }

  /* ==========================================================================
     1. SONIDOS RETRO (WEB AUDIO API)
     - Solo suenan después de que la persona interactúa (los navegadores
       bloquean el audio antes y llenaban la consola de advertencias).
     - El sonido de hover ya no se repite al mover el mouse dentro del botón.
     - Se puede silenciar desde el chat de PIXEL y se recuerda la elección.
     ========================================================================== */

  // wave = forma de onda | pasos = [frecuencia, segundo] | glide = deslizar a esa frecuencia
  const SONIDOS = {
    hover:      { wave: 'sine',     pasos: [[400, 0]], glide: 600, vol: 0.02, dur: 0.03 },
    click:      { wave: 'triangle', pasos: [[520, 0], [780, 0.03]], vol: 0.05, dur: 0.06 },
    carousel:   { wave: 'sine',     pasos: [[300, 0]], glide: 500, vol: 0.04, dur: 0.06 },
    openModal:  { wave: 'sine',     pasos: [[261.63, 0], [329.63, 0.05], [392, 0.10]], vol: 0.05, dur: 0.2 },
    closeModal: { wave: 'sine',     pasos: [[400, 0]], glide: 150, vol: 0.05, dur: 0.12 },
    menu:       { wave: 'sine',     pasos: [[500, 0], [750, 0.04]], vol: 0.04, dur: 0.08 },
    success:    { wave: 'sine',     pasos: [[523.25, 0], [659.25, 0.08]], vol: 0.05, dur: 0.2 },
    error:      { wave: 'triangle', pasos: [[220, 0], [160, 0.08]], vol: 0.04, dur: 0.15 },
    typing:     { wave: 'sine',     pasos: [[0, 0]], aleatorio: true, vol: 0.01, dur: 0.02 }
  };

  const SELECTOR_HOVER = '.nav-btn, .carousel-btn, .whatsapp-btn, .dot, .mobile-menu-btn, .pixel-toggle-btn, .pixel-prompt-btn, .pixel-send-btn';
  const SELECTOR_CLICK = '.nav-btn, .whatsapp-btn, .pixel-prompt-btn, .pixel-send-btn';

  const Sonido = {
    ctx: null,
    activo: true,
    desbloqueado: false,

    init: function () {
      const self = this;
      try { this.activo = localStorage.getItem('pixelSonido') !== 'off'; } catch (e) {}

      const desbloquear = function () { self.desbloqueado = true; };
      ['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) {
        window.addEventListener(ev, desbloquear, { once: true, passive: true });
      });

      if (!esTactil) {
        let ultimo = null;
        document.addEventListener('mouseover', function (e) {
          const el = e.target.closest(SELECTOR_HOVER);
          if (el && el !== ultimo) self.play('hover');
          ultimo = el;
        });
      }

      document.addEventListener('click', function (e) {
        if (e.target.closest(SELECTOR_CLICK)) self.play('click');
      });
    },

    setActivo: function (valor) {
      this.activo = valor;
      try { localStorage.setItem('pixelSonido', valor ? 'on' : 'off'); } catch (e) {}
    },

    contexto: function () {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        this.ctx = new AC();
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return this.ctx;
    },

    play: function (tipo) {
      if (!this.activo || !this.desbloqueado) return;
      const def = SONIDOS[tipo];
      if (!def) return;

      try {
        const ctx = this.contexto();
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = def.wave;
        osc.connect(gain).connect(ctx.destination);

        const now = ctx.currentTime;
        def.pasos.forEach(function (p) {
          const f = def.aleatorio ? 600 + Math.random() * 200 : p[0];
          osc.frequency.setValueAtTime(f, now + p[1]);
        });
        if (def.glide) osc.frequency.exponentialRampToValueAtTime(def.glide, now + def.dur);

        gain.gain.setValueAtTime(def.vol, now);
        gain.gain.linearRampToValueAtTime(0.001, now + def.dur);

        osc.start(now);
        osc.stop(now + def.dur + 0.01);
      } catch (e) {
        // Si el audio falla, la página sigue funcionando sin sonido
      }
    }
  };

  /* ==========================================================================
     2. VIDEO DE PRESENTACIÓN
     - Solo se reproduce cuando está en pantalla (ahorra batería y datos).
     - Si la persona desactivó animaciones, se queda en pausa con controles.
     ========================================================================== */

  function initVideo() {
    const video = document.getElementById('presentacionVideo');
    if (!video) return;

    video.muted = true;
    video.playsInline = true;

    if (reduceMotion) {
      video.removeAttribute('autoplay');
      video.pause();
      video.controls = true;
      return;
    }

    const reproducir = function () { video.play().catch(function () {}); };

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entradas) {
        if (entradas[0].isIntersecting) reproducir(); else video.pause();
      }, { threshold: 0.25 }).observe(video);
    } else {
      reproducir();
    }
  }

  /* ==========================================================================
     3. MENÚ MÓVIL
     ========================================================================== */

  function initMenuMovil() {
    const btn = document.getElementById('mobileMenuBtn');
    const nav = document.getElementById('navLinks');
    if (!btn || !nav) return;

    const estaAbierto = function () { return nav.classList.contains('active'); };

    function setAbierto(abierto) {
      nav.classList.toggle('active', abierto);
      btn.classList.toggle('open', abierto);
      btn.setAttribute('aria-expanded', String(abierto));
      btn.setAttribute('aria-label', abierto ? 'Cerrar menú' : 'Abrir menú');
    }

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      Sonido.play('menu');
      setAbierto(!estaAbierto());
    });

    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setAbierto(false);
    });

    document.addEventListener('click', function (e) {
      if (estaAbierto() && !nav.contains(e.target) && !btn.contains(e.target)) setAbierto(false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && estaAbierto()) {
        setAbierto(false);
        btn.focus();
      }
    });
  }

  /* ==========================================================================
     4. CARRUSEL 3D
     ========================================================================== */

  async function obtenerFotos() {
    const respaldo = [];
    for (let i = 1; i <= CONFIG.totalFotosRespaldo; i++) {
      respaldo.push({
        url: CONFIG.fotosBase + 'slide' + i + '.png',
        alt: 'Trabajo destacado ' + i + ' de Diseño Laser Print'
      });
    }

    // En GitHub Pages no corre Python, así que la API nunca existe ahí:
    // nos ahorramos una petición que siempre fallaba con error 404.
    if (location.hostname.endsWith('github.io')) return respaldo;

    try {
      const control = new AbortController();
      const limite = setTimeout(function () { control.abort(); }, 3000);
      const res = await fetch(CONFIG.apiProductos, { signal: control.signal });
      clearTimeout(limite);
      if (!res.ok) return respaldo;

      const data = await res.json();
      const fotos = (data.productos || [])
        .filter(function (p) { return p.archivoUrl && (!p.tipoArchivo || p.tipoArchivo === 'imagen'); })
        .map(function (p) {
          return {
            url: p.archivoUrl.replace(/^\//, ''),
            alt: p.nombre || 'Trabajo destacado de Diseño Laser Print'
          };
        });

      return fotos.length ? fotos : respaldo;
    } catch (e) {
      return respaldo;
    }
  }

  /** Crea las diapositivas con el DOM (antes se armaban como texto y un
   *  nombre de producto con comillas o etiquetas podía romper la página). */
  function crearSlides(track, fotos) {
    track.innerHTML = '';
    const total = fotos.length;

    fotos.forEach(function (foto, i) {
      const slide = document.createElement('div');
      slide.className = 'carousel-slide-3d';
      slide.dataset.index = i;
      slide.setAttribute('role', 'group');
      slide.setAttribute('aria-roledescription', 'diapositiva');
      slide.setAttribute('aria-label', (i + 1) + ' de ' + total);

      const img = document.createElement('img');
      img.src = foto.url;
      img.alt = foto.alt;
      img.decoding = 'async';
      // Las 3 visibles al inicio (actual, siguiente, anterior) cargan ya; el resto, cuando haga falta
      if (i > 1 && i < total - 1) img.loading = 'lazy';
      img.addEventListener('error', function () {
        img.src = CONFIG.placeholder(i + 1);
      }, { once: true });

      slide.appendChild(img);
      track.appendChild(slide);
    });
  }

  function initCarrusel() {
    const track = document.getElementById('carouselTrack');
    if (!track) return;

    const wrapper = track.closest('.carousel-wrapper') || track;
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const dotsBox = document.getElementById('carouselDots');

    const slides = Array.from(track.children);
    const total = slides.length;
    if (!total) return;

    let actual = 0;
    let timer = null;
    let pausado = false;      // mouse encima o foco dentro
    let enPantalla = true;

    // Puntos de navegación (ahora son <button>: se pueden usar con teclado)
    let dots = [];
    if (dotsBox) {
      dotsBox.innerHTML = '';
      dots = slides.map(function (_, i) {
        const d = document.createElement('button');
        d.type = 'button';
        d.className = 'dot';
        d.setAttribute('aria-label', 'Ver trabajo ' + (i + 1));
        d.addEventListener('click', function () {
          Sonido.play('carousel');
          ir(i);
          arrancar();
        });
        dotsBox.appendChild(d);
        return d;
      });
    }

    function pintar() {
      slides.forEach(function (s, i) {
        const offset = (i - actual + total) % total;
        let clase = 'hidden';
        if (offset === 0) clase = 'active';
        else if (offset === 1) clase = 'next';
        else if (offset === total - 1) clase = 'prev';

        s.classList.remove('active', 'prev', 'next', 'hidden');
        s.classList.add(clase);
        s.setAttribute('aria-hidden', String(clase !== 'active'));
      });

      dots.forEach(function (d, i) {
        const activo = i === actual;
        d.classList.toggle('active', activo);
        d.setAttribute('aria-current', activo ? 'true' : 'false');
      });
    }

    function ir(i) {
      actual = (i + total) % total;
      pintar();
    }

    function detener() {
      clearInterval(timer);
      timer = null;
    }

    // Autoplay inteligente: se pausa con el mouse encima, fuera de pantalla,
    // con la pestaña oculta o si la persona desactivó animaciones.
    function arrancar() {
      detener();
      if (reduceMotion || total < 2 || pausado || !enPantalla || document.hidden) return;
      timer = setInterval(function () { ir(actual + 1); }, CONFIG.autoplayMs);
    }

    function navegar(direccion) {
      Sonido.play('carousel');
      ir(actual + direccion);
      arrancar();
    }

    if (nextBtn) nextBtn.onclick = function (e) { e.stopPropagation(); navegar(1); };
    if (prevBtn) prevBtn.onclick = function (e) { e.stopPropagation(); navegar(-1); };

    if (total < 2) {
      if (prevBtn) prevBtn.hidden = true;
      if (nextBtn) nextBtn.hidden = true;
      if (dotsBox) dotsBox.hidden = true;
    }

    // Clic en una lateral: avanza hacia ella (antes abría la imagen de atrás)
    track.addEventListener('click', function (e) {
      const s = e.target.closest('.carousel-slide-3d');
      if (!s) return;
      if (s.classList.contains('next')) { e.stopPropagation(); navegar(1); }
      else if (s.classList.contains('prev')) { e.stopPropagation(); navegar(-1); }
    });

    // Deslizar con el dedo (ignora el scroll vertical)
    let x0 = 0;
    let y0 = 0;
    track.addEventListener('touchstart', function (e) {
      x0 = e.changedTouches[0].clientX;
      y0 = e.changedTouches[0].clientY;
    }, { passive: true });

    track.addEventListener('touchend', function (e) {
      const dx = e.changedTouches[0].clientX - x0;
      const dy = e.changedTouches[0].clientY - y0;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) navegar(dx < 0 ? 1 : -1);
    }, { passive: true });

    // Teclado: flechas para moverse, Enter para ampliar
    wrapper.setAttribute('tabindex', '0');
    wrapper.setAttribute('aria-label', 'Trabajos destacados. Usa las flechas para navegar y Enter para ampliar.');
    wrapper.addEventListener('keydown', function (e) {
      if (e.target !== wrapper) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); navegar(1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); navegar(-1); }
      else if (e.key === 'Enter') {
        const img = track.querySelector('.carousel-slide-3d.active img');
        if (img) img.click();
      }
    });

    // Pausas
    if (!esTactil) {
      wrapper.addEventListener('mouseenter', function () { pausado = true; detener(); });
      wrapper.addEventListener('mouseleave', function () { pausado = false; arrancar(); });
    }
    wrapper.addEventListener('focusin', function () { pausado = true; detener(); });
    wrapper.addEventListener('focusout', function () { pausado = false; arrancar(); });
    document.addEventListener('visibilitychange', arrancar);

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entradas) {
        enPantalla = entradas[0].isIntersecting;
        arrancar();
      }, { threshold: 0.2 }).observe(wrapper);
    }

    pintar();
    arrancar();
  }

  async function cargarCarrusel() {
    const track = document.getElementById('carouselTrack');
    if (!track) return;
    crearSlides(track, await obtenerFotos());
    initCarrusel();
  }

  /* ==========================================================================
     5. VISOR DE IMÁGENES (LIGHTBOX)
     - Flechas ← → cambian de imagen sin cerrar.
     - Al cerrar, el foco regresa a donde estaba.
     ========================================================================== */

  const Lightbox = {
    modal: null,
    abierto: function () {
      return !!this.modal && this.modal.style.display === 'flex';
    }
  };

  function initLightbox() {
    const modal = document.getElementById('imageModal');
    const img = document.getElementById('modalImg');
    const caption = document.getElementById('modalCaption');
    const cerrarBtn = document.getElementById('modalClose');
    if (!modal || !img) return;

    Lightbox.modal = modal;
    let lista = [];
    let idx = 0;
    let focoPrevio = null;

    function mostrar(i) {
      const el = lista[i];
      if (!el) return;
      idx = i;
      img.src = el.currentSrc || el.src;
      img.alt = el.alt;
      if (caption) caption.textContent = el.alt || 'Trabajo de Diseño Laser Print';
    }

    function abrir(el) {
      lista = Array.from(document.querySelectorAll('#carouselTrack img, .carousel-img'));
      focoPrevio = document.activeElement;
      mostrar(Math.max(0, lista.indexOf(el)));
      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      Sonido.play('openModal');
      if (cerrarBtn) cerrarBtn.focus();
    }

    function cerrar() {
      if (!Lightbox.abierto()) return;
      modal.style.display = 'none';
      document.body.style.overflow = '';
      Sonido.play('closeModal');
      if (focoPrevio && focoPrevio.focus) focoPrevio.focus();
    }

    document.body.addEventListener('click', function (e) {
      const objetivo = e.target.closest('.carousel-slide-3d.active img, .carousel-img');
      if (objetivo) abrir(objetivo);
    });

    if (cerrarBtn) cerrarBtn.addEventListener('click', cerrar);
    modal.addEventListener('click', function (e) {
      if (e.target === modal) cerrar();
    });

    document.addEventListener('keydown', function (e) {
      if (!Lightbox.abierto()) return;
      if (e.key === 'Escape') cerrar();
      else if (e.key === 'ArrowRight' && lista.length > 1) mostrar((idx + 1) % lista.length);
      else if (e.key === 'ArrowLeft' && lista.length > 1) mostrar((idx - 1 + lista.length) % lista.length);
      else if (e.key === 'Tab') { e.preventDefault(); if (cerrarBtn) cerrarBtn.focus(); }
    });
  }

  /* ==========================================================================
     6. CATÁLOGO DE PRECIOS Y COTIZADOR
     Para cambiar un precio, solo edita el número aquí.
     ========================================================================== */

  const CATALOGO = {
    LONA: {
      nombre: 'Lona impresa alta resolución',
      tipo: 'm2', precio: 85, minimo: 1
    },
    VINIL_IMPRESO: {
      nombre: 'Vinil blanco impreso (brillante o mate)',
      tipo: 'm2', precio: 300, minimo: 0.5
    },
    SUBLIMACION: {
      nombre: 'Sublimación',
      tipo: 'm2', precio: 250, minimo: 0.1
    },
    DTF_TEXTIL: {
      nombre: 'DTF textil (rollo de 57 cm de ancho)',
      tipo: 'lineal', precio: 230, minimo: 0.5, anchoRollo: 0.57
    },
    VINIL_STICKER: {
      nombre: 'Vinil para sticker (rollo de 1.5 m de ancho)',
      tipo: 'lineal', precio: 450, minimo: 0.5, anchoRollo: 1.5
    }
  };

  const ENTREGA = '2 a 3 días hábiles';

  const Cotizador = {
    /**
     * Lee medidas escritas de muchas formas:
     *   "2x3", "2 x 3 m", "1.5 por 2 metros", "150x200 cm", "120 cm x 80 cm"
     *   "1.5 m", "2 metros", "50 cm", "medio metro", "un metro"
     * Sin unidad: si ambos números son mayores a 10 se asume cm (ej. "150x200").
     */
    leerMedidas: function (t) {
      const n = '(\\d+(?:[.,]\\d+)?)';
      const u = '(cm|mts?|metros?|m)';
      const aNum = function (s) { return parseFloat(s.replace(',', '.')); };

      const dos = t.match(new RegExp(n + '\\s*' + u + '?\\s*(?:x|×|por)\\s*' + n + '\\s*' + u + '?(?![a-z])'));
      if (dos) {
        let ancho = aNum(dos[1]);
        let alto = aNum(dos[3]);
        const unidad = dos[4] || dos[2] || '';
        const enCm = unidad ? unidad === 'cm' : (ancho > 10 && alto > 10);
        if (enCm) { ancho /= 100; alto /= 100; }
        if (ancho > 0 && alto > 0) return { ancho: ancho, alto: alto };
      }

      if (/\bmedio metro\b/.test(t)) return { lineales: 0.5 };
      if (/\b(un|1) metro\b/.test(t)) return { lineales: 1 };

      const uno = t.match(new RegExp(n + '\\s*' + u + '(?![a-z])'));
      if (uno) {
        let v = aNum(uno[1]);
        if (uno[2] === 'cm') v /= 100;
        if (v > 0) return { lineales: v };
      }
      return null;
    },

    /** "3 lonas de 1x2" -> 3 */
    leerCantidad: function (t) {
      const m = t.match(/\b(\d+)\s*(?:piezas?|pzas?|pz|lonas|viniles|unidades|copias)\b/);
      return m ? Math.max(1, parseInt(m[1], 10)) : 1;
    },

    /** Decide qué producto quiere cotizar según las palabras del mensaje */
    detectarProducto: function (t, medidas) {
      if (/\buv\b/.test(t)) return 'DTF_UV';
      if (/\bdtf\b|textil/.test(t)) return 'DTF_TEXTIL';
      if (/sticker|etiqueta|calcomania/.test(t)) return 'VINIL_STICKER';
      if (/sublima/.test(t)) return 'SUBLIMACION';
      if (/vinil/.test(t) && medidas.ancho) return 'VINIL_IMPRESO';
      if (/\blonas?\b/.test(t) || medidas.ancho) return 'LONA';
      return null;
    },

    porArea: function (clave, ancho, alto, cantidad) {
      const p = CATALOGO[clave];
      const areaReal = ancho * alto;
      const areaCobrada = Math.max(areaReal, p.minimo);
      return {
        producto: p,
        filas: [
          ['Medidas', num(ancho) + ' × ' + num(alto) + ' m'],
          ['Área cobrada', num(areaCobrada) + ' m²' + (cantidad > 1 ? ' c/u' : '')],
          ['Precio', dinero(p.precio) + ' por m²']
        ].concat(cantidad > 1 ? [['Cantidad', cantidad + ' piezas']] : []),
        total: areaCobrada * p.precio * cantidad,
        nota: areaReal < p.minimo ? 'Se aplicó el mínimo de ' + num(p.minimo) + ' m² por pieza.' : '',
        resumen: p.nombre + ' de ' + num(ancho) + ' × ' + num(alto) + ' m' + (cantidad > 1 ? ' (' + cantidad + ' piezas)' : '')
      };
    },

    porMetroLineal: function (clave, medidas) {
      const p = CATALOGO[clave];
      let metros;

      if (medidas.lineales) {
        metros = medidas.lineales;
      } else if (medidas.ancho <= p.anchoRollo) {
        metros = medidas.alto;                 // cabe a lo ancho del rollo
      } else if (medidas.alto <= p.anchoRollo) {
        metros = medidas.ancho;                // cabe girándolo
      } else {
        return { excede: true, producto: p };  // no cabe en el rollo
      }

      const cobrados = Math.max(metros, p.minimo);
      return {
        producto: p,
        filas: [
          ['Metros lineales', num(cobrados) + ' m'],
          ['Precio', dinero(p.precio) + ' por metro']
        ],
        total: cobrados * p.precio,
        nota: metros < p.minimo ? 'Se aplicó la compra mínima de ' + num(p.minimo) + ' m.' : '',
        resumen: num(cobrados) + ' m de ' + p.nombre
      };
    },

    /** Devuelve el HTML de la respuesta, o null si el mensaje no es una cotización */
    responder: function (t) {
      const medidas = this.leerMedidas(t);
      if (!medidas) return null;

      const clave = this.detectarProducto(t, medidas);
      if (!clave || clave === 'DTF_UV') return null;   // DTF UV se atiende por WhatsApp

      let r;
      if (CATALOGO[clave].tipo === 'm2') {
        if (!medidas.ancho) {
          return '📐 Para cotizar <b>' + CATALOGO[clave].nombre + '</b> necesito <b>ancho y alto</b>.<br><br>' +
            '💡 Escríbelo así: <i>"' + (clave === 'LONA' ? 'lona' : clave === 'SUBLIMACION' ? 'sublimación' : 'vinil') + ' de 1.5 x 2 m"</i>';
        }
        r = this.porArea(clave, medidas.ancho, medidas.alto, this.leerCantidad(t));
      } else {
        r = this.porMetroLineal(clave, medidas);
        if (r.excede) {
          return '📏 Esa medida no cabe en el rollo de <b>' + r.producto.nombre + '</b>.<br><br>' +
            'Escríbenos y te ayudamos a acomodar tu diseño:<br>👉 ' +
            botonWhatsApp('Hola, quiero cotizar ' + r.producto.nombre + ' con una medida grande', 'Cotizar por WhatsApp');
        }
      }

      return '<b>🧾 COTIZACIÓN — ' + r.producto.nombre.toUpperCase() + '</b><br><br>' +
        r.filas.map(function (f) { return '• ' + f[0] + ': <b>' + f[1] + '</b>'; }).join('<br>') +
        '<div class="pixel-total">Total estimado<strong>' + dinero(r.total) + '</strong></div>' +
        (r.nota ? '<small class="pixel-aviso">ℹ️ ' + r.nota + '</small>' : '') +
        '📅 Entrega: <b>' + ENTREGA + '</b><br>' +
        '<a class="pixel-cta" href="' + linkWhatsApp('Hola Laser Print, PIXEL me cotizó: ' + r.resumen + ' = ' + dinero(r.total) + '. Quiero confirmar mi pedido.') +
        '" target="_blank" rel="noopener noreferrer">📲 Pedir por WhatsApp</a>' +
        AVISO;
    }
  };

  /* ==========================================================================
     7. BASE DE CONOCIMIENTO DE PIXEL
     - Las palabras se comparan completas y sin acentos.
       (Antes "hi" coincidía dentro de "arcHIvos" y PIXEL saludaba en lugar
        de explicar cómo preparar archivos.)
     - Si hay varias coincidencias gana la más específica.
     ========================================================================== */

  const AVISO = '<small class="pixel-aviso">⚠️ El costo es estimado y puede variar según especificaciones finales. ' +
    'El diseño tiene costo extra según la complejidad. Para una cotización exacta visítanos o escríbenos por WhatsApp.</small>';

  const CONOCIMIENTO = [
    {
      id: 'saludo',
      peso: -10,   // si además pregunta por un producto, gana el producto
      claves: ['hola', 'buenas', 'buenos dias', 'buenas tardes', 'buenas noches', 'saludos', 'hello', 'hey', 'hi', 'que tal'],
      respuesta: '¡Hola! 👋 Bienvenid@ a <b>Diseño Laser Print</b>.<br><br>' +
        '¿En qué te ayudo? Escribe lo que quieres cotizar con sus medidas, por ejemplo <i>"lona de 2x1 m"</i>, o elige una opción rápida.<br><br>' +
        '🎨 <i>Si necesitas diseño, tiene un costo extra según la complejidad.</i>'
    },
    {
      id: 'archivos',
      claves: ['como preparo mis archivos', 'preparar archivos', 'preparo mis archivos', 'formato de archivo', 'formatos', 'como mando mi archivo', 'como envio mi archivo', 'extensiones', 'archivo', 'archivos'],
      respuesta: '<b>📁 FORMATOS QUE ACEPTAMOS:</b><br><br>' +
        '• <b>DTF Textil / UV:</b> PNG o PDF sin fondo<br>' +
        '• <b>Stickers:</b> PDF, AI<br>' +
        '• <b>Lona:</b> JPG, PDF, AI<br>' +
        '• <b>Sublimación:</b> PDF, AI<br>' +
        '• <b>Corte Láser:</b> DXF, AI o PDF en vector<br>' +
        '• <b>Coroplast:</b> PDF, AI<br><br>' +
        '🎨 <i>El diseño tiene costo extra según la complejidad.</i><br><br>' +
        '👉 ' + botonWhatsApp('Hola, quiero enviar mis archivos para revisión', 'Enviar archivos por WhatsApp')
    },
    {
      id: 'volantes',
      claves: ['volante', 'volantes', 'flyer', 'flyers', 'propaganda'],
      respuesta: '<b>📄 VOLANTES</b><br><br>' +
        'Manejamos:<br>• <b>Carta</b><br>• <b>Media carta</b><br>• <b>Un cuarto de carta</b><br><br>' +
        '🎨 <i>El diseño tiene costo extra según la complejidad.</i><br><br>' +
        '👉 ' + botonWhatsApp('Hola, quiero cotizar volantes', 'Cotizar volantes por WhatsApp')
    },
    {
      id: 'tarjetas',
      claves: ['tarjetas de presentacion', 'tarjeta de presentacion', 'tarjeta', 'tarjetas'],
      respuesta: '<b>🎴 TARJETAS DE PRESENTACIÓN</b><br><br>' +
        'Acabados profesionales:<br>• <b>Laminadas</b><br>• <b>Barniz a registro</b><br><br>' +
        '🎨 <i>El diseño tiene costo extra según la complejidad.</i><br><br>' +
        '👉 ' + botonWhatsApp('Hola, quiero cotizar tarjetas de presentación', 'Cotizar tarjetas por WhatsApp')
    },
    {
      id: 'notas',
      claves: ['notas de remision', 'nota de remision', 'remision', 'remisiones', 'talonario', 'talonarios', 'notas', 'notitas'],
      respuesta: '<b>📝 NOTAS DE REMISIÓN</b><br><br>' +
        'Imprimimos notas de remisión personalizadas para tu negocio.<br><br>' +
        '🎨 <i>El diseño tiene costo extra según lo que necesites.</i><br><br>' +
        '👉 ' + botonWhatsApp('Hola, quiero cotizar notas de remisión', 'Cotizar notas por WhatsApp')
    },
    {
      id: 'whatsapp',
      claves: ['whatsapp', 'contacto', 'celular', 'telefono', 'llamar', 'hablar con alguien', 'cotizar por whatsapp', 'asesor', 'humano'],
      respuesta: '<b>📲 CONTACTO DIRECTO</b><br><br>' +
        'Cotiza y haz tu pedido en tiempo real platicando con nosotros.<br><br>' +
        '👉 ' + botonWhatsApp('Hola Diseño Laser Print, quiero cotizar un trabajo', 'Abrir WhatsApp')
    },
    {
      id: 'horarios',
      claves: ['horario', 'horarios', 'abierto', 'abiertos', 'hora', 'atienden', 'sabado', 'domingo', 'abren', 'cierran', 'ubicacion', 'donde estan', 'donde quedan', 'direccion', 'sucursal', 'como llego'],
      respuesta: '<b>📍 HORARIOS Y UBICACIÓN</b><br><br>' +
        '⏰ <b>Lunes a viernes:</b> 9:00 a.m. – 6:00 p.m.<br>' +
        '⏰ <b>Sábados:</b> 9:00 a.m. – 2:00 p.m.<br>' +
        '🚫 <b>Domingos:</b> cerrado<br><br>' +
        '📍 Calz. San Mateo 27-A, San Juan Bosco, Cd. López Mateos.<br>' +
        '<a class="pixel-link" href="#ubicacionTitulo">Ver mapa en la página</a>'
    },
    {
      id: 'dtf_uv',
      claves: ['dtf uv', 'uv dtf', 'impresion uv', 'uv'],
      respuesta: '<b>✨ DTF UV</b><br><br>' +
        'El DTF UV lo cotizamos de forma personalizada. Escríbenos con tu diseño y medidas:<br><br>' +
        '👉 ' + botonWhatsApp('Hola, me interesa cotizar DTF UV', 'Cotizar DTF UV por WhatsApp')
    },
    {
      id: 'dtf_textil',
      claves: ['dtf textil', 'dtf', 'textil', 'playera', 'playeras', 'camiseta', 'sudadera'],
      respuesta: '<b>👕 DTF TEXTIL</b><br><br>' +
        '📏 <b>Rollo:</b> 57 cm de ancho; se cobra por metro de largo.<br>' +
        '💵 <b>Precio:</b> ' + dinero(CATALOGO.DTF_TEXTIL.precio) + ' por metro lineal<br>' +
        '⚠️ <b>Mínimo:</b> medio metro<br>' +
        '📅 <b>Entrega:</b> ' + ENTREGA + '<br><br>' +
        '💡 <i>Para cotizar escribe: <b>"1.5 metros de dtf"</b> o <b>"dtf de 30x40 cm"</b>.</i>'
    },
    {
      id: 'sticker',
      claves: ['vinil sticker', 'sticker', 'stickers', 'etiqueta', 'etiquetas', 'calcomania', 'calcomanias'],
      respuesta: '<b>🏷️ VINIL PARA STICKERS</b><br><br>' +
        '📏 <b>Rollo:</b> 1.5 m de ancho; se cobra por metro de largo.<br>' +
        '💵 <b>Precio:</b> ' + dinero(CATALOGO.VINIL_STICKER.precio) + ' por metro lineal<br>' +
        '⚠️ <b>Mínimo:</b> medio metro<br>' +
        '📅 <b>Entrega:</b> ' + ENTREGA + '<br><br>' +
        '💡 <i>Para cotizar escribe: <b>"1 metro de sticker"</b>.</i>'
    },
    {
      id: 'vinil',
      claves: ['vinil', 'vinilo', 'vinil impreso'],
      respuesta: '<b>🖨️ VINIL IMPRESO</b><br><br>' +
        '💵 <b>Precio:</b> ' + dinero(CATALOGO.VINIL_IMPRESO.precio) + ' por m² (mínimo medio m²)<br>' +
        '📅 <b>Entrega:</b> ' + ENTREGA + '<br><br>' +
        '💡 <i>Escribe tus medidas: <b>"vinil de 1 x 0.5 m"</b>. ¿Es para stickers? Escribe <b>"sticker"</b>.</i>'
    },
    {
      id: 'led',
      claves: ['letrero led', 'letreros', 'letrero', 'led', 'luminoso'],
      respuesta: '<b>💡 LETREROS LED</b><br><br>' +
        'Hacemos letreros personalizados en <b>MDF + lona</b>, <b>MDF</b> y <b>acrílico</b>.<br><br>' +
        '👉 ' + botonWhatsApp('Hola, me interesa cotizar un letrero LED', 'Cotizar letrero por WhatsApp')
    },
    {
      id: 'sublimacion',
      claves: ['sublimacion', 'sublimar', 'sublimado', 'tazas', 'taza'],
      respuesta: '<b>🎨 SUBLIMACIÓN</b><br><br>' +
        '💵 <b>Precio:</b> ' + dinero(CATALOGO.SUBLIMACION.precio) + ' por m²<br>' +
        '📅 <b>Entrega:</b> ' + ENTREGA + '<br><br>' +
        '💡 <i>Escribe tus medidas: <b>"sublimación de 1 x 1.5 m"</b>.</i>'
    },
    {
      id: 'lona',
      claves: ['lona impresa', 'lona', 'lonas', 'publicidad exterior', 'banner', 'manta'],
      respuesta: '<b>🖼️ LONA IMPRESA</b><br><br>' +
        '💵 <b>Precio:</b> ' + dinero(CATALOGO.LONA.precio) + ' por m² (si mide menos de 1 m², se cobra 1 m²)<br>' +
        '📅 <b>Entrega:</b> ' + ENTREGA + '<br><br>' +
        '💡 <i>Escribe tus medidas: <b>"lona de 1.5 x 2 m"</b> o <b>"3 lonas de 1x1"</b>.</i>'
    },
    {
      id: 'laser',
      claves: ['corte laser', 'grabado laser', 'corte mdf', 'laser', 'grabado', 'mdf', 'acrilico'],
      respuesta: '<b>✂️ CORTE Y GRABADO LÁSER</b><br><br>' +
        'Trabajamos <b>MDF, acrílico, papel cascarón y cartón</b>. En aluminio solo grabado.<br><br>' +
        '👉 ' + botonWhatsApp('Hola, quiero cotizar un corte láser', 'Enviar archivo por WhatsApp')
    },
    {
      id: 'gracias',
      claves: ['gracias', 'muchas gracias', 'ok gracias', 'perfecto', 'excelente'],
      respuesta: '¡Con gusto! 🙌 Si necesitas algo más, aquí estoy. Cuando quieras hacer tu pedido:<br><br>' +
        '👉 ' + botonWhatsApp('Hola, quiero hacer un pedido', 'Escribir por WhatsApp')
    }
  ];

  // Prepara las expresiones una sola vez
  CONOCIMIENTO.forEach(function (item) {
    item.patrones = item.claves.map(function (k) {
      const clave = normalizar(k);
      return { largo: clave.length, re: new RegExp('(^|[^a-z0-9])' + escaparRegex(clave) + '($|[^a-z0-9])') };
    });
  });

  function buscarRespuesta(t) {
    let mejor = null;
    let mejorPuntaje = -Infinity;

    CONOCIMIENTO.forEach(function (item) {
      item.patrones.forEach(function (p) {
        if (p.re.test(t)) {
          const puntaje = p.largo + (item.peso || 0);
          if (puntaje > mejorPuntaje) {
            mejorPuntaje = puntaje;
            mejor = item;
          }
        }
      });
    });

    return mejor ? mejor.respuesta : null;
  }

  const RESPUESTA_DEFAULT = '🤖 No estoy seguro de haber entendido.<br><br>' +
    'Prueba con algo como:<br>' +
    '• <i>"Lona de 2x3 m"</i><br>' +
    '• <i>"1.5 metros de dtf"</i><br>' +
    '• <i>"Horarios"</i><br><br>' +
    '👉 ' + botonWhatsApp('Hola, tengo una consulta', 'O pregúntale a una persona por WhatsApp');

  /* ==========================================================================
     8. CHAT DE PIXEL
     ========================================================================== */

  const Pixel = {
    widget: null,
    mensajes: null,
    input: null,
    toggleBtn: null,
    ocupado: false,

    init: function () {
      this.widget = document.getElementById('pixelChatWidget');
      this.mensajes = document.getElementById('pixelChatMessages');
      this.input = document.getElementById('pixelInput');
      this.toggleBtn = document.getElementById('pixelToggleBtn');
      if (!this.widget) return;

      this.agregarBotonSonido();
      this.eventos();
    },

    /** Agrega un botón 🔊/🔇 junto a la ✕ del chat */
    agregarBotonSonido: function () {
      const cerrar = document.getElementById('pixelCloseBtn');
      if (!cerrar) return;

      const grupo = document.createElement('div');
      grupo.className = 'pixel-header-actions';
      cerrar.parentNode.insertBefore(grupo, cerrar);

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'pixel-close-btn pixel-sound-btn';

      const pintar = function () {
        btn.textContent = Sonido.activo ? '🔊' : '🔇';
        btn.setAttribute('aria-label', Sonido.activo ? 'Silenciar sonidos' : 'Activar sonidos');
        btn.setAttribute('aria-pressed', String(!Sonido.activo));
      };
      pintar();

      btn.addEventListener('click', function () {
        Sonido.setActivo(!Sonido.activo);
        pintar();
        Sonido.play('click');
      });

      grupo.appendChild(btn);
      grupo.appendChild(cerrar);
    },

    eventos: function () {
      const self = this;

      if (this.toggleBtn) {
        this.toggleBtn.setAttribute('aria-expanded', 'false');
        this.toggleBtn.addEventListener('click', function (e) {
          e.preventDefault();
          self.estaAbierto() ? self.cerrar() : self.abrir();
        });
      }

      const cerrarBtn = document.getElementById('pixelCloseBtn');
      if (cerrarBtn) cerrarBtn.addEventListener('click', function () { self.cerrar(); });

      const form = document.getElementById('pixelChatForm');
      if (form) {
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          self.enviar(self.input ? self.input.value : '');
        });
      }

      if (this.input) {
        this.input.addEventListener('keydown', function (e) {
          if (e.key.length === 1) Sonido.play('typing');
        });
      }

      this.widget.addEventListener('click', function (e) {
        const opcion = e.target.closest('.pixel-prompt-btn');
        if (opcion) {
          e.preventDefault();
          self.enviar(opcion.getAttribute('data-prompt') || opcion.textContent);
        }

        // El enlace "Ver mapa" cierra el chat para que se vea el mapa
        const ancla = e.target.closest('a[href^="#"]');
        if (ancla) self.cerrar();
      });

      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && self.estaAbierto() && !Lightbox.abierto()) {
          self.cerrar();
          if (self.toggleBtn) self.toggleBtn.focus();
        }
      });
    },

    estaAbierto: function () {
      return this.widget.classList.contains('active');
    },

    abrir: function () {
      Sonido.play('openModal');
      this.widget.classList.add('active');
      if (this.toggleBtn) this.toggleBtn.setAttribute('aria-expanded', 'true');
      // En celular no enfocamos el input: abriría el teclado y taparía el chat
      if (this.input && !esTactil) {
        const input = this.input;
        setTimeout(function () { input.focus(); }, 150);
      }
    },

    cerrar: function () {
      if (!this.estaAbierto()) return;
      Sonido.play('closeModal');
      this.widget.classList.remove('active');
      if (this.toggleBtn) this.toggleBtn.setAttribute('aria-expanded', 'false');
    },

    enviar: function (texto) {
      texto = String(texto || '').trim();
      if (!texto || this.ocupado) return;

      if (this.input) this.input.value = '';
      this.agregarMensaje('user', texto);
      this.ocupado = true;

      const self = this;
      const escribiendo = this.mostrarEscribiendo();
      const espera = Math.min(500 + texto.length * 15, 1100);

      setTimeout(function () {
        escribiendo.remove();
        self.responder(texto);
        self.ocupado = false;
      }, espera);
    },

    /** Mensajes del usuario como texto plano (nunca HTML) */
    agregarMensaje: function (quien, contenido) {
      if (!this.mensajes) return;

      const fila = document.createElement('div');
      fila.className = 'pixel-msg ' + (quien === 'user' ? 'pixel-user-msg' : 'pixel-bot-msg');

      const burbuja = document.createElement('div');
      burbuja.className = 'pixel-msg-bubble';
      if (quien === 'user') burbuja.textContent = contenido;
      else burbuja.innerHTML = contenido;

      fila.appendChild(burbuja);
      this.mensajes.appendChild(fila);
      this.bajarScroll();
    },

    mostrarEscribiendo: function () {
      const fila = document.createElement('div');
      fila.className = 'pixel-msg pixel-bot-msg pixel-typing';
      fila.setAttribute('aria-hidden', 'true');
      fila.innerHTML = '<div class="pixel-msg-bubble"><span></span><span></span><span></span></div>';
      this.mensajes.appendChild(fila);
      this.bajarScroll();
      return fila;
    },

    bajarScroll: function () {
      this.mensajes.scrollTo({ top: this.mensajes.scrollHeight, behavior: reduceMotion ? 'auto' : 'smooth' });
    },

    responder: function (texto) {
      const t = normalizar(texto);

      // 1. ¿Trae medidas? Entonces es una cotización
      const cotizacion = Cotizador.responder(t);
      if (cotizacion) {
        this.agregarMensaje('bot', cotizacion);
        Sonido.play('success');
        return;
      }

      // 2. Preguntas generales
      const respuesta = buscarRespuesta(t);
      if (respuesta) {
        this.agregarMensaje('bot', respuesta);
        Sonido.play('success');
        return;
      }

      // 3. No entendió
      this.agregarMensaje('bot', RESPUESTA_DEFAULT);
      Sonido.play('error');
    }
  };

  /* ==========================================================================
     9. ARRANQUE
     ========================================================================== */

  function iniciar() {
    Sonido.init();
    initVideo();
    initMenuMovil();
    cargarCarrusel();
    initLightbox();
    Pixel.init();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }

  // Acceso desde la consola del navegador para pruebas: LaserPrint.Cotizador.responder("lona 2x3")
  window.LaserPrint = {
    Sonido: Sonido,
    Cotizador: Cotizador,
    CATALOGO: CATALOGO,
    preguntar: function (texto) { return buscarRespuesta(normalizar(texto)); }
  };
})();
