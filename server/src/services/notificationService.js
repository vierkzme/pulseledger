import prisma from '../config/prisma.js';
import { AppError } from '../middlewares/errorHandler.js';
import { sendDiscordWebhook, buildTestEmbed } from './discordService.js';

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

export async function updateNotificationChannel(userId, id, data) {
  const channel = await prisma.notificationChannel.findFirst({
    where: { id, userId },
  });

  if (!channel) {
    throw new AppError('Notification channel not found', 404, 'NOT_FOUND');
  }

  return prisma.notificationChannel.update({
    where: { id },
    data: {
      name: data.name ? data.name.trim() : undefined,
      webhookUrl: data.webhookUrl ? data.webhookUrl.trim() : undefined,
      isEnabled: data.isEnabled !== undefined ? data.isEnabled : undefined,
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

export async function testNotificationChannel(userId, id) {
  const channel = await prisma.notificationChannel.findFirst({
    where: { id, userId },
  });

  if (!channel) {
    throw new AppError('Notification channel not found', 404, 'NOT_FOUND');
  }

  const payload = buildTestEmbed(channel.name);
  const sent = await sendDiscordWebhook(channel.webhookUrl, payload);

  if (!sent) {
    throw new AppError('Failed to send test message to Discord webhook. Please verify the URL.', 400, 'WEBHOOK_FAILED');
  }

  return { success: true, message: `Test alert dispatched to ${channel.name}` };
}
