import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';

export default function LoginPage() {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Authentication failed. Please verify credentials.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFillDemo = () => {
    setEmail('ardy@example.com');
    setPassword('PasswordKuat123!');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-canvas text-text-primary flex flex-col justify-between p-4 sm:p-8 font-sans">
      <header className="flex justify-between items-center max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-panel border border-subtle/80 shadow-xs flex items-center justify-center">
            <svg className="w-5 h-5 text-text-primary" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="10" fill="currentColor" />
              <path
                d="M5 13L11 19M7 9L15 17M10 6L18 14"
                stroke="var(--bg-panel)"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <span className="text-lg font-semibold tracking-tight text-text-primary">PulseLedger</span>
        </div>

        <button
          type="button"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          className="bg-panel border border-subtle/80 hover:border-subtle text-text-secondary hover:text-text-primary px-4 py-2 text-xs font-medium rounded-full shadow-xs transition-colors"
        >
          {theme === 'dark' ? 'Light Studio' : 'Dark Studio'}
        </button>
      </header>

      <main className="max-w-md w-full mx-auto my-8">
        <div className="bg-panel border border-subtle/80 rounded-[28px] p-7 sm:p-8 shadow-soft">
          <div className="mb-6 flex items-start gap-3">
            <span
              className="mt-2 w-2.5 h-2.5 rounded-full bg-status-up-dot ring-4 ring-status-up-dot/20 shrink-0"
              aria-hidden="true"
            />
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-text-primary">
                Studio Authentication
              </h1>
              <p className="text-xs text-text-secondary mt-1">
                Sign in to monitor live API uptime, latency trends, and Discord webhooks.
              </p>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-5 p-3.5 rounded-2xl border border-status-down/30 bg-status-down-bg text-status-down-text text-xs font-mono"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-xs font-semibold text-text-secondary mb-1.5">
                Operator Email
              </label>
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full bg-card border border-subtle/80 rounded-2xl px-4 py-2.5 text-sm text-text-primary font-mono placeholder:text-text-secondary/50 focus:border-accent focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="login-password" className="block text-xs font-semibold text-text-secondary mb-1.5">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full bg-card border border-subtle/80 rounded-2xl px-4 py-2.5 text-sm text-text-primary font-mono placeholder:text-text-secondary/50 focus:border-accent focus:outline-none"
              />
            </div>

            <div className="pt-2 flex flex-col gap-2.5">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-accent hover:bg-accent-hover text-accent-text font-semibold py-2.5 px-4 rounded-full text-sm transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? 'Authenticating...' : 'Sign In to Studio'}
              </button>

              <button
                type="button"
                onClick={handleFillDemo}
                className="w-full border border-subtle bg-card hover:bg-canvas text-text-secondary hover:text-text-primary py-2.5 px-4 rounded-full text-xs font-mono transition-colors"
              >
                Prefill Seeded Demo Account
              </button>
            </div>
          </form>

          <div className="mt-6 pt-5 border-t border-subtle text-center text-xs text-text-secondary">
            Need an operator account?{' '}
            <Link to="/register" className="text-accent font-semibold hover:underline">
              Create account
            </Link>
          </div>
        </div>
      </main>

      <footer className="text-center text-xs font-mono text-text-secondary max-w-5xl mx-auto w-full">
        PulseLedger API Observability Studio
      </footer>
    </div>
  );
}
