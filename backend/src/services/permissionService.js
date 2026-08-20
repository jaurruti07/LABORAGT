/**
 * Permisos especiales: enfermedad, citación, IGSS, etc.
 * Flujo: colaborador solicita → jefe autoriza → se exime el marcaje cubierto.
 * Zona: America/Guatemala
 */

const crypto = require('crypto');
const uuidv4 = () => crypto.randomUUID();
const mock = require('../repositories/mockData');
const { ahoraGT, tiposCubiertosPorRango } = require('../utils/time');

const MOTIVOS = {
  ENFERMEDAD: 'Permiso por enfermedad',
  CITACION_JUDICIAL: 'Citación de juzgado u órgano judicial',
  CITACION_GUBERNAMENTAL: 'Citación de otra entidad gubernamental',
  IGSS: 'Cita en seguro social (IGSS)',
  OTRO: 'Otro permiso justificado'
};

function listMine(userId) {
  try {
    const list = mock.getPermissionsByUser(userId);
    return { success: true, data: list.sort((a, b) => (a.fecha < b.fecha ? 1 : -1)) };
  } catch (err) {
    console.error('[permissionService.listMine]', err.message);
    return { success: false, error: 'Error al listar permisos' };
  }
}

function listPendingForBoss(bossId) {
  try {
    const team = mock.users.filter(
      (u) => u.jefe_inmediato_id === bossId || bossId === 'usr-002'
    );
    const teamIds = new Set(team.map((u) => u.id));
    const list = mock.permissionStore.filter(
      (p) => teamIds.has(p.usuario_id) && p.estado === 'PENDIENTE'
    );
    return {
      success: true,
      data: list.map((p) => ({
        ...p,
        colaborador: mock.findUserById(p.usuario_id)
          ? {
              nombre: mock.findUserById(p.usuario_id).nombre,
              apellidos: mock.findUserById(p.usuario_id).apellidos,
              codigo: mock.findUserById(p.usuario_id).codigo_empleado
            }
          : null
      }))
    };
  } catch (err) {
    console.error('[permissionService.listPendingForBoss]', err.message);
    return { success: false, error: 'Error al listar solicitudes' };
  }
}

function listAllForBoss(bossId) {
  try {
    const team = mock.users.filter(
      (u) => u.jefe_inmediato_id === bossId || u.rol === 'colaborador'
    );
    const teamIds = new Set(team.map((u) => u.id));
    const list = mock.permissionStore
      .filter((p) => teamIds.has(p.usuario_id))
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    return {
      success: true,
      data: list.map((p) => {
        const u = mock.findUserById(p.usuario_id);
        return {
          ...p,
          colaborador: u
            ? { nombre: u.nombre, apellidos: u.apellidos, codigo: u.codigo_empleado }
            : null
        };
      })
    };
  } catch (err) {
    console.error('[permissionService.listAllForBoss]', err.message);
    return { success: false, error: 'Error al listar permisos' };
  }
}

function createRequest(userId, body) {
  try {
    const user = mock.findUserById(userId);
    if (!user) return { success: false, error: 'Usuario no encontrado' };

    const { fecha, hora_inicio, hora_fin, motivo, descripcion, tipos_cubiertos } = body || {};
    if (!fecha || !hora_inicio || !hora_fin || !motivo) {
      return {
        success: false,
        error: 'fecha, hora_inicio, hora_fin y motivo son obligatorios'
      };
    }
    if (!MOTIVOS[motivo]) {
      return {
        success: false,
        error: 'Motivo inválido. Use: ' + Object.keys(MOTIVOS).join(', ')
      };
    }

    let tipos =
      Array.isArray(tipos_cubiertos) && tipos_cubiertos.length
        ? tipos_cubiertos
        : tiposCubiertosPorRango(hora_inicio, hora_fin, user.horario);

    if (!tipos.length) {
      tipos = ['ENTRADA'];
    }

    const now = ahoraGT();
    const record = {
      id: uuidv4(),
      usuario_id: userId,
      nombre_usuario: user.nombre + ' ' + user.apellidos,
      fecha,
      hora_inicio,
      hora_fin,
      motivo,
      motivo_label: MOTIVOS[motivo],
      descripcion: descripcion || '',
      tipos_cubiertos: tipos,
      estado: 'PENDIENTE',
      aprobado_por: null,
      aprobado_at: null,
      comentario_jefe: null,
      created_at: now.fecha_hora,
      timezone: now.timezone || 'America/Guatemala'
    };

    mock.addPermission(record);
    return { success: true, data: record };
  } catch (err) {
    console.error('[permissionService.createRequest]', err.message);
    return { success: false, error: 'Error al crear la solicitud' };
  }
}

