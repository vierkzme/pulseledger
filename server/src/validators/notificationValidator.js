import { z } from 'zod';

const DISCORD_WEBHOOK_REGEX = /^https:\/\/(discord\.com|discordapp\.com)\/api\/webhooks\/\d+\/[\w-]+$/;

export const createNotificationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must not exceed 100 characters'),
  type: z.enum(['DISCORD']).default('DISCORD'),
  webhookUrl: z.string().regex(DISCORD_WEBHOOK_REGEX, 'Must be a valid Discord webhook URL (e.g. https://discord.com/api/webhooks/...)'),
});

export const updateNotificationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must not exceed 100 characters').optional(),
  type: z.enum(['DISCORD']).optional(),
  webhookUrl: z.string().regex(DISCORD_WEBHOOK_REGEX, 'Must be a valid Discord webhook URL (e.g. https://discord.com/api/webhooks/...)').optional(),
  isEnabled: z.boolean().optional(),
});
