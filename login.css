/* ==========================================================================
   1. SYSTEM RESET & PALETAS DINÁMICAS EDITORIAL (LIGHT & DARK THEME)
   ========================================================================== */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,400&display=swap');

*,
*::before,
*::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* TEMA CLARO (Default) */
:root,
[data-theme="light"] {
  --bg-body: #FFFFFF;
  --bg-surface: #F9F8F6;
  --bg-card: #FFFFFF;
  --bg-input: #FFFFFF;

  --text-primary: #111111;
  --text-secondary: #555555;
  --text-muted: #888888;

  --accent-color: #0F4C81;
  --accent-hover: #0A355C;
  --accent-soft: rgba(15, 76, 129, 0.06);

  --border-color: #EAEAEA;
  --border-focus: #0F4C81;
  --shadow-soft: 0 10px 30px rgba(0, 0, 0, 0.04);
  --shadow-hover: 0 18px 40px rgba(0, 0, 0, 0.08);

  --font-heading: 'Playfair Display', Georgia, serif;
  --font-body: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;

  --transition-smooth: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

/* TEMA OSCURO */
[data-theme="dark"] {
  --bg-body: #0D0F12;
  --bg-surface: #16191E;
  --bg-card: #1A1D24;
  --bg-input: #12141A;

  --text-primary: #F0F2F5;
  --text-secondary: #A0A5B1;
  --text-muted: #6C727F;

  --accent-color: #38BDF8;
  --accent-hover: #0284C7;
  --accent-soft: rgba(56, 189, 248, 0.1);

  --border-color: #262B35;
  --border-focus: #38BDF8;
  --shadow-soft: 0 10px 30px rgba(0, 0, 0, 0.4);
  --shadow-hover: 0 18px 40px rgba(0, 0, 0, 0.6);
}

/* ==========================================================================
   2. ESTRUCTURA Y LAYOUT CENTRADO
   ========================================================================== */
html, body {
  width: 100%;
  min-height: 100vh;
  min-height: 100dvh;
  background-color: var(--bg-body);
  transition: background-color 0.4s ease, color 0.4s ease;
}

body {
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: 1.05rem;
  line-height: 1.6;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: clamp(1.5rem, 4vw, 3rem);
  position: relative;
  -webkit-font-smoothing: antialiased;
}

/* Ocultar resplandores neón arcade antiguos */
.bg-glow {
  display: none;
}

/* ==========================================================================
   3. BOTÓN CONMUTADOR DE TEMA
   ========================================================================== */
.theme-toggle-btn {
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 1000;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  padding: 10px 18px;
  border-radius: 30px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-family: var(--font-body);
  font-size: 0.88rem;
  font-weight: 500;
  box-shadow: var(--shadow-soft);
  transition: var(--transition-smooth);
}

.theme-toggle-btn:hover {
  background: var(--accent-soft);
  border-color: var(--accent-color);
  color: var(--accent-color);
  transform: translateY(-2px);
  box-shadow: var(--shadow-hover);
}

/* ==========================================================================
   4. CONTENEDOR PRINCIPAL SPLIT EDITORIAL
   ========================================================================== */
.login-split-container {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 1000px;
  gap: clamp(2rem, 5vw, 4.5rem);
  margin: auto;
}

/* ==========================================================================
   5. SECCIÓN LOGO Y SELLO EDITORIAL
   ========================================================================== */
.brand-side {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.logo-hero-link {
  display: inline-block;
  text-decoration: none;
  margin-bottom: 1.2rem;
  transition: var(--transition-smooth);
}

.logo-hero-link:hover {
  opacity: 0.85;
}

.hero-logo-img {
  width: 100%;
  max-width: clamp(160px, 28vw, 240px);
  height: auto;
  object-fit: contain;
}

.brand-title-outside {
  font-family: var(--font-heading);
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 600;
  letter-spacing: -0.5px;
  color: var(--text-primary);
  margin-bottom: 0.6rem;
  text-shadow: none;
}

.brand-quote-outside {
  font-family: var(--font-heading);
  font-style: italic;
  font-size: clamp(1.05rem, 2vw, 1.25rem);
  color: var(--text-secondary);
  max-width: 440px;
  line-height: 1.5;
  font-weight: 400;
}

/* ==========================================================================
   6. TARJETA EDITORIAL DE ACCESO
   ========================================================================== */
.form-side {
  width: 100%;
  max-width: 440px;
}

.card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  box-shadow: var(--shadow-soft);
  padding: clamp(2rem, 4vw, 2.8rem);
  transition: var(--transition-smooth);
}

.card:hover {
  box-shadow: var(--shadow-hover);
  border-color: var(--border-focus);
}

.card2 {
  background: transparent;
  padding: 0;
  border: none;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

#heading {
  text-align: center;
  font-family: var(--font-heading);
  font-size: clamp(1.4rem, 2.5vw, 1.8rem);
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
  letter-spacing: -0.3px;
  text-shadow: none;
}

/* ==========================================================================
   7. MENSAJES DE ALERTA
   ========================================================================== */
.alert-message {
  display: none;
  padding: 12px 16px;
  border-radius: 8px;
  font-family: var(--font-body);
  font-size: 0.88rem;
  font-weight: 500;
  line-height: 1.4;
  text-align: center;
  background-color: rgba(239, 68, 68, 0.08);
  color: #EF4444;
  border: 1px solid rgba(239, 68, 68, 0.2);
  box-shadow: none;
}

/* ==========================================================================
   8. CAMPOS DE ENTRADA Y FORMULARIO
   ========================================================================== */
.field {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background-color: var(--bg-input);
  box-shadow: none;
  transition: var(--transition-smooth);
}

.field:focus-within {
  border-color: var(--accent-color);
  box-shadow: 0 0 0 3px var(--accent-soft);
}

.input-icon {
  width: 20px;
  height: 20px;
  fill: var(--text-muted);
  transition: var(--transition-smooth);
  flex-shrink: 0;
}

.field:focus-within .input-icon {
  fill: var(--accent-color);
}

.input-field {
  background: transparent;
  border: none;
  outline: none;
  width: 100%;
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: 0.98rem;
  font-weight: 400;
}

.input-field::placeholder {
  color: var(--text-muted);
  font-family: var(--font-body);
}

/* ==========================================================================
   9. BOTONES EDITORIALES DE ACCESO Y RETORNO
   ========================================================================== */
.form .btn {
  display: flex;
  justify-content: center;
  margin-top: 0.5rem;
}

.button1 {
  width: 100%;
  padding: 14px 20px;
  background: var(--accent-color);
  color: #FFFFFF !important;
  border: none;
  font-family: var(--font-body);
  font-weight: 600;
  font-size: 0.95rem;
  letter-spacing: 0.3px;
  border-radius: 8px;
  cursor: pointer;
  box-shadow: var(--shadow-soft);
  transition: var(--transition-smooth);
}

[data-theme="dark"] .button1 {
  color: #0D0F12 !important;
}

.button1:hover {
  background: var(--accent-hover);
  box-shadow: 0 6px 20px rgba(15, 76, 129, 0.25);
  transform: translateY(-2px);
}

.button1:active {
  transform: translateY(0);
  box-shadow: none;
}

.button-back {
  display: block;
  text-align: center;
  margin-top: 0.4rem;
  padding: 10px;
  color: var(--text-secondary);
  font-family: var(--font-body);
  font-size: 0.88rem;
  font-weight: 500;
  text-decoration: none;
  border-radius: 8px;
  border: 1px solid transparent;
  transition: var(--transition-smooth);
}

.button-back:hover {
  color: var(--text-primary);
  background: var(--bg-surface);
  border-color: var(--border-color);
}

/* ==========================================================================
   10. RESPONSIVE DESIGN (DESKTOP SPLIT)
   ========================================================================== */
@media (min-width: 850px) {
  .login-split-container {
    flex-direction: row;
    align-items: center;
  }

  .brand-side {
    flex: 1;
    align-items: flex-start;
    text-align: left;
  }

  .form-side {
    flex: 1;
  }
}

@media (max-width: 849px) {
  .brand-side {
    align-items: center;
    text-align: center;
  }
}
