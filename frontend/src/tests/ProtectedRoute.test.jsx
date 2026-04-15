import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import ProtectedRoute from '../components/ProtectedRoute'
import { useAuth } from '../context/AuthContext'

// Mock useAuth
vi.mock('../context/AuthContext', async () => {
  const actual = await vi.importActual('../context/AuthContext')
  return {
    ...actual,
    useAuth: vi.fn()
  }
})

// Mock Navigate from react-router-dom
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    Navigate: vi.fn(({ to }) => {
      mockNavigate(to)
      return null
    })
  }
})

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should show loading spinner when loading', () => {
    vi.mocked(useAuth).mockReturnValue({ loading: true, user: null, isAuthenticated: false })

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    )

    const spinner = screen.getByRole('status')
    expect(spinner).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('should redirect to login when user is not authenticated', () => {
    vi.mocked(useAuth).mockReturnValue({ loading: false, user: null, isAuthenticated: false })

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    )

    expect(mockNavigate).toHaveBeenCalledWith('/login')
  })

  it('should render children when user is authenticated', () => {
    vi.mocked(useAuth).mockReturnValue({
      loading: false,
      user: { id: 1, name: 'Test User', role: 'USER' },
      isAuthenticated: true
    })

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    )

    expect(screen.getByTestId('protected-content')).toBeInTheDocument()
  })

  it('should redirect to home when requireAdmin is true and user is not admin', () => {
    vi.mocked(useAuth).mockReturnValue({
      loading: false,
      user: { id: 1, name: 'Test User', role: 'USER' },
      isAuthenticated: true
    })

    render(
      <MemoryRouter>
        <ProtectedRoute requireAdmin={true}>
          <div>Admin Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    )

    expect(mockNavigate).toHaveBeenCalledWith('/')
  })

  it('should render children when user is admin and requireAdmin is true', () => {
    vi.mocked(useAuth).mockReturnValue({
      loading: false,
      user: { id: 1, name: 'Test User', role: 'ADMIN' },
      isAuthenticated: true
    })

    render(
      <MemoryRouter>
        <ProtectedRoute requireAdmin={true}>
          <div data-testid="admin-content">Admin Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    )

    expect(screen.getByTestId('admin-content')).toBeInTheDocument()
  })
})
