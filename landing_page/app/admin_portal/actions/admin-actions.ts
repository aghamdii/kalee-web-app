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
    subscriptionStatus: 'active' | 'trial' | 'grace' | 'expired' | 'free' | 'unknown';
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

    // Helper to determine subscription status from RevenueCat data
    function getSubStatus(rcData: FirebaseFirestore.DocumentData | undefined): 'active' | 'trial' | 'grace' | 'expired' | 'free' | 'unknown' {
      if (!rcData) return 'unknown';
      const entitlements = rcData.entitlements || {};
      const proEnt = entitlements['Pro'];
      if (!proEnt) return 'free';

      const expiresDate = proEnt.expires_date;
      const isLifetime = expiresDate === null;
      const isActive = isLifetime || (expiresDate && new Date(expiresDate) > new Date());

      if (!isActive) return 'expired';

      // Check grace period
      const gracePeriod = proEnt.grace_period_expires_date;
      if (gracePeriod && new Date(gracePeriod) > new Date()) return 'grace';

      // Check trial
      const productId = proEnt.product_identifier;
      const sub = productId ? (rcData.subscriptions || {})[productId] : null;
      if (sub?.period_type === 'trial') return 'trial';

      return 'active';
    }

    // If searching by userId, get the specific document
    if (searchQuery && searchQuery.trim() && searchType === 'userId') {
      const userDoc = await db.collection('users').doc(searchQuery.trim()).get();
      if (userDoc.exists) {
        const data = userDoc.data()!;
        const rcDoc = await db.collection('revenuecatCustomersInfo').doc(searchQuery.trim()).get();
        return {
          users: [{
            id: userDoc.id,
            email: data.email || null,
            displayName: data.displayName || null,
            createdAt: data.createdAt ? new Date(data.createdAt).toISOString() : null,
            notificationsEnabled: data.notificationsEnabled || false,
            languageSelected: data.languageSelected || 'en',
            subscriptionStatus: getSubStatus(rcDoc.exists ? rcDoc.data() : undefined),
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

    // Batch-fetch RevenueCat data for all users in this page (single getAll call)
    const rcRefs = snapshot.docs.map((doc) => db.collection('revenuecatCustomersInfo').doc(doc.id));
    const rcDocs = rcRefs.length > 0 ? await db.getAll(...rcRefs) : [];
    const rcMap = new Map<string, FirebaseFirestore.DocumentData>();
    rcDocs.forEach((doc) => {
      if (doc.exists) rcMap.set(doc.id, doc.data()!);
    });

    const users = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        email: data.email || null,
        displayName: data.displayName || null,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        notificationsEnabled: data.notificationsEnabled || false,
        languageSelected: data.languageSelected || 'en',
        subscriptionStatus: getSubStatus(rcMap.get(doc.id)),
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
  type: 'single_use' | 'discount';
  // Gift code fields
  entitlementId?: string;
  durationDays?: number;
  // Discount code fields
  offeringId?: string;
  affiliateId?: string;
  note?: string;
  // Shared fields
  customCode?: string;
  maxUses?: number;
  expiresAt?: string | null;
}): Promise<{ success: boolean; code?: string; error?: string }> {
  const admin = await verifyAdmin();
  if (!admin) {
    return { success: false, error: 'Unauthorized' };
  }

  const {
    type = 'single_use',
    entitlementId = 'Pro',
    durationDays = 365,
    offeringId,
    affiliateId,
    note,
    customCode,
    maxUses,
    expiresAt,
  } = options;

  // Validate discount-specific requirements
  if (type === 'discount') {
    if (!offeringId) {
      return { success: false, error: 'Offering ID is required for discount codes' };
    }
    if (maxUses === undefined) {
      return { success: false, error: 'Max uses is required for discount codes' };
    }
  }

  try {
    const { db } = getFirebaseAdmin();

    let code = '';

    if (customCode) {
      // Use custom code (normalize to uppercase, alphanumeric + underscores)
      code = customCode.trim().toUpperCase();
      if (!/^[A-Z0-9_]+$/.test(code)) {
        return { success: false, error: 'Code must be alphanumeric (letters, numbers, underscores only)' };
      }
      const existing = await db.collection('promoCodes').doc(code).get();
      if (existing.exists) {
        return { success: false, error: `Code "${code}" already exists` };
      }
    } else {
      // Auto-generate unique code
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
    }

    const now = new Date();

    // Build document based on type
    const promoCode: Record<string, unknown> = {
      code,
      type,
      maxUses: type === 'single_use' ? 1 : maxUses!,
      usedCount: 0,
      status: 'active',
      createdBy: admin.uid,
      createdByEmail: admin.email,
      createdAt: now,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      redemptions: [],
    };

    if (type === 'single_use') {
      promoCode.entitlementId = entitlementId;
      promoCode.durationDays = durationDays;
    } else {
      promoCode.offeringId = offeringId;
      promoCode.affiliateId = affiliateId || null;
      promoCode.note = note || null;
    }

    await db.collection('promoCodes').doc(code).set(promoCode);

    // Log to audit trail
    await db.collection('adminAuditLog').add({
      action: 'promo_code_generated',
      adminId: admin.uid,
      adminEmail: admin.email,
      details: {
        code,
        type,
        ...(type === 'single_use'
          ? { entitlementId, durationDays }
          : { offeringId, affiliateId, note, maxUses }),
      },
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
  type?: string | null;
}): Promise<{
  promoCodes: Array<{
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
  }>;
  error?: string;
}> {
  const admin = await verifyAdmin();
  if (!admin) {
    return { promoCodes: [], error: 'Unauthorized' };
  }

  const { pageSize = 50, status, type } = options;

  try {
    const { db } = getFirebaseAdmin();
    let query: FirebaseFirestore.Query = db.collection('promoCodes').orderBy('createdAt', 'desc').limit(pageSize);

    if (status) {
      query = db
        .collection('promoCodes')
        .where('status', '==', status)
        .orderBy('createdAt', 'desc')
        .limit(pageSize);
    }

    const snapshot = await query.get();

    // Build base list
    let promoCodes = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        code: data.code,
        type: data.type || 'single_use',
        status: data.status,
        entitlementId: data.entitlementId || null,
        durationDays: data.durationDays ?? null,
        offeringId: data.offeringId || null,
        affiliateId: data.affiliateId || null,
        note: data.note || null,
        usedCount: data.usedCount ?? 0,
        maxUses: data.maxUses,
        createdByEmail: data.createdByEmail,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        expiresAt: data.expiresAt?.toDate?.()?.toISOString() || null,
        reservedFor: data.reservedFor || null,
        reservedBy: data.reservedBy || null,
      };
    });

    // For discount codes, derive usedCount live from affiliateTransactions count()
    // (counts unique INITIAL_PURCHASE events — i.e. unique users who purchased).
    // count() aggregations are server-side and don't read full documents.
    const discountCodes = promoCodes.filter((p) => p.type === 'discount');
    if (discountCodes.length > 0) {
      const counts = await Promise.all(
        discountCodes.map(async (p) => {
          try {
            const aggSnap = await db
              .collection('affiliateTransactions')
              .where('promoCode', '==', p.code)
              .where('transactionType', '==', 'initial_purchase')
              .count()
              .get();
            return { code: p.code, count: aggSnap.data().count };
          } catch (err) {
            console.error('count() failed for code', p.code, err);
            return { code: p.code, count: p.usedCount }; // fall back to stored value
          }
        }),
      );
      const countMap = new Map(counts.map((c) => [c.code, c.count]));
      promoCodes = promoCodes.map((p) =>
        p.type === 'discount' ? { ...p, usedCount: countMap.get(p.code) ?? p.usedCount } : p,
      );
    }

    // Filter by type client-side (avoids composite index requirement)
    if (type) {
      promoCodes = promoCodes.filter((p) => p.type === type);
    }

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
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          defaultVibrateTimings: true,
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
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
      // Clean up the stale token
      try {
        const { db: fireDb } = getFirebaseAdmin();
        await fireDb.collection('users').doc(userId).update({ fcmToken: null });
        console.log(`Cleaned stale FCM token for user ${userId}`);
      } catch (cleanupErr) {
        console.error(`Failed to clean stale token for user ${userId}:`, cleanupErr);
      }
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
}): Promise<{ success: boolean; sentCount?: number; matchedCount?: number; failedCount?: number; error?: string }> {
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

    // Paginate through users to avoid loading all into memory
    const PAGE_SIZE = 500;
    let matchedCount = 0;
    let sentCount = 0;
    let failedCount = 0;
    let lastDoc: FirebaseFirestore.DocumentSnapshot | null = null;
    const staleTokenUserIds: string[] = [];

    const messaging = getMessaging();

    while (true) {
      let pageQuery = query.limit(PAGE_SIZE);
      if (lastDoc) {
        pageQuery = pageQuery.startAfter(lastDoc);
      }

      const snapshot = await pageQuery.get();
      if (snapshot.empty) break;

      matchedCount += snapshot.docs.length;
      lastDoc = snapshot.docs[snapshot.docs.length - 1];

      const usersWithTokens = snapshot.docs.filter((doc) => doc.data().fcmToken);

      if (dryRun) {
        sentCount += usersWithTokens.length;
        if (snapshot.docs.length < PAGE_SIZE) break;
        continue;
      }

      // Build FCM messages for batch sending
      const messages = usersWithTokens.map((doc) => ({
        token: doc.data().fcmToken as string,
        notification: { title, body },
        android: {
          priority: 'high' as const,
          notification: {
            sound: 'default',
            defaultVibrateTimings: true,
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      }));

      // sendEach handles up to 500 messages per call
      const batchResponse = await messaging.sendEach(messages);
      sentCount += batchResponse.successCount;
      failedCount += batchResponse.failureCount;

      // Clean up stale tokens for failed sends
      batchResponse.responses.forEach((resp, idx) => {
        if (resp.error) {
          const code = resp.error.code;
          if (
            code === 'messaging/invalid-registration-token' ||
            code === 'messaging/registration-token-not-registered'
          ) {
            staleTokenUserIds.push(usersWithTokens[idx].id);
          }
        }
      });

      if (snapshot.docs.length < PAGE_SIZE) break;
    }

    if (dryRun) {
      return {
        success: true,
        matchedCount,
        sentCount,
      };
    }

    // Remove stale FCM tokens in batches
    if (staleTokenUserIds.length > 0) {
      const BATCH_SIZE = 500;
      for (let i = 0; i < staleTokenUserIds.length; i += BATCH_SIZE) {
        const batch = db.batch();
        const chunk = staleTokenUserIds.slice(i, i + BATCH_SIZE);
        for (const userId of chunk) {
          batch.update(db.collection('users').doc(userId), {
            fcmToken: null,
          });
        }
        await batch.commit();
      }
      console.log(`Cleaned up ${staleTokenUserIds.length} stale FCM tokens`);
    }

    // Log the bulk notification
    await db.collection('adminAuditLog').add({
      action: 'bulk_notification_sent',
      adminId: admin.uid,
      adminEmail: admin.email,
      details: {
        title,
        body,
        filters,
        matchedCount,
        sentCount,
        failedCount,
        staleTokensCleaned: staleTokenUserIds.length,
      },
      timestamp: new Date(),
    });

    return { success: true, matchedCount, sentCount, failedCount };
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

// List notification history from audit log
export async function listNotificationHistory(options: {
  pageSize?: number;
}): Promise<{
  notifications: Array<{
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
  }>;
  error?: string;
}> {
  const admin = await verifyAdmin();
  if (!admin) {
    return { notifications: [], error: 'Unauthorized' };
  }

  const { pageSize = 20 } = options;

  try {
    const { db } = getFirebaseAdmin();
    const snapshot = await db
      .collection('adminAuditLog')
      .where('action', '==', 'bulk_notification_sent')
      .orderBy('timestamp', 'desc')
      .limit(pageSize)
      .get();

    const notifications = snapshot.docs.map((doc) => {
      const data = doc.data();
      const details = data.details || {};
      return {
        id: doc.id,
        title: details.title || '',
        body: details.body || '',
        language: details.filters?.language || null,
        isPremium: details.filters?.isPremium !== undefined
          ? (details.filters.isPremium ? 'Premium' : 'Free')
          : null,
        matchedCount: details.matchedCount || 0,
        sentCount: details.sentCount || 0,
        failedCount: details.failedCount || 0,
        staleTokensCleaned: details.staleTokensCleaned || 0,
        durationMs: details.durationMs || null,
        adminEmail: data.adminEmail || '',
        timestamp: data.timestamp?.toDate?.()?.toISOString() || null,
      };
    });

    return { notifications };
  } catch (error) {
    console.error('Error listing notification history:', error);
    return { notifications: [], error: 'Failed to list notification history' };
  }
}

// Fetch all user insights (no server-side filtering — filtering/aggregation done client-side)
export async function fetchAllInsights(): Promise<{
  insights: Array<{
    userId: string;
    acquisitionSource: string | null;
    acquisitionSourceOther: string | null;
    influencerName: string | null;
    primaryMotivation: string | null;
    currentTrackingMethod: string | null;
    trackingAppName: string | null;
    eatingHabits: string | null;
    locale: string;
    platform: string;
    appVersion: string;
    completedAt: string | null;
  }>;
  error?: string;
}> {
  const admin = await verifyAdmin();
  if (!admin) {
    return { insights: [], error: 'Unauthorized' };
  }

  try {
    const { db } = getFirebaseAdmin();
    const snapshot = await db.collection('userInsights').get();

    const insights = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        userId: doc.id,
        acquisitionSource: data.acquisitionSource || null,
        acquisitionSourceOther: data.acquisitionSourceOther || null,
        influencerName: data.influencerName || null,
        primaryMotivation: data.primaryMotivation || null,
        currentTrackingMethod: data.currentTrackingMethod || null,
        trackingAppName: data.trackingAppName || null,
        eatingHabits: data.eatingHabits || null,
        locale: data.locale || 'en',
        platform: data.platform || 'unknown',
        appVersion: data.appVersion || '',
        completedAt: data.completedAt ? new Date(data.completedAt).toISOString() : null,
      };
    });

    return { insights };
  } catch (error) {
    console.error('Error fetching insights:', error);
    return { insights: [], error: 'Failed to fetch insights' };
  }
}

// Get RevenueCat customer info and subscription events for a user
export async function getUserSubscriptionInfo(userId: string): Promise<{
  customerInfo: {
    entitlements: Record<string, {
      expires_date: string | null;
      grace_period_expires_date: string | null;
      product_identifier: string;
      purchase_date: string;
    }>;
    subscriptions: Record<string, {
      auto_resume_date: string | null;
      billing_issues_detected_at: string | null;
      display_name: string | null;
      expires_date: string;
      grace_period_expires_date: string | null;
      is_sandbox: boolean;
      original_purchase_date: string;
      ownership_type: string;
      period_type: string;
      price: { amount: number; currency: string } | null;
      purchase_date: string;
      refunded_at: string | null;
      store: string;
      store_transaction_id: string;
      unsubscribe_detected_at: string | null;
    }>;
    non_subscriptions: Record<string, unknown>;
    original_app_user_id: string;
    first_seen: string;
    last_seen: string;
    management_url: string | null;
    aliases: string[];
  } | null;
  events: Array<{
    id: string;
    type: string;
    event_timestamp_ms: number;
    product_id: string | null;
    store: string | null;
    expiration_at_ms: number | null;
    [key: string]: unknown;
  }>;
  error?: string;
}> {
  const admin = await verifyAdmin();
  if (!admin) {
    return { customerInfo: null, events: [], error: 'Unauthorized' };
  }

  try {
    const { db } = getFirebaseAdmin();

    // Fetch customer info
    const customerDoc = await db.collection('revenuecatCustomersInfo').doc(userId).get();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = customerDoc.exists ? (customerDoc.data() as any) : null;
    const customerInfo = raw ? {
      entitlements: (raw.entitlements || {}) as Record<string, { expires_date: string | null; grace_period_expires_date: string | null; product_identifier: string; purchase_date: string }>,
      subscriptions: (raw.subscriptions || {}) as Record<string, { auto_resume_date: string | null; billing_issues_detected_at: string | null; display_name: string | null; expires_date: string; grace_period_expires_date: string | null; is_sandbox: boolean; original_purchase_date: string; ownership_type: string; period_type: string; price: { amount: number; currency: string } | null; purchase_date: string; refunded_at: string | null; store: string; store_transaction_id: string; unsubscribe_detected_at: string | null }>,
      non_subscriptions: (raw.non_subscriptions || {}) as Record<string, unknown>,
      original_app_user_id: raw.original_app_user_id || '',
      first_seen: raw.first_seen || '',
      last_seen: raw.last_seen || '',
      management_url: raw.management_url || null,
      aliases: (raw.aliases || []) as string[],
    } : null;

    // Fetch subscription events (separate try/catch so a missing index doesn't hide customerInfo)
    let events: Array<{
      id: string;
      type: string;
      event_timestamp_ms: number;
      product_id: string | null;
      store: string | null;
      expiration_at_ms: number | null;
    }> = [];

    try {
      const eventsSnapshot = await db
        .collection('revenuecatSubscriptionEvents')
        .where('app_user_id', '==', userId)
        .orderBy('event_timestamp_ms', 'desc')
        .limit(20)
        .get();

      events = eventsSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          type: data.type || 'unknown',
          event_timestamp_ms: data.event_timestamp_ms || 0,
          product_id: data.product_id || null,
          store: data.store || null,
          expiration_at_ms: data.expiration_at_ms || null,
        };
      });

      // If no events found by app_user_id, try aliases
      if (events.length === 0 && customerInfo?.aliases) {
        for (const alias of customerInfo.aliases) {
          if (alias === userId) continue;
          const aliasSnapshot = await db
            .collection('revenuecatSubscriptionEvents')
            .where('app_user_id', '==', alias)
            .orderBy('event_timestamp_ms', 'desc')
            .limit(20)
            .get();
          if (!aliasSnapshot.empty) {
            events = aliasSnapshot.docs.map((doc) => {
              const data = doc.data();
              return {
                id: doc.id,
                type: data.type || 'unknown',
                event_timestamp_ms: data.event_timestamp_ms || 0,
                product_id: data.product_id || null,
                store: data.store || null,
                expiration_at_ms: data.expiration_at_ms || null,
              };
            });
            break;
          }
        }
      }
    } catch (eventsError) {
      console.error('Error fetching subscription events (may need composite index):', eventsError);
      // Continue — customerInfo is still valid
    }

    return {
      customerInfo: customerInfo || null,
      events,
    };
  } catch (error) {
    console.error('Error fetching subscription info:', error);
    return { customerInfo: null, events: [], error: 'Failed to fetch subscription info' };
  }
}

