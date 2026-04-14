// SRP : Composant dédié à l'affichage d'une carte d'hébergement
import { memo } from 'react'
import { Link } from 'react-router-dom'

const AccommodationCard = memo(({ hebergement }) => {
  return (
    <Link
      to={`/hebergement/${hebergement._id}`}
      className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition group"
    >
      <div className="aspect-square bg-gray-200 relative overflow-hidden">
        <div className="absolute inset-0  text-gray-400">
          <img src={hebergement.image_cover} alt={hebergement.image_cover}  className='h-full w-full' />
        </div>
        <div className="absolute top-3 right-3 bg-white px-2 py-1 rounded-full text-xs font-semibold">
          {hebergement.type}
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
  )
})

export default AccommodationCard
