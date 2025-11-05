# Kalee Onboarding Notifications - Documentation

## Summary

Automated 3-day onboarding notification system that sends emotionally-resonant push notifications to new users at 24h, 48h, and 72h after profile creation.

### Flow Overview

```
User Signs Up
    ↓
Profile Created in Firestore (profiles/{profileId})
    ↓
scheduleOnboardingNotifications Function Triggers (Firestore onCreate)
    ↓
Fetches User Data from users/{profileId}
    ↓
Validates: notificationsEnabled === true
    ↓
Creates 3 Cloud Tasks (scheduled for 24h, 48h, 72h)
    ↓
Cloud Tasks Queue Waits...
    ↓
[At Scheduled Time: 24h, 48h, or 72h]
    ↓
Cloud Tasks POSTs to sendScheduledNotification (HTTP Function)
    ↓
Function Fetches Fresh User Data
    ↓
Validates: notificationsEnabled && fcmToken exists
    ↓
Sends Push Notification via Firebase Cloud Messaging (FCM)
    ↓
Logs to notificationLogs Collection
```

---

## Architecture

### Components

1. **Firestore Trigger Function**: `scheduleOnboardingNotifications`
   - Triggers: `profiles/{profileId}` onCreate
   - Purpose: Schedule 3 Cloud Tasks
   - Runtime: Node.js 22
   - Region: europe-west1

2. **HTTP Function**: `sendScheduledNotification`
   - Trigger: Cloud Tasks HTTP POST
   - Purpose: Send FCM notification
   - Runtime: Node.js 22
   - Region: europe-west1

3. **Cloud Tasks Queue**: `onboarding-notifications`
   - Purpose: Delayed task execution
   - Location: europe-west1

4. **Firestore Collections**:
   - `profiles/{profileId}` - Trigger source
   - `users/{profileId}` - User settings (fcmToken, notificationsEnabled, languageSelected)
   - `notificationLogs` - Audit trail

### Notification Schedule

| Day | Delay | Message Theme | Emotional Appeal |
|-----|-------|---------------|------------------|
| 1   | 24h   | "This time is different" | Hope, fresh start |
| 2   | 48h   | "Small steps lead to big changes" | Motivation, empowerment |
| 3   | 72h   | "Real change starts here" | Support, community |

### Multi-Language Support

- Arabic (ar)
- English (en)
- Japanese (ja)
- Korean (ko)

---

## Files Created

```
functions/src/notifications/
├── messages.ts                    # Multi-language notification content
├── scheduleOnboarding.ts          # Firestore trigger - schedules tasks
└── sendScheduledNotification.ts   # HTTP function - sends notifications
```

### messages.ts
- Defines notification content for all 3 days in 4 languages
- Exports helper functions: `getNotificationMessage()`, `validateLanguage()`

### scheduleOnboarding.ts
- Firestore onCreate trigger on `profiles/{profileId}`
- Fetches user data from `users/{profileId}` collection
- Creates 3 Cloud Tasks with 24h, 48h, 72h delays
- Uses `@google-cloud/tasks` library

### sendScheduledNotification.ts
- HTTP endpoint called by Cloud Tasks
- Re-validates user settings (notifications may have been disabled)
- Fetches fresh fcmToken from Firestore
- Sends notification via Firebase Admin SDK
- Logs success/failure to `notificationLogs` collection

---

## Key Design Decisions

### 1. **Why Separate Trigger Collections?**
   - **Trigger**: `profiles/{profileId}` onCreate
   - **Data Source**: `users/{profileId}`

   **Reason**: Profile creation happens first. By the time notifications are scheduled, the user data (fcmToken, settings) may still be propagating. This separation allows the trigger to fire immediately while data is fetched explicitly.

### 2. **Why Not Check fcmToken in scheduleOnboarding?**
   - **Decision**: Only check `notificationsEnabled`, schedule tasks regardless of fcmToken
   - **Reason**: fcmToken may arrive after profile creation (race condition in Flutter app). By 24 hours later, the token will definitely be there.
   - **Trade-off**: Creates unnecessary tasks for users without tokens, but cost is negligible (free tier covers millions of operations).

