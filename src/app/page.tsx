import { BookGrid } from "@/components/books/BookGrid";
import { HeroSection } from "@/components/HeroSection";
import { NewsPanel } from "@/components/NewsPanel";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <div>
      <HeroSection />
      <div className="mx-auto max-w-6xl px-4 pt-6 pb-2">
        <NewsPanel />
      </div>
      <div id="books" className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
        <h2 className="mb-6 text-lg font-semibold sm:text-2xl">Browse Books</h2>
        <BookGrid />
      </div>
    </div>
  );
}
