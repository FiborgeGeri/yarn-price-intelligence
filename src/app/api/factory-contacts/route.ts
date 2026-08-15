import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { factoryContacts } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const factoryId = req.nextUrl.searchParams.get("factoryId");
    if (factoryId) {
      const result = await db
        .select()
        .from(factoryContacts)
        .where(eq(factoryContacts.factoryId, parseInt(factoryId)))
        .orderBy(factoryContacts.contactName);
      return NextResponse.json(result);
    }
    const result = await db.select().from(factoryContacts).orderBy(factoryContacts.contactName);
    return NextResponse.json(result);
  } catch (err) {
    console.error("FactoryContacts GET error:", err);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, factoryId, contactName, department, position, email, phone, cellPhone, notes } = body;
    if (!factoryId || !contactName) {
      return NextResponse.json({ error: "Factory and name are required" }, { status: 400 });
    }

    if (id) {
      await db.update(factoryContacts).set({
        factoryId,
        contactName,
        department: department || null,
        position: position || null,
        email: email || null,
        phone: phone || null,
        cellPhone: cellPhone || null,
        notes: notes || null,
      }).where(eq(factoryContacts.id, id));
      return NextResponse.json({ success: true, id });
    }

    const [c] = await db.insert(factoryContacts).values({
      factoryId,
      contactName,
      department: department || null,
      position: position || null,
      email: email || null,
      phone: phone || null,
      cellPhone: cellPhone || null,
      notes: notes || null,
    }).returning();

    return NextResponse.json({ success: true, id: c.id });
  } catch (err) {
    console.error("FactoryContacts POST error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    await db.delete(factoryContacts).where(eq(factoryContacts.id, parseInt(id)));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("FactoryContacts DELETE error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
