// SRP : Hook personnalisé pour la logique des hébergements
import { useState, useEffect, useCallback } from 'react'
import { hebergementService } from '../services/hebergement.service'

export const useHebergements = () => {
  const [hebergements, setHebergements] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchHebergements = useCallback(async (filters) => {
    setLoading(true)
    setError(null)
    try {
      const data = await hebergementService.findAll(filters)
      setHebergements(data)
    } catch (err) {
      setError('Erreur lors du chargement des hébergements')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  return { hebergements, loading, error, fetchHebergements, setHebergements, setError }
}
