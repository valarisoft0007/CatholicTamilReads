"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { getBook } from "@/lib/firestore/books";
import { getChapter, getPublishedChapters } from "@/lib/firestore/chapters";
import { ChapterContent } from "@/components/reader/ChapterContent";
import { ChapterNavigation } from "@/components/reader/ChapterNavigation";
import { ReadingProgressBar } from "@/components/reader/ReadingProgressBar";
import { BookmarkButton } from "@/components/reader/BookmarkButton";
import { FontSizeToggle } from "@/components/reader/FontSizeToggle";
import { BackToTop } from "@/components/reader/BackToTop";
import type { Book, Chapter } from "@/types";

function estimateReadingTime(html: string): number {
  const text = html.replace(/<[^>]*>/g, "");
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export default function ChapterReaderPage() {
  const { bookId, chapterId } = useParams<{
    bookId: string;
    chapterId: string;
  }>();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [book, setBook] = useState<Book | null>(null);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [allChapters, setAllChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);

  // Load data regardless of auth — needed to check isFree before deciding to redirect
  useEffect(() => {
    async function load() {
      const [b, ch, chapters] = await Promise.all([
        getBook(bookId),
        getChapter(bookId, chapterId),
        getPublishedChapters(bookId),
      ]);
      setBook(b);
      setChapter(ch);
      setAllChapters(chapters);
      setLoading(false);
      window.scrollTo(0, 0);
    }
    load();
  }, [bookId, chapterId]);

  // Auth gate: redirect only after both auth and data are resolved, and content is not free
  useEffect(() => {
    if (authLoading || loading) return;
    const isFreeAccess = book?.isFree || chapter?.isFree;
    if (!isFreeAccess && !user) {
      router.push(
        `/auth/signin?redirect=/books/${bookId}/chapters/${chapterId}`
      );
    }
  }, [authLoading, loading, user, book, chapter, bookId, chapterId, router]);

  const isFreeAccess = book?.isFree || chapter?.isFree;

  if (authLoading || loading || (!isFreeAccess && !user)) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="space-y-4">
          <div className="skeleton h-4 w-32" />
          <div className="skeleton h-8 w-2/3" />
          <div className="skeleton h-4 w-24" />
          <div className="my-8 h-px bg-border" />
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton h-4 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!book || !chapter) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-lg text-muted">Chapter not found.</p>
        <Link href="/" className="mt-4 inline-block text-gold hover:underline">
          Back to Home
        </Link>
      </div>
    );
  }

  const currentIndex = allChapters.findIndex((c) => c.id === chapterId);
  const prevChapter = currentIndex > 0 ? allChapters[currentIndex - 1] : null;
  const nextChapter =
    currentIndex < allChapters.length - 1
      ? allChapters[currentIndex + 1]
      : null;
  const readingTime = estimateReadingTime(chapter.content);

  return (
    <>
      <ReadingProgressBar
        bookId={bookId}
        chapterId={chapterId}
        chapterOrder={chapter.order}
      />

      <div className="mx-auto max-w-3xl px-4 py-10">
        {/* Chapter header */}
        <div className="mb-8">
          <Link
            href={`/books/${bookId}`}
            className="mb-2 inline-block text-sm text-muted hover:text-gold transition-colors"
          >
            &larr; {book.title}
          </Link>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="mb-1 text-sm text-muted">
                Chapter {chapter.order}
              </p>
              <h1 className="text-xl font-bold sm:text-3xl">{chapter.title}</h1>
              <p className="mt-1 text-xs text-muted">~{readingTime} min read</p>
            </div>
            <div className="flex items-center gap-3">
              <FontSizeToggle />
              {user && (
                <BookmarkButton
                  bookId={bookId}
                  chapterId={chapterId}
                  bookTitle={book.title}
                  chapterTitle={chapter.title}
                />
              )}
            </div>
          </div>
        </div>

        {/* Ornamental divider */}
        <div className="mb-8 flex items-center gap-4">
          <div className="h-px flex-1 bg-border" />
          <span className="text-gold/40 text-sm">&#10013;</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Chapter content */}
        <ChapterContent html={chapter.content} />

        {/* Navigation */}
        <div className="mt-12">
          <ChapterNavigation
            bookId={bookId}
            prevChapter={prevChapter}
            nextChapter={nextChapter}
          />
        </div>

        {/* All chapters link */}
        <div className="mt-6 text-center">
          <Link
            href={`/books/${bookId}`}
            className="text-sm text-muted hover:text-gold transition-colors"
          >
            &larr; All Chapters
          </Link>
        </div>
      </div>

      <BackToTop />
    </>
  );
}
