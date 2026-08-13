import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { prices, yarns, factories, treatments } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

const priceSelect = {
  id: prices.id,
  yarnId: prices.yarnId,
  price: prices.price,
  currency: prices.currency,
  unit: prices.unit,
  recordDate: prices.recordDate,
  incoterms: prices.incoterms,
  remarks: prices.remarks,
  createdAt: prices.createdAt,
  yarnName: yarns.yarnName,
  yarnCount: yarns.yarnCount,
  micron: yarns.micron,
  factoryId: yarns.factoryId,
  factoryName: factories.factoryName,
  relationship: factories.relationship,
  treatmentName: treatments.name,
};

function baseQuery() {
  return db
    .select(priceSelect)
    .from(prices)
    .leftJoin(yarns, eq(prices.yarnId, yarns.id))
    .leftJoin(factories, eq(yarns.factoryId, factories.id))
    .leftJoin(treatments, eq(yarns.treatmentId, treatments.id));
}

export async function GET(req: NextRequest) {
  try {
    const yarnId = req.nextUrl.searchParams.get("yarnId");

    if (yarnId) {
      const result = await baseQuery()
        .where(eq(prices.yarnId, parseInt(yarnId)))
        .orderBy(desc(prices.recordDate), desc(prices.createdAt));
      return NextResponse.json(result);
    }

    const result = await baseQuery()
      .orderBy(desc(prices.recordDate), desc(prices.createdAt));
    return NextResponse.json(result);
  } catch (err) {
    console.error("Prices GET error:", err);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { yarnId, price, currency, unit, recordDate, incoterms, remarks } = body;

    if (!yarnId || !price || !recordDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const [newPrice] = await db
      .insert(prices)
      .values({
        yarnId,
        price: parseFloat(price),
        currency: currency || "USD",
        unit: unit || "per KG",
        recordDate,
        incoterms: incoterms || null,
        remarks: remarks || null,
      })
      .returning();

    return NextResponse.json({ success: true, id: newPrice.id });
  } catch (err) {
    console.error("Prices POST error:", err);
    return NextResponse.json({ error: "Failed to save price" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, price, currency, unit, recordDate, incoterms, remarks } = body;

    if (!id || !price || !recordDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await db
      .update(prices)
      .set({
        price: parseFloat(price),
        currency: currency || "USD",
        unit: unit || "per KG",
        recordDate,
        incoterms: incoterms || null,
        remarks: remarks || null,
      })
      .where(eq(prices.id, id));

    return NextResponse.json({ success: true, id });
  } catch (err) {
    console.error("Prices PUT error:", err);
    return NextResponse.json({ error: "Failed to update price" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    await db.delete(prices).where(eq(prices.id, parseInt(id)));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Prices DELETE error:", err);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
