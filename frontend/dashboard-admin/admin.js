let isDark = true;
const user = JSON.parse(localStorage.getItem('usuario') || '{}');
let allAdminObs = []; 

if (!localStorage.getItem('token') || user.rol !== 'admin') window.location.href = '../index.html';

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
  loadAdminData();
  loadStudentsByGrade();
  loadProfesores();
});

function showSection(id, event) {
  document.querySelectorAll('.dashboard-section').forEach(s => s.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
  document.querySelectorAll('.nav-sidebar-btn').forEach(b => b.classList.remove('active'));
  if (event) event.target.closest('.nav-sidebar-btn').classList.add('active');
  
  // Cerrar menú en móvil al hacer clic
  if (window.innerWidth < 768) {
    sidebar.classList.add('-translate-x-full');
    sidebarOverlay.classList.add('hidden');
  }
}

async function fetchConToken(url, method = 'GET', body = null) {
  const token = localStorage.getItem('token');
  const opts = { method, headers: { 'Authorization': `Bearer ${token}` } };
  if (body) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(url, opts);
  if (res.status === 401) window.location.href = '../index.html';
  return res.json();
}

// --- PROFESORES Y GRADOS ---
async function loadProfesores() {
  const container = document.getElementById('profesores-list');
  const profesores = await fetchConToken('/api/usuarios/profesores');
  container.innerHTML = '';
  if(profesores.length === 0) { container.innerHTML = '<p class="t-muted">No hay profesores registrados.</p>'; return; }
  
  profesores.forEach(p => {
    const gradosActuales = p.grados ? p.grados.join(', ') : '';
    container.innerHTML += `
      <div class="bg-white/[0.02] rounded-xl p-6 border border-[var(--divider)]">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 rounded-full bg-brand-500/10 flex items-center justify-center text-brand-400 font-bold">${p.nombre.charAt(0)}</div>
          <div>
            <p class="t-primary font-medium">${p.nombre} ${p.apellido}</p>
            <p class="text-xs t-muted">Doc: ${p.documento}</p>
          </div>
        </div>
        <div class="float-group mb-4">
          <input type="text" id="grados-${p._id}" value="${gradosActuales}" placeholder="Ej: 10A, 11B" class="!pl-4">
          <label style="top: -8px; font-size: 11px; color: #38BDF8; transform: translateY(0);">Grados asignados (separados por coma)</label>
        </div>
        <button onclick="guardarGrados('${p._id}')" class="morph-btn w-full text-sm !py-2 flex items-center justify-center gap-2">
          <iconify-icon icon="lucide:save" width="16"></iconify-icon> Actualizar Grados
        </button>
      </div>`;
  });
}

async function guardarGrados(id) {
  const inputVal = document.getElementById(`grados-${id}`).value;
  const gradosArray = inputVal.split(',').map(g => g.trim()).filter(g => g.length > 0);
  const res = await fetchConToken(`/api/usuarios/profesores/${id}/grados`, 'PUT', { grados: gradosArray });
  if (res._id) {
    showToast('success', 'Grados actualizados correctamente');
  } else {
    showToast('error', res.message || 'Error al asignar grados');
  }
}

// --- ALUMNOS POR GRADO ---
async function loadStudentsByGrade() {
  const container = document.getElementById('grados-container');
  const students = await fetchConToken('/api/usuarios/all');
  const grados = {};
  students.forEach(s => {
    const grado = s.grado || 'Sin Grado';
    if (!grados[grado]) grados[grado] = [];
    grados[grado].push(s);
  });
  container.innerHTML = '';
  if(Object.keys(grados).length === 0) { container.innerHTML = '<p class="t-muted">No hay alumnos registrados.</p>'; return; }
  
  Object.keys(grados).sort().forEach(grado => {
    container.innerHTML += `
      <div class="bg-white/[0.02] rounded-xl p-6 border border-[var(--divider)]">
        <h4 class="text-sm font-bold text-brand-400 mb-4 flex items-center gap-2">
          <iconify-icon icon="lucide:users" width="16"></iconify-icon> Grado: ${grado} <span class="t-muted font-normal">(${grados[grado].length})</span>
        </h4>
        <div class="space-y-3">
          ${grados[grado].map(s => `
            <div class="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5">
              <div class="w-8 h-8 rounded-full bg-brand-500/10 flex items-center justify-center text-xs text-brand-400 font-bold">${s.nombre.charAt(0)}</div>
              <div>
                <p class="text-sm t-primary">${s.nombre} ${s.apellido}</p>
                <p class="text-xs t-muted">Doc: ${s.documento}</p>
              </div>
            </div>`).join('')}
        </div>
      </div>`;
  });
}

// --- OBSERVACIONES ---
async function loadAdminData() {
  const obs = await fetchConToken('/api/observaciones');
  allAdminObs = obs.map(o => ({
    id: o._id,
    alumno: `${o.alumno?.nombre} ${o.alumno?.apellido}`,
    grado: o.alumno?.grado || 'N/A',
    docente: `${o.registradoPor?.nombre} ${o.registradoPor?.apellido}`,
    tipo: o.tipo,
    categoria: o.categoria,
    desc: o.descripcion,
    descargo: o.descargo,
    date: new Date(o.fechaHecho).toLocaleDateString()
  }));
  renderObservationsTable(allAdminObs);
}

function renderObservationsTable(observations) {
  const tbody = document.getElementById('admin-obs-table');
  if (!tbody) return;
  if (observations.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="py-12 text-center t-muted">No hay observaciones</td></tr>`;
    return;
  }
  tbody.innerHTML = observations.map(obs => `
    <tr class="border-b border-[var(--divider)] hover:bg-white/[0.02]">
      <td class="py-3 px-2 text-sm t-primary">${obs.alumno}</td>
      <td class="py-3 px-2 hidden sm:table-cell"><span class="badge badge-info">${obs.tipo}</span></td>
      <td class="py-3 px-2 hidden md:table-cell text-sm t-muted">${obs.date}</td>
      <td class="py-3 px-2 text-right">
        <button onclick="generarPDF('${obs.id}')" class="morph-btn !bg-red-500/80 hover:!bg-red-500 !py-1 !px-3 text-xs inline-flex items-center gap-1">
          <iconify-icon icon="lucide:file-down" width="14"></iconify-icon> PDF
        </button>
      </td>
    </tr>
  `).join('');
}

// --- PDF ---
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

// --- CREAR USUARIO ---
async function createUser(e) {
  if(e) e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  const originalHtml = btn.innerHTML;
  btn.innerHTML = '<iconify-icon icon="lucide:loader-2" width="16" class="animate-spin"></iconify-icon> Guardando...';
  btn.disabled = true;

  const token = localStorage.getItem('token');
  const data = {
    nombre: document.getElementById('user-nombre').value,
    apellido: document.getElementById('user-apellido').value,
    documento: document.getElementById('user-documento').value,
    email: document.getElementById('user-email').value,
    password: document.getElementById('user-password').value,
    rol: document.getElementById('user-rol').value,
    grado: document.getElementById('user-grado').value || null
  };

  try {
    const res = await fetch('/api/usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(data)
    });
    const resData = await res.json();
    if (res.ok) {
      showToast('success', `¡Usuario ${data.nombre} creado!`);
      e.target.reset();
      loadStudentsByGrade(); 
    } else {
      showToast('error', resData.message || 'Error al crear');
    }
  } catch (error) {
    showToast('error', 'Error de conexión');
  } finally {
    btn.innerHTML = originalHtml;
    btn.disabled = false;
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