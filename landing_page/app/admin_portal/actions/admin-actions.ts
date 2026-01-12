'use server';

import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';
import { randomBytes } from 'crypto';

const ADMIN_EMAILS = ['alghamdii.ahmad@gmail.com', 'ahmadgh187@gmail.com'];
const REVENUECAT_API_URL = 'https://api.revenuecat.com/v1';

// Verify the user is an admin by checking their session
async function verifyAdmin(): Promise<{ uid: string; email: string } | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('admin_session')?.value;

    if (!sessionCookie) {
      return null;
    }

    const { adminAuth } = getFirebaseAdmin();
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);

    if (!decodedToken.email || !ADMIN_EMAILS.includes(decodedToken.email.toLowerCase())) {
      return null;
    }

    return { uid: decodedToken.uid, email: decodedToken.email };
  } catch (error) {
    console.error('Error verifying admin:', error);
    return null;
  }
}

// Create session cookie after login
export async function createAdminSession(idToken: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { adminAuth } = getFirebaseAdmin();

    // Verify the ID token
    const decodedToken = await adminAuth.verifyIdToken(idToken);

    if (!decodedToken.email || !ADMIN_EMAILS.includes(decodedToken.email.toLowerCase())) {
      return { success: false, error: 'Not authorized as admin' };
    }

    // Create session cookie (5 days expiry)
    const expiresIn = 60 * 60 * 24 * 5 * 1000;
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    // Set the cookie
    const cookieStore = await cookies();
    cookieStore.set('admin_session', sessionCookie, {
      maxAge: expiresIn / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/admin_portal',
    });

    return { success: true };
  } catch (error) {
    console.error('Error creating session:', error);
    return { success: false, error: 'Failed to create session' };
  }
}

// Clear session on logout
export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('admin_session');
}

// List users from Firestore
export async function listUsers(options: {
  pageSize?: number;
  lastDocId?: string | null;
  searchQuery?: string | null;
  searchType?: 'email' | 'userId';
}): Promise<{
  users: Array<{
    id: string;
    email: string | null;
    displayName: string | null;
    createdAt: string | null;
    notificationsEnabled: boolean;
    languageSelected: string;
  }>;
  nextPageToken: string | null;
  hasMore: boolean;
  error?: string;
}> {
  const admin = await verifyAdmin();
  if (!admin) {
    return { users: [], nextPageToken: null, hasMore: false, error: 'Unauthorized' };
  }

  const { pageSize = 20, lastDocId, searchQuery, searchType = 'email' } = options;

  try {
    const { db } = getFirebaseAdmin();

    // If searching by userId, get the specific document
    if (searchQuery && searchQuery.trim() && searchType === 'userId') {
      const userDoc = await db.collection('users').doc(searchQuery.trim()).get();
      if (userDoc.exists) {
        const data = userDoc.data()!;
        return {
          users: [{
            id: userDoc.id,
            email: data.email || null,
            displayName: data.displayName || null,
            createdAt: data.createdAt ? new Date(data.createdAt).toISOString() : null,
            notificationsEnabled: data.notificationsEnabled || false,
            languageSelected: data.languageSelected || 'en',
          }],
          nextPageToken: null,
          hasMore: false,
        };
      }
      return { users: [], nextPageToken: null, hasMore: false };
    }

    let query = db.collection('users').orderBy('createdAt', 'desc').limit(pageSize);

    if (searchQuery && searchQuery.trim() && searchType === 'email') {
      query = db
        .collection('users')
        .where('email', '>=', searchQuery.toLowerCase())
        .where('email', '<=', searchQuery.toLowerCase() + '\uf8ff')
        .limit(pageSize);
    }

    if (lastDocId) {
      const lastDoc = await db.collection('users').doc(lastDocId).get();
      if (lastDoc.exists) {
        query = query.startAfter(lastDoc);
      }
    }

    const snapshot = await query.get();

    const users = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        email: data.email || null,
        displayName: data.displayName || null,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        notificationsEnabled: data.notificationsEnabled || false,
        languageSelected: data.languageSelected || 'en',
      };
    });

    const lastVisible = snapshot.docs[snapshot.docs.length - 1];

    return {
      users,
      nextPageToken: lastVisible?.id || null,
      hasMore: snapshot.docs.length === pageSize,
    };
  } catch (error) {
    console.error('Error listing users:', error);
    return { users: [], nextPageToken: null, hasMore: false, error: 'Failed to list users' };
  }
}

