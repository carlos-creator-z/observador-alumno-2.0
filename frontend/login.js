let isDark = true;
const drawerOverlay = document.getElementById('drawer-overlay');
const drawerPanel = document.getElementById('drawer-panel');

window.addEventListener('load', () => {
  initRevealAnimations();
  initParticles();
  initUserTypeButtons();
  initEventListeners();
  initScrollEffects();
  initRippleEffect();
});

function initRevealAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => observer.observe(el));
}

function initParticles() {
  const container = document.getElementById('particles-container');
  if (!container) return;
  for (let i = 0; i < 25; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const sz = Math.random() * 3 + 1;
    const cols = ['rgba(14,165,233,0.3)', 'rgba(56,189,248,0.2)', 'rgba(186,230,253,0.25)', 'rgba(255,255,255,0.1)'];
    p.style.cssText = `width:${sz}px;height:${sz}px;background:${cols[Math.floor(Math.random()*cols.length)]};left:${Math.random()*100}%;bottom:-10px;animation-duration:${Math.random()*15+10}s;animation-delay:${Math.random()*10}s;`;
    container.appendChild(p);
  }
}

function shakeEl(el) {
  el.style.animation = 'none';
  el.offsetHeight; 
  el.style.animation = 'shake 0.5s ease';
  setTimeout(() => el.style.animation = '', 500);
}

function launchConfetti() {
  const cols = ['#0EA5E9', '#38BDF8', '#7DD3FC', '#BAE6FD', '#10B981', '#F59E0B', '#EF4444', '#ffffff'];
  for (let i = 0; i < 60; i++) {
    const p = document.createElement('div');
    p.className = 'confetti-piece';
    const s = Math.random() * 8 + 4;
    p.style.cssText = `left:${Math.random()*100}vw;top:-10px;width:${s}px;height:${s*(Math.random()*.5+.5)}px;background:${cols[Math.floor(Math.random()*cols.length)]};border-radius:${Math.random()>.5?'50%':'2px'};animation-delay:${Math.random()*.5}s;animation-duration:${Math.random()*1.5+2}s;`;
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 3500);
  }
}

