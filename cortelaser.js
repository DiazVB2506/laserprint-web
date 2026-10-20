/**
 * ==============================================================================
 * DISEÑO LASER PRINT — cortelaser.js (v1.0)
 * Archivo independiente de la página de Corte Láser CO2.
 *
 *  1. Tema, menú y detalles
 *  2. Cama del láser de la portada (corta en vivo)
 *  3. Revisor de archivos (SVG, DXF, PDF/AI, imágenes) — todo en el navegador
 *  4. Corte vs grabado
 *  5. Cotizador → WhatsApp
 *  6. Vitrina de trabajos (panel) + visor
 * ==============================================================================
 */
(function () {
  'use strict';

  /* ==========================================================================
     0. CONFIGURACIÓN
     ========================================================================== */

  const CONFIG = {
    categoria: 'CORTE LASER',    // exactamente como en el panel
    titulo: 'Corte Láser',
    whatsapp: '5215598788857',
    maxMB: 15                    // archivos más pesados no se revisan aquí (igual se pueden mandar)
  };

  const API_ORIGEN = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
    ? 'http://localhost:5000'
    : 'https://laserprint-api.onrender.com';

  const CLAVE_CACHE = 'lp_seccion_' + CONFIG.categoria;
  const SVG_NS = 'http://www.w3.org/2000/svg';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const formatoMXN = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
  const formatoNum = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 1 });
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

  function cmTexto(mm) {
    return formatoNum.format(Math.round(mm) / 10);
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
      a.href = linkWhatsApp('Hola Laser Print, quiero cotizar un trabajo de corte / grabado láser');
    });
    document.querySelectorAll('.wa-vector').forEach(function (a) {
      a.href = linkWhatsApp('Hola Laser Print, tengo una foto o dibujo y quiero que lo pasen a vector para cortarlo con láser. ¿Cuánto cuesta?');
    });
  }

  /* ==========================================================================
     2. CAMA DEL LÁSER (portada)
     ========================================================================== */

  function initCama() {
    const svg = $('camaSvg');
    if (!svg) return;
    const grupo = svg.querySelector('.cortes');
    const cabezal = svg.querySelector('.cabezal');
    const chispasG = svg.querySelector('.chispas');
    const coord = $('camaCoord');
    const progreso = $('camaProgreso');

    const piezas = [];
    let total = 0;
    svg.querySelectorAll('.guia').forEach(function (g) {
      const p = document.createElementNS(SVG_NS, 'path');
      p.setAttribute('d', g.getAttribute('d'));
      p.setAttribute('class', 'corte');
      grupo.appendChild(p);
      const L = p.getTotalLength();
      p.style.strokeDasharray = L + ' ' + L;
      p.style.strokeDashoffset = L;
      piezas.push({ el: p, L: L, ini: total });
      total += L;
    });
    if (!total) return;

    if (reduceMotion) {
      piezas.forEach(function (x) { x.el.style.strokeDashoffset = 0; });
      cabezal.style.display = 'none';
      progreso.textContent = '100%';
      coord.textContent = 'LISTO';
      return;
    }

    const VELOCIDAD = 190;   // unidades por segundo
    const PAUSA = 1.8;       // segundos con todo cortado antes de empezar otra vez

    const chispas = [];
    for (let i = 0; i < 16; i++) {
      const c = document.createElementNS(SVG_NS, 'circle');
      c.setAttribute('r', '0.9');
      c.setAttribute('opacity', '0');
      chispasG.appendChild(c);
      chispas.push({ el: c, x: 0, y: 0, vx: 0, vy: 0, vida: 0, max: 1 });
    }

    function soltarChispa(x, y) {
      const c = chispas.find(function (s) { return s.vida <= 0; });
      if (!c) return;
      c.x = x; c.y = y;
      c.vx = (Math.random() - 0.5) * 90;
      c.vy = -Math.random() * 70;
      c.max = c.vida = 0.25 + Math.random() * 0.35;
    }

    function moverChispas(dt) {
      chispas.forEach(function (c) {
        if (c.vida <= 0) return;
        c.vida -= dt;
        c.vy += 260 * dt;
        c.x += c.vx * dt;
        c.y += c.vy * dt;
        c.el.setAttribute('cx', c.x.toFixed(1));
        c.el.setAttribute('cy', c.y.toFixed(1));
        c.el.setAttribute('opacity', Math.max(0, c.vida / c.max).toFixed(2));
      });
    }

    let d = 0;
    let espera = 0;
    let ultimo = null;
    let raf = null;

    function reiniciar() {
      d = 0;
      piezas.forEach(function (x) { x.el.style.strokeDashoffset = x.L; });
      cabezal.style.opacity = '1';
    }

    function cuadro(t) {
      raf = requestAnimationFrame(cuadro);
      if (ultimo === null) { ultimo = t; return; }
      const dt = Math.min(0.05, (t - ultimo) / 1000);
      ultimo = t;
      moverChispas(dt);

      if (espera > 0) {
        espera -= dt;
        if (espera <= 0) reiniciar();
        return;
      }

      d = Math.min(total, d + VELOCIDAD * dt);
      let punto = null;
      for (let i = 0; i < piezas.length; i++) {
        const x = piezas[i];
        const hecho = Math.max(0, Math.min(x.L, d - x.ini));
        x.el.style.strokeDashoffset = x.L - hecho;
        if (!punto && d >= x.ini && d <= x.ini + x.L) punto = x.el.getPointAtLength(hecho);
      }

      if (punto) {
        cabezal.setAttribute('cx', punto.x.toFixed(1));
        cabezal.setAttribute('cy', punto.y.toFixed(1));
        coord.textContent = 'X ' + punto.x.toFixed(1) + '  Y ' + (300 - punto.y).toFixed(1);
        if (Math.random() < 0.7) soltarChispa(punto.x, punto.y);
      }
      progreso.textContent = Math.round(d / total * 100) + '%';

      if (d >= total) {
        espera = PAUSA;
        cabezal.style.opacity = '0';
        coord.textContent = 'CORTE TERMINADO';
      }
    }

    function arrancar() { if (!raf) { ultimo = null; raf = requestAnimationFrame(cuadro); } }
    function parar() { if (raf) { cancelAnimationFrame(raf); raf = null; } }

    let enPantalla = true;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (ents) {
        enPantalla = ents[0].isIntersecting;
        if (enPantalla && !document.hidden) arrancar(); else parar();
      }, { threshold: 0.1 }).observe(svg);
    } else {
      arrancar();
    }
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) parar(); else if (enPantalla) arrancar();
    });
  }

  /* ==========================================================================
     3. REVISOR DE ARCHIVOS
     Nada se sube: el archivo se lee en el navegador. Del SVG solo se copian
     formas geométricas con atributos numéricos (sin scripts, estilos ni enlaces).
     ========================================================================== */

  const Revisor = (function () {
    const diag = $('diagnostico');
    const input = $('archivoLaser');
    const zona = $('soltar');
    let turno = 0;               // cancela animaciones de archivos anteriores
    let urlTemporal = null;
    let ultimo = null;           // { nombre, anchoMm, altoMm, vector }

    /* --------- utilidades de geometría --------- */

    // Convierte rect, circle, ellipse, line, polyline y polygon a un "d" de path
    function aPath(el) {
      const n = function (a) { return parseFloat(el.getAttribute(a)) || 0; };
      const tag = el.localName;
      if (tag === 'path') return el.getAttribute('d') || '';
      if (tag === 'line') return 'M' + n('x1') + ' ' + n('y1') + 'L' + n('x2') + ' ' + n('y2');
      if (tag === 'polyline' || tag === 'polygon') {
        const nums = (el.getAttribute('points') || '').trim().split(/[\s,]+/).map(Number).filter(function (v) { return !isNaN(v); });
        if (nums.length < 4) return '';
        let s = 'M' + nums[0] + ' ' + nums[1];
        for (let i = 2; i + 1 < nums.length; i += 2) s += 'L' + nums[i] + ' ' + nums[i + 1];
        return tag === 'polygon' ? s + 'Z' : s;
      }
      if (tag === 'circle' || tag === 'ellipse') {
        const cx = n('cx');
        const cy = n('cy');
        const rx = tag === 'circle' ? n('r') : n('rx');
        const ry = tag === 'circle' ? n('r') : n('ry');
        if (rx <= 0 || ry <= 0) return '';
        return 'M' + (cx + rx) + ' ' + cy + 'A' + rx + ' ' + ry + ' 0 1 0 ' + (cx - rx) + ' ' + cy +
               'A' + rx + ' ' + ry + ' 0 1 0 ' + (cx + rx) + ' ' + cy + 'Z';
      }
      if (tag === 'rect') {
        const x = n('x');
        const y = n('y');
        const w = n('width');
        const h = n('height');
        if (w <= 0 || h <= 0) return '';
        let rx = el.hasAttribute('rx') ? n('rx') : n('ry');
        let ry = el.hasAttribute('ry') ? n('ry') : rx;
        rx = Math.min(rx, w / 2);
        ry = Math.min(ry, h / 2);
        if (!rx || !ry) return 'M' + x + ' ' + y + 'H' + (x + w) + 'V' + (y + h) + 'H' + x + 'Z';
        return 'M' + (x + rx) + ' ' + y + 'H' + (x + w - rx) + 'A' + rx + ' ' + ry + ' 0 0 1 ' + (x + w) + ' ' + (y + ry) +
               'V' + (y + h - ry) + 'A' + rx + ' ' + ry + ' 0 0 1 ' + (x + w - rx) + ' ' + (y + h) +
               'H' + (x + rx) + 'A' + rx + ' ' + ry + ' 0 0 1 ' + x + ' ' + (y + h - ry) +
               'V' + (y + ry) + 'A' + rx + ' ' + ry + ' 0 0 1 ' + (x + rx) + ' ' + y + 'Z';
      }
      return '';
    }

    function nuevoPath(d, transform) {
      const p = document.createElementNS(SVG_NS, 'path');
      p.setAttribute('d', d);
      if (transform) p.setAttribute('transform', transform);
      return p;
    }

    // Solo deja transformaciones con funciones conocidas y números
    function transformSegura(t) {
      if (!t) return '';
      const resto = t.replace(/matrix|translate|scale|rotate|skewX|skewY/g, '').replace(/[\s\d.,eE+\-()]/g, '');
      return resto === '' ? t : '';
    }

    const FORMAS = ['path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon'];
    const GRUPOS = ['g', 'a', 'switch', 'svg'];
    const IGNORAR = ['defs', 'symbol', 'clipPath', 'mask', 'pattern', 'marker', 'metadata', 'title', 'desc', 'style', 'script', 'foreignObject', 'linearGradient', 'radialGradient', 'filter'];

    /* --------- SVG --------- */

    function leerSvg(texto) {
      const doc = new DOMParser().parseFromString(texto, 'image/svg+xml');
      const raiz = doc.documentElement;
      if (!raiz || raiz.localName !== 'svg' || doc.getElementsByTagName('parsererror').length) {
        throw new Error('El SVG está dañado o no se pudo leer.');
      }

      const info = { textos: 0, imagenes: 0, piezas: 0, recortado: false };
      const destino = document.createElementNS(SVG_NS, 'g');

      (function copiar(origen, dest, profundidad) {
        if (profundidad > 40) return;
        Array.prototype.forEach.call(origen.children, function (el) {
          const tag = el.localName;
          if (IGNORAR.indexOf(tag) >= 0) return;
          if (tag === 'text') { info.textos++; return; }
          if (tag === 'image') { info.imagenes++; return; }
          if (el.getAttribute('display') === 'none') return;
          if (info.piezas >= 6000) { info.recortado = true; return; }
          const tr = transformSegura(el.getAttribute('transform'));
          if (GRUPOS.indexOf(tag) >= 0) {
            const g = document.createElementNS(SVG_NS, 'g');
            if (tr) g.setAttribute('transform', tr);
            copiar(el, g, profundidad + 1);
            if (g.childNodes.length) dest.appendChild(g);
          } else if (FORMAS.indexOf(tag) >= 0) {
            const d = aPath(el);
            if (d && /^[\sMmLlHhVvCcSsQqTtAaZz\d.,eE+\-]+$/.test(d)) {
              dest.appendChild(nuevoPath(d, tr));
              info.piezas++;
            }
          }
        });
      })(raiz, destino, 0);

      // Escala: cuántos mm mide una unidad del dibujo
      const MM = { mm: 1, cm: 10, in: 25.4, pt: 25.4 / 72, pc: 25.4 / 6, px: 25.4 / 96, '': 25.4 / 96 };
      const deIllustrator = /Adobe Illustrator/i.test(texto.slice(0, 2000));
      function largo(attr) {
        const m = String(raiz.getAttribute(attr) || '').trim().match(/^([\d.]+)\s*(mm|cm|in|pt|pc|px)?$/i);
        if (!m) return null;
        const u = (m[2] || '').toLowerCase();
        let factor = MM[u];
        if (deIllustrator && (u === '' || u === 'px')) factor = 25.4 / 72;
        return { valor: parseFloat(m[1]), mm: parseFloat(m[1]) * factor, fisica: u !== '' && u !== 'px' };
      }
      const vb = String(raiz.getAttribute('viewBox') || '').trim().split(/[\s,]+/).map(Number);
      const tieneVb = vb.length === 4 && vb.every(function (v) { return !isNaN(v); }) && vb[2] > 0;
      const ancho = largo('width');
      let mmPorUnidad = deIllustrator ? 25.4 / 72 : 25.4 / 96;
      if (ancho && ancho.valor > 0) mmPorUnidad = tieneVb ? ancho.mm / vb[2] : ancho.mm / ancho.valor;

      return {
        formato: 'SVG',
        grupo: destino,
        mmPorUnidad: mmPorUnidad,
        unidadesSeguras: !!(ancho && ancho.fisica) || deIllustrator,
        info: info
      };
    }

    /* --------- DXF --------- */

    function leerDxf(texto) {
      if (/^AutoCAD Binary DXF/.test(texto)) throw new Error('binario');
      const lineas = texto.split(/\r\n|\r|\n/);
      const pares = [];
      for (let i = 0; i + 1 < lineas.length; i += 2) {
        const c = parseInt(lineas[i].trim(), 10);
        if (isNaN(c)) continue;
        pares.push([c, lineas[i + 1].trim()]);
      }

      let insunits = 0;
      for (let i = 0; i < pares.length - 1; i++) {
        if (pares[i][0] === 9 && pares[i][1] === '$INSUNITS') { insunits = parseInt(pares[i + 1][1], 10) || 0; break; }
      }

      let ini = -1;
      for (let i = 1; i < pares.length; i++) {
        if (pares[i][0] === 2 && pares[i][1] === 'ENTITIES' && pares[i - 1][1] === 'SECTION') { ini = i + 1; break; }
      }
      if (ini < 0) throw new Error('No encontramos dibujos dentro del DXF.');

      const ents = [];
      let actual = null;
      for (let i = ini; i < pares.length; i++) {
        const c = pares[i][0];
        const v = pares[i][1];
        if (c === 0) {
          if (v === 'ENDSEC') break;
          actual = { tipo: v, g: [] };
          ents.push(actual);
        } else if (actual) {
          actual.g.push([c, v]);
        }
      }

      const num = function (e, code, def) {
        for (let i = 0; i < e.g.length; i++) if (e.g[i][0] === code) return parseFloat(e.g[i][1]);
        return def === undefined ? 0 : def;
      };
      const f = function (n) { return +n.toFixed(4); };
      const P = function (x, y) { return f(x) + ' ' + f(-y); };     // el DXF tiene la Y hacia arriba

      function tramo(a, b) {
        if (!a.b) return 'L' + P(b.x, b.y);
        const ang = 4 * Math.atan(Math.abs(a.b));
        const cuerda = Math.hypot(b.x - a.x, b.y - a.y);
        if (!cuerda) return '';
        const r = cuerda / (2 * Math.sin(ang / 2));
        return 'A' + f(r) + ' ' + f(r) + ' 0 ' + (ang > Math.PI ? 1 : 0) + ' ' + (a.b > 0 ? 0 : 1) + ' ' + P(b.x, b.y);
      }

      function polilinea(vs, cerrada) {
        if (vs.length < 2) return '';
        let d = 'M' + P(vs[0].x, vs[0].y);
        for (let i = 1; i < vs.length; i++) d += tramo(vs[i - 1], vs[i]);
        if (cerrada) d += tramo(vs[vs.length - 1], vs[0]) + 'Z';
        return d;
      }

      function puntos(e, cx, cy) {
        const out = [];
        e.g.forEach(function (par) {
          if (par[0] === cx) out.push({ x: parseFloat(par[1]), y: 0, b: 0 });
          else if (par[0] === cy && out.length) out[out.length - 1].y = parseFloat(par[1]);
          else if (par[0] === 42 && out.length) out[out.length - 1].b = parseFloat(par[1]);
        });
        return out;
      }

      function bspline(t, p, U, C) {
        const n = C.length - 1;
        let k = p;
        while (k < n && t >= U[k + 1]) k++;
        const d = [];
        for (let j = 0; j <= p; j++) d.push({ x: C[j + k - p].x, y: C[j + k - p].y });
        for (let r = 1; r <= p; r++) {
          for (let j = p; j >= r; j--) {
            const i = j + k - p;
            const den = U[i + p - r + 1] - U[i];
            const a = den ? (t - U[i]) / den : 0;
            d[j] = { x: (1 - a) * d[j - 1].x + a * d[j].x, y: (1 - a) * d[j - 1].y + a * d[j].y };
          }
        }
        return d[p];
      }

      const info = { textos: 0, imagenes: 0, bloques: 0, piezas: 0, recortado: false };
      const grupo = document.createElementNS(SVG_NS, 'g');
      const agregar = function (d) {
        if (!d) return;
        if (info.piezas >= 6000) { info.recortado = true; return; }
        grupo.appendChild(nuevoPath(d));
        info.piezas++;
      };

      for (let i = 0; i < ents.length; i++) {
        const e = ents[i];
        switch (e.tipo) {
          case 'LINE':
            agregar('M' + P(num(e, 10), num(e, 20)) + 'L' + P(num(e, 11), num(e, 21)));
            break;
          case 'CIRCLE': {
            const cx = num(e, 10);
            const cy = num(e, 20);
            const r = num(e, 40);
            if (r > 0) agregar('M' + P(cx + r, cy) + 'A' + f(r) + ' ' + f(r) + ' 0 1 0 ' + P(cx - r, cy) + 'A' + f(r) + ' ' + f(r) + ' 0 1 0 ' + P(cx + r, cy) + 'Z');
            break;
          }
          case 'ARC': {
            const cx = num(e, 10);
            const cy = num(e, 20);
            const r = num(e, 40);
            const a1 = num(e, 50) * Math.PI / 180;
            const a2 = num(e, 51) * Math.PI / 180;
            let delta = a2 - a1;
            while (delta <= 0) delta += Math.PI * 2;
            if (r <= 0) break;
            const x1 = cx + r * Math.cos(a1);
            const y1 = cy + r * Math.sin(a1);
            const x2 = cx + r * Math.cos(a2);
            const y2 = cy + r * Math.sin(a2);
            agregar('M' + P(x1, y1) + 'A' + f(r) + ' ' + f(r) + ' 0 ' + (delta > Math.PI ? 1 : 0) + ' 0 ' + P(x2, y2));
            break;
          }
          case 'LWPOLYLINE':
            agregar(polilinea(puntos(e, 10, 20), (num(e, 70) & 1) === 1));
            break;
          case 'POLYLINE': {
            const vs = [];
            const cerrada = (num(e, 70) & 1) === 1;
            while (i + 1 < ents.length && ents[i + 1].tipo === 'VERTEX') {
              i++;
              vs.push({ x: num(ents[i], 10), y: num(ents[i], 20), b: num(ents[i], 42) });
            }
            if (i + 1 < ents.length && ents[i + 1].tipo === 'SEQEND') i++;
            agregar(polilinea(vs, cerrada));
            break;
          }
          case 'ELLIPSE': {
            const cx = num(e, 10);
            const cy = num(e, 20);
            const mx = num(e, 11);
            const my = num(e, 21);
            const k = num(e, 40, 1);
            let t0 = num(e, 41, 0);
            let t1 = num(e, 42, Math.PI * 2);
            if (t1 <= t0) t1 += Math.PI * 2;
            const pasos = 72;
            let d = '';
            for (let s = 0; s <= pasos; s++) {
              const t = t0 + (t1 - t0) * s / pasos;
              const x = cx + mx * Math.cos(t) - k * my * Math.sin(t);
              const y = cy + my * Math.cos(t) + k * mx * Math.sin(t);
              d += (s ? 'L' : 'M') + P(x, y);
            }
            agregar(d);
            break;
          }
          case 'SPLINE': {
            const grado = num(e, 71, 3);
            const nudos = e.g.filter(function (p) { return p[0] === 40; }).map(function (p) { return parseFloat(p[1]); });
            const control = puntos(e, 10, 20);
            const ajuste = puntos(e, 11, 21);
            const cerrada = (num(e, 70) & 1) === 1;
            let pts = [];
            if (control.length > grado && nudos.length === control.length + grado + 1) {
              const u0 = nudos[grado];
              const u1 = nudos[control.length];
              const muestras = Math.min(400, Math.max(40, control.length * 10));
              for (let s = 0; s <= muestras; s++) {
                const t = u0 + (u1 - u0) * s / muestras;
                pts.push(bspline(Math.min(t, u1 - 1e-9), grado, nudos, control));
              }
            } else {
              pts = ajuste.length > 1 ? ajuste : control;
            }
            pts = pts.map(function (p) { return { x: p.x, y: p.y, b: 0 }; });
            agregar(polilinea(pts, cerrada));
            break;
          }
          case 'TEXT':
          case 'MTEXT':
            info.textos++;
            break;
          case 'INSERT':
            info.bloques++;
            break;
          case 'IMAGE':
            info.imagenes++;
            break;
          default:
            break;
        }
      }

      const UNIDADES = { 1: 25.4, 2: 304.8, 4: 1, 5: 10, 6: 1000 };
      return {
        formato: 'DXF',
        grupo: grupo,
        mmPorUnidad: UNIDADES[insunits] || 1,
        unidadesSeguras: !!UNIDADES[insunits],
        info: info
      };
    }

    /* --------- pintar el diagnóstico --------- */

    function veredicto(tipo, icono, titulo, texto) {
      const v = crear('div', 'veredicto ' + tipo);
      v.appendChild(crear('span', 'sello', icono));
      const t = crear('div');
      t.appendChild(crear('h3', '', titulo));
      if (texto) t.appendChild(crear('p', '', texto));
      v.appendChild(t);
      return v;
    }

    function ficha(datos) {
      const ul = crear('ul', 'ficha');
      datos.forEach(function (d) {
        const li = crear('li');
        li.appendChild(crear('span', '', d[0]));
        const s = crear('strong', '', d[1]);
        s.title = d[1];
        li.appendChild(s);
        ul.appendChild(li);
      });
      return ul;
    }

    function acciones(conMedidas) {
      const caja = crear('div', 'diag-acciones');
      if (conMedidas && ultimo && ultimo.anchoMm) {
        const usar = crear('button', 'btn-cta', 'Usar estas medidas en mi cotización');
        usar.type = 'button';
        usar.addEventListener('click', function () { Cotizador.usarArchivo(ultimo); });
        caja.appendChild(usar);
      } else if (ultimo) {
        const usar = crear('button', 'btn-cta', 'Cotizar con este archivo');
        usar.type = 'button';
        usar.addEventListener('click', function () { Cotizador.usarArchivo(ultimo); });
        caja.appendChild(usar);
      }
      const otro = crear('button', 'btn-sec', 'Revisar otro archivo');
      otro.type = 'button';
      otro.addEventListener('click', function () { input.value = ''; input.click(); });
      caja.appendChild(otro);
      return caja;
    }

    function limpiar() {
      turno++;
      if (urlTemporal) { URL.revokeObjectURL(urlTemporal); urlTemporal = null; }
      diag.innerHTML = '';
    }

    /** Dibuja la geometría, mide el diseño y anima el recorrido del láser */
    function vistaVector(res, nombre) {
      const sim = crear('div', 'simulacion');
      sim.appendChild(crear('span', 'sim-etq', 'SIMULACIÓN DEL CORTE'));
      const svg = document.createElementNS(SVG_NS, 'svg');
      svg.setAttribute('aria-hidden', 'true');
      svg.appendChild(res.grupo);
      sim.appendChild(svg);
      diag.appendChild(sim);   // tiene que estar en pantalla para poder medir

      let caja = null;
      try { caja = res.grupo.getBBox(); } catch (e) {}
      if (!caja || (!caja.width && !caja.height)) return null;

      const lado = Math.max(caja.width, caja.height);
      const margen = lado * 0.04;
      svg.setAttribute('viewBox', [caja.x - margen, caja.y - margen, caja.width + margen * 2, caja.height + margen * 2].join(' '));

      // Grosor de línea igual en pantalla (sin vector-effect para que el punteado funcione)
      const raizCTM = svg.getScreenCTM();
      const inversa = raizCTM ? raizCTM.inverse() : null;
      const escalaRaiz = raizCTM ? Math.sqrt(Math.abs(raizCTM.a * raizCTM.d - raizCTM.b * raizCTM.c)) : 1;
      const trazos = [];
      let total = 0;
      res.grupo.querySelectorAll('path').forEach(function (p) {
        p.setAttribute('class', 'sim-trazo');
        let L = 0;
        try { L = p.getTotalLength(); } catch (e) {}
        const m = (inversa && p.getScreenCTM()) ? inversa.multiply(p.getScreenCTM()) : null;
        const escala = m ? Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) || 1 : 1;
        p.style.vectorEffect = 'none';
        p.style.strokeWidth = (1.5 / escalaRaiz / escala) + 'px';
        if (!L || !isFinite(L)) return;
        p.style.strokeDasharray = L + ' ' + L;
        p.style.strokeDashoffset = L;
        trazos.push({ el: p, L: L, ini: total, m: m });
        total += L;
      });

      const cabezal = document.createElementNS(SVG_NS, 'circle');
      cabezal.setAttribute('class', 'sim-cabezal');
      cabezal.setAttribute('r', (4 / escalaRaiz).toString());
      cabezal.setAttribute('cx', caja.x);
      cabezal.setAttribute('cy', caja.y);
      svg.appendChild(cabezal);

      const repetir = crear('button', 'repetir', '↻ Repetir');
      repetir.type = 'button';
      sim.appendChild(repetir);

      const miTurno = turno;
      function animar() {
        if (reduceMotion || !total) {
          trazos.forEach(function (x) { x.el.style.strokeDashoffset = 0; });
          cabezal.style.display = 'none';
          return;
        }
        const duracion = Math.min(9000, Math.max(2600, trazos.length * 140));
        cabezal.style.display = '';
        let inicio = null;
        requestAnimationFrame(function paso(t) {
          if (miTurno !== turno || !sim.isConnected) return;
          if (inicio === null) inicio = t;
          const d = Math.min(1, (t - inicio) / duracion) * total;
          let punto = null;
          for (let i = 0; i < trazos.length; i++) {
            const x = trazos[i];
            const hecho = Math.max(0, Math.min(x.L, d - x.ini));
            x.el.style.strokeDashoffset = x.L - hecho;
            if (!punto && d >= x.ini && d < x.ini + x.L) {
              let p = x.el.getPointAtLength(hecho);
              if (x.m) p = new DOMPoint(p.x, p.y).matrixTransform(x.m);
              punto = p;
            }
          }
          if (punto) {
            cabezal.setAttribute('cx', punto.x);
            cabezal.setAttribute('cy', punto.y);
          }
          if (d < total) requestAnimationFrame(paso);
          else cabezal.style.display = 'none';
        });
      }
      repetir.addEventListener('click', animar);
      animar();

      return {
        anchoMm: caja.width * res.mmPorUnidad,
        altoMm: caja.height * res.mmPorUnidad,
        sim: sim
      };
    }

    function mostrarVector(res, archivo) {
      const info = res.info;
      if (!info.piezas) {
        if (info.imagenes) {
          diag.appendChild(veredicto('aviso', '🖼️', 'Tu ' + res.formato + ' solo trae una imagen',
            'Sirve para grabado. Para cortar hay que vectorizarla (tiene costo extra).'));
        } else if (info.textos) {
          diag.appendChild(veredicto('aviso', '🔤', 'Solo tiene textos sin convertir',
            'Convierte los textos a curvas (Illustrator: “Crear contornos”; Inkscape: “Objeto a trayecto”) y vuelve a revisarlo.'));
        } else {
          diag.appendChild(veredicto('error', '⚠️', 'No encontramos líneas en tu archivo',
            'Puede estar vacío o usar algo que no leemos aquí. Mándanoslo y lo revisamos.'));
        }
        ultimo = { nombre: archivo.name, vector: false };
        diag.appendChild(ficha([['Formato', res.formato], ['Trazos', '0'], ['Peso', peso(archivo.size)]]));
        diag.appendChild(acciones(false));
        return;
      }

      // Primero el veredicto (provisional) para que quede arriba
      const titulo = info.textos ? 'Casi listo: es vector, pero tiene textos' : '¡Listo para láser!';
      const lugar = crear('div');
      diag.appendChild(lugar);
      const fichaLugar = crear('div');
      diag.appendChild(fichaLugar);

      const medida = vistaVector(res, archivo.name);
      const ancho = medida ? medida.anchoMm : 0;
      const alto = medida ? medida.altoMm : 0;
      ultimo = { nombre: archivo.name, anchoMm: ancho, altoMm: alto, vector: true };

      let texto = 'Tiene líneas en vector: sirve para corte y grabado.';
      if (info.textos) texto = 'Hay ' + info.textos + (info.textos === 1 ? ' texto' : ' textos') + ' sin convertir a curvas; conviértelos (Illustrator: “Crear contornos”) para que se corten con tu letra.';
      lugar.replaceWith(veredicto(info.textos ? 'aviso' : 'ok', info.textos ? '🔤' : '✅', titulo, texto));

      const notas = [];
      if (info.imagenes) notas.push('También trae ' + info.imagenes + (info.imagenes === 1 ? ' imagen' : ' imágenes') + ': esas partes se pueden grabar, no cortar.');
      if (info.bloques) notas.push('Usa bloques (INSERT) que no aparecen en la vista previa; nosotros los vemos completos.');
      if (info.recortado) notas.push('Es un archivo muy detallado: la vista previa muestra solo una parte.');
      if (!res.unidadesSeguras) notas.push('Tu archivo no dice sus unidades; la medida es aproximada. Confírmala al cotizar.');
      const mayor = Math.max(ancho, alto);
      if (mayor && (mayor < 3 || mayor > 2000)) notas.push('La medida se ve ' + (mayor < 3 ? 'muy pequeña' : 'muy grande') + ': revisa la escala de tu archivo.');

      fichaLugar.replaceWith(ficha([
        ['Formato', res.formato],
        ['Medida', ancho ? cmTexto(ancho) + ' × ' + cmTexto(alto) + ' cm' : '—'],
        ['Trazos', String(info.piezas)]
      ]));
      if (notas.length) {
        const n = veredicto('aviso', 'ℹ️', 'Para tomar en cuenta');
        const lista = n.querySelector('div');
        notas.forEach(function (t) { lista.appendChild(crear('p', '', '• ' + t)); });
        diag.insertBefore(n, medida ? medida.sim : null);
      }
      diag.appendChild(acciones(!!ancho));
    }

    function mostrarImagen(archivo, ext) {
      urlTemporal = URL.createObjectURL(archivo);
      const miTurno = turno;
      const img = new Image();
      img.alt = 'Vista de grabado de ' + archivo.name;
      img.onload = function () {
        if (miTurno !== turno) return;
        ultimo = { nombre: archivo.name, vector: false };
        diag.appendChild(veredicto('aviso', '🔥', 'Es una imagen: sirve para grabado',
          'Para corte el láser necesita líneas en vector. Podemos vectorizarla (tiene costo extra según la complejidad).'));
        diag.appendChild(ficha([
          ['Formato', ext.toUpperCase()],
          ['Pixeles', img.naturalWidth + ' × ' + img.naturalHeight],
          ['Peso', peso(archivo.size)]
        ]));
        if (Math.max(img.naturalWidth, img.naturalHeight) < 800) {
          diag.appendChild(veredicto('aviso', 'ℹ️', 'Resolución baja', 'Para un grabado nítido conviene una imagen más grande o el archivo original.'));
        }
        const sim = crear('div', 'simulacion');
        sim.appendChild(crear('span', 'sim-etq', 'ASÍ SE VERÍA GRABADO'));
        sim.appendChild(img);
        diag.appendChild(sim);
        diag.appendChild(acciones(false));
      };
      img.onerror = function () {
        if (miTurno !== turno) return;
        error('No pudimos abrir la imagen', 'Puede estar dañada. Intenta exportarla otra vez.');
      };
      img.src = urlTemporal;
    }

    async function mostrarPdf(archivo, ext) {
      const miTurno = turno;
      diag.appendChild(veredicto('ok', '⏳', 'Revisando tu ' + ext.toUpperCase() + '…'));
      try {
        const lib = await cargarPdfJs();
        const datos = new Uint8Array(await archivo.arrayBuffer());
        const pdf = await lib.getDocument({ data: datos, isEvalSupported: false }).promise;
        const pag = await pdf.getPage(1);
        const ops = await pag.getOperatorList();
        if (miTurno !== turno) return;
        const O = lib.OPS;
        const hay = function (lista) { return ops.fnArray.some(function (fn) { return lista.indexOf(fn) >= 0; }); };
        const vectores = hay([O.constructPath, O.stroke, O.fill, O.eoFill, O.fillStroke]);
        const imagenes = hay([O.paintImageXObject, O.paintInlineImageXObject, O.paintImageMaskXObject, O.paintJpegXObject].filter(Boolean));
        const textos = hay([O.showText, O.showSpacedText]);

        const base = pag.getViewport({ scale: 1 });
        const anchoMm = base.width * 25.4 / 72;
        const altoMm = base.height * 25.4 / 72;
        ultimo = { nombre: archivo.name, anchoMm: anchoMm, altoMm: altoMm, vector: vectores, pagina: true };

        diag.innerHTML = '';
        if (vectores) {
          diag.appendChild(veredicto(textos ? 'aviso' : 'ok', textos ? '🔤' : '✅',
            textos ? 'Es vector, pero tiene textos' : '¡Tiene líneas en vector!',
            textos ? 'Convierte los textos a curvas para que se corten con tu misma letra.'
                   : (imagenes ? 'Lo vectorial se corta y las imágenes se pueden grabar.' : 'Sirve para corte y grabado.')));
        } else if (imagenes) {
          diag.appendChild(veredicto('aviso', '🔥', 'Tu ' + ext.toUpperCase() + ' es una imagen',
            'Sirve para grabado. Para corte hay que vectorizarlo (tiene costo extra).'));
        } else {
          diag.appendChild(veredicto('aviso', '🔤', 'Solo encontramos texto', 'Conviértelo a curvas o mándanoslo y lo revisamos.'));
        }
        diag.appendChild(ficha([
          ['Formato', ext.toUpperCase()],
          ['Página', cmTexto(anchoMm) + ' × ' + cmTexto(altoMm) + ' cm'],
          ['Páginas', String(pdf.numPages)]
        ]));

        const sim = crear('div', 'simulacion');
        sim.appendChild(crear('span', 'sim-etq', 'PÁGINA 1'));
        const lienzo = document.createElement('canvas');
        lienzo.style.cssText = 'position:absolute;inset:6%;width:88%;height:88%;object-fit:contain;';
        const vista = pag.getViewport({ scale: Math.min(3, 900 / base.width) });
        lienzo.width = vista.width;
        lienzo.height = vista.height;
        sim.appendChild(lienzo);
        diag.appendChild(sim);
        await pag.render({ canvasContext: lienzo.getContext('2d'), viewport: vista }).promise;
        diag.appendChild(acciones(false));
      } catch (e) {
        if (miTurno !== turno) return;
        diag.innerHTML = '';
        ultimo = { nombre: archivo.name, vector: true };
        diag.appendChild(veredicto('ok', '📁', ext === 'ai' ? 'Archivo de Illustrator recibido' : 'PDF recibido',
          'No pudimos abrirlo aquí, pero en el taller lo revisamos. Si viene en vector (exportado desde Illustrator o Corel), perfecto.'));
        diag.appendChild(ficha([['Formato', ext.toUpperCase()], ['Peso', peso(archivo.size)], ['Revisión', 'En el taller']]));
        diag.appendChild(acciones(false));
      }
    }

    function peso(bytes) {
      if (bytes < 1024 * 1024) return Math.max(1, Math.round(bytes / 1024)) + ' KB';
      return formatoNum.format(bytes / 1024 / 1024) + ' MB';
    }

    function error(titulo, texto) {
      diag.innerHTML = '';
      diag.appendChild(veredicto('error', '⚠️', titulo, texto));
      diag.appendChild(acciones(false));
    }

    async function revisar(archivo) {
      if (!archivo) return;
      limpiar();
      ultimo = null;
      const ext = (archivo.name.split('.').pop() || '').toLowerCase();

      if (archivo.size > CONFIG.maxMB * 1024 * 1024) {
        ultimo = { nombre: archivo.name, vector: false };
        diag.appendChild(veredicto('aviso', '📦', 'Archivo muy pesado para revisarlo aquí',
          'Pesa ' + peso(archivo.size) + '. Mándalo directo por WhatsApp y lo revisamos en el taller.'));
        diag.appendChild(acciones(false));
        return;
      }

      try {
        if (ext === 'svg') {
          mostrarVector(leerSvg(await archivo.text()), archivo);
        } else if (ext === 'dxf') {
          let res;
          try {
            res = leerDxf(await archivo.text());
          } catch (e) {
            if (e.message === 'binario') { error('DXF binario', 'Guárdalo como DXF ASCII (texto) para revisarlo aquí, o mándanoslo así.'); return; }
            throw e;
          }
          mostrarVector(res, archivo);
        } else if (ext === 'pdf' || ext === 'ai') {
          await mostrarPdf(archivo, ext);
        } else if (['png', 'jpg', 'jpeg', 'webp'].indexOf(ext) >= 0) {
          mostrarImagen(archivo, ext === 'jpeg' ? 'jpg' : ext);
        } else if (ext === 'cdr' || ext === 'eps') {
          ultimo = { nombre: archivo.name, vector: true };
          diag.appendChild(veredicto('aviso', '📁', 'Lo abrimos en el taller',
            'Los ' + ext.toUpperCase() + ' no se pueden revisar en el navegador. Si puedes, expórtalo también en PDF o DXF.'));
          diag.appendChild(ficha([['Formato', ext.toUpperCase()], ['Peso', peso(archivo.size)], ['Revisión', 'En el taller']]));
          diag.appendChild(acciones(false));
        } else {
          error('Ese formato no sirve para láser', 'Usa DXF, AI, PDF o SVG para corte; PNG o JPG solo para grabado.');
        }
      } catch (e) {
        error('No pudimos leer tu archivo', (e && e.message) || 'Puede estar dañado. Intenta exportarlo otra vez.');
      }
    }

    function init() {
      if (!diag || !input || !zona) return;
      input.addEventListener('change', function () { revisar(input.files && input.files[0]); });

      ['dragenter', 'dragover'].forEach(function (ev) {
        zona.addEventListener(ev, function (e) { e.preventDefault(); zona.classList.add('encima'); });
      });
      ['dragleave', 'dragend'].forEach(function (ev) {
        zona.addEventListener(ev, function (e) {
          if (!zona.contains(e.relatedTarget)) zona.classList.remove('encima');
        });
      });
      zona.addEventListener('drop', function (e) {
        e.preventDefault();
        zona.classList.remove('encima');
        const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
        if (f) revisar(f);
      });
      // Si sueltan el archivo fuera de la zona, que el navegador no lo abra
      window.addEventListener('dragover', function (e) { if (!zona.contains(e.target)) e.preventDefault(); });
      window.addEventListener('drop', function (e) { if (!zona.contains(e.target)) e.preventDefault(); });
    }

    return { init: init, revisar: revisar };
  })();

  /* ==========================================================================
     4. CORTE VS GRABADO
     ========================================================================== */

  const TEXTOS_CVG = {
    corte: {
      titulo: 'Corte',
      texto: 'El láser atraviesa el material siguiendo una línea y saca la pieza con la forma exacta: letras sueltas, llaveros, figuras, piezas para armar.',
      archivo: 'Necesita archivo en <b>vector</b>: DXF, AI, PDF o SVG.'
    },
    grabado: {
      titulo: 'Grabado',
      texto: 'El láser quema la superficie sin atravesarla: textos, logos, fotos y texturas que quedan marcados para siempre. En aluminio es lo único que hacemos.',
      archivo: 'Sirve un <b>vector</b> o una <b>imagen</b> en buena resolución (PNG o JPG).'
    },
    ambos: {
      titulo: 'Corte y grabado',
      texto: 'En la misma pieza: primero se graba el diseño y luego se corta el contorno. Ideal para llaveros, letreros, recuerdos y etiquetas.',
      archivo: 'Un solo archivo en <b>vector</b>, con las líneas de corte de un color distinto al grabado.'
    }
  };

  function initCvg() {
    const muestra = $('muestra');
    const caja = $('cvgTexto');
    const botones = document.querySelectorAll('.selector button[data-modo]');
    if (!muestra || !caja) return;

    function elegir(modo) {
      const t = TEXTOS_CVG[modo];
      if (!t) return;
      botones.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.modo === modo)); });
      muestra.dataset.modo = modo;
      const hueco = muestra.querySelector('circle.m-corte');
      if (hueco) hueco.style.strokeDashoffset = (modo === 'grabado') ? '90' : '0';
      caja.innerHTML = '';
      caja.appendChild(crear('h3', '', t.titulo));
      caja.appendChild(crear('p', '', t.texto));
      const ideal = crear('span', 'archivo-ideal');
      ideal.innerHTML = '<span aria-hidden="true">📁</span> ' + t.archivo;   // texto fijo nuestro, no del usuario
      caja.appendChild(ideal);
    }

    let obs = null;
    botones.forEach(function (b) {
      b.addEventListener('click', function () {
        if (obs) { obs.disconnect(); obs = null; }
        elegir(b.dataset.modo);
      });
    });

    // Al llegar a la sección, el corte se "dibuja" solo una vez
    const inicial = muestra.dataset.modo;
    if (!reduceMotion && 'IntersectionObserver' in window) {
      muestra.dataset.modo = 'nada';
      obs = new IntersectionObserver(function (ents) {
        if (!ents[0].isIntersecting || !obs) return;
        obs.disconnect();
        obs = null;
        elegir(inicial);
      }, { threshold: 0.4 });
      obs.observe(muestra);
    } else {
      elegir(inicial);
    }
  }

  /* ==========================================================================
     5. COTIZADOR → WHATSAPP
     ========================================================================== */

  const Cotizador = (function () {
    const form = $('cotForm');
    const prev = $('mensajePrev');
    const boton = $('cotWhatsapp');
    let archivo = null;

    function valor(nombre) {
      const el = form.querySelector('input[name="' + nombre + '"]:checked');
      return el ? el.value : '';
    }

    function numero(id) {
      const v = parseFloat(String($(id).value).replace(',', '.'));
      return isFinite(v) && v > 0 ? v : null;
    }

    function mensaje() {
      const servicio = valor('servicio');
      const material = valor('material');
      const ancho = numero('cotAncho');
      const alto = numero('cotAlto');
      const cantidad = Math.max(1, Math.round(numero('cotCantidad') || 1));
      const notas = $('cotNotas').value.trim();

      const l = ['Hola Laser Print 👋, quiero cotizar ' + (servicio === 'Grabado' ? 'un grabado' : servicio === 'Corte' ? 'un corte' : 'corte y grabado') + ' láser:'];
      l.push('• Material: ' + material);
      l.push('• Servicio: ' + servicio);
      if (ancho && alto) l.push('• Medida: ' + formatoNum.format(ancho) + ' × ' + formatoNum.format(alto) + ' cm');
      else if (ancho || alto) l.push('• Medida: ' + formatoNum.format(ancho || alto) + ' cm (falta la otra medida)');
      l.push('• Cantidad: ' + cantidad + (cantidad === 1 ? ' pieza' : ' piezas'));
      if (archivo) l.push('• Archivo: ' + archivo);
      if (notas) l.push('• Detalles: ' + notas);
      l.push('');
      l.push('Les mando mi archivo en este chat.');
      return l.join('\n');
    }

    function actualizar() {
      const m = mensaje();
      prev.textContent = m;
      boton.href = linkWhatsApp(m);
    }

    function usarArchivo(r) {
      if (!r) return;
      archivo = r.nombre;
      if (r.anchoMm && r.altoMm && !r.pagina) {
        $('cotAncho').value = Math.round(r.anchoMm) / 10;
        $('cotAlto').value = Math.round(r.altoMm) / 10;
      }
      if (r.vector === false) {
        const g = form.querySelector('input[name="servicio"][value="Grabado"]');
        if (g) g.checked = true;
      }
      actualizar();
      $('cotizar').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    }

    function init() {
      if (!form) return;
      form.addEventListener('input', actualizar);
      form.addEventListener('change', actualizar);
      form.addEventListener('submit', function (e) { e.preventDefault(); });
      // El aluminio solo se graba
      form.addEventListener('change', function (e) {
        if (e.target.name === 'material' && e.target.value === 'Aluminio') {
          const g = form.querySelector('input[name="servicio"][value="Grabado"]');
          if (g) g.checked = true;
        }
        if (e.target.name === 'servicio' && e.target.value !== 'Grabado' && valor('material') === 'Aluminio') {
          const g = form.querySelector('input[name="servicio"][value="Grabado"]');
          if (g) g.checked = true;
          aviso('El aluminio solo se graba 🙂');
        }
        actualizar();
      });
      actualizar();
    }

    function aviso(t) {
      let a = form.querySelector('.cot-aviso');
      if (!a) {
        a = crear('p', 'cot-letra cot-aviso');
        a.setAttribute('role', 'status');
        a.style.textAlign = 'left';
        a.style.color = 'var(--laser)';
        form.querySelector('.cot-campos fieldset:nth-of-type(2)').appendChild(a);
      }
      a.textContent = t;
      clearTimeout(a._t);
      a._t = setTimeout(function () { a.textContent = ''; }, 3500);
    }

    return { init: init, usarArchivo: usarArchivo };
  })();

  /* ==========================================================================
     6. VITRINA DE TRABAJOS + VISOR
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

  /* --- PDF (la librería solo se descarga si hace falta) --- */
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

  const vitrina = $('vitrina');
  const escaparate = $('escaparate');
  const miniaturas = $('miniaturas');
  let trabajos = [];
  let firmaActual = null;
  let seleccion = 0;

  function resumen(t) {
    const r = $('vitrinaResumen');
    if (r) r.textContent = t;
  }

  function mensaje(icono, titulo, texto, boton) {
    const caja = crear('div', 'vitrina-mensaje');
    caja.appendChild(crear('span', 'icono', icono));
    caja.appendChild(crear('strong', '', titulo));
    caja.appendChild(crear('p', '', texto));
    if (boton) {
      const b = boton.href ? crear('a', 'btn-cta', boton.texto) : crear('button', '', boton.texto);
      if (boton.href) { b.href = boton.href; b.target = '_blank'; b.rel = 'noopener noreferrer'; }
      else { b.type = 'button'; b.addEventListener('click', boton.accion); }
      caja.appendChild(b);
    }
    vitrina.replaceChildren(caja);
  }

  function nombreTipo(t) {
    return t === 'video' ? 'Video' : t === 'pdf' ? 'Catálogo PDF' : 'Foto';
  }

  function pintarEscaparate(i) {
    const t = trabajos[i];
    if (!t) return;
    seleccion = i;
    escaparate.querySelectorAll('video').forEach(function (v) { v.pause(); });
    escaparate.innerHTML = '';
    escaparate.classList.remove('cargando');
    escaparate.removeAttribute('aria-hidden');
    escaparate.tabIndex = 0;
    escaparate.setAttribute('role', 'button');
    escaparate.setAttribute('aria-label', 'Ver en grande: ' + t.nombre);

    if (t.tipo === 'imagen') {
      const fondo = crear('img', 'fondo');
      fondo.alt = '';
      fondo.setAttribute('aria-hidden', 'true');
      fondo.src = cld(t.url, 400);
      const img = crear('img');
      img.alt = t.nombre;
      img.decoding = 'async';
      img.src = cld(t.url, 1600);
      img.addEventListener('error', function () { img.remove(); fondo.remove(); escaparate.prepend(crear('div', 'hoja', '🖼️')); }, { once: true });
      escaparate.append(fondo, img);
    } else if (t.tipo === 'video') {
      const portada = portadaVideo(t.url);
      if (portada) {
        const fondo = crear('img', 'fondo');
        fondo.alt = '';
        fondo.setAttribute('aria-hidden', 'true');
        fondo.src = portada;
        escaparate.appendChild(fondo);
      }
      const v = document.createElement('video');
      v.muted = true;
      v.loop = true;
      v.playsInline = true;
      v.setAttribute('playsinline', '');
      v.preload = 'metadata';
      if (portada) v.poster = portada;
      v.src = t.url;
      if (!reduceMotion) { v.autoplay = true; v.play().catch(function () {}); }
      escaparate.appendChild(v);
    } else {
      const h = crear('div', 'hoja', '📄');
      escaparate.appendChild(h);
      portadaPdf(t.url, h, 500);
    }

    escaparate.appendChild(crear('span', 'escaparate-etq',
      (trabajos.length > 1 ? (i + 1) + ' / ' + trabajos.length + ' · ' : '') + nombreTipo(t.tipo)));

    const info = crear('div', 'escaparate-info');
    const textos = crear('div');
    textos.appendChild(crear('h3', '', t.nombre));
    if (t.descripcion) textos.appendChild(crear('p', '', t.descripcion));
    info.appendChild(textos);
    if (t.precio) info.appendChild(crear('span', 'precio', t.precio));
    escaparate.appendChild(info);

    miniaturas.querySelectorAll('.mini').forEach(function (m, j) {
      m.setAttribute('aria-current', String(j === i));
      if (j === i) {
        const izq = m.offsetLeft - miniaturas.offsetLeft;
        if (izq < miniaturas.scrollLeft || izq + m.offsetWidth > miniaturas.scrollLeft + miniaturas.clientWidth) {
          miniaturas.scrollTo({ left: izq - 8, behavior: reduceMotion ? 'auto' : 'smooth' });
        }
      }
    });
  }

  function crearMini(t, i) {
    const b = crear('button', 'mini');
    b.type = 'button';
    b.dataset.pos = i;
    b.setAttribute('aria-label', t.nombre + ' (' + nombreTipo(t.tipo).toLowerCase() + ')');
    if (t.tipo === 'imagen') {
      const img = crear('img');
      img.alt = '';
      img.loading = 'lazy';
      img.src = cld(t.url, 260);
      img.addEventListener('error', function () { img.replaceWith(crear('span', 'ico', '🖼️')); }, { once: true });
      b.appendChild(img);
    } else if (t.tipo === 'video') {
      const portada = portadaVideo(t.url);
      if (portada) {
        const img = crear('img');
        img.alt = '';
        img.loading = 'lazy';
        img.src = portada;
        b.appendChild(img);
      } else {
        const v = document.createElement('video');
        v.muted = true;
        v.preload = 'metadata';
        v.src = t.url + '#t=0.1';
        b.appendChild(v);
      }
      b.appendChild(crear('span', 'ico sobre', '▶'));
    } else {
      b.appendChild(crear('span', 'ico', '📄'));
    }
    return b;
  }

  function render(productos) {
    trabajos = productos.map(function (p) {
      return {
        nombre: p.nombre || 'Trabajo de corte láser',
        descripcion: p.descripcion || '',
        precio: precioTexto(p.precio),
        tipo: tipoDe(p),
        url: urlArchivo(p.archivoUrl)
      };
    }).filter(function (t) { return t.url; });

    if (!trabajos.length) {
      resumen('Pronto subiremos fotos de nuestros trabajos.');
      mensaje('✂️', 'Aún no hay trabajos publicados',
        'Mientras tanto, escríbenos y te mandamos fotos de cortes y grabados que hemos hecho.',
        { texto: 'Pedir fotos por WhatsApp', href: linkWhatsApp('Hola Laser Print, ¿me pueden mandar fotos de trabajos de corte láser que hayan hecho?') });
      return;
    }

    miniaturas.innerHTML = '';
    const frag = document.createDocumentFragment();
    trabajos.forEach(function (t, i) { frag.appendChild(crearMini(t, i)); });
    miniaturas.appendChild(frag);
    miniaturas.hidden = trabajos.length < 2;
    vitrina.replaceChildren(escaparate, miniaturas);
    pintarEscaparate(Math.min(seleccion, trabajos.length - 1));

    const n = trabajos.length;
    resumen(n + (n === 1 ? ' trabajo' : ' trabajos') + ' · toca la foto para verla en grande');
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
      escaparate.innerHTML = '';
      escaparate.className = 'escaparate cargando';
      escaparate.setAttribute('aria-hidden', 'true');
      vitrina.replaceChildren(escaparate);
      resumen('Cargando trabajos…');
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
    $('visorWhatsapp').href = linkWhatsApp('Hola Laser Print, vi en su página el trabajo "' + t.nombre + '" (corte láser) y quiero uno así. ¿Me pueden cotizar?');
    $('visorAbrir').hidden = t.tipo !== 'pdf';
    if (t.tipo === 'pdf') $('visorAbrir').href = t.url;
    $('visorPrev').hidden = total < 2;
    $('visorNext').hidden = total < 2;
    if (total > 1 && posVisor !== seleccion) pintarEscaparate(posVisor);
  }

  function abrir(indice) {
    if (!trabajos[indice]) return;
    focoPrevio = document.activeElement;
    visor.hidden = false;
    document.body.style.overflow = 'hidden';
    escaparate.querySelectorAll('video').forEach(function (v) { v.pause(); });
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
    if (!reduceMotion) escaparate.querySelectorAll('video').forEach(function (v) { v.play().catch(function () {}); });
    if (focoPrevio && focoPrevio.focus) focoPrevio.focus();
  }

  function initVitrina() {
    escaparate.addEventListener('click', function () { if (trabajos.length) abrir(seleccion); });
    escaparate.addEventListener('keydown', function (e) {
      if ((e.key === 'Enter' || e.key === ' ') && trabajos.length) { e.preventDefault(); abrir(seleccion); }
      else if (e.key === 'ArrowRight' && trabajos.length > 1) pintarEscaparate((seleccion + 1) % trabajos.length);
      else if (e.key === 'ArrowLeft' && trabajos.length > 1) pintarEscaparate((seleccion - 1 + trabajos.length) % trabajos.length);
    });
    miniaturas.addEventListener('click', function (e) {
      const b = e.target.closest('.mini');
      if (b) pintarEscaparate(Number(b.dataset.pos));
    });
    miniaturas.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const b = e.target.closest('.mini');
      if (!b) return;
      e.preventDefault();
      const n = trabajos.length;
      const sig = (Number(b.dataset.pos) + (e.key === 'ArrowRight' ? 1 : -1) + n) % n;
      pintarEscaparate(sig);
      const m = miniaturas.querySelector('.mini[data-pos="' + sig + '"]');
      if (m) m.focus();
    });

    // Deslizar el escaparate en el celular
    let x0 = 0;
    let y0 = 0;
    escaparate.addEventListener('touchstart', function (e) { x0 = e.changedTouches[0].clientX; y0 = e.changedTouches[0].clientY; }, { passive: true });
    escaparate.addEventListener('touchend', function (e) {
      const dx = e.changedTouches[0].clientX - x0;
      const dy = e.changedTouches[0].clientY - y0;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) && trabajos.length > 1) {
        pintarEscaparate((seleccion + (dx < 0 ? 1 : -1) + trabajos.length) % trabajos.length);
      }
    }, { passive: true });
  }

  function initVisor() {
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
    initCama();
    Revisor.init();
    initCvg();
    Cotizador.init();
    initVitrina();
    initVisor();
    cargar();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
