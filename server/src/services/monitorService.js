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
        nextCheckAt: new Date(),
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

export async function getMonitorsSummary(userId) {
  const monitors = await prisma.monitor.findMany({
    where: { userId },
    select: { id: true, currentStatus: true, isActive: true },
  });

  const totalMonitors = monitors.length;
  const statusCounts = { UP: 0, DOWN: 0, PAUSED: 0, PENDING: 0 };

  monitors.forEach((m) => {
    if (!m.isActive) {
      statusCounts.PAUSED += 1;
    } else {
      statusCounts[m.currentStatus] = (statusCounts[m.currentStatus] || 0) + 1;
    }
  });

  const monitorIds = monitors.map((m) => m.id);
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [totalLogs, upLogs, latencyAgg, activeIncidentsCount] = await Promise.all([
    prisma.pingLog.count({
      where: { monitorId: { in: monitorIds }, checkedAt: { gte: oneDayAgo } },
    }),
    prisma.pingLog.count({
      where: { monitorId: { in: monitorIds }, checkedAt: { gte: oneDayAgo }, status: 'UP' },
    }),
    prisma.pingLog.aggregate({
      where: { monitorId: { in: monitorIds }, checkedAt: { gte: oneDayAgo }, status: 'UP' },
      _avg: { latencyMs: true },
    }),
    prisma.incident.count({
      where: { monitorId: { in: monitorIds }, status: 'ONGOING' },
    }),
  ]);

  const overallUptime24h = totalLogs > 0 ? Number(((upLogs / totalLogs) * 100).toFixed(2)) : 100;
  const averageLatency24hMs = Math.round(latencyAgg._avg.latencyMs || 0);

  return {
    totalMonitors,
    statusCounts,
    overallUptime24h,
    averageLatency24hMs,
    activeIncidentsCount,
  };
}

export async function listMonitors(userId) {
  const monitors = await prisma.monitor.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      notifications: {
        include: { channel: true },
      },
    },
  });

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const monitorsWithDetails = await Promise.all(
    monitors.map(async (m) => {
      const [recentDesc, total24h, up24h] = await Promise.all([
        prisma.pingLog.findMany({
          where: { monitorId: m.id },
          orderBy: { checkedAt: 'desc' },
          take: 25,
          select: { status: true, latencyMs: true, checkedAt: true, statusCode: true },
        }),
        prisma.pingLog.count({
          where: { monitorId: m.id, checkedAt: { gte: oneDayAgo } },
        }),
        prisma.pingLog.count({
          where: { monitorId: m.id, checkedAt: { gte: oneDayAgo }, status: 'UP' },
        }),
      ]);

      const uptime24h = total24h > 0 ? Number(((up24h / total24h) * 100).toFixed(2)) : 100;
      // Reverse to chronological order (oldest to newest) for left-to-right 25-tick strip
      const recentHeartbeats = recentDesc.reverse();

      return {
        ...m,
        uptime24h,
        recentHeartbeats,
      };
    })
  );

  return monitorsWithDetails;
}

export async function getMonitorById(userId, id) {
  const monitor = await prisma.monitor.findFirst({
    where: { id, userId },
    include: {
      notifications: {
        include: { channel: true },
      },
    },
  });

  if (!monitor) {
    throw new AppError('Monitor not found', 404, 'NOT_FOUND');
  }

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [total24h, up24h, avgAgg] = await Promise.all([
    prisma.pingLog.count({ where: { monitorId: id, checkedAt: { gte: oneDayAgo } } }),
    prisma.pingLog.count({ where: { monitorId: id, checkedAt: { gte: oneDayAgo }, status: 'UP' } }),
    prisma.pingLog.aggregate({
      where: { monitorId: id, checkedAt: { gte: oneDayAgo }, status: 'UP' },
      _avg: { latencyMs: true },
    }),
  ]);

  const uptime24h = total24h > 0 ? Number(((up24h / total24h) * 100).toFixed(2)) : 100;

  return {
    ...monitor,
    uptime24h,
    avgLatency24hMs: Math.round(avgAgg._avg.latencyMs || 0),
  };
}

export async function updateMonitor(userId, id, input) {
  const existing = await prisma.monitor.findFirst({
    where: { id, userId },
  });

  if (!existing) {
    throw new AppError('Monitor not found', 404, 'NOT_FOUND');
  }

  if (input.url && input.url !== existing.url) {
    await validateSafeUrl(input.url);
  }

  const { notificationChannelIds, ...updateData } = input;

  return prisma.$transaction(async (tx) => {
    const updated = await tx.monitor.update({
      where: { id },
      data: {
        ...updateData,
        name: updateData.name ? updateData.name.trim() : undefined,
        url: updateData.url ? updateData.url.trim() : undefined,
      },
    });

    if (notificationChannelIds !== undefined) {
      await tx.monitorNotification.deleteMany({ where: { monitorId: id } });

      if (notificationChannelIds.length > 0) {
        const validChannels = await tx.notificationChannel.findMany({
          where: { id: { in: notificationChannelIds }, userId },
          select: { id: true },
        });

        if (validChannels.length > 0) {
          await tx.monitorNotification.createMany({
            data: validChannels.map((c) => ({
              monitorId: id,
              channelId: c.id,
            })),
          });
        }
      }
    }

    return updated;
  });
}

