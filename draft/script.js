/**
 * KAFIRA PORTFOLIO — script.js
 *
 * Módulos:
 *   1. Starfield canvas (fondo animado — solo estrellas)
 *   2. Navegación: scroll-aware + hamburger menu
 *   3. Animaciones de entrada por scroll (Intersection Observer)
 *   4. Lightbox para galería de astronomía
 */

/* ─────────────────────────────────────────────────────────────────────
   1. STARFIELD — solo estrellas, sin líneas de constelación
────────────────────────────────────────────────────────────────────── */
(function initStarfield() {
  const canvas = document.getElementById('starfield');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let stars = [];
  let t = 0;

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    initStars();
  }

  function initStars() {
    const count = Math.floor((canvas.width * canvas.height) / 8000);

    stars = Array.from({ length: count }, () => ({
      x:         Math.random() * canvas.width,
      y:         Math.random() * canvas.height,
      r:         Math.random() * 1.2 + 0.3,
      baseAlpha: Math.random() * 0.35 + 0.2,
      phase:     Math.random() * Math.PI * 2,
      // Período real: 2π / (0.012 * 60fps * speed)
      // speed 0.5 → ~17s por ciclo | speed 1.5 → ~6s por ciclo
      speed:     Math.random() * 1.0 + 0.5,
    }));
  }

  function draw() {
    t += 0.012;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const s of stars) {
      const twinkle = s.baseAlpha + Math.sin(t * s.speed + s.phase) * 0.07;
      const alpha   = Math.max(0, Math.min(1, twinkle));

      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(232, 233, 240, ${alpha})`;
      ctx.fill();
    }

    requestAnimationFrame(draw);
  }

  let resizeTimer;
  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 150);
  }

  window.addEventListener('resize', onResize);
  resize();
  draw();
})();


/* ─────────────────────────────────────────────────────────────────────
   2. NAVEGACIÓN
────────────────────────────────────────────────────────────────────── */
(function initNav() {
  const nav       = document.getElementById('nav');
  const toggle    = document.getElementById('nav-toggle');
  const menu      = document.getElementById('nav-menu');
  const navLinks  = menu ? menu.querySelectorAll('a') : [];

  // Clase "scrolled" para cambiar fondo del nav al hacer scroll
  function handleScroll() {
    if (!nav) return;
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll(); // estado inicial

  // Hamburger menu (mobile)
  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      const isOpen = menu.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(isOpen));
      toggle.setAttribute('aria-label', isOpen ? 'Cerrar menú' : 'Abrir menú');
    });

    // Cierra el menú al hacer clic en un enlace
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        menu.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Abrir menú');
      });
    });

    // Cierra con Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menu.classList.contains('open')) {
        menu.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
      }
    });
  }
})();


/* ─────────────────────────────────────────────────────────────────────
   3. ANIMACIONES DE ENTRADA (Intersection Observer)
────────────────────────────────────────────────────────────────────── */
(function initAnimations() {
  // Hero: se activa con un pequeño delay para que la transición sea visible
  const heroContent = document.querySelector('.hero-content');
  if (heroContent) {
    setTimeout(() => heroContent.classList.add('visible'), 100);
  }

  // El resto de elementos animados se activan al entrar al viewport.
  // Excluimos .hero-content porque ya tiene su propio trigger arriba.
  const animatedEls = document.querySelectorAll('[data-animate]:not(.hero-content)');
  if (!animatedEls.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const el    = entry.target;
        // Stagger: si el elemento tiene un índice entre sus hermanos, añade delay
        const index = Number(el.dataset.animateIndex ?? 0);
        el.style.transitionDelay = `${index * 80}ms`;

        el.classList.add('visible');
        observer.unobserve(el); // animación única — no se repite
      });
    },
    // threshold bajo para disparar pronto; rootMargin pequeño para que no
    // aparezcan antes de que el usuario llegue a la sección
    { threshold: 0.08, rootMargin: '0px 0px -20px 0px' }
  );

  animatedEls.forEach((el, i) => {
    // Guardamos el índice como data attribute para el stagger
    el.dataset.animateIndex = i % 6; // reseteamos cada 6 para no acumular demasiado delay
    observer.observe(el);
  });
})();


/* ─────────────────────────────────────────────────────────────────────
   4. LIGHTBOX PARA GALERÍA DE ASTRONOMÍA
   (Listo para cuando se agreguen fotos reales)
────────────────────────────────────────────────────────────────────── */
(function initLightbox() {
  const gallery = document.getElementById('astro-gallery');
  if (!gallery) return;

  // Overlay del lightbox
  const overlay = document.createElement('div');
  overlay.id = 'lb-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Imagen ampliada');
  overlay.style.cssText = `
    display:none; position:fixed; inset:0; z-index:999;
    background:rgba(11,14,26,0.93); align-items:center;
    justify-content:center; backdrop-filter:blur(4px);
  `;

  const img = document.createElement('img');
  img.id = 'lb-img';
  img.alt = '';
  img.style.cssText = 'max-width:90vw; max-height:88vh; border-radius:4px; object-fit:contain;';

  const closeBtn = document.createElement('button');
  closeBtn.textContent = '✕';
  closeBtn.setAttribute('aria-label', 'Cerrar imagen');
  closeBtn.style.cssText = `
    position:absolute; top:20px; right:24px; background:none;
    border:none; color:#E8E9F0; font-size:1.4rem; cursor:pointer;
    font-family:'JetBrains Mono',monospace;
  `;

  overlay.appendChild(img);
  overlay.appendChild(closeBtn);
  document.body.appendChild(overlay);

  /** Abre el lightbox con la imagen del thumbnail clicado */
  function openLightbox(thumb) {
    const src = thumb.dataset.src;
    const alt = thumb.querySelector('img')?.alt || '';
    if (!src) return;

    img.src  = src;
    img.alt  = alt;
    overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
  }

  function closeLightbox() {
    overlay.style.display = 'none';
    document.body.style.overflow = '';
    img.src = '';
  }

  // Delegación de eventos en la galería
  gallery.addEventListener('click', (e) => {
    const thumb = e.target.closest('.lb-thumb');
    if (thumb) openLightbox(thumb);
  });

  gallery.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      const thumb = e.target.closest('.lb-thumb');
      if (thumb) { e.preventDefault(); openLightbox(thumb); }
    }
  });

  closeBtn.addEventListener('click', closeLightbox);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeLightbox();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.style.display === 'flex') closeLightbox();
  });
})();
