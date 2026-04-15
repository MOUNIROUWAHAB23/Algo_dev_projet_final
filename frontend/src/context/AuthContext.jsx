import { createContext, useContext } from 'react'
import { useAuthLogic } from '../hooks/useAuth'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

// DIP : AuthProvider dépend de l'abstraction useAuthLogic, pas de l'implémentation directe
export const AuthProvider = ({ children, value }) => {
  const auth = useAuthLogic()

  return (
    <AuthContext.Provider value={value || auth}>
      {children}
    </AuthContext.Provider>
  )
}
