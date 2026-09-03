/* ==========================================================================
   LASERPRINT ARCADE - ADMIN DASHBOARD ENGINE (PRODUCTION)
   ========================================================================== */

// Validar autenticación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  const isAuth = localStorage.getItem('adminAutenticado') === 'true' || localStorage.getItem('adminToken');
  if (!isAuth) {
    window.location.href = 'login.html';
    return;
  }
  
  cargarPublicaciones();

  // Evento formulario de subida
  const form = document.getElementById('uploadForm');
  if (form) form.addEventListener('submit', guardarPublicacion);

  // Evento formulario de edición
  const editForm = document.getElementById('editForm');
  if (editForm) editForm.addEventListener('submit', guardarEdicion);

  // Cerrar sesión
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      playRetroSFX('click');
      localStorage.removeItem('adminAutenticado');
      localStorage.removeItem('adminToken');
      window.location.href = 'login.html';
    });
  }

  // 1. EVENTOS DE PESTAÑAS DE CATEGORÍA
  const tabButtons = document.querySelectorAll('.tab-btn');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      playRetroSFX('click');
      tabButtons.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      categoriaActiva = e.target.getAttribute('data-cat');
      renderizarTabla();
    });
  });

  // 2. EVENTOS DEL BUSCADOR CON AUTOCOMPLETADO
  const searchInput = document.getElementById('searchInput');
  const suggestionsBox = document.getElementById('searchSuggestions');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      busquedaTexto = e.target.value.trim().toLowerCase();
      renderizarTabla();
      mostrarSugerencias(busquedaTexto);
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-box') && suggestionsBox) {
        suggestionsBox.style.display = 'none';
      }
    });
  }

  // Cerrar Modal de Edición
  const closeModalBtn = document.getElementById('closeModalBtn');
  const btnCancelEdit = document.getElementById('btnCancelEdit');
  if (closeModalBtn) closeModalBtn.addEventListener('click', () => { playRetroSFX('click'); cerrarModal(); });
  if (btnCancelEdit) btnCancelEdit.addEventListener('click', () => { playRetroSFX('click'); cerrarModal(); });
});

// Endpoint backend en Render / Desarrollo local
const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:5000/api/productos'
  : 'https://laserprint-api.onrender.com/api/productos';

const formatoMXN = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

// Estado global
let productosGlobales = [];
let categoriaActiva = 'TODAS';
let busquedaTexto = '';

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
    } else if (type === 'save') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(261.63, now);
      osc.frequency.setValueAtTime(329.63, now + 0.08);
      osc.frequency.setValueAtTime(392.00, now + 0.16);
      osc.frequency.setValueAtTime(523.25, now + 0.24);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === 'delete') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.linearRampToValueAtTime(80, now + 0.2);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    }
  } catch (e) {}
}

/**
 * Carga inicial de datos desde el backend
 */
