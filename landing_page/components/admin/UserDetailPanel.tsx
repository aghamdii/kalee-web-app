'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  getUserDetails,
  sendPushNotification,
  grantUserEntitlement,
  getUserSubscriptionInfo,
  getUserInsight,
} from '@/app/admin_portal/actions/admin-actions';

// Label mappings (shared with insights page)
const ACQUISITION_SOURCE_LABELS: Record<string, string> = {
  app_store: 'App Store',
  friend_family: 'Friend or Family',
  influencer: 'Influencer',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  x_twitter: 'X (Twitter)',
  youtube: 'YouTube',
  linkedin: 'LinkedIn',
  other: 'Other',
};

const MOTIVATION_LABELS: Record<string, string> = {
  live_longer: 'Live longer & healthier',
  feel_confident: 'Feel confident in clothes',
  more_energy: 'Have more energy',
  medical_conditions: 'Improve health conditions',
  feel_attractive: 'Feel attractive & confident',
};

const TRACKING_METHOD_LABELS: Record<string, string> = {
  other_apps: 'Other apps',
  pen_paper: 'Pen and paper',
  mental_tracking: 'Mental tracking',
  no_tracking: "Don't track at all",
  tried_failed: 'Tried but always quit',
};

const EATING_HABITS_LABELS: Record<string, string> = {
  very_healthy: 'Very healthy',
  mostly_healthy: 'Mostly healthy',
  balanced: 'Balanced',
  need_improvement: 'Could use improvement',
  unsure: "I'm not sure",
};

const STORE_LABELS: Record<string, string> = {
  app_store: 'App Store',
  play_store: 'Play Store',
  promotional: 'Promotional',
  stripe: 'Stripe',
};

const EVENT_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  INITIAL_PURCHASE: { label: 'Initial Purchase', color: 'bg-green-100 text-green-800' },
  RENEWAL: { label: 'Renewal', color: 'bg-green-100 text-green-800' },
  CANCELLATION: { label: 'Cancellation', color: 'bg-red-100 text-red-800' },
  UNCANCELLATION: { label: 'Uncancellation', color: 'bg-green-100 text-green-800' },
  EXPIRATION: { label: 'Expiration', color: 'bg-gray-100 text-gray-800' },
  BILLING_ISSUE: { label: 'Billing Issue', color: 'bg-yellow-100 text-yellow-800' },
  PRODUCT_CHANGE: { label: 'Product Change', color: 'bg-blue-100 text-blue-800' },
  SUBSCRIBER_ALIAS: { label: 'Alias Created', color: 'bg-gray-100 text-gray-600' },
  TRANSFER: { label: 'Transfer', color: 'bg-blue-100 text-blue-800' },
  NON_RENEWING_PURCHASE: { label: 'Non-Renewing Purchase', color: 'bg-green-100 text-green-800' },
};

function label(map: Record<string, string>, key: string | null): string {
  if (!key) return '-';
  return map[key] || key;
}

interface UserDetailPanelProps {
  userId: string | null;
  onClose: () => void;
}

interface UserDetails {
  user: {
    id: string;
    email: string | null;
    displayName: string | null;
    isPremium: boolean;
    aiUsageCount: number;
    lastActiveAt: string | null;
    createdAt: string | null;
    fcmToken: string | null;
  } | null;
  profile: {
    age: number | null;
    gender: string | null;
    heightCm: number | null;
    currentWeightKg: number | null;
    targetWeightKg: number | null;
    primaryGoal: string | null;
    activityLevel: string | null;
    currentStreak: number;
    longestStreak: number;
  } | null;
  recentMeals: Array<{
    id: string;
    name: string;
    mealType: string;
    date: string;
    nutrition: { calories?: number; protein?: number; carbs?: number; fat?: number };
  }>;
  weights: Array<{
    date: string;
    weightKg: number;
    isInitial: boolean;
  }>;
}

type SubscriptionInfo = Awaited<ReturnType<typeof getUserSubscriptionInfo>>;
type InsightInfo = Awaited<ReturnType<typeof getUserInsight>>;

