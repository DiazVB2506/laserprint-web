document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm') || document.querySelector('form');
  const alertBox = document.getElementById('alertMessage');
  const btnSubmit = document.getElementById('btnLogin') || document.querySelector('button[type="submit"]');

  // URL de producción conectada a Render (en lugar de la ruta relativa de GitHub Pages)
  const API_URL = 'https://laserprint-api.onrender.com/api/login';

  // ==========================================================================
  // AUDIO SYNTHESIZER RETRO 8-BIT (EFECTOS DE SONIDO SIN ARCHIVOS EXTERNOS)
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
        osc.frequency.setValueAtTime(330, now); // E4
        osc.frequency.setValueAtTime(440, now + 0.08); // A4
        osc.frequency.setValueAtTime(554.37, now + 0.16); // C#5
        osc.frequency.setValueAtTime(659.25, now + 0.24); // E5
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
      // Silenciar si la política del navegador bloquea la reproducción de audio dinámico
    }
  }

  // Reproducir efecto al interactuar con el botón
  if (btnSubmit) {
    btnSubmit.addEventListener('mousedown', () => playRetroSFX('click'));
  }

  // Función para mostrar mensajes de error estilo Terminal / Cyberpunk
  function mostrarError(mensaje) {
    playRetroSFX('denied');
    if (alertBox) {
      alertBox.textContent = `[SYSTEM ERROR]: ${mensaje.toUpperCase()}`;
      alertBox.style.display = 'block';
      alertBox.classList.remove('shake');
      // Forzar reflow visual para reiniciar la animación CRT Shake
      void alertBox.offsetWidth;
      alertBox.classList.add('shake');
    } else {
      alert(`[ACCESS DENIED]: ${mensaje}`);
    }
  }

  // Animación de carga interactiva en el botón Arcade
  function setEstadoCargando(cargando) {
    if (!btnSubmit) return;

    if (cargando) {
      btnSubmit.disabled = true;
      btnSubmit.dataset.textoOriginal = btnSubmit.textContent;
      btnSubmit.innerHTML = `
        <span style="display: inline-flex; align-items: center; justify-content: center; gap: 8px;">
          <span class="retro-spinner">⏳</span> AUTHENTICATING...
        </span>
      `;
    } else {
      btnSubmit.disabled = false;
      btnSubmit.textContent = btnSubmit.dataset.textoOriginal || 'Entrar';
    }
  }

  // Estilos dinámicos para efectos retro de la interfaz
  if (!document.getElementById('spinner-style')) {
    const style = document.createElement('style');
    style.id = 'spinner-style';
    style.innerHTML = `
      .retro-spinner {
        display: inline-block;
        animation: pixelPulse 0.4s infinite alternate;
      }
      @keyframes pixelPulse {
        0% { transform: scale(1); opacity: 1; }
        100% { transform: scale(1.3); opacity: 0.4; }
      }
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

  // Función para conceder el acceso
  function otogarAcceso() {
    localStorage.setItem('adminAutenticado', 'true');
    playRetroSFX('granted');

    if (btnSubmit) {
      btnSubmit.style.background = 'var(--arcade-green, #00ff66)';
      btnSubmit.style.color = '#000000';
      btnSubmit.style.boxShadow = '6px 6px 0px var(--arcade-cyan, #00f0ff)';
      btnSubmit.innerHTML = '★ ACCESS GRANTED ★';
    }

    setTimeout(() => {
      window.location.href = 'admin.html';
    }, 600);
  }

  // Procesar el envío del formulario
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (alertBox) alertBox.style.display = 'none';

      const usuarioInput = document.getElementById('usuario') || document.querySelector('input[type="text"]');
      const passwordInput = document.getElementById('password') || document.querySelector('input[type="password"]');

      const usuario = usuarioInput ? usuarioInput.value.trim() : '';
      const password = passwordInput ? passwordInput.value.trim() : '';

      if (!usuario || !password) {
        mostrarError('INGRESA USUARIO Y CONTRASEÑA');
        return;
      }

      setEstadoCargando(true);

      try {
        // Intento de conexión al servidor API de Render
        const res = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ usuario, password, username: usuario })
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success || data.token) {
            otogarAcceso();
            return;
          } else {
            setEstadoCargando(false);
            mostrarError(data.message || 'INVALID CREDENTIALS');
            return;
          }
        }
      } catch (err) {
        console.warn('⚡ API fuera de línea o iniciando en Render. Ejecutando respaldo local...');
      }

      // RESPALDO LOCAL (Si el servidor Render está dormido/offline)
      if (usuario === '2025' && password === '2025') {
        otogarAcceso();
      } else {
        setEstadoCargando(false);
        mostrarError('INVALID CREDENTIALS');
      }
    });
  }
});
