import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { shipToAddresses, customers } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const customerId = req.nextUrl.searchParams.get("customerId");
    if (customerId) {
      const result = await db.select().from(shipToAddresses).where(eq(shipToAddresses.customerId, parseInt(customerId))).orderBy(shipToAddresses.addressName);
      return NextResponse.json(result);
    }
    const result = await db
      .select({ id: shipToAddresses.id, customerId: shipToAddresses.customerId, customerName: customers.name, addressName: shipToAddresses.addressName, addressLine1: shipToAddresses.addressLine1, addressLine2: shipToAddresses.addressLine2, city: shipToAddresses.city, state: shipToAddresses.state, postalCode: shipToAddresses.postalCode, country: shipToAddresses.country, contactName: shipToAddresses.contactName, contactPhone: shipToAddresses.contactPhone, notes: shipToAddresses.notes })
      .from(shipToAddresses)
      .leftJoin(customers, eq(shipToAddresses.customerId, customers.id))
      .orderBy(shipToAddresses.addressName);
    return NextResponse.json(result);
  } catch (err) { console.error("Ship-to GET error:", err); return NextResponse.json([], { status: 500 }); }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, customerId, addressName, addressLine1, addressLine2, city, state, postalCode, country, contactName, contactPhone, notes } = body;
    if (!customerId || !addressName) return NextResponse.json({ error: "Customer and address name are required" }, { status: 400 });
    if (id) {
      await db.update(shipToAddresses).set({ customerId, addressName, addressLine1: addressLine1 || null, addressLine2: addressLine2 || null, city: city || null, state: state || null, postalCode: postalCode || null, country: country || null, contactName: contactName || null, contactPhone: contactPhone || null, notes: notes || null }).where(eq(shipToAddresses.id, id));
      return NextResponse.json({ success: true, id });
    }
    const [a] = await db.insert(shipToAddresses).values({ customerId, addressName, addressLine1: addressLine1 || null, addressLine2: addressLine2 || null, city: city || null, state: state || null, postalCode: postalCode || null, country: country || null, contactName: contactName || null, contactPhone: contactPhone || null, notes: notes || null }).returning();
    return NextResponse.json({ success: true, id: a.id });
  } catch (err) { console.error("Ship-to POST error:", err); return NextResponse.json({ error: "Failed" }, { status: 500 }); }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    await db.delete(shipToAddresses).where(eq(shipToAddresses.id, parseInt(id)));
    return NextResponse.json({ success: true });
  } catch (err) { console.error("Ship-to DELETE error:", err); return NextResponse.json({ error: "Failed" }, { status: 500 }); }
}
