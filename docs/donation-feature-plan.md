# Donation Feature Plan

**Feature:** Donation Box  
**Date:** 2026-04-07  
**Status:** Awaiting Review

---

## 1. Overview

Add a donation capability to Catholic Tamil Reads so that readers and supporters — both in India and internationally — can financially support the platform's mission of making Catholic Tamil literature freely accessible.

---

## 2. Payment Gateways

| Gateway | Audience | Currency | Why |
|---|---|---|---|
| **Razorpay** | India | INR | Supports UPI, cards, netbanking — best Indian payment experience |
| **PayPal** | International | USD / EUR / GBP etc. | Globally recognized, easy for overseas donors |

The donation modal will present both options so donors can choose the method appropriate to them.

---

## 3. Non-Code Requirements (Before Development)

### 3.1 Razorpay Account Setup
1. Register at [razorpay.com](https://razorpay.com) → Sign Up
2. Account type: **Individual** or **Business/NGO** (NGO preferred if trust is registered)
3. KYC documents required:
   - PAN Card
   - Aadhaar Card (or Passport)
   - Bank account number + IFSC code
   - Cancelled cheque or bank statement
   - *(If NGO/Trust)* Trust deed or society registration certificate
4. Approval timeline: 1–3 business days
5. After approval → **Settings → API Keys** → generate keys:
   - `NEXT_PUBLIC_RAZORPAY_KEY_ID` *(publishable — safe for frontend)*
   - `RAZORPAY_KEY_SECRET` *(server-only — never expose)*
6. Configure Webhook:
   - Dashboard → **Webhooks → Add New**
   - URL: `https://www.catholictamilreads.com/api/donations/razorpay-webhook`
   - Event: `payment.captured`
   - Note the **Webhook Secret** → `RAZORPAY_WEBHOOK_SECRET`

### 3.2 PayPal Business Account Setup
1. Register at [paypal.com/business](https://www.paypal.com/business) → Create Business Account
2. Complete identity verification (personal or business)
3. Go to [developer.paypal.com](https://developer.paypal.com) → **My Apps & Credentials → Create App**
4. Note the credentials:
   - `NEXT_PUBLIC_PAYPAL_CLIENT_ID` *(publishable — safe for frontend)*
   - `PAYPAL_CLIENT_SECRET` *(server-only — never expose)*
5. Configure Webhook:
   - Developer Dashboard → **Webhooks → Add Webhook**
   - URL: `https://www.catholictamilreads.com/api/donations/paypal-webhook`
   - Event: `PAYMENT.CAPTURE.COMPLETED`

### 3.3 Donation Policy Decisions *(to confirm before development)*
- **Amount:** Donor enters any amount they choose — no preset suggestions shown
- Minimum donation amount (proposed: ₹10 INR / $1 USD — gateway minimum, not advertised)
- **Donor identity:** Must be a registered (Firebase Auth) user to donate — name and email auto-filled from their account, no manual entry needed. Unauthenticated users are prompted to sign in first.
- **Thank You message:** Show the following message in Tamil inside the modal after successful payment:
  > [பெயர்], உங்கள் தாராள நன்கொடைக்கு மிகவும் நன்றி.
  > உங்கள் ஆதரவு உலகெங்கும் உள்ள வாசகர்களுக்கு கத்தோலிக்க தமிழ் இலக்கியத்தை கொண்டு சேர்க்க உதவுகிறது.
  > இறைவன் உங்களை வளமாக ஆசீர்வதிப்பாராக.

### 3.4 Tax / Legal *(Optional — recommended if registered trust)*
- If the organization holds an **80G certificate**, donors in India can claim a tax deduction
- PayPal donations from international donors may require a W-8BEN or equivalent depending on jurisdiction
- Consider auto-emailing donation receipts (requires an email service such as Resend or SendGrid — separate feature)

---

## 4. Environment Variables to Add

Add these to `.env.example` and populate in the hosting environment (Vercel/server):

```env
# Razorpay (India donations)
NEXT_PUBLIC_RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=

# PayPal (International donations)
NEXT_PUBLIC_PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
```

---

## 5. UI Placement

| Location | What |
|---|---|
| **Home page** | `DonationSection` banner between the News panel and Books grid |
| **Footer** | "Support Us" button that opens the donation modal |

---

## 6. User Flow

```
User clicks "Support Us" / Donate button
        ↓
  Not logged in? → Redirect to Sign In
        ↓
DonationModal opens (logged-in users only)
  - Donor name & email pre-filled from Firebase Auth (read-only)
  - Enter amount (free-form)
  - Choose gateway: [Pay via Razorpay 🇮🇳] or [Pay via PayPal 🌍]
        ↓
[Razorpay path]                     [PayPal path]
POST /api/donations/razorpay-order  POST /api/donations/paypal-order
        ↓                                   ↓
Razorpay Checkout overlay opens     PayPal popup/redirect opens
        ↓                                   ↓
User completes payment              User approves payment
        ↓                                   ↓
Razorpay calls webhook              POST /api/donations/paypal-capture
        ↓                                   ↓
/api/donations/razorpay-webhook     PayPal calls webhook
verifies HMAC + records Firestore   verifies + records Firestore
        ↓                                   ↓
         Thank You screen shown inside modal
         (with donor name, amount, and a blessing message)
```

---

## 7. Code Changes

### New Files
| File | Purpose |
|---|---|
| `src/components/donations/DonationModal.tsx` | Client component — free-form amount input, gateway buttons |
| `src/components/donations/DonationSection.tsx` | Home page donation banner |
| `src/app/api/donations/razorpay-order/route.ts` | Create Razorpay order (server) |
| `src/app/api/donations/razorpay-webhook/route.ts` | Verify Razorpay payment + record to Firestore |
| `src/app/api/donations/paypal-order/route.ts` | Create PayPal order (server) |
| `src/app/api/donations/paypal-capture/route.ts` | Capture PayPal payment after approval |
| `src/app/api/donations/paypal-webhook/route.ts` | Verify PayPal payment + record to Firestore |
| `src/lib/firestore/donations.ts` | Firestore service: `recordDonation()`, `getDonations()` |

### Modified Files
| File | Change |
|---|---|
| `src/types/index.ts` | Add `Donation` interface |
| `src/app/page.tsx` | Add `<DonationSection />` between NewsPanel and BookGrid |
| `src/components/layout/Footer.tsx` | Add "Support Us" button → opens DonationModal |
| `.env.example` | Add Razorpay + PayPal env var placeholders |
| `docs/PRD.md` | Document the feature |
| `progress.md` | Mark feature status |

### npm Packages to Install
- `razorpay` — Razorpay Node.js SDK (server-side order creation)
- `@paypal/paypal-js` — PayPal JavaScript SDK (client-side button rendering)

---

## 8. Firestore Data Model

**Collection:** `donations`

```typescript
interface Donation {
  id: string;               // Firestore doc ID
  gateway: "razorpay" | "paypal";
  gatewayOrderId: string;   // Razorpay order_id or PayPal order ID
  gatewayPaymentId: string; // Razorpay payment_id or PayPal capture ID
  amount: number;           // In smallest currency unit (paise for INR, cents for USD)
  currency: string;         // "INR" | "USD" | "EUR" etc.
  status: "captured" | "failed";
  donorUid: string;         // Firebase Auth UID
  donorName: string;        // From Firebase Auth profile
  donorEmail: string;       // From Firebase Auth profile
  createdAt: Timestamp;
}
```

---

## 9. Security Notes

- Webhook endpoints verify cryptographic signatures before recording any payment (Razorpay: HMAC-SHA256; PayPal: webhook verification API)
- Secret keys (`RAZORPAY_KEY_SECRET`, `PAYPAL_CLIENT_SECRET`) are server-only — never sent to the browser
- Orders are created server-side to prevent amount tampering from the client

---

## 10. Testing Plan

1. Use **Razorpay Test Mode** keys during development — test cards/UPI available in Razorpay docs
2. Use **PayPal Sandbox** credentials during development — sandbox buyer accounts available in developer dashboard
3. Verify webhook fires and Firestore `donations` collection receives a document
4. Confirm modal renders correctly in both Vatican Ivory (light) and Cathedral Dark (dark) themes
5. Test on mobile viewport (modal must be responsive)

---

## 11. Future Enhancements (Phase 2)

- Admin dashboard page to view donation history
- Auto-email donation receipt to donor
- Donor "Thank You" wall on the home page
- Recurring monthly donations (Razorpay subscriptions / PayPal subscriptions)
