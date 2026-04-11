import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import { adminAuth } from '@/lib/firebase/admin'

// When no Admin credentials are configured (test env), admin.ts initialises
// Firebase with projectId "demo-project".  The Auth emulator stores users
// per project ID, so we clear that namespace between tests.
const AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST ?? '127.0.0.1:9099'
const ADMIN_PROJECT_ID = process.env.FIREBASE_ADMIN_PROJECT_ID ?? 'demo-project'

async function clearAuthEmulator() {
  await fetch(
    `http://${AUTH_EMULATOR_HOST}/emulator/v1/projects/${ADMIN_PROJECT_ID}/accounts`,
    { method: 'DELETE' }
  )
}

beforeEach(async () => {
  await clearAuthEmulator()
})

afterAll(async () => {
  await clearAuthEmulator()
})

describe('adminAuth.listUsers (Auth emulator)', () => {
  it('returns an empty list when no users exist', async () => {
    const result = await adminAuth.listUsers(1000)
    expect(result.users).toHaveLength(0)
    expect(result.pageToken).toBeUndefined()
  })

  it('lists users after they are created', async () => {
    await adminAuth.createUser({ email: 'alice@test.com', password: 'password123' })
    await adminAuth.createUser({ email: 'bob@test.com', password: 'password123' })

    const result = await adminAuth.listUsers(1000)

    expect(result.users).toHaveLength(2)
    const emails = result.users.map((u) => u.email)
    expect(emails).toContain('alice@test.com')
    expect(emails).toContain('bob@test.com')
  })

  it('respects maxResults and returns a pageToken when more users exist', async () => {
    await adminAuth.createUser({ email: 'u1@test.com', password: 'password123' })
    await adminAuth.createUser({ email: 'u2@test.com', password: 'password123' })
    await adminAuth.createUser({ email: 'u3@test.com', password: 'password123' })

    const result = await adminAuth.listUsers(2)

    expect(result.users).toHaveLength(2)
    expect(result.pageToken).toBeDefined()
  })

  it('paginates through all users using pageToken and counts correctly', async () => {
    await adminAuth.createUser({ email: 'p1@test.com', password: 'password123' })
    await adminAuth.createUser({ email: 'p2@test.com', password: 'password123' })
    await adminAuth.createUser({ email: 'p3@test.com', password: 'password123' })

    let total = 0
    let pageToken: string | undefined

    do {
      const result = await adminAuth.listUsers(2, pageToken)
      total += result.users.length
      pageToken = result.pageToken
    } while (pageToken)

    expect(total).toBe(3)
  })

  it('reflects user deletion — count decreases after delete', async () => {
    const user = await adminAuth.createUser({ email: 'todelete@test.com', password: 'password123' })
    await adminAuth.createUser({ email: 'tokeep@test.com', password: 'password123' })

    await adminAuth.deleteUser(user.uid)

    const result = await adminAuth.listUsers(1000)
    expect(result.users).toHaveLength(1)
    expect(result.users[0].email).toBe('tokeep@test.com')
  })
})
