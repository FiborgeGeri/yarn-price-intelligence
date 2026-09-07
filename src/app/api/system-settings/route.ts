import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { systemSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getUserMap } from "@/lib/auditHelpers";

const DEFAULTS: { key: string; value: string; description: string }[] = [
  { key: "default_vat_rate", value: "0", description: "Default VAT rate (%) applied to new invoices, e.g. 7 for Thailand, 13 for China. Documents keep their own rate once created." },
  { key: "default_currency", value: "USD", description: "Default currency preselected for new invoices and payments." },
  { key: "invoice_no_prefix", value: "FINV", description: "Prefix used when auto-generating sales invoice numbers." },
  { key: "default_payment_days", value: "30", description: "Default payment term (days) used to suggest invoice due dates." },
];

async function ensureSeeded() {
  const existing = await db.select({ key: systemSettings.key }).from(systemSettings);
  const have = new Set(existing.map((r) => r.key));
  const missing = DEFAULTS.filter((d) => !have.has(d.key));
  if (missing.length > 0) {
    await db.insert(systemSettings).values(missing).onConflictDoNothing();
  }
}

export async function GET() {
  try {
    await ensureSeeded();
    const rows = await db.select().from(systemSettings).orderBy(systemSettings.key);
    const userMap = await getUserMap();
    return NextResponse.json(rows.map((r) => ({ ...r, updatedByName: r.updatedBy ? userMap[r.updatedBy] || null : null })));
  } catch (err) {
    console.error("System settings GET error:", err);
    return NextResponse.json([], { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const updates = (body.updates || []) as { key: string; value: string }[];
    const userId = (body.userId as number | null) || null;
    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ error: "No updates provided" }, { status: 400 });
    }
    const allowed = new Set(DEFAULTS.map((d) => d.key));
    for (const u of updates) {
      if (!allowed.has(u.key)) continue;
      await db
        .update(systemSettings)
        .set({ value: String(u.value ?? ""), updatedAt: new Date(), updatedBy: userId })
        .where(eq(systemSettings.key, u.key));
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("System settings PUT error:", err);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
