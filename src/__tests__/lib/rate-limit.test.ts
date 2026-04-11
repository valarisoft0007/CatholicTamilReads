import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createRateLimiter } from '@/lib/rate-limit'

describe('createRateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('allows first request from a new IP', () => {
    const check = createRateLimiter(5, 60000)
    expect(check('1.2.3.4')).toBe(true)
  })

  it('allows up to maxRequests requests within the window', () => {
    const check = createRateLimiter(3, 60000)
    expect(check('1.2.3.4')).toBe(true)
    expect(check('1.2.3.4')).toBe(true)
    expect(check('1.2.3.4')).toBe(true)
  })

  it('blocks the request after maxRequests is exceeded', () => {
    const check = createRateLimiter(3, 60000)
    check('1.2.3.4')
    check('1.2.3.4')
    check('1.2.3.4')
    expect(check('1.2.3.4')).toBe(false)
  })

  it('tracks different IPs independently', () => {
    const check = createRateLimiter(1, 60000)
    expect(check('1.1.1.1')).toBe(true)
    expect(check('2.2.2.2')).toBe(true)
    expect(check('1.1.1.1')).toBe(false)
    expect(check('2.2.2.2')).toBe(false)
  })

  it('resets counter after window expires', () => {
    const check = createRateLimiter(2, 60000)
    check('1.2.3.4')
    check('1.2.3.4')
    expect(check('1.2.3.4')).toBe(false)

    // Advance time past window
    vi.advanceTimersByTime(60001)

    expect(check('1.2.3.4')).toBe(true)
  })

  it('does not reset counter before window expires', () => {
    const check = createRateLimiter(2, 60000)
    check('1.2.3.4')
    check('1.2.3.4')

    vi.advanceTimersByTime(59999)

    expect(check('1.2.3.4')).toBe(false)
  })

  it('maxRequests=1 allows exactly one request per window', () => {
    const check = createRateLimiter(1, 60000)
    expect(check('1.2.3.4')).toBe(true)
    expect(check('1.2.3.4')).toBe(false)

    vi.advanceTimersByTime(60001)

    expect(check('1.2.3.4')).toBe(true)
  })

  it('allows requests from new IP even when another IP is blocked', () => {
    const check = createRateLimiter(1, 60000)
    check('blocked-ip')
    expect(check('blocked-ip')).toBe(false)
    expect(check('new-ip')).toBe(true)
  })
})