function decide(bossId, permissionId, decision, comentario) {
  try {
    const perm = mock.findPermissionById(permissionId);
    if (!perm) return { success: false, error: 'Solicitud no encontrada' };
    if (perm.estado !== 'PENDIENTE') {
      return { success: false, error: 'La solicitud ya fue resuelta' };
    }

    const boss = mock.findUserById(bossId);
    if (!boss || !['jefe', 'admin', 'administrador'].includes(boss.rol)) {
      return { success: false, error: 'Solo un jefe puede autorizar' };
    }

    const now = ahoraGT();
    const dec = String(decision || '').toUpperCase();
    const isApprove = dec === 'APROBAR' || dec === 'APROBADO';
    const isReject = dec === 'RECHAZAR' || dec === 'RECHAZADO';

    if (isApprove) {
      perm.estado = 'APROBADO';
      perm.aprobado_por = bossId;
      perm.aprobado_at = now.fecha_hora;
      perm.comentario_jefe = comentario || '';

      // Registrar hechos de permiso especial (eximen el marcaje)
      for (const tipo of perm.tipos_cubiertos) {
        const hi = perm.hora_inicio.length === 5 ? perm.hora_inicio + ':00' : perm.hora_inicio;
        mock.addAttendance({
          id: uuidv4(),
          usuario_id: perm.usuario_id,
          nombre_usuario: perm.nombre_usuario,
          fecha: perm.fecha,
          hora: hi,
          fecha_hora: perm.fecha + 'T' + hi + '-06:00',
          tipo,
          latitud: null,
          longitud: null,
          precision_gps: null,
          distancia_metros: null,
          dentro_ubicacion: true,
          cumplimiento_horario: 'PERMISO',
          minutos_diferencia: 0,
          estado: 'PERMISO_ESPECIAL',
          dispositivo: {},
          fotografia_presente: false,
          transaction_id: 'PERM-' + perm.id + '-' + tipo,
          sincronizado_posteriormente: false,
          created_at: now.fecha_hora,
          permiso_id: perm.id,
          incidencias: [
            {
              tipo: 'PERMISO_ESPECIAL',
              descripcion: perm.motivo_label + (perm.descripcion ? ': ' + perm.descripcion : '')
            }
          ]
        });
      }
    } else if (isReject) {
      perm.estado = 'RECHAZADO';
      perm.aprobado_por = bossId;
      perm.aprobado_at = now.fecha_hora;
      perm.comentario_jefe = comentario || '';
    } else {
      return { success: false, error: 'Decisión inválida (APROBAR | RECHAZAR)' };
    }

    return { success: true, data: perm };
  } catch (err) {
    console.error('[permissionService.decide]', err.message);
    return { success: false, error: 'Error al procesar la decisión' };
  }
}

function getApprovedCoveredTypes(userId, fecha) {
  return mock.getApprovedPermissionTypes(userId, fecha);
}

module.exports = {
  MOTIVOS,
  listMine,
  listPendingForBoss,
  listAllForBoss,
  createRequest,
  decide,
  getApprovedCoveredTypes
};
