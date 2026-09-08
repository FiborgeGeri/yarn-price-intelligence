-- Fiborge Sales & Sourcing Hub — BASELINE SEED DATA
-- Run this SECOND (right after scripts/migrations/0000_full_schema.sql)
-- Paste as one script into the Neon SQL Editor, on a fresh/empty database.
-- Creates: admin user (admin / admin123), mills, treatments, certificates,
-- yarn catalog and opening prices.

-- Admin user (password: admin123)
INSERT INTO users (username, password_hash, display_name, role)
VALUES ('admin', '$2b$10$3hHTS3NOmFrUqYdLU4NSfurdZ547YNwQHTaVmmPrm7KbqT0HlY7Tu', 'Admin', 'admin');

-- Yarn mills
INSERT INTO factories (factory_name, country, notes, relationship, parent_factory_id, status) VALUES
('Indorama Holding Ltd.', 'Thailand', 'Global textile & petrochemical group', 'My Factory', NULL, 'Active'),
('Schoeller Wool Austria GmbH', 'Austria', 'Premium worsted wool yarn specialist', 'My Factory', 1, 'Active'),
('Suedwolle Group', 'Germany', NULL, 'Competitor Factory', NULL, 'Active'),
('XINAO TEXTILES INC.', 'China', NULL, 'Competitor Factory', NULL, 'Active');

-- Treatments
INSERT INTO treatments (name) VALUES ('Anti-Shrinkage'), ('Basolan'), ('EXP'), ('TEC'), ('Untreated'), ('XCare');

-- Certificates
INSERT INTO certificates (cert_code, cert_full_name, category, issuing_body) VALUES
('EMAS', 'EU Eco-Management and Audit Scheme', 'Quality', 'European Commission'),
('ISO 14001', 'ISO 14001 Environmental Management', 'Quality', 'ISO'),
('ISO 9001', 'ISO 9001 Quality Management', 'Quality', 'ISO'),
('BSCI', 'Business Social Compliance Initiative', 'Social', 'amfori'),
('Fair Trade', 'Fair Trade Certified', 'Social', 'Fair Trade International'),
('SA8000', 'SA8000 Social Accountability', 'Social', 'SAI'),
('SEDEX', 'SEDEX SMETA', 'Social', 'Sedex'),
('GOTS', 'Global Organic Textile Standard', 'Textile', 'GOTS'),
('OEKO-TEX 100', 'OEKO-TEX Standard 100', 'Textile', 'OEKO-TEX Association'),
('OEKO-TEX MIG', 'OEKO-TEX Made in Green', 'Textile', 'OEKO-TEX Association'),
('bluesign', 'bluesign APPROVED', 'Textile', 'bluesign technologies'),
('ML-Free', 'Mulesing-Free Certified', 'Wool', 'Various'),
('NATIVA', 'NATIVA Precious Fiber', 'Wool', 'NATIVA'),
('RWS', 'Responsible Wool Standard', 'Wool', 'Textile Exchange'),
('SFA', 'Sustainable Fibre Alliance', 'Wool', 'SFA'),
('SustainaWOOL', 'SustainaWOOL', 'Wool', 'Schneider Group'),
('ZQ', 'ZQ Merino', 'Wool', 'The New Zealand Merino Company');

-- Own mill yarns (Indorama = id 1)
INSERT INTO yarns (yarn_name, factory_id, yarn_count, micron, treatment_id, composition) VALUES
('SIMPHONIE', 1, 'NM 30/2', '19.5', 5, '100% Wool'),
('SIMPHONIE', 1, 'NM 48/2', '19.5', 5, '100% Wool'),
('SIMPHONIE', 1, 'NM 60/2', '19.5', 5, '100% Wool'),
('SIMPHONIE', 1, 'NM 80/2', '19.5', 5, '100% Wool'),
('BRISBANE', 1, 'NM 28/2', '20.5', 5, '100% Wool'),
('BRISBANE', 1, 'NM 48/2', '20.5', 5, '100% Wool'),
('BRISBANE', 1, 'NM 60/2', '20.5', 5, '100% Wool'),
('BRISBANE RWS', 1, 'NM 48/2', '20.5', 5, '100% RWS Wool'),
('MELBOURNE', 1, 'NM 30/2', '18.5', 5, '100% Wool'),
('MELBOURNE', 1, 'NM 48/2', '18.5', 5, '100% Wool'),
('MELBOURNE', 1, 'NM 60/2', '18.5', 5, '100% Wool'),
('ADELAIDE', 1, 'NM 48/2', '17.5', 5, '100% Wool'),
('ADELAIDE', 1, 'NM 60/2', '17.5', 5, '100% Wool'),
('PERTH', 1, 'NM 48/2', '16.5', 5, '100% Wool'),
('PERTH', 1, 'NM 60/2', '16.5', 5, '100% Wool'),
('DARWIN', 1, 'NM 48/2', '15.5', 5, '100% Wool'),
('DARWIN', 1, 'NM 60/2', '15.5', 5, '100% Wool'),
('CAIRNS', 1, 'NM 48/2', '19.5', 1, '100% Wool'),
('CAIRNS', 1, 'NM 60/2', '19.5', 1, '100% Wool'),
('HOBART', 1, 'NM 48/2', '18.5', 2, '100% Wool'),
('HOBART', 1, 'NM 60/2', '18.5', 2, '100% Wool'),
('CANBERRA', 1, 'NM 48/2', '17.5', 6, '100% Wool'),
('CANBERRA', 1, 'NM 60/2', '17.5', 6, '100% Wool'),
('SYDNEY', 1, 'NM 48/2', '19.5', 3, '100% Wool'),
('SYDNEY', 1, 'NM 60/2', '19.5', 3, '100% Wool');

