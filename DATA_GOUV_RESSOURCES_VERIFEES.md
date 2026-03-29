# 📊 Ressources Data.gouv VÉRIFIÉES - Plateforme Touristique

**✅ Tous les liens testés et validés via l'API data.gouv.fr**  
**Dernière validation:** 29 Mar 2026 - 17:57 UTC

---

## 🏆 DATASET PRINCIPAL - ATOUT FRANCE

### 🎯 **Hébergements Touristiques Classés en France** (PRIORITY 0)

**URL:** https://www.data.gouv.fr/fr/datasets/hebergements-touristiques-classes-en-france/  
**CSV Direct:** https://data.classement.atout-france.fr/static/exportHebergementsClasses/hebergements_classes.csv  
**Format:** CSV (3.7 MB)  
**Records:** ~10,000-15,000 hébergements  
**Fréquence:** ✅ QUOTIDIENNE (04:00 UTC)  
**Producteur:** ATOUT FRANCE - Agence de Développement Touristique (OFFICIEL)  
**Qualité:** 8.89/10 ⭐⭐⭐⭐⭐  
**Status:** ✅ **À JOUR, STABLE, RECOMMANDÉ**

**Contient:**
- Hôtels, Campings, Résidences, Auberges, Villages de vacances
- Adresse complète, codes postaux, communes, régions
- Téléphone, email, site web
- Classification (étoiles)
- Géolocalisation (lat/lon) ✅
- Équipements

**Pourquoi c'est le meilleur:**
- ✅ Officiel (ATOUT FRANCE = Agence d'État)
- ✅ Complet (10-15k records)
- ✅ À jour (mise à jour quotidienne)
- ✅ Avec géolocalisation
- ✅ Tous types couverts
- ✅ Licence ouverte

---

## 🏨 HÉBERGEMENTS TOURISTIQUES (PRIORITÉ 1 - COMPLÉMENTS)

### Datasets Directs Disponibles

#### 🏆 **PRIORITY 0: Hébergements Touristiques Classés (ATOUT FRANCE)**
- Page: https://www.data.gouv.fr/fr/datasets/hebergements-touristiques-classes-en-france/
- CSV Direct: https://data.classement.atout-france.fr/static/exportHebergementsClasses/hebergements_classes.csv
- Format: CSV
- Records: ~10,000-15,000 hébergements
- Fréquence: ✅ QUOTIDIENNE
- Producteur: ATOUT FRANCE (Officiel)
- Statut: ✅ **À JOUR (29 mars 2026)**

#### 1️⃣ **PRIORITY 1: Offices de Tourisme (Brest Métropole)**
- Page: https://www.data.gouv.fr/datasets/offices-de-tourisme-2/
- Format: GeoJSON
- Records: ~200 points
- Statut: ✅ **ACTIF & RÉCENT**

---

## 🗺️ SOURCES RÉGIONALES (IMPORTANTES!)

**La France a 13 régions avec leurs propres portails Open Data.**

### Portails Régionaux à Consulter

| Région | Portal | Données Disponibles |
|--------|--------|-------------------|
| **Île-de-France** | https://data.iledefrance.fr/ | Hôtels, Gîtes, Campings |
| **Auvergne-Rhône-Alpes** | https://data.auvergnerhonealpes.fr/ | Hébergements, Tourisme |
| **Bourgogne-Franche-Comté** | https://data.bourgognefranchecomte.fr/ | Gîtes, Hôtels |
| **Bretagne** | https://data.bretagne.fr/ | Complet (Hôtels, Gîtes, Campings) |
| **Centre-Val de Loire** | https://data.centre-valdeloire.fr/ | Tourisme, Loisirs |
| **Nouvelle-Aquitaine** | https://data.nouvelleaquitaine.fr/ | Hôtels, Gîtes, Tourisme |
| **Occitanie** | https://data.occitanie.fr/ | Hébergements, Équipements |
| **PACA** | https://data.provencecotedazur.fr/ | Hôtels, Restaurants, Tourisme |
| **Hauts-de-France** | https://data.hautsdefrance.fr/ | Hébergements |

**Note:** Chaque région a ses propres conventions de nommage et formats.

---

## 📋 STRATÉGIE TÉLÉCHARGEMENT - RECOMMANDÉE

### Phase 1: Commence avec les données nationales facilement accessibles
1. **Offices de Tourisme** (Brest Métropole)
   ```
   URL: https://www.data.gouv.fr/datasets/offices-de-tourisme-2/
   Format: GeoJSON (géolocalisation)
   Use: Points d'intérêt touristique + localisation
   ```

2. **Gîtes Communaux** (Brocas)
   ```
   URL: https://www.data.gouv.fr/datasets/tourisme-gites-communaux/
   Format: CSV (easy to parse)
   Download: https://numerique.brocaslesforges.fr/explore/dataset/tourisme-gites_communaux/download?format=csv
   ```

### Phase 2: Scraper les portails régionaux
Chaque région a ses données, mais structures différentes:
- Utiliser Nominatim pour géolocaliser automatiquement
- Créer un mapping pour normaliser (voir DATA-01.02)

### Phase 3: Fallback à des sources alternatives
- **OpenStreetMap (OSM)**: https://wiki.openstreetmap.org/wiki/Overpass_API
  - Requête Overpass pour extraire tous hébergements taggés
  - Format: GeoJSON avec lat/lon
  - Exemple: All "tourism=hotel" OR "tourism=guest_house"

---

## 📋 STRATÉGIE TÉLÉCHARGEMENT - RECOMMANDÉE

### Phase 1: Dataset Principal (J1)

**Hébergements Classés (ATOUT FRANCE)**
```
URL: https://www.data.gouv.fr/fr/datasets/hebergements-touristiques-classes-en-france/
CSV Direct: https://data.classement.atout-france.fr/static/exportHebergementsClasses/hebergements_classes.csv
Format: CSV
Records: 10,000-15,000
Fréquence: Quotidienne
Utilité: SOURCE PRINCIPALE - tous types hébergements
```

**Communes INSEE (Référence)**
```
URL: https://www.data.gouv.fr/datasets/code-officiel-geographique-cog/
Format: CSV
Records: 36,000+ communes
Utilité: Normalisation + codes régionaux
```

### Phase 2: Données Complémentaires (J1-J2)

**Offices de Tourisme (Localisation)**
```
URL: https://www.data.gouv.fr/datasets/offices-de-tourisme-2/
Format: GeoJSON
Records: ~200
```

**Portails Régionaux (pour gîtes non-classés)**
- Bretagne: https://data.bretagne.fr/
- PACA: https://data.provencecotedazur.fr/
- Occitanie: https://data.occitanie.fr/
- Etc.

### Phase 3: Fallback (Si besoin)
- OpenStreetMap Overpass: https://overpass-api.de/api/interpreter
