import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  quotations,
  customers,
  customerContacts,
  yarns,
  factories,
  treatments,
  spinningTypeOptions,
  yarnDyeMethods,
  dyeMethodOptions,
} from "@/db/schema";
import { desc, eq, inArray } from "drizzle-orm";
import ExcelJS from "exceljs";
import { calculateMoistureRegain } from "@/lib/moistureRegain";

const BLACK = "FF111827";
const MID = "FF475569";
const LIGHT = "FFF1F5F9";
const WHITE = "FFFFFFFF";
const BORDER = "FF94A3B8";

function dateDisplay(value: string | null | undefined) {
  if (!value) return "";
  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return `${Number(iso[2])}/${Number(iso[3])}/${iso[1]}`;
  const dmy = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (dmy) return `${Number(dmy[2])}/${Number(dmy[1])}/${dmy[3]}`;
  return value;
}

function unitLabel(unit: string | null | undefined) {
  const u = (unit || "per KG").replace(/^per\s+/i, "").toUpperCase();
  return u === "KG" ? "KG" : u;
}

function moneyLabel(currency: string | null | undefined, price: number, unit: string | null | undefined, basis: string | null | undefined) {
  const c = (currency || "USD").toUpperCase();
  const currencyLabel = c === "CNY" ? "RMB" : c;
  const basisLabel = basis === "net" ? "NET WT." : "COND. WT.";
  return `${currencyLabel} ${Number(price).toFixed(2)} /${unitLabel(unit)}\n${basisLabel}`;
}

function normaliseDyeMethod(names: string[]) {
  if (!names.length) return "";
  return names
    .map((n) => {
      const lower = n.toLowerCase();
      if (lower.includes("top")) return "TOP DYED";
      if (lower.includes("yarn")) return "YARN DYED";
      return n.toUpperCase();
    })
    .filter((v, i, a) => a.indexOf(v) === i)
    .join(" / ");
}

function borderStyle(): Partial<ExcelJS.Borders> {
  const side: Partial<ExcelJS.Border> = { style: "thin", color: { argb: BORDER } };
  return { top: side, left: side, bottom: side, right: side };
}

function styleRange(ws: ExcelJS.Worksheet, range: string, cb: (cell: ExcelJS.Cell) => void) {
  const [start, end] = range.split(":");
  const a = ws.getCell(start);
  const b = ws.getCell(end || start);
  const startRow = Number(a.row);
  const endRow = Number(b.row);
  const startCol = Number(a.col);
  const endCol = Number(b.col);
  for (let row = startRow; row <= endRow; row++) {
    for (let col = startCol; col <= endCol; col++) cb(ws.getCell(row, col));
  }
}

