import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { yarns, factories, treatments, yarnCertificates, certificates, prices } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const yarnId = req.nextUrl.searchParams.get("id");
    if (!yarnId) {
      return NextResponse.json({ error: "Missing yarn id" }, { status: 400 });
    }

    const id = parseInt(yarnId);

    // Get yarn details
    const [yarn] = await db
      .select({
        id: yarns.id,
        yarnName: yarns.yarnName,
        factoryId: yarns.factoryId,
        yarnCount: yarns.yarnCount,
        micron: yarns.micron,
        origin: yarns.origin,
        composition: yarns.composition,
        notes: yarns.notes,
        factoryName: factories.factoryName,
        relationship: factories.relationship,
        treatmentName: treatments.name,
      })
      .from(yarns)
      .leftJoin(factories, eq(yarns.factoryId, factories.id))
      .leftJoin(treatments, eq(yarns.treatmentId, treatments.id))
      .where(eq(yarns.id, id))
      .limit(1);

    if (!yarn) {
      return NextResponse.json({ error: "Yarn not found" }, { status: 404 });
    }

    // Get certificates
    const certs = await db
      .select({
        certCode: certificates.certCode,
        certFullName: certificates.certFullName,
      })
      .from(yarnCertificates)
      .leftJoin(certificates, eq(yarnCertificates.certificateId, certificates.id))
      .where(eq(yarnCertificates.yarnId, id));

    // Get price history
    const priceHistory = await db
      .select()
      .from(prices)
      .where(eq(prices.yarnId, id))
      .orderBy(asc(prices.recordDate));

    return NextResponse.json({ yarn, certificates: certs, priceHistory });
  } catch (err) {
    console.error("Yarn detail error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
