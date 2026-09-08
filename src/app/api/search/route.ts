import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { yarns, factories, certificates, prices } from "@/db/schema";
import { sql, eq, or } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get("q")?.trim();
    if (!q) {
      return NextResponse.json([]);
    }

    const pattern = `%${q}%`;

    const results = await db
      .select({
        id: yarns.id,
        yarnName: yarns.yarnName,
        yarnCount: yarns.yarnCount,
        micron: yarns.micron,
        factoryName: factories.factoryName,
        relationship: factories.relationship,
      })
      .from(yarns)
      .leftJoin(factories, eq(yarns.factoryId, factories.id))
      .where(
        or(
          sql`${yarns.yarnName} ILIKE ${pattern}`,
          sql`${yarns.yarnCount} ILIKE ${pattern}`,
          sql`${yarns.micron} ILIKE ${pattern}`,
          sql`${factories.factoryName} ILIKE ${pattern}`
        )
      )
      .limit(50);

    return NextResponse.json(results);
  } catch (err) {
    console.error("Search error:", err);
    return NextResponse.json([], { status: 500 });
  }
}
