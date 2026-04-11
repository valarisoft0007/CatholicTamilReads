import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest'
import { getTestDb, setupTestEnvironment, clearFirestore, teardownTestEnvironment } from './helpers'
import { doc, getDoc } from 'firebase/firestore'

vi.mock('@/lib/firebase/client', () => ({
  getClientDb: () => getTestDb(),
}))

import {
  addBookmark,
  removeBookmark,
  isBookmarked,
  getBookmarks,
  addFavorite,
  removeFavorite,
  isFavorited,
  getFavorites,
} from '@/lib/firestore/bookmarks'

const UID = 'test-user-uid'

beforeAll(async () => {
  await setupTestEnvironment()
})

beforeEach(async () => {
  await clearFirestore()
})

afterAll(async () => {
  await teardownTestEnvironment()
})

describe('Bookmarks', () => {
  it('addBookmark creates a doc with composite ID bookId_chapterId', async () => {
    await addBookmark(UID, {
      bookId: 'book1',
      chapterId: 'chap1',
      bookTitle: 'Test Book',
      chapterTitle: 'Chapter 1',
    })
    const db = getTestDb()
    const docSnap = await getDoc(doc(db, 'users', UID, 'bookmarks', 'book1_chap1'))
    expect(docSnap.exists()).toBe(true)
  })

  it('isBookmarked returns true after adding a bookmark', async () => {
    await addBookmark(UID, {
      bookId: 'book1',
      chapterId: 'chap1',
      bookTitle: 'Test Book',
      chapterTitle: 'Chapter 1',
    })
    expect(await isBookmarked(UID, 'book1', 'chap1')).toBe(true)
  })

  it('isBookmarked returns false when bookmark does not exist', async () => {
    expect(await isBookmarked(UID, 'book1', 'chap1')).toBe(false)
  })

  it('removeBookmark deletes the bookmark doc', async () => {
    await addBookmark(UID, {
      bookId: 'book1',
      chapterId: 'chap1',
      bookTitle: 'Test Book',
      chapterTitle: 'Chapter 1',
    })
    await removeBookmark(UID, 'book1', 'chap1')
    expect(await isBookmarked(UID, 'book1', 'chap1')).toBe(false)
  })

  it('getBookmarks returns all bookmarks for the user', async () => {
    await addBookmark(UID, {
      bookId: 'book1',
      chapterId: 'chap1',
      bookTitle: 'Book 1',
      chapterTitle: 'Chap 1',
    })
    await addBookmark(UID, {
      bookId: 'book2',
      chapterId: 'chap2',
      bookTitle: 'Book 2',
      chapterTitle: 'Chap 2',
    })
    const bookmarks = await getBookmarks(UID)
    expect(bookmarks.length).toBe(2)
  })

  it('bookmark ID does not collide for different book+chapter combos', async () => {
    await addBookmark(UID, {
      bookId: 'book1',
      chapterId: 'chap1',
      bookTitle: 'Book 1',
      chapterTitle: 'Chap 1',
    })
    await addBookmark(UID, {
      bookId: 'book1',
      chapterId: 'chap2',
      bookTitle: 'Book 1',
      chapterTitle: 'Chap 2',
    })
    const bookmarks = await getBookmarks(UID)
    expect(bookmarks.length).toBe(2)
  })
})

describe('Favorites', () => {
  it('addFavorite creates a doc with ID = bookId', async () => {
    await addFavorite(UID, {
      bookId: 'book1',
      bookTitle: 'Test Book',
      coverImageUrl: '',
    })
    const db = getTestDb()
    const docSnap = await getDoc(doc(db, 'users', UID, 'favorites', 'book1'))
    expect(docSnap.exists()).toBe(true)
  })

  it('isFavorited returns true after adding', async () => {
    await addFavorite(UID, {
      bookId: 'book1',
      bookTitle: 'Test Book',
      coverImageUrl: '',
    })
    expect(await isFavorited(UID, 'book1')).toBe(true)
  })

  it('isFavorited returns false when not favorited', async () => {
    expect(await isFavorited(UID, 'book1')).toBe(false)
  })

  it('removeFavorite deletes the favorite doc', async () => {
    await addFavorite(UID, { bookId: 'book1', bookTitle: 'Book', coverImageUrl: '' })
    await removeFavorite(UID, 'book1')
    expect(await isFavorited(UID, 'book1')).toBe(false)
  })

  it('getFavorites returns all favorites for the user', async () => {
    await addFavorite(UID, { bookId: 'book1', bookTitle: 'Book 1', coverImageUrl: '' })
    await addFavorite(UID, { bookId: 'book2', bookTitle: 'Book 2', coverImageUrl: '' })
    const favorites = await getFavorites(UID)
    expect(favorites.length).toBe(2)
  })

  it('addFavorite is idempotent (same bookId overwrites)', async () => {
    await addFavorite(UID, { bookId: 'book1', bookTitle: 'Book 1', coverImageUrl: '' })
    await addFavorite(UID, { bookId: 'book1', bookTitle: 'Book 1 Updated', coverImageUrl: '' })
    const favorites = await getFavorites(UID)
    expect(favorites.length).toBe(1)
  })
})
