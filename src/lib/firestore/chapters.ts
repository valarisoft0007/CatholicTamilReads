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
  limit,
  startAfter,
  serverTimestamp,
  increment,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { getClientDb } from "@/lib/firebase/client";
import type { Chapter } from "@/types";

export interface ChapterPage {
  chapters: Chapter[];
  lastDoc: QueryDocumentSnapshot | null;
  hasMore: boolean;
}

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
  const q = query(chaptersRef(bookId), orderBy("order", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(
    (d) => ({ id: d.id, bookId, ...d.data() } as Chapter)
  );
}

export async function getChaptersPage(
  bookId: string,
  cursor: QueryDocumentSnapshot | null,
  pageSize = 20
): Promise<ChapterPage> {
  const base = query(chaptersRef(bookId), orderBy("order", "desc"), limit(pageSize + 1));
  const q = cursor ? query(base, startAfter(cursor)) : base;
  const snap = await getDocs(q);
  const hasMore = snap.docs.length > pageSize;
  const docs = hasMore ? snap.docs.slice(0, pageSize) : snap.docs;
  return {
    chapters: docs.map((d) => ({ id: d.id, bookId, ...d.data() } as Chapter)),
    lastDoc: docs.at(-1) ?? null,
    hasMore,
  };
}

export async function getPublishedChaptersPage(
  bookId: string,
  cursor: QueryDocumentSnapshot | null,
  pageSize = 25
): Promise<ChapterPage> {
  const base = query(
    chaptersRef(bookId),
    where("status", "==", "published"),
    orderBy("order", "asc"),
    limit(pageSize + 1)
  );
  const q = cursor ? query(base, startAfter(cursor)) : base;
  const snap = await getDocs(q);
  const hasMore = snap.docs.length > pageSize;
  const docs = hasMore ? snap.docs.slice(0, pageSize) : snap.docs;
  return {
    chapters: docs.map((d) => ({ id: d.id, bookId, ...d.data() } as Chapter)),
    lastDoc: docs.at(-1) ?? null,
    hasMore,
  };
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
