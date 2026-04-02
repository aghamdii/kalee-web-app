'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { listPromoCodes, generatePromoCode, reservePromoCode, unreservePromoCode } from '../../actions/admin-actions';

interface PromoCode {
  id: string;
  code: string;
  type: string;
  status: string;
  entitlementId: string | null;
  durationDays: number | null;
  offeringId: string | null;
  affiliateId: string | null;
  note: string | null;
  usedCount: number;
  maxUses: number;
  createdByEmail: string;
  createdAt: string | null;
  expiresAt: string | null;
  reservedFor: string | null;
  reservedBy: string | null;
}

export default function PromoCodesPage() {
  const router = useRouter();
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [reservingCode, setReservingCode] = useState<string | null>(null);
  const [reserveInput, setReserveInput] = useState('');
  const [processingReserve, setProcessingReserve] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Create form state
  const [createType, setCreateType] = useState<'single_use' | 'discount'>('single_use');
  const [createCustomCode, setCreateCustomCode] = useState('');
  const [createOfferingId, setCreateOfferingId] = useState('discounted_paywall_v1');
  const [createMaxUses, setCreateMaxUses] = useState<string>('100');
  const [createUnlimited, setCreateUnlimited] = useState(false);
  const [createAffiliateId, setCreateAffiliateId] = useState('');
  const [createNote, setCreateNote] = useState('');
  const [createExpiresAt, setCreateExpiresAt] = useState('');

  const loadPromoCodes = async () => {
    setLoading(true);
    try {
      const result = await listPromoCodes({
        pageSize: 50,
        status: statusFilter || null,
        type: typeFilter || null,
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

  const handleGenerateGiftCode = async () => {
    setGenerating(true);
    try {
      const result = await generatePromoCode({
        type: 'single_use',
        entitlementId: 'Pro',
        durationDays: 365,
      });

      if (result.success && result.code) {
        await navigator.clipboard.writeText(result.code);
        setCopiedCode(result.code);
        setTimeout(() => setCopiedCode(null), 3000);
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

  const handleCreateDiscountCode = async () => {
    if (!createCustomCode.trim()) {
      alert('Code is required for discount codes');
      return;
    }
    if (!createOfferingId.trim()) {
      alert('Offering ID is required');
      return;
    }
    if (!createUnlimited && (!createMaxUses || parseInt(createMaxUses) < 1)) {
      alert('Max uses must be at least 1');
      return;
    }

    setGenerating(true);
    try {
      const result = await generatePromoCode({
        type: 'discount',
        customCode: createCustomCode.trim(),
        offeringId: createOfferingId.trim(),
        maxUses: createUnlimited ? -1 : parseInt(createMaxUses),
        affiliateId: createAffiliateId.trim() || undefined,
        note: createNote.trim() || undefined,
        expiresAt: createExpiresAt || null,
      });

      if (result.success && result.code) {
        await navigator.clipboard.writeText(result.code);
        setCopiedCode(result.code);
        setTimeout(() => setCopiedCode(null), 3000);
        setShowCreateModal(false);
        resetCreateForm();
        loadPromoCodes();
      } else {
        alert(`Failed to create code: ${result.error}`);
      }
    } catch (error) {
      console.error('Error creating discount code:', error);
      alert('Failed to create discount code');
    } finally {
      setGenerating(false);
    }
  };

  const resetCreateForm = () => {
    setCreateType('single_use');
    setCreateCustomCode('');
    setCreateOfferingId('discounted_paywall_v1');
    setCreateMaxUses('100');
    setCreateUnlimited(false);
    setCreateAffiliateId('');
    setCreateNote('');
    setCreateExpiresAt('');
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
  }, [statusFilter, typeFilter]);

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

  const getTypeLabel = (type: string) => {
    return type === 'discount' ? 'Discount' : 'Gift';
  };

  const getTypeColor = (type: string) => {
    return type === 'discount'
      ? 'bg-purple-100 text-purple-800'
      : 'bg-blue-100 text-blue-800';
  };

  const formatUsage = (usedCount: number, maxUses: number) => {
    return `${usedCount} / ${maxUses === -1 ? 'unlimited' : maxUses}`;
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

        <div className="flex gap-3 w-full sm:w-auto">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">All Types</option>
            <option value="single_use">Gift Codes</option>
            <option value="discount">Discount Codes</option>
          </select>

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
            onClick={handleGenerateGiftCode}
            disabled={generating}
            variant="outline"
            className="border-green-600 text-green-600 hover:bg-green-50"
          >
            {generating ? 'Generating...' : 'Gift Code'}
          </Button>

          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-purple-600 hover:bg-purple-700"
          >
            Discount Code
          </Button>
        </div>
      </div>

      {copiedCode && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-green-800 font-medium">Code created and copied:</span>
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
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Affiliate / Note
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expires
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
                      No promo codes found.
                    </td>
                  </tr>
                ) : (
                  promoCodes.map((promo) => (
                    <tr key={promo.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-mono font-medium text-gray-900">
                        {promo.code}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(promo.type)}`}
                        >
                          {getTypeLabel(promo.type)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex flex-col gap-1">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium w-fit ${getStatusColor(promo.status)}`}
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
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatUsage(promo.usedCount, promo.maxUses)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-[200px] truncate">
                        {promo.note || promo.affiliateId || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(promo.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(promo.expiresAt)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(promo.code)}
                            className="text-green-600 hover:text-green-700"
                          >
                            {copiedCode === promo.code ? 'Copied!' : 'Copy'}
                          </Button>
                          {promo.type === 'discount' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/admin_portal/dashboard/promo-codes/${promo.code}`)}
                              className="text-purple-600 hover:text-purple-700"
                            >
                              View
                            </Button>
                          )}
                          {promo.type === 'single_use' && promo.status === 'active' && (
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

      {/* Create Discount Code Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => { setShowCreateModal(false); resetCreateForm(); }} />
          <div className="relative bg-white rounded-lg shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Create Discount Code</h3>

            <div className="space-y-4">
              {/* Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={createCustomCode}
                  onChange={(e) => setCreateCustomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ''))}
                  placeholder="e.g., AHMED20"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-1">Letters, numbers, and underscores only</p>
              </div>

              {/* Offering ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Offering ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={createOfferingId}
                  onChange={(e) => setCreateOfferingId(e.target.value)}
                  placeholder="discounted_paywall_v1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Max Uses */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Uses <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={createUnlimited ? '' : createMaxUses}
                    onChange={(e) => setCreateMaxUses(e.target.value)}
                    disabled={createUnlimited}
                    min="1"
                    placeholder="100"
                    className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                  />
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={createUnlimited}
                      onChange={(e) => setCreateUnlimited(e.target.checked)}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    Unlimited
                  </label>
                </div>
              </div>

              {/* Affiliate ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Affiliate ID</label>
                <input
                  type="text"
                  value={createAffiliateId}
                  onChange={(e) => setCreateAffiliateId(e.target.value)}
                  placeholder="Optional"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Note */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
                <input
                  type="text"
                  value={createNote}
                  onChange={(e) => setCreateNote(e.target.value)}
                  placeholder="e.g., Ahmed - YouTube, March 2026"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Expires At */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expires At</label>
                <input
                  type="date"
                  value={createExpiresAt}
                  onChange={(e) => setCreateExpiresAt(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty for no expiration</p>
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <Button
                variant="outline"
                onClick={() => { setShowCreateModal(false); resetCreateForm(); }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateDiscountCode}
                disabled={generating || !createCustomCode.trim() || !createOfferingId.trim()}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {generating ? 'Creating...' : 'Create Code'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