-- Competitor yarns (Suedwolle = 3, XINAO = 4)
INSERT INTO yarns (yarn_name, factory_id, yarn_count, micron, treatment_id, composition) VALUES
('SW BIELLA YARN', 3, 'NM 48/2', '19.5', 5, '100% Wool'),
('SW BIELLA YARN', 3, 'NM 60/2', '19.5', 5, '100% Wool'),
('SW PREMIUM', 3, 'NM 48/2', '18.5', 5, '100% Wool'),
('SW PREMIUM', 3, 'NM 60/2', '18.5', 5, '100% Wool'),
('SW ULTRA', 3, 'NM 48/2', '17.5', 5, '100% Wool'),
('SW ULTRA', 3, 'NM 60/2', '17.5', 5, '100% Wool'),
('SW CLASSIC', 3, 'NM 48/2', '20.5', 5, '100% Wool'),
('SW CLASSIC', 3, 'NM 60/2', '20.5', 5, '100% Wool'),
('XN MERINO TOP', 4, 'NM 48/2', '19.5', 5, '100% Wool'),
('XN MERINO TOP', 4, 'NM 60/2', '19.5', 5, '100% Wool'),
('XN FINE', 4, 'NM 48/2', '18.5', 5, '100% Wool'),
('XN FINE', 4, 'NM 60/2', '18.5', 5, '100% Wool'),
('XN CLASSIC', 4, 'NM 48/2', '20.5', 5, '100% Wool'),
('XN CLASSIC', 4, 'NM 60/2', '20.5', 5, '100% Wool'),
('XN SUPER', 4, 'NM 48/2', '17.5', 5, '100% Wool'),
('XN SUPER', 4, 'NM 60/2', '17.5', 5, '100% Wool');

-- Opening prices
INSERT INTO prices (yarn_id, price, currency, unit, record_date, incoterms, remarks) VALUES
(1, 27.85, 'USD', 'per KG', '2026-07-20', 'CIF Shanghai', 'Standard quote'),
(2, 29.50, 'USD', 'per KG', '2026-07-20', 'CIF Shanghai', NULL),
(3, 31.20, 'USD', 'per KG', '2026-07-20', 'CIF Shanghai', NULL),
(4, 33.80, 'USD', 'per KG', '2026-07-20', 'CIF Shanghai', NULL),
(5, 24.50, 'USD', 'per KG', '2026-07-18', 'CIF Shanghai', NULL),
(6, 26.30, 'USD', 'per KG', '2026-07-18', 'CIF Shanghai', NULL),
(7, 28.10, 'USD', 'per KG', '2026-07-18', 'CIF Shanghai', NULL),
(9, 30.50, 'USD', 'per KG', '2026-07-15', 'CIF Shanghai', NULL),
(10, 32.80, 'USD', 'per KG', '2026-07-15', 'CIF Shanghai', NULL),
(11, 34.50, 'USD', 'per KG', '2026-07-15', 'CIF Shanghai', NULL),
(12, 36.20, 'USD', 'per KG', '2026-07-12', 'CIF Shanghai', NULL),
(13, 38.50, 'USD', 'per KG', '2026-07-12', 'CIF Shanghai', NULL),
(14, 42.80, 'USD', 'per KG', '2026-07-10', 'CIF Shanghai', NULL),
(15, 44.50, 'USD', 'per KG', '2026-07-10', 'CIF Shanghai', NULL),
(16, 55.20, 'USD', 'per KG', '2026-07-08', 'CIF Shanghai', NULL),
(17, 57.80, 'USD', 'per KG', '2026-07-08', 'CIF Shanghai', NULL),
(26, 28.50, 'USD', 'per KG', '2026-07-20', 'CIF Shanghai', NULL),
(27, 30.80, 'USD', 'per KG', '2026-07-20', 'CIF Shanghai', NULL),
(28, 33.50, 'USD', 'per KG', '2026-07-18', 'CIF Shanghai', NULL),
(29, 35.20, 'USD', 'per KG', '2026-07-18', 'CIF Shanghai', NULL),
(30, 38.80, 'USD', 'per KG', '2026-07-15', 'CIF Shanghai', NULL),
(31, 40.50, 'USD', 'per KG', '2026-07-15', 'CIF Shanghai', NULL),
(34, 26.80, 'USD', 'per KG', '2026-07-20', 'FOB Shanghai', NULL),
(35, 29.20, 'USD', 'per KG', '2026-07-20', 'FOB Shanghai', NULL),
(36, 31.50, 'USD', 'per KG', '2026-07-18', 'FOB Shanghai', NULL),
(37, 33.80, 'USD', 'per KG', '2026-07-18', 'FOB Shanghai', NULL),
(1, 27.20, 'USD', 'per KG', '2026-07-13', 'CIF Shanghai', 'Previous quote'),
(2, 28.90, 'USD', 'per KG', '2026-07-13', 'CIF Shanghai', NULL),
(3, 30.50, 'USD', 'per KG', '2026-07-06', 'CIF Shanghai', NULL),
(5, 23.80, 'USD', 'per KG', '2026-07-06', 'CIF Shanghai', NULL),
(9, 29.80, 'USD', 'per KG', '2026-07-06', 'CIF Shanghai', NULL),
(26, 27.80, 'USD', 'per KG', '2026-07-13', 'CIF Shanghai', NULL),
(34, 25.90, 'USD', 'per KG', '2026-07-13', 'FOB Shanghai', NULL);