// Get user insights (onboarding survey) for a single user
export async function getUserInsight(userId: string): Promise<{
  insight: {
    acquisitionSource: string | null;
    acquisitionSourceOther: string | null;
    influencerName: string | null;
    primaryMotivation: string | null;
    currentTrackingMethod: string | null;
    trackingAppName: string | null;
    eatingHabits: string | null;
    locale: string;
    platform: string;
    appVersion: string;
    completedAt: string | null;
  } | null;
  error?: string;
}> {
  const admin = await verifyAdmin();
  if (!admin) {
    return { insight: null, error: 'Unauthorized' };
  }

  try {
    const { db } = getFirebaseAdmin();
    const doc = await db.collection('userInsights').doc(userId).get();

    if (!doc.exists) {
      return { insight: null };
    }

    const data = doc.data()!;
    return {
      insight: {
        acquisitionSource: data.acquisitionSource || null,
        acquisitionSourceOther: data.acquisitionSourceOther || null,
        influencerName: data.influencerName || null,
        primaryMotivation: data.primaryMotivation || null,
        currentTrackingMethod: data.currentTrackingMethod || null,
        trackingAppName: data.trackingAppName || null,
        eatingHabits: data.eatingHabits || null,
        locale: data.locale || 'en',
        platform: data.platform || 'unknown',
        appVersion: data.appVersion || '',
        completedAt: data.completedAt ? new Date(data.completedAt).toISOString() : null,
      },
    };
  } catch (error) {
    console.error('Error fetching user insight:', error);
    return { insight: null, error: 'Failed to fetch insight' };
  }
}

