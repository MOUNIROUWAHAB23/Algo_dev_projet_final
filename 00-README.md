# 🏠 Plateforme d'Hébergements Touristiques - Open Data

> **Projet de Soutenance - Master Engineering**
>
> Une plateforme qui agrège et valorise les données ouvertes d'hébergements touristiques issues de data.gouv.fr

---

## 📋 Sommaire

1. [Vue d'ensemble](#vue-densemble)
2. [Documentation](#documentation)
3. [Équipe](#équipe)
4. [Roadmap](#roadmap)
5. [Stack Technique](#stack-technique)
6. [Démarrage Rapide](#démarrage-rapide)
7. [Déploiement](#déploiement)

---

## 🎯 Vue d'Ensemble

### Contexte

La France dispose d'un patrimoine touristique exceptionnel avec des milliers d'hébergements (hôtels, campings, résidences, meublés de tourisme). Les données sur ces hébergements sont publiques et accessibles sur **data.gouv.fr**, mais elles sont :
- dispersées dans de multiples datasets
- difficiles à comparer
- peu exploitables pour le grand public

### Solution

Une plateforme web qui **agrège, normalise et rend consultable** l'ensemble des données ouvertes d'hébergements touristiques :

- 📊 **Agrégation automatique** des datasets data.gouv.fr (10+ sources)
- 🔍 **Moteur de recherche** avec filtres avancés
- 🗺️ **Carte interactive** Leaflet/OpenStreetMap
- 📈 **Dashboard analytics** avec statistiques par territoire
- ⭐ **Système d'avis** communautaire
- ❤️ **Favoris** pour sauvegarder ses établissements

### Données Sources

| Source | Type | Enregistrements |
|--------|------|-----------------|
| INSEE | Hôtels | ~18 000 |
| INSEE | Campings | ~8 000 |
| INSEE | Résidences hôtelières | ~2 000 |
| INSEE | Meublés de tourisme | ~15 000 |
| UNAJ | Auberges de jeunesse | ~500 |
| FTVAC | Villages vacances | ~1 000 |

**Total:** 45 000+ hébergements référencés

---

## 📚 Documentation

| Document | Description | Lien |
|----------|-------------|------|
| **Product Brief** | Vision produit, utilisateurs, périmètre | [01-Product-Brief.md](./01-Product-Brief.md) |
| **PRD** | Exigences fonctionnelles et techniques | [02-PRD.md](./02-PRD.md) |
| **Architecture** | Architecture technique (MongoDB) | [03-Architecture.md](./03-Architecture.md) |
| **Epics & Stories** | Backlog détaillé des fonctionnalités | [04-Epics-and-Stories.md](./04-Epics-and-Stories.md) |
| **Roadmap** | Plan détaillé sur 14 jours | [05-Roadmap-14-Jours.md](./05-Roadmap-14-Jours.md) |

---

## 👥 Équipe (5 Développeurs)

| Rôle | Membre | Responsabilités |
|------|--------|-----------------|
| **PM/Lead Backend** | P1 | Architecture, Auth, API, Deployment |
| **Frontend Lead** | P2 | UI/UX, React, Responsive, Animations |
| **Backend Lead** | P3 | Base de données, APIs métier, MongoDB |
| **Fullstack Dev** | P4 | Maps, Data Pipeline, Notifications |
| **QA/UX/Docs** | P5 | Tests, Documentation, Support soutenance |

---

## 📅 Roadmap 14 Jours

### Semaine 1 : MVP Core

| Jour | Focus | Livrables |
|------|-------|-----------|
| **J1** | Cadrage & Initialisation | Repo, MongoDB Atlas, Comptes APIs |
| **J2** | Spécifications & Architecture | PRD, Architecture, Design System |
| **J3** | Authentification | Auth API, Pages Login/Register |
| **J4** | Import data.gouv.fr | 45 000+ hébergements en DB |
| **J5** | Recherche + Filtres | Moteur search, filtres multiples |
| **J6** | Carte Interactive | Leaflet, markers clusterisés |
| **J7** | Fiches Établissements | Pages détail, SEO |

### Semaine 2 : Finalisation

| Jour | Focus | Livrables |
|------|-------|-----------|
| **J8** | Avis + Favoris | Système reviews, favoris |
| **J9** | Dashboard Analytics | Stats, graphiques, export |
| **J10** | Bug Fixes & Polish UX | Stable, Performance |
| **J11** | Tests E2E & Sécurité | Suite Playwright, Audit OWASP |
| **J12** | Déploiement | Vercel + Render + MongoDB Atlas |
| **J13** | Préparation Soutenance | PPT, Démo script, Vidéo |
| **J14** | Répétition & Buffer | PRÊT POUR SOUTENANCE |

---

## 🛠️ Stack Technique

### Frontend
```
React 18 + Next.js 14
TypeScript 5
TailwindCSS + Shadcn/ui
Leaflet + React-Leaflet (cartes)
Recharts (graphiques)
Zustand (state)
React Query (data fetching)
```

### Backend
```
Node.js 20 + Express 5
TypeScript 5
MongoDB Atlas (database)
Mongoose 8 (ODM)
JWT + bcrypt (auth)
Winston (logging)
node-cron (scheduler imports)
papaparse (CSV parsing)
```

### Services Externes
```
data.gouv.fr API (datasets)
Nominatim API (géocodage)
MongoDB Atlas (DB cloud)
Vercel (hosting frontend)
Render (hosting backend)
```

---

## 🚀 Démarrage Rapide

### Prérequis

- Node.js 20+
- npm ou yarn
- Compte MongoDB Atlas (gratuit)

### Installation

```bash
# Cloner le repository
git clone https://github.com/votre-user/votre-projet.git
cd votre-projet

# Frontend
cd frontend
npm install
cp .env.example .env.local
npm run dev

# Backend (nouveau terminal)
cd backend
npm install
cp .env.example .env
# Éditer .env avec MONGODB_URI
npm run dev

# Import des données (une fois)
npm run import:datagouv
```

### Variables d'Environnement

**Frontend (.env.local):**
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**Backend (.env):**
```bash
MONGODB_URI=mongodb+srv://username:password@cluster.xxx.mongodb.net/dbname?retryWrites=true&w=majority
JWT_SECRET=votre_secret_tres_long_et_secure
FRONTEND_URL=http://localhost:3000
PORT=3001
```

---

## 📦 Déploiement

### MongoDB Atlas

1. Créer un compte sur cloud.mongodb.com
2. Créer un cluster M0 (free tier 512MB)
3. Configurer Network Access (0.0.0.0/0 ou IPs Vercel/Render)
4. Copier le connection string
5. Mettre à jour `MONGODB_URI` dans .env backend

### Frontend (Vercel)

1. Pousser le code sur GitHub
2. Importer le projet sur Vercel
3. Configurer `NEXT_PUBLIC_API_URL`
4. Déployer

### Backend (Render)

1. Créer un nouveau Web Service
2. Connecter le repository GitHub
3. Configurer:
   - Build: `npm install && npm run build`
   - Start: `npm start`
4. Ajouter les variables d'environnement
5. Déployer

---

## ✅ Critères de Succès

### Techniques
- [ ] Temps de chargement < 3s
- [ ] API response time < 500ms
- [ ] Test coverage 80%+
- [ ] 0 vulnérabilité critique
- [ ] 45 000+ hébergements en DB

### Métier (Démo)
- [ ] 10+ datasets data.gouv.fr agrégés
- [ ] Recherche fonctionnelle (texte + filtres + carte)
- [ ] Fiche établissement complète
- [ ] Système d'avis opérationnel
- [ ] Dashboard analytics avec graphiques

### Soutenance
- [ ] Présentation 10-15 min prête
- [ ] Démo live scénarisée
- [ ] Vidéo backup enregistrée
- [ ] README GitHub professionnel
- [ ] Documentation complète
- [ ] Attribution data.gouv.fr visible

---

## 📞 Liens Utiles

- **Product Brief:** [01-Product-Brief.md](./01-Product-Brief.md)
- **PRD Complet:** [02-PRD.md](./02-PRD.md)
- **Architecture:** [03-Architecture.md](./03-Architecture.md)
- **Backlog:** [04-Epics-and-Stories.md](./04-Epics-and-Stories.md)
- **Roadmap Détaillée:** [05-Roadmap-14-Jours.md](./05-Roadmap-14-Jours.md)

---

## 📄 Licence

Projet académique - Master Engineering

**Mention légale:** Cette plateforme utilise les données ouvertes de data.gouv.fr sous licence [Open Database License (ODbL)](https://www.data.gouv.fr/fr/licences/).

---

**Dernière mise à jour:** 27 Mars 2026
