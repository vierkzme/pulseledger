export function formatDuration(totalSeconds) {
  if (!totalSeconds || totalSeconds < 60) {
    return `${totalSeconds || 0} detik`;
  }
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  if (minutes < 60) {
    return `${minutes} menit ${remainingSeconds} detik`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours} jam ${remainingMinutes} menit ${remainingSeconds} detik`;
}

export async function sendDiscordWebhook(webhookUrl, payload, maxRetries = 2) {
  let attempt = 0;
  while (attempt <= maxRetries) {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.status === 429) {
        attempt++;
        const retryAfter = Number(response.headers.get('retry-after') || 2);
        await new Promise((r) => setTimeout(r, retryAfter * 1000));
        continue;
      }

      if (!response.ok) {
        const text = await response.text();
        console.warn(`Discord webhook returned status ${response.status}: ${text}`);
      }
      return true;
    } catch (err) {
      attempt++;
      if (attempt > maxRetries) {
        console.warn(`Failed to dispatch Discord webhook after ${maxRetries} attempts: ${err.message}`);
        return false;
      }
      await new Promise((r) => setTimeout(r, 1500 * attempt));
    }
  }
  return false;
}

export function buildDownEmbed(monitor, failureDetails) {
  const timestamp = new Date().toISOString();
  return {
    username: 'PulseLedger Monitor',
    embeds: [
      {
        title: `🔴 Monitor DOWN: ${monitor.name}`,
        description: 'Endpoint tidak merespons sesuai ekspektasi setelah verifikasi ulang.',
        color: 15680580, // #EF4444
        fields: [
          {
            name: 'Target Endpoint',
            value: `\`${monitor.method} ${monitor.url}\``,
            inline: false,
          },
          {
            name: 'Penyebab Kegagalan',
            value: `**${failureDetails.errorMessage || `HTTP ${failureDetails.statusCode}`}**`,
            inline: true,
          },
          {
            name: 'Response Time',
            value: `\`${failureDetails.latencyMs || 0} ms\``,
            inline: true,
          },
          {
            name: 'Waktu Kejadian (UTC)',
            value: `\`${new Date().toUTCString()}\``,
            inline: false,
          },
        ],
        footer: {
          text: 'API Uptime & Latency Monitor',
        },
        timestamp,
      },
    ],
  };
}

export function buildRecoveryEmbed(monitor, recoveryDetails, durationSeconds) {
  const timestamp = new Date().toISOString();
  return {
    username: 'PulseLedger Monitor',
    embeds: [
      {
        title: `🟢 Monitor RECOVERED: ${monitor.name}`,
        description: 'Layanan telah kembali aktif dan merespons secara normal.',
        color: 1096065, // #10B981
        fields: [
          {
            name: 'Target Endpoint',
            value: `\`${monitor.method} ${monitor.url}\``,
            inline: false,
          },
          {
            name: 'Status & Latency Saat Ini',
            value: `**HTTP ${recoveryDetails.statusCode || 200}** (\`${recoveryDetails.latencyMs} ms\`)`,
            inline: true,
          },
          {
            name: 'Total Durasi Downtime',
            value: `**${formatDuration(durationSeconds)}**`,
            inline: true,
          },
        ],
        footer: {
          text: 'API Uptime & Latency Monitor',
        },
        timestamp,
      },
    ],
  };
}

export function buildTestEmbed(channelName) {
  return {
    username: 'PulseLedger Monitor',
    embeds: [
      {
        title: '🧪 Test Notification: PulseLedger',
        description: `Koneksi webhook berhasil diverifikasi untuk kanal **${channelName}**.`,
        color: 1610507, // Amber #1890FF / #F59E0B
        fields: [
          {
            name: 'Status Webhook',
            value: '🟢 Aktif dan Siap Menerima Alert',
            inline: true,
          },
          {
            name: 'Waktu Uji Coba',
            value: `\`${new Date().toUTCString()}\``,
            inline: true,
          },
        ],
        footer: {
          text: 'API Uptime & Latency Monitor',
        },
        timestamp: new Date().toISOString(),
      },
    ],
  };
}
