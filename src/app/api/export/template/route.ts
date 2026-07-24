import { NextResponse } from "next/server";

export async function GET() {
  const csv = "Yarn Name\tFactory\tYarn Count\tMicron\tTreatment\tComposition\tNotes\nSIMPHONIE\tIndorama\tNM 30/2\t19.5\tUntreated\t100% Wool\tStandard quality\n";

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/tab-separated-values",
      "Content-Disposition": "attachment; filename=yarn-template.tsv",
    },
  });
}
