import React, { useState, useEffect, useRef } from 'react';
import api from '../../api/client.js';

export default function MonitorFormModal({ isOpen, onClose, initialData = null, onSuccess }) {
  const dialogRef = useRef(null);

  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [method, setMethod] = useState('GET');
  const [intervalSeconds, setIntervalSeconds] = useState(60);
  const [timeoutMs, setTimeoutMs] = useState(10000);
  const [expectedStatusMin, setExpectedStatusMin] = useState(200);
  const [expectedStatusMax, setExpectedStatusMax] = useState(299);
  const [body, setBody] = useState('');
  const [headersList, setHeadersList] = useState([{ key: '', value: '' }]);
  const [selectedChannels, setSelectedChannels] = useState([]);
  const [availableChannels, setAvailableChannels] = useState([]);
  const [isLoadingChannels, setIsLoadingChannels] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
      fetchNotificationChannels();
      populateForm();
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen, initialData]);

  const populateForm = () => {
    setErrorMessage('');
    if (initialData) {
      setName(initialData.name || '');
      setUrl(initialData.url || '');
      setMethod(initialData.method || 'GET');
      setIntervalSeconds(initialData.intervalSeconds || 60);
      setTimeoutMs(initialData.timeoutMs || 10000);
      setExpectedStatusMin(initialData.expectedStatusMin || 200);
      setExpectedStatusMax(initialData.expectedStatusMax || 299);
      setBody(initialData.body || '');

      if (initialData.headers && typeof initialData.headers === 'object') {
        const list = Object.entries(initialData.headers).map(([k, v]) => ({
          key: k,
          value: String(v),
        }));
        setHeadersList(list.length > 0 ? list : [{ key: '', value: '' }]);
      } else {
        setHeadersList([{ key: '', value: '' }]);
      }

      if (Array.isArray(initialData.notifications)) {
        setSelectedChannels(initialData.notifications.map((c) => c.channelId || c.channel?.id || c.id));
      } else if (Array.isArray(initialData.notificationChannels)) {
        setSelectedChannels(initialData.notificationChannels.map((c) => c.channelId || c.id));
      } else {
        setSelectedChannels([]);
      }
    } else {
      setName('');
      setUrl('');
      setMethod('GET');
      setIntervalSeconds(60);
      setTimeoutMs(10000);
      setExpectedStatusMin(200);
      setExpectedStatusMax(299);
      setBody('');
      setHeadersList([{ key: '', value: '' }]);
      setSelectedChannels([]);
    }
  };

  const fetchNotificationChannels = async () => {
    setIsLoadingChannels(true);
    try {
      const response = await api.get('/channels');
      if (response.data && response.data.success) {
        setAvailableChannels(response.data.data || []);
      }
    } catch {
      setAvailableChannels([]);
    } finally {
      setIsLoadingChannels(false);
    }
  };

  const handleAddHeader = () => {
    setHeadersList((prev) => [...prev, { key: '', value: '' }]);
  };

  const handleRemoveHeader = (index) => {
    setHeadersList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleHeaderChange = (index, field, val) => {
    setHeadersList((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: val };
      return updated;
    });
  };

  const handleChannelToggle = (channelId) => {
    setSelectedChannels((prev) =>
      prev.includes(channelId) ? prev.filter((id) => id !== channelId) : [...prev, channelId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const headersObject = {};
      for (const item of headersList) {
        const trimmedKey = item.key.trim();
        if (trimmedKey) {
          headersObject[trimmedKey] = item.value;
        }
      }

      const payload = {
        name: name.trim(),
        url: url.trim(),
        method,
        intervalSeconds: Number(intervalSeconds),
        timeoutMs: Number(timeoutMs),
        expectedStatusMin: Number(expectedStatusMin),
        expectedStatusMax: Number(expectedStatusMax),
        headers: headersObject,
        body: ['POST', 'PUT'].includes(method) && body.trim() ? body : null,
        notificationChannelIds: selectedChannels,
      };

      if (initialData && initialData.id) {
        await api.patch(`/monitors/${initialData.id}`, payload);
      } else {
        await api.post('/monitors', payload);
      }

      onSuccess && onSuccess();
      onClose();
    } catch (err) {
      const details = err.response?.data?.error?.details;
      const detailMsg = Array.isArray(details) && details.length > 0 ? details[0].issue : null;
      const msg =
        detailMsg ||
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        err.message ||
        'Failed to save monitor';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      closedby="any"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === dialogRef.current) {
          onClose();
        }
      }}
      className="backdrop:bg-slate-900/50 backdrop:backdrop-blur-xs bg-panel text-text-primary border border-subtle rounded-[28px] shadow-2xl p-0 w-full max-w-xl open:flex open:flex-col m-auto overflow-hidden"
      aria-labelledby="monitor-modal-title"
    >
      <header className="px-6 py-5 border-b border-subtle flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="w-2.5 h-2.5 rounded-full bg-status-up-dot ring-4 ring-status-up-dot/20 shrink-0"
            aria-hidden="true"
          />
          <div>
            <h2 id="monitor-modal-title" className="text-base font-semibold text-text-primary">
              {initialData ? 'Configure Monitor' : 'Create New Target'}
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Configure telemetry checks and Discord alert channels
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-card hover:bg-subtle/60 text-text-secondary hover:text-text-primary flex items-center justify-center text-lg leading-none transition-colors"
          aria-label="Close dialog"
        >
          &times;
        </button>
      </header>

      <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 overflow-y-auto max-h-[75vh]">
        {errorMessage && (
          <div
            role="alert"
            className="p-3.5 text-xs font-mono rounded-2xl border border-status-down/30 bg-status-down-bg text-status-down-text"
          >
            {errorMessage}
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="monitor-name" className="text-xs font-semibold text-text-secondary">
            Display Label <span className="text-status-down">*</span>
          </label>
          <input
            id="monitor-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Production Auth Service"
            className="w-full bg-card border border-subtle/80 rounded-2xl px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="sm:w-32 flex flex-col gap-1.5">
            <label htmlFor="monitor-method" className="text-xs font-semibold text-text-secondary">
              Method
            </label>
            <select
              id="monitor-method"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="bg-card border border-subtle/80 rounded-2xl px-3.5 py-2.5 text-sm font-mono text-text-primary focus:outline-none focus:border-accent"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="HEAD">HEAD</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>

          <div className="flex-1 flex flex-col gap-1.5">
            <label htmlFor="monitor-url" className="text-xs font-semibold text-text-secondary">
              Target URL <span className="text-status-down">*</span>
            </label>
            <input
              id="monitor-url"
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://api.example.com/health"
              className="w-full bg-card border border-subtle/80 rounded-2xl px-3.5 py-2.5 text-sm font-mono text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="monitor-interval" className="text-xs font-semibold text-text-secondary">
              Check Interval
            </label>
            <select
              id="monitor-interval"
              value={intervalSeconds}
              onChange={(e) => setIntervalSeconds(Number(e.target.value))}
              className="bg-card border border-subtle/80 rounded-2xl px-3.5 py-2.5 text-sm font-mono text-text-primary focus:outline-none focus:border-accent"
            >
              <option value={60}>Every 1 minute (60s)</option>
              <option value={180}>Every 3 minutes (180s)</option>
              <option value={300}>Every 5 minutes (300s)</option>
              <option value={900}>Every 15 minutes (900s)</option>
              <option value={1800}>Every 30 minutes (1800s)</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="monitor-timeout" className="text-xs font-semibold text-text-secondary">
              Timeout (ms)
            </label>
            <input
              id="monitor-timeout"
              type="number"
              min={1000}
              max={30000}
              step={500}
              value={timeoutMs}
              onChange={(e) => setTimeoutMs(Number(e.target.value))}
              className="w-full bg-card border border-subtle/80 rounded-2xl px-3.5 py-2.5 text-sm font-mono text-text-primary focus:outline-none focus:border-accent"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-text-secondary">
            Expected HTTP Status Code Range
          </span>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={100}
              max={599}
              value={expectedStatusMin}
              onChange={(e) => setExpectedStatusMin(Number(e.target.value))}
              className="w-24 bg-card border border-subtle/80 rounded-2xl px-3 py-2 text-sm font-mono text-text-primary focus:outline-none focus:border-accent text-center"
              aria-label="Minimum status code"
            />
            <span className="text-text-secondary font-mono text-xs">to</span>
            <input
              type="number"
              min={100}
              max={599}
              value={expectedStatusMax}
              onChange={(e) => setExpectedStatusMax(Number(e.target.value))}
              className="w-24 bg-card border border-subtle/80 rounded-2xl px-3 py-2 text-sm font-mono text-text-primary focus:outline-none focus:border-accent text-center"
              aria-label="Maximum status code"
            />
          </div>
        </div>

        {['POST', 'PUT'].includes(method) && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="monitor-body" className="text-xs font-semibold text-text-secondary">
              Request Body (Optional)
            </label>
            <textarea
              id="monitor-body"
              rows={2}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder='{"event": "ping"}'
              className="w-full bg-card border border-subtle/80 rounded-2xl px-3.5 py-2 text-xs font-mono text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent"
            />
          </div>
        )}

        <div className="flex flex-col gap-2 pt-3 border-t border-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-secondary">Custom HTTP Headers</span>
            <button
              type="button"
              onClick={handleAddHeader}
              className="text-xs font-semibold text-accent hover:underline"
            >
              + Add Header
            </button>
          </div>
          {headersList.map((header, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Header (e.g. Authorization)"
                value={header.key}
                onChange={(e) => handleHeaderChange(idx, 'key', e.target.value)}
                className="flex-1 bg-card border border-subtle/80 rounded-2xl px-3 py-2 text-xs font-mono text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent"
              />
              <input
                type="text"
                placeholder="Value"
                value={header.value}
                onChange={(e) => handleHeaderChange(idx, 'value', e.target.value)}
                className="flex-1 bg-card border border-subtle/80 rounded-2xl px-3 py-2 text-xs font-mono text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent"
              />
              {headersList.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveHeader(idx)}
                  className="w-7 h-7 rounded-full bg-card text-text-secondary hover:text-status-down flex items-center justify-center text-sm"
                  aria-label="Remove header"
                >
                  &times;
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2 pt-3 border-t border-subtle">
          <span className="text-xs font-semibold text-text-secondary">Discord Notification Channels</span>
          {isLoadingChannels ? (
            <div className="text-xs font-mono text-text-secondary py-1">Loading webhook channels...</div>
          ) : availableChannels.length === 0 ? (
            <div className="text-xs text-text-secondary py-2.5 bg-card px-3.5 rounded-2xl">
              No webhook channels configured yet. Create one in Integrations to receive downtime alerts.
            </div>
          ) : (
            <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto">
              {availableChannels.map((channel) => (
                <label
                  key={channel.id}
                  className="flex items-center gap-2.5 text-xs font-mono text-text-primary cursor-pointer hover:bg-card p-2 rounded-2xl transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedChannels.includes(channel.id)}
                    onChange={() => handleChannelToggle(channel.id)}
                    className="rounded border-subtle text-accent focus:ring-0"
                  />
                  <span className="font-semibold font-sans">{channel.name}</span>
                  <span className="text-text-secondary text-[11px] truncate">{channel.webhookUrl}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <footer className="pt-4 border-t border-subtle flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="border border-subtle bg-card hover:bg-canvas text-text-secondary px-4 py-2 text-xs font-semibold rounded-full transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-accent hover:bg-accent-hover text-accent-text px-5 py-2 text-xs font-semibold rounded-full transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : initialData ? 'Update Monitor' : 'Create Monitor'}
          </button>
        </footer>
      </form>
    </dialog>
  );
}
