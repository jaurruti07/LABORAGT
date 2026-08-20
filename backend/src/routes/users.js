/**
 * Rutas de usuario autenticado
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const data = require('../repositories');

router.use(authenticate);

router.get('/me', (req, res) => {
  try {
    const user = data.findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }

    return res.json({
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
  } catch (err) {
    console.error('[users/me]', err.message);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener perfil de usuario'
    });
  }
});

module.exports = router;