### 3. **Why Re-validate in sendScheduledNotification?**
   - User may disable notifications after signup
   - User may delete their account
   - fcmToken may change
   - Fresh validation ensures we respect current user preferences

### 4. **Why Cloud Tasks Instead of Cloud Scheduler?**
   - **Cloud Tasks**: Per-user, dynamic scheduling
   - **Cloud Scheduler**: Fixed cron-based schedules
   - Tasks allow precise 24h/48h/72h delays from user's signup time

---

## IAM Permissions & Service Accounts

### Service Accounts Involved

1. **735916985913-compute@developer.gserviceaccount.com**
   - Runs both Cloud Functions
   - Default compute service account

2. **kalee-prod@appspot.gserviceaccount.com**
   - App Engine default service account
   - Initially used for OIDC tokens (later changed to compute account)

### Required Permissions

| Service Account | Role | Resource | Why |
|----------------|------|----------|-----|
| 735916985913-compute@ | `cloudtasks.enqueuer` | Project | Create Cloud Tasks |
| 735916985913-compute@ | `iam.serviceAccountUser` | Self | Act as itself for OIDC tokens |
| 735916985913-compute@ | `run.invoker` | sendScheduledNotification | Invoke HTTP function |
| service-...-eventarc@ | `eventarc.serviceAgent` | Project | Firestore trigger events |
| service-...-pubsub@ | `iam.serviceAccountTokenCreator` | Project | Eventarc authentication |

### Permission Commands Run

```bash
# Enable Cloud Tasks API
gcloud services enable cloudtasks.googleapis.com

# Create Cloud Tasks queue
gcloud tasks queues create onboarding-notifications --location=europe-west1

# Grant compute account permission to create tasks
gcloud projects add-iam-policy-binding kalee-prod \
    --member=serviceAccount:735916985913-compute@developer.gserviceaccount.com \
    --role=roles/cloudtasks.enqueuer

# Grant compute account permission to act as itself (for OIDC)
gcloud iam service-accounts add-iam-policy-binding \
    735916985913-compute@developer.gserviceaccount.com \
    --member=serviceAccount:735916985913-compute@developer.gserviceaccount.com \
    --role=roles/iam.serviceAccountUser

# Grant compute account permission to invoke sendScheduledNotification
gcloud functions add-invoker-policy-binding sendScheduledNotification \
    --region=europe-west1 \
    --member=serviceAccount:735916985913-compute@developer.gserviceaccount.com

# Grant Eventarc service agent (for Firestore triggers)
gcloud projects add-iam-policy-binding kalee-prod \
    --member=serviceAccount:service-735916985913@gcp-sa-eventarc.iam.gserviceaccount.com \
    --role=roles/eventarc.serviceAgent
```

---

## Engineering Notes & Learning Topics

### 1. Cloud Tasks vs Cloud Scheduler vs Pub/Sub

**Cloud Tasks** (What we used):
- **Purpose**: Asynchronous task execution with precise scheduling
- **Use Case**: Per-user delayed actions (send notification 24h after signup)
- **Billing**: Free for first 1M operations/month
- **Key Feature**: Each task is independent with its own payload and schedule

**Cloud Scheduler** (Alternative):
- **Purpose**: Cron-based recurring jobs
- **Use Case**: Run cleanup job every day at 2 AM
- **Limitation**: Can't do "24h from user signup" - only fixed times
- **Key Feature**: Like Unix cron, but managed

**Pub/Sub** (Alternative):
- **Purpose**: Event-driven messaging
- **Use Case**: Real-time event broadcasting
- **Limitation**: No built-in delay/scheduling
- **Key Feature**: Publish/subscribe pattern, multiple consumers

