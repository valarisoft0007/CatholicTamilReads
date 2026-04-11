import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('jose', () => ({
  jwtVerify: vi.fn(),
}))

const mockListUsers = vi.fn()

vi.mock('@/lib/firebase/admin', () => ({
  adminAuth: { listUsers: mockListUsers },
  adminDb: {},
}))

import { jwtVerify } from 'jose'

function makeRequest(cookie?: string) {
  const headers: Record<string, string> = {}
  if (cookie) headers['Cookie'] = cookie
  return new NextRequest('http://localhost/api/admin/users', { method: 'GET', headers })
}

describe('GET /api/admin/users', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.ADMIN_JWT_SECRET = 'test-secret'
  })

  it('returns 401 when no cookie is present', async () => {
    const { GET } = await import('@/app/api/admin/users/route')
    const res = await GET(makeRequest())
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('Unauthorized')
  })

  it('returns 401 when JWT verification fails', async () => {
    vi.mocked(jwtVerify).mockRejectedValueOnce(new Error('invalid token'))
    const { GET } = await import('@/app/api/admin/users/route')
    const res = await GET(makeRequest('admin_session=bad-token'))
    expect(res.status).toBe(401)
  })

  it('returns 200 with total count for valid JWT', async () => {
    vi.mocked(jwtVerify).mockResolvedValueOnce({ payload: { role: 'admin' }, protectedHeader: { alg: 'HS256' } } as never)
    mockListUsers.mockResolvedValueOnce({ users: [{ uid: 'u1' }, { uid: 'u2' }, { uid: 'u3' }], pageToken: undefined })
    const { GET } = await import('@/app/api/admin/users/route')
    const res = await GET(makeRequest('admin_session=valid-token'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.total).toBe(3)
  })

  it('returns 0 when there are no registered users', async () => {
    vi.mocked(jwtVerify).mockResolvedValueOnce({ payload: { role: 'admin' }, protectedHeader: { alg: 'HS256' } } as never)
    mockListUsers.mockResolvedValueOnce({ users: [], pageToken: undefined })
    const { GET } = await import('@/app/api/admin/users/route')
    const res = await GET(makeRequest('admin_session=valid-token'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.total).toBe(0)
  })

  it('paginates through multiple pages and sums totals', async () => {
    vi.mocked(jwtVerify).mockResolvedValueOnce({ payload: { role: 'admin' }, protectedHeader: { alg: 'HS256' } } as never)
    // First page: 1000 users + pageToken
    mockListUsers.mockResolvedValueOnce({
      users: Array.from({ length: 1000 }, (_, i) => ({ uid: `u${i}` })),
      pageToken: 'page2-token',
    })
    // Second page: 42 users, no further pages
    mockListUsers.mockResolvedValueOnce({
      users: Array.from({ length: 42 }, (_, i) => ({ uid: `v${i}` })),
      pageToken: undefined,
    })
    const { GET } = await import('@/app/api/admin/users/route')
    const res = await GET(makeRequest('admin_session=valid-token'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.total).toBe(1042)
    expect(mockListUsers).toHaveBeenCalledTimes(2)
    expect(mockListUsers).toHaveBeenNthCalledWith(1, 1000, undefined)
    expect(mockListUsers).toHaveBeenNthCalledWith(2, 1000, 'page2-token')
  })
})
