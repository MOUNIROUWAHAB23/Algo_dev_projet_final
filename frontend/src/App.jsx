import { Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import HomePage from './pages/HomePage'
import SearchPage from './pages/SearchPage'
import AccommodationPage from './pages/AccommodationPage'
import FavoritesPage from './pages/FavoritesPage'
import AdminPage from './pages/AdminPage'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/recherche" element={<SearchPage />} />
          <Route path="/hebergement/:id" element={<AccommodationPage />} />
          <Route path="/favoris" element={<FavoritesPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </main>
      <footer className="bg-gray-800 text-white py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2024 Tourisme France. Données ouvertes data.gouv.fr</p>
        </div>
      </footer>
    </div>
  )
}

export default App
