# Analytics Feature Plan

## Overview

Combine two approaches for tracking how books and chapters are read:

- **Option A — Firestore view counters**: `viewCount` on `Book` and `Chapter` documents, incremented server-side. Visible in the admin dashboard.
- **Option B — Firebase Analytics**: SDK events (`book_view`, `chapter_view`) logged client-side. Visible in the Firebase Console with time-series, demographics, and funnels — no custom UI needed.

---

## Rate Limiting Decision

Per-IP rate limiting (5 views/hour per IP per book) is sufficient:
- Unauthenticated readers still get tracked (no auth token required)
- Prevents refresh inflation without over-engineering
- Shared IPs (e.g., a group reading from one network) may undercount — acceptable tradeoff
- No Redis needed at current scale; in-process Map is fine

---

## Phase 1 — Types + Env + Firebase Client

### `src/types/index.ts`
Add `viewCount?: number` to both `Book` and `Chapter` interfaces.
- Optional field — Firestore creates it on first `FieldValue.increment(1)`, no migration needed.

### `.env.example`
```
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=   # From Firebase Console → Project Settings → Your apps → measurementId
```

### `src/lib/firebase/client.ts`
- Add `measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` to `firebaseConfig`
- Add export:

```typescript
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";

let _analytics: Analytics | undefined;

export async function getClientAnalytics(): Promise<Analytics | null> {
  if (!process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID) return null;
  if (typeof window === "undefined") return null;
  if (_analytics) return _analytics;
  if (!(await isSupported())) return null;
  _analytics = getAnalytics(getApp());
  return _analytics;
}
```

---

## Phase 2 — View Tracking API Route

**New file:** `src/app/api/analytics/view/route.ts`

- `POST` only, no auth required (public route)
- Body: `{ type: "book" | "chapter", bookId: string, chapterId?: string }`
- Rate limit: `createRateLimiter(5, 60 * 60 * 1000)` from `src/lib/rate-limit.ts`
- Rate limit key: `${ip}:${bookId}` (per-book, not global)
- Verify target exists and `status === "published"` before incrementing
- Firestore increments via Admin SDK:
  - Book: `adminDb.collection("books").doc(bookId).update({ viewCount: FieldValue.increment(1) })`
  - Chapter: additionally update the chapter subcollection doc
- Returns `{ success: true }` — client ignores response

---

## Phase 3 — Fire Tracking in Reader Pages

Fire-and-forget on page load — never `await`, always `.catch(() => {})`.

### Book detail page (`src/app/books/[bookId]/page.tsx`)
After `setBook(b)`, if `b.status === "published"`:

```typescript
// Firestore counter
fetch("/api/analytics/view", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ type: "book", bookId }),
}).catch(() => {});

// Firebase Analytics
import { logEvent } from "firebase/analytics";
getClientAnalytics().then((a) => {
  if (a) logEvent(a, "book_view", { book_id: bookId, book_title: b.title });
}).catch(() => {});
```

### Chapter reader page (`src/app/books/[bookId]/chapters/[chapterId]/page.tsx`)
Same pattern with `type: "chapter"`:

```typescript
fetch("/api/analytics/view", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ type: "chapter", bookId, chapterId }),
}).catch(() => {});

getClientAnalytics().then((a) => {
  if (a) logEvent(a, "chapter_view", { book_id: bookId, chapter_id: chapterId, chapter_title: chapter.title });
}).catch(() => {});
```

---

## Phase 4 — Admin Dashboard (`src/app/admin/page.tsx`)

All derived from the existing `books` array — no new Firestore queries needed.

1. **Total Views stat card**
   ```typescript
   books.reduce((sum, b) => sum + (b.viewCount ?? 0), 0)
   ```

2. **Top 5 Books table** — columns: Title, Status, Views
   ```typescript
   [...books].sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0)).slice(0, 5)
   ```

3. **Firebase Analytics Console link**
   ```
   https://console.firebase.google.com/project/{NEXT_PUBLIC_FIREBASE_PROJECT_ID}/analytics
   ```

---

## Critical Files

| File | Change |
|------|--------|
| `src/types/index.ts` | Add `viewCount?: number` to Book + Chapter |
| `.env.example` | Add `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=` |
| `src/lib/firebase/client.ts` | Add `measurementId` to config + `getClientAnalytics()` |
| `src/app/api/analytics/view/route.ts` | **New** — POST, rate-limited, Admin SDK increment |
| `src/app/books/[bookId]/page.tsx` | Fire-and-forget tracking on book load |
| `src/app/books/[bookId]/chapters/[chapterId]/page.tsx` | Fire-and-forget tracking on chapter load |
| `src/app/admin/page.tsx` | Total Views card + Top Books table + Analytics link |

## Implementation Order
1. Types + `.env.example` (additive, zero risk)
2. Firebase client (`getClientAnalytics`) — no effect until called
3. API route — testable with curl before any UI wires it up
4. Reader page tracking calls
5. Admin dashboard additions

## Verification
- Open a book page → Firestore console → `books/{bookId}.viewCount` increments by 1
- Reload within 1 hour (same IP) → count does NOT increment again
- Firebase Console → Analytics → Events → `book_view` / `chapter_view` appear (up to 24h delay)
- Admin dashboard → Total Views sums correctly; Top Books sorted desc by views
