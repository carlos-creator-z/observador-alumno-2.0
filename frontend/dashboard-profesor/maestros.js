let isDark = true;
let currentObsType = null;
const user = JSON.parse(localStorage.getItem('usuario') || '{}');
let allMyRegistros = []; 
let firmaDocenteCanvas, firmaDocenteCtx;
let isDrawing = false;

if (!localStorage.getItem('token') || user.rol !== 'profesor') window.location.href = '../index.html';

// Lógica Sidebar Responsivo
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');
const menuToggle = document.getElementById('menu-toggle');

if (menuToggle) {
  menuToggle.addEventListener('click', () => {
    sidebar.classList.remove('-translate-x-full');
    sidebarOverlay.classList.remove('hidden');
  });
}
if (sidebarOverlay) {
  sidebarOverlay.addEventListener('click', () => {
    sidebar.classList.add('-translate-x-full');
    sidebarOverlay.classList.add('hidden');
  });
}

window.addEventListener('load', () => {
  setTodayDate();
  loadAlumnos();
  loadMyRegistros();
  initFirmaCanvas();
});

function showSection(id, event) {
  document.querySelectorAll('.dashboard-section').forEach(s => s.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
  document.querySelectorAll('.nav-sidebar-btn').forEach(b => b.classList.remove('active'));
  if (event) event.target.closest('.nav-sidebar-btn').classList.add('active');
  
  if (window.innerWidth < 768) {
    sidebar.classList.add('-translate-x-full');
    sidebarOverlay.classList.add('hidden');
  }
}

// ==========================================
// LÓGICA DE FIRMA
// ==========================================
function initFirmaCanvas() {
  firmaDocenteCanvas = document.getElementById('firma-docente-canvas');
  if (!firmaDocenteCanvas) return;
  firmaDocenteCtx = firmaDocenteCanvas.getContext('2d');
  firmaDocenteCtx.strokeStyle = '#000000';
  firmaDocenteCtx.lineWidth = 2;
  firmaDocenteCtx.lineCap = 'round';

  firmaDocenteCanvas.addEventListener('mousedown', startDrawing);
  firmaDocenteCanvas.addEventListener('mousemove', draw);
  firmaDocenteCanvas.addEventListener('mouseup', stopDrawing);
  firmaDocenteCanvas.addEventListener('mouseout', stopDrawing);
  
  firmaDocenteCanvas.addEventListener('touchstart', handleTouch);
  firmaDocenteCanvas.addEventListener('touchmove', handleTouch);
  firmaDocenteCanvas.addEventListener('touchend', stopDrawing);
}

function getCoords(e) {
  const rect = firmaDocenteCanvas.getBoundingClientRect();
  const scaleX = firmaDocenteCanvas.width / rect.width;
  const scaleY = firmaDocenteCanvas.height / rect.height;
  if (e.touches) {
    return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY };
  }
  return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
}

function startDrawing(e) { isDrawing = true; const {x, y} = getCoords(e); firmaDocenteCtx.beginPath(); firmaDocenteCtx.moveTo(x, y); }
function draw(e) { if (!isDrawing) return; const {x, y} = getCoords(e); firmaDocenteCtx.lineTo(x, y); firmaDocenteCtx.stroke(); }
function stopDrawing() { isDrawing = false; }
function handleTouch(e) { e.preventDefault(); if (e.type === 'touchstart') startDrawing(e); else if (e.type === 'touchmove') draw(e); }

function limpiarFirma(canvasId) {
  const canvas = document.getElementById(canvasId);
  if(canvas) canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
}

function obtenerFirma(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;
  const ctx = canvas.getContext('2d');
  const pixelData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  let isEmpty = true;
  for (let i = 3; i < pixelData.length; i += 4) { if (pixelData[i] > 0) { isEmpty = false; break; } }
  return isEmpty ? null : canvas.toDataURL('image/png');
}

// ==========================================
// LÓGICA DE API
// ==========================================
async function fetchConToken(url, opciones = {}) {
  const token = localStorage.getItem('token');
  const res = await fetch(url, {
    ...opciones,
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
  });
  if (res.status === 401) window.location.href = '../index.html';
  return res.json();
}

async function loadAlumnos() {
  const alumnos = await fetchConToken('/api/usuarios/alumnos');
  const select = document.getElementById('student-select');
  if(select) {
    select.innerHTML = '<option value="" disabled selected></option>';
    alumnos.forEach(a => select.innerHTML += `<option value="${a._id}">${a.nombre} ${a.apellido} - ${a.grado}</option>`);
  }
}

