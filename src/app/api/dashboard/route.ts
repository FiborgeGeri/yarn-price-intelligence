import { NextResponse } from "next/server";
import { db } from "@/db";
import { factories, yarns, prices, treatments, customers, quotations, salesOrders, soItems, purchaseOrders, poItems, goodsReceipts, deliveryNotes, shipToAddresses, invoices, supplierInvoices } from "@/db/schema";
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

    const now = new Date();
    const weekStr = new Date(now.getTime() - 7 * 86400000).toISOString().split("T")[0];
    const twoWeekStr = new Date(now.getTime() - 14 * 86400000).toISOString().split("T")[0];
    const pricesThisWeek = allPrices.filter(p => p.recordDate >= weekStr).length;
    const pricesLastWeek = allPrices.filter(p => p.recordDate >= twoWeekStr && p.recordDate < weekStr).length;

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

    const recentPrices = allPrices.slice(0, 15);

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

    const in30 = new Date(now.getTime() + 30 * 86400000).toISOString().split("T")[0];
    const upcomingDeliveries = allSOs
      .filter(s => s.deliveryDate && s.deliveryDate >= todayStr && s.deliveryDate <= in30 && s.status !== "Cancelled" && s.status !== "Delivered")
      .slice(0, 8)
      .map(s => ({ id: s.id, soNo: s.soNo, deliveryDate: s.deliveryDate, status: s.status }));

    const dayDiff = (a: string, b: string) => Math.round((new Date(a).getTime() - new Date(b).getTime()) / 86400000);
    const overdueDeliveries = allSOs
      .filter(s => s.deliveryDate && s.deliveryDate < todayStr && s.status !== "Cancelled" && s.status !== "Delivered")
      .slice(0, 8)
      .map(s => ({ id: s.id, soNo: s.soNo, deliveryDate: s.deliveryDate, status: s.status, daysOverdue: dayDiff(todayStr, s.deliveryDate as string) }));

    const d14 = new Date(now.getTime() - 14 * 86400000).toISOString().split("T")[0];
    const newOrders = allSOs
      .filter(s => s.soDate && s.soDate >= d14)
      .slice(0, 8)
      .map(s => ({ id: s.id, soNo: s.soNo, soDate: s.soDate, status: s.status }));

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

    // ======================================================================
    // 🆕 NEW SECTION 1: 本月營收統計 (Monthly Revenue)
    // ======================================================================
    const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split("T")[0];
    const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split("T")[0];

    const allInvoices = await db.select({
      invoiceDate: invoices.invoiceDate,
      total: invoices.total,
      currency: invoices.currency,
      status: invoices.status,
    }).from(invoices);

    const allSupplierInv = await db.select({
      invoiceDate: supplierInvoices.invoiceDate,
      total: supplierInvoices.total,
      currency: supplierInvoices.currency,
      status: supplierInvoices.status,
    }).from(supplierInvoices);

    const revByCurrency = (rows: typeof allInvoices, from: string, to: string) => {
      const map: Record<string, number> = {};
      for (const r of rows) {
        if (!r.invoiceDate || !r.total) continue;
        if (r.invoiceDate < from || r.invoiceDate > to) continue;
        if (r.status === "Cancelled" || r.status === "Draft") continue;
        const c = r.currency || "USD";
        map[c] = (map[c] || 0) + (r.total || 0);
      }
      return map;
    };

    const revenueThisMonth = revByCurrency(allInvoices, firstDayThisMonth, todayStr);
    const revenueLastMonth = revByCurrency(allInvoices, firstDayLastMonth, lastDayLastMonth);
    const costThisMonth = revByCurrency(allSupplierInv, firstDayThisMonth, todayStr);

    // ======================================================================
    // 🆕 NEW SECTION 2: SO/PO 狀態分佈
    // ======================================================================
    const buildStatusDist = (rows: { status: string | null }[]) => {
      const dist: Record<string, number> = {};
      for (const r of rows) {
        const s = r.status || "Unknown";
        dist[s] = (dist[s] || 0) + 1;
      }
      return dist;
    };
    const soStatusDist = buildStatusDist(allSOs);
    const poStatusDist = buildStatusDist(allPOs);

    // ======================================================================
    // 🆕 NEW SECTION 3: Stage 分佈 + 瓶頸偵測 (核心業務指標)
    // ======================================================================
    const STAGE_ORDER = ["Order Confirmed", "Lab Dip Confirmed", "Dyeing", "Lot Confirmed", "Packing", "Ready to Ship", "Ex Mill"];

    // 只統計進行中 (開啟中) 的 SO/PO 的品項 stage
    const openSoIds = allSOs.filter(s => ["Confirmed", "In Production"].includes(s.status || "")).map(s => s.id);
    const openPoIds = allPOs.filter(p => ["Draft", "Confirmed", "In Production"].includes(p.status || "")).map(p => p.id);

    const stageDist: Record<string, number> = {};
    STAGE_ORDER.forEach(s => stageDist[s] = 0);

    if (openSoIds.length > 0) {
      const soItemStages = await db
        .select({ stage: soItems.stage })
        .from(soItems)
        .where(sql`${soItems.soId} IN (${sql.join(openSoIds.map(id => sql`${id}`), sql`, `)})`);
      for (const r of soItemStages) {
        const s = r.stage || "Order Confirmed";
        if (stageDist[s] !== undefined) stageDist[s]++;
      }
    }

    if (openPoIds.length > 0) {
      const poItemStages = await db
        .select({ stage: poItems.stage })
        .from(poItems)
        .where(sql`${poItems.poId} IN (${sql.join(openPoIds.map(id => sql`${id}`), sql`, `)})`);
      for (const r of poItemStages) {
        const s = r.stage || "Order Confirmed";
        if (stageDist[s] !== undefined) stageDist[s]++;
      }
    }

    // 偵測瓶頸 (最大堆積的 Stage)
    const stageEntries = Object.entries(stageDist);
    const stageTotal = stageEntries.reduce((sum, [, c]) => sum + c, 0);
    const bottleneckStage = stageEntries.reduce((max, cur) => cur[1] > max[1] ? cur : max, ["", 0])[0];

    // ======================================================================
    // 🆕 NEW SECTION 4: Top 5 紗線價格趨勢 (近 12 週)
    // ======================================================================
    const twelveWeeksAgo = new Date(now.getTime() - 84 * 86400000).toISOString().split("T")[0];
    const topYarnTrends: Array<{ yarnId: number; yarnName: string; factoryName: string; currency: string; priceHistory: Array<{ date: string; price: number }>; firstPrice: number; latestPrice: number; changePct: number }> = [];

    for (const [yid, yprices] of Object.entries(pricesByYarn)) {
      const recentPrices = yprices.filter(p => p.recordDate >= twelveWeeksAgo);
      if (recentPrices.length < 2) continue;

      // 以同一 currency + unit 做比較
      const bySpec: Record<string, typeof yprices> = {};
      for (const p of recentPrices) {
        const key = `${p.currency || "USD"}|${p.unit || "per KG"}`;
        if (!bySpec[key]) bySpec[key] = [];
        bySpec[key].push(p);
      }

      // 挑選紀錄最多的規格
      const topSpec = Object.values(bySpec).sort((a, b) => b.length - a.length)[0];
      if (!topSpec || topSpec.length < 2) continue;

      const sorted = [...topSpec].sort((a, b) => a.recordDate.localeCompare(b.recordDate));
      const firstPrice = sorted[0].price;
      const latestPrice = sorted[sorted.length - 1].price;
      const changePct = firstPrice ? ((latestPrice - firstPrice) / firstPrice) * 100 : 0;

      topYarnTrends.push({
        yarnId: Number(yid),
        yarnName: topSpec[0].yarnName || "",
        factoryName: topSpec[0].factoryName || "",
        currency: topSpec[0].currency || "USD",
        priceHistory: sorted.map(p => ({ date: p.recordDate, price: p.price })),
        firstPrice,
        latestPrice,
        changePct,
      });
    }
    // 選出變動最大的 Top 5
    topYarnTrends.sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct));
    const top5Trends = topYarnTrends.slice(0, 5);

    // ======================================================================

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
      // 🆕 新增 4 大區塊
      revenue: {
        thisMonth: revenueThisMonth,
        lastMonth: revenueLastMonth,
        thisMonthCost: costThisMonth,
      },
      statusDistribution: {
        so: soStatusDist,
        po: poStatusDist,
      },
      stageBoard: {
        distribution: stageDist,
        total: stageTotal,
        bottleneck: bottleneckStage,
        stageOrder: STAGE_ORDER,
      },
      topYarnTrends: top5Trends,
      // 保留原有
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
