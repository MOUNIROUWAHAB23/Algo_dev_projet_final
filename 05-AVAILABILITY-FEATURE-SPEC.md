# Spécification Feature: Disponibilités en Temps Réel
**Date:** 28 Mars 2026  
**Version:** 1.0  
**Statut:** 🔴 CRITIQUE - À AJOUTER AUX ASSIGNMENTS

---

## 🎯 Objectif
**Permettre à l'utilisateur de voir si un hébergement est disponible en TEMPS RÉEL** avec mise à jour automatique toutes les 30 minutes via Airflow.

---

## 📋 New Epic: `AVAIL-01`

### Epic Description
**AVAIL-01: Disponibilités en Temps Réel**
- **Priorité:** P0 (CRITIQUE!)
- **Sprint:** J2-4 (parallèle à DATA-01)
- **Équipe:** P1 (Data Lead) + P3 (Backend) + P2 (Frontend)
- **Dépendance:** DATA-01 (import des données d'hébergements)

---

## 📥 EPIC AVAIL-01: Disponibilités Temps Réel

### AVAIL-01.01: Infrastructure Stockage Disponibilités

**Priorité:** P0 | **Estimation:** 2h | **Sprint:** J2

**En tant que** système,  
**Je veux** créer une collection MongoDB pour les disponibilités,  
**Afin de** pouvoir stocker les statuts à jour de chaque hébergement.

**Critères d'acceptation:**
- [ ] Collection `availabilities` créée en MongoDB
- [ ] Index sur `hebergement_id` (foreign key)
- [ ] Index sur `updated_at` pour requêtes rapides
- [ ] Document de référence: 1 hébergement = N périodes de disponibilité
- [ ] Status enum: `available`, `unavailable`, `unknown`
- [ ] Timestamp mis à jour par DAG Airflow

**Schéma MongoDB:**
```javascript
{
  _id: ObjectId,
  hebergement_id: String,         // ref vers hebergements collection
  date_debut: Date,
  date_fin: Date,
  status: "available" | "unavailable" | "unknown",
  source: String,                 // "data.gouv.fr", "API externe", etc.
  updated_at: Date,               // IMPORTANT: pour real-time
  sync_batch_id: String,          // Track du DAG Airflow
  metadata: {
    prix_min: Number,
    prix_max: Number,
    nb_chambres: Number
  }
}
```

**Tâches techniques:**
- [ ] Créer script: `backend/scripts/createAvailabilityCollection.js`
- [ ] Indexes création
- [ ] Seed données test (10 hébergements × 30 jours)
- [ ] Valider connexion MongoDB Atlas

---

### AVAIL-01.02: DAG Airflow Mise à Jour Disponibilités

**Priorité:** P0 | **Estimation:** 3h | **Sprint:** J2

**En tant que** système,  
**Je veux** que le DAG Airflow récupère les disponibilités toutes les 30 min,  
**Afin de** garder les données à jour en temps réel.

**Critères d'acceptation:**
- [ ] DAG `recuperation_disponibilites` schedule TOUS LES 30 MIN
- [ ] Récupère disponibilités depuis source externe (API/web scraping/data.gouv.fr)
- [ ] Upsert en MongoDB (ne pas créer duplicates)
- [ ] Logs structurés (JSON) dans datalake
- [ ] Gestion erreurs + retry automatique
- [ ] DAG runs < 5 minutes par batch

**Fichier:** `airflow/dags/dag_disponibilites.py`
- [x] DÉJÀ DÉCOUVERT (voir ASSIGNMENT-DATA-LEAD.md)
- [ ] À tester + déployer

**Configuration Airflow:**
```yaml
schedule_interval: '*/30 * * * *'  # Toutes les 30 min
default_args:
  retries: 3
  retry_delay: 5 minutes
  timeout: 300 seconds
```

**Tâches techniques (Data Lead):**
- [ ] Vérifier script `airflow/scripts/update_availabilities.py`
- [ ] Configurer API source (qui fournit les dispos?)
- [ ] Tester avec 100 hébergements
- [ ] Valider upsert MongoDB
- [ ] Documenter source de données

---

### AVAIL-01.03: Backend API Disponibilités

**Priorité:** P0 | **Estimation:** 3h | **Sprint:** J3

**En tant que** frontend,  
**Je veux** un endpoint qui me retourne les disponibilités d'un hébergement,  
**Afin de** l'afficher à l'utilisateur.

**Critères d'acceptation:**
- [ ] GET `/api/hebergements/:id/availabilities` - Liste dispo par date
- [ ] GET `/api/availabilities/search?dates=2026-04-01..2026-04-30&regions=Ile-de-France` - Search multi-filtre
- [ ] Réponse JSON avec datas
- [ ] Cache Redis (5 min) pour perf
- [ ] Rate limit: 100 req/min/IP
- [ ] Tests: 80%+ coverage

**API Endpoints:**

#### 1️⃣ GET `/api/hebergements/:id/availabilities`
**Requête:**
```
GET /api/hebergements/hebergement-123/availabilities?start=2026-04-01&end=2026-04-30
```

**Réponse (200):**
```json
{
  "hebergement_id": "hebergement-123",
  "nom": "Villa Côte d'Azur",
  "availabilities": [
    {
      "date": "2026-04-01",
      "status": "available",
      "prix_min": 85,
      "prix_max": 120
    },
    {
      "date": "2026-04-02",
      "status": "unavailable",
      "raison": "Booking external"
    },
    ...
  ],
  "updated_at": "2026-03-28T16:45:00Z"
}
```

#### 2️⃣ GET `/api/availabilities/search`
**Requête:**
```
GET /api/availabilities/search?start_date=2026-04-01&end_date=2026-04-30&min_prix=50&max_prix=150&regions=Provence&limit=20
```

**Réponse (200):**
```json
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
  ],
  "aggregations": {
    "par_region": [
      {"region": "Provence", "count": 542},
      {"region": "Alpes", "count": 380},
      ...
    ]
  }
}
```

**Implémentation Backend (P3):**
- [ ] Fichier: `backend/src/routes/availabilities.js`
- [ ] Middleware: auth + cache Redis
- [ ] Query MongoDB optimisée (indexes!)
- [ ] Tests API (Supertest)
- [ ] Documenter dans Postman/Swagger

**Tâches techniques:**
- [ ] Créer routes Express
- [ ] Connecter Redis cache
- [ ] Tests unitaires + E2E
- [ ] Swagger documentation

---

### AVAIL-01.04: Frontend - Affichage Disponibilités

**Priorité:** P0 | **Estimation:** 4h | **Sprint:** J4-5

**En tant que** utilisateur,  
**Je veux** voir clairement si un hébergement est disponible à mes dates cherchées,  
**Afin de** savoir si je peux le réserver.

**Critères d'acceptation:**
- [ ] Page Search: Affiche "✅ Disponible" ou "❌ Non disponible" par hébergement
- [ ] Fiche Détail (`/hebergement/:id`): Calendrier interactif avec dispos
- [ ] Couleur code: 🟢 = Disponible, 🔴 = Complet, ⚪ = Inconnu
- [ ] Responsive mobile (calendrier adapté)
- [ ] Filtre "Uniquement dispos" en search
- [ ] Mise à jour auto toutes les 5 min (WebSocket ou polling)
- [ ] Affichage prix min/max en temps réel

**Composants Frontend (P2):**

#### 1️⃣ Component: `AvailabilityBadge`
```jsx
<AvailabilityBadge 
  hebergement_id="heb-001"
  dates={{ start: "2026-04-01", end: "2026-04-05" }}
/>
// ✅ 5/5 jours disponibles
// ❌ 2/5 jours complets
// ⚪ Unknown
```

#### 2️⃣ Component: `AvailabilityCalendar`
```jsx
<AvailabilityCalendar
  hebergement_id="heb-001"
  month="2026-04"
  onDateSelect={handleDateChange}
/>
```
- Affiche mois complet
- Clic sur date → ajoute à recherche
- Zoom mobile: 7 jours au lieu de 30

#### 3️⃣ Page: `/search` - Colonne Disponibilité
```
| Nom | Région | Dispos | Prix | Actions |
|-----|--------|--------|------|---------|
| Villa Azur | Provence | ✅ 20 jours | €95/nuit | Voir |
| Camping Alpes | Alpes | ❌ 5/30 jours | €45/nuit | Voir |
| Gîte Bretagne | Bretagne | ⚪ ? | €65/nuit | Voir |
```

#### 4️⃣ Page: `/hebergement/:id` - Section Disponibilités
- Calendrier grand (30+ jours)
- Affiche prix par jour
- Bouton "Voir dates libres" → filter calendar
- Info "Dernière mise à jour: il y a 2 minutes"

**Implémentation Frontend (P2):**
- [ ] Fichier: `frontend/src/components/AvailabilityBadge.tsx`
- [ ] Fichier: `frontend/src/components/AvailabilityCalendar.tsx`
- [ ] Hook custom: `useAvailabilities()` → auto-refresh 5min
- [ ] Intégration search page + détail page
- [ ] Tests E2E Playwright
- [ ] Responsive design (mobile-first)

**Tâches techniques:**
- [ ] Créer composants React/Vue
- [ ] Hook API `useAvailabilities`
- [ ] Auto-refresh toutes les 5 min
- [ ] Tests E2E
- [ ] Styling (Tailwind)

---

## 🔄 Flux Complet: Airflow → Backend → Frontend

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. AIRFLOW (P1 - Data Lead)                                     │
│    DAG: recuperation_disponibilites                             │
│    Schedule: Toutes les 30 min                                  │
│    Source: APIs/data.gouv.fr/scraping                           │
│    Output: MongoDB collection `availabilities`                  │
│    ↓                                                             │
├─────────────────────────────────────────────────────────────────┤
│ 2. BACKEND (P3 - Backend Lead)                                  │
│    GET /api/hebergements/:id/availabilities                     │
│    GET /api/availabilities/search?dates=...&regions=...         │
│    ↓                                                             │
├─────────────────────────────────────────────────────────────────┤
│ 3. FRONTEND (P2 - Frontend Lead)                                │
│    ✅ AvailabilityBadge (search results)                        │
│    ✅ AvailabilityCalendar (fiche détail)                       │
│    ✅ Auto-refresh toutes les 5 min                             │
│    ✅ Mobile-responsive                                         │
│    ↓                                                             │
├─────────────────────────────────────────────────────────────────┤
│ 4. UTILISATEUR VOIT                                             │
│    ✅ "5/7 jours disponibles"                                   │
│    ✅ Calendrier avec couleurs 🟢🔴⚪                             │
│    ✅ Prix réel par jour                                        │
│    ✅ Données mises à jour chaque 30 min (Airflow)              │
│    ✅ Interface actualise chaque 5 min                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Dépendances & Timeline

```
J1: ✅ PRD, Architecture, Epics

J2: ⏳ [AVAIL-01.01 + AVAIL-01.02]
    └─ Data Lead: Créer collection MongoDB + DAG Airflow
    
J3: ⏳ [AVAIL-01.03] (après J2)
    └─ Backend Lead: API endpoints
    
J4-5: ⏳ [AVAIL-01.04] (après J3)
    └─ Frontend Lead: UI Calendrier + Badges

J6-7: ✅ Tests + Intégration
```

---

## 🎯 Résumé Changements

| Élément | Avant | Après |
|---------|-------|-------|
| **Épics** | 8 | **9** (ajout AVAIL-01) |
| **Stories** | 30 | **34** (ajout 4 stories) |
| **MongoDB collections** | 3 | **4** (ajout availabilities) |
| **Backend endpoints** | 12 | **14** (ajout 2 endpoints) |
| **Frontend components** | 20 | **22** (ajout 2 components) |
| **DAGs Airflow** | 3 | **3** (recuperation_disponibilites existe!) |

---

## ✅ Checklist Intégration

- [ ] Ajouter AVAIL-01 aux Epic overview (04-Epics-and-Stories.md)
- [ ] Ajouter 4 stories AVAIL-01.01 → AVAIL-01.04 aux Epic details
- [ ] Mettre à jour ASSIGNMENT-DATA-LEAD.md (tâches J2)
- [ ] Mettre à jour ASSIGNMENT-PM-BACKEND.md (tâches J3)
- [ ] Mettre à jour ASSIGNMENT-FULLSTACK-FRONTEND.md (tâches J4-5)
- [ ] Ajouter tâches au plan de sprint
- [ ] Créer fichiers story détaillés (une par story)

---

**🚀 PRÊT À INTÉGRER AUX ASSIGNMENTS!**

