// SRP : Page gère uniquement l'affichage des détails
import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { hebergementService } from '../services/hebergement.service'
import { useHebergementDetail } from '../hooks/useHebergementDetail'
import { useAuth } from '../context/AuthContext'
import { favoriteService } from '../services/favorite.service'
import LocationSection from '../components/hebergement/LocationSection'
import CapacitySection from '../components/hebergement/CapacitySection'
import AmenitiesSection from '../components/hebergement/AmenitiesSection'
import ContactSection from '../components/hebergement/ContactSection'
import MetadataSection from '../components/hebergement/MetadataSection'

const AccommodationPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const { hebergement, loading, error } = useHebergementDetail(id)
  const [isFavorite, setIsFavorite] = useState(false)
  const [favoriteLoading, setFavoriteLoading] = useState(false)

  useEffect(() => {
    if (isAuthenticated && hebergement) {
      checkFavorite()
    }
  }, [isAuthenticated, hebergement])

  async function checkFavorite() {
    try {
      const status = await favoriteService.check(hebergement._id)
      setIsFavorite(status)
    } catch (err) {
      console.error('Erreur lors de la vérification du favori:', err)
    }
  }

  async function toggleFavorite() {
    if (!isAuthenticated) {
      alert('Veuillez vous connecter pour ajouter des favoris')
      return
    }

    setFavoriteLoading(true)
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
      setFavoriteLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  
  if (error || !hebergement) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            {error || 'Hébergement non trouvé'}
          </h2>
          <Link to="/" className="text-primary hover:underline">
            ← Retour aux résultats
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/" className="text-primary hover:underline mb-4 inline-block">
        ← Retour aux résultats
      </Link>

      <div className="flex items-start justify-between mb-2">
        <h1 className="text-3xl font-bold">{hebergement.nom}</h1>
        {isAuthenticated && (
          <button
            onClick={toggleFavorite}
            disabled={favoriteLoading}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold transition disabled:opacity-50 ${
              isFavorite
                ? 'bg-red-100 text-red-600 hover:bg-red-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <svg
              className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`}
              fill={isFavorite ? 'currentColor' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            {isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          </button>
        )}
      </div>
      <div className="flex items-center gap-2 text-gray-600 mb-6">
        <span className="bg-gray-100 px-3 py-1 rounded-full text-sm font-semibold">
          {hebergement.type}
        </span>
        {hebergement.classification && (
          <span className="text-yellow-500">
            {'★'.repeat(hebergement.classification)}
          </span>
        )}
        <span>•</span>
        <span>{hebergement.localisation.commune}, {hebergement.localisation.region}</span>
      </div>

      <div className="aspect-video bg-gray-200 rounded-xl mb-8 flex items-center justify-center ">
        <img src={hebergement.image_cover} alt={hebergement.image_cover}  className='h-full w-full rounded-xl' />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <LocationSection location={hebergement.localisation} />
          <CapacitySection capacity={hebergement.capacite} />
          <AmenitiesSection amenities={hebergement.equipements} />
        </div>
        <div className="lg:col-span-1">
          <ContactSection contact={hebergement.contact} />
        </div>
      </div>

      <MetadataSection metadata={hebergement.metadata} />
    </div>
  )
}

export default AccommodationPage
