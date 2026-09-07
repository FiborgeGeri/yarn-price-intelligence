-- ================================================================
-- FINANCE MODULE — SCRIPT 3 of 5: supplier_invoices + items
-- (bills from yarn mills). Independent of scripts 1-2.
-- ================================================================

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
CREATE SEQUENCE public.supplier_invoices_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.supplier_invoices_id_seq OWNED BY public.supplier_invoices.id;
ALTER TABLE ONLY public.supplier_invoices ALTER COLUMN id SET DEFAULT nextval('public.supplier_invoices_id_seq'::regclass);
ALTER TABLE ONLY public.supplier_invoices ADD CONSTRAINT supplier_invoices_pkey PRIMARY KEY (id);

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
CREATE SEQUENCE public.supplier_invoice_items_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.supplier_invoice_items_id_seq OWNED BY public.supplier_invoice_items.id;
ALTER TABLE ONLY public.supplier_invoice_items ALTER COLUMN id SET DEFAULT nextval('public.supplier_invoice_items_id_seq'::regclass);
ALTER TABLE ONLY public.supplier_invoice_items ADD CONSTRAINT supplier_invoice_items_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.supplier_invoices ADD CONSTRAINT supplier_invoices_factory_id_factories_id_fk FOREIGN KEY (factory_id) REFERENCES public.factories(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.supplier_invoices ADD CONSTRAINT supplier_invoices_po_id_purchase_orders_id_fk FOREIGN KEY (po_id) REFERENCES public.purchase_orders(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.supplier_invoice_items ADD CONSTRAINT supplier_invoice_items_supplier_invoice_id_supplier_invoices_id FOREIGN KEY (supplier_invoice_id) REFERENCES public.supplier_invoices(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.supplier_invoice_items ADD CONSTRAINT supplier_invoice_items_yarn_id_yarns_id_fk FOREIGN KEY (yarn_id) REFERENCES public.yarns(id);
