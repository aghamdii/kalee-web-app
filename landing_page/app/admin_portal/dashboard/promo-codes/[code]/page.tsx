'use client';

import React, { useState, useEffect, useMemo, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  listAffiliateTransactions,
  listEventsByDiscountCode,
  listPayouts,
  bulkSettleAffiliateTransactions,
  markPayoutAsPaid,
  getPayoutDetails,
  type AffiliateTransactionRow,
  type AffiliateTransactionsSummary,
  type PayoutRow,
} from '../../../actions/admin-actions';

const REFUND_WINDOW_DAYS = 45;

function settlementState(txn: AffiliateTransactionRow): string {
  if (txn.payoutId) return txn.isClawback ? 'clawback' : 'settled';
  if (txn.isRefunded) return 'refunded';
  if (!txn.isPaidTransaction) return 'not_eligible';
  const purchased = txn.purchasedAt ? new Date(txn.purchasedAt) : null;
  if (!purchased) return 'not_eligible';
  const ageDays = (Date.now() - purchased.getTime()) / (1000 * 60 * 60 * 24);
  if (ageDays < REFUND_WINDOW_DAYS) return 'in_window';
  return 'ready';
}

interface RcEvent {
  id: string;
  type: string;
  appUserId: string;
  productId: string | null;
  store: string | null;
  periodType: string | null;
  presentedOfferingId: string | null;
  price: number | null;
  priceInPurchasedCurrency: number | null;
  currency: string | null;
  isTrialConversion: boolean | null;
  eventTimestampMs: number | null;
  expirationAtMs: number | null;
  discountCode: string | null;
  transactionId: string | null;
}

type Tab = 'transactions' | 'events' | 'payouts';

const EMPTY_SUMMARY: AffiliateTransactionsSummary = {
  totalCharges: 0,
  trialsActive: 0,
  convertedPaid: 0,
  initialPaid: 0,
  renewals: 0,
  lifetimeRevenueUsd: 0,
  lifetimeRevenueByCurrency: {},
  readyToSettleUsd: 0,
  settledUsd: 0,
  clawbackUsd: 0,
  clawbackCount: 0,
  refundedUsd: 0,
};

