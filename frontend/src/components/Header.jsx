import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState } from 'react'

const Header = () => {
  const { user, logout, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [showMenu, setShowMenu] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
    setShowMenu(false)
  }

  return (
    <header className="bg-white border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <h1 className="text-2xl font-bold text-primary">airbnb clone</h1>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-4">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="flex items-center gap-2 border rounded-full p-2 pl-3 hover:shadow-md transition"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
                    {user?.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                </button>

                {showMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border py-2">
                    <Link
                      to="/favorites"
                      className="block px-4 py-2 hover:bg-gray-100"
                      onClick={() => setShowMenu(false)}
                    >
                      Favoris
                    </Link>
                    {user?.role === 'ADMIN' && (
                      <Link
                        to="/admin"
                        className="block px-4 py-2 hover:bg-gray-100"
                        onClick={() => setShowMenu(false)}
                      >
                        Administration
                      </Link>
                    )}
                    <hr className="my-2" />
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100"
                    >
                      Déconnexion
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 hover:bg-gray-100 rounded-full transition"
                >
                  Se connecter
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-primary text-white rounded-full hover:bg-red-600 transition"
                >
                  S'inscrire
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}

export default Header
