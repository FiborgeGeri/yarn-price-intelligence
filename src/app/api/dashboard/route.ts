import { NextResponse } from "next/server";
import { db } from "@/db";
import { factories, yarns, prices, treatments, customers, quotations, salesOrders, purchaseOrders, goodsReceipts, deliveryNotes, shipToAddresses } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";

export async function GET() {
  try {
    const allFactories = await db.select().from(factories);
    const myFactories = allFactories.filter(f => f.relationship === "My Factory");
    const compFactories = allFactories.filter(f => f.relationship === "Competitor Factory");
    const myFactoryIds = myFactories.map(f => f.id);
    const compFactoryIds = compFactories.map(f => f.id);

    const allYarns = await db
      .select({
        id: yarns.id,
        yarnName: yarns.yarnName,
        factoryId: yarns.factoryId,
        yarnCount: yarns.yarnCount,
        micron: yarns.micron,
        treatmentName: treatments.name,
      })
      .from(yarns)
      .leftJoin(treatments, eq(yarns.treatmentId, treatments.id));

    const myYarns = allYarns.filter(y => y.factoryId && myFactoryIds.includes(y.factoryId));
    const compYarns = allYarns.filter(y => y.factoryId && compFactoryIds.includes(y.factoryId));
    const competitorCountries = [...new Set(compFactories.map(f => f.country).filter(Boolean))].length;
    const superGrades = [...new Set(allYarns.filter(y => y.micron && parseFloat(y.micron) <= 18.5).map(y => y.micron))].length;

    // All prices with details, ordered newest first
    const allPrices = await db
      .select({
        id: prices.id,
        price: prices.price,
        currency: prices.currency,
        unit: prices.unit,
        recordDate: prices.recordDate,
        incoterms: prices.incoterms,
        remarks: prices.remarks,
        yarnId: prices.yarnId,
        yarnName: yarns.yarnName,
        yarnCount: yarns.yarnCount,
        micron: yarns.micron,
        factoryId: yarns.factoryId,
        factoryName: factories.factoryName,
        relationship: factories.relationship,
      })
      .from(prices)
      .leftJoin(yarns, eq(prices.yarnId, yarns.id))
      .leftJoin(factories, eq(yarns.factoryId, factories.id))
      .orderBy(desc(prices.recordDate), desc(prices.createdAt));

    // Prices this week / last week
    const now = new Date();
    const weekStr = new Date(now.getTime() - 7 * 86400000).toISOString().split("T")[0];
    const twoWeekStr = new Date(now.getTime() - 14 * 86400000).toISOString().split("T")[0];
    const pricesThisWeek = allPrices.filter(p => p.recordDate >= weekStr).length;
    const pricesLastWeek = allPrices.filter(p => p.recordDate >= twoWeekStr && p.recordDate < weekStr).length;

    // --- Price movers: compare latest vs previous for same yarn + currency + unit + incoterms ---
    // Group by yarnId + currency + unit + incoterms so we only compare like-for-like
    const pricesByYarn: Record<number, typeof allPrices> = {};
    for (const p of allPrices) {
      if (!p.yarnId) continue;
      if (!pricesByYarn[p.yarnId]) pricesByYarn[p.yarnId] = [];
      pricesByYarn[p.yarnId].push(p);
    }

    interface Mover {
      yarnId: number;
      yarnName: string;
      factoryName: string;
      relationship: string;
      yarnCount: string;
      micron: string;
      latestPrice: number;
      prevPrice: number;
      currency: string;
      unit: string;
      incoterms: string;
      change: number;
      pctChange: number;
      date: string;
      prevDate: string;
    }

    const movers: Mover[] = [];
    for (const [yid, yprices] of Object.entries(pricesByYarn)) {
      // Sub-group by currency + unit + incoterms
      const subGroups: Record<string, typeof allPrices> = {};
      for (const p of yprices) {
        const key = `${p.currency || "USD"}|${p.unit || "per KG"}|${p.incoterms || ""}`;
        if (!subGroups[key]) subGroups[key] = [];
        subGroups[key].push(p);
      }

      for (const prices of Object.values(subGroups)) {
        if (prices.length < 2) continue;
        const latest = prices[0];
        const prev = prices[1];
        // Skip if same date (multiple entries on same day aren't "movement")
        if (latest.recordDate === prev.recordDate) continue;
        const change = latest.price - prev.price;
        if (Math.abs(change) < 0.005) continue;
        const pctChange = prev.price ? (change / prev.price) * 100 : 0;
        movers.push({
          yarnId: Number(yid),
          yarnName: latest.yarnName || "",
          factoryName: latest.factoryName || "",
          relationship: latest.relationship || "",
          yarnCount: latest.yarnCount || "",
          micron: latest.micron || "",
          latestPrice: latest.price,
          prevPrice: prev.price,
          currency: latest.currency || "USD",
          unit: latest.unit || "per KG",
          incoterms: latest.incoterms || "",
          change,
          pctChange,
          date: latest.recordDate,
          prevDate: prev.recordDate,
        });
      }
    }
    movers.sort((a, b) => Math.abs(b.pctChange) - Math.abs(a.pctChange));

    // --- Yarns without any price (need attention) ---
    const yarnIdsWithPrices = new Set(Object.keys(pricesByYarn).map(Number));
    const yarnsNoPriceList = allYarns
      .filter(y => !yarnIdsWithPrices.has(y.id))
      .map(y => {
        const fac = allFactories.find(f => f.id === y.factoryId);
        return {
          yarnId: y.id,
          yarnName: y.yarnName,
          factoryName: fac?.factoryName || "",
          relationship: fac?.relationship || "",
          yarnCount: y.yarnCount || "",
          micron: y.micron || "",
        };
      });

    // --- Stale prices: yarns whose latest price is >30 days old ---
    const staleThreshold = new Date(now.getTime() - 30 * 86400000).toISOString().split("T")[0];
    const stalePrices = Object.values(pricesByYarn)
      .filter(yp => yp[0].recordDate < staleThreshold)
      .map(yp => {
        const p = yp[0];
        return {
          yarnId: p.yarnId,
          yarnName: p.yarnName || "",
          factoryName: p.factoryName || "",
          relationship: p.relationship || "",
          lastDate: p.recordDate,
          lastPrice: p.price,
          currency: p.currency || "USD",
          unit: p.unit || "per KG",
        };
      });

    // Recent prices (top 15)
    const recentPrices = allPrices.slice(0, 15);

    // --- Business documents counts ---
    const cnt = async (tbl: Parameters<typeof db.select>[0] extends never ? never : never) => 0;
    void cnt;
    const [custCount] = await db.select({ c: sql<number>`count(*)::int` }).from(customers);
    const [shipToCount] = await db.select({ c: sql<number>`count(*)::int` }).from(shipToAddresses);
    const allQuotes = await db.select({ id: quotations.id, quoteNo: quotations.quoteNo, status: quotations.status, validUntil: quotations.validUntil }).from(quotations);
    const uniqueQuoteNos = new Set(allQuotes.map(q => q.quoteNo || `L-${q.id}`)).size;
    const todayStr = now.toISOString().split("T")[0];
    const expiringQuotes = allQuotes.filter(q => q.validUntil && q.validUntil >= todayStr && q.validUntil <= new Date(now.getTime() + 14 * 86400000).toISOString().split("T")[0]).length;

    const allSOs = await db.select({ id: salesOrders.id, status: salesOrders.status, deliveryDate: salesOrders.deliveryDate, soNo: salesOrders.soNo, customerId: salesOrders.customerId, soDate: salesOrders.soDate }).from(salesOrders).orderBy(desc(salesOrders.soDate));
    const allPOs = await db.select({ id: purchaseOrders.id, status: purchaseOrders.status, poNo: purchaseOrders.poNo, poDate: purchaseOrders.poDate }).from(purchaseOrders).orderBy(desc(purchaseOrders.poDate));
    const allGRs = await db.select({ id: goodsReceipts.id, status: goodsReceipts.status, grNo: goodsReceipts.grNo, grDate: goodsReceipts.grDate }).from(goodsReceipts).orderBy(desc(goodsReceipts.grDate));
    const allDNs = await db.select({ id: deliveryNotes.id, status: deliveryNotes.status, dnNo: deliveryNotes.dnNo, dnDate: deliveryNotes.dnDate }).from(deliveryNotes).orderBy(desc(deliveryNotes.dnDate));

    const countBy = (rows: { status: string | null }[], list: string[]) => rows.filter(r => list.includes(r.status || "")).length;

    const soOpen = countBy(allSOs, ["Confirmed", "In Production"]);
    const poOpen = countBy(allPOs, ["Draft", "Confirmed"]);
    const grInTransit = countBy(allGRs, ["Shipped from Mill", "In Transit", "Arrived at Port", "Customs Clearance"]);
    const dnPending = countBy(allDNs, ["Draft", "Packed", "Shipped"]);

    // Upcoming deliveries in next 30 days
    const in30 = new Date(now.getTime() + 30 * 86400000).toISOString().split("T")[0];
    const upcomingDeliveries = allSOs
      .filter(s => s.deliveryDate && s.deliveryDate >= todayStr && s.deliveryDate <= in30 && s.status !== "Cancelled" && s.status !== "Delivered")
      .slice(0, 8)
      .map(s => ({ id: s.id, soNo: s.soNo, deliveryDate: s.deliveryDate, status: s.status }));

    // Overdue deliveries with day count
    const dayDiff = (a: string, b: string) => Math.round((new Date(a).getTime() - new Date(b).getTime()) / 86400000);
    const overdueDeliveries = allSOs
      .filter(s => s.deliveryDate && s.deliveryDate < todayStr && s.status !== "Cancelled" && s.status !== "Delivered")
      .slice(0, 8)
      .map(s => ({ id: s.id, soNo: s.soNo, deliveryDate: s.deliveryDate, status: s.status, daysOverdue: dayDiff(todayStr, s.deliveryDate as string) }));

    // Newly created sales orders (last 14 days by soDate)
    const d14 = new Date(now.getTime() - 14 * 86400000).toISOString().split("T")[0];
    const newOrders = allSOs
      .filter(s => s.soDate && s.soDate >= d14)
      .slice(0, 8)
      .map(s => ({ id: s.id, soNo: s.soNo, soDate: s.soDate, status: s.status }));

    // Newly added yarns (last 30 days)
    const d30 = new Date(now.getTime() - 30 * 86400000);
    const yarnRows = await db
      .select({ id: yarns.id, yarnName: yarns.yarnName, yarnCount: yarns.yarnCount, createdAt: yarns.createdAt, factoryName: factories.factoryName, relationship: factories.relationship })
      .from(yarns)
      .leftJoin(factories, eq(yarns.factoryId, factories.id))
      .orderBy(desc(yarns.createdAt));
    const newYarns = yarnRows
      .filter(y => y.createdAt && new Date(y.createdAt) >= d30)
      .slice(0, 8)
      .map(y => ({ id: y.id, yarnName: y.yarnName, yarnCount: y.yarnCount || "", factoryName: y.factoryName || "", relationship: y.relationship || "" }));
    const newYarnCount = yarnRows.filter(y => y.createdAt && new Date(y.createdAt) >= d30).length;

    return NextResponse.json({
      kpi: {
        myFactories: myFactories.length,
        competitorFactories: compFactories.length,
        totalYarns: allYarns.length,
        pricesThisWeek,
        pricesTrend: pricesThisWeek - pricesLastWeek,
        myYarnCount: myYarns.length,
        compYarnCount: compYarns.length,
        competitorCountries,
        superGradesCount: superGrades,
        totalPriceRecords: allPrices.length,
        yarnsWithPrices: yarnIdsWithPrices.size,
        yarnsWithoutPrices: yarnsNoPriceList.length,
        stalePriceCount: stalePrices.length,
        customers: custCount?.c || 0,
        shipToAddresses: shipToCount?.c || 0,
        quotations: uniqueQuoteNos,
        expiringQuotes,
        salesOrders: allSOs.length,
        salesOrdersOpen: soOpen,
        purchaseOrders: allPOs.length,
        purchaseOrdersOpen: poOpen,
        goodsReceipts: allGRs.length,
        goodsReceiptsInTransit: grInTransit,
        deliveryNotes: allDNs.length,
        deliveryNotesPending: dnPending,
        overdueCount: overdueDeliveries.length,
        newYarnCount,
        newOrderCount: newOrders.length,
      },
      movers: movers.slice(0, 10),
      yarnsNoPrice: yarnsNoPriceList.slice(0, 8),
      stalePrices: stalePrices.slice(0, 8),
      recentPrices,
      upcomingDeliveries,
      overdueDeliveries,
      newOrders,
      newYarns,
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
