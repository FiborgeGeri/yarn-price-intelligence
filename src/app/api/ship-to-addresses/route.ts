import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { shipToAddresses } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getUserMap } from "@/lib/auditHelpers";

export async function GET() {
  try {
    const rows = await db
      .select({
        id: shipToAddresses.id,
        name: shipToAddresses.name,
        officialName: shipToAddresses.officialName,
        officialNameAlt: shipToAddresses.officialNameAlt, // 🆕 次要全名
        category: shipToAddresses.category,
        addressLocal: shipToAddresses.addressLocal,
        addressEnglish: shipToAddresses.addressEnglish,
        country: shipToAddresses.country,
        telephone: shipToAddresses.telephone,
        notes: shipToAddresses.notes,
        createdAt: shipToAddresses.createdAt,
        createdBy: shipToAddresses.createdBy,
        updatedAt: shipToAddresses.updatedAt,
        updatedBy: shipToAddresses.updatedBy,
      })
      .from(shipToAddresses)
      .orderBy(desc(shipToAddresses.createdAt));

    const userMap = await getUserMap();

    const result = rows.map((s) => ({
      ...s,
      createdByName: s.createdBy ? userMap[s.createdBy] || null : null,
      updatedByName: s.updatedBy ? userMap[s.updatedBy] || null : null,
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error("ShipTo GET error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, officialName, officialNameAlt, category, addressLocal, addressEnglish, country, telephone, notes, userId } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Address name is required" }, { status: 400 });
    }

    if (id) {
      await db
        .update(shipToAddresses)
        .set({
          name: name.trim(),
          officialName: officialName || null,
          officialNameAlt: officialNameAlt || null, // 🆕 更新次要全名
          category: category || null,
          addressLocal: addressLocal || null,
          addressEnglish: addressEnglish || null,
          country: country || null,
          telephone: telephone || null,
          notes: notes || null,
          updatedAt: new Date(),
          updatedBy: userId || null,
        })
        .where(eq(shipToAddresses.id, id));

      return NextResponse.json({ success: true, id });
    } else {
      const [newAddr] = await db
        .insert(shipToAddresses)
        .values({
          name: name.trim(),
          officialName: officialName || null,
          officialNameAlt: officialNameAlt || null, // 🆕 寫入次要全名
          category: category || null,
          addressLocal: addressLocal || null,
          addressEnglish: addressEnglish || null,
          country: country || null,
          telephone: telephone || null,
          notes: notes || null,
          createdBy: userId || null,
          updatedBy: userId || null,
        })
        .returning();

      return NextResponse.json({ success: true, id: newAddr.id });
    }
  } catch (err) {
    console.error("ShipTo POST error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    await db.delete(shipToAddresses).where(eq(shipToAddresses.id, parseInt(id)));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("ShipTo DELETE error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}