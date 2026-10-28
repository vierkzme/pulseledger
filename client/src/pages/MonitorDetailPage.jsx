import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/client.js';
import LatencyAreaChart from '../components/charts/LatencyAreaChart.jsx';
import IncidentHistoryTable from '../components/incidents/IncidentHistoryTable.jsx';
import PingLogsTable from '../components/incidents/PingLogsTable.jsx';
import MonitorFormModal from '../components/modals/MonitorFormModal.jsx';

export default function MonitorDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [monitor, setMonitor] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [logs, setLogs] = useState([]);
  const [logsMeta, setLogsMeta] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [timeRange, setTimeRange] = useState('24h');

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchMonitorData = useCallback(
    async (isSilent = false) => {
      if (!isSilent) setIsLoading(true);
      else setIsRefreshing(true);
      setErrorMessage('');

      try {
        const [monRes, metricsRes, incidentsRes, logsRes] = await Promise.all([
          api.get(`/monitors/${id}`),
          api.get(`/monitors/${id}/metrics?range=${timeRange}`),
          api.get(`/monitors/${id}/incidents`),
          api.get(`/monitors/${id}/logs?page=${currentPage}&limit=20`),
        ]);

        if (monRes.data?.success) setMonitor(monRes.data.data);
        if (metricsRes.data?.success) setMetrics(metricsRes.data.data);
        if (incidentsRes.data?.success) setIncidents(incidentsRes.data.data);
        if (logsRes.data?.success) {
          setLogs(logsRes.data.data?.logs || []);
          setLogsMeta(logsRes.data.data?.meta || null);
        }
      } catch (err) {
        const msg = err.response?.data?.message || err.message || 'Failed to load monitor telemetry';
        setErrorMessage(msg);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [id, timeRange, currentPage]
  );

  useEffect(() => {
    fetchMonitorData();

    // Auto refresh every 15 seconds
    const timer = setInterval(() => {
      fetchMonitorData(true);
    }, 15000);

    return () => clearInterval(timer);
  }, [fetchMonitorData]);

  const handleToggle = async () => {
    try {
      await api.patch(`/monitors/${id}/toggle`);
      fetchMonitorData(true);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update monitor state');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to permanently delete this surveillance target?')) {
      return;
    }

    try {
      await api.delete(`/monitors/${id}`);
      navigate('/');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete monitor');
    }
  };

  if (isLoading && !monitor) {
    return (
      <div className="py-6 font-mono" aria-label="Loading monitor telemetry detail">
        <div className="w-32 h-4 bg-subtle/40 rounded mb-4 animate-pulse"></div>
        <div className="bg-panel border border-subtle rounded-md p-6 h-64 flex flex-col gap-4 animate-pulse">
          <div className="w-1/2 h-6 bg-subtle/50 rounded"></div>
          <div className="w-1/4 h-4 bg-subtle/30 rounded"></div>
        </div>
      </div>
    );
  }

  if (errorMessage && !monitor) {
    return (
      <div className="py-6 font-mono">
        <div className="mb-4">
          <Link to="/" className="text-xs text-amber-brand hover:underline">
            &larr; Back to Dashboard
          </Link>
        </div>
        <div className="bg-panel border border-status-down rounded-md p-6 text-center">
          <p className="text-xs text-status-down-text mb-3">{errorMessage}</p>
          <button
            type="button"
            onClick={() => fetchMonitorData()}
            className="px-3 py-1.5 rounded border border-subtle bg-canvas text-xs text-text-primary"
          >
            Retry Fetch
          </button>
        </div>
      </div>
    );
  }

  const {
    name = '',
    url = '',
    method = 'GET',
    currentStatus = 'PENDING',
    isActive = true,
    intervalSeconds = 60,
    timeoutMs = 5000,
    expectedStatusMin = 200,
    expectedStatusMax = 299,
  } = monitor || {};

  const summaryData = metrics?.summary || {};
  const uptime = summaryData.uptimePercentage ?? 100;
  const avgLatency = summaryData.avgLatencyMs ?? 0;
  const p95Latency = summaryData.p95LatencyMs ?? 0;
  const minLatency = summaryData.minLatencyMs ?? 0;
  const maxLatency = summaryData.maxLatencyMs ?? 0;
  const totalChecks = summaryData.totalChecks ?? 0;

  return (
    <div className="py-4 flex flex-col gap-6">
      {/* Back Link */}
      <div>
        <Link
          to="/"
          className="text-xs font-mono text-text-secondary hover:text-amber-brand transition-colors inline-flex items-center gap-1.5"
        >
          <span>&larr;</span> Back to Surveillance Ledger
        </Link>
      </div>

      {/* Header Panel */}
      <header className="bg-panel border border-subtle rounded-md p-4 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-col gap-1.5 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            {!isActive ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-xs font-mono font-medium border border-status-paused bg-status-paused-bg text-status-paused-text">
                <span className="w-1.5 h-1.5 rounded-sm bg-status-paused" aria-hidden="true"></span>
                PAUSED
              </span>
            ) : currentStatus === 'UP' ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-xs font-mono font-medium border border-status-up bg-status-up-bg text-status-up">
                <span className="w-1.5 h-1.5 rounded-sm bg-status-up" aria-hidden="true"></span>
                OPERATIONAL UP
              </span>
            ) : currentStatus === 'DOWN' ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-xs font-mono font-medium border border-status-down bg-status-down-bg text-status-down-text">
                <span className="w-1.5 h-1.5 rounded-sm bg-status-down" aria-hidden="true"></span>
                INCIDENT DOWN
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-xs font-mono font-medium border border-subtle bg-subtle/30 text-text-secondary">
                PENDING
              </span>
            )}
            <h1 className="text-lg font-semibold text-text-primary tracking-tight truncate">{name}</h1>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-text-secondary flex-wrap">
            <span className="px-1.5 py-0.5 rounded-sm text-[11px] font-semibold border border-subtle bg-subtle/40 text-text-primary">
              {method}
            </span>
            <span className="truncate max-w-lg" title={url}>
              {url}
            </span>
            <span className="text-subtle">|</span>
            <span>Check every {intervalSeconds}s</span>
            <span className="text-subtle">|</span>
            <span>Timeout {timeoutMs}ms</span>
            <span className="text-subtle">|</span>
            <span>
              Expected HTTP {expectedStatusMin}-{expectedStatusMax}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-start lg:self-auto flex-wrap">
          <button
            type="button"
            onClick={() => fetchMonitorData(true)}
            disabled={isRefreshing}
            className="border border-subtle bg-canvas hover:bg-subtle/30 text-text-secondary hover:text-text-primary px-3 py-1.5 text-xs font-mono rounded transition-colors disabled:opacity-50"
          >
            {isRefreshing ? 'Polling...' : 'Sync'}
          </button>
          <button
            type="button"
            onClick={handleToggle}
            className="border border-subtle bg-canvas hover:bg-subtle/30 text-text-primary px-3 py-1.5 text-xs font-mono rounded transition-colors"
          >
            {isActive ? 'Pause' : 'Resume'}
          </button>
          <button
            type="button"
            onClick={() => setIsEditModalOpen(true)}
            className="border border-subtle bg-canvas hover:bg-subtle/30 text-text-primary px-3 py-1.5 text-xs font-mono rounded transition-colors"
          >
            Configure
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="border border-status-down bg-status-down-bg text-status-down-text px-3 py-1.5 text-xs font-mono rounded transition-opacity hover:opacity-90 font-medium"
          >
            Delete
          </button>
        </div>
      </header>

      {/* Time Range Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1" role="group" aria-label="Telemetry time range">
          <span className="text-xs font-mono text-text-secondary mr-2">Time Horizon:</span>
          {['1h', '24h', '7d', '30d'].map((range) => {
            const isSelected = timeRange === range;
            return (
              <button
                key={range}
                type="button"
                onClick={() => setTimeRange(range)}
                className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
                  isSelected
                    ? 'bg-amber-brand text-amber-text font-semibold'
                    : 'bg-panel border border-subtle text-text-secondary hover:text-text-primary hover:bg-subtle/30'
                }`}
              >
                {range}
              </button>
            );
          })}
        </div>

        <span className="text-xs font-mono text-text-secondary">
          Audited over {totalChecks} probes in the last {timeRange}
        </span>
      </div>

      {/* Operational KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-panel border border-subtle rounded-md p-4">
          <span className="text-[11px] font-mono uppercase tracking-wider text-text-secondary">
            Uptime Ratio ({timeRange})
          </span>
          <div className="mt-2 text-2xl font-mono font-semibold text-text-primary tabular-nums">
            {uptime.toFixed(2)}%
          </div>
          <span className="text-[10px] font-mono text-status-up mt-1 block">
            {summaryData.successfulChecks ?? 0} valid / {summaryData.failedChecks ?? 0} dropped
          </span>
        </div>

        <div className="bg-panel border border-subtle rounded-md p-4">
          <span className="text-[11px] font-mono uppercase tracking-wider text-text-secondary">
            Average Response
          </span>
          <div className="mt-2 text-2xl font-mono font-semibold text-text-primary tabular-nums">
            {avgLatency} <span className="text-sm font-normal text-text-secondary">ms</span>
          </div>
          <span className="text-[10px] font-mono text-text-secondary mt-1 block">
            P95 percentile: {p95Latency} ms
          </span>
        </div>

        <div className="bg-panel border border-subtle rounded-md p-4">
          <span className="text-[11px] font-mono uppercase tracking-wider text-text-secondary">
            Minimum Latency
          </span>
          <div className="mt-2 text-2xl font-mono font-semibold text-text-primary tabular-nums">
            {minLatency} <span className="text-sm font-normal text-text-secondary">ms</span>
          </div>
          <span className="text-[10px] font-mono text-text-secondary mt-1 block">
            Best network round trip
          </span>
        </div>

        <div className="bg-panel border border-subtle rounded-md p-4">
          <span className="text-[11px] font-mono uppercase tracking-wider text-text-secondary">
            Peak Latency
          </span>
          <div className="mt-2 text-2xl font-mono font-semibold text-text-primary tabular-nums">
            {maxLatency} <span className="text-sm font-normal text-text-secondary">ms</span>
          </div>
          <span className="text-[10px] font-mono text-text-secondary mt-1 block">
            Worst network spike
          </span>
        </div>
      </div>

      {/* Latency Area Chart */}
      <LatencyAreaChart data={metrics?.series || []} isLoading={isLoading && !metrics} />

      {/* Incident History Table */}
      <IncidentHistoryTable incidents={incidents} isLoading={isLoading && !incidents.length} />

      {/* Raw Ping Logs Table */}
      <PingLogsTable
        logs={logs}
        meta={logsMeta}
        isLoading={isLoading && !logs.length}
        onPageChange={(p) => setCurrentPage(p)}
      />

      {/* Modal for editing this monitor */}
      <MonitorFormModal
        isOpen={isEditModalOpen}
        initialData={monitor}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={() => fetchMonitorData(true)}
      />
    </div>
  );
}
