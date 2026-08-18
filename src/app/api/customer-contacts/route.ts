import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { customerContacts } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const customerId = req.nextUrl.searchParams.get("customerId");
    if (customerId) {
      const result = await db.select().from(customerContacts).where(eq(customerContacts.customerId, parseInt(customerId))).orderBy(customerContacts.contactName);
      return NextResponse.json(result);
    }
    const result = await db.select().from(customerContacts).orderBy(customerContacts.contactName);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Contacts GET error:", err);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, customerId, contactName, department, position, email, phone, cellPhone, notes, userId } = body;
    if (!customerId || !contactName) return NextResponse.json({ error: "Customer and name are required" }, { status: 400 });

    if (id) {
      await db.update(customerContacts).set({
        customerId,
        contactName,
        department: department || null,
        position: position || null,
        email: email || null,
        phone: phone || null,
        cellPhone: cellPhone || null,
        notes: notes || null,
        updatedAt: new Date(),
        updatedBy: userId || null,
      }).where(eq(customerContacts.id, id));
      return NextResponse.json({ success: true, id });
    }

    const [c] = await db.insert(customerContacts).values({
      customerId,
      contactName,
      department: department || null,
      position: position || null,
      email: email || null,
      phone: phone || null,
      cellPhone: cellPhone || null,
      notes: notes || null,
      createdBy: userId || null,
      updatedBy: userId || null,
    }).returning();
    return NextResponse.json({ success: true, id: c.id });
  } catch (err) {
    console.error("Contacts POST error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    await db.delete(customerContacts).where(eq(customerContacts.id, parseInt(id)));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Contacts DELETE error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
