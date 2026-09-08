-- Demo enrichment data — STEP 3 (optional but recommended)
-- Run LAST: after 0000_full_schema.sql and seed-base.sql
-- Paste as one script into the Neon SQL Editor. Fully idempotent — safe to re-run.
-- Creates: demo users (sofia/kai, password admin123), the default company,
-- customers + contacts, 26 weeks of price history, sales orders, quotations.

CREATE TABLE IF NOT EXISTS seed_markers (key text PRIMARY KEY, applied_at timestamptz DEFAULT now());

-- Extra users (password for all demo logins: admin123)
INSERT INTO users (username, password_hash, display_name, role)
SELECT v.u, '$2b$10$3hHTS3NOmFrUqYdLU4NSfurdZ547YNwQHTaVmmPrm7KbqT0HlY7Tu', v.d, v.r
FROM (VALUES ('sofia', 'Sofia Berg', 'editor'), ('kai', 'Kai Werner', 'viewer')) AS v(u, d, r)
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = v.u);

-- Default company (letterhead entity)
INSERT INTO companies (name, official_name, address_english, telephone, is_default, notes)
SELECT 'Fiborge Trading', 'Fiborge Trading (Shanghai) Co., Ltd.',
       'Room 2108, Tower B, Hongqiao Business Center, Shanghai 200336, China',
       '+86 21 5298 7766', true, 'Default trading entity'
WHERE NOT EXISTS (SELECT 1 FROM companies WHERE name = 'Fiborge Trading');

-- Customers
INSERT INTO customers (name, official_name, country, telephone, notes)
SELECT v.* FROM (VALUES
  ('Aurora Knits', 'Aurora Knits Ltd.', 'Hong Kong', '+852 2345 8890', 'Mid-gauge knitwear manufacturer'),
  ('Studio Merino', 'Studio Merino S.r.l.', 'Italy', '+39 031 555 212', 'Premium knitwear atelier, Como'),
  ('Meridian Apparel', 'Meridian Apparel Group', 'Vietnam', '+84 28 3915 4470', 'Volume garment exporter, HCMC'),
  ('Nordwolle', 'Nordwolle GmbH', 'Germany', '+49 40 8741 220', 'Wool trader and spinner, Hamburg')
) AS v(name, official, country, tel, notes)
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE customers.name = v.name);

INSERT INTO customer_contacts (customer_id, contact_name, email, phone, position)
SELECT c.id, v.name, v.email, v.phone, v.position
FROM (VALUES
  ('Aurora Knits',  'Vivian Lau',   'vivian@auroraknits.hk',  '+852 9123 4400', 'Senior Merchandiser'),
  ('Studio Merino', 'Elena Ricci',  'elena@studiomerino.it',  '+39 331 774 883', 'Head of Sourcing'),
  ('Meridian Apparel', 'Thanh Nguyen', 'thanh.nguyen@meridian.vn', '+84 90 311 4477', 'Purchasing Manager'),
  ('Nordwolle', 'Jonas Krüger', 'j.krueger@nordwolle.de', '+49 172 555 0192', 'Trader')
) AS v(cname, name, email, phone, position)
JOIN customers c ON c.name = v.cname
WHERE NOT EXISTS (SELECT 1 FROM customer_contacts cc WHERE cc.customer_id = c.id AND cc.contact_name = v.name);

-- Weekly price history, ~26 weeks back from today, gentle uptrend with seasonality
INSERT INTO prices (yarn_id, price, currency, unit, record_date, incoterms, remarks, created_by)
SELECT
  v.yarn_id,
  round((v.base * (1 - 0.0082 * w.k + 0.013 * sin(w.k * 2.1 + v.yarn_id * 0.9)))::numeric, 2)::float,
  'USD', 'per KG',
  to_char(CURRENT_DATE - (w.k * 7), 'YYYY-MM-DD'),
  v.inc,
  NULL,
  1
