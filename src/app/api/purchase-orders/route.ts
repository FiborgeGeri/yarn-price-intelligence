import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { purchaseOrders, poItems, factories, customers, yarns, treatments } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";

function createPoNo() {
  const d = new Date();
  return `PO-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export async function GET() {
  try {
    const orders = await db
      .select({
        id: purchaseOrders.id,
        poNo: purchaseOrders.poNo,
        factoryId: purchaseOrders.factoryId,
        factoryName: factories.factoryName,
        customerId: purchaseOrders.customerId,
        customerName: customers.name,
        contactPerson: purchaseOrders.contactPerson,
        quoteNo: purchaseOrders.quoteNo,
        currency: purchaseOrders.currency,
        unit: purchaseOrders.unit,
        poDate: purchaseOrders.poDate,
        deliveryDate: purchaseOrders.deliveryDate,
        incoterms: purchaseOrders.incoterms,
        status: purchaseOrders.status,
        notes: purchaseOrders.notes,
        createdAt: purchaseOrders.createdAt,
      })
      .from(purchaseOrders)
      .leftJoin(factories, eq(purchaseOrders.factoryId, factories.id))
      .leftJoin(customers, eq(purchaseOrders.customerId, customers.id))
      .orderBy(desc(purchaseOrders.createdAt));

    // Get items for each PO
    const allItems = await db
      .select({
        id: poItems.id,
        poId: poItems.poId,
        yarnId: poItems.yarnId,
        yarnName: yarns.yarnName,
        yarnCount: yarns.yarnCount,
        micron: yarns.micron,
        composition: yarns.composition,
        treatmentName: treatments.name,
        color: poItems.color,
        quantity: poItems.quantity,
        unitPrice: poItems.unitPrice,
        notes: poItems.notes,
      })
      .from(poItems)
      .leftJoin(yarns, eq(poItems.yarnId, yarns.id))
      .leftJoin(treatments, eq(yarns.treatmentId, treatments.id));

    const itemMap: Record<number, (typeof allItems)> = {};
    for (const item of allItems) {
      if (item.poId) {
        if (!itemMap[item.poId]) itemMap[item.poId] = [];
        itemMap[item.poId].push(item);
      }
    }

    const result = orders.map((o) => ({
      ...o,
      items: itemMap[o.id] || [],
      totalAmount: (itemMap[o.id] || []).reduce((sum, i) => sum + i.unitPrice, 0),
      itemCount: (itemMap[o.id] || []).length,
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error("PO GET error:", err);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, poNo, factoryId, customerId, contactPerson, quoteNo: linkedQuoteNo, currency, unit, poDate, deliveryDate, incoterms, status, notes, items } = body;

    if (!factoryId || !poDate) {
      return NextResponse.json({ error: "Factory and PO date are required" }, { status: 400 });
    }

    if (id) {
      // Update existing PO header
      await db.update(purchaseOrders).set({
        factoryId, customerId: customerId || null, contactPerson: contactPerson || null, quoteNo: linkedQuoteNo || null,
        currency, unit, poDate, deliveryDate: deliveryDate || null,
        incoterms: incoterms || null, status: status || "Draft",
        notes: notes || null, updatedAt: new Date(),
      }).where(eq(purchaseOrders.id, id));

      if (poNo) {
        await db.update(purchaseOrders).set({ poNo }).where(eq(purchaseOrders.id, id));
      }

      // Delete old items and re-insert
      await db.delete(poItems).where(eq(poItems.poId, id));
      if (items?.length) {
        for (const item of items) {
          if (!item.yarnId || !item.unitPrice) continue;
          await db.insert(poItems).values({
            poId: id, yarnId: item.yarnId, color: item.color || null,
            quantity: item.quantity || null, unitPrice: parseFloat(item.unitPrice), notes: item.notes || null,
          });
        }
      }

      return NextResponse.json({ success: true, id, poNo });
    }

    // Create new PO
    const finalPoNo = poNo || createPoNo();
    const [po] = await db.insert(purchaseOrders).values({
      poNo: finalPoNo, factoryId, customerId: customerId || null,
      contactPerson: contactPerson || null, quoteNo: linkedQuoteNo || null, currency: currency || "USD", unit: unit || "per KG",
      poDate, deliveryDate: deliveryDate || null, incoterms: incoterms || null,
      status: status || "Draft", notes: notes || null,
    }).returning();

    if (items?.length) {
      for (const item of items) {
        if (!item.yarnId || !item.unitPrice) continue;
        await db.insert(poItems).values({
          poId: po.id, yarnId: item.yarnId, color: item.color || null,
          quantity: item.quantity || null, unitPrice: parseFloat(item.unitPrice), notes: item.notes || null,
        });
      }
    }

    return NextResponse.json({ success: true, id: po.id, poNo: finalPoNo });
  } catch (err) {
    console.error("PO POST error:", err);
    const message = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    await db.delete(purchaseOrders).where(eq(purchaseOrders.id, parseInt(id)));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PO DELETE error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
