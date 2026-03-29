# 📋 ASSIGNMENT - Chef de Projet + Fullstack Dev Backend

**Nom:** Vous (Godlight)
**Rôle:** Chef de Projet + Développeur Backend
**Durée Totale:** 58 heures (28.25h grille + 6h soutenance + 21.75h AVAIL-01 après)
**Dates:** 28 Mars - 6 Avril 2026
**Équipe:** 5 personnes (2 fullstack + 3 data analysts)

---

## 🎯 PRIORITÉS

### **PRIORITÉ 1 (P1): Critères Grille d'Évaluation (/20 points)**
- ❌ Scraping - Data Team (P1)
- ❌ Nettoyage - Data Team (P1)
- ❌ MongoDB - Data Team (P1)
- ❌ Data Warehouse - Data Team (P1)
- ❌ Data Lake - Data Team (P1)
- ✅ API REST (/2) - Backend Lead (vous)
- ✅ SOLID & Architecture (/3) - Backend Lead (vous)
- ✅ Tests (/3) - Backend Lead (vous) + QA
- ✅ Soutenance (/2) - PM (vous)

### **PRIORITÉ 2 (P2): Disponibilités Temps Réel (AVAIL-01)**
- Après P1 complétée
- 2 API endpoints
- Cache Redis
- Tests

---

## 🎯 VOTRE MISSION

Vous êtes le **leader technique et chef de projet**. Vous coordonnez l'équipe, développez les APIs principales, et assurez la qualité.

---

## 📅 PHASE 0 - Immédiat (28 Mars, < 1h)

### Tâche 0.1: Créer Structure DataLake
**Durée:** 15 min
**Importance:** CRITIQUE (bloque tout le reste)

```bash
# Option 1: Python (Recommandé)
cd "C:\Users\HP\OneDrive\Desktop\master_engeneering\Bmad"
python create_datalake_structure.py

# Vérifier
dir Algo_dev_rendu\datalake\
```

**Livrables:**
- ✅ Dossier `/datalake/` créé
- ✅ Sous-dossiers créés (non-traités, traités, archives)
- ✅ README.md et status.json présents

**Blockers:** Aucun

---

## 📅 PHASE 1 - DataLake & Airflow (28-29 Mars = 2 jours)

### Tâche 1.7: Intégration Airflow Backend
**Durée:** 3 heures
**Importance:** HAUTE

**Description:**
Créer les routes Express pour exposer l'état d'Airflow au Frontend.

**Fichier Principal:** `INTEGRATION-AIRFLOW-MONITORING.md` (Section 2-3)

**Étapes:**

1. **Créer route file** (30 min)
```bash
# Fichier: backend/src/routes/airflow.js
# Copier le code de INTEGRATION-AIRFLOW-MONITORING.md section 2
# (400+ lignes de code Express prêt à copier-coller)
```

2. **Mettre à jour app.js** (15 min)
```javascript
// backend/src/app.js
const airflowRoutes = require('./routes/airflow');

// ... existing routes ...

app.use('/api/airflow', airflowRoutes);
```

3. **Configurer .env** (15 min)
```bash
# backend/.env
AIRFLOW_URL=http://localhost:8080
AIRFLOW_USER=airflow
AIRFLOW_PASSWORD=airflow
MONGODB_URI=mongodb://localhost:27017/tourisme
```

4. **Tester endpoints** (1h 30 min)
```bash
# Démarrer le backend
npm run dev

# Dans un autre terminal, tester:
curl http://localhost:3001/api/airflow/status
curl http://localhost:3001/api/airflow/health
curl http://localhost:3001/api/airflow/datalake
```

**Acceptance Criteria:**
- [ ] Route `/api/airflow/status` répond HTTP 200
- [ ] Route `/api/airflow/health` répond HTTP 200
- [ ] Route `/api/airflow/datalake` retourne stats
- [ ] Pas d'erreurs dans les logs
- [ ] CORS autorisé pour Frontend (localhost:3000)

**Blockers:**
- ⚠️ Airflow doit être running (lancé par Data Team)
- ⚠️ MongoDB doit être accessible

---

### Tâche 1.8: Configuration MongoDB
**Durée:** 1 heure
**Importance:** HAUTE

**Description:**
Configurer MongoDB pour le projet.

**Étapes:**

1. **Vérifier MongoDB running** (15 min)
```bash
docker-compose ps | grep mongodb
# Ou pour local: mongosh
```

2. **Créer base de données** (30 min)
```bash
# Via mongosh ou MongoDB Compass
use tourisme

# Créer collections
db.createCollection("hebergements")
db.createCollection("users")
db.createCollection("reviews")
db.createCollection("favorites")
db.createCollection("availabilities")

# Créer indexes
db.hebergements.createIndex({ "nom": "text", "commune": "text" })
db.hebergements.createIndex({ "latitude": 1, "longitude": 1 })
db.hebergements.createIndex({ "codePostal": 1 })
db.hebergements.createIndex({ "type": 1 })
```

3. **Vérifier connexion depuis Backend** (15 min)
```bash
# Dans backend logs
npm run dev
# Devrait montrer: "Connected to MongoDB: tourisme"
```

**Acceptance Criteria:**
- [ ] Base `tourisme` créée
- [ ] Collections créées
- [ ] Indexes en place
- [ ] Backend peut se connecter

---

## 📅 PHASE 2 - Backend APIs (29-31 Mars = 3 jours)

### Tâche 2.1: API /hebergements (search & filters)
**Durée:** 4 heures
**Importance:** CRITIQUE

**Description:**
Endpoint principal pour rechercher et filtrer les hébergements.

**Fichier:** `backend/src/controllers/hebergementController.js`

