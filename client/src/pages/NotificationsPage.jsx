import React, { useState, useEffect, useRef } from 'react';
import api from '../api/client.js';

export default function NotificationsPage() {
  const [channels, setChannels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState({ type: '', text: '' });

  // Dialog State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState(null);
  const [channelName, setChannelName] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [modalError, setModalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Testing State
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
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to load notification channels');
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

    if (!trimmedUrl.startsWith('https://discord.com/api/webhooks/') && !trimmedUrl.startsWith('https://discordapp.com/api/webhooks/')) {
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
      setModalError(err.response?.data?.message || 'Failed to save webhook channel');
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
      setFeedbackMessage({ type: 'error', text: err.response?.data?.message || 'Failed to delete channel' });
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
        text: err.response?.data?.message || `Failed to send test alert to "${channel.name}"`,
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
    <div className="py-4 flex flex-col gap-6 font-mono">
      {/* Header Panel */}
      <header className="bg-panel border border-subtle rounded-md p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-base sm:text-lg font-semibold text-text-primary tracking-tight">
            Notification Channels
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Configure Discord webhooks for instant downtime and recovery telemetry alerts
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="border border-amber-brand bg-amber-brand text-amber-text px-4 py-2 text-xs font-semibold rounded transition-opacity hover:opacity-90 self-start sm:self-auto"
        >
          + Add Discord Webhook
        </button>
      </header>

      {/* Global Feedback Alert */}
      {feedbackMessage.text && (
        <div
          role="status"
          className={`p-3 text-xs rounded border flex items-center justify-between ${
            feedbackMessage.type === 'success'
              ? 'border-status-up bg-status-up-bg text-status-up'
              : 'border-status-down bg-status-down-bg text-status-down-text'
          }`}
        >
          <span>{feedbackMessage.text}</span>
          <button
            type="button"
            onClick={() => setFeedbackMessage({ type: '', text: '' })}
            className="hover:opacity-75 text-sm ml-2"
            aria-label="Dismiss message"
          >
            &times;
          </button>
        </div>
      )}

      {/* Global Error Banner */}
      {errorMessage && (
        <div
          role="alert"
          className="p-3 text-xs rounded border border-status-down bg-status-down-bg text-status-down-text flex items-center justify-between"
        >
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={fetchChannels}
            className="underline hover:no-underline font-semibold"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="bg-panel border border-subtle rounded-md p-6 flex flex-col gap-3 animate-pulse">
          <div className="w-48 h-4 bg-subtle/50 rounded"></div>
          <div className="w-full h-12 bg-subtle/30 rounded"></div>
          <div className="w-full h-12 bg-subtle/30 rounded"></div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && channels.length === 0 && (
        <div className="bg-panel border border-dashed border-subtle rounded-md p-10 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded bg-amber-brand/10 border border-amber-brand/20 flex items-center justify-center text-amber-brand mb-3 font-bold text-lg">
            DC
          </div>
          <h2 className="text-base font-semibold text-text-primary">No Webhook Channels Configured</h2>
          <p className="text-xs text-text-secondary max-w-md mt-1 mb-4">
            Connect your Discord server by providing an incoming webhook URL. PulseLedger dispatches rich alert cards
            the moment an endpoint fails confirmation retries.
          </p>
          <button
            type="button"
            onClick={openCreateModal}
            className="border border-amber-brand bg-amber-brand text-amber-text px-4 py-2 text-xs font-semibold rounded transition-opacity hover:opacity-90"
          >
            Connect Discord Webhook
          </button>
        </div>
      )}

      {/* Channels List Table */}
      {!isLoading && channels.length > 0 && (
        <div className="bg-panel border border-subtle rounded-md overflow-hidden">
          <div className="p-4 border-b border-subtle flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-text-primary">
              Active Dispatch Channels
            </h2>
            <span className="text-xs text-text-secondary">{channels.length} configured</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-subtle bg-subtle/20 text-text-secondary">
                  <th className="py-2.5 px-4 font-medium">Channel Name</th>
                  <th className="py-2.5 px-4 font-medium">Webhook Target</th>
                  <th className="py-2.5 px-4 font-medium">Created</th>
                  <th className="py-2.5 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle">
                {channels.map((ch) => (
                  <tr key={ch.id} className="hover:bg-subtle/10 transition-colors">
                    <td className="py-3 px-4 font-semibold text-text-primary flex items-center gap-2">
                      <span className="w-2 h-2 rounded-sm bg-status-up" aria-hidden="true"></span>
                      {ch.name}
                    </td>
                    <td className="py-3 px-4 text-text-secondary font-mono truncate max-w-xs" title={ch.webhookUrl}>
                      {maskWebhook(ch.webhookUrl)}
                    </td>
                    <td className="py-3 px-4 text-text-secondary whitespace-nowrap">
                      {new Date(ch.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          disabled={testingId === ch.id}
                          onClick={() => handleTestChannel(ch)}
                          className="px-2.5 py-1 text-xs border border-subtle bg-canvas hover:bg-subtle/30 text-text-primary rounded transition-colors disabled:opacity-50"
                        >
                          {testingId === ch.id ? 'Sending...' : 'Test'}
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(ch)}
                          className="px-2.5 py-1 text-xs border border-subtle bg-canvas hover:bg-subtle/30 text-text-primary rounded transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteChannel(ch)}
                          className="px-2.5 py-1 text-xs border border-status-down bg-status-down-bg text-status-down-text rounded transition-opacity hover:opacity-90 font-medium"
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
        </div>
      )}

      {/* Modal Dialog for Add / Edit Webhook */}
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
        className="backdrop:bg-black/60 bg-panel text-text-primary border border-subtle rounded-md shadow-2xl p-0 w-full max-w-md open:flex open:flex-col m-auto overflow-hidden"
        aria-labelledby="channel-dialog-title"
      >
        <header className="p-4 sm:p-5 border-b border-subtle flex items-center justify-between">
          <div>
            <h2 id="channel-dialog-title" className="text-base font-semibold text-text-primary">
              {editingChannel ? 'Edit Discord Channel' : 'Add Discord Webhook'}
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Paste the webhook URL copied from Discord channel settings
            </p>
          </div>
          <button
            type="button"
            onClick={closeModal}
            className="text-text-secondary hover:text-text-primary p-1 rounded hover:bg-subtle/30 text-lg leading-none"
            aria-label="Close dialog"
          >
            &times;
          </button>
        </header>

        <form onSubmit={handleSaveChannel} className="p-4 sm:p-5 flex flex-col gap-4">
          {modalError && (
            <div
              role="alert"
              className="p-3 text-xs rounded border border-status-down bg-status-down-bg text-status-down-text"
            >
              {modalError}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="ch-name" className="text-xs font-medium text-text-secondary">
              Channel Label <span className="text-status-down">*</span>
            </label>
            <input
              id="ch-name"
              type="text"
              required
              value={channelName}
              onChange={(e) => setChannelName(e.target.value)}
              placeholder="e.g. #ops-incidents"
              className="w-full bg-canvas border border-subtle rounded px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-amber-brand"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="ch-url" className="text-xs font-medium text-text-secondary">
              Discord Webhook URL <span className="text-status-down">*</span>
            </label>
            <input
              id="ch-url"
              type="url"
              required
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://discord.com/api/webhooks/..."
              className="w-full bg-canvas border border-subtle rounded px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-amber-brand"
            />
          </div>

          <footer className="pt-4 border-t border-subtle flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={closeModal}
              disabled={isSubmitting}
              className="border border-subtle bg-canvas hover:bg-subtle/30 text-text-secondary px-3.5 py-2 text-xs rounded transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="border border-amber-brand bg-amber-brand text-amber-text px-4 py-2 text-xs font-medium rounded transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : editingChannel ? 'Update Webhook' : 'Save Webhook'}
            </button>
          </footer>
        </form>
      </dialog>
    </div>
  );
}
