// SRP : Hook personnalisé pour la logique d'authentification
import { useState, useEffect, useCallback } from 'react'
import { authService } from '../services/auth.service'

export const useAuthLogic = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    if (token && userData) {
      setUser(JSON.parse(userData))
    }
    setLoading(false)
  }, [])

  const login = useCallback(async (email, password) => {
    const result = await authService.login(email, password)
    if (result.success) {
      localStorage.setItem('token', result.token)
      localStorage.setItem('user', JSON.stringify(result.user))
      setUser(result.user)
    }
    return result
  }, [])

  const register = useCallback(async (name, email, password) => {
    return await authService.register(name, email, password)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }, [])

  return {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user
  }
}
