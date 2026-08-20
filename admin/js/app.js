/**
 * LaboraGT Admin Panel
 */

const AdminApp = {
  root: null,
  currentPage: 'dashboard',
  usersCache: [],

  canWriteUsers() {
    const u = API.getUser() || {};
    return ['jefe', 'admin', 'administrador'].includes(u.rol);
  },

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
      </div>`;

    document.getElementById('login-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const codigo = document.getElementById('codigo').value.trim();
      const activacion = document.getElementById('activacion').value.trim();
      const btn = document.getElementById('btn-login');
      btn.disabled = true;
      btn.textContent = 'Verificando…';
      try {
        const res = await API.login(codigo, activacion);
        if (!['jefe', 'admin', 'administrador', 'auditor'].includes(res.user.rol)) {
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
            <a href="#" data-page="permissions">Permisos</a>
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
      <div id="modal-root"></div>`;

    document.getElementById('topbar-date').textContent =
      new Date().toLocaleDateString('es-GT', {
        timeZone: 'America/Guatemala',
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      }) + ' · America/Guatemala';

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
    const titles = {
      dashboard: 'Dashboard',
      users: 'Usuarios',
      attendance: 'Marcajes',
      incidents: 'Incidencias',
      permissions: 'Permisos especiales'
    };
    document.getElementById('page-title').textContent = titles[page] || page;
    if (page === 'dashboard') this.loadDashboard();
    else if (page === 'users') this.loadUsers();
    else if (page === 'attendance') this.loadAttendance();
    else if (page === 'incidents') this.loadIncidents();
    else if (page === 'permissions') this.loadPermissions();
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
        <p style="margin-top:12px;font-size:12px;color:#94a3b8">
          Fuente: ${d.data_source || 'mock'} · ${d.fecha || ''} · ${d.timezone || 'America/Guatemala'}
        </p>`;
    } catch (err) {
      if (err.status === 401 || err.status === 403) { API.clearAuth(); this.showLogin(err.message); return; }
      el.innerHTML = `<div class="error-box">${err.message}</div>`;
    }
  },

  /* ---------- USUARIOS CRUD ---------- */

  async loadUsers() {
    const el = document.getElementById('page-content');
    el.innerHTML = '<p>Cargando usuarios…</p>';
    try {
      const res = await API.getUsers();
      this.usersCache = res.data || [];
      this.renderUsersTable(this.usersCache);
    } catch (err) {
      el.innerHTML = `<div class="error-box">${err.message}</div>`;
    }
  },

  renderUsersTable(list) {
    const el = document.getElementById('page-content');
    const canWrite = this.canWriteUsers();
    const q = (document.getElementById('user-search') || {}).value || '';
    const filtered = q
      ? list.filter((u) => {
          const s = (u.codigo_empleado + ' ' + u.nombre + ' ' + u.apellidos + ' ' + (u.cargo || '')).toLowerCase();
          return s.includes(q.toLowerCase());
        })
      : list;

    el.innerHTML = `
      <div class="toolbar">
        <input type="search" id="user-search" placeholder="Buscar por código, nombre…" value="${q.replace(/"/g, '')}" />
        ${canWrite ? '<button type="button" class="btn btn-primary" style="width:auto" id="btn-new-user">+ Nuevo usuario</button>' : ''}
      </div>
      <div class="card">
        <div class="card-header">Colaboradores (${filtered.length})</div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Código</th><th>Nombre</th><th>Cargo</th><th>Rol</th><th>Estado</th>
                ${canWrite ? '<th>Acciones</th>' : ''}
              </tr>
            </thead>
            <tbody>
              ${filtered.length ? filtered.map((u) => `
                <tr data-id="${u.id}">
                  <td><code>${u.codigo_empleado}</code></td>
                  <td>${u.nombre} ${u.apellidos}</td>
                  <td>${u.cargo || '—'}</td>
                  <td><span class="badge badge-info">${u.rol}</span></td>
                  <td>${this.badgeEstadoUsuario(u.estado)}</td>
                  ${canWrite ? `<td class="actions-cell">
                    <button type="button" class="btn-link" data-edit="${u.id}">Editar</button>
                    ${u.estado === 'activo'
                      ? `<button type="button" class="btn-link danger" data-deactivate="${u.id}">Desactivar</button>`
                      : `<button type="button" class="btn-link" data-activate="${u.id}">Activar</button>`}
                  </td>` : ''}
                </tr>`).join('') : '<tr><td colspan="6" class="empty">Sin usuarios</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>`;

    const search = document.getElementById('user-search');
    if (search) {
      search.addEventListener('input', () => this.renderUsersTable(this.usersCache));
      search.focus();
      const len = search.value.length;
      search.setSelectionRange(len, len);
    }

    const btnNew = document.getElementById('btn-new-user');
    if (btnNew) btnNew.addEventListener('click', () => this.openUserModal(null));

    el.querySelectorAll('[data-edit]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const u = this.usersCache.find((x) => x.id === btn.dataset.edit);
        this.openUserModal(u || null);
      });
    });
    el.querySelectorAll('[data-deactivate]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm('¿Desactivar este usuario? No podrá marcar jornada.')) return;
        try {
          await API.deactivateUser(btn.dataset.deactivate);
          this.loadUsers();
        } catch (err) {
          alert(err.message);
        }
      });
    });
    el.querySelectorAll('[data-activate]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        try {
          await API.updateUser(btn.dataset.activate, { estado: 'activo' });
          this.loadUsers();
        } catch (err) {
          alert(err.message);
        }
      });
    });
  },

  badgeEstadoUsuario(estado) {
    const map = {
      activo: 'badge-success',
      inactivo: 'badge-neutral',
      suspendido: 'badge-danger'
    };
    return `<span class="badge ${map[estado] || 'badge-neutral'}">${estado || '—'}</span>`;
  },

  openUserModal(user) {
    const isEdit = !!user;
    const jefes = this.usersCache.filter(
      (u) => ['jefe', 'admin', 'administrador'].includes(u.rol) && (!user || u.id !== user.id)
    );
    const h = user?.horario || {};
    const ubi = user?.ubicacion || {};

    const root = document.getElementById('modal-root');
    root.innerHTML = `
      <div class="modal-backdrop" id="modal-backdrop">
        <div class="modal-panel" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <div class="modal-header">
            <h3 id="modal-title">${isEdit ? 'Editar usuario' : 'Nuevo usuario'}</h3>
            <button type="button" class="modal-close" id="modal-close" aria-label="Cerrar">×</button>
          </div>
          <form id="user-form" class="modal-body">
            <div class="form-grid">
              <div class="form-group">
                <label for="f-codigo">Código empleado *</label>
                <input id="f-codigo" required value="${user?.codigo_empleado || ''}" ${isEdit ? 'readonly' : ''} />
              </div>
              <div class="form-group">
                <label for="f-dpi">DPI</label>
                <input id="f-dpi" value="${user?.dpi || ''}" />
              </div>
              <div class="form-group">
                <label for="f-nombre">Nombre *</label>
                <input id="f-nombre" required value="${user?.nombre || ''}" />
              </div>
              <div class="form-group">
                <label for="f-apellidos">Apellidos *</label>
                <input id="f-apellidos" required value="${user?.apellidos || ''}" />
              </div>
              <div class="form-group">
                <label for="f-correo">Correo</label>
                <input id="f-correo" type="email" value="${user?.correo || ''}" />
              </div>
              <div class="form-group">
                <label for="f-telefono">Teléfono</label>
                <input id="f-telefono" value="${user?.telefono || ''}" />
              </div>
              <div class="form-group">
                <label for="f-dependencia">Dependencia</label>
                <input id="f-dependencia" value="${user?.dependencia || ''}" />
              </div>
              <div class="form-group">
                <label for="f-unidad">Unidad</label>
                <input id="f-unidad" value="${user?.unidad || ''}" />
              </div>
              <div class="form-group">
                <label for="f-cargo">Cargo</label>
                <input id="f-cargo" value="${user?.cargo || ''}" />
              </div>
              <div class="form-group">
                <label for="f-rol">Rol *</label>
                <select id="f-rol" required>
                  ${['colaborador', 'jefe', 'administrador', 'auditor'].map(
                    (r) => `<option value="${r}" ${(user?.rol || 'colaborador') === r ? 'selected' : ''}>${r}</option>`
                  ).join('')}
                </select>
              </div>
              <div class="form-group">
                <label for="f-estado">Estado</label>
                <select id="f-estado">
                  ${['activo', 'inactivo', 'suspendido'].map(
                    (s) => `<option value="${s}" ${(user?.estado || 'activo') === s ? 'selected' : ''}>${s}</option>`
                  ).join('')}
                </select>
              </div>
              <div class="form-group">
                <label for="f-jefe">Jefe inmediato</label>
                <select id="f-jefe">
                  <option value="">— Ninguno —</option>
                  ${jefes.map(
                    (j) => `<option value="${j.id}" ${user?.jefe_inmediato_id === j.id ? 'selected' : ''}>
                      ${j.nombre} ${j.apellidos} (${j.codigo_empleado})</option>`
                  ).join('')}
                </select>
              </div>
              <div class="form-group">
                <label for="f-activacion">Código activación ${isEdit ? '' : '*'}</label>
                <input id="f-activacion" ${isEdit ? '' : 'required'} value="${user?.codigo_activacion || ''}"
                  placeholder="${isEdit ? 'Dejar vacío para no cambiar' : 'Ej. ACT-2026'}" />
              </div>
            </div>

            <h4 class="form-section-title">Horario</h4>
            <div class="form-grid form-grid-4">
              <div class="form-group">
                <label for="f-he">Entrada</label>
                <input id="f-he" type="time" value="${(h.hora_entrada || '08:00').slice(0, 5)}" />
              </div>
              <div class="form-group">
                <label for="f-hs">Salida</label>
                <input id="f-hs" type="time" value="${(h.hora_salida || '17:00').slice(0, 5)}" />
              </div>
              <div class="form-group">
                <label for="f-ia">Inicio almuerzo</label>
                <input id="f-ia" type="time" value="${(h.inicio_almuerzo || '12:00').slice(0, 5)}" />
              </div>
              <div class="form-group">
                <label for="f-fa">Fin almuerzo</label>
                <input id="f-fa" type="time" value="${(h.fin_almuerzo || '13:00').slice(0, 5)}" />
              </div>
            </div>

            <h4 class="form-section-title">Ubicación autorizada</h4>
            <div class="form-grid">
              <div class="form-group">
                <label for="f-ubi-nombre">Nombre sede</label>
                <input id="f-ubi-nombre" value="${ubi.nombre || 'Sede Central'}" />
              </div>
              <div class="form-group">
                <label for="f-radio">Radio (m)</label>
                <input id="f-radio" type="number" min="10" value="${ubi.radio_metros ?? 100}" />
              </div>
              <div class="form-group">
                <label for="f-lat">Latitud</label>
                <input id="f-lat" type="number" step="any" value="${ubi.latitud ?? 14.6349}" />
              </div>
              <div class="form-group">
                <label for="f-lng">Longitud</label>
                <input id="f-lng" type="number" step="any" value="${ubi.longitud ?? -90.5069}" />
              </div>
            </div>

            <div id="form-msg"></div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" id="modal-cancel">Cancelar</button>
              <button type="submit" class="btn btn-primary" style="width:auto" id="btn-save-user">
                ${isEdit ? 'Guardar cambios' : 'Crear usuario'}
              </button>
            </div>
          </form>
        </div>
      </div>`;

    const close = () => { root.innerHTML = ''; };
    document.getElementById('modal-close').addEventListener('click', close);
    document.getElementById('modal-cancel').addEventListener('click', close);
    document.getElementById('modal-backdrop').addEventListener('click', (e) => {
      if (e.target.id === 'modal-backdrop') close();
    });

    document.getElementById('user-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('btn-save-user');
      const msg = document.getElementById('form-msg');
      btn.disabled = true;
      btn.textContent = 'Guardando…';

      const payload = {
        codigo_empleado: document.getElementById('f-codigo').value.trim(),
        dpi: document.getElementById('f-dpi').value.trim(),
        nombre: document.getElementById('f-nombre').value.trim(),
        apellidos: document.getElementById('f-apellidos').value.trim(),
        correo: document.getElementById('f-correo').value.trim(),
        telefono: document.getElementById('f-telefono').value.trim(),
        dependencia: document.getElementById('f-dependencia').value.trim(),
        unidad: document.getElementById('f-unidad').value.trim(),
        cargo: document.getElementById('f-cargo').value.trim(),
        rol: document.getElementById('f-rol').value,
        estado: document.getElementById('f-estado').value,
        jefe_inmediato_id: document.getElementById('f-jefe').value || null,
        codigo_activacion: document.getElementById('f-activacion').value.trim(),
        hora_entrada: document.getElementById('f-he').value,
        hora_salida: document.getElementById('f-hs').value,
        inicio_almuerzo: document.getElementById('f-ia').value,
        fin_almuerzo: document.getElementById('f-fa').value,
        ubicacion_nombre: document.getElementById('f-ubi-nombre').value.trim(),
        radio_metros: Number(document.getElementById('f-radio').value),
        latitud: Number(document.getElementById('f-lat').value),
        longitud: Number(document.getElementById('f-lng').value)
      };

      try {
        if (isEdit) {
          if (!payload.codigo_activacion) delete payload.codigo_activacion;
          await API.updateUser(user.id, payload);
        } else {
          await API.createUser(payload);
        }
        close();
        this.loadUsers();
      } catch (err) {
        msg.innerHTML = `<div class="error-box">${err.message}</div>`;
        btn.disabled = false;
        btn.textContent = isEdit ? 'Guardar cambios' : 'Crear usuario';
      }
    });
  },

  async loadAttendance() {
    const el = document.getElementById('page-content');
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Guatemala' });
    el.innerHTML = `
      <div class="filters">
        <input type="date" id="filter-fecha" value="${today}" />
        <button class="btn btn-primary" style="width:auto" id="btn-filtrar">Filtrar</button>
      </div>
      <div id="attendance-table"><p>Cargando…</p></div>`;
    const load = async () => {
      try {
        const res = await API.getAttendance({ fecha: document.getElementById('filter-fecha').value });
        const list = res.data || [];
        const container = document.getElementById('attendance-table');
        if (!list.length) {
          container.innerHTML = '<div class="card"><div class="empty">Sin marcajes</div></div>';
          return;
        }
        container.innerHTML = `
          <div class="card"><div class="card-header">Marcajes (${list.length})</div>
          <div class="table-wrap"><table>
            <thead><tr><th>Hora</th><th>Colaborador</th><th>Tipo</th><th>Estado</th></tr></thead>
            <tbody>${list.map(m => `<tr>
              <td>${m.hora}</td><td>${m.nombre_usuario}</td><td>${m.tipo}</td>
              <td>${this.badgeEstado(m.estado)}</td></tr>`).join('')}
            </tbody></table></div></div>`;
      } catch (err) {
        document.getElementById('attendance-table').innerHTML = `<div class="error-box">${err.message}</div>`;
      }
    };
    document.getElementById('btn-filtrar').addEventListener('click', load);
    load();
  },

  async loadIncidents() {
    const el = document.getElementById('page-content');
    el.innerHTML = '<p>Cargando…</p>';
    try {
      const res = await API.getIncidents();
      const list = res.data || [];
      el.innerHTML = list.length
        ? `<div class="card"><div class="card-header">Incidencias</div>
           <div class="table-wrap"><table><thead><tr><th>Fecha</th><th>Usuario</th><th>Estado</th></tr></thead>
           <tbody>${list.map(i => `<tr><td>${i.fecha}</td><td>${i.usuario}</td><td>${this.badgeEstado(i.estado)}</td></tr>`).join('')}
           </tbody></table></div></div>`
        : '<div class="card"><div class="empty">Sin incidencias</div></div>';
    } catch (err) {
      el.innerHTML = `<div class="error-box">${err.message}</div>`;
    }
  },

  async loadPermissions() {
    const el = document.getElementById('page-content');
    el.innerHTML = '<p>Cargando solicitudes…</p>';
    try {
      const res = await API.getTeamPermissions();
      const list = res.data || [];
      if (!list.length) {
        el.innerHTML = '<div class="card"><div class="empty">No hay solicitudes de permiso</div></div>';
        return;
      }
      el.innerHTML = `
        <div class="card">
          <div class="card-header">Solicitudes de permiso (${list.length})</div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th><th>Colaborador</th><th>Motivo</th>
                  <th>Horario</th><th>Cubre</th><th>Estado</th><th>Acción</th>
                </tr>
              </thead>
              <tbody>
                ${list.map(p => {
                  const col = p.colaborador
                    ? p.colaborador.nombre + ' ' + p.colaborador.apellidos
                    : p.nombre_usuario;
                  const actions =
                    p.estado === 'PENDIENTE'
                      ? `<button class="btn btn-primary" style="width:auto;min-height:32px;padding:6px 10px;font-size:12px" data-approve="${p.id}">Aprobar</button>
                         <button class="btn btn-secondary" style="width:auto;min-height:32px;padding:6px 10px;font-size:12px;margin-left:4px" data-reject="${p.id}">Rechazar</button>`
                      : '—';
                  return `<tr>
                    <td>${p.fecha}</td>
                    <td>${col}</td>
                    <td>${p.motivo_label || p.motivo}</td>
                    <td>${p.hora_inicio}–${p.hora_fin}</td>
                    <td style="font-size:12px">${(p.tipos_cubiertos || []).join(', ')}</td>
                    <td>${this.badgeEstado(p.estado)}</td>
                    <td>${actions}</td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>`;

      el.querySelectorAll('[data-approve]').forEach(btn => {
        btn.addEventListener('click', async () => {
          btn.disabled = true;
          try {
            await API.decidePermission(btn.dataset.approve, 'APROBAR', 'Autorizado');
            this.loadPermissions();
          } catch (err) {
            alert(err.message);
            btn.disabled = false;
          }
        });
      });
      el.querySelectorAll('[data-reject]').forEach(btn => {
        btn.addEventListener('click', async () => {
          const c = prompt('Motivo del rechazo (opcional):') || 'Rechazado';
          btn.disabled = true;
          try {
            await API.decidePermission(btn.dataset.reject, 'RECHAZAR', c);
            this.loadPermissions();
          } catch (err) {
            alert(err.message);
            btn.disabled = false;
          }
        });
      });
    } catch (err) {
      el.innerHTML = `<div class="error-box">${err.message}</div>`;
    }
  },

  badgeEstado(estado) {
    const map = {
      VALIDO: 'badge-success',
      TARDIO: 'badge-warning',
      APROBADO: 'badge-success',
      PENDIENTE: 'badge-warning',
      RECHAZADO: 'badge-danger',
      PERMISO_ESPECIAL: 'badge-info',
      FUERA_DE_UBICACION: 'badge-danger',
      activo: 'badge-success',
      inactivo: 'badge-neutral'
    };
    return `<span class="badge ${map[estado] || 'badge-neutral'}">${estado || '—'}</span>`;
  }
};

document.addEventListener('DOMContentLoaded', () => AdminApp.init());