**API Spec:**
```
GET /api/hebergements
Query params:
  - q: string (search text)
  - type: enum (hotel, camping, residence, meuble, auberge, village)
  - region: string
  - stars: 1-5
  - limit: number (default 20, max 100)
  - offset: number (default 0)

Response:
{
  "data": [
    {
      "id": "...",
      "nom": "...",
      "type": "...",
      "commune": "...",
      "stars": 5,
      "latitude": 48.8566,
      "longitude": 2.3522,
      "reviewCount": 10,
      "avgRating": 4.5
    }
  ],
  "total": 45000,
  "limit": 20,
  "offset": 0
}
```

**Code Template:**
```javascript
// backend/src/routes/hebergements.js
router.get('/', async (req, res) => {
  try {
    const { q, type, region, stars, limit = 20, offset = 0 } = req.query;
    
    const filter = {};
    
    if (q) {
      filter.$text = { $search: q };
    }
    
    if (type) {
      filter.type = type;
    }
    
    if (region) {
      filter.region = region;
    }
    
    if (stars) {
      filter.stars = parseInt(stars);
    }
    
    const hebergements = await db.collection('hebergements')
      .find(filter)
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .toArray();
    
    const total = await db.collection('hebergements').countDocuments(filter);
    
    res.json({
      data: hebergements,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

**Acceptance Criteria:**
- [ ] Recherche full-text fonctionne (q parameter)
- [ ] Filtres par type, région, stars fonctionnent
- [ ] Pagination fonctionne (limit, offset)
- [ ] Retourne 45000+ résultats
- [ ] Response time < 1 seconde
- [ ] Tests unitaires (80%+ coverage)

**Dépendances:**
- ✅ Phase 1: Data Team doit avoir importé les données

**Blockers:**
- ⚠️ Data import (Phase 1 Data)

---

### Tâche 2.2: API /hebergements/:id (détail)
**Durée:** 2 heures
**Importance:** HAUTE

**Description:**
Fiche détaillée d'un hébergement.

**API Spec:**
```
GET /api/hebergements/:id

Response:
{
  "id": "...",
  "nom": "...",
  "type": "...",
  "adresse": "...",
  "codePostal": "...",
  "commune": "...",
  "region": "...",
  "latitude": 48.8566,
  "longitude": 2.3522,
  "telephone": "+33...",
  "email": "...",
  "website": "...",
  "stars": 5,
  "rooms": 10,
  "amenities": ["WiFi", "Parking", ...],
  "reviews": [ ... ],
  "avgRating": 4.5,
  "reviewCount": 10
}
```

**Acceptance Criteria:**
- [ ] Retourne tous les détails
- [ ] Inclut les avis (derniers 10)
- [ ] Calcule moyenne des avis
- [ ] Response time < 500ms
- [ ] 404 si hébergement inexistant

---

### Tâche 2.3: API /hebergements/nearby (géolocalisation)
**Durée:** 2 heures
**Importance:** MOYENNE

**Description:**
Trouver les hébergements proches d'une localisation.

**API Spec:**
```
GET /api/hebergements/nearby?lat=48.8566&lng=2.3522&radius=5

Query:
  - lat: latitude
  - lng: longitude
  - radius: km (default 5)
  - limit: number (default 10)

Response:
{
  "data": [
    {
      "id": "...",
      "nom": "...",
      "distance_km": 1.2,
      ...
    }
  ]
}
```

**Acceptance Criteria:**
- [ ] Utilise MongoDB geospatial indexes
- [ ] Retourne par distance
- [ ] Response time < 500ms
- [ ] Teste avec vraies coordonnées Paris

---

### Tâche 2.4 & 2.5: APIs /reviews & /favoris
**Durée:** 3 heures (fait par Fullstack #2)
**Dépend de:** Tâche 2.1

**Votre rôle:** Code review & guidance

---

### Tâche 2.6: API /analytics (stats)
**Durée:** 2 heures
**Importance:** MOYENNE

**Description:**
Statistiques globales sur les hébergements.

**API Spec:**
```
GET /api/analytics/summary

Response:
{
  "totalAccommodations": 45000,
  "byType": {
    "hotel": 18000,
    "camping": 8000,
    ...
  },
  "byRegion": {
    "Île-de-France": 5000,
    ...
  },
  "avgRating": 4.2,
  "totalReviews": 10000
}
```

**Acceptance Criteria:**
- [ ] Retourne toutes les stats
- [ ] Aggégations MongoDB correctes
- [ ] Response time < 1 seconde
- [ ] Cache les résultats (optionnel)

---

### Tâche 2.6B: Refactoring SOLID & Architecture ⭐ GRILLE /3
**Durée:** 6 heures
**Importance:** 🔴 CRITIQUE (Grille: /3 points Architecture)

**Description:**
Refactoriser le code backend pour respecter les principes SOLID, améliorer la maintenabilité et la qualité.

**Principes SOLID à appliquer:**

```
S - Single Responsibility: Chaque classe = 1 responsabilité
O - Open/Closed: Ouvert à l'extension, fermé à la modification
L - Liskov Substitution: Sous-classes peuvent remplacer classe parente
I - Interface Segregation: Interfaces spécifiques, pas générales
D - Dependency Injection: Dépendances injectées, pas hardcodées
```

**Refactoring à faire:**

1. **Organiser la structure** (1h)
```
backend/
├── src/
│   ├── config/          ← Configuration (DB, env, cache)
│   ├── models/          ← Data models
│   ├── repositories/    ← Data access layer (SINGLE RESPONSIBILITY)
│   ├── services/        ← Business logic (SINGLE RESPONSIBILITY)
│   ├── controllers/     ← HTTP handlers (SINGLE RESPONSIBILITY)
│   ├── routes/          ← Route definitions
│   ├── middleware/      ← Auth, logging, error handling
│   ├── utils/           ← Helpers
│   ├── decorators/      ← Logging, caching
│   └── app.js           ← Express app setup
├── tests/
│   ├── unit/            ← Unit tests
│   ├── integration/     ← Integration tests
│   └── fixtures/        ← Test data
└── package.json
```

2. **Appliquer Dependency Injection** (2h)
```javascript
// ❌ BAD - Hardcoded dependencies
class HebergementController {
  getAll() {
    const db = new MongoDB('tourisme');  // Hardcoded!
    const data = db.find(...);
    return data;
  }
}

