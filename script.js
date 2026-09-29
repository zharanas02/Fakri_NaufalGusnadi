/* ============================================================
   PRESENTATION DECK
============================================================ */
class Deck {
  constructor() {
    this.deck      = document.getElementById('deck');
    this.slides    = Array.from(document.querySelectorAll('.deck-inner .slide'));
    this.progress  = document.querySelector('.progress-fill');
    this.counterCurrent = document.querySelector('.slide-counter .current');
    this.counterTotal   = document.querySelector('.slide-counter .total');
    this.dots      = Array.from(document.querySelectorAll('.nav-dot'));
    this.hint      = document.querySelector('.nav-hint');
    this.current   = 0;
    this.total     = this.slides.length;
    this.wheelLock = false;

    this.counterTotal.textContent = String(this.total).padStart(2, '0');

    this.updateScale();
    this.bindEvents();
    this.goTo(0, true);

    setTimeout(() => this.hint && this.hint.classList.add('hidden'), 6000);
  }

  updateScale() {
    const slideW = 297 * 96 / 25.4;
    const slideH = 210 * 96 / 25.4;
    const scale  = Math.min(
      window.innerWidth  / slideW,
      window.innerHeight / slideH
    ) * 0.96;
    document.documentElement.style.setProperty('--deck-scale', scale);
  }

  bindEvents() {
    window.addEventListener('resize', () => this.updateScale());

    window.addEventListener('keydown', (e) => {
      const tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;

      switch (e.key) {
        case 'ArrowRight':
        case 'PageDown':
        case ' ':
        case 'Enter':
          e.preventDefault();
          this.next();
          break;
        case 'ArrowLeft':
        case 'PageUp':
          e.preventDefault();
          this.prev();
          break;
        case 'Home':
          e.preventDefault();
          this.goTo(0);
          break;
        case 'End':
          e.preventDefault();
          this.goTo(this.total - 1);
          break;
      }
    });

    window.addEventListener('wheel', (e) => {
      if (this.wheelLock) return;
      if (Math.abs(e.deltaY) < 25) return;
      this.wheelLock = true;
      if (e.deltaY > 0) this.next();
      else              this.prev();
      setTimeout(() => { this.wheelLock = false; }, 950);
    }, { passive: true });

    let tx = 0, ty = 0, t0 = 0;
    window.addEventListener('touchstart', (e) => {
      tx = e.touches[0].clientX;
      ty = e.touches[0].clientY;
      t0 = Date.now();
    }, { passive: true });

    window.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - tx;
      const dy = e.changedTouches[0].clientY - ty;
      const dt = Date.now() - t0;
      if (dt > 800) return;

      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 60) {
        dx < 0 ? this.next() : this.prev();
      } else if (Math.abs(dy) > 60) {
        dy < 0 ? this.next() : this.prev();
      }
    }, { passive: true });

    this.dots.forEach((dot, i) => {
      dot.addEventListener('click', () => this.goTo(i));
    });
  }

  goTo(index, instant = false) {
    index = Math.max(0, Math.min(this.total - 1, index));
    if (index === this.current && !instant) return;

    this.slides.forEach((slide, i) => {
      slide.classList.remove('active', 'prev', 'next');
      if (i < index)      slide.classList.add('prev');
      else if (i > index) slide.classList.add('next');
    });

    this.slides[index].classList.add('active');
    this.current = index;

    this.progress.style.width =
      ((index + 1) / this.total * 100) + '%';
    this.counterCurrent.textContent =
      String(index + 1).padStart(2, '0');
    this.dots.forEach((d, i) =>
      d.classList.toggle('active', i === index)
    );

    setTimeout(() => this.animateSlide(index), 260);
  }

  next() { this.goTo(this.current + 1); }
  prev() { this.goTo(this.current - 1); }

  animateSlide(index) {
    const slide = this.slides[index];
    if (!slide) return;

    slide.querySelectorAll('[data-count]').forEach(el => {
      const target = parseFloat(el.dataset.count);
      if (isNaN(target)) return;
      const duration = 1600;
      const start = performance.now();
      const from  = 0;
      const tick = (now) => {
        const t = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = (from + (target - from) * eased).toFixed(2);
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });

    slide.querySelectorAll('.fill').forEach(fill => {
      const pct = fill.dataset.fill || 0;
      fill.style.width = '0%';
      requestAnimationFrame(() => {
        setTimeout(() => { fill.style.width = pct + '%'; }, 200);
      });
    });
  }
}

/* ============================================================
   ANIMATED CIRCUIT BACKGROUND
============================================================ */
function initCircuitCanvas(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let W, H, nodes = [];

  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    W = canvas.width  = Math.max(1, rect.width);
    H = canvas.height = Math.max(1, rect.height);
    generateNodes();
  }

  function generateNodes() {
    nodes = [];
    const count = Math.max(30, Math.floor((W * H) / 28000));
    for (let i = 0; i < count; i++) {
      nodes.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.8 + 0.8,
        hue: Math.random() > 0.75 ? 45 : 190
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const d  = Math.hypot(dx, dy);
        if (d < 130) {
          ctx.globalAlpha = (1 - d / 130) * 0.35;
          ctx.strokeStyle = 'rgba(0,229,255,1)';
          ctx.lineWidth = 0.7;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1;

    nodes.forEach(n => {
      n.x += n.vx;
      n.y += n.vy;
      if (n.x < 0 || n.x > W) n.vx *= -1;
      if (n.y < 0 || n.y > H) n.vy *= -1;

      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fillStyle = n.hue === 45
        ? 'rgba(255,183,3,0.85)'
        : 'rgba(0,229,255,0.7)';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r * 3, 0, Math.PI * 2);
      ctx.fillStyle = n.hue === 45
        ? 'rgba(255,183,3,0.08)'
        : 'rgba(0,229,255,0.06)';
      ctx.fill();
    });

    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  resize();
  draw();
}

/* ============================================================
   BOOT
============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  initCircuitCanvas('circuit-canvas');
  initCircuitCanvas('contact-canvas');
  window.deck = new Deck();
});