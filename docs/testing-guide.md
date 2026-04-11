# Testing Guide — Catholic Tamil Reads

## Overview

The project uses **Vitest** for both unit and integration testing. Tests are split into two tiers:

| Tier | Count | Requires | Command |
|------|-------|----------|---------|
| Unit + API | 135 tests | Nothing | `npm run test:run` |
| Integration (Firestore) | 46 tests | Firebase emulator | `npm run test:integration` |

Both tiers run automatically in the GitHub Actions CI pipeline on every push to `dev` and on every PR targeting `main`.

---

## Architecture

```
src/__tests__/
├── setup.ts                        # Global setup: jest-dom matchers + emulator env vars
│
├── validation/                     # Tier 1 — Zod schema unit tests
│   ├── auth.test.ts                # AdminLoginSchema
│   ├── book.test.ts                # BookCreateSchema, BookUpdateSchema, ChapterCreate/Update, ReorderSchema
│   ├── news.test.ts                # NewsCreateSchema, NewsUpdateSchema
│   ├── reader.test.ts              # ReadingProgressSchema, AnalyticsViewSchema
│   └── index.test.ts               # parseBody() shared helper
│
├── lib/                            # Tier 1 — Utility unit tests
│   ├── sanitize.test.ts            # isomorphic-dompurify HTML sanitizer
│   └── rate-limit.test.ts          # In-memory rate limiter (fake timers)
│
├── api/                            # Tier 1 — API route handler tests (all mocked)
│   ├── admin/
│   │   ├── login.test.ts           # POST /api/admin/login
│   │   ├── logout.test.ts          # POST /api/admin/logout
│   │   ├── verify.test.ts          # GET /api/admin/verify
│   │   └── news.test.ts            # GET/POST/PATCH/DELETE /api/admin/news
│   ├── analytics/
│   │   └── view.test.ts            # POST /api/analytics/view
│   ├── books/
│   │   └── download.test.ts        # GET /api/books/[bookId]/download
│   └── reading-progress.test.ts    # POST /api/reading-progress
│
└── firestore/                      # Tier 2 — Firestore integration tests (emulator)
    ├── helpers.ts                  # Emulator setup/teardown/clear utilities
    ├── books.test.ts               # books CRUD service layer
    ├── chapters.test.ts            # chapters CRUD + chapterCount sync
    ├── bookmarks.test.ts           # bookmarks + favorites operations
    ├── news.test.ts                # news read operations
    └── reading-progress.test.ts    # progress save/get/getAll
```

---

## How It Works

### Tier 1 — Unit Tests (no external services)

**Validation tests** call `safeParse()` directly on Zod schemas. No mocks, no setup — pure logic.

```ts
// Example: src/__tests__/validation/book.test.ts
import { BookCreateSchema } from '@/lib/validation/book'

it('rejects empty title', () => {
  expect(BookCreateSchema.safeParse({ ...validBook, title: '' }).success).toBe(false)
})
```

**API route tests** import the Next.js route handler directly and call it with a real `NextRequest`. Firebase, jose, and Cloudinary are mocked via `vi.mock()` so no real services are called.

```ts
// Example: src/__tests__/api/admin/login.test.ts
vi.mock('jose', () => { ... })                       // mock JWT signing
vi.mock('@/lib/firebase/admin', () => { ... })        // mock Firestore Admin SDK

it('returns 200 on correct password', async () => {
  const { POST } = await import('@/app/api/admin/login/route')
  const req = new NextRequest('http://localhost/api/admin/login', {
    method: 'POST',
    body: JSON.stringify({ password: 'correct-password' }),
  })
  const res = await POST(req)
  expect(res.status).toBe(200)
})
```

**Key mock targets used across API tests:**

| Import path | What it mocks |
|---|---|
| `jose` | `SignJWT`, `jwtVerify` |
| `@/lib/firebase/admin` | `adminDb`, `adminAuth` |
| `@/lib/firebase/client` | `getClientDb()` — returns emulator DB in integration tests |
| `cloudinary` | `v2.utils.private_download_url` |
| `global fetch` | `vi.stubGlobal('fetch', ...)` |

> **Note on `SignJWT` mocking:** `new SignJWT(...)` requires a regular function constructor, not an arrow function. The mock uses `function MockSignJWT() { return { ... } }`.

---

### Tier 2 — Integration Tests (Firebase Emulator)

These tests hit a **real Firestore database** running in the Firebase Local Emulator. No production data is ever touched.

**How the emulator connection works:**

1. `src/__tests__/setup.ts` sets `FIRESTORE_EMULATOR_HOST=127.0.0.1:8080` as an env var
2. Each test file mocks `@/lib/firebase/client` to return the emulator-connected Firestore
3. The connection is established via `@firebase/rules-unit-testing` (`initializeTestEnvironment`)

