/**
 * Middleware de autenticación JWT
 */

const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Token de autenticación requerido'
      });
    }

    const token = header.slice(7);
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token vacío'
      });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-change-me');
    req.user = payload;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expirado. Inicie sesión nuevamente'
      });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Token inválido'
      });
    }
    console.error('[auth.authenticate]', err.message);
    return res.status(401).json({
      success: false,
      error: 'Error de autenticación'
    });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    try {
      if (!req.user || !roles.includes(req.user.rol)) {
        return res.status(403).json({
          success: false,
          error: 'No tiene permisos para esta acción'
        });
      }
      next();
    } catch (err) {
      console.error('[auth.requireRole]', err.message);
      return res.status(500).json({
        success: false,
        error: 'Error al verificar permisos'
      });
    }
  };
}

module.exports = { authenticate, requireRole };
