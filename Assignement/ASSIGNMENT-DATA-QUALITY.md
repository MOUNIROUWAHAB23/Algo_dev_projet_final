# 📋 ASSIGNMENT - Data Analyst #2 (Quality & Deduplication)

**Rôle:** Data Analyst - Data Quality & Deduplication
**Durée Totale:** 10 heures
**Dates:** 29 Mars - 4 Avril 2026
**Équipe:** 5 personnes (vous travaillez avec Data Lead + 1 autre analyst)

---

## 🎯 VOTRE MISSION

Vous êtes le **Quality Guardian**. Vous nettoyez les données, éliminez les doublons, validez la qualité, et assurez l'intégrité.

---

## 📅 PHASE 1B - Normalization & Deduplication (29-31 Mars = 3 jours, 10h)

### Tâche 1.5: Data Normalization Scripts
**Durée:** 3 heures
**Importance:** HAUTE

**Description:**
Créer des scripts Python pour normaliser les données importer.

**Votre travail:**

```python
# airflow/scripts/normalize_data.py
import pandas as pd
import json
from pathlib import Path
import unicodedata
import re

class DataNormalizer:
    """Normalize accommodation data"""
    
    @staticmethod
    def normalize_text(text):
        """Remove accents, extra spaces, case normalization"""
        if not text:
            return None
        
        # Remove accents
        text = unicodedata.normalize('NFKD', text)
        text = ''.join([c for c in text if not unicodedata.combining(c)])
        
        # Cleanup spaces
        text = re.sub(r'\s+', ' ', text.strip())
        
        return text
    
    @staticmethod
    def normalize_postal_code(code):
        """Normalize postal code format (France: XXXXX)"""
        if not code:
            return None
        
        # Remove spaces and non-digits
        code = re.sub(r'\D', '', str(code))
        
        # Ensure 5 digits
        if len(code) != 5:
            return None
        
        return code
    
    @staticmethod
    def normalize_phone(phone):
        """Normalize French phone number"""
        if not phone:
            return None
        
        # Remove spaces, dots, hyphens
        phone = re.sub(r'[\s\.\-\(\)]', '', str(phone))
        
        # Should be 9-10 digits
        if not re.match(r'^\+?33[0-9]{9}$|^0[0-9]{9}$', phone):
            return None
        
        # Convert to +33 format
        if phone.startswith('0'):
            phone = '+33' + phone[1:]
        
        return phone
    
    @staticmethod
    def normalize_email(email):
        """Validate and normalize email"""
        if not email:
            return None
        
        email = email.lower().strip()
        
        # Basic validation
        if not re.match(r'^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$', email):
            return None
        
        return email
    
    @staticmethod
    def normalize_coordinates(lat, lng):
        """Validate GPS coordinates (France bounds)"""
        if not lat or not lng:
            return None, None
        
        try:
            lat = float(lat)
            lng = float(lng)
        except (ValueError, TypeError):
            return None, None
        
        # France bounds: roughly 42-52°N, -5-8°E
        if not (42 <= lat <= 52) or not (-5 <= lng <= 8):
            return None, None
        
        return round(lat, 6), round(lng, 6)
    
    @staticmethod
    def normalize_accommodation_type(acc_type):
        """Map variations to standard types"""
        if not acc_type:
            return None
        
        type_mapping = {
            'hotel': ['hotel', 'hôtel'],
            'camping': ['camping', 'campground'],
            'residence': ['residence', 'résidence', 'gite'],
            'meuble': ['meuble', 'furnished', 'appartement'],
            'auberge': ['auberge', 'hostel', 'auberge de jeunesse'],
            'village': ['village touristique', 'village vacances'],
        }
        
        acc_type = acc_type.lower().strip()
        
        for standard, variations in type_mapping.items():
            if any(var in acc_type for var in variations):
                return standard
        
        return 'other'
    
    @staticmethod
    def normalize_stars(stars):
        """Convert to 1-5 star rating"""
        if stars is None:
            return None
        
        try:
            stars = int(stars)
            if 1 <= stars <= 5:
                return stars
        except (ValueError, TypeError):
            pass
        
        return None
    
    def normalize_record(self, record):
        """Normalize a single record"""
        return {
            'nom': self.normalize_text(record.get('nom')),
            'adresse': self.normalize_text(record.get('adresse')),
            'codePostal': self.normalize_postal_code(record.get('codepostal')),
            'commune': self.normalize_text(record.get('commune')),
            'region': self.normalize_text(record.get('region')),
            'type': self.normalize_accommodation_type(record.get('type')),
            'telephone': self.normalize_phone(record.get('telephone')),
            'email': self.normalize_email(record.get('email')),
            'website': record.get('website', '').strip() if record.get('website') else None,
            'latitude': record.get('latitude'),
            'longitude': record.get('longitude'),
            'stars': self.normalize_stars(record.get('stars')),
            'rooms': record.get('rooms'),
            'amenities': record.get('amenities', []),
        }
    
    def validate_record(self, record):
        """Check if record has minimum required fields"""
        required = ['nom', 'commune', 'codePostal']
        
        # All required fields must be non-null
        return all(record.get(field) for field in required)
    
    def normalize_dataset(self, records):
        """Normalize entire dataset"""
        normalized = []
        invalid = []
        
        for record in records:
            normalized_rec = self.normalize_record(record)
            
            if self.validate_record(normalized_rec):
                normalized.append(normalized_rec)
            else:
                invalid.append(record)
        
        return normalized, invalid

# Usage
if __name__ == '__main__':
    # Load raw data
    with open('/datalake/fichiers_traites/hebergements_geocoded.json') as f:
        records = json.load(f)
    
    # Normalize
    normalizer = DataNormalizer()
    normalized, invalid = normalizer.normalize_dataset(records)
    
    print(f"Normalized: {len(normalized)} records")
    print(f"Invalid: {len(invalid)} records")
    
    # Save normalized data
    with open('/datalake/fichiers_traites/hebergements_normalized.json', 'w') as f:
        json.dump(normalized, f, ensure_ascii=False, indent=2)
    
    # Log invalid records
    if invalid:
        with open('/datalake/fichiers_non_traites/invalid_records.json', 'w') as f:
            json.dump(invalid, f, ensure_ascii=False, indent=2)
        print(f"Invalid records saved for review")
```

