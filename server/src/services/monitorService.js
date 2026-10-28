import prisma from '../config/prisma.js';
import { validateSafeUrl } from '../utils/ssrfValidator.js';
import { AppError } from '../middlewares/errorHandler.js';

export async function createMonitor(userId, input) {
  await validateSafeUrl(input.url);

  const { notificationChannelIds, ...monitorData } = input;

  return prisma.$transaction(async (tx) => {
    const monitor = await tx.monitor.create({
      data: {
        userId,
        name: monitorData.name.trim(),
        url: monitorData.url.trim(),
        method: monitorData.method || 'GET',
        headers: monitorData.headers || {},
        body: monitorData.body || null,
        intervalSeconds: monitorData.intervalSeconds || 60,
        timeoutMs: monitorData.timeoutMs || 10000,
        expectedStatusMin: monitorData.expectedStatusMin || 200,
        expectedStatusMax: monitorData.expectedStatusMax || 299,
        isActive: true,
        currentStatus: 'PENDING',
        nextCheckAt: new Date(), // Immediate initial check
      },
    });

    if (notificationChannelIds && notificationChannelIds.length > 0) {
      const validChannels = await tx.notificationChannel.findMany({
        where: { id: { in: notificationChannelIds }, userId },
        select: { id: true },
      });

      if (validChannels.length > 0) {
        await tx.monitorNotification.createMany({
          data: validChannels.map((c) => ({
            monitorId: monitor.id,
            channelId: c.id,
          })),
        });
      }
    }

    return monitor;
  });
}
