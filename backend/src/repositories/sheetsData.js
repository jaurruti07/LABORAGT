/**
 * Repositorio Google Sheets — misma interfaz pública que mockData
 * Pestañas: USUARIOS | MARCAJES | PERMISOS
 */

const sheets = require('./sheetsClient');
const { fechaGT } = require('../utils/time');

const SHEET_USERS = 'USUARIOS';
const SHEET_ATTENDANCE = 'MARCAJES';
const SHEET_PERMISSIONS = 'PERMISOS';

// Caché en memoria (TTL corto) para no saturar la API de Google
let cache = {
  users: null,
  usersAt: 0,
  attendance: null,
  attendanceAt: 0,
  permissions: null,
  permissionsAt: 0
};
const TTL_MS = 30 * 1000;

function invalidate(kind) {
  if (!kind || kind === 'users') {
    cache.users = null;
    cache.usersAt = 0;
  }
  if (!kind || kind === 'attendance') {
    cache.attendance = null;
    cache.attendanceAt = 0;
  }
  if (!kind || kind === 'permissions') {
    cache.permissions = null;
    cache.permissionsAt = 0;
  }
}

function mapUser(row) {
  return {
    id: row.id,
    codigo_empleado: row.codigo_empleado,
    dpi: row.dpi,
    nombre: row.nombre,
    apellidos: row.apellidos,
    correo: row.correo,
    telefono: row.telefono,
    dependencia: row.dependencia,
    unidad: row.unidad,
    cargo: row.cargo,
    jefe_inmediato_id: row.jefe_inmediato_id || null,
    horario: {
      id: row.horario_id || 'hor-001',
      nombre: row.horario_nombre || 'Jornada',
      hora_entrada: row.hora_entrada || '08:00',
      hora_salida: row.hora_salida || '17:00',
      inicio_almuerzo: row.inicio_almuerzo || '12:00',
      fin_almuerzo: row.fin_almuerzo || '13:00',
      tolerancia_entrada_min: Number(row.tolerancia_entrada_min || 10),
      tolerancia_salida_min: Number(row.tolerancia_salida_min || 10),
      tolerancia_almuerzo_min: Number(row.tolerancia_almuerzo_min || 5)
    },
    ubicacion: {
      id: row.ubicacion_id || 'ubi-001',
      nombre: row.ubicacion_nombre || 'Sede',
      latitud: Number(row.latitud_autorizada || 0),
      longitud: Number(row.longitud_autorizada || 0),
      radio_metros: Number(row.radio_metros || 100)
    },
    rol: row.rol || 'colaborador',
    estado: row.estado || 'activo',
    codigo_activacion: row.codigo_activacion || ''
  };
}

function mapAttendance(row) {
  let incidencias = [];
  try {
    if (row.incidencias_json) incidencias = JSON.parse(row.incidencias_json);
  } catch (_) {}
  let dispositivo = {};
  try {
    if (row.dispositivo_json) dispositivo = JSON.parse(row.dispositivo_json);
  } catch (_) {}
  return {
    id: row.id,
    usuario_id: row.usuario_id,
    nombre_usuario: row.nombre_usuario,
    fecha: row.fecha,
    hora: row.hora,
    fecha_hora: row.fecha_hora,
    tipo: row.tipo,
    latitud: row.latitud ? Number(row.latitud) : null,
    longitud: row.longitud ? Number(row.longitud) : null,
    precision_gps: row.precision_gps ? Number(row.precision_gps) : null,
    distancia_metros: row.distancia_metros ? Number(row.distancia_metros) : null,
    dentro_ubicacion: String(row.dentro_ubicacion).toLowerCase() === 'true',
    cumplimiento_horario: row.cumplimiento_horario,
    minutos_diferencia: Number(row.minutos_diferencia || 0),
    estado: row.estado,
    dispositivo,
    fotografia_presente: String(row.fotografia_presente).toLowerCase() === 'true',
    transaction_id: row.transaction_id,
    sincronizado_posteriormente:
      String(row.sincronizado_posteriormente).toLowerCase() === 'true',
    created_at: row.created_at,
    permiso_id: row.permiso_id || null,
    incidencias
  };
}

