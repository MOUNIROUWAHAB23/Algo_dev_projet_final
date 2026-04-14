// SRP : Ce service gère uniquement la logique métier de l'authentification
import api from '../api/axios'

export const authService = {
  async login(email, password) {
    const response = await api.post('/auth/sign-in', { email, password })
    if (response.data.code === '200') {
      return {
        success: true,
        token: response.data.data.token,
        user: response.data.data.user
      }
    }
    return { success: false, error: response.data.message }
  },

  async register(name, email, password) {
    const response = await api.post('/auth/sign-up', { name, email, password })
    if (response.data.code === '200') {
      return { success: true }
    }
    return { success: false, error: response.data.message }
  }
}