export async function deleteMonitor(userId, id) {
  const existing = await prisma.monitor.findFirst({
    where: { id, userId },
  });

  if (!existing) {
    throw new AppError('Monitor not found', 404, 'NOT_FOUND');
  }

  await prisma.monitor.delete({
    where: { id },
  });

  return { id };
}

export async function toggleMonitorStatus(userId, id) {
  const monitor = await prisma.monitor.findFirst({
    where: { id, userId },
  });

  if (!monitor) {
    throw new AppError('Monitor not found', 404, 'NOT_FOUND');
  }

  const newIsActive = !monitor.isActive;
  const newStatus = newIsActive ? 'PENDING' : 'PAUSED';
  const nextCheckAt = newIsActive ? new Date() : new Date(Date.now() + 365 * 24 * 3600 * 1000);

  const updated = await prisma.monitor.update({
    where: { id },
    data: {
      isActive: newIsActive,
      currentStatus: newStatus,
      nextCheckAt,
    },
  });

  return {
    id: updated.id,
    isActive: updated.isActive,
    currentStatus: updated.currentStatus,
  };
}

export async function getMonitorMetrics(userId, monitorId, range = '24h') {
  const monitor = await prisma.monitor.findFirst({
    where: { id: monitorId, userId },
  });

  if (!monitor) {
    throw new AppError('Monitor not found', 404, 'NOT_FOUND');
  }

  const now = Date.now();
  let durationMs = 24 * 60 * 60 * 1000;
  if (range === '1h') durationMs = 60 * 60 * 1000;
  if (range === '7d') durationMs = 7 * 24 * 60 * 60 * 1000;
  if (range === '30d') durationMs = 30 * 24 * 60 * 60 * 1000;

  const sinceDate = new Date(now - durationMs);

  const logs = await prisma.pingLog.findMany({
    where: {
      monitorId,
      checkedAt: { gte: sinceDate },
    },
    orderBy: { checkedAt: 'asc' },
    select: {
      checkedAt: true,
      latencyMs: true,
      status: true,
      statusCode: true,
    },
  });

  const totalChecks = logs.length;
  const successfulChecks = logs.filter((l) => l.status === 'UP').length;
  const failedChecks = totalChecks - successfulChecks;
  const uptimePercentage = totalChecks > 0 ? Number(((successfulChecks / totalChecks) * 100).toFixed(2)) : 100;

  const upLatencies = logs.filter((l) => l.status === 'UP').map((l) => l.latencyMs).sort((a, b) => a - b);

  let avgLatencyMs = 0;
  let minLatencyMs = 0;
  let maxLatencyMs = 0;
  let p95LatencyMs = 0;

  if (upLatencies.length > 0) {
    avgLatencyMs = Math.round(upLatencies.reduce((sum, val) => sum + val, 0) / upLatencies.length);
    minLatencyMs = upLatencies[0];
    maxLatencyMs = upLatencies[upLatencies.length - 1];
    const p95Index = Math.floor(upLatencies.length * 0.95);
    p95LatencyMs = upLatencies[Math.min(p95Index, upLatencies.length - 1)];
  }

  const series = logs.map((l) => ({
    timestamp: l.checkedAt.toISOString(),
    latencyMs: l.latencyMs,
    status: l.status,
    statusCode: l.statusCode,
  }));

  return {
    monitorId,
    range,
    summary: {
      uptimePercentage,
      totalChecks,
      successfulChecks,
      failedChecks,
      avgLatencyMs,
      minLatencyMs,
      maxLatencyMs,
      p95LatencyMs,
    },
    series,
  };
}

export async function getMonitorLogs(userId, monitorId, { page = 1, limit = 50 } = {}) {
  const monitor = await prisma.monitor.findFirst({
    where: { id: monitorId, userId },
  });

  if (!monitor) {
    throw new AppError('Monitor not found', 404, 'NOT_FOUND');
  }

  const take = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);
  const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * take;

  const [total, logs] = await Promise.all([
    prisma.pingLog.count({ where: { monitorId } }),
    prisma.pingLog.findMany({
      where: { monitorId },
      orderBy: { checkedAt: 'desc' },
      skip,
      take,
    }),
  ]);

  return {
    logs,
    meta: {
      page: parseInt(page, 10) || 1,
      limit: take,
      total,
      totalPages: Math.ceil(total / take),
    },
  };
}

export async function getMonitorIncidents(userId, monitorId) {
  const monitor = await prisma.monitor.findFirst({
    where: { id: monitorId, userId },
  });

  if (!monitor) {
    throw new AppError('Monitor not found', 404, 'NOT_FOUND');
  }

  return prisma.incident.findMany({
    where: { monitorId },
    orderBy: { startedAt: 'desc' },
  });
}
