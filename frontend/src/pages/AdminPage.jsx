import { useAuth } from '../context/AuthContext'
import { Navigate } from 'react-router-dom'

const AdminPage = () => {
  const { user } = useAuth()

  if (user?.role !== 'ADMIN') {
    return <Navigate to="/" replace />
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">Administration</h1>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Tableau de bord</h2>
        <p className="text-gray-600">
          Bienvenue dans l'espace d'administration.
        </p>
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-500">Utilisateur connecté</div>
          <div className="font-medium">{user.name}</div>
          <div className="text-sm text-gray-500">{user.email}</div>
          <div className="inline-block mt-2 px-3 py-1 bg-primary text-white rounded-full text-xs font-semibold">
            {user.role}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminPage
