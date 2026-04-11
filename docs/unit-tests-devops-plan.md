# Unit Tests & DevOps Setup Plan

## Context
The project has no test framework, no test files, and no CI/CD pipeline. This plan sets up Vitest for unit and integration tests (excluding E2E), plus a GitHub Actions CI pipeline. All tests run locally on the dev machine; the Firebase emulator handles Firestore integration tests without hitting production.

---

## Phase 1 — Install & Configure Vitest

### Packages to install (devDependencies)
```
vitest @vitejs/plugin-react vite-tsconfig-paths
@testing-library/react @testing-library/jest-dom
@types/testing-library__jest-dom
```

### New file: `vitest.config.ts` (project root)
```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
  },
})
```

### New file: `src/__tests__/setup.ts`
- Import `@testing-library/jest-dom` for custom matchers
- Set emulator env vars for Firebase integration tests:
  - `FIRESTORE_EMULATOR_HOST=127.0.0.1:8080`
  - `FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099`

### Update `package.json` scripts
```json
"test": "vitest",
"test:run": "vitest run",
"test:coverage": "vitest run --coverage"
```

---

## Phase 2 — Unit Tests: Validation Schemas

**No mocks needed — pure Zod, instant run.**

### Files to create:
- `src/__tests__/validation/auth.test.ts`
  - AdminLoginSchema: empty string fails, 1 char passes, 200 chars passes, 201 fails, non-string fails

- `src/__tests__/validation/book.test.ts`
  - BookCreateSchema: required fields, enum values (draft/published), order int min 0, optional defaults
  - BookUpdateSchema: all fields optional, empty object passes (unlike NewsUpdate)
  - ChapterCreateSchema: order min 1 (not 0), no content length limit
  - ChapterUpdateSchema: all fields optional
  - ReorderSchema: min 1 item, empty strings in array fail

- `src/__tests__/validation/news.test.ts`
  - NewsCreateSchema: title 1-300, content 1-5000
  - NewsUpdateSchema: empty object `{}` fails refinement, one field passes

- `src/__tests__/validation/reader.test.ts`
  - ReadingProgressSchema: scrollPosition 0–100, lastChapterOrder min 1, ID max 128
  - AnalyticsViewSchema: type="chapter" without chapterId fails refinement, type="book" without chapterId passes

- `src/__tests__/validation/index.test.ts`
  - parseBody: returns success+data on valid input, returns 400 NextResponse on invalid input, flattened errors in response

---

## Phase 3 — Unit Tests: Utilities

**No mocks needed.**

### Files to create:
- `src/__tests__/lib/sanitize.test.ts`
  - Strips `<script>` tags and event handlers (onclick, onerror)
  - Preserves valid HTML (bold, italic, paragraphs)
  - Handles empty string input

- `src/__tests__/lib/rate-limit.test.ts`
  - First request always passes
  - Exactly maxRequests passes, maxRequests+1 fails
  - Different IPs tracked independently
  - After windowMs expires, counter resets (use `vi.useFakeTimers()`)
  - maxRequests=1 allows exactly one request per window

---

## Phase 4 — Unit Tests: API Routes (mocked)

Mock strategy: use `vi.mock()` to mock Firebase Admin SDK, jose, and Cloudinary. No emulator needed here — these are pure handler logic tests.

### Mock targets:
- `src/lib/firebase/admin` → mock `adminDb`, `adminAuth`
- `jose` → mock `SignJWT`, `jwtVerify`
- `cloudinary` → mock `v2.utils.private_download_url`

### Files to create:
- `src/__tests__/api/admin/login.test.ts`
  - Valid password → 200 + sets cookie
  - Wrong password → 401
  - Empty body → 400
  - 5 failed attempts → 429 on 6th

- `src/__tests__/api/admin/logout.test.ts`
  - POST → 200 + clears cookie (maxAge=0)

- `src/__tests__/api/admin/verify.test.ts`
  - Valid JWT cookie → 200 `{ authenticated: true }`
  - No cookie → 401 `{ authenticated: false }`
  - Invalid/expired JWT → 401 `{ authenticated: false }`

- `src/__tests__/api/admin/news.test.ts`
  - GET with valid JWT → 200 + news array
  - GET with no JWT → 401
  - POST with valid JWT + body → 200 `{ id }`
  - POST with invalid body → 400
  - PATCH with valid JWT + body → 200 `{ ok: true }`
  - PATCH empty body → 400
  - DELETE with valid JWT → 200 `{ ok: true }`

- `src/__tests__/api/reading-progress.test.ts`
  - Valid Firebase token + body → 200
  - Missing Authorization header → 401
  - Invalid token → 500
  - Invalid body → 400
  - Rate limit exceeded → 429

- `src/__tests__/api/analytics/view.test.ts`
  - Valid book view → 200, increments viewCount
  - Valid chapter view → 200, increments both book + chapter viewCount
  - type="chapter" without chapterId → 400
  - Non-existent book → 404
  - Rate limit exceeded → 429

- `src/__tests__/api/books/download.test.ts`
  - Valid PDF request → 200 with Content-Disposition
  - Valid EPUB request → 200
  - Missing format param → 400
  - Non-existent book → 404
  - No ebook URL on book → 404
  - Rate limit exceeded → 429
  - Cloudinary fetch fails → 502

---

## Phase 5 — Integration Tests: Firestore Service Layer (Firebase Emulator)

Requires Firebase emulator running. Tests use real Firestore operations against the emulator.

### Firebase emulator setup
Add to `firebase.json`:
```json
"emulators": {
  "firestore": { "port": 8080 },
  "auth": { "port": 9099 },
  "ui": { "enabled": true }
}
```

Test setup clears Firestore data between tests using emulator REST API.

### Files to create:
- `src/__tests__/firestore/books.test.ts`
  - createBook → sets chapterCount=0 and createdAt
  - getPublishedBooks → only returns status="published", ordered by order asc
  - getAllBooks → returns all regardless of status
  - updateBook → updates updatedAt, does not change createdAt
  - deleteBook → doc no longer exists

- `src/__tests__/firestore/chapters.test.ts`
  - createChapter → increments parent book chapterCount by 1
  - deleteChapter → decrements parent book chapterCount by 1
  - getPublishedChapters → only status="published", ordered by order asc
  - getAllChapters → all chapters for a book

- `src/__tests__/firestore/news.test.ts`
  - getNewsItems → ordered createdAt desc (newest first)

- `src/__tests__/firestore/bookmarks.test.ts`
  - addBookmark → doc ID is `${bookId}_${chapterId}`
  - isBookmarked → queries by bookId + chapterId fields
  - removeBookmark → doc deleted
  - addFavorite → doc ID is bookId
  - isFavorited → queries by bookId field

- `src/__tests__/firestore/reading-progress.test.ts`
  - saveProgress → upsert (overwrites existing)
  - getProgress → returns null for non-existent
  - getAllProgress → ordered by updatedAt desc

---

## Phase 6 — DevOps: GitHub Actions CI

### File: `.github/workflows/ci.yml`

- Triggers on **push to `dev`** and **PRs targeting `main`**
- Set branch protection on `main` in GitHub repo Settings → Branches → require CI to pass before merging

**Jobs (sequential):**
1. **lint-typecheck** — `npm run lint` + `npx tsc --noEmit`
2. **unit-tests** — validation + utility + API route tests (no emulator)
3. **integration-tests** — Firebase emulator + Firestore service tests

---

## File Summary

### Modified Files
| File | Change |
|------|--------|
| `package.json` | Add test scripts + devDependencies |
| `firebase.json` | Add emulators config |

### New Files
| File | Purpose |
|------|---------|
| `vitest.config.ts` | Test runner config with path aliases |
| `src/__tests__/setup.ts` | Global test setup + emulator env vars |
| `src/__tests__/validation/auth.test.ts` | AdminLoginSchema tests |
| `src/__tests__/validation/book.test.ts` | Book/Chapter/Reorder schema tests |
| `src/__tests__/validation/news.test.ts` | News schema tests |
| `src/__tests__/validation/reader.test.ts` | ReadingProgress + AnalyticsView tests |
| `src/__tests__/validation/index.test.ts` | parseBody helper tests |
| `src/__tests__/lib/sanitize.test.ts` | HTML sanitization tests |
| `src/__tests__/lib/rate-limit.test.ts` | Rate limiter tests |
| `src/__tests__/api/admin/login.test.ts` | Login route tests |
| `src/__tests__/api/admin/logout.test.ts` | Logout route tests |
| `src/__tests__/api/admin/verify.test.ts` | Verify route tests |
| `src/__tests__/api/admin/news.test.ts` | News CRUD route tests |
| `src/__tests__/api/reading-progress.test.ts` | Reading progress route tests |
| `src/__tests__/api/analytics/view.test.ts` | Analytics view route tests |
| `src/__tests__/api/books/download.test.ts` | Book download route tests |
| `src/__tests__/firestore/books.test.ts` | Books service integration tests |
| `src/__tests__/firestore/chapters.test.ts` | Chapters service integration tests |
| `src/__tests__/firestore/news.test.ts` | News service integration tests |
| `src/__tests__/firestore/bookmarks.test.ts` | Bookmarks service integration tests |
| `src/__tests__/firestore/reading-progress.test.ts` | Reading progress service integration tests |
| `.github/workflows/ci.yml` | GitHub Actions CI pipeline |

---

## Verification
1. `npm run test:run` — all validation + utility tests pass with no external services
2. `firebase emulators:start --only firestore,auth` → `npm run test:run` — Firestore integration tests pass
3. Push to `dev` → GitHub Actions triggers → all 3 jobs pass green
4. Open PR to `main` → CI re-runs → merge only when green
