// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('next/link', () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}))

import { Footer } from '@/components/layout/Footer'

describe('Footer', () => {
  describe('navigation links', () => {
    it('renders the Home link', () => {
      render(<Footer />)
      expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/')
    })

    it('renders the Browse Books link', () => {
      render(<Footer />)
      expect(screen.getByRole('link', { name: 'Browse Books' })).toHaveAttribute('href', '/#books')
    })

    it('renders the Contact link', () => {
      render(<Footer />)
      expect(screen.getByRole('link', { name: 'Contact' })).toBeInTheDocument()
    })

    it('Contact link points to the correct mailto address', () => {
      render(<Footer />)
      expect(screen.getByRole('link', { name: 'Contact' })).toHaveAttribute(
        'href',
        'mailto:catholictamilreads@gmail.com'
      )
    })
  })

  describe('copyright', () => {
    it('renders the copyright notice', () => {
      render(<Footer />)
      expect(screen.getByText(/Catholic Tamil Reads/)).toBeInTheDocument()
    })

    it('includes the current year in the copyright notice', () => {
      render(<Footer />)
      const year = new Date().getFullYear().toString()
      expect(screen.getByText(new RegExp(year))).toBeInTheDocument()
    })
  })

  describe('motto', () => {
    it('renders the Latin motto', () => {
      render(<Footer />)
      expect(screen.getByText('Ad Maiorem Dei Gloriam')).toBeInTheDocument()
    })
  })
})
