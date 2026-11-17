import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, getOperatorInitials } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { usePolling, TELEMETRY_RANGES } from '../App.jsx';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { isPolling, setIsPolling, defaultTimeRange, setDefaultTimeRange } = usePolling();
  const navigate = useNavigate();
  const [savedNotice, setSavedNotice] = useState('');

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  const handleThemeSelect = (targetTheme) => {
    if (theme !== targetTheme) {
      toggleTheme();
      setSavedNotice(`Theme switched to ${targetTheme === 'dark' ? 'Midnight Dark' : 'Light Studio'}`);
    }
  };

  const handlePollingSelect = (enabled) => {
    if (isPolling !== enabled) {
      setIsPolling(enabled);
      setSavedNotice(enabled ? 'Live 15s auto-refresh enabled' : 'Live 15s auto-refresh paused');
    }
  };

  const handleRangeSelect = (range) => {
    if (defaultTimeRange !== range) {
      setDefaultTimeRange(range);
      setSavedNotice(`Default chart window saved (${range})`);
    }
  };

  return (
    <div className="py-1 flex flex-col gap-5">
      {/* Header Panel */}
      <section className="bg-panel border border-subtle/80 rounded-[28px] p-5 sm:p-6 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            className="w-2.5 h-2.5 rounded-full bg-status-up-dot ring-4 ring-status-up-dot/20 shrink-0"
            aria-hidden="true"
          />
          <div>
            <h1 className="text-lg sm:text-xl font-semibold text-text-primary tracking-tight">
              Workspace Settings
            </h1>
            <p className="text-xs text-text-secondary mt-0.5">
              Manage your operator session, studio appearance, and telemetry polling preferences
            </p>
          </div>
        </div>

        {savedNotice && (
          <div
            role="status"
            aria-live="polite"
            className="px-3.5 py-1.5 rounded-full bg-status-up-bg text-status-up text-xs font-mono font-medium self-start sm:self-auto"
          >
            {savedNotice}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Account & Session */}
        <section
          aria-labelledby="account-session-heading"
          className="lg:col-span-5 bg-panel border border-subtle/80 rounded-[28px] p-5 sm:p-6 shadow-soft flex flex-col gap-4"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <span
                className="w-2.5 h-2.5 rounded-full bg-accent ring-4 ring-accent/20 shrink-0"
                aria-hidden="true"
              />
              <h2 id="account-session-heading" className="text-base font-semibold text-text-primary tracking-tight">
                Account &amp; Session
              </h2>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-status-up-bg text-status-up font-mono text-[11px] font-semibold">
              ACTIVE SESSION
            </span>
          </div>

          <div className="bg-card border border-subtle/60 rounded-[20px] p-4 sm:p-5 flex items-center gap-4">
            <div
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-panel border border-subtle text-text-primary font-mono text-sm sm:text-base font-semibold flex items-center justify-center shrink-0 shadow-xs select-none"
              aria-hidden="true"
            >
              {getOperatorInitials(user?.name)}
            </div>
            <div className="min-w-0">
              <p className="text-base font-semibold text-text-primary truncate">
                {user?.name || 'Operator'}
              </p>
              <p className="text-xs font-mono text-text-secondary break-all mt-0.5">
                {user?.email || 'No email available'}
              </p>
            </div>
          </div>

          <div className="bg-card/60 border border-subtle/70 rounded-[20px] p-4 text-xs text-text-secondary leading-relaxed">
            Operator credentials are authenticated via JWT and managed at registration. Signing out clears your local
            session token from this browser while backend API monitors continue running uninterrupted.
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="w-full min-h-[44px] px-5 py-2.5 rounded-full bg-status-down-bg hover:bg-status-down border border-status-down/25 text-status-down-text hover:text-white text-xs font-semibold transition-colors inline-flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span>Sign Out</span>
          </button>
        </section>

        {/* Right Column: Studio Preferences */}
        <section
          aria-labelledby="studio-preferences-heading"
          className="lg:col-span-7 bg-panel border border-subtle/80 rounded-[28px] p-5 sm:p-6 shadow-soft flex flex-col gap-4"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <span
                className="w-2.5 h-2.5 rounded-full bg-status-up-dot ring-4 ring-status-up-dot/20 shrink-0"
                aria-hidden="true"
              />
              <h2 id="studio-preferences-heading" className="text-base font-semibold text-text-primary tracking-tight">
                Studio Preferences
              </h2>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-card text-text-secondary font-mono text-[11px]">
              Stored Locally
            </span>
          </div>

          {/* Preference 1: Theme Mode */}
          <div className="bg-card border border-subtle/60 rounded-[20px] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-text-primary">Studio Appearance</p>
              <p className="text-xs text-text-secondary mt-0.5">
                Choose between Soft Studio (Light) and Midnight Studio (Dark).
              </p>
            </div>
            <div
              className="bg-panel border border-subtle/80 rounded-full p-1 inline-flex items-center gap-1 self-start sm:self-auto shrink-0"
              role="group"
              aria-label="Studio theme preference"
            >
              <button
                type="button"
                aria-pressed={theme === 'light'}
                onClick={() => handleThemeSelect('light')}
                className={`min-h-[36px] px-3.5 py-1.5 text-xs rounded-full transition-colors ${
                  theme === 'light'
                    ? 'bg-accent text-accent-text font-semibold'
                    : 'text-text-secondary hover:text-text-primary font-medium'
                }`}
              >
                Light
              </button>
              <button
                type="button"
                aria-pressed={theme === 'dark'}
                onClick={() => handleThemeSelect('dark')}
                className={`min-h-[36px] px-3.5 py-1.5 text-xs rounded-full transition-colors ${
                  theme === 'dark'
                    ? 'bg-accent text-accent-text font-semibold'
                    : 'text-text-secondary hover:text-text-primary font-medium'
                }`}
              >
                Dark
              </button>
            </div>
          </div>

          {/* Preference 2: Browser Auto-Refresh */}
          <div className="bg-card border border-subtle/60 rounded-[20px] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-text-primary">Browser Live Polling (15s)</p>
              <p className="text-xs text-text-secondary mt-0.5">
                Pausing freezes dashboard auto-refresh; backend monitor workers continue probing normally.
              </p>
            </div>
            <div
              className="bg-panel border border-subtle/80 rounded-full p-1 inline-flex items-center gap-1 self-start sm:self-auto shrink-0"
              role="group"
              aria-label="Live polling preference"
            >
              <button
                type="button"
                aria-pressed={isPolling}
                onClick={() => handlePollingSelect(true)}
                className={`min-h-[36px] px-3.5 py-1.5 text-xs font-mono rounded-full inline-flex items-center gap-1.5 transition-colors ${
                  isPolling
                    ? 'bg-accent text-accent-text font-semibold'
                    : 'text-text-secondary hover:text-text-primary font-medium'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${isPolling ? 'bg-white' : 'bg-status-up-dot'}`}
                  aria-hidden="true"
                />
                Live 15s
              </button>
              <button
                type="button"
                aria-pressed={!isPolling}
                onClick={() => handlePollingSelect(false)}
                className={`min-h-[36px] px-3.5 py-1.5 text-xs font-mono rounded-full transition-colors ${
                  !isPolling
                    ? 'bg-accent text-accent-text font-semibold'
                    : 'text-text-secondary hover:text-text-primary font-medium'
                }`}
              >
                Paused
              </button>
            </div>
          </div>

          {/* Preference 3: Default Chart Window */}
          <div className="bg-card border border-subtle/60 rounded-[20px] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-text-primary">Default Telemetry Window</p>
              <p className="text-xs text-text-secondary mt-0.5">
                Initial time horizon applied when opening Dashboard or Monitor Detail charts.
              </p>
            </div>
            <div
              className="bg-panel border border-subtle/80 rounded-full p-1 inline-flex items-center gap-0.5 self-start sm:self-auto shrink-0"
              role="group"
              aria-label="Default chart time range"
            >
              {TELEMETRY_RANGES.map((range) => {
                const isSelected = defaultTimeRange === range;
                return (
                  <button
                    key={range}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => handleRangeSelect(range)}
                    className={`min-h-[36px] px-3 py-1 text-xs font-mono rounded-full transition-colors ${
                      isSelected
                        ? 'bg-accent text-accent-text font-semibold'
                        : 'text-text-secondary hover:text-text-primary font-medium'
                    }`}
                  >
                    {range}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Workspace Navigation */}
          <div className="pt-2 border-t border-subtle flex items-center justify-between gap-3 flex-wrap">
            <span className="text-xs text-text-secondary">Quick Shortcuts</span>
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                to="/"
                className="min-h-[36px] px-4 py-1.5 rounded-full bg-card hover:bg-subtle/60 border border-subtle/80 text-xs font-medium text-text-primary inline-flex items-center transition-colors"
              >
                Live Dashboard
              </Link>
              <Link
                to="/notifications"
                className="min-h-[36px] px-4 py-1.5 rounded-full bg-card hover:bg-subtle/60 border border-subtle/80 text-xs font-medium text-text-primary inline-flex items-center transition-colors"
              >
                Discord Integrations
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