async function loadMyRegistros() {
  const list = document.getElementById('mis-registros-list');
  if(!list) return;
  const obs = await fetchConToken('/api/observaciones/mis-registros');
  
  allMyRegistros = obs.map(o => ({
    id: o._id,
    alumno: `${o.alumno?.nombre} ${o.alumno?.apellido}`,
    grado: o.alumno?.grado || 'N/A',
    docente: `${user.nombre} ${user.apellido}`,
    tipo: o.tipo,
    categoria: o.categoria,
    desc: o.descripcion,
    descargo: o.descargo,
    date: new Date(o.fechaHecho).toLocaleDateString()
  }));

  list.innerHTML = '';
  if(allMyRegistros.length === 0) { list.innerHTML = '<p class="t-muted text-sm">No has registrado observaciones aún.</p>'; return; }
  
  allMyRegistros.forEach(o => {
    list.innerHTML += `
      <div class="bg-white/[0.02] rounded-xl p-4 border border-[var(--divider)]">
        <div class="flex justify-between mb-2">
          <span class="badge badge-info">${o.tipo}</span>
          <span class="text-xs t-muted">${o.date}</span>
        </div>
        <p class="t-primary text-sm font-medium mb-1">Alumno: ${o.alumno} (${o.grado})</p>
        <p class="t-secondary text-sm mb-4">${o.desc}</p>
        <div class="flex justify-end">
          <button onclick="generarPDF('${o.id}')" class="morph-btn !bg-red-500/80 hover:!bg-red-500 flex items-center gap-2 text-sm py-2 px-4">
            <iconify-icon icon="lucide:file-down" width="16"></iconify-icon> Descargar PDF
          </button>
        </div>
      </div>`;
  });
}

function setObsType(btn) {
  // Quitamos todas las clases activas de todos los botones
  document.querySelectorAll('.obs-type-btn').forEach(b => {
    b.classList.remove('active-felicitacion', 'active-atencion', 'active-compromiso', 'active-nota');
  });
  // Encendemos solo el botón seleccionado
  currentObsType = btn.dataset.type;
  btn.classList.add(`active-${currentObsType}`);
}

async function submitObservation(e) {
  if(e) e.preventDefault();
  const student = document.getElementById('student-select').value;
  const desc = document.getElementById('obs-desc').value.trim();
  const firmaDocente = obtenerFirma('firma-docente-canvas');
  
  if (!student || !currentObsType || !desc) return showToast('error', 'Completa todo.');
  if (!firmaDocente) return showToast('error', 'Debes firmar la observación.');
  
  await fetchConToken('/api/observaciones', {
    method: 'POST',
    body: JSON.stringify({ 
      alumno: student, tipo: currentObsType, 
      categoria: document.getElementById('obs-category').value, 
      descripcion: desc, fechaHecho: document.getElementById('obs-date').value,
      firmaDocente: firmaDocente
    })
  });
  showToast('success', 'Observación registrada.');
  clearForm();
  loadMyRegistros();
}

function setTodayDate() { document.getElementById('obs-date').value = new Date().toISOString().split('T')[0]; }
function clearForm() {
  document.getElementById('student-select').value = "";
  document.getElementById('obs-desc').value = "";
  document.getElementById('obs-category').value = "";
  currentObsType = null;
  document.querySelectorAll('.obs-type-btn').forEach(b => b.classList.remove('active-felicidad', 'active-atencion', 'active-compromiso', 'active-nota'));
  limpiarFirma('firma-docente-canvas');
  setTodayDate();
}

async function generarPDF(obsId) {
  const token = localStorage.getItem('token');
  showToast('info', 'Descargando documento PDF...');
  try {
    const res = await fetch(`/api/observaciones/pdf/${obsId}`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (!res.ok) throw new Error('Error al generar el PDF');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Observacion_${obsId}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    showToast('error', error.message);
  }
}

function showToast(type, message) {
  const c = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.innerHTML = `<iconify-icon icon="lucide:info" width="18"></iconify-icon> ${message}`;
  c.appendChild(t); setTimeout(() => t.remove(), 3000);
}
function cerrarSesion() { localStorage.clear(); window.location.href = '../index.html'; }