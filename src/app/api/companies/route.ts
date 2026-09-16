import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { companies } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getUserMap } from "@/lib/auditHelpers";

export async function GET() {
  try {
    const all = await db.select().from(companies).orderBy(companies.name);
    const userMap = await getUserMap();
    const result = all.map((c) => ({
      ...c,
      createdByName: c.createdBy ? userMap[c.createdBy] || null : null,
      updatedByName: c.updatedBy ? userMap[c.updatedBy] || null : null,
    }));
    return NextResponse.json(result);
  } catch (err) {
    console.error("Companies GET error:", err);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id, name, officialName, addressLocal, addressEnglish, country, telephone, logoPath, isDefault, notes,
      fapiaoCompanyName, fapiaoTaxId, fapiaoAddress, fapiaoPhone,
      fapiaoFax, fapiaoBankName, fapiaoBankAccount, fapiaoContact,
      userId,
    } = body;
    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const fapiaoFields = {
      fapiaoCompanyName: fapiaoCompanyName || null,
      fapiaoTaxId: fapiaoTaxId || null,
      fapiaoAddress: fapiaoAddress || null,
      fapiaoPhone: fapiaoPhone || null,
      fapiaoFax: fapiaoFax || null,
      fapiaoBankName: fapiaoBankName || null,
      fapiaoBankAccount: fapiaoBankAccount || null,
      fapiaoContact: fapiaoContact || null,
    };

    if (isDefault) { await db.update(companies).set({ isDefault: false }); }

    if (id) {
      await db.update(companies).set({
        name, officialName: officialName || null,
        addressLocal: addressLocal || null, addressEnglish: addressEnglish || null,
        country: country || null, telephone: telephone || null, logoPath: logoPath || null,
        isDefault: isDefault || false, notes: notes || null,
        ...fapiaoFields,
        updatedAt: new Date(), updatedBy: userId || null,
      }).where(eq(companies.id, id));
      return NextResponse.json({ success: true, id });
    }

    const [c] = await db.insert(companies).values({
      name, officialName: officialName || null,
      addressLocal: addressLocal || null, addressEnglish: addressEnglish || null,
      country: country || null, telephone: telephone || null, logoPath: logoPath || null,
      isDefault: isDefault || false, notes: notes || null,
      ...fapiaoFields,
      createdBy: userId || null, updatedBy: userId || null,
    }).returning();
    return NextResponse.json({ success: true, id: c.id });
  } catch (err) {
    console.error("Companies POST error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    await db.delete(companies).where(eq(companies.id, parseInt(id)));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Companies DELETE error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
