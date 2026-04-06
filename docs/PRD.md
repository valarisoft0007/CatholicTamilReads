# Catholic Tamil Reads - Product Requirements Document

> **Related docs**: [README.md](../README.md) (setup guide) | [progress.md](../progress.md) (dev tracker) | [CLAUDE.md](../.claude/CLAUDE.md) (Claude Code instructions)

## 1. Project Overview

**Product Name**: Catholic Tamil Reads
**Domain**: https://www.catholictamilreads.com
**Prototype**: Trail 5
**Type**: Full-stack online book reading platform for Catholic Tamil literature
**Architecture**: Monolithic Next.js application with Firebase backend
**Status**: ~73% complete (see [progress.md](../progress.md) for details)

### Purpose

A chapter-by-chapter book reading platform designed for Catholic Tamil literature. Readers can browse, read, bookmark, and track their progress through published books. Administrators manage content through a built-in admin panel with a rich text editor.

---

## 2. Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.2.1 |
| UI Library | React | 19.2.4 |
| Language | TypeScript | 5.9.3 |
| Styling | Tailwind CSS + PostCSS | 4.2.2 |
| Database | Google Cloud Firestore (NoSQL) | via Firebase 12.11.0 |
| User Auth | Firebase Authentication | via Firebase 12.11.0 |
| Admin Auth | JWT (jose library) | 6.2.2 |
| Image CDN | Cloudinary | 2.9.0 |
| Rich Text Editor | Tiptap | 3.20.5 |
| Theme Management | next-themes | 0.4.6 |
| Data Fetching | SWR | 2.4.1 |
| Dev Bundler | Turbopack | built-in |
| Linting | ESLint | 9.39.4 |

---

## 3. Architecture

