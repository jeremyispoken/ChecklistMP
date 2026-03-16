const STORAGE_KEY = 'transporteLibroV2';
const ROLE_PERMISSIONS = {
  Programador: ['programacion'],
  Coordinador: ['ejecucion'],
  Reportes: ['reportes'],
  RRHH: ['conductores'],
  Mantenimiento: ['mantenimiento'],
  Administrador: ['programacion', 'ejecucion', 'reportes', 'conductores', 'mantenimiento']
};

const serviceSeed = [
  ['2026-03-02', 'Minera Candelaria', 'Turno B - Entrada', 'R-4', '06:30', '1152', 'LEDEZMA JORGE', '06:30'],
  ['2026-03-02', 'Minera Candelaria', 'Turno B - Entrada', 'R-5', '06:30', '1138', 'ARAYA GMO', '06:30'],
  ['2026-03-02', 'Minera Candelaria', 'Turno B - Entrada', 'R-6', '06:35', '', '', '06:35'],
  ['2026-03-02', 'Minera Candelaria', 'Administrativo - Entrada', 'ADM-4', '06:30', '1134', 'JUAN ROJAS', '06:30'],
  ['2026-03-02', 'Minera Candelaria', 'Administrativo - Salida', 'B-6', '18:45', 'E-5002', 'GODOY LUIS', '18:45'],
  ['2026-03-02', 'Minera Candelaria', 'Turno A - Entrada', 'R-9', '18:35', '1146', 'CARDOZO MARCELO', '18:35'],
  ['2026-03-02', 'Ojos del Salado', 'Administrativo - Entrada', 'AD.1', '06:30', '', 'AGUSTO MAIKOL', '06:30'],
  ['2026-03-02', 'Ojos del Salado', 'Turno B - Entrada', 'T/BUS 1', '06:30', '4048', 'ITURRIAGA MARIA', '06:30'],
  ['2026-03-02', 'Ojos del Salado', 'Turno A - Entrada', 'T/BUS 2', '18:30', '4040', 'ORDENES HÉCTOR', '18:30'],
  ['2026-03-02', 'Servicios Especiales', 'Especial/Adicional', 'Andenes Candelaria > Andenes DPRO', '18:00', '5002', 'LUYIS GODOY', '']
];

const defaultData = {
  currentRole: 'Programador',
  programacion: serviceSeed.map((s) => ({
    id: crypto.randomUUID(), fecha: s[0], cliente: s[1], bloque: s[2], servicio: s[3], hora: s[4], vehiculo: s[5], conductor: s[6], horarioPasajeros: s[7], estado: 'Programado', observacion: ''
  })),
  conductores: [
    { id: crypto.randomUUID(), codigo: '1134', nombre: 'Juan Rojas', telefono: '', estado: 'Activo' },
    { id: crypto.randomUUID(), codigo: '4048', nombre: 'Iturriaga Maria', telefono: '', estado: 'Activo' }
  ],
  mantenimientos: [
    { id: crypto.randomUUID(), vehiculo: '1152', periodicidad: 'Semanal', proximaFecha: '2026-03-04', responsable: 'Taller', cumplido: false }
  ],
  historial: ['Libro inicializado con servicios de todos los clientes.']
};

