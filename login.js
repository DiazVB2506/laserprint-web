document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm') || document.querySelector('form');
  const alertBox = document.getElementById('alertMessage');
  const btnSubmit = document.getElementById('btnLogin') || document.querySelector('button[type="submit"]');

  // ==========================================================================
  // AUDIO SYNTHESIZER RETRO 8-BIT
  // ==========================================================================
  function playRetroSFX(type) {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
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
    } catch (e) {}
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
      void alertBox.offsetWidth;
      alertBox.classList.add('shake');
    } else {
      alert(`[ACCESS DENIED]: ${mensaje}`);
    }
  }

  // Estilos dinámicos para efectos retro
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

  // Procesar inicio de sesión
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (alertBox) alertBox.style.display = 'none';

      const inputs = form.querySelectorAll('input');
      let usuario = '';
      let password = '';

      inputs.forEach(input => {
        if (input.type === 'password') {
          password = input.value.trim();
        } else if (input.type === 'text' || input.type === 'email' || !input.type) {
          usuario = input.value.trim();
        }
      });

      // VALIDACIÓN DE CREDENCIALES DIRECTA (SIN PETICIONES HTTP / POST)
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
        mostrarError('USUARIO O CONTRASEÑA INCORRECTOS');
      }
    });
  }
});