export default function PromoCodeDetailPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const router = useRouter();
  const decodedCode = decodeURIComponent(code);

  // --- Tabs ---
  const [activeTab, setActiveTab] = useState<Tab>('transactions');

  // --- Transactions state ---
  const [transactions, setTransactions] = useState<AffiliateTransactionRow[]>([]);
  const [summary, setSummary] = useState<AffiliateTransactionsSummary>(EMPTY_SUMMARY);
  const [txnLoading, setTxnLoading] = useState(true);
  const [expandedTxnId, setExpandedTxnId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // --- Filters ---
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [settlementFilter, setSettlementFilter] = useState('');
  const [planTypeFilter, setPlanTypeFilter] = useState('');
  const [platformFilter, setPlatformFilter] = useState('');
  const [discountedOnly, setDiscountedOnly] = useState(false);

  // --- Events tab state ---
  const [events, setEvents] = useState<RcEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  // --- Payouts tab state ---
  const [payouts, setPayouts] = useState<PayoutRow[]>([]);
  const [payoutsLoading, setPayoutsLoading] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState<PayoutRow | null>(null);
  const [selectedPayoutTxns, setSelectedPayoutTxns] = useState<AffiliateTransactionRow[]>([]);
  const [payoutDetailLoading, setPayoutDetailLoading] = useState(false);

  // --- Settle modal ---
  const [settleModalOpen, setSettleModalOpen] = useState(false);
  const [commissionRate, setCommissionRate] = useState('0.20');
  const [settleNote, setSettleNote] = useState('');
  const [settling, setSettling] = useState(false);

  // --- Load transactions ---
  const loadTransactions = async () => {
    setTxnLoading(true);
    try {
      const result = await listAffiliateTransactions({
        promoCode: decodedCode,
        pageSize: 500,
        startDate: startDate || null,
        endDate: endDate || null,
        transactionType: typeFilter || null,
        settlementFilter: settlementFilter || null,
        planType: planTypeFilter || null,
        platform: platformFilter || null,
        discountedProductOnly: discountedOnly,
      });
      if (result.error) {
        console.error(result.error);
        return;
      }
      setTransactions(result.transactions);
      setSummary(result.summary);
    } catch (e) {
      console.error('Error loading affiliate transactions:', e);
    } finally {
      setTxnLoading(false);
    }
  };

  const loadEvents = async () => {
    setEventsLoading(true);
    try {
      const result = await listEventsByDiscountCode({ promoCode: decodedCode, pageSize: 200 });
      if (result.error) {
        console.error(result.error);
        return;
      }
      setEvents(result.events);
    } finally {
      setEventsLoading(false);
    }
  };

  const loadPayoutsList = async () => {
    setPayoutsLoading(true);
    try {
      const result = await listPayouts({ promoCode: decodedCode });
      if (result.error) {
        console.error(result.error);
        return;
      }
      setPayouts(result.payouts);
    } finally {
      setPayoutsLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, typeFilter, settlementFilter, planTypeFilter, platformFilter, discountedOnly]);

  useEffect(() => {
    if (activeTab === 'events' && events.length === 0 && !eventsLoading) loadEvents();
    if (activeTab === 'payouts' && payouts.length === 0 && !payoutsLoading) loadPayoutsList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // --- Selection totals ---
  const selectedTotals = useMemo(() => {
    let grossUsd = 0;
    const byCurrency: Record<string, number> = {};
    let inWindowCount = 0;
    for (const t of transactions) {
      if (!selectedIds.has(t.id)) continue;
      grossUsd += t.priceUsd;
      byCurrency[t.currency] = (byCurrency[t.currency] || 0) + t.price;
      if (settlementState(t) === 'in_window') inWindowCount++;
    }
    const rate = parseFloat(commissionRate) || 0;
    return {
      grossUsd,
      byCurrency,
      commissionUsd: grossUsd * rate,
      inWindowCount,
      count: selectedIds.size,
    };
  }, [selectedIds, transactions, commissionRate]);

  // Find affiliateId from first selected transaction (assumed uniform; warn if not)
  const selectedAffiliateId = useMemo(() => {
    for (const t of transactions) {
      if (selectedIds.has(t.id)) return t.affiliateId;
    }
    return null;
  }, [selectedIds, transactions]);

  // --- Row-level helpers ---
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllVisible = () => {
    const eligible = transactions.filter((t) => {
      const st = settlementState(t);
      return st === 'ready' || st === 'in_window';
    });
    const allSelected = eligible.every((t) => selectedIds.has(t.id));
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(eligible.map((t) => t.id)));
    }
  };

  const clearSelection = () => setSelectedIds(new Set());

  // --- Settle action ---
  const handleSettle = async () => {
    const rate = parseFloat(commissionRate);
    if (isNaN(rate) || rate < 0 || rate > 1) {
      alert('Commission rate must be between 0 and 1');
      return;
    }
    setSettling(true);
    try {
      const result = await bulkSettleAffiliateTransactions({
        transactionIds: Array.from(selectedIds),
        promoCode: decodedCode,
        affiliateId: selectedAffiliateId,
        commissionRate: rate,
        note: settleNote.trim() || undefined,
      });
      if (!result.success) {
        alert(`Failed: ${result.error}`);
        return;
      }
      setSettleModalOpen(false);
      setSettleNote('');
      clearSelection();
      await loadTransactions();
      // Invalidate payouts list so it reloads on next tab visit
      setPayouts([]);
    } catch (e) {
      console.error(e);
      alert('Failed to create payout');
    } finally {
      setSettling(false);
    }
  };

  const openPayoutDetails = async (payout: PayoutRow) => {
    setSelectedPayout(payout);
    setPayoutDetailLoading(true);
    try {
      const result = await getPayoutDetails(payout.id);
      if (result.error) {
        console.error(result.error);
        return;
      }
      setSelectedPayoutTxns(result.transactions);
    } finally {
      setPayoutDetailLoading(false);
    }
  };

  const handleMarkPaid = async (payoutId: string) => {
    if (!confirm('Mark this payout as paid?')) return;
    const note = prompt('Optional note (e.g., bank transfer ref):') || undefined;
    const result = await markPayoutAsPaid({ payoutId, note });
    if (!result.success) {
      alert(`Failed: ${result.error}`);
      return;
    }
    setSelectedPayout(null);
    setPayouts([]);
    await loadPayoutsList();
  };

  // --- Formatting ---
  const fmtUsd = (n: number) => `$${n.toFixed(2)}`;
  const fmtNum = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const fmtRevenueByCurrency = (rev: Record<string, number>) => {
    const entries = Object.entries(rev);
    if (entries.length === 0) return '—';
    return entries.map(([cur, amt]) => `${fmtNum(amt)} ${cur}`).join(' + ');
  };

  const formatShortDate = (d: string | null | undefined) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatFullDate = (d: string | null | undefined) => {
    if (!d) return '-';
    return new Date(d).toLocaleString('en-US', {
      timeZone: 'Asia/Riyadh',
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const formatRelativeTime = (d: string | null | undefined) => {
    if (!d) return '-';
    const date = new Date(d);
    const diffDays = Math.floor((Date.now() - date.getTime()) / 86400000);
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 30) return `${diffDays} days ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
    return `${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) > 1 ? 's' : ''} ago`;
  };

  const daysSince = (d: string | null) => {
    if (!d) return null;
    return Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  };

  // --- Styling helpers ---
  const getTxnTypeBadge = (type: string) => {
    switch (type) {
      case 'initial_purchase': return { label: 'Initial', cls: 'bg-blue-100 text-blue-800' };
      case 'renewal': return { label: 'Renewal', cls: 'bg-green-100 text-green-800' };
      case 'trial_conversion': return { label: 'Trial→Paid', cls: 'bg-emerald-100 text-emerald-800' };
      case 'product_change': return { label: 'Product Change', cls: 'bg-purple-100 text-purple-800' };
      default: return { label: type, cls: 'bg-gray-100 text-gray-600' };
    }
  };

  const getSettlementBadge = (t: AffiliateTransactionRow) => {
    const st = settlementState(t);
    switch (st) {
      case 'settled': return { label: 'Settled', cls: 'bg-gray-200 text-gray-700' };
      case 'clawback': return { label: 'Clawback', cls: 'bg-red-100 text-red-800' };
      case 'refunded': return { label: 'Refunded', cls: 'bg-orange-100 text-orange-800' };
      case 'ready': return { label: 'Ready', cls: 'bg-green-100 text-green-800' };
      case 'in_window': {
        const days = daysSince(t.purchasedAt);
        return { label: `${days}d / 45d`, cls: 'bg-yellow-100 text-yellow-800' };
      }
      default: return { label: '—', cls: 'bg-gray-100 text-gray-500' };
    }
  };

  const getRcEventTypeColor = (type: string) => {
    switch (type) {
      case 'INITIAL_PURCHASE': return 'bg-blue-100 text-blue-800';
      case 'RENEWAL': return 'bg-green-100 text-green-800';
      case 'CANCELLATION': return 'bg-orange-100 text-orange-800';
      case 'EXPIRATION': return 'bg-gray-100 text-gray-600';
      case 'REFUND': return 'bg-red-100 text-red-800';
      case 'PRODUCT_CHANGE': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const platformFromStore = (store: string | null) => {
    if (!store) return '-';
    if (store === 'APP_STORE') return 'iOS';
    if (store === 'PLAY_STORE') return 'Android';
    return store;
  };

  const copyToClipboard = async (text: string) => {
    try { await navigator.clipboard.writeText(text); } catch (e) { console.error(e); }
  };

  // --- Selection constraint: enforce single affiliate per settle batch ---
  const settleDisabled = (() => {
    if (selectedIds.size === 0) return true;
    const affiliates = new Set<string | null>();
    for (const t of transactions) {
      if (selectedIds.has(t.id)) affiliates.add(t.affiliateId);
    }
    return affiliates.size > 1;
  })();

  return (
    <div className="pb-32">
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
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">Discount</span>
        </div>
      </div>

      {/* Clawback banner */}
      {summary.clawbackCount > 0 && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-medium text-red-900">
                {summary.clawbackCount} clawback {summary.clawbackCount === 1 ? 'transaction needs' : 'transactions need'} review
              </p>
              <p className="text-sm text-red-700">Total owed back: {fmtUsd(summary.clawbackUsd)} USD</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => { setActiveTab('transactions'); setSettlementFilter('clawback'); }}
            className="border-red-300 text-red-700 hover:bg-red-100"
          >
            Review
          </Button>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-6">
          {(['transactions', 'events', 'payouts'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors capitalize ${
                activeTab === tab ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'events' ? 'RevenueCat Events' : tab}
              {tab === 'events' && events.length > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">{events.length}</span>
              )}
              {tab === 'payouts' && payouts.length > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">{payouts.length}</span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* TRANSACTIONS TAB */}
      {activeTab === 'transactions' && (
        <>
          {/* Summary strip */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4">
            <SummaryCard label="Total Charges" value={summary.totalCharges.toString()} />
            <SummaryCard label="Trials Active" value={summary.trialsActive.toString()} color="text-yellow-600" />
            <SummaryCard label="Converted" value={summary.convertedPaid.toString()} color="text-emerald-600" />
            <SummaryCard label="Renewals" value={summary.renewals.toString()} color="text-blue-600" />
            <SummaryCard label="Lifetime USD" value={fmtUsd(summary.lifetimeRevenueUsd)} />
            <SummaryCard label="Ready to Settle" value={fmtUsd(summary.readyToSettleUsd)} color="text-green-600" />
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-4 mb-4">
            <div className="flex flex-wrap gap-3 items-end">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
                <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm">
                  <option value="">All Types</option>
                  <option value="initial_purchase">Initial Purchase</option>
                  <option value="trial_conversion">Trial Conversion</option>
                  <option value="renewal">Renewal</option>
                  <option value="product_change">Product Change</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                <select value={settlementFilter} onChange={(e) => setSettlementFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm">
                  <option value="">All Statuses</option>
                  <option value="ready">Ready</option>
                  <option value="in_window">In refund window</option>
                  <option value="settled">Settled</option>
                  <option value="clawback">Clawback</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Plan</label>
                <select value={planTypeFilter} onChange={(e) => setPlanTypeFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm">
                  <option value="">All Plans</option>
                  <option value="annual">Annual</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Platform</label>
                <select value={platformFilter} onChange={(e) => setPlatformFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm">
                  <option value="">All Platforms</option>
                  <option value="ios">iOS</option>
                  <option value="android">Android</option>
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer mb-[10px]">
                <input type="checkbox" checked={discountedOnly}
                  onChange={(e) => setDiscountedOnly(e.target.checked)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                Discounted products only
              </label>
            </div>
          </div>

          {/* Table */}
          {txnLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 w-10">
                        <input type="checkbox"
                          onChange={selectAllVisible}
                          className="rounded border-gray-300"
                          title="Select all eligible rows on this page"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">USD</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Local</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Platform</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {transactions.length === 0 ? (
                      <tr><td colSpan={9} className="px-6 py-8 text-center text-gray-500">No transactions found.</td></tr>
                    ) : (
                      transactions.map((t) => {
                        const st = settlementState(t);
                        const eligibleForSelection = st === 'ready' || st === 'in_window';
                        const typeBadge = getTxnTypeBadge(t.transactionType);
                        const stateBadge = getSettlementBadge(t);

                        return (
                          <React.Fragment key={t.id}>
                            <tr className={`hover:bg-gray-50 ${selectedIds.has(t.id) ? 'bg-purple-50' : ''}`}>
                              <td className="px-4 py-3">
                                <input
                                  type="checkbox"
                                  checked={selectedIds.has(t.id)}
                                  disabled={!eligibleForSelection}
                                  onChange={() => toggleSelect(t.id)}
                                  className="rounded border-gray-300 disabled:opacity-40"
                                  title={eligibleForSelection ? '' : 'Not eligible for settlement'}
                                />
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-500 cursor-pointer"
                                  onClick={() => setExpandedTxnId(expandedTxnId === t.id ? null : t.id)}
                                  title={formatFullDate(t.purchasedAt)}>
                                <div className="flex items-center gap-2">
                                  <span className={`text-gray-400 text-xs transition-transform ${expandedTxnId === t.id ? 'rotate-90' : ''}`}>&#9654;</span>
                                  {formatRelativeTime(t.purchasedAt)}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeBadge.cls}`}>{typeBadge.label}</span>
                              </td>
                              <td className="px-4 py-3 text-sm font-mono text-gray-700 max-w-[180px] truncate cursor-pointer hover:text-gray-900"
                                  title={t.firebaseUserId || t.rcAppUserId}
                                  onClick={() => copyToClipboard(t.firebaseUserId || t.rcAppUserId)}>
                                {t.firebaseUserId || t.rcAppUserId}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-500 capitalize">{t.planType}</td>
                              <td className="px-4 py-3 text-sm text-gray-700">{fmtUsd(t.priceUsd)}</td>
                              <td className="px-4 py-3 text-sm text-gray-500">{fmtNum(t.price)} {t.currency}</td>
                              <td className="px-4 py-3 text-sm text-gray-500">{t.platform.toUpperCase()}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${stateBadge.cls}`}>{stateBadge.label}</span>
                              </td>
                            </tr>

                            {expandedTxnId === t.id && (
                              <tr>
                                <td colSpan={9} className="px-6 py-0 bg-gray-50">
                                  <div className="py-4 pl-8 pr-4 grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                                    <Detail label="Event ID" value={t.rcEventId} mono />
                                    <Detail label="Transaction ID" value={t.rcTransactionId || '-'} mono />
                                    <Detail label="Original Txn ID" value={t.originalTransactionId || '-'} mono />
                                    <Detail label="Product" value={t.productIdentifier} mono />
                                    <Detail label="Offering" value={t.offeringId || '-'} mono />
                                    <Detail label="Environment" value={t.environment} />
                                    <Detail label="Discounted Product" value={t.isDiscountedProduct ? 'Yes' : 'No'} />
                                    <Detail label="Renewal Number" value={t.renewalNumber?.toString() || '-'} />
                                    <Detail label="Country" value={t.countryCode || '-'} />
                                    <Detail label="Store Commission" value={t.commissionPercentage != null ? `${(t.commissionPercentage * 100).toFixed(2)}%` : '-'} />
                                    <Detail label="Takehome" value={t.takehomePercentage != null ? `${(t.takehomePercentage * 100).toFixed(2)}%` : '-'} />
                                    <Detail label="Tax" value={t.taxPercentage != null ? `${(t.taxPercentage * 100).toFixed(2)}%` : '-'} />
                                    <Detail label="Payout ID" value={t.payoutId || '-'} mono />
                                    <Detail label="Settled At" value={formatFullDate(t.settledAt)} />
                                    <Detail label="Settled By" value={t.settledBy || '-'} />
                                    {t.isRefunded && (
                                      <>
                                        <Detail label="Refunded At" value={formatFullDate(t.refundedAt)} />
                                        <Detail label="Refunded USD" value={fmtUsd(t.priceUsdRefunded)} />
                                        <Detail label="Refund Event ID" value={t.refundEventId || '-'} mono />
                                      </>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* EVENTS TAB — unchanged */}
      {activeTab === 'events' && (
        eventsLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : (
          <>
            <div className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded-lg text-sm text-purple-900">
              <p className="font-medium mb-1">Events filtered by <code className="bg-purple-100 px-1.5 py-0.5 rounded font-mono">subscriber_attributes.discount_code = &quot;{decodedCode}&quot;</code></p>
              <p className="text-xs text-purple-700">Read directly from <code className="bg-purple-100 px-1 rounded font-mono">revenuecatSubscriptionEvents</code>.</p>
            </div>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Event Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Platform</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trial Conv.</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {events.length === 0 ? (
                      <tr><td colSpan={8} className="px-6 py-8 text-center text-gray-500">No events found.</td></tr>
                    ) : events.map((evt) => (
                      <React.Fragment key={evt.id}>
                        <tr className="hover:bg-gray-50 cursor-pointer"
                            onClick={() => setExpandedEventId(expandedEventId === evt.id ? null : evt.id)}>
                          <td className="px-6 py-4 text-sm">
                            <div className="flex items-center gap-2">
                              <span className={`text-gray-400 text-xs transition-transform ${expandedEventId === evt.id ? 'rotate-90' : ''}`}>&#9654;</span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRcEventTypeColor(evt.type)}`}>{evt.type}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm font-mono text-gray-700 break-all max-w-[240px]"
                              title="Click to copy"
                              onClick={(e) => { e.stopPropagation(); copyToClipboard(evt.appUserId); }}>
                            {evt.appUserId}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 font-mono text-xs">{evt.productId || '-'}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{evt.periodType || '-'}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {evt.priceInPurchasedCurrency != null && evt.currency
                              ? `${evt.priceInPurchasedCurrency.toFixed(2)} ${evt.currency}` : '-'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">{platformFromStore(evt.store)}</td>
                          <td className="px-6 py-4 text-sm">
                            {evt.isTrialConversion === true ? (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Yes</span>
                            ) : evt.isTrialConversion === false ? (
                              <span className="text-gray-400 text-xs">No</span>
                            ) : (<span className="text-gray-300 text-xs">-</span>)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500"
                              title={evt.eventTimestampMs ? formatFullDate(new Date(evt.eventTimestampMs).toISOString()) : '-'}>
                            {evt.eventTimestampMs ? formatRelativeTime(new Date(evt.eventTimestampMs).toISOString()) : '-'}
                          </td>
                        </tr>
                        {expandedEventId === evt.id && (
                          <tr>
                            <td colSpan={8} className="px-6 py-0 bg-gray-50">
                              <div className="py-4 pl-8 pr-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                <Detail label="Event ID" value={evt.id} mono />
                                <Detail label="Transaction ID" value={evt.transactionId || '-'} mono />
                                <Detail label="Discount Code" value={evt.discountCode || '-'} mono />
                                <Detail label="Offering ID" value={evt.presentedOfferingId || '-'} mono />
                                <Detail label="Event Time" value={evt.eventTimestampMs ? formatFullDate(new Date(evt.eventTimestampMs).toISOString()) : '-'} />
                                <Detail label="Expires At" value={evt.expirationAtMs ? formatFullDate(new Date(evt.expirationAtMs).toISOString()) : '-'} />
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )
      )}

      {/* PAYOUTS TAB */}
      {activeTab === 'payouts' && (
        payoutsLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Affiliate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Txn Count</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gross USD</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commission</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {payouts.length === 0 ? (
                    <tr><td colSpan={8} className="px-6 py-8 text-center text-gray-500">No payouts yet. Select transactions on the Transactions tab to create one.</td></tr>
                  ) : payouts.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => openPayoutDetails(p)}>
                      <td className="px-6 py-4 text-sm text-gray-500">{formatFullDate(p.createdAt)}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{p.affiliateId || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{p.transactionCount}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{fmtUsd(p.grossUsd)}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{(p.commissionRate * 100).toFixed(0)}%</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{fmtUsd(p.commissionUsd)}</td>
                      <td className="px-6 py-4 text-sm">
                        {p.status === 'paid' ? (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Paid</span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pending</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-[240px] truncate">{p.note || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* FLOATING ACTION BAR */}
      {selectedIds.size > 0 && activeTab === 'transactions' && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
          <div className="max-w-7xl mx-auto px-6 py-4 flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[260px]">
              <div className="text-sm text-gray-900 font-medium">{selectedIds.size} selected</div>
              <div className="text-xs text-gray-500 mt-1">
                Gross: <span className="font-medium text-gray-700">{fmtUsd(selectedTotals.grossUsd)}</span>
                <span className="mx-2">•</span>
                Local: {Object.entries(selectedTotals.byCurrency).map(([c, a]) => `${fmtNum(a)} ${c}`).join(' + ') || '—'}
              </div>
              {selectedTotals.inWindowCount > 0 && (
                <div className="text-xs text-yellow-600 mt-1">
                  ⚠ {selectedTotals.inWindowCount} inside refund window
                </div>
              )}
              {settleDisabled && selectedIds.size > 0 && (
                <div className="text-xs text-red-600 mt-1">
                  Multiple affiliates selected — settle one affiliate at a time
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={clearSelection}>Clear</Button>
              <Button
                disabled={settleDisabled}
                onClick={() => setSettleModalOpen(true)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Settle → Create Payout
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* SETTLE MODAL */}
      {settleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => !settling && setSettleModalOpen(false)} />
          <div className="relative bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Create Payout</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Affiliate</span><span className="font-medium">{selectedAffiliateId || '—'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Transactions</span><span className="font-medium">{selectedTotals.count}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Gross USD</span><span className="font-medium">{fmtUsd(selectedTotals.grossUsd)}</span></div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Commission rate</span>
                <input type="number" step="0.01" min="0" max="1" value={commissionRate}
                  onChange={(e) => setCommissionRate(e.target.value)}
                  className="w-24 px-2 py-1 border border-gray-300 rounded-md text-right" />
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200">
                <span className="text-gray-700 font-medium">Commission USD</span>
                <span className="font-bold text-purple-700">{fmtUsd(selectedTotals.commissionUsd)}</span>
              </div>

              {selectedTotals.inWindowCount > 0 && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                  ⚠ {selectedTotals.inWindowCount} transaction{selectedTotals.inWindowCount > 1 ? 's are' : ' is'} still inside the 45-day refund window. Settling now means potential clawback if refunded later.
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 mt-3">Note (optional)</label>
                <textarea value={settleNote} onChange={(e) => setSettleNote(e.target.value)}
                  placeholder="e.g. April 2026 payout — bank ref #..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  rows={2} />
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <Button variant="outline" onClick={() => setSettleModalOpen(false)} disabled={settling}>Cancel</Button>
              <Button onClick={handleSettle} disabled={settling} className="bg-purple-600 hover:bg-purple-700">
                {settling ? 'Creating...' : 'Create Payout'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* PAYOUT DETAILS MODAL */}
      {selectedPayout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedPayout(null)} />
          <div className="relative bg-white rounded-lg shadow-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Payout Details</h3>
                <p className="text-xs text-gray-500 font-mono mt-1">{selectedPayout.id}</p>
              </div>
              <button onClick={() => setSelectedPayout(null)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-sm">
              <Detail label="Affiliate" value={selectedPayout.affiliateId || '-'} />
              <Detail label="Transactions" value={selectedPayout.transactionCount.toString()} />
              <Detail label="Gross" value={fmtUsd(selectedPayout.grossUsd)} />
              <Detail label="Commission" value={`${fmtUsd(selectedPayout.commissionUsd)} (${(selectedPayout.commissionRate * 100).toFixed(0)}%)`} />
              <Detail label="Status" value={selectedPayout.status} />
              <Detail label="Created" value={formatFullDate(selectedPayout.createdAt)} />
              <Detail label="Created By" value={selectedPayout.createdBy} />
              <Detail label="Paid" value={selectedPayout.paidAt ? formatFullDate(selectedPayout.paidAt) : '—'} />
            </div>

            {selectedPayout.note && (
              <div className="mb-4 p-3 bg-gray-50 rounded text-sm text-gray-700">{selectedPayout.note}</div>
            )}

            <h4 className="text-sm font-semibold text-gray-700 mb-2">Linked Transactions</h4>
            {payoutDetailLoading ? (
              <div className="flex justify-center py-6">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
              </div>
            ) : (
              <div className="border border-gray-200 rounded max-h-[300px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">USD</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Refunded?</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selectedPayoutTxns.map((t) => (
                      <tr key={t.id}>
                        <td className="px-3 py-2 text-gray-500">{formatShortDate(t.purchasedAt)}</td>
                        <td className="px-3 py-2"><span className={`px-2 py-0.5 rounded text-xs ${getTxnTypeBadge(t.transactionType).cls}`}>{getTxnTypeBadge(t.transactionType).label}</span></td>
                        <td className="px-3 py-2 font-mono text-xs text-gray-700 max-w-[140px] truncate">{t.firebaseUserId || t.rcAppUserId}</td>
                        <td className="px-3 py-2 text-gray-700">{fmtUsd(t.priceUsd)}</td>
                        <td className="px-3 py-2">{t.isRefunded ? <span className="text-red-600 text-xs">Yes — clawback</span> : <span className="text-gray-400 text-xs">No</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setSelectedPayout(null)}>Close</Button>
              {selectedPayout.status === 'pending' && (
                <Button onClick={() => handleMarkPaid(selectedPayout.id)} className="bg-green-600 hover:bg-green-700">
                  Mark as Paid
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Small presentational components ---

function SummaryCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-white rounded-lg shadow p-3">
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <p className={`text-xl font-bold ${color || 'text-gray-900'} mt-1`}>{value}</p>
    </div>
  );
}

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-sm text-gray-700 ${mono ? 'font-mono text-xs break-all' : ''} mt-0.5`}>{value}</p>
    </div>
  );
}
