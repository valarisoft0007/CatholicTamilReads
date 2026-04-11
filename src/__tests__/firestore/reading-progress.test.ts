import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest'
import { getTestDb, setupTestEnvironment, clearFirestore, teardownTestEnvironment } from './helpers'

vi.mock('@/lib/firebase/client', () => ({
  getClientDb: () => getTestDb(),
}))

import {
  saveProgress,
  getProgress,
  getAllProgress,
} from '@/lib/firestore/reading-progress'

const UID = 'test-user-uid'

const progressData = {
  bookId: 'book123',
  lastChapterId: 'chap456',
  lastChapterOrder: 3,
  scrollPosition: 75,
}

beforeAll(async () => {
  await setupTestEnvironment()
})

beforeEach(async () => {
  await clearFirestore()
})

afterAll(async () => {
  await teardownTestEnvironment()
})

describe('saveProgress', () => {
  it('creates a new progress record', async () => {
    await saveProgress(UID, progressData)
    const progress = await getProgress(UID, 'book123')
    expect(progress).not.toBeNull()
    expect(progress?.bookId).toBe('book123')
  })

  it('overwrites existing progress (upsert)', async () => {
    await saveProgress(UID, progressData)
    await saveProgress(UID, { ...progressData, scrollPosition: 90, lastChapterOrder: 5 })
    const progress = await getProgress(UID, 'book123')
    expect(progress?.scrollPosition).toBe(90)
    expect(progress?.lastChapterOrder).toBe(5)
  })

  it('sets updatedAt timestamp on save', async () => {
    await saveProgress(UID, progressData)
    const progress = await getProgress(UID, 'book123')
    expect(progress?.updatedAt).toBeDefined()
  })

  it('uses bookId as the document ID (one record per book per user)', async () => {
    await saveProgress(UID, { ...progressData, bookId: 'book1' })
    await saveProgress(UID, { ...progressData, bookId: 'book2' })
    const all = await getAllProgress(UID)
    expect(all.length).toBe(2)
  })
})

describe('getProgress', () => {
  it('returns null for a book with no saved progress', async () => {
    const result = await getProgress(UID, 'nonexistent-book')
    expect(result).toBeNull()
  })

  it('returns the correct progress for a specific book', async () => {
    await saveProgress(UID, { ...progressData, bookId: 'book1', scrollPosition: 20 })
    await saveProgress(UID, { ...progressData, bookId: 'book2', scrollPosition: 80 })
    const progress = await getProgress(UID, 'book1')
    expect(progress?.scrollPosition).toBe(20)
  })
})

describe('getAllProgress', () => {
  it('returns empty array when no progress exists', async () => {
    const all = await getAllProgress(UID)
    expect(all).toEqual([])
  })

  it('returns all progress records for the user', async () => {
    await saveProgress(UID, { ...progressData, bookId: 'book1' })
    await saveProgress(UID, { ...progressData, bookId: 'book2' })
    const all = await getAllProgress(UID)
    expect(all.length).toBe(2)
  })
})
