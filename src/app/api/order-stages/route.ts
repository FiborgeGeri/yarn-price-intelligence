import { NextResponse } from "next/server";
import { db } from "@/db";
import { soItems, poItems, salesOrders, purchaseOrders } from "@/db/schema";
import { eq, and } from "drizzle-orm";

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
      // 1. 取得 SO item 完整資訊（用於匹配 PO item）
      const [currentItem] = await db
        .select()
        .from(soItems)
        .where(eq(soItems.id, Number(itemId)))
        .limit(1);

      // 2. 更新 SO item
      await db
        .update(soItems)
        .set(updateData)
        .where(eq(soItems.id, Number(itemId)));

      // 3. SO → PO 精準同步：按 yarnId + colorName + colorCode 匹配
      if (currentItem && orderId) {
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
              // 找到該 PO 下，與 SO item 相同 yarn + 相同顏色的 po item
              const matchingPoItems = await db
                .select()
                .from(poItems)
                .where(eq(poItems.poId, po.id));

              for (const poItem of matchingPoItems) {
                // 精準匹配條件：yarn + color name + color code
                const sameYarn = poItem.yarnId === currentItem.yarnId;
                const sameColorName = (poItem.colorName || "") === (currentItem.colorName || "");
                const sameColorCode = (poItem.colorCode || "") === (currentItem.colorCode || "");

                if (sameYarn && sameColorName && sameColorCode) {
                  await db
                    .update(poItems)
                    .set(updateData)
                    .where(eq(poItems.id, poItem.id));
                }
              }
            }
          }
        } catch (syncErr) {
          console.error("SO→PO stage sync warning:", syncErr);
        }
      }
    } else if (orderType === "po") {
      // PO 更新時，也可以反向同步回 SO（可選）
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
      if (currentItem && orderId) {
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
                const sameYarn = soItem.yarnId === currentItem.yarnId;
                const sameColorName = (soItem.colorName || "") === (currentItem.colorName || "");
                const sameColorCode = (soItem.colorCode || "") === (currentItem.colorCode || "");

                if (sameYarn && sameColorName && sameColorCode) {
                  await db
                    .update(soItems)
                    .set(updateData)
                    .where(eq(soItems.id, soItem.id));
                }
              }
            }
          }
        } catch (syncErr) {
          console.error("PO→SO stage sync warning:", syncErr);
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
