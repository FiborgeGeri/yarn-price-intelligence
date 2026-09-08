import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { prices, yarns, factories, treatments } from "@/db/schema";
import { eq, inArray, asc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const yarnIdsParam = req.nextUrl.searchParams.get("yarnIds");
    if (!yarnIdsParam) return NextResponse.json([]);

    const yarnIds = yarnIdsParam.split(",").map(Number).filter(Boolean);
    if (yarnIds.length === 0) return NextResponse.json([]);

    const result = await db
      .select({
        recordDate: prices.recordDate,
        price: prices.price,
        currency: prices.currency,
        unit: prices.unit,
        yarnId: prices.yarnId,
        yarnName: yarns.yarnName,
        yarnCount: yarns.yarnCount,
        micron: yarns.micron,
        factoryName: factories.factoryName,
        relationship: factories.relationship,
        treatmentName: treatments.name,
      })
      .from(prices)
      .leftJoin(yarns, eq(prices.yarnId, yarns.id))
      .leftJoin(factories, eq(yarns.factoryId, factories.id))
      .leftJoin(treatments, eq(yarns.treatmentId, treatments.id))
      .where(inArray(prices.yarnId, yarnIds))
      .orderBy(asc(prices.recordDate));

    return NextResponse.json(result);
  } catch (err) {
    console.error("Trends error:", err);
    return NextResponse.json([], { status: 500 });
  }
}
