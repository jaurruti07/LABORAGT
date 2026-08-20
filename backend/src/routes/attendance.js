const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const attendanceService = require('../services/attendanceService');

router.use(authenticate);

router.get('/today', (req, res) => {
  try {
    const summary = attendanceService.getTodaySummary(req.user.id);
    if (!summary.success) {
      return res.status(summary.error === 'Usuario no encontrado' ? 404 : 500).json(summary);
    }
    return res.json(summary);
  } catch (err) {
    console.error('[attendance/today]', err.message);
    return res.status(500).json({ success: false, error: 'Error al obtener jornada de hoy' });
  }
});

function handleCheck(tipo) {
  return (req, res) => {
    try {
      const body = req.body || {};
      const {
        latitud,
        longitud,
        precision_gps,
        fotografia_base64,
        dispositivo,
        client_timestamp
      } = body;

      if (latitud == null || longitud == null) {
        return res.status(400).json({
          success: false,
          error: 'Latitud y longitud son requeridas'
        });
      }

      const lat = Number(latitud);
      const lng = Number(longitud);
      if (Number.isNaN(lat) || Number.isNaN(lng)) {
        return res.status(400).json({
          success: false,
          error: 'Latitud y longitud deben ser números válidos'
        });
      }

      const result = attendanceService.processCheck({
        userId: req.user.id,
        tipo,
        latitud: lat,
        longitud: lng,
        precision_gps: precision_gps != null ? Number(precision_gps) : null,
        fotografia_base64,
        dispositivo,
        client_timestamp
      });

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(201).json(result);
    } catch (err) {
      console.error('[attendance/' + tipo + ']', err.message);
      return res.status(500).json({
        success: false,
        error: 'Error al registrar el marcaje'
      });
    }
  };
}

router.get('/history', (req, res) => {
  try {
    const from = req.query.from || null;
    const to = req.query.to || null;
    const result = attendanceService.getHistory(req.user.id, from, to);
    if (!result.success) return res.status(500).json(result);
    return res.json(result);
  } catch (err) {
    console.error('[attendance/history]', err.message);
    return res.status(500).json({ success: false, error: 'Error al obtener historial' });
  }
});

router.get('/stats', (req, res) => {
  try {
    const result = attendanceService.getPerformanceStats(req.user.id);
    if (!result.success) return res.status(500).json(result);
    return res.json(result);
  } catch (err) {
    console.error('[attendance/stats]', err.message);
    return res.status(500).json({ success: false, error: 'Error al obtener estadísticas' });
  }
});

router.post('/check-in', handleCheck('ENTRADA'));
router.post('/lunch-out', handleCheck('SALIDA_ALMUERZO'));
router.post('/lunch-in', handleCheck('REGRESO_ALMUERZO'));
router.post('/check-out', handleCheck('SALIDA'));

module.exports = router;