type TabKey = 'subscription' | 'profile' | 'insights' | 'meals' | 'weights';

function getSubscriptionStatus(customerInfo: SubscriptionInfo['customerInfo']): {
  label: string;
  color: string;
  expiryDate: string | null;
  productName: string | null;
} {
  if (!customerInfo) {
    return { label: 'No Data', color: 'bg-gray-100 text-gray-600', expiryDate: null, productName: null };
  }

  const entitlements = customerInfo.entitlements || {};
  const proEntitlement = entitlements['Pro'];

  if (!proEntitlement) {
    return { label: 'Free', color: 'bg-gray-100 text-gray-600', expiryDate: null, productName: null };
  }

  const expiryDate = proEntitlement.expires_date;
  const isLifetime = expiryDate === null;
  const isActive = isLifetime || (expiryDate && new Date(expiryDate) > new Date());

  // Check subscription details for period type
  const productId = proEntitlement.product_identifier;
  const subscription = productId ? customerInfo.subscriptions?.[productId] : null;
  const periodType = subscription?.period_type;

  if (isActive && periodType === 'trial') {
    return { label: 'Trial', color: 'bg-blue-100 text-blue-800', expiryDate, productName: productId };
  }

  if (isLifetime) {
    return { label: 'Lifetime Pro', color: 'bg-yellow-100 text-yellow-800', expiryDate: null, productName: productId };
  }

  if (isActive) {
    // Check for grace period
    const gracePeriod = proEntitlement.grace_period_expires_date;
    if (gracePeriod && new Date(gracePeriod) > new Date()) {
      return { label: 'Grace Period', color: 'bg-yellow-100 text-yellow-800', expiryDate, productName: productId };
    }
    return { label: 'Active Pro', color: 'bg-green-100 text-green-800', expiryDate, productName: productId };
  }

  return { label: 'Expired', color: 'bg-red-100 text-red-800', expiryDate, productName: productId };
}

