const STORAGE_KEY = 'transportePersonalDataV1';

const defaultData = {
  programacion: [
    { id: crypto.randomUUID(), fecha: '2026-03-02', faena: 'Minera Candelaria', turno: 'Turno B - Entrada 07:30', servicio: 'R-4', hora: '06:30', vehiculo: '1152', conductor: 'Ledezma Jorge', pasajeros: 0, estado: 'Programado', observacion: '' },
    { id: crypto.randomUUID(), fecha: '2026-03-02', faena: 'Ojos del Salado', turno: 'Turno A - Entrada 19:30', servicio: 'T/BUS 1', hora: '18:30', vehiculo: '4048', conductor: 'Iturriaga Maria', pasajeros: 0, estado: 'Programado', observacion: '' },
    { id: crypto.randomUUID(), fecha: '2026-03-02', faena: 'Servicios Especiales', turno: 'Administrativo - Salida 18:45', servicio: 'Andenes Candelaria > Andenes DPRO', hora: '18:00', vehiculo: '5002', conductor: 'Luyis Godoy', pasajeros: 0, estado: 'Programado', observacion: '' }
  ],
  conductores: [
    { id: crypto.randomUUID(), codigo: '1134', nombre: 'Juan Rojas', telefono: '', estado: 'Activo' },
    { id: crypto.randomUUID(), codigo: '1142', nombre: 'Arley Figueroa', telefono: '', estado: 'Activo' },
    { id: crypto.randomUUID(), codigo: '4048', nombre: 'Maria Iturriaga', telefono: '', estado: 'Activo' }
  ],
  mantenimientos: [
    { id: crypto.randomUUID(), vehiculo: '1152', periodicidad: 'Semanal', proximaFecha: '2026-03-04', responsable: 'Taller Copiapó', cumplido: false },
    { id: crypto.randomUUID(), vehiculo: '5002', periodicidad: 'Mensual', proximaFecha: '2026-03-08', responsable: 'Mantención Mina', cumplido: false }
  ],
  historial: ['Sistema inicializado con base de planilla operacional.']
};

let data = loadData();

function loadData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return structuredClone(defaultData);
  try {
    return JSON.parse(raw);
  } catch {
    return structuredClone(defaultData);
  }
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function addHistory(text) {
  data.historial.unshift(`${new Date().toLocaleString('es-CL')}: ${text}`);
  data.historial = data.historial.slice(0, 120);
  saveData();
  renderHistorial();
}

function renderProgramacion() {
  const tbody = document.getElementById('tabla-programacion');
  tbody.innerHTML = '';
  data.programacion.forEach((item) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.fecha}</td><td>${item.faena}</td><td>${item.turno}</td><td>${item.servicio}</td><td>${item.hora}</td>
      <td>${item.vehiculo}</td><td>${item.conductor}</td><td>${item.pasajeros || ''}</td>
      <td><button data-id="${item.id}" class="btn-eliminar">Eliminar</button></td>`;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll('.btn-eliminar').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const old = data.programacion.find((r) => r.id === id);
      data.programacion = data.programacion.filter((r) => r.id !== id);
      addHistory(`Servicio eliminado: ${old?.servicio || id}.`);
      saveData();
      renderAll();
    });
  });
}

function renderEjecucion() {
  const tbody = document.getElementById('tabla-ejecucion');
  tbody.innerHTML = '';
  data.programacion.forEach((item) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.fecha} · ${item.servicio} (${item.vehiculo})</td>
      <td>${item.conductor}</td>
      <td>
        <select data-id="${item.id}" class="estado-select" aria-label="Estado de ${item.servicio}">
          ${['Programado', 'En ruta', 'Completado', 'Incidencia'].map((st) => `<option ${item.estado === st ? 'selected' : ''}>${st}</option>`).join('')}
        </select>
        <span class="pill ${item.estado.toLowerCase().replace(' ', '-')}">${item.estado}</span>
      </td>
      <td><input data-id="${item.id}" class="obs-input" value="${item.observacion || ''}" aria-label="Observación de ${item.servicio}" /></td>`;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll('.estado-select').forEach((sel) => {
    sel.addEventListener('change', () => {
      const id = sel.getAttribute('data-id');
      const row = data.programacion.find((r) => r.id === id);
      row.estado = sel.value;
      addHistory(`Estado actualizado: ${row.servicio} -> ${row.estado}.`);
      saveData();
      renderEjecucion();
      renderReportes();
    });
  });

  tbody.querySelectorAll('.obs-input').forEach((input) => {
    input.addEventListener('change', () => {
      const id = input.getAttribute('data-id');
      const row = data.programacion.find((r) => r.id === id);
      row.observacion = input.value;
      addHistory(`Observación coordinador en ${row.servicio}.`);
      saveData();
    });
  });
}