**Acceptance Criteria:**
- [ ] Script créé et testé
- [ ] Gère 45000+ records
- [ ] Sauve données normalisées
- [ ] Logs records invalides

---

### Tâche 1.6: Deduplication & Merging
**Durée:** 4 heures
**Importance:** CRITIQUE

**Description:**
Éliminer les doublons et fusionner les enregistrements.

**Code:**

```python
# airflow/scripts/deduplicate_data.py
import json
from pathlib import Path
from difflib import SequenceMatcher
from typing import List, Dict, Tuple

class DataDeduplicator:
    """Remove and merge duplicate records"""
    
    def __init__(self, similarity_threshold=0.95):
        self.similarity_threshold = similarity_threshold
        self.merged_count = 0
        self.dedup_log = []
    
    def exact_match(self, rec1: Dict, rec2: Dict) -> bool:
        """Check if records are exact duplicates"""
        # Same name + postal code + commune = exact match
        return (
            rec1.get('nom', '').lower() == rec2.get('nom', '').lower() and
            rec1.get('codePostal') == rec2.get('codePostal') and
            rec1.get('commune', '').lower() == rec2.get('commune', '').lower()
        )
    
    def fuzzy_match(self, name1: str, name2: str) -> bool:
        """Fuzzy string matching (95%+ similarity)"""
        if not name1 or not name2:
            return False
        
        ratio = SequenceMatcher(None, name1.lower(), name2.lower()).ratio()
        return ratio >= self.similarity_threshold
    
    def geographic_match(self, rec1: Dict, rec2: Dict, 
                        distance_km: float = 0.1) -> bool:
        """Check if coordinates are within distance"""
        from math import radians, sin, cos, sqrt, atan2
        
        lat1, lng1 = rec1.get('latitude'), rec1.get('longitude')
        lat2, lng2 = rec2.get('latitude'), rec2.get('longitude')
        
        if not all([lat1, lng1, lat2, lng2]):
            return False
        
        # Haversine formula
        R = 6371  # Earth radius in km
        
        dlat = radians(lat2 - lat1)
        dlng = radians(lng2 - lng1)
        
        a = sin(dlat/2)**2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlng/2)**2
        c = 2 * atan2(sqrt(a), sqrt(1-a))
        
        distance = R * c
        return distance <= distance_km
    
    def merge_records(self, primary: Dict, duplicate: Dict) -> Dict:
        """Merge duplicate record into primary"""
        merged = primary.copy()
        
        # Keep non-null values from duplicate if primary is null
        for key in ['telephone', 'email', 'website', 'rooms', 'amenities']:
            if not merged.get(key) and duplicate.get(key):
                merged[key] = duplicate[key]
        
        # Merge amenities lists
        if 'amenities' in primary or 'amenities' in duplicate:
            amenities1 = set(primary.get('amenities', []))
            amenities2 = set(duplicate.get('amenities', []))
            merged['amenities'] = list(amenities1 | amenities2)
        
        # Log merge
        self.dedup_log.append({
            'primary_id': primary.get('id'),
            'duplicate_id': duplicate.get('id'),
            'merge_reason': 'exact_match or fuzzy_match',
            'merged_fields': list(k for k in duplicate if not primary.get(k))
        })
        
        self.merged_count += 1
        return merged
    
    def deduplicate(self, records: List[Dict]) -> Tuple[List[Dict], List[Dict]]:
        """Remove duplicates and merge records"""
        
        unique_records = []
        seen_indices = set()
        
        for i, rec1 in enumerate(records):
            if i in seen_indices:
                continue
            
            primary = rec1.copy()
            
            # Check against remaining records
            for j in range(i + 1, len(records)):
                if j in seen_indices:
                    continue
                
                rec2 = records[j]
                
                # Check for duplicates
                if self.exact_match(rec1, rec2):
                    primary = self.merge_records(primary, rec2)
                    seen_indices.add(j)
                
                elif (self.fuzzy_match(rec1.get('nom', ''), rec2.get('nom', '')) and
                      rec1.get('codePostal') == rec2.get('codePostal')):
                    primary = self.merge_records(primary, rec2)
                    seen_indices.add(j)
                
                elif self.geographic_match(rec1, rec2, distance_km=0.05):
                    primary = self.merge_records(primary, rec2)
                    seen_indices.add(j)
            
            unique_records.append(primary)
        
        return unique_records, self.dedup_log

# Usage
if __name__ == '__main__':
    # Load normalized data
    with open('/datalake/fichiers_traites/hebergements_normalized.json') as f:
        records = json.load(f)
    
    print(f"Starting deduplication: {len(records)} records")
    
    deduplicator = DataDeduplicator(similarity_threshold=0.95)
    unique_records, merge_log = deduplicator.deduplicate(records)
    
    print(f"After deduplication: {len(unique_records)} records")
    print(f"Merged: {deduplicator.merged_count} records")
    print(f"Removed: {len(records) - len(unique_records)} duplicates")
    
    # Save results
    with open('/datalake/fichiers_traites/hebergements_deduplicated.json', 'w') as f:
        json.dump(unique_records, f, ensure_ascii=False, indent=2)
    
    # Save merge log
    with open('/datalake/fichiers_traites/dedup_log.json', 'w') as f:
        json.dump(merge_log, f, ensure_ascii=False, indent=2)
```

