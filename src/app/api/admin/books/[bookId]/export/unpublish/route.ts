import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { v2 as cloudinary } from "cloudinary";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import type { ExportFormat } from "@/lib/export/types";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const JWT_SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET || "default-secret-change-me"
);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string }> }
) {
  const token = request.cookies.get("admin_session")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await jwtVerify(token, JWT_SECRET);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { bookId } = await params;
  const body = await request.json() as { format?: string };
  const format = body.format as ExportFormat | undefined;

  if (!format || !["pdf", "epub"].includes(format)) {
    return NextResponse.json(
      { error: "Invalid format. Use pdf or epub" },
      { status: 400 }
    );
  }

  try {
    // Fetch book to verify it exists
    const bookDoc = await adminDb.collection("books").doc(bookId).get();
    if (!bookDoc.exists) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    // Try to delete from Cloudinary (non-critical if it fails)
    const bookData = bookDoc.data()!;
    const sanitizedTitle = (bookData.title as string)
      .replace(/[^a-zA-Z0-9\s]/g, "")
      .replace(/\s+/g, "-");
    const publicId = `exports/${bookId}/${sanitizedTitle}.${format}`;

    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: "raw" });
    } catch {
      // Cloudinary deletion is best-effort
    }

    // Remove eBook URL from book document
    const updateField = format === "pdf" ? "ebookPdfUrl" : "ebookEpubUrl";
    await adminDb.collection("books").doc(bookId).update({
      [updateField]: FieldValue.delete(),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Unpublish error:", err);
    return NextResponse.json(
      { error: "Failed to unpublish eBook" },
      { status: 500 }
    );
  }
}
