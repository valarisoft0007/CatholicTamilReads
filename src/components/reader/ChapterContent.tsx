"use client";

import { sanitizeHtml } from "@/lib/sanitize";

interface ChapterContentProps {
  html: string;
  bookType?: "book" | "songs";
}

export function ChapterContent({ html, bookType }: ChapterContentProps) {
  const isSongs = bookType === "songs";
  return (
    <article
      className={`chapter-content prose prose-base mx-auto max-w-3xl sm:prose-lg${isSongs ? " songs-content" : ""}`}
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
    />
  );
}
