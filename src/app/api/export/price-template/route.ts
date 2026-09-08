import { NextResponse } from "next/server";

export async function GET() {
  const header = [
    "Yarn Name",
    "Factory",
    "Yarn Count",
    "Micron",
    "Treatment",
    "Price",
    "Currency",
    "Unit",
    "Weight Basis",
    "Record Date",
    "Incoterms",
    "Remarks",
  ];

  const examples = [
    ["SIMPHONIE", "Indorama", "NM 30/2", "19.5", "Untreated", "27.85", "USD", "per KG", "Condition Weight", "2026-07-20", "CIF Shanghai", "USD conditioned price"],
    ["SIMPHONIE", "Indorama", "NM 30/2", "19.5", "Untreated", "197.00", "CNY", "per KG", "Net Weight", "2026-07-20", "DDP China", "Same yarn, separate commercial term"],
    ["CAIRNS", "Indorama", "NM 48/2", "19.5", "Anti-Shrinkage", "30.50", "USD", "per KG", "Condition Weight", "24/07/2025", "FOB Hong Kong", "dd/mm/yyyy is accepted"],
  ];

  const tsv = [header, ...examples].map((row) => row.join("\t")).join("\n") + "\n";

  return new NextResponse(tsv, {
    headers: {
      "Content-Type": "text/tab-separated-values; charset=utf-8",
      "Content-Disposition": "attachment; filename=price-import-template.tsv",
      "Cache-Control": "no-store",
    },
  });
}
