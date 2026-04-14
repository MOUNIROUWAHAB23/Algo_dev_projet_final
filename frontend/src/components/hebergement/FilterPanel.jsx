// SRP : Composant dédié au panneau de filtres
import { memo } from 'react'
import SearchBar from './SearchBar'
import FilterSelect from './FilterSelect'

const TYPES = ['HOTEL', 'CAMPING', 'RESIDENCE', 'AUBERGE', 'VILLAGE']
const REGIONS = [
  'Auvergne-Rhône-Alpes', 'Bourgogne-Franche-Comté', 'Bretagne',
  'Centre-Val de Loire', 'Corse', 'Grand Est', 'Hauts-de-France',
  'Île-de-France', 'Normandie', 'Nouvelle-Aquitaine', 'Occitanie',
  'Pays de la Loire', 'Provence-Alpes-Côte d\'Azur'
]

const FilterPanel = memo(({ filters, onFilterChange, onApply, onClear }) => {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-8">
      <h2 className="text-lg font-semibold mb-4">Rechercher un hébergement</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <SearchBar
          value={filters.q}
          onChange={(value) => onFilterChange('q', value)}
        />
        <FilterSelect
          label="Type"
          value={filters.type}
          onChange={(value) => onFilterChange('type', value)}
          options={TYPES.map((t) => ({ value: t, label: t }))}
          placeholder="Tous les types"
        />
        <FilterSelect
          label="Région"
          value={filters.region}
          onChange={(value) => onFilterChange('region', value)}
          options={REGIONS.map((r) => ({ value: r, label: r }))}
          placeholder="Toutes les régions"
        />
        <FilterSelect
          label="Classification"
          value={filters.classification}
          onChange={(value) => onFilterChange('classification', value)}
          options={[1, 2, 3, 4, 5].map((s) => ({
            value: s,
            label: `${s} étoile${s > 1 ? 's' : ''}`
          }))}
          placeholder="Toutes classifications"
        />
        <div className="flex items-end gap-2">
          <button
            onClick={onApply}
            className="flex-1 py-2 bg-primary text-white rounded-lg hover:bg-red-600 transition font-semibold"
          >
            Rechercher
          </button>
          <button
            onClick={onClear}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
          >
            Effacer
          </button>
        </div>
      </div>
    </div>
  )
})

export default FilterPanel
