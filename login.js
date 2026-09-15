/* ==========================================================================
   1. SINTETIZADOR DE SONIDOS EDITORIALES (WEB AUDIO API)
   ========================================================================== */
const SoundEffects = {
  ctx: null,

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  },

  // Sonido suave de interacción/click al cambiar tema
  playClick() {
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  },

  // Sonido armónico de éxito al iniciar sesión
  playSuccess() {
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Acorde suave C5 a G5
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, now); // C5
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(783.99, now + 0.08); // G5

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.4);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.4);
  },

  // Sonido tenue de advertencia/error al equivocarse
  playError() {
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.setValueAtTime(140, now + 0.1);

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  }
};

/* ==========================================================================
   2. GESTIÓN DE TEMA DINÁMICO (LIGHT & DARK THEME)
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  const themeToggleBtn = document.getElementById('theme-toggle');
  const themeIcon = document.getElementById('theme-icon');
  const themeText = document.getElementById('theme-text');

  // Cargar tema guardado o preferencia del sistema
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    document.documentElement.setAttribute('data-theme', 'dark');
    if (themeIcon) themeIcon.textContent = '☀️';
    if (themeText) themeText.textContent = 'Modo Claro';
  } else {
    document.documentElement.setAttribute('data-theme', 'light');
    if (themeIcon) themeIcon.textContent = '🌙';
    if (themeText) themeText.textContent = 'Modo Oscuro';
  }

  // Evento de cambio de tema
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      SoundEffects.playClick();
      
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);

      if (themeIcon && themeText) {
        if (newTheme === 'dark') {
          themeIcon.textContent = '☀️';
          themeText.textContent = 'Modo Claro';
        } else {
          themeIcon.textContent = '🌙';
          themeText.textContent = 'Modo Oscuro';
        }
      }
    });
  }

  /* ==========================================================================
     3. MANEJO DE FORMULARIO DE ACCESO Y ALERTAS
     ========================================================================== */
  const loginForm = document.getElementById('login-form');
  const alertBox = document.getElementById('alert-message');

  function showAlert(message) {
    if (!alertBox) return;
    alertBox.textContent = message;
    alertBox.style.display = 'block';
    SoundEffects.playError();
  }

  function hideAlert() {
    if (!alertBox) return;
    alertBox.style.display = 'none';
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideAlert();

      const userInput = document.getElementById('username');
      const passwordInput = document.getElementById('password');
      const submitBtn = loginForm.querySelector('.button1');

      const username = userInput ? userInput.value.trim() : '';
      const password = passwordInput ? passwordInput.value.trim() : '';

      if (!username || !password) {
        showAlert('Por favor, completa todos los campos.');
        return;
      }

      try {
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Verificando...';
        }

        // Simulación o petición Fetch a API backend
        /*
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        const data = await response.json();
        */

        // Validación de prueba / Ejemplo
        setTimeout(() => {
          if (username === 'admin' || username === '2025') {
            SoundEffects.playSuccess();
            
            // Redirección tras login exitoso
            setTimeout(() => {
              window.location.href = 'index.html'; // O tu panel de administración
            }, 300);
          } else {
            showAlert('Credenciales incorrectas. Revisa tu usuario y contraseña.');
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.textContent = 'Entrar';
            }
          }
        }, 600);

      } catch (error) {
        showAlert('Error de conexión con el servidor. Intenta de nuevo.');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Entrar';
        }
      }
    });
  }
});