function renderReportes() {
  const resumen = document.getElementById('resumen-reportes');
  const total = data.programacion.length;
  const completados = data.programacion.filter((r) => r.estado === 'Completado').length;
  const incidencias = data.programacion.filter((r) => r.estado === 'Incidencia').length;
  const vehiculos = new Set(data.programacion.map((r) => r.vehiculo)).size;

  resumen.innerHTML = `
    <article class="tarjeta-resumen"><strong>${total}</strong><div>Servicios programados</div></article>
    <article class="tarjeta-resumen"><strong>${vehiculos}</strong><div>Vehículos activos</div></article>
    <article class="tarjeta-resumen"><strong>${completados}</strong><div>Servicios completados</div></article>
    <article class="tarjeta-resumen"><strong>${incidencias}</strong><div>Incidencias reportadas</div></article>`;

  const grouped = Object.values(data.programacion.reduce((acc, cur) => {
    const key = `${cur.vehiculo}|${cur.conductor}`;
    if (!acc[key]) acc[key] = { vehiculo: cur.vehiculo, conductor: cur.conductor, cantidad: 0 };
    acc[key].cantidad += 1;
    return acc;
  }, {}));

  const tbody = document.getElementById('tabla-reportes');
  tbody.innerHTML = grouped
    .map((row) => `<tr><td>${row.vehiculo}</td><td>${row.conductor}</td><td>${row.cantidad}</td></tr>`)
    .join('');
}

