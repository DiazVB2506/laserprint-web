/**
 * ==============================================================================
 * DISEÑO LASER PRINT — admin.js v4.0
 * Panel de administración: subir, editar y eliminar publicaciones.
 * ==============================================================================
 *
 * ⚠️ IMPORTANTE: la revisión de sesión de este archivo NO protege nada.
 * La protección real se agrega en el servidor (laserprint-backend).
 * Cuando esté lista, solo hay que completar la función authHeaders().
 */
(function () {
  'use strict';

  /* ==========================================================================
     0. CONFIGURACIÓN
     ========================================================================== */

  try {
    if (localStorage.getItem('adminAutenticado') !== 'true' && !localStorage.getItem('adminToken')) {
      window.location.replace('login.html');
      return;
    }
  } catch (e) {}

  const API_ORIGEN = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
    ? 'http://localhost:5000'
    : 'https://laserprint-api.onrender.com';
  const API_URL = API_ORIGEN + '/api/productos';

  // Los valores deben coincidir EXACTAMENTE con los que guarda el servidor
  const CATEGORIAS = {
    'DTF TEXTIL / UV': 'DTF Textil / UV',
    'SUBLIMACION': 'Sublimación',
    'LONA': 'Lona',
    'COROPLAST': 'Coroplast',
    'CORTE LASER': 'Corte Láser',
    'VINIL': 'Vinil'
  };

  const MAX_MB = 15;   // aviso si el archivo es más pesado

  const formatoMXN = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

  const estado = {
    productos: [],
    categoria: 'TODAS',
    busqueda: ''
  };

  const $ = function (id) { return document.getElementById(id); };

  /* ==========================================================================
     1. UTILIDADES
     ========================================================================== */

  function escapeHTML(str) {
    return str === null || str === undefined ? '' : String(str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function normalizar(texto) {
    return String(texto || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  function etiquetaCategoria(valor) {
    return CATEGORIAS[valor] || valor || 'Sin sección';
  }

  function urlArchivo(ruta) {
    if (!ruta) return '';
    if (/^https?:\/\//i.test(ruta)) return ruta;
    return API_ORIGEN + '/' + String(ruta).replace(/^\/+/, '');
  }

  function tipoDe(p) {
    const t = normalizar(p.tipoArchivo);
    const u = normalizar(p.archivoUrl);
    if (/video|mp4/.test(t) || /\.mp4(\?|$)/.test(u)) return 'video';
    if (/pdf/.test(t) || /\.pdf(\?|$)/.test(u)) return 'pdf';
    if (/imag|jpe?g|png|webp|gif|avif/.test(t) || /\.(jpe?g|png|webp|gif|avif)(\?|$)/.test(u)) return 'imagen';
    return 'archivo';
  }

  const ICONO_TIPO = { imagen: '🖼️', video: '🎬', pdf: '📄', archivo: '📎' };
  const NOMBRE_TIPO = { imagen: 'Imagen', video: 'Video', pdf: 'PDF', archivo: 'Archivo' };

  function tamanoLegible(bytes) {
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function idDe(p) {
    return String(p._id || p.id || '');
  }

  /**
   * Encabezados de seguridad para el servidor.
   * Hoy va vacío porque el servidor todavía no pide nada.
   * Cuando el servidor tenga login, aquí se manda el pase (token).
   */
  function authHeaders() {
    return {};
  }

  /** Lee la respuesta del servidor aunque no sea JSON */
  async function leerRespuesta(res) {
    try { return await res.json(); } catch (e) { return {}; }
  }

  /* ==========================================================================
     2. SONIDOS (un solo reproductor; antes se creaba uno por clic
        y el navegador dejaba de sonar después de varios)
     ========================================================================== */

  const Sonido = {
    ctx: null,
    activo: (function () { try { return localStorage.getItem('pixelSonido') !== 'off'; } catch (e) { return true; } })(),

    play: function (tipo) {
      if (!this.activo) return;
      try {
        if (!this.ctx) {
          const AC = window.AudioContext || window.webkitAudioContext;
          if (!AC) return;
          this.ctx = new AC();
        }
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const ctx = this.ctx;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain).connect(ctx.destination);
        const now = ctx.currentTime;
        let dur = 0.06;

        if (tipo === 'click') {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(520, now);
          osc.frequency.exponentialRampToValueAtTime(760, now + 0.05);
          gain.gain.setValueAtTime(0.04, now);
        } else if (tipo === 'save') {
          dur = 0.3;
          osc.type = 'sine';
          osc.frequency.setValueAtTime(523.25, now);
          osc.frequency.setValueAtTime(659.25, now + 0.08);
          osc.frequency.setValueAtTime(783.99, now + 0.16);
          gain.gain.setValueAtTime(0.06, now);
        } else if (tipo === 'delete') {
          dur = 0.18;
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(320, now);
          osc.frequency.linearRampToValueAtTime(120, now + dur);
          gain.gain.setValueAtTime(0.06, now);
        } else if (tipo === 'error') {
          dur = 0.18;
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(200, now);
          osc.frequency.setValueAtTime(150, now + 0.08);
          gain.gain.setValueAtTime(0.06, now);
        }

        gain.gain.linearRampToValueAtTime(0.001, now + dur);
        osc.start(now);
        osc.stop(now + dur + 0.01);
      } catch (e) {}
    }
  };

  /* ==========================================================================
     3. TEMA CLARO / OSCURO (comparte la preferencia con el sitio)
     ========================================================================== */

  function initTema() {
    const btn = $('themeToggle');
    const root = document.documentElement;
    if (!btn) return;

    const pintar = function () {
      btn.textContent = root.dataset.theme === 'dark' ? '☀️' : '🌙';
    };
    pintar();

    btn.addEventListener('click', function () {
      const nuevo = root.dataset.theme === 'dark' ? 'light' : 'dark';
      root.dataset.theme = nuevo;
      try { localStorage.setItem('theme', nuevo); } catch (e) {}
      pintar();
    });
  }

  /* ==========================================================================
     4. NOTIFICACIONES
     ========================================================================== */

  function notificar(mensaje, tipo) {
    tipo = tipo || 'exito';
    const cont = $('toastContainer');
    if (!cont) return;

    const el = document.createElement('div');
    el.className = 'toast toast-' + tipo;
    el.setAttribute('role', tipo === 'error' ? 'alert' : 'status');

    const icono = document.createElement('span');
    icono.setAttribute('aria-hidden', 'true');
    icono.textContent = tipo === 'error' ? '⚠️' : '✅';

    const texto = document.createElement('span');
    texto.textContent = mensaje;

    el.appendChild(icono);
    el.appendChild(texto);
    cont.appendChild(el);

    requestAnimationFrame(function () { el.classList.add('visible'); });
    setTimeout(function () {
      el.classList.remove('visible');
      setTimeout(function () { el.remove(); }, 300);
    }, tipo === 'error' ? 5500 : 3500);
  }

  /* ==========================================================================
     5. CARGA Y TABLA
     ========================================================================== */

  function mensajeTabla(tipo, html) {
    const tabla = $('tabla');
    if (!tabla) return;
    tabla.innerHTML = '<tr><td colspan="6" class="estado-tabla estado-' + tipo + '">' + html + '</td></tr>';
  }

  async function cargar() {
    mensajeTabla('cargando', '<span class="spinner" aria-hidden="true"></span>&nbsp; Cargando publicaciones…');
    const resumen = $('resumenLista');
    if (resumen) resumen.textContent = 'Cargando…';

    // El servidor gratuito de Render se duerme: avisamos si tarda
    const avisoLento = setTimeout(function () {
      mensajeTabla('cargando', '<span class="spinner" aria-hidden="true"></span>&nbsp; Despertando el servidor… la primera carga puede tardar hasta un minuto.');
    }, 5000);

    try {
      const res = await fetch(API_URL + '?limit=500', { headers: authHeaders() });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      estado.productos = Array.isArray(data) ? data : (data.productos || []);
      actualizarConteos();
      render();
    } catch (error) {
      console.error('Error al cargar publicaciones:', error);
      mensajeTabla('error',
        '<span class="estado-icono" aria-hidden="true">🔌</span>' +
        'No se pudo conectar con el servidor. ' +
        '<button type="button" class="btn-link" data-action="reintentar">Reintentar</button>');
      if (resumen) resumen.textContent = 'Sin conexión';
    } finally {
      clearTimeout(avisoLento);
    }
  }

  function filtrados() {
    const q = normalizar(estado.busqueda);
    return estado.productos.filter(function (p) {
      const okCat = estado.categoria === 'TODAS' || p.categoria === estado.categoria;
      const okTexto = !q || normalizar(p.nombre).includes(q) || normalizar(p.descripcion).includes(q);
      return okCat && okTexto;
    });
  }

  function filaHTML(p) {
    const id = escapeHTML(idDe(p));
    const tipo = tipoDe(p);
    const url = urlArchivo(p.archivoUrl);

    const vista = (tipo === 'imagen' && url)
      ? '<img class="thumb" src="' + escapeHTML(url) + '" alt="" loading="lazy" decoding="async" data-tipo="' + tipo + '">'
      : '<span class="thumb" aria-hidden="true">' + ICONO_TIPO[tipo] + '</span>';

    const tienePrecio = p.precio !== null && p.precio !== undefined && p.precio !== '' && !isNaN(Number(p.precio));
    const precio = tienePrecio
      ? '<span class="precio">' + formatoMXN.format(Number(p.precio)) + '</span>'
      : '<span class="muted">—</span>';

    const desc = p.descripcion ? String(p.descripcion) : '';

    return '<tr>' +
      '<td data-label="Vista">' + vista + '</td>' +
      '<td data-label="Nombre" class="cell-nombre"><strong>' + escapeHTML(p.nombre || 'Sin nombre') + '</strong>' +
        (desc ? '<span class="desc">' + escapeHTML(desc) + '</span>' : '') + '</td>' +
      '<td data-label="Sección"><span class="badge-cat">' + escapeHTML(etiquetaCategoria(p.categoria)) + '</span></td>' +
      '<td data-label="Precio">' + precio + '</td>' +
      '<td data-label="Tipo"><span class="badge-file t-' + tipo + '">' + NOMBRE_TIPO[tipo] + '</span></td>' +
      '<td data-label="Acciones"><div class="acciones">' +
        '<button type="button" class="btn-edit" data-action="editar" data-id="' + id + '">Editar</button>' +
        '<button type="button" class="btn-del" data-action="eliminar" data-id="' + id + '">Eliminar</button>' +
      '</div></td>' +
    '</tr>';
  }

  function render() {
    const tabla = $('tabla');
    if (!tabla) return;

    const lista = filtrados();
    const resumen = $('resumenLista');
    if (resumen) {
      const total = estado.productos.length;
      resumen.textContent = lista.length === total
        ? total + (total === 1 ? ' publicación' : ' publicaciones')
        : 'Mostrando ' + lista.length + ' de ' + total;
    }

    if (!estado.productos.length) {
      mensajeTabla('vacio', '<span class="estado-icono" aria-hidden="true">🗂️</span>Todavía no hay publicaciones. Sube la primera con el formulario de arriba.');
      return;
    }
    if (!lista.length) {
      mensajeTabla('vacio', '<span class="estado-icono" aria-hidden="true">🔍</span>No hay publicaciones con ese filtro.');
      return;
    }

    tabla.innerHTML = lista.map(filaHTML).join('');
  }

  function actualizarConteos() {
    document.querySelectorAll('.tab-btn').forEach(function (btn) {
      const cat = btn.getAttribute('data-cat');
      const n = cat === 'TODAS'
        ? estado.productos.length
        : estado.productos.filter(function (p) { return p.categoria === cat; }).length;
      const span = btn.querySelector('.count');
      if (span) span.textContent = n;
    });
  }

  function initTabla() {
    const tabla = $('tabla');
    if (!tabla) return;

    // Botones de cada fila (un solo listener para toda la tabla)
    tabla.addEventListener('click', function (e) {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const accion = btn.getAttribute('data-action');
      const id = btn.getAttribute('data-id');
      if (accion === 'editar') abrirEdicion(id);
      else if (accion === 'eliminar') eliminar(id, btn);
      else if (accion === 'reintentar') cargar();
    });

    // Si una miniatura no carga, se cambia por un ícono
    tabla.addEventListener('error', function (e) {
      if (e.target.tagName === 'IMG' && e.target.classList.contains('thumb')) {
        const icono = document.createElement('span');
        icono.className = 'thumb';
        icono.setAttribute('aria-hidden', 'true');
        icono.textContent = ICONO_TIPO.imagen;
        e.target.replaceWith(icono);
      }
    }, true);
  }

  /* ==========================================================================
     6. PESTAÑAS Y BUSCADOR
     ========================================================================== */

  function initFiltros() {
    const botones = document.querySelectorAll('.tab-btn');
    botones.forEach(function (btn) {
      btn.addEventListener('click', function () {
        Sonido.play('click');
        botones.forEach(function (b) {
          b.classList.remove('active');
          b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
        estado.categoria = btn.getAttribute('data-cat');
        render();
      });
    });

    const input = $('searchInput');
    const lista = $('searchSuggestions');
    if (!input) return;

    function cerrarSugerencias() {
      if (lista) lista.style.display = 'none';
    }

    input.addEventListener('input', function () {
      estado.busqueda = input.value.trim();
      render();
      mostrarSugerencias();
    });

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        if (lista && lista.style.display === 'block') cerrarSugerencias();
        else { input.value = ''; estado.busqueda = ''; render(); }
      }
    });

    document.addEventListener('click', function (e) {
      if (!e.target.closest('.search-box')) cerrarSugerencias();
    });

    function mostrarSugerencias() {
      if (!lista) return;
      const q = normalizar(estado.busqueda);
      if (!q) { cerrarSugerencias(); return; }

      const coincidencias = estado.productos
        .filter(function (p) { return normalizar(p.nombre).includes(q); })
        .slice(0, 5);

      if (!coincidencias.length) { cerrarSugerencias(); return; }

      lista.innerHTML = '';
      coincidencias.forEach(function (p) {
        const li = document.createElement('li');
        li.setAttribute('role', 'option');
        const nombre = document.createElement('span');
        nombre.textContent = p.nombre;
        const cat = document.createElement('small');
        cat.textContent = etiquetaCategoria(p.categoria);
        li.appendChild(nombre);
        li.appendChild(cat);
        li.addEventListener('click', function () {
          input.value = p.nombre;
          estado.busqueda = p.nombre;
          cerrarSugerencias();
          render();
        });
        lista.appendChild(li);
      });
      lista.style.display = 'block';
    }
  }

  /* ==========================================================================
     7. VISTA PREVIA DEL ARCHIVO Y CONTADOR DE CARACTERES
     ========================================================================== */

  function mostrarPreview(caja, opciones) {
    if (!caja) return;
    caja.innerHTML = '';

    if (!opciones) { caja.hidden = true; return; }

    let visual;
    if (opciones.tipo === 'imagen' && opciones.url) {
      visual = document.createElement('img');
      visual.src = opciones.url;
      visual.alt = '';
    } else {
      visual = document.createElement('span');
      visual.className = 'file-icon';
      visual.setAttribute('aria-hidden', 'true');
      visual.textContent = ICONO_TIPO[opciones.tipo] || ICONO_TIPO.archivo;
    }

    const info = document.createElement('div');
    info.className = 'file-info';
    const nombre = document.createElement('strong');
    nombre.textContent = opciones.nombre;
    const detalle = document.createElement('span');
    detalle.textContent = opciones.detalle || '';
    if (opciones.aviso) detalle.className = 'aviso';

    info.appendChild(nombre);
    info.appendChild(detalle);
    caja.appendChild(visual);
    caja.appendChild(info);
    caja.hidden = false;
  }

  function tipoDeArchivo(file) {
    if (file.type.startsWith('image/')) return 'imagen';
    if (file.type.startsWith('video/')) return 'video';
    if (file.type === 'application/pdf') return 'pdf';
    return 'archivo';
  }

  function enlazarPreview(input, caja) {
    if (!input || !caja) return;
    let urlTemporal = null;

    input.addEventListener('change', function () {
      if (urlTemporal) { URL.revokeObjectURL(urlTemporal); urlTemporal = null; }
      const file = input.files && input.files[0];
      if (!file) { mostrarPreview(caja, null); return; }

      const tipo = tipoDeArchivo(file);
      if (tipo === 'imagen') urlTemporal = URL.createObjectURL(file);

      const pesado = file.size > MAX_MB * 1024 * 1024;
      mostrarPreview(caja, {
        tipo: tipo,
        url: urlTemporal,
        nombre: file.name,
        detalle: tamanoLegible(file.size) + (pesado ? ' — archivo pesado, podría tardar o fallar' : ''),
        aviso: pesado
      });
    });

    // Arrastrar y soltar: resalta la zona
    const zona = input.closest('.dropzone');
    if (zona) {
      ['dragenter', 'dragover'].forEach(function (ev) {
        zona.addEventListener(ev, function () { zona.classList.add('arrastrando'); });
      });
      ['dragleave', 'drop'].forEach(function (ev) {
        zona.addEventListener(ev, function () { zona.classList.remove('arrastrando'); });
      });
    }
  }

  function initContadores() {
    document.querySelectorAll('.char-count').forEach(function (cont) {
      const campo = $(cont.getAttribute('data-for'));
      if (!campo) return;
      const max = Number(campo.getAttribute('maxlength')) || 0;
      const pintar = function () {
        const n = campo.value.length;
        cont.textContent = max ? n + ' / ' + max : String(n);
        cont.classList.toggle('limite', max && n > max * 0.9);
      };
      campo.addEventListener('input', pintar);
      campo.form && campo.form.addEventListener('reset', function () { setTimeout(pintar, 0); });
      cont._pintar = pintar;
      pintar();
    });
  }

  function refrescarContadores() {
    document.querySelectorAll('.char-count').forEach(function (c) { if (c._pintar) c._pintar(); });
  }

  /* ==========================================================================
     8. CREAR
     ========================================================================== */

  function initCrear() {
    const form = $('uploadForm');
    if (!form) return;

    enlazarPreview($('archivo'), $('filePreview'));
    form.addEventListener('reset', function () { mostrarPreview($('filePreview'), null); });

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      const btn = $('btnSubmit');
      const textoOriginal = btn ? btn.textContent : '';
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner" aria-hidden="true"></span> Subiendo…';
      }

      try {
        const res = await fetch(API_URL, {
          method: 'POST',
          headers: authHeaders(),
          body: new FormData(form)
        });
        const data = await leerRespuesta(res);

        if (res.ok) {
          Sonido.play('save');
          notificar('Publicación subida correctamente.');
          form.reset();
          cargar();
        } else {
          Sonido.play('error');
          notificar('No se pudo guardar: ' + (data.error || data.mensaje || 'error ' + res.status), 'error');
        }
      } catch (error) {
        Sonido.play('error');
        notificar('Sin conexión con el servidor. Intenta de nuevo en un momento.', 'error');
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.textContent = textoOriginal;
        }
      }
    });
  }

  /* ==========================================================================
     9. EDITAR
     ========================================================================== */

  let focoAntesDelModal = null;

  function abrirEdicion(id) {
    const p = estado.productos.find(function (x) { return idDe(x) === String(id); });
    if (!p) {
      notificar('No se encontró esa publicación. Recarga la página.', 'error');
      return;
    }

    Sonido.play('click');
    $('editId').value = idDe(p);
    $('editNombre').value = p.nombre || '';
    $('editDescripcion').value = p.descripcion || '';
    $('editPrecio').value = (p.precio !== null && p.precio !== undefined) ? p.precio : '';
    $('editCategoria').value = CATEGORIAS[p.categoria] ? p.categoria : 'LONA';
    $('editArchivo').value = '';
    refrescarContadores();

    // Muestra el archivo actual
    const tipo = tipoDe(p);
    mostrarPreview($('editFilePreview'), p.archivoUrl ? {
      tipo: tipo,
      url: urlArchivo(p.archivoUrl),
      nombre: 'Archivo actual',
      detalle: 'Se conserva si no eliges uno nuevo'
    } : null);

    focoAntesDelModal = document.activeElement;
    const modal = $('editModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    setTimeout(function () { $('editNombre').focus(); }, 50);
  }

  function cerrarModal() {
    const modal = $('editModal');
    if (!modal || !modal.classList.contains('active')) return;
    modal.classList.remove('active');
    document.body.style.overflow = '';
    if (focoAntesDelModal && focoAntesDelModal.focus) focoAntesDelModal.focus();
  }

  function initEditar() {
    const form = $('editForm');
    const modal = $('editModal');
    if (!form || !modal) return;

    enlazarPreview($('editArchivo'), $('editFilePreview'));

    $('closeModalBtn').addEventListener('click', cerrarModal);
    $('btnCancelEdit').addEventListener('click', cerrarModal);
    modal.addEventListener('click', function (e) { if (e.target === modal) cerrarModal(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') cerrarModal();
    });

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      const id = String($('editId').value || '').trim();
      if (!id || id === 'undefined' || id === 'null') {
        notificar('No se encontró el ID de la publicación.', 'error');
        return;
      }

      const btn = $('btnSaveEdit');
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner" aria-hidden="true"></span> Guardando…';
      }

      const datos = new FormData();
      datos.append('nombre', $('editNombre').value);
      datos.append('descripcion', $('editDescripcion').value);
      datos.append('precio', $('editPrecio').value);
      datos.append('categoria', $('editCategoria').value);
      const archivo = $('editArchivo');
      if (archivo.files && archivo.files[0]) datos.append('archivo', archivo.files[0]);

      try {
        const res = await fetch(API_URL + '/' + encodeURIComponent(id), {
          method: 'PUT',
          headers: authHeaders(),
          body: datos
        });
        const data = await leerRespuesta(res);

        if (res.ok) {
          Sonido.play('save');
          notificar('Cambios guardados.');
          cerrarModal();
          cargar();
        } else {
          Sonido.play('error');
          notificar('No se pudo guardar: ' + (data.error || data.mensaje || 'error ' + res.status), 'error');
        }
      } catch (error) {
        console.error('Error al editar:', error);
        Sonido.play('error');
        notificar('Sin conexión con el servidor. Intenta de nuevo en un momento.', 'error');
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.textContent = 'Guardar cambios';
        }
      }
    });
  }

  /* ==========================================================================
     10. ELIMINAR
     ========================================================================== */

  async function eliminar(id, boton) {
    const p = estado.productos.find(function (x) { return idDe(x) === String(id); });
    const nombre = p && p.nombre ? '"' + p.nombre + '"' : 'esta publicación';
    if (!window.confirm('¿Eliminar ' + nombre + '?\n\nDesaparecerá del sitio y no se puede deshacer.')) return;

    if (boton) {
      boton.disabled = true;
      boton.textContent = 'Eliminando…';
    }

    try {
      const res = await fetch(API_URL + '/' + encodeURIComponent(id), {
        method: 'DELETE',
        headers: authHeaders()
      });

      if (res.ok) {
        Sonido.play('delete');
        notificar('Publicación eliminada.');
        estado.productos = estado.productos.filter(function (x) { return idDe(x) !== String(id); });
        actualizarConteos();
        render();
      } else {
        const data = await leerRespuesta(res);
        Sonido.play('error');
        notificar('No se pudo eliminar: ' + (data.error || data.mensaje || 'error ' + res.status), 'error');
        if (boton) { boton.disabled = false; boton.textContent = 'Eliminar'; }
      }
    } catch (error) {
      Sonido.play('error');
      notificar('Sin conexión con el servidor. Intenta de nuevo en un momento.', 'error');
      if (boton) { boton.disabled = false; boton.textContent = 'Eliminar'; }
    }
  }

  /* ==========================================================================
     11. CERRAR SESIÓN Y ARRANQUE
     ========================================================================== */

  function initSesion() {
    const btn = $('logoutBtn');
    if (!btn) return;
    btn.addEventListener('click', function () {
      try {
        localStorage.removeItem('adminAutenticado');
        localStorage.removeItem('adminToken');
      } catch (e) {}
      window.location.replace('login.html');
    });
  }

  function iniciar() {
    initTema();
    initSesion();
    initTabla();
    initFiltros();
    initContadores();
    initCrear();
    initEditar();
    cargar();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
