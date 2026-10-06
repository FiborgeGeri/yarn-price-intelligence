import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  yarns, factories, customers,
  salesOrders, soItems,
  purchaseOrders, poItems,
  quotations,
  deliveryNotes, dnItems,
  goodsReceipts, grItems,
  invoices, invoiceItems,
  supplierInvoices, supplierInvoiceItems,
} from "@/db/schema";
import { sql, eq, or } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get("q")?.trim();
    if (!q || q.length < 2) {
      return NextResponse.json([]);
    }

    const pattern = `%${q}%`;
    const results: any[] = [];

    // ==================== 1. Quotations ====================
    const quoteList = await db
      .selectDistinct({
        id: quotations.id,
        title: quotations.quoteNo,
        subtitle: sql<string>`concat(COALESCE(${customers.name}, '—'), ' · ', COALESCE(${yarns.yarnName}, '—'))`,
      })
      .from(quotations)
      .leftJoin(customers, eq(quotations.customerId, customers.id))
      .leftJoin(yarns, eq(quotations.yarnId, yarns.id))
      .where(
        or(
          sql`${quotations.quoteNo} ILIKE ${pattern}`,
          sql`${customers.name} ILIKE ${pattern}`,
          sql`${yarns.yarnName} ILIKE ${pattern}`,
          sql`${quotations.notes} ILIKE ${pattern}`
        )
      )
      .limit(5);
    quoteList.forEach((r) => results.push({ type: "quotation", ...r }));

    // ==================== 2. Sales Orders ====================
    const soList = await db
      .selectDistinct({
        id: salesOrders.id,
        title: salesOrders.soNo,
        subtitle: sql<string>`concat(COALESCE(${customers.name}, '—'), ' · Client PO: ', COALESCE(${salesOrders.customerPoNo}, '—'))`,
      })
      .from(salesOrders)
      .leftJoin(customers, eq(salesOrders.customerId, customers.id))
      .leftJoin(soItems, eq(soItems.soId, salesOrders.id))
      .where(
        or(
          sql`${salesOrders.soNo} ILIKE ${pattern}`,
          sql`${salesOrders.customerPoNo} ILIKE ${pattern}`,
          sql`${salesOrders.quoteNo} ILIKE ${pattern}`,
          sql`${salesOrders.notes} ILIKE ${pattern}`,
          sql`${customers.name} ILIKE ${pattern}`,
          sql`${soItems.colorName} ILIKE ${pattern}`,
          sql`${soItems.colorCode} ILIKE ${pattern}`,
          sql`${soItems.colorReference} ILIKE ${pattern}`,
          sql`${soItems.notes} ILIKE ${pattern}`
        )
      )
      .limit(5);
    soList.forEach((r) => results.push({ type: "so", ...r }));

    // ==================== 3. Purchase Orders ====================
    const poList = await db
      .selectDistinct({
        id: purchaseOrders.id,
        title: purchaseOrders.poNo,
        subtitle: sql<string>`concat(COALESCE(${factories.factoryName}, '—'), ' · SO Ref: ', COALESCE(${purchaseOrders.soNo}, '—'))`,
      })
      .from(purchaseOrders)
      .leftJoin(factories, eq(purchaseOrders.factoryId, factories.id))
      .leftJoin(poItems, eq(poItems.poId, purchaseOrders.id))
      .where(
        or(
          sql`${purchaseOrders.poNo} ILIKE ${pattern}`,
          sql`${purchaseOrders.soNo} ILIKE ${pattern}`,
          sql`${purchaseOrders.customerPoNo} ILIKE ${pattern}`,
          sql`${purchaseOrders.quoteNo} ILIKE ${pattern}`,
          sql`${purchaseOrders.notes} ILIKE ${pattern}`,
          sql`${factories.factoryName} ILIKE ${pattern}`,
          sql`${poItems.colorName} ILIKE ${pattern}`,
          sql`${poItems.colorCode} ILIKE ${pattern}`,
          sql`${poItems.colorReference} ILIKE ${pattern}`,
          sql`${poItems.notes} ILIKE ${pattern}`
        )
      )
      .limit(5);
    poList.forEach((r) => results.push({ type: "po", ...r }));

    // ==================== 4. Delivery Notes ====================
    const dnList = await db
      .selectDistinct({
        id: deliveryNotes.id,
        title: deliveryNotes.dnNo,
        subtitle: sql<string>`concat(COALESCE(${customers.name}, '—'), ' · SO: ', COALESCE(${deliveryNotes.soNo}, '—'))`,
      })
      .from(deliveryNotes)
      .leftJoin(customers, eq(deliveryNotes.customerId, customers.id))
      .leftJoin(dnItems, eq(dnItems.dnId, deliveryNotes.id))
      .where(
        or(
          sql`${deliveryNotes.dnNo} ILIKE ${pattern}`,
          sql`${deliveryNotes.soNo} ILIKE ${pattern}`,
          sql`${deliveryNotes.customerPoNo} ILIKE ${pattern}`,
          sql`${deliveryNotes.trackingNo} ILIKE ${pattern}`,
          sql`${deliveryNotes.notes} ILIKE ${pattern}`,
          sql`${dnItems.lotNo} ILIKE ${pattern}`,
          sql`${dnItems.colorName} ILIKE ${pattern}`,
          sql`${dnItems.colorCode} ILIKE ${pattern}`,
          sql`${dnItems.notes} ILIKE ${pattern}`
        )
      )
      .limit(5);
    dnList.forEach((r) => results.push({ type: "dn", ...r }));

    // ==================== 5. Goods Receipts ====================
    const grList = await db
      .selectDistinct({
        id: goodsReceipts.id,
        title: goodsReceipts.grNo,
        subtitle: sql<string>`concat(COALESCE(${factories.factoryName}, '—'), ' · PO: ', COALESCE(${goodsReceipts.poNo}, '—'))`,
      })
      .from(goodsReceipts)
      .leftJoin(factories, eq(goodsReceipts.factoryId, factories.id))
      .leftJoin(grItems, eq(grItems.grId, goodsReceipts.id))
      .where(
        or(
          sql`${goodsReceipts.grNo} ILIKE ${pattern}`,
          sql`${goodsReceipts.poNo} ILIKE ${pattern}`,
          sql`${goodsReceipts.trackingNo} ILIKE ${pattern}`,
          sql`${goodsReceipts.notes} ILIKE ${pattern}`,
          sql`${grItems.lotNo} ILIKE ${pattern}`,
          sql`${grItems.colorName} ILIKE ${pattern}`,
          sql`${grItems.colorCode} ILIKE ${pattern}`,
          sql`${grItems.notes} ILIKE ${pattern}`
        )
      )
      .limit(5);
    grList.forEach((r) => results.push({ type: "gr", ...r }));

    // ==================== 6. Sales Invoices ====================
    const invList = await db
      .selectDistinct({
        id: invoices.id,
        title: invoices.invoiceNo,
        subtitle: sql<string>`concat(COALESCE(${customers.name}, '—'), ' · SO: ', COALESCE(${invoices.soNo}, '—'))`,
      })
      .from(invoices)
      .leftJoin(customers, eq(invoices.customerId, customers.id))
      .leftJoin(invoiceItems, eq(invoiceItems.invoiceId, invoices.id))
      .where(
        or(
          sql`${invoices.invoiceNo} ILIKE ${pattern}`,
          sql`${invoices.soNo} ILIKE ${pattern}`,
          sql`${invoices.customerPoNo} ILIKE ${pattern}`,
          sql`${invoices.notes} ILIKE ${pattern}`,
          sql`${customers.name} ILIKE ${pattern}`,
          sql`${invoiceItems.colorName} ILIKE ${pattern}`,
          sql`${invoiceItems.colorCode} ILIKE ${pattern}`,
          sql`${invoiceItems.description} ILIKE ${pattern}`
        )
      )
      .limit(5);
    invList.forEach((r) => results.push({ type: "invoice", ...r }));

    // ==================== 7. Supplier Invoices ====================
    const supInvList = await db
      .selectDistinct({
        id: supplierInvoices.id,
        title: sql<string>`COALESCE(${supplierInvoices.supplierInvoiceNo}, ${supplierInvoices.internalNo})`,
        subtitle: sql<string>`concat(COALESCE(${factories.factoryName}, '—'), ' · PO: ', COALESCE(${supplierInvoices.poNo}, '—'))`,
      })
      .from(supplierInvoices)
      .leftJoin(factories, eq(supplierInvoices.factoryId, factories.id))
      .leftJoin(supplierInvoiceItems, eq(supplierInvoiceItems.supplierInvoiceId, supplierInvoices.id))
      .where(
        or(
          sql`${supplierInvoices.supplierInvoiceNo} ILIKE ${pattern}`,
          sql`${supplierInvoices.internalNo} ILIKE ${pattern}`,
          sql`${supplierInvoices.poNo} ILIKE ${pattern}`,
          sql`${supplierInvoices.notes} ILIKE ${pattern}`,
          sql`${factories.factoryName} ILIKE ${pattern}`,
          sql`${supplierInvoiceItems.colorName} ILIKE ${pattern}`,
          sql`${supplierInvoiceItems.colorCode} ILIKE ${pattern}`,
          sql`${supplierInvoiceItems.description} ILIKE ${pattern}`
        )
      )
      .limit(5);
    supInvList.forEach((r) => results.push({ type: "supplier-invoice", ...r }));

    // ==================== 8. Yarns ====================
    const yarnList = await db
      .select({
        id: yarns.id,
        title: yarns.yarnName,
        subtitle: sql<string>`concat(COALESCE(${yarns.yarnCount}, '—'), ' · ', COALESCE(${factories.factoryName}, '—'), ' · ', COALESCE(${yarns.composition}, '—'))`,
      })
      .from(yarns)
      .leftJoin(factories, eq(yarns.factoryId, factories.id))
      .where(
        or(
          sql`${yarns.yarnName} ILIKE ${pattern}`,
          sql`${yarns.yarnCount} ILIKE ${pattern}`,
          sql`${yarns.micron} ILIKE ${pattern}`,
          sql`${yarns.composition} ILIKE ${pattern}`
        )
      )
      .limit(5);
    yarnList.forEach((r) => results.push({ type: "yarn", ...r }));

    // ==================== 9. Customers ====================
    const custList = await db
      .select({
        id: customers.id,
        title: customers.name,
        subtitle: sql<string>`concat('Client · ', COALESCE(${customers.officialName}, ''), ' ', COALESCE(${customers.country}, ''))`,
      })
      .from(customers)
      .where(
        or(
          sql`${customers.name} ILIKE ${pattern}`,
          sql`${customers.officialName} ILIKE ${pattern}`,
          sql`${customers.country} ILIKE ${pattern}`
        )
      )
      .limit(3);
    custList.forEach((r) => results.push({ type: "customer", ...r }));

    // ==================== 10. Factories ====================
    const facList = await db
      .select({
        id: factories.id,
        title: factories.factoryName,
        subtitle: sql<string>`concat('Yarn Mill · ', COALESCE(${factories.officialName}, ''), ' ', COALESCE(${factories.country}, ''))`,
      })
      .from(factories)
      .where(
        or(
          sql`${factories.factoryName} ILIKE ${pattern}`,
          sql`${factories.officialName} ILIKE ${pattern}`,
          sql`${factories.country} ILIKE ${pattern}`
        )
      )
      .limit(3);
    facList.forEach((r) => results.push({ type: "factory", ...r }));

    return NextResponse.json(results);
  } catch (err) {
    console.error("Global search error:", err);
    return NextResponse.json([], { status: 500 });
  }
}