// ✅ GOOD - Injected dependencies
class HebergementRepository {
  constructor(dbClient) {
    this.db = dbClient;  // Injected
  }
  
  findAll(filter) {
    return this.db.collection('hebergements').find(filter).toArray();
  }
}

class HebergementService {
  constructor(repository, logger) {
    this.repo = repository;
    this.logger = logger;
  }
  
  getAll(filter) {
    this.logger.info(`Fetching hebergements with filter: ${JSON.stringify(filter)}`);
    return this.repo.findAll(filter);
  }
}

class HebergementController {
  constructor(service) {
    this.service = service;  // Service injected
  }
  
  async handleGetAll(req, res) {
    const data = await this.service.getAll(req.query);
    res.json(data);
  }
}

// In app.js - Setup DI container
const dbClient = new MongoClient('mongodb://...');
const logger = new Logger();
const repository = new HebergementRepository(dbClient);
const service = new HebergementService(repository, logger);
const controller = new HebergementController(service);

app.get('/api/hebergements', controller.handleGetAll.bind(controller));
```

3. **Extraire Business Logic** (2h)
```javascript
// Before: Business logic mixed with HTTP
app.get('/api/hebergements/:id', async (req, res) => {
  try {
    const heb = await db.findById(req.params.id);
    if (!heb) return res.status(404).json({error: 'Not found'});
    
    const reviews = await db.reviews.find({hebergementId: heb._id});
    const favCount = await db.favorites.countDocuments({hebergementId: heb._id});
    
    const enriched = {
      ...heb,
      reviews,
      favoriteCount: favCount,
      avgRating: reviews.reduce((a,b) => a + b.rating, 0) / reviews.length
    };
    
    res.json(enriched);
  } catch (e) {
    res.status(500).json({error: e.message});
  }
});

// After: Business logic extracted to Service
// File: src/services/HebergementService.js
class HebergementService {
  constructor(hebergementRepo, reviewRepo, favoriteRepo) {
    this.hebRepo = hebergementRepo;
    this.reviewRepo = reviewRepo;
    this.favRepo = favoriteRepo;
  }
  
  async getDetailWithEnrichments(hebergementId) {
    const heb = await this.hebRepo.findById(hebergementId);
    if (!heb) throw new NotFoundError(`Hébergement ${hebergementId} not found`);
    
    const reviews = await this.reviewRepo.findByHebId(hebergementId);
    const favCount = await this.favRepo.countByHebId(hebergementId);
    
    return this.enrichHebergement(heb, reviews, favCount);
  }
  
  enrichHebergement(heb, reviews, favCount) {
    return {
      ...heb,
      reviews,
      favoriteCount: favCount,
      avgRating: this.calculateAvgRating(reviews)
    };
  }
  
  calculateAvgRating(reviews) {
    if (reviews.length === 0) return 0;
    return reviews.reduce((a, b) => a + b.rating, 0) / reviews.length;
  }
}

// File: src/controllers/HebergementController.js
class HebergementController {
  constructor(service) {
    this.service = service;
  }
  
  async getDetail(req, res) {
    try {
      const data = await this.service.getDetailWithEnrichments(req.params.id);
      res.json(data);
    } catch (error) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({error: error.message});
      }
      res.status(500).json({error: error.message});
    }
  }
}

// File: src/routes/hebergements.js
const express = require('express');
const router = express.Router();

module.exports = (controller) => {
  router.get('/:id', controller.getDetail.bind(controller));
  return router;
};

// File: src/app.js
const hebergementRoutes = require('./routes/hebergements');
const hebergementController = new HebergementController(hebergementService);
app.use('/api/hebergements', hebergementRoutes(hebergementController));
```

4. **Ajouter Error Handling Centralisé** (1h)
```javascript
// File: src/middleware/errorHandler.js
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

class NotFoundError extends AppError {
  constructor(message) {
    super(message, 404);
  }
}

class ValidationError extends AppError {
  constructor(message) {
    super(message, 400);
  }
}

// Middleware central
const errorHandler = (err, req, res, next) => {
  console.error(err);
  
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      statusCode: err.statusCode
    });
  }
  
  res.status(500).json({
    error: 'Internal Server Error',
    statusCode: 500
  });
};

app.use(errorHandler);
```

**Acceptance Criteria:**
- [ ] Code reorganisé en repositories/services/controllers
- [ ] Dependency Injection implémenté pour DB, Logger, Services
- [ ] Business logic extrait des contrôleurs
- [ ] Error handling centralisé
- [ ] Pas de hardcoded dependencies
- [ ] Tests refactorisés pour DI
- [ ] Linter (ESLint) passe sans warnings
- [ ] Documentation code updated

**Dépendances:**
- ✅ APIs implémentées (Tâche 2.1-2.6)

---

### Tâche 2.7: Backend Tests - Unit + Intégration ⭐ GRILLE /3

### Tâche 2.7: Backend Tests - Unit + Intégration + API Pipeline ⭐ GRILLE /3

**Durée:** 8 heures
**Importance:** 🔴 CRITIQUE (Grille: /3 points Tests)

**Description:**
Écrire 3 types de tests pour couvrir 80%+ du code backend.

**Étapes:**

1. **Tests Unitaires** (3h)
```javascript
// File: tests/unit/repositories/HebergementRepository.test.js
const { describe, it, expect, beforeEach } = require('@jest/globals');
const HebergementRepository = require('../../../src/repositories/HebergementRepository');

