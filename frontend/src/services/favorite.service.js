// SRP : Ce service gère uniquement la logique métier des favoris
import api from '../api/axios'

export const favoriteService = {
  async getAll() {
    const response = await api.get('/favorites/')
    return response.data.code === '200' ? response.data.data : []
  },

  async add(hebergementId) {
    const response = await api.post('/favorites/', { hebergementId })
    return response.data.code === '201' ? response.data.data : null
  },

  async remove(hebergementId) {
    const response = await api.delete(`/favorites/${hebergementId}`)
    return response.data.code === '200'
  },

  async check(hebergementId) {
    const response = await api.get(`/favorites/check/${hebergementId}`)
    return response.data.code === '200' ? response.data.data.isFavorite : false
  }
}
