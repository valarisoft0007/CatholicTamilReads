import puppeteer from "puppeteer";
import { buildPdfHtml, fetchAsDataUri } from "./html-processor";
import type { ExportableBook, ExportableChapter } from "./types";

export async function generatePdf(
  book: ExportableBook,
  chapters: ExportableChapter[]
): Promise<Buffer> {
  const coverDataUri = book.coverImageUrl ? await fetchAsDataUri(book.coverImageUrl) : null;
  const html = buildPdfHtml(book, chapters, coverDataUri);

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A5",
      printBackground: true,
      margin: {
        top: "20mm",
        bottom: "20mm",
        left: "15mm",
        right: "15mm",
      },
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="font-size:8pt; color:#64748b; width:100%; text-align:center; font-family:sans-serif;">
          ${book.title}
        </div>
      `,
      footerTemplate: `
        <div style="font-size:8pt; color:#64748b; width:100%; text-align:center; font-family:sans-serif;">
          <span class="pageNumber"></span> / <span class="totalPages"></span>
        </div>
      `,
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}
