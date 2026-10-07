import { NextResponse } from "next/server";
import { db } from "@/db";
import { soItems, poItems, salesOrders, purchaseOrders } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

const STAGE_ORDER = [
  "On Hold", "Order Confirmed", "Lab Dipping", "Lab Dip Confirmed",
  "Dyeing", "Lot Confirmed", "Packing", "Ready to Ship", "Ex Mill",
];

// Status → 最低 Stage 門檻
const STATUS_MIN_STAGE: Record<string, string> = {
  "Draft": "On Hold",
  "Confirmed": "Order Confirmed",
  "In Production": "Lab Dipping",
  "Shipped": "Ready to Ship",
  "Delivered": "Ex Mill",
  "Received": "Ex Mill",
  "Closed": "Ex Mill",
  "Cancelled": "On Hold",
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderType, orderId, itemId, stage, stageNote, bulkStatus } = body;

    // 🆕 批量同步模式：Status 改變時，自動推升所有落後的 Stage
    if (bulkStatus && orderId) {
      const minStage = STATUS_MIN_STAGE[bulkStatus];
      if (!minStage) {
        return NextResponse.json({ error: "Unknown status" }, { status: 400 });
      }

      const minIdx = STAGE_ORDER.indexOf(minStage);
      const table = orderType === "so" ? soItems : poItems;
      const fkCol = orderType === "so" ? soItems.soId : poItems.poId;

      // 撈取該訂單下所有 items
      const items = await db
        .select({ id: table.id, stage: table.stage })
        .from(table)
        .where(eq(fkCol, Number(orderId)));

      let updatedCount = 0;
      for (const item of items) {
        const currentIdx = STAGE_ORDER.indexOf(item.stage || "Order Confirmed");
        // 只推升落後的，不往回拉已經超前的
        if (currentIdx < minIdx) {
          await db
            .update(table)
            .set({ stage: minStage })
            .where(eq(table.id, item.id));
          updatedCount++;
        }
      }

      return NextResponse.json({ success: true, updatedCount, minStage });
    }

    // 單一品項更新模式
    if (!itemId) {
      return NextResponse.json({ error: "Missing itemId" }, { status: 400 });
    }

    const updateData: Record<string, any> = {};
    if (stage !== undefined) updateData.stage = stage || "Order Confirmed";
    if (stageNote !== undefined) updateData.stageNote = stageNote;

    if (orderType === "so") {
      const [currentItem] = await db
        .select()
        .from(soItems)
        .where(eq(soItems.id, Number(itemId)))
        .limit(1);

      await db
        .update(soItems)
        .set(updateData)
        .where(eq(soItems.id, Number(itemId)));

      // SO → PO 精準同步
      if (currentItem && orderId && stage !== undefined) {
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
              const matchingPoItems = await db
                .select()
                .from(poItems)
                .where(eq(poItems.poId, po.id));

              for (const poItem of matchingPoItems) {
                if (
                  poItem.yarnId === currentItem.yarnId &&
                  (poItem.colorName || "") === (currentItem.colorName || "") &&
                  (poItem.colorCode || "") === (currentItem.colorCode || "")
                ) {
                  await db
                    .update(poItems)
                    .set(updateData)
                    .where(eq(poItems.id, poItem.id));
                }
              }
            }
          }
        } catch (syncErr) {
          console.error("SO→PO sync warning:", syncErr);
        }
      }
    } else if (orderType === "po") {
      const [currentItem] = await db
        .select()
        .from(poItems)
        .where(eq(poItems.id, Number(itemId)))
        .limit(1);

      await db
        .update(poItems)
        .set(updateData)
        .where(eq(poItems.id, Number(itemId)));

      // PO → SO 反向同步
      if (currentItem && orderId && stage !== undefined) {
        try {
          const [po] = await db
            .select({ soNo: purchaseOrders.soNo })
            .from(purchaseOrders)
            .where(eq(purchaseOrders.id, Number(orderId)))
            .limit(1);

          if (po?.soNo) {
            const [relatedSO] = await db
              .select({ id: salesOrders.id })
              .from(salesOrders)
              .where(eq(salesOrders.soNo, po.soNo))
              .limit(1);

            if (relatedSO) {
              const matchingSoItems = await db
                .select()
                .from(soItems)
                .where(eq(soItems.soId, relatedSO.id));

              for (const soItem of matchingSoItems) {
                if (
                  soItem.yarnId === currentItem.yarnId &&
                  (soItem.colorName || "") === (currentItem.colorName || "") &&
                  (soItem.colorCode || "") === (currentItem.colorCode || "")
                ) {
                  await db
                    .update(soItems)
                    .set(updateData)
                    .where(eq(soItems.id, soItem.id));
                }
              }
            }
          }
        } catch (syncErr) {
          console.error("PO→SO sync warning:", syncErr);
        }
      }
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
