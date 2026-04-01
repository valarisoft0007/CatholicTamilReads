import type { ExportableBook, ExportableChapter } from "./types";

/**
 * Fetches an image URL and returns a base64 data URI, or null on failure.
 */
export async function fetchAsDataUri(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    const contentType = res.headers.get("content-type")?.split(";")[0] || "image/jpeg";
    return `data:${contentType};base64,${buffer.toString("base64")}`;
  } catch {
    return null;
  }
}

/**
 * Optimizes Cloudinary image URLs for eBook embedding.
 * Adds width/quality transformations to reduce file size.
 */
export function optimizeImageUrls(html: string): string {
  return html.replace(
    /(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(v\d+\/)/g,
    "$1w_800,q_auto,f_auto/$2"
  );
}

/**
 * Sanitizes Tiptap HTML for EPUB compatibility (XHTML).
 * - Self-closes void elements (img, br, hr)
 * - Removes unsupported attributes
 */
export function sanitizeForEpub(html: string): string {
  let sanitized = html;

  // Self-close void elements for XHTML compliance
  sanitized = sanitized.replace(/<(img|br|hr|input)([^>]*?)(?<!\/)>/gi, "<$1$2 />");

  // Remove style attributes (EPUB readers handle their own styling)
  sanitized = sanitized.replace(/\s+style="[^"]*"/gi, "");

  // Optimize image URLs
  sanitized = optimizeImageUrls(sanitized);

  return sanitized;
}

/**
 * Builds a complete HTML document for PDF generation via Puppeteer.
 * Includes title page, table of contents, and all chapters with page breaks.
 */
export function buildPdfHtml(
  book: ExportableBook,
  chapters: ExportableChapter[],
  coverDataUri?: string | null
): string {
  const coverSrc = coverDataUri || (book.coverImageUrl ? optimizeImageUrls(book.coverImageUrl) : null);
  const titlePage = `
    <div class="title-page">
      ${coverSrc ? `<img src="${coverSrc}" class="cover-image" />` : ""}
      <h1 class="book-title">${escapeHtml(book.title)}</h1>
      <p class="book-author">by ${escapeHtml(book.authorName)}</p>
      ${book.description ? `<p class="book-description">${escapeHtml(book.description)}</p>` : ""}
    </div>
  `;

  const toc = `
    <div class="toc-page">
      <h2>Table of Contents</h2>
      <ol>
        ${chapters.map((ch) => `<li>${escapeHtml(ch.title)}</li>`).join("\n        ")}
      </ol>
    </div>
  `;

  const chapterPages = chapters
    .map(
      (ch) => `
    <div class="chapter">
      <h2 class="chapter-title">${escapeHtml(ch.title)}</h2>
      <div class="chapter-content">${optimizeImageUrls(ch.content)}</div>
    </div>
  `
    )
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(book.title)}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;600;700&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Lora', Georgia, serif;
      font-size: 11pt;
      line-height: 1.7;
      color: #1e293b;
    }

    .title-page {
      page-break-after: always;
      text-align: center;
      padding-top: 30%;
    }

    .cover-image {
      max-width: 60%;
      max-height: 300px;
      margin-bottom: 2rem;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }

    .book-title {
      font-family: 'Inter', sans-serif;
      font-size: 28pt;
      font-weight: 700;
      margin-bottom: 0.5rem;
      color: #967a24;
    }

    .book-author {
      font-size: 14pt;
      color: #64748b;
      margin-bottom: 1rem;
    }

    .book-description {
      font-size: 11pt;
      color: #64748b;
      max-width: 80%;
      margin: 0 auto;
      font-style: italic;
    }

    .toc-page {
      page-break-after: always;
    }

    .toc-page h2 {
      font-family: 'Inter', sans-serif;
      font-size: 18pt;
      margin-bottom: 1rem;
      color: #967a24;
    }

    .toc-page ol {
      padding-left: 1.5rem;
    }

    .toc-page li {
      margin-bottom: 0.5rem;
      font-size: 12pt;
    }

    .chapter {
      page-break-before: always;
    }

    .chapter-title {
      font-family: 'Inter', sans-serif;
      font-size: 20pt;
      font-weight: 700;
      margin-bottom: 1.5rem;
      color: #967a24;
      border-bottom: 2px solid #e2c970;
      padding-bottom: 0.5rem;
    }

    .chapter-content p {
      margin-bottom: 1em;
      text-align: justify;
    }

    .chapter-content p:first-of-type::first-letter {
      float: left;
      font-size: 3.5em;
      line-height: 0.8;
      padding-right: 0.1em;
      padding-top: 0.05em;
      color: #967a24;
      font-weight: 700;
    }

    .chapter-content h1, .chapter-content h2, .chapter-content h3 {
      font-family: 'Inter', sans-serif;
      margin-top: 1.5em;
      margin-bottom: 0.5em;
    }

    .chapter-content img {
      max-width: 100%;
      height: auto;
      margin: 1rem 0;
      border-radius: 4px;
    }

    .chapter-content blockquote {
      border-left: 3px solid #b5942d;
      padding-left: 1rem;
      margin: 1rem 0;
      color: #64748b;
      font-style: italic;
    }

    .chapter-content ul, .chapter-content ol {
      padding-left: 1.5rem;
      margin-bottom: 1em;
    }
  </style>
</head>
<body>
  ${titlePage}
  ${toc}
  ${chapterPages}
</body>
</html>`;
}

/**
 * Builds a plain HTML document for DOCX conversion.
 * No inline CSS — Word handles its own styling.
 */
export function buildDocxHtml(
  book: ExportableBook,
  chapters: ExportableChapter[]
): string {
  const chapterBlocks = chapters
    .map(
      (ch) => `
    <h1>${escapeHtml(ch.title)}</h1>
    <div>${ch.content}</div>
  `
    )
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(book.title)}</title>
  <style>
    body, p, h1, h2, h3, h4, h5, h6, li, td, th, span, div {
      font-family: "Arial Unicode MS", "Noto Sans", Arial, sans-serif;
    }
  </style>
</head>
<body>
  <h1>${escapeHtml(book.title)}</h1>
  <p><em>by ${escapeHtml(book.authorName)}</em></p>
  ${book.description ? `<p>${escapeHtml(book.description)}</p>` : ""}
  ${chapterBlocks}
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
