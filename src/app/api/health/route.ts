import { db } from "@/db";
import { users } from "@/db/schema";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await db.execute(sql`select 1`);

    // Auto-seed if empty
    const existing = await db.select().from(users).limit(1);
    if (existing.length === 0) {
      // Trigger seed
      try {
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
        await fetch(`${baseUrl}/api/seed`);
      } catch {
        // Seed inline if fetch fails
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch {
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
