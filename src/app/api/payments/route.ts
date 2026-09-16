import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { payments, invoices, customers } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { getUserMap } from "@/lib/auditHelpers";

async function refreshInvoiceStatus(invoiceId: number) {
  const [inv] = await db.select({ total: invoices.total, status: invoices.status }).from(invoices).where(eq(invoices.id, invoiceId));
  if (!inv) return;
  const [agg] = await db.select({ paid: sql<number>`coalesce(sum(${payments.amount}), 0)` }).from(payments).where(eq(payments.invoiceId, invoiceId));
  const paid = agg?.paid || 0;
  const total = inv.total || 0;
  if (inv.status === "Draft" || inv.status === "Cancelled") return;
  let next = inv.status;
  if (paid > 0 && paid + 1e-9 < total) next = "Partially Paid";
  else if (paid + 1e-9 >= total && total > 0) next = "Paid";
  else if (paid <= 0 && (inv.status === "Partially Paid" || inv.status === "Paid")) next = "Sent";
  if (next !== inv.status) { await db.update(invoices).set({ status: next, updatedAt: new Date() }).where(eq(invoices.id, invoiceId)); }
}

export async function GET(req: NextRequest) {
  try {
    const invoiceId = req.nextUrl.searchParams.get("invoiceId");
    const base = db.select({
      id: payments.id, invoiceId: payments.invoiceId,
      invoiceNo: invoices.invoiceNo, customerId: invoices.customerId,
      customerName: customers.name, invoiceCurrency: invoices.currency,
      invoiceTotal: invoices.total, paymentDate: payments.paymentDate,
      amount: payments.amount, currency: payments.currency,
      method: payments.method, reference: payments.reference,
      notes: payments.notes, createdAt: payments.createdAt, createdBy: payments.createdBy,
    }).from(payments)
      .leftJoin(invoices, eq(payments.invoiceId, invoices.id))
      .leftJoin(customers, eq(invoices.customerId, customers.id))
      .orderBy(desc(payments.paymentDate), desc(payments.createdAt));
    const rows = invoiceId ? await base.where(eq(payments.invoiceId, Number(invoiceId))) : await base;
    const userMap = await getUserMap();
    return NextResponse.json(rows.map((r) => ({ ...r, createdByName: r.createdBy ? userMap[r.createdBy] || null : null })));
  } catch (err) {
    console.error("Payments GET error:", err);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, invoiceId, paymentDate, amount, currency, method, reference, notes, userId } = body as {
      id?: number; invoiceId?: number; paymentDate?: string; amount?: number | string;
      currency?: string; method?: string; reference?: string; notes?: string; userId?: number | null;
    };

    // UPDATE existing payment
    if (id) {
      const [existing] = await db.select({ invoiceId: payments.invoiceId }).from(payments).where(eq(payments.id, id));
      if (!existing) return NextResponse.json({ error: "Payment not found" }, { status: 404 });
      await db.update(payments).set({
        paymentDate: paymentDate || "",
        amount: Number(amount),
        currency: currency || null,
        method: method || null,
        reference: reference || null,
        notes: notes || null,
      }).where(eq(payments.id, id));
      
      // 修正型別安全檢查
      if (existing.invoiceId !== null && existing.invoiceId !== undefined) {
        await refreshInvoiceStatus(existing.invoiceId);
      }
      return NextResponse.json({ id, updated: true });
    }

    // CREATE new payment
    if (!invoiceId || !paymentDate || !(Number(amount) > 0)) {
      return NextResponse.json({ error: "Invoice, date and a positive amount are required" }, { status: 400 });
    }
    const [created] = await db.insert(payments).values({
      invoiceId,
      paymentDate,
      amount: Number(amount),
      currency: currency || null,
      method: method || null,
      reference: reference || null,
      notes: notes || null,
      createdBy: userId || null,
    }).returning({ id: payments.id });
    await refreshInvoiceStatus(invoiceId);
    return NextResponse.json(created);
  } catch (err) {
    console.error("Payments POST error:", err);
    return NextResponse.json({ error: "Failed to record payment" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = Number(req.nextUrl.searchParams.get("id"));
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const [row] = await db.select({ invoiceId: payments.invoiceId }).from(payments).where(eq(payments.id, id));
    await db.delete(payments).where(eq(payments.id, id));
    if (row?.invoiceId != null) await refreshInvoiceStatus(row.invoiceId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Payments DELETE error:", err);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
