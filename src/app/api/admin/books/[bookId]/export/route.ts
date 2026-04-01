import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { adminDb } from "@/lib/firebase/admin";
import { generatePdf } from "@/lib/export/pdf-generator";
import { generateEpub } from "@/lib/export/epub-generator";
import { generateDocx } from "@/lib/export/docx-generator";
import type { ExportableBook, ExportableChapter, ExportFormat } from "@/lib/export/types";

const JWT_SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET || "default-secret-change-me"
);

export async function GET(
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
  const format = request.nextUrl.searchParams.get("format") as ExportFormat | null;

  if (!format || !["pdf", "epub", "docx"].includes(format)) {
    return NextResponse.json(
      { error: "Invalid format. Use ?format=pdf, ?format=epub, or ?format=docx" },
      { status: 400 }
    );
  }

  try {
    // Fetch book
    const bookDoc = await adminDb.collection("books").doc(bookId).get();
    if (!bookDoc.exists) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }
    const bookData = bookDoc.data()!;
    const book: ExportableBook = {
      title: bookData.title,
      authorName: bookData.authorName,
      description: bookData.description,
      coverImageUrl: bookData.coverImageUrl,
    };

    // Fetch published chapters ordered by display order
    const chaptersSnap = await adminDb
      .collection("books")
      .doc(bookId)
      .collection("chapters")
      .where("status", "==", "published")
      .orderBy("order", "asc")
      .get();

    if (chaptersSnap.empty) {
      return NextResponse.json(
        { error: "No published chapters found" },
        { status: 400 }
      );
    }

    const chapters: ExportableChapter[] = chaptersSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        title: data.title,
        content: data.content,
        order: data.order,
      };
    });

    // Generate eBook
    let buffer: Buffer;
    let contentType: string;
    let fileExtension: string;

    if (format === "pdf") {
      buffer = await generatePdf(book, chapters);
      contentType = "application/pdf";
      fileExtension = "pdf";
    } else if (format === "epub") {
      buffer = await generateEpub(book, chapters);
      contentType = "application/epub+zip";
      fileExtension = "epub";
    } else {
      buffer = await generateDocx(book, chapters);
      contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      fileExtension = "docx";
    }

    const rawTitle =
      (bookData.ebookFilename as string | undefined)?.trim() || book.title;
    const safeTitle = rawTitle
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9\s\-_]/g, "")
      .replace(/\s+/g, "-")
      .replace(/^-+|-+$/g, "") || "ebook";
    const fileName = `${safeTitle}.${fileExtension}`;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (err) {
    console.error("Export error:", err);
    return NextResponse.json(
      { error: "Failed to generate eBook" },
      { status: 500 }
    );
  }
}
