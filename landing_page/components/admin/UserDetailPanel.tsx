'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  getUserDetails,
  sendPushNotification,
  grantUserEntitlement,
} from '@/app/admin_portal/actions/admin-actions';

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

export default function UserDetailPanel({ userId, onClose }: UserDetailPanelProps) {
  const [details, setDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'meals' | 'weights'>('profile');
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationBody, setNotificationBody] = useState('');
  const [sendingNotification, setSendingNotification] = useState(false);
  const [grantingPro, setGrantingPro] = useState(false);

  useEffect(() => {
    if (userId) {
      loadUserDetails();
    }
  }, [userId]);

  const loadUserDetails = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const result = await getUserDetails(userId);
      if (!result.error) {
        setDetails(result);
      }
    } catch (error) {
      console.error('Error loading user details:', error);
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
        loadUserDetails();
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

  if (!userId) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-2xl bg-white shadow-xl overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
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
                  <div className="flex gap-2 mt-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        details.user.isPremium
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {details.user.isPremium ? 'Premium' : 'Free'}
                    </span>
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
            <div className="flex gap-4 mb-4 border-b">
              {(['profile', 'meals', 'weights'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-2 px-1 font-medium capitalize ${
                    activeTab === tab
                      ? 'text-green-600 border-b-2 border-green-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab Content */}
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
