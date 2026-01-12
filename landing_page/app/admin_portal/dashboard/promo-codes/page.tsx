'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { listPromoCodes, generatePromoCode, reservePromoCode, unreservePromoCode } from '../../actions/admin-actions';

interface PromoCode {
  id: string;
  code: string;
  status: string;
  entitlementId: string;
  durationDays: number;
  usedCount: number;
  maxUses: number;
  createdByEmail: string;
  createdAt: string | null;
  expiresAt: string | null;
  reservedFor: string | null;
  reservedBy: string | null;
}

export default function PromoCodesPage() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [reservingCode, setReservingCode] = useState<string | null>(null);
  const [reserveInput, setReserveInput] = useState('');
  const [processingReserve, setProcessingReserve] = useState(false);

  const loadPromoCodes = async () => {
    setLoading(true);
    try {
      const result = await listPromoCodes({
        pageSize: 50,
        status: statusFilter || null,
      });

      if (result.error) {
        console.error('Error:', result.error);
        return;
      }

      setPromoCodes(result.promoCodes);
    } catch (error) {
      console.error('Error loading promo codes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCode = async () => {
    setGenerating(true);
    try {
      const result = await generatePromoCode({
        entitlementId: 'Pro',
        durationDays: 365,
      });

      if (result.success && result.code) {
        // Copy to clipboard
        await navigator.clipboard.writeText(result.code);
        setCopiedCode(result.code);
        setTimeout(() => setCopiedCode(null), 3000);

        // Reload the list
        loadPromoCodes();
      } else {
        alert(`Failed to generate code: ${result.error}`);
      }
    } catch (error) {
      console.error('Error generating promo code:', error);
      alert('Failed to generate promo code');
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleReserve = async () => {
    if (!reservingCode || !reserveInput.trim()) return;
    setProcessingReserve(true);
    try {
      const result = await reservePromoCode({
        code: reservingCode,
        reservedFor: reserveInput.trim(),
      });
      if (result.success) {
        setReservingCode(null);
        setReserveInput('');
        loadPromoCodes();
      } else {
        alert(`Failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Error reserving code:', error);
      alert('Failed to reserve code');
    } finally {
      setProcessingReserve(false);
    }
  };

  const handleUnreserve = async (code: string) => {
    if (!confirm('Remove reservation from this code?')) return;
    try {
      const result = await unreservePromoCode(code);
      if (result.success) {
        loadPromoCodes();
      } else {
        alert(`Failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Error unreserving code:', error);
      alert('Failed to unreserve code');
    }
  };

  useEffect(() => {
    loadPromoCodes();
  }, [statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'reserved':
        return 'bg-yellow-100 text-yellow-800';
      case 'used':
        return 'bg-gray-100 text-gray-600';
      case 'expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Promo Codes</h2>

        <div className="flex gap-4 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="reserved">Reserved</option>
            <option value="used">Used</option>
            <option value="expired">Expired</option>
          </select>

          <Button
            onClick={handleGenerateCode}
            disabled={generating}
            className="bg-green-600 hover:bg-green-700"
          >
            {generating ? 'Generating...' : 'Generate Code'}
          </Button>
        </div>
      </div>

      {copiedCode && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-green-800 font-medium">Code generated and copied:</span>
            <code className="bg-green-100 px-2 py-1 rounded font-mono">{copiedCode}</code>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Entitlement
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Uses
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {promoCodes.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                      No promo codes found. Generate one to get started.
                    </td>
                  </tr>
                ) : (
                  promoCodes.map((promo) => (
                    <tr key={promo.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-mono font-medium text-gray-900">
                        {promo.code}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex flex-col gap-1">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium w-fit ${getStatusColor(
                              promo.status
                            )}`}
                          >
                            {promo.status}
                          </span>
                          {promo.reservedFor && (
                            <span className="text-xs text-gray-500">
                              For: {promo.reservedFor}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{promo.entitlementId}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{promo.durationDays} days</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {promo.usedCount} / {promo.maxUses}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{promo.createdByEmail}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(promo.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(promo.code)}
                            disabled={promo.status === 'used' || promo.status === 'expired'}
                            className="text-green-600 hover:text-green-700"
                          >
                            {copiedCode === promo.code ? 'Copied!' : 'Copy'}
                          </Button>
                          {promo.status === 'active' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setReservingCode(promo.code)}
                              className="text-yellow-600 hover:text-yellow-700"
                            >
                              Reserve
                            </Button>
                          )}
                          {promo.status === 'reserved' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUnreserve(promo.code)}
                              className="text-gray-600 hover:text-gray-700"
                            >
                              Unreserve
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reserve Modal */}
      {reservingCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setReservingCode(null)} />
          <div className="relative bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Reserve Code</h3>
            <p className="text-sm text-gray-600 mb-4">
              Reserving code: <span className="font-mono font-medium">{reservingCode}</span>
            </p>
            <input
              type="text"
              value={reserveInput}
              onChange={(e) => setReserveInput(e.target.value)}
              placeholder="Who is this for? (e.g., name or email)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 mb-4"
              autoFocus
            />
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setReservingCode(null);
                  setReserveInput('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleReserve}
                disabled={!reserveInput.trim() || processingReserve}
                className="bg-yellow-600 hover:bg-yellow-700"
              >
                {processingReserve ? 'Reserving...' : 'Reserve'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
