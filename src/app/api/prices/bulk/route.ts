import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { prices } from "@/db/schema";

export async function POST(req: NextRequest) {
  try {
    const { rows, userId } = await req.json();
    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "No rows" }, { status: 400 });
    }

    let inserted = 0;
    for (const row of rows) {
      if (!row.yarnId || !row.price || !row.recordDate) continue;
      await db.insert(prices).values({
        yarnId: row.yarnId,
        price: parseFloat(row.price),
        currency: row.currency || "USD",
        unit: row.unit || "per KG",
        weightBasis: row.weightBasis || "condition",
        recordDate: row.recordDate,
        incoterms: row.incoterms || null,
        remarks: row.remarks || null,
        createdBy: userId || null,
        updatedBy: userId || null,
      });
      inserted++;
    }

    return NextResponse.json({ success: true, inserted });
  } catch (err) {
    console.error("Prices bulk error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
