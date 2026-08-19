/**
 * Middleware de autenticación JWT
 */

const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Token de autenticación requerido'
    });
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-change-me');
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Token inválido o expirado'
    });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.rol)) {
      return res.status(403).json({
        success: false,
        error: 'No tiene permisos para esta acción'
      });
    }
    next();
  };
}

module.exports = { authenticate, requireRole };
