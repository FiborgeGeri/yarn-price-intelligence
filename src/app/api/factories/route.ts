import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { factories, yarns, factoryCertificates, factoryContacts, certificates, bankAccounts } from "@/db/schema";
import { and, eq, sql, inArray } from "drizzle-orm";
import { getUserMap } from "@/lib/auditHelpers";

export async function GET() {
  try {
    const allFactories = await db.select().from(factories).orderBy(factories.factoryName);

    const yarnCounts = await db
      .select({ factoryId: yarns.factoryId, count: sql<number>`count(*)::int` })
      .from(yarns)
      .groupBy(yarns.factoryId);

    const countMap: Record<number, number> = {};
    for (const yc of yarnCounts) {
      if (yc.factoryId) countMap[yc.factoryId] = yc.count;
    }

    const factoryIds = allFactories.map((f) => f.id);

    const certMap: Record<number, number[]> = {};
    if (factoryIds.length > 0) {
      const fCerts = await db
        .select()
        .from(factoryCertificates)
        .where(inArray(factoryCertificates.factoryId, factoryIds));

      for (const fc of fCerts) {
        if (fc.factoryId) {
          if (!certMap[fc.factoryId]) certMap[fc.factoryId] = [];
          certMap[fc.factoryId].push(fc.certificateId!);
        }
      }
    }

    const allCerts = await db.select().from(certificates);
    const certNameMap: Record<number, string> = {};
    for (const c of allCerts) certNameMap[c.id] = c.certCode;

    const contactMap: Record<number, number> = {};
    if (factoryIds.length > 0) {
      const contactCounts = await db
        .select({
          factoryId: factoryContacts.factoryId,
          count: sql<number>`count(*)::int`,
        })
        .from(factoryContacts)
        .groupBy(factoryContacts.factoryId);

      for (const cc of contactCounts) {
        if (cc.factoryId) contactMap[cc.factoryId] = cc.count;
      }
    }

    const userMap = await getUserMap();
    const result = allFactories.map((f) => ({
      ...f,
      yarnCount: countMap[f.id] || 0,
      certIds: certMap[f.id] || [],
      certNames: (certMap[f.id] || []).map((cid) => certNameMap[cid] || "").filter(Boolean),
      contactCount: contactMap[f.id] || 0,
      createdByName: f.createdBy ? userMap[f.createdBy] || null : null,
      updatedByName: f.updatedBy ? userMap[f.updatedBy] || null : null,
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error("Factories GET error:", err);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id,
      factoryName,
      officialName,
      addressLocal,
      addressEnglish,
      country,
      telephone,
      notes,
      relationship,
      parentFactoryId,
      status,
      certIds,
      userId,
    } = body;

    if (id) {
      await db.update(factories).set({
        factoryName,
        officialName: officialName || null,
        addressLocal: addressLocal || null,
        addressEnglish: addressEnglish || null,
        country: country || null,
        telephone: telephone || null,
        notes: notes || null,
        relationship: relationship || "My Factory",
        parentFactoryId: parentFactoryId || null,
        status: status || "Active",
        updatedAt: new Date(),
        updatedBy: userId || null,
      }).where(eq(factories.id, id));

      await db.delete(factoryCertificates).where(eq(factoryCertificates.factoryId, id));
      if (certIds?.length) {
        await db.insert(factoryCertificates).values(
          certIds.map((cid: number) => ({
            factoryId: id,
            certificateId: cid,
          }))
        );
      }
      return NextResponse.json({ success: true, id });
    } else {
      const [f] = await db.insert(factories).values({
        factoryName,
        officialName: officialName || null,
        addressLocal: addressLocal || null,
        addressEnglish: addressEnglish || null,
        country: country || null,
        telephone: telephone || null,
        notes: notes || null,
        relationship: relationship || "My Factory",
        parentFactoryId: parentFactoryId || null,
        status: status || "Active",
        createdBy: userId || null,
        updatedBy: userId || null,
      }).returning();

      if (certIds?.length && f) {
        await db.insert(factoryCertificates).values(
          certIds.map((cid: number) => ({
            factoryId: f.id,
            certificateId: cid,
          }))
        );
      }
      return NextResponse.json({ success: true, id: f.id });
    }
  } catch (err) {
    console.error("Factories POST error:", err);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    await db.delete(factories).where(eq(factories.id, parseInt(id)));
    await db.delete(bankAccounts).where(and(eq(bankAccounts.entityType, "factory"), eq(bankAccounts.entityId, parseInt(id))));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Factories DELETE error:", err);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
