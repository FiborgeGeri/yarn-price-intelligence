import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  yarns,
  factories,
  treatments,
  yarnCertificates,
  yarnDyeMethods,
  yarnTypeOptions,
  spinningTypeOptions,
  dyeMethodOptions,
  prices,
} from "@/db/schema";
import { eq, inArray, desc } from "drizzle-orm";
import { getUserMap } from "@/lib/auditHelpers";

const yarnSelect = {
  id: yarns.id,
  yarnName: yarns.yarnName,
  factoryId: yarns.factoryId,
  yarnCount: yarns.yarnCount,
  yarnTypeId: yarns.yarnTypeId,
  spinningTypeId: yarns.spinningTypeId,
  micron: yarns.micron,
  treatmentId: yarns.treatmentId,
  composition: yarns.composition,
  notes: yarns.notes,
  isActive: yarns.isActive,
  createdAt: yarns.createdAt,
  createdBy: yarns.createdBy,
  updatedAt: yarns.updatedAt,
  updatedBy: yarns.updatedBy,
  factoryName: factories.factoryName,
  relationship: factories.relationship,
  treatmentName: treatments.name,
  yarnTypeName: yarnTypeOptions.name,
  spinningTypeName: spinningTypeOptions.name,
};

export async function GET(req: NextRequest) {
  try {
    const idsParam = req.nextUrl.searchParams.get("ids");

    const baseQuery = () =>
      db
        .select(yarnSelect)
        .from(yarns)
        .leftJoin(factories, eq(yarns.factoryId, factories.id))
        .leftJoin(treatments, eq(yarns.treatmentId, treatments.id))
        .leftJoin(yarnTypeOptions, eq(yarns.yarnTypeId, yarnTypeOptions.id))
        .leftJoin(spinningTypeOptions, eq(yarns.spinningTypeId, spinningTypeOptions.id));

    let result: Awaited<ReturnType<typeof baseQuery>>;
    if (idsParam) {
      const ids = idsParam.split(",").map(Number).filter(Boolean);
      if (ids.length > 0) {
        result = await baseQuery()
          .where(inArray(yarns.id, ids))
          .orderBy(yarns.yarnName);
      } else {
        result = [];
      }
    } else {
      result = await baseQuery().orderBy(yarns.yarnName);
    }

    const yarnIds = result.map((y: { id: number }) => y.id);

    const certMap: Record<number, number[]> = {};
    if (yarnIds.length > 0) {
      const certs = await db
        .select()
        .from(yarnCertificates)
        .where(inArray(yarnCertificates.yarnId, yarnIds));

      for (const c of certs) {
        if (c.yarnId) {
          if (!certMap[c.yarnId]) certMap[c.yarnId] = [];
          certMap[c.yarnId].push(c.certificateId!);
        }
      }
    }

    const dyeMap: Record<number, number[]> = {};
    if (yarnIds.length > 0) {
      const dyes = await db
        .select()
        .from(yarnDyeMethods)
        .where(inArray(yarnDyeMethods.yarnId, yarnIds));

      for (const d of dyes) {
        if (d.yarnId) {
          if (!dyeMap[d.yarnId]) dyeMap[d.yarnId] = [];
          dyeMap[d.yarnId].push(d.dyeMethodId!);
        }
      }
    }

    const allDyeMethods = await db.select().from(dyeMethodOptions);
    const dyeNameMap: Record<number, string> = {};
    for (const d of allDyeMethods) dyeNameMap[d.id] = d.name;

    interface TermPrice {
      price: number;
      currency: string;
      unit: string;
      weightBasis: string;
      incoterms: string;
      recordDate: string;
    }

    const allTermPrices: Record<number, TermPrice[]> = {};
    const singlePriceMap: Record<number, { price: number; currency: string | null; unit: string | null; recordDate: string }> = {};

    if (yarnIds.length > 0) {
      const allPrices = await db
        .select({
          yarnId: prices.yarnId,
          price: prices.price,
          currency: prices.currency,
          unit: prices.unit,
          weightBasis: prices.weightBasis,
          incoterms: prices.incoterms,
          recordDate: prices.recordDate,
        })
        .from(prices)
        .where(inArray(prices.yarnId, yarnIds))
        .orderBy(desc(prices.recordDate), desc(prices.createdAt));

      for (const p of allPrices) {
        if (!p.yarnId) continue;

        if (!singlePriceMap[p.yarnId]) {
          singlePriceMap[p.yarnId] = {
            price: p.price,
            currency: p.currency,
            unit: p.unit,
            recordDate: p.recordDate,
          };
        }

        if (!allTermPrices[p.yarnId]) allTermPrices[p.yarnId] = [];
        const key = `${p.currency || "USD"}|${p.unit || "per KG"}|${p.weightBasis || "condition"}|${p.incoterms || ""}`;
        const existing = allTermPrices[p.yarnId].find(
          (tp) => `${tp.currency}|${tp.unit}|${tp.weightBasis}|${tp.incoterms}` === key
        );

        if (!existing) {
          allTermPrices[p.yarnId].push({
            price: p.price,
            currency: p.currency || "USD",
            unit: p.unit || "per KG",
            weightBasis: p.weightBasis || "condition",
            incoterms: p.incoterms || "",
            recordDate: p.recordDate,
          });
        }
      }
    }

    const userMap = await getUserMap();
    const data = result.map((y: { id: number; createdBy?: number | null; updatedBy?: number | null }) => ({
      ...y,
      certIds: certMap[y.id] || [],
      dyeMethodIds: dyeMap[y.id] || [],
      dyeMethodNames: (dyeMap[y.id] || [])
        .map((did: number) => dyeNameMap[did] || "")
        .filter(Boolean),
      latestPrice: singlePriceMap[y.id]?.price ?? null,
      latestCurrency: singlePriceMap[y.id]?.currency ?? null,
      latestUnit: singlePriceMap[y.id]?.unit ?? null,
      latestPriceDate: singlePriceMap[y.id]?.recordDate ?? null,
      latestPrices: allTermPrices[y.id] || [],
      createdByName: y.createdBy ? userMap[y.createdBy] || null : null,
      updatedByName: y.updatedBy ? userMap[y.updatedBy] || null : null,
    }));

    return NextResponse.json(data);
  } catch (err) {
    console.error("Yarns GET error:", err);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id,
      yarnName,
      factoryId,
      yarnCount,
      yarnTypeId,
      spinningTypeId,
      micron,
      treatmentId,
      composition,
      notes,
      certIds,
      dyeMethodIds,
      userId,
    } = body;

    if (id) {
      await db
        .update(yarns)
        .set({
          yarnName,
          factoryId,
          yarnCount,
          yarnTypeId: yarnTypeId || null,
          spinningTypeId: spinningTypeId || null,
          micron,
          treatmentId: treatmentId || null,
          composition,
          notes,
          updatedAt: new Date(),
          updatedBy: userId || null,
        })
        .where(eq(yarns.id, id));

      await db.delete(yarnCertificates).where(eq(yarnCertificates.yarnId, id));
      if (certIds?.length) {
        await db.insert(yarnCertificates).values(
          certIds.map((cid: number) => ({ yarnId: id, certificateId: cid }))
        );
      }

      await db.delete(yarnDyeMethods).where(eq(yarnDyeMethods.yarnId, id));
      if (dyeMethodIds?.length) {
        await db.insert(yarnDyeMethods).values(
          dyeMethodIds.map((did: number) => ({ yarnId: id, dyeMethodId: did }))
        );
      }

      return NextResponse.json({ success: true, id });
    } else {
      const [newYarn] = await db
        .insert(yarns)
        .values({
          yarnName,
          factoryId,
          yarnCount,
          yarnTypeId: yarnTypeId || null,
          spinningTypeId: spinningTypeId || null,
          micron,
          treatmentId: treatmentId || null,
          composition,
          notes,
          createdBy: userId || null,
          updatedBy: userId || null,
        })
        .returning();

      if (certIds?.length && newYarn) {
        await db.insert(yarnCertificates).values(
          certIds.map((cid: number) => ({ yarnId: newYarn.id, certificateId: cid }))
        );
      }

      if (dyeMethodIds?.length && newYarn) {
        await db.insert(yarnDyeMethods).values(
          dyeMethodIds.map((did: number) => ({ yarnId: newYarn.id, dyeMethodId: did }))
        );
      }

      return NextResponse.json({ success: true, id: newYarn.id });
    }
  } catch (err) {
    console.error("Yarns POST error:", err);
    return NextResponse.json({ error: "Failed to save yarn" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    await db.delete(yarns).where(eq(yarns.id, parseInt(id)));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Yarns DELETE error:", err);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
