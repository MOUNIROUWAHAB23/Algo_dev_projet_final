import { Router } from 'express'
import Hebergement from '../models/Hebergement'

const router = Router()

// GET /api/hebergements - Search with filters
router.get('/', async (req, res, next) => {
  try {
    const { q, type, region, departement, commune, minCapacity, page = 1, limit = 20 } = req.query

    const query: any = {}

    // Text search
    if (q) {
      query.$text = { $search: q as string }
    }

    // Type filter
    if (type && type !== 'all') {
      query.type = type
    }

    // Location filters
    if (region) query.region = new RegExp(region as string, 'i')
    if (departement) query.departement = new RegExp(departement as string, 'i')
    if (commune) query.commune = new RegExp(commune as string, 'i')

    // Capacity filter
    if (minCapacity) {
      query.capacite = { $gte: parseInt(minCapacity as string) }
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string)

    const [hebergements, total] = await Promise.all([
      Hebergement.find(query)
        .select('-__v')
        .limit(parseInt(limit as string))
        .skip(skip)
        .lean(),
      Hebergement.countDocuments(query)
    ])

    res.json({
      data: hebergements,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string))
      }
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/hebergements/near - Geospatial search
router.get('/near', async (req, res, next) => {
  try {
    const { lat, lon, radius = 5000 } = req.query

    if (!lat || !lon) {
      return res.status(400).json({ error: 'Latitude and longitude required' })
    }

    const hebergements = await Hebergement.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lon as string), parseFloat(lat as string)]
          },
          $maxDistance: parseInt(radius as string)
        }
      }
    })
    .limit(20)
    .lean()

    res.json(hebergements)
  } catch (error) {
    next(error)
  }
})

// GET /api/hebergements/:id - Get by ID
router.get('/:id', async (req, res, next) => {
  try {
    const hebergement = await Hebergement.findById(req.params.id).lean()

    if (!hebergement) {
      return res.status(404).json({ error: 'Hébergement non trouvé' })
    }

    res.json(hebergement)
  } catch (error) {
    next(error)
  }
})

// GET /api/hebergements/stats/by-type - Statistics by type
router.get('/stats/by-type', async (req, res, next) => {
  try {
    const stats = await Hebergement.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ])

    const result: any = {}
    stats.forEach(s => {
      result[s._id] = s.count
    })

    res.json(result)
  } catch (error) {
    next(error)
  }
})

// GET /api/hebergements/stats/by-region - Statistics by region
router.get('/stats/by-region', async (req, res, next) => {
  try {
    const stats = await Hebergement.aggregate([
      {
        $group: {
          _id: '$region',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 20
      }
    ])

    res.json(stats)
  } catch (error) {
    next(error)
  }
})

export default router
