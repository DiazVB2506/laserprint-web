const API_URL = 'https://laserprint-api.onrender.com/api/productos';
const formatoMXN = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

document.addEventListener('DOMContentLoaded', () => {
  cargarPublicaciones();

  const form = document.querySelector('form') || document.getElementById('uploadForm');
  if (form) {
    form.addEventListener('submit', guardarPublicacion);
  }
});

// 1. Cargar la lista de publicaciones existentes en la tabla
async function cargarPublicaciones() {
  const tablaBody = document.querySelector('tbody');
  if (!tablaBody) return;

  try {
    const res = await fetch(`${API_URL}?limit=100`);
    const data = await res.json();

    tablaBody.innerHTML = '';

    if (!data.productos || data.productos.length === 0) {
      tablaBody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No hay publicaciones activas.</td></tr>`;
      return;
    }

    data.productos.forEach(prod => {
      const precioTexto = (prod.precio !== null && prod.precio !== undefined && prod.precio !== '') 
        ? `${formatoMXN.format(prod.precio)} MXN` 
        : 'N/A';

      const fila = document.createElement('tr');
      fila.innerHTML = `
        <td><b>${prod.nombre}</b></td>
        <td>${prod.categoria}</td>
        <td><b style="color:#2ed573;">${precioTexto}</b></td>
        <td>${prod.tipoArchivo ? prod.tipoArchivo.toUpperCase() : 'N/A'}</td>
        <td>
          <button onclick="eliminarProducto('${prod._id}')" style="background:#ff4757; color:white; border:none; padding:5px 10px; cursor:pointer; border-radius:3px;">Eliminar</button>
        </td>
      `;
      tablaBody.appendChild(fila);
    });
  } catch (error) {
    console.error('Error al cargar publicaciones:', error);
  }
}

// 2. Enviar la nueva publicación a Render
async function guardarPublicacion(e) {
  e.preventDefault();

  const btnSubir = e.target.querySelector('button[type="submit"]');
  const textoOriginal = btnSubir ? btnSubir.innerText : '';
  
  if (btnSubir) {
    btnSubir.disabled = true;
    btnSubir.innerText = 'Subiendo...';
  }

  const formData = new FormData(e.target);

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      body: formData
    });

    const data = await res.json();

    if (res.ok) {
      alert('✅ Publicación guardada exitosamente');
      e.target.reset();
      cargarPublicaciones();
    } else {
      alert('❌ Error: ' + (data.error || 'No se pudo guardar'));
    }
  } catch (error) {
    alert('❌ Error de conexión con el servidor en Render');
    console.error(error);
  } finally {
    if (btnSubir) {
      btnSubir.disabled = false;
      btnSubir.innerText = textoOriginal;
    }
  }
}

// 3. Eliminar publicación (asignada a window para acceso en onclick inline)
window.eliminarProducto = async function(id) {
  if (!confirm('¿Seguro que deseas eliminar esta publicación?')) return;

  try {
    const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    if (res.ok) {
      alert('Publicación eliminada');
      cargarPublicaciones();
    } else {
      alert('Error al eliminar');
    }
  } catch (error) {
    console.error('Error al eliminar:', error);
  }
};