// Generate promo code - 5 alphanumeric characters (excludes confusing chars: 0, O, 1, I, L)
function generateSimpleCode(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // No 0, O, 1, I, L
  let code = '';
  const bytes = randomBytes(5);
  for (let i = 0; i < 5; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
}

export async function generatePromoCode(options: {
  entitlementId?: string;
  durationDays?: number;
}): Promise<{ success: boolean; code?: string; error?: string }> {
  const admin = await verifyAdmin();
  if (!admin) {
    return { success: false, error: 'Unauthorized' };
  }

  const { entitlementId = 'Pro', durationDays = 365 } = options;

  try {
    const { db } = getFirebaseAdmin();

    // Generate unique code - check for duplicates
    let code = '';
    let attempts = 0;
    const maxAttempts = 10;

    do {
      code = generateSimpleCode();
      const existing = await db.collection('promoCodes').doc(code).get();
      if (!existing.exists) break;
      attempts++;
    } while (attempts < maxAttempts);

    if (attempts >= maxAttempts) {
      return { success: false, error: 'Failed to generate unique code' };
    }

    const now = new Date();

    const promoCode = {
      code,
      type: 'single_use',
      maxUses: 1,
      usedCount: 0,
      entitlementId,
      durationDays,
      status: 'active',
      createdBy: admin.uid,
      createdByEmail: admin.email,
      createdAt: now,
      expiresAt: null,
      redemptions: [],
    };

    await db.collection('promoCodes').doc(code).set(promoCode);

    // Log to audit trail
    await db.collection('adminAuditLog').add({
      action: 'promo_code_generated',
      adminId: admin.uid,
      adminEmail: admin.email,
      details: { code, entitlementId, durationDays },
      timestamp: now,
    });

    return { success: true, code };
  } catch (error) {
    console.error('Error generating promo code:', error);
    return { success: false, error: 'Failed to generate promo code' };
  }
}

// Reserve a promo code (mark as sent to someone)
export async function reservePromoCode(options: {
  code: string;
  reservedFor: string;
}): Promise<{ success: boolean; error?: string }> {
  const admin = await verifyAdmin();
  if (!admin) {
    return { success: false, error: 'Unauthorized' };
  }

  const { code, reservedFor } = options;

  try {
    const { db } = getFirebaseAdmin();
    const promoRef = db.collection('promoCodes').doc(code);
    const promoDoc = await promoRef.get();

    if (!promoDoc.exists) {
      return { success: false, error: 'Promo code not found' };
    }

    const promoData = promoDoc.data()!;
    if (promoData.status !== 'active') {
      return { success: false, error: `Cannot reserve a code with status: ${promoData.status}` };
    }

    await promoRef.update({
      status: 'reserved',
      reservedFor: reservedFor.trim(),
      reservedBy: admin.email,
      reservedAt: new Date(),
    });

    // Log to audit trail
    await db.collection('adminAuditLog').add({
      action: 'promo_code_reserved',
      adminId: admin.uid,
      adminEmail: admin.email,
      details: { code, reservedFor },
      timestamp: new Date(),
    });

    return { success: true };
  } catch (error) {
    console.error('Error reserving promo code:', error);
    return { success: false, error: 'Failed to reserve promo code' };
  }
}

// Unreserve a promo code (set back to active)
export async function unreservePromoCode(code: string): Promise<{ success: boolean; error?: string }> {
  const admin = await verifyAdmin();
  if (!admin) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const { db } = getFirebaseAdmin();
    const promoRef = db.collection('promoCodes').doc(code);
    const promoDoc = await promoRef.get();

    if (!promoDoc.exists) {
      return { success: false, error: 'Promo code not found' };
    }

    const promoData = promoDoc.data()!;
    if (promoData.status !== 'reserved') {
      return { success: false, error: 'Code is not reserved' };
    }

    await promoRef.update({
      status: 'active',
      reservedFor: null,
      reservedBy: null,
      reservedAt: null,
    });

    return { success: true };
  } catch (error) {
    console.error('Error unreserving promo code:', error);
    return { success: false, error: 'Failed to unreserve promo code' };
  }
}

