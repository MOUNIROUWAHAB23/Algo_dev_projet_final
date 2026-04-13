// SRP : Ce service gère uniquement la logique métier des hébergements
import api from '../api/axios'

export const hebergementService = {
  async findAll(filters) {
    const params = new URLSearchParams({
      limit: filters.limit.toString(),
      page: filters.page.toString()
    })

    if (filters.q) params.set('q', filters.q)
    if (filters.type) params.set('type', filters.type)
    if (filters.region) params.set('region', filters.region)
    if (filters.classification) params.set('classification', filters.classification)

    const response = await api.get(`/hebergement?${params.toString()}`)
    return response.data.code === '200' ? response.data.data : []
  },

  async findById(id) {
    const response = await api.get(`/hebergement/getById?id=${id}`)
    return response.data.code === '200' && response.data.data.length > 0
      ? response.data.data[0]
      : null
  }
}
