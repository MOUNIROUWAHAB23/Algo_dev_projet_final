# Product Brief - Plateforme d'Hébergements Touristiques (Open Data)

**Date:** 27 Mars 2026
**Projet:** Soutenance Master Engineering
**Équipe:** 5 développeurs
**Durée:** 14 jours

---

## 1. VISION DU PRODUIT

### 1.1 Contexte et Problématique

La France dispose d'un patrimoine touristique exceptionnel avec des milliers d'hébergements (hôtels, campings, résidences, meublés de tourisme). Cependant :

- **Problème 1:** Les données sur les hébergements sont dispersées et peu accessibles
- **Problème 2:** data.gouv.fr contient des milliers de jeux de données sous-exploités
- **Problème 3:** Les voyageurs ont du mal à comparer et trouver l'hébergement idéal
- **Problème 4:** Pas de vision unifiée de l'offre touristique française

### 1.2 Solution Proposée

Une plateforme web qui **agrège, valorise et rend consultable** l'ensemble des données ouvertes d'hébergements touristiques issues de data.gouv.fr :

- 📊 **Agrégation automatique** des datasets data.gouv.fr (hôtels, campings, résidences, etc.)
- 🔍 **Moteur de recherche** géolocalisé avec filtres avancés
- 🗺️ **Carte interactive** de tous les hébergements en France
- 📈 **Tableaux de bord** statistiques (occupation, capacité, prix moyens)
- ⭐ **Système d'avis** communautaire (données enrichies)
- 💰 **Estimation de prix** basée sur les données ouvertes

### 1.3 Objectifs Métier

| Objectif | Métrique | Cible |
|----------|----------|-------|
| Couverture données | Datasets agrégés | 10+ sources data.gouv.fr |
| Exhaustivité | Hébergements référencés | 50 000+ établissements |
| Performance recherche | Temps de réponse | < 500ms |
| Satisfaction utilisateurs | Note moyenne | 4.5/5 |
| Fréquentation | Visiteurs uniques/mois | 1000+ (démo) |

---

## 2. UTILISATEURS CIBLES

### 2.1 Personas

#### Persona 1 - Voyageur/Touriste
- **Nom:** Claire, 32 ans
- **Profil:** Cadre urbaine, planifie ses vacances en France
- **Besoins:** Trouver rapidement un hébergement, comparer les options, voir les avis
- **Frustrations:** Sites fragmentés, informations incomplètes, pas de vue d'ensemble

#### Persona 2 - Chercheur/Analyste Tourisme
- **Nom:** Marc, 45 ans
- **Profil:** Consultant en tourisme, analyste de données
- **Besoins:** Accéder aux données brutes, créer des visualisations, exporter
- **Frustrations:** Données éparpillées, formats hétérogènes, pas d'API unifiée

#### Persona 3 - Professionnel du Tourisme
- **Nom:** Sophie, 38 ans
- **Profil:** Propriétaire de camping, veut benchmark concurrentiel
- **Besoins:** Voir sa concurrence, comprendre le marché, se référencer
- **Frustrations:** Pas de visibilité sur l'offre globale, tarifs opaques

### 2.2 Segments Utilisateurs

| Segment | Caractéristiques | Besoins principaux |
|---------|-----------------|-------------------|
| **Touristes/Voyageurs** | Particuliers, familles, couples | Recherche, comparaison, réservation |
| **Professionnels** | Propriétaires, gestionnaires | Benchmark, visibilité, analytics |
| **Analystes/Chercheurs** | Étudiants, consultants, journalistes | Données brutes, exports, API |
| **Institutions** | Offices de tourisme, collectivités | Statistiques territoriales |

---

## 3. PÉRIMÈTRE DU PRODUIT

### 3.1 In Scope (MVP - 14 jours)

✅ **Fonctionnalités incluses :**

**Données & Agrégation:**
- [ ] Connexion API data.gouv.fr
- [ ] Import datasets: hôtels, campings, résidences, meublés
- [ ] Nettoyage et normalisation des données
- [ ] Mise à jour automatique (quotidienne)

**Recherche & Exploration:**
- [ ] Moteur de recherche full-text
- [ ] Carte interactive (Leaflet/Mapbox)
- [ ] Filtres: type, capacité, prix, équipements, note
- [ ] Géolocalisation utilisateur
- [ ] Favoris/sauvegardes

