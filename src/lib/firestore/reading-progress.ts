import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { getClientDb } from "@/lib/firebase/client";
import type { ReadingProgress } from "@/types";

function progressRef(uid: string) {
  return collection(getClientDb(), "users", uid, "readingProgress");
}

export async function getAllProgress(uid: string): Promise<ReadingProgress[]> {
  const q = query(progressRef(uid), orderBy("updatedAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => d.data() as ReadingProgress);
}

export async function getProgress(
  uid: string,
  bookId: string
): Promise<ReadingProgress | null> {
  const docSnap = await getDoc(
    doc(getClientDb(), "users", uid, "readingProgress", bookId)
  );
  if (!docSnap.exists()) return null;
  return docSnap.data() as ReadingProgress;
}

export async function saveProgress(
  uid: string,
  data: Omit<ReadingProgress, "updatedAt">
): Promise<void> {
  await setDoc(
    doc(getClientDb(), "users", uid, "readingProgress", data.bookId),
    {
      ...data,
      updatedAt: serverTimestamp(),
    }
  );
}
