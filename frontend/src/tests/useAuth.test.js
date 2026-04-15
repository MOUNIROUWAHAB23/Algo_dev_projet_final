import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useAuthLogic } from '../hooks/useAuth'
import { authService } from '../services/auth.service'

vi.mock('../services/auth.service')

describe('useAuthLogic', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('initialization', () => {
    it('should load user from localStorage on mount when token exists', () => {
      const mockUser = { id: 1, name: 'Test User', email: 'test@example.com' }
      localStorage.setItem('token', 'test-token')
      localStorage.setItem('user', JSON.stringify(mockUser))

      const { result } = renderHook(() => useAuthLogic())

      expect(result.current.loading).toBe(false)
      expect(result.current.user).toEqual(mockUser)
      expect(result.current.isAuthenticated).toBe(true)
    })

    it('should not load user when localStorage is empty', () => {
      const { result } = renderHook(() => useAuthLogic())

      expect(result.current.loading).toBe(false)
      expect(result.current.user).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
    })
  })

  describe('login', () => {
    it('should store token and user on successful login', async () => {
      const mockResult = {
        success: true,
        token: 'test-token',
        user: { id: 1, name: 'Test User', email: 'test@example.com' }
      }
      authService.login.mockResolvedValue(mockResult)

      const { result } = renderHook(() => useAuthLogic())

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.login('test@example.com', 'password123')
      })

      expect(localStorage.getItem('token')).toBe('test-token')
      expect(JSON.parse(localStorage.getItem('user'))).toEqual(mockResult.user)
      expect(result.current.user).toEqual(mockResult.user)
      expect(result.current.isAuthenticated).toBe(true)
    })

    it('should not store data on failed login', async () => {
      const mockResult = { success: false, error: 'Invalid credentials' }
      authService.login.mockResolvedValue(mockResult)

      const { result } = renderHook(() => useAuthLogic())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.login('test@example.com', 'wrongpassword')
      })

      expect(localStorage.getItem('token')).toBeNull()
      expect(localStorage.getItem('user')).toBeNull()
      expect(result.current.user).toBeNull()
    })
  })

  describe('register', () => {
    it('should call authService.register with correct parameters', async () => {
      const mockResult = { success: true }
      authService.register.mockResolvedValue(mockResult)

      const { result } = renderHook(() => useAuthLogic())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.register('Test User', 'test@example.com', 'password123')
      })

      expect(authService.register).toHaveBeenCalledWith('Test User', 'test@example.com', 'password123')
    })
  })

  describe('logout', () => {
    it('should clear localStorage and reset user state', async () => {
      // Pre-populate localStorage
      localStorage.setItem('token', 'test-token')
      localStorage.setItem('user', JSON.stringify({ id: 1, name: 'Test User' }))

      const { result } = renderHook(() => useAuthLogic())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        result.current.logout()
      })

      expect(localStorage.getItem('token')).toBeNull()
      expect(localStorage.getItem('user')).toBeNull()
      expect(result.current.user).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
    })
  })
})
