// eslint-disable-next-line @typescript-eslint/no-require-imports
const EPub = require("epub-gen-memory").EPub;
import { sanitizeForEpub } from "./html-processor";
import type { ExportableBook, ExportableChapter } from "./types";

export async function generateEpub(
  book: ExportableBook,
  chapters: ExportableChapter[]
): Promise<Buffer> {
  const epubChapters = chapters.map((ch) => ({
    title: ch.title,
    content: sanitizeForEpub(ch.content),
  }));

  const options = {
    title: book.title,
    author: book.authorName,
    description: book.description || undefined,
    cover: book.coverImageUrl || undefined,
    tocTitle: "Table of Contents",
    css: `
      body {
        font-family: Georgia, serif;
        line-height: 1.7;
        color: #1e293b;
      }
      h1, h2, h3 {
        font-family: sans-serif;
        color: #967a24;
      }
      blockquote {
        border-left: 3px solid #b5942d;
        padding-left: 1rem;
        color: #64748b;
        font-style: italic;
      }
      img {
        max-width: 100%;
        height: auto;
      }
    `,
  };

  const epub = await new EPub(options, epubChapters).genEpub();
  return Buffer.from(epub);
}