```ts
// src/__tests__/firestore/helpers.ts
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'

export async function setupTestEnvironment() {
  testEnv = await initializeTestEnvironment({
    projectId: 'demo-test-project',
    firestore: { host: '127.0.0.1', port: 8080 },
  })
}

export function getTestDb() {
  return testEnv.unauthenticatedContext().firestore()
}

export async function clearFirestore() {
  await testEnv.clearFirestore()   // wipes all data between tests
}
```

**Standard integration test structure:**

```ts
// src/__tests__/firestore/books.test.ts
vi.mock('@/lib/firebase/client', () => ({
  getClientDb: () => getTestDb(),       // redirect service layer to emulator
}))

import { createBook, getPublishedBooks } from '@/lib/firestore/books'

beforeAll(async () => { await setupTestEnvironment() })
beforeEach(async () => { await clearFirestore() })    // fresh DB every test
afterAll(async () => { await teardownTestEnvironment() })

it('createBook sets chapterCount to 0', async () => {
  const id = await createBook({ title: 'Test', ... })
  const books = await getAllBooks()
  expect(books[0].chapterCount).toBe(0)
})
```

**Why `fileParallelism: false`:** Integration test files must run sequentially. If two files call `clearFirestore()` at the same time, they wipe each other's data mid-test. The `vitest.integration.config.ts` sets `fileParallelism: false` to enforce sequential execution.

---

## Configuration Files

### `vitest.config.ts` — Unit tests
```ts
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
  },
})
```

### `vitest.integration.config.ts` — Integration tests
```ts
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
    fileParallelism: false,    // sequential — prevents emulator data races
  },
})
```

### `firebase.test.json` — Emulator config (test only)
Points to `firestore.test.rules` (fully open rules — allow all reads/writes). Used only for emulator. Never used in production.

### `firestore.test.rules` — Open rules for emulator
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} { allow read, write: if true; }
  }
}
```

---

## Running Tests Locally

### Unit tests (fastest — no setup needed)
```bash
npm run test:run
```

### Integration tests (requires emulator)

**Terminal 1 — start emulator:**
```bash
npm run emulator:start
# Starts Firestore (port 8080) + Auth (port 9099) emulators
# Emulator UI at http://localhost:4000
```

**Terminal 2 — run integration tests:**
```bash
npm run test:integration
```

### Coverage report
```bash
npm run test:coverage
# Opens coverage/ folder with HTML report
# Current: ~95% statement coverage
```

### Watch mode (during development)
```bash
npm run test
# Re-runs affected tests on file save
```

---

## CI Pipeline

Defined in `.github/workflows/ci.yml`. Triggers on:
- Every push to `dev`
- Every PR targeting `main`

### Sequence

```
Push to dev / PR to main
        │
        ▼
┌─────────────────────┐
│  Lint & Type Check  │  Node 24, ubuntu-latest
│  ─────────────────  │  1. npm install
│  eslint .           │  2. eslint .
│  tsc --noEmit       │  3. npx tsc --noEmit
└──────────┬──────────┘
           │ passes
           ▼
┌─────────────────────┐
│    Unit Tests       │  Node 24, ubuntu-latest
│  ─────────────────  │  env: ADMIN_PASSWORD, ADMIN_JWT_SECRET
│  135 tests          │  1. npm install
│  ~30s               │  2. npm run test:run
└──────────┬──────────┘
           │ passes
           ▼
┌─────────────────────────────────┐
│  Integration Tests              │  Node 24, ubuntu-latest
│  ─────────────────              │  + Java 21 (Temurin)
│  46 Firestore tests             │  1. npm install
│  ~1min                          │  2. npm install -g firebase-tools
│                                 │  3. firebase emulators:exec ...
│                                 │     "npm run test:integration"
└─────────────────────────────────┘
           │ all pass
           ▼
    PR can merge to main
```

### Branch protection
`main` branch requires all 3 jobs to pass. Configured in:
`GitHub → Settings → Branches → Branch protection rules → main`

### CI environment variables
Unit test job uses hardcoded test values (not real credentials):
```yaml
env:
  ADMIN_PASSWORD: test-password
  ADMIN_JWT_SECRET: test-secret-key-for-ci
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: demo-test-project
```

---

## Adding New Tests

### Adding a validation test

1. Open the matching file in `src/__tests__/validation/`
2. Import the schema and call `safeParse()`:

```ts
import { MySchema } from '@/lib/validation/my-module'

