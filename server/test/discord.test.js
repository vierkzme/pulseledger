import { describe, it, expect } from 'vitest';
import {
  formatDuration,
  buildDownEmbed,
  buildRecoveryEmbed,
  buildTestEmbed,
} from '../src/services/discordService.js';

describe('Discord Embed & Notification English Formatter', () => {
  it('formats duration in English with proper singular/plural grammar', () => {
    expect(formatDuration(0)).toBe('0 seconds');
    expect(formatDuration(1)).toBe('1 second');
    expect(formatDuration(45)).toBe('45 seconds');
    expect(formatDuration(60)).toBe('1 minute');
    expect(formatDuration(135)).toBe('2 minutes 15 seconds');
    expect(formatDuration(3600)).toBe('1 hour');
    expect(formatDuration(3660)).toBe('1 hour 1 minute');
    expect(formatDuration(3661)).toBe('1 hour 1 minute 1 second');
  });

  it('builds down alert embed completely in English', () => {
    const mockMonitor = {
      name: 'Auth API Service',
      method: 'GET',
      url: 'https://api.example.com/health',
    };
    const mockFailure = {
      statusCode: 503,
      errorMessage: 'Service Unavailable',
      latencyMs: 1420,
    };

    const embedObj = buildDownEmbed(mockMonitor, mockFailure);
    expect(embedObj.username).toBe('PulseLedger Monitor');
    const embed = embedObj.embeds[0];
    expect(embed.title).toContain('🔴 Monitor DOWN: Auth API Service');
    expect(embed.description).toBe('Endpoint is not responding as expected after confirmation retry.');
    expect(embed.color).toBe(15680580);

    const fieldNames = embed.fields.map((f) => f.name);
    expect(fieldNames).toContain('Target Endpoint');
    expect(fieldNames).toContain('Failure Cause');
    expect(fieldNames).toContain('Response Time');
    expect(fieldNames).toContain('Incident Timestamp (UTC)');

    // Ensure no Indonesian words remain
    const jsonStr = JSON.stringify(embedObj);
    expect(jsonStr).not.toMatch(/tidak merespons|Penyebab Kegagalan|Waktu Kejadian/i);
  });

  it('builds recovery alert embed completely in English', () => {
    const mockMonitor = {
      name: 'Payment Webhook',
      method: 'POST',
      url: 'https://pay.example.com/ping',
    };
    const mockRecovery = {
      statusCode: 200,
      latencyMs: 114,
    };

    const embedObj = buildRecoveryEmbed(mockMonitor, mockRecovery, 860);
    const embed = embedObj.embeds[0];
    expect(embed.title).toContain('🟢 Monitor RECOVERED: Payment Webhook');
    expect(embed.description).toBe('Service has recovered and is responding normally.');
    expect(embed.color).toBe(1096065);

    const fieldNames = embed.fields.map((f) => f.name);
    expect(fieldNames).toContain('Target Endpoint');
    expect(fieldNames).toContain('Current Status & Latency');
    expect(fieldNames).toContain('Total Downtime Duration');

    const durationField = embed.fields.find((f) => f.name === 'Total Downtime Duration');
    expect(durationField.value).toContain('14 minutes 20 seconds');

    // Ensure no Indonesian words remain
    const jsonStr = JSON.stringify(embedObj);
    expect(jsonStr).not.toMatch(/Layanan telah kembali|Durasi Downtime|menit|detik/i);
  });

  it('builds test alert embed completely in English', () => {
    const embedObj = buildTestEmbed('ops-alerts');
    const embed = embedObj.embeds[0];
    expect(embed.title).toContain('🧪 Test Notification: PulseLedger');
    expect(embed.description).toBe('Webhook connection verified successfully for channel **ops-alerts**.');

    const statusField = embed.fields.find((f) => f.name === 'Webhook Status');
    expect(statusField.value).toBe('🟢 Active and ready to receive alerts');

    const timestampField = embed.fields.find((f) => f.name === 'Test Timestamp (UTC)');
    expect(timestampField).toBeDefined();

    // Ensure no Indonesian words remain
    const jsonStr = JSON.stringify(embedObj);
    expect(jsonStr).not.toMatch(/Koneksi webhook|Status Webhook|Waktu Uji Coba|Siap Menerima/i);
  });
});
