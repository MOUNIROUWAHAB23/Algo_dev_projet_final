import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const FavoritesPage = () => {
  const { user } = useAuth()
  const [favorites, setFavorites] = useState([])

  useEffect(() => {
    // Charger les favoris depuis le localStorage
    const storedFavorites = localStorage.getItem(`favorites_${user?.email}`)
    if (storedFavorites) {
      setFavorites(JSON.parse(storedFavorites))
    }
  }, [user])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">Mes favoris</h1>

      {favorites.length === 0 ? (
        <div className="text-center py-12">
          <svg className="w-24 h-24 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <p className="text-gray-600 text-lg">Vous n'avez pas encore de favoris</p>
          <Link to="/" className="text-primary hover:underline mt-2 inline-block">
            Découvrir les hébergements →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {favorites.map(fav => (
            <Link
              key={fav._id}
              to={`/hebergement/${fav._id}`}
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition"
            >
              <div className="aspect-square bg-gray-200 flex items-center justify-center">
                <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-lg truncate">{fav.nom}</h3>
                <p className="text-gray-600 text-sm mt-1">
                  {fav.localisation.commune}, {fav.localisation.region}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default FavoritesPage
