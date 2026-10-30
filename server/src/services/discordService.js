export function formatDuration(totalSeconds) {
  const sec = totalSeconds || 0;
  if (sec < 60) {
    return `${sec} ${sec === 1 ? 'second' : 'seconds'}`;
  }
  const minutes = Math.floor(sec / 60);
  const remainingSeconds = sec % 60;
  const minStr = `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
  const secStr = `${remainingSeconds} ${remainingSeconds === 1 ? 'second' : 'seconds'}`;

  if (minutes < 60) {
    return remainingSeconds > 0 ? `${minStr} ${secStr}` : minStr;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  const hrStr = `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  const remMinStr = `${remainingMinutes} ${remainingMinutes === 1 ? 'minute' : 'minutes'}`;

  if (remainingSeconds === 0 && remainingMinutes === 0) {
    return hrStr;
  }
  if (remainingSeconds === 0) {
    return `${hrStr} ${remMinStr}`;
  }
  if (remainingMinutes === 0) {
    return `${hrStr} ${secStr}`;
  }
  return `${hrStr} ${remMinStr} ${secStr}`;
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
        description: 'Endpoint is not responding as expected after confirmation retry.',
        color: 15680580, // #EF4444
        fields: [
          {
            name: 'Target Endpoint',
            value: `\`${monitor.method} ${monitor.url}\``,
            inline: false,
          },
          {
            name: 'Failure Cause',
            value: `**${failureDetails.errorMessage || `HTTP ${failureDetails.statusCode}`}**`,
            inline: true,
          },
          {
            name: 'Response Time',
            value: `\`${failureDetails.latencyMs || 0} ms\``,
            inline: true,
          },
          {
            name: 'Incident Timestamp (UTC)',
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
        description: 'Service has recovered and is responding normally.',
        color: 1096065, // #10B981
        fields: [
          {
            name: 'Target Endpoint',
            value: `\`${monitor.method} ${monitor.url}\``,
            inline: false,
          },
          {
            name: 'Current Status & Latency',
            value: `**HTTP ${recoveryDetails.statusCode || 200}** (\`${recoveryDetails.latencyMs} ms\`)`,
            inline: true,
          },
          {
            name: 'Total Downtime Duration',
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
        description: `Webhook connection verified successfully for channel **${channelName}**.`,
        color: 1610507, // Amber #1890FF / #F59E0B
        fields: [
          {
            name: 'Webhook Status',
            value: '🟢 Active and ready to receive alerts',
            inline: true,
          },
          {
            name: 'Test Timestamp (UTC)',
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
