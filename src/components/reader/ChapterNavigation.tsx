"use client";

import Link from "next/link";
import type { Chapter } from "@/types";

interface ChapterNavigationProps {
  bookId: string;
  prevChapter?: Chapter | null;
  nextChapter?: Chapter | null;
  bookType?: "book" | "songs";
}

export function ChapterNavigation({
  bookId,
  prevChapter,
  nextChapter,
  bookType,
}: ChapterNavigationProps) {
  return (
    <div className="mx-auto max-w-3xl border-t border-border pt-8 space-y-4">
      {/* Prev / Next row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {prevChapter ? (
          <Link
            href={`/books/${bookId}/chapters/${prevChapter.id}`}
            className="flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-card transition-colors sm:flex-1 sm:max-w-[48%]"
          >
            <span className="shrink-0">&larr;</span>
            <div className="text-left min-w-0">
              <p className="text-xs text-muted">Previous</p>
              <p className="line-clamp-1">{prevChapter.title}</p>
            </div>
          </Link>
        ) : (
          <div className="hidden sm:block sm:flex-1" />
        )}

        {nextChapter ? (
          <Link
            href={`/books/${bookId}/chapters/${nextChapter.id}`}
            className="flex items-center justify-end gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-card transition-colors sm:flex-1 sm:max-w-[48%]"
          >
            <div className="text-right min-w-0">
              <p className="text-xs text-muted">Next</p>
              <p className="line-clamp-1">{nextChapter.title}</p>
            </div>
            <span className="shrink-0">&rarr;</span>
          </Link>
        ) : (
          <div className="hidden sm:block sm:flex-1" />
        )}
      </div>

      {/* All Chapters — always centered below */}
      <div className="text-center">
        <Link
          href={`/books/${bookId}`}
          className="text-sm text-muted hover:text-foreground transition-colors"
        >
          &larr; All {bookType === "songs" ? "Songs" : "Chapters"}
        </Link>
      </div>
    </div>
  );
}
