import prisma from '../config/prisma.js';
import { env } from '../config/env.js';
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

export async function processMonitorCheck(monitor) {
  const result = await checkMonitorWithRetry(monitor);

  await prisma.pingLog.create({
    data: {
      monitorId: monitor.id,
      status: result.status,
      statusCode: result.statusCode,
      latencyMs: result.latencyMs,
      errorMessage: result.errorMessage,
      checkedAt: new Date(),
    },
  });

  await handleIncidentAndAlerts(monitor, result);

  const nextCheckAt = new Date(Date.now() + monitor.intervalSeconds * 1000);
  await prisma.monitor.update({
    where: { id: monitor.id },
    data: {
      currentStatus: result.status,
      lastLatencyMs: result.latencyMs,
      lastCheckedAt: new Date(),
      nextCheckAt,
    },
  });
}

// Simple concurrency limiter helper
async function mapConcurrent(items, limit, fn) {
  const results = [];
  const executing = [];

  for (const item of items) {
    const p = Promise.resolve().then(() => fn(item));
    results.push(p);

    if (limit <= items.length) {
      const e = p.then(() => executing.splice(executing.indexOf(e), 1));
      executing.push(e);
      if (executing.length >= limit) {
        await Promise.race(executing);
      }
    }
  }

  return Promise.allSettled(results);
}

export function startScheduler(options = {}) {
  const tickMs = options.tickMs || env.workerTickMs || 10000;
  const concurrency = options.concurrency || env.workerConcurrency || 20;

  let isRunning = true;
  let isTickInProgress = false;

  const tick = async () => {
    if (!isRunning || isTickInProgress) return;
    isTickInProgress = true;

    try {
      const dueMonitors = await prisma.monitor.findMany({
        where: {
          isActive: true,
          nextCheckAt: { lte: new Date() },
        },
        take: 50,
      });

      if (dueMonitors.length > 0) {
        await mapConcurrent(dueMonitors, concurrency, processMonitorCheck);
      }
    } catch (err) {
      console.error('[Worker Scheduler Error]', err);
    } finally {
      isTickInProgress = false;
    }
  };

  const intervalId = setInterval(tick, tickMs);
  // Run initial tick immediately
  setTimeout(tick, 100);

  return {
    stop() {
      isRunning = false;
      clearInterval(intervalId);
    },
  };
}
