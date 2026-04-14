// SRP : Hook dédié au chargement d'un hébergement par ID
import { useState, useEffect } from 'react'
import { hebergementService } from '../services/hebergement.service'

export const useHebergementDetail = (id) => {
  const [hebergement, setHebergement] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchHebergement = async () => {
      setLoading(true)
      try {
        const data = await hebergementService.findById(id)
        console.log(data)
        if (data) {
          setHebergement(data)
        } else {
          setError('Hébergement non trouvé')
        }
      } catch (err) {
        setError('Erreur lors du chargement')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchHebergement()
    }
  }, [id])

  return { hebergement, loading, error }
}
