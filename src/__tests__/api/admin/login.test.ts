import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock jose before importing the route
vi.mock('jose', () => {
  const mockSign = vi.fn().mockResolvedValue('mock-jwt-token')
  // SignJWT is used as `new SignJWT(...)` — must be a regular function, not arrow
  function MockSignJWT() {
    return {
      setProtectedHeader() { return this },
      setExpirationTime() { return this },
      setIssuedAt() { return this },
      sign: mockSign,
    }
  }
  return { SignJWT: MockSignJWT, jwtVerify: vi.fn() }
})

function makeRequest(body: unknown, ip = '10.0.0.1') {
  return new NextRequest('http://localhost/api/admin/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': ip,
    },
    body: JSON.stringify(body),
  })
}

describe('POST /api/admin/login', () => {
  beforeEach(() => {
    process.env.ADMIN_PASSWORD = 'correct-password'
    process.env.ADMIN_JWT_SECRET = 'test-secret'
  })

  it('returns 200 and sets cookie on correct password', async () => {
    // Use a unique IP per test to avoid internal rate-limit state bleed
    const { POST } = await import('@/app/api/admin/login/route')
    const req = makeRequest({ password: 'correct-password' }, '10.1.0.1')
    const res = await POST(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(res.headers.get('set-cookie')).toContain('admin_session')
  })

  it('returns 401 on wrong password', async () => {
    const { POST } = await import('@/app/api/admin/login/route')
    const req = makeRequest({ password: 'wrong-password' }, '10.1.0.2')
    const res = await POST(req)
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('Invalid password')
  })

  it('returns 400 on empty password', async () => {
    const { POST } = await import('@/app/api/admin/login/route')
    const req = makeRequest({ password: '' }, '10.1.0.3')
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 on missing body fields', async () => {
    const { POST } = await import('@/app/api/admin/login/route')
    const req = makeRequest({}, '10.1.0.4')
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 429 after 5 failed attempts from same IP', async () => {
    const { POST } = await import('@/app/api/admin/login/route')
    const ip = '10.1.0.99'
    // 5 failed attempts
    for (let i = 0; i < 5; i++) {
      await POST(makeRequest({ password: 'wrong' }, ip))
    }
    // 6th attempt should be rate limited
    const res = await POST(makeRequest({ password: 'wrong' }, ip))
    expect(res.status).toBe(429)
  })
})
