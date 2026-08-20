/**
 * Rutas de administración
 * Acceso: jefe, admin, administrador, auditor
 */

const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const data = require('../repositories');
const { fechaGT } = require('../utils/time');

const ROLES_ADMIN = ['jefe', 'admin', 'administrador', 'auditor'];

router.use(authenticate);

router.get('/dashboard', requireRole(...ROLES_ADMIN), (req, res) => {
  try {
    const today = fechaGT();
    const allToday = data.attendanceStore.filter((m) => m.fecha === today);

    const tardias = allToday.filter(
      (m) => m.estado === 'TARDIO' || m.estado === 'TARDIO_Y_FUERA_DE_UBICACION'
    ).length;

    const fueraUbicacion = allToday.filter(
      (m) =>
        m.estado === 'FUERA_DE_UBICACION' || m.estado === 'TARDIO_Y_FUERA_DE_UBICACION'
    ).length;

    const usuariosActivos = data.users.filter((u) => u.estado === 'activo').length;
    const permisosPendientes = (data.permissionStore || []).filter(
      (p) => p.estado === 'PENDIENTE'
    ).length;

    return res.json({
      success: true,
      data: {
        fecha: today,
        timezone: 'America/Guatemala',
        data_source: data.dataSource || 'mock',
        colaboradores_activos: usuariosActivos,
        marcajes_hoy: allToday.length,
        entradas_tardias: tardias,
        fuera_ubicacion: fueraUbicacion,
        permisos_activos: permisosPendientes,
        incidencias_pendientes: tardias + fueraUbicacion,
        cumplimiento_pct: allToday.length
          ? Math.round(
              ((allToday.length - tardias - fueraUbicacion) / allToday.length) * 100
            )
          : 100,
        ultimas_incidencias: allToday
          .filter((m) => m.estado !== 'VALIDO' && m.estado !== 'PERMISO_ESPECIAL')
          .slice(-10)
          .reverse()
          .map((m) => ({
            hora: m.hora,
            usuario: m.nombre_usuario,
            tipo: m.tipo,
            estado: m.estado,
            detalle: (m.incidencias || []).map((i) => i.descripcion).join(' · ')
          }))
      }
    });
  } catch (err) {
    console.error('[admin/dashboard]', err.message);
    return res.status(500).json({
      success: false,
      error: 'Error al cargar el dashboard'
    });
  }
});

router.get('/users', requireRole(...ROLES_ADMIN), (req, res) => {
  try {
    const list = data.users.map((u) => ({
      id: u.id,
      codigo_empleado: u.codigo_empleado,
      nombre: u.nombre,
      apellidos: u.apellidos,
      correo: u.correo,
      dependencia: u.dependencia,
      unidad: u.unidad,
      cargo: u.cargo,
      rol: u.rol,
      estado: u.estado,
      horario: u.horario && (u.horario.nombre || u.horario.hora_entrada)
    }));
    return res.json({ success: true, data: list });
  } catch (err) {
    console.error('[admin/users]', err.message);
    return res.status(500).json({
      success: false,
      error: 'Error al listar usuarios'
    });
  }
});

router.get('/attendance', requireRole(...ROLES_ADMIN), (req, res) => {
  try {
    let list = data.attendanceStore.slice();
    if (req.query.fecha) list = list.filter((m) => m.fecha === req.query.fecha);
    if (req.query.usuario_id)
      list = list.filter((m) => m.usuario_id === req.query.usuario_id);
    if (req.query.estado) list = list.filter((m) => m.estado === req.query.estado);
    list.sort((a, b) => (b.fecha_hora || '').localeCompare(a.fecha_hora || ''));

    return res.json({
      success: true,
      data: list.map((m) => ({
        id: m.id,
        fecha: m.fecha,
        hora: m.hora,
        usuario_id: m.usuario_id,
        nombre_usuario: m.nombre_usuario,
        tipo: m.tipo,
        estado: m.estado,
        distancia_metros: m.distancia_metros,
        dentro_ubicacion: m.dentro_ubicacion,
        cumplimiento_horario: m.cumplimiento_horario,
        minutos_diferencia: m.minutos_diferencia,
        incidencias: m.incidencias || []
      }))
    });
  } catch (err) {
    console.error('[admin/attendance]', err.message);
    return res.status(500).json({
      success: false,
      error: 'Error al listar marcajes'
    });
  }
});

router.get('/incidents', requireRole(...ROLES_ADMIN), (req, res) => {
  try {
    const incidents = data.attendanceStore
      .filter((m) => m.estado && m.estado !== 'VALIDO' && m.estado !== 'PERMISO_ESPECIAL')
      .sort((a, b) => (b.fecha_hora || '').localeCompare(a.fecha_hora || ''))
      .map((m) => ({
        marcaje_id: m.id,
        fecha: m.fecha,
        hora: m.hora,
        usuario: m.nombre_usuario,
        tipo_marcaje: m.tipo,
        estado: m.estado,
        incidencias: m.incidencias || []
      }));
    return res.json({ success: true, data: incidents });
  } catch (err) {
    console.error('[admin/incidents]', err.message);
    return res.status(500).json({
      success: false,
      error: 'Error al listar incidencias'
    });
  }
});

module.exports = router;
