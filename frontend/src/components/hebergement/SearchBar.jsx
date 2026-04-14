// SRP : Composant dédié à la barre de recherche
import { memo } from 'react'

const SearchBar = memo(({ value, onChange }) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Recherche
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Nom, ville, région..."
        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
      />
    </div>
  )
})

export default SearchBar
