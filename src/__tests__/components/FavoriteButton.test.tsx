// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'

// ── Mocks ────────────────────────────────────────────────────────────────────

let mockUser: { uid: string } | null = { uid: 'user-123' }

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: mockUser }),
}))

const mockIsFavorited = vi.fn()
const mockAddFavorite = vi.fn()
const mockRemoveFavorite = vi.fn()

vi.mock('@/lib/firestore/bookmarks', () => ({
  isFavorited: (...args: unknown[]) => mockIsFavorited(...args),
  addFavorite: (...args: unknown[]) => mockAddFavorite(...args),
  removeFavorite: (...args: unknown[]) => mockRemoveFavorite(...args),
}))

vi.mock('@/components/ui/Tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

import { FavoriteButton } from '@/components/books/FavoriteButton'

// ── Helpers ───────────────────────────────────────────────────────────────────

const PROPS = { bookId: 'book-1', bookTitle: 'My Book', coverImageUrl: 'https://img.example.com/cover.jpg' }

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('FavoriteButton', () => {
  beforeEach(() => {
    mockUser = { uid: 'user-123' }
    mockIsFavorited.mockResolvedValue(false)
    mockAddFavorite.mockResolvedValue(undefined)
    mockRemoveFavorite.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  // ── Visibility ──────────────────────────────────────────────────────────────
  describe('visibility', () => {
    it('renders null when user is not signed in', () => {
      mockUser = null
      const { container } = render(<FavoriteButton {...PROPS} />)
      expect(container).toBeEmptyDOMElement()
    })

    it('renders a button when user is signed in', async () => {
      render(<FavoriteButton {...PROPS} />)
      await waitFor(() => expect(screen.getByRole('button')).toBeInTheDocument())
    })
  })

  // ── Initial state ───────────────────────────────────────────────────────────
  describe('initial state', () => {
    it('calls isFavorited with the correct uid and bookId', async () => {
      render(<FavoriteButton {...PROPS} />)
      await waitFor(() => expect(mockIsFavorited).toHaveBeenCalledWith('user-123', 'book-1'))
    })

    it('shows "Favorite" when book is not favorited', async () => {
      mockIsFavorited.mockResolvedValue(false)
      render(<FavoriteButton {...PROPS} />)
      await waitFor(() => expect(screen.getByRole('button')).toHaveTextContent('Favorite'))
    })

    it('shows "Favorited" when book is already favorited', async () => {
      mockIsFavorited.mockResolvedValue(true)
      render(<FavoriteButton {...PROPS} />)
      await waitFor(() => expect(screen.getByRole('button')).toHaveTextContent('Favorited'))
    })

    it('has filled heart icon when already favorited', async () => {
      mockIsFavorited.mockResolvedValue(true)
      render(<FavoriteButton {...PROPS} />)
      await waitFor(() => {
        const svg = screen.getByRole('button').querySelector('svg')
        expect(svg?.getAttribute('fill')).toBe('currentColor')
      })
    })

    it('has outline heart icon when not favorited', async () => {
      mockIsFavorited.mockResolvedValue(false)
      render(<FavoriteButton {...PROPS} />)
      await waitFor(() => {
        const svg = screen.getByRole('button').querySelector('svg')
        expect(svg?.getAttribute('fill')).toBe('none')
      })
    })
  })

  // ── aria-label ──────────────────────────────────────────────────────────────
  describe('aria-label', () => {
    it('has "Add to favorites" label when not favorited', async () => {
      mockIsFavorited.mockResolvedValue(false)
      render(<FavoriteButton {...PROPS} />)
      await waitFor(() =>
        expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Add to favorites')
      )
    })

    it('has "Remove from favorites" label when favorited', async () => {
      mockIsFavorited.mockResolvedValue(true)
      render(<FavoriteButton {...PROPS} />)
      await waitFor(() =>
        expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Remove from favorites')
      )
    })
  })

  // ── Toggle — add ────────────────────────────────────────────────────────────
  describe('adding a favorite', () => {
    it('calls addFavorite with correct data when clicking an unfavorited book', async () => {
      mockIsFavorited.mockResolvedValue(false)
      render(<FavoriteButton {...PROPS} />)
      await waitFor(() => screen.getByRole('button'))

      await act(async () => {
        fireEvent.click(screen.getByRole('button'))
      })

      expect(mockAddFavorite).toHaveBeenCalledWith('user-123', {
        bookId: 'book-1',
        bookTitle: 'My Book',
        coverImageUrl: 'https://img.example.com/cover.jpg',
      })
    })

    it('optimistically shows "Favorited" immediately after click', async () => {
      mockIsFavorited.mockResolvedValue(false)
      mockAddFavorite.mockResolvedValue(undefined)
      render(<FavoriteButton {...PROPS} />)
      await waitFor(() => screen.getByRole('button'))

      fireEvent.click(screen.getByRole('button'))
      expect(screen.getByRole('button')).toHaveTextContent('Favorited')
    })
  })

  // ── Toggle — remove ─────────────────────────────────────────────────────────
  describe('removing a favorite', () => {
    it('calls removeFavorite with correct args when clicking a favorited book', async () => {
      mockIsFavorited.mockResolvedValue(true)
      render(<FavoriteButton {...PROPS} />)
      await waitFor(() => screen.getByRole('button'))

      await act(async () => {
        fireEvent.click(screen.getByRole('button'))
      })

      expect(mockRemoveFavorite).toHaveBeenCalledWith('user-123', 'book-1')
    })

    it('optimistically shows "Favorite" immediately after click', async () => {
      mockIsFavorited.mockResolvedValue(true)
      render(<FavoriteButton {...PROPS} />)
      await waitFor(() => screen.getByRole('button'))

      fireEvent.click(screen.getByRole('button'))
      expect(screen.getByRole('button')).toHaveTextContent('Favorite')
    })
  })

  // ── Error handling ──────────────────────────────────────────────────────────
  describe('error handling', () => {
    it('reverts to unfavorited if addFavorite throws', async () => {
      mockIsFavorited.mockResolvedValue(false)
      mockAddFavorite.mockRejectedValue(new Error('Network error'))
      render(<FavoriteButton {...PROPS} />)
      await waitFor(() => screen.getByRole('button'))

      await act(async () => {
        fireEvent.click(screen.getByRole('button'))
      })

      expect(screen.getByRole('button')).toHaveTextContent('Favorite')
    })

    it('reverts to favorited if removeFavorite throws', async () => {
      mockIsFavorited.mockResolvedValue(true)
      mockRemoveFavorite.mockRejectedValue(new Error('Network error'))
      render(<FavoriteButton {...PROPS} />)
      await waitFor(() => screen.getByRole('button'))

      await act(async () => {
        fireEvent.click(screen.getByRole('button'))
      })

      expect(screen.getByRole('button')).toHaveTextContent('Favorited')
    })
  })

  // ── Missing coverImageUrl ───────────────────────────────────────────────────
  describe('coverImageUrl fallback', () => {
    it('passes empty string for coverImageUrl when not provided', async () => {
      mockIsFavorited.mockResolvedValue(false)
      render(<FavoriteButton bookId="book-1" bookTitle="My Book" />)
      await waitFor(() => screen.getByRole('button'))

      await act(async () => {
        fireEvent.click(screen.getByRole('button'))
      })

      expect(mockAddFavorite).toHaveBeenCalledWith('user-123', expect.objectContaining({
        coverImageUrl: '',
      }))
    })
  })
})
