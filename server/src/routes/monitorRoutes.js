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
} from '../controllers/monitorController.js';

const router = Router();

router.use(requireAuth);

router.get('/summary', handleGetSummary);
router.get('/', handleListMonitors);
router.post('/', validateBody(createMonitorSchema), handleCreateMonitor);
router.get('/:id', handleGetMonitorById);
router.patch('/:id', validateBody(updateMonitorSchema), handleUpdateMonitor);
router.delete('/:id', handleDeleteMonitor);

export default router;
