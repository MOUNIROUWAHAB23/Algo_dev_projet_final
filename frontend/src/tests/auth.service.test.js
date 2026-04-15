import { describe, it, expect, vi, beforeEach } from 'vitest'
import api from '../api/axios'
import { authService } from '../services/auth.service'

vi.mock('../api/axios')

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('login', () => {
    it('should return success with token and user on successful login', async () => {
      const mockUserData = {
        code: '200',
        data: {
          token: 'test-token',
          user: { id: 1, name: 'Test User', email: 'test@example.com' }
        }
      }
      api.post.mockResolvedValue({ data: mockUserData })

      const result = await authService.login('test@example.com', 'password123')

      expect(api.post).toHaveBeenCalledWith('/auth/sign-in', {
        email: 'test@example.com',
        password: 'password123'
      })
      expect(result).toEqual({
        success: true,
        token: 'test-token',
        user: { id: 1, name: 'Test User', email: 'test@example.com' }
      })
    })

    it('should return failure with error message on failed login', async () => {
      const mockErrorData = {
        code: '401',
        message: 'Invalid credentials'
      }
      api.post.mockResolvedValue({ data: mockErrorData })

      const result = await authService.login('test@example.com', 'wrongpassword')

      expect(result).toEqual({
        success: false,
        error: 'Invalid credentials'
      })
    })
  })

  describe('register', () => {
    it('should return success on successful registration', async () => {
      const mockUserData = {
        code: '200',
        data: {
          token: 'test-token',
          user: { id: 1, name: 'New User', email: 'new@example.com' }
        }
      }
      api.post.mockResolvedValue({ data: mockUserData })

      const result = await authService.register('New User', 'new@example.com', 'password123')

      expect(api.post).toHaveBeenCalledWith('/auth/sign-up', {
        name: 'New User',
        email: 'new@example.com',
        password: 'password123'
      })
      expect(result).toEqual({ success: true })
    })

    it('should return failure with error message on failed registration', async () => {
      const mockErrorData = {
        code: '400',
        message: 'Email already exists'
      }
      api.post.mockResolvedValue({ data: mockErrorData })

      const result = await authService.register('New User', 'existing@example.com', 'password123')

      expect(result).toEqual({
        success: false,
        error: 'Email already exists'
      })
    })
  })
})
