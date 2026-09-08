-- ================================================================
-- FINANCE MODULE — SCRIPT 2 of 5: payments (client -> us)
-- Requires script 1 (invoices) to be run first.
-- ================================================================

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
CREATE SEQUENCE public.payments_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.payments_id_seq OWNED BY public.payments.id;
ALTER TABLE ONLY public.payments ALTER COLUMN id SET DEFAULT nextval('public.payments_id_seq'::regclass);
ALTER TABLE ONLY public.payments ADD CONSTRAINT payments_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.payments ADD CONSTRAINT payments_invoice_id_invoices_id_fk FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE;
