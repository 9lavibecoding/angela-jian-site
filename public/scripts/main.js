// ========================================
// LOADER
// ========================================
const loaderBar = document.getElementById('loaderBar');
const loader = document.getElementById('loader');
let progress = 0;
const loadInterval = setInterval(() => {
  progress += Math.random() * 15 + 5;
  if (progress >= 100) {
    progress = 100;
    clearInterval(loadInterval);
    setTimeout(() => {
      gsap.to(loader, {
        yPercent: -100,
        duration: 1,
        ease: 'power4.inOut',
        onComplete: () => {
          loader.style.display = 'none';
          initAnimations();
        }
      });
    }, 300);
  }
  loaderBar.style.width = progress + '%';
}, 80);

// ========================================
// CUSTOM CURSOR
// ========================================
const cursorMain = document.getElementById('cursorMain');
const cursorTrail = document.getElementById('cursorTrail');
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

// Hover effects
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

// Hide cursor on mobile
if ('ontouchstart' in window) {
  cursorMain.style.display = 'none';
  cursorTrail.style.display = 'none';
  document.body.style.cursor = 'auto';
  document.querySelectorAll('*').forEach(el => el.style.cursor = 'auto');
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
// THREE.JS BACKGROUND WITH SHADERS
// ========================================
const canvas = document.getElementById('webgl-bg');
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.z = 3;

// Particle System with Physics-like behavior
const particleCount = 2000;
const geometry = new THREE.BufferGeometry();
const positions = new Float32Array(particleCount * 3);
const velocities = new Float32Array(particleCount * 3);
const sizes = new Float32Array(particleCount);

for (let i = 0; i < particleCount; i++) {
  positions[i * 3] = (Math.random() - 0.5) * 10;
  positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
  positions[i * 3 + 2] = (Math.random() - 0.5) * 6;
  velocities[i * 3] = (Math.random() - 0.5) * 0.002;
  velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.002;
  velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.001;
  sizes[i] = Math.random() * 3 + 0.5;
}
geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

const vertexShader = `
  attribute float size;
  varying float vAlpha;
  uniform float uTime;
  uniform float uMouse;

  void main() {
    vec3 pos = position;
    pos.x += sin(uTime * 0.3 + position.y * 0.5) * 0.1;
    pos.y += cos(uTime * 0.2 + position.x * 0.3) * 0.1;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = size * (200.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;

    vAlpha = smoothstep(0.0, 2.0, -mvPosition.z) * 0.6;
  }
`;

const fragmentShader = `
  varying float vAlpha;
  uniform float uTime;

  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;

    float alpha = smoothstep(0.5, 0.0, dist) * vAlpha;
    vec3 color = mix(vec3(0.886, 0.784, 0.494), vec3(0.831, 0.627, 0.337), sin(uTime * 0.5) * 0.5 + 0.5);

    gl_FragColor = vec4(color, alpha * 0.15);
  }
`;

const shaderMaterial = new THREE.ShaderMaterial({
  vertexShader,
  fragmentShader,
  uniforms: {
    uTime: { value: 0 },
    uMouse: { value: 0 }
  },
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending
});

const particles = new THREE.Points(geometry, shaderMaterial);
scene.add(particles);

// Mesh grid (subtle geometric element)
const gridGeo = new THREE.PlaneGeometry(20, 20, 30, 30);
const gridMat = new THREE.ShaderMaterial({
  vertexShader: `
    varying vec2 vUv;
    uniform float uTime;
    void main() {
      vUv = uv;
      vec3 pos = position;
      pos.z = sin(pos.x * 1.5 + uTime * 0.4) * cos(pos.y * 1.5 + uTime * 0.3) * 0.2;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  fragmentShader: `
    varying vec2 vUv;
    uniform float uTime;
    void main() {
      vec2 grid = abs(fract(vUv * 30.0 - 0.5) - 0.5) / fwidth(vUv * 30.0);
      float line = min(grid.x, grid.y);
      float alpha = 1.0 - min(line, 1.0);
      alpha *= 0.03;
      gl_FragColor = vec4(0.886, 0.784, 0.494, alpha);
    }
  `,
  transparent: true,
  depthWrite: false,
  side: THREE.DoubleSide
});
const gridMesh = new THREE.Mesh(gridGeo, gridMat);
gridMesh.rotation.x = -Math.PI * 0.35;
gridMesh.position.y = -2;
gridMesh.position.z = -2;
scene.add(gridMesh);

let scrollY = 0;
window.addEventListener('scroll', () => { scrollY = window.scrollY; });

function animateWebGL() {
  const time = performance.now() * 0.001;
  shaderMaterial.uniforms.uTime.value = time;
  gridMat.uniforms.uTime.value = time;

  // Physics-like particle movement
  const posAttr = geometry.attributes.position;
  for (let i = 0; i < particleCount; i++) {
    posAttr.array[i * 3] += velocities[i * 3];
    posAttr.array[i * 3 + 1] += velocities[i * 3 + 1];
    posAttr.array[i * 3 + 2] += velocities[i * 3 + 2];

    // Boundary bounce
    for (let j = 0; j < 3; j++) {
      const bound = j === 2 ? 3 : 5;
      if (Math.abs(posAttr.array[i * 3 + j]) > bound) {
        velocities[i * 3 + j] *= -0.9;
      }
    }
  }
  posAttr.needsUpdate = true;

  // Camera parallax based on scroll
  camera.position.y = -scrollY * 0.001;
  camera.rotation.x = scrollY * 0.0001;

  // Mouse influence on camera
  camera.position.x += (mouseX / window.innerWidth - 0.5 - camera.position.x) * 0.02;

  renderer.render(scene, camera);
  requestAnimationFrame(animateWebGL);
}
animateWebGL();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ========================================
// GSAP ANIMATIONS
// ========================================
gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

function initAnimations() {
  // Hero title reveal
  gsap.to('.hero-title .line-inner', {
    y: 0,
    duration: 1.2,
    ease: 'power4.out',
    stagger: 0.12,
    delay: 0.2
  });

  // Hero description & CTAs
  gsap.to('#heroDesc', { opacity: 1, y: 0, duration: 1, delay: 0.8, ease: 'power3.out' });
  gsap.to('#heroCTAs', { opacity: 1, y: 0, duration: 1, delay: 1, ease: 'power3.out' });
  gsap.to('#scrollHint', { opacity: 1, duration: 1, delay: 1.5 });
  gsap.to('.hero-stat', { opacity: 1, y: 0, duration: 0.8, stagger: 0.12, delay: 1.2, ease: 'power3.out' });

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

  // Parallax for section numbers
  document.querySelectorAll('.parallax-slow').forEach(el => {
    const speed = parseFloat(el.dataset.speed || 0.1);
    gsap.to(el, {
      yPercent: -30 * speed * 10,
      ease: 'none',
      scrollTrigger: {
        trigger: el.closest('section'),
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1
      }
    });
  });

  // Motion blur on scroll
  let lastScroll = 0;
  const motionElements = document.querySelectorAll('.stagger-col');

  ScrollTrigger.create({
    onUpdate: (self) => {
      const velocity = Math.abs(self.getVelocity());
      if (velocity > 600) {
        motionElements.forEach(el => el.classList.add('blurring'));
      } else {
        motionElements.forEach(el => el.classList.remove('blurring'));
      }
    }
  });

  // Nav always visible (fixed at top)
  const nav = document.getElementById('mainNav');
  if (nav) nav.style.transform = 'translateY(0)';

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

  // Scroll hint animation
  gsap.to('#scrollHint', {
    y: 10,
    duration: 1.5,
    ease: 'sine.inOut',
    repeat: -1,
    yoyo: true
  });
}

// ========================================
// VISUAL BOUNCE (SPRING PHYSICS)
// ========================================
document.querySelectorAll('.card-hover').forEach(card => {
  card.addEventListener('mouseenter', () => {
    gsap.to(card, {
      scale: 1.02,
      duration: 0.6,
      ease: 'elastic.out(1, 0.5)'
    });
  });
  card.addEventListener('mouseleave', () => {
    gsap.to(card, {
      scale: 1,
      duration: 0.8,
      ease: 'elastic.out(1, 0.4)'
    });
  });
});
