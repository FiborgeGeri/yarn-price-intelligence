import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { quotations, customers, yarns, factories, treatments, spinningTypeOptions } from "@/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import * as XLSX from "xlsx";
import { calculateMoistureRegain } from "@/lib/moistureRegain";

export async function GET(req: NextRequest) {
  try {
    const quoteNo = req.nextUrl.searchParams.get("quoteNo");
    const ids = req.nextUrl.searchParams.get("ids");

    if (!quoteNo && !ids) {
      return NextResponse.json({ error: "Please specify quoteNo or ids" }, { status: 400 });
    }

    const base = db
      .select({
        id: quotations.id,
        quoteNo: quotations.quoteNo,
        customerName: customers.name,
        customerCompany: customers.officialName,
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
      })
      .from(quotations)
      .leftJoin(customers, eq(quotations.customerId, customers.id))
      .leftJoin(yarns, eq(quotations.yarnId, yarns.id))
      .leftJoin(factories, eq(yarns.factoryId, factories.id))
      .leftJoin(treatments, eq(yarns.treatmentId, treatments.id))
      .leftJoin(spinningTypeOptions, eq(yarns.spinningTypeId, spinningTypeOptions.id));

    let rows;
    if (quoteNo) {
      if (quoteNo.startsWith("LEGACY-")) {
        const legacyId = parseInt(quoteNo.replace("LEGACY-", ""));
        rows = await base.where(eq(quotations.id, legacyId)).orderBy(desc(quotations.createdAt));
      } else {
        rows = await base.where(eq(quotations.quoteNo, quoteNo)).orderBy(desc(quotations.createdAt));
      }
    } else {
      const idList = ids!.split(",").map(Number).filter(Boolean);
      rows = await base.where(inArray(quotations.id, idList)).orderBy(desc(quotations.createdAt));
    }

    if (rows.length === 0) {
      return NextResponse.json({ error: "No quotations found" }, { status: 404 });
    }

    const wb = XLSX.utils.book_new();

    const clientRows = rows.map((r, i) => {
      const regain =
        r.weightBasis !== "net" && r.composition
          ? calculateMoistureRegain(r.composition, r.spinningTypeName || "")
          : null;

      return {
        "Quotation No.": r.quoteNo || `LEGACY-${r.id}`,
        "No.": i + 1,
        "Yarn": r.yarnName || "",
        "Count": r.yarnCount || "",
        "Micron": r.micron ? parseFloat(r.micron).toFixed(1) + "μm" : "",
        "Composition / Quality": r.composition || "",
        "Treatment": r.treatmentName || "Untreated",
        "Price": r.quotedPrice,
        "Currency": r.currency || "USD",
        "Unit": r.unit || "per KG",
        "Weight Basis": r.weightBasis === "net" ? "Net Weight" : "Condition Weight",
        "Moisture Regain Ref %": regain && !regain.hasUnknown ? Number(regain.blendedRegain.toFixed(2)) : "",
        "Incoterms": r.incoterms || "",
        "Valid Until": r.validUntil || "",
        "Notes": r.notes || "",
      };
    });

    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(clientRows), "Quotation");

    const internalRows = rows.map((r, i) => {
      const margin = r.quotedPrice - r.costPrice;
      const pct = r.costPrice ? (margin / r.costPrice) * 100 : 0;
      const regain =
        r.weightBasis !== "net" && r.composition
          ? calculateMoistureRegain(r.composition, r.spinningTypeName || "")
          : null;

      return {
        "Quotation No.": r.quoteNo || `LEGACY-${r.id}`,
        "No.": i + 1,
        "Yarn": r.yarnName || "",
        "Count": r.yarnCount || "",
        "Micron": r.micron ? parseFloat(r.micron).toFixed(1) + "μm" : "",
        "Composition / Quality": r.composition || "",
        "Treatment": r.treatmentName || "Untreated",
        "Spinning": r.spinningTypeName || "",
        "Factory": r.factoryName || "",
        "Cost Price": r.costPrice,
        "Quoted Price": r.quotedPrice,
        "Margin": Math.round(margin * 100) / 100,
        "Margin %": Math.round(pct * 10) / 10,
        "Currency": r.currency || "USD",
        "Unit": r.unit || "per KG",
        "Weight Basis": r.weightBasis === "net" ? "Net Weight" : "Condition Weight",
        "Moisture Regain Ref %": regain && !regain.hasUnknown ? Number(regain.blendedRegain.toFixed(2)) : "",
        "Status": r.status || "",
        "Notes": r.notes || "",
      };
    });

    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(internalRows), "Internal");

    const first = rows[0];
    const displayNo = first.quoteNo || `LEGACY-${first.id}`;
    const customerName = first.customerName || "quotation";
    const filename = `${displayNo}-${customerName.replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, "_")}.xlsx`;
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("Quotation export error:", err);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
