# Catholic Tamil Reads - Trail 5

## Docs
- PRD (architecture, data models, features): @docs/PRD.md
- Progress tracker: @progress.md
- README (setup guide): @README.md

## Commands
- Dev: `npm run dev` (uses Turbopack)
- Build: `npm run build`
- Start: `npm start`
- Lint: `npm run lint`
- Unit tests: `npm run test:run` (no external deps, 163 tests)
- Integration tests: `npm run test:integration` (requires emulator running)
- Start emulator: `npm run emulator:start` (uses firebase.test.json + firestore.test.rules)
- Test coverage: `npm run test:coverage`

## Tech Stack
- Next.js 16 (App Router) + React 19 + TypeScript
- Firebase: Firestore (database) + Auth (user accounts) + Analytics (event tracking)
- Cloudinary for image uploads/CDN
- Tailwind CSS 4 for styling
- Tiptap for rich text editing (admin)
- @dnd-kit for drag-and-drop chapter reordering (admin)
- jose for JWT admin auth
- SWR for data fetching
- next-themes for dark/light mode
- Zod for API input validation (src/lib/validation/)

## Architecture
- Monolithic Next.js app — no separate backend
- Pages and API routes in `src/app/`
- Reusable components in `src/components/` organized by feature: layout/, auth/, books/, reader/, admin/
- Service layer in `src/lib/firestore/` — all Firestore operations go here, not in components
- Firebase SDK init in `src/lib/firebase/` (admin.ts for server, client.ts for browser)
- Types in `src/types/index.ts`
- Route protection via `src/middleware.ts` (JWT check on /admin/* routes)
- `src/components/ui/` exists but is empty (placeholder)

## Auth
- Users: Firebase Auth (Google Sign-In only) via AuthProvider context + useAuth() hook
- Admin: Custom JWT with single shared password, stored in httpOnly cookie `admin_session`
- These are two separate auth systems — do not mix them

## Database (Firestore)
- Collections: `books`, `books/{bookId}/chapters` (subcollection), `news` (admin-managed announcements)
- User data: `users/{uid}/readingProgress`, `users/{uid}/bookmarks`, `users/{uid}/favorites`
- Bookmarks and favorites denormalize titles/covers to avoid extra reads
- Always use serverTimestamp() for createdAt/updatedAt fields
- Book.chapterCount is auto-incremented/decremented on chapter create/delete
- Book.viewCount and Chapter.viewCount — incremented server-side via Admin SDK on each view (rate-limited)
- Indexes defined in `firestore.indexes.json` (status + order for books and chapters; status + updatedAt DESC for public home page ordering)

## API Routes
- POST `/api/admin/login` — admin password auth, returns JWT cookie
- GET `/api/admin/verify` — check admin session validity
- POST `/api/admin/logout` — clear admin session cookie server-side
- POST `/api/admin/upload` — image upload to Cloudinary (5MB max, images only)
- POST `/api/reading-progress` — save user reading progress (Firebase Bearer token)
- GET `/api/admin/news` — list all news items (newest first)
- POST `/api/admin/news` — create a news item
- PATCH `/api/admin/news/[newsId]` — update a news item
- DELETE `/api/admin/news/[newsId]` — delete a news item
- PATCH `/api/admin/books/[bookId]/chapters/reorder` — batch reorder chapters (JWT cookie, Firestore WriteBatch)
- POST `/api/analytics/view` — increment book/chapter viewCount (public, rate-limited 5/hr per IP per book)
- GET `/api/admin/books/[bookId]/export?format=pdf|epub` — generate & download eBook
- POST `/api/admin/books/[bookId]/export/publish` — publish eBook to Cloudinary
- POST `/api/admin/books/[bookId]/export/unpublish` — remove published eBook
- GET `/api/books/[bookId]/download` — reader proxy download (streams file with Content-Disposition, auth-gated)
- GET `/api/admin/users` — registered user count (JWT cookie, Firebase Admin `auth.listUsers()`)

## Styling
- Tailwind CSS with CSS custom properties for theming (defined in globals.css)
- Two themes: Vatican Ivory (light) and Cathedral Dark (dark) via next-themes
- Fonts: Inter (UI/sans) and Lora (content/serif) from Google Fonts
- Chapter content uses `.chapter-content` class with prose styling and drop cap

## Conventions
- Path alias: `@/*` maps to `src/*`
- Client components must have `"use client"` directive
- Image optimization configured for Cloudinary and Firebase Storage domains in next.config.ts
- Environment variables: NEXT_PUBLIC_* for client, others are server-only
- See `.env.example` for all required env vars
- No test framework configured yet
- No CI/CD or Docker configured
- Analytics: Firestore viewCount (server-side) + Firebase Analytics events (client-side, fire-and-forget)
- Donation feature planned — blocked on Razorpay/PayPal account setup; see docs/donation-feature-plan.md
- Audio TTS planned — see docs/audio-tts-feature-plan.md
- Input validation: all API routes validated with Zod; schemas in src/lib/validation/, shared parseBody() helper returns 400 on bad input
- Accessibility: skip-to-main link in layout.tsx, aria-hidden on all decorative elements, aria-label on navs, role="progressbar" on reading progress bar
