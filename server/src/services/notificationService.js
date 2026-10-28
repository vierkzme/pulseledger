import prisma from '../config/prisma.js';
import { AppError } from '../middlewares/errorHandler.js';

export async function listNotificationChannels(userId) {
  return prisma.notificationChannel.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createNotificationChannel(userId, data) {
  return prisma.notificationChannel.create({
    data: {
      userId,
      name: data.name.trim(),
      type: data.type || 'DISCORD',
      webhookUrl: data.webhookUrl.trim(),
      isEnabled: true,
    },
  });
}

export async function deleteNotificationChannel(userId, id) {
  const channel = await prisma.notificationChannel.findFirst({
    where: { id, userId },
  });

  if (!channel) {
    throw new AppError('Notification channel not found', 404, 'NOT_FOUND');
  }

  await prisma.notificationChannel.delete({
    where: { id },
  });

  return { id };
}
