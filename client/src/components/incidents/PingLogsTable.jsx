import React from 'react';

export default function PingLogsTable({
  logs = [],
  meta = null,
  isLoading = false,
  onPageChange,
}) {
  if (isLoading) {
    return (
      <div className="bg-panel border border-subtle rounded-md p-6 font-mono text-xs text-text-secondary animate-pulse">
        Fetching ping audit logs...
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="bg-panel border border-subtle rounded-md p-6 text-center font-mono">
        <span className="text-xs text-text-secondary">No raw ping logs recorded for this endpoint yet.</span>
      </div>
    );
  }

  const { page = 1, totalPages = 1, total = 0 } = meta || {};

  return (
    <div className="bg-panel border border-subtle rounded-md overflow-hidden">
      <div className="p-4 border-b border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-text-primary">
            Raw Telemetry Checks Audit
          </h3>
          <p className="text-[11px] font-mono text-text-secondary">
            Immutable log of HTTP probes dispatched by the worker daemon
          </p>
        </div>
        <span className="text-xs font-mono text-text-secondary">
          {total} total probes
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs font-mono">
          <thead>
            <tr className="border-b border-subtle bg-subtle/20 text-text-secondary">
              <th className="py-2.5 px-4 font-medium">Checked At</th>
              <th className="py-2.5 px-4 font-medium">Status</th>
              <th className="py-2.5 px-4 font-medium">HTTP Code</th>
              <th className="py-2.5 px-4 font-medium">Response Time</th>
              <th className="py-2.5 px-4 font-medium">Diagnostics / Error</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-subtle">
            {logs.map((log) => {
              const isUp = log.status === 'UP';
              return (
                <tr key={log.id} className="hover:bg-subtle/10 transition-colors">
                  <td className="py-2 px-4 text-text-secondary whitespace-nowrap">
                    {new Date(log.checkedAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}{' '}
                    <span className="text-[10px] text-text-secondary/70">
                      {new Date(log.checkedAt).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="py-2 px-4">
                    {isUp ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm text-[10px] font-semibold border border-status-up bg-status-up-bg text-status-up">
                        UP
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm text-[10px] font-semibold border border-status-down bg-status-down-bg text-status-down-text">
                        DOWN
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-4 text-text-primary tabular-nums">
                    {log.statusCode ? (
                      <span
                        className={`font-semibold ${
                          log.statusCode >= 200 && log.statusCode < 300
                            ? 'text-status-up'
                            : 'text-status-down'
                        }`}
                      >
                        {log.statusCode}
                      </span>
                    ) : (
                      <span className="text-text-secondary text-[11px]">N/A</span>
                    )}
                  </td>
                  <td className="py-2 px-4 tabular-nums text-text-primary font-semibold">
                    {log.latencyMs !== null && log.latencyMs !== undefined ? `${log.latencyMs} ms` : 'Failed'}
                  </td>
                  <td className="py-2 px-4 text-text-secondary max-w-sm truncate" title={log.errorMessage || ''}>
                    {log.errorMessage || 'Target responded within threshold'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="p-3 border-t border-subtle flex items-center justify-between text-xs font-mono">
          <span className="text-text-secondary">
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => onPageChange && onPageChange(page - 1)}
              className="px-2.5 py-1 rounded border border-subtle bg-canvas hover:bg-subtle/30 text-text-primary disabled:opacity-40 transition-colors"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => onPageChange && onPageChange(page + 1)}
              className="px-2.5 py-1 rounded border border-subtle bg-canvas hover:bg-subtle/30 text-text-primary disabled:opacity-40 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
