import { NextResponse } from "next/server";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const result = await db.select().from(notifications).orderBy(desc(notifications.createdAt)).limit(20);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json([]);
  }
}
