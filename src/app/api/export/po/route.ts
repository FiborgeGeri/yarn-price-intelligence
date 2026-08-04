import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { purchaseOrders, poItems, factories, customers, yarns, treatments } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import * as XLSX from "xlsx";

export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing PO id" }, { status: 400 });

    const [po] = await db
      .select({
        id: purchaseOrders.id,
        poNo: purchaseOrders.poNo,
        factoryName: factories.factoryName,
        customerName: customers.name,
        quoteNo: purchaseOrders.quoteNo,
        currency: purchaseOrders.currency,
        unit: purchaseOrders.unit,
        poDate: purchaseOrders.poDate,
        deliveryDate: purchaseOrders.deliveryDate,
        incoterms: purchaseOrders.incoterms,
        status: purchaseOrders.status,
        notes: purchaseOrders.notes,
      })
      .from(purchaseOrders)
      .leftJoin(factories, eq(purchaseOrders.factoryId, factories.id))
      .leftJoin(customers, eq(purchaseOrders.customerId, customers.id))
      .where(eq(purchaseOrders.id, parseInt(id)))
      .limit(1);

    if (!po) return NextResponse.json({ error: "PO not found" }, { status: 404 });

    const items = await db
      .select({
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
      .leftJoin(treatments, eq(yarns.treatmentId, treatments.id))
      .where(eq(poItems.poId, parseInt(id)));

    const wb = XLSX.utils.book_new();

    const rows = items.map((r, i) => ({
      "No.": i + 1,
      "Yarn": r.yarnName || "",
      "Count": r.yarnCount || "",
      "Micron": r.micron ? parseFloat(r.micron).toFixed(1) + "μm" : "",
      "Composition": r.composition || "",
      "Treatment": r.treatmentName || "Untreated",
      "Color": r.color || "",
      "Quantity": r.quantity || "",
      "Unit Price": r.unitPrice,
      "Currency": po.currency || "USD",
      "Unit": po.unit || "per KG",
      "Notes": r.notes || "",
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, "Purchase Order");

    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    const filename = `${po.poNo || "PO"}-${(po.factoryName || "").replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, "_")}.xlsx`;

    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("PO export error:", err);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
