import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { certificates, yarnCertificates, yarns } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";

export async function GET() {
  try {
    const allCerts = await db.select().from(certificates).orderBy(certificates.certCode);

    // Get yarn associations
    const allYarnCerts = await db.select().from(yarnCertificates);
    const allYarns = await db.select({ id: yarns.id, yarnName: yarns.yarnName }).from(yarns);
    const yarnMap: Record<number, string> = {};
    for (const y of allYarns) yarnMap[y.id] = y.yarnName;

    const certYarnMap: Record<number, Array<{ yarnId: number; yarnName: string }>> = {};
    for (const yc of allYarnCerts) {
      if (yc.certificateId && yc.yarnId) {
        if (!certYarnMap[yc.certificateId]) certYarnMap[yc.certificateId] = [];
        certYarnMap[yc.certificateId].push({
          yarnId: yc.yarnId,
          yarnName: yarnMap[yc.yarnId] || "Unknown",
        });
      }
    }

    const result = allCerts.map(c => ({
      ...c,
      yarns: certYarnMap[c.id] || [],
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error("Certificates GET error:", err);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, certCode, certFullName, category, issuingBody, description } = body;

    if (id) {
      await db
        .update(certificates)
        .set({ certCode, certFullName, category, issuingBody, description })
        .where(eq(certificates.id, id));
      return NextResponse.json({ success: true, id });
    } else {
      const [c] = await db
        .insert(certificates)
        .values({ certCode, certFullName, category, issuingBody, description })
        .returning();
      return NextResponse.json({ success: true, id: c.id });
    }
  } catch (err) {
    console.error("Certificates POST error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    await db.delete(certificates).where(eq(certificates.id, parseInt(id)));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Certificates DELETE error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
