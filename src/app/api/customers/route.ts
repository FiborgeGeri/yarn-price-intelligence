import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const allCustomers = await db.select().from(customers).orderBy(customers.name);
    return NextResponse.json(allCustomers);
  } catch (err) {
    console.error("Customers GET error:", err);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, company, country, email, phone, notes } = body;
    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    if (id) {
      await db.update(customers).set({ name, company, country, email, phone, notes, updatedAt: new Date() }).where(eq(customers.id, id));
      return NextResponse.json({ success: true, id });
    } else {
      const [c] = await db.insert(customers).values({ name, company, country, email, phone, notes }).returning();
      return NextResponse.json({ success: true, id: c.id });
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
