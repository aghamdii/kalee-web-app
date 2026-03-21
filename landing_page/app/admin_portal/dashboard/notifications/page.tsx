'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { functions } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { listNotificationHistory } from '../../actions/admin-actions';

interface BulkNotificationResponse {
  success: boolean;
  matchedCount?: number;
  sentCount?: number;
  failedCount?: number;
  durationMs?: number;
}

interface NotificationRecord {
  id: string;
  title: string;
  body: string;
  language: string | null;
  isPremium: string | null;
  matchedCount: number;
  sentCount: number;
  failedCount: number;
  staleTokensCleaned: number;
  durationMs: number | null;
  adminEmail: string;
  timestamp: string | null;
}

const LANGUAGE_LABELS: Record<string, string> = {
  ar: 'Arabic',
  en: 'English',
  ja: 'Japanese',
  ko: 'Korean',
};

type SubscriptionStatus = 'pro' | 'trial' | 'expired' | 'free';

const SUB_STATUS_OPTIONS: { key: SubscriptionStatus; label: string; color: string }[] = [
  { key: 'pro', label: 'Pro', color: 'bg-green-100 text-green-800 border-green-300' },
  { key: 'trial', label: 'Trial', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  { key: 'expired', label: 'Expired', color: 'bg-red-100 text-red-800 border-red-300' },
  { key: 'free', label: 'Free', color: 'bg-gray-100 text-gray-700 border-gray-300' },
];

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = (ms / 1000).toFixed(1);
  return `${seconds}s`;
}

