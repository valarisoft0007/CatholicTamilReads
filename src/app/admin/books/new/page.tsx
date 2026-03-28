import { BookForm } from "@/components/admin/BookForm";

export const dynamic = "force-dynamic";

export default function NewBookPage() {
  return (
    <div>
      <h1 className="mb-6 text-xl font-bold sm:text-2xl">Create New Book</h1>
      <BookForm />
    </div>
  );
}
