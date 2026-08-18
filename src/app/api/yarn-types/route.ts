import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { yarnTypeOptions } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const result = await db.select().from(yarnTypeOptions).orderBy(yarnTypeOptions.name);
    return NextResponse.json(result);
  } catch (err) {
    console.error("YarnTypes GET error:", err);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { id, name, userId } = await req.json();
    if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });
    if (id) {
      await db.update(yarnTypeOptions).set({ name, updatedAt: new Date(), updatedBy: userId || null }).where(eq(yarnTypeOptions.id, id));
      return NextResponse.json({ success: true, id });
    }
    const [row] = await db.insert(yarnTypeOptions).values({ name, createdBy: userId || null, updatedBy: userId || null }).returning();
    return NextResponse.json({ success: true, id: row.id });
  } catch (err) {
    console.error("YarnTypes POST error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    await db.delete(yarnTypeOptions).where(eq(yarnTypeOptions.id, parseInt(id)));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("YarnTypes DELETE error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