**Acceptance Criteria:**
- [ ] Script créé et testé
- [ ] Identifie doublons (exact, fuzzy, geographic)
- [ ] Fusionne records intelligemment
- [ ] Log de déduplication généré
- [ ] Sauve données déduplicaées

---

### Tâche 1.7: Quality Metrics & Reporting
**Durée:** 3 heures
**Importance:** HAUTE

**Description:**
Générer rapports de qualité des données.

**Code:**

```python
# airflow/scripts/quality_report.py
import json
from pathlib import Path
from datetime import datetime
from collections import Counter

class QualityReporter:
    """Generate data quality reports"""
    
    def __init__(self, records):
        self.records = records
        self.report = {}
    
    def check_completeness(self):
        """Check % of fields filled"""
        fields = ['nom', 'adresse', 'commune', 'codePostal', 'latitude', 'longitude']
        
        completeness = {}
        for field in fields:
            filled = sum(1 for r in self.records if r.get(field))
            completeness[field] = {
                'filled': filled,
                'total': len(self.records),
                'percentage': round(100 * filled / len(self.records), 2)
            }
        
        return completeness
    
    def check_validity(self):
        """Check validity of data types and formats"""
        invalid_records = []
        
        for i, rec in enumerate(self.records):
            errors = []
            
            # Check email format
            if rec.get('email') and '@' not in rec['email']:
                errors.append('invalid_email')
            
            # Check coordinates
            if rec.get('latitude') and not (-90 <= rec['latitude'] <= 90):
                errors.append('invalid_latitude')
            
            if rec.get('longitude') and not (-180 <= rec['longitude'] <= 180):
                errors.append('invalid_longitude')
            
            # Check postal code format
            if rec.get('codePostal') and len(str(rec['codePostal'])) != 5:
                errors.append('invalid_postal_code')
            
            if errors:
                invalid_records.append({
                    'index': i,
                    'nom': rec.get('nom'),
                    'errors': errors
                })
        
        return {
            'valid_count': len(self.records) - len(invalid_records),
            'invalid_count': len(invalid_records),
            'invalid_records': invalid_records[:100]  # First 100
        }
    
    def check_uniqueness(self):
        """Check for duplicates"""
        names = [r.get('nom') for r in self.records]
        name_counts = Counter(names)
        
        duplicates = {k: v for k, v in name_counts.items() if v > 1}
        
        return {
            'unique_names': len(name_counts),
            'duplicate_count': sum(1 for v in name_counts.values() if v > 1),
            'total_duplicates': len(self.records) - len(name_counts)
        }
    
    def check_distribution(self):
        """Check distribution of data"""
        types = [r.get('type') for r in self.records]
        type_dist = Counter(types)
        
        regions = [r.get('region') for r in self.records]
        region_dist = Counter(regions)
        
        return {
            'by_type': dict(type_dist),
            'by_region': dict(region_dist)
        }
    
    def generate_report(self):
        """Generate complete quality report"""
        return {
            'timestamp': datetime.now().isoformat(),
            'total_records': len(self.records),
            'completeness': self.check_completeness(),
            'validity': self.check_validity(),
            'uniqueness': self.check_uniqueness(),
            'distribution': self.check_distribution()
        }

# Usage
if __name__ == '__main__':
    # Load data
    with open('/datalake/fichiers_traites/hebergements_deduplicated.json') as f:
        records = json.load(f)
    
    # Generate report
    reporter = QualityReporter(records)
    report = reporter.generate_report()
    
    # Save report
    report_path = Path('/datalake/fichiers_traites/quality_report.json')
    with open(report_path, 'w') as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    
    # Print summary
    print(f"Quality Report Generated: {report_path}")
    print(f"Total Records: {report['total_records']}")
    print(f"Valid Records: {report['validity']['valid_count']}")
    print(f"Invalid Records: {report['validity']['invalid_count']}")
    print(f"Unique Accommodations: {report['uniqueness']['unique_names']}")
    print(f"Duplicates: {report['uniqueness']['total_duplicates']}")
```