// List discount transactions for a specific promo code
export async function listDiscountTransactions(options: {
  promoCode: string;
  pageSize?: number;
  lastDocId?: string | null;
  statusFilter?: string | null;
  planTypeFilter?: string | null;
  platformFilter?: string | null;
}): Promise<{
  transactions: Array<{
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
    statusHistory: Array<{
      event: string;
      timestamp: string | null;
      rcEventType: string;
    }>;
  }>;
  summary: {
    totalUsers: number;
    trialActive: number;
    convertedPaid: number;
    monthlyPaid: number;
    totalRevenue: Record<string, number>; // keyed by currency
  };
  hasMore: boolean;
  error?: string;
}> {
  const admin = await verifyAdmin();
  if (!admin) {
    return {
      transactions: [],
      summary: { totalUsers: 0, trialActive: 0, convertedPaid: 0, monthlyPaid: 0, totalRevenue: {} },
      hasMore: false,
      error: 'Unauthorized',
    };
  }

  const { promoCode, pageSize = 50, lastDocId, statusFilter, planTypeFilter, platformFilter } = options;

  try {
    const { db } = getFirebaseAdmin();

    // Fetch all transactions for this promo code (for summary calculation)
    const allSnapshot = await db
      .collection('discountTransactions')
      .where('promoCode', '==', promoCode.toUpperCase())
      .orderBy('createdAt', 'desc')
      .get();

    // Compute summary from all transactions
    let trialActive = 0;
    let convertedPaid = 0;
    let monthlyPaid = 0;
    const totalRevenue: Record<string, number> = {};

    const allDocs = allSnapshot.docs.map((doc) => {
      const data = doc.data();
      const status = data.status as string;
      const initialStatus = data.initialStatus as string;
      const planType = data.planType as string;
      const price = data.price as number;
      const currency = data.currency as string;

      if (status === 'trial') trialActive++;
      if (status === 'paid' && initialStatus === 'trial') convertedPaid++;
      if (status === 'paid' && planType === 'monthly') monthlyPaid++;
      if (status === 'paid') {
        totalRevenue[currency] = (totalRevenue[currency] || 0) + price;
      }

      return {
        id: doc.id,
        promoCode: data.promoCode,
        rcAppUserId: data.rcAppUserId || '',
        firebaseUserId: data.firebaseUserId || '',
        planType: data.planType || '',
        price: data.price || 0,
        currency: data.currency || '',
        platform: data.platform || '',
        status: data.status || '',
        initialStatus: data.initialStatus || '',
        trialStartedAt: data.trialStartedAt?.toDate?.()?.toISOString() || null,
        convertedAt: data.convertedAt?.toDate?.()?.toISOString() || null,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        statusHistory: (data.statusHistory || []).map((entry: { event?: string; timestamp?: { toDate?: () => Date }; rcEventType?: string }) => ({
          event: entry.event || '',
          timestamp: entry.timestamp?.toDate?.()?.toISOString() || null,
          rcEventType: entry.rcEventType || '',
        })),
      };
    });

    // Apply client-side filters
    let filtered = allDocs;
    if (statusFilter) {
      filtered = filtered.filter((t) => t.status === statusFilter);
    }
    if (planTypeFilter) {
      filtered = filtered.filter((t) => t.planType === planTypeFilter);
    }
    if (platformFilter) {
      filtered = filtered.filter((t) => t.platform === platformFilter);
    }

    // Apply pagination
    let startIndex = 0;
    if (lastDocId) {
      const idx = filtered.findIndex((t) => t.id === lastDocId);
      if (idx !== -1) startIndex = idx + 1;
    }

    const paginated = filtered.slice(startIndex, startIndex + pageSize);

    return {
      transactions: paginated,
      summary: {
        totalUsers: allSnapshot.size,
        trialActive,
        convertedPaid,
        monthlyPaid,
        totalRevenue,
      },
      hasMore: startIndex + pageSize < filtered.length,
    };
  } catch (error) {
    console.error('Error listing discount transactions:', error);
    return {
      transactions: [],
      summary: { totalUsers: 0, trialActive: 0, convertedPaid: 0, monthlyPaid: 0, totalRevenue: {} },
      hasMore: false,
      error: 'Failed to list discount transactions',
    };
  }
}

