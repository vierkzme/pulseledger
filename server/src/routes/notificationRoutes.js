import { Router } from 'express';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { validateBody } from '../validators/authValidator.js';
import { createNotificationSchema, updateNotificationSchema } from '../validators/notificationValidator.js';
import {
  handleListNotifications,
  handleCreateNotification,
  handleUpdateNotification,
  handleDeleteNotification,
  handleTestNotification,
} from '../controllers/notificationController.js';

const router = Router();

router.use(requireAuth);

router.get('/', handleListNotifications);
router.post('/', validateBody(createNotificationSchema), handleCreateNotification);
router.put('/:id', validateBody(updateNotificationSchema), handleUpdateNotification);
router.post('/:id/test', handleTestNotification);
router.delete('/:id', handleDeleteNotification);

export default router;
