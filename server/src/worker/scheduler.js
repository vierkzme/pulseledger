import prisma from '../config/prisma.js';
import { executePing } from './pinger.js';
import {
  sendDiscordWebhook,
  buildDownEmbed,
  buildRecoveryEmbed,
} from '../services/discordService.js';

export async function checkMonitorWithRetry(monitor) {
  let result = await executePing(monitor);

  // Anti-flapping: if previously UP and initial ping fails, retry once after 5s
  if (result.status === 'DOWN' && monitor.currentStatus === 'UP') {
    await new Promise((resolve) => setTimeout(resolve, 5000));
    result = await executePing(monitor);
  }

  return result;
}

export async function handleIncidentAndAlerts(monitor, result) {
  const previousStatus = monitor.currentStatus;
  const newStatus = result.status;

  const linkedChannels = await prisma.monitorNotification.findMany({
    where: { monitorId: monitor.id },
    include: { channel: true },
  });

  // State Transition: UP/PENDING -> DOWN
  if (newStatus === 'DOWN' && previousStatus !== 'DOWN') {
    const cause = result.errorMessage || `HTTP status ${result.statusCode}`;
    await prisma.incident.create({
      data: {
        monitorId: monitor.id,
        status: 'ONGOING',
        cause,
        startedAt: new Date(),
      },
    });

    const payload = buildDownEmbed(monitor, result);
    await Promise.all(
      linkedChannels
        .filter((ln) => ln.channel.isEnabled)
        .map((ln) => sendDiscordWebhook(ln.channel.webhookUrl, payload))
    );
  }

  // State Transition: DOWN -> UP
  if (newStatus === 'UP' && previousStatus === 'DOWN') {
    const activeIncident = await prisma.incident.findFirst({
      where: { monitorId: monitor.id, status: 'ONGOING' },
      orderBy: { startedAt: 'desc' },
    });

    let durationSeconds = 0;
    if (activeIncident) {
      durationSeconds = Math.max(1, Math.round((Date.now() - activeIncident.startedAt.getTime()) / 1000));
      await prisma.incident.update({
        where: { id: activeIncident.id },
        data: {
          status: 'RESOLVED',
          resolvedAt: new Date(),
          durationSeconds,
        },
      });
    }

    const payload = buildRecoveryEmbed(monitor, result, durationSeconds);
    await Promise.all(
      linkedChannels
        .filter((ln) => ln.channel.isEnabled)
        .map((ln) => sendDiscordWebhook(ln.channel.webhookUrl, payload))
    );
  }
}
