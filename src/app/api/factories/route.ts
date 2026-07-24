import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { factories, yarns } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET() {
  try {
    const allFactories = await db.select().from(factories).orderBy(factories.factoryName);

    // Count yarns per factory
    const yarnCounts = await db
      .select({
        factoryId: yarns.factoryId,
        count: sql<number>`count(*)::int`,
      })
      .from(yarns)
      .groupBy(yarns.factoryId);

    const countMap: Record<number, number> = {};
    for (const yc of yarnCounts) {
      if (yc.factoryId) countMap[yc.factoryId] = yc.count;
    }

    const result = allFactories.map(f => ({
      ...f,
      yarnCount: countMap[f.id] || 0,
      latestPriceUpdate: null,
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
    const { id, factoryName, country, contactPerson, email, notes, relationship, parentFactoryId, status } = body;

    if (id) {
      await db
        .update(factories)
        .set({
          factoryName,
          country,
          contactPerson: contactPerson || null,
          email: email || null,
          notes: notes || null,
          relationship: relationship || "My Factory",
          parentFactoryId: parentFactoryId || null,
          status: status || "Active",
          updatedAt: new Date(),
        })
        .where(eq(factories.id, id));
      return NextResponse.json({ success: true, id });
    } else {
      const [f] = await db
        .insert(factories)
        .values({
          factoryName,
          country,
          contactPerson: contactPerson || null,
          email: email || null,
          notes: notes || null,
          relationship: relationship || "My Factory",
          parentFactoryId: parentFactoryId || null,
          status: status || "Active",
        })
        .returning();
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
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Factories DELETE error:", err);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
