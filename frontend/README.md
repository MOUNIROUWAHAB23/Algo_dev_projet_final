# Frontend - Airbnb Clone

Application React développée avec **Vite**, **React Router** et **TailwindCSS** pour une application de type Airbnb.

## Prérequis

- Node.js (v18 ou supérieur)
- npm ou yarn
- Backend API running (voir `/backend/README.md`)

## Installation

1. **Cloner le repository et accéder au dossier frontend**

```bash
cd frontend
```

2. **Installer les dépendances**

```bash
npm install / npm install --legacy-peer-deps (pour forcer)
```

3. **Configurer le proxy API**

Le fichier `vite.config.js` configure le proxy vers le backend :

```javascript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3500',  // Port du backend
      changeOrigin: true
    }
  }
}
```

## Structure du projet

```
frontend/
├── index.html            # Point d'entrée HTML
├── vite.config.js        # Configuration Vite + proxy API
├── tailwind.config.js    # Configuration TailwindCSS
├── postcss.config.js     # Configuration PostCSS
├── src/
│   ├── main.jsx          # Point d'entrée React
│   ├── App.jsx           # Composant principal avec routing
│   ├── index.css         # Styles globaux + Tailwind
│   ├── api/
│   │   └── axios.js      # Configuration Axios (intercepteurs, baseURL)
│   ├── components/
│   │   ├── Header.jsx          # Barre de navigation
│   │   ├── ProtectedRoute.jsx  # Route protégée par authentification
│   │   └── hebergement/
│   │       ├── AccommodationCard.jsx   # Carte d'hébergement
│   │       ├── FilterPanel.jsx         # Panneau de filtres
│   │       ├── FilterSelect.jsx        # Selecteur de filtre
│   │       ├── Pagination.jsx          # Pagination
│   │       ├── SearchBar.jsx           # Barre de recherche
│   │       ├── LocationSection.jsx     # Section localisation
│   │       ├── CapacitySection.jsx     # Section capacité
│   │       ├── AmenitiesSection.jsx    # Section équipements
│   │       ├── ContactSection.jsx      # Section contact
│   │       └── MetadataSection.jsx     # Section metadata
│   ├── context/
│   │   └── AuthContext.jsx # Contexte d'authentification
│   ├── hooks/
│   │   ├── useAuth.js            # Hook personnalisé auth
│   │   ├── useHebergements.js    # Hook personnalisé hébergements
│   │   └── useHebergementDetail.js # Hook détail hébergement
│   ├── pages/
│   │   ├── HomePage.jsx          # Page d'accueil (liste)
│   │   ├── Login.jsx             # Page de connexion
│   │   ├── Register.jsx          # Page d'inscription
│   │   ├── AccommodationPage.jsx # Page détail hébergement
│   │   ├── FavoritesPage.jsx     # Page des favoris
│   │   └── AdminPage.jsx         # Page d'administration
│   └── services/
│       ├── auth.service.js       # Service API auth
│       └── hebergement.service.js # Service API hébergements
```

## Scripts disponibles

| Commande          | Description                            |
| ----------------- | -------------------------------------- |
| `npm run dev`     | Lance le serveur de développement Vite |
| `npm run build`   | Build de production                    |
| `npm run preview` | Prévisualisation du build              |

## Pages de l'application

| Page              | Route              | Description                         | Accès       |
| ----------------- | ------------------ | ----------------------------------- | ----------- |
| HomePage          | `/`                | Liste des hébergements avec filtres | Public      |
| Login             | `/login`           | Formulaire de connexion             | Public      |
| Register          | `/register`        | Formulaire d'inscription            | Public      |
| AccommodationPage | `/hebergement/:id` | Détail d'un hébergement             | Public      |
| FavoritesPage     | `/favorites`       | Liste des favoris                   | Authentifié |
| AdminPage         | `/admin`           | Panneau d'administration            | Admin       |

## Authentification

L'authentification utilise un **Context React** (`AuthContext`) avec des hooks personnalisés :

- **useAuth** : Gestion de l'état d'authentification (user, login, logout)
- **ProtectedRoute** : Composant HOC pour protéger les routes

### Fonctionnement

1. Le token JWT est stocké dans `localStorage`
2. Le contexte persiste l'état entre les rechargements
3. Les routes protégées redirigent vers `/login` si non authentifié

## Hooks personnalisés

### useAuth

```javascript
const { user, loading, login, register, logout, isAuthenticated } = useAuth();
```

### useHebergements

```javascript
const { hebergements, loading, error, fetchHebergements } = useHebergements();
```

## Composants principaux

### Header

- Navigation responsive
- Menu utilisateur déroulant
- Affichage conditionnel (connecté/non connecté)
- Lien vers favoris et admin (si autorisé)

### FilterPanel

- Recherche textuelle
- Filtres : type, région, classification
- Boutons "Appliquer" et "Réinitialiser"

### AccommodationCard

- Affichage carte hébergement
- Lien vers page de détail
- Informations essentielles (nom, type, localisation)

### ProtectedRoute

- Vérification de l'authentification
- Vérification du rôle (requireAdmin)
- Redirection automatique

## Technologies

- **React 18** - Bibliothèque UI
- **Vite** - Build tool et dev server
- **React Router v6** - Routing
- **Axios** - Client HTTP
- **TailwindCSS** - Framework CSS utilitaire
- **PostCSS** - Transformation CSS

## Architecture

L'application suit les principes **SOLID** :

- **SRP (Single Responsibility)** : Chaque composant/hook/service a une responsabilité unique
- **OCP (Open/Closed)** : Extension par composition de composants
- **DIP (Dependency Inversion)** : Les hooks dépendent d'abstractions (services)

```
Pages (orchestration)
    ↓
Composants (UI)
    ↓
Hooks (logique métier)
    ↓
Services (appels API)
    ↓
Axios (HTTP)
```

## Variables d'environnement

Créez un fichier `.env` à la racine si nécessaire :

```env
VITE_API_URL=http://localhost:3500/api
```

## Démarrage rapide

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

L'application sera disponible sur `http://localhost`

## Flux de données

```
Utilisateur → Page → Hook → Service → Axios → API Backend
                ↓
           Context (Auth)
                ↓
         localStorage (token)
```

---
