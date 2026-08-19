/**
 * Datos de prueba (Mock) para desarrollo del MVP
 * Posteriormente se reemplazará por GoogleSheetsUserRepository etc.
 */

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

module.exports = {
  users,
  attendanceStore,
  findUserByCodigoOrDpi(codigoOrDpi) {
    return users.find(
      u => u.codigo_empleado === codigoOrDpi || u.dpi === codigoOrDpi
    );
  },
  findUserById(id) {
    return users.find(u => u.id === id);
  },
  getTodayAttendance(userId) {
    const today = new Date().toISOString().slice(0, 10);
    return attendanceStore.filter(
      m => m.usuario_id === userId && m.fecha === today
    );
  },
  addAttendance(record) {
    attendanceStore.push(record);
    return record;
  },
  getAttendanceHistory(userId, from, to) {
    return attendanceStore.filter(m => {
      if (m.usuario_id !== userId) return false;
      if (from && m.fecha < from) return false;
      if (to && m.fecha > to) return false;
      return true;
    });
  }
};
