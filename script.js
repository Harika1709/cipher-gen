// ─── PARTICLE CANVAS ───────────────────────────────────────────
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');
let W, H, particles = [], connections = [];

function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', () => { resize(); initParticles(); });

class Particle {
  constructor() { this.reset(); }
  reset() {
    this.x = Math.random() * W;
    this.y = Math.random() * H;
    this.vx = (Math.random() - 0.5) * 0.4;
    this.vy = (Math.random() - 0.5) * 0.4;
    this.r = Math.random() * 1.5 + 0.5;
    this.alpha = Math.random() * 0.5 + 0.1;
    this.color = Math.random() > 0.5 ? '0,245,255' : '180,0,255';
    this.pulse = Math.random() * Math.PI * 2;
    this.pulseSpeed = 0.02 + Math.random() * 0.02;
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.pulse += this.pulseSpeed;
    if (this.x < 0 || this.x > W || this.y < 0 || this.y > H) this.reset();
  }
  draw() {
    const a = this.alpha * (0.7 + 0.3 * Math.sin(this.pulse));
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${this.color},${a})`;
    ctx.fill();
  }
}

function initParticles() {
  const count = Math.min(120, Math.floor(W * H / 12000));
  particles = Array.from({ length: count }, () => new Particle());
}
initParticles();

function drawConnections() {
  const maxDist = 120;
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist < maxDist) {
        const a = (1 - dist/maxDist) * 0.12;
        ctx.strokeStyle = `rgba(0,245,255,${a})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.stroke();
      }
    }
  }
}

// Floating data streams
const streams = Array.from({ length: 8 }, () => ({
  x: Math.random() * W,
  y: Math.random() * H,
  speed: 0.3 + Math.random() * 0.5,
  chars: '01アイウエオカキクケコ!@#$%',
  text: Array.from({ length: 15 }, () => '0'),
  alpha: Math.random() * 0.08 + 0.02,
  fontSize: 10 + Math.random() * 4,
}));

function updateStreams() {
  streams.forEach(s => {
    s.y += s.speed;
    if (s.y > H + 200) {
      s.y = -200;
      s.x = Math.random() * W;
    }
    if (Math.random() < 0.1) {
      const i = Math.floor(Math.random() * s.text.length);
      s.text[i] = s.chars[Math.floor(Math.random() * s.chars.length)];
    }
  });
}

function drawStreams() {
  streams.forEach(s => {
    ctx.font = `${s.fontSize}px 'Share Tech Mono', monospace`;
    s.text.forEach((c, i) => {
      const decay = (s.text.length - i) / s.text.length;
      ctx.fillStyle = `rgba(0,245,255,${s.alpha * decay})`;
      ctx.fillText(c, s.x, s.y - i * (s.fontSize + 2));
    });
  });
}

function animate() {
  ctx.clearRect(0, 0, W, H);
  drawStreams();
  updateStreams();
  particles.forEach(p => { p.update(); p.draw(); });
  drawConnections();
  requestAnimationFrame(animate);
}
animate();

// ─── CURSOR GLOW ──────────────────────────────────────────────
const cursorGlow = document.getElementById('cursor-glow');
document.addEventListener('mousemove', e => {
  cursorGlow.style.left = e.clientX + 'px';
  cursorGlow.style.top = e.clientY + 'px';
});

// ─── PASSWORD GENERATOR ───────────────────────────────────────
const SETS = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers:   '0123456789',
  symbols:   '!@#$%^&*()-_=+[]{}|;:,.<>?'
};

let state = {
  length: 16,
  uppercase: true, lowercase: true, numbers: true, symbols: true
};

let history = [];

function buildCharset() {
  return Object.entries(SETS).filter(([k]) => state[k]).map(([,v]) => v).join('');
}

function generate() {
  const charset = buildCharset();
  if (!charset) return '';
  const arr = new Uint32Array(state.length);
  crypto.getRandomValues(arr);
  return Array.from(arr, n => charset[n % charset.length]).join('');
}

function getEntropy(charset, len) {
  if (!charset) return 0;
  return Math.floor(len * Math.log2(charset.length));
}

function getStrength(entropy) {
  if (entropy < 40) return { level: 1, label: 'WEAK',    color: 'var(--weak)' };
  if (entropy < 70) return { level: 2, label: 'MEDIUM',  color: 'var(--medium)' };
  if (entropy < 100) return { level: 3, label: 'STRONG', color: 'var(--strong)' };
  return { level: 4, label: 'MAXIMUM', color: 'var(--cyan)' };
}