**Why We Chose Cloud Tasks**:
- Needed per-user scheduling (not fixed cron)
- Needed delays (24h, 48h, 72h from signup)
- Needed guaranteed delivery (tasks retry on failure)
- Needed payload with task (userId, language, day)

---

### 2. OIDC Tokens & Service Account Impersonation

**What is OIDC?**
- OpenID Connect - authentication protocol
- Allows services to authenticate to each other
- Like a "service account JWT token"

**Why Do We Need It?**
- `sendScheduledNotification` requires authentication (not public)
- Cloud Tasks needs to prove it's allowed to call the function
- OIDC token = "I am service account X, and I'm allowed to do this"

**The Confusing Part**:
```typescript
oidcToken: {
    serviceAccountEmail: '735916985913-compute@developer.gserviceaccount.com',
    audience: functionUrl,
}
```

**This means**: "When Cloud Tasks calls this URL, authenticate as the compute service account"

**Why the Permission Error Happened**:
- To create a task with OIDC token, you need `iam.serviceAccounts.actAs`
- This allows "acting as" (impersonating) a service account
- We tried to use `kalee-prod@appspot.gserviceaccount.com` initially
- But the function runs as `735916985913-compute@developer.gserviceaccount.com`
- The compute account couldn't "act as" the App Engine account

**The Fix**:
1. Use the same service account that runs the function (compute account)
2. Grant the compute account permission to "act as itself" (weird but required)
3. Grant the compute account permission to invoke the target function

**Lesson**: When using OIDC tokens, use the same service account that's already running your function to avoid permission issues.

---

### 3. Firebase Functions v2 Architecture

**Gen 1 vs Gen 2 Functions**:

| Feature | Gen 1 (v1) | Gen 2 (v2) - What we use |
|---------|-----------|-------------------------|
| Runtime | Cloud Functions | Cloud Run (containerized) |
| Trigger Types | Limited | More flexible (Eventarc) |
| Authentication | Automatic | Manual IAM setup required |
| Scalability | Lower | Higher (Cloud Run benefits) |
| Cold Starts | Slower | Faster |

**Why Gen 2 Requires More IAM Setup**:
- Gen 1: Firebase manages everything automatically
- Gen 2: Uses Cloud Run under the hood, requires explicit IAM permissions
- Trade-off: More control, better performance, but more setup

**Eventarc** (Event Architecture):
- Powers Firestore triggers in Gen 2
- Uses Pub/Sub under the hood
- Requires service agent permissions
- More flexible than Gen 1 triggers

---

### 4. The fcmToken Race Condition Problem

**The Problem**:
```dart
// Flutter signup flow:
1. Create user in Firestore        ← scheduleOnboarding fires HERE
2. await getFcmToken()              ← Token arrives AFTER trigger
3. Update user with fcmToken        ← Too late!
```

**Why This Happens**:
- Firestore onCreate triggers fire **immediately**
- FCM token requires async network call to Firebase
- Race condition: trigger fires before token is saved

**Three Possible Solutions**:

**Option A** (We chose this):
- Schedule tasks even without fcmToken
- Check fcmToken when sending (24h later)
- **Pros**: Simple, works with current signup flow
- **Cons**: Creates tasks that might not send

**Option B**:
- Use `onUpdate` trigger instead of `onCreate`
- Only schedule when fcmToken is added
- **Pros**: No wasted tasks
- **Cons**: Misses users who never get token

**Option C**:
- Change Flutter to get fcmToken BEFORE creating user
- **Pros**: Clean, no race condition
- **Cons**: Requires app code change

**Why We Chose Option A**:
- Works with existing app code (no Flutter changes)
- By 24 hours, token will definitely be there
- Wasted tasks are free (within quota)
- Pragmatic solution

---

### 5. Firestore Trigger Best Practices

**onCreate vs onWrite vs onUpdate**:
```typescript
onCreate  → Fires once when document created
onWrite   → Fires on create, update, delete
onUpdate  → Fires only on updates (not create)
onDelete  → Fires only on delete
```

