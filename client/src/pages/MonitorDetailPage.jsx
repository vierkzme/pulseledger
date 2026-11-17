import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/client.js';
import { usePolling, TELEMETRY_RANGES } from '../App.jsx';
import LatencyAreaChart from '../components/charts/LatencyAreaChart.jsx';
import IncidentHistoryTable from '../components/incidents/IncidentHistoryTable.jsx';
import PingLogsTable from '../components/incidents/PingLogsTable.jsx';
import MonitorFormModal from '../components/modals/MonitorFormModal.jsx';

export default function MonitorDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isPolling, defaultTimeRange } = usePolling();

  const [monitor, setMonitor] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [logs, setLogs] = useState([]);
  const [logsMeta, setLogsMeta] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [timeRange, setTimeRange] = useState(() => defaultTimeRange);

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
        if (incidentsRes.data?.success) setIncidents(incidentsRes.data.data || []);
        if (logsRes.data?.success) {
          setLogs(Array.isArray(logsRes.data.data) ? logsRes.data.data : []);
          setLogsMeta(logsRes.data.meta || null);
        }
      } catch (err) {
        const msg = err.response?.data?.error?.message || err.message || 'Failed to load monitor telemetry';
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
  }, [fetchMonitorData]);

  useEffect(() => {
    if (!isPolling) return undefined;
    const timer = setInterval(() => {
      fetchMonitorData(true);
    }, 15000);

    return () => clearInterval(timer);
  }, [isPolling, fetchMonitorData]);

  const handleToggle = async () => {
    try {
      await api.patch(`/monitors/${id}/toggle`);
      fetchMonitorData(true);
    } catch (err) {
      setErrorMessage(err.response?.data?.error?.message || err.message || 'Failed to update monitor state');
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
      setErrorMessage(err.response?.data?.error?.message || err.message || 'Failed to delete monitor');
    }
  };

  if (isLoading && !monitor) {
    return (
      <div className="py-2 space-y-5" aria-label="Loading monitor telemetry detail">
        <div className="w-36 h-8 bg-panel rounded-full animate-pulse"></div>
        <div className="bg-panel border border-subtle/80 rounded-[28px] p-6 h-56 flex flex-col gap-4 animate-pulse shadow-soft">
          <div className="w-1/2 h-6 bg-card rounded-full"></div>
          <div className="w-1/4 h-4 bg-card rounded-full"></div>
        </div>
      </div>
    );
  }

  if (errorMessage && !monitor) {
    return (
      <div className="py-2 space-y-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-panel border border-subtle text-xs font-medium text-text-secondary hover:text-text-primary shadow-xs"
        >
          <span>&larr;</span> Back to Studio
        </Link>
        <div className="bg-panel border border-status-down/30 rounded-[28px] p-8 text-center shadow-soft">
          <p className="text-xs font-mono text-status-down-text mb-4">{errorMessage}</p>
          <button
            type="button"
            onClick={() => fetchMonitorData()}
            className="px-4 py-2 rounded-full bg-accent text-accent-text text-xs font-semibold"
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
    timeoutMs = 10000,
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

  const statusDotColor = !isActive
    ? 'bg-status-paused ring-status-paused/20'
    : currentStatus === 'UP'
    ? 'bg-status-up-dot ring-status-up-dot/20'
    : currentStatus === 'DOWN'
    ? 'bg-status-down-dot ring-status-down-dot/20'
    : 'bg-status-paused ring-status-paused/20';

  return (
    <div className="py-1 flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-panel border border-subtle/80 text-xs font-medium text-text-secondary hover:text-text-primary shadow-xs transition-colors"
        >
          <span>&larr;</span> Back to Live Studio
        </Link>

        <div className="flex items-center gap-2">
          <div className="bg-panel border border-subtle/80 rounded-full p-1 inline-flex items-center gap-0.5 shadow-xs" role="group" aria-label="Telemetry time range">
            {TELEMETRY_RANGES.map((range) => {
              const isSelected = timeRange === range;
              return (
                <button
                  key={range}
                  type="button"
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 text-xs font-mono rounded-full transition-colors ${
                    isSelected
                      ? 'bg-accent text-accent-text font-semibold'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {range}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Header & Summary Panel */}
      <section className="bg-panel border border-subtle/80 rounded-[28px] p-5 sm:p-6 shadow-soft space-y-5">
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5 min-w-0">
            <span className={`mt-2 w-2.5 h-2.5 rounded-full ring-4 shrink-0 ${statusDotColor}`} aria-hidden="true" />
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-semibold text-text-primary tracking-tight truncate">{name}</h1>
                {!isActive ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-status-paused-bg text-status-paused-text">
                    PAUSED
                  </span>
                ) : currentStatus === 'UP' ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-status-up-bg text-status-up">
                    OPERATIONAL UP
                  </span>
                ) : currentStatus === 'DOWN' ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-status-down-bg text-status-down-text">
                    INCIDENT DOWN
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-card text-text-secondary">
                    PENDING
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs font-mono text-text-secondary flex-wrap mt-1.5">
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-card border border-subtle text-text-primary">
                  {method}
                </span>
                <span className="truncate max-w-lg" title={url}>
                  {url}
                </span>
                <span className="text-subtle">·</span>
                <span>Every {intervalSeconds}s</span>
                <span className="text-subtle">·</span>
                <span>Timeout {timeoutMs}ms</span>
                <span className="text-subtle">·</span>
                <span>
                  HTTP {expectedStatusMin}-{expectedStatusMax}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start lg:self-auto flex-wrap">
            <button
              type="button"
              onClick={() => fetchMonitorData(true)}
              disabled={isRefreshing}
              className="border border-subtle bg-card hover:bg-canvas text-text-primary px-3.5 py-2 text-xs font-medium rounded-full transition-colors disabled:opacity-50"
            >
              {isRefreshing ? 'Syncing...' : 'Sync Now'}
            </button>
            <button
              type="button"
              onClick={handleToggle}
              className="border border-subtle bg-card hover:bg-canvas text-text-primary px-3.5 py-2 text-xs font-medium rounded-full transition-colors"
            >
              {isActive ? 'Pause' : 'Resume'}
            </button>
            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="bg-accent hover:bg-accent-hover text-accent-text px-4 py-2 text-xs font-semibold rounded-full transition-colors"
            >
              Configure
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="border border-status-down/20 bg-status-down-bg text-status-down-text px-3.5 py-2 text-xs font-semibold rounded-full transition-opacity hover:opacity-90"
            >
              Delete
            </button>
          </div>
        </header>

        {/* Operational KPI Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-card border border-subtle/60 rounded-[20px] p-4">
            <span className="text-xs font-medium text-text-secondary">Uptime Ratio ({timeRange})</span>
            <div className="mt-2 text-2xl font-mono font-bold text-text-primary tabular-nums">
              {uptime.toFixed(2)}%
            </div>
            <span className="text-[11px] font-mono text-status-up mt-1 block">
              {summaryData.successfulChecks ?? 0} valid · {summaryData.failedChecks ?? 0} failed ({totalChecks} total)
            </span>
          </div>

          <div className="bg-card border border-subtle/60 rounded-[20px] p-4">
            <span className="text-xs font-medium text-text-secondary">Average Response</span>
            <div className="mt-2 text-2xl font-mono font-bold text-text-primary tabular-nums">
              {avgLatency} <span className="text-sm font-normal text-text-secondary">ms</span>
            </div>
            <span className="text-[11px] font-mono text-text-secondary mt-1 block">
              P95 percentile: {p95Latency} ms
            </span>
          </div>

          <div className="bg-card border border-subtle/60 rounded-[20px] p-4">
            <span className="text-xs font-medium text-text-secondary">Minimum Latency</span>
            <div className="mt-2 text-2xl font-mono font-bold text-text-primary tabular-nums">
              {minLatency} <span className="text-sm font-normal text-text-secondary">ms</span>
            </div>
            <span className="text-[11px] font-mono text-text-secondary mt-1 block">
              Fastest round trip
            </span>
          </div>

          <div className="bg-card border border-subtle/60 rounded-[20px] p-4">
            <span className="text-xs font-medium text-text-secondary">Peak Latency</span>
            <div className="mt-2 text-2xl font-mono font-bold text-text-primary tabular-nums">
              {maxLatency} <span className="text-sm font-normal text-text-secondary">ms</span>
            </div>
            <span className="text-[11px] font-mono text-text-secondary mt-1 block">
              Maximum spike observed
            </span>
          </div>
        </div>

        <LatencyAreaChart data={metrics?.series || []} isLoading={isLoading && !metrics} height={270} />
      </section>

      <IncidentHistoryTable incidents={incidents} isLoading={isLoading && !incidents.length} />

      <PingLogsTable
        logs={logs}
        meta={logsMeta}
        isLoading={isLoading && !logs.length}
        onPageChange={(p) => setCurrentPage(p)}
      />

      <MonitorFormModal
        isOpen={isEditModalOpen}
        initialData={monitor}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={() => fetchMonitorData(true)}
      />
    </div>
  );
}
