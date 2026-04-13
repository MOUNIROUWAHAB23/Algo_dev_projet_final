// SRP : Composant dédié à la pagination
import { memo } from 'react'

const Pagination = memo(({ currentPage, onPageChange, hasPrevious, hasNext }) => {
  return (
    <div className="flex justify-center gap-2 mt-8">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!hasPrevious}
        className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
      >
        ← Précédent
      </button>
      <span className="px-4 py-2">Page {currentPage}</span>
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!hasNext}
        className="px-4 py-2 border rounded-lg hover:bg-gray-100"
      >
        Suivant →
      </button>
    </div>
  )
})

export default Pagination
