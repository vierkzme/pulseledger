import app from './app.js';
import { env } from './config/env.js';
import prisma from './config/prisma.js';
import { startScheduler } from './worker/scheduler.js';
import { startCleanupJob } from './worker/cleanupJob.js';

const server = app.listen(env.port, () => {
  console.log(`[PulseLedger API] Listening on port ${env.port} (${env.nodeEnv})`);
});

const scheduler = startScheduler();
const cleanupJob = startCleanupJob();

async function handleShutdown(signal) {
  console.log(`\n[Shutdown] Received ${signal}. Gracefully stopping PulseLedger services...`);
  scheduler.stop();
  cleanupJob.stop();

  server.close(async () => {
    console.log('[Shutdown] HTTP server closed.');
    await prisma.$disconnect();
    console.log('[Shutdown] Database connection terminated.');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('[Shutdown] Forceful shutdown triggered after timeout.');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));
