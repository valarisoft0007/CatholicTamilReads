import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { getClientDb } from "@/lib/firebase/client";
import type { Book } from "@/types";

function booksRef() {
  return collection(getClientDb(), "books");
}

export async function getPublishedBooks(): Promise<Book[]> {
  const q = query(
    booksRef(),
    where("status", "==", "published"),
    orderBy("updatedAt", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Book));
}

export async function getAllBooks(): Promise<Book[]> {
  const q = query(booksRef(), orderBy("order", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Book));
}

export async function getBook(bookId: string): Promise<Book | null> {
  const docSnap = await getDoc(doc(getClientDb(), "books", bookId));
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as Book;
}

export async function createBook(
  data: Omit<Book, "id" | "createdAt" | "updatedAt" | "chapterCount">
): Promise<string> {
  const docRef = await addDoc(booksRef(), {
    ...data,
    chapterCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateBook(
  bookId: string,
  data: Partial<Omit<Book, "id" | "createdAt">>
): Promise<void> {
  await updateDoc(doc(getClientDb(), "books", bookId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteBook(bookId: string): Promise<void> {
  await deleteDoc(doc(getClientDb(), "books", bookId));
}
