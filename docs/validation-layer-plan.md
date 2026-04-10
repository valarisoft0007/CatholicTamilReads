# Plan: Data Validation / Sanitization Layer (Zod)

## Context
Catholic Tamil Reads API routes currently accept unvalidated input — admin book/chapter routes spread raw request body directly into Firestore writes, and reader routes do no type checking. This risks malformed data in Firestore, crashes from unexpected input shapes, and potential abuse via oversized or malformed payloads. Adding a Zod-based validation layer centralizes schema definitions, returns consistent 400 errors on bad input, and aligns with Next.js/TypeScript best practices.

---

## Step 1 — Install Zod
```bash
npm install zod
```

---

## Step 2 — Create schema files

**`src/lib/validation/book.ts`**
- `BookCreateSchema` — title (string, 1–200), authorName (string, 1–200), description (string, max 2000), coverImageUrl (string url or empty), status (enum: draft|published), order (int, min 0), isFree (boolean), ebookFilename (string, max 200, optional)
- `BookUpdateSchema` — same but all fields optional (partial)
- `ChapterCreateSchema` — title (string, 1–200), content (string), order (int, min 1), status (enum: draft|published), isFree (boolean, optional)
- `ChapterUpdateSchema` — partial of above
- `ReorderSchema` — orderedIds (array of non-empty strings, min 1)

**`src/lib/validation/news.ts`**
- `NewsCreateSchema` — title (string, 1–300), content (string, 1–5000)
- `NewsUpdateSchema` — partial of above (at least one field required)

**`src/lib/validation/reader.ts`**
- `ReadingProgressSchema` — bookId (string, 1–128), lastChapterId (string, 1–128), lastChapterOrder (int, min 1), scrollPosition (number, 0–100)
- `AnalyticsViewSchema` — type (enum: book|chapter), bookId (string, 1–128), chapterId (string, 1–128, optional)

**`src/lib/validation/auth.ts`**
- `AdminLoginSchema` — password (string, min 1, max 200)

---

## Step 3 — Add a shared helper

**`src/lib/validation/index.ts`**
```ts
import { ZodSchema } from "zod";
import { NextResponse } from "next/server";

export function parseBody<T>(schema: ZodSchema<T>, data: unknown):
  | { success: true; data: T }
  | { success: false; response: NextResponse } {
  const result = schema.safeParse(data);
  if (!result.success) {
    return {
      success: false,
      response: NextResponse.json(
        { error: "Invalid input", details: result.error.flatten() },
        { status: 400 }
      ),
    };
  }
  return { success: true, data: result.data };
}
```

---

## Step 4 — Update API routes

For each route: call `await req.json()`, pass through schema via `parseBody()`, return early on failure, use validated data for Firestore write.

| Route | Schema to apply |
|-------|----------------|
| `POST /api/admin/books` | BookCreateSchema |
| `PATCH /api/admin/books/[bookId]` | BookUpdateSchema |
| `POST /api/admin/books/[bookId]/chapters` | ChapterCreateSchema |
| `PATCH /api/admin/books/[bookId]/chapters/[chapterId]` | ChapterUpdateSchema |
| `PATCH /api/admin/books/[bookId]/chapters/reorder` | ReorderSchema |
| `POST /api/admin/login` | AdminLoginSchema |
| `POST /api/admin/news` | NewsCreateSchema |
| `PATCH /api/admin/news/[newsId]` | NewsUpdateSchema |
| `POST /api/reading-progress` | ReadingProgressSchema |
| `POST /api/analytics/view` | AnalyticsViewSchema |

Routes already adequately validated (export, publish, upload) — leave unchanged.

---

## Critical Files

Existing (to be modified):
- `src/types/index.ts` — existing type definitions; schemas should mirror these
- `src/app/api/admin/books/route.ts`
- `src/app/api/admin/books/[bookId]/route.ts`
- `src/app/api/admin/books/[bookId]/chapters/route.ts`
- `src/app/api/admin/books/[bookId]/chapters/[chapterId]/route.ts`
- `src/app/api/admin/books/[bookId]/chapters/reorder/route.ts`
- `src/app/api/admin/login/route.ts`
- `src/app/api/admin/news/route.ts`
- `src/app/api/admin/news/[newsId]/route.ts`
- `src/app/api/reading-progress/route.ts`
- `src/app/api/analytics/view/route.ts`

New files to create:
- `src/lib/validation/index.ts`
- `src/lib/validation/book.ts`
- `src/lib/validation/news.ts`
- `src/lib/validation/reader.ts`
- `src/lib/validation/auth.ts`

---

## Verification

1. `npm run build` — no TypeScript errors
2. `npm run dev` — start dev server
3. Test each route with a REST client (Thunder Client / curl):
   - Send missing required fields → expect `400` with `details`
   - Send wrong types (e.g. `order: "hello"`) → expect `400`
   - Send valid payload → expect same behavior as before (200/201)
4. Test happy path via admin UI — create book, create chapter, reorder chapters — all should work unchanged
5. Check reading progress saves correctly from the chapter reader page
