"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { BookForm } from "@/components/admin/BookForm";
import { getBook } from "@/lib/firestore/books";
import type { Book } from "@/types";

export default function EditBookPage() {
  const { bookId } = useParams<{ bookId: string }>();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBook(bookId)
      .then(setBook)
      .finally(() => setLoading(false));
  }, [bookId]);

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
      </div>
    );
  }

  if (!book) {
    return <p className="py-10 text-center text-muted">Book not found.</p>;
  }

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold sm:text-2xl">Edit Book</h1>
      <BookForm book={book} />
    </div>
  );
}
