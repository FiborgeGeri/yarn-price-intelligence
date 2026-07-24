import { NextResponse } from "next/server";

export async function GET() {
  const csv = "Yarn Name\tFactory\tYarn Count\tMicron\tTreatment\tPrice\tCurrency\tUnit\tRecord Date\tIncoterms\tRemarks\nSIMPHONIE\tIndorama\tNM 30/2\t19.5\tUntreated\t27.85\tUSD\tper KG\t2026-07-20\tCIF Shanghai\tExample row\n";

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/tab-separated-values",
      "Content-Disposition": "attachment; filename=price-template.tsv",
    },
  });
}
