import { NextResponse } from "next/server";
import { db } from "@/db";
import { soItems, poItems, salesOrders, purchaseOrders } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderType, orderId, itemId, stage, stageNote } = body;

    if (!itemId) {
      return NextResponse.json({ error: "Missing itemId" }, { status: 400 });
    }

    const updateData: Record<string, any> = {};
    if (stage !== undefined) updateData.stage = stage || "Order Confirmed";
    if (stageNote !== undefined) updateData.stageNote = stageNote;

    if (orderType === "so") {
      // 1. 更新 SO 品項的 Stage 與 Note
      await db
        .update(soItems)
        .set(updateData)
        .where(eq(soItems.id, Number(itemId)));

      // 2. SO → PO 自動連動：更新對應 PO 的 Stage
      if (stage !== undefined && orderId) {
        try {
          const [so] = await db
            .select({ soNo: salesOrders.soNo })
            .from(salesOrders)
            .where(eq(salesOrders.id, Number(orderId)))
            .limit(1);

          if (so?.soNo) {
            const relatedPOs = await db
              .select({ id: purchaseOrders.id })
              .from(purchaseOrders)
              .where(eq(purchaseOrders.soNo, so.soNo));

            for (const po of relatedPOs) {
              await db
                .update(poItems)
                .set({ stage: stage || "Order Confirmed" })
                .where(eq(poItems.poId, po.id));
            }
          }
        } catch (syncErr) {
          console.error("SO→PO stage sync warning:", syncErr);
        }
      }
    } else if (orderType === "po") {
      await db
        .update(poItems)
        .set(updateData)
        .where(eq(poItems.id, Number(itemId)));
    } else {
      return NextResponse.json({ error: "Invalid orderType" }, { status: 400 });
    }

    return NextResponse.json({ success: true, stage, stageNote });
  } catch (error: any) {
    console.error("Error updating order stage:", error);
    return NextResponse.json(
      { error: error?.message || "Internal database error" },
      { status: 500 }
    );
  }
}