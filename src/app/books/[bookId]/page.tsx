"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getBook } from "@/lib/firestore/books";
import { getPublishedChaptersPage } from "@/lib/firestore/chapters";
import { getProgress } from "@/lib/firestore/reading-progress";
import { TableOfContents } from "@/components/books/TableOfContents";
import { DownloadButtons } from "@/components/books/DownloadButtons";
import { ShareButton } from "@/components/reader/ShareButton";
import { FavoriteButton } from "@/components/books/FavoriteButton";
import { useAuth } from "@/hooks/useAuth";
import { getClientAnalytics } from "@/lib/firebase/client";
import { logEvent } from "firebase/analytics";
import type { Book, Chapter, ReadingProgress } from "@/types";
import type { QueryDocumentSnapshot } from "firebase/firestore";

export default function BookDetailPage() {
  const { bookId } = useParams<{ bookId: string }>();
  const { user } = useAuth();
  const [book, setBook] = useState<Book | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [progress, setProgress] = useState<ReadingProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [tocPage, setTocPage] = useState(0);
  const [pageCursors, setPageCursors] = useState<(QueryDocumentSnapshot | null)[]>([null]);
  const [hasMore, setHasMore] = useState(false);
  const [tocLoading, setTocLoading] = useState(false);
  const [firstChapterId, setFirstChapterId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const [b, result] = await Promise.all([
        getBook(bookId),
        getPublishedChaptersPage(bookId, null),
      ]);
      setBook(b);
      setChapters(result.chapters);
      setHasMore(result.hasMore);
      if (result.lastDoc) setPageCursors([null, result.lastDoc]);
      if (result.chapters.length > 0) setFirstChapterId(result.chapters[0].id);

      // Track book view (fire-and-forget)
      if (b?.status === "published") {
        fetch("/api/analytics/view", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "book", bookId }),
        }).catch(() => {});

        getClientAnalytics().then((a) => {
          if (a) logEvent(a, "book_view", { book_id: bookId, book_title: b.title });
        }).catch(() => {});
      }

      if (user) {
        const p = await getProgress(user.uid, bookId);
        setProgress(p);
      }

      setLoading(false);
    }
    load();
  }, [bookId, user]);

  const handleTocPage = async (pageIndex: number) => {
    setTocLoading(true);
    const cursor = pageIndex < pageCursors.length ? pageCursors[pageIndex] : null;
    const result = await getPublishedChaptersPage(bookId, cursor);
    setChapters(result.chapters);
    setHasMore(result.hasMore);
    if (result.lastDoc && pageCursors.length === pageIndex + 1) {
      setPageCursors((prev) => [...prev, result.lastDoc]);
    }
    setTocPage(pageIndex);
    setTocLoading(false);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="flex flex-col gap-6 sm:flex-row">
          <div className="skeleton h-56 w-40 shrink-0 rounded-lg" />
          <div className="flex-1 space-y-3">
            <div className="skeleton h-8 w-2/3" />
            <div className="skeleton h-4 w-1/3" />
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-1/4" />
            <div className="skeleton mt-4 h-10 w-36 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <p className="text-lg text-muted">Book not found.</p>
        <Link href="/" className="mt-4 inline-block text-gold hover:underline">
          Back to Home
        </Link>
      </div>
    );
  }

  const progressPercent = progress && book.chapterCount > 0
    ? Math.round(
        ((progress.lastChapterOrder - 1 + progress.scrollPosition / 100) /
          book.chapterCount) *
          100
      )
    : 0;

  const chapterLabel = book.bookType === "songs" ? "song" : "chapter";
  const chaptersLabel = book.bookType === "songs" ? "songs" : "chapters";

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      {/* Book header */}
      <div className="mb-10 flex flex-col gap-6 sm:flex-row">
        {/* 3D Book Cover */}
        <div
          className="relative mx-auto h-56 w-40 shrink-0 overflow-hidden rounded-lg sm:mx-0 sm:h-72 sm:w-48"
          style={{
            boxShadow:
              "6px 6px 12px rgba(0,0,0,0.15), 2px 2px 4px rgba(0,0,0,0.1), inset -2px 0 4px rgba(0,0,0,0.05)",
          }}
        >
          {book.coverImageUrl ? (
            <Image
              src={book.coverImageUrl}
              alt={book.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-gold/15 to-gold/5">
              <span aria-hidden="true" className="text-3xl text-gold/40 sm:text-5xl">&#10013;</span>
            </div>
          )}
        </div>

        <div className="flex-1">
          <h1 className="mb-2 text-xl font-bold sm:text-3xl">{book.title}</h1>
          <p className="mb-2 text-muted">by {book.authorName}</p>
          <p className="mb-4 text-sm text-muted">{book.description}</p>
          <p className="text-sm text-muted">
            {book.chapterCount}{" "}
            {book.chapterCount === 1 ? chapterLabel : chaptersLabel}{" "}
            published
          </p>

          {/* CTA Buttons */}
          <div className="mt-4 flex flex-wrap gap-3">
            {progress && book.chapterCount > 0 && (
              <Link
                href={`/books/${bookId}/chapters/${progress.lastChapterId}`}
                className="inline-flex items-center gap-2 rounded-lg bg-gold px-5 py-2.5 text-sm font-medium text-white shadow-md transition-all hover:bg-gold-dark hover:shadow-lg"
              >
                <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                </svg>
                Continue Reading
              </Link>
            )}

            {!progress && firstChapterId && (
              <Link
                href={`/books/${bookId}/chapters/${firstChapterId}`}
                className="inline-flex items-center gap-2 rounded-lg bg-gold px-5 py-2.5 text-sm font-medium text-white shadow-md transition-all hover:bg-gold-dark hover:shadow-lg"
              >
                <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                </svg>
                Start Reading
              </Link>
            )}
            <FavoriteButton
              bookId={bookId}
              bookTitle={book.title}
              coverImageUrl={book.coverImageUrl}
            />
            <ShareButton
              title={book.title}
              text={`Read '${book.title}' by ${book.authorName} on Catholic Tamil Reads`}
            />
          </div>

          {/* eBook Downloads — registered users only */}
          {user && (
            <DownloadButtons
              bookId={bookId}
              ebookPdfUrl={book.ebookPdfUrl}
              ebookEpubUrl={book.ebookEpubUrl}
            />
          )}
        </div>
      </div>

      {/* Progress Card */}
      {progress && book.chapterCount > 0 && (
        <div className="mb-8 rounded-xl border border-gold/20 bg-gold/5 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Your Progress</span>
            <span className="text-muted">{progressPercent}% complete</span>
          </div>
          <div
            className="mt-2 h-2 w-full overflow-hidden rounded-full bg-border"
            role="progressbar"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Reading progress: ${progressPercent}% complete`}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-gold-dark to-gold transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-muted">
            Currently on {book.bookType === "songs" ? "Song" : "Chapter"} {progress.lastChapterOrder}
          </p>
        </div>
      )}

      {/* Table of Contents */}
      <h2 className="mb-4 text-base font-semibold sm:text-xl">{book.bookType === "songs" ? "Songs" : "Chapters"}</h2>
      <TableOfContents
        bookId={bookId}
        chapters={chapters}
        progress={progress}
        bookIsFree={book.isFree}
        tocPage={tocPage}
        hasMore={hasMore}
        hasPrev={tocPage > 0}
        tocLoading={tocLoading}
        totalChapters={book.chapterCount}
        onNext={() => handleTocPage(tocPage + 1)}
        onPrev={() => handleTocPage(tocPage - 1)}
      />
    </div>
  );
}
