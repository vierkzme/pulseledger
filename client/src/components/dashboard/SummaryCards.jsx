import React from 'react';

export default function SummaryCards({ summary, isLoading }) {
  if (isLoading && !summary) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6" aria-label="Loading summary metrics">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-panel border border-subtle rounded p-4 h-24 flex flex-col justify-between">
            <div className="w-16 h-3 bg-subtle/40 rounded-sm animate-pulse"></div>
            <div className="w-24 h-6 bg-subtle/60 rounded-sm animate-pulse"></div>
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

  return (
    <section aria-labelledby="telemetry-summary-heading" className="mb-6">
      <h2 id="telemetry-summary-heading" className="sr-only">
        Global Telemetry Ledger Summary
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-panel border border-subtle rounded p-4 flex flex-col justify-between">
          <span className="text-[11px] font-mono uppercase tracking-wider text-text-secondary">
            Total Endpoints
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-mono font-semibold text-text-primary tabular-nums">
              {totalMonitors}
            </span>
            <span className="text-xs font-mono text-text-secondary">monitored</span>
          </div>
        </div>

        <div className="bg-panel border border-subtle rounded p-4 flex flex-col justify-between">
          <span className="text-[11px] font-mono uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm bg-status-up" aria-hidden="true"></span>
            Operational UP
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-mono font-semibold text-status-up tabular-nums">
              {statusCounts.UP || 0}
            </span>
            <span className="text-xs font-mono text-text-secondary">healthy</span>
          </div>
        </div>

        <div className="bg-panel border border-subtle rounded p-4 flex flex-col justify-between">
          <span className="text-[11px] font-mono uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm bg-status-down" aria-hidden="true"></span>
            Fault DOWN
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`text-2xl font-mono font-semibold tabular-nums ${
                statusCounts.DOWN > 0 ? 'text-status-down' : 'text-text-secondary'
              }`}
            >
              {statusCounts.DOWN || 0}
            </span>
            {activeIncidentsCount > 0 ? (
              <span className="text-[11px] font-mono text-status-down px-1 py-0.5 border border-status-down bg-status-down-bg rounded-sm">
                {activeIncidentsCount} active
              </span>
            ) : (
              <span className="text-xs font-mono text-text-secondary">normal</span>
            )}
          </div>
        </div>

        <div className="bg-panel border border-subtle rounded p-4 flex flex-col justify-between">
          <span className="text-[11px] font-mono uppercase tracking-wider text-text-secondary">
            24H Mean Uptime
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-mono font-semibold text-text-primary tabular-nums">
              {overallUptime24h.toFixed(2)}%
            </span>
          </div>
        </div>

        <div className="bg-panel border border-subtle rounded p-4 flex flex-col justify-between col-span-2 sm:col-span-1">
          <span className="text-[11px] font-mono uppercase tracking-wider text-text-secondary">
            Mean Latency 24H
          </span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-mono font-semibold text-text-primary tabular-nums">
              {averageLatency24hMs}
            </span>
            <span className="text-xs font-mono text-text-secondary">ms</span>
          </div>
        </div>
      </div>
    </section>
  );
}