function formatCombos(charset, len) {
  if (!charset) return '—';
  const exp = len * Math.log10(charset.length);
  if (exp < 10) return `10^${exp.toFixed(0)}`;
  const e = Math.floor(exp);
  return `10^${e}`;
}

function updateStats() {
  const charset = buildCharset();
  const entropy = getEntropy(charset, state.length);
  const strength = getStrength(entropy);

  document.getElementById('stat-entropy').textContent = entropy || '—';
  document.getElementById('stat-charset').textContent = charset.length || '—';
  document.getElementById('stat-combos').textContent = charset ? formatCombos(charset, state.length) : '—';

  const bars = [1,2,3,4].map(i => document.getElementById('bar' + i));
  bars.forEach((b, i) => {
    b.classList.remove('active');
    if (i < strength.level) {
      b.style.background = strength.color;
      b.style.boxShadow = `0 0 8px ${strength.color}`;
      b.classList.add('active');
    } else {
      b.style.background = 'rgba(255,255,255,0.08)';
      b.style.boxShadow = 'none';
    }
  });

  const lbl = document.getElementById('strength-label');
  lbl.textContent = entropy > 0 ? strength.label : '—';
  lbl.style.color = entropy > 0 ? strength.color : 'var(--text-dim)';
}

function renderPassword(pw) {
  const el = document.getElementById('password-text');
  el.classList.remove('flash');
  void el.offsetWidth;
  el.textContent = pw || 'Click GENERATE to create password...';
  el.classList.add('flash');
}

function addHistory(pw) {
  history.unshift({ pw, time: new Date().toLocaleTimeString() });
  if (history.length > 5) history.pop();
  const list = document.getElementById('history-list');
  list.innerHTML = '';
  history.forEach(h => {
    const item = document.createElement('div');
    item.className = 'history-item';
    item.innerHTML = `
      <span class="history-pw">${h.pw}</span>
      <span class="history-meta">${h.time}</span>
    `;
    item.addEventListener('click', () => {
      copyText(h.pw);
      showToast('HISTORY PASSWORD COPIED');
    });
    list.appendChild(item);
  });
}

// Slider
const slider = document.getElementById('length-slider');
const lenDisplay = document.getElementById('length-display');
const fill = document.getElementById('slider-fill');

function updateSlider() {
  const pct = (slider.value - slider.min) / (slider.max - slider.min) * 100;
  fill.style.width = pct + '%';
  lenDisplay.textContent = slider.value;
  state.length = +slider.value;
  updateStats();
}
slider.addEventListener('input', updateSlider);
updateSlider();

// Toggles
document.querySelectorAll('.option-item').forEach(el => {
  el.addEventListener('click', () => {
    const opt = el.dataset.opt;
    const active = document.querySelectorAll('.option-item.active');
    if (active.length === 1 && el.classList.contains('active')) return; // keep at least one
    el.classList.toggle('active');
    state[opt] = el.classList.contains('active');
    updateStats();
  });
});

// Generate button
let currentPw = '';
document.getElementById('gen-btn').addEventListener('click', function(e) {
  // Ripple
  const rect = this.getBoundingClientRect();
  const ripple = document.createElement('span');
  ripple.className = 'ripple';
  const size = Math.max(rect.width, rect.height);
  ripple.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - rect.left - size/2}px;top:${e.clientY - rect.top - size/2}px`;
  this.appendChild(ripple);
  setTimeout(() => ripple.remove(), 600);

  // Generate
  this.classList.add('generating');
  currentPw = generate();
  renderPassword(currentPw);
  updateStats();
  if (currentPw) addHistory(currentPw);
  setTimeout(() => this.classList.remove('generating'), 300);
});

// Copy
function copyText(text) {
  if (!text || text === 'Click GENERATE to create password...') return;
  navigator.clipboard.writeText(text).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); ta.remove();
  });
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}

document.getElementById('copy-btn').addEventListener('click', () => {
  if (!currentPw) return;
  copyText(currentPw);
  const btn = document.getElementById('copy-btn');
  btn.classList.add('copied');
  btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
  showToast('PASSWORD COPIED TO CLIPBOARD');
  setTimeout(() => {
    btn.classList.remove('copied');
    btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
  }, 2000);
});

document.getElementById('clear-hist').addEventListener('click', () => {
  history = [];
  document.getElementById('history-list').innerHTML = '';
});

// Generate one on load
setTimeout(() => {
  currentPw = generate();
  renderPassword(currentPw);
  updateStats();
  addHistory(currentPw);
}, 400);