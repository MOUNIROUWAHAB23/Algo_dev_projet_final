import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { favoriteService } from '../services/favorite.service'

const FavoritesPage = () => {
  const { user } = useAuth()
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadFavorites()
  }, [])

  async function loadFavorites() {
    try {
      setLoading(true)
      const data = await favoriteService.getAll()
      setFavorites(data)
      setError(null)
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement des favoris')
    } finally {
      setLoading(false)
    }
  }

  async function removeFavorite(hebergementId) {
    try {
      await favoriteService.remove(hebergementId)
      setFavorites(favorites.filter(fav => fav.hebergement._id !== hebergementId))
    } catch (err) {
      console.error('Erreur lors de la suppression du favori:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      </div>
    )
  }

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
            <div key={fav._id} className="relative group">
              <Link
                to={`/hebergement/${fav.hebergement._id}`}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition block"
              >
                <div className="aspect-square bg-gray-200 relative overflow-hidden">
                  <img
                    src={fav.hebergement.image_cover}
                    alt={fav.hebergement.nom}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg truncate">{fav.hebergement.nom}</h3>
                  <p className="text-gray-600 text-sm mt-1">
                    {fav.hebergement.localisation.commune}, {fav.hebergement.localisation.region}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    Ajouté le {new Date(fav.addedAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </Link>
              <button
                onClick={() => removeFavorite(fav.hebergement._id)}
                className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-md hover:bg-red-50 transition"
                title="Retirer des favoris"
              >
                <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default FavoritesPage
