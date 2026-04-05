-- ==========================================
-- DDL : Création du Data Warehouse (Star Schema)
-- Adapté pour la source ATOUT FRANCE
-- ==========================================

-- 1. Nettoyage préalable (Idempotence pour relancer le script à volonté)
DROP VIEW IF EXISTS vw_hebergements_par_region;
DROP TABLE IF EXISTS fact_equipement_hebergement CASCADE;
DROP TABLE IF EXISTS fact_hebergement CASCADE;
DROP TABLE IF EXISTS dim_equipement CASCADE;
DROP TABLE IF EXISTS dim_temps CASCADE;
DROP TABLE IF EXISTS dim_date CASCADE;
DROP TABLE IF EXISTS dim_localisation CASCADE;
DROP TABLE IF EXISTS dim_hebergement CASCADE;

-- ==========================================
-- DIMENSIONS
-- ==========================================

-- DIM: Hébergement
CREATE TABLE dim_hebergement (
    hebergement_id SERIAL PRIMARY KEY,
    hash_record VARCHAR(255) UNIQUE NOT NULL, -- NOTRE VRAIE BUSINESS KEY !
    nom VARCHAR(255) NOT NULL,
    type_hebergement VARCHAR(100),
    classification INTEGER,
    nb_chambres INTEGER,
    nb_lits INTEGER,
    contact_email VARCHAR(255),    -- Prêt pour de futures sources
    contact_telephone VARCHAR(100),-- Prêt pour de futures sources
    site_web TEXT
);

-- DIM: Localisation
CREATE TABLE dim_localisation (
    localisation_id SERIAL PRIMARY KEY,
    code_postal VARCHAR(10),
    commune VARCHAR(255),
    departement_code VARCHAR(10),
    region VARCHAR(255),
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    UNIQUE(code_postal, commune) -- Évite les doublons géographiques
);

-- DIM: Date (Smart Keys de type YYYYMMDD pour des requêtes BI ultra-rapides)
CREATE TABLE dim_date (
    date_id INTEGER PRIMARY KEY,
    date_complete DATE NOT NULL UNIQUE,
    jour_semaine INTEGER,
    mois INTEGER,
    trimestre INTEGER,
    annee INTEGER
);

-- DIM: Temps (Smart Keys de type HHMM)
CREATE TABLE dim_temps (
    temps_id INTEGER PRIMARY KEY,
    heure INTEGER,
    minute INTEGER
);

-- DIM: Equipement
CREATE TABLE dim_equipement (
    equipement_id SERIAL PRIMARY KEY,
    nom_equipement VARCHAR(150) UNIQUE NOT NULL
);

-- ==========================================
-- FAITS (FACT TABLES)
-- ==========================================

-- FACT: Hébergement (Historique quotidien/imports)
CREATE TABLE fact_hebergement (
    fact_id SERIAL PRIMARY KEY,
    hebergement_id INTEGER REFERENCES dim_hebergement(hebergement_id),
    localisation_id INTEGER REFERENCES dim_localisation(localisation_id),
    date_classement_id INTEGER REFERENCES dim_date(date_id),
    date_import_id INTEGER REFERENCES dim_date(date_id),
    temps_import_id INTEGER REFERENCES dim_temps(temps_id),
    classification_actuelle INTEGER,
    source_donnees VARCHAR(100)
);

-- FACT: Equipement_Hebergement (Bridge table pour la relation N:N)
CREATE TABLE fact_equipement_hebergement (
    hebergement_id INTEGER REFERENCES dim_hebergement(hebergement_id),
    equipement_id INTEGER REFERENCES dim_equipement(equipement_id),
    PRIMARY KEY (hebergement_id, equipement_id)
);

-- ==========================================
-- INDEXES (Pour garantir des requêtes < 500ms)
-- ==========================================
CREATE INDEX idx_fact_heb_id ON fact_hebergement(hebergement_id);
CREATE INDEX idx_fact_loc_id ON fact_hebergement(localisation_id);
CREATE INDEX idx_fact_date_class_id ON fact_hebergement(date_classement_id);
CREATE INDEX idx_fact_date_imp_id ON fact_hebergement(date_import_id);

-- ==========================================
-- VUES DE REPORTING
-- ==========================================
CREATE VIEW vw_hebergements_par_region AS
SELECT 
    COALESCE(l.region, 'Non définie') AS region,
    h.type_hebergement,
    COUNT(f.fact_id) as total_hebergements,
    ROUND(AVG(h.classification), 2) as moyenne_etoiles,
    SUM(h.nb_lits) as capacite_lits_totale
FROM fact_hebergement f
JOIN dim_hebergement h ON f.hebergement_id = h.hebergement_id
JOIN dim_localisation l ON f.localisation_id = l.localisation_id
GROUP BY l.region, h.type_hebergement
ORDER BY total_hebergements DESC;

-- ==========================================
-- POPULATION INITIALE DE LA DIM_DATE (2020 à 2030)
-- ==========================================
INSERT INTO dim_date (date_id, date_complete, jour_semaine, mois, trimestre, annee)
SELECT 
    TO_CHAR(datum, 'YYYYMMDD')::INT AS date_id,
    datum AS date_complete,
    EXTRACT(ISODOW FROM datum)::INT AS jour_semaine,
    EXTRACT(MONTH FROM datum)::INT AS mois,
    EXTRACT(QUARTER FROM datum)::INT AS trimestre,
    EXTRACT(YEAR FROM datum)::INT AS annee
FROM (
    -- Génère toutes les dates du 1er janvier 2020 au 31 décembre 2030
    SELECT generate_series('2020-01-01'::DATE, '2030-12-31'::DATE, '1 day'::INTERVAL) AS datum
) dates
ON CONFLICT (date_id) DO NOTHING;
