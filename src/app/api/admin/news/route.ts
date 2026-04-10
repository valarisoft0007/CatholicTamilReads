import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { parseBody } from "@/lib/validation";
import { NewsCreateSchema } from "@/lib/validation/news";

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

export async function GET(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const snapshot = await adminDb
    .collection("news")
    .orderBy("createdAt", "desc")
    .get();

  const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  return NextResponse.json(items);
}

export async function POST(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = parseBody(NewsCreateSchema, body);
  if (!parsed.success) return parsed.response;

  const docRef = await adminDb.collection("news").add({
    title: parsed.data.title.trim(),
    content: parsed.data.content.trim(),
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ id: docRef.id });
}
