import { Link } from 'react-router-dom'
import { MapPin, Heart, Settings } from 'lucide-react'

export default function Header() {
  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2 text-xl font-bold text-primary-600">
            <MapPin className="w-8 h-8" />
            <span>Tourisme France</span>
          </Link>

          <nav className="flex items-center space-x-6">
            <Link to="/recherche" className="text-gray-600 hover:text-primary-600 transition">
              Rechercher
            </Link>
            <Link to="/favoris" className="flex items-center space-x-1 text-gray-600 hover:text-primary-600 transition">
              <Heart className="w-5 h-5" />
              <span>Favoris</span>
            </Link>
            <Link to="/admin" className="flex items-center space-x-1 text-gray-600 hover:text-primary-600 transition">
              <Settings className="w-5 h-5" />
              <span>Admin</span>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}
