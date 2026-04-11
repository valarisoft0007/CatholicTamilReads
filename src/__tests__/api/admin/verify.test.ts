import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('jose', () => ({
  jwtVerify: vi.fn(),
  SignJWT: vi.fn(),
}))

import { jwtVerify } from 'jose'

async function getRoute() {
  // Re-import to pick up fresh mocks
  return await import('@/app/api/admin/verify/route')
}

function makeRequest(cookie?: string) {
  const headers: Record<string, string> = {}
  if (cookie) headers['Cookie'] = cookie
  return new NextRequest('http://localhost/api/admin/verify', { headers })
}

describe('GET /api/admin/verify', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.ADMIN_JWT_SECRET = 'test-secret'
  })

  it('returns 200 authenticated=true for a valid JWT', async () => {
    vi.mocked(jwtVerify).mockResolvedValueOnce({ payload: { role: 'admin' }, protectedHeader: { alg: 'HS256' } } as never)
    const { GET } = await getRoute()
    const req = makeRequest('admin_session=valid-token')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.authenticated).toBe(true)
  })

  it('returns 401 authenticated=false when no cookie', async () => {
    const { GET } = await getRoute()
    const req = makeRequest()
    const res = await GET(req)
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.authenticated).toBe(false)
  })

  it('returns 401 authenticated=false when JWT verification fails', async () => {
    vi.mocked(jwtVerify).mockRejectedValueOnce(new Error('invalid token'))
    const { GET } = await getRoute()
    const req = makeRequest('admin_session=bad-token')
    const res = await GET(req)
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.authenticated).toBe(false)
  })
})