export default function UserDetailPanel({ userId, onClose }: UserDetailPanelProps) {
  const [details, setDetails] = useState<UserDetails | null>(null);
  const [subInfo, setSubInfo] = useState<SubscriptionInfo | null>(null);
  const [insightInfo, setInsightInfo] = useState<InsightInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('subscription');
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationBody, setNotificationBody] = useState('');
  const [sendingNotification, setSendingNotification] = useState(false);
  const [grantingPro, setGrantingPro] = useState(false);

  useEffect(() => {
    if (userId) {
      loadAllData();
    }
  }, [userId]);

  const loadAllData = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [detailsResult, subResult, insightResult] = await Promise.all([
        getUserDetails(userId),
        getUserSubscriptionInfo(userId),
        getUserInsight(userId),
      ]);

      if (!detailsResult.error) setDetails(detailsResult);
      setSubInfo(subResult);
      setInsightInfo(insightResult);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendNotification = async () => {
    if (!userId || !notificationTitle || !notificationBody) return;
    setSendingNotification(true);
    try {
      const result = await sendPushNotification({
        userId,
        title: notificationTitle,
        body: notificationBody,
      });
      if (result.success) {
        alert(`Notification sent successfully!\n\nMessage ID: ${result.messageId}`);
        setNotificationTitle('');
        setNotificationBody('');
      } else {
        alert(`Failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      alert('Failed to send notification');
    } finally {
      setSendingNotification(false);
    }
  };

  const handleGrantPro = async () => {
    if (!userId) return;
    if (!confirm('Grant 1-year Pro entitlement to this user?')) return;
    setGrantingPro(true);
    try {
      const result = await grantUserEntitlement({
        userId,
        entitlementId: 'Pro',
        duration: 'yearly',
      });
      if (result.success) {
        alert('Pro entitlement granted!');
        loadAllData();
      } else {
        alert(`Failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Error granting entitlement:', error);
      alert('Failed to grant entitlement');
    } finally {
      setGrantingPro(false);
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

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTimestampMs = (ms: number | null) => {
    if (!ms) return '-';
    return new Date(ms).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!userId) return null;

  const subStatus = subInfo?.customerInfo
    ? getSubscriptionStatus(subInfo.customerInfo)
    : null;

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'subscription', label: 'Subscription' },
    { key: 'profile', label: 'Profile' },
    { key: 'insights', label: 'Insights' },
    { key: 'meals', label: 'Meals' },
    { key: 'weights', label: 'Weights' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-2xl bg-white shadow-xl overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-gray-900">User Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            &times;
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        ) : details?.user ? (
          <div className="p-6">
            {/* User Header */}
            <div className="mb-6 pb-6 border-b">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {details.user.displayName || 'No Name'}
                  </h3>
                  <p className="text-gray-500">{details.user.email || 'No email'}</p>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {/* Subscription status badge — from RevenueCat (source of truth) */}
                    {subStatus ? (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${subStatus.color}`}>
                        {subStatus.label}
                        {subStatus.expiryDate && (
                          <span className="ml-1 opacity-75">
                            — {new Date(subStatus.expiryDate) > new Date() ? 'expires' : 'expired'}{' '}
                            {formatDate(subStatus.expiryDate)}
                          </span>
                        )}
                      </span>
                    ) : (
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          details.user.isPremium
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {details.user.isPremium ? 'Premium' : 'Free'}
                      </span>
                    )}
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        details.user.fcmToken
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {details.user.fcmToken ? 'Notifications On' : 'Notifications Off'}
                    </span>
                  </div>
                </div>
                <Button
                  onClick={handleGrantPro}
                  disabled={grantingPro}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {grantingPro ? 'Granting...' : 'Grant Pro'}
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
                <div>
                  <span className="text-gray-500">AI Usage:</span>{' '}
                  <span className="font-medium">{details.user.aiUsageCount}</span>
                </div>
                <div>
                  <span className="text-gray-500">Last Active:</span>{' '}
                  <span className="font-medium">{formatDate(details.user.lastActiveAt)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Joined:</span>{' '}
                  <span className="font-medium">{formatDate(details.user.createdAt)}</span>
                </div>
              </div>
            </div>

            {/* Send Notification */}
            {details.user.fcmToken && (
              <div className="mb-6 pb-6 border-b">
                <h4 className="font-medium text-gray-900 mb-3">Send Push Notification</h4>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={notificationTitle}
                    onChange={(e) => setNotificationTitle(e.target.value)}
                    placeholder="Notification title"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <textarea
                    value={notificationBody}
                    onChange={(e) => setNotificationBody(e.target.value)}
                    placeholder="Notification message"
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <Button
                    onClick={handleSendNotification}
                    disabled={sendingNotification || !notificationTitle || !notificationBody}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {sendingNotification ? 'Sending...' : 'Send Notification'}
                  </Button>
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 mb-4 border-b overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`pb-2 px-3 font-medium text-sm whitespace-nowrap ${
                    activeTab === tab.key
                      ? 'text-green-600 border-b-2 border-green-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ===== SUBSCRIPTION TAB ===== */}
            {activeTab === 'subscription' && (
              <div className="space-y-4">
                {subInfo?.customerInfo ? (
                  <>
                    {/* Current Plan */}
                    {Object.keys(subInfo.customerInfo.entitlements).length > 0 ? (
                      Object.entries(subInfo.customerInfo.entitlements).map(([name, ent]) => {
                        const sub = ent.product_identifier
                          ? subInfo.customerInfo!.subscriptions?.[ent.product_identifier]
                          : null;
                        const isActive = ent.expires_date === null || new Date(ent.expires_date) > new Date();
                        const hasUnsub = sub?.unsubscribe_detected_at != null;
                        const hasBilling = sub?.billing_issues_detected_at != null;

                        return (
                          <div key={name} className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-semibold text-gray-900">{name} Entitlement</h4>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {isActive ? 'Active' : 'Expired'}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <span className="text-gray-500">Product</span>
                                <div className="font-medium">{ent.product_identifier || '-'}</div>
                              </div>
                              <div>
                                <span className="text-gray-500">Store</span>
                                <div className="font-medium">{sub ? label(STORE_LABELS, sub.store) : '-'}</div>
                              </div>
                              <div>
                                <span className="text-gray-500">Purchase Date</span>
                                <div className="font-medium">{formatDateTime(ent.purchase_date)}</div>
                              </div>
                              <div>
                                <span className="text-gray-500">Expires</span>
                                <div className="font-medium">
                                  {ent.expires_date === null ? 'Lifetime' : formatDateTime(ent.expires_date)}
                                </div>
                              </div>
                              {sub && (
                                <>
                                  <div>
                                    <span className="text-gray-500">Period</span>
                                    <div className="font-medium capitalize">{sub.period_type || '-'}</div>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Price</span>
                                    <div className="font-medium">
                                      {sub.price ? `${sub.price.amount} ${sub.price.currency}` : '-'}
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Ownership</span>
                                    <div className="font-medium">{sub.ownership_type || '-'}</div>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Auto-Renew</span>
                                    <div className="font-medium">
                                      {hasUnsub ? (
                                        <span className="text-red-600">Off (since {formatDate(sub.unsubscribe_detected_at)})</span>
                                      ) : (
                                        <span className="text-green-600">On</span>
                                      )}
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>

                            {/* Alerts */}
                            {(hasBilling || hasUnsub) && (
                              <div className="mt-3 space-y-2">
                                {hasBilling && (
                                  <div className="bg-yellow-50 border border-yellow-200 rounded p-2 text-sm text-yellow-800">
                                    Billing issue detected on {formatDate(sub!.billing_issues_detected_at)}
                                  </div>
                                )}
                                {hasUnsub && isActive && (
                                  <div className="bg-red-50 border border-red-200 rounded p-2 text-sm text-red-800">
                                    Cancelled — access until {formatDate(ent.expires_date)}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500">
                        No entitlements — Free user
                      </div>
                    )}

                    {/* RevenueCat Info */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-700 text-sm mb-2">RevenueCat Info</h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-500">First Seen</span>
                          <div className="font-medium">{formatDateTime(subInfo.customerInfo.first_seen)}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Last Seen</span>
                          <div className="font-medium">{formatDateTime(subInfo.customerInfo.last_seen)}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Original User ID</span>
                          <div className="font-mono text-xs break-all">
                            {subInfo.customerInfo.original_app_user_id}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">Aliases</span>
                          <div className="font-mono text-xs break-all">
                            {subInfo.customerInfo.aliases?.join(', ') || '-'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Subscription Events Timeline */}
                    {subInfo.events.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-700 text-sm mb-2">Event Timeline</h4>
                        <div className="space-y-2">
                          {subInfo.events.map((event) => {
                            const evtInfo = EVENT_TYPE_LABELS[event.type] || {
                              label: event.type,
                              color: 'bg-gray-100 text-gray-600',
                            };
                            return (
                              <div
                                key={event.id}
                                className="flex items-center justify-between bg-gray-50 rounded p-3 text-sm"
                              >
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${evtInfo.color}`}>
                                    {evtInfo.label}
                                  </span>
                                  {event.product_id && (
                                    <span className="text-gray-500 text-xs">{event.product_id}</span>
                                  )}
                                </div>
                                <span className="text-gray-400 text-xs whitespace-nowrap">
                                  {formatTimestampMs(event.event_timestamp_ms)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
                    No RevenueCat data available for this user
                  </div>
                )}
              </div>
            )}

            {/* ===== PROFILE TAB ===== */}
            {activeTab === 'profile' && details.profile && (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-500">Age</div>
                  <div className="font-medium">{details.profile.age || '-'}</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-500">Gender</div>
                  <div className="font-medium capitalize">{details.profile.gender || '-'}</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-500">Height</div>
                  <div className="font-medium">
                    {details.profile.heightCm ? `${details.profile.heightCm} cm` : '-'}
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-500">Current Weight</div>
                  <div className="font-medium">
                    {details.profile.currentWeightKg ? `${details.profile.currentWeightKg} kg` : '-'}
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-500">Target Weight</div>
                  <div className="font-medium">
                    {details.profile.targetWeightKg ? `${details.profile.targetWeightKg} kg` : '-'}
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-500">Goal</div>
                  <div className="font-medium capitalize">
                    {details.profile.primaryGoal?.replace(/_/g, ' ') || '-'}
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-500">Activity Level</div>
                  <div className="font-medium capitalize">
                    {details.profile.activityLevel?.replace(/_/g, ' ') || '-'}
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-500">Streaks</div>
                  <div className="font-medium">
                    Current: {details.profile.currentStreak} | Best: {details.profile.longestStreak}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'profile' && !details.profile && (
              <p className="text-gray-500 text-center py-8">No profile data available</p>
            )}

            {/* ===== INSIGHTS TAB ===== */}
            {activeTab === 'insights' && (
              <div>
                {insightInfo?.insight ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-500">How they found Kalee</div>
                      <div className="font-medium">
                        {label(ACQUISITION_SOURCE_LABELS, insightInfo.insight.acquisitionSource)}
                      </div>
                      {insightInfo.insight.influencerName && (
                        <div className="text-xs text-gray-400 mt-1">
                          Influencer: {insightInfo.insight.influencerName}
                        </div>
                      )}
                      {insightInfo.insight.acquisitionSourceOther && (
                        <div className="text-xs text-gray-400 mt-1">
                          Other: {insightInfo.insight.acquisitionSourceOther}
                        </div>
                      )}
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-500">Motivation</div>
                      <div className="font-medium">
                        {label(MOTIVATION_LABELS, insightInfo.insight.primaryMotivation)}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-500">Tracking Method</div>
                      <div className="font-medium">
                        {label(TRACKING_METHOD_LABELS, insightInfo.insight.currentTrackingMethod)}
                      </div>
                      {insightInfo.insight.trackingAppName && (
                        <div className="text-xs text-gray-400 mt-1">
                          App: {insightInfo.insight.trackingAppName}
                        </div>
                      )}
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-500">Eating Habits</div>
                      <div className="font-medium">
                        {label(EATING_HABITS_LABELS, insightInfo.insight.eatingHabits)}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-500">Platform</div>
                      <div className="font-medium">{insightInfo.insight.platform}</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-500">Language</div>
                      <div className="font-medium">
                        {insightInfo.insight.locale === 'ar' ? 'Arabic' :
                         insightInfo.insight.locale === 'en' ? 'English' :
                         insightInfo.insight.locale === 'ko' ? 'Korean' :
                         insightInfo.insight.locale === 'ja' ? 'Japanese' :
                         insightInfo.insight.locale}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-500">App Version</div>
                      <div className="font-medium">{insightInfo.insight.appVersion || '-'}</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-500">Onboarding Date</div>
                      <div className="font-medium">{formatDate(insightInfo.insight.completedAt)}</div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    No onboarding insights available (user may have onboarded before v1.2.12)
                  </p>
                )}
              </div>
            )}

            {/* ===== MEALS TAB ===== */}
            {activeTab === 'meals' && (
              <div className="space-y-3">
                {details.recentMeals.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No meals logged</p>
                ) : (
                  details.recentMeals.map((meal) => (
                    <div key={meal.id} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{meal.name}</div>
                          <div className="text-sm text-gray-500">
                            {meal.mealType} - {meal.date}
                          </div>
                        </div>
                        <div className="text-right text-sm">
                          <div className="font-medium">{meal.nutrition.calories || 0} kcal</div>
                          <div className="text-gray-500">
                            P: {meal.nutrition.protein || 0}g | C: {meal.nutrition.carbs || 0}g | F:{' '}
                            {meal.nutrition.fat || 0}g
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ===== WEIGHTS TAB ===== */}
            {activeTab === 'weights' && (
              <div className="space-y-3">
                {details.weights.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No weight data</p>
                ) : (
                  details.weights.map((weight, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg flex justify-between">
                      <div>
                        <div className="font-medium">{weight.weightKg} kg</div>
                        {weight.isInitial && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                            Initial
                          </span>
                        )}
                      </div>
                      <div className="text-gray-500">{weight.date}</div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-20">User not found</p>
        )}
      </div>
    </div>
  );
}
