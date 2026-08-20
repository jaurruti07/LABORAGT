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
  // Caché mutable que replica la forma de mockData
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
    getTodayAttendance(userId) {
      const { fechaGT } = require('../utils/time');
      const fecha = fechaGT();
      return mem.attendanceStore.filter(
        (m) => m.usuario_id === userId && m.fecha === fecha
      );
    },
    addAttendance(record) {
      mem.attendanceStore.push(record);
      // Persistencia asíncrona en Sheets (no bloquea la respuesta)
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
    /** Actualiza permiso en memoria + Sheets (para aprobar/rechazar) */
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

  // Carga inicial
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
      console.error('[data] Error cargando Sheets, revisa credenciales:', err.message);
      console.error('[data] Se mantiene caché vacía hasta reintentar.');
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
    // Reescribir hoja completa desde memoria
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

  // Reintento de carga cada 2 min si falló al inicio
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