// ============================================================================
// AFFILIATE TRANSACTIONS (new collection — server-driven from RevenueCat events)
// ============================================================================

export interface AffiliateTransactionRow {
  id: string;
  rcEventId: string;
  rcTransactionId: string | null;
  originalTransactionId: string | null;
  rcAppUserId: string;
  firebaseUserId: string;
  promoCode: string;
  affiliateId: string | null;
  transactionType: string;
  isTrialConversion: boolean;
  isDiscountedProduct: boolean;
  periodType: string;
  renewalNumber: number | null;
  productIdentifier: string;
  offeringId: string | null;
  planType: string;
  platform: string;
  store: string;
  environment: string;
  price: number;
  currency: string;
  priceUsd: number;
  commissionPercentage: number | null;
  takehomePercentage: number | null;
  taxPercentage: number | null;
  countryCode: string | null;
  isTrial: boolean;
  isPaidTransaction: boolean;
  isRefunded: boolean;
  priceUsdRefunded: number;
  refundedAt: string | null;
  refundEventId: string | null;
  payoutId: string | null;
  settledAt: string | null;
  settledBy: string | null;
  isClawback: boolean;
  purchasedAt: string | null;
  expiresAt: string | null;
  createdAt: string | null;
}

export interface AffiliateTransactionsSummary {
  totalCharges: number;
  trialsActive: number;
  convertedPaid: number;
  initialPaid: number;
  renewals: number;
  lifetimeRevenueUsd: number;
  lifetimeRevenueByCurrency: Record<string, number>;
  readyToSettleUsd: number;
  settledUsd: number;
  clawbackUsd: number;
  clawbackCount: number;
  refundedUsd: number;
}

