const API_URL = 'https://laserprint-api.onrender.com/api/productos';
const formatoMXN = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

document.addEventListener('DOMContentLoaded', () => {
  // Detecta en qué categoría está según el atributo data-categoria del <body>
  const categoriaActual = document.body.dataset.categoria;
  
  if (categoriaActual) {
    cargarProductosPorCategoria(categoriaActual);
  }
});

async function cargarProductosPorCategoria(categoria) {
  // Busca el contenedor dinámico por los diferentes IDs o clases usados en el proyecto
  const contenedor = document.getElementById('gridProductos') || 
                     document.getElementById('contenedorProductos') || 
                     document.querySelector('.grid-productos') || 
                     document.querySelector('.grid');
                     
  if (!contenedor) return;

  contenedor.innerHTML = '<p style="text-align:center; grid-column: 1/-1;">Cargando productos...</p>';

  try {
    const res = await fetch(`${API_URL}?categoria=${encodeURIComponent(categoria)}`);
    const data = await res.json();

    contenedor.innerHTML = '';

    if (!data.productos || data.productos.length === 0) {
      contenedor.innerHTML = '<p style="text-align:center; grid-column: 1/-1;">No hay publicaciones en esta categoría aún.</p>';
      return;
    }

    data.productos.forEach(prod => {
      const card = document.createElement('div');
      card.className = 'card producto-card';

      // Renderiza según el tipo de archivo (imagen, video o pdf)
      let recursoHTML = '';
      if (prod.tipoArchivo === 'video') {
        recursoHTML = `<video controls src="${prod.archivoUrl}" style="width:100%; height:200px; object-fit:cover; border-radius:6px;"></video>`;
      } else if (prod.tipoArchivo === 'pdf') {
        recursoHTML = `<a href="${prod.archivoUrl}" target="_blank" class="pdf-link btn-pdf">📄 Ver Documento PDF</a>`;
      } else {
        recursoHTML = `<img src="${prod.archivoUrl}" alt="${prod.nombre}" style="width:100%; height:200px; object-fit:cover; border-radius:6px;">`;
      }

      // Validar y formatear el precio en MXN
      const precioHTML = (prod.precio !== null && prod.precio !== undefined && prod.precio !== '') 
        ? `<p class="price precio" style="color:#2ed573; font-weight:bold; font-size:1.2em; margin-top:10px;">${formatoMXN.format(prod.precio)} MXN</p>` 
        : '';

      card.innerHTML = `
        ${recursoHTML}
        <h3 style="margin-top:10px;">${prod.nombre}</h3>
        <p style="color:#666; margin-top:5px;">${prod.descripcion}</p>
        ${precioHTML}
      `;

      contenedor.appendChild(card);
    });

  } catch (error) {
    console.error('Error al cargar la categoría:', error);
    contenedor.innerHTML = '<p style="text-align:center; color:#ff4757; grid-column: 1/-1;">Error al cargar las publicaciones de esta sección.</p>';
  }
}