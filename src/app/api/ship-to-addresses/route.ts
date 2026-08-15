import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { shipToAddresses, customers } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const customerId = req.nextUrl.searchParams.get("customerId");
    if (customerId) {
      const result = await db
        .select()
        .from(shipToAddresses)
        .where(eq(shipToAddresses.customerId, parseInt(customerId)))
        .orderBy(shipToAddresses.name);
      return NextResponse.json(result);
    }

    const result = await db
      .select({
        id: shipToAddresses.id,
        customerId: shipToAddresses.customerId,
        customerName: customers.name,
        name: shipToAddresses.name,
        legitName: shipToAddresses.legitName,
        category: shipToAddresses.category,
        primaryAddress: shipToAddresses.primaryAddress,
        secondaryAddress: shipToAddresses.secondaryAddress,
        country: shipToAddresses.country,
        telephone: shipToAddresses.telephone,
        contactName: shipToAddresses.contactName,
        contactPhone: shipToAddresses.contactPhone,
        contactEmail: shipToAddresses.contactEmail,
        notes: shipToAddresses.notes,
      })
      .from(shipToAddresses)
      .leftJoin(customers, eq(shipToAddresses.customerId, customers.id))
      .orderBy(shipToAddresses.name);

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
      customerId,
      name,
      legitName,
      category,
      primaryAddress,
      secondaryAddress,
      country,
      telephone,
      contactName,
      contactPhone,
      contactEmail,
      notes,
    } = body;

    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    if (id) {
      await db.update(shipToAddresses).set({
        customerId: customerId || null,
        name,
        legitName: legitName || null,
        category: category || null,
        primaryAddress: primaryAddress || null,
        secondaryAddress: secondaryAddress || null,
        country: country || null,
        telephone: telephone || null,
        contactName: contactName || null,
        contactPhone: contactPhone || null,
        contactEmail: contactEmail || null,
        notes: notes || null,
      }).where(eq(shipToAddresses.id, id));
      return NextResponse.json({ success: true, id });
    }

    const [a] = await db.insert(shipToAddresses).values({
      customerId: customerId || null,
      name,
      legitName: legitName || null,
      category: category || null,
      primaryAddress: primaryAddress || null,
      secondaryAddress: secondaryAddress || null,
      country: country || null,
      telephone: telephone || null,
      contactName: contactName || null,
      contactPhone: contactPhone || null,
      contactEmail: contactEmail || null,
      notes: notes || null,
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