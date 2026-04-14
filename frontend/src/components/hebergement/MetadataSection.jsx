// SRP : Composant dédié à l'affichage des métadonnées
import { memo } from 'react'

const MetadataSection = memo(({ metadata }) => {
  if (!metadata) return null

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('fr-FR')
  }

  return (
    <div className="mt-8 bg-gray-100 rounded-xl p-6 text-sm text-gray-600">
      <div className="flex flex-wrap gap-4">
        <div>
          <span className="font-medium">Source:</span> {metadata.source}
        </div>
        <div>
          <span className="font-medium">Date de classement:</span>{' '}
          {formatDate(metadata.date_classement)}
        </div>
        <div>
          <span className="font-medium">Importé le:</span>{' '}
          {formatDate(metadata.imported_at)}
        </div>
      </div>
    </div>
  )
})

export default MetadataSection
