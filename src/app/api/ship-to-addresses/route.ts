import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { shipToAddresses, shipToContacts, users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET() {
  try {
    // Get all addresses with contact counts
    const allAddresses = await db.select().from(shipToAddresses).orderBy(shipToAddresses.name);
    
    // Get contact counts
    const contactCounts = await db
      .select({
        shipToId: shipToContacts.shipToId,
        count: sql<number>`count(*)::int`,
      })
      .from(shipToContacts)
      .groupBy(shipToContacts.shipToId);
    
    const countMap: Record<number, number> = {};
    for (const cc of contactCounts) {
      if (cc.shipToId) countMap[cc.shipToId] = cc.count;
    }

    // Get user names for created_by and updated_by
    const allUsers = await db.select({ id: users.id, displayName: users.displayName, username: users.username }).from(users);
    const userMap: Record<number, string> = {};
    for (const u of allUsers) {
      userMap[u.id] = u.displayName || u.username;
    }

    const result = allAddresses.map((a) => ({
      ...a,
      contactCount: countMap[a.id] || 0,
      createdByName: a.createdBy ? userMap[a.createdBy] || null : null,
      updatedByName: a.updatedBy ? userMap[a.updatedBy] || null : null,
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error("Ship-to GET error:", err);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id,
      name,
      officialName,
      category,
      addressLocal,
      addressEnglish,
      country,
      telephone,
      notes,
      userId, // The user making the change
    } = body;

    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    if (id) {
      await db.update(shipToAddresses).set({
        name,
        officialName: officialName || null,
        category: category || null,
        addressLocal: addressLocal || null,
        addressEnglish: addressEnglish || null,
        country: country || null,
        telephone: telephone || null,
        notes: notes || null,
        updatedAt: new Date(),
        updatedBy: userId || null,
      }).where(eq(shipToAddresses.id, id));
      return NextResponse.json({ success: true, id });
    }

    const [a] = await db.insert(shipToAddresses).values({
      name,
      officialName: officialName || null,
      category: category || null,
      addressLocal: addressLocal || null,
      addressEnglish: addressEnglish || null,
      country: country || null,
      telephone: telephone || null,
      notes: notes || null,
      createdBy: userId || null,
      updatedBy: userId || null,
    }).returning();

    return NextResponse.json({ success: true, id: a.id });
  } catch (err) {
    console.error("Ship-to POST error:", err);
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
    console.error("Ship-to DELETE error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
