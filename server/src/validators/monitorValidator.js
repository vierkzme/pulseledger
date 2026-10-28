import { z } from 'zod';

const ALLOWED_INTERVALS = [60, 180, 300, 900, 1800];

export const createMonitorSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must not exceed 100 characters'),
    url: z.string().url('A valid URL is required (e.g. https://api.example.com/health)'),
    method: z.enum(['GET', 'POST', 'PUT', 'HEAD', 'DELETE']).default('GET'),
    intervalSeconds: z.number().refine((val) => ALLOWED_INTERVALS.includes(val), {
      message: 'Interval must be one of: 60s, 180s, 300s, 900s, 1800s',
    }).default(60),
    timeoutMs: z.number().int().min(1000, 'Timeout must be at least 1,000 ms').max(30000, 'Timeout cannot exceed 30,000 ms').default(10000),
    expectedStatusMin: z.number().int().min(100).max(599).default(200),
    expectedStatusMax: z.number().int().min(100).max(599).default(299),
    headers: z.record(z.string()).optional().default({}),
    body: z.string().nullable().optional(),
    notificationChannelIds: z.array(z.string().uuid()).optional().default([]),
  })
  .refine((data) => data.expectedStatusMin <= data.expectedStatusMax, {
    message: 'Expected status min must be less than or equal to status max',
    path: ['expectedStatusMax'],
  })
  .refine((data) => data.timeoutMs < data.intervalSeconds * 1000, {
    message: 'Timeout duration must be strictly lower than check interval',
    path: ['timeoutMs'],
  });

export const updateMonitorSchema = z
  .object({
    name: z.string().min(2).max(100).optional(),
    url: z.string().url().optional(),
    method: z.enum(['GET', 'POST', 'PUT', 'HEAD', 'DELETE']).optional(),
    intervalSeconds: z.number().refine((val) => ALLOWED_INTERVALS.includes(val)).optional(),
    timeoutMs: z.number().int().min(1000).max(30000).optional(),
    expectedStatusMin: z.number().int().min(100).max(599).optional(),
    expectedStatusMax: z.number().int().min(100).max(599).optional(),
    headers: z.record(z.string()).optional(),
    body: z.string().nullable().optional(),
    notificationChannelIds: z.array(z.string().uuid()).optional(),
  });
