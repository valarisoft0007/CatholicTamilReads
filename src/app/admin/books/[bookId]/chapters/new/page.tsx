"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getBook } from "@/lib/firestore/books";
import { ChapterForm } from "@/components/admin/ChapterForm";
import type { Book } from "@/types";

export default function NewChapterPage() {
  const { bookId } = useParams<{ bookId: string }>();
  const [book, setBook] = useState<Book | null>(null);

  useEffect(() => {
    getBook(bookId).then(setBook);
  }, [bookId]);

  const label = book?.bookType === "songs" ? "Song" : "Chapter";

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold sm:text-2xl">New {label}</h1>
      {book ? (
        <ChapterForm bookId={bookId} bookType={book.bookType} nextOrder={book.chapterCount + 1} />
      ) : (
        <div className="flex justify-center py-10">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
        </div>
      )}
    </div>
  );
}
