import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      {/* Decorative gold line */}
      <div aria-hidden="true" className="h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          {/* Quick links */}
          <nav aria-label="Footer navigation" className="flex items-center gap-6">
            <Link
              href="/"
              className="text-sm text-muted hover:text-foreground transition-colors"
            >
              Home
            </Link>
            <Link
              href="/#books"
              className="text-sm text-muted hover:text-foreground transition-colors"
            >
              Browse Books
            </Link>
          </nav>

          {/* Latin motto */}
          <p className="font-serif text-sm italic text-gold/60">
            Ad Maiorem Dei Gloriam
          </p>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted">
          <span aria-hidden="true" className="text-gold/40">&#10013;</span>
          <p>&copy; {new Date().getFullYear()} Catholic Tamil Reads</p>
        </div>
      </div>
    </footer>
  );
}
