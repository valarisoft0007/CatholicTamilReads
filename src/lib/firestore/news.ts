import {
  collection,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";
import { getClientDb } from "@/lib/firebase/client";
import type { NewsItem } from "@/types";

function newsRef() {
  return collection(getClientDb(), "news");
}

export async function getNewsItems(): Promise<NewsItem[]> {
  const q = query(newsRef(), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as NewsItem));
}