FROM (VALUES
  (1,  27.85, 'CIF Shanghai'),
  (2,  29.50, 'CIF Shanghai'),
  (3,  31.20, 'CIF Shanghai'),
  (5,  24.50, 'CIF Shanghai'),
  (9,  30.50, 'CIF Shanghai'),
  (10, 32.80, 'CIF Shanghai'),
  (12, 36.20, 'CIF Shanghai'),
  (14, 42.80, 'CIF Shanghai'),
  (16, 55.20, 'CIF Shanghai'),
  (26, 28.50, 'CIF Shanghai'),
  (27, 30.80, 'CIF Shanghai'),
  (28, 33.50, 'CIF Shanghai'),
  (30, 38.80, 'CIF Shanghai'),
  (34, 26.80, 'FOB Shanghai'),
  (35, 29.20, 'FOB Shanghai'),
  (37, 33.80, 'FOB Shanghai')
) AS v(yarn_id, base, inc)
CROSS JOIN generate_series(1, 26) AS w(k)
WHERE NOT EXISTS (SELECT 1 FROM seed_markers WHERE key = 'demo-price-history');

INSERT INTO seed_markers (key) VALUES ('demo-price-history') ON CONFLICT DO NOTHING;

-- Fresh latest records (this week) so movers & "prices this week" light up
INSERT INTO prices (yarn_id, price, currency, unit, record_date, incoterms, remarks, created_by)
SELECT v.* FROM (VALUES
  (1, 28.15::float, 'USD', 'per KG', to_char(CURRENT_DATE - 1, 'YYYY-MM-DD'), 'CIF Shanghai', 'Renewed offer', 1),
  (2, 29.95::float, 'USD', 'per KG', to_char(CURRENT_DATE - 1, 'YYYY-MM-DD'), 'CIF Shanghai', NULL, 1),
  (26, 29.10::float, 'USD', 'per KG', to_char(CURRENT_DATE - 2, 'YYYY-MM-DD'), 'CIF Shanghai', 'Competitor quote seen', 2),
  (34, 27.30::float, 'USD', 'per KG', to_char(CURRENT_DATE - 2, 'YYYY-MM-DD'), 'FOB Shanghai', NULL, 2)
) AS v(yarn_id, price, currency, unit, rd, inc, remarks, cb)
WHERE NOT EXISTS (SELECT 1 FROM seed_markers WHERE key = 'demo-fresh-prices');

INSERT INTO seed_markers (key) VALUES ('demo-fresh-prices') ON CONFLICT DO NOTHING;

-- Sales orders (one overdue, one upcoming, one draft)
INSERT INTO sales_orders (so_no, company_id, customer_id, order_category, quantity_unit, payment_method, payment_days, customer_po_no, so_date, delivery_date, status, created_by)
SELECT 'SO-2026-018', co.id, c.id, 'Bulk', 'KGS', 'T/T', 60, 'AK-PO-7781',
       to_char(CURRENT_DATE - 46, 'YYYY-MM-DD'), to_char(CURRENT_DATE - 10, 'YYYY-MM-DD'), 'Confirmed', 1
FROM companies co, customers c
WHERE co.is_default AND c.name = 'Aurora Knits'
  AND NOT EXISTS (SELECT 1 FROM sales_orders WHERE so_no = 'SO-2026-018');

INSERT INTO so_items (so_id, yarn_id, color_name, color_code, quantity, unit_price, currency, unit, incoterms)
SELECT s.id, y, cn, cc, q, p, 'USD', 'per KG', 'CIF Shanghai'
FROM sales_orders s
JOIN (VALUES (2, 'Natural White', 'NW-01', '350', 30.10::float),
             (5, 'Charcoal Melange', 'CM-88', '200', 25.05::float)) AS i(y, cn, cc, q, p) ON s.so_no = 'SO-2026-018'
WHERE NOT EXISTS (SELECT 1 FROM so_items WHERE so_id = s.id);

INSERT INTO sales_orders (so_no, company_id, customer_id, order_category, quantity_unit, payment_method, payment_days, so_date, delivery_date, status, created_by)
SELECT 'SO-2026-019', co.id, c.id, 'Bulk', 'KGS', 'L/C', 90,
       to_char(CURRENT_DATE - 20, 'YYYY-MM-DD'), to_char(CURRENT_DATE + 9, 'YYYY-MM-DD'), 'Confirmed', 1
FROM companies co, customers c
WHERE co.is_default AND c.name = 'Meridian Apparel'
  AND NOT EXISTS (SELECT 1 FROM sales_orders WHERE so_no = 'SO-2026-019');

