-- ================================================================
-- FINANCE MODULE — SCRIPT 4 of 5: supplier_payments (us -> mills)
-- Requires script 3 (supplier_invoices) to be run first.
-- ================================================================

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
CREATE SEQUENCE public.supplier_payments_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.supplier_payments_id_seq OWNED BY public.supplier_payments.id;
ALTER TABLE ONLY public.supplier_payments ALTER COLUMN id SET DEFAULT nextval('public.supplier_payments_id_seq'::regclass);
ALTER TABLE ONLY public.supplier_payments ADD CONSTRAINT supplier_payments_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.supplier_payments ADD CONSTRAINT supplier_payments_supplier_invoice_id_supplier_invoices_id_fk FOREIGN KEY (supplier_invoice_id) REFERENCES public.supplier_invoices(id) ON DELETE CASCADE;
