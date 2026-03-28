"use client";

import Image from "next/image";
import Link from "next/link";
import type { Book } from "@/types";

interface BookCardProps {
  book: Book;
}

function isNew(createdAt: unknown): boolean {
  if (!createdAt) return false;
  const date =
    typeof createdAt === "object" && "toDate" in (createdAt as object)
      ? (createdAt as { toDate: () => Date }).toDate()
      : new Date(createdAt as string);
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  return date.getTime() > thirtyDaysAgo;
}

export function BookCard({ book }: BookCardProps) {
  return (
    <Link
      href={`/books/${book.id}`}
      className="group overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:border-gold/30"
      style={{
        boxShadow: "var(--shadow-card)",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.boxShadow = "var(--shadow-card-hover)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.boxShadow = "var(--shadow-card)")
      }
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-card-hover">
        {book.coverImageUrl ? (
          <Image
            src={book.coverImageUrl}
            alt={book.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-gold/10 to-gold/5">
            <span className="text-6xl text-gold/30">&#10013;</span>
          </div>
        )}
        {isNew(book.createdAt) && (
          <span className="absolute left-2 top-2 rounded-full bg-gold px-2.5 py-0.5 text-xs font-medium text-white shadow-sm">
            New
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="mb-1 font-semibold text-foreground transition-colors duration-200 group-hover:text-gold-dark line-clamp-2">
          {book.title}
        </h3>
        <p className="mb-2 text-sm text-muted">{book.authorName}</p>
        <p className="text-sm text-muted line-clamp-2">{book.description}</p>
        <div className="mt-3 flex items-center gap-1.5 text-xs text-muted">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </svg>
          {book.chapterCount} {book.chapterCount === 1 ? "chapter" : "chapters"}
        </div>
      </div>
    </Link>
  );
}
