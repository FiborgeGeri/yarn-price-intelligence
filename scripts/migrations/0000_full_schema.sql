-- Fiborge Sales & Sourcing Hub — FULL DATABASE SCHEMA
-- Paste this into the Neon SQL Editor FIRST (creates all tables).
-- Safe to paste as one script into Neon: https://console.neon.tech -> SQL Editor

CREATE TABLE "certificates" (
	"id" serial PRIMARY KEY NOT NULL,
	"cert_code" varchar(100) NOT NULL,
	"cert_full_name" varchar(300),
	"category" varchar(100),
	"issuing_body" varchar(200),
	"description" text,
	"created_at" timestamp DEFAULT now(),
	"created_by" integer,
	"updated_at" timestamp DEFAULT now(),
	"updated_by" integer
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(300) NOT NULL,
	"official_name" varchar(500),
	"address_local" text,
	"address_english" text,
	"telephone" varchar(100),
	"logo_path" varchar(500),
	"is_default" boolean DEFAULT false,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"created_by" integer,
	"updated_at" timestamp DEFAULT now(),
	"updated_by" integer
);
--> statement-breakpoint
CREATE TABLE "customer_contacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer,
	"contact_name" varchar(300) NOT NULL,
	"department" varchar(200),
	"position" varchar(200),
	"email" varchar(200),
	"phone" varchar(100),
	"cell_phone" varchar(100),
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"created_by" integer,
	"updated_at" timestamp DEFAULT now(),
	"updated_by" integer
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(300) NOT NULL,
	"official_name" varchar(500),
	"address_local" text,
	"address_english" text,
	"country" varchar(100),
	"telephone" varchar(100),
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"created_by" integer,
	"updated_at" timestamp DEFAULT now(),
	"updated_by" integer
);
--> statement-breakpoint
CREATE TABLE "delivery_notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"dn_no" varchar(50),
	"company_id" integer,
	"gr_id" integer,
	"so_id" integer,
	"so_no" varchar(50),
	"customer_po_no" varchar(100),
	"customer_id" integer,
	"contact_id" integer,
	"ship_to_id" integer,
	"ship_to_contact_id" integer,
	"order_category" varchar(50) DEFAULT 'Bulk',
	"quantity_unit" varchar(20) DEFAULT 'KGS',
	"dn_date" varchar(20) NOT NULL,
	"shipping_method" varchar(100),
	"tracking_no" varchar(200),
	"total_packages" integer,
	"total_gross_weight" varchar(50),
	"total_net_weight" varchar(50),
	"status" varchar(50) DEFAULT 'Draft',
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"created_by" integer,
	"updated_at" timestamp DEFAULT now(),
	"updated_by" integer
);
--> statement-breakpoint
CREATE TABLE "dn_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"dn_id" integer,
	"yarn_id" integer,
	"color_name" varchar(200),
	"color_code" varchar(100),
	"quantity" varchar(100),
	"weight_basis" varchar(20) DEFAULT 'condition',
	"packages" integer,
	"packing_details" text,
	"gross_weight" varchar(50),
	"net_weight" varchar(50),
	"lot_no" varchar(100),
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "dye_method_options" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"created_by" integer,
	"updated_at" timestamp DEFAULT now(),
	"updated_by" integer
);
--> statement-breakpoint
CREATE TABLE "factories" (
	"id" serial PRIMARY KEY NOT NULL,
	"factory_name" varchar(300) NOT NULL,
	"official_name" varchar(500),
	"address_local" text,
	"address_english" text,
	"country" varchar(100),
	"telephone" varchar(100),
	"notes" text,
	"relationship" varchar(50) DEFAULT 'My Factory' NOT NULL,
	"parent_factory_id" integer,
	"status" varchar(50) DEFAULT 'Active',
	"created_at" timestamp DEFAULT now(),
	"created_by" integer,
	"updated_at" timestamp DEFAULT now(),
	"updated_by" integer
);
--> statement-breakpoint
CREATE TABLE "factory_certificates" (
	"id" serial PRIMARY KEY NOT NULL,
	"factory_id" integer,
	"certificate_id" integer
);
--> statement-breakpoint
CREATE TABLE "factory_contacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"factory_id" integer,
	"contact_name" varchar(300) NOT NULL,
	"department" varchar(200),
	"position" varchar(200),
	"email" varchar(200),
	"phone" varchar(100),
	"cell_phone" varchar(100),
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"created_by" integer,
	"updated_at" timestamp DEFAULT now(),
	"updated_by" integer
);
--> statement-breakpoint
CREATE TABLE "goods_receipts" (
	"id" serial PRIMARY KEY NOT NULL,
	"gr_no" varchar(50),
	"company_id" integer,
	"po_id" integer,
	"po_no" varchar(50),
	"factory_id" integer,
	"ship_to_id" integer,
	"ship_to_contact_id" integer,
	"quantity_unit" varchar(20) DEFAULT 'KGS',
	"gr_date" varchar(20) NOT NULL,
	"shipping_method" varchar(100),
	"tracking_no" varchar(200),
	"total_packages" integer,
	"total_gross_weight" varchar(50),
	"total_net_weight" varchar(50),
	"status" varchar(50) DEFAULT 'Shipped from Mill',
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"created_by" integer,
	"updated_at" timestamp DEFAULT now(),
	"updated_by" integer
);
--> statement-breakpoint
CREATE TABLE "gr_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"gr_id" integer,
	"yarn_id" integer,
	"color_name" varchar(200),
	"color_code" varchar(100),
	"quantity_ordered" varchar(100),
	"quantity_received" varchar(100),
	"weight_basis" varchar(20) DEFAULT 'condition',
	"packages" integer,
	"packing_details" text,
	"gross_weight" varchar(50),
	"net_weight" varchar(50),
	"lot_no" varchar(100),
	"inspection_result" varchar(50),
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "invoice_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_id" integer,
	"yarn_id" integer,
	"description" varchar(500),
	"color_name" varchar(200),
	"color_code" varchar(100),
	"quantity" varchar(100),
	"unit_price" real NOT NULL,
	"unit" varchar(50) DEFAULT 'per KG',
	"weight_basis" varchar(20) DEFAULT 'condition',
	"incoterms" varchar(100),
	"amount" real DEFAULT 0 NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_no" varchar(50),
	"company_id" integer,
	"customer_id" integer,
	"contact_id" integer,
	"so_id" integer,
	"so_no" varchar(50),
	"customer_po_no" varchar(100),
	"invoice_date" varchar(20) NOT NULL,
	"due_date" varchar(20),
	"currency" varchar(10) DEFAULT 'USD',
	"vat_rate" real DEFAULT 0,
	"subtotal" real DEFAULT 0,
	"vat_amount" real DEFAULT 0,
	"total" real DEFAULT 0,
	"status" varchar(50) DEFAULT 'Draft',
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"created_by" integer,
	"updated_at" timestamp DEFAULT now(),
	"updated_by" integer
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_id" integer,
	"payment_date" varchar(20) NOT NULL,
	"amount" real NOT NULL,
	"currency" varchar(10) DEFAULT 'USD',
	"method" varchar(50),
	"reference" varchar(200),
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"created_by" integer
);
--> statement-breakpoint
CREATE TABLE "po_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"po_id" integer,
	"yarn_id" integer,
	"color_name" varchar(200),
	"color_code" varchar(100),
	"quantity" varchar(100),
	"unit_price" real NOT NULL,
	"currency" varchar(10) DEFAULT 'USD',
	"unit" varchar(50) DEFAULT 'per KG',
	"weight_basis" varchar(20) DEFAULT 'condition',
	"incoterms" varchar(100),
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "prices" (
	"id" serial PRIMARY KEY NOT NULL,
	"yarn_id" integer,
	"price" real NOT NULL,
	"currency" varchar(10) DEFAULT 'USD',
	"unit" varchar(50) DEFAULT 'per KG',
	"weight_basis" varchar(20) DEFAULT 'condition',
	"record_date" varchar(20) NOT NULL,
	"incoterms" varchar(100),
	"remarks" text,
	"created_at" timestamp DEFAULT now(),
	"created_by" integer,
	"updated_at" timestamp DEFAULT now(),
	"updated_by" integer
);
--> statement-breakpoint
CREATE TABLE "purchase_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"po_no" varchar(50),
	"company_id" integer,
	"factory_id" integer,
	"customer_id" integer,
	"ship_to_id" integer,
	"ship_to_contact_id" integer,
	"order_category" varchar(50) DEFAULT 'Bulk',
	"quantity_unit" varchar(20) DEFAULT 'KGS',
	"payment_method" varchar(50),
	"payment_days" integer,
	"payment_reference" varchar(50),
	"contact_person" varchar(200),
	"so_no" varchar(50),
	"customer_po_no" varchar(100),
	"quote_no" varchar(50),
	"currency" varchar(10) DEFAULT 'USD',
	"unit" varchar(50) DEFAULT 'per KG',
	"po_date" varchar(20) NOT NULL,
	"delivery_date" varchar(20),
	"incoterms" varchar(100),
	"status" varchar(50) DEFAULT 'Draft',
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"created_by" integer,
	"updated_at" timestamp DEFAULT now(),
	"updated_by" integer
);
--> statement-breakpoint
CREATE TABLE "quotations" (
	"id" serial PRIMARY KEY NOT NULL,
	"quote_no" varchar(50),
	"company_id" integer,
	"customer_id" integer,
	"contact_id" integer,
	"yarn_id" integer,
	"cost_price" real NOT NULL,
	"quoted_price" real NOT NULL,
	"currency" varchar(10) DEFAULT 'USD',
	"unit" varchar(50) DEFAULT 'per KG',
	"weight_basis" varchar(20) DEFAULT 'condition',
	"quote_date" varchar(20) NOT NULL,
	"valid_until" varchar(20),
	"incoterms" varchar(100),
	"status" varchar(50) DEFAULT 'Draft',
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"created_by" integer,
	"updated_at" timestamp DEFAULT now(),
	"updated_by" integer
);
--> statement-breakpoint
CREATE TABLE "sales_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"so_no" varchar(50),
	"company_id" integer,
	"customer_id" integer,
	"contact_id" integer,
	"ship_to_id" integer,
	"ship_to_contact_id" integer,
	"order_category" varchar(50) DEFAULT 'Bulk',
	"quantity_unit" varchar(20) DEFAULT 'KGS',
	"payment_method" varchar(50),
	"payment_days" integer,
	"payment_reference" varchar(50),
	"customer_po_no" varchar(100),
	"quote_no" varchar(50),
	"so_date" varchar(20) NOT NULL,
	"delivery_date" varchar(20),
	"status" varchar(50) DEFAULT 'Confirmed',
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"created_by" integer,
	"updated_at" timestamp DEFAULT now(),
	"updated_by" integer
);
--> statement-breakpoint
CREATE TABLE "ship_to_addresses" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(300) NOT NULL,
	"official_name" varchar(500),
	"category" varchar(100),
	"address_local" text,
	"address_english" text,
	"country" varchar(100),
	"telephone" varchar(100),
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"created_by" integer,
	"updated_at" timestamp DEFAULT now(),
	"updated_by" integer
);
--> statement-breakpoint
CREATE TABLE "ship_to_contacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"ship_to_id" integer,
	"contact_name" varchar(300) NOT NULL,
	"department" varchar(200),
	"position" varchar(200),
	"email" varchar(200),
	"phone" varchar(100),
	"cell_phone" varchar(100),
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"created_by" integer,
	"updated_at" timestamp DEFAULT now(),
	"updated_by" integer
);
--> statement-breakpoint
CREATE TABLE "so_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"so_id" integer,
	"yarn_id" integer,
	"color_name" varchar(200),
	"color_code" varchar(100),
	"quantity" varchar(100),
	"unit_price" real NOT NULL,
	"currency" varchar(10) DEFAULT 'USD',
	"unit" varchar(50) DEFAULT 'per KG',
	"weight_basis" varchar(20) DEFAULT 'condition',
	"incoterms" varchar(100),
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "spinning_type_options" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"created_by" integer,
	"updated_at" timestamp DEFAULT now(),
	"updated_by" integer
);
--> statement-breakpoint
CREATE TABLE "supplier_invoice_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"supplier_invoice_id" integer,
	"yarn_id" integer,
	"description" varchar(500),
	"color_name" varchar(200),
	"color_code" varchar(100),
	"quantity" varchar(100),
	"unit_price" real NOT NULL,
	"unit" varchar(50) DEFAULT 'per KG',
	"weight_basis" varchar(20) DEFAULT 'condition',
	"incoterms" varchar(100),
	"amount" real DEFAULT 0 NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "supplier_invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"supplier_invoice_no" varchar(100),
	"internal_no" varchar(50),
	"company_id" integer,
	"factory_id" integer,
	"po_id" integer,
	"po_no" varchar(50),
	"invoice_date" varchar(20) NOT NULL,
	"due_date" varchar(20),
	"currency" varchar(10) DEFAULT 'USD',
	"vat_rate" real DEFAULT 0,
	"subtotal" real DEFAULT 0,
	"vat_amount" real DEFAULT 0,
	"total" real DEFAULT 0,
	"status" varchar(50) DEFAULT 'Received',
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"created_by" integer,
	"updated_at" timestamp DEFAULT now(),
	"updated_by" integer
);
--> statement-breakpoint
CREATE TABLE "supplier_payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"supplier_invoice_id" integer,
	"payment_date" varchar(20) NOT NULL,
	"amount" real NOT NULL,
	"currency" varchar(10) DEFAULT 'USD',
	"method" varchar(50),
	"reference" varchar(200),
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"created_by" integer
);
--> statement-breakpoint
CREATE TABLE "system_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar(100) NOT NULL,
	"value" text,
	"description" text,
	"updated_at" timestamp DEFAULT now(),
	"updated_by" integer,
	CONSTRAINT "system_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "treatments" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"created_by" integer,
	"updated_at" timestamp DEFAULT now(),
	"updated_by" integer
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar(100) NOT NULL,
	"password_hash" text NOT NULL,
	"display_name" varchar(200),
	"role" varchar(50) DEFAULT 'user',
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "yarn_certificates" (
	"id" serial PRIMARY KEY NOT NULL,
	"yarn_id" integer,
	"certificate_id" integer
);
--> statement-breakpoint
CREATE TABLE "yarn_dye_methods" (
	"id" serial PRIMARY KEY NOT NULL,
	"yarn_id" integer,
	"dye_method_id" integer
);
--> statement-breakpoint
CREATE TABLE "yarn_type_options" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"created_by" integer,
	"updated_at" timestamp DEFAULT now(),
	"updated_by" integer
);
--> statement-breakpoint
CREATE TABLE "yarns" (
	"id" serial PRIMARY KEY NOT NULL,
	"yarn_name" varchar(300) NOT NULL,
	"factory_id" integer,
	"yarn_count" varchar(100),
	"yarn_type_id" integer,
	"spinning_type_id" integer,
	"micron" varchar(50),
	"treatment_id" integer,
	"composition" varchar(300),
	"notes" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"created_by" integer,
	"updated_at" timestamp DEFAULT now(),
	"updated_by" integer
);
--> statement-breakpoint
ALTER TABLE "customer_contacts" ADD CONSTRAINT "customer_contacts_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_notes" ADD CONSTRAINT "delivery_notes_so_id_sales_orders_id_fk" FOREIGN KEY ("so_id") REFERENCES "public"."sales_orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_notes" ADD CONSTRAINT "delivery_notes_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_notes" ADD CONSTRAINT "delivery_notes_contact_id_customer_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."customer_contacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_notes" ADD CONSTRAINT "delivery_notes_ship_to_id_ship_to_addresses_id_fk" FOREIGN KEY ("ship_to_id") REFERENCES "public"."ship_to_addresses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_notes" ADD CONSTRAINT "delivery_notes_ship_to_contact_id_ship_to_contacts_id_fk" FOREIGN KEY ("ship_to_contact_id") REFERENCES "public"."ship_to_contacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dn_items" ADD CONSTRAINT "dn_items_dn_id_delivery_notes_id_fk" FOREIGN KEY ("dn_id") REFERENCES "public"."delivery_notes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dn_items" ADD CONSTRAINT "dn_items_yarn_id_yarns_id_fk" FOREIGN KEY ("yarn_id") REFERENCES "public"."yarns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "factory_certificates" ADD CONSTRAINT "factory_certificates_factory_id_factories_id_fk" FOREIGN KEY ("factory_id") REFERENCES "public"."factories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "factory_certificates" ADD CONSTRAINT "factory_certificates_certificate_id_certificates_id_fk" FOREIGN KEY ("certificate_id") REFERENCES "public"."certificates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "factory_contacts" ADD CONSTRAINT "factory_contacts_factory_id_factories_id_fk" FOREIGN KEY ("factory_id") REFERENCES "public"."factories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goods_receipts" ADD CONSTRAINT "goods_receipts_po_id_purchase_orders_id_fk" FOREIGN KEY ("po_id") REFERENCES "public"."purchase_orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goods_receipts" ADD CONSTRAINT "goods_receipts_factory_id_factories_id_fk" FOREIGN KEY ("factory_id") REFERENCES "public"."factories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goods_receipts" ADD CONSTRAINT "goods_receipts_ship_to_id_ship_to_addresses_id_fk" FOREIGN KEY ("ship_to_id") REFERENCES "public"."ship_to_addresses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goods_receipts" ADD CONSTRAINT "goods_receipts_ship_to_contact_id_ship_to_contacts_id_fk" FOREIGN KEY ("ship_to_contact_id") REFERENCES "public"."ship_to_contacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gr_items" ADD CONSTRAINT "gr_items_gr_id_goods_receipts_id_fk" FOREIGN KEY ("gr_id") REFERENCES "public"."goods_receipts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gr_items" ADD CONSTRAINT "gr_items_yarn_id_yarns_id_fk" FOREIGN KEY ("yarn_id") REFERENCES "public"."yarns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_yarn_id_yarns_id_fk" FOREIGN KEY ("yarn_id") REFERENCES "public"."yarns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_contact_id_customer_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."customer_contacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_so_id_sales_orders_id_fk" FOREIGN KEY ("so_id") REFERENCES "public"."sales_orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "po_items" ADD CONSTRAINT "po_items_po_id_purchase_orders_id_fk" FOREIGN KEY ("po_id") REFERENCES "public"."purchase_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "po_items" ADD CONSTRAINT "po_items_yarn_id_yarns_id_fk" FOREIGN KEY ("yarn_id") REFERENCES "public"."yarns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prices" ADD CONSTRAINT "prices_yarn_id_yarns_id_fk" FOREIGN KEY ("yarn_id") REFERENCES "public"."yarns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_factory_id_factories_id_fk" FOREIGN KEY ("factory_id") REFERENCES "public"."factories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_ship_to_id_ship_to_addresses_id_fk" FOREIGN KEY ("ship_to_id") REFERENCES "public"."ship_to_addresses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_ship_to_contact_id_ship_to_contacts_id_fk" FOREIGN KEY ("ship_to_contact_id") REFERENCES "public"."ship_to_contacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_contact_id_customer_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."customer_contacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_yarn_id_yarns_id_fk" FOREIGN KEY ("yarn_id") REFERENCES "public"."yarns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_contact_id_customer_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."customer_contacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_ship_to_id_ship_to_addresses_id_fk" FOREIGN KEY ("ship_to_id") REFERENCES "public"."ship_to_addresses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_ship_to_contact_id_ship_to_contacts_id_fk" FOREIGN KEY ("ship_to_contact_id") REFERENCES "public"."ship_to_contacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ship_to_contacts" ADD CONSTRAINT "ship_to_contacts_ship_to_id_ship_to_addresses_id_fk" FOREIGN KEY ("ship_to_id") REFERENCES "public"."ship_to_addresses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "so_items" ADD CONSTRAINT "so_items_so_id_sales_orders_id_fk" FOREIGN KEY ("so_id") REFERENCES "public"."sales_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "so_items" ADD CONSTRAINT "so_items_yarn_id_yarns_id_fk" FOREIGN KEY ("yarn_id") REFERENCES "public"."yarns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_invoice_items" ADD CONSTRAINT "supplier_invoice_items_supplier_invoice_id_supplier_invoices_id_fk" FOREIGN KEY ("supplier_invoice_id") REFERENCES "public"."supplier_invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_invoice_items" ADD CONSTRAINT "supplier_invoice_items_yarn_id_yarns_id_fk" FOREIGN KEY ("yarn_id") REFERENCES "public"."yarns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_invoices" ADD CONSTRAINT "supplier_invoices_factory_id_factories_id_fk" FOREIGN KEY ("factory_id") REFERENCES "public"."factories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_invoices" ADD CONSTRAINT "supplier_invoices_po_id_purchase_orders_id_fk" FOREIGN KEY ("po_id") REFERENCES "public"."purchase_orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_payments" ADD CONSTRAINT "supplier_payments_supplier_invoice_id_supplier_invoices_id_fk" FOREIGN KEY ("supplier_invoice_id") REFERENCES "public"."supplier_invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "yarn_certificates" ADD CONSTRAINT "yarn_certificates_yarn_id_yarns_id_fk" FOREIGN KEY ("yarn_id") REFERENCES "public"."yarns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "yarn_certificates" ADD CONSTRAINT "yarn_certificates_certificate_id_certificates_id_fk" FOREIGN KEY ("certificate_id") REFERENCES "public"."certificates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "yarn_dye_methods" ADD CONSTRAINT "yarn_dye_methods_yarn_id_yarns_id_fk" FOREIGN KEY ("yarn_id") REFERENCES "public"."yarns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "yarn_dye_methods" ADD CONSTRAINT "yarn_dye_methods_dye_method_id_dye_method_options_id_fk" FOREIGN KEY ("dye_method_id") REFERENCES "public"."dye_method_options"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "yarns" ADD CONSTRAINT "yarns_factory_id_factories_id_fk" FOREIGN KEY ("factory_id") REFERENCES "public"."factories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "yarns" ADD CONSTRAINT "yarns_yarn_type_id_yarn_type_options_id_fk" FOREIGN KEY ("yarn_type_id") REFERENCES "public"."yarn_type_options"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "yarns" ADD CONSTRAINT "yarns_spinning_type_id_spinning_type_options_id_fk" FOREIGN KEY ("spinning_type_id") REFERENCES "public"."spinning_type_options"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "yarns" ADD CONSTRAINT "yarns_treatment_id_treatments_id_fk" FOREIGN KEY ("treatment_id") REFERENCES "public"."treatments"("id") ON DELETE no action ON UPDATE no action;