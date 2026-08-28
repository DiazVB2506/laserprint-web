document.addEventListener('DOMContentLoaded', () => {
  initVideoPlayer();
  initCarousel();
  initLightbox();
});

/* ==========================================================================
   1. CONTROL DE VIDEO (REPRODUCCIÓN CONTINUA Y AUTOPLAY CUIDADOSO)
   ========================================================================== */
function initVideoPlayer() {
  const video = document.getElementById('introVideo');
  if (video) {
    video.muted = true;
    
    // Intento de reproducción automática sin forzar bucles infinitos en el hilo
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        console.log('Autoplay restringido por el navegador.');
      });
    }

    // Reanudar suavemente solo si la pausa no fue intencional
    video.addEventListener('pause', () => {
      if (!video.ended) {
        video.play().catch(() => {});
      }
    });
  }
}

/* ==========================================================================
   2. CARRUSEL HORIZONTAL FLUIDO
   ========================================================================== */
function initCarousel() {
  const track = document.getElementById('carouselTrack');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const dotsContainer = document.getElementById('carouselDots');

  if (!track) return;

  const slides = Array.from(track.children);
  let currentIndex = 0;
  let autoplayTimer = null;

  // Limpiar e inicializar puntos indicadores
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
    nextBtn.addEventListener('click', () => {
      moveToSlide(currentIndex + 1);
      resetAutoplay();
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      moveToSlide(currentIndex - 1);
      resetAutoplay();
    });
  }

  // Iniciar la transición automática
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

  // Apertura al hacer clic en cualquier imagen del carrusel
  document.querySelectorAll('.carousel-slide img').forEach(img => {
    img.addEventListener('click', () => {
      modal.style.display = 'flex';
      modalImg.src = img.src;
      captionText.textContent = img.alt || 'LaserPrint - Trabajo Destacado';
      document.body.style.overflow = 'hidden';
    });
  });

  // Funciones de cierre
  const hideModal = () => {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
  };

  if (closeModal) {
    closeModal.addEventListener('click', hideModal);
  }

  window.addEventListener('click', (e) => {
    if (e.target === modal) {
      hideModal();
    }
  });

  // Cierre opcional con la tecla Escape para mayor usabilidad
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.style.display === 'flex') {
      hideModal();
    }
  });
}