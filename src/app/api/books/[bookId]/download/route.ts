import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { adminDb } from "@/lib/firebase/admin";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string }> }
) {
  const { bookId } = await params;
  const format = request.nextUrl.searchParams.get("format");

  if (!format || !["pdf", "epub"].includes(format)) {
    return NextResponse.json({ error: "Invalid format" }, { status: 400 });
  }

  try {
    const bookDoc = await adminDb.collection("books").doc(bookId).get();
    if (!bookDoc.exists) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    const bookData = bookDoc.data()!;
    const storedUrl: string | undefined =
      format === "pdf" ? bookData.ebookPdfUrl : bookData.ebookEpubUrl;

    if (!storedUrl) {
      return NextResponse.json({ error: "eBook not available" }, { status: 404 });
    }

    // Extract publicId from Cloudinary URL.
    // URL format: https://res.cloudinary.com/{cloud}/raw/upload/v{ver}/{publicId}.{ext}
    const match = storedUrl.match(/\/raw\/upload\/(?:v\d+\/)?(.+)$/);
    if (!match) {
      // Fallback: redirect directly (may still 401, but best effort)
      return NextResponse.redirect(storedUrl);
    }

    // Strip the format extension from the publicId (Cloudinary adds it back via `format`)
    const publicIdWithExt = match[1];
    const publicId = publicIdWithExt.replace(/\.[^.]+$/, "");

    // Build a clean filename for the browser's Save dialog.
    // Priority: admin-supplied English filename > sanitized book title > "ebook"
    const rawTitle =
      (bookData.ebookFilename as string | undefined)?.trim() ||
      (bookData.title as string);
    const safeTitle = rawTitle
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9\s\-_]/g, "")
      .replace(/\s+/g, "-")
      .replace(/^-+|-+$/g, "") || "ebook";
    const attachmentFilename = `${safeTitle}.${format}`;

    // Generate a signed Admin API download URL valid for 1 hour.
    const signedUrl = cloudinary.utils.private_download_url(publicId, format, {
      resource_type: "raw",
      type: "upload",
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    });

    // Proxy the file so we can set Content-Disposition with the correct filename/extension.
    const upstream = await fetch(signedUrl);
    if (!upstream.ok) {
      return NextResponse.json({ error: "Download failed" }, { status: 502 });
    }

    const contentType =
      format === "pdf" ? "application/pdf" : "application/epub+zip";

    return new NextResponse(upstream.body, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${attachmentFilename}"`,
      },
    });
  } catch (err) {
    console.error("Download error:", err);
    return NextResponse.json({ error: "Download failed" }, { status: 500 });
  }
}
