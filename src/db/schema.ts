import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  real,
  varchar,
  boolean,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: varchar("display_name", { length: 200 }),
  role: varchar("role", { length: 50 }).default("user"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const factories = pgTable("factories", {
  id: serial("id").primaryKey(),
  factoryName: varchar("factory_name", { length: 300 }).notNull(),
  legitName: varchar("legit_name", { length: 500 }),
  primaryAddress: text("primary_address"),
  secondaryAddress: text("secondary_address"),
  country: varchar("country", { length: 100 }),
  telephone: varchar("telephone", { length: 100 }),
  notes: text("notes"),
  relationship: varchar("relationship", { length: 50 }).notNull().default("My Factory"),
  parentFactoryId: integer("parent_factory_id"),
  status: varchar("status", { length: 50 }).default("Active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const factoryContacts = pgTable("factory_contacts", {
  id: serial("id").primaryKey(),
  factoryId: integer("factory_id").references(() => factories.id, { onDelete: "cascade" }),
  contactName: varchar("contact_name", { length: 300 }).notNull(),
  department: varchar("department", { length: 200 }),
  position: varchar("position", { length: 200 }),
  email: varchar("email", { length: 200 }),
  phone: varchar("phone", { length: 100 }),
  cellPhone: varchar("cell_phone", { length: 100 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const treatments = pgTable("treatments", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const certificates = pgTable("certificates", {
  id: serial("id").primaryKey(),
  certCode: varchar("cert_code", { length: 100 }).notNull(),
  certFullName: varchar("cert_full_name", { length: 300 }),
  category: varchar("category", { length: 100 }),
  issuingBody: varchar("issuing_body", { length: 200 }),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const factoryCertificates = pgTable("factory_certificates", {
  id: serial("id").primaryKey(),
  factoryId: integer("factory_id").references(() => factories.id, { onDelete: "cascade" }),
  certificateId: integer("certificate_id").references(() => certificates.id, { onDelete: "cascade" }),
});

export const yarnTypeOptions = pgTable("yarn_type_options", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const spinningTypeOptions = pgTable("spinning_type_options", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const dyeMethodOptions = pgTable("dye_method_options", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const yarns = pgTable("yarns", {
  id: serial("id").primaryKey(),
  yarnName: varchar("yarn_name", { length: 300 }).notNull(),
  factoryId: integer("factory_id").references(() => factories.id),
  yarnCount: varchar("yarn_count", { length: 100 }),
  yarnTypeId: integer("yarn_type_id").references(() => yarnTypeOptions.id),
  spinningTypeId: integer("spinning_type_id").references(() => spinningTypeOptions.id),
  micron: varchar("micron", { length: 50 }),
  treatmentId: integer("treatment_id").references(() => treatments.id),
  composition: varchar("composition", { length: 300 }),
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const yarnDyeMethods = pgTable("yarn_dye_methods", {
  id: serial("id").primaryKey(),
  yarnId: integer("yarn_id").references(() => yarns.id, { onDelete: "cascade" }),
  dyeMethodId: integer("dye_method_id").references(() => dyeMethodOptions.id, { onDelete: "cascade" }),
});

export const yarnCertificates = pgTable("yarn_certificates", {
  id: serial("id").primaryKey(),
  yarnId: integer("yarn_id").references(() => yarns.id, { onDelete: "cascade" }),
  certificateId: integer("certificate_id").references(() => certificates.id, { onDelete: "cascade" }),
});

export const prices = pgTable("prices", {
  id: serial("id").primaryKey(),
  yarnId: integer("yarn_id").references(() => yarns.id, { onDelete: "cascade" }),
  price: real("price").notNull(),
  currency: varchar("currency", { length: 10 }).default("USD"),
  unit: varchar("unit", { length: 50 }).default("per KG"),
  weightBasis: varchar("weight_basis", { length: 20 }).default("condition"),
  recordDate: varchar("record_date", { length: 20 }).notNull(),
  incoterms: varchar("incoterms", { length: 100 }),
  remarks: text("remarks"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 300 }).notNull(),
  legitName: varchar("legit_name", { length: 500 }),
  primaryAddress: text("primary_address"),
  secondaryAddress: text("secondary_address"),
  country: varchar("country", { length: 100 }),
  telephone: varchar("telephone", { length: 100 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const customerContacts = pgTable("customer_contacts", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id, { onDelete: "cascade" }),
  contactName: varchar("contact_name", { length: 300 }).notNull(),
  department: varchar("department", { length: 200 }),
  position: varchar("position", { length: 200 }),
  email: varchar("email", { length: 200 }),
  phone: varchar("phone", { length: 100 }),
  cellPhone: varchar("cell_phone", { length: 100 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const shipToAddresses = pgTable("ship_to_addresses", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id, { onDelete: "set null" }),
  name: varchar("name", { length: 300 }).notNull(),
  legitName: varchar("legit_name", { length: 500 }),
  category: varchar("category", { length: 100 }),
  primaryAddress: text("primary_address"),
  secondaryAddress: text("secondary_address"),
  country: varchar("country", { length: 100 }),
  telephone: varchar("telephone", { length: 100 }),
  contactName: varchar("contact_name", { length: 300 }),
  contactPhone: varchar("contact_phone", { length: 100 }),
  contactEmail: varchar("contact_email", { length: 200 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const salesOrders = pgTable("sales_orders", {
  id: serial("id").primaryKey(),
  soNo: varchar("so_no", { length: 50 }),
  customerId: integer("customer_id").references(() => customers.id),
  contactId: integer("contact_id").references(() => customerContacts.id, { onDelete: "set null" }),
  shipToId: integer("ship_to_id").references(() => shipToAddresses.id, { onDelete: "set null" }),
  customerPoNo: varchar("customer_po_no", { length: 100 }),
  quoteNo: varchar("quote_no", { length: 50 }),
  soDate: varchar("so_date", { length: 20 }).notNull(),
  deliveryDate: varchar("delivery_date", { length: 20 }),
  status: varchar("status", { length: 50 }).default("Confirmed"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const soItems = pgTable("so_items", {
  id: serial("id").primaryKey(),
  soId: integer("so_id").references(() => salesOrders.id, { onDelete: "cascade" }),
  yarnId: integer("yarn_id").references(() => yarns.id),
  colorName: varchar("color_name", { length: 200 }),
  colorCode: varchar("color_code", { length: 100 }),
  quantity: varchar("quantity", { length: 100 }),
  unitPrice: real("unit_price").notNull(),
  currency: varchar("currency", { length: 10 }).default("USD"),
  unit: varchar("unit", { length: 50 }).default("per KG"),
  weightBasis: varchar("weight_basis", { length: 20 }).default("condition"),
  incoterms: varchar("incoterms", { length: 100 }),
  notes: text("notes"),
});

export const purchaseOrders = pgTable("purchase_orders", {
  id: serial("id").primaryKey(),
  poNo: varchar("po_no", { length: 50 }),
  factoryId: integer("factory_id").references(() => factories.id),
  customerId: integer("customer_id").references(() => customers.id),
  shipToId: integer("ship_to_id").references(() => shipToAddresses.id, { onDelete: "set null" }),
  contactPerson: varchar("contact_person", { length: 200 }),
  soNo: varchar("so_no", { length: 50 }),
  customerPoNo: varchar("customer_po_no", { length: 100 }),
  quoteNo: varchar("quote_no", { length: 50 }),
  currency: varchar("currency", { length: 10 }).default("USD"),
  unit: varchar("unit", { length: 50 }).default("per KG"),
  poDate: varchar("po_date", { length: 20 }).notNull(),
  deliveryDate: varchar("delivery_date", { length: 20 }),
  incoterms: varchar("incoterms", { length: 100 }),
  status: varchar("status", { length: 50 }).default("Draft"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const poItems = pgTable("po_items", {
  id: serial("id").primaryKey(),
  poId: integer("po_id").references(() => purchaseOrders.id, { onDelete: "cascade" }),
  yarnId: integer("yarn_id").references(() => yarns.id),
  colorName: varchar("color_name", { length: 200 }),
  colorCode: varchar("color_code", { length: 100 }),
  quantity: varchar("quantity", { length: 100 }),
  unitPrice: real("unit_price").notNull(),
  currency: varchar("currency", { length: 10 }).default("USD"),
  unit: varchar("unit", { length: 50 }).default("per KG"),
  weightBasis: varchar("weight_basis", { length: 20 }).default("condition"),
  incoterms: varchar("incoterms", { length: 100 }),
  notes: text("notes"),
});

export const quotations = pgTable("quotations", {
  id: serial("id").primaryKey(),
  quoteNo: varchar("quote_no", { length: 50 }),
  customerId: integer("customer_id").references(() => customers.id, { onDelete: "cascade" }),
  contactId: integer("contact_id").references(() => customerContacts.id, { onDelete: "set null" }),
  yarnId: integer("yarn_id").references(() => yarns.id, { onDelete: "cascade" }),
  costPrice: real("cost_price").notNull(),
  quotedPrice: real("quoted_price").notNull(),
  currency: varchar("currency", { length: 10 }).default("USD"),
  unit: varchar("unit", { length: 50 }).default("per KG"),
  weightBasis: varchar("weight_basis", { length: 20 }).default("condition"),
  quoteDate: varchar("quote_date", { length: 20 }).notNull(),
  validUntil: varchar("valid_until", { length: 20 }),
  incoterms: varchar("incoterms", { length: 100 }),
  status: varchar("status", { length: 50 }).default("Draft"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
