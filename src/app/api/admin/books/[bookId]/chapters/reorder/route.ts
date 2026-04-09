import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

const JWT_SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET || "default-secret-change-me"
);

async function verifyAdmin(request: NextRequest) {
  const token = request.cookies.get("admin_session")?.value;
  if (!token) return false;
  try {
    await jwtVerify(token, JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string }> }
) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { bookId } = await params;
  const { orderedIds } = await request.json();

  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    return NextResponse.json({ error: "orderedIds must be a non-empty array" }, { status: 400 });
  }

  const chaptersRef = adminDb.collection("books").doc(bookId).collection("chapters");
  const batch = adminDb.batch();

  orderedIds.forEach((chapterId: string, index: number) => {
    const chapterRef = chaptersRef.doc(chapterId);
    batch.update(chapterRef, {
      order: index + 1,
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  await batch.commit();

  return NextResponse.json({ success: true });
}
