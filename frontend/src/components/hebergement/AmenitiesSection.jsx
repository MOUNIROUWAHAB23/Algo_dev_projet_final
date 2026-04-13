// SRP : Composant dédié à l'affichage des équipements
import { memo } from 'react'

const AmenitiesSection = memo(({ amenities }) => {
  if (!amenities || amenities.length === 0) return null

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Équipements</h2>
      <ul className="grid grid-cols-2 gap-2">
        {amenities.map((equipement, index) => (
          <li key={index} className="flex items-center gap-2 text-gray-700">
            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            {typeof equipement === 'object' ? JSON.stringify(equipement) : equipement}
          </li>
        ))}
      </ul>
    </div>
  )
})

export default AmenitiesSection
