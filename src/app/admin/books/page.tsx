"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAllBooks, deleteBook } from "@/lib/firestore/books";
import type { Book } from "@/types";

export default function AdminBooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBooks = () => {
    setLoading(true);
    getAllBooks()
      .then(setBooks)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadBooks();
  }, []);

  const handleDelete = async (bookId: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    await deleteBook(bookId);
    loadBooks();
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold sm:text-2xl">Books</h1>
        <Link
          href="/admin/books/new"
          className="rounded-md bg-gold px-4 py-2 text-sm font-medium text-white hover:bg-gold-dark transition-colors"
        >
          New Book
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
        </div>
      ) : books.length === 0 ? (
        <p className="py-10 text-center text-muted">
          No books yet. Create your first book to get started.
        </p>
      ) : (
        <div className="space-y-3">
          {books.map((book) => (
            <div
              key={book.id}
              className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
            >
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{book.title}</h3>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      book.status === "published"
                        ? "bg-success/10 text-success"
                        : "bg-muted/10 text-muted"
                    }`}
                  >
                    {book.status}
                  </span>
                </div>
                <p className="text-sm text-muted">
                  {book.authorName} &middot; {book.chapterCount} chapters
                </p>
              </div>

              <div className="flex gap-2">
                <Link
                  href={`/admin/books/${book.id}/chapters`}
                  className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-card-hover transition-colors"
                >
                  Chapters
                </Link>
                <Link
                  href={`/admin/books/${book.id}`}
                  className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-card-hover transition-colors"
                >
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(book.id, book.title)}
                  className="rounded-md border border-danger/30 px-3 py-1.5 text-sm text-danger hover:bg-danger/5 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