### 3.1 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js Application                      │
│                                                              │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────┐ │
│  │  Public UI   │   │   Admin UI   │   │   API Routes     │ │
│  │  (SSR + CSR) │   │    (CSR)     │   │   (Node.js)      │ │
│  └──────┬───────┘   └──────┬───────┘   └────────┬─────────┘ │
│         │                  │                     │           │
│  ┌──────┴──────────────────┴─────────────────────┴────────┐  │
│  │                 Service Layer (src/lib/)                │  │
│  │   firestore/books.ts     │  firebase/client.ts         │  │
│  │   firestore/chapters.ts  │  firebase/admin.ts          │  │
│  │   firestore/bookmarks.ts │  firebase/storage.ts        │  │
│  │   firestore/reading-progress.ts                        │  │
│  └────────────────────────┬───────────────────────────────┘  │
│                           │                                  │
│  ┌────────────────────────┴───────────────────────────────┐  │
│  │           Middleware (src/middleware.ts)                 │  │
│  │        JWT verification for /admin/* routes             │  │
│  └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
        ┌──────────┐  ┌──────────┐  ┌──────────┐
        │ Firestore│  │ Firebase │  │Cloudinary│
        │    DB    │  │   Auth   │  │  (CDN)   │
        └──────────┘  └──────────┘  └──────────┘
```

### 3.2 Key Architectural Decisions

1. **Monolithic Next.js** — No separate backend server; API routes + direct Firestore client calls handle all data operations.
2. **Firestore subcollections** — Chapters nested under books; user data (progress, bookmarks, favorites) nested under user documents.
3. **Denormalized data** — Bookmarks and favorites store titles and cover URLs to avoid cross-collection reads.
4. **Dual authentication** — Firebase Auth for readers, custom JWT for admin panel (simpler admin access without Firebase user management).
5. **Cloudinary for images** — Offloads image storage and CDN delivery from Firebase Storage.
6. **Client-side Firestore reads** — Most data reads happen directly from client to Firestore without API intermediary.
7. **Server-side admin operations** — All admin writes (books, chapters CRUD) go through API routes using the Admin SDK, which bypasses Firestore security rules. Client SDK is used for reads only.
8. **Firestore security rules** — Client SDK access is locked down: books/chapters are read-only from the client; user subcollections (progress, bookmarks, favorites) are owner-only.

### 3.3 Directory Structure

```
src/
├── app/                              # Next.js App Router
│   ├── layout.tsx                    # Root layout (providers, header, footer)
│   ├── page.tsx                      # Home page (hero + book grid)
│   ├── globals.css                   # Theme variables + global styles
│   ├── auth/
│   │   ├── signin/page.tsx           # User sign-in page (Google + email magic link)
│   │   ├── signup/page.tsx           # Alias — renders same sign-in page
│   │   └── verify/page.tsx           # Email magic link callback handler
│   ├── books/
│   │   └── [bookId]/
│   │       ├── page.tsx              # Book detail page
│   │       └── chapters/
│   │           └── [chapterId]/page.tsx  # Chapter reader
│   ├── profile/page.tsx              # User library (protected)
│   ├── admin/
│   │   ├── layout.tsx                # Admin layout with sidebar
│   │   ├── page.tsx                  # Admin dashboard
│   │   ├── login/page.tsx            # Admin login
│   │   ├── news/page.tsx             # News management (add/delete items)
│   │   └── books/
│   │       ├── page.tsx              # Book list management
│   │       ├── new/page.tsx          # Create new book
│   │       └── [bookId]/
│   │           ├── page.tsx          # Edit book
│   │           └── chapters/
│   │               ├── page.tsx      # Chapter list management
│   │               ├── new/page.tsx  # Create new chapter
│   │               └── [chapterId]/page.tsx  # Edit chapter
│   └── api/
│       ├── admin/
│       │   ├── login/route.ts        # POST: Admin JWT login
│       │   ├── verify/route.ts       # GET: Verify admin session
│       │   ├── logout/route.ts       # POST: Clear admin session cookie
│       │   ├── upload/route.ts       # POST: Image upload to Cloudinary
│       │   └── news/
│       │       ├── route.ts          # GET: List news | POST: Create news item
│       │       └── [newsId]/route.ts # PATCH: Update | DELETE: Remove news item
│       └── reading-progress/route.ts # POST: Save reading progress
├── components/
│   ├── layout/
│   │   ├── Header.tsx                # Sticky nav with mobile menu
│   │   ├── Footer.tsx                # Site footer with links
│   │   └── AdminSidebar.tsx          # Admin navigation sidebar
│   ├── auth/
│   │   ├── AuthProvider.tsx          # Firebase auth context provider (Google + email link)
│   │   └── SignInForm.tsx            # Google button + email magic link form
│   ├── books/
│   │   ├── BookGrid.tsx              # Grid display of published books
│   │   ├── BookCard.tsx              # Individual book card component
│   │   └── TableOfContents.tsx       # Chapter list with read status
│   ├── reader/
│   │   ├── ChapterContent.tsx        # HTML content renderer
│   │   ├── ReadingProgressBar.tsx    # Scroll progress indicator
│   │   ├── BookmarkButton.tsx        # Bookmark toggle
│   │   ├── FontSizeToggle.tsx        # S/M/L text size selector
│   │   ├── ChapterNavigation.tsx     # Prev/Next chapter buttons
│   │   └── BackToTop.tsx             # Floating scroll-to-top button
│   ├── admin/
│   │   ├── BookForm.tsx              # Book create/edit form
│   │   ├── ChapterForm.tsx           # Chapter create/edit form
│   │   ├── RichTextEditor.tsx        # Tiptap WYSIWYG editor
│   │   └── ImageUpload.tsx           # Image upload with preview
│   ├── ui/                           # Generic UI components (placeholder)
│   ├── HeroSection.tsx               # Landing page hero
│   ├── NewsPanel.tsx                 # News cards — responsive grid between hero and books
│   ├── ThemeProvider.tsx             # next-themes wrapper
│   └── ThemeToggle.tsx               # Dark/light mode toggle
├── hooks/
│   └── useAuth.ts                    # Auth context consumer hook
├── lib/
│   ├── firebase/
│   │   ├── admin.ts                  # Firebase Admin SDK initialization
│   │   ├── client.ts                 # Firebase Client SDK (singleton)
│   │   └── storage.ts                # Image upload utilities
│   ├── sanitize.ts                   # HTML sanitization via isomorphic-dompurify (XSS prevention)
│   └── firestore/
│       ├── books.ts                  # Book CRUD operations (reads only — writes via API routes)
│       ├── chapters.ts               # Chapter CRUD operations (reads only — writes via API routes)
│       ├── bookmarks.ts              # Bookmarks & favorites operations
│       ├── reading-progress.ts       # Reading progress tracking
│       └── news.ts                   # News items (reads only — writes via API routes)
├── types/
│   └── index.ts                      # All TypeScript interfaces
└── middleware.ts                     # Admin route protection (JWT)
```

---

## 4. Data Models

### 4.1 Firestore Collection Structure

```
books/                              # Top-level collection
  └── {bookId}/
      └── chapters/                 # Subcollection per book

news/                               # Top-level collection (admin-managed announcements)

users/                              # Implicit via Firebase Auth
  └── {uid}/
      ├── readingProgress/          # Subcollection (keyed by bookId)
      ├── bookmarks/                # Subcollection (keyed by bookId_chapterId)
      └── favorites/                # Subcollection (keyed by bookId)
```

### 4.2 Entity Schemas

#### Book
| Field | Type | Description |
|-------|------|-------------|
| id | string | Document ID |
| title | string | Book title |
| description | string | Book description/summary |
| coverImageUrl | string | Cloudinary image URL |
| authorName | string | Author display name |
| status | "draft" \| "published" | Publication status |
| chapterCount | number | Auto-managed on chapter create/delete |
| order | number | Display sort order |
| isFree | boolean (optional) | If true, all chapters readable without login |
| createdAt | Timestamp | Server timestamp |
| updatedAt | Timestamp | Server timestamp |

#### Chapter (subcollection of Book)
| Field | Type | Description |
|-------|------|-------------|
| id | string | Document ID |
| bookId | string | Parent book reference |
| title | string | Chapter title |
| content | string | HTML content from Tiptap editor |
| order | number | Chapter sequence number |
| status | "draft" \| "published" | Publication status |
| isFree | boolean (optional) | If true, this chapter is readable without login |
| createdAt | Timestamp | Server timestamp |
| updatedAt | Timestamp | Server timestamp |

#### ReadingProgress (subcollection of User)
| Field | Type | Description |
|-------|------|-------------|
| bookId | string | Book being read |
| lastChapterId | string | Most recently read chapter |
| lastChapterOrder | number | Chapter order number |
| scrollPosition | number | Scroll percentage (0-100) |
| updatedAt | Timestamp | Server timestamp |

#### Bookmark (subcollection of User)
| Field | Type | Description |
|-------|------|-------------|
| id | string | Composite: `{bookId}_{chapterId}` |
| bookId | string | Book reference |
| chapterId | string | Chapter reference |
| bookTitle | string | Denormalized for display |
| chapterTitle | string | Denormalized for display |
| createdAt | Timestamp | Server timestamp |

#### Favorite (subcollection of User)
| Field | Type | Description |
|-------|------|-------------|
| bookId | string | Book reference |
| bookTitle | string | Denormalized for display |
| coverImageUrl | string | Denormalized for display |
| createdAt | Timestamp | Server timestamp |

#### NewsItem
| Field | Type | Description |
|-------|------|-------------|
| id | string | Document ID |
| title | string | News headline |
| content | string | News body text |
| createdAt | Timestamp | Server timestamp |
| updatedAt | Timestamp | Server timestamp |

#### UserProfile
| Field | Type | Description |
|-------|------|-------------|
| uid | string | Firebase Auth UID |
| email | string | User email |
| displayName | string | Display name |
| createdAt | Timestamp | Account creation time |

### 4.3 Firestore Indexes

| Collection | Fields | Purpose |
|------------|--------|---------|
| books | status (ASC) + order (ASC) | Published books sorted by display order |
| chapters | status (ASC) + order (ASC) | Published chapters sorted by sequence |
| news | createdAt (DESC) | News items sorted newest-first |

### 4.4 Firestore Security Rules

Rules are defined in `firestore.rules` and deployed via `firebase deploy --only firestore:rules`.

| Collection | Client Read | Client Write | Notes |
|------------|-------------|--------------|-------|
| `books` | ✅ public | ❌ blocked | Admin writes via Admin SDK API routes |
| `books/*/chapters` | ✅ public | ❌ blocked | Admin writes via Admin SDK API routes |
| `news` | ✅ public | ❌ blocked | Admin writes via Admin SDK API routes |
| `users/{uid}` | owner only | owner only | `request.auth.uid == uid` |
| `users/{uid}/readingProgress` | owner only | owner only | |
| `users/{uid}/bookmarks` | owner only | owner only | |
| `users/{uid}/favorites` | owner only | owner only | |

The Admin SDK (used in `/api/admin/*` routes) bypasses all security rules.

---

## 5. Authentication

### 5.1 User Authentication (Firebase Auth)

- **Methods**: Google Sign-In (OAuth popup) + Email Magic Link (passwordless)
- **Provider**: Firebase Authentication SDK
- **Client-side**: `AuthProvider` context wraps the app, `useAuth()` hook provides `user`, `loading`, `signOut()`, `signInWithGoogle()`
- **Session**: Managed by Firebase SDK (persistent browser session)
- **API Protection**: Firebase ID token sent as Bearer token in Authorization header
- **Email verification**: Guaranteed — Google verifies via OAuth; email link verifies by delivery
- **New user flow**: First sign-in (either method) auto-creates Firestore `users/{uid}` doc
- **Email link flow**: User enters email → Firebase sends magic link → `/auth/verify` page completes sign-in → handles "different device" edge case
- **Reading gate**: Chapter pages require authentication by default — unauthenticated visitors are redirected to `/auth/signin?redirect=<url>` and returned after sign-in. Exception: if `book.isFree === true` (entire book is free) or `chapter.isFree === true` (sample chapter), the chapter is accessible without login.

### 5.2 Admin Authentication (Custom JWT)

- **Method**: Single shared password validated against `ADMIN_PASSWORD` env var
- **Token**: JWT (HS256) with "admin" role claim, 8-hour expiry
- **Storage**: `admin_session` httpOnly, secure, SameSite=lax cookie
- **Route Protection**: `middleware.ts` intercepts all `/admin/*` routes (except `/admin/login`)
- **Verification**: `GET /api/admin/verify` checks token validity
- **Logout**: `POST /api/admin/logout` clears cookie server-side; "Sign Out" button in admin sidebar
- **Rate Limiting**: 5 failed attempts per IP per 15-minute window → HTTP 429 (in-memory, resets on cold start)
- **Idle Timeout**: 30 minutes of inactivity (no mouse/keyboard/touch/scroll) → auto-logout
- **Audit Logging**: All login attempts (success, failure, rate limit) logged to console with `[ADMIN AUTH]` prefix — visible in Vercel function logs

### 5.3 HTTP Security Headers

Set globally via `next.config.ts` `headers()` on all responses:

| Header | Value | Purpose |
|--------|-------|---------|
| `Content-Security-Policy` | see below | Restricts resource loading sources |
| `X-Content-Type-Options` | `nosniff` | Prevents MIME-type sniffing |
| `X-Frame-Options` | `DENY` | Blocks iframe embedding (clickjacking) |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limits referrer info on cross-origin requests |

**CSP allowlist summary:**
- Scripts: `'self' 'unsafe-inline'` (Next.js hydration requires `unsafe-inline`)
- Styles: self + inline + `fonts.googleapis.com`
- Fonts: self + `fonts.gstatic.com`
- Images: self + Cloudinary + Firebase Storage + Google user content
- Connect: self + `*.googleapis.com` + `*.firebaseio.com` + `*.firebasestorage.app` + Cloudinary API
- Frames/objects: blocked entirely

### 5.4 Reader API Rate Limiting

Shared utility `src/lib/rate-limit.ts` — in-memory Map per IP, fixed window:

| Route | Limit | Window |
|-------|-------|--------|
| `POST /api/reading-progress` | 30 requests | 1 minute |
| `GET /api/books/[bookId]/download` | 10 requests | 1 hour |

---

## 6. API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/admin/login` | Password in body | Validates admin password, issues JWT cookie |
| GET | `/api/admin/verify` | Admin JWT cookie | Verifies admin session is valid |
| POST | `/api/admin/logout` | Admin JWT cookie | Clears admin session cookie server-side |
| POST | `/api/admin/upload` | Admin JWT cookie | Uploads image to Cloudinary (5MB max, images only) |
| POST | `/api/admin/books` | Admin JWT cookie | Create a new book |
| PATCH | `/api/admin/books/[bookId]` | Admin JWT cookie | Update book fields |
| DELETE | `/api/admin/books/[bookId]` | Admin JWT cookie | Delete a book |
| POST | `/api/admin/books/[bookId]/chapters` | Admin JWT cookie | Create a chapter (increments chapterCount) |
| PATCH | `/api/admin/books/[bookId]/chapters/[chapterId]` | Admin JWT cookie | Update chapter fields |
| DELETE | `/api/admin/books/[bookId]/chapters/[chapterId]` | Admin JWT cookie | Delete a chapter (decrements chapterCount) |
| POST | `/api/reading-progress` | Firebase Bearer token | Saves reading progress to Firestore |
| GET | `/api/admin/news` | Admin JWT cookie | List all news items (newest first) |
| POST | `/api/admin/news` | Admin JWT cookie | Create a news item |
| PATCH | `/api/admin/news/[newsId]` | Admin JWT cookie | Update a news item |
| DELETE | `/api/admin/news/[newsId]` | Admin JWT cookie | Delete a news item |

---

## 7. Feature Details

### 7.1 Public Features (Reader-facing)

#### Error Pages
- `app/not-found.tsx` — 404 page with "Go Home" and "Browse Books" links; renders inside root layout (header/footer intact)
- `app/error.tsx` — Runtime error boundary with "Try Again" (`reset()`) and "Go Home"; client component
- `app/global-error.tsx` — Root layout crash fallback; includes its own `<html>/<body>` with inline styles

#### Book Browsing
- Grid display of published books with cover images
- Each card shows: cover, title, author, description snippet, chapter count
- "NEW" badge on books published within last 30 days
- Books sorted by configurable display order

#### Book Detail Page
- 3D-styled cover image with drop shadow
- Full description, author name, chapter count
- Reading progress bar (if user has started reading)
- "Start Reading" or "Continue Reading" CTA based on progress state
- Table of contents with chapter status indicators:
  - Checkmark: completed chapters
  - Gold number: current chapter
  - Gray number: upcoming chapters

#### Chapter Reader
- Full HTML content rendering with serif typography (Lora font)
- Drop cap styling on first paragraph
- Estimated reading time (calculated from word count)
- Reading progress bar fixed at top of page (scroll percentage)
- Font size toggle (Small / Medium / Large), persisted in localStorage
- Bookmark button to save/unsave current chapter
- Previous/Next chapter navigation buttons
- Back to Top floating button (appears after 300px scroll)

#### Reading Progress Tracking (authenticated users)
- Auto-saves scroll position every 5 seconds (debounced)
- Tracks last chapter visited and scroll percentage
- Displays progress on book detail page
- Chapter status indicators in table of contents

#### User Profile / Library (authenticated)
- **Continue Reading**: List of in-progress books with chapter info and scroll percentage
- **Favorite Books**: List of favorited books with remove option
- **Bookmarked Chapters**: List of bookmarked chapters across all books with remove option

#### Authentication
- Sign in with Google (one-click OAuth popup)
- Sign in with email magic link (passwordless — Firebase sends a sign-in link)
- Sign out → redirects to home page
- User display name shown in header when logged in
- **Chapter reading requires login** — unauthenticated users redirected to sign-in with return URL, unless the chapter or its parent book is marked as free
- **Free access**: Books marked `isFree` are fully readable without login; individual chapters marked `isFree` act as free samples. A "Free" badge is shown on free chapters in the book's table of contents.
- "Create a free account" hint shown on hero section for unauthenticated visitors
- `/auth/signup` is an alias for `/auth/signin` — no separate registration form needed

#### Theme System
- Two themes: Vatican Ivory (light) and Cathedral Dark (dark)
- System preference detection
- Manual toggle in header
- Persisted across sessions

#### Hero Section
- Catholic-themed landing section
- Animated floating icons: cross, bible, rosary, candle
- Welcome text and call-to-action

#### Home Page Layout
- News panel renders between the hero section and the books grid
- Responsive grid: 1 column (mobile), 2 columns (sm), 3 columns (lg+)
- Fully visible on all screen sizes — mobile compatible
- News section only renders when at least one news item exists

### 7.2 Admin Features

#### Admin Dashboard
- Statistics cards: Published Books count, Drafts count, Total Chapters count
- Quick action buttons: "New Book", "Manage Books"

#### News Management
- Add news items: title + content text
- List all news items newest-first
- Delete individual news items
- Items appear as responsive cards between the hero and books grid (visible on all screen sizes)
- Panel is hidden when there are no news items

#### Book Management
- List all books with status badges (published/draft)
- Display author name and chapter count per book
- Actions per book: Edit, View Chapters, Delete
- Create new book: title, author, description, cover image upload, status, display order
- **Free book toggle**: Mark entire book as free via checkbox in the Edit Book form — no login required for any chapter. Free books show a green "Free" badge on the home page book cards.

#### Chapter Management
- List chapters for a book, ordered by chapter number
- Create chapter: title, content (rich text), order, status
- Edit chapter: all fields editable
- Delete chapter (auto-decrements book's chapter count)
- **Free chapter toggle**: Inline toggle switch per chapter directly on the chapters list — mark individual chapters as free samples without opening the edit form

#### Rich Text Editor (Tiptap)
- Formatting: Bold, Italic, Underline
- Structure: Headings (H2, H3), Bullet Lists, Ordered Lists, Blockquotes
- Alignment: Left, Center, Right
- Media: Image upload (to Cloudinary) and URL insertion
- Links: URL insertion
- History: Undo/Redo
- Output: Clean HTML for reader rendering

#### Image Upload
- File validation: images only, 5MB maximum
- Preview before upload
- Upload path: `covers/{bookId}/{fileName}` for covers
- Upload path: `chapters/{bookId}/{chapterId}/{timestamp}-{fileName}` for chapter images
- Cloudinary CDN delivery

---

## 8. Styling & Theming

### Color System (CSS Custom Properties)

| Variable | Light (Vatican Ivory) | Dark (Cathedral Dark) |
|----------|----------------------|----------------------|
| `--bg` | #fafbfd | #0f1419 |
| `--fg` | #1e293b | #e8e0d4 |
| `--card` | #ffffff | #1a2332 |
| `--gold` | #b5942d | #d4a847 |
| `--muted` | #64748b | #8899aa |
| `--border` | #e2e8f0 | #2a3a4e |
| `--success` | #22c55e | #34d399 |
| `--danger` | #ef4444 | #f87171 |

### Typography
- **Sans-serif**: Inter — used for UI elements, navigation, buttons
- **Serif**: Lora — used for book content, headings, literary elements

### Special Styles
- `.chapter-content` — Prose styling with 1.8 line-height, drop cap on first letter
- `.skeleton` — Shimmer animation for loading states
- `.animate-float` — Gentle floating animation for hero section icons
- Responsive font sizing: 0.95rem mobile, 1rem desktop for chapter content

---

## 9. Environment Configuration

### Required Environment Variables

```env
# Firebase Client SDK (public)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin SDK (server-only)
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=

# Admin Authentication
ADMIN_PASSWORD=
ADMIN_JWT_SECRET=

# Cloudinary Image CDN
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

---

## 10. Deployment

- **Target Platform**: Vercel (Next.js native hosting)
- **Build Command**: `next build`
- **Dev Command**: `next dev --turbopack`
- **Start Command**: `next start`
- **No Docker** configuration
- **No CI/CD** pipelines configured

---

## 11. Planned Feature: eBook Export (PDF & EPUB)

### Overview

Admin-driven eBook generation workflow: Admin generates PDF/EPUB from book chapters, reviews the output, then publishes download links for readers. MOBI is excluded (deprecated by Amazon; EPUB works on Kindle).

### Data Model Changes

New optional fields on the `Book` document:

| Field | Type | Description |
|-------|------|-------------|
| ebookPdfUrl | string (optional) | Cloudinary URL for published PDF |
| ebookEpubUrl | string (optional) | Cloudinary URL for published EPUB |
| ebookFilename | string (optional) | English filename for reader download (no extension); falls back to sanitized title |

### New Dependencies

| Package | Purpose |
|---------|---------|
| `puppeteer` | HTML-to-PDF via Chromium (faithful Tiptap HTML rendering) |
| `epub-gen-memory` | HTML-to-EPUB in memory (handles image embedding from URLs) |

> For Vercel serverless: use `puppeteer-core` + `@sparticuz/chromium` instead of `puppeteer`.

### New Files

```
src/lib/export/
  types.ts              # ExportableBook, ExportableChapter, ExportFormat types
  html-processor.ts     # buildPdfHtml(), sanitizeForEpub(), optimizeImageUrls()
  pdf-generator.ts      # generatePdf(book, chapters) → Buffer
  epub-generator.ts     # generateEpub(book, chapters) → Buffer

src/app/api/admin/books/[bookId]/export/
  route.ts              # GET: Generate & download eBook (admin-only)
  publish/route.ts      # POST: Generate, upload to Cloudinary, save URL to Book doc
  unpublish/route.ts    # POST: Remove published eBook URL from Book doc

src/components/admin/
  ExportButtons.tsx     # Generate, download, publish/unpublish controls

src/components/books/
  DownloadButtons.tsx   # Reader download buttons (shown when eBook URLs exist)
```

### Workflow

1. **Admin generates**: `GET /api/admin/books/{bookId}/export?format=pdf|epub` → downloads file
2. **Admin publishes**: `POST /api/admin/books/{bookId}/export/publish` → uploads to Cloudinary, saves URL to Firestore
3. **Readers download**: Download buttons appear on book detail page and user profile when `ebookPdfUrl` or `ebookEpubUrl` exists
4. **Admin unpublishes**: `POST /api/admin/books/{bookId}/export/unpublish` → removes URL from Firestore

### UI Integration

- **Admin**: ExportButtons on admin chapters page (`/admin/books/{bookId}/chapters`)
- **Readers**: DownloadButtons on book detail page (`/books/{bookId}`) and profile page (`/profile`)

### Implementation Sequence

1. Types + html-processor (foundation)
2. epub-generator (simpler, no Chromium)
3. Export API route (EPUB first, end-to-end test)
4. ExportButtons + admin integration
5. pdf-generator (Puppeteer)
6. Publish/Unpublish routes + Cloudinary upload
7. Update Book type with eBook URL fields
8. DownloadButtons + reader integration

---

## 12. Known Limitations & Future Considerations

1. **No test coverage** — No unit, integration, or e2e test framework configured
2. **Single admin password** — All admins share one password; no per-user admin accounts
3. **In-memory rate limiting** — Rate limiters reset on server cold start (serverless); no persistent store (Redis) used
4. **No search** — No book or content search functionality
5. **No pagination** — All published books loaded at once
6. **No error boundaries** — No React error boundary components
7. **Empty UI component library** — `src/components/ui/` exists but is unused
8. **No offline support** — No service worker or PWA configuration
9. **No analytics** — No usage tracking or metrics collection
