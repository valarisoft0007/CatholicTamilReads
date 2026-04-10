import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { parseBody } from "@/lib/validation";
import { ChapterUpdateSchema } from "@/lib/validation/book";

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
  { params }: { params: Promise<{ bookId: string; chapterId: string }> }
) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { bookId, chapterId } = await params;
  const body = await request.json();
  const parsed = parseBody(ChapterUpdateSchema, body);
  if (!parsed.success) return parsed.response;

  await adminDb
    .collection("books")
    .doc(bookId)
    .collection("chapters")
    .doc(chapterId)
    .update({
      ...parsed.data,
      updatedAt: FieldValue.serverTimestamp(),
    });

  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string; chapterId: string }> }
) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { bookId, chapterId } = await params;

  await adminDb
    .collection("books")
    .doc(bookId)
    .collection("chapters")
    .doc(chapterId)
    .delete();

  await adminDb.collection("books").doc(bookId).update({
    chapterCount: FieldValue.increment(-1),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ success: true });
}
