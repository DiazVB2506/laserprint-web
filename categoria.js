/**
 * ==============================================================================
 * DISEÑO LASER PRINT — categoria.js (v1.0)
 * Catálogo general: todos los trabajos del panel, con filtros.
 *
 *  Se puede abrir ya filtrado:   categoria.html?cat=LONA
 *  (también acepta "DTF TEXTIL / UV", "SUBLIMACIÓN", "CORTE LASER", etc.)
 *
 *  1. Tema, menú y detalles
 *  2. Carga de trabajos (con caché y aviso de servidor dormido)
 *  3. Filtros: categoría, tipo y búsqueda (se guardan en la URL)
 *  4. Tarjetas + visor
 * ==============================================================================
 */
(function () {
  'use strict';

  /* ==========================================================================
     0. CONFIGURACIÓN
     ========================================================================== */

  const CONFIG = {
    whatsapp: '5215598788857',
    porPagina: 24                 // tarjetas que se muestran antes de "Ver más"
  };

  // Categorías del sitio: nombre, página propia y color de su puntito
  const CATEGORIAS = [
    { clave: 'DTFTEXTIL/UV', nombre: 'DTF Textil / UV', pagina: 'dtf.html', color: '#0EA5E9' },
    { clave: 'SUBLIMACION',  nombre: 'Sublimación',     pagina: 'sublimacion.html', color: '#A855F7' },
    { clave: 'LONA',         nombre: 'Lona',            pagina: 'lona.html', color: '#F59E0B' },
    { clave: 'COROPLAST',    nombre: 'Coroplast',       pagina: 'coroplast.html', color: '#10B981' },
    { clave: 'CORTELASER',   nombre: 'Corte Láser',     pagina: 'cortelaser.html', color: '#EF4444' },
    { clave: 'VINIL',        nombre: 'Vinil',           pagina: 'vinil.html', color: '#EC4899' }
  ];

  const API_ORIGEN = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
    ? 'http://localhost:5000'
    : 'https://laserprint-api.onrender.com';

  const CLAVE_CACHE = 'lp_catalogo_todo';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const formatoMXN = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
  const $ = function (id) { return document.getElementById(id); };

  function linkWhatsApp(texto) {
    return 'https://wa.me/' + CONFIG.whatsapp + '?text=' + encodeURIComponent(texto);
  }

  function crear(tag, clase, texto) {
    const el = document.createElement(tag);
    if (clase) el.className = clase;
    if (texto !== undefined) el.textContent = texto;
    return el;
  }

  /** Mayúsculas, sin acentos ni espacios: "Corte Láser" → "CORTELASER" */
  function claveCategoria(c) {
    return String(c || '').toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '');
  }

  /** Para buscar: minúsculas y sin acentos */
  function normal(t) {
    return String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  function infoCategoria(clave) {
    return CATEGORIAS.find(function (c) { return c.clave === clave; }) || null;
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
      a.href = linkWhatsApp('Hola Laser Print, vi su catálogo y quiero cotizar un trabajo');
    });
  }

  /* ==========================================================================
     2. DATOS
     ========================================================================== */

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

  /** Deja solo lo que la página necesita (también es lo que se guarda en caché) */
  function limpiar(p) {
    return {
      _id: p._id || p.id,
      nombre: p.nombre,
      descripcion: p.descripcion,
      precio: p.precio,
      categoria: p.categoria,
      tipoArchivo: p.tipoArchivo,
      archivoUrl: p.archivoUrl,
      updatedAt: p.updatedAt,
      createdAt: p.createdAt
    };
  }

  function preparar(lista) {
    return lista.map(function (p) {
      const clave = claveCategoria(p.categoria);
      const cat = infoCategoria(clave);
      return {
        nombre: p.nombre || 'Trabajo',
        descripcion: p.descripcion || '',
        precio: clave === 'VINIL' ? '' : precioTexto(p.precio),   // vinil va sin precio
        tipo: tipoDe(p),
        url: urlArchivo(p.archivoUrl),
        clave: clave,
        categoria: cat ? cat.nombre : (p.categoria || 'Otros'),
        color: cat ? cat.color : '#94A3B8',
        busqueda: normal([p.nombre, p.descripcion, cat ? cat.nombre : p.categoria].join(' '))
      };
    }).filter(function (t) { return t.url; });
  }

  /* ==========================================================================
     3. FILTROS
     ========================================================================== */

  let todos = [];          // todos los trabajos
  let visibles = [];       // los que pasan el filtro
  let mostrados = 0;       // cuántas tarjetas están en pantalla
  let firmaActual = null;

  const estado = { cat: 'TODAS', tipo: 'todos', q: '' };

  function leerUrl() {
    const qs = new URLSearchParams(location.search);
    const cat = claveCategoria(qs.get('cat') || '');
    estado.cat = infoCategoria(cat) ? cat : 'TODAS';
    const tipo = qs.get('tipo');
    estado.tipo = ['imagen', 'video', 'pdf'].indexOf(tipo) >= 0 ? tipo : 'todos';
    estado.q = (qs.get('q') || '').slice(0, 80);
    $('buscar').value = estado.q;
  }

  function guardarUrl() {
    const qs = new URLSearchParams();
    if (estado.cat !== 'TODAS') qs.set('cat', infoCategoria(estado.cat).nombre.toUpperCase());
    if (estado.tipo !== 'todos') qs.set('tipo', estado.tipo);
    if (estado.q) qs.set('q', estado.q);
    const nueva = location.pathname + (qs.toString() ? '?' + qs.toString() : '');
    try { history.replaceState(null, '', nueva); } catch (e) {}
  }

  function pintarChips() {
    const caja = $('chips');
    caja.innerHTML = '';
    const cuenta = {};
    todos.forEach(function (t) { cuenta[t.clave] = (cuenta[t.clave] || 0) + 1; });

    function chip(clave, nombre, color, n) {
      const b = crear('button', 'chip');
      b.type = 'button';
      b.dataset.cat = clave;
      b.setAttribute('aria-pressed', String(estado.cat === clave));
      if (color) {
        b.style.setProperty('--color-cat', color);
        b.appendChild(crear('span', 'punto'));
      }
      b.appendChild(document.createTextNode(nombre));
      if (n !== null) b.appendChild(crear('span', 'cuenta', String(n)));
      caja.appendChild(b);
    }

    const cargado = todos.length > 0 || firmaActual !== null;
    chip('TODAS', 'Todas', null, cargado ? todos.length : null);
    CATEGORIAS.forEach(function (c) { chip(c.clave, c.nombre, c.color, cargado ? (cuenta[c.clave] || 0) : null); });

    const activo = caja.querySelector('[aria-pressed="true"]');
    if (activo && activo.scrollIntoView && caja.scrollWidth > caja.clientWidth) {
      caja.scrollLeft = activo.offsetLeft - caja.offsetLeft - 12;
    }
  }

  function pintarEncabezado() {
    const cat = infoCategoria(estado.cat);
    const titulo = $('catTitulo');
    titulo.innerHTML = '';
    if (cat) {
      titulo.appendChild(document.createTextNode('Trabajos de '));
      titulo.appendChild(crear('span', 'text-gradient', cat.nombre));
      $('catLead').textContent = 'Lo más reciente que hemos hecho en ' + cat.nombre.toLowerCase() + '. Toca uno para verlo en grande y pedir uno igual.';
      document.title = cat.nombre + ' · Catálogo | Diseño Laser Print';
    } else {
      titulo.appendChild(document.createTextNode('Nuestro '));
      titulo.appendChild(crear('span', 'text-gradient', 'catálogo'));
      $('catLead').textContent = 'Trabajos recientes de todas nuestras áreas. Filtra por lo que buscas y pídenos uno igual por WhatsApp.';
      document.title = 'Catálogo de trabajos | Diseño Laser Print';
    }
    const ir = $('irSeccion');
    ir.hidden = !cat;
    if (cat) {
      ir.href = cat.pagina;
      ir.textContent = 'Ver la página de ' + cat.nombre + ' →';
    }
    document.querySelectorAll('#tipos button').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.tipo === estado.tipo));
    });
  }

  function filtrar() {
    const palabras = normal(estado.q).split(/\s+/).filter(Boolean);
    visibles = todos.filter(function (t) {
      if (estado.cat !== 'TODAS' && t.clave !== estado.cat) return false;
      if (estado.tipo !== 'todos' && t.tipo !== estado.tipo) return false;
      return palabras.every(function (p) { return t.busqueda.indexOf(p) >= 0; });
    });
  }

  function aplicar() {
    filtrar();
    pintarChips();
    pintarEncabezado();
    guardarUrl();
    pintarResultados();
  }

  function initFiltros() {
    $('chips').addEventListener('click', function (e) {
      const b = e.target.closest('.chip');
      if (!b) return;
      estado.cat = b.dataset.cat;
      aplicar();
    });
    $('tipos').addEventListener('click', function (e) {
      const b = e.target.closest('button[data-tipo]');
      if (!b) return;
      estado.tipo = b.dataset.tipo;
      aplicar();
    });
    let espera = null;
    $('buscar').addEventListener('input', function () {
      clearTimeout(espera);
      espera = setTimeout(function () {
        estado.q = $('buscar').value.trim().slice(0, 80);
        aplicar();
      }, 180);
    });
    $('verMas').addEventListener('click', function () { agregarTarjetas(); });
  }

  /* ==========================================================================
     4. TARJETAS + VISOR
     ========================================================================== */

  const catalogo = $('catalogo');

  /* --- PDF (la librería solo se descarga si hay catálogos) --- */
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
        s.onerror = function (e) { promesaPdf = null; falla(e); };
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
      portadaPdf(en.target.dataset.url, en.target, 320);
    });
  }, { rootMargin: '300px' }) : null;

  /** Escribe el texto marcando lo que coincide con la búsqueda (sin innerHTML) */
  function textoConMarca(el, texto) {
    const palabras = normal(estado.q).split(/\s+/).filter(Boolean);
    if (!palabras.length) { el.textContent = texto; return; }
    const base = normal(texto);
    const marcas = [];
    palabras.forEach(function (p) {
      let i = base.indexOf(p);
      while (i >= 0) { marcas.push([i, i + p.length]); i = base.indexOf(p, i + p.length); }
    });
    if (!marcas.length) { el.textContent = texto; return; }
    marcas.sort(function (a, b) { return a[0] - b[0]; });
    let pos = 0;
    marcas.forEach(function (m) {
      if (m[0] < pos) return;
      el.appendChild(document.createTextNode(texto.slice(pos, m[0])));
      el.appendChild(crear('mark', '', texto.slice(m[0], m[1])));
      pos = m[1];
    });
    el.appendChild(document.createTextNode(texto.slice(pos)));
  }

  function crearTarjeta(t, i, n) {
    const el = crear('article', 'ficha');
    el.dataset.pos = i;
    el.tabIndex = 0;
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', 'Ver ' + t.nombre);
    el.style.setProperty('--i', n % CONFIG.porPagina);
    el.style.setProperty('--color-cat', t.color);

    const media = crear('div', 'ficha-media');
    if (t.tipo === 'imagen') {
      const img = crear('img');
      img.alt = t.nombre;
      img.decoding = 'async';
      if (n > 7) img.loading = 'lazy';
      img.addEventListener('error', function () { img.replaceWith(crear('div', 'hoja', '🖼️')); }, { once: true });
      img.src = cld(t.url, 600);
      media.appendChild(img);
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
      v.addEventListener('playing', function () { el.classList.add('reproduciendo'); });
      v.addEventListener('pause', function () { el.classList.remove('reproduciendo'); });
      media.appendChild(v);
      media.appendChild(crear('span', 'ficha-play', '▶'));
      if (obsVideos) obsVideos.observe(v);
    } else {
      const h = crear('div', 'hoja', '📄');
      h.dataset.url = t.url;
      media.appendChild(h);
      if (obsPdf) obsPdf.observe(h); else portadaPdf(t.url, h, 320);
    }

    if (estado.cat === 'TODAS') media.appendChild(crear('span', 'ficha-cat', t.categoria));
    if (t.tipo !== 'imagen') media.appendChild(crear('span', 'ficha-tipo', t.tipo === 'video' ? 'Video' : 'PDF'));
    el.appendChild(media);

    const info = crear('div', 'ficha-info');
    const h3 = crear('h3');
    textoConMarca(h3, t.nombre);
    info.appendChild(h3);
    if (t.descripcion) {
      const p = crear('p');
      textoConMarca(p, t.descripcion);
      info.appendChild(p);
    }
    if (t.precio) info.appendChild(crear('span', 'ficha-precio', t.precio));
    el.appendChild(info);
    return el;
  }

  function agregarTarjetas() {
    const hasta = Math.min(visibles.length, mostrados + CONFIG.porPagina);
    const frag = document.createDocumentFragment();
    for (let i = mostrados; i < hasta; i++) frag.appendChild(crearTarjeta(visibles[i], i, i - mostrados));
    catalogo.appendChild(frag);
    mostrados = hasta;
    const resto = visibles.length - mostrados;
    $('verMas').hidden = resto <= 0;
    if (resto > 0) $('verMas').textContent = 'Ver más trabajos (' + resto + ')';
  }

  function resumen(t) {
    $('catResumen').textContent = t;
  }

  function mensaje(icono, titulo, texto, boton) {
    catalogo.setAttribute('aria-busy', 'false');
    catalogo.innerHTML = '';
    $('verMas').hidden = true;
    const caja = crear('div', 'cat-mensaje');
    caja.appendChild(crear('span', 'icono', icono));
    caja.appendChild(crear('strong', '', titulo));
    caja.appendChild(crear('p', '', texto));
    if (boton) {
      const b = boton.href ? crear('a', 'btn-cta', boton.texto) : crear('button', '', boton.texto);
      if (boton.href) { b.href = boton.href; b.target = '_blank'; b.rel = 'noopener noreferrer'; }
      else { b.type = 'button'; b.addEventListener('click', boton.accion); }
      caja.appendChild(b);
    }
    catalogo.appendChild(caja);
  }

  function pintarResultados() {
    catalogo.querySelectorAll('video').forEach(function (v) { v.pause(); if (obsVideos) obsVideos.unobserve(v); });
    catalogo.innerHTML = '';
    catalogo.setAttribute('aria-busy', 'false');
    mostrados = 0;

    if (!todos.length) {
      resumen('Pronto subiremos nuestros trabajos.');
      mensaje('🖨️', 'Aún no hay trabajos publicados', 'Escríbenos y te mandamos fotos de lo que hemos hecho.',
        { texto: 'Pedir fotos por WhatsApp', href: linkWhatsApp('Hola Laser Print, ¿me pueden mandar fotos de sus trabajos?') });
      return;
    }

    if (!visibles.length) {
      const cat = infoCategoria(estado.cat);
      resumen('0 trabajos');
      mensaje('🔍', 'No encontramos trabajos con esos filtros',
        estado.q ? 'Prueba con otra palabra o quita algún filtro.' : (cat ? 'Aún no hay publicaciones de ' + cat.nombre.toLowerCase() + ' con ese tipo de archivo.' : 'Prueba quitando algún filtro.'),
        { texto: 'Quitar filtros', accion: function () { estado.cat = 'TODAS'; estado.tipo = 'todos'; estado.q = ''; $('buscar').value = ''; aplicar(); } });
      return;
    }

    const n = visibles.length;
    resumen(n + (n === 1 ? ' trabajo' : ' trabajos') + (estado.q ? ' para “' + estado.q + '”' : '') + ' · toca uno para verlo en grande');
    agregarTarjetas();
  }

  function esqueleto() {
    catalogo.setAttribute('aria-busy', 'true');
    catalogo.innerHTML = '';
    for (let i = 0; i < 8; i++) {
      const d = crear('div', 'ficha esqueleto');
      d.setAttribute('aria-hidden', 'true');
      catalogo.appendChild(d);
    }
  }

  function firma(lista) {
    return lista.map(function (p) { return (p._id || p.id) + ':' + (p.updatedAt || '') + ':' + p.archivoUrl; }).join('|');
  }

  function ordenar(lista) {
    // Lo más nuevo primero (si el servidor manda fechas)
    return lista.slice().sort(function (a, b) {
      return String(b.createdAt || b.updatedAt || '').localeCompare(String(a.createdAt || a.updatedAt || ''));
    });
  }

  async function cargar() {
    let guardados = null;
    try { guardados = JSON.parse(localStorage.getItem(CLAVE_CACHE) || 'null'); } catch (e) {}
    if (Array.isArray(guardados) && guardados.length) {
      firmaActual = firma(guardados);
      todos = preparar(guardados);
      aplicar();
    } else {
      guardados = null;
      pintarChips();
      pintarEncabezado();
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
      const lista = ordenar((Array.isArray(data) ? data : (data.productos || []))
        .filter(function (p) { return p && p.activo !== false; })
        .map(limpiar));

      try { localStorage.setItem(CLAVE_CACHE, JSON.stringify(lista)); } catch (e) {}
      if (firma(lista) !== firmaActual) {
        firmaActual = firma(lista);
        todos = preparar(lista);
        aplicar();
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

  /* --- Visor (recorre solo los trabajos filtrados) --- */
  const visor = $('visor');
  let posVisor = 0;
  let focoPrevio = null;

  function mostrar(pos) {
    const total = visibles.length;
    posVisor = (pos + total) % total;
    const t = visibles[posVisor];
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
      media.appendChild(v);
    } else {
      const h = document.createElement('div');
      h.className = 'hoja';
      h.style.cssText = 'width:min(420px,80vw);aspect-ratio:8.5/11;display:grid;place-items:center;background:#fff;border-radius:4px;font-size:3rem;overflow:hidden;';
      h.textContent = '📄';
      media.appendChild(h);
      portadaPdf(t.url, h, 700);
    }

    $('visorContador').textContent = (total > 1 ? (posVisor + 1) + ' / ' + total + ' · ' : '') + t.categoria;
    $('visorTitulo').textContent = t.nombre;
    $('visorPrecio').textContent = t.precio;
    $('visorDesc').textContent = t.descripcion;
    $('visorWhatsapp').href = linkWhatsApp('Hola Laser Print, vi en su catálogo el trabajo "' + t.nombre + '" (' + t.categoria + ') y quiero uno así. ¿Me pueden cotizar?');
    $('visorAbrir').hidden = t.tipo !== 'pdf';
    if (t.tipo === 'pdf') $('visorAbrir').href = t.url;
    $('visorPrev').hidden = total < 2;
    $('visorNext').hidden = total < 2;
  }

  function abrir(pos) {
    if (!visibles[pos]) return;
    focoPrevio = document.activeElement;
    visor.hidden = false;
    document.body.style.overflow = 'hidden';
    catalogo.querySelectorAll('video').forEach(function (v) { v.pause(); });
    mostrar(pos);
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
      const el = e.target.closest('.ficha[data-pos]');
      if (el) abrir(Number(el.dataset.pos));
    };
    catalogo.addEventListener('click', abrirDesde);
    catalogo.addEventListener('keydown', function (e) {
      if ((e.key === 'Enter' || e.key === ' ') && e.target.closest('.ficha[data-pos]')) {
        e.preventDefault();
        abrirDesde(e);
      }
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
      else if (e.key === 'ArrowRight' && visibles.length > 1) mostrar(posVisor + 1);
      else if (e.key === 'ArrowLeft' && visibles.length > 1) mostrar(posVisor - 1);
    });

    let x0 = 0;
    let y0 = 0;
    const media = $('visorMedia');
    media.addEventListener('touchstart', function (e) { x0 = e.changedTouches[0].clientX; y0 = e.changedTouches[0].clientY; }, { passive: true });
    media.addEventListener('touchend', function (e) {
      const dx = e.changedTouches[0].clientX - x0;
      const dy = e.changedTouches[0].clientY - y0;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) && visibles.length > 1) mostrar(posVisor + (dx < 0 ? 1 : -1));
    }, { passive: true });
  }

  /* ==========================================================================
     5. ARRANQUE
     ========================================================================== */

  function iniciar() {
    initTema();
    initMenu();
    initDetalles();
    leerUrl();
    initFiltros();
    initVisor();
    cargar();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
