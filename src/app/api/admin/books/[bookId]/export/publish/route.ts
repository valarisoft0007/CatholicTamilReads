import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { v2 as cloudinary } from "cloudinary";
import { adminDb } from "@/lib/firebase/admin";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const JWT_SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET || "default-secret-change-me"
);

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string }> }
) {
  // Verify admin auth
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

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid multipart form data" }, { status: 400 });
  }

  const format = formData.get("format") as string | null;
  const file = formData.get("file") as Blob | null;

  if (!format || !["pdf", "epub"].includes(format)) {
    return NextResponse.json({ error: "Invalid format. Use pdf or epub" }, { status: 400 });
  }

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File too large. Maximum 50 MB" }, { status: 400 });
  }

  try {
    // Fetch book title for the public_id
    const bookDoc = await adminDb.collection("books").doc(bookId).get();
    if (!bookDoc.exists) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }
    const bookTitle: string = bookDoc.data()!.title ?? bookId;

    const sanitizedTitle =
      bookTitle
        .replace(/[^a-zA-Z0-9\s]/g, "")
        .replace(/\s+/g, "-")
        .replace(/^-+|-+$/g, "") || bookId;

    const publicId = `exports/${bookId}/${sanitizedTitle}-${format}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const uploadResult = await new Promise<{ secure_url: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          public_id: publicId,
          resource_type: "raw",
          overwrite: true,
          access_mode: "public",
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result as { secure_url: string });
        }
      );
      stream.end(buffer);
    });

    const updateField = format === "pdf" ? "ebookPdfUrl" : "ebookEpubUrl";
    await adminDb.collection("books").doc(bookId).update({
      [updateField]: uploadResult.secure_url,
    });

    return NextResponse.json({ url: uploadResult.secure_url });
  } catch (err) {
    console.error("Publish error:", err);
    return NextResponse.json({ error: "Failed to publish eBook" }, { status: 500 });
  }
}