let data = loadData();

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : structuredClone(defaultData);
  } catch {
    return structuredClone(defaultData);
  }
}
function saveData() { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
function addHistory(text) {
  data.historial.unshift(`${new Date().toLocaleString('es-CL')}: ${text}`);
  data.historial = data.historial.slice(0, 150);
  saveData();
}

function setActiveTab(tab) {
  document.querySelectorAll('.tab').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
  document.querySelectorAll('.hoja').forEach((h) => h.classList.toggle('active', h.id === `tab-${tab}`));
}

function applyPermissions() {
  document.querySelectorAll('.aviso-rol').forEach((n) => n.remove());
  const role = data.currentRole;
  const allowed = ROLE_PERMISSIONS[role] || [];
  const modules = ['programacion', 'ejecucion', 'reportes', 'conductores', 'mantenimiento'];

  modules.forEach((mod) => {
    const blocked = !allowed.includes(mod);
    const scope = document.getElementById(`tab-${mod}`);
    if (!scope) return;
    scope.querySelectorAll('input, select, button, textarea').forEach((el) => {
      if (el.classList.contains('tab')) return;
      if (el.closest('.tabs')) return;
      if (mod === 'reportes') return;
      el.disabled = blocked;
    });
    if (blocked) {
      const warn = document.createElement('p');
      warn.className = 'aviso-rol';
      warn.textContent = `Rol ${role}: esta hoja es solo lectura (sin atribuciones de edición).`;
      scope.prepend(warn);
    }
  });

  const firstAllowed = allowed[0] || 'reportes';
  const active = document.querySelector('.tab.active')?.dataset.tab;
  if (!allowed.includes(active) && role !== 'Administrador') setActiveTab(firstAllowed);
}

function renderProgramacion() {
  const tbody = document.getElementById('tabla-programacion');
  tbody.innerHTML = '';
  data.programacion.forEach((r) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${r.fecha}</td><td>${r.cliente}</td><td>${r.bloque}</td><td>${r.servicio}</td><td>${r.hora}</td><td>${r.vehiculo}</td><td>${r.conductor}</td><td>${r.horarioPasajeros || ''}</td>
    <td><button class="del-row" data-id="${r.id}">Eliminar</button></td>`;
    tbody.appendChild(tr);
  });
  tbody.querySelectorAll('.del-row').forEach((b) => b.addEventListener('click', () => {
    const id = b.dataset.id;
    const row = data.programacion.find((x) => x.id === id);
    data.programacion = data.programacion.filter((x) => x.id !== id);
    addHistory(`Línea eliminada en programación: ${row?.servicio || id}.`);
    renderAll();
  }));
}

function renderEjecucion() {
  const tbody = document.getElementById('tabla-ejecucion');
  tbody.innerHTML = '';
  data.programacion.forEach((r) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${r.cliente}</td><td>${r.servicio} (${r.vehiculo || 's/i'})</td><td>${r.conductor || '-'}</td>
      <td><select class="estado" data-id="${r.id}">${['Programado', 'En ruta', 'Completado', 'Incidencia'].map((s) => `<option ${r.estado === s ? 'selected' : ''}>${s}</option>`).join('')}</select> <span class="pill ${r.estado.toLowerCase().replace(' ', '-')}">${r.estado}</span></td>
      <td><input class="obs" data-id="${r.id}" value="${r.observacion || ''}"/></td>`;
    tbody.appendChild(tr);
  });
  tbody.querySelectorAll('.estado').forEach((s) => s.addEventListener('change', () => {
    const row = data.programacion.find((r) => r.id === s.dataset.id);
    row.estado = s.value;
    addHistory(`Estado de ${row.servicio}: ${row.estado}.`);
    renderAll();
  }));
  tbody.querySelectorAll('.obs').forEach((i) => i.addEventListener('change', () => {
    const row = data.programacion.find((r) => r.id === i.dataset.id);
    row.observacion = i.value;
    addHistory(`Observación de coordinación en ${row.servicio}.`);
    saveData();
  }));
}

function renderReportes() {
  const total = data.programacion.length;
  const completos = data.programacion.filter((x) => x.estado === 'Completado').length;
  const incidencias = data.programacion.filter((x) => x.estado === 'Incidencia').length;
  const clientes = new Set(data.programacion.map((x) => x.cliente)).size;

  document.getElementById('resumen-reportes').innerHTML = `
    <article class="tarjeta"><strong>${total}</strong><div>Servicios</div></article>
    <article class="tarjeta"><strong>${clientes}</strong><div>Clientes activos</div></article>
    <article class="tarjeta"><strong>${completos}</strong><div>Completados</div></article>
    <article class="tarjeta"><strong>${incidencias}</strong><div>Incidencias</div></article>`;

  const grouped = Object.values(data.programacion.reduce((acc, c) => {
    const key = `${c.vehiculo}|${c.conductor}`;
    if (!acc[key]) acc[key] = { vehiculo: c.vehiculo || '-', conductor: c.conductor || '-', n: 0 };
    acc[key].n += 1;
    return acc;
  }, {}));

  document.getElementById('tabla-reportes').innerHTML = grouped.map((g) => `<tr><td>${g.vehiculo}</td><td>${g.conductor}</td><td>${g.n}</td></tr>`).join('');
}

function renderConductores() {
  const tbody = document.getElementById('tabla-conductores');
  tbody.innerHTML = data.conductores.map((d) => `<tr><td>${d.codigo}</td><td>${d.nombre}</td><td>${d.telefono || ''}</td><td>${d.estado}</td><td><button class="edit-driver" data-id="${d.id}">Editar</button></td></tr>`).join('');
  tbody.querySelectorAll('.edit-driver').forEach((b) => b.addEventListener('click', () => {
    const d = data.conductores.find((x) => x.id === b.dataset.id);
    const form = document.getElementById('form-conductor');
    form.dataset.editId = d.id;
    form.codigo.value = d.codigo;
    form.nombre.value = d.nombre;
    form.telefono.value = d.telefono;
    form.estado.value = d.estado;
  }));
}

function renderMantenimiento() {
  const tbody = document.getElementById('tabla-mantenimiento');
  tbody.innerHTML = data.mantenimientos.map((m) => `<tr><td>${m.vehiculo}</td><td>${m.periodicidad}</td><td>${m.proximaFecha}</td><td>${m.responsable}</td><td><label><input class="cumplido" data-id="${m.id}" type="checkbox" ${m.cumplido ? 'checked' : ''}/> Cumplido</label></td></tr>`).join('');
  tbody.querySelectorAll('.cumplido').forEach((c) => c.addEventListener('change', () => {
    const m = data.mantenimientos.find((x) => x.id === c.dataset.id);
    m.cumplido = c.checked;
    addHistory(`Mantenimiento ${m.vehiculo} -> ${m.cumplido ? 'cumplido' : 'pendiente'}.`);
    renderNotificaciones();
    saveData();
  }));
}

