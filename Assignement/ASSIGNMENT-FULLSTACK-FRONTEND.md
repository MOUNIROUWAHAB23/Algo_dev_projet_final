# 📋 ASSIGNMENT - Fullstack Developer #2 (Frontend Lead)

**Rôle:** Développeur Frontend (React/Vite)
**Durée Totale:** 20 heures
**Dates:** 29 Mars - 5 Avril 2026
**Equipe:** 5 personnes (vous + 4 collègues)

---

## 🎯 VOTRE MISSION

Vous êtes le **Frontend Lead**. Vous développez toutes les pages React et assurez une UX excellent.

---

## 📅 PHASE 2 - Préparation Backend (29 Mars, 2h)

### Tâche 2.5: API /reviews (avis)
**Durée:** 2 heures
**Importance:** HAUTE

**Coordonné avec:** Backend Lead (code review)

**API Spec:**
```
GET /api/hebergements/:id/reviews
Response:
{
  "data": [
    {
      "id": "...",
      "hebergementId": "...",
      "userId": "...",
      "author": "Jean D.",
      "rating": 5,
      "title": "Excellent!",
      "text": "Un endroit magnifique...",
      "createdAt": "2024-03-27T10:30:00Z"
    }
  ]
}

POST /api/hebergements/:id/reviews
Body:
{
  "rating": 5,
  "title": "Excellent!",
  "text": "Un endroit magnifique..."
}
Response: { "id": "...", "status": "created" }

DELETE /api/reviews/:id
Response: { "status": "deleted" }
```

**Étapes:**

1. **Créer route** (30 min)
```javascript
// backend/src/routes/reviews.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');

// GET reviews for accommodation
router.get('/hebergements/:id/reviews', async (req, res) => {
  try {
    const reviews = await db.collection('reviews')
      .find({ hebergementId: req.params.id })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();
    
    res.json({ data: reviews });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST new review (require auth)
router.post('/hebergements/:id/reviews', authenticate, async (req, res) => {
  try {
    const { rating, title, text } = req.body;
    
    const result = await db.collection('reviews').insertOne({
      hebergementId: req.params.id,
      userId: req.user.id,
      author: req.user.name,
      rating,
      title,
      text,
      createdAt: new Date()
    });
    
    res.json({ id: result.insertedId, status: 'created' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE review
router.delete('/reviews/:id', authenticate, async (req, res) => {
  try {
    const review = await db.collection('reviews').findOne({ _id: req.params.id });
    
    if (review.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    await db.collection('reviews').deleteOne({ _id: req.params.id });
    res.json({ status: 'deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

2. **Intégrer dans app.js** (15 min)
```javascript
const reviewRoutes = require('./routes/reviews');
app.use('/api', reviewRoutes);
```

3. **Tests** (1h 15 min)
```javascript
// tests/reviews.test.js
describe('Reviews API', () => {
  it('should get reviews for accommodation', async () => {
    const res = await request(app)
      .get('/api/hebergements/123/reviews');
    
    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
  });
  
  it('should post new review (auth required)', async () => {
    const res = await request(app)
      .post('/api/hebergements/123/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send({
        rating: 5,
        title: 'Great!',
        text: 'Excellent place'
      });
    
    expect(res.status).toBe(200);
    expect(res.body.id).toBeDefined();
  });
  
  it('should deny review without auth', async () => {
    const res = await request(app)
      .post('/api/hebergements/123/reviews')
      .send({ rating: 5, title: 'Great!' });
    
    expect(res.status).toBe(401);
  });
});
```

**Acceptance Criteria:**
- [ ] GET reviews fonctionne
- [ ] POST reviews fonctionne (auth required)
- [ ] DELETE reviews fonctionne (propriétaire ou admin)
- [ ] Tests unitaires passent
- [ ] Response time < 500ms

**Blockers:**
- ⚠️ Auth middleware (JWT) doit être implémenté (Frontend Lead: coordonnez avec Backend)

---

## 📅 PHASE 2B - UI Composants Disponibilités (30-31 Mars = 2 jours, 4h)

### Tâche 2.6: Composant AvailabilityBadge
**Durée:** 1 heure 30 min
**Importance:** HAUTE

**Description:**
Afficher badge dispo/indispo en search results.

**Fichier:** `frontend/src/components/AvailabilityBadge.tsx` (NEW)

**Implémentation:**
```typescript
import React, { useState, useEffect } from 'react';
import { useAvailabilities } from '../hooks/useAvailabilities';

