import { Router } from 'express'
import Disponibilite from '../models/Disponibilite'
import Hebergement from '../models/Hebergement'

const router = Router()

// GET /api/disponibilites - Search availability by date range and location
router.get('/', async (req, res, next) => {
  try {
    const { dateDebut, dateFin, lat, lon, radius, type } = req.query

    if (!dateDebut || !dateFin) {
      return res.status(400).json({ error: 'dateDebut et dateFin requis' })
    }

    const start = new Date(dateDebut as string)
    const end = new Date(dateFin as string)

    // Find available accommodations for the date range
    const query: any = {
      dateDebut: { $lte: end },
      dateFin: { $gte: start },
      disponible: true
    }

    const disponibilites = await Disponibilite.find(query)
      .populate('hebergement')
      .lean()

    // Filter by type if provided
    let results = disponibilites
    if (type) {
      results = disponibilites.filter(d =>
        d.hebergement && (d.hebergement as any).type === type
      )
    }

    // Filter by geolocation if provided
    if (lat && lon) {
      const radiusInRadians = (parseInt(radius as string) || 50000) / 6371000
      const userLat = parseFloat(lat as string)
      const userLon = parseFloat(lon as string)

      results = results.filter(d => {
        if (!d.hebergement || !(d.hebergement as any).latitude) return false
        const h = d.hebergement as any
        const dLat = (h.latitude - userLat) * Math.PI / 180
        const dLon = (h.longitude - userLon) * Math.PI / 180
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(userLat * Math.PI / 180) * Math.cos(h.latitude * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
        const distance = 6371000 * c
        return distance <= (parseInt(radius as string) || 50000)
      })
    }

    res.json(results.map(d => ({
      _id: d._id,
      hebergement: d.hebergement,
      dateDebut: d.dateDebut,
      dateFin: d.dateFin,
      prixParNuit: d.prixParNuit,
      disponible: d.disponible,
      typeDisponibilite: d.typeDisponibilite
    })))
  } catch (error) {
    next(error)
  }
})

// GET /api/disponibilites/:id - Get availability for specific accommodation
router.get('/:id', async (req, res, next) => {
  try {
    const disponibilites = await Disponibilite.find({
      hebergement: req.params.id
    })
    .sort({ dateDebut: 1 })
    .lean()

    res.json(disponibilites)
  } catch (error) {
    next(error)
  }
})

// POST /api/disponibilites - Create availability (for partners)
router.post('/', async (req, res, next) => {
  try {
    const { hebergementId, dateDebut, dateFin, prixParNuit, typeDisponibilite } = req.body

    // Verify hebergement exists
    const hebergement = await Hebergement.findById(hebergementId)
    if (!hebergement) {
      return res.status(404).json({ error: 'Hébergement non trouvé' })
    }

    const disponibilite = await Disponibilite.create({
      hebergement: hebergementId,
      dateDebut: new Date(dateDebut),
      dateFin: new Date(dateFin),
      prixParNuit,
      typeDisponibilite: typeDisponibilite || 'SUR_DEMANDE',
      disponible: true,
      source: 'MANUEL',
      dernieresMiseAJour: new Date()
    })

    res.status(201).json(disponibilite)
  } catch (error) {
    next(error)
  }
})

// PUT /api/disponibilites/:id - Update availability
router.put('/:id', async (req, res, next) => {
  try {
    const { disponible, prixParNuit, typeDisponibilite } = req.body

    const disponibilite = await Disponibilite.findByIdAndUpdate(
      req.params.id,
      {
        disponible,
        prixParNuit,
        typeDisponibilite,
        dernieresMiseAJour: new Date()
      },
      { new: true }
    )

    if (!disponibilite) {
      return res.status(404).json({ error: 'Disponibilité non trouvée' })
    }

    res.json(disponibilite)
  } catch (error) {
    next(error)
  }
})

// DELETE /api/disponibilites/:id - Delete availability
router.delete('/:id', async (req, res, next) => {
  try {
    const disponibilite = await Disponibilite.findByIdAndDelete(req.params.id)

    if (!disponibilite) {
      return res.status(404).json({ error: 'Disponibilité non trouvée' })
    }

    res.json({ message: 'Disponibilité supprimée' })
  } catch (error) {
    next(error)
  }
})

export default router
