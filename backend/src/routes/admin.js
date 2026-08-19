/**
 * Rutas de administración
 */

const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const mock = require('../repositories/mockData');

router.use(authenticate);

router.get('/dashboard', requireRole('jefe', 'admin', 'auditor'), (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const allToday = mock.attendanceStore.filter(m => m.fecha === today);

  const tardias = allToday.filter(m =>
    m.estado === 'TARDIO' || m.estado === 'TARDIO_Y_FUERA_DE_UBICACION'
  ).length;

  const fueraUbicacion = allToday.filter(m =>
    m.estado === 'FUERA_DE_UBICACION' || m.estado === 'TARDIO_Y_FUERA_DE_UBICACION'
  ).length;

  const usuariosActivos = mock.users.filter(u => u.estado === 'activo').length;

  res.json({
    success: true,
    data: {
      fecha: today,
      colaboradores_activos: usuariosActivos,
      marcajes_hoy: allToday.length,
      entradas_tardias: tardias,
      fuera_ubicacion: fueraUbicacion,
      permisos_activos: 0,
      incidencias_pendientes: tardias + fueraUbicacion,
      cumplimiento_pct: allToday.length
        ? Math.round(((allToday.length - tardias - fueraUbicacion) / allToday.length) * 100)
        : 100,
      ultimas_incidencias: allToday
        .filter(m => m.estado !== 'VALIDO')
        .slice(-10)
        .reverse()
        .map(m => ({
          hora: m.hora,
          usuario: m.nombre_usuario,
          tipo: m.tipo,
          estado: m.estado,
          detalle: (m.incidencias || []).map(i => i.descripcion).join(' · ')
        }))
    }
  });
});

router.get('/users', requireRole('jefe', 'admin', 'auditor'), (req, res) => {
  const list = mock.users.map(u => ({
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
    horario: u.horario?.nombre || u.horario?.hora_entrada
  }));
  res.json({ success: true, data: list });
});

router.get('/attendance', requireRole('jefe', 'admin', 'auditor'), (req, res) => {
  let list = [...mock.attendanceStore];
  if (req.query.fecha) list = list.filter(m => m.fecha === req.query.fecha);
  if (req.query.usuario_id) list = list.filter(m => m.usuario_id === req.query.usuario_id);
  if (req.query.estado) list = list.filter(m => m.estado === req.query.estado);
  list.sort((a, b) => (b.fecha_hora || '').localeCompare(a.fecha_hora || ''));

  res.json({
    success: true,
    data: list.map(m => ({
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
});

router.get('/incidents', requireRole('jefe', 'admin', 'auditor'), (req, res) => {
  const incidents = mock.attendanceStore
    .filter(m => m.estado && m.estado !== 'VALIDO')
    .sort((a, b) => (b.fecha_hora || '').localeCompare(a.fecha_hora || ''))
    .map(m => ({
      marcaje_id: m.id,
      fecha: m.fecha,
      hora: m.hora,
      usuario: m.nombre_usuario,
      tipo_marcaje: m.tipo,
      estado: m.estado,
      incidencias: m.incidencias || []
    }));
  res.json({ success: true, data: incidents });
});

module.exports = router;
