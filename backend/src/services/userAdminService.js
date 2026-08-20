/**
 * CRUD de usuarios para panel administrativo
 */

const crypto = require('crypto');
const data = require('../repositories');

const ROLES = ['colaborador', 'jefe', 'administrador', 'admin', 'auditor'];
const ESTADOS = ['activo', 'inactivo', 'suspendido'];

function publicUser(u) {
  if (!u) return null;
  return {
    id: u.id,
    codigo_empleado: u.codigo_empleado,
    dpi: u.dpi,
    nombre: u.nombre,
    apellidos: u.apellidos,
    correo: u.correo || '',
    telefono: u.telefono || '',
    dependencia: u.dependencia || '',
    unidad: u.unidad || '',
    cargo: u.cargo || '',
    jefe_inmediato_id: u.jefe_inmediato_id || null,
    rol: u.rol,
    estado: u.estado,
    codigo_activacion: u.codigo_activacion || '',
    horario: {
      hora_entrada: u.horario?.hora_entrada || '08:00',
      hora_salida: u.horario?.hora_salida || '17:00',
      inicio_almuerzo: u.horario?.inicio_almuerzo || '12:00',
      fin_almuerzo: u.horario?.fin_almuerzo || '13:00',
      tolerancia_entrada_min: u.horario?.tolerancia_entrada_min ?? 10,
      tolerancia_salida_min: u.horario?.tolerancia_salida_min ?? 10,
      tolerancia_almuerzo_min: u.horario?.tolerancia_almuerzo_min ?? 5
    },
    ubicacion: {
      nombre: u.ubicacion?.nombre || 'Sede',
      latitud: u.ubicacion?.latitud ?? 14.6349,
      longitud: u.ubicacion?.longitud ?? -90.5069,
      radio_metros: u.ubicacion?.radio_metros ?? 100
    }
  };
}

function listUsers() {
  try {
    const list = (data.users || []).map(publicUser);
    list.sort((a, b) => a.codigo_empleado.localeCompare(b.codigo_empleado));
    return { success: true, data: list };
  } catch (err) {
    console.error('[userAdminService.listUsers]', err.message);
    return { success: false, error: 'Error al listar usuarios' };
  }
}

function getUser(id) {
  try {
    const u = data.findUserById(id);
    if (!u) return { success: false, error: 'Usuario no encontrado' };
    return { success: true, data: publicUser(u) };
  } catch (err) {
    console.error('[userAdminService.getUser]', err.message);
    return { success: false, error: 'Error al obtener usuario' };
  }
}

function normalizeBody(body) {
  const b = body || {};
  return {
    codigo_empleado: String(b.codigo_empleado || '').trim(),
    dpi: String(b.dpi || '').trim(),
    nombre: String(b.nombre || '').trim(),
    apellidos: String(b.apellidos || '').trim(),
    correo: String(b.correo || '').trim(),
    telefono: String(b.telefono || '').trim(),
    dependencia: String(b.dependencia || '').trim(),
    unidad: String(b.unidad || '').trim(),
    cargo: String(b.cargo || '').trim(),
    jefe_inmediato_id: b.jefe_inmediato_id || null,
    rol: String(b.rol || 'colaborador').trim().toLowerCase(),
    estado: String(b.estado || 'activo').trim().toLowerCase(),
    codigo_activacion: String(b.codigo_activacion || '').trim(),
    horario: {
      id: 'hor-001',
      nombre: 'Jornada',
      hora_entrada: b.hora_entrada || b.horario?.hora_entrada || '08:00',
      hora_salida: b.hora_salida || b.horario?.hora_salida || '17:00',
      inicio_almuerzo: b.inicio_almuerzo || b.horario?.inicio_almuerzo || '12:00',
      fin_almuerzo: b.fin_almuerzo || b.horario?.fin_almuerzo || '13:00',
      tolerancia_entrada_min: Number(
        b.tolerancia_entrada_min ?? b.horario?.tolerancia_entrada_min ?? 10
      ),
      tolerancia_salida_min: Number(
        b.tolerancia_salida_min ?? b.horario?.tolerancia_salida_min ?? 10
      ),
      tolerancia_almuerzo_min: Number(
        b.tolerancia_almuerzo_min ?? b.horario?.tolerancia_almuerzo_min ?? 5
      )
    },
    ubicacion: {
      id: 'ubi-001',
      nombre: b.ubicacion_nombre || b.ubicacion?.nombre || 'Sede Central',
      latitud: Number(b.latitud ?? b.ubicacion?.latitud ?? 14.6349),
      longitud: Number(b.longitud ?? b.ubicacion?.longitud ?? -90.5069),
      radio_metros: Number(b.radio_metros ?? b.ubicacion?.radio_metros ?? 100)
    }
  };
}