describe('HebergementRepository', () => {
  let mockDb;
  let repository;
  
  beforeEach(() => {
    // Mock MongoDB
    mockDb = {
      collection: jest.fn(() => ({
        find: jest.fn(),
        findOne: jest.fn(),
        updateOne: jest.fn(),
        deleteOne: jest.fn()
      }))
    };
    
    repository = new HebergementRepository(mockDb);
  });
  
  describe('findAll', () => {
    it('should return all hebergements matching filter', async () => {
      const mockData = [
        { _id: 1, nom: 'Hotel A', type: 'hotel' },
        { _id: 2, nom: 'Hotel B', type: 'hotel' }
      ];
      
      mockDb.collection().find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue(mockData)
      });
      
      const result = await repository.findAll({ type: 'hotel' });
      
      expect(result).toEqual(mockData);
      expect(result.length).toBe(2);
    });
    
    it('should return empty array when no matches', async () => {
      mockDb.collection().find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([])
      });
      
      const result = await repository.findAll({ type: 'nonexistent' });
      
      expect(result).toEqual([]);
    });
  });
  
  describe('findById', () => {
    it('should return hebergement by id', async () => {
      const mockHeb = { _id: 1, nom: 'Hotel A' };
      
      mockDb.collection().findOne.mockResolvedValue(mockHeb);
      
      const result = await repository.findById(1);
      
      expect(result).toEqual(mockHeb);
    });
    
    it('should throw NotFoundError if not found', async () => {
      mockDb.collection().findOne.mockResolvedValue(null);
      
      await expect(repository.findById(999))
        .rejects
        .toThrow('Not found');
    });
  });
});

// File: tests/unit/services/HebergementService.test.js
describe('HebergementService', () => {
  let service;
  let mockRepo;
  let mockLogger;
  
  beforeEach(() => {
    mockRepo = {
      findAll: jest.fn(),
      findById: jest.fn()
    };
    
    mockLogger = {
      info: jest.fn(),
      error: jest.fn()
    };
    
    service = new HebergementService(mockRepo, mockLogger);
  });
  
  it('should log when fetching hebergements', async () => {
    mockRepo.findAll.mockResolvedValue([]);
    
    await service.getAll({});
    
    expect(mockLogger.info).toHaveBeenCalled();
  });
  
  it('should calculate average rating correctly', () => {
    const reviews = [
      { rating: 5 },
      { rating: 4 },
      { rating: 5 }
    ];
    
    const avg = service.calculateAvgRating(reviews);
    
    expect(avg).toBe(4.67);
  });
});

// File: tests/unit/controllers/HebergementController.test.js
describe('HebergementController', () => {
  let controller;
  let mockService;
  let mockReq;
  let mockRes;
  
  beforeEach(() => {
    mockService = {
      getAll: jest.fn(),
      getDetailWithEnrichments: jest.fn()
    };
    
    controller = new HebergementController(mockService);
    
    mockReq = { query: {}, params: {} };
    mockRes = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis()
    };
  });
  
  it('should return hebergements from service', async () => {
    const mockData = [{ nom: 'Hotel A' }];
    mockService.getAll.mockResolvedValue(mockData);
    
    await controller.getAll(mockReq, mockRes);
    
    expect(mockRes.json).toHaveBeenCalledWith(mockData);
  });
  
  it('should handle 404 errors', async () => {
    const notFoundError = new NotFoundError('Not found');
    mockService.getDetailWithEnrichments.mockRejectedValue(notFoundError);
    
    await controller.getDetail(mockReq, mockRes);
    
    expect(mockRes.status).toHaveBeenCalledWith(404);
  });
});
```

**Cible:** 80%+ code coverage de services & repositories

---

2. **Tests d'Intégration** (3h)
```javascript
// File: tests/integration/api.hebergements.test.js
const request = require('supertest');
const app = require('../../../src/app');
const { MongoClient } = require('mongodb');

describe('GET /api/hebergements (Integration)', () => {
  let client;
  let db;
  
  beforeAll(async () => {
    client = new MongoClient('mongodb://localhost:27017');
    await client.connect();
    db = client.db('tourisme_test');
    
    // Setup test data
    await db.collection('hebergements').insertMany([
      { nom: 'Hotel Paris', type: 'hotel', region: 'Île-de-France' },
      { nom: 'Camping Provence', type: 'camping', region: 'Provence' }
    ]);
  });
  
  afterAll(async () => {
    await db.collection('hebergements').deleteMany({});
    await client.close();
  });
  
  it('should return all hebergements', async () => {
    const res = await request(app)
      .get('/api/hebergements')
      .expect(200);
    
    expect(res.body.data).toHaveLength(2);
  });
  
  it('should filter by type', async () => {
    const res = await request(app)
      .get('/api/hebergements?type=hotel')
      .expect(200);
    
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].type).toBe('hotel');
  });
  
  it('should search by text', async () => {
    const res = await request(app)
      .get('/api/hebergements?q=Paris')
      .expect(200);
    
    expect(res.body.data[0].nom).toContain('Paris');
  });
  
  it('should paginate results', async () => {
    const res = await request(app)
      .get('/api/hebergements?limit=1&offset=0')
      .expect(200);
    
    expect(res.body.limit).toBe(1);
    expect(res.body.offset).toBe(0);
  });
});

