import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useTheme } from '../context/ThemeContext.js';

export default function RegisterPage() {
  const { register } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await register(name, email, password);
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Registration failed. Please review inputs.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas text-text-primary flex flex-col justify-between p-4 sm:p-8 font-sans">
      <header className="flex justify-between items-center max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-amber-brand rounded-sm" aria-hidden="true"></span>
          <span className="font-mono text-base font-semibold tracking-tight text-text-primary">
            PulseLedger
          </span>
          <span className="text-xs font-mono text-text-secondary border border-subtle px-1.5 py-0.5 rounded-sm">
            v1.0
          </span>
        </div>

        <button
          type="button"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          className="border border-subtle bg-panel hover:bg-subtle/40 text-text-secondary hover:text-text-primary px-3 py-1.5 text-xs font-mono rounded transition-colors"
        >
          {theme === 'dark' ? 'Paper Ledger (Light)' : 'Carbon Console (Dark)'}
        </button>
      </header>

      <main className="max-w-md w-full mx-auto my-8">
        <div className="bg-panel border border-subtle rounded-md p-6 sm:p-8 shadow-sm">
          <div className="mb-6">
            <h1 className="text-xl font-semibold tracking-tight text-text-primary">
              Register Operator
            </h1>
            <p className="text-sm text-text-secondary mt-1">
              Create a dedicated workspace for endpoint observability.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-5 p-3 rounded-sm border border-status-down bg-status-down-bg text-status-down-text text-xs font-mono"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="reg-name" className="block text-xs font-medium text-text-secondary uppercase mb-1">
                Full Name
              </label>
              <input
                id="reg-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full bg-canvas border border-subtle rounded px-3 py-2 text-sm text-text-primary font-mono placeholder:text-text-secondary/50 focus:border-amber-brand focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="reg-email" className="block text-xs font-medium text-text-secondary uppercase mb-1">
                Email Address
              </label>
              <input
                id="reg-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full bg-canvas border border-subtle rounded px-3 py-2 text-sm text-text-primary font-mono placeholder:text-text-secondary/50 focus:border-amber-brand focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="reg-password" className="block text-xs font-medium text-text-secondary uppercase mb-1">
                Password (min. 8 characters)
              </label>
              <input
                id="reg-password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Set password"
                className="w-full bg-canvas border border-subtle rounded px-3 py-2 text-sm text-text-primary font-mono placeholder:text-text-secondary/50 focus:border-amber-brand focus:outline-none"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-amber-brand text-amber-text hover:opacity-90 font-medium py-2.5 px-4 rounded text-sm transition-opacity"
              >
                {isSubmitting ? 'Registering...' : 'Create Operator Account'}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-5 border-t border-subtle text-center text-xs text-text-secondary">
            Already have an account?{' '}
            <Link to="/login" className="text-text-primary font-medium hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </main>

      <footer className="text-center text-xs font-mono text-text-secondary max-w-5xl mx-auto w-full">
        Hardware precision telemetry ledger. Strictly zero synthetic advertising metrics.
      </footer>
    </div>
  );
}