function mapPermission(row) {
  let tipos = [];
  try {
    if (row.tipos_cubiertos) tipos = JSON.parse(row.tipos_cubiertos);
    else if (row.tipos_cubiertos_csv)
      tipos = String(row.tipos_cubiertos_csv)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
  } catch (_) {
    tipos = String(row.tipos_cubiertos || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return {
    id: row.id,
    usuario_id: row.usuario_id,
    nombre_usuario: row.nombre_usuario,
    fecha: row.fecha,
    hora_inicio: row.hora_inicio,
    hora_fin: row.hora_fin,
    motivo: row.motivo,
    motivo_label: row.motivo_label,
    descripcion: row.descripcion || '',
    tipos_cubiertos: tipos,
    estado: row.estado,
    aprobado_por: row.aprobado_por || null,
    aprobado_at: row.aprobado_at || null,
    comentario_jefe: row.comentario_jefe || null,
    created_at: row.created_at,
    timezone: row.timezone || 'America/Guatemala'
  };
}

async function loadUsers(force) {
  const now = Date.now();
  if (!force && cache.users && now - cache.usersAt < TTL_MS) return cache.users;
  const rows = await sheets.readRange(SHEET_USERS + '!A:Z');
  const objs = sheets.rowsToObjects(rows).map(mapUser);
  cache.users = objs;
  cache.usersAt = now;
  return objs;
}

async function loadAttendance(force) {
  const now = Date.now();
  if (!force && cache.attendance && now - cache.attendanceAt < TTL_MS)
    return cache.attendance;
  const rows = await sheets.readRange(SHEET_ATTENDANCE + '!A:Z');
  const objs = sheets.rowsToObjects(rows).map(mapAttendance);
  cache.attendance = objs;
  cache.attendanceAt = now;
  return objs;
}

async function loadPermissions(force) {
  const now = Date.now();
  if (!force && cache.permissions && now - cache.permissionsAt < TTL_MS)
    return cache.permissions;
  const rows = await sheets.readRange(SHEET_PERMISSIONS + '!A:Z');
  const objs = sheets.rowsToObjects(rows).map(mapPermission);
  cache.permissions = objs;
  cache.permissionsAt = now;
  return objs;
}

const USER_HEADERS = [
  'id', 'codigo_empleado', 'dpi', 'nombre', 'apellidos', 'correo', 'telefono',
  'dependencia', 'unidad', 'cargo', 'jefe_inmediato_id', 'horario_id',
  'hora_entrada', 'hora_salida', 'inicio_almuerzo', 'fin_almuerzo',
  'tolerancia_entrada_min', 'tolerancia_salida_min', 'tolerancia_almuerzo_min',
  'ubicacion_id', 'ubicacion_nombre', 'latitud_autorizada', 'longitud_autorizada',
  'radio_metros', 'estado', 'rol', 'codigo_activacion'
];

const ATT_HEADERS = [
  'id', 'usuario_id', 'nombre_usuario', 'fecha', 'hora', 'fecha_hora', 'tipo',
  'latitud', 'longitud', 'precision_gps', 'distancia_metros', 'dentro_ubicacion',
  'cumplimiento_horario', 'minutos_diferencia', 'estado', 'dispositivo_json',
  'fotografia_presente', 'transaction_id', 'sincronizado_posteriormente',
  'created_at', 'permiso_id', 'incidencias_json'
];

const PERM_HEADERS = [
  'id', 'usuario_id', 'nombre_usuario', 'fecha', 'hora_inicio', 'hora_fin',
  'motivo', 'motivo_label', 'descripcion', 'tipos_cubiertos', 'estado',
  'aprobado_por', 'aprobado_at', 'comentario_jefe', 'created_at', 'timezone'
];

function attendanceToRow(m) {
  return [
    m.id,
    m.usuario_id,
    m.nombre_usuario,
    m.fecha,
    m.hora,
    m.fecha_hora,
    m.tipo,
    m.latitud != null ? String(m.latitud) : '',
    m.longitud != null ? String(m.longitud) : '',
    m.precision_gps != null ? String(m.precision_gps) : '',
    m.distancia_metros != null ? String(m.distancia_metros) : '',
    String(!!m.dentro_ubicacion),
    m.cumplimiento_horario || '',
    String(m.minutos_diferencia || 0),
    m.estado || '',
    JSON.stringify(m.dispositivo || {}),
    String(!!m.fotografia_presente),
    m.transaction_id || '',
    String(!!m.sincronizado_posteriormente),
    m.created_at || '',
    m.permiso_id || '',
    JSON.stringify(m.incidencias || [])
  ];
}

function permissionToRow(p) {
  return [
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
  ];
}

// ——— API pública (misma firma que mockData, async) ———

async function getUsers() {
  return loadUsers();
}

async function findUserByCodigoOrDpi(codigoOrDpi) {
  const users = await loadUsers();
  return users.find(
    (u) => u.codigo_empleado === codigoOrDpi || u.dpi === codigoOrDpi
  ) || null;
}

async function findUserById(id) {
  const users = await loadUsers();
  return users.find((u) => u.id === id) || null;
}

async function getTodayAttendance(userId) {
  const fecha = fechaGT();
  const all = await loadAttendance();
  return all.filter((m) => m.usuario_id === userId && m.fecha === fecha);
}

async function addAttendance(record) {
  // Asegurar encabezados si la hoja está vacía
  const existing = await sheets.readRange(SHEET_ATTENDANCE + '!A1:Z1');
  if (!existing.length || !existing[0].length) {
    await sheets.writeRange(SHEET_ATTENDANCE + '!A1', [ATT_HEADERS]);
  }
  await sheets.appendRows(SHEET_ATTENDANCE, [attendanceToRow(record)]);
  invalidate('attendance');
  // Actualizar caché local
  if (cache.attendance) cache.attendance.push(record);
  return record;
}

async function getAttendanceHistory(userId, from, to) {
  const all = await loadAttendance();
  return all.filter((m) => {
    if (m.usuario_id !== userId) return false;
    if (from && m.fecha < from) return false;
    if (to && m.fecha > to) return false;
    return true;
  });
}

async function getAllAttendance() {
  return loadAttendance();
}

async function addPermission(record) {
  const existing = await sheets.readRange(SHEET_PERMISSIONS + '!A1:Z1');
  if (!existing.length || !existing[0].length) {
    await sheets.writeRange(SHEET_PERMISSIONS + '!A1', [PERM_HEADERS]);
  }
  await sheets.appendRows(SHEET_PERMISSIONS, [permissionToRow(record)]);
  invalidate('permissions');
  if (cache.permissions) cache.permissions.push(record);
  return record;
}

async function findPermissionById(id) {
  const list = await loadPermissions();
  return list.find((p) => p.id === id) || null;
}

async function getPermissionsByUser(userId) {
  const list = await loadPermissions();
  return list.filter((p) => p.usuario_id === userId);
}

async function getApprovedPermissionTypes(userId, fecha) {
  const list = await loadPermissions();
  const set = new Set();
  list
    .filter(
      (p) =>
        p.usuario_id === userId && p.fecha === fecha && p.estado === 'APROBADO'
    )
    .forEach((p) => (p.tipos_cubiertos || []).forEach((t) => set.add(t)));
  return [...set];
}

async function updatePermission(perm) {
  // Releer hoja completa, reemplazar fila y reescribir (Sheets no tiene UPDATE por id nativo)
  const rows = await sheets.readRange(SHEET_PERMISSIONS + '!A:Z');
  if (!rows.length) return perm;
  const headers = rows[0];
  const idIdx = headers.indexOf('id');
  if (idIdx < 0) throw new Error('Hoja PERMISOS sin columna id');
  let found = false;
  const newRows = [headers];
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][idIdx] === perm.id) {
      newRows.push(permissionToRow(perm));
      found = true;
    } else {
      newRows.push(rows[i]);
    }
  }
  if (!found) newRows.push(permissionToRow(perm));
  await sheets.writeRange(SHEET_PERMISSIONS + '!A1', newRows);
  invalidate('permissions');
  return perm;
}

async function getAllPermissions() {
  return loadPermissions();
}

module.exports = {
  // compat arrays (services que leen .users / .attendanceStore)
  get users() {
    return cache.users || [];
  },
  get attendanceStore() {
    return cache.attendance || [];
  },
  get permissionStore() {
    return cache.permissions || [];
  },
  invalidate,
  loadUsers,
  loadAttendance,
  loadPermissions,
  getUsers,
  findUserByCodigoOrDpi,
  findUserById,
  getTodayAttendance,
  addAttendance,
  getAttendanceHistory,
  getAllAttendance,
  addPermission,
  findPermissionById,
  getPermissionsByUser,
  getApprovedPermissionTypes,
  updatePermission,
  getAllPermissions,
  USER_HEADERS,
  ATT_HEADERS,
  PERM_HEADERS
};
