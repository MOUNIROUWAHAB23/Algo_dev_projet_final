import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { Search, Filter, List, Map as MapIcon, Star } from 'lucide-react'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix for default marker icon in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState('list') // 'list' or 'map'
  const [filters, setFilters] = useState({
    type: searchParams.get('type') || 'all',
    region: '',
    minCapacity: '',
    maxPrice: '',
    stars: ''
  })

  useEffect(() => {
    const search = async () => {
      setLoading(true)
      const query = searchParams.get('q') || ''
      const type = searchParams.get('type') || 'all'

      try {
        const response = await fetch(`/api/hebergements?q=${query}&type=${type}`)
        const data = await response.json()
        setResults(data)
      } catch (error) {
        console.error('Erreur recherche:', error)
      } finally {
        setLoading(false)
      }
    }
    search()
  }, [searchParams])

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Search Bar */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                onChange={(e) => setSearchParams({ q: e.target.value, type: filters.type })}
              />
            </div>
          </div>

          <select
            value={filters.type}
            onChange={(e) => {
              handleFilterChange('type', e.target.value)
              setSearchParams({ type: e.target.value })
            }}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">Tous les types</option>
            <option value="HOTEL">Hôtels</option>
            <option value="CAMPING">Campings</option>
            <option value="RESIDENCE">Résidences</option>
            <option value="MEUBLE">Meublés</option>
            <option value="AUBERGE">Auberges</option>
            <option value="VILLAGE_VACANCES">Villages vacances</option>
          </select>

          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-primary-600 text-white' : 'bg-gray-100'}`}
            >
              <List className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`p-2 rounded-lg ${viewMode === 'map' ? 'bg-primary-600 text-white' : 'bg-gray-100'}`}
            >
              <MapIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Recherche en cours...</p>
        </div>
      ) : viewMode === 'list' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((hebergement) => (
            <div key={hebergement._id} className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden">
              <div className="h-48 bg-gray-200 flex items-center justify-center">
                <span className="text-6xl">
                  {hebergement.type === 'HOTEL' && '🏨'}
                  {hebergement.type === 'CAMPING' && '⛺'}
                  {hebergement.type === 'RESIDENCE' && '🏢'}
                  {hebergement.type === 'MEUBLE' && '🏡'}
                  {hebergement.type === 'AUBERGE' && '🏔️'}
                  {hebergement.type === 'VILLAGE_VACANCES' && '🏖️'}
                </span>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-lg mb-1">{hebergement.nom}</h3>
                <p className="text-gray-600 text-sm mb-2">{hebergement.commune}, {hebergement.departement}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">{hebergement.type}</span>
                  {hebergement.classement && (
                    <div className="flex text-yellow-500">
                      {'⭐'.repeat(parseInt(hebergement.classement))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <MapContainer center={[46.603354, 1.888334]} zoom={6} className="h-[600px] rounded-lg">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          {results.filter(h => h.latitude && h.longitude).map((hebergement) => (
            <Marker
              key={hebergement._id}
              position={[hebergement.latitude, hebergement.longitude]}
            >
              <Popup>
                <strong>{hebergement.nom}</strong><br />
                {hebergement.commune}<br />
                {hebergement.type}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      )}

      {!loading && results.length === 0 && (
        <div className="text-center py-12 text-gray-600">
          <p>Aucun résultat trouvé</p>
        </div>
      )}
    </div>
  )
}
