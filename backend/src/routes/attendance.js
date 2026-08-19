/**
 * Rutas de marcajes
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const attendanceService = require('../services/attendanceService');

router.use(authenticate);

router.get('/today', (req, res) => {
  const summary = attendanceService.getTodaySummary(req.user.id);
  if (!summary) {
    return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
  }
  res.json({ success: true, data: summary });
});

function handleCheck(tipo) {
  return (req, res) => {
    const {
      latitud,
      longitud,
      precision_gps,
      fotografia_base64,
      dispositivo,
      client_timestamp
    } = req.body;

    if (latitud == null || longitud == null) {
      return res.status(400).json({
        success: false,
        error: 'Latitud y longitud son requeridas'
      });
    }

    const result = attendanceService.processCheck({
      userId: req.user.id,
      tipo,
      latitud: Number(latitud),
      longitud: Number(longitud),
      precision_gps: precision_gps ? Number(precision_gps) : null,
      fotografia_base64,
      dispositivo,
      client_timestamp
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);
  };
}

router.post('/check-in', handleCheck('ENTRADA'));
router.post('/lunch-out', handleCheck('SALIDA_ALMUERZO'));
router.post('/lunch-in', handleCheck('REGRESO_ALMUERZO'));
router.post('/check-out', handleCheck('SALIDA'));

module.exports = router;
