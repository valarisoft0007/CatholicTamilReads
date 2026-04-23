import { describe, it, expect, vi } from 'vitest'

vi.mock('next/font/google', () => ({
  Inter: () => ({ variable: '--font-sans' }),
  Lora: () => ({ variable: '--font-serif' }),
}))

const { metadata } = await import('@/app/layout')

describe('layout metadata', () => {
  it('has the correct page title', () => {
    expect(metadata.title).toBe('Catholic Tamil Reads')
  })

  it('has a description', () => {
    expect(metadata.description).toBeTruthy()
  })

  it('declares the favicon icon path', () => {
    const icons = metadata.icons as { icon: string }
    expect(icons.icon).toBe('/icon.png')
  })
})
