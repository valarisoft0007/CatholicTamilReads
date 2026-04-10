import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { parseBody } from "@/lib/validation";
import { NewsUpdateSchema } from "@/lib/validation/news";

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
  { params }: { params: Promise<{ newsId: string }> }
) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { newsId } = await params;
  const body = await request.json();
  const parsed = parseBody(NewsUpdateSchema, body);
  if (!parsed.success) return parsed.response;

  await adminDb
    .collection("news")
    .doc(newsId)
    .update({
      ...(parsed.data.title !== undefined && { title: parsed.data.title.trim() }),
      ...(parsed.data.content !== undefined && { content: parsed.data.content.trim() }),
      updatedAt: FieldValue.serverTimestamp(),
    });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ newsId: string }> }
) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { newsId } = await params;
  await adminDb.collection("news").doc(newsId).delete();
  return NextResponse.json({ ok: true });
}
