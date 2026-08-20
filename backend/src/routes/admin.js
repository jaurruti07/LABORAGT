/**
 * Rutas de administración
 * Acceso: jefe, admin, administrador, auditor
 * Escritura de usuarios: jefe, admin, administrador (no auditor)
 */

const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const data = require('../repositories');
const { fechaGT } = require('../utils/time');
const userAdmin = require('../services/userAdminService');

const ROLES_ADMIN = ['jefe', 'admin', 'administrador', 'auditor'];
const ROLES_WRITE = ['jefe', 'admin', 'administrador'];

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

/* ---------- USUARIOS CRUD ---------- */

router.get('/users', requireRole(...ROLES_ADMIN), (req, res) => {
  try {
    const result = userAdmin.listUsers();
    if (!result.success) return res.status(500).json(result);
    return res.json(result);
  } catch (err) {
    console.error('[admin/users]', err.message);
    return res.status(500).json({ success: false, error: 'Error al listar usuarios' });
  }
});

router.get('/users/:id', requireRole(...ROLES_ADMIN), (req, res) => {
  try {
    const result = userAdmin.getUser(req.params.id);
    if (!result.success) return res.status(404).json(result);
    return res.json(result);
  } catch (err) {
    console.error('[admin/users/:id]', err.message);
    return res.status(500).json({ success: false, error: 'Error al obtener usuario' });
  }
});

router.post('/users', requireRole(...ROLES_WRITE), (req, res) => {
  try {
    const result = userAdmin.createUser(req.body);
    if (!result.success) return res.status(400).json(result);
    return res.status(201).json(result);
  } catch (err) {
    console.error('[admin/users POST]', err.message);
    return res.status(500).json({ success: false, error: 'Error al crear usuario' });
  }
});

router.put('/users/:id', requireRole(...ROLES_WRITE), (req, res) => {
  try {
    const result = userAdmin.updateUser(req.params.id, req.body);
    if (!result.success) {
      const code = result.error === 'Usuario no encontrado' ? 404 : 400;
      return res.status(code).json(result);
    }
    return res.json(result);
  } catch (err) {
    console.error('[admin/users PUT]', err.message);
    return res.status(500).json({ success: false, error: 'Error al actualizar usuario' });
  }
});

router.delete('/users/:id', requireRole(...ROLES_WRITE), (req, res) => {
  try {
    const result = userAdmin.deactivateUser(req.params.id);
    if (!result.success) {
      const code = result.error === 'Usuario no encontrado' ? 404 : 400;
      return res.status(code).json(result);
    }
    return res.json(result);
  } catch (err) {
    console.error('[admin/users DELETE]', err.message);
    return res.status(500).json({ success: false, error: 'Error al desactivar usuario' });
  }
});

/* ---------- MARCAJES / INCIDENCIAS ---------- */

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
