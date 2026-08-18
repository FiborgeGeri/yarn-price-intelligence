import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { treatments, yarns } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET() {
  try {
    const allTreatments = await db.select().from(treatments).orderBy(treatments.name);

    const yarnCounts = await db
      .select({
        treatmentId: yarns.treatmentId,
        count: sql<number>`count(*)::int`,
      })
      .from(yarns)
      .groupBy(yarns.treatmentId);

    const countMap: Record<number, number> = {};
    for (const yc of yarnCounts) {
      if (yc.treatmentId) countMap[yc.treatmentId] = yc.count;
    }

    const result = allTreatments.map(t => ({
      ...t,
      yarnCount: countMap[t.id] || 0,
      yarns: [],
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error("Treatments GET error:", err);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, userId } = body;

    if (id) {
      await db.update(treatments).set({ name, updatedAt: new Date(), updatedBy: userId || null }).where(eq(treatments.id, id));
      return NextResponse.json({ success: true, id });
    } else {
      const [t] = await db.insert(treatments).values({ name, createdBy: userId || null, updatedBy: userId || null }).returning();
      return NextResponse.json({ success: true, id: t.id });
    }
  } catch (err) {
    console.error("Treatments POST error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    await db.delete(treatments).where(eq(treatments.id, parseInt(id)));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Treatments DELETE error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