// File: tests/integration/api.reviews.test.js
describe('POST /api/hebergements/:id/reviews (Auth Required)', () => {
  let token;
  
  beforeAll(async () => {
    // Create test user & get auth token
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });
    
    token = res.body.token;
  });
  
  it('should create review with auth', async () => {
    const res = await request(app)
      .post('/api/hebergements/1/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send({
        rating: 5,
        title: 'Excellent!',
        text: 'Great place to stay'
      })
      .expect(201);
    
    expect(res.body.id).toBeDefined();
  });
  
  it('should reject review without auth', async () => {
    const res = await request(app)
      .post('/api/hebergements/1/reviews')
      .send({
        rating: 5,
        title: 'Excellent!',
        text: 'Great place to stay'
      })
      .expect(401);
  });
});
```

**Cible:** Happy paths + error cases pour tous les endpoints

---

3. **Tests API Pipeline** (2h)
```javascript
// File: tests/integration/pipeline.hebergements.test.js
describe('Data Pipeline - Hebergements (End-to-End)', () => {
  it('should complete full pipeline: Load → Search → Detail → Review', async () => {
    // 1. Load data into MongoDB
    const loadRes = await request(app)
      .post('/api/admin/import')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ source: 'data.gouv.fr' })
      .expect(200);
    
    expect(loadRes.body.recordsImported).toBeGreaterThan(0);
    
    // 2. Search API works
    const searchRes = await request(app)
      .get('/api/hebergements?q=Paris&type=hotel')
      .expect(200);
    
    expect(searchRes.body.data.length).toBeGreaterThan(0);
    const hotelId = searchRes.body.data[0]._id;
    
    // 3. Detail page loads
    const detailRes = await request(app)
      .get(`/api/hebergements/${hotelId}`)
      .expect(200);
    
    expect(detailRes.body.nom).toBeDefined();
    expect(detailRes.body.reviews).toBeDefined();
    
    // 4. Can post review
    const reviewRes = await request(app)
      .post(`/api/hebergements/${hotelId}/reviews`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ rating: 5, title: 'Great!', text: 'Nice place' })
      .expect(201);
    
    expect(reviewRes.body.id).toBeDefined();
    
    // 5. Review appears in detail page
    const detailRes2 = await request(app)
      .get(`/api/hebergements/${hotelId}`)
      .expect(200);
    
    expect(detailRes2.body.reviews.length).toBeGreaterThan(0);
  });
  
  it('should handle search performance', async () => {
    const start = Date.now();
    
    const res = await request(app)
      .get('/api/hebergements?limit=100')
      .expect(200);
    
    const duration = Date.now() - start;
    
    // Should respond < 1 second
    expect(duration).toBeLessThan(1000);
  });
});
```

**Cible:** Full user journey tested (données importées → recherche → détail → avis)

---

**Setup Tests:**
```bash
# Install
npm install --save-dev jest supertest @jest/globals

# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

**Acceptance Criteria:**
- [ ] 80%+ code coverage (backend services + controllers)
- [ ] 20+ unit tests (mockés)
- [ ] 15+ integration tests (real DB)
- [ ] 5+ pipeline tests (end-to-end)
- [ ] All tests passing
- [ ] Coverage report generated (coverage/ folder)
- [ ] Performance tests: response time < 1s

**Dépendances:**
- ✅ SOLID refactoring complété (Tâche 2.6B)
- ✅ APIs implémentées (Tâche 2.1-2.6)

---

## 📅 PHASE 2B - APIs Disponibilités Temps Réel (30-31 Mars = 2 jours, 3h)

### Tâche 2.8: API Endpoint - Disponibilités d'un Hébergement
**Durée:** 1 heure 30 min
**Importance:** CRITIQUE

**Description:**
Créer endpoint pour exposer les disponibilités d'un hébergement.

**Fichier:** `backend/src/routes/availabilities.js` (NEW)

**Implémentation:**
```javascript
// backend/src/routes/availabilities.js
const express = require('express');
const router = express.Router();
const { cache } = require('../middleware/cache');
const AvailabilityController = require('../controllers/availabilityController');

// GET /api/hebergements/:id/availabilities?start=2026-04-01&end=2026-04-30
router.get(
  '/hebergements/:id/availabilities',
  cache(300),  // 5 min cache
  AvailabilityController.getAvailabilitiesByHebId
);

module.exports = router;
```

**Contrôleur:**
```javascript
// backend/src/controllers/availabilityController.js
const Availability = require('../models/Availability');
const Hebergement = require('../models/Hebergement');

exports.getAvailabilitiesByHebId = async (req, res) => {
  try {
    const { id } = req.params;
    const { start, end } = req.query;
    
    // Validation
    if (!id) return res.status(400).json({ error: 'Missing hebergement_id' });
    if (!start || !end) return res.status(400).json({ error: 'Missing start/end dates' });
    
    // Récupérer hébergement
    const hebergement = await Hebergement.findById(id);
    if (!hebergement) return res.status(404).json({ error: 'Hebergement not found' });
    
    // Query MongoDB
    const availabilities = await Availability.find({
      hebergement_id: id,
      date_debut: { $gte: new Date(start) },
      date_fin: { $lte: new Date(end) }
    }).lean();
    
    // Format réponse
    res.json({
      hebergement_id: id,
      hebergement_nom: hebergement.nom,
      availabilities,
      updated_at: new Date()
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

**Intégration dans app.js:**
```javascript
// backend/src/app.js
const availabilityRoutes = require('./routes/availabilities');

// ... existing routes ...

app.use('/api', availabilityRoutes);
```

**Tâches:**
- [ ] Créer fichier routes `availabilities.js`
- [ ] Créer contrôleur `availabilityController.js`
- [ ] Créer model Mongoose `Availability.js`
- [ ] Ajouter middleware cache (Redis)
- [ ] Tests Supertest

**Acceptance Criteria:**
- [ ] GET `/api/hebergements/:id/availabilities` retourne 200
- [ ] Filtre par dates fonctionne
- [ ] Retourne nom hébergement
- [ ] Cache Redis actif (300s)
- [ ] 404 si hébergement inexistant
- [ ] Tests: 80%+ coverage

---

### Tâche 2.9: API Endpoint - Recherche Disponibilités
**Durée:** 1 heure 30 min
**Importance:** HAUTE

**Description:**
Créer endpoint pour rechercher les disponibilités par critères multiples.

**API Spec:**
```
GET /api/availabilities/search?start_date=2026-04-01&end_date=2026-04-30&regions=Provence&limit=20

