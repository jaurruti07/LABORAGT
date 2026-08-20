const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const permissionService = require('../services/permissionService');

router.use(authenticate);

/** Motivos disponibles */
router.get('/motivos', (req, res) => {
  res.json({ success: true, data: permissionService.MOTIVOS });
});

/** Mis solicitudes (colaborador) */
router.get('/mine', (req, res) => {
  try {
    const result = permissionService.listMine(req.user.id);
    if (!result.success) return res.status(500).json(result);
    return res.json(result);
  } catch (err) {
    console.error('[permissions/mine]', err.message);
    return res.status(500).json({ success: false, error: 'Error al listar permisos' });
  }
});

/** Crear solicitud */
router.post('/', (req, res) => {
  try {
    const result = permissionService.createRequest(req.user.id, req.body);
    if (!result.success) return res.status(400).json(result);
    return res.status(201).json(result);
  } catch (err) {
    console.error('[permissions/create]', err.message);
    return res.status(500).json({ success: false, error: 'Error al crear solicitud' });
  }
});

/** Listado para jefe */
router.get('/team', requireRole('jefe', 'admin', 'administrador'), (req, res) => {
  try {
    const result = permissionService.listAllForBoss(req.user.id);
    if (!result.success) return res.status(500).json(result);
    return res.json(result);
  } catch (err) {
    console.error('[permissions/team]', err.message);
    return res.status(500).json({ success: false, error: 'Error al listar' });
  }
});

router.get('/pending', requireRole('jefe', 'admin', 'administrador'), (req, res) => {
  try {
    const result = permissionService.listPendingForBoss(req.user.id);
    if (!result.success) return res.status(500).json(result);
    return res.json(result);
  } catch (err) {
    console.error('[permissions/pending]', err.message);
    return res.status(500).json({ success: false, error: 'Error al listar pendientes' });
  }
});

/** Aprobar / rechazar */
router.post('/:id/decide', requireRole('jefe', 'admin', 'administrador'), (req, res) => {
  try {
    const { decision, comentario } = req.body || {};
    const result = permissionService.decide(req.user.id, req.params.id, decision, comentario);
    if (!result.success) return res.status(400).json(result);
    return res.json(result);
  } catch (err) {
    console.error('[permissions/decide]', err.message);
    return res.status(500).json({ success: false, error: 'Error al decidir' });
  }
});

module.exports = router;
