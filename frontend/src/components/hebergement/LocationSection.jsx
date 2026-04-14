// SRP : Composant dédié à l'affichage de la localisation
import { memo } from 'react'

const LocationSection = memo(({ location }) => {
  if (!location) return null

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Localisation</h2>
      <div className="space-y-2 text-gray-700">
        <p><span className="font-medium">Adresse:</span> {location.adresse}</p>
        <p><span className="font-medium">Code postal:</span> {location.code_postal}</p>
        <p><span className="font-medium">Commune:</span> {location.commune}</p>
        <p><span className="font-medium">Département:</span> {location.departement}</p>
        <p><span className="font-medium">Région:</span> {location.region}</p>
      </div>
      {location.coordinates && (
        <div className="mt-4 text-sm text-gray-500">
          Coordonnées: {location.coordinates.coordinates[1]}, {location.coordinates.coordinates[0]}
        </div>
      )}
    </div>
  )
})

export default LocationSection
