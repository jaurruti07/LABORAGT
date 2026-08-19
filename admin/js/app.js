/**
 * LaboraGT Admin Panel
 */

const AdminApp = {
  root: null,
  currentPage: 'dashboard',

  init() {
    this.root = document.getElementById('app');
    if (API.getToken()) this.showLayout();
    else this.showLogin();
  },

  showLogin(errorMsg = '') {
    this.root.innerHTML = `
      <div class="login-wrap">
        <div class="login-card">
          <h1>LaboraGT Admin</h1>
          <p class="sub">Panel de administración</p>
          ${errorMsg ? `<div class="error-box">${errorMsg}</div>` : ''}
          <form id="login-form">
            <div class="form-group">
              <label>Código de empleado o DPI</label>
              <input id="codigo" type="text" required placeholder="EMP-002" />
            </div>
            <div class="form-group">
              <label>Código de activación</label>
              <input id="activacion" type="text" required placeholder="ACT-2026" />
            </div>
            <button type="submit" class="btn btn-primary" id="btn-login">Ingresar</button>
          </form>
          <p style="margin-top:16px;font-size:12px;color:#94a3b8">Demo jefe: EMP-002 / ACT-2026</p>
        </div>
      </div>
    `;

    document.getElementById('login-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const codigo = document.getElementById('codigo').value.trim();
      const activacion = document.getElementById('activacion').value.trim();
      const btn = document.getElementById('btn-login');
      btn.disabled = true;
      btn.textContent = 'Verificando…';
      try {
        const res = await API.login(codigo, activacion);
        if (!['jefe', 'admin', 'auditor'].includes(res.user.rol)) {
          throw new Error('Este usuario no tiene acceso al panel administrativo');
        }
        API.setToken(res.token);
        API.setUser(res.user);
        this.showLayout();
      } catch (err) {
        this.showLogin(err.message);
      }
    });
  },

  showLayout() {
    const user = API.getUser() || {};
    this.root.innerHTML = `
      <div class="layout">
        <aside class="sidebar">
          <div class="sidebar-brand">LaboraGT</div>
          <nav>
            <a href="#" data-page="dashboard" class="active">Dashboard</a>
            <a href="#" data-page="users">Usuarios</a>
            <a href="#" data-page="attendance">Marcajes</a>
            <a href="#" data-page="incidents">Incidencias</a>
          </nav>
          <div class="sidebar-footer">
            ${user.nombre || ''} ${user.apellidos || ''}<br>
            <span style="opacity:0.7">${user.rol || ''}</span><br>
            <a href="#" id="btn-logout" style="color:#fff;margin-top:8px;display:inline-block">Cerrar sesión</a>
          </div>
        </aside>
        <div class="main">
          <div class="topbar">
            <h2 id="page-title">Dashboard</h2>
            <span style="font-size:13px;color:#64748b" id="topbar-date"></span>
          </div>
          <div class="content" id="page-content"><p>Cargando…</p></div>
        </div>
      </div>
    `;

    document.getElementById('topbar-date').textContent =
      new Date().toLocaleDateString('es-GT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    document.querySelectorAll('.sidebar nav a').forEach(a => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelectorAll('.sidebar nav a').forEach(x => x.classList.remove('active'));
        a.classList.add('active');
        this.navigate(a.dataset.page);
      });
    });

    document.getElementById('btn-logout').addEventListener('click', (e) => {
      e.preventDefault();
      API.clearAuth();
      this.showLogin();
    });

    this.navigate('dashboard');
  },

  navigate(page) {
    this.currentPage = page;
    const titles = { dashboard: 'Dashboard', users: 'Usuarios', attendance: 'Marcajes', incidents: 'Incidencias' };
    document.getElementById('page-title').textContent = titles[page] || page;
    if (page === 'dashboard') this.loadDashboard();
    else if (page === 'users') this.loadUsers();
    else if (page === 'attendance') this.loadAttendance();
    else if (page === 'incidents') this.loadIncidents();
  },

  async loadDashboard() {
    const el = document.getElementById('page-content');
    el.innerHTML = '<p>Cargando indicadores…</p>';
    try {
      const res = await API.getDashboard();
      const d = res.data;
      el.innerHTML = `
        <div class="kpi-grid">
          <div class="kpi-card"><div class="label">Colaboradores activos</div><div class="value">${d.colaboradores_activos}</div></div>
          <div class="kpi-card"><div class="label">Marcajes del día</div><div class="value">${d.marcajes_hoy}</div></div>
          <div class="kpi-card"><div class="label">Entradas tardías</div><div class="value warning">${d.entradas_tardias}</div></div>
          <div class="kpi-card"><div class="label">Fuera de ubicación</div><div class="value danger">${d.fuera_ubicacion}</div></div>
          <div class="kpi-card"><div class="label">Cumplimiento</div><div class="value success">${d.cumplimiento_pct}%</div></div>
          <div class="kpi-card"><div class="label">Incidencias</div><div class="value">${d.incidencias_pendientes}</div></div>
        </div>
        <div class="card">
          <div class="card-header">Últimas incidencias del día</div>
          <div class="table-wrap">
            ${d.ultimas_incidencias.length === 0
              ? '<div class="empty">Sin incidencias registradas hoy</div>'
              : `<table><thead><tr><th>Hora</th><th>Colaborador</th><th>Tipo</th><th>Estado</th><th>Detalle</th></tr></thead>
                <tbody>${d.ultimas_incidencias.map(i => `
                  <tr><td>${i.hora}</td><td>${i.usuario}</td><td>${i.tipo}</td>
                  <td>${this.badgeEstado(i.estado)}</td>
                  <td style="font-size:13px;color:#64748b">${i.detalle || '—'}</td></tr>`).join('')}
                </tbody></table>`}
          </div>
        </div>`;
    } catch (err) {
      if (err.status === 401 || err.status === 403) { API.clearAuth(); this.showLogin(err.message); return; }
      el.innerHTML = `<div class="error-box">${err.message}</div>`;
    }
  },

  async loadUsers() {
    const el = document.getElementById('page-content');
    el.innerHTML = '<p>Cargando usuarios…</p>';
    try {
      const res = await API.getUsers();
      const list = res.data || [];
      el.innerHTML = `
        <div class="card">
          <div class="card-header">Colaboradores (${list.length})</div>
          <div class="table-wrap">
            <table>
              <thead><tr><th>Código</th><th>Nombre</th><th>Dependencia</th><th>Cargo</th><th>Rol</th><th>Estado</th></tr></thead>
              <tbody>${list.map(u => `
                <tr>
                  <td>${u.codigo_empleado}</td>
                  <td>${u.nombre} ${u.apellidos}</td>
                  <td>${u.dependencia || '—'}</td>
                  <td>${u.cargo || '—'}</td>
                  <td><span class="badge badge-info">${u.rol}</span></td>
                  <td>${u.estado === 'activo'
                    ? '<span class="badge badge-success">Activo</span>'
                    : '<span class="badge badge-neutral">' + u.estado + '</span>'}</td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>`;
    } catch (err) {
      el.innerHTML = `<div class="error-box">${err.message}</div>`;
    }
  },

  async loadAttendance() {
    const el = document.getElementById('page-content');
    const today = new Date().toISOString().slice(0, 10);
    el.innerHTML = `
      <div class="filters">
        <input type="date" id="filter-fecha" value="${today}" />
        <select id="filter-estado">
          <option value="">Todos los estados</option>
          <option value="VALIDO">Válido</option>
          <option value="TARDIO">Tardío</option>
          <option value="FUERA_DE_UBICACION">Fuera de ubicación</option>
          <option value="TARDIO_Y_FUERA_DE_UBICACION">Tardío + Fuera</option>
        </select>
        <button class="btn btn-primary" style="width:auto" id="btn-filtrar">Filtrar</button>
      </div>
      <div id="attendance-table"><p>Cargando…</p></div>`;

    const load = async () => {
      const fecha = document.getElementById('filter-fecha').value;
      const estado = document.getElementById('filter-estado').value;
      const params = {};
      if (fecha) params.fecha = fecha;
      if (estado) params.estado = estado;
      try {
        const res = await API.getAttendance(params);
        const list = res.data || [];
        const container = document.getElementById('attendance-table');
        if (list.length === 0) {
          container.innerHTML = '<div class="card"><div class="empty">No hay marcajes para los filtros seleccionados</div></div>';
          return;
        }
        container.innerHTML = `
          <div class="card">
            <div class="card-header">Marcajes (${list.length})</div>
            <div class="table-wrap">
              <table>
                <thead><tr><th>Fecha</th><th>Hora</th><th>Colaborador</th><th>Tipo</th><th>Estado</th><th>Distancia</th><th>Horario</th></tr></thead>
                <tbody>${list.map(m => `
                  <tr>
                    <td>${m.fecha}</td><td>${m.hora}</td><td>${m.nombre_usuario}</td><td>${m.tipo}</td>
                    <td>${this.badgeEstado(m.estado)}</td>
                    <td>${m.distancia_metros != null ? m.distancia_metros + ' m' : '—'}</td>
                    <td>${m.cumplimiento_horario || '—'}</td>
                  </tr>`).join('')}
                </tbody>
              </table>
            </div>
          </div>`;
      } catch (err) {
        document.getElementById('attendance-table').innerHTML = `<div class="error-box">${err.message}</div>`;
      }
    };
    document.getElementById('btn-filtrar').addEventListener('click', load);
    load();
  },

  async loadIncidents() {
    const el = document.getElementById('page-content');
    el.innerHTML = '<p>Cargando incidencias…</p>';
    try {
      const res = await API.getIncidents();
      const list = res.data || [];
      if (list.length === 0) {
        el.innerHTML = '<div class="card"><div class="empty">No hay incidencias registradas</div></div>';
        return;
      }
      el.innerHTML = `
        <div class="card">
          <div class="card-header">Incidencias (${list.length})</div>
          <div class="table-wrap">
            <table>
              <thead><tr><th>Fecha</th><th>Hora</th><th>Colaborador</th><th>Tipo</th><th>Estado</th><th>Detalle</th></tr></thead>
              <tbody>${list.map(i => `
                <tr>
                  <td>${i.fecha}</td><td>${i.hora}</td><td>${i.usuario}</td><td>${i.tipo_marcaje}</td>
                  <td>${this.badgeEstado(i.estado)}</td>
                  <td style="font-size:13px;color:#64748b">${(i.incidencias || []).map(x => x.descripcion).join(' · ') || '—'}</td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>`;
    } catch (err) {
      el.innerHTML = `<div class="error-box">${err.message}</div>`;
    }
  },

  badgeEstado(estado) {
    const map = {
      VALIDO: 'badge-success', TARDIO: 'badge-warning', SALIDA_ANTICIPADA: 'badge-warning',
      FUERA_DE_UBICACION: 'badge-danger', TARDIO_Y_FUERA_DE_UBICACION: 'badge-danger', JUSTIFICADO: 'badge-info'
    };
    return `<span class="badge ${map[estado] || 'badge-neutral'}">${estado || '—'}</span>`;
  }
};

document.addEventListener('DOMContentLoaded', () => AdminApp.init());
