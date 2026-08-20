import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { deliveryNotes, dnItems, customers, customerContacts, shipToAddresses, shipToContacts, yarns, factories } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getUserMap } from "@/lib/auditHelpers";

function createDnNo() {
  const d = new Date();
  return `DN-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export async function GET() {
  try {
    const orders = await db
      .select({
        id: deliveryNotes.id,
        dnNo: deliveryNotes.dnNo,
        soId: deliveryNotes.soId,
        soNo: deliveryNotes.soNo,
        customerPoNo: deliveryNotes.customerPoNo,
        customerId: deliveryNotes.customerId,
        customerName: customers.name,
        contactName: customerContacts.contactName,
        shipToId: deliveryNotes.shipToId,
        shipToName: shipToAddresses.name,
        shipToContactName: shipToContacts.contactName,
        orderCategory: deliveryNotes.orderCategory,
        quantityUnit: deliveryNotes.quantityUnit,
        dnDate: deliveryNotes.dnDate,
        shippingMethod: deliveryNotes.shippingMethod,
        trackingNo: deliveryNotes.trackingNo,
        totalPackages: deliveryNotes.totalPackages,
        totalGrossWeight: deliveryNotes.totalGrossWeight,
        totalNetWeight: deliveryNotes.totalNetWeight,
        status: deliveryNotes.status,
        notes: deliveryNotes.notes,
        createdAt: deliveryNotes.createdAt,
        createdBy: deliveryNotes.createdBy,
        updatedBy: deliveryNotes.updatedBy,
      })
      .from(deliveryNotes)
      .leftJoin(customers, eq(deliveryNotes.customerId, customers.id))
      .leftJoin(customerContacts, eq(deliveryNotes.contactId, customerContacts.id))
      .leftJoin(shipToAddresses, eq(deliveryNotes.shipToId, shipToAddresses.id))
      .leftJoin(shipToContacts, eq(deliveryNotes.shipToContactId, shipToContacts.id))
      .orderBy(desc(deliveryNotes.dnDate), desc(deliveryNotes.createdAt));

    const allItems = await db
      .select({
        id: dnItems.id, dnId: dnItems.dnId, yarnId: dnItems.yarnId,
        yarnName: yarns.yarnName, yarnCount: yarns.yarnCount, composition: yarns.composition,
        factoryName: factories.factoryName,
        colorName: dnItems.colorName, colorCode: dnItems.colorCode,
        quantity: dnItems.quantity, packages: dnItems.packages,
        packingDetails: dnItems.packingDetails,
        grossWeight: dnItems.grossWeight, netWeight: dnItems.netWeight,
        lotNo: dnItems.lotNo, notes: dnItems.notes,
      })
      .from(dnItems)
      .leftJoin(yarns, eq(dnItems.yarnId, yarns.id))
      .leftJoin(factories, eq(yarns.factoryId, factories.id));

    const itemMap: Record<number, typeof allItems> = {};
    for (const item of allItems) {
      if (item.dnId) {
        if (!itemMap[item.dnId]) itemMap[item.dnId] = [];
        itemMap[item.dnId].push(item);
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
    console.error("DN GET error:", err);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, soId, soNo, customerPoNo, customerId, contactId, shipToId, shipToContactId, orderCategory, quantityUnit, dnDate, shippingMethod, trackingNo, totalPackages, totalGrossWeight, totalNetWeight, status, notes, items, userId } = body;

    if (!customerId || !dnDate) {
      return NextResponse.json({ error: "Customer and date required" }, { status: 400 });
    }

    if (id) {
      await db.update(deliveryNotes).set({
        soId: soId || null, soNo: soNo || null, customerPoNo: customerPoNo || null, customerId,
        contactId: contactId || null, shipToId: shipToId || null,
        shipToContactId: shipToContactId || null, orderCategory: orderCategory || "Bulk", quantityUnit: quantityUnit || "KGS",
        dnDate, shippingMethod: shippingMethod || null, trackingNo: trackingNo || null,
        totalPackages: totalPackages || null, totalGrossWeight: totalGrossWeight || null,
        totalNetWeight: totalNetWeight || null, status: status || "Draft",
        notes: notes || null, updatedAt: new Date(), updatedBy: userId || null,
      }).where(eq(deliveryNotes.id, id));

      await db.delete(dnItems).where(eq(dnItems.dnId, id));
      if (items?.length) {
        for (const item of items) {
          if (!item.yarnId) continue;
            await db.insert(dnItems).values({
            dnId: id, yarnId: item.yarnId, colorName: item.colorName || null,
            colorCode: item.colorCode || null, quantity: item.quantity || null,
            packages: item.packages || null, packingDetails: item.packingDetails || null, grossWeight: item.grossWeight || null,
            netWeight: item.netWeight || null, lotNo: item.lotNo || null, notes: item.notes || null,
          });
        }
      }
      return NextResponse.json({ success: true, id });
    }

    const dnNo = createDnNo();
    const [dn] = await db.insert(deliveryNotes).values({
      dnNo, soId: soId || null, soNo: soNo || null, customerPoNo: customerPoNo || null, customerId,
      contactId: contactId || null, shipToId: shipToId || null,
      shipToContactId: shipToContactId || null, orderCategory: orderCategory || "Bulk", quantityUnit: quantityUnit || "KGS",
      dnDate, shippingMethod: shippingMethod || null, trackingNo: trackingNo || null,
      totalPackages: totalPackages || null, totalGrossWeight: totalGrossWeight || null,
      totalNetWeight: totalNetWeight || null, status: status || "Draft",
      notes: notes || null, createdBy: userId || null, updatedBy: userId || null,
    }).returning();

    if (items?.length && dn) {
      for (const item of items) {
        if (!item.yarnId) continue;
          await db.insert(dnItems).values({
          dnId: dn.id, yarnId: item.yarnId, colorName: item.colorName || null,
          colorCode: item.colorCode || null, quantity: item.quantity || null,
          packages: item.packages || null, packingDetails: item.packingDetails || null, grossWeight: item.grossWeight || null,
          netWeight: item.netWeight || null, lotNo: item.lotNo || null, notes: item.notes || null,
        });
      }
    }
    return NextResponse.json({ success: true, id: dn.id, dnNo });
  } catch (err) {
    console.error("DN POST error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    await db.delete(deliveryNotes).where(eq(deliveryNotes.id, parseInt(id)));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DN DELETE error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
