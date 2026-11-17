import React from 'react';
import { Link } from 'react-router-dom';
import HeartbeatStrip from './HeartbeatStrip.jsx';

export default function MonitorRow({
  monitor,
  variant = 'full',
  isSelected = false,
  onSelect,
  onToggle,
  onEdit,
}) {
  const {
    id,
    name,
    url,
    method = 'GET',
    currentStatus = 'PENDING',
    isActive = true,
    lastLatencyMs,
    intervalSeconds = 60,
    uptime24h = 100,
    recentHeartbeats = [],
  } = monitor;

  const getHostname = (rawUrl) => {
    try {
      return new URL(rawUrl).hostname;
    } catch {
      return rawUrl;
    }
  };

  const getStatusMeta = () => {
    if (!isActive) {
      return {
        label: 'PAUSED',
        textClass: 'text-status-paused-text',
        badgeClass: 'bg-status-paused-bg text-status-paused-text border-subtle',
        dotClass: 'bg-status-paused',
      };
    }
    if (currentStatus === 'UP') {
      return {
        label: 'UP',
        textClass: 'text-status-up',
        badgeClass: 'bg-status-up-bg text-status-up border-status-up/20',
        dotClass: 'bg-status-up-dot',
      };
    }
    if (currentStatus === 'DOWN') {
      return {
        label: 'DOWN',
        textClass: 'text-status-down',
        badgeClass: 'bg-status-down-bg text-status-down-text border-status-down/20',
        dotClass: 'bg-status-down-dot',
      };
    }
    return {
      label: 'PENDING',
      textClass: 'text-text-secondary',
      badgeClass: 'bg-card text-text-secondary border-subtle',
      dotClass: 'bg-status-paused',
    };
  };

  const statusMeta = getStatusMeta();

  if (variant === 'feed') {
    return (
      <div
        onClick={() => onSelect && onSelect(monitor)}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && onSelect) {
            e.preventDefault();
            onSelect(monitor);
          }
        }}
        role="button"
        tabIndex={0}
        aria-pressed={isSelected}
        className={`rounded-[20px] p-4 transition-all border ${
          isSelected
            ? 'bg-card border-accent/60 ring-2 ring-accent/15'
            : 'bg-card border-transparent hover:border-subtle'
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-7 h-7 rounded-xl bg-panel border border-subtle/60 flex items-center justify-center text-accent shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" d="M12 3l8 4.5-8 4.5-8-4.5L12 3z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" d="M4 12l8 4.5 8-4.5" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" d="M4 16.5L12 21l8-4.5" />
              </svg>
            </span>
            <span className="text-sm font-semibold text-text-primary truncate">{name}</span>
          </div>

          <Link
            to={`/monitors/${id}`}
            onClick={(e) => e.stopPropagation()}
            title={`Inspect ${name} telemetry`}
            aria-label={`Inspect ${name} telemetry`}
            className="w-9 h-9 rounded-full bg-panel border border-subtle/70 hover:border-accent/50 flex items-center justify-center text-text-secondary hover:text-accent transition-colors shrink-0 shadow-xs"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
                d="M7 17L17 7M17 7H9M17 7v8"
              />
            </svg>
          </Link>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 text-xs flex-wrap">
          <span className="text-text-secondary font-mono truncate max-w-[150px]" title={url}>
            {method} · {getHostname(url)}
          </span>

          <div className="flex items-center gap-3 shrink-0 font-medium">
            <span className={`${statusMeta.textClass} font-mono tabular-nums`}>
              {uptime24h.toFixed(1)}% {statusMeta.label}
            </span>

            <span className="inline-flex items-center gap-1.5 text-text-secondary font-mono tabular-nums">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" aria-hidden="true" />
              {lastLatencyMs !== null && lastLatencyMs !== undefined ? `${lastLatencyMs} ms` : `${intervalSeconds}s`}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <article
      className="bg-card border border-subtle/60 rounded-[20px] p-4 sm:p-5 transition-colors hover:border-subtle flex flex-col gap-3.5"
      aria-labelledby={`monitor-title-${id}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold border shrink-0 ${statusMeta.badgeClass}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dotClass}`} aria-hidden="true" />
            {statusMeta.label}
          </span>
          <div className="min-w-0 flex-1">
            <h3 id={`monitor-title-${id}`} className="text-sm font-semibold text-text-primary truncate">
              <Link to={`/monitors/${id}`} className="hover:text-accent transition-colors focus:outline-none">
                {name}
              </Link>
            </h3>
            <div className="flex items-center gap-2 mt-0.5 text-xs font-mono text-text-secondary truncate">
              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-panel border border-subtle text-text-primary">
                {method}
              </span>
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
            className="border border-subtle bg-panel hover:bg-canvas text-text-secondary hover:text-text-primary px-3 py-1.5 text-xs font-medium rounded-full transition-colors"
          >
            {isActive ? 'Pause' : 'Resume'}
          </button>

          <button
            type="button"
            onClick={() => onEdit && onEdit(monitor)}
            className="border border-subtle bg-panel hover:bg-canvas text-text-secondary hover:text-text-primary px-3 py-1.5 text-xs font-medium rounded-full transition-colors"
          >
            Edit
          </button>

          <Link
            to={`/monitors/${id}`}
            className="bg-accent hover:bg-accent-hover text-accent-text px-3.5 py-1.5 text-xs font-medium rounded-full transition-colors"
          >
            Inspect
          </Link>
        </div>
      </div>

      <div className="pt-3 border-t border-subtle/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-5 text-xs font-mono">
          <div>
            <span className="text-text-secondary text-[10px] uppercase block">24H Uptime</span>
            <span className="text-text-primary font-semibold tabular-nums text-sm">
              {uptime24h.toFixed(2)}%
            </span>
          </div>

          <div>
            <span className="text-text-secondary text-[10px] uppercase block">Latest Ping</span>
            <span className="text-text-primary font-semibold tabular-nums text-sm">
              {lastLatencyMs !== null && lastLatencyMs !== undefined ? `${lastLatencyMs} ms` : 'N/A'}
            </span>
          </div>

          <div>
            <span className="text-text-secondary text-[10px] uppercase block">Interval</span>
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
