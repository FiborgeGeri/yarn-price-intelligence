import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { systemSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

const DEFAULT_SETTINGS = [
  {
    key: "template_po_remarks",
    value: "1. Deliveries must exactly match shipping specifications.\n2. Invoices must show our PO number.\n3. Moisture regain standard should be applied.",
    description: "Default footer remarks for Purchase Orders"
  },
  {
    key: "template_dn_remarks",
    value: "1. Please inspect goods immediately upon receipt.\n2. Discrepancies must be reported within 3 days.\n3. Net weight basis applies.",
    description: "Default footer remarks for Delivery Notes"
  },
  {
    key: "template_invoice_remarks",
    value: "1. Payment is strictly per agreed payment terms.\n2. Please remit payment to our designated bank account.\n3. Send remittance slip to our finance team once paid.",
    description: "Default footer remarks for Sales Invoices"
  },
  {
    key: "template_supplier_invoice_remarks",
    value: "1. Bank fees for remittance are to be shared.\n2. Quality claims are handled according to arbitration rules.",
    description: "Default footer remarks for Supplier Invoices"
  },
  {
    key: "template_quotation_remarks",
    value: "1. Minimum Order Quantities & Surcharge\nMOQ/Color: Top-dyed = 500kg; Yarn-dyed = 300kg.\nMOQ/Order: 1,000kg for China; 2,000kg for international destinations.\n\n2. Lead Times\nSample Production: 10-14 days (Ex-Mill).\nBulk Production: 30-35 days (Ex-Mill).",
    description: "Default footer remarks for Quotations"
  }
];

export async function GET() {
  try {
    const rows = await db.select().from(systemSettings);

    const existingKeys = new Set(rows.map(r => r.key));
    const missing = DEFAULT_SETTINGS.filter(s => !existingKeys.has(s.key));

    if (missing.length > 0) {
      for (const item of missing) {
        await db.insert(systemSettings).values({
          key: item.key,
          value: item.value,
          description: item.description,
        });
      }
      const updatedRows = await db.select().from(systemSettings);
      return NextResponse.json(updatedRows);
    }

    return NextResponse.json(rows);
  } catch (err) {
    console.error("System settings GET error:", err);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { settings, userId } = body as { settings: { key: string; value: string }[], userId?: number };

    if (!Array.isArray(settings)) {
      return NextResponse.json({ error: "Invalid settings format" }, { status: 400 });
    }

    for (const item of settings) {
      const [existing] = await db.select().from(systemSettings).where(eq(systemSettings.key, item.key));
      if (existing) {
        await db.update(systemSettings)
          .set({ value: item.value, updatedAt: new Date(), updatedBy: userId || null })
          .where(eq(systemSettings.key, item.key));
      } else {
        await db.insert(systemSettings).values({
          key: item.key,
          value: item.value,
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("System settings POST error:", err);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
