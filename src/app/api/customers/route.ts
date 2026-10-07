import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { customers, customerContacts } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { getUserMap } from "@/lib/auditHelpers";

export async function GET() {
  try {
    const rows = await db
      .select({
        id: customers.id,
        name: customers.name,
        officialName: customers.officialName,
        officialNameAlt: customers.officialNameAlt, // 🆕 次要全名
        country: customers.country,
        addressLocal: customers.addressLocal,
        addressEnglish: customers.addressEnglish,
        telephone: customers.telephone,
        fapiaoCompanyName: customers.fapiaoCompanyName,
        fapiaoTaxId: customers.fapiaoTaxId,
        fapiaoAddress: customers.fapiaoAddress,
        fapiaoPhone: customers.fapiaoPhone,
        fapiaoFax: customers.fapiaoFax,
        fapiaoBankName: customers.fapiaoBankName,
        fapiaoBankAccount: customers.fapiaoBankAccount,
        fapiaoContact: customers.fapiaoContact,
        notes: customers.notes,
        createdAt: customers.createdAt,
        createdBy: customers.createdBy,
        updatedAt: customers.updatedAt,
        updatedBy: customers.updatedBy,
      })
      .from(customers)
      .orderBy(desc(customers.createdAt));

    const userMap = await getUserMap();

    const result = rows.map((c) => ({
      ...c,
      createdByName: c.createdBy ? userMap[c.createdBy] || null : null,
      updatedByName: c.updatedBy ? userMap[c.updatedBy] || null : null,
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error("Customers GET error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id,
      name,
      officialName,
      officialNameAlt, // 🆕 接收次要全名
      country,
      addressLocal,
      addressEnglish,
      telephone,
      notes,
      fapiaoCompanyName,
      fapiaoTaxId,
      fapiaoAddress,
      fapiaoPhone,
      fapiaoFax,
      fapiaoBankName,
      fapiaoBankAccount,
      fapiaoContact,
      userId,
    } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Client name is required" }, { status: 400 });
    }

    if (id) {
      await db
        .update(customers)
        .set({
          name: name.trim(),
          officialName: officialName || null,
          officialNameAlt: officialNameAlt || null, // 🆕 更新次要全名
          country: country || null,
          addressLocal: addressLocal || null,
          addressEnglish: addressEnglish || null,
          telephone: telephone || null,
          fapiaoCompanyName: fapiaoCompanyName || null,
          fapiaoTaxId: fapiaoTaxId || null,
          fapiaoAddress: fapiaoAddress || null,
          fapiaoPhone: fapiaoPhone || null,
          fapiaoFax: fapiaoFax || null,
          fapiaoBankName: fapiaoBankName || null,
          fapiaoBankAccount: fapiaoBankAccount || null,
          fapiaoContact: fapiaoContact || null,
          notes: notes || null,
          updatedAt: new Date(),
          updatedBy: userId || null,
        })
        .where(eq(customers.id, id));

      return NextResponse.json({ success: true, id });
    } else {
      const [newCust] = await db
        .insert(customers)
        .values({
          name: name.trim(),
          officialName: officialName || null,
          officialNameAlt: officialNameAlt || null, // 🆕 寫入次要全名
          country: country || null,
          addressLocal: addressLocal || null,
          addressEnglish: addressEnglish || null,
          telephone: telephone || null,
          fapiaoCompanyName: fapiaoCompanyName || null,
          fapiaoTaxId: fapiaoTaxId || null,
          fapiaoAddress: fapiaoAddress || null,
          fapiaoPhone: fapiaoPhone || null,
          fapiaoFax: fapiaoFax || null,
          fapiaoBankName: fapiaoBankName || null,
          fapiaoBankAccount: fapiaoBankAccount || null,
          fapiaoContact: fapiaoContact || null,
          notes: notes || null,
          createdBy: userId || null,
          updatedBy: userId || null,
        })
        .returning();

      return NextResponse.json({ success: true, id: newCust.id });
    }
  } catch (err) {
    console.error("Customers POST error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    await db.delete(customers).where(eq(customers.id, parseInt(id)));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Customers DELETE error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
