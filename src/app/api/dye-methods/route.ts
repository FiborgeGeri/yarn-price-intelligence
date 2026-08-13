import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { dyeMethodOptions } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const result = await db.select().from(dyeMethodOptions).orderBy(dyeMethodOptions.name);
    return NextResponse.json(result);
  } catch (err) {
    console.error("DyeMethods GET error:", err);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { id, name } = await req.json();
    if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });
    if (id) {
      await db.update(dyeMethodOptions).set({ name }).where(eq(dyeMethodOptions.id, id));
      return NextResponse.json({ success: true, id });
    }
    const [row] = await db.insert(dyeMethodOptions).values({ name }).returning();
    return NextResponse.json({ success: true, id: row.id });
  } catch (err) {
    console.error("DyeMethods POST error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    await db.delete(dyeMethodOptions).where(eq(dyeMethodOptions.id, parseInt(id)));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DyeMethods DELETE error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