function renderConductores() {
  const tbody = document.getElementById('tabla-conductores');
  tbody.innerHTML = '';
  data.conductores.forEach((c) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${c.codigo}</td><td>${c.nombre}</td><td>${c.telefono || ''}</td><td>${c.estado}</td>
      <td><button data-id="${c.id}" class="edit-driver">Editar</button></td>`;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll('.edit-driver').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const c = data.conductores.find((x) => x.id === id);
      const form = document.getElementById('form-conductor');
      form.dataset.editId = id;
      form.codigo.value = c.codigo;
      form.nombre.value = c.nombre;
      form.telefono.value = c.telefono;
      form.estado.value = c.estado;
    });
  });
}

function renderMantenimiento() {
  const tbody = document.getElementById('tabla-mantenimiento');
  tbody.innerHTML = '';
  data.mantenimientos.forEach((m) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${m.vehiculo}</td><td>${m.periodicidad}</td><td>${m.proximaFecha}</td><td>${m.responsable}</td>
      <td><label><input data-id="${m.id}" class="chk-cumplido" type="checkbox" ${m.cumplido ? 'checked' : ''}/> Cumplido</label></td>`;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll('.chk-cumplido').forEach((chk) => {
    chk.addEventListener('change', () => {
      const m = data.mantenimientos.find((x) => x.id === chk.getAttribute('data-id'));
      m.cumplido = chk.checked;
      addHistory(`Mantenimiento ${m.vehiculo} marcado como ${m.cumplido ? 'cumplido' : 'pendiente'}.`);
      saveData();
      renderNotificaciones();
    });
  });
}

function renderNotificaciones() {
  const ul = document.getElementById('notificaciones');
  const now = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(now.getDate() + 7);

  const notifications = data.mantenimientos
    .filter((m) => !m.cumplido)
    .filter((m) => {
      const d = new Date(`${m.proximaFecha}T00:00:00`);
      return d >= now && d <= nextWeek;
    })
    .map((m) => `Vehículo ${m.vehiculo}: mantenimiento ${m.periodicidad.toLowerCase()} el ${m.proximaFecha} (${m.responsable}).`);

  ul.innerHTML = notifications.length ? notifications.map((n) => `<li>${n}</li>`).join('') : '<li>No hay mantenimientos próximos.</li>';
}

function renderHistorial() {
  const ul = document.getElementById('historial');
  ul.innerHTML = data.historial.map((h) => `<li>${h}</li>`).join('');
}

function importExcel(file, mapper) {
  const reader = new FileReader();
  reader.onload = (event) => {
    const workbook = XLSX.read(event.target.result, { type: 'array' });
    const first = workbook.SheetNames[0];
    const json = XLSX.utils.sheet_to_json(workbook.Sheets[first], { defval: '' });
    mapper(json);
    saveData();
    renderAll();
  };
  reader.readAsArrayBuffer(file);
}

function setupEvents() {
  document.getElementById('form-programacion').addEventListener('submit', (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const item = Object.fromEntries(new FormData(form).entries());
    data.programacion.push({ id: crypto.randomUUID(), ...item, estado: 'Programado', observacion: '' });
    addHistory(`Servicio agregado manualmente: ${item.servicio} (${item.turno}).`);
    form.reset();
    saveData();
    renderAll();
  });

  document.getElementById('excel-programacion').addEventListener('change', (e) => {
    const [file] = e.target.files;
    if (!file) return;
    importExcel(file, (rows) => {
      rows.forEach((r) => {
        const item = {
          id: crypto.randomUUID(),
          fecha: String(r.fecha || r.FECHA || '').slice(0, 10),
          faena: r.faena || r.FAENA || '',
          turno: r.turno || r.TURNO || '',
          servicio: r.servicio || r.SERVICIO || '',
          hora: r.hora || r.HORA || '',
          vehiculo: r.vehiculo || r.vehículo || r.BUS || r.VAN || '',
          conductor: r.conductor || r.CONDUCTOR || '',
          pasajeros: r.pasajeros || '',
          estado: 'Programado',
          observacion: ''
        };
        if (item.servicio && item.conductor) data.programacion.push(item);
      });
      addHistory(`Carga masiva de programación: ${rows.length} filas procesadas.`);
    });
  });

  document.getElementById('form-conductor').addEventListener('submit', (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const row = Object.fromEntries(new FormData(form).entries());
    if (form.dataset.editId) {
      const driver = data.conductores.find((d) => d.id === form.dataset.editId);
      Object.assign(driver, row);
      addHistory(`Conductor actualizado: ${row.codigo} ${row.nombre}.`);
      delete form.dataset.editId;
    } else {
      data.conductores.push({ id: crypto.randomUUID(), ...row });
      addHistory(`Conductor agregado: ${row.codigo} ${row.nombre}.`);
    }
    form.reset();
    saveData();
    renderConductores();
  });

  document.getElementById('excel-conductores').addEventListener('change', (e) => {
    const [file] = e.target.files;
    if (!file) return;
    importExcel(file, (rows) => {
      rows.forEach((r) => {
        const codigo = String(r.codigo || r.CODIGO || r.CÓDIGO || '');
        const nombre = r.nombre || r.NOMBRE || '';
        if (!codigo || !nombre) return;
        const existing = data.conductores.find((d) => d.codigo === codigo);
        if (existing) {
          existing.nombre = nombre;
          existing.telefono = r.telefono || r.TELEFONO || existing.telefono;
          existing.estado = r.estado || r.ESTADO || existing.estado;
        } else {
          data.conductores.push({
            id: crypto.randomUUID(),
            codigo,
            nombre,
            telefono: r.telefono || r.TELEFONO || '',
            estado: r.estado || r.ESTADO || 'Activo'
          });
        }
      });
      addHistory(`Carga masiva de conductores: ${rows.length} filas procesadas.`);
    });
  });

  document.getElementById('form-mantenimiento').addEventListener('submit', (e) => {
    e.preventDefault();
    const row = Object.fromEntries(new FormData(e.currentTarget).entries());
    data.mantenimientos.push({ id: crypto.randomUUID(), ...row, cumplido: false });
    addHistory(`Mantenimiento programado para vehículo ${row.vehiculo} (${row.periodicidad}).`);
    e.currentTarget.reset();
    saveData();
    renderMantenimiento();
    renderNotificaciones();
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
}

setupEvents();
renderAll();
