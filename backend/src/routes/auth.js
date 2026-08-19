/**
 * Rutas de autenticación
 */

const express = require('express');
const router = express.Router();
const authService = require('../services/authService');

router.post('/login', (req, res) => {
  const { codigoOrDpi, codigoActivacion } = req.body;

  if (!codigoOrDpi) {
    return res.status(400).json({
      success: false,
      error: 'Código de empleado o DPI requerido'
    });
  }

  const result = authService.activateOrLogin({ codigoOrDpi, codigoActivacion });

  if (!result.success) {
    return res.status(401).json(result);
  }

  res.json(result);
});

router.post('/activate', (req, res) => {
  const { codigoOrDpi, codigoActivacion } = req.body;

  if (!codigoOrDpi || !codigoActivacion) {
    return res.status(400).json({
      success: false,
      error: 'Código de empleado/DPI y código de activación requeridos'
    });
  }

  const result = authService.activateOrLogin({ codigoOrDpi, codigoActivacion });

  if (!result.success) {
    return res.status(401).json(result);
  }

  res.json(result);
});

module.exports = router;
