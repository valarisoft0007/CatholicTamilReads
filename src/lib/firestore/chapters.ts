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
  increment,
} from "firebase/firestore";
import { getClientDb } from "@/lib/firebase/client";
import type { Chapter } from "@/types";

function chaptersRef(bookId: string) {
  return collection(getClientDb(), "books", bookId, "chapters");
}

export async function getPublishedChapters(bookId: string): Promise<Chapter[]> {
  const q = query(
    chaptersRef(bookId),
    where("status", "==", "published"),
    orderBy("order", "asc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(
    (d) => ({ id: d.id, bookId, ...d.data() } as Chapter)
  );
}

export async function getAllChapters(bookId: string): Promise<Chapter[]> {
  const q = query(chaptersRef(bookId), orderBy("order", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(
    (d) => ({ id: d.id, bookId, ...d.data() } as Chapter)
  );
}

export async function getChapter(
  bookId: string,
  chapterId: string
): Promise<Chapter | null> {
  const docSnap = await getDoc(
    doc(getClientDb(), "books", bookId, "chapters", chapterId)
  );
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, bookId, ...docSnap.data() } as Chapter;
}

export async function createChapter(
  bookId: string,
  data: Omit<Chapter, "id" | "bookId" | "createdAt" | "updatedAt">
): Promise<string> {
  const docRef = await addDoc(chaptersRef(bookId), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await updateDoc(doc(getClientDb(), "books", bookId), {
    chapterCount: increment(1),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateChapter(
  bookId: string,
  chapterId: string,
  data: Partial<Omit<Chapter, "id" | "bookId" | "createdAt">>
): Promise<void> {
  await updateDoc(doc(getClientDb(), "books", bookId, "chapters", chapterId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteChapter(
  bookId: string,
  chapterId: string
): Promise<void> {
  await deleteDoc(doc(getClientDb(), "books", bookId, "chapters", chapterId));
  await updateDoc(doc(getClientDb(), "books", bookId), {
    chapterCount: increment(-1),
    updatedAt: serverTimestamp(),
  });
}
