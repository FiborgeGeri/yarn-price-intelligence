import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { salesOrders, soItems, purchaseOrders, poItems, customers, customerContacts, shipToAddresses, shipToContacts, yarns, factories, prices } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getUserMap } from "@/lib/auditHelpers";

function createSoNo() {
  const d = new Date();
  return `SO-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function createPoNo() {
  const d = new Date();
  return `PO-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export async function GET() {
  try {
    const orders = await db
      .select({
        id: salesOrders.id,
        soNo: salesOrders.soNo,
        customerId: salesOrders.customerId,
        contactId: salesOrders.contactId,
        shipToId: salesOrders.shipToId,
        customerName: customers.name,
        contactName: customerContacts.contactName,
        shipToName: shipToAddresses.name,
        shipToContactId: salesOrders.shipToContactId,
        shipToContactName: shipToContacts.contactName,
        orderCategory: salesOrders.orderCategory,
        quantityUnit: salesOrders.quantityUnit,
        paymentMethod: salesOrders.paymentMethod,
        paymentDays: salesOrders.paymentDays,
        paymentReference: salesOrders.paymentReference,
        customerPoNo: salesOrders.customerPoNo,
        quoteNo: salesOrders.quoteNo,
        soDate: salesOrders.soDate,
        deliveryDate: salesOrders.deliveryDate,
        status: salesOrders.status,
        notes: salesOrders.notes,
        createdAt: salesOrders.createdAt,
        createdBy: salesOrders.createdBy,
        updatedBy: salesOrders.updatedBy,
      })
      .from(salesOrders)
      .leftJoin(customers, eq(salesOrders.customerId, customers.id))
      .leftJoin(customerContacts, eq(salesOrders.contactId, customerContacts.id))
      .leftJoin(shipToAddresses, eq(salesOrders.shipToId, shipToAddresses.id))
      .leftJoin(shipToContacts, eq(salesOrders.shipToContactId, shipToContacts.id))
      .orderBy(desc(salesOrders.soDate), desc(salesOrders.createdAt));

    const allItems = await db
      .select({
        id: soItems.id,
        soId: soItems.soId,
        yarnId: soItems.yarnId,
        colorName: soItems.colorName,
        colorCode: soItems.colorCode,
        yarnName: yarns.yarnName,
        yarnCount: yarns.yarnCount,
        composition: yarns.composition,
        factoryId: yarns.factoryId,
        factoryName: factories.factoryName,
        quantity: soItems.quantity,
        unitPrice: soItems.unitPrice,
        currency: soItems.currency,
        unit: soItems.unit,
        weightBasis: soItems.weightBasis,
        incoterms: soItems.incoterms,
        notes: soItems.notes,
      })
      .from(soItems)
      .leftJoin(yarns, eq(soItems.yarnId, yarns.id))
      .leftJoin(factories, eq(yarns.factoryId, factories.id));

    const itemMap: Record<number, typeof allItems> = {};
    for (const item of allItems) {
      if (item.soId) {
        if (!itemMap[item.soId]) itemMap[item.soId] = [];
        itemMap[item.soId].push(item);
      }
    }

    const userMap = await getUserMap();
    const result = orders.map((o) => ({
      ...o,
      items: itemMap[o.id] || [],
      createdByName: o.createdBy ? userMap[o.createdBy] || null : null,
      updatedByName: o.updatedBy ? userMap[o.updatedBy] || null : null,
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error("SalesOrders GET error:", err);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, customerId, contactId, shipToId, shipToContactId, orderCategory, quantityUnit, paymentMethod, paymentDays, paymentReference, customerPoNo, quoteNo, soDate, deliveryDate, status, notes, items, autoCreatePO, userId } = body;

    if (!customerId || !soDate) {
      return NextResponse.json({ error: "Customer and date are required" }, { status: 400 });
    }

    if (id) {
      await db.update(salesOrders).set({
        customerId,
        contactId: contactId || null,
        shipToId: shipToId || null,
        shipToContactId: shipToContactId || null,
        orderCategory: orderCategory || "Bulk",
        quantityUnit: quantityUnit || "KGS",
        paymentMethod: paymentMethod || null,
        paymentDays: paymentDays || null,
        paymentReference: paymentReference || null,
        customerPoNo: customerPoNo || null,
        quoteNo: quoteNo || null,
        soDate,
        deliveryDate: deliveryDate || null,
        status: status || "Confirmed",
        notes: notes || null,
        updatedAt: new Date(),
        updatedBy: userId || null,
      }).where(eq(salesOrders.id, id));

      // Sync linked POs — update header fields + status + items
      const soRecord = await db.select({ soNo: salesOrders.soNo }).from(salesOrders).where(eq(salesOrders.id, id));
      const soNo = soRecord[0]?.soNo;
      if (soNo) {
        // Status mapping
        const statusMap: Record<string, string> = {
          "Confirmed": "Confirmed", "In Production": "In Production",
          "Shipped": "Shipped", "Delivered": "Received", "Cancelled": "Cancelled",
        };
        const poStatus = statusMap[status] || undefined;

        // Update PO header fields
        const linkedPOs = await db.select({ id: purchaseOrders.id, factoryId: purchaseOrders.factoryId }).from(purchaseOrders).where(eq(purchaseOrders.soNo, soNo));
        for (const po of linkedPOs) {
          await db.update(purchaseOrders).set({
            customerId,
            shipToId: shipToId || null,
            shipToContactId: shipToContactId || null,
            orderCategory: orderCategory || "Bulk",
            quantityUnit: quantityUnit || "KGS",
            customerPoNo: customerPoNo || null,
            deliveryDate: deliveryDate || null,
            ...(poStatus ? { status: poStatus } : {}),
            updatedAt: new Date(),
            updatedBy: userId || null,
          }).where(eq(purchaseOrders.id, po.id));

          // Update PO items — only items that match this PO's factory
          if (items?.length) {
            // Get yarn->factory mapping
            const yarnData = await db.select({ id: yarns.id, factoryId: yarns.factoryId }).from(yarns);
            const yarnFactoryMap: Record<number, number> = {};
            for (const y of yarnData) { if (y.factoryId) yarnFactoryMap[y.id] = y.factoryId; }

            const poItemsForFactory = items.filter((item: { yarnId: number }) => yarnFactoryMap[item.yarnId] === po.factoryId);
            if (poItemsForFactory.length > 0) {
              await db.delete(poItems).where(eq(poItems.poId, po.id));
              await db.insert(poItems).values(poItemsForFactory.map((item: { yarnId: number; colorName?: string; colorCode?: string; quantity?: string; unitPrice: string; currency?: string; unit?: string; weightBasis?: string; incoterms?: string; notes?: string }) => ({
                poId: po.id,
                yarnId: item.yarnId,
                colorName: item.colorName || null,
                colorCode: item.colorCode || null,
                quantity: item.quantity || null,
                unitPrice: parseFloat(item.unitPrice),
                currency: item.currency || "USD",
                unit: item.unit || "per KG",
                weightBasis: item.weightBasis || "condition",
                incoterms: item.incoterms || null,
                notes: item.notes || null,
              })));
            }
          }
        }
      }

      await db.delete(soItems).where(eq(soItems.soId, id));
      if (items?.length) {
        await db.insert(soItems).values(items.map((item: any) => ({
          soId: id,
          yarnId: item.yarnId,
          colorName: item.colorName || null,
          colorCode: item.colorCode || null,
          quantity: item.quantity || null,
          unitPrice: parseFloat(item.unitPrice),
          currency: item.currency || "USD",
          unit: item.unit || "per KG",
          weightBasis: item.weightBasis || "condition",
          incoterms: item.incoterms || null,
          notes: item.notes || null,
        })));
      }

      return NextResponse.json({ success: true, id });
    } else {
      const soNo = createSoNo();
      const [so] = await db.insert(salesOrders).values({
        soNo,
        customerId,
        contactId: contactId || null,
        shipToId: shipToId || null,
        shipToContactId: shipToContactId || null,
        orderCategory: orderCategory || "Bulk",
        quantityUnit: quantityUnit || "KGS",
        paymentMethod: paymentMethod || null,
        paymentDays: paymentDays || null,
        paymentReference: paymentReference || null,
        customerPoNo: customerPoNo || null,
        quoteNo: quoteNo || null,
        soDate,
        deliveryDate: deliveryDate || null,
        status: status || "Confirmed",
        notes: notes || null,
        createdBy: userId || null,
        updatedBy: userId || null,
      }).returning();

      if (items?.length && so) {
        await db.insert(soItems).values(items.map((item: any) => ({
          soId: so.id,
          yarnId: item.yarnId,
          colorName: item.colorName || null,
          colorCode: item.colorCode || null,
          quantity: item.quantity || null,
          unitPrice: parseFloat(item.unitPrice),
          currency: item.currency || "USD",
          unit: item.unit || "per KG",
          weightBasis: item.weightBasis || "condition",
          incoterms: item.incoterms || null,
          notes: item.notes || null,
        })));
      }

      if (autoCreatePO && items?.length) {
        const yarnData = await db.select({
          id: yarns.id,
          factoryId: yarns.factoryId,
        }).from(yarns);

        const yarnFactoryMap: Record<number, number> = {};
        for (const y of yarnData) {
          if (y.factoryId) yarnFactoryMap[y.id] = y.factoryId;
        }

        const factoryItems: Record<number, any[]> = {};
        for (const item of items) {
          const factoryId = yarnFactoryMap[item.yarnId];
          if (factoryId) {
            if (!factoryItems[factoryId]) factoryItems[factoryId] = [];
            factoryItems[factoryId].push(item);
          }
        }

        for (const [factoryId, fItems] of Object.entries(factoryItems)) {
          const poNo = createPoNo();
          const [po] = await db.insert(purchaseOrders).values({
            poNo,
            factoryId: parseInt(factoryId),
            customerId,
            shipToId: shipToId || null,
            shipToContactId: shipToContactId || null,
            orderCategory: orderCategory || "Bulk",
            quantityUnit: quantityUnit || "KGS",
            contactPerson: null,
            soNo,
            customerPoNo: customerPoNo || null,
            quoteNo: quoteNo || null,
            currency: fItems[0]?.currency || "USD",
            unit: fItems[0]?.unit || "per KG",
            poDate: soDate,
            deliveryDate: deliveryDate || null,
            incoterms: fItems[0]?.incoterms || null,
            status: "Draft",
            notes: `Auto-created from ${soNo}`,
          }).returning();

          if (po) {
            const costPrices: Record<string, number> = {};
            for (const item of fItems) {
              if (!item.yarnId) continue;
              const key = `${item.yarnId}|${item.currency || "USD"}|${item.unit || "per KG"}|${item.incoterms || ""}`;
              if (costPrices[key] === undefined) {
                const yarnPrices = await db.select({ price: prices.price }).from(prices)
                  .where(eq(prices.yarnId, item.yarnId))
                  .orderBy(desc(prices.recordDate), desc(prices.createdAt))
                  .limit(1);
                costPrices[key] = yarnPrices[0]?.price ?? parseFloat(item.unitPrice);
              }
            }

            await db.insert(poItems).values(
              fItems.map((item: any) => {
                const key = `${item.yarnId}|${item.currency || "USD"}|${item.unit || "per KG"}|${item.incoterms || ""}`;
                return {
                  poId: po.id,
                  yarnId: item.yarnId,
                  colorName: item.colorName || null,
                  colorCode: item.colorCode || null,
                  quantity: item.quantity || null,
                  unitPrice: costPrices[key] ?? parseFloat(item.unitPrice),
                  currency: item.currency || "USD",
                  unit: item.unit || "per KG",
                  weightBasis: item.weightBasis || "condition",
                  incoterms: item.incoterms || null,
                  notes: item.notes || null,
                };
              })
            );
          }
        }
      }

      return NextResponse.json({ success: true, id: so.id, soNo });
    }
  } catch (err) {
    console.error("SalesOrders POST error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    await db.delete(salesOrders).where(eq(salesOrders.id, parseInt(id)));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("SalesOrders DELETE error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