const REFUND_WINDOW_DAYS = 45;

function mapAffiliateTransactionDoc(
  doc: FirebaseFirestore.QueryDocumentSnapshot,
): AffiliateTransactionRow {
  const d = doc.data();
  return {
    id: doc.id,
    rcEventId: d.rcEventId || doc.id,
    rcTransactionId: d.rcTransactionId || null,
    originalTransactionId: d.originalTransactionId || null,
    rcAppUserId: d.rcAppUserId || '',
    firebaseUserId: d.firebaseUserId || '',
    promoCode: d.promoCode || '',
    affiliateId: d.affiliateId || null,
    transactionType: d.transactionType || '',
    isTrialConversion: d.isTrialConversion === true,
    isDiscountedProduct: d.isDiscountedProduct === true,
    periodType: d.periodType || '',
    renewalNumber: d.renewalNumber ?? null,
    productIdentifier: d.productIdentifier || '',
    offeringId: d.offeringId || null,
    planType: d.planType || '',
    platform: d.platform || '',
    store: d.store || '',
    environment: d.environment || '',
    price: d.price ?? 0,
    currency: d.currency || '',
    priceUsd: d.priceUsd ?? 0,
    commissionPercentage: d.commissionPercentage ?? null,
    takehomePercentage: d.takehomePercentage ?? null,
    taxPercentage: d.taxPercentage ?? null,
    countryCode: d.countryCode || null,
    isTrial: d.isTrial === true,
    isPaidTransaction: d.isPaidTransaction === true,
    isRefunded: d.isRefunded === true,
    priceUsdRefunded: d.priceUsdRefunded ?? 0,
    refundedAt: d.refundedAt?.toDate?.()?.toISOString() || null,
    refundEventId: d.refundEventId || null,
    payoutId: d.payoutId || null,
    settledAt: d.settledAt?.toDate?.()?.toISOString() || null,
    settledBy: d.settledBy || null,
    isClawback: d.isClawback === true,
    purchasedAt: d.purchasedAt?.toDate?.()?.toISOString() || null,
    expiresAt: d.expiresAt?.toDate?.()?.toISOString() || null,
    createdAt: d.createdAt?.toDate?.()?.toISOString() || null,
  };
}

