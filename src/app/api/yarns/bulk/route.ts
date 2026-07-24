import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { yarns } from "@/db/schema";

export async function POST(req: NextRequest) {
  try {
    const { rows } = await req.json();
    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "No rows" }, { status: 400 });
    }

    let inserted = 0;
    for (const row of rows) {
      await db.insert(yarns).values({
        yarnName: row.yarnName,
        factoryId: row.factoryId || null,
        yarnCount: row.yarnCount || null,
        micron: row.micron || null,
        treatmentId: row.treatmentId || null,
        origin: row.origin || null,
        composition: row.composition || null,
        notes: row.notes || null,
      });
      inserted++;
    }

    return NextResponse.json({ success: true, inserted });
  } catch (err) {
    console.error("Yarns bulk POST error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
