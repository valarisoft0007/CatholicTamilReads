"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { getBookmarks, removeBookmark } from "@/lib/firestore/bookmarks";
import { getFavorites, removeFavorite } from "@/lib/firestore/bookmarks";
import { getAllProgress } from "@/lib/firestore/reading-progress";
import type { Bookmark, Favorite, ReadingProgress } from "@/types";

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [progress, setProgress] = useState<ReadingProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/auth/signin");
      return;
    }

    Promise.all([
      getBookmarks(user.uid),
      getFavorites(user.uid),
      getAllProgress(user.uid),
    ]).then(([b, f, p]) => {
      setBookmarks(b);
      setFavorites(f);
      setProgress(p);
      setLoading(false);
    });
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  const handleRemoveBookmark = async (bookId: string, chapterId: string) => {
    await removeBookmark(user.uid, bookId, chapterId);
    setBookmarks((prev) =>
      prev.filter((b) => !(b.bookId === bookId && b.chapterId === chapterId))
    );
  };

  const handleRemoveFavorite = async (bookId: string) => {
    await removeFavorite(user.uid, bookId);
    setFavorites((prev) => prev.filter((f) => f.bookId !== bookId));
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="mb-2 text-xl font-bold sm:text-2xl">My Library</h1>
      <p className="mb-8 text-muted">
        Welcome, {user.displayName || user.email}
      </p>

      {/* Continue Reading */}
      {progress.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 text-lg font-semibold">Continue Reading</h2>
          <div className="space-y-2">
            {progress.map((p) => (
              <Link
                key={p.bookId}
                href={`/books/${p.bookId}/chapters/${p.lastChapterId}`}
                className="flex items-center justify-between rounded-lg border border-border bg-card p-4 hover:border-gold/30 transition-colors"
              >
                <div>
                  <p className="font-medium">Book</p>
                  <p className="text-sm text-muted">
                    Chapter {p.lastChapterOrder} &middot; {p.scrollPosition}%
                    complete
                  </p>
                </div>
                <span className="text-gold">&rarr;</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Favorites */}
      <section className="mb-10">
        <h2 className="mb-4 text-lg font-semibold">Favorite Books</h2>
        {favorites.length === 0 ? (
          <p className="text-sm text-muted">
            No favorites yet. Heart a book to add it here.
          </p>
        ) : (
          <div className="space-y-2">
            {favorites.map((f) => (
              <div
                key={f.bookId}
                className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
              >
                <Link
                  href={`/books/${f.bookId}`}
                  className="font-medium hover:text-gold transition-colors"
                >
                  {f.bookTitle}
                </Link>
                <button
                  onClick={() => handleRemoveFavorite(f.bookId)}
                  className="text-sm text-muted hover:text-danger transition-colors"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Bookmarks */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">Bookmarked Chapters</h2>
        {bookmarks.length === 0 ? (
          <p className="text-sm text-muted">
            No bookmarks yet. Bookmark a chapter while reading.
          </p>
        ) : (
          <div className="space-y-2">
            {bookmarks.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
              >
                <Link
                  href={`/books/${b.bookId}/chapters/${b.chapterId}`}
                  className="hover:text-gold transition-colors"
                >
                  <p className="font-medium">{b.chapterTitle}</p>
                  <p className="text-sm text-muted">{b.bookTitle}</p>
                </Link>
                <button
                  onClick={() => handleRemoveBookmark(b.bookId, b.chapterId)}
                  className="text-sm text-muted hover:text-danger transition-colors"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
