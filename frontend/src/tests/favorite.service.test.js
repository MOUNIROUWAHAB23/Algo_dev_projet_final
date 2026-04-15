import { describe, it, expect, vi, beforeEach } from 'vitest'
import api from '../api/axios'
import { favoriteService } from '../services/favorite.service'

vi.mock('../api/axios')

describe('favoriteService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAll', () => {
    it('should return list of favorites on successful fetch', async () => {
      const mockData = {
        code: '200',
        data: [
          { id: 1, hebergementId: 10, name: 'Hotel Paris' },
          { id: 2, hebergementId: 20, name: 'Gite Lyon' }
        ]
      }
      api.get.mockResolvedValue({ data: mockData })

      const result = await favoriteService.getAll()

      expect(api.get).toHaveBeenCalledWith('/favorites/')
      expect(result).toEqual(mockData.data)
    })

    it('should return empty array on non-200 response', async () => {
      const mockData = { code: '500', data: null, message: 'Error' }
      api.get.mockResolvedValue({ data: mockData })

      const result = await favoriteService.getAll()

      expect(result).toEqual([])
    })
  })

  describe('add', () => {
    it('should add a favorite and return the created favorite', async () => {
      const mockData = {
        code: '201',
        data: { id: 1, hebergementId: 10, name: 'Hotel Paris' }
      }
      api.post.mockResolvedValue({ data: mockData })

      const result = await favoriteService.add(10)

      expect(api.post).toHaveBeenCalledWith('/favorites/', { hebergementId: 10 })
      expect(result).toEqual(mockData.data)
    })

    it('should return null on non-201 response', async () => {
      const mockData = { code: '400', data: null, message: 'Already in favorites' }
      api.post.mockResolvedValue({ data: mockData })

      const result = await favoriteService.add(10)

      expect(result).toBeNull()
    })
  })

  describe('remove', () => {
    it('should remove a favorite and return true on success', async () => {
      const mockData = { code: '200', data: { success: true } }
      api.delete.mockResolvedValue({ data: mockData })

      const result = await favoriteService.remove(10)

      expect(api.delete).toHaveBeenCalledWith('/favorites/10')
      expect(result).toBe(true)
    })

    it('should return false on non-200 response', async () => {
      const mockData = { code: '404', data: null, message: 'Favorite not found' }
      api.delete.mockResolvedValue({ data: mockData })

      const result = await favoriteService.remove(10)

      expect(result).toBe(false)
    })
  })

  describe('check', () => {
    it('should return true when hebergement is in favorites', async () => {
      const mockData = {
        code: '200',
        data: { isFavorite: true }
      }
      api.get.mockResolvedValue({ data: mockData })

      const result = await favoriteService.check(10)

      expect(api.get).toHaveBeenCalledWith('/favorites/check/10')
      expect(result).toBe(true)
    })

    it('should return false when hebergement is not in favorites', async () => {
      const mockData = {
        code: '200',
        data: { isFavorite: false }
      }
      api.get.mockResolvedValue({ data: mockData })

      const result = await favoriteService.check(10)

      expect(result).toBe(false)
    })

    it('should return false on non-200 response', async () => {
      const mockData = { code: '500', data: null, message: 'Error' }
      api.get.mockResolvedValue({ data: mockData })

      const result = await favoriteService.check(10)

      expect(result).toBe(false)
    })
  })
})
