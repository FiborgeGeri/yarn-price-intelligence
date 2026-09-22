import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  purchaseOrders, poItems,
  deliveryNotes, dnItems,
  invoices, invoiceItems,
  supplierInvoices, supplierInvoiceItems,
  customers, factories, companies, yarns,
  shipToAddresses, bankAccounts, systemSettings,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateExcel, ExportData, ExportItem } from "@/lib/excelExport";

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

    if (!type || !id) return NextResponse.json({ error: "type and id required" }, { status: 400 });

    let data: ExportData;

    if (type === "po") {
      const [po] = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, id));
      if (!po) return NextResponse.json({ error: "PO not found" }, { status: 404 });

      const items = await db.select({
        yarnName: yarns.yarnName, yarnCount: yarns.yarnCount, composition: yarns.composition,
        colorName: poItems.colorName, colorCode: poItems.colorCode, colorReference: poItems.colorReference,
        quantity: poItems.quantity, unitPrice: poItems.unitPrice, currency: poItems.currency,
        unit: poItems.unit, weightBasis: poItems.weightBasis, incoterms: poItems.incoterms, notes: poItems.notes,
      }).from(poItems).leftJoin(yarns, eq(poItems.yarnId, yarns.id)).where(eq(poItems.poId, id));

      const [factory] = po.factoryId ? await db.select().from(factories).where(eq(factories.id, po.factoryId)) : [];
      const [company] = po.companyId ? await db.select().from(companies).where(eq(companies.id, po.companyId)) : [];

      const exportItems = toExportItems(items);
      const subtotal = exportItems.reduce((s, it) => s + ((it.amount) || 0), 0);
      const defaultRemarks = await fetchTemplateRemarks("template_po_remarks");
      const finalRemarks = po.notes ? `${po.notes}\n\n${defaultRemarks}` : defaultRemarks;

      data = {
        docType: "Purchase Order",
        docNo: po.poNo || `PO-${id}`,
        date: po.poDate,
        company: company ? { name: company.name, officialName: company.officialName ?? undefined, address: company.addressEnglish ?? undefined, telephone: company.telephone ?? undefined, logoPath: company.logoPath ?? undefined } : undefined,
        party: factory ? { name: factory.factoryName, officialName: factory.officialName ?? undefined, address: factory.addressEnglish ?? undefined, telephone: factory.telephone ?? undefined } : undefined,
        reference: po.soNo ?? undefined,
        customerPoNo: po.customerPoNo ?? undefined,
        deliveryDate: po.deliveryDate ?? undefined,
        paymentTerms: po.paymentMethod ? `${po.paymentMethod}${po.paymentDays ? ` ${po.paymentDays} Days` : ""}` : undefined,
        currency: po.currency ?? undefined,
        incoterms: po.incoterms ?? undefined,
        status: po.status ?? undefined,
        items: exportItems,
        subtotal,
        total: subtotal,
        notes: finalRemarks || undefined,
      };

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

      const defaultRemarks = await fetchTemplateRemarks("template_dn_remarks");
      const finalRemarks = dn.notes ? `${dn.notes}\n\n${defaultRemarks}` : defaultRemarks;

      data = {
        docType: "Delivery Note",
        docNo: dn.dnNo || `DN-${id}`,
        date: dn.dnDate,
        company: company ? { name: company.name, officialName: company.officialName ?? undefined, address: company.addressEnglish ?? undefined, telephone: company.telephone ?? undefined, logoPath: company.logoPath ?? undefined } : undefined,
        party: customer ? { name: customer.name, officialName: customer.officialName ?? undefined, address: customer.addressEnglish ?? undefined } : undefined,
        shipTo: shipTo ? { name: shipTo.name, address: shipTo.addressEnglish ?? undefined } : undefined,
        customerPoNo: dn.customerPoNo ?? undefined,
        reference: dn.soNo ?? undefined,
        status: dn.status ?? undefined,
        items: toExportItems(items),
        notes: finalRemarks || undefined,
      };

    } else if (type === "invoice") {
      const [inv] = await db.select().from(invoices).where(eq(invoices.id, id));
      if (!inv) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

      // 🆕 透過 Join invoices 表來撈取正確的 currency
      const items = await db.select({
        yarnName: yarns.yarnName, yarnCount: yarns.yarnCount, composition: yarns.composition,
        description: invoiceItems.description, colorName: invoiceItems.colorName, colorCode: invoiceItems.colorCode,
        quantity: invoiceItems.quantity, unitPrice: invoiceItems.unitPrice, 
        currency: invoices.currency, // 從父表帶入
        unit: invoiceItems.unit, weightBasis: invoiceItems.weightBasis, incoterms: invoiceItems.incoterms,
        amount: invoiceItems.amount, notes: invoiceItems.notes,
      }).from(invoiceItems)
        .leftJoin(yarns, eq(invoiceItems.yarnId, yarns.id))
        .leftJoin(invoices, eq(invoiceItems.invoiceId, invoices.id))
        .where(eq(invoiceItems.invoiceId, id));

      const [company] = inv.companyId ? await db.select().from(companies).where(eq(companies.id, inv.companyId)) : [];
      let party: { name: string; officialName?: string; address?: string } | undefined;
      if (inv.customerId) {
        const [c] = await db.select().from(customers).where(eq(customers.id, inv.customerId));
        if (c) party = { name: c.name, officialName: c.officialName ?? undefined, address: c.addressEnglish ?? undefined };
      }
      let bankInfo: any;
      if (inv.bankAccountId) {
        const [b] = await db.select().from(bankAccounts).where(eq(bankAccounts.id, inv.bankAccountId));
        if (b) bankInfo = b;
      }

      const defaultRemarks = await fetchTemplateRemarks("template_invoice_remarks");
      const finalRemarks = inv.notes ? `${inv.notes}\n\n${defaultRemarks}` : defaultRemarks;

      data = {
        docType: "Sales Invoice",
        docNo: inv.invoiceNo || `INV-${id}`,
        date: inv.invoiceDate,
        company: company ? { name: company.name, officialName: company.officialName ?? undefined, address: company.addressEnglish ?? undefined, telephone: company.telephone ?? undefined, logoPath: company.logoPath ?? undefined } : undefined,
        party,
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
      };

    } else if (type === "supplier-invoice") {
      const [inv] = await db.select().from(supplierInvoices).where(eq(supplierInvoices.id, id));
      if (!inv) return NextResponse.json({ error: "Supplier Invoice not found" }, { status: 404 });

      // 🆕 透過 Join supplierInvoices 表來撈取正確的 currency
      const items = await db.select({
        yarnName: yarns.yarnName, yarnCount: yarns.yarnCount, composition: yarns.composition,
        description: supplierInvoiceItems.description, colorName: supplierInvoiceItems.colorName, colorCode: supplierInvoiceItems.colorCode,
        quantity: supplierInvoiceItems.quantity, unitPrice: supplierInvoiceItems.unitPrice,
        currency: supplierInvoices.currency, // 從父表帶入
        unit: supplierInvoiceItems.unit, weightBasis: supplierInvoiceItems.weightBasis, incoterms: supplierInvoiceItems.incoterms,
        amount: supplierInvoiceItems.amount, notes: supplierInvoiceItems.notes,
      }).from(supplierInvoiceItems)
        .leftJoin(yarns, eq(supplierInvoiceItems.yarnId, yarns.id))
        .leftJoin(supplierInvoices, eq(supplierInvoiceItems.supplierInvoiceId, supplierInvoices.id))
        .where(eq(supplierInvoiceItems.supplierInvoiceId, id));

      const [company] = inv.companyId ? await db.select().from(companies).where(eq(companies.id, inv.companyId)) : [];
      let party: { name: string; officialName?: string; address?: string } | undefined;
      if (inv.factoryId) {
        const [f] = await db.select().from(factories).where(eq(factories.id, inv.factoryId));
        if (f) party = { name: f.factoryName, officialName: f.officialName ?? undefined, address: f.addressEnglish ?? undefined };
      }
      let bankInfo: any;
      if (inv.bankAccountId) {
        const [b] = await db.select().from(bankAccounts).where(eq(bankAccounts.id, inv.bankAccountId));
        if (b) bankInfo = b;
      }

      const defaultRemarks = await fetchTemplateRemarks("template_supplier_invoice_remarks");
      const finalRemarks = inv.notes ? `${inv.notes}\n\n${defaultRemarks}` : defaultRemarks;

      data = {
        docType: "Supplier Invoice",
        docNo: inv.supplierInvoiceNo || inv.internalNo || `SI-${id}`,
        date: inv.invoiceDate,
        company: company ? { name: company.name, officialName: company.officialName ?? undefined, address: company.addressEnglish ?? undefined, telephone: company.telephone ?? undefined, logoPath: company.logoPath ?? undefined } : undefined,
        party,
        reference: inv.poNo ?? undefined,
        customerPoNo: undefined, // 🆕 修正為 undefined
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
      };

    } else {
      return NextResponse.json({ error: `Unknown type: ${type}` }, { status: 400 });
    }

    const buffer = await generateExcel(data);
    const fileName = `${data.docType.replace(/\s+/g, "_")}_${data.docNo}.xlsx`;
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
