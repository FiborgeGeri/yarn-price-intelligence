import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { prices, yarns, factories, treatments } from "@/db/schema";
import { eq, sql, desc } from "drizzle-orm";
import * as XLSX from "xlsx";

const recordDateDesc = sql`
  case
    when ${prices.recordDate} ~ '^\\d{4}-\\d{2}-\\d{2}$' then to_date(${prices.recordDate}, 'YYYY-MM-DD')
    when ${prices.recordDate} ~ '^\\d{2}/\\d{2}/\\d{4}$' then to_date(${prices.recordDate}, 'DD/MM/YYYY')
    else null
  end desc
`;

function parseDate(d: string): Date | null {
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return new Date(d + "T00:00:00Z");
  const m = d.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return new Date(`${m[3]}-${m[2]}-${m[1]}T00:00:00Z`);
  return null;
}

function isoWeek(dt: Date): string {
  const d = new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

interface Row {
  yarnName: string; factoryName: string; yarnCount: string; micron: string;
  treatment: string; price: number; currency: string; unit: string;
  recordDate: string; incoterms: string; remarks: string; relationship: string;
}

export async function GET(req: NextRequest) {
  try {
    const allPrices = await db
      .select({
        yarnName: yarns.yarnName,
        factoryName: factories.factoryName,
        yarnCount: yarns.yarnCount,
        micron: yarns.micron,
        treatment: treatments.name,
        price: prices.price,
        currency: prices.currency,
        unit: prices.unit,
        recordDate: prices.recordDate,
        incoterms: prices.incoterms,
        remarks: prices.remarks,
        relationship: factories.relationship,
      })
      .from(prices)
      .leftJoin(yarns, eq(prices.yarnId, yarns.id))
      .leftJoin(factories, eq(yarns.factoryId, factories.id))
      .leftJoin(treatments, eq(yarns.treatmentId, treatments.id))
      .orderBy(recordDateDesc);

    const rows: Row[] = allPrices.map((p) => ({
      yarnName: p.yarnName || "",
      factoryName: p.factoryName || "",
      yarnCount: p.yarnCount || "",
      micron: p.micron || "",
      treatment: p.treatment || "Untreated",
      price: p.price,
      currency: p.currency || "USD",
      unit: p.unit || "per KG",
      recordDate: p.recordDate,
      incoterms: p.incoterms || "",
      remarks: p.remarks || "",
      relationship: p.relationship || "",
    }));

    const wb = XLSX.utils.book_new();

    // ── Sheet 1: All Price Records ──
    const allData = rows.map((r) => ({
      "Yarn Name": r.yarnName,
      "Factory": r.factoryName,
      "Type": r.relationship,
      "Yarn Count": r.yarnCount,
      "Micron": r.micron,
      "Treatment": r.treatment,
      "Price": r.price,
      "Currency": r.currency,
      "Unit": r.unit,
      "Date": r.recordDate,
      "Incoterms": r.incoterms,
      "Remarks": r.remarks,
    }));
    const ws1 = XLSX.utils.json_to_sheet(allData);
    XLSX.utils.book_append_sheet(wb, ws1, "All Prices");

    // ── Sheet 2: Week-over-Week Analysis ──
    const weekMap: Record<string, Record<string, { price: number; count: number }>> = {};
    for (const r of rows) {
      const dt = parseDate(r.recordDate);
      if (!dt) continue;
      const week = isoWeek(dt);
      const key = `${r.yarnName} | ${r.factoryName} | ${r.yarnCount} | ${r.treatment}`;
      if (!weekMap[key]) weekMap[key] = {};
      if (!weekMap[key][week]) weekMap[key][week] = { price: 0, count: 0 };
      weekMap[key][week].price += r.price;
      weekMap[key][week].count += 1;
    }

    const allWeeks = [...new Set(Object.values(weekMap).flatMap((w) => Object.keys(w)))].sort();
    const wowRows: Record<string, string | number>[] = [];
    for (const [key, weeks] of Object.entries(weekMap)) {
      const [yarnName, factoryName, yarnCount, treatment] = key.split(" | ");
      const row: Record<string, string | number> = { "Yarn Name": yarnName, "Factory": factoryName, "Count": yarnCount, "Treatment": treatment };
      let prevAvg: number | null = null;
      for (const week of allWeeks) {
        const avg = weeks[week] ? weeks[week].price / weeks[week].count : null;
        row[week] = avg != null ? Math.round(avg * 100) / 100 : "";
        if (avg != null && prevAvg != null) {
          const change = avg - prevAvg;
          row[week + " Chg"] = Math.round(change * 100) / 100;
          row[week + " %"] = prevAvg ? Math.round((change / prevAvg) * 10000) / 100 : "";
        }
        if (avg != null) prevAvg = avg;
      }
      wowRows.push(row);
    }
    if (wowRows.length > 0) {
      const ws2 = XLSX.utils.json_to_sheet(wowRows);
      XLSX.utils.book_append_sheet(wb, ws2, "Week-over-Week");
    }

    // ── Sheet 3: Year-over-Year Analysis ──
    const yearMap: Record<string, Record<string, { price: number; count: number }>> = {};
    for (const r of rows) {
      const dt = parseDate(r.recordDate);
      if (!dt) continue;
      const year = String(dt.getUTCFullYear());
      const key = `${r.yarnName} | ${r.factoryName} | ${r.yarnCount} | ${r.treatment}`;
      if (!yearMap[key]) yearMap[key] = {};
      if (!yearMap[key][year]) yearMap[key][year] = { price: 0, count: 0 };
      yearMap[key][year].price += r.price;
      yearMap[key][year].count += 1;
    }

    const allYears = [...new Set(Object.values(yearMap).flatMap((y) => Object.keys(y)))].sort();
    const yoyRows: Record<string, string | number>[] = [];
    for (const [key, years] of Object.entries(yearMap)) {
      const [yarnName, factoryName, yarnCount, treatment] = key.split(" | ");
      const row: Record<string, string | number> = { "Yarn Name": yarnName, "Factory": factoryName, "Count": yarnCount, "Treatment": treatment };
      let prevAvg: number | null = null;
      for (const year of allYears) {
        const avg = years[year] ? years[year].price / years[year].count : null;
        row[year + " Avg"] = avg != null ? Math.round(avg * 100) / 100 : "";
        if (avg != null && prevAvg != null) {
          const change = avg - prevAvg;
          row[year + " Chg"] = Math.round(change * 100) / 100;
          row[year + " %"] = prevAvg ? Math.round((change / prevAvg) * 10000) / 100 : "";
        }
        if (avg != null) prevAvg = avg;
      }
      yoyRows.push(row);
    }
    if (yoyRows.length > 0) {
      const ws3 = XLSX.utils.json_to_sheet(yoyRows);
      XLSX.utils.book_append_sheet(wb, ws3, "Year-over-Year");
    }

    // ── Sheet 4: Latest Price per Yarn ──
    const latestMap: Record<string, Row> = {};
    for (const r of rows) {
      const key = `${r.yarnName}|${r.factoryName}|${r.yarnCount}|${r.treatment}`;
      if (!latestMap[key]) latestMap[key] = r;
    }
    const latestRows = Object.values(latestMap).map((r) => ({
      "Yarn Name": r.yarnName,
      "Factory": r.factoryName,
      "Type": r.relationship,
      "Yarn Count": r.yarnCount,
      "Micron": r.micron,
      "Treatment": r.treatment,
      "Latest Price": r.price,
      "Currency": r.currency,
      "Unit": r.unit,
      "Date": r.recordDate,
    }));
    const ws4 = XLSX.utils.json_to_sheet(latestRows);
    XLSX.utils.book_append_sheet(wb, ws4, "Latest Prices");

    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename=yarn-price-report-${new Date().toISOString().split("T")[0]}.xlsx`,
      },
    });
  } catch (err) {
    console.error("Report export error:", err);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
