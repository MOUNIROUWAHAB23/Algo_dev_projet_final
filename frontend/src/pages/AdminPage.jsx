import { useState, useEffect } from 'react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Database, RefreshCw, TrendingUp } from 'lucide-react'

export default function AdminPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [importHistory, setImportHistory] = useState([])

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/stats')
        const data = await response.json()
        setStats(data)
      } catch (error) {
        console.error('Erreur:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const triggerImport = async () => {
    try {
      await fetch('/api/admin/import', { method: 'POST' })
      alert('Import lancé avec succès')
    } catch (error) {
      alert('Erreur lors de l\'import: ' + error.message)
    }
  }

  if (loading) {
    return <div className="container mx-auto px-4 py-12 text-center">Chargement...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Administration</h1>
        <button
          onClick={triggerImport}
          className="flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition"
        >
          <RefreshCw className="w-5 h-5" />
          Lancer l'import des données
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-4">
            <div className="bg-primary-100 p-3 rounded-lg">
              <Database className="w-8 h-8 text-primary-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats?.total || 0}</div>
              <div className="text-gray-600">Total hébergements</div>
            </div>
          </div>
        </div>

        {stats?.byType && Object.entries(stats.byType).map(([type, count]) => (
          <div key={type} className="bg-white rounded-lg shadow p-6">
            <div className="text-lg font-semibold mb-2">{type}</div>
            <div className="text-3xl font-bold text-primary-600">{count}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Répartition par type
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats?.byType ? Object.entries(stats.byType).map(([name, value]) => ({ name, value })) : []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Imports récents</h2>
          {importHistory.length === 0 ? (
            <p className="text-gray-500">Aucun historique disponible</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Date</th>
                  <th>Enregistrements</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {importHistory.map((imp, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="py-2">{new Date(imp.date).toLocaleDateString('fr-FR')}</td>
                    <td className="text-center">{imp.count}</td>
                    <td className="text-center">
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-sm">
                        {imp.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">État du système</h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b">
            <span>Backend API</span>
            <span className="text-green-600">● En ligne</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span>MongoDB</span>
            <span className="text-green-600">● Connecté</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span>Airflow Scheduler</span>
            <span className="text-green-600">● Actif</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span>Dernière synchronisation</span>
            <span className="text-gray-600">{stats?.lastSync ? new Date(stats.lastSync).toLocaleString('fr-FR') : 'Jamais'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
