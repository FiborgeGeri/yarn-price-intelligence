import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { yarns, factories, treatments, prices } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const yarnId = req.nextUrl.searchParams.get("yarnId");
    if (!yarnId) {
      return NextResponse.json({ error: "Missing yarnId" }, { status: 400 });
    }

    const [yarn] = await db
      .select({
        id: yarns.id,
        yarnName: yarns.yarnName,
        factoryId: yarns.factoryId,
        yarnCount: yarns.yarnCount,
        micron: yarns.micron,
        composition: yarns.composition,
        notes: yarns.notes,
        factoryName: factories.factoryName,
        relationship: factories.relationship,
        treatmentName: treatments.name,
      })
      .from(yarns)
      .leftJoin(factories, eq(yarns.factoryId, factories.id))
      .leftJoin(treatments, eq(yarns.treatmentId, treatments.id))
      .where(eq(yarns.id, parseInt(yarnId)))
      .limit(1);

    if (!yarn) {
      return NextResponse.json({ error: "Yarn not found" }, { status: 404 });
    }

    const priceHistory = await db
      .select({
        id: prices.id,
        price: prices.price,
        currency: prices.currency,
        unit: prices.unit,
        weightBasis: prices.weightBasis,
        recordDate: prices.recordDate,
        incoterms: prices.incoterms,
        remarks: prices.remarks,
      })
      .from(prices)
      .where(eq(prices.yarnId, parseInt(yarnId)))
      .orderBy(desc(prices.recordDate), desc(prices.createdAt));

    return NextResponse.json({
      ...yarn,
      priceHistory,
    });
  } catch (err) {
    console.error("Yarn detail GET error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
