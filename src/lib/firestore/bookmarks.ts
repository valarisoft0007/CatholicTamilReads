import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { getClientDb } from "@/lib/firebase/client";
import type { Bookmark, Favorite } from "@/types";

// Bookmarks
function bookmarksRef(uid: string) {
  return collection(getClientDb(), "users", uid, "bookmarks");
}

export async function getBookmarks(uid: string): Promise<Bookmark[]> {
  const q = query(bookmarksRef(uid), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Bookmark));
}

export async function addBookmark(
  uid: string,
  data: Omit<Bookmark, "id" | "createdAt">
): Promise<void> {
  const bookmarkId = `${data.bookId}_${data.chapterId}`;
  await setDoc(doc(getClientDb(), "users", uid, "bookmarks", bookmarkId), {
    ...data,
    createdAt: serverTimestamp(),
  });
}

export async function removeBookmark(
  uid: string,
  bookId: string,
  chapterId: string
): Promise<void> {
  const bookmarkId = `${bookId}_${chapterId}`;
  await deleteDoc(doc(getClientDb(), "users", uid, "bookmarks", bookmarkId));
}

export async function isBookmarked(
  uid: string,
  bookId: string,
  chapterId: string
): Promise<boolean> {
  const q = query(
    bookmarksRef(uid),
    where("bookId", "==", bookId),
    where("chapterId", "==", chapterId)
  );
  const snapshot = await getDocs(q);
  return !snapshot.empty;
}

// Favorites
function favoritesRef(uid: string) {
  return collection(getClientDb(), "users", uid, "favorites");
}

export async function getFavorites(uid: string): Promise<Favorite[]> {
  const q = query(favoritesRef(uid), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ ...d.data() } as Favorite));
}

export async function addFavorite(
  uid: string,
  data: Omit<Favorite, "createdAt">
): Promise<void> {
  await setDoc(doc(getClientDb(), "users", uid, "favorites", data.bookId), {
    ...data,
    createdAt: serverTimestamp(),
  });
}

export async function removeFavorite(
  uid: string,
  bookId: string
): Promise<void> {
  await deleteDoc(doc(getClientDb(), "users", uid, "favorites", bookId));
}

export async function isFavorited(
  uid: string,
  bookId: string
): Promise<boolean> {
  const q = query(favoritesRef(uid), where("bookId", "==", bookId));
  const snapshot = await getDocs(q);
  return !snapshot.empty;
}