**Acceptance Criteria:**
- [ ] Script créé et testé
- [ ] Rapport générée en JSON
- [ ] Vérifie complétude (% champs remplis)
- [ ] Vérifie validité (formats correctes)
- [ ] Identifie duplicates résiduels
- [ ] Affiche distribution par type/région

---

## 📅 PHASE 2 - Quality Validation (30 Avril - 1 Avril)

**NOTE:** Après que Data Lead ait importé les données en MongoDB

### Tâche 2.6: MongoDB Data Quality Checks
**Durée:** 2 heures
**Coordonné avec:** Data Lead

**Votre travail:**

```javascript
// airflow/scripts/mongodb_quality_check.js
const { MongoClient } = require('mongodb');

async function qualityCheck() {
  const client = new MongoClient('mongodb://localhost:27017');
  const db = client.db('tourisme');
  
  console.log('=== QUALITY CHECK REPORT ===\n');
  
  // 1. Record count
  const count = await db.collection('hebergements').countDocuments();
  console.log(`✓ Total Records: ${count}`);
  
  // 2. Missing required fields
  const missingNom = await db.collection('hebergements').countDocuments({ nom: null });
  const missingCommune = await db.collection('hebergements').countDocuments({ commune: null });
  const missingPostal = await db.collection('hebergements').countDocuments({ codePostal: null });
  
  console.log(`\n✓ Required Fields:`);
  console.log(`  - Missing nom: ${missingNom}`);
  console.log(`  - Missing commune: ${missingCommune}`);
  console.log(`  - Missing codePostal: ${missingPostal}`);
  
  // 3. Geolocation coverage
  const withGeo = await db.collection('hebergements').countDocuments({
    latitude: { $ne: null },
    longitude: { $ne: null }
  });
  
  console.log(`\n✓ Geolocation:`);
  console.log(`  - Records with coordinates: ${withGeo} (${(100*withGeo/count).toFixed(1)}%)`);
  
  // 4. Type distribution
  const typeDistribution = await db.collection('hebergements').aggregate([
    { $group: { _id: '$type', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]).toArray();
  
  console.log(`\n✓ Distribution by Type:`);
  typeDistribution.forEach(t => {
    console.log(`  - ${t._id}: ${t.count} (${(100*t.count/count).toFixed(1)}%)`);
  });
  
  // 5. Duplicate check
  const duplicates = await db.collection('hebergements').aggregate([
    { $group: { _id: { nom: '$nom', codePostal: '$codePostal' }, count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } }
  ]).toArray();
  
  console.log(`\n✓ Duplicates: ${duplicates.length} groups with multiple records`);
  
  // 6. Data quality score
  const qualityScore = {
    completeness: 100 - (missingNom + missingCommune + missingPostal) / (count * 3) * 100,
    geolocation: 100 * withGeo / count,
    uniqueness: 100 - (duplicates.length > 0 ? 5 : 0)
  };
  
  const avgScore = (qualityScore.completeness + qualityScore.geolocation + qualityScore.uniqueness) / 3;
  
  console.log(`\n✓ Overall Quality Score: ${avgScore.toFixed(1)}/100`);
  
  await client.close();
}

qualityCheck().catch(console.error);
```

