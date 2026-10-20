/**
 * ==============================================================================
 * DISEÑO LASER PRINT — vinil.js (v1.0)
 * Archivo independiente de la página de Vinil.
 *
 *  1. Tema, menú y detalles
 *  2. Sticker de la portada y muestras de acabado
 *  3. Planificador: stickers en el rollo (por metro) y vinil impreso (por m²)
 *  4. Planilla de trabajos (panel) + visor
 * ==============================================================================
 */
(function () {
  'use strict';

  /* ==========================================================================
     0. CONFIGURACIÓN
     ========================================================================== */

  const CONFIG = {
    categoria: 'VINIL',          // exactamente como en el panel
    titulo: 'Vinil',
    whatsapp: '5215598788857',

    // Stickers (se cobran por metro lineal del rollo)
    rolloAncho: 150,             // cm
    precioMetro: 450,            // $ por metro lineal
    minimoMetros: 0.5,
    redondeoMetros: 0.1,         // el largo se redondea hacia arriba a cada 10 cm
    separacion: 0.5,             // cm entre stickers (para el corte)
    margen: 1,                   // cm de orilla del rollo

    // Vinil impreso (se cobra por m²)
    precioM2: 300,
    minimoM2: 0.5
  };

  const API_ORIGEN = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
    ? 'http://localhost:5000'
    : 'https://laserprint-api.onrender.com';

  const CLAVE_CACHE = 'lp_seccion_' + CONFIG.categoria;
  const SVG_NS = 'http://www.w3.org/2000/svg';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const formatoMXN = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
  const formatoNum = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 2 });
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

  function svgEl(tag, attrs, padre) {
    const el = document.createElementNS(SVG_NS, tag);
    Object.keys(attrs || {}).forEach(function (k) { el.setAttribute(k, attrs[k]); });
    if (padre) padre.appendChild(el);
    return el;
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
    const links = {
      '.wa-general': 'Hola Laser Print, quiero cotizar vinil / stickers',
      '.wa-otros': 'Hola Laser Print, ¿manejan vinil de corte, esmerilado o microperforado? Quiero cotizar',
      '.wa-diseno': 'Hola Laser Print, necesito que me hagan el diseño para mis stickers / vinil. ¿Cuánto cuesta?'
    };
    Object.keys(links).forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (a) { a.href = linkWhatsApp(links[sel]); });
    });
  }

  /* ==========================================================================
     2. STICKER DE LA PORTADA Y ACABADOS
     ========================================================================== */

  function initPortada() {
    const pegatina = document.querySelector('.pegatina-grande');
    const escena = document.querySelector('.escena');
    if (!pegatina || !escena) return;

    // Se despega solita una vez para que se note que es un sticker
    if (!reduceMotion) {
      setTimeout(function () { pegatina.classList.add('despegando'); }, 900);
      setTimeout(function () { pegatina.classList.remove('despegando'); }, 2300);
    }
    // En celular: tocarlo lo despega o lo vuelve a pegar
    escena.addEventListener('click', function () { pegatina.classList.toggle('despegando'); });
  }

  function initAcabados() {
    document.querySelectorAll('.muestra-acabado').forEach(function (m) {
      function mover(e) {
        const r = m.getBoundingClientRect();
        m.style.setProperty('--x', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
        m.style.setProperty('--y', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
      }
      m.addEventListener('pointermove', mover);
      m.addEventListener('pointerdown', mover);
    });
  }

  /* ==========================================================================
     3. PLANIFICADOR
     ========================================================================== */

  const Plan = (function () {
    const plan = document.querySelector('.plan');
    const form = $('planForm');
    const svg = $('rolloSvg');
    const resultado = $('resultado');
    const aviso = $('planAviso');
    const tip = $('planTip');
    const boton = $('planWhatsapp');
    let modo = 'stickers';
    let imagenUrl = null;

    const RAPIDAS = {
      circulo: [[3], [4], [5], [7], [10]],
      cuadrado: [[3], [5], [7], [10]],
      rectangulo: [[5, 3], [8, 5], [10, 7], [15, 10]],
      impreso: [[50, 50], [100, 50], [100, 100], [150, 100]]
    };

    const NOMBRE_FORMA = { circulo: 'Círculo', cuadrado: 'Cuadrado', rectangulo: 'Rectángulo' };

    function forma() {
      const el = form.querySelector('input[name="forma"]:checked');
      return el ? el.value : 'circulo';
    }

    function acabado() {
      const el = form.querySelector('input[name="acabado"]:checked');
      return el ? el.value : 'Brillante';
    }

    function numero(id) {
      const v = parseFloat(String($(id).value).replace(',', '.'));
      return isFinite(v) && v > 0 ? v : null;
    }

    function cm(n) { return formatoNum.format(Math.round(n * 10) / 10); }

    function unaMedida() {
      return modo === 'stickers' && forma() !== 'rectangulo';
    }

    /* ---------- etiquetas, medidas rápidas y campos ---------- */

    function pintarCampos() {
      plan.dataset.modo = modo;
      document.querySelectorAll('.modos button').forEach(function (b) {
        b.setAttribute('aria-pressed', String(b.dataset.modo === modo));
      });

      const una = unaMedida();
      document.querySelector('.plan-fila').classList.toggle('una', una);
      $('campoAlto').hidden = una;
      $('pPor').hidden = una;
      $('etqMedida').textContent = modo === 'impreso' ? 'Medida de cada pieza'
        : forma() === 'circulo' ? 'Diámetro de cada sticker'
        : forma() === 'cuadrado' ? 'Lado de cada sticker' : 'Medida de cada sticker';
      $('etqCantidad').textContent = modo === 'impreso' ? '¿Cuántas piezas?' : '¿Cuántos stickers?';
      $('pAncho').setAttribute('aria-label', una ? (forma() === 'circulo' ? 'Diámetro en centímetros' : 'Lado en centímetros') : 'Ancho en centímetros');

      const lista = RAPIDAS[modo === 'impreso' ? 'impreso' : forma()];
      const caja = $('rapidas');
      caja.innerHTML = '';
      lista.forEach(function (m) {
        const b = crear('button', '', m.length === 1 ? (forma() === 'circulo' ? 'Ø ' : '') + m[0] + ' cm' : m[0] + ' × ' + m[1] + ' cm');
        b.type = 'button';
        b.dataset.a = m[0];
        b.dataset.b = m[1] || m[0];
        caja.appendChild(b);
      });
      marcarRapida();
    }

    function marcarRapida() {
      const a = numero('pAncho');
      const b = unaMedida() ? a : numero('pAlto');
      $('rapidas').querySelectorAll('button').forEach(function (btn) {
        btn.setAttribute('aria-pressed', String(Number(btn.dataset.a) === a && Number(btn.dataset.b) === b));
      });
    }

    /* ---------- cálculos ---------- */

    function calcularStickers(w, h, cantidad) {
      const g = CONFIG.separacion;
      const util = CONFIG.rolloAncho - CONFIG.margen * 2;

      function acomodo(ancho, alto) {
        const columnas = Math.floor((util + g) / (ancho + g));
        if (columnas < 1) return null;
        const filas = Math.ceil(cantidad / columnas);
        const largo = filas * alto + (filas - 1) * g + CONFIG.margen * 2;
        return { columnas: columnas, filas: filas, largo: largo, ancho: ancho, alto: alto };
      }

      let mejor = acomodo(w, h);
      if (w !== h) {
        const girado = acomodo(h, w);
        if (girado && (!mejor || girado.largo < mejor.largo - 0.01)) { mejor = girado; mejor.girado = true; }
      }
      if (!mejor) return null;

      const paso = CONFIG.redondeoMetros;
      let metros = Math.ceil((mejor.largo / 100) / paso - 1e-9) * paso;
      metros = Math.max(CONFIG.minimoMetros, +metros.toFixed(2));
      const filasQueCaben = Math.floor((metros * 100 - CONFIG.margen * 2 + g) / (mejor.alto + g));

      mejor.metros = metros;
      mejor.capacidad = filasQueCaben * mejor.columnas;
      mejor.precio = metros * CONFIG.precioMetro;
      mejor.porPieza = mejor.precio / cantidad;
      mejor.esMinimo = metros === CONFIG.minimoMetros && mejor.largo / 100 < CONFIG.minimoMetros;
      return mejor;
    }

    function calcularImpreso(w, h, piezas) {
      const area = w * h / 10000;
      const total = area * piezas;
      const cobrado = Math.max(CONFIG.minimoM2, total);
      return {
        area: area,
        total: total,
        cobrado: cobrado,
        precio: cobrado * CONFIG.precioM2,
        esMinimo: total < CONFIG.minimoM2
      };
    }

    /* ---------- dibujo ---------- */

    function definirImagen(defs, idClip, circulo) {
      const clip = svgEl('clipPath', { id: idClip, clipPathUnits: 'objectBoundingBox' }, defs);
      if (circulo) svgEl('circle', { cx: 0.5, cy: 0.5, r: 0.5 }, clip);
      else svgEl('rect', { width: 1, height: 1, rx: 0.08, ry: 0.08 }, clip);
    }

    function dibujarRollo(r, cantidad) {
      svg.innerHTML = '';
      const A = CONFIG.rolloAncho;
      const LARGO_MAX = 300;                       // cm que se dibujan como máximo
      const largoHoja = r.metros * 100;
      const L = Math.min(largoHoja, LARGO_MAX);
      // Lo más largo siempre va acostado: si el pedazo mide menos que el ancho del rollo,
      // el ancho del rollo va a lo largo de la pantalla.
      const acostado = L >= A;
      const W = acostado ? L : A;                  // medidas del dibujo
      const H = acostado ? A : L;
      const t = Math.max(4, Math.min(W, H) * 0.06, W * 0.03);
      svg.setAttribute('viewBox', [-t * 2.2, -t * 0.6, W + t * 2.6, H + t * 3].map(function (n) { return +n.toFixed(2); }).join(' '));

      // (u = a lo ancho del rollo, v = a lo largo) → coordenadas del dibujo
      function pos(u, v, du, dv) {
        return acostado ? { x: v, y: u, w: dv, h: du } : { x: u, y: v, w: du, h: dv };
      }

      const defs = svgEl('defs', {}, svg);
      const circulo = forma() === 'circulo';
      if (imagenUrl) definirImagen(defs, 'clipStk', circulo);

      svgEl('rect', { class: 'vinil-hoja', x: 0, y: 0, width: W, height: H, rx: 1.5 }, svg);

      const g = CONFIG.separacion;
      const m = CONFIG.margen;
      const grupo = svgEl('g', {}, svg);
      const MAX_DIBUJO = 700;
      let dibujados = 0;
      let reales = 0;

      for (let i = 0; i < Math.max(cantidad, r.capacidad) && dibujados < MAX_DIBUJO; i++) {
        const fila = Math.floor(i / r.columnas);
        const col = i % r.columnas;
        const v = m + fila * (r.alto + g);
        if (v + r.alto > L + 0.01) break;
        const q = pos(m + col * (r.ancho + g), v, r.ancho, r.alto);
        const lleno = i < cantidad;
        if (lleno && imagenUrl) {
          svgEl('image', {
            href: imagenUrl, x: q.x, y: q.y, width: q.w, height: q.h,
            preserveAspectRatio: 'xMidYMid slice', 'clip-path': 'url(#clipStk)'
          }, grupo);
        } else if (circulo) {
          svgEl('ellipse', { class: lleno ? 'stk' : 'stk-borde', cx: q.x + q.w / 2, cy: q.y + q.h / 2, rx: q.w / 2, ry: q.h / 2 }, grupo);
        } else {
          const rad = lleno ? Math.min(q.w, q.h) * 0.12 : 0.6;
          svgEl('rect', { class: lleno ? 'stk' : 'stk-borde', x: q.x, y: q.y, width: q.w, height: q.h, rx: rad, ry: rad }, grupo);
        }
        dibujados++;
        if (lleno) reales++;
      }

      // Cotas: izquierda = alto del dibujo, abajo = ancho del dibujo
      const textoAncho = '1.5 m';
      const textoLargo = (largoHoja > LARGO_MAX ? 'primeros 3 m de ' : '') + formatoNum.format(r.metros) + ' m';
      const cx = -t * 1.1;
      svgEl('path', { class: 'cota', d: 'M' + cx + ' 0V' + H + 'M' + (cx - 1) + ' 0H' + (cx + 1) + 'M' + (cx - 1) + ' ' + H + 'H' + (cx + 1) }, svg);
      const tv = svgEl('text', { class: 'cota-txt', x: cx - t * 0.35, y: H / 2, 'font-size': t, 'text-anchor': 'middle', transform: 'rotate(-90 ' + (cx - t * 0.35) + ' ' + (H / 2) + ')' }, svg);
      tv.textContent = acostado ? textoAncho : textoLargo;
      const cy = H + t * 1.1;
      svgEl('path', { class: 'cota', d: 'M0 ' + cy + 'H' + W + 'M0 ' + (cy - 1) + 'V' + (cy + 1) + 'M' + W + ' ' + (cy - 1) + 'V' + (cy + 1) }, svg);
      const th = svgEl('text', { class: 'cota-txt', x: W / 2, y: cy + t * 1.25, 'font-size': t, 'text-anchor': 'middle' }, svg);
      th.textContent = acostado ? textoLargo : textoAncho;

      const mas = $('rolloMas');
      const faltan = cantidad - reales;
      mas.hidden = faltan <= 0;
      if (faltan > 0) mas.textContent = '+' + faltan.toLocaleString('es-MX') + ' más';
      $('rolloEtq').textContent = 'ROLLO · 1.5 m DE ANCHO';
      svg.setAttribute('aria-label', 'Acomodo: ' + r.columnas + ' stickers por fila, ' + r.filas + ' filas, ' + formatoNum.format(r.metros) + ' metros de rollo');
    }

    function dibujarPieza(w, h, piezas) {
      svg.innerHTML = '';
      const S = Math.max(w, h, 100) * 1.12;
      const t = S * 0.04;
      svg.setAttribute('viewBox', [-t * 2.2, -t * 0.6, S + t * 2.6, S + t * 3].map(function (n) { return +n.toFixed(2); }).join(' '));

      // Cuadrícula: cuadros de 10 cm (o de 50 cm si es muy grande)
      const paso = S > 400 ? 50 : 10;
      let d = '';
      for (let v = 0; v <= S + 0.01; v += paso) d += 'M' + v + ' 0V' + S + 'M0 ' + v + 'H' + S;
      svgEl('path', { class: 'reticula', d: d, 'stroke-width': S / 600 }, svg);

      const x = (S - w) / 2;
      const y = (S - h) / 2;
      if (imagenUrl) {
        svgEl('image', { href: imagenUrl, x: x, y: y, width: w, height: h, preserveAspectRatio: 'xMidYMid slice' }, svg);
        svgEl('rect', { x: x, y: y, width: w, height: h, fill: 'none', class: 'pieza', style: 'fill:none', 'stroke-width': S / 300 }, svg);
      } else {
        svgEl('rect', { class: 'pieza', x: x, y: y, width: w, height: h, rx: Math.min(w, h) * 0.02, 'stroke-width': S / 300 }, svg);
      }

      const cxp = x - t * 0.9;
      svgEl('path', { class: 'cota', d: 'M' + cxp + ' ' + y + 'V' + (y + h), 'stroke-width': S / 500 }, svg);
      const tv = svgEl('text', { class: 'cota-txt', x: cxp - t * 0.35, y: y + h / 2, 'font-size': t, 'text-anchor': 'middle', transform: 'rotate(-90 ' + (cxp - t * 0.35) + ' ' + (y + h / 2) + ')' }, svg);
      tv.textContent = cm(h) + ' cm';
      const cyp = y + h + t * 0.9;
      svgEl('path', { class: 'cota', d: 'M' + x + ' ' + cyp + 'H' + (x + w), 'stroke-width': S / 500 }, svg);
      const th = svgEl('text', { class: 'cota-txt', x: x + w / 2, y: cyp + t * 1.25, 'font-size': t, 'text-anchor': 'middle' }, svg);
      th.textContent = cm(w) + ' cm';

      const mas = $('rolloMas');
      mas.hidden = piezas < 2;
      mas.textContent = '× ' + piezas.toLocaleString('es-MX') + ' piezas';
      $('rolloEtq').textContent = 'A ESCALA · CUADROS DE ' + paso + ' cm';
      svg.setAttribute('aria-label', 'Pieza de ' + cm(w) + ' por ' + cm(h) + ' centímetros');
    }

    /* ---------- resultado ---------- */

    function ficha(datos) {
      resultado.innerHTML = '';
      datos.forEach(function (d) {
        const li = crear('li', d[2] || '');
        li.appendChild(crear('span', '', d[0]));
        li.appendChild(crear('strong', '', d[1]));
        resultado.appendChild(li);
      });
    }

    function mostrarAviso(t) {
      aviso.hidden = !t;
      aviso.textContent = t || '';
    }

    function mostrarTip(texto, botonTexto, accion) {
      tip.innerHTML = '';
      tip.hidden = !texto;
      if (!texto) return;
      tip.appendChild(crear('span', '', texto));
      if (botonTexto) {
        const b = crear('button', '', botonTexto);
        b.type = 'button';
        b.addEventListener('click', accion);
        tip.appendChild(b);
      }
    }

    function actualizar() {
      marcarRapida();
      const w = numero('pAncho');
      const h = unaMedida() ? w : numero('pAlto');
      const cantidad = Math.max(1, Math.round(numero('pCantidad') || 1));
      mostrarTip('');

      if (!w || !h) {
        svg.innerHTML = '';
        $('rolloMas').hidden = true;
        ficha([['Precio estimado', '—', 'grande']]);
        mostrarAviso('Escribe la medida en centímetros para calcular.');
        boton.href = linkWhatsApp('Hola Laser Print, quiero cotizar ' + (modo === 'impreso' ? 'vinil impreso' : 'stickers'));
        return;
      }

      if (modo === 'stickers') {
        const r = calcularStickers(w, h, cantidad);
        if (!r) {
          svg.innerHTML = '';
          $('rolloMas').hidden = true;
          ficha([['Precio estimado', '—', 'grande']]);
          mostrarAviso('Ese sticker es más ancho que el rollo (1.5 m). Para piezas grandes usa vinil impreso por m².');
          mostrarTip('¿Lo calculamos como vinil impreso?', 'Calcular por m²', function () { cambiarModo('impreso', true); });
          boton.href = linkWhatsApp('Hola Laser Print, quiero cotizar un vinil de ' + cm(w) + ' × ' + cm(h) + ' cm');
          return;
        }
        mostrarAviso(r.esMinimo ? 'Tu pedido usa menos de medio metro: se cobra el mínimo de 0.5 m.' : '');
        dibujarRollo(r, cantidad);
        ficha([
          ['Precio estimado', formatoMXN.format(r.precio), 'grande'],
          ['Caben por fila', r.columnas + (r.girado ? ' (girados)' : '')],
          ['Filas', String(r.filas)],
          ['Rollo', formatoNum.format(r.metros) + ' m lineal'],
          ['Cada sticker', formatoMXN.format(r.porPieza)]
        ]);

        const extra = r.capacidad - cantidad;
        if (extra > 0) {
          const nuevo = formatoMXN.format(r.precio / r.capacidad);
          mostrarTip('En los mismos ' + formatoNum.format(r.metros) + ' m caben ' + r.capacidad.toLocaleString('es-MX') +
            '. Pidiendo ' + extra.toLocaleString('es-MX') + ' más, cada uno te sale en ' + nuevo + '.',
            'Pedir ' + r.capacidad.toLocaleString('es-MX'),
            function () { $('pCantidad').value = r.capacidad; actualizar(); });
        }

        const nombre = forma() === 'circulo' ? 'Círculo de ' + cm(w) + ' cm' : forma() === 'cuadrado' ? 'Cuadrado de ' + cm(w) + ' cm' : 'Rectángulo de ' + cm(w) + ' × ' + cm(h) + ' cm';
        boton.href = linkWhatsApp([
          'Hola Laser Print 👋, quiero stickers:',
          '• Forma: ' + nombre,
          '• Cantidad: ' + cantidad.toLocaleString('es-MX'),
          '• Acabado: ' + acabado(),
          '• Estimado en su página: ' + formatoNum.format(r.metros) + ' m lineal = ' + formatoMXN.format(r.precio),
          '',
          'Les mando mi diseño en este chat.'
        ].join('\n'));
      } else {
        const r = calcularImpreso(w, h, cantidad);
        const avisos = [];
        if (r.esMinimo) avisos.push('Menos de medio m²: se cobra el mínimo de 0.5 m².');
        if (Math.min(w, h) > CONFIG.rolloAncho) avisos.push('Mide más de 1.5 m por ambos lados: confírmanos por WhatsApp cómo se arma.');
        mostrarAviso(avisos.join(' '));
        dibujarPieza(w, h, cantidad);
        ficha([
          ['Precio estimado', formatoMXN.format(r.precio), 'grande'],
          ['Área por pieza', formatoNum.format(r.area) + ' m²'],
          ['Área total', formatoNum.format(r.total) + ' m²'],
          ['Se cobra', formatoNum.format(r.cobrado) + ' m²'],
          ['Precio por m²', formatoMXN.format(CONFIG.precioM2)]
        ]);
        boton.href = linkWhatsApp([
          'Hola Laser Print 👋, quiero vinil impreso:',
          '• Medida: ' + cm(w) + ' × ' + cm(h) + ' cm',
          '• Piezas: ' + cantidad.toLocaleString('es-MX'),
          '• Acabado: ' + acabado(),
          '• Estimado en su página: ' + formatoNum.format(r.cobrado) + ' m² = ' + formatoMXN.format(r.precio),
          '',
          'Les mando mi diseño en este chat.'
        ].join('\n'));
      }
    }

    function cambiarModo(nuevo, conservar) {
      if (nuevo === modo) return;
      modo = nuevo;
      if (conservar) {
        $('pCantidad').value = 1;
      } else if (modo === 'impreso') {
        $('pAncho').value = 100;
        $('pAlto').value = 50;
        $('pCantidad').value = 1;
      } else {
        $('pAncho').value = 5;
        $('pAlto').value = forma() === 'rectangulo' ? 3 : 5;
        $('pCantidad').value = 100;
      }
      pintarCampos();
      actualizar();
    }

    function initDiseno() {
      const input = $('pDiseno');
      input.addEventListener('change', function () {
        const f = input.files && input.files[0];
        if (!f) return;
        if (!/^image\//.test(f.type) || f.size > 25 * 1024 * 1024) {
          $('subirNombre').textContent = 'Usa PNG, JPG o SVG (máx. 25 MB)';
          return;
        }
        if (imagenUrl) URL.revokeObjectURL(imagenUrl);
        imagenUrl = URL.createObjectURL(f);
        const mini = $('subirMini');
        mini.innerHTML = '';
        const img = crear('img');
        img.alt = '';
        img.src = imagenUrl;
        mini.appendChild(img);
        $('subirNombre').textContent = f.name;
        actualizar();
      });
    }

    function init() {
      if (!plan || !form) return;

      document.querySelectorAll('.modos button').forEach(function (b) {
        b.addEventListener('click', function () { cambiarModo(b.dataset.modo); });
      });
      document.querySelectorAll('.tarifa[data-ir]').forEach(function (a) {
        a.addEventListener('click', function () { cambiarModo(a.dataset.ir); });
      });

      $('rapidas').addEventListener('click', function (e) {
        const b = e.target.closest('button');
        if (!b) return;
        $('pAncho').value = b.dataset.a;
        $('pAlto').value = b.dataset.b;
        actualizar();
      });

      form.querySelector('.menos').addEventListener('click', function () { pasoCantidad(-1); });
      form.querySelector('.mas').addEventListener('click', function () { pasoCantidad(1); });

      form.addEventListener('input', function (e) {
        if (e.target.type === 'number') actualizar();
      });
      form.addEventListener('change', function (e) {
        if (e.target.name === 'forma') {
          if (e.target.value === 'rectangulo' && numero('pAncho') === numero('pAlto')) {
            $('pAlto').value = Math.max(1, Math.round((numero('pAncho') || 5) * 0.6 * 10) / 10);
          }
          pintarCampos();
          actualizar();
        } else if (e.target.name === 'acabado') {
          actualizar();
        }
      });
      form.addEventListener('submit', function (e) { e.preventDefault(); });

      initDiseno();
      pintarCampos();
      actualizar();
    }

    // Botones − / +: pasos cómodos según la cantidad
    function pasoCantidad(dir) {
      const actual = Math.max(1, Math.round(numero('pCantidad') || 1));
      let paso = 1;
      if (modo === 'stickers') paso = actual >= 500 ? 100 : actual >= 100 ? 50 : actual >= 20 ? 10 : 1;
      let nuevo = dir > 0 ? Math.floor(actual / paso) * paso + paso : Math.ceil(actual / paso) * paso - paso;
      nuevo = Math.max(1, nuevo);
      $('pCantidad').value = nuevo;
      actualizar();
    }

    return { init: init };
  })();

  /* ==========================================================================
     4. PLANILLA DE TRABAJOS + VISOR
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

  const planilla = $('planilla');
  let trabajos = [];
  let firmaActual = null;

  // Cada sticker queda "pegado" un poquito chueco, siempre igual en el mismo lugar
  const GIROS = [-1.6, 1.2, -0.6, 2, -1.2, 0.8, 1.6, -2, 0.5, -0.9];

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
    const r = $('planillaResumen');
    if (r) r.textContent = t;
  }

  function esqueleto() {
    planilla.setAttribute('aria-busy', 'true');
    planilla.innerHTML = '';
    for (let i = 0; i < 6; i++) {
      const d = crear('div', 'sticker esqueleto');
      d.style.setProperty('--rot', GIROS[i] + 'deg');
      d.setAttribute('aria-hidden', 'true');
      planilla.appendChild(d);
    }
  }

  function mensaje(icono, titulo, texto, boton) {
    planilla.setAttribute('aria-busy', 'false');
    planilla.innerHTML = '';
    const caja = crear('div', 'planilla-mensaje');
    caja.appendChild(crear('span', 'icono', icono));
    caja.appendChild(crear('strong', '', titulo));
    caja.appendChild(crear('p', '', texto));
    if (boton) {
      const b = boton.href ? crear('a', 'btn-cta', boton.texto) : crear('button', '', boton.texto);
      if (boton.href) { b.href = boton.href; b.target = '_blank'; b.rel = 'noopener noreferrer'; }
      else { b.type = 'button'; b.addEventListener('click', boton.accion); }
      caja.appendChild(b);
    }
    planilla.appendChild(caja);
  }

  function crearSticker(t, i) {
    const el = crear('article', 'sticker');
    el.dataset.indice = i;
    el.tabIndex = 0;
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', 'Ver ' + t.nombre);
    el.style.setProperty('--rot', GIROS[i % GIROS.length] + 'deg');
    el.style.setProperty('--i', Math.min(i, 12));

    const media = crear('div', 'sticker-media');
    if (t.tipo === 'imagen') {
      const img = crear('img');
      img.alt = t.nombre;
      img.decoding = 'async';
      if (i > 5) img.loading = 'lazy';
      img.addEventListener('error', function () { img.replaceWith(crear('div', 'hoja', '🖼️')); }, { once: true });
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
      media.appendChild(crear('span', 'sticker-play', '▶'));
      if (obsVideos) obsVideos.observe(v);
    } else {
      const h = crear('div', 'hoja', '📄');
      h.dataset.url = t.url;
      media.appendChild(h);
      if (obsPdf) obsPdf.observe(h); else portadaPdf(t.url, h, 300);
    }

    if (i === 0 && trabajos.length > 1) media.appendChild(crear('span', 'sticker-etq nuevo', 'Lo más nuevo'));
    else if (t.tipo === 'video') media.appendChild(crear('span', 'sticker-etq', 'Video'));
    else if (t.tipo === 'pdf') media.appendChild(crear('span', 'sticker-etq', 'Catálogo PDF'));
    el.appendChild(media);

    const info = crear('div', 'sticker-info');
    info.appendChild(crear('h3', '', t.nombre));
    if (t.descripcion) info.appendChild(crear('p', '', t.descripcion));
    if (t.precio) info.appendChild(crear('span', 'sticker-precio', t.precio));
    el.appendChild(info);
    return el;
  }

  function render(productos) {
    trabajos = productos.map(function (p) {
      return {
        nombre: p.nombre || 'Trabajo de vinil',
        descripcion: p.descripcion || '',
        precio: precioTexto(p.precio),
        tipo: tipoDe(p),
        url: urlArchivo(p.archivoUrl)
      };
    }).filter(function (t) { return t.url; });

    if (!trabajos.length) {
      resumen('Pronto subiremos fotos de nuestros trabajos.');
      mensaje('🏷️', 'Aún no hay trabajos publicados',
        'Mientras tanto, escríbenos y te mandamos fotos de stickers y viniles que hemos hecho.',
        { texto: 'Pedir fotos por WhatsApp', href: linkWhatsApp('Hola Laser Print, ¿me pueden mandar fotos de stickers o viniles que hayan hecho?') });
      return;
    }

    planilla.setAttribute('aria-busy', 'false');
    planilla.innerHTML = '';
    const frag = document.createDocumentFragment();
    trabajos.forEach(function (t, i) { frag.appendChild(crearSticker(t, i)); });
    planilla.appendChild(frag);

    const n = trabajos.length;
    resumen(n + (n === 1 ? ' trabajo' : ' trabajos') + ' · toca uno para verlo en grande');
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
    $('visorWhatsapp').href = linkWhatsApp('Hola Laser Print, vi en su página el trabajo "' + t.nombre + '" (vinil) y quiero uno así. ¿Me pueden cotizar?');
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
    planilla.querySelectorAll('video').forEach(function (v) { v.pause(); });
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
    planilla.addEventListener('click', abrirDesde);
    planilla.addEventListener('keydown', function (e) {
      if ((e.key === 'Enter' || e.key === ' ') && e.target.closest('[data-indice]')) {
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
    initPortada();
    initAcabados();
    Plan.init();
    initVisor();
    cargar();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
