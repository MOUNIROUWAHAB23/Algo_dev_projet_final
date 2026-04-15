// SRP : Composant dédié à l'affichage d'une carte d'hébergement
import { memo, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { favoriteService } from '../../services/favorite.service'

const AccommodationCard = memo(({ hebergement }) => {
  const { user, isAuthenticated } = useAuth()
  const [isFavorite, setIsFavorite] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      checkFavorite()
    }
  }, [hebergement._id, isAuthenticated])

  async function checkFavorite() {
    try {
      const status = await favoriteService.check(hebergement._id)
      setIsFavorite(status)
    } catch (err) {
      console.error('Erreur lors de la vérification du favori:', err)
    }
  }

  async function toggleFavorite(e) {
    e.preventDefault()
    e.stopPropagation()

    if (!isAuthenticated) {
      alert('Veuillez vous connecter pour ajouter des favoris')
      return
    }

    setLoading(true)
    try {
      if (isFavorite) {
        await favoriteService.remove(hebergement._id)
      } else {
        await favoriteService.add(hebergement._id)
      }
      setIsFavorite(!isFavorite)
    } catch (err) {
      console.error('Erreur lors de la modification du favori:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative">
      <Link
        to={`/hebergement/${hebergement._id}`}
        className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition group block"
      >
        <div className="aspect-square bg-gray-200 relative overflow-hidden">
          <img src={hebergement.image_cover} alt={hebergement.image_cover} className='h-full w-full object-cover' />
          <div className="absolute top-3 right-3 flex gap-2">
            <span className="bg-white px-2 py-1 rounded-full text-xs font-semibold">
              {hebergement.type}
            </span>
            <button
              onClick={toggleFavorite}
              disabled={loading}
              className="bg-white rounded-full p-2 shadow-md hover:bg-red-50 transition disabled:opacity-50"
              title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            >
              <svg
                className={`w-5 h-5 ${isFavorite ? 'text-red-500 fill-current' : 'text-gray-400'}`}
                fill={isFavorite ? 'currentColor' : 'none'}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-lg truncate">{hebergement.nom}</h3>
          <p className="text-gray-600 text-sm mt-1">
            {hebergement.localisation.commune}, {hebergement.localisation.region}
          </p>
          <div className="flex items-center gap-1 mt-2">
            <span className="text-sm text-gray-500">Classification:</span>
            <span className="text-yellow-500">
              {'★'.repeat(hebergement.classification || 0)}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              {hebergement.capacite.lits} lit{hebergement.capacite.lits > 1 ? 's' : ''}
            </span>
            <span className="text-primary font-semibold group-hover:underline">
              Voir détails
            </span>
          </div>
        </div>
      </Link>
    </div>
  )
})

export default AccommodationCard
