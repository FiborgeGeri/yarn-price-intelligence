import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  quotations,
  purchaseOrders, poItems,
  deliveryNotes, dnItems,
  invoices, invoiceItems,
  supplierInvoices, supplierInvoiceItems,
  customers, customerContacts, factories, companies, yarns,
  shipToAddresses, shipToContacts, bankAccounts, systemSettings,
  payments,
  users,
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
    yarnName: it.yarnName ?? undefined,
    yarnCount: it.yarnCount ?? undefined,
    composition: it.composition ?? undefined,
    micron: it.micron ?? undefined,
    description: it.description ?? undefined,
    colorName: it.colorName ?? undefined,
    colorCode: it.colorCode ?? undefined,
    colorReference: it.colorReference ?? undefined,
    quantity: it.quantity ?? undefined,
    unitPrice: it.unitPrice ?? undefined,
    currency: it.currency ?? undefined,
    unit: it.unit ?? undefined,
    weightBasis: it.weightBasis ?? undefined,
    incoterms: it.incoterms ?? undefined,
    amount: it.amount ?? undefined,
    notes: it.notes ?? undefined,
    lotNo: it.lotNo ?? undefined,
    packages: it.packages ?? undefined,
    grossWeight: it.grossWeight ?? undefined,
    netWeight: it.netWeight ?? undefined,
  }));
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const id = Number(searchParams.get("id"));
    const langOverride = searchParams.get("lang") as "en" | "zh" | null;

    if (!type || !id) return NextResponse.json({ error: "type and id required" }, { status: 400 });

    // 讀取當前登入用戶的 Display Name
    let currentUserName = "System";
    try {
      const session = await getSession(req);
      if (session?.id) {
        const [u] = await db
          .select({ 
            displayName: users.displayName, 
            username: users.username 
          })
          .from(users)
          .where(eq(users.id, session.id));
        if (u) currentUserName = u.displayName || u.username || "User";
      }
    } catch (err) {
      console.warn("Could not fetch user session:", err);
    }

    let data: ExportData;

    // ============== QUOTATION ==============
    if (type === "quotation") {
      const [refQuote] = await db.select().from(quotations).where(eq(quotations.id, id));
      if (!refQuote) return NextResponse.json({ error: "Quotation not found" }, { status: 404 });

      const quoteNo = refQuote.quoteNo;
      const quoteRows = quoteNo
        ? await db.select().from(quotations).where(eq(quotations.quoteNo, quoteNo))
        : [refQuote];

      const [customer] = refQuote.customerId
        ? await db.select().from(customers).where(eq(customers.id, refQuote.customerId))
        : [];
      const [company] = refQuote.companyId
        ? await db.select().from(companies).where(eq(companies.id, refQuote.companyId))
        : [];
      const [contact] = refQuote.contactId
        ? await db.select().from(customerContacts).where(eq(customerContacts.id, refQuote.contactId))
        : [];

      const items: ExportItem[] = [];
      for (const q of quoteRows) {
        const [yarn] = q.yarnId ? await db.select().from(yarns).where(eq(yarns.id, q.yarnId)) : [];
        items.push({
          yarnName: yarn?.yarnName,
          yarnCount: yarn?.yarnCount ?? undefined,
          composition: yarn?.composition ?? undefined,
          micron: yarn?.micron ?? undefined,
          quantity: "",
          unitPrice: q.quotedPrice,
          currency: q.currency ?? "USD",
          unit: q.unit ?? "per KG",
          weightBasis: q.weightBasis ?? undefined,
          incoterms: q.incoterms ?? undefined,
          notes: q.notes ?? undefined,
        });
      }

      const lang = langOverride || detectDocumentLanguage(customer?.country);
      const templateKey = getRemarksTemplateKey("quotation", lang);
      const defaultRemarks = await fetchTemplateRemarks(templateKey);
      const finalRemarks = refQuote.notes
        ? `${refQuote.notes}\n\n${defaultRemarks}`
        : defaultRemarks;

      data = {
        docType: "Quotation",
        docNo: quoteNo || `Q-${id}`,
        date: refQuote.quoteDate,
        company: company
          ? {
              name: company.name,
              officialName: company.officialName ?? undefined,
              address: company.addressEnglish ?? undefined,
              telephone: company.telephone ?? undefined,
              logoPath: company.logoPath ?? undefined,
            }
          : undefined,
        party: customer
          ? {
              name: customer.name,
              officialName: customer.officialName ?? undefined,
              address: customer.addressEnglish ?? undefined,
              telephone: customer.telephone ?? undefined,
              attn: contact?.contactName ?? undefined,
            }
          : undefined,
        currency: refQuote.currency ?? undefined,
        incoterms: refQuote.incoterms ?? undefined,
        status: refQuote.status ?? undefined,
        validUntil: refQuote.validUntil ?? undefined,
        items,
        notes: finalRemarks || undefined,
        exportedBy: currentUserName,
      };

    // ============== PURCHASE ORDER ==============
    } else if (type === "po") {
      const [po] = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, id));
      if (!po) return NextResponse.json({ error: "PO not found" }, { status: 404 });

      const items = await db.select({
        yarnName: yarns.yarnName, yarnCount: yarns.yarnCount, composition: yarns.composition,
        micron: yarns.micron,
        colorName: poItems.colorName, colorCode: poItems.colorCode, colorReference: poItems.colorReference,
        quantity: poItems.quantity, unitPrice: poItems.unitPrice, currency: poItems.currency,
        unit: poItems.unit, weightBasis: poItems.weightBasis, incoterms: poItems.incoterms, notes: poItems.notes,
      }).from(poItems).leftJoin(yarns, eq(poItems.yarnId, yarns.id)).where(eq(poItems.poId, id));

      const [factory] = po.factoryId ? await db.select().from(factories).where(eq(factories.id, po.factoryId)) : [];
      const [company] = po.companyId ? await db.select().from(companies).where(eq(companies.id, po.companyId)) : [];
      const [shipTo] = po.shipToId ? await db.select().from(shipToAddresses).where(eq(shipToAddresses.id, po.shipToId)) : [];
      const [shipToContact] = po.shipToContactId 
        ? await db.select().from(shipToContacts).where(eq(shipToContacts.id, po.shipToContactId)) 
        : [];

      const exportItems = toExportItems(items);
      exportItems.forEach(it => {
        const qty = parseFloat(it.quantity || "0") || 0;
        it.amount = qty * (it.unitPrice || 0);
      });
      const subtotal = exportItems.reduce((s, it) => s + (it.amount || 0), 0);

      const lang = langOverride || detectDocumentLanguage(factory?.country);
      const templateKey = getRemarksTemplateKey("po", lang);
      const defaultRemarks = await fetchTemplateRemarks(templateKey);
      const finalRemarks = po.notes ? `${po.notes}\n\n${defaultRemarks}` : defaultRemarks;

      data = {
        docType: "Purchase Order",
        docNo: po.poNo || `PO-${id}`,
        date: po.poDate,
        company: company ? { name: company.name, officialName: company.officialName ?? undefined, address: company.addressEnglish ?? undefined, telephone: company.telephone ?? undefined, logoPath: company.logoPath ?? undefined } : undefined,
        party: factory ? { name: factory.factoryName, officialName: factory.officialName ?? undefined, address: factory.addressEnglish ?? undefined, telephone: factory.telephone ?? undefined, attn: po.contactPerson ?? undefined } : undefined,
        shipTo: shipTo ? { 
          name: shipTo.name, 
          officialName: shipTo.officialName ?? undefined, 
          address: shipTo.addressEnglish ?? undefined,
          attn: shipToContact?.contactName ?? undefined,
          telephone: shipToContact?.phone ?? shipTo.telephone ?? undefined,
        } : undefined,
        reference: po.soNo ?? undefined,
        customerPoNo: po.customerPoNo ?? undefined,
        deliveryDate: po.deliveryDate ?? undefined,
        paymentTerms: po.paymentMethod ? `${po.paymentMethod}${po.paymentDays ? ` ${po.paymentDays} Days` : ""}` : undefined,
        currency: po.currency ?? undefined,
        incoterms: po.incoterms ?? undefined,
        status: po.status ?? undefined,
        orderCategory: po.orderCategory ?? undefined,
        quantityUnit: po.quantityUnit ?? undefined,
        items: exportItems,
        subtotal,
        total: subtotal,
        notes: finalRemarks || undefined,
        exportedBy: currentUserName,
      };

    // ============== DELIVERY NOTE ==============
    } else if (type === "dn") {
      const [dn] = await db.select().from(deliveryNotes).where(eq(deliveryNotes.id, id));
      if (!dn) return NextResponse.json({ error: "DN not found" }, { status: 404 });

      const items = await db.select({
        yarnName: yarns.yarnName, yarnCount: yarns.yarnCount,
        colorName: dnItems.colorName, colorCode: dnItems.colorCode,
        quantity: dnItems.quantity, lotNo: dnItems.lotNo,
        packages: dnItems.packages, grossWeight: dnItems.grossWeight, netWeight: dnItems.netWeight, notes: dnItems.notes,
      }).from(dnItems).leftJoin(yarns, eq(dnItems.yarnId, yarns.id)).where(eq(dnItems.dnId, id));

      const [customer] = dn.customerId ? await db.select().from(customers).where(eq(customers.id, dn.customerId)) : [];
      const [company] = dn.companyId ? await db.select().from(companies).where(eq(companies.id, dn.companyId)) : [];
      const [shipTo] = dn.shipToId ? await db.select().from(shipToAddresses).where(eq(shipToAddresses.id, dn.shipToId)) : [];
      const [shipToContact] = dn.shipToContactId 
        ? await db.select().from(shipToContacts).where(eq(shipToContacts.id, dn.shipToContactId)) 
        : [];

      const lang = langOverride || detectDocumentLanguage(customer?.country);
      const templateKey = getRemarksTemplateKey("dn", lang);
      const defaultRemarks = await fetchTemplateRemarks(templateKey);
      const finalRemarks = dn.notes ? `${dn.notes}\n\n${defaultRemarks}` : defaultRemarks;

      data = {
        docType: "Delivery Note",
        docNo: dn.dnNo || `DN-${id}`,
        date: dn.dnDate,
        company: company ? { name: company.name, officialName: company.officialName ?? undefined, address: company.addressEnglish ?? undefined, telephone: company.telephone ?? undefined, logoPath: company.logoPath ?? undefined } : undefined,
        party: customer ? { name: customer.name, officialName: customer.officialName ?? undefined, address: customer.addressEnglish ?? undefined } : undefined,
        shipTo: shipTo ? { 
          name: shipTo.name, 
          officialName: shipTo.officialName ?? undefined, 
          address: shipTo.addressEnglish ?? undefined,
          attn: shipToContact?.contactName ?? undefined,
          telephone: shipToContact?.phone ?? shipTo.telephone ?? undefined,
        } : undefined,
        customerPoNo: dn.customerPoNo ?? undefined,
        reference: dn.soNo ?? undefined,
        status: dn.status ?? undefined,
        orderCategory: dn.orderCategory ?? undefined,
        quantityUnit: dn.quantityUnit ?? undefined,
        items: toExportItems(items),
        notes: finalRemarks || undefined,
        exportedBy: currentUserName,
      };

    // ============== SALES INVOICE ==============
    } else if (type === "invoice") {
      const [inv] = await db.select().from(invoices).where(eq(invoices.id, id));
      if (!inv) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

      const items = await db.select({
        yarnName: yarns.yarnName, yarnCount: yarns.yarnCount, composition: yarns.composition,
        micron: yarns.micron,
        description: invoiceItems.description, colorName: invoiceItems.colorName, colorCode: invoiceItems.colorCode,
        quantity: invoiceItems.quantity, unitPrice: invoiceItems.unitPrice,
        currency: invoices.currency,
        unit: invoiceItems.unit, weightBasis: invoiceItems.weightBasis, incoterms: invoiceItems.incoterms,
        amount: invoiceItems.amount, notes: invoiceItems.notes,
      }).from(invoiceItems)
        .leftJoin(yarns, eq(invoiceItems.yarnId, yarns.id))
        .leftJoin(invoices, eq(invoiceItems.invoiceId, invoices.id))
        .where(eq(invoiceItems.invoiceId, id));

      const [company] = inv.companyId ? await db.select().from(companies).where(eq(companies.id, inv.companyId)) : [];
      const [customer] = inv.customerId ? await db.select().from(customers).where(eq(customers.id, inv.customerId)) : [];
      const [contact] = inv.contactId ? await db.select().from(customerContacts).where(eq(customerContacts.id, inv.contactId)) : [];
      let bankInfo: any;
      if (inv.bankAccountId) {
        const [b] = await db.select().from(bankAccounts).where(eq(bankAccounts.id, inv.bankAccountId));
        if (b) bankInfo = b;
      }

      const lang = langOverride || detectDocumentLanguage(customer?.country);
      const templateKey = getRemarksTemplateKey("invoice", lang);
      const defaultRemarks = await fetchTemplateRemarks(templateKey);
      const finalRemarks = inv.notes ? `${inv.notes}\n\n${defaultRemarks}` : defaultRemarks;

      data = {
        docType: "Sales Invoice",
        docNo: inv.invoiceNo || `INV-${id}`,
        date: inv.invoiceDate,
        company: company ? { name: company.name, officialName: company.officialName ?? undefined, address: company.addressEnglish ?? undefined, telephone: company.telephone ?? undefined, logoPath: company.logoPath ?? undefined } : undefined,
        party: customer ? { name: customer.name, officialName: customer.officialName ?? undefined, address: customer.addressEnglish ?? undefined, attn: contact?.contactName ?? undefined } : undefined,
        reference: inv.soNo ?? undefined,
        customerPoNo: inv.customerPoNo ?? undefined,
        deliveryDate: inv.dueDate ?? undefined,
        currency: inv.currency ?? undefined,
        status: inv.status ?? undefined,
        items: toExportItems(items),
        subtotal: inv.subtotal ?? undefined,
        vatRate: inv.vatRate ?? undefined,
        vatAmount: inv.vatAmount ?? undefined,
        total: inv.total ?? undefined,
        bankInfo,
        notes: finalRemarks || undefined,
        exportedBy: currentUserName,
      };

    // ============== SUPPLIER INVOICE ==============
    } else if (type === "supplier-invoice") {
      const [inv] = await db.select().from(supplierInvoices).where(eq(supplierInvoices.id, id));
      if (!inv) return NextResponse.json({ error: "Supplier Invoice not found" }, { status: 404 });

      const items = await db.select({
        yarnName: yarns.yarnName, yarnCount: yarns.yarnCount, composition: yarns.composition,
        micron: yarns.micron,
        description: supplierInvoiceItems.description, colorName: supplierInvoiceItems.colorName, colorCode: supplierInvoiceItems.colorCode,
        quantity: supplierInvoiceItems.quantity, unitPrice: supplierInvoiceItems.unitPrice,
        currency: supplierInvoices.currency,
        unit: supplierInvoiceItems.unit, weightBasis: supplierInvoiceItems.weightBasis, incoterms: supplierInvoiceItems.incoterms,
        amount: supplierInvoiceItems.amount, notes: supplierInvoiceItems.notes,
      }).from(supplierInvoiceItems)
        .leftJoin(yarns, eq(supplierInvoiceItems.yarnId, yarns.id))
        .leftJoin(supplierInvoices, eq(supplierInvoiceItems.supplierInvoiceId, supplierInvoices.id))
        .where(eq(supplierInvoiceItems.supplierInvoiceId, id));

      const [company] = inv.companyId ? await db.select().from(companies).where(eq(companies.id, inv.companyId)) : [];
      const [factory] = inv.factoryId ? await db.select().from(factories).where(eq(factories.id, inv.factoryId)) : [];
      let bankInfo: any;
      if (inv.bankAccountId) {
        const [b] = await db.select().from(bankAccounts).where(eq(bankAccounts.id, inv.bankAccountId));
        if (b) bankInfo = b;
      }

      const lang = langOverride || detectDocumentLanguage(factory?.country);
      const templateKey = getRemarksTemplateKey("supplier-invoice", lang);
      const defaultRemarks = await fetchTemplateRemarks(templateKey);
      const finalRemarks = inv.notes ? `${inv.notes}\n\n${defaultRemarks}` : defaultRemarks;

      data = {
        docType: "Supplier Invoice",
        docNo: inv.supplierInvoiceNo || inv.internalNo || `SI-${id}`,
        date: inv.invoiceDate,
        company: company ? { name: company.name, officialName: company.officialName ?? undefined, address: company.addressEnglish ?? undefined, telephone: company.telephone ?? undefined, logoPath: company.logoPath ?? undefined } : undefined,
        party: factory ? { name: factory.factoryName, officialName: factory.officialName ?? undefined, address: factory.addressEnglish ?? undefined } : undefined,
        reference: inv.poNo ?? undefined,
        deliveryDate: inv.dueDate ?? undefined,
        currency: inv.currency ?? undefined,
        status: inv.status ?? undefined,
        items: toExportItems(items),
        subtotal: inv.subtotal ?? undefined,
        vatRate: inv.vatRate ?? undefined,
        vatAmount: inv.vatAmount ?? undefined,
        total: inv.total ?? undefined,
        bankInfo,
        notes: finalRemarks || undefined,
        exportedBy: currentUserName,
      };

    // ============== RECONCILIATION ==============
    } else if (type === "reconciliation") {
      const customerId = id;
      const [customer] = await db.select().from(customers).where(eq(customers.id, customerId));
      if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

      const [company] = await db.select().from(companies).limit(1);
      const custInvoices = await db.select().from(invoices).where(eq(invoices.customerId, customerId)).orderBy(desc(invoices.invoiceDate));

      const items: ExportItem[] = [];
      let balance = 0;
      let totalDebit = 0;
      let totalCredit = 0;

      for (const inv of custInvoices) {
        if (inv.status === "Cancelled") continue;
        const debit = inv.total || 0;
        balance += debit;
        totalDebit += debit;
        items.push({
          docNo: inv.invoiceNo || `INV-${inv.id}`,
          docDate: inv.invoiceDate,
          docType: "Invoice",
          description: `SO: ${inv.soNo || "-"} / PO: ${inv.customerPoNo || "-"}`,
          debit,
          credit: 0,
          balance,
          currency: inv.currency || "USD",
        });

        const invPayments = await db.select().from(payments).where(eq(payments.invoiceId, inv.id)).orderBy(payments.paymentDate);
        for (const pay of invPayments) {
          const credit = pay.amount;
          balance -= credit;
          totalCredit += credit;
          items.push({
            docNo: pay.reference || `PAY-${pay.id}`,
            docDate: pay.paymentDate,
            docType: "Payment",
            description: `${pay.method || "Payment"} received against ${inv.invoiceNo || `INV-${inv.id}`}`,
            debit: 0,
            credit,
            balance,
            currency: pay.currency || "USD",
          });
        }
      }

      const lang = langOverride || detectDocumentLanguage(customer.country);
      const templateKey = getRemarksTemplateKey("reconciliation", lang);
      const defaultRemarks = await fetchTemplateRemarks(templateKey);
      const mainCurrency = items[0]?.currency || "USD";

      data = {
        docType: "Reconciliation",
        docNo: `REC-${customerId}-${new Date().toISOString().slice(0, 10)}`,
        date: new Date().toISOString().slice(0, 10),
        company: company ? { name: company.name, officialName: company.officialName ?? undefined, address: company.addressEnglish ?? undefined, telephone: company.telephone ?? undefined, logoPath: company.logoPath ?? undefined } : undefined,
        party: { name: customer.name, officialName: customer.officialName ?? undefined, address: customer.addressEnglish ?? undefined },
        currency: mainCurrency,
        items,
        openingBalance: 0,
        closingBalance: balance,
        subtotal: totalDebit,
        total: balance,
        notes: defaultRemarks || undefined,
        exportedBy: currentUserName,
      };

    } else {
      return NextResponse.json({ error: `Unknown type: ${type}` }, { status: 400 });
    }

    const buffer = await generateExcel(data);

    // 智能檔案命名
    const prefixMap: Record<string, string> = {
      "Quotation": "Q",
      "Purchase Order": "PO",
      "Delivery Note": "DN",
      "Sales Invoice": "INV",
      "Supplier Invoice": "SINV",
      "Reconciliation": "REC",
    };
    const prefix = prefixMap[data.docType] || data.docType;

    const sanitize = (s: string) => s.replace(/[/\\?%*:|"<>]/g, "-").replace(/\s+/g, "_");
    const parts: string[] = [prefix];

    if (data.customerPoNo) {
      parts.push(sanitize(data.customerPoNo));
    }
    parts.push(sanitize(data.docNo));
    parts.push(data.date);

    const fileName = `${parts.join("_")}.xlsx`;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (err) {
    console.error("Excel export error:", err);
    return NextResponse.json({ error: "Failed to generate Excel" }, { status: 500 });
  }
}