Response:
{
  "total": 1543,
  "count": 20,
  "results": [
    {
      "hebergement_id": "heb-001",
      "nom": "Villa Lavande",
      "region": "Provence",
      "disponible_jours": 28,
      "prix_moyen": 95,
      "thumbnail": "https://...",
      "url": "/hebergement/heb-001"
    },
    ...
  ]
}
```

**Implémentation:**
```javascript
// Ajouter à availabilityController.js
exports.searchAvailabilities = async (req, res) => {
  try {
    const { start_date, end_date, regions, limit = 20 } = req.query;
    
    // Construire aggregation pipeline
    const pipeline = [
      {
        $match: {
          date_debut: { $gte: new Date(start_date) },
          date_fin: { $lte: new Date(end_date) },
          status: 'available'
        }
      },
      {
        $lookup: {
          from: 'hebergements',
          localField: 'hebergement_id',
          foreignField: '_id',
          as: 'hebergement'
        }
      },
      { $unwind: '$hebergement' },
      {
        $match: regions ? { 'hebergement.region': regions } : {}
      },
      {
        $group: {
          _id: '$hebergement_id',
          hebergement: { $first: '$hebergement' },
          disponible_jours: { $sum: 1 }
        }
      },
      { $limit: parseInt(limit) }
    ];
    
    const results = await Availability.aggregate(pipeline);
    
    res.json({
      total: results.length,
      count: results.length,
      results
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

**Ajouter route:**
```javascript
// Dans availabilities.js
router.get('/availabilities/search', cache(300), AvailabilityController.searchAvailabilities);
```

**Tâches:**
- [ ] Implémenter agrégation MongoDB
- [ ] Tester avec vraies données
- [ ] Ajouter filtres région
- [ ] Tests performance
- [ ] Tests Supertest

**Acceptance Criteria:**
- [ ] GET `/api/availabilities/search` retourne 200
- [ ] Filtre par région fonctionne
- [ ] Retourne disponibilités < 1s
- [ ] Pagination fonctionne
- [ ] Tests: 80%+ coverage

---

## 📅 PHASE 3 - Soutenance Préparation (2-4 Avril = 3 jours, 6h) ⭐ GRILLE /2

### Tâche 3.1: Script Démo + Présentation ⭐ GRILLE /2
**Durée:** 6 heures
**Importance:** 🔴 CRITIQUE (Grille: /2 points Soutenance)

**Description:**
Préparer la présentation et la démo live fonctionnelle pour la soutenance.

**Étapes:**

1. **Script Démo Détaillé** (2h)
```markdown
# SCRIPT DÉMO - Plateforme Hébergements Touristiques

## 00. Introduction (1 min)
"Bonjour, je m'appelle Godlight. Nous avons développé une plateforme d'agrégation 
de données touristiques qui combine big data, machine learning et UX modern."

## 01. Architecture (2 min)
- Slide: Architecture globale (Airflow → MongoDB → PostgreSQL → API → Frontend)
- Décrire le pipeline: "Chaque jour, nous récupérons 10+ datasets de data.gouv.fr, 
  nous les nettoyons, les normalisons, et les chargeons dans MongoDB et PostgreSQL."

## 02. DEMO: Scraping & Import (3 min)
Action: Montrer Airflow UI
- Ouvrir http://localhost:8080
- Pointer aux 3 DAGs
- Cliquer sur dag_import_hebergements → Show statistics
- "Voici notre pipeline Airflow qui importe 45 000+ hébergements. Chaque tâche 
  représente une étape: download, normalize, geocode, load MongoDB."

## 03. DEMO: Data Quality (2 min)
Action: MongoDB query
- mongosh → use tourisme
- db.hebergements.countDocuments() → "45 241 hébergements"
- db.hebergements.findOne() → "Avec des champs normalisés"
- Show index: db.hebergements.getIndexes()

## 04. DEMO: Power BI (2 min)
Action: Ouvrir Power BI rapport
- "Nos données sont aussi dans PostgreSQL Data Warehouse, compatible Power BI"
- Montrer rapport: hébergements par région
- Filter: "Île-de-France" → carte interactive

## 05. DEMO: API REST (3 min)
Action: Postman collection
- GET /api/hebergements → 20 résultats
- Montrer filtres: ?type=hotel&region=Provence&limit=5
- Montrer recherche: ?q=Paris
- Performance < 1s

## 06. DEMO: Disponibilités Temps Réel (2 min)
Action: Frontend badge
- GET /api/hebergements/123/availabilities
- Show 🟢 badge "25/30 jours disponibles"
- Calendrier interactif

## 07. Tests & Quality (2 min)
Action: Terminal
- npm test → "87% code coverage"
- Jest report: 50 tests passent
- "Tous les critères de la grille sont couverts par des tests"

## 08. Conclusion (1 min)
"Cette plateforme démontre une maîtrise complète du pipeline data: scraping, 
nettoyage, stockage (NoSQL + Data Warehouse), API, et frontend temps réel."

---
TOTAL TEMPS: 18 min (15-20 min approx)
```

2. **Slides Présentation** (2h)
Créer 12-15 slides PowerPoint/Google Slides:

Slide 1: Title
- Titre: "Plateforme Hébergements Touristiques - Open Data"
- Sous-titre: "Pipeline ETL complet, Data Warehouse, API REST, Frontend"
- Logo équipe

Slide 2: Problématique
- "Les données touristiques de France sont dispersées dans 10+ datasets"
- "Objectif: Créer une plateforme d'agrégation unique"

Slide 3: Architecture Globale
- Diagramme: Data Sources → Airflow → MongoDB + PostgreSQL → API → Frontend
- Outils: Python, Airflow, MongoDB, PostgreSQL, Power BI, Node.js, React

Slide 4: Scraping & Nettoyage
- Montrer étapes du pipeline
- "45 000+ hébergements importés"
- "Doublons détectés et fusionnés"
- "Géocodage automatique"

Slide 5: Data Warehouse
- Modèle relationnel PostgreSQL
- Tables: dim_hebergements, dim_localisation, fact_capacite
- "Compatible Power BI"

Slide 6: Data Lake
- Structure: fichiers_traites, fichiers_non_traites
- "Suivi complet du traitement des données"

Slide 7: API REST
- Endpoints: /hebergements, /reviews, /favorites, /availabilities
- Filtres, pagination, recherche full-text
- "Performance < 1s"

Slide 8: Tests & Quality
- Coverage: 80%+
- Types: Unitaires, Intégration, Pipeline
- "50+ tests, tous passants"

Slide 9: Disponibilités Temps Réel
- Badge pour chaque hébergement
- Calendrier interactif
- "Mise à jour toutes les 30 min"

Slide 10: Principes SOLID
- Code architecture clean
- Repositories, Services, Controllers
- "Maintenabilité et évolutivité"

Slide 11: Performance & Scalabilité
- MongoDB indexes
- Redis cache (5 min)
- "Prêt pour 100k+ enregistrements"

Slide 12: Résultats
- ✅ 9/9 critères grille satisfaits
- ✅ 100+ heures de développement
- ✅ Pipeline production-ready

Slide 13: Questions

3. **Vidéo Backup** (1h)
- Enregistrer démo OBS/Zoom
- "Au cas où démo live échoue"
- Fichier: `demo-backup.mp4`

4. **Réponses FAQ Préparées** (1h)
```
Q1: Pourquoi MongoDB ET PostgreSQL?
R: MongoDB = flexible pour données semi-structurées (hébergements hétérogènes)
   PostgreSQL = relationnel et normalisé pour BI et rapports

Q2: Comment gérez-vous les mises à jour temps réel?
R: DAG Airflow chaque 30 min pour disponibilités
   MongoDB TTL indexes pour archivage
   Cache Redis 5 min pour API

Q3: Couverture tests?
R: 80%+ coverage
   Tests unitaires (20+), intégration (15+), pipeline (5+)
   Coverage report généré avec pytest-cov et jest

Q4: Production-ready?
R: Déploiement sur Vercel (frontend) + Render (backend)
   MongoDB Atlas (cloud)
   Rate limiting, HTTPS, CORS configurés

Q5: Scalabilité?
R: Architecture serverless scalable
   MongoDB indexes optimisés
   Redis cache
   Pagination sur tous les endpoints
```

**Tâches:**
- [ ] Script démo écrit et testé (timing)
- [ ] 13+ slides PowerPoint créées
- [ ] Vidéo backup enregistrée (OBS)
- [ ] FAQ préparées et rehearsées
- [ ] Démo live testée (plusieurs fois!)

**Acceptance Criteria:**
- [ ] Script démo: 15-20 min exact
- [ ] Slides professionnel avec visuels
- [ ] Démo fonctionnelle sur machine perso
- [ ] Backup vidéo présente
- [ ] FAQ prêtes
- [ ] Timing pratiqué 3x
- [ ] Démo répétée le jour d'avant

**Dépendances:**
- ✅ Tout le projet complété (Phases 1-2)
- ✅ Backend APIs fonctionnelles
- ✅ Data pipeline complète
- ✅ Tests passants

---

## 📅 PHASE 3 - Frontend Admin & Tests (1-3 Avril)

### Tâche 3.7: Admin Panel
**Durée:** 2 heures
**Importance:** MOYENNE

**Description:**
Panel administrateur pour gérer les imports et modérer les avis.

**Pages:**
- `/admin` - Dashboard
- `/admin/imports` - Historique imports
- `/admin/moderation` - Modérer les avis

**Technologie:** React + Tailwind

**Acceptance Criteria:**
- [ ] Interface fonctionnelle
- [ ] Affiche historique imports
- [ ] Permet modération avis
- [ ] Protected routes (admin only)

---

### Tâche 3.8: Frontend E2E Tests
**Durée:** 3 heures
**Importance:** HAUTE

**Description:**
Tests end-to-end avec Playwright.

```bash
npm run test:e2e

# User flow:
# 1. Accueil
# 2. Recherche "Paris"
# 3. Voir résultats
# 4. Cliquer sur un hébergement
# 5. Voir détails
# 6. Voir avis
```

**Acceptance Criteria:**
- [ ] Tous les happy paths testés
- [ ] Tests responsive (mobile, desktop)
- [ ] Tests lents acceptables (< 5s)
- [ ] All tests passing

---

## 📅 PHASE 4 - Testing & Security (4-5 Avril)

### Tâche 4.1: Security Audit
**Durée:** 2 heures
**Importance:** CRITIQUE

**Description:**
Audit OWASP Top 10.

**Checklist:**
- [ ] **Injection SQL:** Parameterized queries? ✅
- [ ] **Authentication:** JWT correctly implemented?
- [ ] **XSS:** Input sanitization?
- [ ] **CSRF:** Tokens in place?
- [ ] **Broken auth:** Password hashing (bcrypt)?
- [ ] **Sensitive data exposure:** No passwords in logs?
- [ ] **XML/XXE:** Not using XML parsing?
- [ ] **Broken access control:** Admin routes protected?
- [ ] **CORS:** Correctly configured (not *)
- [ ] **Rate limiting:** Implemented? (100 req/15min per IP)

**Tools:**
```bash
# npm audit
npm audit

# ESLint security
npm run lint

# Manual testing
# Test SQL injection: search="' OR '1'='1"
# Test XSS: search="<script>alert('xss')</script>"
```

**Acceptance Criteria:**
- [ ] 0 critical vulnerabilities
- [ ] npm audit clean
- [ ] No obvious OWASP issues
- [ ] Documented security measures

---

### Tâche 4.2: Performance Optimization
**Durée:** 2 heures
**Importance:** HAUTE

**Description:**
Optimiser les temps de réponse.

**Benchmarks:**
- API response: < 500ms
- Page load: < 3s
- Search: < 1s

**Actions:**
```javascript
// 1. Add database indexes (déjà fait)
// 2. Add caching
const redis = require('redis');
const client = redis.createClient();

router.get('/api/hebergements', async (req, res) => {
  const cacheKey = `search:${JSON.stringify(req.query)}`;
  const cached = await client.get(cacheKey);
  if (cached) return res.json(JSON.parse(cached));
  
  // ... fetch from DB ...
  
  await client.setex(cacheKey, 3600, JSON.stringify(result));
  res.json(result);
});

// 3. Optimize queries
// 4. Add compression middleware
```

**Acceptance Criteria:**
- [ ] API response < 500ms (p95)
- [ ] Page load < 3s (Lighthouse)
- [ ] Search < 1s
- [ ] Images optimized < 200KB
- [ ] No N+1 queries

---

### Tâche 4.6: Integration Testing
**Durée:** 2 heures
**Importance:** HAUTE

**Description:**
Test le flow complet: Backend + Frontend + Data.

**Scenario:**
```
1. Accueil charge
2. Recherche "Paris"
3. Backend query MongoDB
4. Affiche 100 résultats
5. Pagination marche
6. Clic détail marche
7. Avis chargent
8. Favori marche
9. Login/Register marche
10. Admin panel accessible (admin only)
```

**Acceptance Criteria:**
- [ ] Tous les flows fonctionnent
- [ ] Pas de données orphelines
- [ ] Pas d'erreurs console
- [ ] Pas de HTTP errors (5xx)

---

## 📅 PHASE 5 - Deployment (5 Avril)

### Tâche 5.3: Render Deployment (Backend)
**Durée:** 1 heure
**Importance:** CRITIQUE

```bash
# 1. Create Render Web Service
# URL: https://dashboard.render.com

# 2. Config:
Build: npm install && npm run build
Start: npm start

# 3. Environment variables:
MONGODB_URI=<atlas-url>
JWT_SECRET=<secure-random>
NODE_ENV=production
AIRFLOW_URL=<production-url>

# 4. Deploy
# Auto-redeploy on git push

# 5. Verify
curl https://<your-app>.onrender.com/api/airflow/status
```

**Acceptance Criteria:**
- [ ] App deployed successfully
- [ ] API accessible from internet
- [ ] MongoDB Atlas connected
- [ ] Logs visible in Render dashboard
- [ ] No 5xx errors

---

### Tâche 5.5: DNS & SSL
**Durée:** 1 heure
**Importance:** HAUTE

```bash
# 1. Domain setup (if custom domain)
# Point DNS to Render

# 2. SSL
# Render auto-generates (via Let's Encrypt)

# 3. Test
curl https://api.votredomaine.com/api/status

# 4. Frontend .env update
VITE_API_URL=https://api.votredomaine.com
```

**Acceptance Criteria:**
- [ ] SSL certificate valid
- [ ] HTTPS works
- [ ] Frontend can call Backend HTTPS
- [ ] No mixed content warnings

---

### Tâche 5.6: Final Verification
**Durée:** 1 heure
**Importance:** CRITIQUE

**Smoke tests:**
```bash
# API health
curl https://api.votredomaine.com/api/airflow/health

# Search works
curl "https://api.votredomaine.com/api/hebergements?q=Paris"

# Frontend loads
open https://votredomaine.com

# Admin panel
open https://votredomaine.com/admin
```

**Acceptance Criteria:**
- [ ] API responds < 1s
- [ ] Frontend loads < 3s
- [ ] No errors in browser console
- [ ] Database has data (45000+ records)
- [ ] All features work

---

## 📅 PHASE 6 - Soutenance (6-7 Avril)

### Tâche 6.1: Prepare Slides
**Durée:** 2 heures

**Structure (10-15 min):**
1. Intro project (1 min)
2. Problem statement (1 min)
3. Solution (2 min)
4. Architecture (2 min)
5. Tech stack (1 min)
6. Demo (5 min)
7. Results & Metrics (1 min)
8. Conclusion (1 min)

**Tools:** PowerPoint or Google Slides

**Content:**
- Logo & branding
- Key metrics (45k accommodations, 45+ reviews)
- Architecture diagram (frontend, backend, data)
- Live demo walkthrough
- Team photo
- Thank you slide

---

### Tâche 6.2: Demo Script
**Durée:** 1 heure

**Write step-by-step:**
```
1. "Welcome, today we present..."
2. "Open the app at https://..."
3. "Search for 'Paris'"
4. "Click on a result"
5. "Show the details"
6. "Show the map"
7. "Show admin panel"
8. "Show real-time availability"
9. "Questions?"
```

**Timing:** Rehearse multiple times (< 15 min)

---

### Tâche 6.4: Final Code Cleanup
**Durée:** 1 heure

```bash
# Remove console.logs
# Add JSDoc comments
# Format code
npm run prettier -- --write .

# Run linter
npm run lint

# Final test
npm test
npm run test:e2e
```

---

## 📊 RÉSUMÉ VOTRE TÂCHES

| Phase | Tâches | Durée | Status |
|-------|--------|-------|--------|
| 0 | DataLake | 0.25h | ⏳ |
| 1 | Backend Airflow | 4h | ⏳ |
| 2 | Core APIs | 8h | ⏳ |
| 3 | Admin + E2E | 5h | ⏳ |
| 4 | Security + Perf | 4h | ⏳ |
| 5 | Deployment | 2h | ⏳ |
| 6 | Soutenance | 1h | ⏳ |
| **TOTAL** | **Leadership & Backend** | **28.25h** | |

---

## 🎯 SUCCESS CRITERIA

- [ ] 28 heures travail estimé
- [ ] Tous les APIs implémentés
- [ ] 80%+ test coverage
- [ ] Security audit passed
- [ ] Production deployed
- [ ] Soutenance présentée
- [ ] Team coordonné & delivery on-time

---

## 📞 SUPPORT

**Blockers/Questions:**
→ Slack channel #projet-hebergements
→ Daily standup 09:00

**Need help from:**
- **Data Team:** Phase 1 (import data)
- **Fullstack #2:** Phase 3 (frontend integration)

---

**Assigné à:** Vous (Godlight)
**Créé:** 28 Mars 2026, 21:50 UTC
**Status:** 🟢 Ready to start

**Next:** Créez DataLake physiquement & lancez Phase 1! 🚀