async function cargarPublicaciones() {
  const tablaBody = document.getElementById('tabla');
  if (!tablaBody) return;

  tablaBody.innerHTML = `
    <tr>
      <td colspan="5" style="text-align:center; padding: 2.5rem; color: #00f3ff; font-size: 0.85rem;">
        👾 CARGANDO DATOS DEL SISTEMA...
      </td>
    </tr>`;

  try {
    const res = await fetch(`${API_URL}?limit=500`);
    if (!res.ok) throw new Error('Error al obtener datos');

    const data = await res.json();
    productosGlobales = Array.isArray(data) ? data : (data.productos || []);
    renderizarTabla();
  } catch (error) {
    console.error('Error al cargar publicaciones:', error);
    tablaBody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center; color: #ff0055; padding: 2rem; font-size: 0.85rem;">
          ❌ ERROR DE CONEXIÓN: SERVER OFFLINE O RUTA NO ENCONTRADA.
        </td>
      </tr>`;
  }
}

/**
 * Renderiza la tabla filtrada por Pestaña Activa y Texto de Búsqueda
 */
function renderizarTabla() {
  const tablaBody = document.getElementById('tabla');
  if (!tablaBody) return;

  const filtrados = productosGlobales.filter(prod => {
    const coincideCategoria = (categoriaActiva === 'TODAS') || (prod.categoria === categoriaActiva);
    const coincideTexto = !busquedaTexto || 
      (prod.nombre && prod.nombre.toLowerCase().includes(busquedaTexto)) ||
      (prod.descripcion && prod.descripcion.toLowerCase().includes(busquedaTexto));

    return coincideCategoria && coincideTexto;
  });

  tablaBody.innerHTML = '';

  if (filtrados.length === 0) {
    tablaBody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center; padding: 2.5rem; color: #ffe600; font-size: 0.85rem;">
          🕹️ NO DATA FOUND // SIN REGISTROS
        </td>
      </tr>`;
    return;
  }

  filtrados.forEach(prod => {
    const precioTexto = (prod.precio !== null && prod.precio !== undefined && prod.precio !== '') 
      ? `${formatoMXN.format(prod.precio)}` 
      : 'N/A';

    const tipoExt = prod.tipoArchivo ? prod.tipoArchivo.toUpperCase() : 'UNKNOWN';
    
    let badgeClass = 'badge-file';
    if (tipoExt.includes('IMAGE') || tipoExt.includes('IMAGEN') || tipoExt.includes('JPG') || tipoExt.includes('PNG')) badgeClass += ' badge-img';
    else if (tipoExt.includes('VIDEO') || tipoExt.includes('MP4')) badgeClass += ' badge-video';
    else if (tipoExt.includes('PDF')) badgeClass += ' badge-pdf';

    const prodId = prod._id || prod.id;

    const fila = document.createElement('tr');
    fila.innerHTML = `
      <td><strong style="color: #ffffff;">${escapeHTML(prod.nombre)}</strong></td>
      <td><span class="badge-cat">${escapeHTML(prod.categoria)}</span></td>
      <td><strong style="color: #00ff66;">${precioTexto}</strong></td>
      <td><span class="${badgeClass}">${tipoExt}</span></td>
      <td>
        <div style="display: flex; gap: 0.6rem;">
          <button onclick="abrirModalEdicion('${prodId}')" class="btn-edit" title="Editar registro">EDIT</button>
          <button onclick="eliminarProducto('${prodId}')" class="btn-del" title="Eliminar registro">DEL</button>
        </div>
      </td>
    `;
    tablaBody.appendChild(fila);
  });
}

/**
 * Sugerencias estilo autocompletado Arcade
 */
function mostrarSugerencias(texto) {
  const suggestionsBox = document.getElementById('searchSuggestions');
  if (!suggestionsBox) return;

  if (!texto) {
    suggestionsBox.style.display = 'none';
    return;
  }

  const coincidencias = productosGlobales.filter(p => p.nombre && p.nombre.toLowerCase().includes(texto)).slice(0, 5);

  if (coincidencias.length === 0) {
    suggestionsBox.style.display = 'none';
    return;
  }

  suggestionsBox.innerHTML = '';
  coincidencias.forEach(item => {
    const li = document.createElement('li');
    li.innerHTML = `<span>> ${escapeHTML(item.nombre)}</span> <small>[${item.categoria}]</small>`;
    li.addEventListener('click', () => {
      playRetroSFX('click');
      document.getElementById('searchInput').value = item.nombre;
      busquedaTexto = item.nombre.toLowerCase();
      suggestionsBox.style.display = 'none';
      renderizarTabla();
    });
    suggestionsBox.appendChild(li);
  });

  suggestionsBox.style.display = 'block';
}

/**
 * Guardar nueva publicación
 */
async function guardarPublicacion(e) {
  e.preventDefault();
  playRetroSFX('click');
  const btnSubir = document.getElementById('btnSubmit');
  const textoOriginal = btnSubir ? btnSubir.innerText : 'GUARDAR';
  
  if (btnSubir) {
    btnSubir.disabled = true;
    btnSubir.innerText = 'UPLOADING...';
  }

  const formData = new FormData(e.target);

  try {
    const res = await fetch(API_URL, { method: 'POST', body: formData });
    const data = await res.json();

    if (res.ok) {
      playRetroSFX('save');
      mostrarNotificacion('DATA SAVED SUCCESSFULLY', 'exito');
      e.target.reset();
      cargarPublicaciones();
    } else {
      mostrarNotificacion('ERROR: ' + (data.error || 'SAVE FAILED'), 'error');
    }
  } catch (error) {
    mostrarNotificacion('SERVER CONNECTION ERROR', 'error');
  } finally {
    if (btnSubir) {
      btnSubir.disabled = false;
      btnSubir.innerText = textoOriginal;
    }
  }
}

/**
 * FUNCIONES DE EDICIÓN
 */
