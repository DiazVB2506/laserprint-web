/**
 * ==============================================================================
 * DISEÑO LASER PRINT — coroplast.js (v1.0)
 * Archivo independiente de la página de Coroplast.
 *
 *  1. Tema, menú y detalles
 *  2. Letrero de la portada (se inclina en 3D con el mouse)
 *  3. Anatomía (las capas se separan al verla)
 *  4. Pestañas de tipos de letrero
 *  5. Armador de pedido → WhatsApp
 *  6. Pared de letreros (trabajos del panel) + visor
 * ==============================================================================
 */
(function () {
  'use strict';

  /* ==========================================================================
     0. CONFIGURACIÓN
     ========================================================================== */

  const CONFIG = {
    categoria: 'COROPLAST',      // exactamente como en el panel
    titulo: 'Coroplast',
    whatsapp: '5215598788857'
  };

  const API_ORIGEN = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
    ? 'http://localhost:5000'
    : 'https://laserprint-api.onrender.com';

  const CLAVE_CACHE = 'lp_seccion_' + CONFIG.categoria;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const conMouse = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const formatoMXN = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
  const $ = function (id) { return document.getElementById(id); };

  function linkWhatsApp(texto) {
    return 'https://wa.me/' + CONFIG.whatsapp + '?text=' + encodeURIComponent(texto);
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
      a.href = linkWhatsApp('Hola Laser Print, quiero cotizar letreros de coroplast');
    });
    document.querySelectorAll('.wa-volumen').forEach(function (a) {
      a.href = linkWhatsApp('Hola Laser Print, necesito muchos letreros de coroplast. ¿Me pueden hacer una cotización por volumen?');
    });
  }

  /* ==========================================================================
     2. LETRERO DE LA PORTADA (inclinación 3D)
     ========================================================================== */

  function initLetrero() {
    const letrero = $('letrero');
    const escenario = letrero && letrero.parentElement;
    if (!letrero || reduceMotion || !conMouse) return;

    let pendiente = null;
    escenario.addEventListener('pointermove', function (e) {
      const r = escenario.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;    // -0.5 … 0.5
      const y = (e.clientY - r.top) / r.height - 0.5;
      if (pendiente) cancelAnimationFrame(pendiente);
      pendiente = requestAnimationFrame(function () {
        letrero.style.setProperty('--ry', (x * 28).toFixed(1) + 'deg');
        letrero.style.setProperty('--rx', (-y * 16).toFixed(1) + 'deg');
        letrero.style.setProperty('--brillo', (50 + x * 60).toFixed(0) + '%');
      });
    });
    escenario.addEventListener('pointerleave', function () {
      letrero.style.setProperty('--ry', '-14deg');
      letrero.style.setProperty('--rx', '0deg');
      letrero.style.setProperty('--brillo', '70%');
    });
  }

  /* ==========================================================================
     3. ANATOMÍA: las capas se separan al aparecer en pantalla
     ========================================================================== */

  function initAnatomia() {
    const a = $('anatomia');
    if (!a) return;
    if (!('IntersectionObserver' in window) || reduceMotion) {
      a.classList.add('abierta');
      return;
    }
    new IntersectionObserver(function (ents, obs) {
      if (ents[0].isIntersecting) {
        setTimeout(function () { a.classList.add('abierta'); }, 250);
        obs.disconnect();
      }
    }, { threshold: 0.45 }).observe(a);
  }

  /* ==========================================================================
     4. PESTAÑAS DE TIPOS
     ========================================================================== */

  function initTipos() {
    const tabs = Array.from(document.querySelectorAll('.tipo-tab'));
    if (!tabs.length) return;

    function activar(tab, enfocar) {
      tabs.forEach(function (t) {
        const sel = t === tab;
        t.setAttribute('aria-selected', String(sel));
        t.tabIndex = sel ? 0 : -1;
        $(t.getAttribute('aria-controls')).hidden = !sel;
      });
      if (enfocar) tab.focus();
    }

    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { activar(t, false); });
      t.addEventListener('keydown', function (e) {
        let n = null;
        if (e.key === 'ArrowRight') n = tabs[(i + 1) % tabs.length];
        if (e.key === 'ArrowLeft') n = tabs[(i - 1 + tabs.length) % tabs.length];
        if (e.key === 'Home') n = tabs[0];
        if (e.key === 'End') n = tabs[tabs.length - 1];
        if (n) { e.preventDefault(); activar(n, true); }
      });
    });

    // "Usar en mi pedido" y medidas del panel → armador
    document.querySelectorAll('.tipo-panel').forEach(function (panel) {
      const tipo = panel.dataset.tipo;
      panel.addEventListener('click', function (e) {
        const medida = e.target.closest('[data-medida]');
        const usar = e.target.closest('[data-usar-tipo]');
        if (!medida && !usar) return;
        Armador.poner({ tipo: tipo, medida: medida ? medida.dataset.medida : null });
        $('armador').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      });
    });
  }

  /* ==========================================================================
     5. ARMADOR DE PEDIDO
     ========================================================================== */

  const Armador = {
    init: function () {
      const form = $('armadorForm');
      if (!form) return;
      const self = this;
      form.addEventListener('input', function () { self.actualizar(); });
      form.addEventListener('change', function () { self.actualizar(); });
      form.addEventListener('submit', function (e) { e.preventDefault(); });

      $('armMedidas').addEventListener('click', function (e) {
        const c = e.target.closest('[data-medida]');
        if (c) self.poner({ medida: c.dataset.medida });
      });

      // La estaca solo tiene sentido para letreros con estaca: se marca sola al cambiar el tipo
      $('armTipo').addEventListener('change', function () {
        $('armEstaca').checked = $('armTipo').value === 'Letrero con estaca';
        self.actualizar();
      });

      this.actualizar();
    },

    poner: function (o) {
      if (o.tipo) {
        $('armTipo').value = o.tipo;
        $('armEstaca').checked = o.tipo === 'Letrero con estaca';
      }
      if (o.medida) {
        const p = o.medida.split('x');
        $('armAncho').value = p[0];
        $('armAlto').value = p[1];
      }
      this.actualizar();
    },

    num: function (id) {
      const v = parseFloat(String($(id).value).replace(',', '.'));
      return isFinite(v) && v > 0 ? v : 0;
    },

    actualizar: function () {
      const tipo = $('armTipo').value;
      const ancho = this.num('armAncho');
      const alto = this.num('armAlto');
      const cantidad = Math.max(1, Math.round(this.num('armCantidad')) || 1);
      const caras = (document.querySelector('input[name="caras"]:checked') || {}).value === '2' ? 2 : 1;
      const estaca = $('armEstaca').checked;
      const notas = $('armNotas').value.trim();

      // Chips de medida activos
      document.querySelectorAll('#armMedidas .chip').forEach(function (c) {
        const p = c.dataset.medida.split('x').map(Number);
        c.classList.toggle('activo', p[0] === ancho && p[1] === alto);
      });

      // Mini letrero a escala
      const mini = $('miniLetrero');
      if (ancho && alto) {
        const max = 150;
        const k = max / Math.max(ancho, alto);
        mini.style.width = Math.max(24, ancho * k) + 'px';
        mini.style.height = Math.max(24, alto * k) + 'px';
      }
      mini.classList.toggle('con-estaca', estaca);

      const medidaTxt = ancho && alto ? ancho + ' × ' + alto + ' cm' : 'Por definir';
      $('tkTipo').textContent = tipo;
      $('tkMedida').textContent = medidaTxt;
      $('tkCaras').textContent = caras === 2 ? 'Por los 2 lados' : 'De 1 lado';
      $('tkCantidad').textContent = cantidad + (cantidad === 1 ? ' pieza' : ' piezas');
      $('tkExtras').textContent = estaca ? 'Con estaca' : 'Sin extras';

      const lineas = [
        'Hola Laser Print, quiero cotizar letreros de coroplast:',
        '• Tipo: ' + tipo,
        '• Medida: ' + medidaTxt,
        '• Impresión: ' + (caras === 2 ? 'por los 2 lados' : 'de 1 lado'),
        '• Cantidad: ' + cantidad,
        '• ' + (estaca ? 'Con estaca' : 'Sin estaca')
      ];
      if (notas) lineas.push('• Notas: ' + notas);
      $('armWhatsapp').href = linkWhatsApp(lineas.join('\n'));
    }
  };

  /* ==========================================================================
     6. PARED DE LETREROS + VISOR
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

  const pared = $('pared');
  let trabajos = [];
  let firmaActual = null;

  // Inclinación "a mano" de cada letrero: siempre la misma para el mismo lugar
  const GIROS = [-2.2, 1.4, -0.8, 2.4, -1.6, 0.9, 2, -2.6, 1.1, -1.2];

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
      portadaPdf(en.target.dataset.url, en.target, 300);
    });
  }, { rootMargin: '300px' }) : null;

  function resumen(t) {
    const r = $('paredResumen');
    if (r) r.textContent = t;
  }

  function esqueleto() {
    pared.setAttribute('aria-busy', 'true');
    pared.innerHTML = '';
    for (let i = 0; i < 6; i++) {
      const d = document.createElement('div');
      d.className = 'colgado esqueleto';
      d.style.setProperty('--rot', GIROS[i] + 'deg');
      d.style.setProperty('--i', i);
      d.setAttribute('aria-hidden', 'true');
      pared.appendChild(d);
    }
  }

  function mensaje(icono, titulo, texto, boton) {
    pared.setAttribute('aria-busy', 'false');
    pared.innerHTML = '';
    const caja = document.createElement('div');
    caja.className = 'pared-mensaje';
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
    pared.appendChild(caja);
  }

  function crearColgado(t, i) {
    const el = document.createElement('article');
    el.className = 'colgado';
    el.dataset.indice = i;
    el.tabIndex = 0;
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', 'Ver ' + t.nombre);
    el.style.setProperty('--rot', GIROS[i % GIROS.length] + 'deg');
    el.style.setProperty('--i', Math.min(i, 12));

    const media = document.createElement('div');
    media.className = 'colgado-media';

    if (t.tipo === 'imagen') {
      const img = document.createElement('img');
      img.alt = t.nombre;
      img.decoding = 'async';
      if (i > 5) img.loading = 'lazy';
      img.addEventListener('load', function () { img.classList.add('cargada'); });
      img.addEventListener('error', function () {
        img.remove();
        const h = document.createElement('div');
        h.className = 'hoja';
        h.textContent = '🖼️';
        media.appendChild(h);
      }, { once: true });
      img.src = cld(t.url, 700);
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
      media.insertAdjacentHTML('beforeend', '<span class="colgado-play" aria-hidden="true">▶</span>');
      if (obsVideos) obsVideos.observe(v);
    } else {
      const h = document.createElement('div');
      h.className = 'hoja';
      h.dataset.url = t.url;
      h.textContent = '📄';
      media.appendChild(h);
      if (obsPdf) obsPdf.observe(h); else portadaPdf(t.url, h, 300);
    }

    if (i === 0 && trabajos.length > 1) media.insertAdjacentHTML('beforeend', '<span class="colgado-etq nuevo">Lo más nuevo</span>');
    else if (t.tipo === 'video') media.insertAdjacentHTML('beforeend', '<span class="colgado-etq">Video</span>');
    else if (t.tipo === 'pdf') media.insertAdjacentHTML('beforeend', '<span class="colgado-etq">Catálogo PDF</span>');

    el.appendChild(media);

    const info = document.createElement('div');
    info.className = 'colgado-info';
    const h3 = document.createElement('h3');
    h3.textContent = t.nombre;
    info.appendChild(h3);
    if (t.precio) {
      const pr = document.createElement('span');
      pr.className = 'colgado-precio';
      pr.textContent = t.precio;
      info.appendChild(pr);
    }
    el.appendChild(info);
    return el;
  }

  /** El trabajo más nuevo con foto se imprime en el letrero de la portada */
  function llenarLetrero() {
    const placa = $('letreroPlaca');
    if (!placa) return;
    const idx = trabajos.findIndex(function (t) { return t.tipo === 'imagen'; });
    if (idx < 0) return;
    const t = trabajos[idx];

    const zona = placa.querySelector('.letrero-impresion');
    let img = zona.querySelector('img');
    if (!img) {
      img = document.createElement('img');
      img.decoding = 'async';
      img.addEventListener('load', function () { placa.classList.add('con-foto'); });
      zona.prepend(img);
    }
    img.alt = t.nombre;
    img.src = cld(t.url, 1000);

    const pie = $('letreroPie');
    pie.textContent = 'Trabajo reciente: ';
    const b = document.createElement('strong');
    b.textContent = t.nombre;
    pie.appendChild(b);

    placa.dataset.indice = idx;
    placa.tabIndex = 0;
    placa.setAttribute('role', 'button');
    placa.setAttribute('aria-label', 'Ver ' + t.nombre);
  }

  function render(productos) {
    trabajos = productos.map(function (p) {
      return {
        nombre: p.nombre || 'Letrero de coroplast',
        descripcion: p.descripcion || '',
        precio: precioTexto(p.precio),
        tipo: tipoDe(p),
        url: urlArchivo(p.archivoUrl)
      };
    }).filter(function (t) { return t.url; });

    llenarLetrero();

    if (!trabajos.length) {
      resumen('Pronto subiremos fotos de nuestros letreros.');
      mensaje('🪧', 'Aún no hay letreros publicados',
        'Mientras tanto, escríbenos y te mandamos fotos de trabajos anteriores.',
        { texto: 'Pedir fotos por WhatsApp', href: linkWhatsApp('Hola Laser Print, ¿me pueden mandar fotos de letreros de coroplast que hayan hecho?') });
      return;
    }

    pared.setAttribute('aria-busy', 'false');
    pared.innerHTML = '';
    const frag = document.createDocumentFragment();
    trabajos.forEach(function (t, i) { frag.appendChild(crearColgado(t, i)); });
    pared.appendChild(frag);

    const n = trabajos.length;
    resumen(n + (n === 1 ? ' letrero' : ' letreros') + ' colgados · toca uno para verlo');
  }

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

  /* --- Visor --- */
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

    $('visorContador').textContent = total > 1 ? (posVisor + 1) + ' / ' + total : CONFIG.titulo;
    $('visorTitulo').textContent = t.nombre;
    $('visorPrecio').textContent = t.precio;
    $('visorDesc').textContent = t.descripcion;
    $('visorWhatsapp').href = linkWhatsApp('Hola Laser Print, vi en su página el letrero "' + t.nombre + '" y quiero uno así. ¿Me pueden cotizar?');
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
    pared.querySelectorAll('video').forEach(function (v) { v.pause(); });
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
    [pared, $('letreroPlaca')].forEach(function (zona) {
      zona.addEventListener('click', abrirDesde);
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
     7. ARRANQUE
     ========================================================================== */

  function iniciar() {
    initTema();
    initMenu();
    initDetalles();
    initLetrero();
    initAnatomia();
    initTipos();
    Armador.init();
    initVisor();
    cargar();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