interface AvailabilityBadgeProps {
  hebergement_id: string;
  startDate: Date;
  endDate: Date;
}

export const AvailabilityBadge: React.FC<AvailabilityBadgeProps> = ({
  hebergement_id,
  startDate,
  endDate
}) => {
  const { availabilities, loading } = useAvailabilities(
    hebergement_id,
    startDate,
    endDate
  );

  const getAvailabilityCount = () => {
    if (!availabilities) return 0;
    return availabilities.filter(a => a.status === 'available').length;
  };

  const totalDays = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)
  );
  const availableCount = getAvailabilityCount();

  if (loading) {
    return <div className="badge badge-skeleton" />;
  }

  if (availableCount === totalDays) {
    return (
      <span className="badge badge-success">
        ✅ {availableCount}/{totalDays} jours disponibles
      </span>
    );
  } else if (availableCount === 0) {
    return (
      <span className="badge badge-danger">
        ❌ Complet pour cette période
      </span>
    );
  } else {
    return (
      <span className="badge badge-warning">
        ⚪ {availableCount}/{totalDays} jours disponibles
      </span>
    );
  }
};

export default AvailabilityBadge;
```

**Utilisation en Search Results:**
```jsx
// frontend/src/pages/Search.jsx
<div className="result-card">
  <h3>{item.nom}</h3>
  <p>{item.commune}, {item.region}</p>
  
  {/* ADD THIS: */}
  <AvailabilityBadge 
    hebergement_id={item.id}
    startDate={new Date(searchParams.get('start'))}
    endDate={new Date(searchParams.get('end'))}
  />
  
  <p>${item.price}/nuit</p>
</div>
```

**Styling (Tailwind):**
```css
.badge {
  @apply inline-block px-3 py-1 rounded-full text-sm font-bold;
}

.badge-success {
  @apply bg-green-100 text-green-900;
}

.badge-danger {
  @apply bg-red-100 text-red-900;
}

.badge-warning {
  @apply bg-yellow-100 text-yellow-900;
}

.badge-skeleton {
  @apply h-6 w-24 bg-gray-200 rounded-full animate-pulse;
}
```

**Tâches:**
- [ ] Créer composant
- [ ] Intégrer hook `useAvailabilities`
- [ ] Styling (Tailwind)
- [ ] Tests (React Testing Library)

**Acceptance Criteria:**
- [ ] Badge affiche count correct
- [ ] Styling 🟢🔴⚪ visible
- [ ] Loading state fonctionnel
- [ ] Tests: 80%+ coverage

---

### Tâche 2.7: Hook useAvailabilities + Composant Calendar
**Durée:** 2 heures 30 min
**Importance:** CRITIQUE

**Partie 1: Hook useAvailabilities**
```typescript
// frontend/src/hooks/useAvailabilities.ts
import { useState, useEffect } from 'react';
import api from '../api/client';

interface Availability {
  date_debut: string;
  date_fin: string;
  status: 'available' | 'unavailable' | 'unknown';
  prix_min?: number;
  prix_max?: number;
}

