import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { createRateLimiter } from "@/lib/rate-limit";

// 5 views per hour per IP per book
const limiter = createRateLimiter(5, 60 * 60 * 1000);

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    "unknown";

  const { type, bookId, chapterId } = await request.json();

  if (!type || !bookId || (type === "chapter" && !chapterId)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

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
