import React from 'react';
import { Link } from 'react-router-dom';
import HeartbeatStrip from './HeartbeatStrip.jsx';

export default function MonitorRow({ monitor, onToggle, onEdit }) {
  const {
    id,
    name,
    url,
    method = 'GET',
    currentStatus = 'PENDING',
    isActive = true,
    lastLatencyMs = 0,
    intervalSeconds = 60,
    uptime24h = 100,
    recentHeartbeats = [],
  } = monitor;

  const getStatusBadge = () => {
    if (!isActive) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-xs font-mono font-medium border border-status-paused bg-status-paused-bg text-status-paused-text">
          <span className="w-1.5 h-1.5 rounded-sm bg-status-paused" aria-hidden="true"></span>
          PAUSED
        </span>
      );
    }
    if (currentStatus === 'UP') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-xs font-mono font-medium border border-status-up bg-status-up-bg text-status-up">
          <span className="w-1.5 h-1.5 rounded-sm bg-status-up" aria-hidden="true"></span>
          UP
        </span>
      );
    }
    if (currentStatus === 'DOWN') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-xs font-mono font-medium border border-status-down bg-status-down-bg text-status-down-text">
          <span className="w-1.5 h-1.5 rounded-sm bg-status-down" aria-hidden="true"></span>
          DOWN
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-xs font-mono font-medium border border-subtle bg-subtle/30 text-text-secondary">
        <span className="w-1.5 h-1.5 rounded-sm bg-text-secondary" aria-hidden="true"></span>
        PENDING
      </span>
    );
  };

  const getMethodBadge = (m) => {
    return (
      <span className="px-1.5 py-0.5 rounded-sm text-[11px] font-mono font-semibold border border-subtle bg-subtle/40 text-text-primary">
        {m}
      </span>
    );
  };

  return (
    <article
      className="bg-panel border border-subtle rounded-md p-4 sm:p-5 transition-colors hover:border-subtle/80 flex flex-col gap-4"
      aria-labelledby={`monitor-title-${id}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-2.5 min-w-0">
          {getStatusBadge()}
          <div className="min-w-0 flex-1">
            <h3 id={`monitor-title-${id}`} className="text-sm font-semibold text-text-primary truncate">
              <Link to={`/monitors/${id}`} className="hover:underline focus:outline-none">
                {name}
              </Link>
            </h3>
            <div className="flex items-center gap-2 mt-0.5 text-xs font-mono text-text-secondary truncate">
              {getMethodBadge(method)}
              <span className="truncate" title={url}>
                {url}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => onToggle && onToggle(id)}
            title={isActive ? 'Pause monitoring checks' : 'Resume monitoring checks'}
            className="border border-subtle bg-canvas hover:bg-subtle/30 text-text-secondary hover:text-text-primary px-2.5 py-1 text-xs font-mono rounded transition-colors"
          >
            {isActive ? 'Pause' : 'Resume'}
          </button>

          <button
            type="button"
            onClick={() => onEdit && onEdit(monitor)}
            className="border border-subtle bg-canvas hover:bg-subtle/30 text-text-secondary hover:text-text-primary px-2.5 py-1 text-xs font-mono rounded transition-colors"
          >
            Edit
          </button>

          <Link
            to={`/monitors/${id}`}
            className="border border-amber-brand bg-amber-brand text-amber-text px-3 py-1 text-xs font-mono rounded font-medium transition-opacity hover:opacity-90"
          >
            Inspect
          </Link>
        </div>
      </div>

      <div className="pt-3 border-t border-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs font-mono">
          <div>
            <span className="text-text-secondary uppercase text-[10px] block">24H Uptime</span>
            <span className="text-text-primary font-semibold tabular-nums text-sm">
              {uptime24h.toFixed(2)}%
            </span>
          </div>

          <div>
            <span className="text-text-secondary uppercase text-[10px] block">Latest Ping</span>
            <span className="text-text-primary font-semibold tabular-nums text-sm">
              {lastLatencyMs !== null && lastLatencyMs !== undefined ? `${lastLatencyMs} ms` : 'N/A'}
            </span>
          </div>

          <div>
            <span className="text-text-secondary uppercase text-[10px] block">Check Interval</span>
            <span className="text-text-secondary tabular-nums">every {intervalSeconds}s</span>
          </div>
        </div>

        <div className="flex flex-col items-start md:items-end gap-1">
          <span className="text-text-secondary text-[10px] font-mono uppercase tracking-wider">
            Recent Telemetry (25 Ticks)
          </span>
          <HeartbeatStrip heartbeats={recentHeartbeats} totalTicks={25} />
        </div>
      </div>
    </article>
  );
}
