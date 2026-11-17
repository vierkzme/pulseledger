import React from 'react';

export default function IncidentHistoryTable({ incidents = [], isLoading = false }) {
  if (isLoading) {
    return (
      <div className="bg-panel border border-subtle/80 rounded-[28px] p-6 font-mono text-xs text-text-secondary animate-pulse shadow-soft">
        Loading incident ledger...
      </div>
    );
  }

  if (!incidents || incidents.length === 0) {
    return (
      <div className="bg-panel border border-subtle/80 rounded-[28px] p-8 text-center shadow-soft">
        <span
          className="w-2.5 h-2.5 rounded-full bg-status-up-dot ring-4 ring-status-up-dot/20 inline-block mr-2.5"
          aria-hidden="true"
        />
        <span className="text-sm text-text-primary font-semibold">Zero Recorded Downtime Incidents</span>
        <p className="text-xs text-text-secondary mt-1">
          Target endpoint has maintained 100% operational uptime without confirmed outages.
        </p>
      </div>
    );
  }

  const formatDuration = (start, end, durationSeconds) => {
    if (!end) return 'Ongoing';
    const totalSec =
      typeof durationSeconds === 'number'
        ? durationSeconds
        : Math.max(0, Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 1000));
    const seconds = totalSec % 60;
    const minutes = Math.floor((totalSec / 60) % 60);
    const hours = Math.floor(totalSec / 3600);

    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  return (
    <div className="bg-panel border border-subtle/80 rounded-[28px] overflow-hidden shadow-soft">
      <div className="p-5 sm:p-6 border-b border-subtle flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="w-2.5 h-2.5 rounded-full bg-status-up-dot ring-4 ring-status-up-dot/20 shrink-0"
            aria-hidden="true"
          />
          <div>
            <h3 className="text-base font-semibold text-text-primary">Downtime Incident Ledger</h3>
            <p className="text-xs text-text-secondary">
              Confirmed service interruptions verified after consecutive ping failures
            </p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full bg-card text-xs font-mono text-text-secondary">
          {incidents.length} recorded
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs font-mono">
          <thead>
            <tr className="border-b border-subtle bg-card/70 text-text-secondary">
              <th className="py-3 px-5 font-medium">State</th>
              <th className="py-3 px-5 font-medium">Started At</th>
              <th className="py-3 px-5 font-medium">Resolved At</th>
              <th className="py-3 px-5 font-medium">Duration</th>
              <th className="py-3 px-5 font-medium">Failure Cause</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-subtle/70">
            {incidents.map((incident) => {
              const isOngoing = incident.status === 'ONGOING' || !incident.resolvedAt;
              return (
                <tr key={incident.id} className="hover:bg-card/40 transition-colors">
                  <td className="py-3 px-5">
                    {isOngoing ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border border-status-down/20 bg-status-down-bg text-status-down-text">
                        <span className="w-1.5 h-1.5 rounded-full bg-status-down-dot" aria-hidden="true" />
                        ONGOING
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border border-subtle bg-card text-text-secondary">
                        RESOLVED
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-5 text-text-primary whitespace-nowrap">
                    {new Date(incident.startedAt).toLocaleString()}
                  </td>
                  <td className="py-3 px-5 text-text-secondary whitespace-nowrap">
                    {incident.resolvedAt ? new Date(incident.resolvedAt).toLocaleString() : 'In Progress'}
                  </td>
                  <td className="py-3 px-5 text-text-primary tabular-nums font-semibold whitespace-nowrap">
                    {formatDuration(incident.startedAt, incident.resolvedAt, incident.durationSeconds)}
                  </td>
                  <td className="py-3 px-5 text-text-secondary max-w-xs truncate" title={incident.cause || ''}>
                    {incident.cause || 'Unspecified network error'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
