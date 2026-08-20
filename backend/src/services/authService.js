/**
 * Servicio de autenticación
 */

const jwt = require('jsonwebtoken');
const data = require('../repositories');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || '30m';

function generateToken(user) {
  try {
    return jwt.sign(
      {
        id: user.id,
        codigo: user.codigo_empleado,
        nombre: user.nombre + ' ' + user.apellidos,
        rol: user.rol
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );
  } catch (err) {
    console.error('[authService.generateToken]', err.message);
    throw new Error('No se pudo generar el token de sesión');
  }
}

function activateOrLogin({ codigoOrDpi, codigoActivacion }) {
  try {
    if (!codigoOrDpi || typeof codigoOrDpi !== 'string') {
      return { success: false, error: 'Código de empleado o DPI inválido' };
    }

    const user = data.findUserByCodigoOrDpi(codigoOrDpi.trim());

    if (!user) {
      return { success: false, error: 'Usuario no encontrado' };
    }

    if (user.estado !== 'activo') {
      return { success: false, error: 'Usuario inactivo o suspendido' };
    }

    if (codigoActivacion && user.codigo_activacion !== String(codigoActivacion).trim()) {
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
  } catch (err) {
    console.error('[authService.activateOrLogin]', err.message);
    return { success: false, error: 'Error interno de autenticación' };
  }
}

module.exports = { activateOrLogin, generateToken };
