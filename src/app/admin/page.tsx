"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAllBooks } from "@/lib/firestore/books";
import type { Book } from "@/types";

export default function AdminDashboardPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllBooks()
      .then(setBooks)
      .finally(() => setLoading(false));
  }, []);

  const publishedCount = books.filter((b) => b.status === "published").length;
  const draftCount = books.filter((b) => b.status === "draft").length;
  const totalChapters = books.reduce((sum, b) => sum + b.chapterCount, 0);

  return (
    <div className="max-w-4xl">
      <h1 className="mb-6 text-xl font-bold sm:text-2xl">Dashboard</h1>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
        </div>
      ) : (
        <>
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-border bg-card p-5">
              <p className="text-sm text-muted">Published Books</p>
              <p className="mt-1 text-2xl font-bold sm:text-3xl">{publishedCount}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-5">
              <p className="text-sm text-muted">Drafts</p>
              <p className="mt-1 text-2xl font-bold sm:text-3xl">{draftCount}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-5">
              <p className="text-sm text-muted">Total Chapters</p>
              <p className="mt-1 text-2xl font-bold sm:text-3xl">{totalChapters}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Link
              href="/admin/books/new"
              className="rounded-md bg-gold px-4 py-2 text-sm font-medium text-white hover:bg-gold-dark transition-colors"
            >
              New Book
            </Link>
            <Link
              href="/admin/books"
              className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-card transition-colors"
            >
              Manage Books
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
