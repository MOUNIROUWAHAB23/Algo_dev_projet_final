-- ============================================================
-- INITIALIZATION SCRIPT - PostgreSQL Data Warehouse (tourisme_dw)
-- ============================================================
-- Ce script crée le schéma star schema pour l'entrepôt de données
-- Exécuté automatiquement au démarrage du container Docker
-- ============================================================

-- ============================================================
-- 1. DIMENSION TABLES (Lookup tables)
-- ============================================================

-- Dimension: Type d'hébergement
CREATE TABLE IF NOT EXISTS dim_type_hebergement (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    label VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Seed data
INSERT INTO dim_type_hebergement (code, label, description) VALUES
    ('HOTEL', 'Hôtel', 'Établissements hôteliers classiques'),
    ('CAMPING', 'Camping', 'Campings et parcs de camping'),
    ('RESIDENCE', 'Résidence', 'Résidences touristiques'),
    ('MEUBLE', 'Meublé', 'Gîtes et meublés touristiques'),
    ('AUBERGE', 'Auberge', 'Auberges et maisons d''hôtes'),
    ('VILLAGE', 'Village', 'Villages vacances')
ON CONFLICT DO NOTHING;

-- Dimension: Localisation
CREATE TABLE IF NOT EXISTS dim_localisation (
    id SERIAL PRIMARY KEY,
    commune VARCHAR(100) NOT NULL,
    departement VARCHAR(100) NOT NULL,
    region VARCHAR(100) NOT NULL,
    code_postal VARCHAR(10),
    latitude FLOAT8,
    longitude FLOAT8,
    pays VARCHAR(100) DEFAULT 'France',
    UNIQUE(commune, departement, region)
);

CREATE INDEX IF NOT EXISTS idx_dim_loc_region ON dim_localisation(region);
CREATE INDEX IF NOT EXISTS idx_dim_loc_dept ON dim_localisation(departement);
CREATE INDEX IF NOT EXISTS idx_dim_loc_commune ON dim_localisation(commune);

-- ============================================================
-- 2. MAIN DIMENSION TABLE
-- ============================================================

-- Dimension: Hébergements
CREATE TABLE IF NOT EXISTS dim_hebergements (
    id SERIAL PRIMARY KEY,
    code_source VARCHAR(50) UNIQUE NOT NULL,
    nom VARCHAR(255) NOT NULL,
    source VARCHAR(50) NOT NULL,
    type_id INT REFERENCES dim_type_hebergement(id),
    localisation_id INT REFERENCES dim_localisation(id),
    adresse VARCHAR(255),
    telephone VARCHAR(20),
    email VARCHAR(100),
    url VARCHAR(255),
    classement VARCHAR(50),
    equipements TEXT,
    capacite INT,
    prix_moyen_nuit DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dim_heb_nom ON dim_hebergements(nom);
CREATE INDEX IF NOT EXISTS idx_dim_heb_source ON dim_hebergements(source);
CREATE INDEX IF NOT EXISTS idx_dim_heb_classement ON dim_hebergements(classement);
CREATE INDEX IF NOT EXISTS idx_dim_heb_type ON dim_hebergements(type_id);
CREATE INDEX IF NOT EXISTS idx_dim_heb_loc ON dim_hebergements(localisation_id);

-- ============================================================
-- 3. FACT TABLES (Measures)
-- ============================================================

-- Fact: Capacité
CREATE TABLE IF NOT EXISTS fact_capacite (
    id SERIAL PRIMARY KEY,
    hebergement_id INT NOT NULL REFERENCES dim_hebergements(id),
    capacite_total INT,
    nb_chambres INT,
    nb_lits INT,
    capacite_groupes BOOLEAN,
    capacite_pmr BOOLEAN,
    date_record DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(hebergement_id, date_record)
);

CREATE INDEX IF NOT EXISTS idx_fact_cap_date ON fact_capacite(date_record);
CREATE INDEX IF NOT EXISTS idx_fact_cap_heb ON fact_capacite(hebergement_id);

-- Fact: Disponibilités (Temps réel)
CREATE TABLE IF NOT EXISTS fact_disponibilites (
    id SERIAL PRIMARY KEY,
    hebergement_id INT NOT NULL REFERENCES dim_hebergements(id),
    date_debut DATE NOT NULL,
    date_fin DATE NOT NULL,
    prix_par_nuit DECIMAL(10,2),
    disponible BOOLEAN,
    type_disponibilite VARCHAR(50),
    source_data VARCHAR(50),
    derniere_mise_a_jour TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fact_disp_heb_dates ON fact_disponibilites(hebergement_id, date_debut, date_fin);
CREATE INDEX IF NOT EXISTS idx_fact_disp_dispo ON fact_disponibilites(disponible);
CREATE INDEX IF NOT EXISTS idx_fact_disp_dates ON fact_disponibilites(date_debut, date_fin);

-- Fact: Avis et Reviews
CREATE TABLE IF NOT EXISTS fact_reviews (
    id SERIAL PRIMARY KEY,
    hebergement_id INT NOT NULL REFERENCES dim_hebergements(id),
    utilisateur_id VARCHAR(100),
    note INT CHECK (note >= 1 AND note <= 5),
    texte TEXT,
    date_visite DATE,
    verified_booking BOOLEAN DEFAULT FALSE,
    utilite_votes INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fact_rev_heb ON fact_reviews(hebergement_id);
CREATE INDEX IF NOT EXISTS idx_fact_rev_note ON fact_reviews(note);
CREATE INDEX IF NOT EXISTS idx_fact_rev_date ON fact_reviews(created_at);

-- Fact: Métriques Quotidiennes
CREATE TABLE IF NOT EXISTS fact_metriques_daily (
    id SERIAL PRIMARY KEY,
    hebergement_id INT NOT NULL REFERENCES dim_hebergements(id),
    date DATE NOT NULL,
    nb_vues INT DEFAULT 0,
    nb_favoris INT DEFAULT 0,
    nb_clics_contact INT DEFAULT 0,
    taux_occupation FLOAT8,
    prix_moyen_nuit DECIMAL(10,2),
    note_moyenne FLOAT8,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(hebergement_id, date)
);

CREATE INDEX IF NOT EXISTS idx_fact_met_date ON fact_metriques_daily(date);
CREATE INDEX IF NOT EXISTS idx_fact_met_heb ON fact_metriques_daily(hebergement_id);

-- ============================================================
-- 4. ETL & LOGGING
-- ============================================================

-- ETL Metadata & Logs
CREATE TABLE IF NOT EXISTS etl_logs (
    id SERIAL PRIMARY KEY,
    process_name VARCHAR(100),
    source VARCHAR(100),
    status VARCHAR(20),
    total_records INT,
    loaded_records INT,
    failed_records INT,
    error_message TEXT,
    execution_time_ms INT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_etl_process ON etl_logs(process_name);
CREATE INDEX IF NOT EXISTS idx_etl_status ON etl_logs(status);
CREATE INDEX IF NOT EXISTS idx_etl_date ON etl_logs(completed_at);

-- ============================================================
-- 5. VIEWS (pour Power BI et Analytics)
-- ============================================================

-- Vue: Analytics pour les hébergements
CREATE OR REPLACE VIEW v_hebergements_analytics AS
SELECT 
    h.id,
    h.nom,
    h.source,
    t.label as type,
    l.commune,
    l.departement,
    l.region,
    h.classement,
    h.capacite,
    h.prix_moyen_nuit,
    COUNT(DISTINCT r.id)::INT as nb_reviews,
    AVG(r.note)::FLOAT8 as note_moyenne,
    h.created_at,
    h.updated_at
FROM dim_hebergements h
LEFT JOIN dim_type_hebergement t ON h.type_id = t.id
LEFT JOIN dim_localisation l ON h.localisation_id = l.id
LEFT JOIN fact_reviews r ON h.id = r.hebergement_id
GROUP BY h.id, h.nom, h.source, t.label, l.commune, l.departement, l.region, h.classement, h.capacite, h.prix_moyen_nuit, h.created_at, h.updated_at;

-- ============================================================
-- FIN INITIALIZATION - Data Warehouse Ready ✅
-- ============================================================