document.querySelectorAll('.tilt-card').forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const r = card.getBoundingClientRect();
    card.style.transform = `perspective(1000px) rotateX(${(e.clientY-r.top-r.height/2)/(r.height/2)*-4}deg) rotateY(${(e.clientX-r.left-r.width/2)/(r.width/2)*4}deg) scale3d(1.01,1.01,1.01)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1,1,1)';
  });
});

function initScrollEffects() {
  const sections = document.querySelectorAll('section[id]');
  window.addEventListener('scroll', () => {
    document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 50);
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    document.getElementById('reading-progress').style.width = (window.scrollY / docHeight) * 100 + '%';
    document.getElementById('back-to-top').classList.toggle('visible', window.scrollY > 400);
    const hero = document.getElementById('inicio');
    if (hero) {
      const scrollY = window.scrollY;
      hero.querySelectorAll('[class*="blur-"]').forEach((o, i) => {
        o.style.transform = `translateY(${scrollY * (0.1 + i * 0.05)}px)`;
      });
    }
    let current = '';
    sections.forEach(s => { if (window.scrollY >= s.offsetTop - 100) current = s.getAttribute('id'); });
    document.querySelectorAll('.nav-link').forEach(l => {
      l.style.color = ''; l.style.background = '';
      if (l.getAttribute('href') === '#' + current) {
        l.style.color = 'var(--text-primary)'; l.style.background = 'rgba(14,165,233,0.08)';
      }
    });
  });
}

function initEventListeners() {
  document.getElementById('theme-toggle').addEventListener('click', () => {
    isDark = !isDark;
    document.body.classList.toggle('light-mode', !isDark);
    document.getElementById('theme-icon').setAttribute('icon', isDark ? 'lucide:sun' : 'lucide:moon');
    showToast('info', isDark ? 'Modo oscuro activado' : 'Modo claro activado');
  });
  document.getElementById('drawer-toggle').addEventListener('click', () => {
    drawerOverlay.classList.add('open'); drawerPanel.classList.add('open');
  });
  document.getElementById('drawer-close').addEventListener('click', closeDrawer);
  drawerOverlay.addEventListener('click', closeDrawer);
  document.querySelectorAll('.drawer-link').forEach(l => l.addEventListener('click', closeDrawer));
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(a.getAttribute('href'));
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && document.activeElement.closest('#login-form')) handleLogin(e);
    if (e.key === 'Escape') { closeModal(); closeDrawer(); }
  });
}

function initRippleEffect() {
  document.querySelectorAll('.morph-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      const r = this.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'btn-ripple';
      const size = Math.max(r.width, r.height);
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = e.clientX - r.left - size / 2 + 'px';
      ripple.style.top = e.clientY - r.top - size / 2 + 'px';
      this.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });
  });
}

function initUserTypeButtons() {
  const btns = document.querySelectorAll('.user-type-btn');
  function setActive(activeBtn) {
    btns.forEach(b => { b.classList.remove('user-type-btn-active'); b.classList.add('user-type-btn-inactive'); });
    activeBtn.classList.remove('user-type-btn-inactive'); activeBtn.classList.add('user-type-btn-active');
  }
  const estudianteBtn = document.querySelector('.user-type-btn[data-type="alumno"]');
  if (estudianteBtn) setActive(estudianteBtn);
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      setActive(btn);
      showToast('info', `Modo ${btn.dataset.type.charAt(0).toUpperCase() + btn.dataset.type.slice(1)} seleccionado`);
    });
  });
}

function getSelectedUserType() {
  const active = document.querySelector('.user-type-btn.user-type-btn-active');
  return active ? active.dataset.type : 'alumno';
}

function togglePassword() {
  const input = document.getElementById('password');
  const icon = document.getElementById('eye-icon');
  if (input.type === 'password') { input.type = 'text'; icon.setAttribute('icon', 'lucide:eye-off'); }
  else { input.type = 'password'; icon.setAttribute('icon', 'lucide:eye'); }
}

async function handleLogin(e) {
  if(e) e.preventDefault();
  const documento = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  const btn = document.getElementById('login-btn');
  const btnText = document.getElementById('btn-text');
  const btnIcon = document.getElementById('btn-icon');
  const btnSpinner = document.getElementById('btn-spinner');

  if (!documento || !password) return showToast('error', 'Completa todos los campos');

  btnText.textContent = 'Verificando...';
  btnIcon.classList.add('hidden');
  btnSpinner.classList.remove('hidden');
  btn.disabled = true;

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documento, password }) // Ya no enviamos 'rol'
    });
    
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Error al iniciar sesión');

    localStorage.setItem('token', data.token);
    localStorage.setItem('usuario', JSON.stringify(data.user));
    
    showToast('success', '¡Autenticación exitosa! Redirigiendo...');
    // Redirige automáticamente según el rol que devolvió el backend
    setTimeout(() => window.location.href = `dashboard-${data.user.rol}/index.html`, 1000);

  } catch (err) {
    showToast('error', err.message);
    btnText.textContent = 'Ingresar al Observador';
    btnIcon.classList.remove('hidden');
    btnSpinner.classList.add('hidden');
    btn.disabled = false;
  }
}

async function setupSystem() {
  if(confirm('¿Deseas inicializar el sistema? Creará el admin (admin001 / Admin123!).')) {
    try {
      const res = await fetch('/api/auth/setup', { method: 'POST' });
      const data = await res.json();
      if(!res.ok) throw new Error(data.message);
      showToast('success', data.message);
    } catch(err) {
      showToast('error', err.message);
    }
  }
}

function showToast(type, message) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  const icons = { success: 'lucide:check-circle', error: 'lucide:x-circle', info: 'lucide:info', warning: 'lucide:alert-triangle' };
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<iconify-icon icon="${icons[type]}" width="18"></iconify-icon> ${message}`;
  container.appendChild(toast);
  setTimeout(() => { toast.classList.add('toast-out'); setTimeout(() => toast.remove(), 300); }, 3500);
}

function closeModal() { document.getElementById('success-modal').classList.remove('open'); }
function closeDrawer() { drawerOverlay.classList.remove('open'); drawerPanel.classList.remove('open'); }