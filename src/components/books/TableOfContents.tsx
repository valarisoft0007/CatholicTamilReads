"use client";

import Link from "next/link";
import type { Chapter, ReadingProgress } from "@/types";

interface TableOfContentsProps {
  bookId: string;
  chapters: Chapter[];
  progress?: ReadingProgress | null;
  bookIsFree?: boolean;
  tocPage?: number;
  hasMore?: boolean;
  hasPrev?: boolean;
  tocLoading?: boolean;
  onNext?: () => void;
  onPrev?: () => void;
}

export function TableOfContents({
  bookId,
  chapters,
  progress,
  bookIsFree,
  tocPage = 0,
  hasMore = false,
  hasPrev = false,
  tocLoading = false,
  onNext,
  onPrev,
}: TableOfContentsProps) {
  if (chapters.length === 0 && !hasPrev) {
    return (
      <p className="py-10 text-center text-muted">
        No chapters available yet. Check back soon!
      </p>
    );
  }

  return (
    <div>
      <div className="space-y-2">
        {chapters.map((chapter) => {
          const isCurrent = progress?.lastChapterId === chapter.id;
          const isRead =
            progress &&
            chapter.order < progress.lastChapterOrder;
          const isCompleted =
            isCurrent && progress && progress.scrollPosition >= 90;
          const showFreeBadge = bookIsFree || chapter.isFree;

          return (
            <Link
              key={chapter.id}
              href={`/books/${bookId}/chapters/${chapter.id}`}
              className={`flex items-center gap-4 rounded-xl border p-4 transition-all duration-200 hover:shadow-sm ${
                isCurrent
                  ? "border-gold/50 bg-gold/5"
                  : "border-border bg-card hover:border-gold/30"
              }`}
            >
              {/* Status indicator */}
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-medium ${
                  isRead || isCompleted
                    ? "bg-success/10 text-success"
                    : isCurrent
                      ? "bg-gold text-white"
                      : "bg-card-hover text-muted"
                }`}
              >
                {isRead || isCompleted ? (
                  <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  chapter.order
                )}
              </span>

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{chapter.title}</h3>
                  {showFreeBadge && (
                    <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                      Free
                    </span>
                  )}
                </div>
                {isCurrent && progress && (
                  <p className="mt-0.5 text-xs text-gold-dark">
                    Continue reading &middot; {progress.scrollPosition}% complete
                  </p>
                )}
                {isRead && !isCurrent && (
                  <p className="mt-0.5 text-xs text-success">Completed</p>
                )}
              </div>
              <span aria-hidden="true" className="text-muted">&rarr;</span>
            </Link>
          );
        })}
      </div>

      {(hasPrev || hasMore) && (
        <div className="mt-4 flex items-center justify-between">
          <button
            disabled={!hasPrev || tocLoading}
            onClick={onPrev}
            className="rounded-lg border border-border px-4 py-2 text-sm disabled:opacity-40 hover:bg-card transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-muted">
            {tocLoading ? "Loading..." : `Page ${tocPage + 1}`}
          </span>
          <button
            disabled={!hasMore || tocLoading}
            onClick={onNext}
            className="rounded-lg border border-border px-4 py-2 text-sm disabled:opacity-40 hover:bg-card transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
