import bcrypt from 'bcryptjs';
import prisma from '../src/config/prisma.js';

async function main() {
  console.log('Seeding demo data...');

  await prisma.pingLog.deleteMany();
  await prisma.incident.deleteMany();
  await prisma.monitorNotification.deleteMany();
  await prisma.monitor.deleteMany();
  await prisma.notificationChannel.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('PasswordKuat123!', 10);
  const user = await prisma.user.create({
    data: {
      email: 'ardy@example.com',
      passwordHash,
      name: 'Ardy Nugroho',
    },
  });

  const discordChannel = await prisma.notificationChannel.create({
    data: {
      userId: user.id,
      name: 'Discord #prod-alerts',
      type: 'DISCORD',
      webhookUrl: 'https://discord.com/api/webhooks/123456789012345678/mock-webhook-token-dev',
      isEnabled: true,
    },
  });

  const now = new Date();

  const authMonitor = await prisma.monitor.create({
    data: {
      userId: user.id,
      name: 'Production Auth Service',
      url: 'https://httpbin.org/status/200',
      method: 'GET',
      intervalSeconds: 60,
      timeoutMs: 8000,
      expectedStatusMin: 200,
      expectedStatusMax: 299,
      isActive: true,
      currentStatus: 'UP',
      lastLatencyMs: 118,
      lastCheckedAt: now,
      nextCheckAt: new Date(now.getTime() + 60000),
      notifications: {
        create: [{ channelId: discordChannel.id }],
      },
    },
  });

  const paymentMonitor = await prisma.monitor.create({
    data: {
      userId: user.id,
      name: 'Payment Gateway Webhook',
      url: 'https://httpbin.org/status/200',
      method: 'POST',
      intervalSeconds: 60,
      timeoutMs: 8000,
      expectedStatusMin: 200,
      expectedStatusMax: 299,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'ping' }),
      isActive: true,
      currentStatus: 'UP',
      lastLatencyMs: 165,
      lastCheckedAt: now,
      nextCheckAt: new Date(now.getTime() + 60000),
      notifications: {
        create: [{ channelId: discordChannel.id }],
      },
    },
  });

  const legacyMonitor = await prisma.monitor.create({
    data: {
      userId: user.id,
      name: 'Legacy Data Sync API',
      url: 'https://httpbin.org/status/503',
      method: 'GET',
      intervalSeconds: 300,
      timeoutMs: 5000,
      expectedStatusMin: 200,
      expectedStatusMax: 299,
      isActive: true,
      currentStatus: 'DOWN',
      lastLatencyMs: 842,
      lastCheckedAt: now,
      nextCheckAt: new Date(now.getTime() + 300000),
      notifications: {
        create: [{ channelId: discordChannel.id }],
      },
    },
  });

  const stagingMonitor = await prisma.monitor.create({
    data: {
      userId: user.id,
      name: 'Staging Ingestion Worker',
      url: 'https://httpbin.org/status/200',
      method: 'GET',
      intervalSeconds: 900,
      timeoutMs: 10000,
      expectedStatusMin: 200,
      expectedStatusMax: 299,
      isActive: false,
      currentStatus: 'PAUSED',
      lastLatencyMs: 95,
      lastCheckedAt: new Date(now.getTime() - 3600000),
      nextCheckAt: new Date(now.getTime() + 86400000),
    },
  });

  const authLogs = [];
  const paymentLogs = [];
  const legacyLogs = [];

  for (let i = 59; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 60 * 1000);

    const authLatency = 95 + Math.floor(Math.sin(i / 4) * 35) + (i === 15 ? 320 : 0);
    authLogs.push({
      monitorId: authMonitor.id,
      status: 'UP',
      statusCode: 200,
      latencyMs: authLatency,
      checkedAt: timestamp,
    });

    const isPayDown = i >= 35 && i <= 37;
    paymentLogs.push({
      monitorId: paymentMonitor.id,
      status: isPayDown ? 'DOWN' : 'UP',
      statusCode: isPayDown ? 502 : 200,
      latencyMs: isPayDown ? 1850 : 130 + Math.floor(Math.random() * 60),
      errorMessage: isPayDown ? 'HTTP 502 Bad Gateway' : null,
      checkedAt: timestamp,
    });

    const isLegacyDown = i <= 25;
    legacyLogs.push({
      monitorId: legacyMonitor.id,
      status: isLegacyDown ? 'DOWN' : 'UP',
      statusCode: isLegacyDown ? 503 : 200,
      latencyMs: isLegacyDown ? 920 : 210 + Math.floor(Math.random() * 80),
      errorMessage: isLegacyDown ? 'Unexpected HTTP status 503' : null,
      checkedAt: timestamp,
    });
  }

  await prisma.pingLog.createMany({ data: [...authLogs, ...paymentLogs, ...legacyLogs] });

  await prisma.incident.create({
    data: {
      monitorId: authMonitor.id,
      status: 'RESOLVED',
      cause: 'Latency spike exceeding threshold',
      startedAt: new Date(now.getTime() - 2 * 3600 * 1000),
      resolvedAt: new Date(now.getTime() - (2 * 3600 - 900) * 1000),
      durationSeconds: 900,
    },
  });

  await prisma.incident.create({
    data: {
      monitorId: paymentMonitor.id,
      status: 'RESOLVED',
      cause: 'HTTP 502 Bad Gateway',
      startedAt: new Date(now.getTime() - 37 * 60 * 1000),
      resolvedAt: new Date(now.getTime() - 35 * 60 * 1000),
      durationSeconds: 120,
    },
  });

  await prisma.incident.create({
    data: {
      monitorId: legacyMonitor.id,
      status: 'ONGOING',
      cause: 'HTTP 503 Service Unavailable',
      startedAt: new Date(now.getTime() - 25 * 60 * 1000),
    },
  });

  console.log(`Seeded 1 user, 1 notification channel, 4 monitors, and ${authLogs.length + paymentLogs.length + legacyLogs.length} ping logs.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
