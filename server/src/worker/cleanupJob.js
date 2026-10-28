import prisma from '../config/prisma.js';

export async function pruneOldPingLogs(retentionDays = 30) {
  const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
  const result = await prisma.pingLog.deleteMany({
    where: {
      checkedAt: { lt: cutoffDate },
    },
  });

  if (result.count > 0) {
    console.log(`[Retention] Pruned ${result.count} historical ping logs older than ${retentionDays} days.`);
  }

  return result.count;
}

export function startCleanupJob(intervalHours = 24) {
  const intervalMs = intervalHours * 60 * 60 * 1000;

  // Run initial check on startup
  pruneOldPingLogs().catch((err) => console.error('[Retention Error]', err));

  const timer = setInterval(() => {
    pruneOldPingLogs().catch((err) => console.error('[Retention Error]', err));
  }, intervalMs);

  return {
    stop() {
      clearInterval(timer);
    },
  };
}
