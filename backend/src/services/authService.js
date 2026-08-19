/**
 * Servicio de autenticación
 */

const jwt = require('jsonwebtoken');
const mock = require('../repositories/mockData');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || '30m';

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      codigo: user.codigo_empleado,
      nombre: `${user.nombre} ${user.apellidos}`,
      rol: user.rol
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );
}

function activateOrLogin({ codigoOrDpi, codigoActivacion }) {
  const user = mock.findUserByCodigoOrDpi(codigoOrDpi);

  if (!user) {
    return { success: false, error: 'Usuario no encontrado' };
  }

  if (user.estado !== 'activo') {
    return { success: false, error: 'Usuario inactivo o suspendido' };
  }

  if (codigoActivacion && user.codigo_activacion !== codigoActivacion) {
    return { success: false, error: 'Código de activación incorrecto' };
  }

  const token = generateToken(user);

  return {
    success: true,
    token,
    user: {
      id: user.id,
      codigo_empleado: user.codigo_empleado,
      nombre: user.nombre,
      apellidos: user.apellidos,
      rol: user.rol,
      horario: user.horario,
      ubicacion: {
        nombre: user.ubicacion.nombre,
        radio_metros: user.ubicacion.radio_metros
      }
    }
  };
}

module.exports = { activateOrLogin, generateToken };
