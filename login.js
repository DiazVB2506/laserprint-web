/**
 * ==============================================================================
 * DISEÑO LASER PRINT — login.js v3.0
 * El usuario y la contraseña los revisa el SERVIDOR. Aquí ya no hay ninguna
 * contraseña escrita: este archivo solo envía lo que escribes y guarda el
 * "pase" temporal que el servidor devuelve.
 * ==============================================================================
 */
(function () {
  'use strict';

  const API_ORIGEN = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
    ? 'http://localhost:5000'
    : 'https://laserprint-api.onrender.com';

  const CLAVE_SESION = 'lpAdminSesion';

  /* ---------- Sesión ---------- */

  function leerSesion() {
    try {
      const s = JSON.parse(localStorage.getItem(CLAVE_SESION) || 'null');
      return s && s.token && s.expira > Date.now() ? s : null;
    } catch (e) { return null; }
  }

  function guardarSesion(token, expira) {
    try {
      localStorage.setItem(CLAVE_SESION, JSON.stringify({ token: token, expira: expira }));
      localStorage.removeItem('adminAutenticado');   // del sistema anterior
      localStorage.removeItem('adminToken');
    } catch (e) {}
  }

  // Si ya hay una sesión vigente, directo al panel
  if (leerSesion()) {
    window.location.replace('admin.html');
    return;
  }

  /* ---------- Tema claro / oscuro ---------- */

  const root = document.documentElement;
  const btnTema = document.getElementById('themeToggle');

  function aplicarTema(tema) {
    root.setAttribute('data-theme', tema);
    root.classList.toggle('dark-theme', tema === 'dark');
    root.classList.toggle('light-theme', tema !== 'dark');
    if (btnTema) {
      btnTema.innerHTML = tema === 'dark'
        ? '<span aria-hidden="true">☀️</span> Modo claro'
        : '<span aria-hidden="true">🌙</span> Modo oscuro';
    }
  }

  aplicarTema(root.getAttribute('data-theme') === 'light' ? 'light' : 'dark');

  if (btnTema) {
    btnTema.addEventListener('click', function () {
      const nuevo = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem('theme', nuevo); } catch (e) {}
      aplicarTema(nuevo);
      sonido('click');
    });
  }

  /* ---------- Sonidos (un solo reproductor) ---------- */

  let ctx = null;
  function sonido(tipo) {
    try {
      if (localStorage.getItem('pixelSonido') === 'off') return;
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        ctx = new AC();
      }
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain).connect(ctx.destination);
      const now = ctx.currentTime;
      let dur = 0.05;

      if (tipo === 'granted') {
        dur = 0.3;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(783.99, now + 0.08);
        gain.gain.setValueAtTime(0.08, now);
      } else if (tipo === 'denied') {
        dur = 0.2;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.setValueAtTime(130, now + 0.08);
        gain.gain.setValueAtTime(0.07, now);
      } else {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(580, now);
        osc.frequency.exponentialRampToValueAtTime(320, now + dur);
        gain.gain.setValueAtTime(0.05, now);
      }
      gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
      osc.start(now);
      osc.stop(now + dur + 0.01);
    } catch (e) {}
  }

  /* ---------- Mensajes ---------- */

  const form = document.getElementById('loginForm');
  const alerta = document.getElementById('alertMessage');
  const btn = document.getElementById('btnLogin');
  const inputUsuario = document.getElementById('usuario');
  const inputPassword = document.getElementById('password');
  const textoBoton = btn ? btn.textContent : 'Entrar';

  function mostrarMensaje(texto, tipo) {
    if (!alerta) return;
    alerta.className = 'alert-message' + (tipo === 'exito' ? ' success' : '');
    alerta.textContent = texto;
    alerta.style.display = 'block';
  }

  function ocultarMensaje() {
    if (alerta) alerta.style.display = 'none';
  }

  function marcarError(marcar) {
    [inputUsuario, inputPassword].forEach(function (el) {
      if (el) el.setAttribute('aria-invalid', marcar ? 'true' : 'false');
    });
  }

  function setCargando(cargando, texto) {
    if (!btn) return;
    btn.disabled = cargando;
    btn.setAttribute('aria-busy', String(cargando));
    btn.textContent = cargando ? (texto || 'Verificando…') : textoBoton;
  }

  [inputUsuario, inputPassword].forEach(function (el) {
    if (el) el.addEventListener('input', function () { marcarError(false); });
  });

  // Aviso si venimos de una sesión expirada
  if (/[?&]expirada=1/.test(location.search)) {
    mostrarMensaje('Tu sesión expiró. Vuelve a iniciar sesión.');
  }

  /* ---------- Envío ---------- */

  if (!form) return;

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    ocultarMensaje();

    const usuario = inputUsuario ? inputUsuario.value.trim() : '';
    const password = inputPassword ? inputPassword.value : '';

    if (!usuario || !password) {
      marcarError(true);
      sonido('denied');
      mostrarMensaje('Escribe tu usuario y tu contraseña.');
      return;
    }

    setCargando(true);

    // El servidor gratuito de Render se duerme: avisamos si tarda
    const avisoLento = setTimeout(function () {
      setCargando(true, 'Despertando servidor… (hasta 1 min)');
    }, 4000);

    const control = new AbortController();
    const limite = setTimeout(function () { control.abort(); }, 75000);

    try {
      const res = await fetch(API_ORIGEN + '/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario: usuario, password: password }),
        signal: control.signal
      });

      let data = {};
      try { data = await res.json(); } catch (err) {}

      if (res.ok && data.token) {
        guardarSesion(data.token, data.expira);
        sonido('granted');
        mostrarMensaje('Acceso autorizado. Entrando al panel…', 'exito');
        if (btn) btn.textContent = 'Acceso autorizado ✓';
        setTimeout(function () { window.location.replace('admin.html'); }, 500);
        return;
      }

      sonido('denied');
      if (res.status === 401) {
        marcarError(true);
        if (inputPassword) { inputPassword.value = ''; inputPassword.focus(); }
      }
      mostrarMensaje(data.error || 'No se pudo iniciar sesión (error ' + res.status + ').');
      setCargando(false);
    } catch (err) {
      sonido('denied');
      mostrarMensaje(err.name === 'AbortError'
        ? 'El servidor tardó demasiado en responder. Intenta de nuevo en un momento.'
        : 'Sin conexión con el servidor. Revisa tu internet e intenta de nuevo.');
      setCargando(false);
    } finally {
      clearTimeout(avisoLento);
      clearTimeout(limite);
    }
  });
})();
