import {
  listNotificationChannels,
  createNotificationChannel,
  deleteNotificationChannel,
  testNotificationChannel,
} from '../services/notificationService.js';

export async function handleListNotifications(req, res, next) {
  try {
    const data = await listNotificationChannels(req.user.id);
    res.json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
}

export async function handleCreateNotification(req, res, next) {
  try {
    const data = await createNotificationChannel(req.user.id, req.body);
    res.status(201).json({
      success: true,
      message: 'Discord notification channel configured successfully',
      data,
    });
  } catch (err) {
    next(err);
  }
}

export async function handleDeleteNotification(req, res, next) {
  try {
    await deleteNotificationChannel(req.user.id, req.params.id);
    res.json({
      success: true,
      message: 'Notification channel deleted successfully',
      data: { id: req.params.id },
    });
  } catch (err) {
    next(err);
  }
}

export async function handleTestNotification(req, res, next) {
  try {
    const result = await testNotificationChannel(req.user.id, req.params.id);
    res.json({
      success: true,
      message: result.message,
    });
  } catch (err) {
    next(err);
  }
}
