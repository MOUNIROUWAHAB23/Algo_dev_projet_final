// SRP : Composant dédié à l'affichage de la capacité
import { memo } from 'react'

const CapacitySection = memo(({ capacity }) => {
  if (!capacity) return null

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Capacité</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-primary">{capacity.lits}</div>
          <div className="text-gray-600">Lit{capacity.lits > 1 ? 's' : ''}</div>
        </div>
        {capacity.chambres && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-primary">{capacity.chambres}</div>
            <div className="text-gray-600">Chambre{capacity.chambres > 1 ? 's' : ''}</div>
          </div>
        )}
      </div>
    </div>
  )
})

export default CapacitySection
