-- ================================================================
-- FINANCE MODULE — SCRIPT 5 of 5: system_settings + default values
-- This one is safe to re-run (ON CONFLICT DO NOTHING).
-- ================================================================

CREATE TABLE public.system_settings (
    id integer NOT NULL,
    key character varying(100) NOT NULL,
    value text,
    description text,
    updated_at timestamp without time zone DEFAULT now(),
    updated_by integer
);
CREATE SEQUENCE public.system_settings_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.system_settings_id_seq OWNED BY public.system_settings.id;
ALTER TABLE ONLY public.system_settings ALTER COLUMN id SET DEFAULT nextval('public.system_settings_id_seq'::regclass);
ALTER TABLE ONLY public.system_settings ADD CONSTRAINT system_settings_key_unique UNIQUE (key);
ALTER TABLE ONLY public.system_settings ADD CONSTRAINT system_settings_pkey PRIMARY KEY (id);

-- Default settings rows
INSERT INTO system_settings (key, value, description) VALUES
  ('default_vat_rate', '0', 'Default VAT rate (%) applied to new invoices, e.g. 7 for Thailand, 13 for China. Documents keep their own rate once created.'),
  ('default_currency', 'USD', 'Default currency preselected for new invoices and payments.'),
  ('invoice_no_prefix', 'FINV', 'Prefix used when auto-generating sales invoice numbers.'),
  ('default_payment_days', '30', 'Default payment term (days) used to suggest invoice due dates.')
ON CONFLICT (key) DO NOTHING;
