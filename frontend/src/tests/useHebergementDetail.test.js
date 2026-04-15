import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useHebergementDetail } from '../hooks/useHebergementDetail'
import { hebergementService } from '../services/hebergement.service'

vi.mock('../services/hebergement.service')

describe('useHebergementDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should not fetch when id is not provided', () => {
    renderHook(() => useHebergementDetail(null))

    expect(hebergementService.findById).not.toHaveBeenCalled()
  })

  it('should load hebergement detail when id is provided', async () => {
    const mockHebergement = {
      id: 1,
      name: 'Hotel Paris',
      type: 'hotel',
      region: 'Ile-de-France',
      price: 100
    }
    hebergementService.findById.mockResolvedValue(mockHebergement)

    const { result } = renderHook(() => useHebergementDetail(1))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(hebergementService.findById).toHaveBeenCalledWith(1)
    expect(result.current.hebergement).toEqual(mockHebergement)
    expect(result.current.error).toBeNull()
  })

  it('should set error when hebergement is not found', async () => {
    hebergementService.findById.mockResolvedValue(null)

    const { result } = renderHook(() => useHebergementDetail(999))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.hebergement).toBeNull()
    expect(result.current.error).toBe('Hébergement non trouvé')
  })

  it('should set error on fetch failure', async () => {
    hebergementService.findById.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useHebergementDetail(1))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.hebergement).toBeNull()
    expect(result.current.error).toBe('Erreur lors du chargement')
  })

  it('should refetch when id changes', async () => {
    const mockHebergement1 = { id: 1, name: 'Hotel Paris' }
    const mockHebergement2 = { id: 2, name: 'Gite Lyon' }

    hebergementService.findById.mockResolvedValueOnce(mockHebergement1)
    hebergementService.findById.mockResolvedValueOnce(mockHebergement2)

    const { result, rerender } = renderHook(({ id }) => useHebergementDetail(id), {
      initialProps: { id: 1 }
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.hebergement).toEqual(mockHebergement1)

    rerender({ id: 2 })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(hebergementService.findById).toHaveBeenCalledTimes(2)
    expect(result.current.hebergement).toEqual(mockHebergement2)
  })
})