describe('MySchema', () => {
  it('accepts valid input', () => {
    expect(MySchema.safeParse({ field: 'value' }).success).toBe(true)
  })

  it('rejects missing required field', () => {
    expect(MySchema.safeParse({}).success).toBe(false)
  })
})
```

No mocks, no `beforeAll` — just import and test.

---

### Adding an API route test

1. Create `src/__tests__/api/<area>/my-route.test.ts`
2. Mock all external dependencies at the top with `vi.mock()`
3. Import the route handler inside the test (not at the top) so mocks are applied first
4. Use `NextRequest` to construct requests

```ts
import { describe, it, expect, vi } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/firebase/admin', () => ({
  adminDb: { collection: vi.fn() },
}))

vi.mock('jose', () => ({
  jwtVerify: vi.fn().mockResolvedValue({ payload: {} }),
}))

it('returns 200 on valid request', async () => {
  const { GET } = await import('@/app/api/my-route/route')
  const req = new NextRequest('http://localhost/api/my-route', {
    headers: { cookie: 'admin_session=valid-token' },
  })
  const res = await GET(req)
  expect(res.status).toBe(200)
})
```

> Always import the route handler **inside** the test or a `beforeEach`, not at the top of the file. `vi.mock()` is hoisted but dynamic imports happen after mocks are applied.

---

### Adding a Firestore integration test

1. Create `src/__tests__/firestore/my-feature.test.ts`
2. Follow this exact structure:

```ts
import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest'
import { getTestDb, setupTestEnvironment, clearFirestore, teardownTestEnvironment } from './helpers'

// Redirect service layer to emulator
vi.mock('@/lib/firebase/client', () => ({
  getClientDb: () => getTestDb(),
}))

// Import service functions AFTER the mock
import { myServiceFunction } from '@/lib/firestore/my-feature'

beforeAll(async () => { await setupTestEnvironment() })
beforeEach(async () => { await clearFirestore() })     // fresh slate every test
afterAll(async () => { await teardownTestEnvironment() })

describe('myServiceFunction', () => {
  it('does what it says', async () => {
    await myServiceFunction(args)
    // verify via service layer or direct Firestore reads
    const db = getTestDb()
    const snap = await getDoc(doc(db, 'collection', 'docId'))
    expect(snap.exists()).toBe(true)
  })
})
```

3. Run with `npm run test:integration` (emulator must be running)

---

## Where to Look for What

| Question | Look here |
|---|---|
| What schemas are tested? | `src/__tests__/validation/` |
| How is an API route tested? | `src/__tests__/api/<area>/` |
| How is Firestore tested? | `src/__tests__/firestore/` |
| How does the emulator connect? | `src/__tests__/firestore/helpers.ts` |
| What env vars are set for tests? | `src/__tests__/setup.ts` |
| What Vitest config runs unit tests? | `vitest.config.ts` |
| What Vitest config runs integration tests? | `vitest.integration.config.ts` |
| What Firebase config starts the emulator? | `firebase.test.json` |
| What Firestore rules does the emulator use? | `firestore.test.rules` |
| What does CI run and in what order? | `.github/workflows/ci.yml` |
| What packages are installed for testing? | `package.json` devDependencies |

---

## Tools & Packages

| Package | Role |
|---|---|
| `vitest` | Test runner — Jest-compatible API, fast ESM/TypeScript support |
| `@vitejs/plugin-react` | React JSX support in Vitest (needed for component tests) |
| `vite-tsconfig-paths` | Resolves `@/*` path aliases inside tests |
| `@testing-library/react` | React component testing utilities |
| `@testing-library/jest-dom` | Custom matchers (`toBeInTheDocument`, etc.) |
| `@firebase/rules-unit-testing` | Official Firebase emulator client for integration tests |
| `@vitest/coverage-v8` | V8 coverage provider for `npm run test:coverage` |

---

## Known Quirks

- **`SignJWT` mock must use a regular function** — `new SignJWT()` is called as a constructor. Arrow functions cannot be constructors. Use `function MockSignJWT() { return { ... } }`.
- **Dynamic route handler imports** — Import route handlers inside the test body, not at the file top. This ensures `vi.mock()` hoisting runs before the import.
- **`fileParallelism: false`** — Required for integration tests. Parallel file execution causes `clearFirestore()` calls to race across files and wipe each other's data.
- **`npm install` in CI (not `npm ci`)** — The `package-lock.json` is generated on Windows and is missing Linux platform-specific optional packages. `npm ci` would fail; `npm install` resolves them fresh.
- **`eslint .` (not `next lint`)** — Next.js 16 CLI treats the first argument as a project directory, so `next lint` tries to open a folder named `lint`. Use ESLint directly instead.
- **Java 21 required** — `firebase-tools` dropped support for Java below 21. The CI uses `actions/setup-java@v4` with `java-version: 21`.
