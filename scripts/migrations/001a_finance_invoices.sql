-- ================================================================
-- FINANCE MODULE — SCRIPT 1 of 5: invoices + invoice_items
-- Run scripts in order 1 -> 5. Each is small enough for the Neon
-- SQL Editor. No existing tables or data are modified.
-- ================================================================

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
CREATE SEQUENCE public.invoices_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.invoices_id_seq OWNED BY public.invoices.id;
ALTER TABLE ONLY public.invoices ALTER COLUMN id SET DEFAULT nextval('public.invoices_id_seq'::regclass);
ALTER TABLE ONLY public.invoices ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);

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
CREATE SEQUENCE public.invoice_items_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.invoice_items_id_seq OWNED BY public.invoice_items.id;
ALTER TABLE ONLY public.invoice_items ALTER COLUMN id SET DEFAULT nextval('public.invoice_items_id_seq'::regclass);
ALTER TABLE ONLY public.invoice_items ADD CONSTRAINT invoice_items_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.invoices ADD CONSTRAINT invoices_customer_id_customers_id_fk FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.invoices ADD CONSTRAINT invoices_contact_id_customer_contacts_id_fk FOREIGN KEY (contact_id) REFERENCES public.customer_contacts(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.invoices ADD CONSTRAINT invoices_so_id_sales_orders_id_fk FOREIGN KEY (so_id) REFERENCES public.sales_orders(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.invoice_items ADD CONSTRAINT invoice_items_invoice_id_invoices_id_fk FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.invoice_items ADD CONSTRAINT invoice_items_yarn_id_yarns_id_fk FOREIGN KEY (yarn_id) REFERENCES public.yarns(id);
