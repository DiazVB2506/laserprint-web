/**
 * ==============================================================================
 * DISEÑO LASER PRINT - CONTROL DE LOGIN & GESTIÓN DE TEMA ("THEME ENGINE")
 * ==============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm') || document.querySelector('form');
  const alertBox = document.getElementById('alertMessage');
  const btnSubmit = document.getElementById('btnLogin') || document.querySelector('button[type="submit"]');

  // ==========================================================================
  // 1. SISTEMA DE GESTIÓN DE TEMA (PERSISTENCIA CLARO / OSCURO)
  // ==========================================================================
  const THEME_KEY = 'theme'; // Clave en localStorage

  function aplicarTemaGuardado() {
    // Si no hay tema guardado, se puede definir 'dark' por defecto
    const temaGuardado = localStorage.getItem(THEME_KEY) || 'dark';
    
    if (temaGuardado === 'dark') {
      document.documentElement.classList.add('dark-theme');
      document.documentElement.classList.remove('light-theme');
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
    } else {
      document.documentElement.classList.add('light-theme');
      document.documentElement.classList.remove('dark-theme');
      document.body.classList.add('light-theme');
      document.body.classList.remove('dark-theme');
    }
  }

  function alternarTema() {
    const esOscuro = document.documentElement.classList.contains('dark-theme') || document.body.classList.contains('dark-theme');
    const nuevoTema = esOscuro ? 'light' : 'dark';
    
    localStorage.setItem(THEME_KEY, nuevoTema);
    aplicarTemaGuardado();
    playRetroSFX('click');
  }

  // Aplicar inmediatamente el tema recordado
  aplicarTemaGuardado();

  // Escuchar botón de alternar tema (si existe en el DOM)
  const themeToggleBtn = document.getElementById('themeToggle') || document.querySelector('.theme-toggle');
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', alternarTema);
  }

  // ==========================================================================
  // 2. SINTETIZADOR AUDIO RETRO 8-BIT (WEB AUDIO API)
  // ==========================================================================
  let audioCtx = null;

  function getAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) audioCtx = new AudioContextClass();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playRetroSFX(type) {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;

      if (type === 'click') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.05);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === 'granted') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(330, now);
        osc.frequency.setValueAtTime(440, now + 0.08);
        osc.frequency.setValueAtTime(554.37, now + 0.16);
        osc.frequency.setValueAtTime(659.25, now + 0.24);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
      } else if (type === 'denied') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.setValueAtTime(90, now + 0.1);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      }
    } catch (e) {
      // Ignorar errores de audio
    }
  }

  if (btnSubmit) {
    btnSubmit.addEventListener('mousedown', () => playRetroSFX('click'));
  }

  function mostrarError(mensaje) {
    playRetroSFX('denied');
    if (alertBox) {
      alertBox.textContent = `[SYSTEM ERROR]: ${mensaje.toUpperCase()}`;
      alertBox.style.display = 'block';
      alertBox.classList.remove('shake');
      void alertBox.offsetWidth; // Force reflow para reiniciar animación
      alertBox.classList.add('shake');
    } else {
      alert(`[ACCESS DENIED]: ${mensaje}`);
    }
  }

  // ==========================================================================
  // 3. ESTILOS DINÁMICOS Y ANIMACIONES RETRO
  // ==========================================================================
  if (!document.getElementById('spinner-style')) {
    const style = document.createElement('style');
    style.id = 'spinner-style';
    style.innerHTML = `
      .shake { animation: shakeError 0.35s steps(4, end); }
      @keyframes shakeError {
        0% { transform: translate(0, 0); }
        25% { transform: translate(-8px, 0); }
        50% { transform: translate(8px, 0); }
        75% { transform: translate(-4px, 0); }
        100% { transform: translate(0, 0); }
      }
    `;
    document.head.appendChild(style);
  }

  // ==========================================================================
  // 4. AUTENTICACIÓN Y VALIDACIÓN DE FORMULARIO
  // ==========================================================================
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      if (alertBox) alertBox.style.display = 'none';

      // Capturar entradas buscando por ID o por tipo
      const userEl = document.getElementById('usuario') || document.querySelector('input[type="text"]');
      const passEl = document.getElementById('password') || document.querySelector('input[type="password"]');

      const usuario = userEl ? userEl.value.trim() : '';
      const password = passEl ? passEl.value.trim() : '';

      // VALIDACIÓN LOCAL DIRECTA
      if (usuario === '2025' && password === 'LaserPrint01') {
        localStorage.setItem('adminAutenticado', 'true');
        playRetroSFX('granted');

        if (btnSubmit) {
          btnSubmit.style.background = '#00ff66';
          btnSubmit.style.color = '#000000';
          btnSubmit.style.boxShadow = '0 0 15px #00ff66';
          btnSubmit.innerHTML = '★ ACCESS GRANTED ★';
        }

        setTimeout(() => {
          window.location.href = 'admin.html';
        }, 600);
      } else {
        mostrarError('INVALID CREDENTIALS');
      }
    });
  }
});
