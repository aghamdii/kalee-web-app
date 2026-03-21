# Kalee Affiliate System — Product Requirements Document

## Overview

Kalee's affiliate system enables Saudi content creators to promote the app to their audience with a discounted subscription offer. Creators receive a unique affiliate code and link. When their audience subscribes through this link, the creator earns a commission on each transaction.

### Key Numbers

| Item | Value |
|---|---|
| Standard Annual Price | 199 SAR |
| Affiliate Discounted Annual Price | 149 SAR |
| Default Commission Rate | 15% |
| Payout Holdback Period | 60 days |
| Commission Scope | Initial purchase + renewals (configurable per affiliate) |

---

## Existing Infrastructure

The following systems are already in place and the affiliate system builds on top of them:

| System | What it does | Relevant to affiliates |
|---|---|---|
| **RevenueCat Firebase Extension** | Receives RevenueCat webhooks. Writes subscription events to `revenuecatSubscriptionEvents` and customer state to `revenuecatCustomersInfo` automatically. | The affiliate trigger function listens to events written by this extension — no custom webhook endpoint needed. |
| **`revenuecatCustomersInfo/{userId}`** | Full subscriber data synced from RevenueCat (entitlements, subscriptions, aliases, subscriber attributes). Populated via the extension on new events and backfilled via the sync tool for historical users. | Source for looking up `$affiliateCode` subscriber attribute and verifying subscription status. |
| **`revenuecatSubscriptionEvents/{eventId}`** | Raw subscription lifecycle events written by the extension (INITIAL_PURCHASE, RENEWAL, CANCELLATION, EXPIRATION, REFUND, etc.). | The `processAffiliateEvent` Cloud Function triggers on new documents in this collection. |
| **Admin Portal** | Existing admin dashboard at `/admin_portal/dashboard` with Users, Insights, Notifications, Feedback, Sync tabs. Uses server actions + Firebase Admin SDK. | The Affiliates section will be added as new tabs following the same patterns. |
| **RevenueCat v1 API** | `https://api.revenuecat.com/v1`. Used for granting promotional entitlements and syncing subscriber data. Auth via `REVENUECAT_SECRET_KEY` (Firebase secret). | May be used for looking up subscriber attributes if not present in Firestore event docs. |

---

## System Architecture

```
Content Creator shares link
        ↓
User clicks kalee.app/ref/{CODE}
        ↓
Landing page → App Store / Google Play
        ↓
User installs & opens app
        ↓
Affiliate code auto-applied via deep link (or manual entry as fallback)
        ↓
App saves code to: local storage + Firestore (users/{uid}) + RevenueCat subscriber attribute
        ↓
Paywall shows discounted affiliate offering (149 SAR annual)
        ↓
User subscribes via App Store / Google Play
        ↓
RevenueCat processes purchase
        ↓
RevenueCat Extension webhook → writes event to revenuecatSubscriptionEvents
        ↓
Firestore onCreate trigger: processAffiliateEvent Cloud Function
        ↓
Look up affiliateCode from user's data
        ↓
Commission calculated & transaction recorded in affiliateTransactions
        ↓
Affiliate counters updated
        ↓
Payout becomes eligible after 60 days
```

---

## Flow 1: Affiliate Onboarding

### Trigger
Admin signs a new content creator and wants to register them in the system.

### Steps

1. Admin opens **Admin Portal → Affiliates → Add Affiliate**
2. Admin fills in:
   - Creator's full name
   - Email address
   - Phone number (for WhatsApp communication)
   - Platform (Instagram, TikTok, YouTube, Twitter/X, Snapchat)
   - Commission rate (default 15%)
   - Commission scope: first purchase only, or first purchase + renewals
   - Notes (contract details, special terms)
3. System auto-generates a unique affiliate code (e.g., `SARAH`, or admin can set a custom code)
4. System creates:
   - Affiliate record in Firestore
   - Affiliate link: `kalee.app/ref/{CODE}`
5. Admin shares the code and link with the creator

### Data Created

