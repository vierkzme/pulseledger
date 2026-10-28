import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/client.js';
import SummaryCards from '../components/dashboard/SummaryCards.jsx';
import MonitorRow from '../components/dashboard/MonitorRow.jsx';
import MonitorFormModal from '../components/modals/MonitorFormModal.jsx';

export default function DashboardPage() {
  const [monitors, setMonitors] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Filtering & search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

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
        setMonitors(monitorsRes.data.data || []);
      }
      if (summaryRes.data?.success) {
        setSummary(summaryRes.data.data || null);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to load telemetry data';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();

    // Auto-refresh every 15 seconds to stream live heartbeats
    const interval = setInterval(() => {
      fetchDashboardData(true);
    }, 15000);

    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  const handleToggle = async (monitorId) => {
    try {
      await api.patch(`/monitors/${monitorId}/toggle`);
      fetchDashboardData(true);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to toggle monitor status';
      alert(msg);
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

  // Filtered monitors list
  const filteredMonitors = monitors.filter((m) => {
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

  return (
    <div className="py-2">
      {/* Top Telemetry Summary Cards */}
      <SummaryCards summary={summary} isLoading={isLoading && !summary} />

      {/* Main Ledger Control Bar */}
      <div className="bg-panel border border-subtle rounded-md p-4 mb-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
          {/* Search Input */}
          <div className="relative flex-1 max-w-sm">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by label or endpoint URL..."
              aria-label="Filter monitors by name or URL"
              className="w-full bg-canvas border border-subtle rounded px-3 py-1.5 text-xs font-mono text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-amber-brand"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary text-xs"
                aria-label="Clear search input"
              >
                &times;
              </button>
            )}
          </div>

          {/* Status Filter Buttons */}
          <div className="flex items-center gap-1 overflow-x-auto" role="group" aria-label="Status filter">
            {['ALL', 'UP', 'DOWN', 'PAUSED'].map((status) => {
              const isSelected = statusFilter === status;
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
                    isSelected
                      ? 'bg-amber-brand text-amber-text font-semibold'
                      : 'bg-canvas border border-subtle text-text-secondary hover:text-text-primary hover:bg-subtle/30'
                  }`}
                >
                  {status}
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            type="button"
            onClick={() => fetchDashboardData(true)}
            disabled={isRefreshing}
            className="border border-subtle bg-canvas hover:bg-subtle/30 text-text-secondary hover:text-text-primary px-3 py-1.5 text-xs font-mono rounded transition-colors flex items-center gap-1.5 disabled:opacity-50"
            title="Poll telemetry updates immediately"
          >
            <span
              className={`w-2 h-2 rounded-full border border-current border-t-transparent ${
                isRefreshing ? 'animate-spin' : ''
              }`}
            ></span>
            {isRefreshing ? 'Syncing...' : 'Refresh'}
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="border border-amber-brand bg-amber-brand text-amber-text px-3.5 py-1.5 text-xs font-mono font-medium rounded transition-opacity hover:opacity-90"
          >
            + Add Target
          </button>
        </div>
      </div>

      {/* Network Error State */}
      {errorMessage && (
        <div
          role="alert"
          className="mb-4 p-4 rounded border border-status-down bg-status-down-bg text-status-down-text text-xs font-mono flex items-center justify-between"
        >
          <span>Error loading telemetry: {errorMessage}</span>
          <button
            type="button"
            onClick={() => fetchDashboardData()}
            className="underline hover:no-underline font-semibold"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && !monitors.length && (
        <div className="flex flex-col gap-3" aria-label="Loading endpoint monitors">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-panel border border-subtle rounded-md p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="w-48 h-5 bg-subtle/50 rounded animate-pulse"></div>
                <div className="w-24 h-6 bg-subtle/40 rounded animate-pulse"></div>
              </div>
              <div className="w-full h-10 bg-subtle/30 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State: No monitors configured at all */}
      {!isLoading && monitors.length === 0 && (
        <div className="bg-panel border border-dashed border-subtle rounded-md p-10 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded bg-amber-brand/10 border border-amber-brand/20 flex items-center justify-center text-amber-brand mb-3 font-mono font-bold text-lg">
            PL
          </div>
          <h3 className="text-base font-semibold text-text-primary">No Endpoints Registered</h3>
          <p className="text-xs text-text-secondary max-w-sm mt-1 mb-4 font-mono">
            Your telemetry ledger has no endpoints under surveillance. Register an HTTP service to monitor uptime,
            latency drift, and dispatch incident alerts.
          </p>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="border border-amber-brand bg-amber-brand text-amber-text px-4 py-2 text-xs font-mono font-medium rounded transition-opacity hover:opacity-90"
          >
            Create First Target
          </button>
        </div>
      )}

      {/* Empty State: Filter or Search yielded 0 results */}
      {!isLoading && monitors.length > 0 && filteredMonitors.length === 0 && (
        <div className="bg-panel border border-subtle rounded-md p-8 text-center flex flex-col items-center justify-center">
          <p className="text-xs text-text-secondary font-mono mb-3">
            No endpoints matched query &quot;{searchQuery}&quot; with status filter &quot;{statusFilter}&quot;.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('ALL');
            }}
            className="border border-subtle bg-canvas hover:bg-subtle/30 text-text-primary px-3 py-1.5 text-xs font-mono rounded"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Monitors List */}
      {!isLoading && filteredMonitors.length > 0 && (
        <section aria-label="Surveillance Endpoints List" className="flex flex-col gap-3">
          {filteredMonitors.map((monitor) => (
            <MonitorRow
              key={monitor.id}
              monitor={monitor}
              onToggle={handleToggle}
              onEdit={handleOpenEdit}
            />
          ))}
        </section>
      )}

      {/* Modal for Create / Edit Monitor */}
      <MonitorFormModal
        isOpen={isModalOpen}
        initialData={selectedMonitorForEdit}
        onClose={handleCloseModal}
        onSuccess={() => fetchDashboardData(true)}
      />
    </div>
  );
}
