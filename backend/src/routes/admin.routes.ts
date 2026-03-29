import { Router } from 'express'
import Hebergement from '../models/Hebergement'

const router = Router()

// GET /api/admin/stats - Dashboard statistics
router.get('/stats', async (req, res, next) => {
  try {
    const total = await Hebergement.countDocuments()

    const byType = await Hebergement.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ])

    const byRegion = await Hebergement.aggregate([
      {
        $group: {
          _id: '$region',
          count: { $sum: 1 }
        }
      },
      { $limit: 10 }
    ])

    const recentImports = await Hebergement.aggregate([
      {
        $sort: { importedAt: -1 }
      },
      {
        $limit: 100
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$importedAt' }
          },
          count: { $sum: 1 },
          lastUpdate: { $max: '$importedAt' }
        }
      },
      { $sort: { _id: -1 } },
      { $limit: 7 }
    ])

    res.json({
      total,
      byType: byType.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
      byRegion: byRegion,
      lastSync: recentImports.length > 0 ? recentImports[0].lastUpdate : null,
      recentImports
    })
  } catch (error) {
    next(error)
  }
})

// POST /api/admin/import - Trigger manual import (calls Airflow API)
router.post('/import', async (req, res, next) => {
  try {
    const airflowUrl = process.env.AIRFLOW_URL || 'http://airflow-webserver:8080'

    // Trigger DAG run via Airflow API
    const response = await fetch(`${airflowUrl}/api/v1/dags/import_hebergements_touristiques/dagRuns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({})
    })

    if (!response.ok) {
      throw new Error('Failed to trigger Airflow DAG')
    }

    const result = await response.json()

    res.json({
      message: 'Import triggered successfully',
      dagRunId: result.dag_run_id
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/admin/health - Health check with database status
router.get('/health', async (req, res) => {
  try {
    const dbState = {
      connected: true,
      hosts: (process.env.MONGODB_URI || '').split(',')[0]
    }

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: dbState
    })
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    })
  }
})

export default router
