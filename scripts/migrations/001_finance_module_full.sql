-- ================================================================
-- Finance module migration for Neon (run ONCE in the Neon SQL Editor)
-- Adds: invoices, invoice_items, payments, supplier_invoices,
--       supplier_invoice_items, supplier_payments, system_settings
-- No existing tables or data are modified.
-- ================================================================

CREATE TABLE public.invoice_items (
    id integer NOT NULL,
    invoice_id integer,
    yarn_id integer,
    description character varying(500),
    color_name character varying(200),
    color_code character varying(100),
    quantity character varying(100),
    unit_price real NOT NULL,
    unit character varying(50) DEFAULT 'per KG'::character varying,
    weight_basis character varying(20) DEFAULT 'condition'::character varying,
    incoterms character varying(100),
    amount real DEFAULT 0 NOT NULL,
    notes text
);
CREATE SEQUENCE public.invoice_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.invoice_items_id_seq OWNED BY public.invoice_items.id;
CREATE TABLE public.invoices (
    id integer NOT NULL,
    invoice_no character varying(50),
    company_id integer,
    customer_id integer,
    contact_id integer,
    so_id integer,
    so_no character varying(50),
    customer_po_no character varying(100),
    invoice_date character varying(20) NOT NULL,
    due_date character varying(20),
    currency character varying(10) DEFAULT 'USD'::character varying,
    vat_rate real DEFAULT 0,
    subtotal real DEFAULT 0,
    vat_amount real DEFAULT 0,
    total real DEFAULT 0,
    status character varying(50) DEFAULT 'Draft'::character varying,
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    created_by integer,
    updated_at timestamp without time zone DEFAULT now(),
    updated_by integer
);
CREATE SEQUENCE public.invoices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.invoices_id_seq OWNED BY public.invoices.id;
CREATE TABLE public.payments (
    id integer NOT NULL,
    invoice_id integer,
    payment_date character varying(20) NOT NULL,
    amount real NOT NULL,
    currency character varying(10) DEFAULT 'USD'::character varying,
    method character varying(50),
    reference character varying(200),
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    created_by integer
);
CREATE SEQUENCE public.payments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.payments_id_seq OWNED BY public.payments.id;
CREATE TABLE public.supplier_invoice_items (
    id integer NOT NULL,
    supplier_invoice_id integer,
    yarn_id integer,
    description character varying(500),
    color_name character varying(200),
    color_code character varying(100),
    quantity character varying(100),
    unit_price real NOT NULL,
    unit character varying(50) DEFAULT 'per KG'::character varying,
    weight_basis character varying(20) DEFAULT 'condition'::character varying,
    incoterms character varying(100),
    amount real DEFAULT 0 NOT NULL,
    notes text
);
CREATE SEQUENCE public.supplier_invoice_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.supplier_invoice_items_id_seq OWNED BY public.supplier_invoice_items.id;
CREATE TABLE public.supplier_invoices (
    id integer NOT NULL,
    supplier_invoice_no character varying(100),
    internal_no character varying(50),
    company_id integer,
    factory_id integer,
    po_id integer,
    po_no character varying(50),
    invoice_date character varying(20) NOT NULL,
    due_date character varying(20),
    currency character varying(10) DEFAULT 'USD'::character varying,
    vat_rate real DEFAULT 0,
    subtotal real DEFAULT 0,
    vat_amount real DEFAULT 0,
    total real DEFAULT 0,
    status character varying(50) DEFAULT 'Received'::character varying,
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    created_by integer,
    updated_at timestamp without time zone DEFAULT now(),
    updated_by integer
);
CREATE SEQUENCE public.supplier_invoices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.supplier_invoices_id_seq OWNED BY public.supplier_invoices.id;
CREATE TABLE public.supplier_payments (
    id integer NOT NULL,
    supplier_invoice_id integer,
    payment_date character varying(20) NOT NULL,
    amount real NOT NULL,
    currency character varying(10) DEFAULT 'USD'::character varying,
    method character varying(50),
    reference character varying(200),
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    created_by integer
);
CREATE SEQUENCE public.supplier_payments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.supplier_payments_id_seq OWNED BY public.supplier_payments.id;
CREATE TABLE public.system_settings (
    id integer NOT NULL,
    key character varying(100) NOT NULL,
    value text,
    description text,
    updated_at timestamp without time zone DEFAULT now(),
    updated_by integer
);
CREATE SEQUENCE public.system_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.system_settings_id_seq OWNED BY public.system_settings.id;
ALTER TABLE ONLY public.invoice_items ALTER COLUMN id SET DEFAULT nextval('public.invoice_items_id_seq'::regclass);
ALTER TABLE ONLY public.invoices ALTER COLUMN id SET DEFAULT nextval('public.invoices_id_seq'::regclass);
ALTER TABLE ONLY public.payments ALTER COLUMN id SET DEFAULT nextval('public.payments_id_seq'::regclass);
ALTER TABLE ONLY public.supplier_invoice_items ALTER COLUMN id SET DEFAULT nextval('public.supplier_invoice_items_id_seq'::regclass);
ALTER TABLE ONLY public.supplier_invoices ALTER COLUMN id SET DEFAULT nextval('public.supplier_invoices_id_seq'::regclass);
ALTER TABLE ONLY public.supplier_payments ALTER COLUMN id SET DEFAULT nextval('public.supplier_payments_id_seq'::regclass);
ALTER TABLE ONLY public.system_settings ALTER COLUMN id SET DEFAULT nextval('public.system_settings_id_seq'::regclass);
ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.supplier_invoice_items
    ADD CONSTRAINT supplier_invoice_items_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.supplier_invoices
    ADD CONSTRAINT supplier_invoices_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.supplier_payments
    ADD CONSTRAINT supplier_payments_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_key_unique UNIQUE (key);
ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_invoice_id_invoices_id_fk FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_yarn_id_yarns_id_fk FOREIGN KEY (yarn_id) REFERENCES public.yarns(id);
ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_contact_id_customer_contacts_id_fk FOREIGN KEY (contact_id) REFERENCES public.customer_contacts(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_customer_id_customers_id_fk FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_so_id_sales_orders_id_fk FOREIGN KEY (so_id) REFERENCES public.sales_orders(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_invoice_id_invoices_id_fk FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.supplier_invoice_items
    ADD CONSTRAINT supplier_invoice_items_supplier_invoice_id_supplier_invoices_id FOREIGN KEY (supplier_invoice_id) REFERENCES public.supplier_invoices(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.supplier_invoice_items
    ADD CONSTRAINT supplier_invoice_items_yarn_id_yarns_id_fk FOREIGN KEY (yarn_id) REFERENCES public.yarns(id);
ALTER TABLE ONLY public.supplier_invoices
    ADD CONSTRAINT supplier_invoices_factory_id_factories_id_fk FOREIGN KEY (factory_id) REFERENCES public.factories(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.supplier_invoices
    ADD CONSTRAINT supplier_invoices_po_id_purchase_orders_id_fk FOREIGN KEY (po_id) REFERENCES public.purchase_orders(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.supplier_payments
    ADD CONSTRAINT supplier_payments_supplier_invoice_id_supplier_invoices_id_fk FOREIGN KEY (supplier_invoice_id) REFERENCES public.supplier_invoices(id) ON DELETE CASCADE;

-- Default system settings (safe to re-run)
INSERT INTO system_settings (key, value, description) VALUES
  ('default_vat_rate', '0', 'Default VAT rate (%) applied to new invoices, e.g. 7 for Thailand, 13 for China. Documents keep their own rate once created.'),
  ('default_currency', 'USD', 'Default currency preselected for new invoices and payments.'),
  ('invoice_no_prefix', 'FINV', 'Prefix used when auto-generating sales invoice numbers.'),
  ('default_payment_days', '30', 'Default payment term (days) used to suggest invoice due dates.')
ON CONFLICT (key) DO NOTHING;
