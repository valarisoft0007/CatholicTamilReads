"use client";

import Link from "next/link";
import type { Chapter } from "@/types";

interface ChapterNavigationProps {
  bookId: string;
  prevChapter?: Chapter | null;
  nextChapter?: Chapter | null;
}

export function ChapterNavigation({
  bookId,
  prevChapter,
  nextChapter,
}: ChapterNavigationProps) {
  return (
    <div className="mx-auto flex max-w-3xl items-center justify-between border-t border-border pt-8">
      {prevChapter ? (
        <Link
          href={`/books/${bookId}/chapters/${prevChapter.id}`}
          className="flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-card transition-colors"
        >
          <span>&larr;</span>
          <div className="text-left">
            <p className="text-xs text-muted">Previous</p>
            <p className="line-clamp-1">{prevChapter.title}</p>
          </div>
        </Link>
      ) : (
        <div />
      )}

      <Link
        href={`/books/${bookId}`}
        className="text-sm text-muted hover:text-foreground transition-colors"
      >
        All Chapters
      </Link>

      {nextChapter ? (
        <Link
          href={`/books/${bookId}/chapters/${nextChapter.id}`}
          className="flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-card transition-colors"
        >
          <div className="text-right">
            <p className="text-xs text-muted">Next</p>
            <p className="line-clamp-1">{nextChapter.title}</p>
          </div>
          <span>&rarr;</span>
        </Link>
      ) : (
        <div />
      )}
    </div>
  );
}