/**
 * NOTE: settlementState is a pure helper used in UI as well. It's duplicated
 * inline in the client component since 'use server' files can only export
 * async functions. Server-side summaries in listAffiliateTransactions use this
 * via an inline copy below.
 */
function _settlementState(txn: {
  payoutId: string | null;
  isClawback: boolean;
  isRefunded: boolean;
  isPaidTransaction: boolean;
  purchasedAt: string | null;
}): string {
  if (txn.payoutId) return txn.isClawback ? 'clawback' : 'settled';
  if (txn.isRefunded) return 'refunded';
  if (!txn.isPaidTransaction) return 'not_eligible';

  const purchased = txn.purchasedAt ? new Date(txn.purchasedAt) : null;
  if (!purchased) return 'not_eligible';
  const ageDays = (Date.now() - purchased.getTime()) / (1000 * 60 * 60 * 24);
  if (ageDays < REFUND_WINDOW_DAYS) return 'in_window';
  return 'ready';
}

export async function listAffiliateTransactions(options: {
  promoCode: string;
  pageSize?: number;
  startDate?: string | null;
  endDate?: string | null;
  transactionType?: string | null;
  settlementFilter?: string | null;
  planType?: string | null;
  platform?: string | null;
  discountedProductOnly?: boolean;
}): Promise<{
  transactions: AffiliateTransactionRow[];
  summary: AffiliateTransactionsSummary;
  error?: string;
}> {
  const admin = await verifyAdmin();
  if (!admin) {
    return {
      transactions: [],
      summary: {
        totalCharges: 0, trialsActive: 0, convertedPaid: 0, initialPaid: 0, renewals: 0,
        lifetimeRevenueUsd: 0, lifetimeRevenueByCurrency: {},
        readyToSettleUsd: 0, settledUsd: 0, clawbackUsd: 0, clawbackCount: 0, refundedUsd: 0,
      },
      error: 'Unauthorized',
    };
  }

  const {
    promoCode, pageSize = 200,
    startDate, endDate,
    transactionType, settlementFilter,
    planType, platform, discountedProductOnly,
  } = options;

  try {
    const { db } = getFirebaseAdmin();
    const normalizedCode = promoCode.trim().toUpperCase();

    // Fetch all for this code so summary is accurate; paginate client-side
    const snapshot = await db
      .collection('affiliateTransactions')
      .where('promoCode', '==', normalizedCode)
      .orderBy('purchasedAt', 'desc')
      .limit(1000)
      .get();

    const allRows = snapshot.docs.map(mapAffiliateTransactionDoc);

    // Compute summary from ALL rows (pre-filter) — summary reflects the code's total activity
    let trialsActive = 0;
    let convertedPaid = 0;
    let initialPaid = 0;
    let renewals = 0;
    let lifetimeRevenueUsd = 0;
    const lifetimeRevenueByCurrency: Record<string, number> = {};
    let readyToSettleUsd = 0;
    let settledUsd = 0;
    let clawbackUsd = 0;
    let clawbackCount = 0;
    let refundedUsd = 0;

    for (const t of allRows) {
      // Trial active = this is the initial trial doc and not yet converted/expired via another doc
      if (t.transactionType === 'initial_purchase' && t.isTrial) trialsActive++;
      if (t.transactionType === 'trial_conversion') convertedPaid++;
      if (t.transactionType === 'initial_purchase' && !t.isTrial) initialPaid++;
      if (t.transactionType === 'renewal') renewals++;

      if (t.isPaidTransaction && !t.isRefunded) {
        lifetimeRevenueUsd += t.priceUsd;
        lifetimeRevenueByCurrency[t.currency] =
          (lifetimeRevenueByCurrency[t.currency] || 0) + t.price;
      }

      if (t.isRefunded) refundedUsd += t.priceUsdRefunded;
      if (t.isClawback) {
        clawbackUsd += t.priceUsdRefunded;
        clawbackCount++;
      }

      const state = _settlementState(t);
      if (state === 'ready') readyToSettleUsd += t.priceUsd;
      if (state === 'settled') settledUsd += t.priceUsd;
    }

    const summary: AffiliateTransactionsSummary = {
      totalCharges: allRows.length,
      trialsActive, convertedPaid, initialPaid, renewals,
      lifetimeRevenueUsd, lifetimeRevenueByCurrency,
      readyToSettleUsd, settledUsd, clawbackUsd, clawbackCount, refundedUsd,
    };

    // Apply filters for the returned transactions
    let filtered = allRows;

    if (startDate) {
      const start = new Date(startDate).getTime();
      filtered = filtered.filter((t) =>
        t.purchasedAt ? new Date(t.purchasedAt).getTime() >= start : false
      );
    }
    if (endDate) {
      const end = new Date(endDate).getTime() + 24 * 60 * 60 * 1000; // inclusive end-of-day
      filtered = filtered.filter((t) =>
        t.purchasedAt ? new Date(t.purchasedAt).getTime() <= end : false
      );
    }
    if (transactionType) {
      filtered = filtered.filter((t) => t.transactionType === transactionType);
    }
    if (planType) filtered = filtered.filter((t) => t.planType === planType);
    if (platform) filtered = filtered.filter((t) => t.platform === platform);
    if (discountedProductOnly) filtered = filtered.filter((t) => t.isDiscountedProduct);
    if (settlementFilter) {
      filtered = filtered.filter((t) => _settlementState(t) === settlementFilter);
    }

    return {
      transactions: filtered.slice(0, pageSize),
      summary,
    };
  } catch (error) {
    console.error('Error listing affiliate transactions:', error);
    return {
      transactions: [],
      summary: {
        totalCharges: 0, trialsActive: 0, convertedPaid: 0, initialPaid: 0, renewals: 0,
        lifetimeRevenueUsd: 0, lifetimeRevenueByCurrency: {},
        readyToSettleUsd: 0, settledUsd: 0, clawbackUsd: 0, clawbackCount: 0, refundedUsd: 0,
      },
      error: 'Failed to list affiliate transactions',
    };
  }
}

