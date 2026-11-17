import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth, getOperatorInitials } from '../../context/AuthContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';

function BrandEmblem() {
  return (
    <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-panel border border-subtle/80 shadow-xs flex items-center justify-center shrink-0">
      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-text-primary" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="10" fill="currentColor" />
        <path
          d="M5 13L11 19M7 9L15 17M10 6L18 14"
          stroke="var(--bg-panel)"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

export default function AppShell({ children, isPolling = true, onTogglePolling }) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      to: '/',
      isActive: location.pathname === '/' || location.pathname.startsWith('/monitors/'),
      icon: (
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3" y="3" width="7" height="7" rx="1.5" strokeWidth="1.8" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" strokeWidth="1.8" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" strokeWidth="1.8" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" strokeWidth="1.8" />
        </svg>
      ),
    },
    {
      id: 'notifications',
      label: 'Integrations',
      to: '/notifications',
      isActive: location.pathname === '/notifications',
      icon: (
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
      ),
    },
    {
      id: 'settings',
      label: 'Settings',
      to: '/settings',
      isActive: location.pathname === '/settings',
      icon: (
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <circle cx="12" cy="12" r="3" strokeWidth="1.8" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-canvas text-text-primary flex flex-col font-sans">
      <header className="sticky top-0 z-30 bg-canvas/95 backdrop-blur-sm">
        <div className="max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8 py-3.5 sm:py-4 flex items-center justify-between gap-2 sm:gap-4">
          {/* Brand Identity */}
          <Link to="/" className="flex items-center gap-2 sm:gap-3 focus:outline-none shrink-0">
            <BrandEmblem />
            <span className="text-[15px] sm:text-[19px] font-semibold tracking-tight text-text-primary">
              PulseLedger
            </span>
          </Link>

          {/* Desktop Center Floating Pill Navigation */}
          <nav
            className="hidden md:flex items-center gap-1 bg-panel border border-subtle/80 rounded-full px-3 py-1.5 shadow-xs"
            aria-label="Main Navigation"
          >
            {navItems.map((item) => (
              <Link
                key={item.id}
                to={item.to}
                aria-current={item.isActive ? 'page' : undefined}
                className={`relative px-3.5 py-1.5 text-[13px] rounded-full inline-flex items-center gap-2 transition-colors ${
                  item.isActive
                    ? 'text-text-primary font-semibold'
                    : 'text-text-secondary hover:text-text-primary font-medium'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.isActive && (
                  <span
                    className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-5 h-[2px] bg-text-primary rounded-full"
                    aria-hidden="true"
                  />
                )}
              </Link>
            ))}
          </nav>

          {/* Right Utility Controls (Live Polling & Theme always visible on mobile + desktop) */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {onTogglePolling && (
              <button
                type="button"
                onClick={onTogglePolling}
                title={isPolling ? 'Pause live 15s auto-refresh' : 'Resume live 15s auto-refresh'}
                aria-label={isPolling ? 'Pause live 15s auto-refresh' : 'Resume live 15s auto-refresh'}
                aria-pressed={isPolling}
                className="inline-flex items-center gap-1.5 sm:gap-2 bg-panel border border-subtle/80 hover:border-subtle px-2.5 sm:px-3.5 min-h-[40px] sm:min-h-[36px] text-xs font-medium rounded-full text-text-primary shadow-xs transition-colors"
              >
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    isPolling
                      ? 'bg-status-up-dot ring-4 ring-status-up-dot/20'
                      : 'bg-status-paused'
                  }`}
                  aria-hidden="true"
                />
                <span className="font-mono whitespace-nowrap">{isPolling ? 'Live 15s' : 'Paused'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
              className="w-10 h-10 sm:w-9 sm:h-9 rounded-full bg-panel border border-subtle/80 hover:border-subtle flex items-center justify-center text-text-secondary hover:text-text-primary shadow-xs transition-colors shrink-0"
            >
              {theme === 'dark' ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.8"
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.8"
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
              )}
            </button>

            <Link
              to="/settings"
              title={`Account & Settings (${user?.name || 'Operator'})`}
              aria-label="Open Account and Workspace Settings"
              className="hidden md:inline-flex items-center gap-2 bg-panel border border-subtle/80 hover:border-subtle rounded-full pl-1.5 pr-3 py-1 shadow-xs transition-colors group"
            >
              <span
                className="w-7 h-7 rounded-full bg-card text-text-primary font-mono text-[11px] font-semibold flex items-center justify-center select-none"
                aria-hidden="true"
              >
                {getOperatorInitials(user?.name)}
              </span>
              <span className="text-xs font-medium text-text-secondary group-hover:text-text-primary max-w-[120px] truncate transition-colors">
                {user?.name || 'Operator'}
              </span>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1440px] mx-auto w-full px-4 sm:px-6 lg:px-8 pb-[calc(6rem+env(safe-area-inset-bottom,0px))] md:pb-8">
        {children}
      </main>

      {/* Mobile Floating Bottom Bubble Navigation */}
      <nav
        aria-label="Mobile Navigation"
        style={{ bottom: 'max(0.875rem, env(safe-area-inset-bottom, 0.875rem))' }}
        className="md:hidden fixed inset-x-0 z-30 flex justify-center px-2 pointer-events-none"
      >
        <div className="pointer-events-auto flex items-center gap-1 bg-panel/95 backdrop-blur-md border border-subtle/80 rounded-full p-1.5 shadow-soft max-w-full">
          {navItems.map((item) => (
            <Link
              key={item.id}
              to={item.to}
              aria-current={item.isActive ? 'page' : undefined}
              className={`relative min-h-[44px] px-3 sm:px-4 py-2 text-[11px] sm:text-xs rounded-full inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap ${
                item.isActive
                  ? 'bg-card text-text-primary font-semibold border border-subtle/70'
                  : 'text-text-secondary hover:text-text-primary font-medium border border-transparent'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.isActive && (
                <span
                  className="absolute bottom-1 left-1/2 -translate-x-1/2 w-4 h-[2px] bg-text-primary rounded-full"
                  aria-hidden="true"
                />
              )}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
