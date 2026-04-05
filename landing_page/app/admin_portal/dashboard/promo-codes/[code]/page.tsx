'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { listDiscountTransactions } from '../../../actions/admin-actions';

interface Transaction {
  id: string;
  promoCode: string;
  rcAppUserId: string;
  firebaseUserId: string;
  planType: string;
  price: number;
  currency: string;
  platform: string;
  status: string;
  initialStatus: string;
  trialStartedAt: string | null;
  convertedAt: string | null;
  createdAt: string | null;
}

interface Summary {
  totalUsers: number;
  trialActive: number;
  convertedPaid: number;
  monthlyPaid: number;
  totalRevenue: Record<string, number>;
}

export default function PromoCodeDetailPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<Summary>({
    totalUsers: 0,
    trialActive: 0,
    convertedPaid: 0,
    monthlyPaid: 0,
    totalRevenue: {},
  });
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [lastDocId, setLastDocId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [planTypeFilter, setPlanTypeFilter] = useState('');
  const [platformFilter, setPlatformFilter] = useState('');

  const decodedCode = decodeURIComponent(code);

  const loadTransactions = async (append = false) => {
    if (!append) setLoading(true);
    try {
      const result = await listDiscountTransactions({
        promoCode: decodedCode,
        pageSize: 20,
        lastDocId: append ? lastDocId : null,
        statusFilter: statusFilter || null,
        planTypeFilter: planTypeFilter || null,
        platformFilter: platformFilter || null,
      });

      if (result.error) {
        console.error('Error:', result.error);
        return;
      }

      if (append) {
        setTransactions((prev) => [...prev, ...result.transactions]);
      } else {
        setTransactions(result.transactions);
        setSummary(result.summary);
      }

      setHasMore(result.hasMore);
      if (result.transactions.length > 0) {
        setLastDocId(result.transactions[result.transactions.length - 1].id);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLastDocId(null);
    loadTransactions();
  }, [statusFilter, planTypeFilter, platformFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'trial':
        return 'bg-yellow-100 text-yellow-800';
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'refunded':
        return 'bg-red-100 text-red-800';
      case 'trial_expired':
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusLabel = (status: string, convertedAt: string | null) => {
    switch (status) {
      case 'trial':
        return 'Trial Active';
      case 'paid':
        if (convertedAt) {
          return `Converted (${formatShortDate(convertedAt)})`;
        }
        return 'Paid';
      case 'refunded':
        return 'Refunded';
      case 'trial_expired':
        return 'Trial Expired';
      default:
        return status;
    }
  };

  const formatShortDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const formatRelativeTime = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 30) return `${diffDays} days ago`;
    if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months > 1 ? 's' : ''} ago`;
    }
    const years = Math.floor(diffDays / 365);
    return `${years} year${years > 1 ? 's' : ''} ago`;
  };

  const formatFullDate = (dateString: string | null) => {
    if (!dateString) return '-';
    // Display in UTC+3
    return new Date(dateString).toLocaleString('en-US', {
      timeZone: 'Asia/Riyadh',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatRevenue = (revenue: Record<string, number>) => {
    const entries = Object.entries(revenue);
    if (entries.length === 0) return '0';
    return entries
      .map(([currency, amount]) => `${amount.toLocaleString()} ${currency}`)
      .join(' + ');
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/admin_portal/dashboard/promo-codes')}
          className="text-sm text-gray-500 hover:text-gray-700 mb-2 flex items-center gap-1"
        >
          &larr; Back to Promo Codes
        </button>
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-gray-900 font-mono">{decodedCode}</h2>
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            Discount
          </span>
        </div>
      </div>

      {loading && transactions.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      ) : (
        <>
          {/* Summary Bar */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-500">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{summary.totalUsers}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-500">Trial Active</p>
              <p className="text-2xl font-bold text-yellow-600">{summary.trialActive}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-500">Converted (Paid)</p>
              <p className="text-2xl font-bold text-green-600">{summary.convertedPaid}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-500">Monthly Paid</p>
              <p className="text-2xl font-bold text-blue-600">{summary.monthlyPaid}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 col-span-2 md:col-span-1">
              <p className="text-sm text-gray-500">Est. Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatRevenue(summary.totalRevenue)}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-3 mb-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">All Statuses</option>
              <option value="trial">Trial</option>
              <option value="paid">Paid</option>
              <option value="refunded">Refunded</option>
              <option value="trial_expired">Trial Expired</option>
            </select>

            <select
              value={planTypeFilter}
              onChange={(e) => setPlanTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">All Plans</option>
              <option value="annual">Annual</option>
              <option value="monthly">Monthly</option>
            </select>

            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">All Platforms</option>
              <option value="ios">iOS</option>
              <option value="android">Android</option>
            </select>
          </div>

          {/* Transactions Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Plan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Initial
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Current Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Platform
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                        No transactions found for this promo code.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((txn) => (
                      <tr key={txn.id} className="hover:bg-gray-50">
                        <td
                          className="px-6 py-4 text-sm font-mono text-gray-700 cursor-pointer hover:text-gray-900 break-all max-w-[280px]"
                          title="Click to copy"
                          onClick={() => copyToClipboard(txn.firebaseUserId || txn.rcAppUserId)}
                        >
                          {txn.firebaseUserId || txn.rcAppUserId}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 capitalize">
                          {txn.planType}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 capitalize">
                          {txn.initialStatus}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(txn.status)}`}
                          >
                            {getStatusLabel(txn.status, txn.convertedAt)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {txn.price.toFixed(2)} {txn.currency}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 uppercase">
                          {txn.platform}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500" title={formatFullDate(txn.createdAt)}>
                          {formatRelativeTime(txn.createdAt)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="flex justify-center mt-4">
              <Button
                variant="outline"
                onClick={() => loadTransactions(true)}
              >
                Load More
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
