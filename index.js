document.addEventListener('DOMContentLoaded', () => {
  initVideoPlayer();
  cargarCarruselDinamico();
  initLightbox();
});

/* ==========================================================================
   1. CONTROL DE VIDEO (REPRODUCCIÓN CONTINUA Y AUTOPLAY CUIDADOSO)
   ========================================================================== */
function initVideoPlayer() {
  const video = document.getElementById('introVideo');
  if (video) {
    video.muted = true;
    
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        console.log('Autoplay restringido por el navegador.');
      });
    }

    video.addEventListener('pause', () => {
      if (!video.ended) {
        video.play().catch(() => {});
      }
    });
  }
}

/* ==========================================================================
   2. CARRUSEL HORIZONTAL FLUIDO CON DATOS DESDE RENDER
   ========================================================================== */
async function cargarCarruselDinamico() {
  const API_URL = 'https://laserprint-api.onrender.com/api/productos';
  const track = document.getElementById('carouselTrack');
  if (!track) return;

  try {
    const res = await fetch(API_URL);
    const data = await res.json();
    const productos = data.productos || [];

    // Filtrar solo las imágenes publicadas para mostrar en el carrusel de inicio
    const imagenes = productos.filter(p => p.tipoArchivo === 'imagen');

    if (imagenes.length > 0) {
      track.innerHTML = '';
      imagenes.slice(0, 5).forEach(prod => {
        track.innerHTML += `
          <div class="carousel-slide">
            <img src="${prod.archivoUrl}" alt="${prod.nombre}">
          </div>
        `;
      });
    }
  } catch (err) {
    console.error('Cargando imágenes estáticas de respaldo:', err);
  } finally {
    initCarousel();
  }
}

function initCarousel() {
  const track = document.getElementById('carouselTrack');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const dotsContainer = document.getElementById('carouselDots');

  if (!track) return;

  const slides = Array.from(track.children);
  if (slides.length === 0) return;

  let currentIndex = 0;
  let autoplayTimer = null;

  if (dotsContainer) {
    dotsContainer.innerHTML = '';
    slides.forEach((_, index) => {
      const dot = document.createElement('div');
      dot.classList.add('dot');
      if (index === 0) dot.classList.add('active');
      dot.addEventListener('click', () => {
        moveToSlide(index);
        resetAutoplay();
      });
      dotsContainer.appendChild(dot);
    });
  }

  const dots = dotsContainer ? Array.from(dotsContainer.children) : [];

  function moveToSlide(index) {
    if (index < 0) index = slides.length - 1;
    if (index >= slides.length) index = 0;

    track.style.transform = `translateX(-${index * 100}%)`;
    dots.forEach(dot => dot.classList.remove('active'));
    if (dots[index]) dots[index].classList.add('active');
    
    currentIndex = index;
  }

  function startAutoplay() {
    autoplayTimer = setInterval(() => {
      moveToSlide(currentIndex + 1);
    }, 5000);
  }

  function resetAutoplay() {
    clearInterval(autoplayTimer);
    startAutoplay();
  }

  if (nextBtn) {
    nextBtn.onclick = () => {
      moveToSlide(currentIndex + 1);
      resetAutoplay();
    };
  }

  if (prevBtn) {
    prevBtn.onclick = () => {
      moveToSlide(currentIndex - 1);
      resetAutoplay();
    };
  }

  startAutoplay();
}

/* ==========================================================================
   3. VISOR DE IMÁGENES AMPLIADAS (LIGHTBOX)
   ========================================================================== */
function initLightbox() {
  const modal = document.getElementById('imageModal');
  const modalImg = document.getElementById('imgModalAmpliada');
  const captionText = document.getElementById('captionModal');
  const closeModal = document.getElementById('closeModal');

  if (!modal || !modalImg) return;

  // Event Delegation para soportar imágenes cargadas dinámicamente
  document.body.addEventListener('click', (e) => {
    if (e.target.matches('.carousel-slide img')) {
      const img = e.target;
      modal.style.display = 'flex';
      modalImg.src = img.src;
      captionText.textContent = img.alt || 'LaserPrint - Trabajo Destacado';
      document.body.style.overflow = 'hidden';
    }
  });

  const hideModal = () => {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
  };

  if (closeModal) {
    closeModal.addEventListener('click', hideModal);
  }

  window.addEventListener('click', (e) => {
    if (e.target === modal) hideModal();
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.style.display === 'flex') {
      hideModal();
    }
  });
}
