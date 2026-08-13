import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { quotations, customers, customerContacts, yarns, factories, treatments } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";

const recordDateDesc = sql`
  case
    when ${quotations.quoteDate} ~ '^\d{4}-\d{2}-\d{2}$' then to_date(${quotations.quoteDate}, 'YYYY-MM-DD')
    when ${quotations.quoteDate} ~ '^\d{2}/\d{2}/\d{4}$' then to_date(${quotations.quoteDate}, 'DD/MM/YYYY')
    else null
  end desc
`;

function createQuoteNo() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `QT-${y}${m}${day}-${rand}`;
}

export async function GET(req: NextRequest) {
  try {
    const quoteNo = req.nextUrl.searchParams.get("quoteNo");

    const query = db
      .select({
        id: quotations.id,
        quoteNo: quotations.quoteNo,
        customerId: quotations.customerId,
        contactId: quotations.contactId,
        customerName: customers.name,
        customerCompany: customers.company,
        contactName: customerContacts.contactName,
        contactEmail: customerContacts.email,
        yarnId: quotations.yarnId,
        yarnName: yarns.yarnName,
        yarnCount: yarns.yarnCount,
        micron: yarns.micron,
        composition: yarns.composition,
        factoryName: factories.factoryName,
        treatmentName: treatments.name,
        costPrice: quotations.costPrice,
        quotedPrice: quotations.quotedPrice,
        currency: quotations.currency,
        unit: quotations.unit,
        quoteDate: quotations.quoteDate,
        validUntil: quotations.validUntil,
        incoterms: quotations.incoterms,
        status: quotations.status,
        notes: quotations.notes,
        createdAt: quotations.createdAt,
      })
      .from(quotations)
      .leftJoin(customers, eq(quotations.customerId, customers.id))
      .leftJoin(customerContacts, eq(quotations.contactId, customerContacts.id))
      .leftJoin(yarns, eq(quotations.yarnId, yarns.id))
      .leftJoin(factories, eq(yarns.factoryId, factories.id))
      .leftJoin(treatments, eq(yarns.treatmentId, treatments.id));

    const result = quoteNo
      ? await query.where(eq(quotations.quoteNo, quoteNo)).orderBy(recordDateDesc, desc(quotations.createdAt))
      : await query.orderBy(recordDateDesc, desc(quotations.createdAt));

    return NextResponse.json(result);
  } catch (err) {
    console.error("Quotations GET error:", err);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, quoteNo, customerId, contactId, yarnId, costPrice, quotedPrice, currency, unit, quoteDate, validUntil, incoterms, status, notes } = body;
    if (!customerId || !yarnId || !costPrice || !quotedPrice || !quoteDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (id) {
      const updateData: Record<string, unknown> = {
        customerId,
        contactId: contactId || null,
        yarnId,
        costPrice: parseFloat(costPrice),
        quotedPrice: parseFloat(quotedPrice),
        currency,
        unit,
        quoteDate,
        validUntil: validUntil || null,
        incoterms: incoterms || null,
        status: status || "Draft",
        notes: notes || null,
        updatedAt: new Date(),
      };
      if (quoteNo !== undefined) updateData.quoteNo = quoteNo || null;

      await db.update(quotations).set(updateData).where(eq(quotations.id, id));
      return NextResponse.json({ success: true, id, quoteNo });
    }

    const finalQuoteNo = quoteNo || createQuoteNo();
    const [q] = await db.insert(quotations).values({
      quoteNo: finalQuoteNo,
      customerId,
      contactId: contactId || null,
      yarnId,
      costPrice: parseFloat(costPrice),
      quotedPrice: parseFloat(quotedPrice),
      currency: currency || "USD",
      unit: unit || "per KG",
      quoteDate,
      validUntil: validUntil || null,
      incoterms: incoterms || null,
      status: status || "Draft",
      notes: notes || null,
    }).returning();

    return NextResponse.json({ success: true, id: q.id, quoteNo: finalQuoteNo });
  } catch (err) {
    console.error("Quotations POST error:", err);
    const message = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    const quoteNo = req.nextUrl.searchParams.get("quoteNo");
    if (!id && !quoteNo) return NextResponse.json({ error: "Missing id or quoteNo" }, { status: 400 });

    if (quoteNo) {
      if (quoteNo.startsWith("LEGACY-")) {
        const legacyId = parseInt(quoteNo.replace("LEGACY-", ""));
        await db.delete(quotations).where(eq(quotations.id, legacyId));
      } else {
        await db.delete(quotations).where(eq(quotations.quoteNo, quoteNo));
      }
    } else {
      await db.delete(quotations).where(eq(quotations.id, parseInt(id!)));
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Quotations DELETE error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