function renderNotificaciones() {
  const ul = document.getElementById('notificaciones');
  const now = new Date();
  const limit = new Date();
  limit.setDate(now.getDate() + 7);
  const items = data.mantenimientos.filter((m) => !m.cumplido).filter((m) => {
    const d = new Date(`${m.proximaFecha}T00:00:00`);
    return d >= now && d <= limit;
  });
  ul.innerHTML = items.length ? items.map((m) => `<li>Vehículo ${m.vehiculo}: ${m.periodicidad} (${m.proximaFecha})</li>`).join('') : '<li>Sin eventos próximos.</li>';
}

function renderHistorial() {
  document.getElementById('historial').innerHTML = data.historial.map((h) => `<li>${h}</li>`).join('');
}

function importExcel(file, cb) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const wb = XLSX.read(e.target.result, { type: 'array' });
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });
    cb(rows);
    renderAll();
  };
  reader.readAsArrayBuffer(file);
}

function setupEvents() {
  document.querySelectorAll('.tab').forEach((b) => b.addEventListener('click', () => setActiveTab(b.dataset.tab)));

  document.getElementById('selector-rol').addEventListener('change', (e) => {
    data.currentRole = e.target.value;
    saveData();
    applyPermissions();
  });

  document.getElementById('form-programacion').addEventListener('submit', (e) => {
    e.preventDefault();
    const row = Object.fromEntries(new FormData(e.currentTarget).entries());
    data.programacion.push({ id: crypto.randomUUID(), ...row, estado: 'Programado', observacion: '' });
    addHistory(`Programador agregó servicio ${row.servicio} (${row.cliente}).`);
    e.currentTarget.reset();
    renderAll();
  });

  document.getElementById('excel-programacion').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    importExcel(file, (rows) => {
      rows.forEach((r) => {
        const row = {
          id: crypto.randomUUID(),
          fecha: String(r.fecha || r.FECHA || '').slice(0, 10),
          cliente: r.cliente || r.CLIENTE || r.faena || r.FAENA || '',
          bloque: r.bloque || r.BLOQUE || r.turno || r.TURNO || '',
          servicio: r.servicio || r.SERVICIO || '',
          hora: r.hora || r.HORA || '',
          vehiculo: r.vehiculo || r.vehículo || r.BUS || r.VAN || '',
          conductor: r.conductor || r.CONDUCTOR || '',
          horarioPasajeros: r.horarioPasajeros || r.horario_pasajeros || r.HORARIO_PASAJEROS || '',
          estado: 'Programado',
          observacion: ''
        };
        if (row.cliente && row.servicio) data.programacion.push(row);
      });
      addHistory(`Carga Excel programación: ${rows.length} filas.`);
    });
  });

  document.getElementById('form-conductor').addEventListener('submit', (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const row = Object.fromEntries(new FormData(form).entries());
    if (form.dataset.editId) {
      const d = data.conductores.find((x) => x.id === form.dataset.editId);
      Object.assign(d, row);
      delete form.dataset.editId;
      addHistory(`RRHH actualizó conductor ${row.codigo}.`);
    } else {
      data.conductores.push({ id: crypto.randomUUID(), ...row });
      addHistory(`RRHH agregó conductor ${row.codigo}.`);
    }
    form.reset();
    renderAll();
  });

  document.getElementById('excel-conductores').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    importExcel(file, (rows) => {
      rows.forEach((r) => {
        const codigo = String(r.codigo || r.CODIGO || r.CÓDIGO || '');
        const nombre = r.nombre || r.NOMBRE || '';
        if (!codigo || !nombre) return;
        const found = data.conductores.find((x) => x.codigo === codigo);
        if (found) Object.assign(found, { nombre, telefono: r.telefono || r.TELEFONO || found.telefono, estado: r.estado || r.ESTADO || found.estado });
        else data.conductores.push({ id: crypto.randomUUID(), codigo, nombre, telefono: r.telefono || '', estado: r.estado || 'Activo' });
      });
      addHistory(`Carga Excel conductores: ${rows.length} filas.`);
    });
  });

  document.getElementById('form-mantenimiento').addEventListener('submit', (e) => {
    e.preventDefault();
    const row = Object.fromEntries(new FormData(e.currentTarget).entries());
    data.mantenimientos.push({ id: crypto.randomUUID(), ...row, cumplido: false });
    addHistory(`Mantenimiento programado para ${row.vehiculo}.`);
    e.currentTarget.reset();
    renderAll();
  });
}

function renderAll() {
  renderProgramacion();
  renderEjecucion();
  renderReportes();
  renderConductores();
  renderMantenimiento();
  renderNotificaciones();
  renderHistorial();
  document.getElementById('selector-rol').value = data.currentRole;
  applyPermissions();
  saveData();
}

setupEvents();
setActiveTab('programacion');
renderAll();
