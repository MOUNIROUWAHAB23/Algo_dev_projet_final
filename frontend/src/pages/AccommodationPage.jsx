// SRP : Page gère uniquement l'affichage des détails
import { useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { hebergementService } from '../services/hebergement.service'
import { useHebergementDetail } from '../hooks/useHebergementDetail'
import LocationSection from '../components/hebergement/LocationSection'
import CapacitySection from '../components/hebergement/CapacitySection'
import AmenitiesSection from '../components/hebergement/AmenitiesSection'
import ContactSection from '../components/hebergement/ContactSection'
import MetadataSection from '../components/hebergement/MetadataSection'

const AccommodationPage = () => {
  const { id } = useParams()
  const { hebergement, loading, error } = useHebergementDetail(id)

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

      <h1 className="text-3xl font-bold mb-2">{hebergement.nom}</h1>
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
