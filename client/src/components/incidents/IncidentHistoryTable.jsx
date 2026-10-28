import React from 'react';

export default function IncidentHistoryTable({ incidents = [], isLoading = false }) {
  if (isLoading) {
    return (
      <div className="bg-panel border border-subtle rounded-md p-6 font-mono text-xs text-text-secondary animate-pulse">
        Loading incident ledger...
      </div>
    );
  }

  if (!incidents || incidents.length === 0) {
    return (
      <div className="bg-panel border border-subtle rounded-md p-6 text-center font-mono">
        <span className="w-2 h-2 rounded-full bg-status-up inline-block mr-2" aria-hidden="true"></span>
        <span className="text-xs text-text-primary font-medium">Zero Recorded Downtime Incidents</span>
        <p className="text-[11px] text-text-secondary mt-1">
          Target endpoint has maintained 100% operational uptime without confirmed outages.
        </p>
      </div>
    );
  }

  const formatDuration = (start, end) => {
    if (!end) return 'Ongoing';
    const durationMs = new Date(end).getTime() - new Date(start).getTime();
    if (durationMs < 0) return '0s';
    const seconds = Math.floor((durationMs / 1000) % 60);
    const minutes = Math.floor((durationMs / (1000 * 60)) % 60);
    const hours = Math.floor(durationMs / (1000 * 60 * 60));

    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  return (
    <div className="bg-panel border border-subtle rounded-md overflow-hidden">
      <div className="p-4 border-b border-subtle flex items-center justify-between">
        <div>
          <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-text-primary">
            Downtime Incident Ledger
          </h3>
          <p className="text-[11px] font-mono text-text-secondary">
            Confirmed service interruptions verified after consecutive ping failures
          </p>
        </div>
        <span className="text-xs font-mono text-text-secondary">
          {incidents.length} recorded
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs font-mono">
          <thead>
            <tr className="border-b border-subtle bg-subtle/20 text-text-secondary">
              <th className="py-2.5 px-4 font-medium">State</th>
              <th className="py-2.5 px-4 font-medium">Started At</th>
              <th className="py-2.5 px-4 font-medium">Resolved At</th>
              <th className="py-2.5 px-4 font-medium">Duration</th>
              <th className="py-2.5 px-4 font-medium">Failure Reason</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-subtle">
            {incidents.map((incident) => {
              const isOngoing = incident.status === 'ONGOING' || !incident.resolvedAt;
              return (
                <tr key={incident.id} className="hover:bg-subtle/10 transition-colors">
                  <td className="py-2.5 px-4">
                    {isOngoing ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[11px] font-medium border border-status-down bg-status-down-bg text-status-down-text">
                        <span className="w-1.5 h-1.5 rounded-sm bg-status-down animate-ping" aria-hidden="true"></span>
                        ONGOING
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[11px] font-medium border border-subtle bg-subtle/30 text-text-secondary">
                        RESOLVED
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-text-primary whitespace-nowrap">
                    {new Date(incident.startedAt).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-4 text-text-secondary whitespace-nowrap">
                    {incident.resolvedAt ? new Date(incident.resolvedAt).toLocaleString() : 'In Progress'}
                  </td>
                  <td className="py-2.5 px-4 text-text-primary tabular-nums font-semibold whitespace-nowrap">
                    {formatDuration(incident.startedAt, incident.resolvedAt)}
                  </td>
                  <td className="py-2.5 px-4 text-text-secondary max-w-xs truncate" title={incident.errorReason || ''}>
                    {incident.errorReason || 'Unspecified network error'}
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
