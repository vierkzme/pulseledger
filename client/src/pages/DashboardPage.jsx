import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client.js';
import { usePolling, TELEMETRY_RANGES } from '../App.jsx';
import SummaryCards from '../components/dashboard/SummaryCards.jsx';
import MonitorRow from '../components/dashboard/MonitorRow.jsx';
import HeartbeatStrip from '../components/dashboard/HeartbeatStrip.jsx';
import LatencyAreaChart from '../components/charts/LatencyAreaChart.jsx';
import MonitorFormModal from '../components/modals/MonitorFormModal.jsx';

export default function DashboardPage() {
  const { isPolling, defaultTimeRange } = usePolling();

  const [monitors, setMonitors] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Filtering & search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showFilters, setShowFilters] = useState(true);

  // Selected monitor telemetry preview (Right Panel)
  const [selectedMonitorId, setSelectedMonitorId] = useState(null);
  const [timeRange, setTimeRange] = useState(() => defaultTimeRange);
  const [selectedMetrics, setSelectedMetrics] = useState(null);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(false);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMonitorForEdit, setSelectedMonitorForEdit] = useState(null);

  const fetchDashboardData = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    else setIsRefreshing(true);
    setErrorMessage('');

    try {
      const [monitorsRes, summaryRes] = await Promise.all([
        api.get('/monitors'),
        api.get('/monitors/summary'),
      ]);

      if (monitorsRes.data?.success) {
        const list = monitorsRes.data.data || [];
        setMonitors(list);
        setSelectedMonitorId((prev) => {
          if (prev && list.some((m) => m.id === prev)) return prev;
          return list.length > 0 ? list[0].id : null;
        });
      }
      if (summaryRes.data?.success) {
        setSummary(summaryRes.data.data || null);
      }
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to load telemetry data';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const fetchSelectedMetrics = useCallback(async (monitorId, range, isSilent = false) => {
    if (!monitorId) {
      setSelectedMetrics(null);
      return;
    }
    if (!isSilent) setIsLoadingMetrics(true);
    try {
      const res = await api.get(`/monitors/${monitorId}/metrics?range=${range}`);
      if (res.data?.success) {
        setSelectedMetrics(res.data.data);
      }
    } catch {
      setSelectedMetrics(null);
    } finally {
      setIsLoadingMetrics(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    if (!isPolling) return undefined;
    const interval = setInterval(() => {
      fetchDashboardData(true);
      if (selectedMonitorId) {
        fetchSelectedMetrics(selectedMonitorId, timeRange, true);
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [isPolling, fetchDashboardData, fetchSelectedMetrics, selectedMonitorId, timeRange]);

  useEffect(() => {
    fetchSelectedMetrics(selectedMonitorId, timeRange);
  }, [selectedMonitorId, timeRange, fetchSelectedMetrics]);

  const handleToggle = async (monitorId) => {
    try {
      await api.patch(`/monitors/${monitorId}/toggle`);
      fetchDashboardData(true);
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to toggle monitor status';
      setErrorMessage(msg);
    }
  };

  const handleOpenCreate = () => {
    setSelectedMonitorForEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (monitor) => {
    setSelectedMonitorForEdit(monitor);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedMonitorForEdit(null);
  };

  const filteredMonitors = useMemo(() => {
    return monitors.filter((m) => {
      const matchesSearch =
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.url.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (statusFilter === 'ALL') return true;
      if (statusFilter === 'PAUSED') return !m.isActive;
      if (statusFilter === 'UP') return m.isActive && m.currentStatus === 'UP';
      if (statusFilter === 'DOWN') return m.isActive && m.currentStatus === 'DOWN';
      if (statusFilter === 'PENDING') return m.isActive && m.currentStatus === 'PENDING';
      return true;
    });
  }, [monitors, searchQuery, statusFilter]);

  const activeMonitor = useMemo(() => {
    return (
      monitors.find((m) => m.id === selectedMonitorId) ||
      filteredMonitors[0] ||
      monitors[0] ||
      null
    );
  }, [monitors, filteredMonitors, selectedMonitorId]);

  const selectedMetricsSummary = selectedMetrics?.summary || {};

  return (
    <div className="py-1">
      {errorMessage && (
        <div
          role="alert"
          className="mb-5 px-5 py-3.5 rounded-[20px] border border-status-down/30 bg-status-down-bg text-status-down-text text-xs font-mono flex items-center justify-between gap-3"
        >
          <span>Error loading telemetry: {errorMessage}</span>
          <button
            type="button"
            onClick={() => fetchDashboardData()}
            className="px-3 py-1 rounded-full bg-panel border border-subtle text-text-primary font-semibold hover:opacity-90"
          >
            Retry
          </button>
        </div>
      )}

      {/* Two-Column Split Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT PANEL: Live Now Endpoints Feed */}
        <section
          id="live-now-panel"
          aria-labelledby="live-now-heading"
          className="lg:col-span-5 xl:col-span-4 bg-panel border border-subtle/80 rounded-[28px] p-5 sm:p-6 shadow-soft"
        >
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <span
                className="w-2.5 h-2.5 rounded-full bg-status-up-dot ring-4 ring-status-up-dot/20 shrink-0"
                aria-hidden="true"
              />
              <h1 id="live-now-heading" className="text-lg font-semibold tracking-tight text-text-primary">
                Live Now
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowFilters((prev) => !prev)}
                aria-label="Toggle search and status filters"
                aria-expanded={showFilters}
                title="Toggle filters"
                className="w-9 h-9 rounded-full bg-card hover:bg-subtle/60 flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" d="M4 6h16M7 12h10M10 18h4" />
                </svg>
              </button>

              <button
                type="button"
                onClick={handleOpenCreate}
                aria-label="Add new monitor"
                title="Add new monitor"
                className="w-9 h-9 rounded-full bg-card hover:bg-accent hover:text-accent-text flex items-center justify-center text-text-primary transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v14M5 12h14" />
                </svg>
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="mb-4 space-y-2.5">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search endpoint or URL..."
                  aria-label="Filter monitors by name or URL"
                  className="w-full bg-card border border-subtle/70 rounded-2xl px-3.5 py-2 text-xs font-mono text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:border-accent"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary text-sm"
                    aria-label="Clear search input"
                  >
                    &times;
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5" role="group" aria-label="Status filter">
                {['ALL', 'UP', 'DOWN', 'PAUSED'].map((status) => {
                  const isSelected = statusFilter === status;
                  return (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setStatusFilter(status)}
                      className={`px-3 py-1 text-[11px] font-mono rounded-full transition-colors shrink-0 ${
                        isSelected
                          ? 'bg-accent text-accent-text font-semibold'
                          : 'bg-card text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      {status}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {isLoading && !monitors.length && (
            <div className="space-y-3" aria-label="Loading endpoint monitors">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-card rounded-[20px] p-4 h-[86px] flex flex-col justify-between animate-pulse">
                  <div className="flex items-center justify-between">
                    <div className="w-36 h-4 bg-subtle rounded-full"></div>
                    <div className="w-8 h-8 bg-subtle rounded-full"></div>
                  </div>
                  <div className="w-48 h-3 bg-subtle/80 rounded-full"></div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && monitors.length === 0 && (
            <div className="bg-card border border-dashed border-subtle rounded-[20px] p-8 text-center flex flex-col items-center">
              <div className="w-11 h-11 rounded-full bg-panel border border-subtle flex items-center justify-center text-accent font-mono font-bold text-sm mb-3">
                PL
              </div>
              <h2 className="text-sm font-semibold text-text-primary">No Endpoints Registered</h2>
              <p className="text-xs text-text-secondary mt-1 mb-4">
                Add an HTTP or HTTPS target to start tracking uptime and latency.
              </p>
              <button
                type="button"
                onClick={handleOpenCreate}
                className="bg-accent hover:bg-accent-hover text-accent-text px-4 py-2 text-xs font-semibold rounded-full transition-colors"
              >
                + Add First Target
              </button>
            </div>
          )}

          {!isLoading && monitors.length > 0 && filteredMonitors.length === 0 && (
            <div className="bg-card rounded-[20px] p-6 text-center">
              <p className="text-xs text-text-secondary mb-3">
                No endpoints matched &quot;{searchQuery}&quot; ({statusFilter}).
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('ALL');
                }}
                className="bg-panel border border-subtle text-text-primary px-3.5 py-1.5 text-xs font-medium rounded-full hover:bg-canvas transition-colors"
              >
                Reset Filters
              </button>
            </div>
          )}

          {!isLoading && filteredMonitors.length > 0 && (
            <div className="space-y-3 max-h-[640px] overflow-y-auto pr-0.5">
              {filteredMonitors.map((monitor) => (
                <MonitorRow
                  key={monitor.id}
                  monitor={monitor}
                  variant="feed"
                  isSelected={activeMonitor?.id === monitor.id}
                  onSelect={(m) => setSelectedMonitorId(m.id)}
                />
              ))}
            </div>
          )}
        </section>

        {/* RIGHT PANEL: Telemetry Activity & Fleet Inspector */}
        <section
          id="telemetry-activity-panel"
          aria-labelledby="telemetry-activity-heading"
          className="lg:col-span-7 xl:col-span-8 bg-panel border border-subtle/80 rounded-[28px] p-5 sm:p-6 shadow-soft"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-3">
              <span
                className="w-2.5 h-2.5 rounded-full bg-status-up-dot ring-4 ring-status-up-dot/20 shrink-0"
                aria-hidden="true"
              />
              <h2 id="telemetry-activity-heading" className="text-lg font-semibold tracking-tight text-text-primary">
                Telemetry Activity
              </h2>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="bg-card border border-subtle/60 rounded-full p-1 inline-flex items-center gap-0.5" role="group" aria-label="Chart time range">
                {TELEMETRY_RANGES.map((range) => (
                  <button
                    key={range}
                    type="button"
                    onClick={() => setTimeRange(range)}
                    className={`px-2.5 py-1 text-[11px] font-mono rounded-full transition-colors ${
                      timeRange === range
                        ? 'bg-panel text-text-primary font-semibold shadow-xs'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  fetchDashboardData(true);
                  if (activeMonitor) fetchSelectedMetrics(activeMonitor.id, timeRange, true);
                }}
                disabled={isRefreshing}
                title="Refresh telemetry now"
                aria-label="Refresh telemetry now"
                className="w-9 h-9 rounded-full bg-card hover:bg-subtle/60 flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
              >
                <svg
                  className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.8"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>

              <button
                type="button"
                onClick={handleOpenCreate}
                className="bg-accent hover:bg-accent-hover text-accent-text px-4 py-2 text-xs font-semibold rounded-full transition-colors"
              >
                + Add Target
              </button>
            </div>
          </div>

          <SummaryCards summary={summary} isLoading={isLoading && !summary} />

          {/* Selected Endpoint Live Chart & Heartbeats */}
          {activeMonitor ? (
            <div className="space-y-4">
              <div className="bg-card border border-subtle/60 rounded-[20px] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-text-primary truncate">{activeMonitor.name}</span>
                    <span className="px-2 py-0.5 rounded-full bg-panel border border-subtle text-[10px] font-mono font-semibold text-text-secondary">
                      {activeMonitor.method}
                    </span>
                    <span className="text-xs font-mono text-text-secondary">
                      P95: <strong className="text-text-primary">{selectedMetricsSummary.p95LatencyMs ?? 0} ms</strong>
                    </span>
                  </div>
                  <p className="text-xs font-mono text-text-secondary truncate mt-0.5" title={activeMonitor.url}>
                    {activeMonitor.url}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleToggle(activeMonitor.id)}
                    className="px-3 py-1.5 rounded-full bg-panel border border-subtle text-xs font-medium text-text-primary hover:bg-canvas transition-colors"
                  >
                    {activeMonitor.isActive ? 'Pause' : 'Resume'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(activeMonitor)}
                    className="px-3 py-1.5 rounded-full bg-panel border border-subtle text-xs font-medium text-text-primary hover:bg-canvas transition-colors"
                  >
                    Edit
                  </button>
                  <Link
                    to={`/monitors/${activeMonitor.id}`}
                    className="px-3.5 py-1.5 rounded-full bg-text-primary text-panel text-xs font-medium hover:opacity-90 transition-opacity"
                  >
                    Inspect Details
                  </Link>
                </div>
              </div>

              <LatencyAreaChart
                data={selectedMetrics?.series || []}
                isLoading={isLoadingMetrics && !selectedMetrics}
                height={235}
                title={`${activeMonitor.name} — Response Time (${timeRange})`}
                subtitle={`${selectedMetricsSummary.totalChecks ?? 0} checks · ${selectedMetricsSummary.uptimePercentage ?? 100}% uptime · avg ${selectedMetricsSummary.avgLatencyMs ?? 0} ms`}
              />

              {/* Recent 25-Tick Fleet Health Strip */}
              <div className="bg-card border border-subtle/60 rounded-[20px] p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    Fleet 25-Tick Heartbeat Overview
                  </h3>
                  <span className="text-[11px] font-mono text-text-secondary">
                    {filteredMonitors.length} shown
                  </span>
                </div>

                <div className="space-y-2.5">
                  {filteredMonitors.map((m) => (
                    <div
                      key={m.id}
                      className="bg-panel border border-subtle/60 rounded-2xl px-3.5 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            !m.isActive
                              ? 'bg-status-paused'
                              : m.currentStatus === 'UP'
                              ? 'bg-status-up-dot'
                              : m.currentStatus === 'DOWN'
                              ? 'bg-status-down-dot'
                              : 'bg-status-paused'
                          }`}
                          aria-hidden="true"
                        />
                        <Link
                          to={`/monitors/${m.id}`}
                          className="text-xs font-semibold text-text-primary hover:text-accent truncate transition-colors"
                        >
                          {m.name}
                        </Link>
                        <span className="text-[11px] font-mono text-text-secondary shrink-0 tabular-nums">
                          {m.uptime24h.toFixed(1)}%
                        </span>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3">
                        <span className="text-[11px] font-mono text-text-secondary tabular-nums">
                          {m.lastLatencyMs !== null && m.lastLatencyMs !== undefined ? `${m.lastLatencyMs} ms` : '--'}
                        </span>
                        <HeartbeatStrip heartbeats={m.recentHeartbeats} totalTicks={25} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            !isLoading && (
              <div className="bg-card border border-dashed border-subtle rounded-[20px] p-10 text-center">
                <p className="text-sm font-medium text-text-primary">No telemetry stream selected</p>
                <p className="text-xs text-text-secondary mt-1">
                  Create a monitor on the left panel to inspect latency charts and recent probe ticks.
                </p>
              </div>
            )
          )}
        </section>
      </div>

      <MonitorFormModal
        isOpen={isModalOpen}
        initialData={selectedMonitorForEdit}
        onClose={handleCloseModal}
        onSuccess={() => {
          fetchDashboardData(true);
          if (activeMonitor) fetchSelectedMetrics(activeMonitor.id, timeRange, true);
        }}
      />
    </div>
  );
}
