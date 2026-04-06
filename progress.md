# Catholic Tamil Reads - Development Progress

## Status Legend
- [x] Completed
- [ ] Not started
- [~] In progress / Partial

---

## Core Infrastructure
- [x] Next.js 16 App Router setup with TypeScript
- [x] Tailwind CSS 4 styling configuration
- [x] Firebase Client SDK integration
- [x] Firebase Admin SDK integration
- [x] Cloudinary image CDN integration
- [x] Environment variable configuration (.env.example)
- [x] ESLint configuration
- [x] Path aliases (@/* -> src/*)
- [x] Firestore composite indexes

## Authentication
- [x] Firebase Auth - Google Sign-In (replaced email/password)
- [x] Firebase Auth - Email magic link / passwordless sign-in
- [x] Firebase Auth - sign out (redirects to home)
- [x] Auth context provider (AuthProvider + useAuth hook)
- [x] Admin JWT authentication (password-based)
- [x] Admin session via httpOnly cookie
- [x] Admin route protection (middleware.ts)
- [x] Admin session verification endpoint
- [x] Reader registration required to read chapters (unless book/chapter marked free)
- [x] Redirect to sign-in with return URL on protected pages
- [x] Free access: book-level isFree flag (whole book readable without login)
- [x] Free access: chapter-level isFree flag (sample chapters readable without login)
- [x] Free badge shown on free chapters in table of contents
- [ ] Password reset / forgot password (N/A — passwordless)
- [ ] Social login (Google, Apple, etc.)
- [ ] Per-user admin accounts (currently single shared password)
- [ ] Email verification

## Public Pages
- [x] Home page with hero section
- [x] Book browsing grid (published books)
- [x] Book detail page with cover, description, chapter list
- [x] Chapter reader page with HTML content rendering
- [x] User sign-in page
- [x] User sign-up page
- [x] User profile / library page
- [ ] Book search / filtering
- [ ] Book categories / genres
- [ ] Pagination for book list
- [x] 404 / error pages (not-found.tsx, error.tsx, global-error.tsx)

## Reader Features
- [x] Chapter content rendering (HTML with typography)
- [x] Reading progress bar (scroll-based, fixed top)
- [x] Auto-save reading progress (every 5 seconds)
- [x] Last chapter + scroll position tracking
- [x] Chapter bookmarking (add/remove)
- [x] Book favorites (add/remove)
- [x] Font size toggle (S/M/L with localStorage persistence)
- [x] Previous/Next chapter navigation
- [x] Table of contents with read/current/upcoming indicators
- [x] Back to top floating button
- [x] Estimated reading time
- [x] Drop cap styling on first paragraph
- [ ] Text highlighting / annotations
- [ ] Notes per chapter
- [ ] Share chapter / book
- [ ] Offline reading (PWA/Service Worker)
- [ ] Audio narration / text-to-speech

## Admin Panel
- [x] Admin dashboard with stats (published, drafts, chapters)
- [x] Admin sidebar navigation
- [x] Book list management page
- [x] Create new book form
- [x] Edit book form
- [x] Delete book
- [x] Chapter list management page
- [x] Create new chapter form
- [x] Edit chapter form
- [x] Delete chapter (with chapterCount sync)
- [x] Rich text editor (Tiptap) with formatting toolbar
- [x] Image upload to Cloudinary (covers + chapter images)
- [x] Draft/Published status toggle
- [x] Display order management
- [x] News management (add/delete items shown on home page sidebar)
- [x] Free book toggle — checkbox in BookForm (Edit Book page); Free badge on home page book cards
- [x] Free chapter toggle — inline toggle switch on chapters list (no need to open chapter edit)
- [ ] Bulk operations (publish/unpublish multiple)
- [ ] Chapter reordering via drag-and-drop
- [ ] Content preview before publishing
- [ ] Analytics dashboard (views, read time, popular books)
- [ ] User management panel

## Theming & UI
- [x] Dark/Light theme toggle
- [x] Vatican Ivory (light) theme
- [x] Cathedral Dark (dark) theme
- [x] System theme preference detection
- [x] Responsive mobile navigation (hamburger menu)
- [x] Loading skeleton animations
- [x] Hero section with animated floating icons
- [x] Google Fonts (Inter + Lora)
- [ ] Accessibility audit (WCAG compliance)
- [ ] Keyboard navigation improvements
- [ ] Screen reader optimizations

## Data Layer
- [x] Books CRUD operations (src/lib/firestore/books.ts)
- [x] Chapters CRUD operations (src/lib/firestore/chapters.ts)
- [x] Bookmarks operations (src/lib/firestore/bookmarks.ts)
- [x] Favorites operations (src/lib/firestore/bookmarks.ts)
- [x] Reading progress operations (src/lib/firestore/reading-progress.ts)
- [x] News read operations (src/lib/firestore/news.ts)
- [x] Image upload via API route (src/lib/firebase/storage.ts)
- [ ] Data validation / sanitization layer
- [ ] Firestore security rules
- [ ] Rate limiting on API routes
- [ ] Caching strategy (SWR configured but underutilized)

## DevOps & Quality
- [ ] Unit tests
- [ ] Integration tests
- [ ] End-to-end tests (Playwright/Cypress)
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Docker configuration
- [ ] Staging environment
- [ ] Error monitoring (Sentry or similar)
- [ ] Performance monitoring
- [ ] Logging infrastructure
- [ ] Automated backups

## Security
- [x] Admin routes protected by JWT middleware
- [x] httpOnly cookies for admin sessions
- [x] Server-side credential handling
- [x] File type and size validation on uploads
- [x] Admin login rate limiting (5 attempts / 15 min per IP, in-memory)
- [x] Admin login attempt logging (structured console logs, visible in Vercel logs)
- [x] Admin session idle timeout (30 min inactivity → auto-logout)
- [x] Admin session absolute timeout (8h, down from 24h)
- [x] Server-side admin logout (POST /api/admin/logout clears httpOnly cookie)
- [x] HTML content sanitization (XSS prevention — isomorphic-dompurify on ChapterContent render)
- [ ] CSRF protection
- [x] Rate limiting on reader API routes (30 req/min on reading-progress, 10 req/hr on download — shared src/lib/rate-limit.ts)
- [ ] Input validation middleware
- [x] Content Security Policy headers (next.config.ts headers() — CSP + X-Content-Type-Options + X-Frame-Options + Referrer-Policy)
- [x] Firestore security rules (firestore.rules — books/chapters read-only from client, user data owner-only)

---

## Summary

| Category | Done | Remaining |
|----------|------|-----------|
| Core Infrastructure | 9 | 0 |
| Authentication | 7 | 7 |
| Public Pages | 8 | 3 |
| Reader Features | 11 | 5 |
| Admin Panel | 15 | 7 |
| Theming & UI | 8 | 3 |
| Data Layer | 7 | 4 |
| DevOps & Quality | 0 | 10 |
| Security | 13 | 2 |
| eBook Export | 20 | 0 |
| **Total** | **98** | **41** |

**Overall Progress: ~70% complete**

---

## eBook Export
- [x] Export service layer (src/lib/export/)
- [x] HTML processor (buildPdfHtml, sanitizeForEpub, optimizeImageUrls, fetchAsDataUri)
- [x] EPUB generator (epub-gen-memory) — cover passed as URL string
- [x] PDF generator (puppeteer) — cover pre-fetched as base64 data URI
- [x] Export API route (GET /api/admin/books/[bookId]/export?format=pdf|epub)
- [x] Unpublish API route (POST /api/admin/books/[bookId]/export/unpublish)
- [x] Book model update (ebookPdfUrl, ebookEpubUrl fields)
- [x] Reader DownloadButtons component (src/components/books/DownloadButtons.tsx)
- [x] Reader proxy download route (GET /api/books/[bookId]/download)
- [x] Reader downloads section on profile page (auth-gated by page redirect)
- [x] Publish API route — accepts multipart/form-data file upload (pdf/epub only, max 50MB)
- [x] Admin ExportButtons component — manual upload for PDF/EPUB, DOCX download-only row
- [x] DOCX generator (html-to-docx) — admin-only, Arial Unicode MS font for Unicode scripts
- [x] Fix download 401 — cloudinary.utils.private_download_url() bypasses free-plan restrictions
- [x] Gate reader DownloadButtons to logged-in users only (book detail page)
- [x] Fix Cloudinary free-plan PDF delivery — removed format param from publish upload (no transformation triggered)
- [x] Fix PDF/EPUB overwrite bug — publish publicId now includes format suffix (exports/{bookId}/{title}-{format})
- [x] Fix download filename — proxy route streams file with Content-Disposition header instead of redirect
- [x] Add ebookFilename field to Book model + admin form — allows admin to set English download filename for non-ASCII (Tamil) titles
- [x] Fix admin ExportButtons filename — was using broken client-side sanitization via a.download, now uses ebookFilename prop with same NFD normalization chain

## Next Priority Items
1. Free access feature (book-level + chapter-level isFree flag)
2. Book search / filtering
3. Test framework setup
4. Input validation middleware
5. CSRF protection (low priority — SameSite=lax already blocks most attacks)

## Admin Login Hardening (completed)
- [x] Rate limiting — 5 failed attempts / 15 min per IP → 429
- [x] Login attempt logging — structured `[ADMIN AUTH]` logs in Vercel function logs
- [x] Session absolute timeout reduced from 24h → 8h
- [x] Idle timeout — 30 min inactivity → auto-logout
- [x] Server-side logout route POST /api/admin/logout
- [x] Manual sign-out button in admin sidebar upgraded to call server-side logout
