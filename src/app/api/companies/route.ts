import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { companies, bankAccounts } from "@/db/schema";
import { and, eq } from "drizzle-orm";
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
    const { id, name, officialName, addressLocal, addressEnglish, telephone, logoPath, isDefault, notes, userId } = body;
    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    if (isDefault) {
      await db.update(companies).set({ isDefault: false });
    }

    if (id) {
      await db.update(companies).set({
        name, officialName: officialName || null,
        addressLocal: addressLocal || null, addressEnglish: addressEnglish || null,
        telephone: telephone || null, logoPath: logoPath || null,
        isDefault: isDefault || false, notes: notes || null,
        updatedAt: new Date(), updatedBy: userId || null,
      }).where(eq(companies.id, id));
      return NextResponse.json({ success: true, id });
    }

    const [c] = await db.insert(companies).values({
      name, officialName: officialName || null,
      addressLocal: addressLocal || null, addressEnglish: addressEnglish || null,
      telephone: telephone || null, logoPath: logoPath || null,
      isDefault: isDefault || false, notes: notes || null,
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
    await db.delete(bankAccounts).where(and(eq(bankAccounts.entityType, "company"), eq(bankAccounts.entityId, parseInt(id))));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Companies DELETE error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
