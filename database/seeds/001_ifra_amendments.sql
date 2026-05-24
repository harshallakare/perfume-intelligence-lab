-- =============================================================================
-- Seed: IFRA Amendments Reference Data
-- =============================================================================

INSERT INTO ifra_amendments (amendment_number, published_date, effective_date, notes, is_current) VALUES
    (49, '2020-06-01', '2020-06-01', 'IFRA 49th Amendment', FALSE),
    (50, '2021-06-01', '2022-01-01', 'IFRA 50th Amendment', FALSE),
    (51, '2022-10-01', '2023-01-01', 'IFRA 51st Amendment — expanded sensitizer data', TRUE);

-- ---------------------------------------------------------------------------
-- Seed: Common restricted/prohibited materials (subset for reference)
-- Based on IFRA 51st Amendment public data
-- ---------------------------------------------------------------------------
WITH current_amendment AS (
    SELECT id FROM ifra_amendments WHERE is_current = TRUE LIMIT 1
)
INSERT INTO ifra_restrictions (
    ifra_amendment_id, cas_number, material_name, category, restriction_type, max_limit_pct, notes
)
SELECT
    ca.id,
    r.cas_number,
    r.material_name,
    r.category::ifra_category_enum,
    r.restriction_type,
    r.max_limit_pct,
    r.notes
FROM current_amendment ca, (VALUES
    -- Oakmoss (Evernia prunastri extract) — sensitizer
    ('90028-68-5', 'Oakmoss Extract', 'cat_4',  'max_limit', 0.001,  'Restricted sensitizer — effectively prohibited in leave-on'),
    ('90028-68-5', 'Oakmoss Extract', 'cat_11a','max_limit', 0.100,  'Fine fragrance limit'),
    -- Treemoss (Evernia furfuracea)
    ('90028-67-4', 'Treemoss Extract','cat_4',  'max_limit', 0.002,  'Restricted sensitizer'),
    ('90028-67-4', 'Treemoss Extract','cat_11a','max_limit', 0.400,  'Fine fragrance limit'),
    -- Eugenol
    ('97-53-0',    'Eugenol',        'cat_4',  'max_limit', 0.500,  'Leave-on products'),
    ('97-53-0',    'Eugenol',        'cat_9',  'max_limit', 1.000,  'Rinse-off products'),
    ('97-53-0',    'Eugenol',        'cat_11a','max_limit', 0.500,  'Fine fragrance'),
    -- Isoeugenol
    ('97-54-1',    'Isoeugenol',     'cat_4',  'max_limit', 0.020,  'Leave-on products'),
    ('97-54-1',    'Isoeugenol',     'cat_11a','max_limit', 0.020,  'Fine fragrance'),
    -- Cinnamaldehyde
    ('104-55-2',   'Cinnamaldehyde', 'cat_4',  'max_limit', 0.050,  'Leave-on products'),
    ('104-55-2',   'Cinnamaldehyde', 'cat_9',  'max_limit', 0.200,  'Rinse-off'),
    -- Citral
    ('5392-40-5',  'Citral',         'cat_4',  'max_limit', 0.600,  'Leave-on products'),
    ('5392-40-5',  'Citral',         'cat_11a','max_limit', 3.400,  'Fine fragrance'),
    -- Linalool
    ('78-70-6',    'Linalool',       'cat_4',  'max_limit', 5.500,  'Leave-on products'),
    ('78-70-6',    'Linalool',       'cat_11a','max_limit',15.000,  'Fine fragrance'),
    -- Limonene
    ('5989-27-5',  'D-Limonene',     'cat_4',  'max_limit', 2.000,  'Leave-on'),
    ('5989-27-5',  'D-Limonene',     'cat_11a','max_limit',15.000,  'Fine fragrance'),
    -- Hydroxycitronellal
    ('107-75-5',   'Hydroxycitronellal','cat_4','max_limit',1.000,  'Leave-on'),
    ('107-75-5',   'Hydroxycitronellal','cat_11a','max_limit',1.500,'Fine fragrance'),
    -- Lyral (HICC) — prohibited
    ('31906-04-4', 'HICC (Lyral)',   'cat_4',  'prohibited', NULL,   'Prohibited in EU — potent sensitizer'),
    ('31906-04-4', 'HICC (Lyral)',   'cat_11a','prohibited', NULL,   'Prohibited in EU — potent sensitizer'),
    -- Nitromusks — Musk Ambrette prohibited
    ('83-66-9',    'Musk Ambrette',  'cat_11a','prohibited', NULL,   'Prohibited — phototoxic'),
    -- Bergamot FCF
    ('68647-75-6', 'Bergamot Oil FCF','cat_4', 'max_limit', 0.400,  'Bergapten-free, leave-on'),
    ('68647-75-6', 'Bergamot Oil FCF','cat_11a','max_limit',11.800, 'Fine fragrance'),
    -- Geraniol
    ('106-24-1',   'Geraniol',       'cat_4',  'max_limit', 5.300,  'Leave-on'),
    ('106-24-1',   'Geraniol',       'cat_11a','max_limit',18.900,  'Fine fragrance')
) AS r(cas_number, material_name, category, restriction_type, max_limit_pct, notes);
