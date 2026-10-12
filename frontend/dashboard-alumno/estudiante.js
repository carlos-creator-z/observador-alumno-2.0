let isDark = true;
const user = JSON.parse(localStorage.getItem('usuario') || '{}');
const STUDENT_NAME = `${user.nombre} ${user.apellido || ''}`;
let allMyObs = []; 
let firmasAlumnoCanvas = {}; // Para guardar las referencias de los lienzos

if (!localStorage.getItem('token') || user.rol !== 'alumno') window.location.href = '../index.html';

window.addEventListener('load', () => {
  document.getElementById('user-name').textContent = STUDENT_NAME;
  renderObservations();
});

async function fetchConToken(url) {
  const token = localStorage.getItem('token');
  const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` }});
  if (res.status === 401) window.location.href = '../index.html';
  return res.json();
}

async function renderObservations() {
  const container = document.getElementById('observations-container');
  if (!container) return;
  
  const obs = await fetchConToken('/api/observaciones/mis-observaciones');
  
  allMyObs = obs.map(o => ({
    id: o._id,
    typeLabel: o.tipo,
    category: o.categoria,
    date: new Date(o.fechaHecho).toLocaleDateString('es-CO'),
    teacher: `${o.registradoPor?.nombre || ''} ${o.registradoPor?.apellido || ''}`,
    desc: o.descripcion,
    status: o.status,
    descargo: o.descargo,
    signedAt: o.signedAt ? new Date(o.signedAt).toLocaleString('es-CO') : null
  }));

  container.innerHTML = '';
  updateStats(allMyObs);

  if (allMyObs.length === 0) {
    container.innerHTML = `<div class="glass-light rounded-2xl p-8 text-center"><iconify-icon icon="lucide:inbox" width="40" class="t-dim mb-4 opacity-30"></iconify-icon><p class="text-sm t-muted">No tienes observaciones registradas</p></div>`;
    return;
  }

  allMyObs.forEach(obs => {
    const isSigned = obs.status === 'firmado';
    container.insertAdjacentHTML('beforeend', `
      <div class="obs-card glass-light rounded-2xl p-6 sm:p-8 relative overflow-hidden ${isSigned ? 'opacity-80' : 'gradient-border'}" id="obs-${obs.id}">
        <div class="relative z-10">
          <div class="flex flex-col sm:flex-row justify-between gap-4 mb-6 pb-4 border-b border-white/5">
            <div>
              <span class="badge badge-info mb-2">${obs.typeLabel}</span>
              <h3 class="text-lg font-semibold t-primary mt-1">${obs.category}</h3>
            </div>
            <div class="text-left sm:text-right">
              <p class="text-xs t-muted">${obs.date}</p>
              <p class="text-[10px] t-dim mt-1">${obs.teacher}</p>
            </div>
          </div>
          <div class="mb-6">
            <p class="text-sm t-secondary leading-relaxed bg-white/[0.02] p-4 rounded-xl border border-white/5">${obs.desc}</p>
          </div>
          ${isSigned ? `
            <div class="mb-6"><p class="text-sm t-secondary italic">${obs.descargo || 'Sin descargos.'}</p></div>
            <div class="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-white/5">
              <div class="text-emerald-400"><iconify-icon icon="lucide:check-circle" width="20"></iconify-icon> Firmado</div>
              <button type="button" onclick="generarPDF('${obs.id}')" class="morph-btn !bg-red-500/80 hover:!bg-red-500 flex items-center gap-2 text-sm py-2 px-4">
                <iconify-icon icon="lucide:file-down" width="16"></iconify-icon> Descargar PDF Físico
              </button>
            </div>
          ` : `
            <div class="mb-6">
              <div class="float-group mb-4">
                <textarea id="descargo-${obs.id}" placeholder=" " rows="3"></textarea>
                <label for="descargo-${obs.id}">Escribe aquí tus descargos...</label>
              </div>
              <label class="block text-xs font-semibold t-label uppercase tracking-wider mb-2 ml-1">Tu Firma</label>
              <div class="bg-white rounded-xl p-2 border border-[var(--divider)]">
                <canvas id="firma-alumno-${obs.id}" width="400" height="120" class="w-full cursor-crossriver" style="touch-action: none;"></canvas>
              </div>
              <button type="button" onclick="limpiarFirmaAlumno('${obs.id}')" class="text-xs t-muted hover:text-red-400 transition mt-1">Limpiar firma</button>
            </div>
            <div class="flex sm:justify-end">
              <button type="button" class="morph-btn py-3.5 px-6" onclick="signObservation('${obs.id}')">Firmar y Enviar Descargos</button>
            </div>
          `}
        </div>
      </div>`);
  });

  // ⚠️ SOLUCIÓN: Inicializar los lienzos DESPUÉS de que se dibujaron en la pantalla
  allMyObs.forEach(obs => {
    if (obs.status !== 'firmado') {
      initFirmaAlumno(obs.id);
    }
  });
}

function updateStats(myObs) {
  const total = myObs.length;
  const firmados = myObs.filter(o => o.status === 'firmado').length;
  const pendientes = total - firmados;
  const statsContainer = document.querySelector('.grid.grid-cols-2.sm\\:grid-cols-3');
  if(statsContainer) {
    statsContainer.children[0].querySelector('p.text-xl').textContent = total;
    statsContainer.children[1].querySelector('p.text-xl').textContent = pendientes;
    statsContainer.children[2].querySelector('p.text-xl').textContent = firmados;
  }
}

// ==========================================
// LÓGICA DE FIRMA DEL ALUMNO
// ==========================================
function initFirmaAlumno(obsId) {
  const canvas = document.getElementById(`firma-alumno-${obsId}`);
  if (!canvas || firmasAlumnoCanvas[obsId]) return; // Evitar duplicados
  
  const ctx = canvas.getContext('2d');
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  let isDrawing = false;

  const getCoords = (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if (e.touches) return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY };
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  canvas.addEventListener('mousedown', (e) => { isDrawing = true; const {x,y} = getCoords(e); ctx.beginPath(); ctx.moveTo(x,y); });
  canvas.addEventListener('mousemove', (e) => { if(!isDrawing) return; const {x,y} = getCoords(e); ctx.lineTo(x,y); ctx.stroke(); });
  canvas.addEventListener('mouseup', () => isDrawing = false);
  canvas.addEventListener('mouseout', () => isDrawing = false);
  
  canvas.addEventListener('touchstart', (e) => { e.preventDefault(); isDrawing = true; const {x,y} = getCoords(e); ctx.beginPath(); ctx.moveTo(x,y); });
  canvas.addEventListener('touchmove', (e) => { e.preventDefault(); if(!isDrawing) return; const {x,y} = getCoords(e); ctx.lineTo(x,y); ctx.stroke(); });
  canvas.addEventListener('touchend', () => isDrawing = false);
  
  firmasAlumnoCanvas[obsId] = canvas;
}

function limpiarFirmaAlumno(obsId) {
  const canvas = document.getElementById(`firma-alumno-${obsId}`);
  if (canvas) canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
}

function obtenerFirmaAlumno(obsId) {
  const canvas = document.getElementById(`firma-alumno-${obsId}`);
  if (!canvas) return null;
  const ctx = canvas.getContext('2d');
  const pixelData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  let isEmpty = true;
  for (let i = 3; i < pixelData.length; i += 4) { if (pixelData[i] > 0) { isEmpty = false; break; } }
  return isEmpty ? null : canvas.toDataURL('image/png');
}

async function signObservation(obsId) {
  const descargoText = document.getElementById(`descargo-${obsId}`).value.trim();
  const firmaAlumno = obtenerFirmaAlumno(obsId);
  
  if (!descargoText) return showToast('error', 'Debes escribir tus descargos antes de firmar.');
  if (!firmaAlumno) return showToast('error', 'Debes dibujar tu firma.');
  
  const token = localStorage.getItem('token');
  await fetch(`/api/observaciones/firmar/${obsId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ descargo: descargoText, firmaAlumno: firmaAlumno })
  });
  showToast('success', 'Observación firmada.');
  setTimeout(() => renderObservations(), 1000);
}

// ==========================================
// FUNCIÓN DEL PDF
// ==========================================
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
  c.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}
function cerrarSesion() { localStorage.clear(); window.location.href = '../index.html'; }