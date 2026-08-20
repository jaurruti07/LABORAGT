/**
 * Datos de prueba (Mock) para desarrollo del MVP
 */

const { fechaGT } = require('../utils/time');

const users = [
  {
    id: 'usr-001',
    codigo_empleado: 'EMP-001',
    dpi: '1234567890101',
    nombre: 'Josué',
    apellidos: 'Pérez López',
    correo: 'josue.perez@institucion.gob.gt',
    telefono: '50212345678',
    dependencia: 'Dirección de Tecnologías',
    unidad: 'Unidad de Desarrollo',
    cargo: 'Analista',
    jefe_inmediato_id: 'usr-002',
    horario: {
      id: 'hor-001',
      nombre: 'Jornada estándar',
      hora_entrada: '08:00',
      hora_salida: '17:00',
      inicio_almuerzo: '12:00',
      fin_almuerzo: '13:00',
      tolerancia_entrada_min: 10,
      tolerancia_salida_min: 10,
      tolerancia_almuerzo_min: 5
    },
    ubicacion: {
      id: 'ubi-001',
      nombre: 'Sede Central',
      latitud: 14.6349,
      longitud: -90.5069,
      radio_metros: 100
    },
    rol: 'colaborador',
    estado: 'activo',
    codigo_activacion: 'ACT-2026'
  },
  {
    id: 'usr-002',
    codigo_empleado: 'EMP-002',
    dpi: '9876543210101',
    nombre: 'María',
    apellidos: 'López García',
    correo: 'maria.lopez@institucion.gob.gt',
    telefono: '50287654321',
    dependencia: 'Dirección de Tecnologías',
    unidad: 'Unidad de Desarrollo',
    cargo: 'Jefe de Unidad',
    jefe_inmediato_id: null,
    horario: {
      id: 'hor-001',
      nombre: 'Jornada estándar',
      hora_entrada: '08:00',
      hora_salida: '17:00',
      inicio_almuerzo: '12:00',
      fin_almuerzo: '13:00',
      tolerancia_entrada_min: 10,
      tolerancia_salida_min: 10,
      tolerancia_almuerzo_min: 5
    },
    ubicacion: {
      id: 'ubi-001',
      nombre: 'Sede Central',
      latitud: 14.6349,
      longitud: -90.5069,
      radio_metros: 100
    },
    rol: 'jefe',
    estado: 'activo',
    codigo_activacion: 'ACT-2026'
  }
];

const attendanceStore = [];
const permissionStore = [];

function seedDemoHistory() {
  if (attendanceStore.length > 0) return;
  const userId = 'usr-001';
  const todayStr = fechaGT();
  const [y, m, d] = todayStr.split('-').map(Number);
  const startDay = Math.max(1, d - 17);
  let seq = 0;
  for (let day = startDay; day <= d; day++) {
    const date = new Date(Date.UTC(y, m - 1, day, 12, 0, 0));
    const wd = date.getUTCDay();
    if (wd === 0 || wd === 6) continue;
    const fecha =
      y + '-' + String(m).padStart(2, '0') + '-' + String(day).padStart(2, '0');
    const late = seq % 3 === 2;
    const entradaMin = late ? 8 * 60 + 12 + (seq % 5) * 3 : 7 * 60 + 52 + (seq % 4);
    const h = (mins) => {
      const hh = String(Math.floor(mins / 60)).padStart(2, '0');
      const mm = String(mins % 60).padStart(2, '0');
      return hh + ':' + mm + ':00';
    };
    const tipos = [
      {
        tipo: 'ENTRADA',
        hora: h(entradaMin),
        cumplimiento: late ? 'TARDIO' : 'PUNTUAL',
        minDiff: late ? entradaMin - 8 * 60 : 0,
        estado: late ? 'TARDIO' : 'VALIDO'
      },
      { tipo: 'SALIDA_ALMUERZO', hora: '12:02:00', cumplimiento: 'PUNTUAL', minDiff: 0, estado: 'VALIDO' },
      { tipo: 'REGRESO_ALMUERZO', hora: '12:58:00', cumplimiento: 'PUNTUAL', minDiff: 0, estado: 'VALIDO' },
      {
        tipo: 'SALIDA',
        hora: seq % 5 === 0 ? '16:40:00' : '17:05:00',
        cumplimiento: seq % 5 === 0 ? 'ANTICIPADO' : 'PUNTUAL',
        minDiff: seq % 5 === 0 ? 20 : 0,
        estado: seq % 5 === 0 ? 'ANTICIPADO' : 'VALIDO'
      }
    ];
    const isToday = fecha === todayStr;
    const maxT = isToday ? 0 : tipos.length;
    for (let i = 0; i < maxT; i++) {
      const t = tipos[i];
      attendanceStore.push({
        id: 'seed-' + fecha + '-' + t.tipo,
        usuario_id: userId,
        nombre_usuario: 'Josué Pérez López',
        fecha,
        hora: t.hora,
        fecha_hora: fecha + 'T' + t.hora + '-06:00',
        tipo: t.tipo,
        latitud: 14.6349,
        longitud: -90.5069,
        precision_gps: 12,
        distancia_metros: 15 + (seq % 10),
        dentro_ubicacion: true,
        cumplimiento_horario: t.cumplimiento,
        minutos_diferencia: t.minDiff,
        estado: t.estado,
        dispositivo: { platform: 'demo' },
        fotografia_presente: true,
        transaction_id: 'TXN-SEED-' + fecha + '-' + i,
        sincronizado_posteriormente: false,
        created_at: fecha + 'T' + t.hora + '-06:00',
        incidencias:
          t.estado === 'TARDIO'
            ? [{ tipo: 'ENTRADA_TARDIA', minutos: t.minDiff, descripcion: 'Tardanza de ' + t.minDiff + ' min' }]
            : []
      });
    }
    seq += 1;
  }
}

seedDemoHistory();

module.exports = {
  users,
  attendanceStore,
  permissionStore,
  findUserByCodigoOrDpi(codigoOrDpi) {
    return users.find(
      (u) => u.codigo_empleado === codigoOrDpi || u.dpi === codigoOrDpi
    );
  },
  findUserById(id) {
    return users.find((u) => u.id === id);
  },
  getTodayAttendance(userId) {
    const fecha = fechaGT();
    return attendanceStore.filter((m) => m.usuario_id === userId && m.fecha === fecha);
  },
  addAttendance(record) {
    attendanceStore.push(record);
    return record;
  },
  getAttendanceHistory(userId, from, to) {
    return attendanceStore.filter((m) => {
      if (m.usuario_id !== userId) return false;
      if (from && m.fecha < from) return false;
      if (to && m.fecha > to) return false;
      return true;
    });
  },
  addPermission(record) {
    permissionStore.push(record);
    return record;
  },
  findPermissionById(id) {
    return permissionStore.find((p) => p.id === id);
  },
  getPermissionsByUser(userId) {
    return permissionStore.filter((p) => p.usuario_id === userId);
  },
  getApprovedPermissionTypes(userId, fecha) {
    const set = new Set();
    permissionStore
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
    const idx = permissionStore.findIndex((p) => p.id === perm.id);
    if (idx >= 0) permissionStore[idx] = perm;
    else permissionStore.push(perm);
    return perm;
  }
};
