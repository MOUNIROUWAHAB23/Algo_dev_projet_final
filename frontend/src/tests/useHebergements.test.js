import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useHebergements } from '../hooks/useHebergements'
import { hebergementService } from '../services/hebergement.service'

vi.mock('../services/hebergement.service')

describe('useHebergements', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should start with loading false and empty hebergements', () => {
    const { result } = renderHook(() => useHebergements())

    expect(result.current.loading).toBe(false)
    expect(result.current.hebergements).toEqual([])
    expect(result.current.error).toBeNull()
  })

  it('should load hebergements when fetchHebergements is called', async () => {
    const mockHebergements = [
      { id: 1, name: 'Hotel Paris', type: 'hotel' },
      { id: 2, name: 'Gite Lyon', type: 'gite' }
    ]
    hebergementService.findAll.mockResolvedValue(mockHebergements)

    const { result } = renderHook(() => useHebergements())

    await act(async () => {
      await result.current.fetchHebergements()
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.hebergements).toEqual(mockHebergements)
    expect(result.current.error).toBeNull()
  })

  it('should set error on failed fetch', async () => {
    const mockError = new Error('Failed to fetch')
    hebergementService.findAll.mockRejectedValue(mockError)

    const { result } = renderHook(() => useHebergements())

    await act(async () => {
      await result.current.fetchHebergements()
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe('Erreur lors du chargement des hébergements')
    expect(result.current.hebergements).toEqual([])
  })

  it('should load hebergements with filters', async () => {
    const mockHebergements = [{ id: 1, name: 'Hotel Paris', type: 'hotel' }]
    hebergementService.findAll.mockResolvedValue(mockHebergements)

    const filters = { limit: 10, page: 1, type: 'hotel', region: 'Ile-de-France' }
    const { result } = renderHook(() => useHebergements())

    await act(async () => {
      await result.current.fetchHebergements(filters)
    })

    expect(hebergementService.findAll).toHaveBeenCalledWith(filters)
    expect(result.current.hebergements).toEqual(mockHebergements)
  })
})