function formatDate(isoString: string | null): string {
  if (!isoString) return 'Unknown';
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function NotificationsPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [language, setLanguage] = useState('');
  const [subscriptionStatuses, setSubscriptionStatuses] = useState<SubscriptionStatus[]>([]);
  const [hasNotifications, setHasNotifications] = useState(true);
  const [sending, setSending] = useState(false);
  const [previewCount, setPreviewCount] = useState<{ matched: number; canSend: number } | null>(
    null
  );
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [history, setHistory] = useState<NotificationRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await listNotificationHistory({ pageSize: 20 });
      if (!res.error) {
        setHistory(res.notifications);
      }
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const toggleSubStatus = (status: SubscriptionStatus) => {
    setSubscriptionStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
    setPreviewCount(null);
  };

  const buildFilters = () => {
    const filters: {
      language?: string;
      subscriptionStatuses?: SubscriptionStatus[];
      hasNotifications?: boolean;
    } = {};

    if (language) filters.language = language;
    if (subscriptionStatuses.length > 0) filters.subscriptionStatuses = subscriptionStatuses;
    if (hasNotifications) filters.hasNotifications = true;

    return filters;
  };

  const callBulkNotification = async (data: {
    title: string;
    body: string;
    filters: ReturnType<typeof buildFilters>;
    dryRun: boolean;
  }): Promise<BulkNotificationResponse> => {
    if (!functions) {
      throw new Error('Firebase not initialized');
    }
    const fn = httpsCallable<typeof data, BulkNotificationResponse>(
      functions,
      'sendBulkNotificationFunction'
    );
    const result = await fn(data);
    return result.data;
  };

  const handlePreview = async () => {
    setSending(true);
    setResult(null);
    try {
      const filters = buildFilters();
      const response = await callBulkNotification({
        title: 'Preview',
        body: 'Preview',
        filters,
        dryRun: true,
      });

      if (response.success) {
        setPreviewCount({
          matched: response.matchedCount || 0,
          canSend: response.sentCount || 0,
        });
      } else {
        setResult({ success: false, message: 'Failed to preview' });
      }
    } catch (error) {
      console.error('Error previewing:', error);
      setResult({ success: false, message: 'Failed to preview' });
    } finally {
      setSending(false);
    }
  };

  const handleSend = async () => {
    if (!title || !body) {
      alert('Please enter a title and message');
      return;
    }

    if (
      !confirm(
        `Are you sure you want to send this notification to ${previewCount?.canSend || 'unknown'} users?`
      )
    ) {
      return;
    }

    setSending(true);
    setResult(null);
    try {
      const filters = buildFilters();
      const response = await callBulkNotification({
        title,
        body,
        filters,
        dryRun: false,
      });

      if (response.success) {
        const durationMsg = response.durationMs
          ? ` in ${formatDuration(response.durationMs)}`
          : '';
        const failedMsg = response.failedCount
          ? ` (${response.failedCount} failed, stale tokens cleaned)`
          : '';
        setResult({
          success: true,
          message: `Successfully sent to ${response.sentCount} users (${response.matchedCount} matched filters)${failedMsg}${durationMsg}`,
        });
        setTitle('');
        setBody('');
        setPreviewCount(null);
        loadHistory();
      } else {
        setResult({ success: false, message: 'Failed to send' });
      }
    } catch (error) {
      console.error('Error sending:', error);
      setResult({ success: false, message: 'Failed to send notifications' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Bulk Notifications</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Target Audience</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
              <select
                value={language}
                onChange={(e) => {
                  setLanguage(e.target.value);
                  setPreviewCount(null);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">All Languages</option>
                <option value="ar">Arabic (ar)</option>
                <option value="en">English (en)</option>
                <option value="ja">Japanese (ja)</option>
                <option value="ko">Korean (ko)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subscription Status
              </label>
              <div className="flex flex-wrap gap-2">
                {SUB_STATUS_OPTIONS.map((opt) => {
                  const isSelected = subscriptionStatuses.includes(opt.key);
                  return (
                    <button
                      key={opt.key}
                      onClick={() => toggleSubStatus(opt.key)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                        isSelected
                          ? `${opt.color} ring-2 ring-offset-1 ring-green-500`
                          : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
              {subscriptionStatuses.length === 0 && (
                <p className="text-xs text-gray-400 mt-1">No filter — sends to all users</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="hasNotifications"
                checked={hasNotifications}
                onChange={(e) => {
                  setHasNotifications(e.target.checked);
                  setPreviewCount(null);
                }}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label htmlFor="hasNotifications" className="text-sm text-gray-700">
                Only users with notifications enabled
              </label>
            </div>

            <Button
              onClick={handlePreview}
              disabled={sending}
              variant="outline"
              className="w-full"
            >
              {sending ? 'Loading...' : 'Preview Audience'}
            </Button>

            {previewCount && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-sm text-blue-800">
                  <div>
                    <span className="font-medium">{previewCount.matched}</span> users match filters
                  </div>
                  <div>
                    <span className="font-medium">{previewCount.canSend}</span> have notifications
                    enabled and can receive
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Notification Content */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Content</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Notification title"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Notification message"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Preview */}
            {(title || body) && (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="text-xs text-gray-500 mb-2">Preview</div>
                <div className="font-medium">{title || 'Title'}</div>
                <div className="text-sm text-gray-600">{body || 'Message'}</div>
              </div>
            )}

            <Button
              onClick={handleSend}
              disabled={sending || !title || !body || !previewCount}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {sending ? 'Sending...' : `Send to ${previewCount?.canSend || 0} Users`}
            </Button>

            {!previewCount && (
              <p className="text-sm text-gray-500 text-center">
                Click &quot;Preview Audience&quot; first to see how many users will receive this
                notification
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Result Message */}
      {result && (
        <div
          className={`mt-6 p-4 rounded-lg ${
            result.success
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          {result.message}
        </div>
      )}

      {/* Notification History */}
      <div className="mt-10">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Notification History</h3>

        {historyLoading ? (
          <div className="text-sm text-gray-500">Loading history...</div>
        ) : history.length === 0 ? (
          <div className="text-sm text-gray-500">No notifications sent yet.</div>
        ) : (
          <div className="space-y-4">
            {history.map((entry) => (
              <div key={entry.id} className="bg-white rounded-lg shadow p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-semibold text-gray-900">{entry.title}</div>
                    <div className="text-sm text-gray-600 mt-1">{entry.body}</div>
                  </div>
                  <div className="text-xs text-gray-400 whitespace-nowrap ml-4">
                    {formatDate(entry.timestamp)}
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {entry.language && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {LANGUAGE_LABELS[entry.language] || entry.language}
                    </span>
                  )}
                  {entry.isPremium && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {entry.isPremium}
                    </span>
                  )}
                  {!entry.language && !entry.isPremium && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      All Users
                    </span>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div className="bg-gray-50 rounded-md px-3 py-2">
                    <div className="text-gray-500 text-xs">Matched</div>
                    <div className="font-semibold text-gray-900">{entry.matchedCount}</div>
                  </div>
                  <div className="bg-green-50 rounded-md px-3 py-2">
                    <div className="text-green-600 text-xs">Sent</div>
                    <div className="font-semibold text-green-700">{entry.sentCount}</div>
                  </div>
                  <div className="bg-red-50 rounded-md px-3 py-2">
                    <div className="text-red-500 text-xs">Failed</div>
                    <div className="font-semibold text-red-700">{entry.failedCount}</div>
                  </div>
                  <div className="bg-orange-50 rounded-md px-3 py-2">
                    <div className="text-orange-500 text-xs">Tokens Cleaned</div>
                    <div className="font-semibold text-orange-700">{entry.staleTokensCleaned}</div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
                  <span>By {entry.adminEmail}</span>
                  {entry.durationMs && (
                    <span>Completed in {formatDuration(entry.durationMs)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
