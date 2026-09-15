/**
 * ==============================================================================
 * DISEÑO LASER PRINT - CONTROL DE LOGIN & GESTIÓN DE TEMA EDITORIAL
 * ==============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm') || document.querySelector('form');
  const alertBox = document.getElementById('alertMessage');
  const btnSubmit = document.getElementById('btnLogin') || document.querySelector('button[type="submit"]');

  // ==========================================================================
  // 1. SISTEMA DE GESTIÓN DE TEMA (PERSISTENCIA LIGHT / DARK)
  // ==========================================================================
  const THEME_KEY = 'theme';

  function aplicarTemaGuardado() {
    const temaGuardado = localStorage.getItem(THEME_KEY) || 'dark';
    
    // Aplicar atributo global de tema
    document.documentElement.setAttribute('data-theme', temaGuardado);
    
    // Mantener compatibilidad con clases si fuera necesario
    if (temaGuardado === 'dark') {
      document.documentElement.classList.add('dark-theme');
      document.documentElement.classList.remove('light-theme');
    } else {
      document.documentElement.classList.add('light-theme');
      document.documentElement.classList.remove('dark-theme');
    }

    actualizarBotonTema(temaGuardado);
  }

  function actualizarBotonTema(temaActual) {
    const themeToggleBtn = document.getElementById('themeToggle') || document.querySelector('.theme-toggle-btn');
    if (!themeToggleBtn) return;

    if (temaActual === 'dark') {
      themeToggleBtn.innerHTML = '<span>☀️</span> Modo Claro';
    } else {
      themeToggleBtn.innerHTML = '<span>🌙</span> Modo Oscuro';
    }
  }

  function alternarTema() {
    const temaActual = document.documentElement.getAttribute('data-theme') || 'dark';
    const nuevoTema = temaActual === 'dark' ? 'light' : 'dark';
    
    localStorage.setItem(THEME_KEY, nuevoTema);
    aplicarTemaGuardado();
    playModernSFX('click');
  }

  // Cargar tema de inmediato
  aplicarTemaGuardado();

  // Escuchar conmutador de tema
  const themeToggleBtn = document.getElementById('themeToggle') || document.querySelector('.theme-toggle-btn');
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', alternarTema);
  }

  // ==========================================================================
  // 2. SINTETIZADOR AUDIO SUAVE & PROFESIONAL (WEB AUDIO API)
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

  function playModernSFX(type) {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      if (type === 'click') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(580, now);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.04);

        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.04);

      } else if (type === 'granted') {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        // Acorde sutil C5 -> G5
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(523.25, now);
        
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(783.99, now + 0.08);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.1, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc1.stop(now + 0.35);
        osc2.start(now + 0.08);
        osc2.stop(now + 0.35);

      } else if (type === 'denied') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.setValueAtTime(130, now + 0.08);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.22);
      }
    } catch (e) {
      // Ignorar restricciones de reproducción de audio si interactúa antes de tiempo
    }
  }

  // ==========================================================================
  // 3. ANIMACIONES Y ESTILOS DINÁMICOS
  // ==========================================================================
  if (!document.getElementById('shake-style')) {
    const style = document.createElement('style');
    style.id = 'shake-style';
    style.innerHTML = `
      .shake { animation: shakeError 0.35s ease-in-out; }
      @keyframes shakeError {
        0%, 100% { transform: translateX(0); }
        20%, 60% { transform: translateX(-6px); }
        40%, 80% { transform: translateX(6px); }
      }
    `;
    document.head.appendChild(style);
  }

  function mostrarError(mensaje) {
    playModernSFX('denied');
    if (alertBox) {
      alertBox.textContent = mensaje;
      alertBox.style.display = 'block';
      alertBox.classList.remove('shake');
      void alertBox.offsetWidth; // Forzar reflow para reiniciar la animación
      alertBox.classList.add('shake');
    } else {
      alert(mensaje);
    }
  }

  // ==========================================================================
  // 4. AUTENTICACIÓN Y MANEJO DE INICIO DE SESIÓN
  // ==========================================================================
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      if (alertBox) alertBox.style.display = 'none';

      const userEl = document.getElementById('usuario') || document.querySelector('input[type="text"]');
      const passEl = document.getElementById('password') || document.querySelector('input[type="password"]');

      const usuario = userEl ? userEl.value.trim() : '';
      const password = passEl ? passEl.value.trim() : '';

      if (!usuario || !password) {
        mostrarError('Por favor, ingresa tu usuario y contraseña.');
        return;
      }

      // Proceso de Verificación
      if (usuario === '2025' && password === 'LaserPrint01') {
        localStorage.setItem('adminAutenticado', 'true');
        playModernSFX('granted');

        if (btnSubmit) {
          btnSubmit.disabled = true;
          btnSubmit.textContent = 'Acceso Autorizado';
          btnSubmit.style.backgroundColor = '#10B981'; // Verde sobrio
        }

        setTimeout(() => {
          window.location.href = 'admin.html';
        }, 500);

      } else {
        mostrarError('Usuario o contraseña incorrectos.');
      }
    });
  }
});
