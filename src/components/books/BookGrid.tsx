"use client";

import { useEffect, useState } from "react";
import { BookCard } from "./BookCard";
import { getPublishedBooks } from "@/lib/firestore/books";
import type { Book } from "@/types";

export function BookGrid() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPublishedBooks()
      .then(setBooks)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="skeleton aspect-[3/4] w-full rounded-none" />
            <div className="p-4 space-y-3">
              <div className="skeleton h-5 w-3/4" />
              <div className="skeleton h-4 w-1/2" />
              <div className="skeleton h-4 w-full" />
              <div className="skeleton h-3 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <div className="py-20 text-center">
        <span className="mb-4 block text-6xl text-gold/30">&#10013;</span>
        <p className="text-lg text-muted">No books available yet.</p>
        <p className="text-sm text-muted">Check back soon for new content.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {books.map((book) => (
        <BookCard key={book.id} book={book} />
      ))}
    </div>
  );
}