export async function bulkSettleAffiliateTransactions(options: {
  transactionIds: string[];
  promoCode: string;
  affiliateId: string | null;
  commissionRate: number;
  note?: string;
}): Promise<{ success: boolean; payoutId?: string; error?: string }> {
  const admin = await verifyAdmin();
  if (!admin) return { success: false, error: 'Unauthorized' };

  const { transactionIds, promoCode, affiliateId, commissionRate, note } = options;

  if (!transactionIds || transactionIds.length === 0) {
    return { success: false, error: 'No transactions selected' };
  }
  if (commissionRate < 0 || commissionRate > 1) {
    return { success: false, error: 'Commission rate must be between 0 and 1' };
  }

  try {
    const { db } = getFirebaseAdmin();
    const payoutRef = db.collection('payouts').doc();
    const txnRefs = transactionIds.map((id) => db.collection('affiliateTransactions').doc(id));
    const now = new Date();

    await db.runTransaction(async (trx) => {
      const txnDocs = await Promise.all(txnRefs.map((ref) => trx.get(ref)));

      let grossUsd = 0;
      const totalsByCurrency: Record<string, number> = {};
      let count = 0;

      for (const snap of txnDocs) {
        if (!snap.exists) continue;
        const data = snap.data()!;
        if (data.payoutId) {
          throw new Error(`Transaction ${snap.id} already settled in payout ${data.payoutId}`);
        }
        grossUsd += data.priceUsd || 0;
        const cur = data.currency || 'USD';
        totalsByCurrency[cur] = (totalsByCurrency[cur] || 0) + (data.price || 0);
        count++;
      }

      const commissionUsd = grossUsd * commissionRate;

      trx.set(payoutRef, {
        affiliateId: affiliateId || null,
        promoCode: promoCode.trim().toUpperCase(),
        transactionIds,
        transactionCount: count,
        grossUsd,
        commissionRate,
        commissionUsd,
        totalsByCurrency,
        status: 'pending',
        note: note || null,
        createdAt: now,
        createdBy: admin.email,
        paidAt: null,
        paidBy: null,
      });

      for (const ref of txnRefs) {
        trx.update(ref, {
          payoutId: payoutRef.id,
          settledAt: now,
          settledBy: admin.email,
        });
      }
    });

    // Audit log
    await db.collection('adminAuditLog').add({
      action: 'payout_created',
      adminId: admin.uid,
      adminEmail: admin.email,
      details: {
        payoutId: payoutRef.id,
        promoCode,
        affiliateId,
        transactionCount: transactionIds.length,
        commissionRate,
      },
      timestamp: now,
    });

    return { success: true, payoutId: payoutRef.id };
  } catch (error: unknown) {
    console.error('Error bulk-settling affiliate transactions:', error);
    const msg = error instanceof Error ? error.message : 'Failed to create payout';
    return { success: false, error: msg };
  }
}

export interface PayoutRow {
  id: string;
  affiliateId: string | null;
  promoCode: string;
  transactionCount: number;
  grossUsd: number;
  commissionRate: number;
  commissionUsd: number;
  totalsByCurrency: Record<string, number>;
  status: string;
  note: string | null;
  createdAt: string | null;
  createdBy: string;
  paidAt: string | null;
  paidBy: string | null;
}

export async function listPayouts(options: {
  promoCode?: string | null;
  affiliateId?: string | null;
  pageSize?: number;
}): Promise<{ payouts: PayoutRow[]; error?: string }> {
  const admin = await verifyAdmin();
  if (!admin) return { payouts: [], error: 'Unauthorized' };

  try {
    const { db } = getFirebaseAdmin();
    let query: FirebaseFirestore.Query = db.collection('payouts').orderBy('createdAt', 'desc');

    if (options.promoCode) {
      query = db
        .collection('payouts')
        .where('promoCode', '==', options.promoCode.trim().toUpperCase())
        .orderBy('createdAt', 'desc');
    } else if (options.affiliateId) {
      query = db
        .collection('payouts')
        .where('affiliateId', '==', options.affiliateId)
        .orderBy('createdAt', 'desc');
    }

    const snapshot = await query.limit(options.pageSize || 100).get();

    const payouts: PayoutRow[] = snapshot.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        affiliateId: d.affiliateId || null,
        promoCode: d.promoCode || '',
        transactionCount: d.transactionCount || 0,
        grossUsd: d.grossUsd || 0,
        commissionRate: d.commissionRate || 0,
        commissionUsd: d.commissionUsd || 0,
        totalsByCurrency: d.totalsByCurrency || {},
        status: d.status || 'pending',
        note: d.note || null,
        createdAt: d.createdAt?.toDate?.()?.toISOString() || null,
        createdBy: d.createdBy || '',
        paidAt: d.paidAt?.toDate?.()?.toISOString() || null,
        paidBy: d.paidBy || null,
      };
    });

    return { payouts };
  } catch (error) {
    console.error('Error listing payouts:', error);
    return { payouts: [], error: 'Failed to list payouts' };
  }
}