```
affiliates/{code}
  code: "SARAH"
  name: "Sarah Ahmad"
  email: "sarah@example.com"
  phone: "+966XXXXXXXXX"
  platform: "instagram"
  status: "active"                    // active | paused | terminated
  commissionScope: "all"             // "first_only" | "all"
  commissionRates: [
    { rate: 0.15, effectiveFrom: "2026-03-05", setBy: "admin@kalee.app" }
  ]
  currentCommissionRate: 0.15
  createdAt: timestamp
  createdBy: "admin@kalee.app"
  totalReferrals: 0
  activeSubscribers: 0
  totalEarnings: 0
  pendingPayout: 0
```

---

## Flow 2: User Acquisition via Affiliate Link

### Trigger
A potential user clicks on a creator's affiliate link.

### Steps

1. User clicks `kalee.app/ref/SARAH`
2. Landing page shows a branded message:
   - "Get Kalee Premium — First year for 149 SAR"
   - Download buttons for App Store / Google Play
3. The link includes the affiliate code as a URL parameter
4. **If app is already installed**: Deep link opens the app with the affiliate code stored locally
5. **If app is not installed**: User goes to App Store / Google Play. After install, the deferred deep link (or clipboard-based detection) passes the affiliate code to the app
6. On first app launch with an affiliate code:
   - The code is stored locally on the device
   - The code is saved as a RevenueCat subscriber attribute: `$affiliateCode = "SARAH"`
   - The code is saved to the user's Firestore document: `users/{uid}.affiliateCode = "SARAH"`
7. When the user hits the paywall:
   - App checks if an affiliate code is present
   - If yes, shows the **affiliate offering** from RevenueCat (149 SAR annual) instead of the standard offering (199 SAR annual)
   - Paywall displays: "Special offer applied" or similar subtle indicator
8. User subscribes at 149 SAR

### Important Rules

- An affiliate code can only be applied **before** the first purchase. Once a user has subscribed, the code cannot be changed.
- A user can only have **one** affiliate code. First code applied wins.
- The affiliate code persists even if the user doesn't subscribe immediately. If they come back days later, the discounted paywall still shows.

---

## Flow 3: Transaction Tracking via Firestore Trigger

### How It Works

The RevenueCat Firebase Extension is already installed and handles webhooks. When a subscription event occurs, the extension writes a document to `revenuecatSubscriptionEvents`. The affiliate system uses a **Firestore `onCreate` trigger** on this collection to process affiliate-related logic.

This approach is used instead of a custom webhook because:
- No duplicate webhook endpoints — the extension already handles RevenueCat webhooks
- No webhook authentication to manage — Firestore triggers are internal to Firebase
- Events are already persisted — if the trigger fails, the event document is still there for reprocessing
- Idempotency is handled naturally — each event document is only created once

### Events to Handle

