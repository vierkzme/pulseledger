import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { useTheme } from '../../context/ThemeContext.js';

export default function AppShell({ children, isPolling = true, onTogglePolling }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return 'OP';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-canvas text-text-primary flex flex-col font-sans">
      <header className="border-b border-subtle bg-panel sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <NavLink to="/" className="flex items-center gap-2 focus:outline-none">
              <span className="w-2.5 h-2.5 bg-amber-brand rounded-sm" aria-hidden="true"></span>
              <span className="font-mono text-base font-semibold tracking-tight text-text-primary">
                PulseLedger
              </span>
            </NavLink>

            <nav className="hidden md:flex items-center gap-1" aria-label="Main Navigation">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `px-3 py-1.5 text-xs font-mono rounded transition-colors ${
                    isActive
                      ? 'bg-subtle/50 text-text-primary font-medium'
                      : 'text-text-secondary hover:text-text-primary hover:bg-subtle/20'
                  }`
                }
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/notifications"
                className={({ isActive }) =>
                  `px-3 py-1.5 text-xs font-mono rounded transition-colors ${
                    isActive
                      ? 'bg-subtle/50 text-text-primary font-medium'
                      : 'text-text-secondary hover:text-text-primary hover:bg-subtle/20'
                  }`
                }
              >
                Notifications
              </NavLink>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {onTogglePolling && (
              <button
                type="button"
                onClick={onTogglePolling}
                title={isPolling ? 'Pause live auto-refresh' : 'Resume live auto-refresh'}
                aria-label={isPolling ? 'Pause live auto-refresh' : 'Resume live auto-refresh'}
                className="hidden sm:flex items-center gap-1.5 border border-subtle bg-canvas hover:bg-subtle/30 px-2.5 py-1 text-xs font-mono rounded text-text-secondary hover:text-text-primary transition-colors"
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isPolling ? 'bg-status-up animate-pulse' : 'bg-status-paused'
                  }`}
                  aria-hidden="true"
                ></span>
                <span>{isPolling ? 'Live Polling (15s)' : 'Polling Paused'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
              className="border border-subtle bg-canvas hover:bg-subtle/30 px-2.5 py-1 text-xs font-mono rounded text-text-secondary hover:text-text-primary transition-colors"
            >
              {theme === 'dark' ? 'Paper (Light)' : 'Carbon (Dark)'}
            </button>

            <div className="h-4 w-px bg-subtle hidden sm:block" aria-hidden="true"></div>

            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-sm bg-subtle/60 text-text-primary font-mono text-xs font-semibold flex items-center justify-center border border-subtle select-none"
                title={user?.name || 'Operator'}
                aria-label={`Current operator: ${user?.name || 'Operator'}`}
              >
                {getInitials(user?.name)}
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="hidden sm:inline-flex text-xs font-mono text-text-secondary hover:text-text-primary hover:underline px-1 py-1"
              >
                Exit
              </button>
            </div>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((p) => !p)}
              aria-label="Toggle mobile navigation menu"
              aria-expanded={mobileMenuOpen}
              className="md:hidden border border-subtle p-1.5 rounded text-text-secondary hover:text-text-primary"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-subtle bg-panel px-4 py-3 flex flex-col gap-2">
            <NavLink
              to="/"
              end
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 text-sm font-mono rounded hover:bg-subtle/30 text-text-primary"
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/notifications"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 text-sm font-mono rounded hover:bg-subtle/30 text-text-primary"
            >
              Notifications
            </NavLink>
            <div className="pt-2 border-t border-subtle flex justify-between items-center text-xs font-mono">
              <span className="text-text-secondary">{user?.email}</span>
              <button type="button" onClick={handleLogout} className="text-status-down hover:underline">
                Sign Out
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6">{children}</main>

      <footer className="border-t border-subtle bg-panel py-4 px-4 sm:px-6 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-mono text-text-secondary">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-status-up rounded-full" aria-hidden="true"></span>
            <span>PulseLedger Instrumentation Node</span>
          </div>
          <div>UTC Precision: {new Date().toISOString().slice(0, 10)}</div>
        </div>
      </footer>
    </div>
  );
}
