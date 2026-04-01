import { buildDocxHtml } from "./html-processor";
import type { ExportableBook, ExportableChapter } from "./types";

export async function generateDocx(
  book: ExportableBook,
  chapters: ExportableChapter[]
): Promise<Buffer> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const HTMLtoDOCX = require("html-to-docx");
  const html = buildDocxHtml(book, chapters);
  const docx = await HTMLtoDOCX(html, null, {
    title: book.title,
    creator: book.authorName,
    description: book.description,
    font: "Arial Unicode MS",
    fontSize: 24, // 12pt
  });
  return Buffer.from(docx as ArrayBuffer);
}
