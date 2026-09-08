import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { spinningTypeOptions } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const result = await db.select().from(spinningTypeOptions).orderBy(spinningTypeOptions.name);
    return NextResponse.json(result);
  } catch (err) {
    console.error("SpinningTypes GET error:", err);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { id, name, userId } = await req.json();
    if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });
    if (id) {
      await db.update(spinningTypeOptions).set({ name, updatedAt: new Date(), updatedBy: userId || null }).where(eq(spinningTypeOptions.id, id));
      return NextResponse.json({ success: true, id });
    }
    const [row] = await db.insert(spinningTypeOptions).values({ name, createdBy: userId || null, updatedBy: userId || null }).returning();
    return NextResponse.json({ success: true, id: row.id });
  } catch (err) {
    console.error("SpinningTypes POST error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    await db.delete(spinningTypeOptions).where(eq(spinningTypeOptions.id, parseInt(id)));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("SpinningTypes DELETE error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