**Why We Used onCreate**:
- Want to schedule notifications once per user
- Don't want to reschedule on profile updates
- Clean trigger point

**Document Path Patterns**:
```typescript
'users/{userId}'           → Exact collection
'users/{userId}/posts/{postId}'  → Subcollection
'posts/{docId=**}'         → Any document in posts, any depth
```

**Performance Tip**:
- Triggers are **synchronous** - they slow down the write
- Keep trigger functions fast
- Offload heavy work to Cloud Tasks (like we did)

---

### 6. Firebase Admin SDK Initialization

**Common Pattern in Cloud Functions**:
```typescript
import * as admin from 'firebase-admin';
const db = admin.firestore();
```

**Key Points**:
- Admin SDK is initialized once in `shared/utils.ts`
- All files import the already-initialized instance
- Don't call `admin.initializeApp()` multiple times
- Don't use dynamic imports (`await import()`) - breaks initialization

**Why Our Error Happened**:
```typescript
// ❌ WRONG - Dynamic import
const admin = await import('firebase-admin');
const db = admin.firestore();  // Error: firestore is not a function

// ✅ CORRECT - Static import
import * as admin from 'firebase-admin';
const db = admin.firestore();
```

**Lesson**: Always use static imports for firebase-admin in Cloud Functions.

---

### 7. Cloud Tasks Payload Encoding

**Why Base64?**:
```typescript
body: Buffer.from(JSON.stringify({userId, language, day})).toString('base64')
```

**Explanation**:
- Cloud Tasks HTTP requests require base64-encoded bodies
- Ensures binary safety (no encoding issues)
- Standard Google Cloud pattern

**Decoding (automatic)**:
```typescript
const payload = req.body;  // Firebase automatically decodes
const { userId, language, day } = payload;
```

---

### 8. Error Handling & Logging Strategy

**Our Pattern**:
1. **Correlation IDs**: Use `userId` or `profileId` in all logs
2. **Structured Logging**: Log objects, not strings
3. **Timer Tracking**: Measure execution time
4. **Success/Failure Logs**: Always log both outcomes

**Example**:
```typescript
logger.info(`[${profileId}] Scheduling onboarding notifications`, {
    language,
    email: userData.email,
    hasFcmToken: !!userData.fcmToken
});
```

**Benefits**:
- Easy to trace user journey through logs
- Performance monitoring built-in
- Structured data queryable in Cloud Logging

**Graceful Failures**:
```typescript
if (!userData?.fcmToken) {
    logger.warn(`[${userId}] No FCM token available - skipping notification`);
    res.status(200).send('No FCM token - skipped');  // ← Still 200!
    return;
}
```

**Why 200 for "skipped"?**
- Tells Cloud Tasks "task completed successfully"
- Prevents infinite retries
- User disabled notifications = expected behavior, not an error

---

### 9. Notification Best Practices

**Emotional Messaging Strategy**:
- **Day 1**: Hope ("This time is different")
- **Day 2**: Motivation ("Small steps lead to big changes")
- **Day 3**: Community ("You're not alone")

**Why This Works**:
- Taps into user's weight loss journey emotions
- Acknowledges past failures ("this time")
- Builds habit formation psychology (3-day pattern)
- Avoids gamification fatigue (no XP/points pressure)

**Localization**:
- Not just translation - cultural adaptation
- Emojis work across all languages
- Keep messages concise (mobile notifications)

---

### 10. Cost Analysis

**Free Tier Limits** (as of 2025):
- Cloud Tasks: 1M operations/month free
- Cloud Functions: 2M invocations/month free
- Firestore: 50K reads/day free
- FCM: Unlimited (free)

**Our Usage** (per user):
- 1 onCreate trigger = 1 Firestore read
- 3 Cloud Tasks created = 3 task operations
- 3 HTTP function calls (over 3 days) = 3 invocations
- 3 Firestore reads (user data) = 3 reads
- 3 FCM sends = free
- 3 Firestore writes (logs) = 3 writes