export const useAvailabilities = (
  hebergement_id: string,
  startDate: Date,
  endDate: Date
) => {
  const [availabilities, setAvailabilities] = useState<Availability[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAvailabilities = async () => {
      try {
        setLoading(true);
        const response = await api.get(
          `/hebergements/${hebergement_id}/availabilities`,
          {
            params: {
              start: startDate.toISOString().split('T')[0],
              end: endDate.toISOString().split('T')[0]
            }
          }
        );
        setAvailabilities(response.data.availabilities);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchAvailabilities();

    // Auto-refresh toutes les 5 min
    const interval = setInterval(fetchAvailabilities, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [hebergement_id, startDate, endDate]);

  return { availabilities, loading, error };
};
```

**Partie 2: Composant AvailabilityCalendar**
```typescript
// frontend/src/components/AvailabilityCalendar.tsx
import React, { useState } from 'react';
import { useAvailabilities } from '../hooks/useAvailabilities';

interface AvailabilityCalendarProps {
  hebergement_id: string;
  month: string; // "2026-04"
  onDateSelect?: (date: Date) => void;
}

export const AvailabilityCalendar: React.FC<AvailabilityCalendarProps> = ({
  hebergement_id,
  month,
  onDateSelect
}) => {
  const [startDate, setStartDate] = useState(new Date(month));
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 1);

  const { availabilities } = useAvailabilities(hebergement_id, startDate, endDate);

  const getStatusForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const availability = availabilities?.find(
      a => a.date_debut.split('T')[0] === dateStr
    );
    return availability?.status || 'unknown';
  };

  const getDayColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-900';
      case 'unavailable':
        return 'bg-red-100 text-red-900';
      default:
        return 'bg-gray-100 text-gray-900';
    }
  };

  const statusEmoji = {
    available: '🟢',
    unavailable: '🔴',
    unknown: '⚪'
  };

  return (
    <div className="availability-calendar">
      <h3 className="text-lg font-bold mb-4">{month}</h3>
      <div className="grid grid-cols-7 gap-2">
        {/* Days header */}
        {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(day => (
          <div key={day} className="text-center font-bold text-sm">
            {day}
          </div>
        ))}
        
        {/* Calendar grid */}
        {Array.from({ length: 30 }, (_, i) => {
          const date = new Date(startDate);
          date.setDate(date.getDate() + i);
          const status = getStatusForDate(date);
          
          return (
            <div
              key={date.toISOString()}
              className={`calendar-day ${getDayColor(status)} cursor-pointer p-2 rounded text-center hover:shadow-md transition`}
              onClick={() => onDateSelect?.(date)}
            >
              <div className="font-bold">{date.getDate()}</div>
              <div className="text-lg">{statusEmoji[status]}</div>
            </div>
          );
        })}
      </div>
      
      {/* Legend */}
      <div className="flex gap-4 mt-4 text-sm">
        <div className="flex items-center gap-2">
          <span>🟢</span>
          <span>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <span>🔴</span>
          <span>Booked</span>
        </div>
        <div className="flex items-center gap-2">
          <span>⚪</span>
          <span>Unknown</span>
        </div>
      </div>
    </div>
  );
};

export default AvailabilityCalendar;
```

**Intégration en Fiche Détail:**
```jsx
// frontend/src/pages/Detail.jsx
<div className="mt-8 border-t pt-6">
  <h2 className="text-xl font-bold mb-4">Disponibilités</h2>
  
  <AvailabilityCalendar
    hebergement_id={id}
    month="2026-04"
    onDateSelect={handleDateSelect}
  />
  
  <p className="mt-4 text-sm text-gray-600">
    Dernière mise à jour: il y a {minutesSinceUpdate} minutes
  </p>
