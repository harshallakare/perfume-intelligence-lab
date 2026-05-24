-- =============================================================================
-- Seed: System Accords (org-agnostic reference accords)
-- These are pre-built accord templates shipped with the platform.
-- They use NULL organization_id to indicate system-wide availability.
-- Raw material references are illustrative; link to actual IDs after material import.
-- =============================================================================

-- NOTE: Run after raw_materials are seeded.
-- The INSERT below uses placeholder names; in production, resolve raw_material_id
-- via: SELECT id FROM raw_materials WHERE name = '<name>' AND organization_id IS NULL

-- Example structure — actual data populated during material seed + accord linking:
INSERT INTO accords (id, organization_id, name, category, description, is_system, is_public, projection, longevity, odor_profile, recommended_usage_pct_max)
VALUES
    (uuid_generate_v4(), NULL, 'Classic Amber Accord',    'amber',    'Warm, resinous amber base built on labdanum, benzyl benzoate, and vanilla', TRUE, TRUE, 7, 9, 'Warm, sweet, resinous, balsamic', 15.0),
    (uuid_generate_v4(), NULL, 'Deep Oud Accord',         'oud',      'Rich oud character combining agarwood-type materials with woody-animalic notes', TRUE, TRUE, 8, 10,'Woody, animalic, smoky, balsamic', 20.0),
    (uuid_generate_v4(), NULL, 'Fresh Marine Accord',     'marine',   'Ozonic, aquatic marine character', TRUE, TRUE, 7, 5, 'Aquatic, salty, fresh, ozonic', 12.0),
    (uuid_generate_v4(), NULL, 'Rose Soliflore Accord',   'rose',     'Classical rose accord — Damascus-type', TRUE, TRUE, 6, 7, 'Floral, rosy, slightly spicy', 30.0),
    (uuid_generate_v4(), NULL, 'Tobacco Leather Accord',  'tobacco',  'Dark, smoky tobacco with leather undertones', TRUE, TRUE, 6, 9, 'Tobacco, leather, smoky, woody', 10.0),
    (uuid_generate_v4(), NULL, 'White Musk Accord',       'musk',     'Clean, soft musk accord for foundation and longevity', TRUE, TRUE, 4, 8, 'Clean, powdery, soft, skin-like', 25.0),
    (uuid_generate_v4(), NULL, 'Vanilla Gourmand Accord', 'gourmand', 'Sweet vanilla with caramellic and tonka-bean facets', TRUE, TRUE, 5, 8, 'Sweet, creamy, caramellic, warm', 20.0),
    (uuid_generate_v4(), NULL, 'Blue Fougere Accord',     'blue',     'Fresh aromatic blue-type fougere', TRUE, TRUE, 8, 6, 'Fresh, aromatic, woody, spicy', 35.0),
    (uuid_generate_v4(), NULL, 'Citrus Burst Accord',     'citrus',   'Bright citrus top note accord', TRUE, TRUE, 9, 3, 'Citrus, zesty, sparkling, fresh', 40.0),
    (uuid_generate_v4(), NULL, 'Incense Accord',          'amber',    'Smoky, resinous incense character', TRUE, TRUE, 6, 8, 'Smoky, resinous, woody, balsamic', 15.0);
