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
  country: varchar("country", { length: 100 }),
  contactPerson: varchar("contact_person", { length: 200 }),
  email: varchar("email", { length: 200 }),
  notes: text("notes"),
  relationship: varchar("relationship", { length: 50 }).notNull().default("My Factory"),
  parentFactoryId: integer("parent_factory_id"),
  status: varchar("status", { length: 50 }).default("Active"),
  agentSince: timestamp("agent_since"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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

export const yarnTypeOptions = pgTable("yarn_type_options", {
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
  micron: varchar("micron", { length: 50 }),
  treatmentId: integer("treatment_id").references(() => treatments.id),
  origin: varchar("origin", { length: 100 }),
  composition: varchar("composition", { length: 300 }),
  color: varchar("color", { length: 100 }),
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
  recordDate: varchar("record_date", { length: 20 }).notNull(),
  incoterms: varchar("incoterms", { length: 100 }),
  remarks: text("remarks"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 300 }).notNull(),
  company: varchar("company", { length: 300 }),
  country: varchar("country", { length: 100 }),
  email: varchar("email", { length: 200 }),
  phone: varchar("phone", { length: 100 }),
  addressLine1: varchar("address_line1", { length: 500 }),
  addressLine2: varchar("address_line2", { length: 500 }),
  city: varchar("city", { length: 200 }),
  state: varchar("state", { length: 200 }),
  postalCode: varchar("postal_code", { length: 50 }),
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
  customerId: integer("customer_id").references(() => customers.id, { onDelete: "cascade" }),
  addressName: varchar("address_name", { length: 300 }).notNull(),
  addressLine1: varchar("address_line1", { length: 500 }),
  addressLine2: varchar("address_line2", { length: 500 }),
  city: varchar("city", { length: 200 }),
  state: varchar("state", { length: 200 }),
  postalCode: varchar("postal_code", { length: 50 }),
  country: varchar("country", { length: 100 }),
  contactName: varchar("contact_name", { length: 300 }),
  contactPhone: varchar("contact_phone", { length: 100 }),
  contactEmail: varchar("contact_email", { length: 200 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const purchaseOrders = pgTable("purchase_orders", {
  id: serial("id").primaryKey(),
  poNo: varchar("po_no", { length: 50 }),
  factoryId: integer("factory_id").references(() => factories.id),
  customerId: integer("customer_id").references(() => customers.id),
  contactPerson: varchar("contact_person", { length: 200 }),
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
  color: varchar("color", { length: 200 }),
  quantity: varchar("quantity", { length: 100 }),
  unitPrice: real("unit_price").notNull(),
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
  quoteDate: varchar("quote_date", { length: 20 }).notNull(),
  validUntil: varchar("valid_until", { length: 20 }),
  incoterms: varchar("incoterms", { length: 100 }),
  status: varchar("status", { length: 50 }).default("Draft"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
