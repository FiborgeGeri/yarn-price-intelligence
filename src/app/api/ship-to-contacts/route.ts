import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { shipToContacts, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const shipToId = req.nextUrl.searchParams.get("shipToId");
    
    if (shipToId) {
      const contacts = await db
        .select()
        .from(shipToContacts)
        .where(eq(shipToContacts.shipToId, parseInt(shipToId)))
        .orderBy(shipToContacts.contactName);
      return NextResponse.json(contacts);
    }

    // Get all contacts with user info
    const allContacts = await db.select().from(shipToContacts).orderBy(shipToContacts.contactName);
    
    // Get user names
    const allUsers = await db.select({ id: users.id, displayName: users.displayName, username: users.username }).from(users);
    const userMap: Record<number, string> = {};
    for (const u of allUsers) {
      userMap[u.id] = u.displayName || u.username;
    }

    const result = allContacts.map((c) => ({
      ...c,
      createdByName: c.createdBy ? userMap[c.createdBy] || null : null,
      updatedByName: c.updatedBy ? userMap[c.updatedBy] || null : null,
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error("Ship-to contacts GET error:", err);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, shipToId, contactName, department, position, email, phone, cellPhone, notes, userId } = body;

    if (!shipToId || !contactName) {
      return NextResponse.json({ error: "Ship-to ID and contact name are required" }, { status: 400 });
    }

    if (id) {
      await db.update(shipToContacts).set({
        contactName,
        department: department || null,
        position: position || null,
        email: email || null,
        phone: phone || null,
        cellPhone: cellPhone || null,
        notes: notes || null,
        updatedAt: new Date(),
        updatedBy: userId || null,
      }).where(eq(shipToContacts.id, id));
      return NextResponse.json({ success: true, id });
    }

    const [c] = await db.insert(shipToContacts).values({
      shipToId,
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
    console.error("Ship-to contacts POST error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    await db.delete(shipToContacts).where(eq(shipToContacts.id, parseInt(id)));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Ship-to contacts DELETE error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
