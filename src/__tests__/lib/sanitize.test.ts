import { describe, it, expect } from 'vitest'
import { sanitizeHtml } from '@/lib/sanitize'

describe('sanitizeHtml', () => {
  it('strips script tags', () => {
    const result = sanitizeHtml('<p>Hello</p><script>alert("xss")</script>')
    expect(result).not.toContain('<script>')
    expect(result).toContain('<p>Hello</p>')
  })

  it('strips onclick event handlers', () => {
    const result = sanitizeHtml('<button onclick="alert(1)">Click</button>')
    expect(result).not.toContain('onclick')
  })

  it('strips onerror event handlers', () => {
    const result = sanitizeHtml('<img src="x" onerror="alert(1)">')
    expect(result).not.toContain('onerror')
  })

  it('preserves bold tags', () => {
    const result = sanitizeHtml('<p><strong>bold</strong></p>')
    expect(result).toContain('<strong>bold</strong>')
  })

  it('preserves italic tags', () => {
    const result = sanitizeHtml('<p><em>italic</em></p>')
    expect(result).toContain('<em>italic</em>')
  })

  it('preserves paragraph tags', () => {
    const result = sanitizeHtml('<p>Hello world</p>')
    expect(result).toContain('<p>Hello world</p>')
  })

  it('returns empty string for empty input', () => {
    const result = sanitizeHtml('')
    expect(result).toBe('')
  })

  it('strips javascript: protocol in href', () => {
    const result = sanitizeHtml('<a href="javascript:alert(1)">link</a>')
    expect(result).not.toContain('javascript:')
  })

  it('preserves plain text content', () => {
    const result = sanitizeHtml('Hello world')
    expect(result).toContain('Hello world')
  })
})
