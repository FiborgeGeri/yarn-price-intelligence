import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { companies } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getUserMap } from "@/lib/auditHelpers";

export async function GET() {
  try {
    const rows = await db.select().from(companies).orderBy(desc(companies.isDefault), desc(companies.createdAt));
    return NextResponse.json(rows);
  } catch (err) {
    console.error("Companies GET error:", err);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id, name, officialName, officialNameAlt, addressLocal, addressEnglish,
      telephone, country, logoPath, isDefault, notes,
      fapiaoCompanyName, fapiaoTaxId, fapiaoAddress, fapiaoPhone,
      fapiaoFax, fapiaoBankName, fapiaoBankAccount, fapiaoContact,
      userId,
    } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Company name is required" }, { status: 400 });
    }

    const payload = {
      name: name.trim(),
      officialName: officialName || null,
      officialNameAlt: officialNameAlt || null,
      addressLocal: addressLocal || null,
      addressEnglish: addressEnglish || null,
      telephone: telephone || null,
      country: country || null,
      logoPath: logoPath || null, // 🟢 完整接收長字串
      isDefault: Boolean(isDefault),
      notes: notes || null,
      fapiaoCompanyName: fapiaoCompanyName || null,
      fapiaoTaxId: fapiaoTaxId || null,
      fapiaoAddress: fapiaoAddress || null,
      fapiaoPhone: fapiaoPhone || null,
      fapiaoFax: fapiaoFax || null,
      fapiaoBankName: fapiaoBankName || null,
      fapiaoBankAccount: fapiaoBankAccount || null,
      fapiaoContact: fapiaoContact || null,
      updatedAt: new Date(),
      updatedBy: userId || null,
    };

    // 如果設為預設公司，先清空其他預設
    if (isDefault) {
      await db.update(companies).set({ isDefault: false });
    }

    if (id) {
      await db.update(companies).set(payload).where(eq(companies.id, id));
      return NextResponse.json({ success: true, id });
    } else {
      const [newComp] = await db.insert(companies).values({ ...payload, createdBy: userId || null }).returning();
      return NextResponse.json({ success: true, id: newComp.id });
    }
  } catch (err: any) {
    console.error("Companies POST error:", err);
    return NextResponse.json({ error: err.message || "Failed to save company" }, { status: 500 });
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
    return NextResponse.json({ error: "Failed to delete company" }, { status: 500 });
  }
}