**Total per user**: ~13 operations
**For 10,000 users/month**: ~130K operations
**Cost**: **$0** (within free tier)

**Lesson**: Serverless is incredibly cost-effective for this use case.

---

## Testing Checklist

### Manual Test
1. Create document in `profiles` collection:
   ```json
   {
     "userId": "test-user-123",
     "createdAt": 1234567890
   }
   ```

2. Ensure `users/test-user-123` has:
   ```json
   {
     "notificationsEnabled": true,
     "fcmToken": "valid-fcm-token",
     "languageSelected": "en"
   }
   ```

3. Check logs in Cloud Console:
   - scheduleOnboardingNotifications logs
   - Cloud Tasks queue

4. Verify tasks created:
   ```bash
   gcloud tasks list --queue=onboarding-notifications --location=europe-west1
   ```

### Monitor Logs
```bash
# Schedule function logs
firebase functions:log --only scheduleOnboardingNotifications

# Send function logs
firebase functions:log --only sendScheduledNotification
```

### Check Notification Logs
Query Firestore `notificationLogs` collection:
```javascript
db.collection('notificationLogs')
  .where('userId', '==', 'test-user-123')
  .orderBy('sentAt', 'desc')
  .get()
```

---

## Troubleshooting Guide

### Issue: "No FCM token - skipping scheduling"
**Cause**: User document doesn't have fcmToken yet
**Solution**: This is expected! Notifications will still be scheduled. Token will be checked at send time (24h later).

### Issue: "PERMISSION_DENIED: cloudtasks.tasks.create"
**Cause**: Compute service account lacks permission
**Solution**:
```bash
gcloud projects add-iam-policy-binding kalee-prod \
    --member=serviceAccount:735916985913-compute@developer.gserviceaccount.com \
    --role=roles/cloudtasks.enqueuer
```

### Issue: "PERMISSION_DENIED: iam.serviceAccounts.actAs"
**Cause**: Service account can't impersonate itself for OIDC
**Solution**:
```bash
gcloud iam service-accounts add-iam-policy-binding \
    735916985913-compute@developer.gserviceaccount.com \
    --member=serviceAccount:735916985913-compute@developer.gserviceaccount.com \
    --role=roles/iam.serviceAccountUser
```

### Issue: Tasks created but notifications not sending
**Cause**: HTTP function not allowing compute service account to invoke
**Solution**:
```bash
gcloud functions add-invoker-policy-binding sendScheduledNotification \
    --region=europe-west1 \
    --member=serviceAccount:735916985913-compute@developer.gserviceaccount.com
```

### Issue: "admin.firestore is not a function"
**Cause**: Using dynamic import instead of static import
**Solution**: Use `import * as admin from 'firebase-admin'` at top of file

---

## Future Improvements

1. **Analytics**:
   - Track notification open rates
   - A/B test message content
   - Measure conversion to meal logging

2. **Personalization**:
   - Use user's goal (weight loss vs muscle gain)
   - Reference user's name in notifications
   - Adapt based on user's activity level

3. **Smart Scheduling**:
   - Send at user's optimal time (based on past app usage)
   - Avoid late night notifications
   - Time zone awareness

4. **Retry Logic**:
   - Retry if FCM send fails
   - Exponential backoff
   - Dead letter queue for permanent failures

5. **Notification Variants**:
   - Different messages for different user segments
   - Progressive onboarding (Day 4, 5, 6...)
   - Re-engagement campaign for inactive users

---

## References

- [Cloud Tasks Documentation](https://cloud.google.com/tasks/docs)
- [Firebase Cloud Functions v2](https://firebase.google.com/docs/functions/beta)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [Service Account Impersonation](https://cloud.google.com/iam/docs/impersonating-service-accounts)
- [Eventarc Documentation](https://cloud.google.com/eventarc/docs)

---

**Created**: 2025-10-06
**Author**: Ahmed Alghamdi (with Claude Code assistance)
**Project**: Kalee Web App - Onboarding Notifications System