</div>
```

**Tâches:**
- [ ] Créer hook `useAvailabilities`
- [ ] Créer composant `AvailabilityCalendar`
- [ ] Styling responsif (7 jours mobile, 30 jours desktop)
- [ ] Auto-refresh logic (5 min)
- [ ] Tests

**Acceptance Criteria:**
- [ ] Hook auto-refresh toutes les 5 min ✅
- [ ] Calendar affiche 30+ jours ✅
- [ ] Clic sur date appelle callback ✅
- [ ] Couleurs: 🟢🔴⚪ visibles ✅
- [ ] Responsive mobile (7 jours max) ✅
- [ ] Tests: 80%+ coverage ✅

---

## 📅 PHASE 3 - Frontend Pages (1-3 Avril = 3 jours, 14h)

### Tâche 3.1: Home Page
**Durée:** 2 heures
**Importance:** CRITIQUE

**Description:**
Landing page avec recherche principale.

**Design:**
```
┌─────────────────────────────────────┐
│        Logo    |    Login/Register   │
├─────────────────────────────────────┤
│                                     │
│   Welcome to Hebergements Touristiques
│   Find your perfect accommodation   │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ Search [Paris________] [GO]   │  │
│  └───────────────────────────────┘  │
│                                     │
│  Popular destinations:              │
│  [Paris] [Lyon] [Marseille] [Nice]  │
│                                     │
│  Recent reviews:                    │
│  ⭐⭐⭐⭐⭐ "Excellent!" - Hotel X     │
│  ⭐⭐⭐⭐ "Good value" - Camping Y    │
│                                     │
└─────────────────────────────────────┘
```

**Stack:**
- React Router (pages)
- TailwindCSS (styling)
- React Query (data fetching)

**Code Structure:**
```javascript
// frontend/src/pages/Home.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import PopularDestinations from '../components/PopularDestinations';
import RecentReviews from '../components/RecentReviews';

