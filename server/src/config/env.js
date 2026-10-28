import dotenv from 'dotenv';
dotenv.config();

export const env = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://uptime_user:uptime_secret@localhost:5432/uptime_monitor?schema=public',
  jwtSecret: process.env.JWT_SECRET || 'pulseledger_jwt_secret_dev_key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  workerConcurrency: parseInt(process.env.WORKER_CONCURRENCY || '20', 10),
  workerTickMs: parseInt(process.env.WORKER_TICK_MS || '10000', 10),
};
