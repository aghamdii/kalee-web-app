'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { sendBulkNotification } from '../../actions/admin-actions';

export default function NotificationsPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [language, setLanguage] = useState('');
  const [isPremium, setIsPremium] = useState<string>('');
  const [hasNotifications, setHasNotifications] = useState(true);
  const [sending, setSending] = useState(false);
  const [previewCount, setPreviewCount] = useState<{ matched: number; canSend: number } | null>(
    null
  );
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const buildFilters = () => {
    const filters: {
      language?: string;
      isPremium?: boolean;
      hasNotifications?: boolean;
    } = {};

    if (language) filters.language = language;
    if (isPremium === 'true') filters.isPremium = true;
    if (isPremium === 'false') filters.isPremium = false;
    if (hasNotifications) filters.hasNotifications = true;

    return filters;
  };

  const handlePreview = async () => {
    setSending(true);
    setResult(null);
    try {
      const filters = buildFilters();
      const response = await sendBulkNotification({
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
        setResult({ success: false, message: response.error || 'Failed to preview' });
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
      const response = await sendBulkNotification({
        title,
        body,
        filters,
        dryRun: false,
      });

      if (response.success) {
        setResult({
          success: true,
          message: `Successfully sent to ${response.sentCount} users (${response.matchedCount} matched filters)`,
        });
        setTitle('');
        setBody('');
        setPreviewCount(null);
      } else {
        setResult({ success: false, message: response.error || 'Failed to send' });
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subscription Status
              </label>
              <select
                value={isPremium}
                onChange={(e) => {
                  setIsPremium(e.target.value);
                  setPreviewCount(null);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">All Users</option>
                <option value="true">Premium Only</option>
                <option value="false">Free Users Only</option>
              </select>
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
    </div>
  );
}
