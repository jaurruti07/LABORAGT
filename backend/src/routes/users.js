/**
 * Rutas de usuario autenticado
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const mock = require('../repositories/mockData');

router.use(authenticate);

router.get('/me', (req, res) => {
  const user = mock.findUserById(req.user.id);
  if (!user) {
    return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
  }

  res.json({
    success: true,
    data: {
      id: user.id,
      codigo_empleado: user.codigo_empleado,
      nombre: user.nombre,
      apellidos: user.apellidos,
      correo: user.correo,
      cargo: user.cargo,
      dependencia: user.dependencia,
      unidad: user.unidad,
      rol: user.rol,
      horario: user.horario,
      ubicacion: {
        nombre: user.ubicacion.nombre,
        radio_metros: user.ubicacion.radio_metros
      }
    }
  });
});

module.exports = router;