export default function Home() {
  const navigate = useNavigate();
  
  const handleSearch = (query) => {
    navigate(`/search?q=${query}`);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <header className="bg-white shadow">
        <nav className="max-w-7xl mx-auto px-4 py-4 flex justify-between">
          <h1 className="text-2xl font-bold text-blue-600">🏨 Hebergements</h1>
          <div>
            <button className="text-blue-600 mr-4">Login</button>
            <button className="bg-blue-600 text-white px-4 py-2 rounded">Register</button>
          </div>
        </nav>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-4xl font-bold text-center mb-4">Trouvez votre hébergement idéal</h2>
        <p className="text-center text-gray-600 mb-8">45 000+ hébergements en France</p>
        
        <SearchBar onSearch={handleSearch} />
        
        <PopularDestinations />
        <RecentReviews />
      </main>
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Page charge < 2s
- [ ] Search bar fonctionne
- [ ] Responsive design (mobile/desktop)
- [ ] Links vers login/register
- [ ] SEO: meta tags présents

---

### Tâche 3.2: Search Results Page
**Durée:** 3 heures
**Importance:** CRITIQUE

**Description:**
Affiche résultats avec filtres et pagination.

**Design:**
```
┌──────────────────────────────────────────┐
│  Search: "Paris" [Go Back]               │
├──────────────────────────────────────────┤
│ Filters:  │  Results:                    │
│ Type:     │  1. Hotel X - 4.5⭐ (120 avis)
│ ○ All    │     Paris 75001               │
│ ○ Hotel  │     $89/night                 │
│ ○ Camping│  2. Camping Y - 3.8⭐ (45 avis)
│ ○ Auberge│     Paris 75002               │
│           │     $35/night                 │
│ Stars:   │  [More] [Load 20 more]        │
│ ○ All    │                               │
│ ○ 5⭐    │                               │
│ ○ 4⭐+   │                               │
│           │                               │
│ Region:  │                               │
│ ○ IDF    │                               │
│ ○ PACA   │                               │
│ ○ ...    │                               │
│           │                               │
│ [Reset]   │                               │
└──────────────────────────────────────────┘
```

**Code:**
```javascript
// frontend/src/pages/Search.jsx
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import axios from 'axios';
import ResultCard from '../components/ResultCard';
import FilterSidebar from '../components/FilterSidebar';

export default function Search() {
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    type: null,
    stars: null,
    region: null,
    limit: 20,
    offset: 0
  });
  
  const q = searchParams.get('q') || '';
  
  const { data, isLoading, error } = useQuery(
    ['hebergements', q, filters],
    () => axios.get('/api/hebergements', {
      params: { q, ...filters }
    }).then(res => res.data)
  );
  
  return (
    <div className="flex gap-6 max-w-7xl mx-auto px-4 py-6">
      <aside className="w-64 flex-shrink-0">
        <FilterSidebar filters={filters} setFilters={setFilters} />
      </aside>
      
      <main className="flex-1">
        <h2 className="text-2xl font-bold mb-4">
          {data?.total || 0} résultats pour "{q}"
        </h2>
        
        {isLoading && <p>Loading...</p>}
        {error && <p className="text-red-500">Error: {error.message}</p>}
        
        <div className="space-y-4">
          {data?.data.map(item => (
            <ResultCard key={item.id} item={item} />
          ))}
        </div>
        
        {data && data.offset + data.limit < data.total && (
          <button 
            className="mt-6 px-6 py-2 bg-blue-600 text-white rounded"
            onClick={() => setFilters(prev => ({
              ...prev,
              offset: prev.offset + prev.limit
            }))}
          >
            Load more
          </button>
        )}
      </main>
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Résultats affichés < 1s
- [ ] Filtres fonctionnent
- [ ] Pagination marche
- [ ] Responsive design
- [ ] Click sur résultat → détail page

---

### Tâche 3.3: Detail Page
**Durée:** 3 heures
**Importance:** CRITIQUE

**Description:**
Fiche détaillée d'un hébergement + avis + carte.

**Design:**
```
┌────────────────────────────────────────┐
│ < Back to Search | Share | ❤️ Favorite│
├────────────────────────────────────────┤
│ [Large Image Gallery]                  │
├────────────────────────────────────────┤
│ Hotel X                          4.5⭐ │
│ Paris 75001 | 120 avis           $89   │
│ ⚡ Free WiFi | 🚗 Parking | ☕ Restaurant
│                                        │
│ Description:                           │
│ Un hôtel 4 étoiles situé au cœur...  │
│                                        │
│ [📍 Map] [☎️ Call] [🌐 Website]       │
│                                        │
│ ─────────────────────────────────────  │
│ Reviews: 120 total                    │
│ [New Review Button] (if logged in)    │
│                                        │
│ ⭐⭐⭐⭐⭐ "Amazing!" - Jean D.        │
│ "Excellent service..."                │
│ Helpful: 5 | Report                   │
│                                        │
│ ⭐⭐⭐⭐ "Good value"  - Marie L.      │
│ "Nice place, a bit noisy..."          │
│ Helpful: 2 | Report                   │
│                                        │
│ [Load 10 more reviews]                │
└────────────────────────────────────────┘
```

**Code:**
```javascript
// frontend/src/pages/Detail.jsx
import { useParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import axios from 'axios';
import ImageGallery from '../components/ImageGallery';
import ReviewList from '../components/ReviewList';
import ReviewForm from '../components/ReviewForm';
import Map from '../components/Map';

export default function Detail() {
  const { id } = useParams();
  
  const { data: hebergement, isLoading } = useQuery(
    ['hebergement', id],
    () => axios.get(`/api/hebergements/${id}`).then(res => res.data)
  );
  
  if (isLoading) return <p>Loading...</p>;
  if (!hebergement) return <p>Not found</p>;
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <ImageGallery images={hebergement.images} />
      
      <div className="mt-6 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">{hebergement.nom}</h1>
          <p className="text-gray-600">
            {hebergement.adresse} {hebergement.codePostal}
          </p>
          <div className="flex gap-2 mt-2">
            <span className="text-xl">{'⭐'.repeat(hebergement.stars)}</span>
            <span>{hebergement.reviewCount} avis</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold">${hebergement.price}/nuit</p>
          <button className="mt-2 px-6 py-2 bg-blue-600 text-white rounded">
            Reserve
          </button>
        </div>
      </div>
      
      <div className="mt-8 grid grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-bold mb-4">About</h2>
          <p className="text-gray-700">{hebergement.description}</p>
          
          <h3 className="text-lg font-bold mt-6 mb-2">Amenities</h3>
          <div className="grid grid-cols-2 gap-2">
            {hebergement.amenities?.map(a => <p key={a}>✓ {a}</p>)}
          </div>
        </div>
        
        <div>
          <Map lat={hebergement.latitude} lng={hebergement.longitude} />
          
          <div className="mt-6 space-y-2">
            <a href={`tel:${hebergement.telephone}`} className="block">
              ☎️ {hebergement.telephone}
            </a>
            <a href={hebergement.website} target="_blank" className="block">
              🌐 {hebergement.website}
            </a>
          </div>
        </div>
      </div>
      
      <div className="mt-8 border-t pt-6">
        <h2 className="text-2xl font-bold mb-4">Reviews ({hebergement.reviewCount})</h2>
        
        <ReviewForm hebergementId={id} />
        
        <ReviewList hebergementId={id} />
      </div>
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Détails affichés correctly
- [ ] Images gallery fonctionne
- [ ] Avis affichés
- [ ] Map intégrée (Leaflet or Google Maps)
- [ ] Call/Website links fonctionnent
- [ ] Responsive design

---

### Tâche 3.4: Authentication Pages
**Durée:** 2 heures
**Importance:** HAUTE

**Description:**
Login et Register pages.

**Pages:**
- `/login` - Login form
- `/register` - Registration form

**Design:**
```
┌─────────────────────────┐
│  Hebergements           │
│                         │
│  Sign Up                │
│                         │
│ Email: [_____________]  │
│ Pwd:   [_____________]  │
│        [Show Password]   │
│ Pwd2:  [_____________]  │
│        [Show Password]   │
│                         │
│ [Register] [Back]       │
│                         │
│ Already have account?   │
│ [Sign In]               │
└─────────────────────────┘
```

**Code:**
```javascript
// frontend/src/pages/Register.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

export default function Register() {
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    try {
      const res = await axios.post('/api/auth/register', {
        email: form.email,
        password: form.password
      });
      
      localStorage.setItem('token', res.data.token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow w-96">
        <h1 className="text-2xl font-bold mb-6">Create Account</h1>
        
        {error && <p className="text-red-500 mb-4">{error}</p>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full border rounded px-3 py-2"
            value={form.email}
            onChange={(e) => setForm({...form, email: e.target.value})}
            required
          />
          
          <input
            type="password"
            placeholder="Password"
            className="w-full border rounded px-3 py-2"
            value={form.password}
            onChange={(e) => setForm({...form, password: e.target.value})}
            required
          />
          
          <input
            type="password"
            placeholder="Confirm Password"
            className="w-full border rounded px-3 py-2"
            value={form.confirmPassword}
            onChange={(e) => setForm({...form, confirmPassword: e.target.value})}
            required
          />
          
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded font-bold"
          >
            Register
          </button>
        </form>
        
        <p className="mt-4 text-center">
          Already have account?
          <Link to="/login" className="text-blue-600 ml-2">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Forms validate input
- [ ] Passwords match check
- [ ] Success: redirect to home
- [ ] Error messages affichés
- [ ] JWT stored in localStorage

---

### Tâche 3.5: Dashboard Page
**Durée:** 2 heures
**Importance:** MOYENNE

**Description:**
User dashboard avec favoris, avis, etc.

**Features:**
- Voir mes favoris
- Voir mes avis
- Parametres de compte
- Logout

**Code:**
```javascript
// frontend/src/pages/Dashboard.jsx
import { useQuery } from 'react-query';
import { useAuth } from '../hooks/useAuth';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { data: favorites } = useQuery('favorites', 
    () => axios.get('/api/favorites').then(r => r.data)
  );
  const { data: reviews } = useQuery('my-reviews',
    () => axios.get('/api/reviews/mine').then(r => r.data)
  );
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-6">Welcome, {user?.name}</h1>
      
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-bold mb-3">My Favorites</h2>
          {favorites?.map(f => (
            <div key={f.id} className="border p-3 rounded mb-2">
              <p className="font-bold">{f.nom}</p>
              <Link to={`/hebergement/${f.id}`} className="text-blue-600">
                View details →
              </Link>
            </div>
          ))}
        </div>
        
        <div>
          <h2 className="text-xl font-bold mb-3">My Reviews</h2>
          {reviews?.map(r => (
            <div key={r.id} className="border p-3 rounded mb-2">
              <p className="font-bold">{r.title}</p>
              <p className="text-sm text-gray-600">★{'★'.repeat(r.rating)}</p>
              <p className="text-sm">{r.text.substring(0, 80)}...</p>
            </div>
          ))}
        </div>
      </div>
      
      <div className="mt-8 border-t pt-6">
        <h2 className="text-xl font-bold mb-4">Account Settings</h2>
        <button className="bg-gray-600 text-white px-6 py-2 rounded">
          Edit Profile
        </button>
        <button
          className="ml-2 bg-red-600 text-white px-6 py-2 rounded"
          onClick={logout}
        >
          Logout
        </button>
      </div>
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Affiche favoris de l'utilisateur
- [ ] Affiche ses avis
- [ ] Logout fonctionne
- [ ] Protégé par auth (redirect si pas connecté)

---

### Tâche 3.6: Analytics Dashboard
**Durée:** 2 heures
**Importance:** BASSE

**Description:**
Page publique avec statistiques globales.

**Features:**
- Total accommodations: 45,000+
- Breakdown par type (hotel, camping, etc.)
- Breakdown par région
- Moyenne avis

**Code:**
```javascript
// frontend/src/pages/Analytics.jsx
import { useQuery } from 'react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

export default function Analytics() {
  const { data: stats } = useQuery('analytics',
    () => axios.get('/api/analytics/summary').then(r => r.data)
  );
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-6">Statistiques</h1>
      
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-100 p-4 rounded">
          <p className="text-gray-600">Total Accommodations</p>
          <p className="text-3xl font-bold">{stats?.totalAccommodations}</p>
        </div>
        <div className="bg-green-100 p-4 rounded">
          <p className="text-gray-600">Avg Rating</p>
          <p className="text-3xl font-bold">⭐ {stats?.avgRating}</p>
        </div>
        <div className="bg-purple-100 p-4 rounded">
          <p className="text-gray-600">Total Reviews</p>
          <p className="text-3xl font-bold">{stats?.totalReviews}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-bold mb-4">By Type</h2>
          <BarChart data={Object.entries(stats?.byType || {}).map(([k, v]) => ({
            name: k,
            count: v
          }))}>
            <CartesianGrid />
            <XAxis dataKey="name" />
            <YAxis />
            <Bar dataKey="count" fill="#3b82f6" />
          </BarChart>
        </div>
        
        <div>
          <h2 className="text-xl font-bold mb-4">By Region</h2>
          {/* Similar chart */}
        </div>
      </div>
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Charts affichent les bonnes données
- [ ] Responsive sur mobile
- [ ] Data actualise à chaque visite

---

## 📅 PHASE 4 - Integration Tests (4-5 Avril)

### Tâche 4.3: Frontend E2E Tests
**Durée:** 3 heures (déjà estimée dans 3.8)

**Technologie:** Playwright

```bash
npm run test:e2e

# Ou manuellement:
npx playwright test
```

**Scenarios à tester:**
1. **Home Page**
   - Page charge
   - Search bar présent
   - Can click on destinations

2. **Search Flow**
   - Type "Paris"
   - Click search
   - See 100+ results
   - Can click result

3. **Detail Page**
   - Click result from search
   - See accommodations details
   - See reviews
   - See map

4. **Authentication**
   - Register new user
   - Login with that user
   - Access dashboard
   - Logout

5. **Favorites**
   - Click heart icon
   - Add to favorites
   - See in dashboard
   - Remove from favorites

6. **Reviews**
   - Click "Write Review" on detail page
   - Form validation (require rating + text)
   - Submit review
   - See review in list

**Code Sample:**
```javascript
// tests/e2e/search.spec.js
import { test, expect } from '@playwright/test';

test.describe('Search Flow', () => {
  test('should search and view results', async ({ page }) => {
    // Navigate to home
    await page.goto('http://localhost:5173');
    
    // Search
    await page.fill('[placeholder="Search"]', 'Paris');
    await page.click('button:has-text("Search")');
    
    // Check results
    await page.waitForSelector('[data-testid="result-card"]');
    const results = await page.locator('[data-testid="result-card"]').count();
    expect(results).toBeGreaterThan(0);
    
    // Click first result
    await page.click('[data-testid="result-card"]:first-child');
    
    // Should be on detail page
    await expect(page).toHaveURL(/\/hebergement\/\d+/);
    
    // Should see details
    await expect(page.locator('h1')).toBeTruthy();
  });
});
```

**Acceptance Criteria:**
- [ ] Tous les scenarios passent
- [ ] Tests exécutés en < 5 min
- [ ] Screenshots sauvegardées en cas d'erreur
- [ ] CI/CD intégration (GitHub Actions)

---

### Tâche 4.4: Performance Audit
**Durée:** 1 heure (partagé avec Backend Lead)

**Metrics:**
- Lighthouse score > 80
- First Contentful Paint < 2s
- Largest Contentful Paint < 3s
- Search response < 1s

**Tools:**
```bash
# Lighthouse CLI
npm install -g lighthouse
lighthouse https://localhost:5173 --view

# Or in Google Chrome DevTools
# F12 → Lighthouse tab
```

---

## 📅 PHASE 5 - Deployment (5 Avril)

### Tâche 5.1: Vercel Deployment
**Durée:** 1 heure
**Importance:** CRITIQUE

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login to Vercel
vercel login

# 3. Deploy
cd frontend
vercel deploy --prod

# 4. Config environment variables in Vercel dashboard
VITE_API_URL=https://api.render-app.com
```

**Acceptance Criteria:**
- [ ] Site deployed at vercel.com
- [ ] HTTPS works
- [ ] Frontend can call Backend APIs
- [ ] No console errors

---

### Tâche 5.2: Final Verification
**Durée:** 30 min

```bash
# Test live site
# 1. https://yoursite.vercel.app loads
# 2. Search works
# 3. Detail page works
# 4. Login/Register works
# 5. Can write review
# 6. Can add favorite
```

---

## 📅 PHASE 6 - Soutenance (6-7 Avril)

### Tâche 6.3: Record Demo Video
**Durée:** 1 heure

**Script:**
1. "Open homepage"
2. "Search for Paris"
3. "Click on a result"
4. "Show the reviews"
5. "Show the map"
6. "Go to dashboard"
7. "Show my favorites"
8. "Questions?"

**Tools:**
- OBS Studio (free) or Loom
- Record in 1080p
- Keep < 10 min total

---

## 📊 RÉSUMÉ VOTRE TÂCHES

| Phase | Tâches | Durée | Status |
|-------|--------|-------|--------|
| 2 | Reviews API | 2h | ⏳ |
| 3 | 6 Pages | 14h | ⏳ |
| 4 | E2E Tests + Perf | 4h | ⏳ |
| 5 | Deployment | 1h | ⏳ |
| 6 | Demo Video | 1h | ⏳ |
| **TOTAL** | **Frontend Development** | **22h** | |

---

## 🎯 SUCCESS CRITERIA

- [ ] All 6 pages implemented
- [ ] E2E tests passing
- [ ] Lighthouse > 80
- [ ] Deployed on Vercel
- [ ] Live at production URL
- [ ] Responsive (mobile/desktop)
- [ ] 0 console errors

---

**Assigné à:** Fullstack Developer #2
**Créé:** 28 Mars 2026, 22:00 UTC
**Status:** 🟢 Ready to coordinate with Backend

**Next:** Attendez Backend lead pour API /reviews, puis lancez Pages 🚀
