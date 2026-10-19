/**
 * ==============================================================================
 * DISEÑO LASER PRINT — Páginas de sección (seccion.js v1.1)
 * ==============================================================================
 * Funciona para TODAS las secciones: lee la categoría de <body data-categoria>.
 *
 * Opciones (se ponen en el HTML, sin tocar este archivo):
 *   <div id="mosaico" data-diseno="revista">   mosaico con piezas anchas/altas (DTF)
 *   <div id="mosaico" data-diseno="columnas">  columnas tipo Pinterest, foto completa
 *   <figure id="heroDestacado">                muestra el trabajo más nuevo en la portada
 *   <form id="calculadora" data-precio-m2="250" data-minimo-m2="0.1">  calculadora por m²
 *
 *  - Trae las publicaciones del panel (servidor en Render).
 *  - Las acomoda en un mosaico tipo revista: cada pieza toma la forma de su
 *    foto o video real (horizontal = ancha, vertical = alta, la más nueva grande).
 *  - Guarda una copia para que la siguiente visita cargue al instante.
 *  - Optimiza las imágenes de Cloudinary al tamaño justo (carga mucho más rápido).
 *  - Visor a pantalla completa con flechas, teclado, deslizar y botón de WhatsApp.
 */
(function () {
  'use strict';

  /* ==========================================================================
     0. CONFIGURACIÓN
     ========================================================================== */

  const API_ORIGEN = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
    ? 'http://localhost:5000'
    : 'https://laserprint-api.onrender.com';

  const WHATSAPP = '5215598788857';
  const body = document.body;
  const CATEGORIA = body.dataset.categoria || '';
  const TITULO = body.dataset.titulo || CATEGORIA;
  const MENSAJE_WA = body.dataset.whatsapp || ('Hola Laser Print, quiero cotizar ' + TITULO);

  const CLAVE_CACHE = 'lp_seccion_' + CATEGORIA;
  const CLAVE_FORMAS = 'lp_formas_v1';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esTactil = window.matchMedia('(hover: none)').matches;
  const formatoMXN = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

  const $ = function (id) { return document.getElementById(id); };

  /* ==========================================================================
     1. UTILIDADES
     ========================================================================== */

  /** "Sublimación" y "SUBLIMACION" cuentan como la misma; igual "CORTE LASER" y "CORTELASER" */
  function claveCategoria(c) {
    return String(c || '').toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '');
  }

  function linkWhatsApp(texto) {
    return 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(texto);
  }

  function urlArchivo(ruta) {
    if (!ruta) return '';
    if (/^https?:\/\//i.test(ruta)) return ruta;
    return API_ORIGEN + '/' + String(ruta).replace(/^\/+/, '');
  }

  /** Pide a Cloudinary la imagen al tamaño justo y en el mejor formato (WebP/AVIF) */
  function cld(url, ancho) {
    if (!/res\.cloudinary\.com\/.+\/image\/upload\//.test(url)) return url;
    return url.replace('/image/upload/', '/image/upload/f_auto,q_auto,c_limit,w_' + ancho + '/');
  }

  /** Portada de un video de Cloudinary (primer cuadro como imagen) */
  function portadaVideo(url) {
    if (!/res\.cloudinary\.com\/.+\/video\/upload\//.test(url)) return '';
    return url
      .replace('/video/upload/', '/video/upload/so_0,w_900,q_auto/')
      .replace(/\.(mp4|mov|webm|m4v)(\?.*)?$/i, '.jpg');
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

  /* Formas recordadas: así la siguiente visita no "brinca" al cargar */
  let formas = {};
  try { formas = JSON.parse(localStorage.getItem(CLAVE_FORMAS) || '{}'); } catch (e) {}

  function guardarForma(url, proporcion) {
    formas[url] = Math.round(proporcion * 100) / 100;
    try { localStorage.setItem(CLAVE_FORMAS, JSON.stringify(formas)); } catch (e) {}
  }

  function formaPorProporcion(p) {
    if (!p) return '';
    if (p >= 1.45) return 'ancha';
    if (p <= 0.8) return 'alta';
    return '';
  }

  /* ==========================================================================
     2. TEMA, MENÚ Y DETALLES DEL ENCABEZADO
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
    ['ctaWhatsapp', 'ctaWhatsapp2'].forEach(function (id) {
      const a = $(id);
      if (a) a.href = linkWhatsApp(MENSAJE_WA);
    });
  }

  /* ==========================================================================
     3. PDF (la librería solo se descarga si hay catálogos)
     ========================================================================== */

  let promesaPdfJs = null;

  function cargarPdfJs() {
    if (!promesaPdfJs) {
      promesaPdfJs = new Promise(function (ok, falla) {
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        s.onload = function () {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc =
            'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          ok(window.pdfjsLib);
        };
        s.onerror = falla;
        document.head.appendChild(s);
      });
    }
    return promesaPdfJs;
  }

  /** Dibuja la primera página del PDF dentro de "contenedor" */
  async function dibujarPortadaPdf(url, contenedor, anchoPx) {
    try {
      const lib = await cargarPdfJs();
      const pdf = await lib.getDocument(url).promise;
      const pagina = await pdf.getPage(1);
      const base = pagina.getViewport({ scale: 1 });
      const escala = (anchoPx || 420) / base.width * (window.devicePixelRatio > 1 ? 1.5 : 1);
      const vista = pagina.getViewport({ scale: escala });

      const canvas = document.createElement('canvas');
      canvas.width = vista.width;
      canvas.height = vista.height;
      await pagina.render({ canvasContext: canvas.getContext('2d'), viewport: vista }).promise;

      contenedor.innerHTML = '';
      contenedor.appendChild(canvas);
      return canvas;
    } catch (e) {
      return null;   // se queda el ícono 📄
    }
  }

  /* ==========================================================================
     4. MOSAICO
     ========================================================================== */

  const mosaico = $('mosaico');
  const DISENO = (mosaico && mosaico.dataset.diseno) || 'revista';
  if (mosaico) mosaico.classList.add(DISENO);
  let trabajos = [];          // publicaciones de esta sección, ya preparadas
  let filtroActual = 'todo';
  let firmaActual = null;    // null = todavía no se ha dibujado nada

  const observadorVideos = ('IntersectionObserver' in window) ? new IntersectionObserver(function (entradas) {
    entradas.forEach(function (en) {
      const v = en.target;
      if (en.isIntersecting && !reduceMotion) v.play().catch(function () {});
      else v.pause();
    });
  }, { threshold: 0.55 }) : null;

  const observadorPdf = ('IntersectionObserver' in window) ? new IntersectionObserver(function (entradas, obs) {
    entradas.forEach(function (en) {
      if (!en.isIntersecting) return;
      obs.unobserve(en.target);
      dibujarPortadaPdf(en.target.dataset.url, en.target, 420);
    });
  }, { rootMargin: '200px' }) : null;

  function esqueleto() {
    mosaico.setAttribute('aria-busy', 'true');
    mosaico.innerHTML = '';
    ['grande', '', 'alta', '', 'ancha', '', '', 'alta'].forEach(function (forma, i) {
      const d = document.createElement('div');
      d.className = 'pieza esqueleto ' + (DISENO === 'revista' ? forma : '');
      if (DISENO === 'columnas') d.style.height = [320, 220, 380, 260, 300, 240, 340, 200][i] + 'px';
      d.style.setProperty('--i', i);
      d.setAttribute('aria-hidden', 'true');
      mosaico.appendChild(d);
    });
  }

  function mensaje(icono, titulo, texto, boton) {
    mosaico.setAttribute('aria-busy', 'false');
    mosaico.innerHTML = '';
    const caja = document.createElement('div');
    caja.className = 'mosaico-mensaje';

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
      if (boton.href) {
        b.href = boton.href;
        b.target = '_blank';
        b.rel = 'noopener noreferrer';
        b.className = 'btn-cta';
      } else {
        b.type = 'button';
        b.addEventListener('click', boton.accion);
      }
      caja.appendChild(b);
    }
    mosaico.appendChild(caja);
  }

  function resumen(texto) {
    const r = $('trabajosResumen');
    if (r) r.textContent = texto;
  }

  function crearPieza(t, i, total) {
    const el = document.createElement('article');
    el.className = 'pieza ' + t.tipo;
    el.dataset.tipo = t.tipo;
    el.dataset.indice = i;
    el.tabIndex = 0;
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', 'Ver ' + t.nombre);
    el.style.setProperty('--i', Math.min(i, 14));

    // Forma: la primera es la destacada; las demás según su proporción real
    const enRevista = DISENO === 'revista';
    const destacada = enRevista && i === 0 && total >= 3;
    if (destacada) el.classList.add('grande');
    else if (enRevista) {
      const f = formaPorProporcion(formas[t.url]);
      if (f) el.classList.add(f);
    }

    const ajustarForma = function (proporcion) {
      guardarForma(t.url, proporcion);
      if (destacada || !enRevista) return;
      el.classList.remove('ancha', 'alta');
      const f = formaPorProporcion(proporcion);
      if (f) el.classList.add(f);
    };

    if (t.tipo === 'imagen') {
      const img = document.createElement('img');
      img.alt = t.nombre;
      img.decoding = 'async';
      if (i > 5) img.loading = 'lazy';
      img.addEventListener('load', function () {
        img.classList.add('cargada');
        if (img.naturalWidth && img.naturalHeight) ajustarForma(img.naturalWidth / img.naturalHeight);
      });
      img.addEventListener('error', function () {
        img.remove();
        el.classList.add('pdf');   // usa el fondo suave
        const hoja = document.createElement('div');
        hoja.className = 'pdf-hoja';
        hoja.innerHTML = '<span class="pdf-icono" aria-hidden="true">🖼️</span>';
        el.prepend(hoja);
      }, { once: true });
      if (!enRevista && formas[t.url]) {
        img.width = 800;
        img.height = Math.round(800 / formas[t.url]);
      }
      img.src = cld(t.url, destacada ? 1400 : 800);
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
        if (v.videoWidth && v.videoHeight) ajustarForma(v.videoWidth / v.videoHeight);
      });
      v.addEventListener('playing', function () { el.classList.add('reproduciendo'); });
      v.addEventListener('pause', function () { el.classList.remove('reproduciendo'); });
      el.appendChild(v);

      const play = document.createElement('span');
      play.className = 'pieza-play';
      play.setAttribute('aria-hidden', 'true');
      play.textContent = '▶';
      el.appendChild(play);

      if (observadorVideos) observadorVideos.observe(v);
    } else {
      const hoja = document.createElement('div');
      hoja.className = 'pdf-hoja';
      hoja.dataset.url = t.url;
      hoja.innerHTML = '<span class="pdf-icono" aria-hidden="true">📄</span>';
      el.appendChild(hoja);
      if (observadorPdf) observadorPdf.observe(hoja);
      else dibujarPortadaPdf(t.url, hoja, 420);
    }

    // Etiquetas
    const etiquetas = document.createElement('div');
    etiquetas.className = 'pieza-etiquetas';
    if (i === 0 && total >= 3) etiquetas.insertAdjacentHTML('beforeend', '<span class="etiqueta nuevo">Lo más nuevo</span>');
    if (t.tipo === 'video') etiquetas.insertAdjacentHTML('beforeend', '<span class="etiqueta">Video</span>');
    if (t.tipo === 'pdf') etiquetas.insertAdjacentHTML('beforeend', '<span class="etiqueta">Catálogo PDF</span>');
    if (etiquetas.children.length) el.appendChild(etiquetas);

    // Título y precio
    const info = document.createElement('div');
    info.className = 'pieza-info';
    const titulo = document.createElement('h3');
    titulo.className = 'pieza-titulo';
    titulo.textContent = t.nombre;
    info.appendChild(titulo);
    if (t.precio) {
      const precio = document.createElement('span');
      precio.className = 'pieza-precio';
      precio.textContent = t.precio;
      info.appendChild(precio);
    }
    el.appendChild(info);

    return el;
  }

  /** Tarjetas de información del <template>, intercaladas entre los trabajos */
  function notas() {
    const tpl = $('notasMosaico');
    if (!tpl) return [];
    return Array.from(tpl.content.children).map(function (n) {
      const copia = n.cloneNode(true);
      copia.dataset.tipo = 'nota';
      copia.querySelectorAll('[data-whatsapp]').forEach(function (a) { a.href = linkWhatsApp(MENSAJE_WA); });
      return copia;
    });
  }

  function render(productos) {
    trabajos = productos.map(function (p) {
      return {
        nombre: p.nombre || 'Trabajo de ' + TITULO,
        descripcion: p.descripcion || '',
        precio: precioTexto(p.precio),
        tipo: tipoDe(p),
        url: urlArchivo(p.archivoUrl)
      };
    }).filter(function (t) { return t.url; });

    if (!trabajos.length) {
      resumen('Pronto subiremos trabajos de esta sección.');
      $('filtros').hidden = true;
      mensaje('🎨', 'Aún no hay trabajos publicados',
        'Mientras tanto, escríbenos y te mandamos fotos de trabajos anteriores.',
        { texto: 'Pedir fotos por WhatsApp', href: linkWhatsApp(MENSAJE_WA + '. ¿Me pueden mandar fotos de trabajos?') });
      return;
    }

    mosaico.setAttribute('aria-busy', 'false');
    mosaico.innerHTML = '';

    const fragmento = document.createDocumentFragment();
    const extras = notas();
    trabajos.forEach(function (t, i) {
      fragmento.appendChild(crearPieza(t, i, trabajos.length));
      // Notas después del 3.º y del 7.º trabajo (si hay suficientes)
      if (i === 2 && trabajos.length >= 4 && extras[0]) fragmento.appendChild(extras[0]);
      if (i === 6 && trabajos.length >= 8 && extras[1]) fragmento.appendChild(extras[1]);
    });
    // Con pocos trabajos, al menos la tarjeta de cotizar al final
    if (trabajos.length >= 2 && trabajos.length < 8 && extras[1]) fragmento.appendChild(extras[1]);

    mosaico.appendChild(fragmento);
    actualizarFiltros();
    aplicarFiltro(filtroActual, false);
    llenarDestacado();
  }

  /** Pone el trabajo más nuevo (con foto) en la portada, si la página lo pide */
  function llenarDestacado() {
    const fig = $('heroDestacado');
    if (!fig) return;
    const idx = trabajos.findIndex(function (t) { return t.tipo === 'imagen'; });
    if (idx < 0) return;   // se queda el arte decorativo
    const t = trabajos[idx];

    let img = fig.querySelector('img');
    if (!img) {
      img = document.createElement('img');
      img.decoding = 'async';
      img.addEventListener('load', function () { fig.classList.add('con-foto'); });
      fig.prepend(img);
    }
    img.alt = t.nombre;
    img.src = cld(t.url, 1200);

    const pie = fig.querySelector('figcaption');
    if (pie) {
      pie.hidden = false;
      pie.textContent = '';
      const etiqueta = document.createElement('span');
      etiqueta.textContent = 'Trabajo reciente';
      const nombre = document.createElement('strong');
      nombre.textContent = t.nombre;
      pie.append(etiqueta, nombre);
    }

    fig.tabIndex = 0;
    fig.setAttribute('role', 'button');
    fig.setAttribute('aria-label', 'Ver ' + t.nombre);
    fig.dataset.indice = idx;
  }

  /* ==========================================================================
     5. FILTROS
     ========================================================================== */

  function actualizarFiltros() {
    const caja = $('filtros');
    const cuenta = { todo: trabajos.length, imagen: 0, video: 0, pdf: 0 };
    trabajos.forEach(function (t) { cuenta[t.tipo]++; });

    let tiposConContenido = 0;
    caja.querySelectorAll('.filtro').forEach(function (b) {
      const f = b.dataset.filtro;
      b.querySelector('span').textContent = cuenta[f];
      if (f !== 'todo') {
        b.hidden = cuenta[f] === 0;
        if (cuenta[f]) tiposConContenido++;
      }
    });
    // Solo vale la pena mostrar filtros si hay más de un tipo
    caja.hidden = tiposConContenido < 2;
    if (caja.hidden) filtroActual = 'todo';

    const partes = [];
    if (cuenta.imagen) partes.push(cuenta.imagen + (cuenta.imagen === 1 ? ' foto' : ' fotos'));
    if (cuenta.video) partes.push(cuenta.video + (cuenta.video === 1 ? ' video' : ' videos'));
    if (cuenta.pdf) partes.push(cuenta.pdf + (cuenta.pdf === 1 ? ' catálogo' : ' catálogos'));
    resumen(partes.join(' · '));
  }

  function aplicarFiltro(filtro, animar) {
    filtroActual = filtro;
    $('filtros').querySelectorAll('.filtro').forEach(function (b) {
      const activo = b.dataset.filtro === filtro;
      b.classList.toggle('activo', activo);
      b.setAttribute('aria-pressed', String(activo));
    });

    let n = 0;
    mosaico.querySelectorAll('.pieza').forEach(function (el) {
      const tipo = el.dataset.tipo;
      const visible = filtro === 'todo' || tipo === filtro;
      el.classList.toggle('oculta', !visible);
      if (visible && animar) {
        el.style.setProperty('--i', Math.min(n, 14));
        el.style.animation = 'none';
        void el.offsetWidth;   // reinicia la animación de entrada
        el.style.animation = '';
      }
      if (visible) n++;
    });
  }

  function initFiltros() {
    if (!$('filtros')) return;
    $('filtros').addEventListener('click', function (e) {
      const b = e.target.closest('.filtro');
      if (b && b.dataset.filtro !== filtroActual) aplicarFiltro(b.dataset.filtro, !reduceMotion);
    });
  }

  /* ==========================================================================
     6. VISOR
     ========================================================================== */

  const visor = $('visor');
  let listaVisor = [];
  let posVisor = 0;
  let focoPrevio = null;

  function visorAbierto() { return !visor.hidden; }

  function piezasVisibles() {
    return Array.from(mosaico.querySelectorAll('.pieza[data-indice]:not(.oculta)'))
      .map(function (el) { return trabajos[Number(el.dataset.indice)]; });
  }

  function mostrarEnVisor(pos) {
    const total = listaVisor.length;
    posVisor = (pos + total) % total;
    const t = listaVisor[posVisor];
    const media = $('visorMedia');

    media.querySelectorAll('video').forEach(function (v) { v.pause(); });
    media.innerHTML = '';

    if (t.tipo === 'imagen') {
      const img = document.createElement('img');
      img.src = cld(t.url, 1800);
      img.alt = t.nombre;
      media.appendChild(img);
    } else if (t.tipo === 'video') {
      const v = document.createElement('video');
      v.src = t.url;
      v.controls = true;
      v.autoplay = true;
      v.playsInline = true;
      v.setAttribute('playsinline', '');
      const portada = portadaVideo(t.url);
      if (portada) v.poster = portada;
      media.appendChild(v);
    } else {
      const hoja = document.createElement('div');
      hoja.className = 'pdf-hoja';
      hoja.style.cssText = 'position:relative;inset:auto;width:min(420px,80vw);aspect-ratio:8.5/11;transform:none;';
      hoja.innerHTML = '<span class="pdf-icono" aria-hidden="true">📄</span>';
      media.appendChild(hoja);
      dibujarPortadaPdf(t.url, hoja, 700);
    }

    $('visorContador').textContent = total > 1 ? (posVisor + 1) + ' / ' + total : TITULO;
    $('visorTitulo').textContent = t.nombre;
    $('visorPrecio').textContent = t.precio;
    $('visorDesc').textContent = t.descripcion;

    $('visorWhatsapp').href = linkWhatsApp(
      'Hola Laser Print, vi en su página "' + t.nombre + '" (' + TITULO + ') y quiero algo así. ¿Me pueden cotizar?'
    );
    const abrir = $('visorAbrir');
    abrir.hidden = t.tipo !== 'pdf';
    if (t.tipo === 'pdf') abrir.href = t.url;

    $('visorPrev').hidden = total < 2;
    $('visorNext').hidden = total < 2;

    // Precarga la siguiente imagen para que el cambio sea instantáneo
    const sig = listaVisor[(posVisor + 1) % total];
    if (sig && sig.tipo === 'imagen') { const pre = new Image(); pre.src = cld(sig.url, 1800); }
  }

  function abrirVisor(indiceTrabajo) {
    listaVisor = piezasVisibles();
    const pos = listaVisor.indexOf(trabajos[indiceTrabajo]);
    focoPrevio = document.activeElement;
    visor.hidden = false;
    document.body.style.overflow = 'hidden';
    mosaico.querySelectorAll('video').forEach(function (v) { v.pause(); });
    mostrarEnVisor(Math.max(0, pos));
    $('visorCerrar').focus();
  }

  function cerrarVisor() {
    if (!visorAbierto()) return;
    const media = $('visorMedia');
    media.querySelectorAll('video').forEach(function (v) { v.pause(); v.removeAttribute('src'); v.load(); });
    media.innerHTML = '';
    visor.hidden = true;
    document.body.style.overflow = '';
    if (focoPrevio && focoPrevio.focus) focoPrevio.focus();
  }

  function initDestacado() {
    const fig = $('heroDestacado');
    if (!fig) return;
    const abrir = function () {
      if (fig.dataset.indice === undefined) return;
      aplicarFiltro('todo', false);
      abrirVisor(Number(fig.dataset.indice));
    };
    fig.addEventListener('click', abrir);
    fig.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrir(); }
    });
  }

  function initVisor() {
    mosaico.addEventListener('click', function (e) {
      const el = e.target.closest('.pieza[data-indice]');
      if (el) abrirVisor(Number(el.dataset.indice));
    });
    mosaico.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const el = e.target.closest('.pieza[data-indice]');
      if (el) { e.preventDefault(); abrirVisor(Number(el.dataset.indice)); }
    });

    $('visorCerrar').addEventListener('click', cerrarVisor);
    $('visorPrev').addEventListener('click', function () { mostrarEnVisor(posVisor - 1); });
    $('visorNext').addEventListener('click', function () { mostrarEnVisor(posVisor + 1); });
    visor.addEventListener('click', function (e) {
      if (e.target === visor || e.target.classList.contains('visor-caja') || e.target.id === 'visorMedia') cerrarVisor();
    });

    document.addEventListener('keydown', function (e) {
      if (!visorAbierto()) return;
      if (e.key === 'Escape') cerrarVisor();
      else if (e.key === 'ArrowRight' && listaVisor.length > 1) mostrarEnVisor(posVisor + 1);
      else if (e.key === 'ArrowLeft' && listaVisor.length > 1) mostrarEnVisor(posVisor - 1);
    });

    // Deslizar con el dedo
    let x0 = 0;
    let y0 = 0;
    const media = $('visorMedia');
    media.addEventListener('touchstart', function (e) {
      x0 = e.changedTouches[0].clientX;
      y0 = e.changedTouches[0].clientY;
    }, { passive: true });
    media.addEventListener('touchend', function (e) {
      const dx = e.changedTouches[0].clientX - x0;
      const dy = e.changedTouches[0].clientY - y0;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) && listaVisor.length > 1) mostrarEnVisor(posVisor + (dx < 0 ? 1 : -1));
    }, { passive: true });
  }

  /* ==========================================================================
     7. CARGA DE DATOS (con copia guardada para cargar al instante)
     ========================================================================== */

  function leerCache() {
    try {
      const c = JSON.parse(localStorage.getItem(CLAVE_CACHE) || 'null');
      return Array.isArray(c) ? c : null;
    } catch (e) { return null; }
  }

  function guardarCache(lista) {
    try { localStorage.setItem(CLAVE_CACHE, JSON.stringify(lista)); } catch (e) {}
  }

  function firma(lista) {
    return lista.map(function (p) { return (p._id || p.id) + ':' + (p.updatedAt || '') + ':' + p.archivoUrl; }).join('|');
  }

  async function cargar() {
    const guardados = leerCache();
    if (guardados && guardados.length) {
      firmaActual = firma(guardados);
      render(guardados);
    } else {
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
      const clave = claveCategoria(CATEGORIA);
      const deEsta = todos
        .filter(function (p) { return p && p.activo !== false && claveCategoria(p.categoria) === clave; })
        .map(function (p) {
          return {
            _id: p._id || p.id,
            nombre: p.nombre,
            descripcion: p.descripcion,
            precio: p.precio,
            tipoArchivo: p.tipoArchivo,
            archivoUrl: p.archivoUrl,
            updatedAt: p.updatedAt
          };
        });

      guardarCache(deEsta);
      if (firma(deEsta) !== firmaActual) {   // solo se vuelve a dibujar si algo cambió
        firmaActual = firma(deEsta);
        render(deEsta);
      }
    } catch (e) {
      if (!guardados) {
        resumen('');
        mensaje('🔌', 'No pudimos cargar los trabajos',
          'El servidor no respondió. Revisa tu conexión o intenta de nuevo en un momento.',
          { texto: 'Reintentar', accion: cargar });
      }
    } finally {
      clearTimeout(aviso);
    }
  }

  /* ==========================================================================
     8. CALCULADORA POR METRO CUADRADO (opcional)
     ========================================================================== */

  function initCalculadora() {
    const form = $('calculadora');
    if (!form) return;

    const PRECIO = Number(form.dataset.precioM2) || 0;
    const MINIMO = Number(form.dataset.minimoM2) || 0;
    const ancho = form.querySelector('[name="ancho"]');
    const alto = form.querySelector('[name="alto"]');
    const piezas = form.querySelector('[name="piezas"]');
    const salida = {
      area: $('calcArea'),
      total: $('calcTotal'),
      nota: $('calcNota'),
      boton: $('calcWhatsapp')
    };

    const num = function (el) {
      const v = parseFloat(String(el && el.value || '').replace(',', '.'));
      return isFinite(v) && v > 0 ? v : 0;
    };
    const m2 = function (n) {
      return n.toLocaleString('es-MX', { maximumFractionDigits: n < 1 ? 3 : 2 }) + ' m²';
    };

    function calcular() {
      const a = num(ancho);
      const h = num(alto);
      const n = Math.max(1, Math.round(num(piezas)) || 1);

      if (!a || !h) {
        salida.area.textContent = '—';
        salida.total.textContent = '—';
        salida.nota.textContent = 'Escribe el ancho y el alto en centímetros.';
        salida.boton.href = linkWhatsApp(MENSAJE_WA);
        return;
      }

      const areaPieza = (a / 100) * (h / 100);
      const areaTotal = areaPieza * n;
      const cobrada = Math.max(areaTotal, MINIMO);
      const total = cobrada * PRECIO;

      salida.area.textContent = m2(areaTotal);
      salida.total.textContent = formatoMXN.format(total);
      salida.nota.textContent = areaTotal < MINIMO
        ? 'Se aplica el mínimo de ' + m2(MINIMO) + '.'
        : formatoMXN.format(PRECIO) + ' por m² · ' + n + (n === 1 ? ' pieza' : ' piezas') + ' de ' + a + ' × ' + h + ' cm';

      salida.boton.href = linkWhatsApp(
        'Hola Laser Print, quiero cotizar ' + TITULO + ': ' + n + (n === 1 ? ' pieza' : ' piezas') +
        ' de ' + a + ' × ' + h + ' cm (' + m2(areaTotal) + '). La calculadora me dio ' + formatoMXN.format(total) + ' aprox.'
      );
    }

    form.addEventListener('input', calcular);
    form.addEventListener('submit', function (e) { e.preventDefault(); });
    calcular();
  }

  /* ==========================================================================
     9. ARRANQUE
     ========================================================================== */

  function iniciar() {
    initTema();
    initMenu();
    initDetalles();
    initFiltros();
    initVisor();
    initDestacado();
    initCalculadora();
    cargar();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
