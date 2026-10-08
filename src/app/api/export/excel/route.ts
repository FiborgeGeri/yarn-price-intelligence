import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  quotations, purchaseOrders, poItems, deliveryNotes, dnItems,
  invoices, invoiceItems, supplierInvoices, supplierInvoiceItems,
  customers, customerContacts, factories, factoryContacts, companies, yarns,
  shipToAddresses, shipToContacts, bankAccounts, systemSettings, payments, users,
} from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { generateExcel, ExportData, ExportItem } from "@/lib/excelExport";
import { detectDocumentLanguage, getRemarksTemplateKey } from "@/lib/exportHelpers";
import { getSession } from "@/lib/auth";

async function fetchTemplateRemarks(key: string): Promise<string> {
  try {
    const [row] = await db.select({ value: systemSettings.value }).from(systemSettings).where(eq(systemSettings.key, key));
    return row?.value || "";
  } catch {
    return "";
  }
}

function toExportItems(rows: any[]): ExportItem[] {
  return rows.map((it) => ({
    yarnName: it.yarnName ?? undefined, yarnCount: it.yarnCount ?? undefined, composition: it.composition ?? undefined, micron: it.micron ?? undefined,
    description: it.description ?? undefined, colorName: it.colorName ?? undefined, colorCode: it.colorCode ?? undefined, colorReference: it.colorReference ?? undefined,
    quantity: it.quantity ?? undefined, unitPrice: it.unitPrice ?? undefined, currency: it.currency ?? undefined, unit: it.unit ?? undefined, weightBasis: it.weightBasis ?? undefined,
    incoterms: it.incoterms ?? undefined, amount: it.amount ?? undefined, notes: it.notes ?? undefined, lotNo: it.lotNo ?? undefined, packages: it.packages ?? undefined,
    grossWeight: it.grossWeight ?? undefined, netWeight: it.netWeight ?? undefined,
  }));
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const id = Number(searchParams.get("id"));
    const langOverride = searchParams.get("lang") as "en" | "zh" | null;

    if (!type || !id) return NextResponse.json({ error: "type and id required" }, { status: 400 });

    let currentUserName = "System";
    try {
      const session = await getSession(req);
      if (session?.id) {
        const [u] = await db.select({ displayName: users.displayName, username: users.username }).from(users).where(eq(users.id, session.id));
        if (u) currentUserName = u.displayName || u.username || "User";
      }
    } catch (err) {}

    let data: ExportData;

    // ============== QUOTATION ==============
    if (type === "quotation") {
      const [refQuote] = await db.select().from(quotations).where(eq(quotations.id, id));
      if (!refQuote) return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
      const quoteRows = refQuote.quoteNo ? await db.select().from(quotations).where(eq(quotations.quoteNo, refQuote.quoteNo)) : [refQuote];

      const [customer] = refQuote.customerId ? await db.select().from(customers).where(eq(customers.id, refQuote.customerId)) : [];
      const [company] = refQuote.companyId ? await db.select().from(companies).where(eq(companies.id, refQuote.companyId)) : [];
      let contact = null;
      if (refQuote.contactId) { const [c] = await db.select().from(customerContacts).where(eq(customerContacts.id, refQuote.contactId)); contact = c; }
      else if (refQuote.customerId) { const [c] = await db.select().from(customerContacts).where(eq(customerContacts.customerId, refQuote.customerId)).limit(1); contact = c; }

      const items: ExportItem[] = [];
      for (const q of quoteRows) {
        const [yarn] = q.yarnId ? await db.select().from(yarns).where(eq(yarns.id, q.yarnId)) : [];
        items.push({ yarnName: yarn?.yarnName, yarnCount: yarn?.yarnCount ?? undefined, composition: yarn?.composition ?? undefined, micron: yarn?.micron ?? undefined, quantity: "", unitPrice: q.quotedPrice, currency: q.currency ?? "USD", unit: q.unit ?? "per KG", weightBasis: q.weightBasis ?? undefined, incoterms: q.incoterms ?? undefined, notes: q.notes ?? undefined });
      }

      const lang = langOverride || detectDocumentLanguage(customer?.country);
      const defaultRemarks = await fetchTemplateRemarks(getRemarksTemplateKey("quotation", lang));

      data = {
        docType: "Quotation", docNo: refQuote.quoteNo || `Q-${id}`, date: refQuote.quoteDate,
        company: company ? { name: company.name, officialName: company.officialName ?? undefined, address: company.addressEnglish ?? undefined, telephone: company.telephone ?? undefined, logoPath: company.logoPath ?? undefined } : undefined,
        party: customer ? { name: customer.name, officialName: customer.officialName ?? undefined, address: customer.addressEnglish ?? customer.addressLocal ?? undefined, attn: contact?.contactName ?? undefined, telephone: contact?.cellPhone ?? contact?.phone ?? customer.telephone ?? undefined } : undefined,
        currency: refQuote.currency ?? undefined, incoterms: refQuote.incoterms ?? undefined, status: refQuote.status ?? undefined, validUntil: refQuote.validUntil ?? undefined,
        items, notes: refQuote.notes ? `${refQuote.notes}\n\n${defaultRemarks}` : defaultRemarks, exportedBy: currentUserName,
      };

    // ============== PURCHASE ORDER ==============
    } else if (type === "po") {
      const [po] = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, id));
      if (!po) return NextResponse.json({ error: "PO not found" }, { status: 404 });
      const items = await db.select({
        yarnName: yarns.yarnName, yarnCount: yarns.yarnCount, composition: yarns.composition, micron: yarns.micron,
        colorName: poItems.colorName, colorCode: poItems.colorCode, colorReference: poItems.colorReference,
        quantity: poItems.quantity, unitPrice: poItems.unitPrice, currency: poItems.currency, unit: poItems.unit, weightBasis: poItems.weightBasis, incoterms: poItems.incoterms, notes: poItems.notes,
      }).from(poItems).leftJoin(yarns, eq(poItems.yarnId, yarns.id)).where(eq(poItems.poId, id));

      const [factory] = po.factoryId ? await db.select().from(factories).where(eq(factories.id, po.factoryId)) : [];
      let factoryContact = null;
      if (po.factoryId) {
        const contacts = await db.select().from(factoryContacts).where(eq(factoryContacts.factoryId, po.factoryId));
        if (po.contactPerson) factoryContact = contacts.find(c => c.contactName?.toLowerCase().includes(po.contactPerson!.toLowerCase())) || null;
        if (!factoryContact && contacts.length > 0) factoryContact = contacts[0];
      }
      const [company] = po.companyId ? await db.select().from(companies).where(eq(companies.id, po.companyId)) : (await db.select().from(companies).limit(1));
      const [shipTo] = po.shipToId ? await db.select().from(shipToAddresses).where(eq(shipToAddresses.id, po.shipToId)) : [];
      let shipToContact = null;
      if (po.shipToContactId) { const [c] = await db.select().from(shipToContacts).where(eq(shipToContacts.id, po.shipToContactId)); shipToContact = c; }
      else if (po.shipToId) { const [c] = await db.select().from(shipToContacts).where(eq(shipToContacts.shipToId, po.shipToId)).limit(1); shipToContact = c; }

      const exportItems = toExportItems(items);
      exportItems.forEach(it => { it.amount = (parseFloat(it.quantity || "0") || 0) * (it.unitPrice || 0); });
      const lang = langOverride || detectDocumentLanguage(factory?.country);
      const defaultRemarks = await fetchTemplateRemarks(getRemarksTemplateKey("po", lang));

      data = {
        docType: "Purchase Order", docNo: po.poNo || `PO-${id}`, date: po.poDate,
        company: company ? { name: company.name, officialName: company.officialName ?? undefined, address: company.addressEnglish ?? company.addressLocal ?? undefined, telephone: company.telephone ?? undefined, logoPath: company.logoPath ?? undefined } : undefined,
        party: factory ? { name: factory.factoryName, officialName: factory.officialName ?? undefined, address: factory.addressEnglish ?? factory.addressLocal ?? undefined, attn: factoryContact?.contactName ?? po.contactPerson ?? undefined, telephone: factoryContact?.cellPhone ?? factoryContact?.phone ?? factory.telephone ?? undefined } : undefined,
        shipTo: shipTo ? { name: shipTo.name, officialName: shipTo.officialName ?? undefined, address: shipTo.addressEnglish ?? shipTo.addressLocal ?? undefined, attn: shipToContact?.contactName ?? undefined, telephone: shipToContact?.cellPhone ?? shipToContact?.phone ?? shipTo.telephone ?? undefined } : undefined,
        reference: po.soNo ?? undefined, customerPoNo: po.customerPoNo ?? undefined, deliveryDate: po.deliveryDate ?? undefined, paymentTerms: po.paymentMethod ? `${po.paymentMethod}${po.paymentDays ? ` ${po.paymentDays} Days` : ""}` : undefined, currency: po.currency ?? undefined, incoterms: po.incoterms ?? undefined, orderCategory: po.orderCategory ?? undefined, quantityUnit: po.quantityUnit ?? undefined,
        items: exportItems, subtotal: exportItems.reduce((s, it) => s + (it.amount || 0), 0), total: exportItems.reduce((s, it) => s + (it.amount || 0), 0),
        notes: po.notes ? `${po.notes}\n\n${defaultRemarks}` : defaultRemarks,
        exportedBy: currentUserName,
        revision: po.revision ?? undefined,          // 🆕 傳入修訂次數
        lastRevisedAt: po.lastRevisedAt ?? undefined, // 🆕 傳入修訂時間
      };

    // ============== DELIVERY NOTE ==============
    } else if (type === "dn") {
      const [dn] = await db.select().from(deliveryNotes).where(eq(deliveryNotes.id, id));
      if (!dn) return NextResponse.json({ error: "DN not found" }, { status: 404 });
      const items = await db.select({ yarnName: yarns.yarnName, yarnCount: yarns.yarnCount, colorName: dnItems.colorName, colorCode: dnItems.colorCode, quantity: dnItems.quantity, lotNo: dnItems.lotNo, packages: dnItems.packages, grossWeight: dnItems.grossWeight, netWeight: dnItems.netWeight, notes: dnItems.notes }).from(dnItems).leftJoin(yarns, eq(dnItems.yarnId, yarns.id)).where(eq(dnItems.dnId, id));

      const [customer] = dn.customerId ? await db.select().from(customers).where(eq(customers.id, dn.customerId)) : [];
      let contact = null;
      if (dn.contactId) { const [c] = await db.select().from(customerContacts).where(eq(customerContacts.id, dn.contactId)); contact = c; }
      else if (dn.customerId) { const [c] = await db.select().from(customerContacts).where(eq(customerContacts.customerId, dn.customerId)).limit(1); contact = c; }

      const [company] = dn.companyId ? await db.select().from(companies).where(eq(companies.id, dn.companyId)) : [];
      const [shipTo] = dn.shipToId ? await db.select().from(shipToAddresses).where(eq(shipToAddresses.id, dn.shipToId)) : [];
      let shipToContact = null;
      if (dn.shipToContactId) { const [c] = await db.select().from(shipToContacts).where(eq(shipToContacts.id, dn.shipToContactId)); shipToContact = c; }
      else if (dn.shipToId) { const [c] = await db.select().from(shipToContacts).where(eq(shipToContacts.shipToId, dn.shipToId)).limit(1); shipToContact = c; }

      const lang = langOverride || detectDocumentLanguage(customer?.country);
      const defaultRemarks = await fetchTemplateRemarks(getRemarksTemplateKey("dn", lang));

      data = {
        docType: "Delivery Note", docNo: dn.dnNo || `DN-${id}`, date: dn.dnDate,
        company: company ? { name: company.name, officialName: company.officialName ?? undefined, address: company.addressEnglish ?? company.addressLocal ?? undefined, telephone: company.telephone ?? undefined, logoPath: company.logoPath ?? undefined } : undefined,
        party: customer ? { name: customer.name, officialName: customer.officialName ?? undefined, address: customer.addressEnglish ?? customer.addressLocal ?? undefined, attn: contact?.contactName ?? undefined, telephone: contact?.cellPhone ?? contact?.phone ?? customer.telephone ?? undefined } : undefined,
        shipTo: shipTo ? { name: shipTo.name, officialName: shipTo.officialName ?? undefined, address: shipTo.addressEnglish ?? shipTo.addressLocal ?? undefined, attn: shipToContact?.contactName ?? undefined, telephone: shipToContact?.cellPhone ?? shipToContact?.phone ?? shipTo.telephone ?? undefined } : undefined,
        customerPoNo: dn.customerPoNo ?? undefined, reference: dn.soNo ?? undefined, orderCategory: dn.orderCategory ?? undefined, quantityUnit: dn.quantityUnit ?? undefined,
        items: toExportItems(items), notes: dn.notes ? `${dn.notes}\n\n${defaultRemarks}` : defaultRemarks, exportedBy: currentUserName,
      };

    // ============== SALES INVOICE ==============
    } else if (type === "invoice") {
      const [inv] = await db.select().from(invoices).where(eq(invoices.id, id));
      if (!inv) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
      const items = await db.select({ yarnName: yarns.yarnName, yarnCount: yarns.yarnCount, composition: yarns.composition, micron: yarns.micron, description: invoiceItems.description, colorName: invoiceItems.colorName, colorCode: invoiceItems.colorCode, quantity: invoiceItems.quantity, unitPrice: invoiceItems.unitPrice, currency: invoices.currency, unit: invoiceItems.unit, weightBasis: invoiceItems.weightBasis, incoterms: invoiceItems.incoterms, amount: invoiceItems.amount, notes: invoiceItems.notes }).from(invoiceItems).leftJoin(yarns, eq(invoiceItems.yarnId, yarns.id)).leftJoin(invoices, eq(invoiceItems.invoiceId, invoices.id)).where(eq(invoiceItems.invoiceId, id));

      const [company] = inv.companyId ? await db.select().from(companies).where(eq(companies.id, inv.companyId)) : [];
      const [customer] = inv.customerId ? await db.select().from(customers).where(eq(customers.id, inv.customerId)) : [];
      let contact = null;
      if (inv.contactId) { const [c] = await db.select().from(customerContacts).where(eq(customerContacts.id, inv.contactId)); contact = c; }
      else if (inv.customerId) { const [c] = await db.select().from(customerContacts).where(eq(customerContacts.customerId, inv.customerId)).limit(1); contact = c; }

      let bankInfo: any; if (inv.bankAccountId) { const [b] = await db.select().from(bankAccounts).where(eq(bankAccounts.id, inv.bankAccountId)); if (b) bankInfo = b; }
      const lang = langOverride || detectDocumentLanguage(customer?.country);
      const defaultRemarks = await fetchTemplateRemarks(getRemarksTemplateKey("invoice", lang));

      data = {
        docType: "Sales Invoice", docNo: inv.invoiceNo || `INV-${id}`, date: inv.invoiceDate,
        company: company ? { name: company.name, officialName: company.officialName ?? undefined, address: company.addressEnglish ?? company.addressLocal ?? undefined, telephone: company.telephone ?? undefined, logoPath: company.logoPath ?? undefined } : undefined,
        party: customer ? { name: customer.name, officialName: customer.officialName ?? undefined, address: customer.addressEnglish ?? customer.addressLocal ?? undefined, attn: contact?.contactName ?? undefined, telephone: contact?.cellPhone ?? contact?.phone ?? customer.telephone ?? undefined } : undefined,
        reference: inv.soNo ?? undefined, customerPoNo: inv.customerPoNo ?? undefined, deliveryDate: inv.dueDate ?? undefined, currency: inv.currency ?? undefined,
        items: toExportItems(items), subtotal: inv.subtotal ?? undefined, vatRate: inv.vatRate ?? undefined, vatAmount: inv.vatAmount ?? undefined, total: inv.total ?? undefined, bankInfo,
        notes: inv.notes ? `${inv.notes}\n\n${defaultRemarks}` : defaultRemarks, exportedBy: currentUserName,
      };

    // ============== SUPPLIER INVOICE ==============
    } else if (type === "supplier-invoice") {
      const [inv] = await db.select().from(supplierInvoices).where(eq(supplierInvoices.id, id));
      if (!inv) return NextResponse.json({ error: "Supplier Invoice not found" }, { status: 404 });
      const items = await db.select({ yarnName: yarns.yarnName, yarnCount: yarns.yarnCount, composition: yarns.composition, micron: yarns.micron, description: supplierInvoiceItems.description, colorName: supplierInvoiceItems.colorName, colorCode: supplierInvoiceItems.colorCode, quantity: supplierInvoiceItems.quantity, unitPrice: supplierInvoiceItems.unitPrice, currency: supplierInvoices.currency, unit: supplierInvoiceItems.unit, weightBasis: supplierInvoiceItems.weightBasis, incoterms: supplierInvoiceItems.incoterms, amount: supplierInvoiceItems.amount, notes: supplierInvoiceItems.notes }).from(supplierInvoiceItems).leftJoin(yarns, eq(supplierInvoiceItems.yarnId, yarns.id)).leftJoin(supplierInvoices, eq(supplierInvoiceItems.supplierInvoiceId, supplierInvoices.id)).where(eq(supplierInvoiceItems.supplierInvoiceId, id));

      const [company] = inv.companyId ? await db.select().from(companies).where(eq(companies.id, inv.companyId)) : [];
      const [factory] = inv.factoryId ? await db.select().from(factories).where(eq(factories.id, inv.factoryId)) : [];
      let factoryContact = null;
      if (inv.factoryId) { const [c] = await db.select().from(factoryContacts).where(eq(factoryContacts.factoryId, inv.factoryId)).limit(1); factoryContact = c; }

      let bankInfo: any; if (inv.bankAccountId) { const [b] = await db.select().from(bankAccounts).where(eq(bankAccounts.id, inv.bankAccountId)); if (b) bankInfo = b; }
      const lang = langOverride || detectDocumentLanguage(factory?.country);
      const defaultRemarks = await fetchTemplateRemarks(getRemarksTemplateKey("supplier-invoice", lang));

      data = {
        docType: "Supplier Invoice", docNo: inv.supplierInvoiceNo || inv.internalNo || `SI-${id}`, date: inv.invoiceDate,
        company: company ? { name: company.name, officialName: company.officialName ?? undefined, address: company.addressEnglish ?? company.addressLocal ?? undefined, telephone: company.telephone ?? undefined, logoPath: company.logoPath ?? undefined } : undefined,
        party: factory ? { name: factory.factoryName, officialName: factory.officialName ?? undefined, address: factory.addressEnglish ?? factory.addressLocal ?? undefined, attn: factoryContact?.contactName ?? undefined, telephone: factoryContact?.cellPhone ?? factoryContact?.phone ?? factory.telephone ?? undefined } : undefined,
        reference: inv.poNo ?? undefined, deliveryDate: inv.dueDate ?? undefined, currency: inv.currency ?? undefined,
        items: toExportItems(items), subtotal: inv.subtotal ?? undefined, vatRate: inv.vatRate ?? undefined, vatAmount: inv.vatAmount ?? undefined, total: inv.total ?? undefined, bankInfo,
        notes: inv.notes ? `${inv.notes}\n\n${defaultRemarks}` : defaultRemarks, exportedBy: currentUserName,
      };

    // ============== RECONCILIATION ==============
    } else if (type === "reconciliation") {
      const customerId = id;
      const [customer] = await db.select().from(customers).where(eq(customers.id, customerId));
      if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

      const [company] = await db.select().from(companies).limit(1);
      const custInvoices = await db.select().from(invoices).where(eq(invoices.customerId, customerId)).orderBy(desc(invoices.invoiceDate));

      const items: ExportItem[] = [];
      let balance = 0; let totalDebit = 0; let totalCredit = 0;
      for (const inv of custInvoices) {
        if (inv.status === "Cancelled") continue;
        balance += inv.total || 0; totalDebit += inv.total || 0;
        items.push({ docNo: inv.invoiceNo || `INV-${inv.id}`, docDate: inv.invoiceDate, docType: "Invoice", description: `SO: ${inv.soNo || "-"} / PO: ${inv.customerPoNo || "-"}`, debit: inv.total || 0, credit: 0, balance, currency: inv.currency || "USD" });
        const invPayments = await db.select().from(payments).where(eq(payments.invoiceId, inv.id)).orderBy(payments.paymentDate);
        for (const pay of invPayments) {
          balance -= pay.amount; totalCredit += pay.amount;
          items.push({ docNo: pay.reference || `PAY-${pay.id}`, docDate: pay.paymentDate, docType: "Payment", description: `${pay.method || "Payment"} received against ${inv.invoiceNo || `INV-${inv.id}`}`, debit: 0, credit: pay.amount, balance, currency: pay.currency || "USD" });
        }
      }

      const lang = langOverride || detectDocumentLanguage(customer.country);
      const defaultRemarks = await fetchTemplateRemarks(getRemarksTemplateKey("reconciliation", lang));

      data = {
        docType: "Reconciliation", docNo: `REC-${customerId}-${new Date().toISOString().slice(0, 10)}`, date: new Date().toISOString().slice(0, 10),
        company: company ? { name: company.name, officialName: company.officialName ?? undefined, address: company.addressEnglish ?? company.addressLocal ?? undefined, telephone: company.telephone ?? undefined, logoPath: company.logoPath ?? undefined } : undefined,
        party: { name: customer.name, officialName: customer.officialName ?? undefined, address: customer.addressEnglish ?? customer.addressLocal ?? undefined, telephone: customer.telephone ?? undefined },
        currency: items[0]?.currency || "USD", items, openingBalance: 0, closingBalance: balance, subtotal: totalDebit, total: balance,
        notes: defaultRemarks || undefined, exportedBy: currentUserName,
      };

    } else {
      return NextResponse.json({ error: `Unknown type: ${type}` }, { status: 400 });
    }

    const buffer = await generateExcel(data);

    const prefixMap: Record<string, string> = { "Quotation": "Q", "Purchase Order": "PO", "Delivery Note": "DN", "Sales Invoice": "INV", "Supplier Invoice": "SINV", "Reconciliation": "REC" };
    const prefix = prefixMap[data.docType] || data.docType;
    const sanitize = (s: string) => s.replace(/[/\\?%*:|"<>]/g, "-").replace(/\s+/g, "_");
    const parts: string[] = [prefix];
    if (data.customerPoNo) parts.push(sanitize(data.customerPoNo));
    parts.push(sanitize(data.docNo));
    parts.push(data.date);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${parts.join("_")}.xlsx"`,
      },
    });
  } catch (err) {
    console.error("Excel export error:", err);
    return NextResponse.json({ error: "Failed to generate Excel" }, { status: 500 });
  }
}
