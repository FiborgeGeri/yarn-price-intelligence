import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { goodsReceipts, grItems, factories, yarns, shipToAddresses, shipToContacts, deliveryNotes, dnItems, purchaseOrders, salesOrders } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getUserMap } from "@/lib/auditHelpers";

function createGrNo() {
  const d = new Date();
  return `GR-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function createDnNo() {
  const d = new Date();
  return `DN-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export async function GET() {
  try {
    const orders = await db
      .select({
        id: goodsReceipts.id, grNo: goodsReceipts.grNo,
        poId: goodsReceipts.poId, poNo: goodsReceipts.poNo,
        factoryId: goodsReceipts.factoryId, factoryName: factories.factoryName,
        shipToId: goodsReceipts.shipToId, shipToName: shipToAddresses.name,
        shipToContactName: shipToContacts.contactName,
        quantityUnit: goodsReceipts.quantityUnit,
        grDate: goodsReceipts.grDate, 
        shippingMethod: goodsReceipts.shippingMethod,
        trackingNo: goodsReceipts.trackingNo,
        totalPackages: goodsReceipts.totalPackages,
        totalGrossWeight: goodsReceipts.totalGrossWeight,
        totalNetWeight: goodsReceipts.totalNetWeight,
        status: goodsReceipts.status,
        notes: goodsReceipts.notes, createdAt: goodsReceipts.createdAt,
        createdBy: goodsReceipts.createdBy, updatedBy: goodsReceipts.updatedBy,
      })
      .from(goodsReceipts)
      .leftJoin(factories, eq(goodsReceipts.factoryId, factories.id))
      .leftJoin(shipToAddresses, eq(goodsReceipts.shipToId, shipToAddresses.id))
      .leftJoin(shipToContacts, eq(goodsReceipts.shipToContactId, shipToContacts.id))
      .orderBy(desc(goodsReceipts.grDate), desc(goodsReceipts.createdAt));

    const allItems = await db
      .select({
        id: grItems.id, grId: grItems.grId, yarnId: grItems.yarnId,
        yarnName: yarns.yarnName, yarnCount: yarns.yarnCount, composition: yarns.composition,
        colorName: grItems.colorName, colorCode: grItems.colorCode,
        quantityOrdered: grItems.quantityOrdered, quantityReceived: grItems.quantityReceived,
        packages: grItems.packages, packingDetails: grItems.packingDetails, grossWeight: grItems.grossWeight, netWeight: grItems.netWeight,
        lotNo: grItems.lotNo, inspectionResult: grItems.inspectionResult, notes: grItems.notes,
      })
      .from(grItems)
      .leftJoin(yarns, eq(grItems.yarnId, yarns.id));

    const itemMap: Record<number, typeof allItems> = {};
    for (const item of allItems) {
      if (item.grId) {
        if (!itemMap[item.grId]) itemMap[item.grId] = [];
        itemMap[item.grId].push(item);
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
    console.error("GR GET error:", err);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, poId, poNo, factoryId, shipToId, shipToContactId, quantityUnit, grDate, shippingMethod, trackingNo, totalPackages, totalGrossWeight, totalNetWeight, status, notes, items, autoCreateDN, soNo, customerId, customerPoNo, orderCategory, userId } = body;

    if (!factoryId || !grDate) {
      return NextResponse.json({ error: "Yarn mill and date required" }, { status: 400 });
    }

    if (id) {
      await db.update(goodsReceipts).set({
        poId: poId || null, poNo: poNo || null, factoryId,
        shipToId: shipToId || null,
        shipToContactId: shipToContactId || null,
        quantityUnit: quantityUnit || "KGS",
        grDate, shippingMethod: shippingMethod || null, trackingNo: trackingNo || null,
        totalPackages: totalPackages || null,
        totalGrossWeight: totalGrossWeight || null, totalNetWeight: totalNetWeight || null,
        status: status || "Shipped from Mill",
        notes: notes || null, updatedAt: new Date(), updatedBy: userId || null,
      }).where(eq(goodsReceipts.id, id));

      // Sync linked DN — update header + items + status
      const linkedDNs = await db.select({ id: deliveryNotes.id }).from(deliveryNotes).where(eq(deliveryNotes.grId, id));
      const dnStatusMap: Record<string, string> = {
        "Shipped from Mill": "Packed", "In Transit": "Shipped", "Arrived at Port": "Shipped",
        "Customs Clearance": "Shipped", "Delivered": "Delivered", "Completed": "Delivered",
      };
      for (const dn of linkedDNs) {
        await db.update(deliveryNotes).set({
          shipToId: shipToId || null,
          shippingMethod: shippingMethod || null,
          trackingNo: trackingNo || null,
          ...(dnStatusMap[status] ? { status: dnStatusMap[status] } : {}),
          updatedAt: new Date(), updatedBy: userId || null,
        }).where(eq(deliveryNotes.id, dn.id));

        // Update DN items from GR items
        if (items?.length) {
          await db.delete(dnItems).where(eq(dnItems.dnId, dn.id));
          for (const item of items) {
            if (!item.yarnId) continue;
            await db.insert(dnItems).values({
              dnId: dn.id, yarnId: item.yarnId, colorName: item.colorName || null,
              colorCode: item.colorCode || null, quantity: item.quantityReceived || item.quantityOrdered || null,
              weightBasis: item.weightBasis || "condition",
              packages: item.packages || null, packingDetails: item.packingDetails || null,
              grossWeight: item.grossWeight || null, netWeight: item.netWeight || null,
              lotNo: item.lotNo || null,
            });
          }
        }
      }

      // Sync PO and SO status
      const grRecord = await db.select({ poNo: goodsReceipts.poNo }).from(goodsReceipts).where(eq(goodsReceipts.id, id));
      const grPoNo = grRecord[0]?.poNo;
      if (grPoNo && status) {
        const poStatusMap: Record<string, string> = {
          "Shipped from Mill": "Shipped", "In Transit": "Shipped", "Arrived at Port": "Shipped", "Customs Clearance": "Shipped", "Delivered": "Delivered", "Completed": "Closed",
        };
        const soStatusMap: Record<string, string> = {
          "Shipped from Mill": "Shipped", "In Transit": "Shipped", "Delivered": "Delivered", "Completed": "Delivered",
        };
        if (poStatusMap[status]) {
          await db.update(purchaseOrders).set({ status: poStatusMap[status], updatedAt: new Date() }).where(eq(purchaseOrders.poNo, grPoNo));
        }
        const po = await db.select({ soNo: purchaseOrders.soNo }).from(purchaseOrders).where(eq(purchaseOrders.poNo, grPoNo));
        if (po[0]?.soNo && soStatusMap[status]) {
          await db.update(salesOrders).set({ status: soStatusMap[status], updatedAt: new Date() }).where(eq(salesOrders.soNo, po[0].soNo));
        }
      }

      await db.delete(grItems).where(eq(grItems.grId, id));
      if (items?.length) {
        for (const item of items) {
          if (!item.yarnId) continue;
          await db.insert(grItems).values({
            grId: id, yarnId: item.yarnId, colorName: item.colorName || null,
            colorCode: item.colorCode || null, quantityOrdered: item.quantityOrdered || null,
            quantityReceived: item.quantityReceived || null, packages: item.packages || null,
            packingDetails: item.packingDetails || null,
            grossWeight: item.grossWeight || null, netWeight: item.netWeight || null,
            lotNo: item.lotNo || null, notes: item.notes || null,
          });
        }
      }
      return NextResponse.json({ success: true, id });
    }

    const grNo = createGrNo();
    const [gr] = await db.insert(goodsReceipts).values({
      grNo, poId: poId || null, poNo: poNo || null, factoryId,
      shipToId: shipToId || null,
      shipToContactId: shipToContactId || null,
      quantityUnit: quantityUnit || "KGS",
      grDate, shippingMethod: shippingMethod || null, trackingNo: trackingNo || null,
      totalPackages: totalPackages || null,
      totalGrossWeight: totalGrossWeight || null, totalNetWeight: totalNetWeight || null,
      status: status || "Shipped from Mill",
      notes: notes || null, createdBy: userId || null, updatedBy: userId || null,
    }).returning();

    if (items?.length && gr) {
      for (const item of items) {
        if (!item.yarnId) continue;
        await db.insert(grItems).values({
          grId: gr.id, yarnId: item.yarnId, colorName: item.colorName || null,
          colorCode: item.colorCode || null, quantityOrdered: item.quantityOrdered || null,
          quantityReceived: item.quantityReceived || null, packages: item.packages || null,
          packingDetails: item.packingDetails || null,
          grossWeight: item.grossWeight || null, netWeight: item.netWeight || null,
          lotNo: item.lotNo || null, notes: item.notes || null,
        });
      }
    }

    // Auto-create Delivery Note
    let dnNo: string | null = null;
    if (autoCreateDN && gr && items?.length) {
      dnNo = createDnNo();
      const [dn] = await db.insert(deliveryNotes).values({
        dnNo, grId: gr.id, soNo: soNo || null, customerPoNo: customerPoNo || null, customerId: customerId || null,
        shipToId: shipToId || null, shipToContactId: shipToContactId || null, orderCategory: orderCategory || "Bulk", quantityUnit: quantityUnit || "KGS",
        dnDate: grDate, shippingMethod: shippingMethod || null, trackingNo: trackingNo || null,
        status: "Shipped",
        notes: `Auto-created from ${grNo}`,
        createdBy: userId || null, updatedBy: userId || null,
      }).returning();

      if (dn) {
        for (const item of items) {
          if (!item.yarnId) continue;
          await db.insert(dnItems).values({
            dnId: dn.id, yarnId: item.yarnId, colorName: item.colorName || null,
            colorCode: item.colorCode || null, quantity: item.quantityReceived || item.quantityOrdered || null,
            packages: item.packages || null, packingDetails: item.packingDetails || null, grossWeight: item.grossWeight || null,
            netWeight: item.netWeight || null, lotNo: item.lotNo || null,
          });
        }
      }
    }

    return NextResponse.json({ success: true, id: gr.id, grNo, dnNo });
  } catch (err) {
    console.error("GR POST error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    await db.delete(goodsReceipts).where(eq(goodsReceipts.id, parseInt(id)));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("GR DELETE error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
