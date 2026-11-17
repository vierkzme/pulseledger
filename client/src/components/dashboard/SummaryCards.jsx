import React from 'react';

export default function SummaryCards({ summary, isLoading }) {
  if (isLoading && !summary) {
    return (
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-5" aria-label="Loading summary metrics">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-card rounded-[20px] p-4 h-24 flex flex-col justify-between">
            <div className="w-20 h-3 bg-subtle/70 rounded-full animate-pulse"></div>
            <div className="w-24 h-6 bg-subtle rounded-full animate-pulse"></div>
          </div>
        ))}
      </div>
    );
  }

  const {
    totalMonitors = 0,
    statusCounts = { UP: 0, DOWN: 0, PAUSED: 0, PENDING: 0 },
    overallUptime24h = 100,
    averageLatency24hMs = 0,
    activeIncidentsCount = 0,
  } = summary || {};

  const cards = [
    {
      label: 'Global Uptime',
      value: `${overallUptime24h.toFixed(2)}%`,
      sub: `${statusCounts.UP || 0}/${totalMonitors} operational`,
      subColor: 'text-status-up',
      dotClass: 'bg-status-up-dot',
    },
    {
      label: 'Mean Latency',
      value: `${averageLatency24hMs} ms`,
      sub: '24h avg response',
      subColor: 'text-accent',
      dotClass: 'bg-accent',
    },
    {
      label: 'Monitored APIs',
      value: `${totalMonitors}`,
      sub: `${statusCounts.PAUSED || 0} paused`,
      subColor: 'text-text-secondary',
      dotClass: 'bg-status-paused',
    },
    {
      label: 'Active Incidents',
      value: `${activeIncidentsCount}`,
      sub: statusCounts.DOWN > 0 ? `${statusCounts.DOWN} down` : 'all clear',
      subColor: activeIncidentsCount > 0 || statusCounts.DOWN > 0 ? 'text-status-down' : 'text-status-up',
      dotClass: activeIncidentsCount > 0 || statusCounts.DOWN > 0 ? 'bg-status-down-dot' : 'bg-status-up-dot',
    },
  ];

  return (
    <section aria-labelledby="telemetry-summary-heading" className="mb-5">
      <h2 id="telemetry-summary-heading" className="sr-only">
        Global Telemetry Summary
      </h2>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className="bg-card border border-subtle/60 rounded-[20px] p-4 flex flex-col justify-between"
          >
            <span className="text-xs font-medium text-text-secondary">{card.label}</span>
            <div className="mt-2.5 flex items-baseline justify-between gap-2 flex-wrap">
              <span className="text-xl sm:text-2xl font-bold font-mono text-text-primary tabular-nums">
                {card.value}
              </span>
              <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${card.subColor}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${card.dotClass}`} aria-hidden="true" />
                {card.sub}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
