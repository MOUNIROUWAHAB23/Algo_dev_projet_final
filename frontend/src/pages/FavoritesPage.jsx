import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, Trash2 } from 'lucide-react'

export default function FavoritesPage() {
  // TODO: Connect to backend API for favorites
  const [favorites, setFavorites] = useState([])

  const removeFavorite = (id) => {
    setFavorites(prev => prev.filter(f => f._id !== id))
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
        <Heart className="w-8 h-8 text-red-500 fill-current" />
        Mes favoris
      </h1>

      {favorites.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-600 mb-2">Aucun favori</h2>
          <p className="text-gray-500 mb-4">
            Explorez les hébergements et ajoutez-les à vos favoris
          </p>
          <Link
            to="/recherche"
            className="inline-block bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition"
          >
            Découvrir les hébergements
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((hebergement) => (
            <div key={hebergement._id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="h-48 bg-gray-200 flex items-center justify-center">
                <span className="text-6xl">
                  {hebergement.type === 'HOTEL' && '🏨'}
                  {hebergement.type === 'CAMPING' && '⛺'}
                  {hebergement.type === 'RESIDENCE' && '🏢'}
                  {hebergement.type === 'MEUBLE' && '🏡'}
                  {hebergement.type === 'AUBERGE' && '🏔️'}
                  {hebergement.type === 'VILLAGE_VACANCES' && '🏖️'}
                </span>
              </div>
              <div className="p-4">
                <Link to={`/hebergement/${hebergement._id}`} className="font-bold text-lg hover:text-primary-600">
                  {hebergement.nom}
                </Link>
                <p className="text-gray-600 text-sm mb-3">{hebergement.commune}</p>
                <button
                  onClick={() => removeFavorite(hebergement._id)}
                  className="flex items-center gap-2 text-red-600 hover:text-red-700 text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  Retirer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
