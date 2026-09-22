import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { supplierPayments, supplierInvoices, factories } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { getUserMap } from "@/lib/auditHelpers";

async function refreshStatus(supplierInvoiceId: number) {
  const [inv] = await db.select({ total: supplierInvoices.total, status: supplierInvoices.status }).from(supplierInvoices).where(eq(supplierInvoices.id, supplierInvoiceId));
  if (!inv) return;
  const [agg] = await db
    .select({ paid: sql<number>`coalesce(sum(${supplierPayments.amount}), 0)` })
    .from(supplierPayments)
    .where(eq(supplierPayments.supplierInvoiceId, supplierInvoiceId));
  const paid = agg?.paid || 0;
  const total = inv.total || 0;
  if (inv.status === "Cancelled") return;
  let next = inv.status;
  if (paid > 0 && paid + 1e-9 < total) next = "Partially Paid";
  else if (paid + 1e-9 >= total && total > 0) next = "Paid";
  else if (paid <= 0 && (inv.status === "Partially Paid" || inv.status === "Paid")) next = "Received";
  if (next !== inv.status) {
    await db.update(supplierInvoices).set({ status: next, updatedAt: new Date() }).where(eq(supplierInvoices.id, supplierInvoiceId));
  }
}

export async function GET(req: NextRequest) {
  try {
    const supplierInvoiceId = req.nextUrl.searchParams.get("supplierInvoiceId");
    const base = db
      .select({
        id: supplierPayments.id,
        supplierInvoiceId: supplierPayments.supplierInvoiceId,
        supplierInvoiceNo: supplierInvoices.supplierInvoiceNo,
        internalNo: supplierInvoices.internalNo,
        factoryId: supplierInvoices.factoryId,
        factoryName: factories.factoryName,
        invoiceCurrency: supplierInvoices.currency,
        invoiceTotal: supplierInvoices.total,
        paymentDate: supplierPayments.paymentDate,
        amount: supplierPayments.amount,
        currency: supplierPayments.currency,
        method: supplierPayments.method,
        reference: supplierPayments.reference,
        notes: supplierPayments.notes,
        receiptImagePath: supplierPayments.receiptImagePath,
        createdAt: supplierPayments.createdAt,
        createdBy: supplierPayments.createdBy,
      })
      .from(supplierPayments)
      .leftJoin(supplierInvoices, eq(supplierPayments.supplierInvoiceId, supplierInvoices.id))
      .leftJoin(factories, eq(supplierInvoices.factoryId, factories.id))
      .orderBy(desc(supplierPayments.paymentDate), desc(supplierPayments.createdAt));

    const rows = supplierInvoiceId ? await base.where(eq(supplierPayments.supplierInvoiceId, Number(supplierInvoiceId))) : await base;
    const userMap = await getUserMap();
    return NextResponse.json(rows.map((r) => ({ ...r, createdByName: r.createdBy ? userMap[r.createdBy] || null : null })));
  } catch (err) {
    console.error("Supplier payments GET error:", err);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id,
      supplierInvoiceId,
      paymentDate,
      amount,
      currency,
      method,
      reference,
      notes,
      receiptImagePath,
      userId,
    } = body as {
      id?: number;
      supplierInvoiceId?: number;
      paymentDate?: string;
      amount?: number | string;
      currency?: string;
      method?: string;
      reference?: string;
      notes?: string;
      receiptImagePath?: string;
      userId?: number | null;
    };

    // UPDATE existing payment
    if (id) {
      const [existing] = await db.select({ supplierInvoiceId: supplierPayments.supplierInvoiceId }).from(supplierPayments).where(eq(supplierPayments.id, id));
      if (!existing) return NextResponse.json({ error: "Payment not found" }, { status: 404 });

      await db.update(supplierPayments).set({
        paymentDate: paymentDate || "",
        amount: Number(amount),
        currency: currency || null,
        method: method || null,
        reference: reference || null,
        notes: notes || null,
        receiptImagePath: receiptImagePath || null,
      }).where(eq(supplierPayments.id, id));

      if (existing.supplierInvoiceId) await refreshStatus(existing.supplierInvoiceId);
      return NextResponse.json({ id, updated: true });
    }

    // CREATE new payment
    if (!supplierInvoiceId || !paymentDate || !(Number(amount) > 0)) {
      return NextResponse.json({ error: "Supplier invoice, date and a positive amount are required" }, { status: 400 });
    }

    const [created] = await db.insert(supplierPayments).values({
      supplierInvoiceId,
      paymentDate,
      amount: Number(amount),
      currency: currency || null,
      method: method || null,
      reference: reference || null,
      notes: notes || null,
      receiptImagePath: receiptImagePath || null,
      createdBy: userId || null,
    }).returning({ id: supplierPayments.id });

    await refreshStatus(supplierInvoiceId);
    return NextResponse.json(created);
  } catch (err) {
    console.error("Supplier payments POST error:", err);
    const message = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = Number(req.nextUrl.searchParams.get("id"));
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const [row] = await db.select({ supplierInvoiceId: supplierPayments.supplierInvoiceId }).from(supplierPayments).where(eq(supplierPayments.id, id));
    await db.delete(supplierPayments).where(eq(supplierPayments.id, id));
    if (row?.supplierInvoiceId != null) await refreshStatus(row.supplierInvoiceId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Supplier payments DELETE error:", err);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