**Fiches Établissements:**
- [ ] Page détail avec toutes les informations
- [ ] Photos (si disponibles dans datasets)
- [ ] Équipements et services
- [ ] Position GPS précise
- [ ] Lien vers site officiel/réservation

**Système d'Avis:**
- [ ] Inscription/connexion utilisateurs
- [ ] Déposer un avis vérifié (séjour réel)
- [ ] Notation 1-5 étoiles
- [ ] Réponse des propriétaires (optionnel)

**Dashboard Analytics:**
- [ ] Statistiques par région/département
- [ ] Évolution de l'offre touristique
- [ ] Prix moyens par type d'hébergement
- [ ] Taux d'occupation estimés
- [ ] Export CSV/Excel

### 3.2 Out of Scope (v1.1+)

❌ **Fonctionnalités exclues (post-MVP) :**

- Réservation directe sur la plateforme
- Paiement en ligne
- Messagerie entre voyageurs et propriétaires
- Application mobile native
- Intelligence artificielle (recommandations)
- Données temps réel (disponibilité)
- Gestion de propriété pour les pros
- Système de fidélité

---

## 4. STACK TECHNIQUE

### 4.1 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND                                 │
│              Next.js 14 + React 18 + TypeScript             │
│              TailwindCSS + Leaflet/Mapbox                   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND                                  │
│              Node.js + Express + TypeScript                 │
│              API REST + data.gouv.fr API                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   DATABASE                                  │
│         PostgreSQL + PostGIS (géolocalisation)              │
│         + Redis (cache des requêtes data.gouv)              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              DATA SOURCES (data.gouv.fr)                    │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│   │  Hôtels  │ │ Campings │ │Résidences│ │ Meublés  │      │
│   │  (INSEE) │ │  (INSEE) │ │  (INSEE) │ │  (INSEE) │      │
│   └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Technologies Détaillées

| Couche | Technologie | Justification |
|--------|-------------|---------------|
| Frontend | Next.js 14 | SSR, SEO, performance |
| UI | TailwindCSS + Shadcn/ui | Rapidité, modernité |
| Cartes | Leaflet + OpenStreetMap | Gratuit, open source |
| Graphiques | Recharts/Chart.js | Interactif, léger |
| Backend | Node.js + Express | Écosystème, performance |
| Langage | TypeScript 5 | Type-safety |
| Database | MongoDB + PostgreSQL | NoSQL (hébergements) + DW (analytics) |
| Data Warehouse | PostgreSQL (tourisme_dw) | Star schema, Power BI compatible |
| ORM/Query | Mongoose + Prisma | ODM pour MongoDB, ORM pour PostgreSQL |
| Cache | Redis | Performance requêtes API |
| Auth | JWT + bcrypt | Standard, sécurisé |
| Data Pipeline | Apache Airflow | Orchestration ETL, scheduling |
| Hosting Front | Vercel | Gratuit, optimisé Next.js |
| Hosting Back | Render/Railway | Gratuit, simple |
| BI/Analytics | Power BI + Metabase | Dashboards, données DW |

---

## 5. DONNÉES DATA.GOUV.FR

### 5.1 Datasets Ciblés (MVP)

| Dataset | Fournisseur | Format | Enregistrements | URL |
|---------|-------------|--------|-----------------|-----|
| **Hôtels de tourisme** | INSEE | CSV | ~18 000 | data.gouv.fr/fr/datasets/hôtels |
| **Campings** | INSEE | CSV | ~8 000 | data.gouv.fr/fr/datasets/campings |
| **Résidences hôtelières** | INSEE | CSV | ~2 000 | data.gouv.fr/fr/datasets/residences |
| **Meublés de tourisme** | INSEE | CSV | ~15 000 | data.gouv.fr/fr/datasets/meubles |
| **Auberges de jeunesse** | UNAJ | CSV | ~500 | data.gouv.fr/fr/datasets/auberges |
| **Villages vacances** | FTVAC | CSV | ~1 000 | data.gouv.fr/fr/datasets/villages |

**Total estimé:** 45 000+ hébergements référencés

### 5.2 Schéma de Données Commun

Chaque hébergement aura les champs normalisés suivants :

