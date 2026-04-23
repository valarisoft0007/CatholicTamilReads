// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

const mockPush = vi.fn()
const mockScrollIntoView = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock('next/image', () => ({
  default: ({ src, alt, className, priority, fill, ...rest }: {
    src: string
    alt: string
    className?: string
    priority?: boolean
    fill?: boolean
    [key: string]: unknown
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} data-priority={priority} data-fill={fill} {...rest} />
  ),
}))

vi.mock('next/link', () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}))

let mockUser: { uid: string } | null = null

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: mockUser }),
}))

import { HeroSection } from '@/components/HeroSection'

describe('HeroSection', () => {
  beforeEach(() => {
    mockUser = null
    mockPush.mockClear()
    mockScrollIntoView.mockClear()
  })

  describe('background image', () => {
    it('renders the hero background image', () => {
      const { container } = render(<HeroSection />)
      const img = container.querySelector('img')
      expect(img).toHaveAttribute('src', '/images/ctrs_image_12.jpg')
    })

    it('background image has priority flag for LCP optimisation', () => {
      const { container } = render(<HeroSection />)
      const img = container.querySelector('img')
      expect(img).toHaveAttribute('data-priority', 'true')
    })

    it('background image is decorative (aria-hidden)', () => {
      const { container } = render(<HeroSection />)
      const img = container.querySelector('img')
      expect(img).toHaveAttribute('aria-hidden', 'true')
    })

    it('background image has empty alt text', () => {
      const { container } = render(<HeroSection />)
      const img = container.querySelector('img')
      expect(img?.getAttribute('alt')).toBe('')
    })
  })

  describe('text content', () => {
    it('renders the site title', () => {
      render(<HeroSection />)
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Catholic Tamil Reads')
    })

    it('renders the tagline', () => {
      render(<HeroSection />)
      expect(screen.getByText('Inspiring books, delivered chapter by chapter.')).toBeInTheDocument()
    })

    it('renders the Start Exploring button', () => {
      render(<HeroSection />)
      expect(screen.getByRole('button', { name: /start exploring/i })).toBeInTheDocument()
    })
  })

  describe('unauthenticated user', () => {
    it('shows the Create a free account link', () => {
      render(<HeroSection />)
      expect(screen.getByRole('link', { name: /create a free account/i })).toBeInTheDocument()
    })

    it('Create a free account link points to signin page', () => {
      render(<HeroSection />)
      const link = screen.getByRole('link', { name: /create a free account/i })
      expect(link).toHaveAttribute('href', '/auth/signin')
    })

    it('clicking Start Exploring redirects to signin with books redirect', () => {
      render(<HeroSection />)
      fireEvent.click(screen.getByRole('button', { name: /start exploring/i }))
      expect(mockPush).toHaveBeenCalledWith('/auth/signin?redirect=/#books')
    })
  })

  describe('authenticated user', () => {
    beforeEach(() => {
      mockUser = { uid: 'user-123' }
    })

    it('hides the Create a free account link', () => {
      render(<HeroSection />)
      expect(screen.queryByRole('link', { name: /create a free account/i })).not.toBeInTheDocument()
    })

    it('clicking Start Exploring scrolls to books section', () => {
      const booksEl = document.createElement('div')
      booksEl.id = 'books'
      booksEl.scrollIntoView = mockScrollIntoView
      document.body.appendChild(booksEl)

      render(<HeroSection />)
      fireEvent.click(screen.getByRole('button', { name: /start exploring/i }))
      expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' })

      document.body.removeChild(booksEl)
    })

    it('does not call router.push when authenticated', () => {
      render(<HeroSection />)
      fireEvent.click(screen.getByRole('button', { name: /start exploring/i }))
      expect(mockPush).not.toHaveBeenCalled()
    })
  })
})
