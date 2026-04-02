# Auth Migration: Google + Email Link (Passwordless)

> **Status:** Planned — pending implementation  
> **Date:** 2026-04-01

---

## Why

The current email/password auth has no email verification — anyone can register with a fake address. Replacing it with Google Sign-In + Email Magic Link solves this: Google verifies emails automatically, and Firebase's email link flow verifies the address before granting access.

Firebase Console prerequisites (already done):
- Google sign-in provider: **enabled**
- Email/Password + Email link (passwordless): **enabled**
- `NEXT_PUBLIC_APP_URL` added to `.env.local`

---

## New Auth Flow

### Google Sign-In
- One-click via Google OAuth popup
- Display name + verified email come from Google profile automatically
- Works for both new and returning users in one step

### Email Link (Passwordless / Magic Link)
- User enters email → Firebase sends a magic link
- User clicks link in email → automatically signed in (email verified)
- Two-step flow: sign-in page → `/auth/verify` callback page
- Email stored in `localStorage("emailForSignIn")` between steps (Firebase requirement)
- Handles "opened on different device" edge case — re-asks for email

---

## Files to Change

| File | Change |
|------|--------|
| `src/components/auth/AuthProvider.tsx` | Add `signInWithGoogle()` + Firestore upsert on first login |
| `src/components/auth/SignInForm.tsx` | Replace email/password with Google button + email magic link form |
| `src/app/auth/verify/page.tsx` | **New** — email link callback handler |
| `src/app/auth/signup/page.tsx` | Swap `SignUpForm` → `SignInForm`, update heading to "Get Started" |
| `src/components/auth/SignUpForm.tsx` | **Delete** — no longer needed |
| `src/components/HeroSection.tsx` | Fix "Create a free account" link from `/auth/signup` → `/auth/signin` |

Header (`src/components/layout/Header.tsx`) — **no changes needed**, already links to `/auth/signin`.

---

## AuthProvider Changes

```typescript
// New import additions
import {
  GoogleAuthProvider,
  signInWithPopup,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { getClientDb } from "@/lib/firebase/client";

// New function
const signInWithGoogle = async () => {
  const result = await signInWithPopup(getClientAuth(), new GoogleAuthProvider());
  const u = result.user;
  const ref = doc(getClientDb(), "users", u.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      uid: u.uid,
      email: u.email,
      displayName: u.displayName,
      createdAt: serverTimestamp(),
    });
  }
};

// Add to context type
signInWithGoogle: () => Promise<void>;
```

---

## SignInForm UI Structure

```
┌─────────────────────────────────────┐
│  [G] Continue with Google           │
├─────────────────────────────────────┤
│           ── or ──                  │
├─────────────────────────────────────┤
│  Email: [________________]          │
│  [Send Magic Link]                  │
│                                     │
│  (after sending)                    │
│  ✓ Check your inbox for a sign-in   │
│    link. You can close this tab.    │
└─────────────────────────────────────┘
```

- `actionCodeSettings.url` = `${NEXT_PUBLIC_APP_URL}/auth/verify`
- Email saved to `localStorage("emailForSignIn")` before sending

---

## Verify Page (`/auth/verify`)

```
On mount:
  1. isSignInWithEmailLink(auth, window.location.href)?
  2. Read email from localStorage("emailForSignIn")
  3a. If found → signInWithEmailLink() → upsert Firestore user → redirect
  3b. If not found → show "Enter your email to confirm" form → complete sign-in
  4. Clear localStorage("emailForSignIn") on success
```

---

## Verification Checklist

1. Google sign-in → popup → sign in → home (or redirect target)
2. Email magic link → enter email → "Check your email" shown → click link → home
3. New user (Google) → Firestore `users/{uid}` created with Google display name
4. New user (email link) → Firestore `users/{uid}` created with email as displayName
5. Returning user → no duplicate Firestore doc created
6. Link opened on different device → re-enter email prompt → completes sign-in
7. Chapter page (unauthenticated) → `/auth/signin?redirect=...` → after sign-in → chapter
8. Sign out → home page
9. `/auth/signup` URL → shows same sign-in page (no broken links)