// List promo codes
export async function listPromoCodes(options: {
  pageSize?: number;
  status?: string | null;
}): Promise<{
  promoCodes: Array<{
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
  }>;
  error?: string;
}> {
  const admin = await verifyAdmin();
  if (!admin) {
    return { promoCodes: [], error: 'Unauthorized' };
  }

  const { pageSize = 50, status } = options;

  try {
    const { db } = getFirebaseAdmin();
    let query = db.collection('promoCodes').orderBy('createdAt', 'desc').limit(pageSize);

    if (status) {
      query = db
        .collection('promoCodes')
        .where('status', '==', status)
        .orderBy('createdAt', 'desc')
        .limit(pageSize);
    }

    const snapshot = await query.get();

    const promoCodes = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        code: data.code,
        status: data.status,
        entitlementId: data.entitlementId,
        durationDays: data.durationDays,
        usedCount: data.usedCount,
        maxUses: data.maxUses,
        createdByEmail: data.createdByEmail,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        expiresAt: data.expiresAt?.toDate?.()?.toISOString() || null,
        reservedFor: data.reservedFor || null,
        reservedBy: data.reservedBy || null,
      };
    });

    return { promoCodes };
  } catch (error) {
    console.error('Error listing promo codes:', error);
    return { promoCodes: [], error: 'Failed to list promo codes' };
  }
}

// Get detailed user information (profile, meals, weights)
export async function getUserDetails(userId: string): Promise<{
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
  error?: string;
}> {
  const admin = await verifyAdmin();
  if (!admin) {
    return { user: null, profile: null, recentMeals: [], weights: [], error: 'Unauthorized' };
  }

  try {
    const { db } = getFirebaseAdmin();

    // Get user document
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return { user: null, profile: null, recentMeals: [], weights: [], error: 'User not found' };
    }
    const userData = userDoc.data()!;

    // Get profile
    const profileDoc = await db.collection('profiles').doc(userId).get();
    const profileData = profileDoc.exists ? profileDoc.data()! : null;

    // Get recent meals (last 20)
    const mealsSnapshot = await db
      .collection('meals')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get();

    const recentMeals = mealsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || 'Unknown',
        mealType: data.mealType || 'other',
        date: data.date || '',
        nutrition: data.nutrition || {},
      };
    });

    // Get weight history
    const weightsSnapshot = await db
      .collection('weights')
      .where('userId', '==', userId)
      .orderBy('date', 'desc')
      .limit(30)
      .get();

    const weights = weightsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        date: data.date || '',
        weightKg: data.weightKg || 0,
        isInitial: data.isInitial || false,
      };
    });

    return {
      user: {
        id: userId,
        email: userData.email || null,
        displayName: userData.displayName || null,
        isPremium: userData.isPremium || false,
        aiUsageCount: userData.aiUsageCount || 0,
        lastActiveAt: userData.lastActiveAt ? new Date(userData.lastActiveAt).toISOString() : null,
        createdAt: userData.createdAt ? new Date(userData.createdAt).toISOString() : null,
        fcmToken: userData.fcmToken || null,
      },
      profile: profileData
        ? {
            age: profileData.age || null,
            gender: profileData.gender || null,
            heightCm: profileData.heightCm || null,
            currentWeightKg: profileData.currentWeightKg || null,
            targetWeightKg: profileData.targetWeightKg || null,
            primaryGoal: profileData.primaryGoal || null,
            activityLevel: profileData.activityLevel || null,
            currentStreak: profileData.currentStreak || 0,
            longestStreak: profileData.longestStreak || 0,
          }
        : null,
      recentMeals,
      weights,
    };
  } catch (error) {
    console.error('Error getting user details:', error);
    return { user: null, profile: null, recentMeals: [], weights: [], error: 'Failed to get user details' };
  }
}

