import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { Heart, Share2, Phone, Mail, Globe, Star, MapPin } from 'lucide-react'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

export default function AccommodationPage() {
  const { id } = useParams()
  const [hebergement, setHebergement] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isFavorite, setIsFavorite] = useState(false)

  useEffect(() => {
    const fetchHebergement = async () => {
      try {
        const response = await fetch(`/api/hebergements/${id}`)
        const data = await response.json()
        setHebergement(data)
      } catch (error) {
        console.error('Erreur:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchHebergement()
  }, [id])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
      </div>
    )
  }

  if (!hebergement) {
    return (
      <div className="container mx-auto px-4 py-12 text-center text-gray-600">
        Hébergement non trouvé
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">{hebergement.nom}</h1>
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="w-5 h-5" />
              <span>{hebergement.adresse}, {hebergement.codePostal} {hebergement.commune}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className={`p-2 rounded-lg ${isFavorite ? 'bg-red-100 text-red-600' : 'bg-gray-100'}`}
            >
              <Heart className={`w-6 h-6 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
            <button className="p-2 rounded-lg bg-gray-100">
              <Share2 className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex gap-4 flex-wrap">
          <span className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm">
            {hebergement.type}
          </span>
          {hebergement.classement && (
            <div className="flex items-center gap-1">
              {'⭐'.repeat(parseInt(hebergement.classement))}
            </div>
          )}
          {hebergement.capacite && (
            <span className="bg-gray-100 px-3 py-1 rounded-full text-sm">
              {hebergement.capacite} personnes
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Contact</h2>
            <div className="space-y-3">
              {hebergement.telephone && (
                <a href={`tel:${hebergement.telephone}`} className="flex items-center gap-3 text-gray-700 hover:text-primary-600">
                  <Phone className="w-5 h-5" />
                  {hebergement.telephone}
                </a>
              )}
              {hebergement.email && (
                <a href={`mailto:${hebergement.email}`} className="flex items-center gap-3 text-gray-700 hover:text-primary-600">
                  <Mail className="w-5 h-5" />
                  {hebergement.email}
                </a>
              )}
              {hebergement.url && (
                <a href={hebergement.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-gray-700 hover:text-primary-600">
                  <Globe className="w-5 h-5" />
                  Site web
                </a>
              )}
            </div>
          </div>

          {/* Map */}
          {hebergement.latitude && hebergement.longitude && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Localisation</h2>
              <MapContainer
                center={[hebergement.latitude, hebergement.longitude]}
                zoom={13}
                className="h-64 rounded-lg"
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[hebergement.latitude, hebergement.longitude]} />
              </MapContainer>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold mb-4">Informations</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm text-gray-500">Région</dt>
                <dd className="font-medium">{hebergement.region}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Département</dt>
                <dd className="font-medium">{hebergement.departement}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Source</dt>
                <dd className="font-medium">{hebergement.source}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}
