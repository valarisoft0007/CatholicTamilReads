# Catholic Reads - Trail 5 Prototype

A chapter-by-chapter Catholic book reading platform built with Next.js, Firebase, and Cloudinary.

## Tech Stack

- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript
- **Database**: Google Cloud Firestore (NoSQL)
- **Auth**: Firebase Authentication — Google Sign-In only (users) + Custom JWT (admin)
- **Image CDN**: Cloudinary
- **Styling**: Tailwind CSS 4 + next-themes (dark/light mode)
- **Editor**: Tiptap (WYSIWYG rich text for admin)
- **Validation**: Zod (API input validation on all routes)

## Getting Started

### Prerequisites
- Node.js 18+
- npm
- Firebase project with Firestore and Authentication enabled
  - Enable **Google** sign-in provider
- Cloudinary account

### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy environment template and fill in credentials:
   ```bash
   cp .env.example .env.local
   ```
4. Configure `.env.local` with:
   - Firebase Client SDK keys (`NEXT_PUBLIC_FIREBASE_*`)
   - Firebase Measurement ID (`NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`) — from Firebase Console → Project Settings → Your apps → measurementId
   - Firebase Admin SDK credentials (`FIREBASE_ADMIN_*`)
   - Admin password and JWT secret (`ADMIN_PASSWORD`, `ADMIN_JWT_SECRET`)
   - Cloudinary credentials (`CLOUDINARY_*`)
   - App base URL (`NEXT_PUBLIC_APP_URL`):
     - Development: `NEXT_PUBLIC_APP_URL=http://localhost:3000`
     - Production: `NEXT_PUBLIC_APP_URL=https://your-app.vercel.app`

5. Deploy Firestore indexes and security rules:
   ```bash
   firebase deploy --only firestore:indexes
   firebase deploy --only firestore:rules
   ```

### Development

```bash
npm run dev        # Start dev server (Turbopack)
npm run build      # Production build
npm start          # Run production server
npm run lint       # Run ESLint
```

Dev server runs at `http://localhost:3000`

### Testing

The project uses **Vitest** for unit tests and integration tests. Integration tests run against the **Firebase Local Emulator** — no production data is touched.

#### Prerequisites for integration tests
- Java 17+ installed (required by the Firebase emulator)
- Firebase CLI installed globally:
  ```bash
  npm install -g firebase-tools
  ```

#### Unit tests (no emulator needed)
Covers: Zod validation schemas, utility functions (`sanitize`, `rate-limit`), and all API route handlers (with mocked Firebase/Cloudinary).

```bash
npm run test:run       # Run once and exit
npm run test           # Run in watch mode
npm run test:coverage  # Run with coverage report
```

#### Integration tests (Firebase emulator required)
Covers: Firestore service layer — books, chapters, news, bookmarks, reading progress.

**Terminal 1** — start the emulator with test rules:
```bash
npm run emulator:start
```

**Terminal 2** — run the integration tests:
```bash
npm run test:integration
```

Or run both in one command (starts emulator, runs tests, then stops emulator):
```bash
firebase --config firebase.test.json emulators:exec \
  --only firestore,auth \
  --project demo-test-project \
  "npm run test:integration"
```

#### Test structure
```
src/__tests__/
├── validation/        # Zod schema tests (auth, book, news, reader, index)
├── lib/               # Utility tests (sanitize, rate-limit)
├── api/               # API route handler tests (mocked Firebase/Cloudinary)
│   ├── admin/         # login, logout, verify, news CRUD, users
│   ├── analytics/     # view route
│   └── books/         # download route
└── firestore/         # Firestore + Auth emulator integration tests
    ├── books.test.ts
    ├── chapters.test.ts
    ├── news.test.ts
    ├── bookmarks.test.ts
    ├── reading-progress.test.ts
    └── users.test.ts  # Auth emulator — listUsers, pagination, create/delete
```

| Command | Tests | Requires |
|---------|-------|----------|
| `npm run test:run` | 147 unit + API tests | Nothing |
| `npm run test:integration` | 62 Firestore + Auth emulator tests | Emulator running |
| `npm run emulator:start` | — | Java 17+, firebase-tools |

## Project Structure

```
src/
├── app/                    # Pages and API routes (Next.js App Router)
│   ├── admin/              # Admin panel (JWT-protected)
│   ├── api/                # API route handlers
│   ├── auth/               # Sign in / Sign up pages
│   ├── books/              # Book detail + chapter reader
│   ├── profile/            # User library
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Home page
│   ├── not-found.tsx       # 404 page
│   ├── error.tsx           # Runtime error boundary
│   └── global-error.tsx    # Root layout crash fallback
├── components/             # React components by feature
│   ├── admin/              # BookForm, ChapterForm, RichTextEditor, ImageUpload
│   ├── auth/               # AuthProvider, SignInForm
│   ├── books/              # BookGrid, BookCard, TableOfContents
│   ├── layout/             # Header, Footer, AdminSidebar
│   └── reader/             # ChapterContent, ReadingProgressBar, BookmarkButton, etc.
├── hooks/                  # useAuth hook
├── lib/
│   ├── firebase/           # Firebase SDK initialization (admin + client)
│   └── firestore/          # Firestore CRUD operations (books, chapters, bookmarks, progress)
├── types/                  # TypeScript interfaces
└── middleware.ts           # Admin route protection
```

## Features

