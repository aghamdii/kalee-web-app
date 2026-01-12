'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { listFeedback, updateFeedbackStatus } from '../../actions/admin-actions';

interface Feedback {
  id: string;
  userId: string;
  userEmail: string | null;
  category: string;
  message: string;
  platform: string;
  appVersion: string;
  status: string;
  createdAt: string | null;
}

export default function FeedbackPage() {
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadFeedback = async () => {
    setLoading(true);
    try {
      const result = await listFeedback({
        pageSize: 100,
        status: statusFilter || null,
      });

      if (result.error) {
        console.error('Error:', result.error);
        return;
      }

      setFeedbackList(result.feedback);
    } catch (error) {
      console.error('Error loading feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeedback();
  }, [statusFilter]);

  const handleStatusChange = async (feedbackId: string, newStatus: 'new' | 'in_progress' | 'resolved') => {
    setUpdatingId(feedbackId);
    try {
      const result = await updateFeedbackStatus(feedbackId, newStatus);
      if (result.success) {
        loadFeedback();
      } else {
        alert(`Failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-red-100 text-red-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'bug':
        return 'bg-red-100 text-red-800';
      case 'feature':
        return 'bg-blue-100 text-blue-800';
      case 'feedback':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const stats = {
    total: feedbackList.length,
    new: feedbackList.filter((f) => f.status === 'new').length,
    inProgress: feedbackList.filter((f) => f.status === 'in_progress').length,
    resolved: feedbackList.filter((f) => f.status === 'resolved').length,
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-900">User Feedback</h2>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
        >
          <option value="">All Status</option>
          <option value="new">New</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Total</div>
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">New</div>
          <div className="text-2xl font-bold text-red-600">{stats.new}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">In Progress</div>
          <div className="text-2xl font-bold text-yellow-600">{stats.inProgress}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Resolved</div>
          <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      ) : feedbackList.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          No feedback found
        </div>
      ) : (
        <div className="space-y-4">
          {feedbackList.map((feedback) => (
            <div key={feedback.id} className="bg-white rounded-lg shadow overflow-hidden">
              <div
                className="p-4 cursor-pointer hover:bg-gray-50"
                onClick={() => setExpandedId(expandedId === feedback.id ? null : feedback.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          feedback.status
                        )}`}
                      >
                        {feedback.status.replace('_', ' ')}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(
                          feedback.category
                        )}`}
                      >
                        {feedback.category}
                      </span>
                      <span className="text-xs text-gray-500">
                        {feedback.platform} v{feedback.appVersion}
                      </span>
                    </div>
                    <p className="text-gray-900 line-clamp-2">{feedback.message}</p>
                    <div className="text-sm text-gray-500 mt-2">
                      {feedback.userEmail || feedback.userId} - {formatDate(feedback.createdAt)}
                    </div>
                  </div>
                  <div className="ml-4 text-gray-400">
                    {expandedId === feedback.id ? '▲' : '▼'}
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedId === feedback.id && (
                <div className="px-4 pb-4 border-t bg-gray-50">
                  <div className="pt-4">
                    <div className="text-sm font-medium text-gray-700 mb-2">Full Message:</div>
                    <div className="bg-white p-4 rounded border text-gray-900 whitespace-pre-wrap">
                      {feedback.message}
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                      <span className="text-sm text-gray-500">Change status:</span>
                      {(['new', 'in_progress', 'resolved'] as const).map((status) => (
                        <Button
                          key={status}
                          variant={feedback.status === status ? 'default' : 'outline'}
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusChange(feedback.id, status);
                          }}
                          disabled={updatingId === feedback.id || feedback.status === status}
                          className={
                            feedback.status === status ? 'bg-green-600 hover:bg-green-700' : ''
                          }
                        >
                          {status.replace('_', ' ')}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
