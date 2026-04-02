import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <span className="text-5xl text-gold">&#10013;</span>
      <h1 className="mt-6 text-6xl font-bold text-gold">404</h1>
      <h2 className="mt-3 text-xl font-semibold">Page Not Found</h2>
      <p className="mt-2 max-w-sm text-sm text-muted">
        The page you are looking for does not exist or may have been moved.
      </p>
      <div className="mt-8 flex gap-3">
        <Link
          href="/"
          className="rounded-md bg-gold px-5 py-2 text-sm font-medium text-white hover:bg-gold-dark transition-colors"
        >
          Go Home
        </Link>
        <Link
          href="/books"
          className="rounded-md border border-border px-5 py-2 text-sm font-medium hover:bg-card transition-colors"
        >
          Browse Books
        </Link>
      </div>
    </div>
  );
}
