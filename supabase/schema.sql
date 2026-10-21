-- =============================================
-- BAZARSETU AI — SUPABASE SCHEMA + SEED DATA
-- Run this ENTIRE file in Supabase SQL Editor
-- =============================================

-- Drop tables if re-running
DROP TABLE IF EXISTS mandi_price_history CASCADE;
DROP TABLE IF EXISTS mandis CASCADE;
DROP TABLE IF EXISTS crops CASCADE;

-- =============================================
-- TABLE 1: crops
-- =============================================
CREATE TABLE crops (
  id             TEXT PRIMARY KEY,          -- 'wheat', 'potato', etc.
  name           TEXT NOT NULL,             -- 'Wheat (Gehun)'
  name_hi        TEXT NOT NULL,             -- 'गेहूं (Wheat)'
  unit           TEXT NOT NULL DEFAULT '₹/Quintal',
  seasonal_oct_avg INTEGER NOT NULL,        -- 3-year Oct average
  msp            INTEGER NOT NULL DEFAULT 0 -- Min support price (0 if N/A)
);

-- =============================================
-- TABLE 2: mandis
-- =============================================
CREATE TABLE mandis (
  id                TEXT PRIMARY KEY,       -- 'UP_LKO_01'
  crop_id           TEXT NOT NULL REFERENCES crops(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  name_hi           TEXT NOT NULL,
  district          TEXT NOT NULL,
  state_code        TEXT NOT NULL,          -- 'UP', 'RJ', 'MH'
  distance_km       INTEGER NOT NULL,
  today_modal       INTEGER,                -- NULL = no rate reported
  prev_modal        INTEGER,
  last_reported_date TEXT NOT NULL,
  arrivals_tonnes   NUMERIC NOT NULL DEFAULT 0,
  lat               NUMERIC NOT NULL,
  lng               NUMERIC NOT NULL
);

-- =============================================
-- TABLE 3: mandi_price_history (7-day history)
-- =============================================
CREATE TABLE mandi_price_history (
  id         SERIAL PRIMARY KEY,
  mandi_id   TEXT NOT NULL REFERENCES mandis(id) ON DELETE CASCADE,
  day_index  INTEGER NOT NULL,              -- 0 = oldest, 6 = today
  price      INTEGER                        -- NULL = honest gap
);

-- Enable Row Level Security (read-only for anon users)
ALTER TABLE crops ENABLE ROW LEVEL SECURITY;
ALTER TABLE mandis ENABLE ROW LEVEL SECURITY;
ALTER TABLE mandi_price_history ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Public read crops"   ON crops   FOR SELECT USING (true);
CREATE POLICY "Public read mandis"  ON mandis  FOR SELECT USING (true);
CREATE POLICY "Public read history" ON mandi_price_history FOR SELECT USING (true);

-- =============================================
-- SEED DATA: crops
-- =============================================
INSERT INTO crops (id, name, name_hi, unit, seasonal_oct_avg, msp) VALUES
  ('wheat',   'Wheat (Gehun)',       'गेहूं (Wheat)',    '₹/Quintal', 2380, 2275),
  ('potato',  'Potato (Aloo)',       'आलू (Potato)',     '₹/Quintal', 1680, 1450),
  ('mustard', 'Mustard (Sarson)',    'सरसों (Mustard)',  '₹/Quintal', 5450, 5650),
  ('paddy',   'Paddy (Dhan)',        'धान (Paddy)',      '₹/Quintal', 2320, 2300),
  ('onion',   'Onion (Kanda/Pyaz)', 'प्याज (Onion)',    '₹/Quintal', 2600, 0),
  ('tomato',  'Tomato (Tamatar)',    'टमाटर (Tomato)',   '₹/Quintal', 1550, 0);

-- =============================================
-- SEED DATA: mandis — WHEAT
-- =============================================
INSERT INTO mandis (id, crop_id, name, name_hi, district, state_code, distance_km, today_modal, prev_modal, last_reported_date, arrivals_tonnes, lat, lng) VALUES
  ('UP_LKO_01',  'wheat', 'Lucknow (Dubagga)',          'लखनऊ (दुबग्गा) मंडी',              'Lucknow',      'UP', 12,  2475, 2460, '2026-10-21 (Today, 09:30 AM)', 120, 26.8660, 80.8655),
  ('UP_KNP_01',  'wheat', 'Kanpur (Chakeri)',            'कानपुर (चकेरी) मंडी',              'Kanpur Nagar', 'UP', 64,  2520, 2510, '2026-10-21 (Today, 10:15 AM)', 280, 26.4070, 80.3983),
  ('UP_BBK_01',  'wheat', 'Barabanki Mandi',             'बाराबंकी मंडी',                    'Barabanki',    'UP', 28,  2455, 2440, '2026-10-21 (Today, 09:00 AM)',  95, 26.9268, 81.1834),
  ('UP_STP_01',  'wheat', 'Sitapur APMC',                'सीतापुर मंडी',                     'Sitapur',      'UP', 88,  2430, 2420, '2026-10-21 (Today, 08:30 AM)', 110, 27.5684, 80.6829),
  ('UP_LKO_02',  'wheat', 'Malihabad',                   'मलिहाबाद मंडी (मौन)',               'Lucknow',      'UP', 26,  NULL, 2390, '2026-10-14 (7d old)',           0, 26.9214, 80.7118),
  ('UP_LKO_03',  'wheat', 'Mohanlalganj APMC',           'मोहनलालगंज मंडी (पुरानी दर)',       'Lucknow',      'UP', 32,  NULL, 2415, '2026-10-17 (4d old)',           0, 26.6718, 80.9822),
  ('UP_PBH_01',  'wheat', 'Pratapgarh APMC (UP)',        'प्रतापगढ़ मंडी (उत्तर प्रदेश)',     'Pratapgarh',   'UP', 142, 2460, 2450, '2026-10-21 (Today)',           75, 25.8942, 81.9442),
  ('RJ_PBH_01',  'wheat', 'Pratapgarh Krishi Mandi (RJ)','प्रतापगढ़ मंडी (राजस्थान)',        'Pratapgarh',   'RJ', 680, 2540, 2530, '2026-10-21 (Today)',          180, 24.0315, 74.7813);

-- =============================================
-- SEED DATA: mandis — POTATO
-- =============================================
INSERT INTO mandis (id, crop_id, name, name_hi, district, state_code, distance_km, today_modal, prev_modal, last_reported_date, arrivals_tonnes, lat, lng) VALUES
  ('UP_LKO_01_P', 'potato', 'Lucknow (Dubagga)', 'लखनऊ (दुबग्गा) मंडी', 'Lucknow',      'UP', 12, 1790, 1760, '2026-10-21 (Today, 10:00 AM)', 310, 26.8660, 80.8655),
  ('UP_BBK_01_P', 'potato', 'Barabanki Mandi',   'बाराबंकी मंडी',        'Barabanki',    'UP', 28, 1860, 1810, '2026-10-21 (Today, 09:30 AM)', 145, 26.9268, 81.1834),
  ('UP_KNP_01_P', 'potato', 'Kanpur (Chakeri)',   'कानपुर मंडी',          'Kanpur Nagar', 'UP', 82, 1900, 1910, '2026-10-21 (Today, 08:45 AM)', 490, 26.4070, 80.3983),
  ('UP_STP_01_P', 'potato', 'Sitapur Mandi',      'सीतापुर मंडी',         'Sitapur',      'UP', 88, NULL, 1810, '2026-10-19 (2d old)',            0, 27.5684, 80.6829);

-- =============================================
-- SEED DATA: mandis — MUSTARD
-- =============================================
INSERT INTO mandis (id, crop_id, name, name_hi, district, state_code, distance_km, today_modal, prev_modal, last_reported_date, arrivals_tonnes, lat, lng) VALUES
  ('UP_BBK_01_M', 'mustard', 'Barabanki Mandi',    'बाराबंकी मंडी', 'Barabanki',    'UP', 28, 5820, 5760, '2026-10-21 (Today, 10:05 AM)',  85, 26.9268, 81.1834),
  ('UP_LKO_01_M', 'mustard', 'Lucknow (Dubagga)',   'लखनऊ मंडी',    'Lucknow',      'UP', 12, 5710, 5715, '2026-10-21 (Today, 09:40 AM)', 120, 26.8660, 80.8655),
  ('UP_KNP_01_M', 'mustard', 'Kanpur Mandi',        'कानपुर मंडी',  'Kanpur Nagar', 'UP', 72, 5890, 5840, '2026-10-21 (Today)',           140, 26.4070, 80.3983);

-- =============================================
-- SEED DATA: mandis — PADDY
-- =============================================
INSERT INTO mandis (id, crop_id, name, name_hi, district, state_code, distance_km, today_modal, prev_modal, last_reported_date, arrivals_tonnes, lat, lng) VALUES
  ('UP_LKO_01_PD', 'paddy', 'Lucknow (Dubagga)', 'लखनऊ (बासमती 1509)', 'Lucknow',   'UP', 12,  3450, 3410, '2026-10-21 (Today)', 220, 26.8660, 80.8655),
  ('UP_BBK_01_PD', 'paddy', 'Barabanki Mandi',   'बाराबंकी (धान कॉमन)', 'Barabanki', 'UP', 28,  2280, 2260, '2026-10-21 (Today)', 160, 26.9268, 81.1834),
  ('UP_HRD_01_PD', 'paddy', 'Hardoi Mandi',       'हरदोई मंडी',          'Hardoi',    'UP', 105, 2340, 2310, '2026-10-21 (Today)', 290, 27.3989, 80.1312);

-- =============================================
-- SEED DATA: mandis — ONION
-- =============================================
INSERT INTO mandis (id, crop_id, name, name_hi, district, state_code, distance_km, today_modal, prev_modal, last_reported_date, arrivals_tonnes, lat, lng) VALUES
  ('MH_NSK_01',    'onion', 'Nashik (Pimpalgaon)', 'नासिक (पिंपलगांव)',    'Nashik',       'MH', 1180, 2850, 2780, '2026-10-21 (Today)', 950, 20.1667, 73.9833),
  ('UP_LKO_01_ON', 'onion', 'Lucknow (Dubagga)',   'लखनऊ (दुबग्गा) मंडी', 'Lucknow',      'UP',   12, 2540, 2510, '2026-10-21 (Today)', 210, 26.8660, 80.8655),
  ('UP_KNP_01_ON', 'onion', 'Kanpur Mandi',         'कानपुर मंडी',          'Kanpur Nagar', 'UP',   72, 2620, 2590, '2026-10-21 (Today)', 340, 26.4070, 80.3983);

-- =============================================
-- SEED DATA: mandis — TOMATO
-- =============================================
INSERT INTO mandis (id, crop_id, name, name_hi, district, state_code, distance_km, today_modal, prev_modal, last_reported_date, arrivals_tonnes, lat, lng) VALUES
  ('UP_LKO_01_T', 'tomato', 'Lucknow (Dubagga)', 'लखनऊ (दुबग्गा)', 'Lucknow',   'UP', 12, 1420, 1480, '2026-10-21 (Today)', 180, 26.8660, 80.8655),
  ('UP_BBK_01_T', 'tomato', 'Barabanki Mandi',   'बाराबंकी मंडी',   'Barabanki', 'UP', 28, 1490, 1450, '2026-10-21 (Today)',  90, 26.9268, 81.1834),
  ('UP_UNN_01_T', 'tomato', 'Unnao Mandi',        'उन्नाव मंडी',      'Unnao',     'UP', 58, 1520, 1500, '2026-10-21 (Today)', 110, 26.5458, 80.4905);

-- =============================================
-- SEED DATA: 7-day price history — WHEAT
-- =============================================
INSERT INTO mandi_price_history (mandi_id, day_index, price) VALUES
  ('UP_LKO_01', 0, 2420), ('UP_LKO_01', 1, 2435), ('UP_LKO_01', 2, NULL),
  ('UP_LKO_01', 3, 2450), ('UP_LKO_01', 4, 2450), ('UP_LKO_01', 5, 2460), ('UP_LKO_01', 6, 2475),

  ('UP_KNP_01', 0, 2470), ('UP_KNP_01', 1, 2480), ('UP_KNP_01', 2, 2490),
  ('UP_KNP_01', 3, NULL),  ('UP_KNP_01', 4, 2495), ('UP_KNP_01', 5, 2510), ('UP_KNP_01', 6, 2520),

  ('UP_BBK_01', 0, 2400), ('UP_BBK_01', 1, 2415), ('UP_BBK_01', 2, NULL),
  ('UP_BBK_01', 3, 2430), ('UP_BBK_01', 4, NULL),  ('UP_BBK_01', 5, 2440), ('UP_BBK_01', 6, 2455),

  ('UP_STP_01', 0, 2400), ('UP_STP_01', 1, NULL),  ('UP_STP_01', 2, 2410),
  ('UP_STP_01', 3, NULL),  ('UP_STP_01', 4, 2420), ('UP_STP_01', 5, NULL),  ('UP_STP_01', 6, 2430),

  ('UP_LKO_02', 0, NULL),  ('UP_LKO_02', 1, NULL),  ('UP_LKO_02', 2, NULL),
  ('UP_LKO_02', 3, NULL),  ('UP_LKO_02', 4, NULL),  ('UP_LKO_02', 5, NULL),  ('UP_LKO_02', 6, NULL),

  ('UP_LKO_03', 0, NULL),  ('UP_LKO_03', 1, NULL),  ('UP_LKO_03', 2, 2415),
  ('UP_LKO_03', 3, NULL),  ('UP_LKO_03', 4, NULL),  ('UP_LKO_03', 5, NULL),  ('UP_LKO_03', 6, NULL),

  ('UP_PBH_01', 0, NULL),  ('UP_PBH_01', 1, NULL),  ('UP_PBH_01', 2, NULL),
  ('UP_PBH_01', 3, 2440), ('UP_PBH_01', 4, NULL),  ('UP_PBH_01', 5, 2450), ('UP_PBH_01', 6, 2460),

  ('RJ_PBH_01', 0, NULL),  ('RJ_PBH_01', 1, NULL),  ('RJ_PBH_01', 2, NULL),
  ('RJ_PBH_01', 3, NULL),  ('RJ_PBH_01', 4, 2530), ('RJ_PBH_01', 5, NULL),  ('RJ_PBH_01', 6, 2540);

-- SEED DATA: history — POTATO
INSERT INTO mandi_price_history (mandi_id, day_index, price) VALUES
  ('UP_LKO_01_P', 0, 1680), ('UP_LKO_01_P', 1, 1700), ('UP_LKO_01_P', 2, 1720),
  ('UP_LKO_01_P', 3, 1740), ('UP_LKO_01_P', 4, 1740), ('UP_LKO_01_P', 5, 1760), ('UP_LKO_01_P', 6, 1790),

  ('UP_BBK_01_P', 0, 1710), ('UP_BBK_01_P', 1, NULL),  ('UP_BBK_01_P', 2, 1730),
  ('UP_BBK_01_P', 3, 1775), ('UP_BBK_01_P', 4, NULL),  ('UP_BBK_01_P', 5, 1810), ('UP_BBK_01_P', 6, 1860),

  ('UP_KNP_01_P', 0, NULL),  ('UP_KNP_01_P', 1, 1940), ('UP_KNP_01_P', 2, NULL),
  ('UP_KNP_01_P', 3, 1920), ('UP_KNP_01_P', 4, NULL),  ('UP_KNP_01_P', 5, 1910), ('UP_KNP_01_P', 6, 1900),

  ('UP_STP_01_P', 0, 1750), ('UP_STP_01_P', 1, 1780), ('UP_STP_01_P', 2, 1800),
  ('UP_STP_01_P', 3, 1810), ('UP_STP_01_P', 4, 1810), ('UP_STP_01_P', 5, NULL),  ('UP_STP_01_P', 6, NULL);

-- SEED DATA: history — MUSTARD
INSERT INTO mandi_price_history (mandi_id, day_index, price) VALUES
  ('UP_BBK_01_M', 0, 5600), ('UP_BBK_01_M', 1, 5620), ('UP_BBK_01_M', 2, 5650),
  ('UP_BBK_01_M', 3, 5690), ('UP_BBK_01_M', 4, NULL),  ('UP_BBK_01_M', 5, 5760), ('UP_BBK_01_M', 6, 5820),

  ('UP_LKO_01_M', 0, 5750), ('UP_LKO_01_M', 1, 5740), ('UP_LKO_01_M', 2, 5730),
  ('UP_LKO_01_M', 3, 5730), ('UP_LKO_01_M', 4, 5720), ('UP_LKO_01_M', 5, 5715), ('UP_LKO_01_M', 6, 5710),

  ('UP_KNP_01_M', 0, 5700), ('UP_KNP_01_M', 1, 5750), ('UP_KNP_01_M', 2, 5780),
  ('UP_KNP_01_M', 3, 5800), ('UP_KNP_01_M', 4, 5820), ('UP_KNP_01_M', 5, 5840), ('UP_KNP_01_M', 6, 5890);

-- SEED DATA: history — PADDY
INSERT INTO mandi_price_history (mandi_id, day_index, price) VALUES
  ('UP_LKO_01_PD', 0, 3320), ('UP_LKO_01_PD', 1, 3350), ('UP_LKO_01_PD', 2, 3380),
  ('UP_LKO_01_PD', 3, 3390), ('UP_LKO_01_PD', 4, 3410), ('UP_LKO_01_PD', 5, 3410), ('UP_LKO_01_PD', 6, 3450),

  ('UP_BBK_01_PD', 0, 2210), ('UP_BBK_01_PD', 1, 2220), ('UP_BBK_01_PD', 2, 2240),
  ('UP_BBK_01_PD', 3, NULL),  ('UP_BBK_01_PD', 4, 2260), ('UP_BBK_01_PD', 5, 2260), ('UP_BBK_01_PD', 6, 2280),

  ('UP_HRD_01_PD', 0, 2250), ('UP_HRD_01_PD', 1, 2270), ('UP_HRD_01_PD', 2, 2290),
  ('UP_HRD_01_PD', 3, 2300), ('UP_HRD_01_PD', 4, NULL),  ('UP_HRD_01_PD', 5, 2310), ('UP_HRD_01_PD', 6, 2340);

-- SEED DATA: history — ONION
INSERT INTO mandi_price_history (mandi_id, day_index, price) VALUES
  ('MH_NSK_01',    0, 2500), ('MH_NSK_01',    1, 2580), ('MH_NSK_01',    2, NULL),
  ('MH_NSK_01',    3, 2650), ('MH_NSK_01',    4, 2720), ('MH_NSK_01',    5, 2780), ('MH_NSK_01',    6, 2850),

  ('UP_LKO_01_ON', 0, 2400), ('UP_LKO_01_ON', 1, 2430), ('UP_LKO_01_ON', 2, 2460),
  ('UP_LKO_01_ON', 3, 2490), ('UP_LKO_01_ON', 4, 2500), ('UP_LKO_01_ON', 5, 2510), ('UP_LKO_01_ON', 6, 2540),

  ('UP_KNP_01_ON', 0, 2500), ('UP_KNP_01_ON', 1, 2520), ('UP_KNP_01_ON', 2, NULL),
  ('UP_KNP_01_ON', 3, 2550), ('UP_KNP_01_ON', 4, 2580), ('UP_KNP_01_ON', 5, 2590), ('UP_KNP_01_ON', 6, 2620);

-- SEED DATA: history — TOMATO
INSERT INTO mandi_price_history (mandi_id, day_index, price) VALUES
  ('UP_LKO_01_T', 0, 1600), ('UP_LKO_01_T', 1, 1550), ('UP_LKO_01_T', 2, NULL),
  ('UP_LKO_01_T', 3, 1500), ('UP_LKO_01_T', 4, 1490), ('UP_LKO_01_T', 5, 1480), ('UP_LKO_01_T', 6, 1420),

  ('UP_BBK_01_T', 0, 1400), ('UP_BBK_01_T', 1, 1420), ('UP_BBK_01_T', 2, NULL),
  ('UP_BBK_01_T', 3, 1440), ('UP_BBK_01_T', 4, 1440), ('UP_BBK_01_T', 5, 1450), ('UP_BBK_01_T', 6, 1490),

  ('UP_UNN_01_T', 0, 1450), ('UP_UNN_01_T', 1, 1460), ('UP_UNN_01_T', 2, 1480),
  ('UP_UNN_01_T', 3, NULL),  ('UP_UNN_01_T', 4, 1500), ('UP_UNN_01_T', 5, 1500), ('UP_UNN_01_T', 6, 1520);

-- Done! Verify with:
-- SELECT c.name, COUNT(m.id) as mandi_count FROM crops c JOIN mandis m ON m.crop_id = c.id GROUP BY c.name;