### Public (Readers)
- Browse published books with cover images and chapter/song counts; free books shown with a **Free** badge; books ordered by most recently updated first
- **Login required to read** — sign in with Google; free books and free sample chapters are readable without login
- Read chapters with customizable font size and progress tracking
- Auto-save reading progress (scroll position + last chapter)
- **Paginated table of contents** — 25 chapters per page with Prev/Next navigation (Firestore cursor-based; scales to 100+ chapters)
- Bookmark chapters and favorite books
- User profile with reading history, bookmarks, and favorites
- Dark/Light theme (Vatican Ivory / Cathedral Dark)
- Responsive design with mobile navigation
- Accessible — skip to main content link, ARIA labels, decorative elements hidden from screen readers, WCAG AA progress bar

### Admin Panel (`/admin`)
- Dashboard with published/draft/chapter stats, **total views**, and **top books by views**
- Book CRUD with cover image upload
- **Book type** — select "Book" (default) or "Songs" per book; all "Chapter/Chapters" labels adapt to "Song/Songs" across admin and reader pages
- **Free book toggle** — mark entire book as free (no login required) via the Edit Book form
- Chapter CRUD with Tiptap rich text editor
- **Free chapter toggle** — inline toggle per chapter on the chapters list (no need to open edit form)
- **Chapter drag-and-drop reorder** — drag handle on each row; batch Firestore write via `PATCH /api/admin/books/[bookId]/chapters/reorder`; reorder scoped to current page
- **Paginated chapter list** — 20 chapters per page with Prev/Next navigation; new chapter auto-numbered as last + 1
- **Content preview modal** — preview chapter content before saving using the same reader prose styles
- "Free" badge on book cards and free chapter indicators in table of contents
- Draft/Published status management
- Display order configuration
- Session: 8-hour JWT, 30-minute idle auto-logout
- Brute-force protection: 5 failed attempts per IP per 15 minutes → locked out
- All book/chapter writes go through Admin SDK API routes (`/api/admin/books/*`) — client SDK is read-only
- **Input validation**: all API routes validated with Zod schemas (`src/lib/validation/`); invalid requests return `400` with field-level error details
- Chapter HTML content sanitized at render time via `isomorphic-dompurify` (XSS prevention)
- CSP + `X-Content-Type-Options` + `X-Frame-Options` + `Referrer-Policy` headers on all responses (`next.config.ts`)
- Reader API rate limiting: `/api/reading-progress` (30 req/min), `/api/books/[bookId]/download` (10 req/hr)

### Analytics
- **Firestore view counters** — `viewCount` on book and chapter documents, incremented server-side via `POST /api/analytics/view` (rate-limited: 5/hour per IP per book)
- **Firebase Analytics** — `book_view` and `chapter_view` events logged client-side; visible in Firebase Console with time-series and demographics

## Database Schema (Firestore)

```
books/{bookId}                          # Book documents
  └── chapters/{chapterId}              # Chapter subcollection

users/{uid}                             # User documents (via Firebase Auth)
  ├── readingProgress/{bookId}          # Reading progress per book
  ├── bookmarks/{bookId_chapterId}      # Bookmarked chapters
  └── favorites/{bookId}               # Favorited books
```

## API Endpoints

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/api/admin/login` | Password | Admin JWT login (rate-limited: 5/15min per IP) |
| POST | `/api/admin/logout` | — | Clear admin session cookie (server-side) |
| GET | `/api/admin/verify` | JWT cookie | Verify admin session |
| POST | `/api/admin/upload` | JWT cookie | Upload image to Cloudinary |
| POST | `/api/admin/books` | JWT cookie | Create book |
| PATCH | `/api/admin/books/[bookId]` | JWT cookie | Update book |
| DELETE | `/api/admin/books/[bookId]` | JWT cookie | Delete book |
| POST | `/api/admin/books/[bookId]/chapters` | JWT cookie | Create chapter |
| PATCH | `/api/admin/books/[bookId]/chapters/[chapterId]` | JWT cookie | Update chapter |
| DELETE | `/api/admin/books/[bookId]/chapters/[chapterId]` | JWT cookie | Delete chapter |
| POST | `/api/reading-progress` | Firebase token | Save reading progress |
| PATCH | `/api/admin/books/[bookId]/chapters/reorder` | JWT cookie | Batch reorder chapters |
| POST | `/api/analytics/view` | None (public) | Increment book/chapter view counter (rate-limited) |

## Environment Variables

See [.env.example](.env.example) for the full list of required variables.

## Deployment

Optimized for **Vercel** deployment. Also compatible with any Node.js hosting that supports Next.js.

```bash
npm run build && npm start
```

### Production Checklist

1. Set `NEXT_PUBLIC_APP_URL=https://your-app.vercel.app` in Vercel environment variables
2. In Firebase Console → **Authentication → Settings → Authorized domains**, add your Vercel domain (e.g. `your-app.vercel.app`)

## Documentation

| File | Purpose |
|------|---------|
| [docs/PRD.md](docs/PRD.md) | Architecture, data models, features, full technical spec |
| [docs/testing-guide.md](docs/testing-guide.md) | Complete testing guide — architecture, how to run, add tests, CI sequence, tools, quirks |
| [docs/unit-tests-devops-plan.md](docs/unit-tests-devops-plan.md) | Original test setup implementation plan |
| [progress.md](progress.md) | Development progress tracker with checklist |
| [.claude/CLAUDE.md](.claude/CLAUDE.md) | Claude Code project instructions |
| [.env.example](.env.example) | Required environment variables template |

## License

Private - ValariSoft