export async function getPayoutDetails(payoutId: string): Promise<{
  payout: PayoutRow | null;
  transactions: AffiliateTransactionRow[];
  error?: string;
}> {
  const admin = await verifyAdmin();
  if (!admin) return { payout: null, transactions: [], error: 'Unauthorized' };

  try {
    const { db } = getFirebaseAdmin();
    const doc = await db.collection('payouts').doc(payoutId).get();
    if (!doc.exists) return { payout: null, transactions: [], error: 'Payout not found' };

    const d = doc.data()!;
    const payout: PayoutRow = {
      id: doc.id,
      affiliateId: d.affiliateId || null,
      promoCode: d.promoCode || '',
      transactionCount: d.transactionCount || 0,
      grossUsd: d.grossUsd || 0,
      commissionRate: d.commissionRate || 0,
      commissionUsd: d.commissionUsd || 0,
      totalsByCurrency: d.totalsByCurrency || {},
      status: d.status || 'pending',
      note: d.note || null,
      createdAt: d.createdAt?.toDate?.()?.toISOString() || null,
      createdBy: d.createdBy || '',
      paidAt: d.paidAt?.toDate?.()?.toISOString() || null,
      paidBy: d.paidBy || null,
    };

    const ids: string[] = d.transactionIds || [];
    const transactions: AffiliateTransactionRow[] = [];
    if (ids.length > 0) {
      const refs = ids.map((id) => db.collection('affiliateTransactions').doc(id));
      const docs = await db.getAll(...refs);
      docs.forEach((docSnap) => {
        if (docSnap.exists) {
          transactions.push(
            mapAffiliateTransactionDoc(docSnap as FirebaseFirestore.QueryDocumentSnapshot)
          );
        }
      });
    }

    return { payout, transactions };
  } catch (error) {
    console.error('Error fetching payout details:', error);
    return { payout: null, transactions: [], error: 'Failed to fetch payout details' };
  }
}

export async function markPayoutAsPaid(options: {
  payoutId: string;
  note?: string;
}): Promise<{ success: boolean; error?: string }> {
  const admin = await verifyAdmin();
  if (!admin) return { success: false, error: 'Unauthorized' };

  try {
    const { db } = getFirebaseAdmin();
    const ref = db.collection('payouts').doc(options.payoutId);
    const doc = await ref.get();
    if (!doc.exists) return { success: false, error: 'Payout not found' };
    if (doc.data()?.status === 'paid') {
      return { success: false, error: 'Payout is already marked as paid' };
    }

    const now = new Date();
    await ref.update({
      status: 'paid',
      paidAt: now,
      paidBy: admin.email,
      ...(options.note ? { note: options.note } : {}),
    });

    await db.collection('adminAuditLog').add({
      action: 'payout_marked_paid',
      adminId: admin.uid,
      adminEmail: admin.email,
      details: { payoutId: options.payoutId, note: options.note || null },
      timestamp: now,
    });

    return { success: true };
  } catch (error) {
    console.error('Error marking payout as paid:', error);
    return { success: false, error: 'Failed to mark payout as paid' };
  }
}

// List RevenueCat subscription events where subscriber_attributes.discount_code matches the promo code
export async function listEventsByDiscountCode(options: {
  promoCode: string;
  pageSize?: number;
}): Promise<{
  events: Array<{
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
  }>;
  error?: string;
}> {
  const admin = await verifyAdmin();
  if (!admin) {
    return { events: [], error: 'Unauthorized' };
  }

  const { promoCode, pageSize = 100 } = options;
  const normalizedCode = promoCode.trim().toUpperCase();

  try {
    const { db } = getFirebaseAdmin();

    // Firestore supports dot notation for nested fields
    const snapshot = await db
      .collection('revenuecatSubscriptionEvents')
      .where('subscriber_attributes.discount_code.value', '==', normalizedCode)
      .orderBy('event_timestamp_ms', 'desc')
      .limit(pageSize)
      .get();

    const events = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        type: data.type || 'unknown',
        appUserId: data.app_user_id || '',
        productId: data.product_id || null,
        store: data.store || null,
        periodType: data.period_type || null,
        presentedOfferingId: data.presented_offering_id || null,
        price: data.price ?? null,
        priceInPurchasedCurrency: data.price_in_purchased_currency ?? null,
        currency: data.currency || null,
        isTrialConversion: data.is_trial_conversion ?? null,
        eventTimestampMs: data.event_timestamp_ms || null,
        expirationAtMs: data.expiration_at_ms || null,
        discountCode: data.subscriber_attributes?.discount_code?.value || null,
        transactionId: data.transaction_id || null,
      };
    });

    return { events };
  } catch (error) {
    console.error('Error listing events by discount code:', error);
    return { events: [], error: 'Failed to list events' };
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
