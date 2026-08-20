/**
 * Fachada de datos
 * DATA_SOURCE=mock   → mockData (memoria)
 * DATA_SOURCE=sheets → Google Sheets + caché en memoria (API síncrona para servicios)
 */

const mock = require('./mockData');
const sheetsClient = require('./sheetsClient');

const mode = (process.env.DATA_SOURCE || 'mock').toLowerCase();
const useSheets = mode === 'sheets' && sheetsClient.isConfigured();

let store = mock;
let ready = !useSheets;
let initError = null;

if (useSheets) {
  const mem = {
    users: [],
    attendanceStore: [],
    permissionStore: [],
    findUserByCodigoOrDpi(codigoOrDpi) {
      return mem.users.find(
        (u) => u.codigo_empleado === codigoOrDpi || u.dpi === codigoOrDpi
      );
    },
    findUserById(id) {
      return mem.users.find((u) => u.id === id);
    },
    createUser(user) {
      mem.users.push(user);
      persistAllUsers().catch((err) =>
        console.error('[sheets] createUser', err.message)
      );
      return user;
    },
    updateUser(user) {
      const idx = mem.users.findIndex((u) => u.id === user.id);
      if (idx >= 0) mem.users[idx] = user;
      else mem.users.push(user);
      persistAllUsers().catch((err) =>
        console.error('[sheets] updateUser', err.message)
      );
      return user;
    },
    getTodayAttendance(userId) {
      const { fechaGT } = require('../utils/time');
      const fecha = fechaGT();
      return mem.attendanceStore.filter(
        (m) => m.usuario_id === userId && m.fecha === fecha
      );
    },
    addAttendance(record) {
      mem.attendanceStore.push(record);
      persistAttendance(record).catch((err) =>
        console.error('[sheets] append marcaje', err.message)
      );
      return record;
    },
    getAttendanceHistory(userId, from, to) {
      return mem.attendanceStore.filter((m) => {
        if (m.usuario_id !== userId) return false;
        if (from && m.fecha < from) return false;
        if (to && m.fecha > to) return false;
        return true;
      });
    },
    addPermission(record) {
      mem.permissionStore.push(record);
      persistPermission(record).catch((err) =>
        console.error('[sheets] append permiso', err.message)
      );
      return record;
    },
    findPermissionById(id) {
      return mem.permissionStore.find((p) => p.id === id);
    },
    getPermissionsByUser(userId) {
      return mem.permissionStore.filter((p) => p.usuario_id === userId);
    },
    getApprovedPermissionTypes(userId, fecha) {
      const set = new Set();
      mem.permissionStore
        .filter(
          (p) =>
            p.usuario_id === userId &&
            p.fecha === fecha &&
            p.estado === 'APROBADO'
        )
        .forEach((p) => (p.tipos_cubiertos || []).forEach((t) => set.add(t)));
      return [...set];
    },
    updatePermission(perm) {
      const idx = mem.permissionStore.findIndex((p) => p.id === perm.id);
      if (idx >= 0) mem.permissionStore[idx] = perm;
      else mem.permissionStore.push(perm);
      persistAllPermissions().catch((err) =>
        console.error('[sheets] update permisos', err.message)
      );
      return perm;
    }
  };

  store = mem;

  initFromSheets()
    .then(() => {
      ready = true;
      console.log(
        `[data] Google Sheets listo · usuarios=${mem.users.length} marcajes=${mem.attendanceStore.length} permisos=${mem.permissionStore.length}`
      );
    })
    .catch((err) => {
      initError = err.message;
      ready = false;
      console.error('[data] Error cargando Sheets:', err.message);
    });

  async function initFromSheets() {
    const sheetsData = require('./sheetsData');
    const [users, attendance, permissions] = await Promise.all([
      sheetsData.loadUsers(true),
      sheetsData.loadAttendance(true),
      sheetsData.loadPermissions(true)
    ]);
    mem.users = users;
    mem.attendanceStore = attendance;
    mem.permissionStore = permissions;
  }

  async function persistAttendance(record) {
    const sheetsData = require('./sheetsData');
    await sheetsData.addAttendance(record);
  }

  async function persistPermission(record) {
    const sheetsData = require('./sheetsData');
    await sheetsData.addPermission(record);
  }

  async function persistAllPermissions() {
    const sheetsData = require('./sheetsData');
    const client = require('./sheetsClient');
    const headers = sheetsData.PERM_HEADERS;
    const rows = [headers].concat(
      mem.permissionStore.map((p) => [
        p.id,
        p.usuario_id,
        p.nombre_usuario,
        p.fecha,
        p.hora_inicio,
        p.hora_fin,
        p.motivo,
        p.motivo_label || '',
        p.descripcion || '',
        JSON.stringify(p.tipos_cubiertos || []),
        p.estado,
        p.aprobado_por || '',
        p.aprobado_at || '',
        p.comentario_jefe || '',
        p.created_at || '',
        p.timezone || 'America/Guatemala'
      ])
    );
    await client.writeRange('PERMISOS!A1', rows);
  }

  async function persistAllUsers() {
    const sheetsData = require('./sheetsData');
    const client = require('./sheetsClient');
    const headers = sheetsData.USER_HEADERS;
    const rows = [headers].concat(
      mem.users.map((u) => [
        u.id,
        u.codigo_empleado,
        u.dpi || '',
        u.nombre,
        u.apellidos,
        u.correo || '',
        u.telefono || '',
        u.dependencia || '',
        u.unidad || '',
        u.cargo || '',
        u.jefe_inmediato_id || '',
        u.horario?.id || 'hor-001',
        u.horario?.hora_entrada || '08:00',
        u.horario?.hora_salida || '17:00',
        u.horario?.inicio_almuerzo || '12:00',
        u.horario?.fin_almuerzo || '13:00',
        String(u.horario?.tolerancia_entrada_min ?? 10),
        String(u.horario?.tolerancia_salida_min ?? 10),
        String(u.horario?.tolerancia_almuerzo_min ?? 5),
        u.ubicacion?.id || 'ubi-001',
        u.ubicacion?.nombre || 'Sede',
        String(u.ubicacion?.latitud ?? ''),
        String(u.ubicacion?.longitud ?? ''),
        String(u.ubicacion?.radio_metros ?? 100),
        u.estado || 'activo',
        u.rol || 'colaborador',
        u.codigo_activacion || ''
      ])
    );
    await client.writeRange('USUARIOS!A1', rows);
  }

  setInterval(() => {
    if (!ready) {
      initFromSheets()
        .then(() => {
          ready = true;
          initError = null;
          console.log('[data] Sheets recuperado');
        })
        .catch(() => {});
    }
  }, 120000);
} else {
  console.log('[data] Fuente: mock (memoria). Para Sheets configure DATA_SOURCE=sheets');
}

module.exports = store;
module.exports.dataSource = useSheets ? 'sheets' : 'mock';
module.exports.isReady = () => ready;
module.exports.getInitError = () => initError;