export async function GET(req: NextRequest) {
  try {
    const quoteNo = req.nextUrl.searchParams.get("quoteNo");
    const ids = req.nextUrl.searchParams.get("ids");
    if (!quoteNo && !ids) return NextResponse.json({ error: "Please specify quoteNo or ids" }, { status: 400 });

    const base = db
      .select({
        id: quotations.id,
        quoteNo: quotations.quoteNo,
        customerName: customers.name,
        customerCompany: customers.officialName,
        contactName: customerContacts.contactName,
        contactEmail: customerContacts.email,
        yarnId: quotations.yarnId,
        yarnName: yarns.yarnName,
        yarnCount: yarns.yarnCount,
        micron: yarns.micron,
        composition: yarns.composition,
        treatmentName: treatments.name,
        spinningTypeName: spinningTypeOptions.name,
        factoryName: factories.factoryName,
        costPrice: quotations.costPrice,
        quotedPrice: quotations.quotedPrice,
        currency: quotations.currency,
        unit: quotations.unit,
        weightBasis: quotations.weightBasis,
        quoteDate: quotations.quoteDate,
        validUntil: quotations.validUntil,
        incoterms: quotations.incoterms,
        status: quotations.status,
        notes: quotations.notes,
        createdAt: quotations.createdAt,
      })
      .from(quotations)
      .leftJoin(customers, eq(quotations.customerId, customers.id))
      .leftJoin(customerContacts, eq(quotations.contactId, customerContacts.id))
      .leftJoin(yarns, eq(quotations.yarnId, yarns.id))
      .leftJoin(factories, eq(yarns.factoryId, factories.id))
      .leftJoin(treatments, eq(yarns.treatmentId, treatments.id))
      .leftJoin(spinningTypeOptions, eq(yarns.spinningTypeId, spinningTypeOptions.id));

    let rows;
    if (quoteNo) {
      if (quoteNo.startsWith("LEGACY-")) {
        rows = await base.where(eq(quotations.id, parseInt(quoteNo.replace("LEGACY-", "")))).orderBy(desc(quotations.createdAt));
      } else {
        rows = await base.where(eq(quotations.quoteNo, quoteNo)).orderBy(desc(quotations.createdAt));
      }
    } else {
      rows = await base.where(inArray(quotations.id, ids!.split(",").map(Number).filter(Boolean))).orderBy(desc(quotations.createdAt));
    }
    if (!rows.length) return NextResponse.json({ error: "No quotations found" }, { status: 404 });

    const yarnIds = [...new Set(rows.map((r) => r.yarnId).filter((id): id is number => Boolean(id)))];
    const dyeRows = yarnIds.length
      ? await db
          .select({ yarnId: yarnDyeMethods.yarnId, name: dyeMethodOptions.name })
          .from(yarnDyeMethods)
          .leftJoin(dyeMethodOptions, eq(yarnDyeMethods.dyeMethodId, dyeMethodOptions.id))
          .where(inArray(yarnDyeMethods.yarnId, yarnIds))
      : [];
    const dyeMap = new Map<number, string[]>();
    for (const r of dyeRows) {
      if (!r.yarnId || !r.name) continue;
      dyeMap.set(r.yarnId, [...(dyeMap.get(r.yarnId) || []), r.name]);
    }

    // One article can have separate CNY and USD quotation lines.
    const articleMap = new Map<number, {
      yarnName: string; quality: string; dyeMethod: string; china: string[]; hk: string[]; notes: string[];
    }>();
    for (const row of rows) {
      const key = row.yarnId || row.id;
      if (!articleMap.has(key)) {
        articleMap.set(key, {
          yarnName: row.yarnName || "",
          quality: [row.yarnCount, row.composition].filter(Boolean).join(" ").toUpperCase(),
          dyeMethod: normaliseDyeMethod(dyeMap.get(row.yarnId || 0) || []),
          china: [],
          hk: [],
          notes: [],
        });
      }
      const article = articleMap.get(key)!;
      const label = moneyLabel(row.currency, row.quotedPrice, row.unit, row.weightBasis);
      const currency = (row.currency || "USD").toUpperCase();
      if (currency === "CNY" || currency === "RMB") article.china.push(label);
      else article.hk.push(label);
      if (row.notes) article.notes.push(row.notes);
    }
    const articles = Array.from(articleMap.values());

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Fiborge Company Limited";
    workbook.company = "FIBORGE COMPANY LIMITED";
    workbook.subject = "Yarn quotation";
    workbook.created = new Date();

    const ws = workbook.addWorksheet("Quotation", {
      pageSetup: {
        paperSize: 9,
        orientation: "portrait",
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        margins: { left: 0.28, right: 0.28, top: 0.28, bottom: 0.45, header: 0.15, footer: 0.2 },
      },
      views: [{ showGridLines: false }],
      properties: { defaultRowHeight: 16 },
    });
    ws.columns = [
      { key: "article", width: 20 },
      { key: "quality", width: 50 },
      { key: "china", width: 19 },
      { key: "hk", width: 19 },
      { key: "dye", width: 17 },
    ];

    // Header: company / quotation identity.
    ws.mergeCells("A1:B1");
    ws.getCell("A1").value = "fiborge";
    ws.getCell("A1").font = { name: "Arial", size: 27, bold: true, color: { argb: BLACK } };
    ws.getCell("A1").alignment = { vertical: "middle", horizontal: "left" };
    ws.getRow(1).height = 34;

    ws.mergeCells("A2:C6");
    ws.getCell("A2").value = "ROOM 1110, 11/F, PENINSULA TOWER, 538\nCASTLE PEAK ROAD, LAI CHI KOK, KLN, HONG KONG\n香港荔枝角青山道538號半島大廈11樓10室\nTEL: 852-27864111   FAX: 852-27864222";
    ws.getCell("A2").font = { name: "Arial", size: 9, color: { argb: MID } };
    ws.getCell("A2").alignment = { vertical: "top", horizontal: "left", wrapText: true };
    for (let r = 2; r <= 6; r++) ws.getRow(r).height = 18;

    ws.mergeCells("D1:E2");
    ws.getCell("D1").value = "Quotation";
    ws.getCell("D1").font = { name: "Arial", size: 34, bold: true, color: { argb: BLACK } };
    ws.getCell("D1").alignment = { horizontal: "right", vertical: "middle" };

    const first = rows[0];
    const info = [
      ["To", first.customerCompany || first.customerName || ""],
      ["Attn", first.contactName || ""],
      ["Date", dateDisplay(first.quoteDate)],
      ["Valid", dateDisplay(first.validUntil)],
    ];
    info.forEach(([label, value], index) => {
      const rowNo = 3 + index;
      ws.getCell(rowNo, 4).value = label;
      ws.getCell(rowNo, 4).font = { name: "Arial", size: 10, bold: true, color: { argb: BLACK } };
      ws.getCell(rowNo, 4).alignment = { horizontal: "right" };
      ws.getCell(rowNo, 5).value = value;
      ws.getCell(rowNo, 5).font = { name: "Arial", size: 10, color: { argb: BLACK } };
      ws.getCell(rowNo, 5).border = { bottom: { style: "thin", color: { argb: BLACK } } };
      ws.getCell(rowNo, 5).alignment = { horizontal: "left" };
    });

    ws.getCell("A7").value = `Quotation No.: ${first.quoteNo || `LEGACY-${first.id}`}`;
    ws.getCell("A7").font = { name: "Arial", size: 9, color: { argb: MID }, italic: true };
    ws.mergeCells("A7:B7");

    // Main table header.
    const headerStart = 9;
    ws.mergeCells(`A${headerStart}:A${headerStart + 1}`);
    ws.mergeCells(`B${headerStart}:B${headerStart + 1}`);
    ws.mergeCells(`C${headerStart}:D${headerStart}`);
    ws.mergeCells(`E${headerStart}:E${headerStart + 1}`);
    ws.getCell(`A${headerStart}`).value = "ARTICLE";
    ws.getCell(`B${headerStart}`).value = "QUALITY";
    ws.getCell(`C${headerStart}`).value = "PRICE";
    ws.getCell(`C${headerStart + 1}`).value = "TO CHINA";
    ws.getCell(`D${headerStart + 1}`).value = "CIF HK";
    ws.getCell(`E${headerStart}`).value = "DYED METHOD";
    styleRange(ws, `A${headerStart}:E${headerStart + 1}`, (cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: LIGHT } };
      cell.font = { name: "Arial", size: 9, bold: true, color: { argb: BLACK } };
      cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      cell.border = borderStyle();
    });
    ws.getRow(headerStart).height = 20;
    ws.getRow(headerStart + 1).height = 18;

    let rowNo = headerStart + 2;
    for (const article of articles) {
      ws.getCell(rowNo, 1).value = article.yarnName;
      ws.getCell(rowNo, 2).value = article.quality;
      ws.getCell(rowNo, 3).value = article.china.join("\n");
      ws.getCell(rowNo, 4).value = article.hk.join("\n");
      ws.getCell(rowNo, 5).value = article.dyeMethod;
      styleRange(ws, `A${rowNo}:E${rowNo}`, (cell) => {
        cell.font = { name: "Arial", size: 8.5, color: { argb: BLACK } };
        const columnNumber = Number(cell.col);
        cell.alignment = { horizontal: columnNumber === 3 || columnNumber === 4 ? "center" : "left", vertical: "middle", wrapText: true };
        cell.border = borderStyle();
      });
      ws.getRow(rowNo).height = 34;
      rowNo++;
    }

    // Remarks.
    rowNo += 1;
    ws.mergeCells(`A${rowNo}:E${rowNo}`);
    ws.getCell(rowNo, 1).value = "REMARK:";
    ws.getCell(rowNo, 1).font = { name: "Arial", size: 10, bold: true, color: { argb: BLACK } };
    ws.getCell(rowNo, 1).border = { bottom: { style: "thin", color: { argb: BLACK } } };
    rowNo++;

    const basisSet = new Set(rows.map((r) => r.weightBasis === "net" ? "Net Weight" : "Conditioned Weight"));
    const basisText = basisSet.size === 1
      ? `All prices are quoted on a ${Array.from(basisSet)[0]} basis${basisSet.has("Conditioned Weight") ? " (at standard moisture regain)" : ""}.`
      : "Prices use the weight basis shown in each price cell (COND. WT. or NET WT.).";

    const remarks = [
      ["1. Minimum Order Quantities & Surcharge", "MOQ/Color: Top-dyed = 500kg; Yarn-dyed = 300kg.\nMOQ/Order: 1,000kg for China; 2,000kg for international destinations.\nSurcharges: Orders below standard MOQ incur a surcharge. As surcharges vary by quality and fiber blend, please contact our sales representative for details."],
      ["2. Customization & Certification", "Available options: Man Made Fiber: Virgin/Recycled (GRS); Cotton: BCI/Organic Cotton; Wool: RWS and other wool/organic certificates.\nNote: Certified materials must be specified at inquiry stage and may affect pricing."],
      ["3. Transaction Certificates (TC)", "TC Fees: Free of charge for orders ≥ 1,000kg per certificate.\nSmall Order Service Fee: RMB 500 (or USD 70) per certificate for orders < 1,000kg."],
      ["4. Invoicing Weight Basis", basisText],
      ["5. Lead Times", "Sample Production: 10–14 days (Ex-Mill).\nBulk Production: 30–35 days (Ex-Mill).\nNote: Lead times are for reference and may be extended for specialty treatments, complex dyeing, or certified materials. Final timing is confirmed upon order placement."],
    ];

    for (const [title, body] of remarks) {
      ws.mergeCells(`A${rowNo}:E${rowNo}`);
      ws.getCell(rowNo, 1).value = title;
      ws.getCell(rowNo, 1).font = { name: "Arial", size: 9, bold: true, color: { argb: BLACK } };
      ws.getCell(rowNo, 1).alignment = { vertical: "top", horizontal: "left" };
      ws.getRow(rowNo).height = 16;
      rowNo++;
      ws.mergeCells(`A${rowNo}:E${rowNo}`);
      ws.getCell(rowNo, 1).value = body;
      ws.getCell(rowNo, 1).font = { name: "Arial", size: 8.5, color: { argb: MID } };
      ws.getCell(rowNo, 1).alignment = { vertical: "top", horizontal: "left", wrapText: true, indent: 1 };
      ws.getRow(rowNo).height = Math.max(30, body.split("\n").length * 16);
      rowNo += 2;
    }

    // Footer.
    ws.mergeCells(`A${rowNo}:E${rowNo}`);
    ws.getCell(rowNo, 1).value = "◉  FIBORGE COMPANY LIMITED";
    ws.getCell(rowNo, 1).font = { name: "Arial", size: 10, bold: true, color: { argb: BLACK } };
    ws.getCell(rowNo, 1).alignment = { horizontal: "center", vertical: "middle" };
    rowNo++;
    ws.mergeCells(`A${rowNo}:E${rowNo}`);
    ws.getCell(rowNo, 1).value = "富維企業有限公司";
    ws.getCell(rowNo, 1).font = { name: "Microsoft JhengHei", size: 10, bold: true, color: { argb: BLACK } };
    ws.getCell(rowNo, 1).alignment = { horizontal: "center", vertical: "middle" };
    ws.pageSetup.printArea = `A1:E${rowNo}`;
    ws.headerFooter.oddFooter = "&CPage &P of &N";

    // Internal costing sheet retains confidential costs and moisture regain details.
    const internal = workbook.addWorksheet("Internal", { views: [{ state: "frozen", ySplit: 1 }] });
    internal.columns = [
      { header: "Quotation No.", key: "quoteNo", width: 24 },
      { header: "Article", key: "article", width: 22 },
      { header: "Quality", key: "quality", width: 48 },
      { header: "Factory", key: "factory", width: 24 },
      { header: "Cost", key: "cost", width: 14 },
      { header: "Quoted", key: "quoted", width: 14 },
      { header: "Margin", key: "margin", width: 14 },
      { header: "Margin %", key: "marginPct", width: 12 },
      { header: "Currency", key: "currency", width: 10 },
      { header: "Unit", key: "unit", width: 12 },
      { header: "Weight Basis", key: "basis", width: 18 },
      { header: "Moisture Regain %", key: "regain", width: 20 },
      { header: "Incoterms", key: "incoterms", width: 20 },
    ];
    for (const r of rows) {
      const margin = r.quotedPrice - r.costPrice;
      const regain = r.weightBasis !== "net" && r.composition ? calculateMoistureRegain(r.composition, r.spinningTypeName || "") : null;
      internal.addRow({
        quoteNo: r.quoteNo || `LEGACY-${r.id}`,
        article: r.yarnName || "",
        quality: [r.yarnCount, r.composition].filter(Boolean).join(" "),
        factory: r.factoryName || "",
        cost: r.costPrice,
        quoted: r.quotedPrice,
        margin,
        marginPct: r.costPrice ? margin / r.costPrice : 0,
        currency: r.currency || "USD",
        unit: r.unit || "per KG",
        basis: r.weightBasis === "net" ? "Net Weight" : "Condition Weight",
        regain: regain && !regain.hasUnknown ? regain.blendedRegain : "",
        incoterms: r.incoterms || "",
      });
    }
    internal.getRow(1).eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BLACK } };
      cell.font = { name: "Arial", size: 9, bold: true, color: { argb: WHITE } };
      cell.alignment = { vertical: "middle", horizontal: "center" };
    });
    internal.getColumn("cost").numFmt = "0.00";
    internal.getColumn("quoted").numFmt = "0.00";
    internal.getColumn("margin").numFmt = "0.00";
    internal.getColumn("marginPct").numFmt = "0.0%";
    internal.getColumn("regain").numFmt = "0.00";

    const displayNo = first.quoteNo || `LEGACY-${first.id}`;
    const customerName = first.customerName || "quotation";
    const filename = `${displayNo}-${customerName.replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, "_")}.xlsx`;
    const output = await workbook.xlsx.writeBuffer();

    return new NextResponse(Buffer.from(output), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("Quotation export error:", err);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