**Acceptance Criteria:**
- [ ] Script connecté à MongoDB
- [ ] Rapport de qualité généré
- [ ] Vérifie champs obligatoires
- [ ] Vérifie géolocalisation
- [ ] Identifie duplicates dans MongoDB
- [ ] Score de qualité affiché

---

## 📊 RÉSUMÉ VOTRE TÂCHES

| Phase | Tâches | Durée | Status |
|-------|--------|-------|--------|
| 1B | Normalization | 3h | ⏳ |
| 1B | Deduplication | 4h | ⏳ |
| 1B | Quality Metrics | 3h | ⏳ |
| **TOTAL** | **Data Quality Assurance** | **10h** | |

---

## 🎯 SUCCESS CRITERIA

- [ ] Normalization script créé et testé
- [ ] 45000+ records normalisés
- [ ] Deduplication script fonctionnel
- [ ] Doublons identifiés et fusionnés
- [ ] Quality report généré
- [ ] 95%+ completeness sur champs clés
- [ ] 90%+ geolocation coverage
- [ ] MongoDB quality check passed

---

**Assigné à:** Data Analyst #2 (Quality)
**Créé:** 28 Mars 2026, 22:30 UTC
**Status:** 🟢 Ready after Phase 1 data import

**Next:** Attendez import données, puis lancez normalization! 🚀
