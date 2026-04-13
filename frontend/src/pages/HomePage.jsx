// SRP : HomePage gère uniquement l'orchestration de l'affichage
import { useEffect, useCallback, useState } from 'react'
import { useHebergements } from '../hooks/useHebergements'
import FilterPanel from '../components/hebergement/FilterPanel'
import AccommodationCard from '../components/hebergement/AccommodationCard'
import Pagination from '../components/hebergement/Pagination'

const INITIAL_FILTERS = {
  q: '',
  type: '',
  region: '',
  classification: '',
  page: 1,
  limit: 20
}

const HomePage = () => {
  const { hebergements, loading, error, fetchHebergements } = useHebergements()
  const [filters, setFilters] = useState(INITIAL_FILTERS)

  const handleFilterChange = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }))
  }, [])

  const applyFilters = useCallback(() => {
    fetchHebergements(filters)
  }, [filters, fetchHebergements])

  const clearFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS)
  }, [])

  const handlePageChange = useCallback((newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }))
  }, [])

  useEffect(() => {
    fetchHebergements(filters)
  }, [filters.page]) // OCP : On étend le comportement sans modifier la logique existante

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <FilterPanel
        filters={filters}
        onFilterChange={handleFilterChange}
        onApply={applyFilters}
        onClear={clearFilters}
      />

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="text-center py-12 text-gray-600">{error}</div>
      ) : (
        <>
          <div className="text-sm text-gray-600 mb-4">
            {hebergements.length} hébergement{hebergements.length > 1 ? 's' : ''} trouvé{hebergements.length > 1 ? 's' : ''}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {hebergements.map((hebergement) => (
              <AccommodationCard key={hebergement._id} hebergement={hebergement} />
            ))}
          </div>
          {hebergements.length > 0 && (
            <Pagination
              currentPage={filters.page}
              onPageChange={handlePageChange}
              hasPrevious={filters.page > 1}
              hasNext={hebergements.length === filters.limit}
            />
          )}
        </>
      )}
    </div>
  )
}

export default HomePage