```typescript
interface Hebergement {
  id: string;           // Identifiant unique
  source: string;       // Dataset d'origine
  nom: string;          // Nom de l'établissement
  type: string;         // hôtel, camping, residence, meuble
  adresse: string;
  codePostal: string;
  commune: string;
  departement: string;
  region: string;
  latitude: number;
  longitude: number;
  capacite: number;     // Nombre de chambres/emplacements
  classement: string;   // Étoiles (1-5)
  equipements: string[];// Tableau équipements
  telephone?: string;
  email?: string;
  url?: string;         // Site web officiel
  prixMoyen?: number;   // Estimé si disponible
  updatedAt: Date;
}
```

---

## 6. CONTRAINTES ET HYPOTHÈSES

### 6.1 Contraintes

| Type | Contrainte | Impact |
|------|------------|--------|
| **Temps** | 14 jours max | Scope MVP limité |
| **Équipe** | 5 développeurs | Répartition claire requise |
| **Budget** | $0 (gratuit) | Services free tier uniquement |
| **Données** | Open data uniquement | Pas de données propriétaires |
| **Technique** | Web uniquement | Pas de mobile natif |
| **Légal** | Licence Open Database | Attribution data.gouv.fr requise |

### 6.2 Hypothèses

- Les datasets data.gouv.fr sont accessibles via API
- La qualité des données est suffisante (géolocalisation présente)
- Les mises à jour sont régulières (au moins mensuelles)
- Le volume de données tient dans un PostgreSQL free tier
- Leaflet/OpenStreetMap est suffisant pour la carte

---

## 7. RISQUES IDENTIFIÉS

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| API data.gouv.fr indisponible | Faible | Élevé | Cache local, retry logic |
| Données incomplètes (pas GPS) | Moyenne | Moyen | Géocodage adresse (Nominatim) |
| Quota API dépassé | Faible | Moyen | Cache Redis, rate limiting |
| Retard développement | Moyenne | Élevé | Buffer J10 et J14, scope flexible |
| Performance carte lente | Moyenne | Moyen | Cluster markers, pagination |
| Données obsolètes | Moyenne | Faible | Date MAJ affichée, refresh auto |

---

## 8. CRITÈRES DE SUCCÈS

### 8.1 Techniques

- [ ] Application déployée et accessible publiquement
- [ ] Temps de chargement < 3 secondes
- [ ] API response time < 500ms
- [ ] 80%+ test coverage
- [ ] 0 vulnérabilité critique (OWASP)
- [ ] 10+ datasets data.gouv.fr agrégés
- [ ] 45 000+ hébergements dans la DB

### 8.2 Métier

- [ ] Recherche fonctionnelle (texte + filtres + carte)
- [ ] Fiche établissement complète
- [ ] Système d'avis opérationnel
- [ ] Dashboard analytics avec graphiques
- [ ] Export CSV fonctionnel

### 8.3 Soutenance

- [ ] Présentation 10-15 minutes prête
- [ ] Démo live scénarisée
- [ ] Vidéo backup enregistrée
- [ ] README GitHub professionnel
- [ ] Documentation technique complète
- [ ] Attribution data.gouv.fr visible

---

## 9. LIVRABLES ATTENDUS

| Livrable | Format | Responsable | Deadline |
|----------|--------|-------------|----------|
| Code source | GitHub | Tous | J12 |
| Application déployée | URL | P1 + P4 | J12 |
| Présentation | PPT/PDF | P5 | J13 |
| Démo live | Scénario | P2 + P4 | J13 |
| Vidéo backup | MP4 | P4 | J13 |
| Documentation | Markdown | P5 | J14 |
| README | Markdown | P1 | J12 |

---

## 10. VALIDATION

**Approuvé par l'équipe :** 27 Mars 2026

| Rôle | Nom | Signature |
|------|-----|-----------|
| PM/Lead Dev | P1 | - |
| Frontend Lead | P2 | - |
| Backend Lead | P3 | - |
| Fullstack Dev | P4 | - |
| QA/UX/Docs | P5 | - |

---

*Mention légale: Cette plateforme utilise les données ouvertes de data.gouv.fr sous licence Open Database License (ODbL).*

*Document vivant - Dernière mise à jour: 27 Mars 2026*