window.abrirModalEdicion = function(id) {
  playRetroSFX('click');
  const prod = productosGlobales.find(p => (p._id === id || p.id === id));
  if (!prod) return;

  // Asignar el ID al campo oculto
  const editIdInput = document.getElementById('editId') || document.getElementById('editProductId');
  if (editIdInput) editIdInput.value = prod._id || prod.id;

  if (document.getElementById('editNombre')) document.getElementById('editNombre').value = prod.nombre || '';
  if (document.getElementById('editDescripcion')) document.getElementById('editDescripcion').value = prod.descripcion || '';
  if (document.getElementById('editPrecio')) document.getElementById('editPrecio').value = (prod.precio !== undefined && prod.precio !== null) ? prod.precio : '';
  if (document.getElementById('editCategoria')) document.getElementById('editCategoria').value = prod.categoria || 'LONA';

  const fileInput = document.getElementById('editArchivo');
  if (fileInput) fileInput.value = '';

  const modal = document.getElementById('editModal');
  if (modal) modal.style.display = 'flex';
};

function cerrarModal() {
  const modal = document.getElementById('editModal');
  if (modal) modal.style.display = 'none';
}

/**
 * Guarda los cambios al editar un producto
 */
async function guardarEdicion(e) {
  e.preventDefault();
  playRetroSFX('click');
  
  const idInput = document.getElementById('editId') || document.getElementById('editProductId');
  const id = idInput ? idInput.value : null;
  const btnSave = document.getElementById('btnSaveEdit');

  if (!id) {
    mostrarNotificacion('ERROR: ID DE PRODUCTO NO ENCONTRADO', 'error');
    return;
  }

  if (btnSave) {
    btnSave.disabled = true;
    btnSave.innerText = 'SAVING...';
  }

  // Creación explícita de FormData para asegurar coincidencia con el Backend
  const formData = new FormData();
  
  const nombreEl = document.getElementById('editNombre');
  const descEl = document.getElementById('editDescripcion');
  const precioEl = document.getElementById('editPrecio');
  const catEl = document.getElementById('editCategoria');
  const fileInput = document.getElementById('editArchivo');

  if (nombreEl) formData.append('nombre', nombreEl.value);
  if (descEl) formData.append('descripcion', descEl.value);
  if (precioEl) formData.append('precio', precioEl.value);
  if (catEl) formData.append('categoria', catEl.value);

  // Adjunta el archivo solo si fue seleccionado por el usuario
  if (fileInput && fileInput.files && fileInput.files.length > 0) {
    formData.append('archivo', fileInput.files[0]);
  }

  try {
    const res = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      body: formData
    });

    const data = await res.json().catch(() => ({}));

    if (res.ok) {
      playRetroSFX('save');
      mostrarNotificacion('RECORD UPDATED', 'exito');
      cerrarModal();
      cargarPublicaciones();
    } else {
      mostrarNotificacion('ERROR: ' + (data.error || data.mensaje || `HTTP ${res.status}`), 'error');
    }
  } catch (error) {
    console.error('Error en guardarEdicion:', error);
    mostrarNotificacion('SERVER CONNECTION ERROR', 'error');
  } finally {
    if (btnSave) {
      btnSave.disabled = false;
      btnSave.innerText = 'GUARDAR CAMBIOS';
    }
  }
}

/**
 * Eliminar publicación
 */
window.eliminarProducto = async function(id) {
  playRetroSFX('click');
  if (!confirm('¿CONFIRMAR ELIMINACIÓN DE REGISTRO?')) return;

  try {
    const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    if (res.ok) {
      playRetroSFX('delete');
      mostrarNotificacion('ITEM DELETED', 'exito');
      cargarPublicaciones();
    } else {
      mostrarNotificacion('ERROR AT DELETE ATTEMPT', 'error');
    }
  } catch (error) {
    mostrarNotificacion('SERVER CONNECTION ERROR', 'error');
  }
};

function escapeHTML(str) {
  return str ? String(str).replace(/[&<>"']/g, match => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[match])) : '';
}

/**
 * Notificaciones estilo HUD / Terminal Arcade
 */
function mostrarNotificacion(mensaje, tipo = 'exito') {
  let toast = document.getElementById('toast-notification');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast-notification';
    document.body.appendChild(toast);
  }

  const isExito = tipo === 'exito';
  const borderColor = isExito ? '#00ff66' : '#ff0055';
  const textColor = isExito ? '#00ff66' : '#ff0055';
  
  toast.style.cssText = `
    position: fixed; bottom: 25px; right: 25px;
    background: #090a14; color: ${textColor};
    border: 3px solid ${borderColor};
    box-shadow: 5px 5px 0px ${borderColor};
    padding: 1rem 1.4rem;
    font-family: monospace;
    font-size: 0.75rem;
    line-height: 1.4;
    z-index: 2000; transition: all 0.2s ease;
    opacity: 0; transform: scale(0.8);
  `;

  toast.innerText = `[SYS_LOG]: ${mensaje}`;

  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'scale(1)';
  });

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'scale(0.8)';
  }, 3500);
}
