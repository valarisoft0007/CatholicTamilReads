"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getBook } from "@/lib/firestore/books";
import { getChapter } from "@/lib/firestore/chapters";
import { ChapterForm } from "@/components/admin/ChapterForm";
import type { Book, Chapter } from "@/types";

export default function EditChapterPage() {
  const { bookId, chapterId } = useParams<{
    bookId: string;
    chapterId: string;
  }>();
  const [book, setBook] = useState<Book | null>(null);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getBook(bookId), getChapter(bookId, chapterId)])
      .then(([b, c]) => {
        setBook(b);
        setChapter(c);
      })
      .finally(() => setLoading(false));
  }, [bookId, chapterId]);

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
      </div>
    );
  }

  if (!chapter) {
    return <p className="py-10 text-center text-muted">Chapter not found.</p>;
  }

  const label = book?.bookType === "songs" ? "Song" : "Chapter";

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold sm:text-2xl">Edit {label}</h1>
      <ChapterForm bookId={bookId} chapter={chapter} bookType={book?.bookType} />
    </div>
  );
}
