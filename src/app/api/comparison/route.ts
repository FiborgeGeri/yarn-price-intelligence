import { NextResponse } from "next/server";
import { db } from "@/db";
import { prices, yarns, factories, treatments } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const allPrices = await db
      .select({
        yarnId: prices.yarnId,
        price: prices.price,
        currency: prices.currency,
        unit: prices.unit,
        recordDate: prices.recordDate,
        yarnName: yarns.yarnName,
        yarnCount: yarns.yarnCount,
        micron: yarns.micron,
        factoryId: yarns.factoryId,
        factoryName: factories.factoryName,
        relationship: factories.relationship,
        treatmentName: treatments.name,
      })
      .from(prices)
      .leftJoin(yarns, eq(prices.yarnId, yarns.id))
      .leftJoin(factories, eq(yarns.factoryId, factories.id))
      .leftJoin(treatments, eq(yarns.treatmentId, treatments.id))
      .orderBy(desc(prices.recordDate));

    // Latest price per yarn
    const latestByYarn: Record<number, (typeof allPrices)[0]> = {};
    for (const p of allPrices) {
      if (p.yarnId && !latestByYarn[p.yarnId]) {
        latestByYarn[p.yarnId] = p;
      }
    }

    const myPrices = Object.values(latestByYarn).filter((p) => p.relationship === "My Factory");
    const compPrices = Object.values(latestByYarn).filter((p) => p.relationship === "Competitor Factory");

    // Build match pairs by micron + yarnCount + treatment
    const matches: Array<{
      micron: string;
      yarnCount: string;
      treatment: string;
      myYarnName: string;
      myFactory: string;
      myPrice: number;
      myCurrency: string;
      myUnit: string;
      myDate: string;
      compYarnName: string;
      compFactory: string;
      compPrice: number;
      compCurrency: string;
      compUnit: string;
      compDate: string;
    }> = [];

    for (const my of myPrices) {
      for (const comp of compPrices) {
        const myTreatment = my.treatmentName || "Untreated";
        const compTreatment = comp.treatmentName || "Untreated";
        if (
          my.micron && comp.micron && my.yarnCount && comp.yarnCount &&
          my.micron === comp.micron && my.yarnCount === comp.yarnCount &&
          myTreatment === compTreatment
        ) {
          matches.push({
            micron: my.micron,
            yarnCount: my.yarnCount,
            treatment: myTreatment,
            myYarnName: my.yarnName || "",
            myFactory: my.factoryName || "",
            myPrice: my.price,
            myCurrency: my.currency || "USD",
            myUnit: my.unit || "per KG",
            myDate: my.recordDate,
            compYarnName: comp.yarnName || "",
            compFactory: comp.factoryName || "",
            compPrice: comp.price,
            compCurrency: comp.currency || "USD",
            compUnit: comp.unit || "per KG",
            compDate: comp.recordDate,
          });
        }
      }
    }

    const mapYarn = (p: (typeof allPrices)[0]) => ({
      yarnName: p.yarnName || "",
      factoryName: p.factoryName || "",
      yarnCount: p.yarnCount || "",
      micron: p.micron || "",
      treatment: p.treatmentName || "Untreated",
      price: p.price,
      currency: p.currency || "USD",
      unit: p.unit || "per KG",
      date: p.recordDate,
    });

    return NextResponse.json({
      matches,
      myYarns: myPrices.map(mapYarn),
      compYarns: compPrices.map(mapYarn),
    });
  } catch (err) {
    console.error("Comparison error:", err);
    return NextResponse.json({ matches: [], myYarns: [], compYarns: [] }, { status: 500 });
  }
}
