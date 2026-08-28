document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  initVideoPlayer();
  cargarCarruselDinamico();
  initLightbox();
});

/* ==========================================================================
   1. CONTROL DEL MENÚ MÓVIL (HAMBURGUESA)
   ========================================================================== */
function initMobileMenu() {
  const menuBtn = document.getElementById('mobileMenuBtn');
  const navLinks = document.getElementById('navLinks');

  if (!menuBtn || !navLinks) return;

  // Toggle para abrir/cerrar menú y animar el icono hamburguesa
  menuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    navLinks.classList.toggle('active');
    menuBtn.classList.toggle('open');
  });

  // Cerrar el menú al hacer clic en cualquier enlace
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('active');
      menuBtn.classList.remove('open');
    });
  });

  // Cerrar el menú al hacer clic fuera
  document.addEventListener('click', (e) => {
    if (!navLinks.contains(e.target) && !menuBtn.contains(e.target)) {
      navLinks.classList.remove('active');
      menuBtn.classList.remove('open');
    }
  });
}

/* ==========================================================================
   2. CONTROL DE VIDEO (AUTOPLAY CONTINUO)
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
   3. CARRUSEL HORIZONTAL FLUIDO (5 IMÁGENES FIJAS DE LA CARPETA FOTOS)
   ========================================================================== */
function cargarCarruselDinamico() {
  const track = document.getElementById('carouselTrack');
  if (!track) return;

  // Ruta base hacia tu servidor Render
  const BASE_URL = 'https://laserprint-api.onrender.com/uploads/fotos/';

  // Definición de las 5 imágenes fijas almacenadas en tu servidor
  const imagenesFotos = [
    { url: `${BASE_URL}slide1.jpg`, alt: 'LaserPrint - Trabajo Destacado 1' },
    { url: `${BASE_URL}slide2.jpg`, alt: 'LaserPrint - Trabajo Destacado 2' },
    { url: `${BASE_URL}slide3.jpg`, alt: 'LaserPrint - Trabajo Destacado 3' },
    { url: `${BASE_URL}slide4.jpg`, alt: 'LaserPrint - Trabajo Destacado 4' },
    { url: `${BASE_URL}slide5.jpg`, alt: 'LaserPrint - Trabajo Destacado 5' }
  ];

  // Inyección del HTML de las 5 imágenes en el carrusel
  track.innerHTML = imagenesFotos.map((item, index) => `
    <div class="carousel-slide">
      <img src="${item.url}" 
           alt="${item.alt}" 
           onerror="this.onerror=null; this.src='https://via.placeholder.com/800x450/111/d4af37?text=LaserPrint+${index + 1}'">
    </div>
  `).join('');

  // Inicialización de la lógica interactiva
  initCarousel();
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

  // Generación de indicadores (puntos) para las 5 diapositivas
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

  // Soporte para gestos de deslizar en celulares (Touch Swipe)
  let touchStartX = 0;
  let touchEndX = 0;

  track.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  track.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
  }, { passive: true });

  function handleSwipe() {
    const swipeThreshold = 40;
    if (touchStartX - touchEndX > swipeThreshold) {
      moveToSlide(currentIndex + 1);
      resetAutoplay();
    } else if (touchEndX - touchStartX > swipeThreshold) {
      moveToSlide(currentIndex - 1);
      resetAutoplay();
    }
  }

  startAutoplay();
}

/* ==========================================================================
   4. VISOR DE IMÁGENES AMPLIADAS (LIGHTBOX)
   ========================================================================== */
function initLightbox() {
  const modal = document.getElementById('imageModal');
  const modalImg = document.getElementById('imgModalAmpliada');
  const captionText = document.getElementById('captionModal');
  const closeModal = document.getElementById('closeModal');

  if (!modal || !modalImg) return;

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
