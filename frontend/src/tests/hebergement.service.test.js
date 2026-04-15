import { describe, it, expect, vi, beforeEach } from 'vitest'
import api from '../api/axios'
import { hebergementService } from '../services/hebergement.service'

vi.mock('../api/axios')

describe('hebergementService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('findAll', () => {
    it('should return list of hebergements with default filters', async () => {
      const mockData = {
        code: '200',
        data: [
          { id: 1, name: 'Hotel Paris', type: 'hotel', region: 'Ile-de-France' },
          { id: 2, name: 'Gite Lyon', type: 'gite', region: 'Auvergne-Rhone-Alpes' }
        ]
      }
      api.get.mockResolvedValue({ data: mockData })

      const result = await hebergementService.findAll({ limit: 10, page: 1 })

      expect(api.get).toHaveBeenCalledWith(expect.stringContaining('/hebergement?'))
      expect(result).toEqual(mockData.data)
    })

    it('should include search query in params when provided', async () => {
      const mockData = { code: '200', data: [] }
      api.get.mockResolvedValue({ data: mockData })

      await hebergementService.findAll({ limit: 10, page: 1, q: 'paris' })

      const calledUrl = api.get.mock.calls[0][0]
      expect(calledUrl).toContain('q=paris')
    })

    it('should include type filter in params when provided', async () => {
      const mockData = { code: '200', data: [] }
      api.get.mockResolvedValue({ data: mockData })

      await hebergementService.findAll({ limit: 10, page: 1, type: 'hotel' })

      const calledUrl = api.get.mock.calls[0][0]
      expect(calledUrl).toContain('type=hotel')
    })

    it('should include region filter in params when provided', async () => {
      const mockData = { code: '200', data: [] }
      api.get.mockResolvedValue({ data: mockData })

      await hebergementService.findAll({ limit: 10, page: 1, region: 'Bretagne' })

      const calledUrl = api.get.mock.calls[0][0]
      expect(calledUrl).toContain('region=Bretagne')
    })

    it('should include classification filter in params when provided', async () => {
      const mockData = { code: '200', data: [] }
      api.get.mockResolvedValue({ data: mockData })

      await hebergementService.findAll({ limit: 10, page: 1, classification: '3' })

      const calledUrl = api.get.mock.calls[0][0]
      expect(calledUrl).toContain('classification=3')
    })

    it('should return empty array on non-200 response', async () => {
      const mockData = { code: '500', data: null, message: 'Server error' }
      api.get.mockResolvedValue({ data: mockData })

      const result = await hebergementService.findAll({ limit: 10, page: 1 })

      expect(result).toEqual([])
    })
  })

  describe('findById', () => {
    it('should return hebergement details on successful fetch', async () => {
      const mockData = {
        code: '200',
        data: { id: 1, name: 'Hotel Paris', type: 'hotel', region: 'Ile-de-France' }
      }
      api.get.mockResolvedValue({ data: mockData })

      const result = await hebergementService.findById(1)

      expect(api.get).toHaveBeenCalledWith('/hebergement/getById?id=1')
      expect(result).toEqual(mockData.data)
    })

    it('should return null on non-200 response', async () => {
      const mockData = { code: '404', data: null, message: 'Not found' }
      api.get.mockResolvedValue({ data: mockData })

      const result = await hebergementService.findById(999)

      expect(result).toBeNull()
    })
  })
})