function validate(n, { isCreate }) {
  if (!n.codigo_empleado) return 'Código de empleado obligatorio';
  if (!n.nombre) return 'Nombre obligatorio';
  if (!n.apellidos) return 'Apellidos obligatorios';
  if (!ROLES.includes(n.rol)) return 'Rol inválido: ' + ROLES.join(', ');
  if (!ESTADOS.includes(n.estado)) return 'Estado inválido';
  if (isCreate && !n.codigo_activacion) return 'Código de activación obligatorio al crear';
  if (Number.isNaN(n.ubicacion.latitud) || Number.isNaN(n.ubicacion.longitud))
    return 'Coordenadas inválidas';
  return null;
}

function createUser(body) {
  try {
    const n = normalizeBody(body);
    const err = validate(n, { isCreate: true });
    if (err) return { success: false, error: err };

    const dup = data.findUserByCodigoOrDpi(n.codigo_empleado);
    if (dup) return { success: false, error: 'Ya existe un usuario con ese código' };
    if (n.dpi) {
      const dupDpi = data.findUserByCodigoOrDpi(n.dpi);
      if (dupDpi) return { success: false, error: 'Ya existe un usuario con ese DPI' };
    }

    const user = {
      id: 'usr-' + crypto.randomUUID().slice(0, 8),
      ...n
    };

    if (typeof data.createUser === 'function') {
      data.createUser(user);
    } else {
      data.users.push(user);
    }

    return { success: true, data: publicUser(user) };
  } catch (err) {
    console.error('[userAdminService.createUser]', err.message);
    return { success: false, error: 'Error al crear usuario' };
  }
}

function updateUser(id, body) {
  try {
    const existing = data.findUserById(id);
    if (!existing) return { success: false, error: 'Usuario no encontrado' };

    const n = normalizeBody({ ...existing, ...body, horario: body.horario || existing.horario, ubicacion: body.ubicacion || existing.ubicacion });
    // Preservar activación si no se envía
    if (!body.codigo_activacion && existing.codigo_activacion) {
      n.codigo_activacion = existing.codigo_activacion;
    }
    const err = validate(n, { isCreate: false });
    if (err) return { success: false, error: err };

    // Unicidad de código (excepto el mismo usuario)
    const byCode = data.users.find(
      (u) => u.codigo_empleado === n.codigo_empleado && u.id !== id
    );
    if (byCode) return { success: false, error: 'Código de empleado ya en uso' };

    const updated = { ...existing, ...n, id: existing.id };

    if (typeof data.updateUser === 'function') {
      data.updateUser(updated);
    } else {
      const idx = data.users.findIndex((u) => u.id === id);
      if (idx >= 0) data.users[idx] = updated;
    }

    return { success: true, data: publicUser(updated) };
  } catch (err) {
    console.error('[userAdminService.updateUser]', err.message);
    return { success: false, error: 'Error al actualizar usuario' };
  }
}

/** Soft-delete: pasa a inactivo */
function deactivateUser(id) {
  return updateUser(id, { estado: 'inactivo' });
}

module.exports = {
  ROLES,
  ESTADOS,
  listUsers,
  getUser,
  createUser,
  updateUser,
  deactivateUser,
  publicUser
};
