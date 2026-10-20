/**
 * ==============================================================================
 * DISEÑO LASER PRINT — lona.js (v1.0)
 * Archivo independiente de la página de Lona.
 *
 *  1. Tema, menú y detalles
 *  2. Simulador a escala (lona + persona de 1.70 m + ojillos + precio)
 *  3. Trabajos del panel: lona destacada en la portada + carrete horizontal
 *  4. Visor a pantalla completa
 *
 * Para cambiar precios o medidas, edita CONFIG.
 * ==============================================================================
 */
(function () {
  'use strict';

  /* ==========================================================================
     0. CONFIGURACIÓN
     ========================================================================== */

  const CONFIG = {
    categoria: 'LONA',             // exactamente como en el panel
    titulo: 'Lona',
    whatsapp: '5215598788857',
    precioM2: 85,                  // $ por m²
    minimoM2: 1,                   // m² mínimos que se cobran por pieza
    separacionOjillosM: 0.5,       // un ojillo aprox. cada 50 cm (solo para el dibujo y el conteo)
    resolucionPpp: 100,            // píxeles por pulgada recomendados para lona
    alturaPersonaM: 1.7
  };

  const API_ORIGEN = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
    ? 'http://localhost:5000'
    : 'https://laserprint-api.onrender.com';

  const CLAVE_CACHE = 'lp_seccion_' + CONFIG.categoria;
  const CLAVE_FORMAS = 'lp_formas_v1';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const formatoMXN = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
  const formatoNum = new Intl.NumberFormat('es-MX');
  const $ = function (id) { return document.getElementById(id); };
  const SVGNS = 'http://www.w3.org/2000/svg';

  function linkWhatsApp(texto) {
    return 'https://wa.me/' + CONFIG.whatsapp + '?text=' + encodeURIComponent(texto);
  }

  function metros(n) {
    return (Math.round(n * 100) / 100).toLocaleString('es-MX') + ' m';
  }

  /* ==========================================================================
     1. TEMA, MENÚ Y DETALLES
     ========================================================================== */

  function initTema() {
    const btn = $('themeToggleBtn');
    const root = document.documentElement;
    if (!btn) return;
    const pintar = function () { btn.textContent = root.dataset.theme === 'dark' ? '☀️' : '🌙'; };
    pintar();
    btn.addEventListener('click', function () {
      const nuevo = root.dataset.theme === 'dark' ? 'light' : 'dark';
      root.dataset.theme = nuevo;
      try { localStorage.setItem('theme', nuevo); } catch (e) {}
      pintar();
    });
  }

  function initMenu() {
    const btn = $('mobileMenuBtn');
    const nav = $('navLinks');
    if (!btn || !nav) return;
    const abierto = function () { return nav.classList.contains('active'); };
    function set(v) {
      nav.classList.toggle('active', v);
      btn.setAttribute('aria-expanded', String(v));
      btn.setAttribute('aria-label', v ? 'Cerrar menú' : 'Abrir menú');
    }
    btn.addEventListener('click', function (e) { e.stopPropagation(); set(!abierto()); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) set(false); });
    document.addEventListener('click', function (e) {
      if (abierto() && !nav.contains(e.target) && !btn.contains(e.target)) set(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && abierto()) { set(false); btn.focus(); }
    });
  }

  function initDetalles() {
    const year = $('year');
    if (year) year.textContent = new Date().getFullYear();
    document.querySelectorAll('.wa-general').forEach(function (a) {
      a.href = linkWhatsApp('Hola Laser Print, quiero cotizar una lona');
    });
    document.querySelectorAll('.wa-diseno').forEach(function (a) {
      a.href = linkWhatsApp('Hola Laser Print, necesito una lona y no tengo diseño. ¿Me pueden ayudar?');
    });
  }

  /* ==========================================================================
     2. SIMULADOR A ESCALA
     ========================================================================== */

  const Sim = {
    svg: null,
    ancho: null,
    alto: null,
    piezas: null,
    ojillos: null,

    init: function () {
      this.svg = $('simSvg');
      this.ancho = $('simAncho');
      this.alto = $('simAlto');
      this.piezas = $('simPiezas');
      this.ojillos = $('simOjillos');
      if (!this.svg) return;

      const self = this;
      $('simForm').addEventListener('input', function () { self.dibujar(); });
      $('simForm').addEventListener('submit', function (e) { e.preventDefault(); });

      // Medidas rápidas y tarjetas de "¿para qué la necesitas?"
      document.addEventListener('click', function (e) {
        const el = e.target.closest('[data-medida]');
        if (!el) return;
        const partes = el.dataset.medida.split('x');
        self.ancho.value = partes[0];
        self.alto.value = partes[1];
        self.dibujar();
      });

      this.dibujar();
    },

    valor: function (input, min, max) {
      const v = parseFloat(String(input.value).replace(',', '.'));
      if (!isFinite(v) || v <= 0) return 0;
      return Math.min(max, Math.max(min, v));
    },

    marcarChip: function (w, h) {
      document.querySelectorAll('.chip[data-medida]').forEach(function (c) {
        const p = c.dataset.medida.split('x').map(Number);
        c.classList.toggle('activo', p[0] === w && p[1] === h);
      });
    },

    el: function (nombre, attrs, padre) {
      const n = document.createElementNS(SVGNS, nombre);
      Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
      (padre || this.svg).appendChild(n);
      return n;
    },

    dibujar: function () {
      const w = this.valor(this.ancho, 0.1, 50);
      const h = this.valor(this.alto, 0.1, 50);
      const n = Math.max(1, Math.round(this.valor(this.piezas, 1, 999)) || 1);
      const conOjillos = this.ojillos.checked;
      this.marcarChip(w, h);

      // Limpia el dibujo (conserva el <title>)
      Array.from(this.svg.childNodes).forEach(function (nodo) {
        if (nodo.nodeName !== 'title') nodo.remove();
      });

      if (!w || !h) {
        this.resultado(null);
        return;
      }

      // Escena en centímetros: 1 m = 100 unidades
      const U = 100;
      const lw = w * U;
      const lh = h * U;
      const pAlto = CONFIG.alturaPersonaM * U;
      const pAncho = 45;
      const margenIzq = 70;
      const margenSup = 46;
      const hueco = Math.max(30, lw * 0.06);
      const altoEscena = Math.max(lh, pAlto);
      const anchoTotal = margenIzq + lw + hueco + pAncho + 30;
      const altoTotal = margenSup + altoEscena + 16;
      const suelo = margenSup + altoEscena;
      const escala = Math.max(anchoTotal, altoTotal) / 600;   // grosor de líneas parejo en cualquier tamaño

      this.svg.setAttribute('viewBox', '0 0 ' + anchoTotal + ' ' + altoTotal);

      // Degradado de la impresión
      const defs = this.el('defs', {});
      const grad = this.el('linearGradient', { id: 'degradadoLona', x1: '0', y1: '0', x2: '1', y2: '1' }, defs);
      this.el('stop', { offset: '0%', 'stop-color': '#0F4C81' }, grad);
      this.el('stop', { offset: '55%', 'stop-color': '#2C7BB6' }, grad);
      this.el('stop', { offset: '100%', 'stop-color': '#C026D3' }, grad);

      // Piso
      this.el('line', { class: 's-piso', x1: 10, y1: suelo, x2: anchoTotal - 10, y2: suelo, 'stroke-width': 1.5 * escala, 'stroke-dasharray': (4 * escala) + ' ' + (5 * escala) });

      // Lona (apoyada en el piso para comparar con la persona)
      const x0 = margenIzq;
      const y0 = suelo - lh;
      const borde = Math.min(lw, lh) * 0.05;
      this.el('rect', { class: 's-lona', x: x0, y: y0, width: lw, height: lh, rx: 2 * escala });
      this.el('rect', { class: 's-impresion', x: x0 + borde, y: y0 + borde, width: lw - 2 * borde, height: lh - 2 * borde });

      // Texto de ejemplo dentro de la lona
      const tam = Math.min(lw * 0.11, lh * 0.32);
      const txt = this.el('text', {
        x: x0 + lw / 2, y: y0 + lh / 2 + tam * 0.35, 'text-anchor': 'middle',
        fill: '#FFFFFF', 'font-family': 'Playfair Display, Georgia, serif', 'font-weight': '600', 'font-size': tam
      });
      txt.textContent = 'TU ANUNCIO';

      // Ojillos
      let totalOjillos = 0;
      if (conOjillos) {
        const sep = CONFIG.separacionOjillosM * U;
        const nx = Math.max(2, Math.round(lw / sep) + 1);
        const ny = Math.max(2, Math.round(lh / sep) + 1);
        const inset = Math.max(4 * escala, Math.min(lw, lh) * 0.035);
        const r = Math.max(3 * escala, Math.min(lw, lh) * 0.018);
        const puntos = [];
        for (let i = 0; i < nx; i++) {
          const x = x0 + inset + (lw - 2 * inset) * (i / (nx - 1));
          puntos.push([x, y0 + inset], [x, y0 + lh - inset]);
        }
        for (let j = 1; j < ny - 1; j++) {
          const y = y0 + inset + (lh - 2 * inset) * (j / (ny - 1));
          puntos.push([x0 + inset, y], [x0 + lw - inset, y]);
        }
        const self = this;
        puntos.forEach(function (p) {
          self.el('circle', { class: 's-ojillo', cx: p[0], cy: p[1], r: r, 'stroke-width': 1.5 * escala });
        });
        totalOjillos = puntos.length;
      }

      // Cotas (medidas)
      const fs = 13 * escala;
      const yCota = y0 - 18 * escala;
      this.el('line', { class: 's-cota', x1: x0, y1: yCota, x2: x0 + lw, y2: yCota, 'stroke-width': escala });
      this.el('line', { class: 's-cota', x1: x0, y1: yCota - 5 * escala, x2: x0, y2: yCota + 5 * escala, 'stroke-width': escala });
      this.el('line', { class: 's-cota', x1: x0 + lw, y1: yCota - 5 * escala, x2: x0 + lw, y2: yCota + 5 * escala, 'stroke-width': escala });
      const tAncho = this.el('text', { class: 's-cota-texto', x: x0 + lw / 2, y: yCota - 7 * escala, 'text-anchor': 'middle', 'font-size': fs });
      tAncho.textContent = metros(w);

      const xCota = x0 - 18 * escala;
      this.el('line', { class: 's-cota', x1: xCota, y1: y0, x2: xCota, y2: suelo, 'stroke-width': escala });
      this.el('line', { class: 's-cota', x1: xCota - 5 * escala, y1: y0, x2: xCota + 5 * escala, y2: y0, 'stroke-width': escala });
      this.el('line', { class: 's-cota', x1: xCota - 5 * escala, y1: suelo, x2: xCota + 5 * escala, y2: suelo, 'stroke-width': escala });
      const tAlto = this.el('text', {
        class: 's-cota-texto', x: xCota - 8 * escala, y: y0 + lh / 2, 'text-anchor': 'middle', 'font-size': fs,
        transform: 'rotate(-90 ' + (xCota - 8 * escala) + ' ' + (y0 + lh / 2) + ')'
      });
      tAlto.textContent = metros(h);

      // Persona de 1.70 m (dibujada en una caja de 45 × 170)
      const px = x0 + lw + hueco;
      const py = suelo - pAlto;
      const g = this.el('g', { class: 's-persona', transform: 'translate(' + px + ' ' + py + ')' });
      this.el('circle', { cx: 22.5, cy: 11, r: 11 }, g);
      this.el('rect', { x: 8, y: 25, width: 29, height: 62, rx: 10 }, g);
      this.el('rect', { x: 0, y: 29, width: 8, height: 52, rx: 4 }, g);
      this.el('rect', { x: 37, y: 29, width: 8, height: 52, rx: 4 }, g);
      this.el('rect', { x: 10, y: 80, width: 11.5, height: 90, rx: 5 }, g);
      this.el('rect', { x: 23.5, y: 80, width: 11.5, height: 90, rx: 5 }, g);
      const tP = this.el('text', { class: 's-persona-texto', x: px + pAncho / 2, y: py - 8 * escala, 'text-anchor': 'middle', 'font-size': 11 * escala });
      tP.textContent = '1.70 m';

      this.resultado({ w: w, h: h, n: n, ojillos: conOjillos, totalOjillos: totalOjillos });
    },

    resultado: function (d) {
      const area = $('simArea');
      const pxOut = $('simPx');
      const total = $('simTotal');
      const nota = $('simNota');
      const boton = $('simWhatsapp');

      if (!d) {
        area.textContent = '—';
        pxOut.textContent = '—';
        total.textContent = '—';
        nota.textContent = 'Escribe el ancho y el alto en metros.';
        boton.href = linkWhatsApp('Hola Laser Print, quiero cotizar una lona');
        return;
      }

      const areaPieza = d.w * d.h;
      const cobradaPieza = Math.max(areaPieza, CONFIG.minimoM2);
      const precio = cobradaPieza * CONFIG.precioM2 * d.n;
      const aPx = function (m) { return Math.round(m / 0.0254 * CONFIG.resolucionPpp); };

      area.textContent = (Math.round(areaPieza * d.n * 100) / 100).toLocaleString('es-MX') + ' m²';
      pxOut.textContent = formatoNum.format(aPx(d.w)) + ' × ' + formatoNum.format(aPx(d.h)) + ' px';
      total.textContent = formatoMXN.format(precio);

      const partes = [];
      if (areaPieza < CONFIG.minimoM2) partes.push('Se cobra el mínimo de ' + CONFIG.minimoM2 + ' m² por pieza.');
      else partes.push(formatoMXN.format(CONFIG.precioM2) + ' por m²' + (d.n > 1 ? ' · ' + d.n + ' piezas' : '') + '.');
      if (d.ojillos) partes.push('Unos ' + d.totalOjillos + ' ojillos por pieza (aprox. cada ' + (CONFIG.separacionOjillosM * 100) + ' cm).');
      partes.push('Tu imagen debe medir al menos los píxeles indicados para que salga nítida.');
      nota.textContent = partes.join(' ');

      boton.href = linkWhatsApp(
        'Hola Laser Print, quiero ' + (d.n > 1 ? d.n + ' lonas' : 'una lona') + ' de ' +
        metros(d.w) + ' × ' + metros(d.h) + (d.ojillos ? ' con ojillos' : ' sin ojillos') +
        '. El simulador me dio ' + formatoMXN.format(precio) + ' aprox.'
      );
    }
  };

  /* ==========================================================================
     3. TRABAJOS DEL PANEL
     ========================================================================== */

  function claveCategoria(c) {
    return String(c || '').toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '');
  }

  function urlArchivo(ruta) {
    if (!ruta) return '';
    if (/^https?:\/\//i.test(ruta)) return ruta;
    return API_ORIGEN + '/' + String(ruta).replace(/^\/+/, '');
  }

  function cld(url, ancho) {
    if (!/res\.cloudinary\.com\/.+\/image\/upload\//.test(url)) return url;
    return url.replace('/image/upload/', '/image/upload/f_auto,q_auto,c_limit,w_' + ancho + '/');
  }

  function portadaVideo(url) {
    if (!/res\.cloudinary\.com\/.+\/video\/upload\//.test(url)) return '';
    return url.replace('/video/upload/', '/video/upload/so_0,w_900,q_auto/').replace(/\.(mp4|mov|webm|m4v)(\?.*)?$/i, '.jpg');
  }

  function tipoDe(p) {
    const t = String(p.tipoArchivo || '').toLowerCase();
    const u = String(p.archivoUrl || '').toLowerCase();
    if (/video/.test(t) || /\.(mp4|webm|mov)(\?|$)/.test(u)) return 'video';
    if (/pdf/.test(t) || /\.pdf(\?|$)/.test(u)) return 'pdf';
    return 'imagen';
  }

  function precioTexto(precio) {
    if (precio === null || precio === undefined || precio === '' || isNaN(Number(precio))) return '';
    return formatoMXN.format(Number(precio));
  }

  let formas = {};
  try { formas = JSON.parse(localStorage.getItem(CLAVE_FORMAS) || '{}'); } catch (e) {}
  function guardarForma(url, p) {
    formas[url] = Math.round(p * 100) / 100;
    try { localStorage.setItem(CLAVE_FORMAS, JSON.stringify(formas)); } catch (e) {}
  }

  /* --- PDF: la librería solo se descarga si hay catálogos --- */
  let promesaPdf = null;
  function cargarPdfJs() {
    if (!promesaPdf) {
      promesaPdf = new Promise(function (ok, falla) {
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        s.onload = function () {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          ok(window.pdfjsLib);
        };
        s.onerror = falla;
        document.head.appendChild(s);
      });
    }
    return promesaPdf;
  }

  async function portadaPdf(url, contenedor, anchoPx) {
    try {
      const lib = await cargarPdfJs();
      const pdf = await lib.getDocument(url).promise;
      const pag = await pdf.getPage(1);
      const base = pag.getViewport({ scale: 1 });
      const vista = pag.getViewport({ scale: anchoPx / base.width * (window.devicePixelRatio > 1 ? 1.5 : 1) });
      const c = document.createElement('canvas');
      c.width = vista.width;
      c.height = vista.height;
      await pag.render({ canvasContext: c.getContext('2d'), viewport: vista }).promise;
      contenedor.innerHTML = '';
      contenedor.appendChild(c);
    } catch (e) { /* se queda el ícono 📄 */ }
  }

  const carrete = $('carrete');
  let trabajos = [];
  let firmaActual = null;

  const obsVideos = ('IntersectionObserver' in window) ? new IntersectionObserver(function (ents) {
    ents.forEach(function (en) {
      if (en.isIntersecting && !reduceMotion) en.target.play().catch(function () {});
      else en.target.pause();
    });
  }, { threshold: 0.6 }) : null;

  const obsPdf = ('IntersectionObserver' in window) ? new IntersectionObserver(function (ents, obs) {
    ents.forEach(function (en) {
      if (!en.isIntersecting) return;
      obs.unobserve(en.target);
      portadaPdf(en.target.dataset.url, en.target, 360);
    });
  }, { rootMargin: '300px' }) : null;

  function resumen(t) {
    const r = $('carreteResumen');
    if (r) r.textContent = t;
  }

  function esqueleto() {
    carrete.setAttribute('aria-busy', 'true');
    carrete.innerHTML = '';
    [1.8, 1.2, 2.2, 1.5, 1.9].forEach(function (ar, i) {
      const d = document.createElement('div');
      d.className = 'foto esqueleto';
      d.style.setProperty('--ar', ar);
      d.style.setProperty('--i', i);
      d.setAttribute('aria-hidden', 'true');
      carrete.appendChild(d);
    });
  }

  function mensaje(icono, titulo, texto, boton) {
    carrete.setAttribute('aria-busy', 'false');
    carrete.innerHTML = '';
    $('carreteFlechas').hidden = true;
    $('carreteBarra').hidden = true;

    const caja = document.createElement('div');
    caja.className = 'carrete-mensaje';
    caja.style.flex = '1';
    const i = document.createElement('span');
    i.className = 'icono';
    i.textContent = icono;
    const t = document.createElement('strong');
    t.textContent = titulo;
    const p = document.createElement('p');
    p.textContent = texto;
    caja.append(i, t, p);

    if (boton) {
      const b = boton.href ? document.createElement('a') : document.createElement('button');
      b.textContent = boton.texto;
      if (boton.href) { b.href = boton.href; b.target = '_blank'; b.rel = 'noopener noreferrer'; b.className = 'btn-cta'; }
      else { b.type = 'button'; b.addEventListener('click', boton.accion); }
      caja.appendChild(b);
    }
    carrete.appendChild(caja);
  }

  function crearFoto(t, i) {
    const el = document.createElement('article');
    el.className = 'foto ' + t.tipo;
    el.dataset.indice = i;
    el.tabIndex = 0;
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', 'Ver ' + t.nombre);
    el.style.setProperty('--i', Math.min(i, 10));
    if (formas[t.url] && t.tipo !== 'pdf') el.style.setProperty('--ar', Math.min(2.6, Math.max(0.6, formas[t.url])));

    const ajustar = function (p) {
      guardarForma(t.url, p);
      el.style.setProperty('--ar', Math.min(2.6, Math.max(0.6, p)));
      actualizarCarrete();
    };

    if (t.tipo === 'imagen') {
      const img = document.createElement('img');
      img.alt = t.nombre;
      img.decoding = 'async';
      if (i > 3) img.loading = 'lazy';
      img.addEventListener('load', function () {
        img.classList.add('cargada');
        if (img.naturalWidth && img.naturalHeight) ajustar(img.naturalWidth / img.naturalHeight);
      });
      img.addEventListener('error', function () {
        img.remove();
        el.classList.add('pdf');
        const h = document.createElement('div');
        h.className = 'hoja';
        h.textContent = '🖼️';
        el.prepend(h);
      }, { once: true });
      img.src = cld(t.url, 1100);
      el.appendChild(img);
    } else if (t.tipo === 'video') {
      const v = document.createElement('video');
      v.muted = true;
      v.loop = true;
      v.playsInline = true;
      v.setAttribute('playsinline', '');
      v.preload = 'metadata';
      const portada = portadaVideo(t.url);
      if (portada) v.poster = portada;
      v.src = t.url;
      v.addEventListener('loadedmetadata', function () {
        if (v.videoWidth && v.videoHeight) ajustar(v.videoWidth / v.videoHeight);
      });
      v.addEventListener('playing', function () { el.classList.add('reproduciendo'); });
      v.addEventListener('pause', function () { el.classList.remove('reproduciendo'); });
      el.appendChild(v);
      el.insertAdjacentHTML('beforeend', '<span class="foto-play" aria-hidden="true">▶</span>');
      if (obsVideos) obsVideos.observe(v);
    } else {
      const h = document.createElement('div');
      h.className = 'hoja';
      h.dataset.url = t.url;
      h.textContent = '📄';
      el.appendChild(h);
      if (obsPdf) obsPdf.observe(h); else portadaPdf(t.url, h, 360);
    }

    if (i === 0 && trabajos.length > 1) el.insertAdjacentHTML('beforeend', '<span class="foto-etq nuevo">Lo más nuevo</span>');
    else if (t.tipo === 'video') el.insertAdjacentHTML('beforeend', '<span class="foto-etq">Video</span>');
    else if (t.tipo === 'pdf') el.insertAdjacentHTML('beforeend', '<span class="foto-etq">Catálogo PDF</span>');

    const info = document.createElement('div');
    info.className = 'foto-info';
    const h3 = document.createElement('h3');
    h3.textContent = t.nombre;
    info.appendChild(h3);
    if (t.precio) {
      const pr = document.createElement('span');
      pr.className = 'foto-precio';
      pr.textContent = t.precio;
      info.appendChild(pr);
    }
    el.appendChild(info);
    return el;
  }

  function render(productos) {
    trabajos = productos.map(function (p) {
      return {
        nombre: p.nombre || 'Lona impresa',
        descripcion: p.descripcion || '',
        precio: precioTexto(p.precio),
        tipo: tipoDe(p),
        url: urlArchivo(p.archivoUrl)
      };
    }).filter(function (t) { return t.url; });

    llenarDestacada();

    if (!trabajos.length) {
      resumen('Pronto subiremos fotos de nuestras lonas.');
      mensaje('🪧', 'Aún no hay lonas publicadas',
        'Mientras tanto, escríbenos y te mandamos fotos de trabajos anteriores.',
        { texto: 'Pedir fotos por WhatsApp', href: linkWhatsApp('Hola Laser Print, ¿me pueden mandar fotos de lonas que hayan hecho?') });
      return;
    }

    carrete.setAttribute('aria-busy', 'false');
    carrete.innerHTML = '';
    const frag = document.createDocumentFragment();
    trabajos.forEach(function (t, i) { frag.appendChild(crearFoto(t, i)); });
    carrete.appendChild(frag);
    carrete.scrollLeft = 0;

    const n = trabajos.length;
    resumen(n + (n === 1 ? ' trabajo' : ' trabajos') + (n > 1 ? ' · desliza para ver más →' : ''));
    requestAnimationFrame(actualizarCarrete);
  }

  /** La lona más nueva (con foto) se "cuelga" en la portada */
  function llenarDestacada() {
    const fig = $('lonaDestacada');
    if (!fig) return;
    const idx = trabajos.findIndex(function (t) { return t.tipo === 'imagen'; });
    if (idx < 0) return;
    const t = trabajos[idx];

    const zona = fig.querySelector('.lona-impresion');
    let img = zona.querySelector('img');
    if (!img) {
      img = document.createElement('img');
      img.decoding = 'async';
      img.addEventListener('load', function () { fig.classList.add('con-foto'); });
      zona.prepend(img);
    }
    img.alt = t.nombre;
    img.src = cld(t.url, 1600);

    $('lonaDestacadaNombre').innerHTML = 'Trabajo reciente: <strong></strong>';
    $('lonaDestacadaNombre').querySelector('strong').textContent = t.nombre;
    $('lonaDestacadaVer').hidden = false;

    fig.dataset.indice = idx;
    fig.tabIndex = 0;
    fig.setAttribute('role', 'button');
    fig.setAttribute('aria-label', 'Ver ' + t.nombre);
  }

  /* --- Flechas y barra de avance del carrete --- */
  function actualizarCarrete() {
    const max = carrete.scrollWidth - carrete.clientWidth;
    const hayScroll = max > 4;
    $('carreteFlechas').hidden = !hayScroll;
    $('carreteBarra').hidden = !hayScroll;
    if (!hayScroll) return;
    const pos = carrete.scrollLeft;
    $('carretePrev').disabled = pos <= 2;
    $('carreteNext').disabled = pos >= max - 2;
    $('carreteAvance').style.width = Math.max(8, (pos + carrete.clientWidth) / carrete.scrollWidth * 100) + '%';
  }

  function initCarrete() {
    const paso = function () { return Math.max(260, carrete.clientWidth * 0.7); };
    $('carretePrev').addEventListener('click', function () { carrete.scrollBy({ left: -paso(), behavior: reduceMotion ? 'auto' : 'smooth' }); });
    $('carreteNext').addEventListener('click', function () { carrete.scrollBy({ left: paso(), behavior: reduceMotion ? 'auto' : 'smooth' }); });
    carrete.addEventListener('scroll', actualizarCarrete, { passive: true });
    window.addEventListener('resize', actualizarCarrete);

    // Rueda del mouse vertical = desplazamiento horizontal (solo si hay hacia dónde)
    carrete.addEventListener('wheel', function (e) {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      const max = carrete.scrollWidth - carrete.clientWidth;
      const va = carrete.scrollLeft + e.deltaY;
      if (va <= 0 || va >= max) return;   // en los extremos, deja bajar la página
      e.preventDefault();
      carrete.scrollLeft = va;
    }, { passive: false });

    carrete.addEventListener('keydown', function (e) {
      if (e.target !== carrete) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); carrete.scrollBy({ left: paso() }); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); carrete.scrollBy({ left: -paso() }); }
    });
  }

  /* --- Carga con copia guardada --- */
  function firma(lista) {
    return lista.map(function (p) { return (p._id || p.id) + ':' + (p.updatedAt || '') + ':' + p.archivoUrl; }).join('|');
  }

  async function cargar() {
    let guardados = null;
    try { guardados = JSON.parse(localStorage.getItem(CLAVE_CACHE) || 'null'); } catch (e) {}
    if (Array.isArray(guardados) && guardados.length) {
      firmaActual = firma(guardados);
      render(guardados);
    } else {
      guardados = null;
      esqueleto();
    }

    const aviso = setTimeout(function () {
      if (!guardados) resumen('Despertando el servidor… la primera visita puede tardar hasta un minuto.');
    }, 5000);

    try {
      const control = new AbortController();
      const limite = setTimeout(function () { control.abort(); }, 70000);
      const res = await fetch(API_ORIGEN + '/api/productos?limit=500', { signal: control.signal });
      clearTimeout(limite);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      const todos = Array.isArray(data) ? data : (data.productos || []);
      const clave = claveCategoria(CONFIG.categoria);
      const deEsta = todos
        .filter(function (p) { return p && p.activo !== false && claveCategoria(p.categoria) === clave; })
        .map(function (p) {
          return { _id: p._id || p.id, nombre: p.nombre, descripcion: p.descripcion, precio: p.precio, tipoArchivo: p.tipoArchivo, archivoUrl: p.archivoUrl, updatedAt: p.updatedAt };
        });

      try { localStorage.setItem(CLAVE_CACHE, JSON.stringify(deEsta)); } catch (e) {}
      if (firma(deEsta) !== firmaActual) {
        firmaActual = firma(deEsta);
        render(deEsta);
      }
    } catch (e) {
      if (!guardados) {
        resumen('');
        mensaje('🔌', 'No pudimos cargar los trabajos', 'El servidor no respondió. Revisa tu conexión o intenta de nuevo en un momento.',
          { texto: 'Reintentar', accion: cargar });
      }
    } finally {
      clearTimeout(aviso);
    }
  }

  /* ==========================================================================
     4. VISOR
     ========================================================================== */

  const visor = $('visor');
  let posVisor = 0;
  let focoPrevio = null;

  function mostrar(pos) {
    const total = trabajos.length;
    posVisor = (pos + total) % total;
    const t = trabajos[posVisor];
    const media = $('visorMedia');
    media.querySelectorAll('video').forEach(function (v) { v.pause(); });
    media.innerHTML = '';

    if (t.tipo === 'imagen') {
      const img = document.createElement('img');
      img.src = cld(t.url, 2000);
      img.alt = t.nombre;
      media.appendChild(img);
    } else if (t.tipo === 'video') {
      const v = document.createElement('video');
      v.src = t.url;
      v.controls = true;
      v.autoplay = true;
      v.playsInline = true;
      v.setAttribute('playsinline', '');
      media.appendChild(v);
    } else {
      const h = document.createElement('div');
      h.className = 'hoja';
      h.style.cssText = 'width:min(420px,80vw);margin:0;transform:none;';
      h.textContent = '📄';
      media.appendChild(h);
      portadaPdf(t.url, h, 700);
    }

    $('visorContador').textContent = total > 1 ? (posVisor + 1) + ' / ' + total : CONFIG.titulo;
    $('visorTitulo').textContent = t.nombre;
    $('visorPrecio').textContent = t.precio;
    $('visorDesc').textContent = t.descripcion;
    $('visorWhatsapp').href = linkWhatsApp('Hola Laser Print, vi en su página la lona "' + t.nombre + '" y quiero una así. ¿Me pueden cotizar?');
    $('visorAbrir').hidden = t.tipo !== 'pdf';
    if (t.tipo === 'pdf') $('visorAbrir').href = t.url;
    $('visorPrev').hidden = total < 2;
    $('visorNext').hidden = total < 2;
  }

  function abrir(indice) {
    if (!trabajos[indice]) return;
    focoPrevio = document.activeElement;
    visor.hidden = false;
    document.body.style.overflow = 'hidden';
    carrete.querySelectorAll('video').forEach(function (v) { v.pause(); });
    mostrar(indice);
    $('visorCerrar').focus();
  }

  function cerrar() {
    if (visor.hidden) return;
    const media = $('visorMedia');
    media.querySelectorAll('video').forEach(function (v) { v.pause(); v.removeAttribute('src'); v.load(); });
    media.innerHTML = '';
    visor.hidden = true;
    document.body.style.overflow = '';
    if (focoPrevio && focoPrevio.focus) focoPrevio.focus();
  }

  function initVisor() {
    const abrirDesde = function (e) {
      const el = e.target.closest('[data-indice]');
      if (el) abrir(Number(el.dataset.indice));
    };
    carrete.addEventListener('click', abrirDesde);
    $('lonaDestacada').addEventListener('click', abrirDesde);
    [carrete, $('lonaDestacada')].forEach(function (zona) {
      zona.addEventListener('keydown', function (e) {
        if ((e.key === 'Enter' || e.key === ' ') && e.target.closest('[data-indice]')) {
          e.preventDefault();
          abrirDesde(e);
        }
      });
    });

    $('visorCerrar').addEventListener('click', cerrar);
    $('visorPrev').addEventListener('click', function () { mostrar(posVisor - 1); });
    $('visorNext').addEventListener('click', function () { mostrar(posVisor + 1); });
    visor.addEventListener('click', function (e) {
      if (e.target === visor || e.target.classList.contains('visor-caja') || e.target.id === 'visorMedia') cerrar();
    });
    document.addEventListener('keydown', function (e) {
      if (visor.hidden) return;
      if (e.key === 'Escape') cerrar();
      else if (e.key === 'ArrowRight' && trabajos.length > 1) mostrar(posVisor + 1);
      else if (e.key === 'ArrowLeft' && trabajos.length > 1) mostrar(posVisor - 1);
    });

    let x0 = 0;
    let y0 = 0;
    const media = $('visorMedia');
    media.addEventListener('touchstart', function (e) { x0 = e.changedTouches[0].clientX; y0 = e.changedTouches[0].clientY; }, { passive: true });
    media.addEventListener('touchend', function (e) {
      const dx = e.changedTouches[0].clientX - x0;
      const dy = e.changedTouches[0].clientY - y0;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) && trabajos.length > 1) mostrar(posVisor + (dx < 0 ? 1 : -1));
    }, { passive: true });
  }

  /* ==========================================================================
     5. ARRANQUE
     ========================================================================== */

  function iniciar() {
    initTema();
    initMenu();
    initDetalles();
    Sim.init();
    initCarrete();
    initVisor();
    cargar();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
