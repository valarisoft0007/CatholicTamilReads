import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { createRateLimiter } from "@/lib/rate-limit";
import { parseBody } from "@/lib/validation";
import { ReadingProgressSchema } from "@/lib/validation/reader";

const checkLimit = createRateLimiter(30, 60_000); // 30 requests per minute per IP

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (!checkLimit(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const token = authHeader.split("Bearer ")[1];
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    const body = await request.json();
    const parsed = parseBody(ReadingProgressSchema, body);
    if (!parsed.success) return parsed.response;

    const { bookId, lastChapterId, lastChapterOrder, scrollPosition } = parsed.data;

    await adminDb
      .doc(`users/${uid}/readingProgress/${bookId}`)
      .set(
        {
          bookId,
          lastChapterId,
          lastChapterOrder,
          scrollPosition,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to save progress" },
      { status: 500 }
    );
  }
}
