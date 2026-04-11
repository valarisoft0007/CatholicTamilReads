import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest'
import { getTestDb, setupTestEnvironment, clearFirestore, teardownTestEnvironment } from './helpers'
import { addDoc, collection, Timestamp } from 'firebase/firestore'

vi.mock('@/lib/firebase/client', () => ({
  getClientDb: () => getTestDb(),
}))

import { getNewsItems } from '@/lib/firestore/news'

// Seed news with an explicit Timestamp so ordering is deterministic
async function seedNews(title: string, secondsOffset = 0) {
  const db = getTestDb()
  const createdAt = Timestamp.fromDate(new Date(2026, 0, 1, 0, 0, secondsOffset))
  return addDoc(collection(db, 'news'), {
    title,
    content: 'Content for ' + title,
    createdAt,
    updatedAt: createdAt,
  })
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

describe('getNewsItems', () => {
  it('returns empty array when no news exists', async () => {
    const items = await getNewsItems()
    expect(items).toEqual([])
  })

  it('returns news items with id and data fields', async () => {
    await seedNews('First News')
    const items = await getNewsItems()
    expect(items.length).toBe(1)
    expect(items[0]).toHaveProperty('id')
    expect(items[0].title).toBe('First News')
  })

  it('returns news ordered by createdAt descending (newest first)', async () => {
    // Use explicit timestamps (different seconds) to guarantee ordering
    await seedNews('Older News', 0)
    await seedNews('Newer News', 1)
    const items = await getNewsItems()
    expect(items[0].title).toBe('Newer News')
    expect(items[1].title).toBe('Older News')
  })

  it('returns all news items', async () => {
    await seedNews('News 1')
    await seedNews('News 2')
    await seedNews('News 3')
    const items = await getNewsItems()
    expect(items.length).toBe(3)
  })
})
