document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  cargarCarruselDinamico();
  initLightbox();
});

/* ==========================================================================
   1. CONTROL DEL MENÚ MÓVIL
   ========================================================================== */
function initMobileMenu() {
  const menuBtn = document.getElementById('mobileMenuBtn');
  const navLinks = document.getElementById('navLinks');

  if (!menuBtn || !navLinks) return;

  menuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    navLinks.classList.toggle('active');
    menuBtn.classList.toggle('open');
  });

  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('active');
      menuBtn.classList.remove('open');
    });
  });

  document.addEventListener('click', (e) => {
    if (!navLinks.contains(e.target) && !menuBtn.contains(e.target)) {
      navLinks.classList.remove('active');
      menuBtn.classList.remove('open');
    }
  });
}

/* ==========================================================================
   2. CARRUSEL CON EFECTO Y PERSPECTIVA 3D
   ========================================================================== */
function cargarCarruselDinamico() {
  const track = document.getElementById('carouselTrack');
  if (!track) return;

  const BASE_URL = 'uploads/fotos/';

  const imagenesFotos = [
    { url: `${BASE_URL}slide1.jpg`, alt: 'LaserPrint - Trabajo Destacado 1' },
    { url: `${BASE_URL}slide2.jpg`, alt: 'LaserPrint - Trabajo Destacado 2' },
    { url: `${BASE_URL}slide3.jpg`, alt: 'LaserPrint - Trabajo Destacado 3' },
    { url: `${BASE_URL}slide4.jpg`, alt: 'LaserPrint - Trabajo Destacado 4' },
    { url: `${BASE_URL}slide5.jpg`, alt: 'LaserPrint - Trabajo Destacado 5' }
  ];

  track.innerHTML = imagenesFotos.map((item, index) => `
    <div class="carousel-slide-3d" data-index="${index}">
      <img src="${item.url}" 
           alt="${item.alt}" 
           loading="lazy"
           onerror="this.onerror=null; this.src='https://via.placeholder.com/800x450/111/d4af37?text=LaserPrint+${index + 1}'">
    </div>
  `).join('');

  initCarousel3D();
}

function initCarousel3D() {
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

  function update3DSlides() {
    slides.forEach((slide, index) => {
      slide.className = 'carousel-slide-3d';
      
      const offset = index - currentIndex;
      
      if (offset === 0) {
        slide.classList.add('active');
      } else if (offset === 1 || (offset === -(slides.length - 1))) {
        slide.classList.add('next');
      } else if (offset === -1 || (offset === slides.length - 1)) {
        slide.classList.add('prev');
      } else {
        slide.classList.add('hidden');
      }
    });

    dots.forEach((dot, index) => {
      dot.classList.toggle('active', index === currentIndex);
    });
  }

  function moveToSlide(index) {
    if (index < 0) index = slides.length - 1;
    if (index >= slides.length) index = 0;

    currentIndex = index;
    update3DSlides();
  }

  function startAutoplay() {
    autoplayTimer = setInterval(() => {
      moveToSlide(currentIndex + 1);
    }, 4000);
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

  let touchStartX = 0;
  let touchEndX = 0;

  track.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  track.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    if (touchStartX - touchEndX > 40) {
      moveToSlide(currentIndex + 1);
      resetAutoplay();
    } else if (touchEndX - touchStartX > 40) {
      moveToSlide(currentIndex - 1);
      resetAutoplay();
    }
  }, { passive: true });

  update3DSlides();
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

  document.body.addEventListener('click', (e) => {
    if (e.target.matches('.carousel-slide-3d img')) {
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
