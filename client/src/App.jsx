import React, { createContext, useContext, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import AppShell from './components/layout/AppShell.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import MonitorDetailPage from './pages/MonitorDetailPage.jsx';
import NotificationsPage from './pages/NotificationsPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';

export const TELEMETRY_RANGES = ['1h', '24h', '7d', '30d'];

const PollingContext = createContext({
  isPolling: true,
  togglePolling: () => {},
  setIsPolling: () => {},
  defaultTimeRange: '24h',
  setDefaultTimeRange: () => {},
});

export function usePolling() {
  return useContext(PollingContext);
}

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const { isPolling, togglePolling } = usePolling();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center font-mono text-xs text-text-secondary">
        <div className="bg-panel border border-subtle rounded-full px-5 py-2.5 shadow-xs flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-status-up-dot ring-4 ring-status-up-dot/20" aria-hidden="true"></span>
          INITIALIZING PULSELEDGER STUDIO...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <AppShell isPolling={isPolling} onTogglePolling={togglePolling}>
      {children}
    </AppShell>
  );
}

function PublicRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  const [isPolling, setIsPolling] = useState(() => {
    const saved = localStorage.getItem('pulseledger_polling');
    return saved === 'false' ? false : true;
  });

  const [defaultTimeRange, setDefaultTimeRangeState] = useState(() => {
    const saved = localStorage.getItem('pulseledger_default_range');
    return TELEMETRY_RANGES.includes(saved) ? saved : '24h';
  });

  useEffect(() => {
    localStorage.setItem('pulseledger_polling', String(isPolling));
  }, [isPolling]);

  useEffect(() => {
    localStorage.setItem('pulseledger_default_range', defaultTimeRange);
  }, [defaultTimeRange]);

  const togglePolling = () => setIsPolling((prev) => !prev);
  const setDefaultTimeRange = (range) => {
    if (TELEMETRY_RANGES.includes(range)) {
      setDefaultTimeRangeState(range);
    }
  };

  return (
    <ThemeProvider>
      <AuthProvider>
        <PollingContext.Provider
          value={{ isPolling, togglePolling, setIsPolling, defaultTimeRange, setDefaultTimeRange }}
        >
          <BrowserRouter>
            <Routes>
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <LoginPage />
                  </PublicRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <PublicRoute>
                    <RegisterPage />
                  </PublicRoute>
                }
              />

              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/monitors/:id"
                element={
                  <ProtectedRoute>
                    <MonitorDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notifications"
                element={
                  <ProtectedRoute>
                    <NotificationsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <SettingsPage />
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </PollingContext.Provider>
      </AuthProvider>
    </ThemeProvider>
  );
}