| Event | Action |
|---|---|
| `INITIAL_PURCHASE` | Record new transaction. Calculate commission. Increment affiliate's referral count and active subscribers. |
| `RENEWAL` | Record renewal transaction. Calculate commission (if affiliate's scope is "all"). |
| `CANCELLATION` | Mark subscription as cancelled. No commission impact on past transactions. |
| `UNCANCELLATION` | Mark subscription as re-enabled. |
| `BILLING_ISSUE` | Flag transaction. Do not count toward payout until resolved. |
| `EXPIRATION` | Mark subscription as expired. Decrement affiliate's active subscriber count. |
| `REFUND` | Reverse the commission for this transaction. Deduct from pending payout. |

### Processing Steps (processAffiliateEvent Cloud Function)

```
Firestore onCreate trigger on revenuecatSubscriptionEvents/{eventId}
        ↓
1. Read event data (type, app_user_id, product_id, price_in_purchased_currency, currency,
   original_transaction_id, event_timestamp_ms)
        ↓
2. Resolve Firebase UID from app_user_id:
   - If app_user_id starts with "$RCAnonymousID:", look up revenuecatCustomersInfo
     to find the document where aliases contains this ID → get the doc ID (Firebase UID)
   - Otherwise, app_user_id IS the Firebase UID
        ↓
3. Look up affiliate code from (in order):
   a. revenuecatCustomersInfo/{userId}.subscriber_attributes.$affiliateCode.value
   b. users/{userId}.affiliateCode (fallback)
        ↓
4. If no affiliate code → skip (not an affiliate transaction)
        ↓
5. Look up affiliates/{code}
   - If not found or status is "terminated" → skip
        ↓
6. Process based on event type:

   INITIAL_PURCHASE:
     - Calculate commission: price_in_purchased_currency × currentCommissionRate
     - Create affiliateTransactions/{id}
     - Increment affiliate: totalReferrals, activeSubscribers, totalEarnings, pendingPayout

   RENEWAL:
     - If affiliate.commissionScope === "first_only" → skip
     - Calculate commission: price_in_purchased_currency × currentCommissionRate
     - Create affiliateTransactions/{id} with isRenewal: true
     - Increment affiliate: totalEarnings, pendingPayout

   EXPIRATION:
     - Decrement affiliate: activeSubscribers

   REFUND:
     - Find original affiliateTransaction by originalTransactionId
     - Set payoutStatus to "reversed", commissionAmount to 0
     - Deduct from affiliate: totalEarnings, pendingPayout
     - If already paid out: create negative adjustment transaction

   CANCELLATION / UNCANCELLATION / BILLING_ISSUE:
     - Log for audit purposes, no commission impact
```

### Transaction Record

```
affiliateTransactions/{id}
  affiliateCode: "SARAH"
  userId: "firebase_uid"
  revenueCatAppUserId: "rc_app_user_id"
  eventDocId: "revenuecatSubscriptionEvents_doc_id"   // links back to source event
  event: "INITIAL_PURCHASE"
  productId: "annual_affiliate_149"
  price: 149                          // actual price from event (price_in_purchased_currency)
  currency: "SAR"                     // actual currency from event
  commissionRate: 0.15
  commissionAmount: 22.35
  transactionDate: timestamp
  payoutEligibleDate: timestamp       // transactionDate + 60 days
  payoutStatus: "pending"             // pending | eligible | paid | reversed
  payoutBatchId: null                 // set when included in a payout
  originalTransactionId: "txn_xxx"    // links renewals to original purchase
  isRenewal: false
  createdAt: timestamp
  updatedAt: timestamp
```

### Price Handling

The commission is calculated from the **actual price in the event** (`price_in_purchased_currency`), not a hardcoded value. This ensures accuracy when:
- App Store / Google Play pricing varies by region
- Prices change over time
- Different affiliate products have different prices
- Currency conversions are handled correctly

---

## Flow 4: Commission Rate Updates

### Trigger
Admin wants to update an affiliate's commission rate (e.g., from 15% to 30% based on new contract).

### Steps

1. Admin opens **Admin Portal → Affiliates → Select Affiliate → Edit Commission**
2. Admin enters the new rate (e.g., 30%) and the effective date
3. System appends to the `commissionRates` array:
   ```
   { rate: 0.30, effectiveFrom: "2026-07-01", setBy: "admin@kalee.app" }
   ```
4. System updates `currentCommissionRate` to 0.30
5. **All future transactions** use the new 30% rate
6. **All past transactions** remain at their original rate (15%) — the rate is stored on each transaction record, not looked up dynamically

### Rate History

The `commissionRates` array serves as a full audit trail:

```
commissionRates: [
  { rate: 0.15, effectiveFrom: "2026-03-05", setBy: "admin@kalee.app" },
  { rate: 0.30, effectiveFrom: "2026-07-01", setBy: "admin@kalee.app" },
  { rate: 0.25, effectiveFrom: "2026-10-01", setBy: "admin@kalee.app" }
]
```

---

## Flow 5: Payout Management

### Payout Lifecycle

```
Transaction occurs (Day 0)
        ↓
Status: "pending" — waiting for holdback period
        ↓
60 days pass (Day 60)
        ↓
Status: "eligible" — safe to pay out
        ↓
Admin initiates payout
        ↓
Status: "paid" — funds transferred to creator
```

### Why 60 Days

- **Apple** pays developers ~33 days after the fiscal month ends. A March 1st purchase may not arrive until early May.
- **Google** pays ~15 days after month end, but delays happen.
- **Refund window**: Users can request refunds up to 14 days (Apple sometimes longer).
- **Chargebacks**: Can arrive 30+ days later.
- 60 days ensures you have received the money and the refund window has closed before paying the creator.

### Admin Payout Flow

1. Admin opens **Admin Portal → Affiliates → Payouts**
2. Dashboard shows:
   - **Total pending**: Sum of all transactions not yet past 60 days
   - **Total eligible**: Sum of all transactions past 60 days, not yet paid
   - **Total paid**: Historical total
3. Admin can filter by affiliate
4. Admin clicks **"Create Payout"** for an affiliate
5. System shows all eligible (unpaid, past 60 days) transactions for that affiliate
6. Admin confirms the payout amount
7. System:
   - Creates a payout record
   - Marks all included transactions as `payoutStatus: "paid"`
   - Links them to the payout batch via `payoutBatchId`
   - Updates affiliate's `pendingPayout` counter
8. Admin transfers the money externally (bank transfer, etc.) and records it

### Payout Record

```
affiliatePayouts/{id}
  affiliateCode: "SARAH"
  amount: 1234.50
  currency: "SAR"
  transactionCount: 55
  transactionIds: ["txn_1", "txn_2", ...]
  periodStart: "2026-03-05"          // earliest transaction date in batch
  periodEnd: "2026-05-01"            // latest transaction date in batch
  status: "completed"                // pending | completed
  paymentMethod: "bank_transfer"
  paymentReference: "IBAN-XXX-REF-123"
  notes: ""
  createdAt: timestamp
  createdBy: "admin@kalee.app"
  completedAt: timestamp
```

---

## Flow 6: Refund Handling

### Trigger
RevenueCat Extension writes a `REFUND` event to `revenuecatSubscriptionEvents`.

### Steps

1. `processAffiliateEvent` trigger fires on the new REFUND event document
2. Look up the user's affiliate code
3. Find the original affiliate transaction by `originalTransactionId`
4. Set transaction's `payoutStatus` to `"reversed"`
5. Set `commissionAmount` to 0 (or create a negative adjustment transaction)
6. Deduct from affiliate's `pendingPayout` and `totalEarnings`
7. If the transaction was already paid out:
   - Create a negative adjustment transaction
   - This amount is deducted from the affiliate's next payout

---

## Admin Portal: Affiliates Section

### Page 1: Affiliates List

Displays all affiliates in a table/card view.

| Column | Description |
|---|---|
| Name | Creator's name |
| Code | Affiliate code (e.g., SARAH) |
| Platform | Instagram, TikTok, etc. |
| Status | Active / Paused / Terminated |
| Commission Rate | Current rate (e.g., 30%) |
| Total Referrals | Number of users who subscribed via this code |
| Active Subscribers | Currently active subscriptions |
| Total Earned | Lifetime commission earned |
| Pending Payout | Amount waiting (not yet eligible) |
| Eligible Payout | Amount ready to pay (past 60 days) |

**Actions**: Add Affiliate, Search, Filter by status/platform

### Page 2: Affiliate Detail

Shows full details for one affiliate.

**Header Section:**
- Name, email, phone, platform, status
- Current commission rate with change history
- Link to share: `kalee.app/ref/SARAH` (with copy button)

**Stats Cards:**
- Total Referrals
- Active Subscribers
- Conversion Rate (referrals who stayed past trial)
- Total Earned (lifetime)
- Pending (< 60 days)
- Eligible (> 60 days, unpaid)
- Paid (lifetime)

**Transaction History Table:**
| Date | User | Event | Product | Price | Commission | Rate | Payout Status |
|---|---|---|---|---|---|---|---|
| Mar 15 | user@... | Initial Purchase | Annual 149 | 149 SAR | 22.35 SAR | 15% | Pending |
| Mar 20 | user2@... | Initial Purchase | Annual 149 | 149 SAR | 22.35 SAR | 15% | Eligible |
| Apr 01 | user@... | Renewal | Annual 149 | 149 SAR | 22.35 SAR | 15% | Pending |
| Apr 05 | user3@... | Refund | Annual 149 | -149 SAR | -22.35 SAR | 15% | Reversed |

**Commission Rate History:**
| Effective From | Rate | Set By |
|---|---|---|
| Mar 5, 2026 | 15% | admin@kalee.app |
| Jul 1, 2026 | 30% | admin@kalee.app |

**Payout History:**
| Date | Amount | Transactions | Period | Reference |
|---|---|---|---|---|
| Jun 1, 2026 | 1,234.50 SAR | 55 | Mar 5 – Apr 1 | IBAN-XXX |

**Actions**: Edit Commission Rate, Pause/Activate Affiliate, Create Payout

### Page 3: Payouts Overview

Global view of all payouts across all affiliates.

**Summary Cards:**
- Total Pending (all affiliates)
- Total Eligible (ready to pay)
- Total Paid (this month / all time)

**Eligible Payouts Table:**
| Affiliate | Code | Eligible Amount | Transaction Count | Oldest Transaction | Action |
|---|---|---|---|---|---|
| Sarah Ahmad | SARAH | 1,234.50 SAR | 55 | Mar 5, 2026 | Create Payout |
| Mohammed Ali | MOHA | 567.00 SAR | 25 | Mar 10, 2026 | Create Payout |

**Payout History Table:**
| Date | Affiliate | Amount | Transactions | Reference | Status |
|---|---|---|---|---|---|
| Jun 1 | SARAH | 1,234.50 SAR | 55 | IBAN-XXX | Completed |

---

## Firestore Data Model

### New Collections (affiliate-specific)

```
affiliates/{code}                          — Affiliate profiles
affiliateTransactions/{id}                 — Individual commission transactions
affiliatePayouts/{id}                      — Payout batches
```

### Existing Collections (no schema changes, used as data sources)

```
revenuecatCustomersInfo/{userId}           — Subscriber data, subscriber_attributes (contains $affiliateCode)
revenuecatSubscriptionEvents/{eventId}     — Raw events from RevenueCat Extension (trigger source)
users/{userId}                             — User profiles (stores affiliateCode as fallback)
```

### Field Added to Existing Collection

```
users/{userId}
  affiliateCode: "SARAH"                   — Set by the app when affiliate code is applied
```

### Indexes Required

```
affiliateTransactions:
  - affiliateCode ASC, transactionDate DESC
  - affiliateCode ASC, payoutStatus ASC, payoutEligibleDate ASC
  - payoutStatus ASC, payoutEligibleDate ASC

affiliatePayouts:
  - affiliateCode ASC, createdAt DESC
```

---

## RevenueCat Configuration

### Setup Required

1. **Create a new product** in App Store Connect and Google Play Console:
   - Product ID: `annual_affiliate_149` (or similar)
   - Price: 149 SAR
2. **Create a new Offering** in RevenueCat:
   - Offering ID: `affiliate`
   - Contains the 149 SAR annual product
3. **RevenueCat Firebase Extension** (already installed):
   - The extension already handles webhooks and writes to `revenuecatSubscriptionEvents` and `revenuecatCustomersInfo`
   - No additional webhook configuration needed for the affiliate system
4. **Subscriber attributes**:
   - `$affiliateCode` — set by the app when an affiliate code is applied
   - This attribute is included in the extension's event documents and customer info

---

## Firebase Cloud Functions Required

| Function | Type | Region | Purpose |
|---|---|---|---|
| `processAffiliateEvent` | Firestore `onCreate` trigger on `revenuecatSubscriptionEvents/{eventId}` | europe-west1 | Core affiliate logic — resolves affiliate code, calculates commission, creates transaction records, updates affiliate counters |
| `updatePayoutEligibility` | Scheduled (daily, e.g., every day at 00:00 UTC) | europe-west1 | Queries `affiliateTransactions` where `payoutStatus == "pending"` and `payoutEligibleDate <= now`, updates them to `payoutStatus: "eligible"` |

### processAffiliateEvent — Key Design Decisions

- **Idempotency**: Each event document in `revenuecatSubscriptionEvents` is created once by the extension. The `onCreate` trigger fires exactly once per document. The `eventDocId` is stored on the affiliate transaction to prevent duplicates if the function is retried.
- **Non-affiliate events**: The function checks for an affiliate code early and returns immediately if none is found. The vast majority of events (non-affiliate users) will exit in the first few reads.
- **Failure handling**: If the function fails, Cloud Functions will retry it. Since the source event document is already persisted, no data is lost. The function checks for existing affiliate transactions with the same `eventDocId` before creating duplicates.

---

## App Changes Required

1. **Deep link handling**: Parse `kalee.app/ref/{CODE}` and store the affiliate code
2. **Affiliate code storage** (three locations for reliability):
   - Local storage on device
   - `users/{uid}.affiliateCode` in Firestore
   - RevenueCat subscriber attribute: `$affiliateCode`
3. **Paywall logic**: Check for affiliate code → show affiliate offering (149 SAR) instead of standard (199 SAR)
4. **Manual code entry**: Settings or onboarding screen with "Have a promo code?" option as fallback
5. **Code validation**: Before storing, verify the code exists in `affiliates/{code}` and has `status: "active"`

---

## Edge Cases

| Scenario | Handling |
|---|---|
| User applies code after subscribing at full price | Code rejected. Affiliate codes only apply before first purchase. |
| User refunds and resubscribes with different code | Original affiliate loses credit (commission reversed). New code applies to new subscription. |
| Affiliate is terminated | Status set to "terminated". Existing pending payouts still honored. Code stops working for new users (app validates status before accepting). |
| User applies code but never subscribes | No transaction recorded. Affiliate's referral count is not affected (counted only on INITIAL_PURCHASE). |
| Same user tries multiple affiliate codes | First code wins. Subsequent codes are rejected (app checks if `affiliateCode` already exists on user doc). |
| Affiliate uses their own code | System checks if affiliate email matches subscriber email in processAffiliateEvent. If match, skip commission but still grant discount. |
| Transaction is refunded after payout | Negative adjustment transaction created. Deducted from the affiliate's next payout. |
| RevenueCat Extension writes duplicate event | Handled by `onCreate` trigger (fires once per doc). Additionally, `eventDocId` uniqueness check prevents duplicate affiliate transactions. |
| processAffiliateEvent trigger fails/retries | Function checks for existing affiliate transaction with same `eventDocId` before creating. Safe to retry. |
| User has $RCAnonymousID as app_user_id | Function resolves Firebase UID via `revenuecatCustomersInfo` aliases array before looking up affiliate code. |
| Event arrives for a user not yet in revenuecatCustomersInfo | Function falls back to `users/{userId}.affiliateCode` lookup. |

---

## Metrics to Track

- **Per affiliate**: Referrals, conversion rate, active subscribers, churn rate, lifetime value, total earned
- **System-wide**: Total affiliate revenue, average commission per affiliate, top performers, affiliate-driven vs organic ratio
- **Financial**: Pending payouts, eligible payouts, paid payouts, refund rate on affiliate transactions

---

## Pre-Implementation Checklist

Before starting implementation, verify the following:

- [ ] Inspect a `revenuecatSubscriptionEvents` document to confirm the exact field names the extension writes (particularly `app_user_id`, `type`, `product_id`, `price_in_purchased_currency`, `currency`, `original_transaction_id`, `event_timestamp_ms`)
- [ ] Confirm that the extension includes `subscriber_attributes` in event documents (specifically `$affiliateCode`). If not, the function will need to look it up from `revenuecatCustomersInfo` or `users` collection.
- [ ] Create the composite index for `revenuecatSubscriptionEvents` (`app_user_id` + `event_timestamp_ms` DESC) — this is already needed by the admin portal's subscription event timeline
- [ ] Create the affiliate offering and product in RevenueCat and the app stores
- [ ] Set up the `affiliateTransactions` and `affiliatePayouts` composite indexes listed above
