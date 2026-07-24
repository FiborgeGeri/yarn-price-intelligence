import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { prices, yarns, factories } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type") || "prices";

  try {
    if (type === "prices") {
      const data = await db
        .select({
          yarnName: yarns.yarnName,
          factoryName: factories.factoryName,
          yarnCount: yarns.yarnCount,
          micron: yarns.micron,
          price: prices.price,
          currency: prices.currency,
          unit: prices.unit,
          recordDate: prices.recordDate,
          incoterms: prices.incoterms,
          remarks: prices.remarks,
        })
        .from(prices)
        .leftJoin(yarns, eq(prices.yarnId, yarns.id))
        .leftJoin(factories, eq(yarns.factoryId, factories.id))
        .orderBy(desc(prices.recordDate));

      const csv = [
        "Yarn Name,Factory,Yarn Count,Micron,Price,Currency,Unit,Date,Incoterms,Remarks",
        ...data.map((r) =>
          [r.yarnName, r.factoryName, r.yarnCount, r.micron, r.price, r.currency, r.unit, r.recordDate, r.incoterms, r.remarks]
            .map((v) => `"${(v || "").toString().replace(/"/g, '""')}"`)
            .join(",")
        ),
      ].join("\n");

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": "attachment; filename=prices.csv",
        },
      });
    }

    if (type === "yarns") {
      const data = await db
        .select({
          yarnName: yarns.yarnName,
          factoryName: factories.factoryName,
          yarnCount: yarns.yarnCount,
          micron: yarns.micron,
          origin: yarns.origin,
          composition: yarns.composition,
        })
        .from(yarns)
        .leftJoin(factories, eq(yarns.factoryId, factories.id))
        .orderBy(yarns.yarnName);

      const csv = [
        "Yarn Name,Factory,Yarn Count,Micron,Origin,Composition",
        ...data.map((r) =>
          [r.yarnName, r.factoryName, r.yarnCount, r.micron, r.origin, r.composition]
            .map((v) => `"${(v || "").toString().replace(/"/g, '""')}"`)
            .join(",")
        ),
      ].join("\n");

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": "attachment; filename=yarns.csv",
        },
      });
    }

    return NextResponse.json({ error: "Unknown type" }, { status: 400 });
  } catch (err) {
    console.error("Export error:", err);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
