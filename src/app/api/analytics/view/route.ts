import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { createRateLimiter } from "@/lib/rate-limit";
import { parseBody } from "@/lib/validation";
import { AnalyticsViewSchema } from "@/lib/validation/reader";

// 5 views per hour per IP per book
const limiter = createRateLimiter(5, 60 * 60 * 1000);

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    "unknown";

  const body = await request.json();
  const parsed = parseBody(AnalyticsViewSchema, body);
  if (!parsed.success) return parsed.response;

  const { type, bookId, chapterId } = parsed.data;

  // Rate limit per IP per book
  const allowed = limiter(`${ip}:${bookId}`);
  if (!allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  // Verify book exists and is published
  const bookRef = adminDb.collection("books").doc(bookId);
  const bookSnap = await bookRef.get();
  if (!bookSnap.exists || bookSnap.data()?.status !== "published") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (type === "book") {
    await bookRef.update({ viewCount: FieldValue.increment(1) });
  } else if (type === "chapter" && chapterId) {
    const chapterRef = bookRef.collection("chapters").doc(chapterId);
    const chapterSnap = await chapterRef.get();
    if (!chapterSnap.exists || chapterSnap.data()?.status !== "published") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    await Promise.all([
      bookRef.update({ viewCount: FieldValue.increment(1) }),
      chapterRef.update({ viewCount: FieldValue.increment(1) }),
    ]);
  }

  return NextResponse.json({ success: true });
}
