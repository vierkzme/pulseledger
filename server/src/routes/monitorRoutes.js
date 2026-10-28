import { Router } from 'express';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { validateBody } from '../validators/authValidator.js';
import { createMonitorSchema, updateMonitorSchema } from '../validators/monitorValidator.js';
import {
  handleGetSummary,
  handleListMonitors,
  handleCreateMonitor,
  handleGetMonitorById,
  handleUpdateMonitor,
  handleDeleteMonitor,
  handleToggleMonitor,
  handleGetMetrics,
  handleGetLogs,
  handleGetIncidents,
} from '../controllers/monitorController.js';

const router = Router();

router.use(requireAuth);

router.get('/summary', handleGetSummary);
router.get('/', handleListMonitors);
router.post('/', validateBody(createMonitorSchema), handleCreateMonitor);
router.get('/:id', handleGetMonitorById);
router.patch('/:id', validateBody(updateMonitorSchema), handleUpdateMonitor);
router.patch('/:id/toggle', handleToggleMonitor);
router.delete('/:id', handleDeleteMonitor);

router.get('/:id/metrics', handleGetMetrics);
router.get('/:id/logs', handleGetLogs);
router.get('/:id/incidents', handleGetIncidents);

export default router;