INSERT INTO so_items (so_id, yarn_id, color_name, color_code, quantity, unit_price, currency, unit, incoterms)
SELECT s.id, 9, 'Midnight Navy', 'MN-19', '500', 31.20, 'USD', 'per KG', 'CIF Hai Phong'
FROM sales_orders s
WHERE s.so_no = 'SO-2026-019'
  AND NOT EXISTS (SELECT 1 FROM so_items WHERE so_id = s.id);

INSERT INTO sales_orders (so_no, company_id, customer_id, order_category, quantity_unit, so_date, delivery_date, status, created_by)
SELECT 'SO-2026-021', co.id, c.id, 'Sample', 'KGS',
       to_char(CURRENT_DATE - 3, 'YYYY-MM-DD'), to_char(CURRENT_DATE + 25, 'YYYY-MM-DD'), 'Draft', 1
FROM companies co, customers c
WHERE co.is_default AND c.name = 'Studio Merino'
  AND NOT EXISTS (SELECT 1 FROM sales_orders WHERE so_no = 'SO-2026-021');

INSERT INTO so_items (so_id, yarn_id, color_name, quantity, unit_price, currency, unit, incoterms)
SELECT s.id, 12, 'Ecru', '120', 37.40, 'USD', 'per KG', 'CIF Genoa'
FROM sales_orders s
WHERE s.so_no = 'SO-2026-021'
  AND NOT EXISTS (SELECT 1 FROM so_items WHERE so_id = s.id);

-- Quotations (one expiring within 14 days -> dashboard alert)
INSERT INTO quotations (quote_no, company_id, customer_id, yarn_id, cost_price, quoted_price, currency, unit, quote_date, valid_until, incoterms, status, created_by)
SELECT 'QT-2026-104', co.id, c.id, 1, 23.14, 27.60, 'USD', 'per KG',
       to_char(CURRENT_DATE - 4, 'YYYY-MM-DD'), to_char(CURRENT_DATE + 10, 'YYYY-MM-DD'), 'CIF Hong Kong', 'Sent', 1
FROM companies co, customers c
WHERE co.is_default AND c.name = 'Aurora Knits'
  AND NOT EXISTS (SELECT 1 FROM quotations WHERE quote_no = 'QT-2026-104');

INSERT INTO quotations (quote_no, company_id, customer_id, yarn_id, cost_price, quoted_price, currency, unit, quote_date, valid_until, incoterms, status, created_by)
SELECT 'QT-2026-105', co.id, c.id, 9, 25.88, 30.90, 'USD', 'per KG',
       to_char(CURRENT_DATE - 2, 'YYYY-MM-DD'), to_char(CURRENT_DATE + 26, 'YYYY-MM-DD'), 'CIF Genoa', 'Sent', 1
FROM companies co, customers c
WHERE co.is_default AND c.name = 'Studio Merino'
  AND NOT EXISTS (SELECT 1 FROM quotations WHERE quote_no = 'QT-2026-105');

INSERT INTO quotations (quote_no, company_id, customer_id, yarn_id, cost_price, quoted_price, currency, quote_date, valid_until, incoterms, status, created_by)
SELECT 'QT-2026-101', co.id, c.id, 14, 37.90, 44.50, 'USD',
       to_char(CURRENT_DATE - 58, 'YYYY-MM-DD'), to_char(CURRENT_DATE - 28, 'YYYY-MM-DD'), 'CIF Hamburg', 'Accepted', 1
FROM companies co, customers c
WHERE co.is_default AND c.name = 'Nordwolle'
  AND NOT EXISTS (SELECT 1 FROM quotations WHERE quote_no = 'QT-2026-101');

-- System settings defaults
INSERT INTO system_settings (key, value, description, updated_by)
SELECT v.* FROM (VALUES
  ('default_currency', 'USD', 'Default quotation currency', 1::int),
  ('price_stale_days', '30', 'Days before a price counts as stale', 1::int),
  ('quote_validity_days', '30', 'Default quotation validity window', 1::int)
) AS v(key, value, description, ub)
WHERE NOT EXISTS (SELECT 1 FROM system_settings s WHERE s.key = v.key);
