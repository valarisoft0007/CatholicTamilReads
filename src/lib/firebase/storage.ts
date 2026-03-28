export async function uploadImageViaApi(file: File, path: string): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("path", path);

  const res = await fetch("/api/admin/upload", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(data.error || "Upload failed");
  }

  const data = await res.json() as { url: string };
  return data.url;
}

export function getBookCoverPath(bookId: string, fileName: string) {
  return `covers/${bookId}/${fileName}`;
}

export function getChapterImagePath(
  bookId: string,
  chapterId: string,
  fileName: string
) {
  return `chapters/${bookId}/${chapterId}/${Date.now()}-${fileName}`;
}
