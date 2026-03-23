// ========================================
// LOADER
// ========================================
const loaderBar = document.getElementById('loaderBar');
const loader = document.getElementById('loader');
let progress = 0;
const loadInterval = setInterval(() => {
  progress += Math.random() * 30 + 20;
  if (progress >= 100) {
    progress = 100;
    clearInterval(loadInterval);
    gsap.to(loader, {
      yPercent: -100,
      duration: 0.6,
      ease: 'power4.inOut',
      onComplete: () => {
        loader.style.display = 'none';
        initAnimations();
      }
    });
  }
  loaderBar.style.width = progress + '%';
}, 50);

// ========================================
// CUSTOM CURSOR (desktop only)
// ========================================
const cursorMain = document.getElementById('cursorMain');
const cursorTrail = document.getElementById('cursorTrail');

if (cursorMain && cursorTrail && !('ontouchstart' in window) && window.innerWidth > 768) {
  let mouseX = 0, mouseY = 0;
  let trailX = 0, trailY = 0;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  function updateCursor() {
    cursorMain.style.left = mouseX + 'px';
    cursorMain.style.top = mouseY + 'px';

    trailX += (mouseX - trailX) * 0.15;
    trailY += (mouseY - trailY) * 0.15;
    cursorTrail.style.left = trailX + 'px';
    cursorTrail.style.top = trailY + 'px';

    requestAnimationFrame(updateCursor);
  }
  updateCursor();

  document.querySelectorAll('a, button, .card-hover, .mag-btn').forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursorMain.classList.add('hovering');
      cursorTrail.classList.add('hovering');
    });
    el.addEventListener('mouseleave', () => {
      cursorMain.classList.remove('hovering');
      cursorTrail.classList.remove('hovering');
    });
  });
} else {
  if (cursorMain) cursorMain.style.display = 'none';
  if (cursorTrail) cursorTrail.style.display = 'none';
}

// ========================================
// MAGNETIC BUTTONS
// ========================================
document.querySelectorAll('.mag-btn').forEach(btn => {
  btn.addEventListener('mousemove', (e) => {
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    gsap.to(btn, { x: x * 0.3, y: y * 0.3, duration: 0.4, ease: 'power2.out' });
  });
  btn.addEventListener('mouseleave', () => {
    gsap.to(btn, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.5)' });
  });
});

// ========================================
// GSAP ANIMATIONS
// ========================================
gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

function initAnimations() {
  // Hero title reveal — lines slide up
  gsap.to('.hero-title .line-inner', {
    y: 0,
    duration: 1.2,
    ease: 'power4.out',
    stagger: 0.12,
    delay: 0.2
  });

  // Hero description & CTAs fade in
  gsap.to('#heroDesc', { opacity: 1, y: 0, duration: 1, delay: 0.8, ease: 'power3.out' });
  gsap.to('#heroTags', { opacity: 1, y: 0, duration: 1, delay: 0.95, ease: 'power3.out' });
  gsap.to('#heroCTAs', { opacity: 1, y: 0, duration: 1, delay: 1.1, ease: 'power3.out' });
  gsap.to('.hero-stat', { opacity: 1, y: 0, duration: 0.8, stagger: 0.12, delay: 1.2, ease: 'power3.out' });

  // Hero photo fade in + float up
  gsap.to('.hero-photo', { opacity: 1, y: 0, duration: 1.2, delay: 0.5, ease: 'power3.out' });

  // Stats counter animation
  document.querySelectorAll('[data-target]').forEach(el => {
    const target = parseInt(el.dataset.target);
    const suffix = el.dataset.suffix || '';
    gsap.to({ val: 0 }, {
      val: target,
      duration: 2,
      delay: 1.4,
      ease: 'power2.out',
      onUpdate: function() {
        el.textContent = Math.round(this.targets()[0].val) + suffix;
      }
    });
  });

  // Staggered columns scroll animation
  document.querySelectorAll('section').forEach(section => {
    const cols = section.querySelectorAll('.stagger-col');
    cols.forEach((col, i) => {
      const staggerDelay = parseInt(col.dataset.stagger || 0) * 0.15;
      gsap.from(col, {
        y: 80 + (i * 20),
        opacity: 0,
        duration: 1.2,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: col,
          start: 'top 85%',
          end: 'bottom 20%',
          toggleActions: 'play none none reverse'
        },
        delay: staggerDelay
      });
    });
  });

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        gsap.to(window, { scrollTo: { y: target, offsetY: 80 }, duration: 1.2, ease: 'power3.inOut' });
      }
    });
  });
}

// ========================================
// CARD HOVER (SPRING PHYSICS)
// ========================================
document.querySelectorAll('.card-hover').forEach(card => {
  card.addEventListener('mouseenter', () => {
    gsap.to(card, { scale: 1.02, duration: 0.6, ease: 'elastic.out(1, 0.5)' });
  });
  card.addEventListener('mouseleave', () => {
    gsap.to(card, { scale: 1, duration: 0.8, ease: 'elastic.out(1, 0.4)' });
  });
});
