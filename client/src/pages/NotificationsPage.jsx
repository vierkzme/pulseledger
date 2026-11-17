import React, { useState, useEffect, useRef } from 'react';
import api from '../api/client.js';

export default function NotificationsPage() {
  const [channels, setChannels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState({ type: '', text: '' });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState(null);
  const [channelName, setChannelName] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [modalError, setModalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [testingId, setTestingId] = useState(null);
  const dialogRef = useRef(null);

  const fetchChannels = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await api.get('/channels');
      if (res.data?.success) {
        setChannels(res.data.data || []);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.error?.message || err.message || 'Failed to load notification channels');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChannels();
  }, []);

  const openCreateModal = () => {
    setEditingChannel(null);
    setChannelName('');
    setWebhookUrl('');
    setModalError('');
    setIsModalOpen(true);
    if (dialogRef.current && !dialogRef.current.open) {
      dialogRef.current.showModal();
    }
  };

  const openEditModal = (channel) => {
    setEditingChannel(channel);
    setChannelName(channel.name);
    setWebhookUrl(channel.webhookUrl);
    setModalError('');
    setIsModalOpen(true);
    if (dialogRef.current && !dialogRef.current.open) {
      dialogRef.current.showModal();
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingChannel(null);
    if (dialogRef.current && dialogRef.current.open) {
      dialogRef.current.close();
    }
  };

  const handleSaveChannel = async (e) => {
    e.preventDefault();
    setModalError('');

    const trimmedName = channelName.trim();
    const trimmedUrl = webhookUrl.trim();

    if (!trimmedName) {
      setModalError('Channel label is required');
      return;
    }

    if (
      !trimmedUrl.startsWith('https://discord.com/api/webhooks/') &&
      !trimmedUrl.startsWith('https://discordapp.com/api/webhooks/')
    ) {
      setModalError('Webhook URL must begin with https://discord.com/api/webhooks/');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingChannel) {
        await api.put(`/channels/${editingChannel.id}`, {
          name: trimmedName,
          webhookUrl: trimmedUrl,
        });
        setFeedbackMessage({ type: 'success', text: `Channel "${trimmedName}" updated successfully` });
      } else {
        await api.post('/channels', {
          name: trimmedName,
          webhookUrl: trimmedUrl,
        });
        setFeedbackMessage({ type: 'success', text: `Channel "${trimmedName}" added successfully` });
      }
      closeModal();
      fetchChannels();
    } catch (err) {
      setModalError(err.response?.data?.error?.message || err.message || 'Failed to save webhook channel');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteChannel = async (channel) => {
    if (!window.confirm(`Delete Discord channel "${channel.name}"? Active alerts using this channel will stop.`)) {
      return;
    }

    try {
      await api.delete(`/channels/${channel.id}`);
      setFeedbackMessage({ type: 'success', text: `Channel "${channel.name}" deleted` });
      fetchChannels();
    } catch (err) {
      setFeedbackMessage({
        type: 'error',
        text: err.response?.data?.error?.message || err.message || 'Failed to delete channel',
      });
    }
  };

  const handleTestChannel = async (channel) => {
    setTestingId(channel.id);
    setFeedbackMessage({ type: '', text: '' });
    try {
      const res = await api.post(`/channels/${channel.id}/test`);
      setFeedbackMessage({
        type: 'success',
        text: res.data?.message || `Test alert dispatched to Discord channel "${channel.name}"!`,
      });
    } catch (err) {
      setFeedbackMessage({
        type: 'error',
        text: err.response?.data?.error?.message || err.message || `Failed to send test alert to "${channel.name}"`,
      });
    } finally {
      setTestingId(null);
    }
  };

  const maskWebhook = (url) => {
    if (!url) return '';
    try {
      const parts = url.split('/');
      const token = parts[parts.length - 1];
      const webhookId = parts[parts.length - 2];
      return `.../${webhookId}/${token.slice(0, 4)}••••••••`;
    } catch {
      return 'https://discord.com/api/webhooks/••••••••';
    }
  };

  return (
    <div className="py-1 flex flex-col gap-5">
      <section className="bg-panel border border-subtle/80 rounded-[28px] p-5 sm:p-6 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            className="w-2.5 h-2.5 rounded-full bg-status-up-dot ring-4 ring-status-up-dot/20 shrink-0"
            aria-hidden="true"
          />
          <div>
            <h1 className="text-lg sm:text-xl font-semibold text-text-primary tracking-tight">
              Discord Alert Integrations
            </h1>
            <p className="text-xs text-text-secondary mt-0.5">
              Configure Discord webhooks for instant downtime and recovery telemetry alerts
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="bg-accent hover:bg-accent-hover text-accent-text px-5 py-2.5 text-xs font-semibold rounded-full transition-colors self-start sm:self-auto"
        >
          + Add Discord Webhook
        </button>
      </section>

      {feedbackMessage.text && (
        <div
          role="status"
          className={`px-5 py-3.5 text-xs font-mono rounded-[20px] border flex items-center justify-between ${
            feedbackMessage.type === 'success'
              ? 'border-status-up/25 bg-status-up-bg text-status-up'
              : 'border-status-down/25 bg-status-down-bg text-status-down-text'
          }`}
        >
          <span>{feedbackMessage.text}</span>
          <button
            type="button"
            onClick={() => setFeedbackMessage({ type: '', text: '' })}
            className="hover:opacity-75 text-base leading-none ml-2"
            aria-label="Dismiss message"
          >
            &times;
          </button>
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          className="px-5 py-3.5 text-xs font-mono rounded-[20px] border border-status-down/25 bg-status-down-bg text-status-down-text flex items-center justify-between"
        >
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={fetchChannels}
            className="px-3 py-1 rounded-full bg-panel border border-subtle text-text-primary font-semibold"
          >
            Retry
          </button>
        </div>
      )}

      {isLoading && (
        <div className="bg-panel border border-subtle/80 rounded-[28px] p-6 flex flex-col gap-3 animate-pulse shadow-soft">
          <div className="w-48 h-4 bg-card rounded-full"></div>
          <div className="w-full h-14 bg-card rounded-2xl"></div>
          <div className="w-full h-14 bg-card rounded-2xl"></div>
        </div>
      )}

      {!isLoading && channels.length === 0 && (
        <div className="bg-panel border border-dashed border-subtle rounded-[28px] p-10 text-center flex flex-col items-center justify-center shadow-soft">
          <div className="w-12 h-12 rounded-full bg-card border border-subtle flex items-center justify-center text-accent mb-3 font-mono font-bold text-base">
            DC
          </div>
          <h2 className="text-base font-semibold text-text-primary">No Webhook Channels Configured</h2>
          <p className="text-xs text-text-secondary max-w-md mt-1 mb-5">
            Connect your Discord server by providing an incoming webhook URL. PulseLedger dispatches rich alert cards
            the moment an endpoint fails confirmation retries.
          </p>
          <button
            type="button"
            onClick={openCreateModal}
            className="bg-accent hover:bg-accent-hover text-accent-text px-5 py-2.5 text-xs font-semibold rounded-full transition-colors"
          >
            Connect Discord Webhook
          </button>
        </div>
      )}

      {!isLoading && channels.length > 0 && (
        <section className="bg-panel border border-subtle/80 rounded-[28px] overflow-hidden shadow-soft">
          <div className="p-5 sm:p-6 border-b border-subtle flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-primary">Active Dispatch Channels</h2>
            <span className="px-3 py-1 rounded-full bg-card text-xs font-mono text-text-secondary">
              {channels.length} configured
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-subtle bg-card/70 text-text-secondary font-mono">
                  <th className="py-3 px-5 font-medium">Channel Name</th>
                  <th className="py-3 px-5 font-medium">Webhook Target</th>
                  <th className="py-3 px-5 font-medium">Created</th>
                  <th className="py-3 px-5 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle/70">
                {channels.map((ch) => (
                  <tr key={ch.id} className="hover:bg-card/40 transition-colors">
                    <td className="py-3.5 px-5 font-semibold text-text-primary">
                      <div className="flex items-center gap-2.5">
                        <span className="w-2 h-2 rounded-full bg-status-up-dot" aria-hidden="true" />
                        <span>{ch.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-text-secondary font-mono truncate max-w-xs" title={ch.webhookUrl}>
                      {maskWebhook(ch.webhookUrl)}
                    </td>
                    <td className="py-3.5 px-5 text-text-secondary font-mono whitespace-nowrap">
                      {new Date(ch.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          disabled={testingId === ch.id}
                          onClick={() => handleTestChannel(ch)}
                          className="px-3 py-1.5 text-xs font-medium border border-subtle bg-card hover:bg-canvas text-text-primary rounded-full transition-colors disabled:opacity-50"
                        >
                          {testingId === ch.id ? 'Sending...' : 'Test'}
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(ch)}
                          className="px-3 py-1.5 text-xs font-medium border border-subtle bg-card hover:bg-canvas text-text-primary rounded-full transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteChannel(ch)}
                          className="px-3 py-1.5 text-xs font-semibold border border-status-down/20 bg-status-down-bg text-status-down-text rounded-full transition-opacity hover:opacity-90"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <dialog
        ref={dialogRef}
        closedby="any"
        onCancel={(e) => {
          e.preventDefault();
          closeModal();
        }}
        onClick={(e) => {
          if (e.target === dialogRef.current) {
            closeModal();
          }
        }}
        className="backdrop:bg-slate-900/50 backdrop:backdrop-blur-xs bg-panel text-text-primary border border-subtle rounded-[28px] shadow-2xl p-0 w-full max-w-md open:flex open:flex-col m-auto overflow-hidden"
        aria-labelledby="channel-dialog-title"
      >
        <header className="px-6 py-5 border-b border-subtle flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span
              className="w-2.5 h-2.5 rounded-full bg-status-up-dot ring-4 ring-status-up-dot/20 shrink-0"
              aria-hidden="true"
            />
            <div>
              <h2 id="channel-dialog-title" className="text-base font-semibold text-text-primary">
                {editingChannel ? 'Edit Discord Channel' : 'Add Discord Webhook'}
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Paste the webhook URL copied from Discord channel settings
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeModal}
            className="w-8 h-8 rounded-full bg-card hover:bg-subtle/60 text-text-secondary hover:text-text-primary flex items-center justify-center text-lg leading-none"
            aria-label="Close dialog"
          >
            &times;
          </button>
        </header>

        <form onSubmit={handleSaveChannel} className="p-6 flex flex-col gap-4">
          {modalError && (
            <div
              role="alert"
              className="p-3 text-xs font-mono rounded-2xl border border-status-down/30 bg-status-down-bg text-status-down-text"
            >
              {modalError}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="ch-name" className="text-xs font-semibold text-text-secondary">
              Channel Label <span className="text-status-down">*</span>
            </label>
            <input
              id="ch-name"
              type="text"
              required
              value={channelName}
              onChange={(e) => setChannelName(e.target.value)}
              placeholder="e.g. #ops-incidents"
              className="w-full bg-card border border-subtle/80 rounded-2xl px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="ch-url" className="text-xs font-semibold text-text-secondary">
              Discord Webhook URL <span className="text-status-down">*</span>
            </label>
            <input
              id="ch-url"
              type="url"
              required
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://discord.com/api/webhooks/..."
              className="w-full bg-card border border-subtle/80 rounded-2xl px-3.5 py-2.5 text-sm font-mono text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent"
            />
          </div>

          <footer className="pt-4 border-t border-subtle flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={closeModal}
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
              {isSubmitting ? 'Saving...' : editingChannel ? 'Update Webhook' : 'Save Webhook'}
            </button>
          </footer>
        </form>
      </dialog>
    </div>
  );
}