// Send push notification to a single user
export async function sendPushNotification(options: {
  userId: string;
  title: string;
  body: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const admin = await verifyAdmin();
  if (!admin) {
    return { success: false, error: 'Unauthorized' };
  }

  const { userId, title, body } = options;

  try {
    const { db } = getFirebaseAdmin();
    const { getMessaging } = await import('firebase-admin/messaging');

    // Get user's FCM token
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return { success: false, error: 'User not found' };
    }

    const fcmToken = userDoc.data()?.fcmToken;
    if (!fcmToken) {
      return { success: false, error: 'User has no FCM token (notifications not enabled)' };
    }

    const messaging = getMessaging();
    const messageId = await messaging.send({
      token: fcmToken,
      notification: { title, body },
    });

    // Log the notification with message ID
    await db.collection('adminAuditLog').add({
      action: 'push_notification_sent',
      adminId: admin.uid,
      adminEmail: admin.email,
      details: { userId, title, body, messageId },
      timestamp: new Date(),
    });

    console.log(`Push notification sent successfully. MessageId: ${messageId}`);
    return { success: true, messageId };
  } catch (error: unknown) {
    console.error('Error sending push notification:', error);

    // Handle specific FCM errors
    const errorCode = (error as { code?: string })?.code;
    const errorMessage = (error as { message?: string })?.message;

    if (errorCode === 'messaging/invalid-registration-token' ||
        errorCode === 'messaging/registration-token-not-registered') {
      return {
        success: false,
        error: 'Invalid or expired FCM token. User may have uninstalled the app or disabled notifications.'
      };
    }

    return { success: false, error: errorMessage || 'Failed to send notification' };
  }
}

// Send bulk push notifications with filters
export async function sendBulkNotification(options: {
  title: string;
  body: string;
  filters: {
    language?: string;
    isPremium?: boolean;
    hasNotifications?: boolean;
  };
  dryRun?: boolean;
}): Promise<{ success: boolean; sentCount?: number; matchedCount?: number; error?: string }> {
  const admin = await verifyAdmin();
  if (!admin) {
    return { success: false, error: 'Unauthorized' };
  }

  const { title, body, filters, dryRun = false } = options;

  try {
    const { db } = getFirebaseAdmin();
    const { getMessaging } = await import('firebase-admin/messaging');

    // Build query based on filters
    let query: FirebaseFirestore.Query = db.collection('users');

    if (filters.language) {
      query = query.where('languageSelected', '==', filters.language);
    }
    if (filters.isPremium !== undefined) {
      query = query.where('isPremium', '==', filters.isPremium);
    }
    if (filters.hasNotifications) {
      query = query.where('notificationsEnabled', '==', true);
    }

    const snapshot = await query.get();
    const usersWithTokens = snapshot.docs.filter((doc) => doc.data().fcmToken);

    if (dryRun) {
      return {
        success: true,
        matchedCount: snapshot.docs.length,
        sentCount: usersWithTokens.length,
      };
    }

    const messaging = getMessaging();
    let sentCount = 0;

    // Send notifications one-by-one (safe, ~1-3 min for 1000 users)
    for (const userDoc of usersWithTokens) {
      const fcmToken = userDoc.data().fcmToken;
      try {
        await messaging.send({
          token: fcmToken,
          notification: { title, body },
        });
        sentCount++;
      } catch (err) {
        console.error(`Failed to send to user ${userDoc.id}:`, err);
      }
    }

    // Log the bulk notification
    await db.collection('adminAuditLog').add({
      action: 'bulk_notification_sent',
      adminId: admin.uid,
      adminEmail: admin.email,
      details: { title, body, filters, matchedCount: snapshot.docs.length, sentCount },
      timestamp: new Date(),
    });

    return { success: true, matchedCount: snapshot.docs.length, sentCount };
  } catch (error) {
    console.error('Error sending bulk notifications:', error);
    return { success: false, error: 'Failed to send notifications' };
  }
}

