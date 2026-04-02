# Changelog

All notable changes to the Kalee Web App project are documented in this file.

---

## [2026-04-01] — Discount / Affiliate Promo Codes

### Cloud Functions

#### Modified: `redeemPromoCodeFunction`
**File:** `functions/src/admin/redeemPromoCode.ts`

- Added discount code branch: reads `type` field from promo code document and branches accordingly
  - `type === "single_use"` (or missing) → existing gift code behavior, no changes
  - `type === "discount"` → validates only, returns `{ success, type: "discount", offeringId }` without granting entitlement or incrementing usage
- Discount "already redeemed" check queries `discountTransactions` collection instead of `redemptions` array
- **Bug fix:** `maxUses: -1` (unlimited) was broken — `0 >= -1` evaluated to `true`, immediately rejecting unlimited codes. Added `maxUses !== -1` guard to both shared validation and transaction-internal validation
- Added `DiscountCodeResponse` and `GiftCodeResponse` interfaces for type safety

#### New: `recordDiscountTransactionFunction`
**File:** `functions/src/admin/recordDiscountTransaction.ts`

- Callable function called by Flutter after a successful discounted purchase (fire-and-forget)
- Creates a `discountTransactions` document with purchase details, status, and initial `statusHistory` entry
- Looks up promo code document to denormalize `affiliateId`
- Increments `usedCount` on promo code inside a Firestore transaction for race safety
- Appends to `redemptions` array with `type: "discount_purchase"`
- Updates promo code status to `"used"` if `maxUses` reached (respects `-1` for unlimited)
- Idempotent: returns existing transaction ID if duplicate detected
- Graceful error handling: never throws `HttpsError`, logs and returns `{ success: false }`
- Uses `price == null` instead of `!price` to handle `price: 0` edge case

#### New: `updateDiscountTransactionStatusFunction`
**File:** `functions/src/admin/updateDiscountTransactionStatus.ts`

- Firestore `onDocumentCreated` trigger on `revenuecatSubscriptionEvents/{eventId}`
- First Firestore trigger in the project (all other functions are `onCall`/`onRequest`)
- Quick exit for non-discount users: queries `discountTransactions` by `rcAppUserId`, returns immediately if not found
- Processes `RENEWAL`, `REFUND`, `EXPIRATION`, `CANCELLATION` events; ignores all others
- Status transitions: `trial→paid` (on RENEWAL), `trial→trial_expired` (on EXPIRATION), `any→refunded` (on REFUND), `CANCELLATION` logs only
- Appends to `statusHistory` array via `FieldValue.arrayUnion`
- Sets `convertedAt` timestamp on trial→paid conversion
- Handles users with multiple discount transactions by matching on `product_id`

#### Modified: `functions/src/index.ts`
- Added exports for `recordDiscountTransactionFunction` and `updateDiscountTransactionStatusFunction`

---

### Admin Portal — Server Actions

#### Modified: `generatePromoCode()`
**File:** `landing_page/app/admin_portal/actions/admin-actions.ts`

- Accepts new parameters: `type` (`single_use` | `discount`), `customCode`, `offeringId`, `affiliateId`, `note`, `maxUses`, `expiresAt`
- Custom code support: admin can specify a code string (e.g. `AHMED20`) instead of auto-generating
- Custom code validation: uppercase, alphanumeric + underscores only, uniqueness check
- Branches Firestore document fields by type:
  - Gift: writes `entitlementId`, `durationDays` (same as before)
  - Discount: writes `offeringId`, `affiliateId`, `note`
- Validates discount-specific requirements: `offeringId` and `maxUses` are required
- Audit log includes `type` and type-specific details

#### Modified: `listPromoCodes()`
**File:** `landing_page/app/admin_portal/actions/admin-actions.ts`

- Returns new fields: `type`, `offeringId`, `affiliateId`, `note`
- Defaults missing `type` to `"single_use"` for backwards compatibility
- Accepts optional `type` filter parameter (filtered client-side to avoid composite index)
- Changed `entitlementId` and `durationDays` return types to nullable (discount codes don't have them)

#### New: `listDiscountTransactions()`
**File:** `landing_page/app/admin_portal/actions/admin-actions.ts`

- Queries `discountTransactions` collection for a specific promo code
- Computes summary: total users, trial active, converted paid, monthly paid, total revenue by currency
- Supports filters: status, plan type, platform (applied client-side)
- Supports cursor-based pagination via `lastDocId`
- Returns paginated transactions + summary in a single response

---

### Admin Portal — Pages

#### Overhauled: Promo Codes page
**File:** `landing_page/app/admin_portal/dashboard/promo-codes/page.tsx`

- **Type filter:** dropdown to filter by "All Types", "Gift Codes", "Discount Codes"
- **Two create buttons:** "Gift Code" (auto-generates 5-char code like before) and "Discount Code" (opens modal)
- **Discount code creation modal:** custom code input (auto-uppercased, alphanumeric validation), offering ID, max uses with unlimited checkbox, affiliate ID, note, expiration date picker
- **Updated table columns:** Code, Type (badge), Status, Usage (handles `-1` as "unlimited"), Affiliate/Note, Created, Expires, Actions
- **View button:** on discount codes, navigates to detail page at `/promo-codes/{code}`
- **Reserve/Unreserve:** preserved for gift codes only
- Removed Entitlement and Duration columns (only relevant for gift codes, cluttered the table)

#### New: Promo Code Detail page
**File:** `landing_page/app/admin_portal/dashboard/promo-codes/[code]/page.tsx`

- Dynamic route for viewing a single discount code's performance
- **Summary bar:** 5 cards showing Total Users, Trial Active, Converted (Paid), Monthly Paid, Est. Revenue
- Revenue displayed grouped by currency (handles multi-currency)
- **Transactions table:** User (truncated ID), Plan, Initial Status, Current Status (color-coded badge), Price, Platform, Date (relative time with full date tooltip in UTC+3)
- **Filters:** status, plan type, platform dropdowns
- **Pagination:** "Load More" button, 20 items per page
- Back navigation link to promo codes list

---

### Firestore

#### New collection: `discountTransactions`
- Stores one document per user-code purchase
- Fields: `promoCode`, `affiliateId`, `rcAppUserId`, `firebaseUserId`, `offeringId`, `productIdentifier`, `planType`, `price`, `currency`, `platform`, `status`, `initialStatus`, `trialStartedAt`, `convertedAt`, `statusHistory`, `createdAt`, `payoutId`
- Status values: `trial`, `paid`, `refunded`, `trial_expired`

#### Enhanced collection: `promoCodes`
- New `type` values: `"discount"` (in addition to existing `"single_use"`)
- New fields for discount codes: `offeringId`, `affiliateId`, `note`
- `maxUses: -1` now supported for unlimited uses
- Existing documents unchanged (backwards compatible)

#### Indexes required
- `discountTransactions`: `promoCode` (ASC) + `rcAppUserId` (ASC)
- `discountTransactions`: `promoCode` (ASC) + `createdAt` (DESC)

---

### Documentation

- Created `DISCOUNT_PROMO_CODES_IMPLEMENTATION_PLAN.md` — full implementation plan with all 9 changes
- Created `DISCOUNT_PROMO_CODES_CLOUD_FUNCTIONS.md` — detailed cloud functions documentation with full source code, logic breakdowns, data flow, and Firestore schemas
