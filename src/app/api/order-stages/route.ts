import { NextResponse } from "next/server";
import { db } from "@/db";
import { soItems, poItems } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderType, itemId, stage, stageNote } = body;

    if (!itemId) {
      return NextResponse.json({ error: "Missing itemId" }, { status: 400 });
    }

    if (orderType === "so") {
      await db
        .update(soItems)
        .set({
          stage: stage || "Order Confirmed",
          stageNote: stageNote || "", // 🆕 直接寫入資料庫對應欄位
        })
        .where(eq(soItems.id, Number(itemId)));
    } else if (orderType === "po") {
      await db
        .update(poItems)
        .set({
          stage: stage || "Order Confirmed",
          stageNote: stageNote || "", // 🆕 直接寫入資料庫對應欄位
        })
        .where(eq(poItems.id, Number(itemId)));
    } else {
      return NextResponse.json({ error: "Invalid orderType" }, { status: 400 });
    }

    return NextResponse.json({ success: true, stage });
  } catch (error: any) {
    console.error("Error updating order stage:", error);
    return NextResponse.json(
      { error: error?.message || "Internal database error" },
      { status: 500 }
    );
  }
}