// List feedback from users
export async function listFeedback(options: {
  pageSize?: number;
  status?: string | null;
}): Promise<{
  feedback: Array<{
    id: string;
    userId: string;
    userEmail: string | null;
    category: string;
    message: string;
    platform: string;
    appVersion: string;
    status: string;
    createdAt: string | null;
  }>;
  error?: string;
}> {
  const admin = await verifyAdmin();
  if (!admin) {
    return { feedback: [], error: 'Unauthorized' };
  }

  const { pageSize = 50, status } = options;

  try {
    const { db } = getFirebaseAdmin();
    let query = db.collection('feedback').orderBy('createdAt', 'desc').limit(pageSize);

    if (status) {
      query = db
        .collection('feedback')
        .where('status', '==', status)
        .orderBy('createdAt', 'desc')
        .limit(pageSize);
    }

    const snapshot = await query.get();

    const feedback = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId || '',
        userEmail: data.userEmail || null,
        category: data.category || 'general',
        message: data.message || '',
        platform: data.platform || 'unknown',
        appVersion: data.appVersion || '',
        status: data.status || 'new',
        createdAt: data.createdAt ? new Date(data.createdAt).toISOString() : null,
      };
    });

    return { feedback };
  } catch (error) {
    console.error('Error listing feedback:', error);
    return { feedback: [], error: 'Failed to list feedback' };
  }
}

// Update feedback status
export async function updateFeedbackStatus(
  feedbackId: string,
  status: 'new' | 'in_progress' | 'resolved'
): Promise<{ success: boolean; error?: string }> {
  const admin = await verifyAdmin();
  if (!admin) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const { db } = getFirebaseAdmin();
    await db.collection('feedback').doc(feedbackId).update({
      status,
      updatedAt: new Date(),
      updatedBy: admin.email,
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating feedback status:', error);
    return { success: false, error: 'Failed to update status' };
  }
}

// Grant RevenueCat entitlement to a user
export async function grantUserEntitlement(options: {
  userId: string;
  entitlementId?: string;
  duration?: 'yearly' | 'lifetime' | 'monthly';
}): Promise<{ success: boolean; error?: string }> {
  const admin = await verifyAdmin();
  if (!admin) {
    return { success: false, error: 'Unauthorized' };
  }

  const { userId, entitlementId = 'Pro', duration = 'yearly' } = options;

  const secretKey = process.env.REVENUECAT_SECRET_KEY;
  if (!secretKey) {
    return { success: false, error: 'RevenueCat API key not configured' };
  }

  try {
    const url = `${REVENUECAT_API_URL}/subscribers/${encodeURIComponent(userId)}/entitlements/${encodeURIComponent(entitlementId)}/promotional`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ duration }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('RevenueCat API error:', errorData);
      return {
        success: false,
        error: `RevenueCat error: ${response.status} - ${errorData.message || response.statusText}`,
      };
    }

    // Log to audit trail
    const { db } = getFirebaseAdmin();
    await db.collection('adminAuditLog').add({
      action: 'entitlement_granted',
      adminId: admin.uid,
      adminEmail: admin.email,
      details: { userId, entitlementId, duration },
      timestamp: new Date(),
    });

    return { success: true };
  } catch (error) {
    console.error('Error granting entitlement:', error);
    return { success: false, error: 'Failed to grant entitlement' };
  }
}
