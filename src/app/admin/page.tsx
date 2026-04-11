"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAllBooks } from "@/lib/firestore/books";
import type { Book } from "@/types";

export default function AdminDashboardPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [userCount, setUserCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getAllBooks(),
      fetch("/api/admin/users").then((r) => r.json()).catch(() => ({ total: null })),
    ]).then(([b, u]) => {
      setBooks(b);
      setUserCount(u.total ?? null);
    }).finally(() => setLoading(false));
  }, []);

  const publishedCount = books.filter((b) => b.status === "published").length;
  const draftCount = books.filter((b) => b.status === "draft").length;
  const totalChapters = books.reduce((sum, b) => sum + b.chapterCount, 0);
  const totalViews = books.reduce((sum, b) => sum + (b.viewCount ?? 0), 0);
  const topBooks = [...books]
    .sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0))
    .slice(0, 5)
    .filter((b) => (b.viewCount ?? 0) > 0);

  return (
    <div className="max-w-4xl">
      <h1 className="mb-6 text-xl font-bold sm:text-2xl">Dashboard</h1>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
        </div>
      ) : (
        <>
          <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
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
            <div className="rounded-lg border border-border bg-card p-5">
              <p className="text-sm text-muted">Total Views</p>
              <p className="mt-1 text-2xl font-bold sm:text-3xl">{totalViews.toLocaleString()}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-5">
              <p className="text-sm text-muted">Registered Users</p>
              <p className="mt-1 text-2xl font-bold sm:text-3xl">
                {userCount === null ? "—" : userCount.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Top Books by Views */}
          {topBooks.length > 0 && (
            <div className="mb-8">
              <h2 className="mb-3 text-sm font-semibold text-muted uppercase tracking-wide">Top Books by Views</h2>
              <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-card">
                      <th className="px-4 py-2.5 text-left font-medium text-muted">Book</th>
                      <th className="px-4 py-2.5 text-left font-medium text-muted">Status</th>
                      <th className="px-4 py-2.5 text-right font-medium text-muted">Views</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topBooks.map((book) => (
                      <tr key={book.id} className="border-b border-border last:border-0 hover:bg-card transition-colors">
                        <td className="px-4 py-3 font-medium">{book.title}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium ${book.status === "published" ? "text-success" : "text-muted"}`}>
                            {book.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">{(book.viewCount ?? 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
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
            <a
              href={`https://console.firebase.google.com/project/${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}/analytics`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-card transition-colors"
            >
              Firebase Analytics ↗
            </a>
          </div>
        </>
      )}
    </div>
  );
}
