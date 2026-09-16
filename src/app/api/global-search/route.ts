import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { salesOrders, purchaseOrders, invoices, quotations, yarns, customers, factories } from "@/db/schema";
import { ilike, or } from "drizzle-orm";
import { getUserMap } from "@/lib/auditHelpers";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");

    if (!q || q.trim().length < 2) {
      return NextResponse.json([]);
    }

    const query = q.trim();
    const likeQuery = `%${query}%`;

    const results: Array<{
      type: string;
      id: number;
      title: string;
      subtitle: string;
      meta?: string | null;
    }> = [];

    // 1. Search Sales Orders
    const soList = await db
      .select({ id: salesOrders.id, soNo: salesOrders.soNo, customerPoNo: salesOrders.customerPoNo })
      .from(salesOrders)
      .where(or(ilike(salesOrders.soNo, likeQuery), ilike(salesOrders.customerPoNo, likeQuery)))
      .limit(5);
    
    soList.forEach((so) => {
      results.push({
        type: "so",
        id: so.id,
        title: so.soNo || `SO #${so.id}`,
        subtitle: `Sales Order - PO No: ${so.customerPoNo || "N/A"}`,
      });
    });

    // 2. Search Purchase Orders
    const poList = await db
      .select({ id: purchaseOrders.id, poNo: purchaseOrders.poNo, soNo: purchaseOrders.soNo })
      .from(purchaseOrders)
      .where(or(ilike(purchaseOrders.poNo, likeQuery), ilike(purchaseOrders.soNo, likeQuery)))
      .limit(5);
    
    poList.forEach((po) => {
      results.push({
        type: "po",
        id: po.id,
        title: po.poNo || `PO #${po.id}`,
        subtitle: `Purchase Order - SO Ref: ${po.soNo || "N/A"}`,
      });
    });

    // 3. Search Invoices
    const invList = await db
      .select({ id: invoices.id, invoiceNo: invoices.invoiceNo, invoiceType: invoices.invoiceType })
      .from(invoices)
      .where(ilike(invoices.invoiceNo, likeQuery))
      .limit(5);
    
    invList.forEach((inv) => {
      results.push({
        type: "invoice",
        id: inv.id,
        title: inv.invoiceNo || `Invoice #${inv.id}`,
        subtitle: `${inv.invoiceType || "Invoice"}`,
      });
    });

    // 4. Search Quotations
    const qList = await db
      .select({ id: quotations.id, quoteNo: quotations.quoteNo })
      .from(quotations)
      .where(ilike(quotations.quoteNo, likeQuery))
      .groupBy(quotations.id, quotations.quoteNo)
      .limit(3);
    
    qList.forEach((qt) => {
      if (qt.quoteNo) {
        results.push({
          type: "quotation",
          id: qt.id,
          title: qt.quoteNo,
          subtitle: "Quotation Record",
        });
      }
    });

    // 5. Search Yarns
    const yList = await db
      .select({ id: yarns.id, yarnName: yarns.yarnName, yarnCount: yarns.yarnCount })
      .from(yarns)
      .where(or(ilike(yarns.yarnName, likeQuery), ilike(yarns.yarnCount, likeQuery)))
      .limit(5);
    
    yList.forEach((y) => {
      results.push({
        type: "yarn",
        id: y.id,
        title: y.yarnName,
        subtitle: `Yarn Product - ${y.yarnCount || "N/A"}`,
      });
    });

    // 6. Search Customers
    const cList = await db
      .select({ id: customers.id, name: customers.name, officialName: customers.officialName })
      .from(customers)
      .where(or(ilike(customers.name, likeQuery), ilike(customers.officialName, likeQuery)))
      .limit(3);
    
    cList.forEach((c) => {
      results.push({
        type: "customer",
        id: c.id,
        title: c.name,
        subtitle: `Client - ${c.officialName || "N/A"}`,
      });
    });

    // 7. Search Factories
    const fList = await db
      .select({ id: factories.id, factoryName: factories.factoryName, officialName: factories.officialName })
      .from(factories)
      .where(or(ilike(factories.factoryName, likeQuery), ilike(factories.officialName, likeQuery)))
      .limit(3);
    
    fList.forEach((f) => {
      results.push({
        type: "factory",
        id: f.id,
        title: f.factoryName,
        subtitle: `Yarn Mill - ${f.officialName || "N/A"}`,
      });
    });

    return NextResponse.json(results);
  } catch (err) {
    console.error("Global search error:", err);
    return NextResponse.json({ error: "Failed to search" }, { status: 500 });
  }
}
