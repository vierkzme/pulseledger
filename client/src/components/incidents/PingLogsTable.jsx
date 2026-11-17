import React from 'react';

export default function PingLogsTable({
  logs = [],
  meta = null,
  isLoading = false,
  onPageChange,
}) {
  if (isLoading) {
    return (
      <div className="bg-panel border border-subtle/80 rounded-[28px] p-6 font-mono text-xs text-text-secondary animate-pulse shadow-soft">
        Fetching ping audit logs...
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="bg-panel border border-subtle/80 rounded-[28px] p-8 text-center shadow-soft">
        <span className="text-xs font-medium text-text-secondary">
          No raw ping logs recorded for this endpoint yet.
        </span>
      </div>
    );
  }

  const { page = 1, totalPages = 1, total = 0 } = meta || {};

  return (
    <div className="bg-panel border border-subtle/80 rounded-[28px] overflow-hidden shadow-soft">
      <div className="p-5 sm:p-6 border-b border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span
            className="w-2.5 h-2.5 rounded-full bg-status-up-dot ring-4 ring-status-up-dot/20 shrink-0"
            aria-hidden="true"
          />
          <div>
            <h3 className="text-base font-semibold text-text-primary">Raw Telemetry Checks Audit</h3>
            <p className="text-xs text-text-secondary">
              Immutable log of HTTP probes dispatched by the worker engine
            </p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full bg-card text-xs font-mono text-text-secondary self-start sm:self-auto">
          {total} total probes
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs font-mono">
          <thead>
            <tr className="border-b border-subtle bg-card/70 text-text-secondary">
              <th className="py-3 px-5 font-medium">Checked At</th>
              <th className="py-3 px-5 font-medium">Status</th>
              <th className="py-3 px-5 font-medium">HTTP Code</th>
              <th className="py-3 px-5 font-medium">Response Time</th>
              <th className="py-3 px-5 font-medium">Diagnostics / Error</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-subtle/70">
            {logs.map((log) => {
              const isUp = log.status === 'UP';
              return (
                <tr key={log.id} className="hover:bg-card/40 transition-colors">
                  <td className="py-2.5 px-5 text-text-secondary whitespace-nowrap">
                    {new Date(log.checkedAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}{' '}
                    <span className="text-[10px] text-text-secondary/70">
                      {new Date(log.checkedAt).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="py-2.5 px-5">
                    {isUp ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-status-up-bg text-status-up">
                        UP
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-status-down-bg text-status-down-text">
                        DOWN
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-5 text-text-primary tabular-nums">
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
                  <td className="py-2.5 px-5 tabular-nums text-text-primary font-semibold">
                    {log.latencyMs !== null && log.latencyMs !== undefined ? `${log.latencyMs} ms` : 'Failed'}
                  </td>
                  <td className="py-2.5 px-5 text-text-secondary max-w-sm truncate" title={log.errorMessage || ''}>
                    {log.errorMessage || 'Target responded within threshold'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="p-4 border-t border-subtle flex items-center justify-between text-xs font-mono">
          <span className="text-text-secondary">
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => onPageChange && onPageChange(page - 1)}
              className="px-3.5 py-1.5 rounded-full border border-subtle bg-card hover:bg-canvas text-text-primary disabled:opacity-40 transition-colors"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => onPageChange && onPageChange(page + 1)}
              className="px-3.5 py-1.5 rounded-full border border-subtle bg-card hover:bg-canvas text-text-primary disabled:opacity-40 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
