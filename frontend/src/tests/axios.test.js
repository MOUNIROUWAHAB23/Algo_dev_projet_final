import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'

vi.mock('axios', () => {
  const mockRequestUse = vi.fn()
  const mockInstance = {
    defaults: {
      baseURL: 'http://localhost:3400/api',
      headers: {
        common: {
          'Content-Type': 'application/json'
        }
      }
    },
    interceptors: {
      request: { use: mockRequestUse, eject: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn() }
    },
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn()
  }
  return {
    default: {
      create: vi.fn(() => mockInstance),
      ...mockInstance
    }
  }
})

// We need to import api after the mock is established
import api from '../api/axios'

describe('axios instance', () => {
  beforeEach(() => {
    localStorage.clear()
    // No clearAllMocks here as it would clear the interceptor registration
  })

  it('should create axios instance with correct baseURL and headers', () => {
    expect(api.defaults.baseURL).toBe('http://localhost:3400/api')
    expect(api.defaults.headers.common['Content-Type']).toBe('application/json')
  })

  it('should have interceptors configured', () => {
    expect(api.interceptors.request.use).toHaveBeenCalled()
  })

  it('should add Authorization header when token exists in localStorage', () => {
    localStorage.setItem('token', 'test-token-123')

    // Access the interceptor function through the mocked api
    const interceptorFn = vi.mocked(api.interceptors.request.use).mock.calls[0][0]
    const config = { headers: {} }
    
    const result = interceptorFn(config)

    expect(result.headers.Authorization).toBe('Bearer test-token-123')
  })

  it('should not add Authorization header when token does not exist', () => {
    localStorage.removeItem('token')

    const interceptorFn = vi.mocked(api.interceptors.request.use).mock.calls[0][0]
    const config = { headers: {} }
    
    const result = interceptorFn(config)

    expect(result.headers.Authorization).toBeUndefined()
  })
})
