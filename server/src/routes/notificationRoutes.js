import { Router } from 'express';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { validateBody } from '../validators/authValidator.js';
import { createNotificationSchema } from '../validators/notificationValidator.js';
import {
  handleListNotifications,
  handleCreateNotification,
  handleDeleteNotification,
} from '../controllers/notificationController.js';

const router = Router();

router.use(requireAuth);

router.get('/', handleListNotifications);
router.post('/', validateBody(createNotificationSchema), handleCreateNotification);
router.delete('/:id', handleDeleteNotification);

export default router;
