import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, MapPin, Star } from 'lucide-react'

export default function HomePage() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('all')

  const accommodationTypes = [
    { id: 'all', label: 'Tous', icon: '🏠' },
    { id: 'HOTEL', label: 'Hôtels', icon: '🏨' },
    { id: 'CAMPING', label: 'Campings', icon: '⛺' },
    { id: 'RESIDENCE', label: 'Résidences', icon: '🏢' },
    { id: 'MEUBLE', label: 'Meublés', icon: '🏡' },
    { id: 'AUBERGE', label: 'Auberges', icon: '🏔️' },
    { id: 'VILLAGE_VACANCES', label: 'Villages', icon: '🏖️' }
  ]

  const handleSearch = (e) => {
    e.preventDefault()
    navigate(`/recherche?q=${encodeURIComponent(searchTerm)}&type=${selectedType}`)
  }

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4">
            Trouvez votre hébergement idéal en France
          </h1>
          <p className="text-xl mb-8 opacity-90">
            Plus de 45 000 hébergements touristiques référencés
          </p>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Ville, région, nom d'hébergement..."
                className="w-full pl-12 pr-4 py-4 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-white"
              />
            </div>
            <button
              type="submit"
              className="bg-white text-primary-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition"
            >
              Rechercher
            </button>
          </form>
        </div>
      </section>

      {/* Accommodation Types */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Types d'hébergements</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {accommodationTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => {
                  setSelectedType(type.id)
                  navigate(`/recherche?type=${type.id}`)
                }}
                className={`p-6 rounded-xl text-center transition ${
                  selectedType === type.id
                    ? 'bg-primary-600 text-white shadow-lg'
                    : 'bg-white hover:bg-gray-50 shadow'
                }`}
              >
                <div className="text-4xl mb-2">{type.icon}</div>
                <div className="font-medium">{type.label}</div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gray-100 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Quelques chiffres</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary-600 mb-2">45 000+</div>
              <div className="text-gray-600">Hébergements</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary-600 mb-2">6</div>
              <div className="text-gray-600">Types d'hébergements</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary-600 mb-2">100%</div>
              <div className="text-gray-600">Données ouvertes</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary-600 mb-2">GRATUIT</div>
              <div className="text-gray-600">Sans commission</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
