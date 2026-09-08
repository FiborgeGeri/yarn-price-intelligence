import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  invoices, payments, supplierInvoices, supplierPayments,
  customers, factories, salesOrders, purchaseOrders, quotations,
} from "@/db/schema";
import { eq, sql } from "drizzle-orm";

function round2(n: number) { return Math.round(n * 100) / 100; }

export async function GET() {
  try {
    const [invs, pays, sinvs, spays, custs, facts, soCount, poCount, qCount] = await Promise.all([
      db.select().from(invoices),
      db.select().from(payments),
      db.select().from(supplierInvoices),
      db.select().from(supplierPayments),
      db.select({ id: customers.id, name: customers.name }).from(customers),
      db.select({ id: factories.id, name: factories.factoryName }).from(factories),
      db.select({ n: sql<number>`count(*)::int` }).from(salesOrders),
      db.select({ n: sql<number>`count(*)::int` }).from(purchaseOrders),
      db.select({ n: sql<number>`count(*)::int` }).from(quotations),
    ]);

    const custName = new Map(custs.map((c) => [c.id, c.name]));
    const factName = new Map(facts.map((f) => [f.id, f.name]));
    const today = new Date().toISOString().slice(0, 10);

    const activeInvs = invs.filter((i) => i.status !== "Cancelled");
    const activeSinvs = sinvs.filter((i) => i.status !== "Cancelled");

    const paidByInv = new Map<number, number>();
    for (const p of pays) if (p.invoiceId != null) paidByInv.set(p.invoiceId, (paidByInv.get(p.invoiceId) || 0) + (p.amount || 0));
    const paidBySinv = new Map<number, number>();
    for (const p of spays) if (p.supplierInvoiceId != null) paidBySinv.set(p.supplierInvoiceId, (paidBySinv.get(p.supplierInvoiceId) || 0) + (p.amount || 0));

    const invoicedSales = activeInvs.reduce((s, i) => s + (i.total || 0), 0);
    const receivedTotal = pays.reduce((s, p) => s + (p.amount || 0), 0);
    const receivable = activeInvs.reduce((s, i) => s + Math.max(0, (i.total || 0) - (paidByInv.get(i.id) || 0)), 0);
    const overdueReceivable = activeInvs
      .filter((i) => i.dueDate && i.dueDate < today)
      .reduce((s, i) => s + Math.max(0, (i.total || 0) - (paidByInv.get(i.id) || 0)), 0);
    const vatOut = activeInvs.reduce((s, i) => s + (i.vatAmount || 0), 0);

    const supplierInvoiced = activeSinvs.reduce((s, i) => s + (i.total || 0), 0);
    const supplierPaidTotal = spays.reduce((s, p) => s + (p.amount || 0), 0);
    const payable = activeSinvs.reduce((s, i) => s + Math.max(0, (i.total || 0) - (paidBySinv.get(i.id) || 0)), 0);
    const overduePayable = activeSinvs
      .filter((i) => i.dueDate && i.dueDate < today)
      .reduce((s, i) => s + Math.max(0, (i.total || 0) - (paidBySinv.get(i.id) || 0)), 0);
    const vatIn = activeSinvs.reduce((s, i) => s + (i.vatAmount || 0), 0);

    // Outstanding grouped by currency (amounts are stored per-document currency)
    const sum = (acc: Map<string, number>, cur: string | null, amt: number) => acc.set(cur || "USD", (acc.get(cur || "USD") || 0) + amt);
    const recvCur = new Map<string, number>();
    for (const i of activeInvs) sum(recvCur, i.currency, Math.max(0, (i.total || 0) - (paidByInv.get(i.id) || 0)));
    const payCur = new Map<string, number>();
    for (const i of activeSinvs) sum(payCur, i.currency, Math.max(0, (i.total || 0) - (paidBySinv.get(i.id) || 0)));
    const toCurList = (m: Map<string, number>) => Array.from(m.entries()).map(([currency, amount]) => ({ currency, amount: round2(amount) })).filter((x) => x.amount > 0);

    // Monthly buckets (last 12 months) keyed YYYY-MM
    const months: string[] = [];
    {
      const d = new Date(); d.setDate(1);
      for (let k = 11; k >= 0; k--) {
        const t = new Date(d.getFullYear(), d.getMonth() - k, 1);
        months.push(`${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}`);
      }
    }
    const bucket = (dateStr: string | null) => (dateStr && /^\d{4}-\d{2}/.test(dateStr) ? dateStr.slice(0, 7) : null);
    const monthly = months.map((month) => ({
      month,
      invoiced: round2(activeInvs.filter((i) => bucket(i.invoiceDate) === month).reduce((s, i) => s + (i.total || 0), 0)),
      received: round2(pays.filter((p) => bucket(p.paymentDate) === month).reduce((s, p) => s + (p.amount || 0), 0)),
      supplierInvoiced: round2(activeSinvs.filter((i) => bucket(i.invoiceDate) === month).reduce((s, i) => s + (i.total || 0), 0)),
      supplierPaid: round2(spays.filter((p) => bucket(p.paymentDate) === month).reduce((s, p) => s + (p.amount || 0), 0)),
    }));

    // Top counterparties by invoiced volume
    function top<T extends { id: number; total: number | null }>(rows: T[], nameOf: (r: T) => string, paidOf: (id: number) => number) {
      const m = new Map<string, { name: string; total: number; paid: number }>();
      for (const r of rows) {
        const name = nameOf(r);
        const e = m.get(name) || { name, total: 0, paid: 0 };
        e.total += r.total || 0;
        e.paid += paidOf(r.id);
        m.set(name, e);
      }
      return Array.from(m.values())
        .map((e) => ({ ...e, total: round2(e.total), paid: round2(e.paid), outstanding: round2(Math.max(0, e.total - e.paid)) }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 8);
    }

    return NextResponse.json({
      kpis: {
        invoicedSales: round2(invoicedSales),
        receivedTotal: round2(receivedTotal),
        receivable: round2(receivable),
        overdueReceivable: round2(overdueReceivable),
        vatOutput: round2(vatOut),
        supplierInvoiced: round2(supplierInvoiced),
        supplierPaidTotal: round2(supplierPaidTotal),
        payable: round2(payable),
        overduePayable: round2(overduePayable),
        vatInput: round2(vatIn),
        invoiceCount: activeInvs.length,
        supplierInvoiceCount: activeSinvs.length,
        salesOrders: soCount[0]?.n || 0,
        purchaseOrders: poCount[0]?.n || 0,
        quotations: qCount[0]?.n || 0,
      },
      receivableByCurrency: toCurList(recvCur),
      payableByCurrency: toCurList(payCur),
      monthly,
      topCustomers: top(activeInvs, (r) => (r.customerId != null ? custName.get(r.customerId) : undefined) || "—", (id) => paidByInv.get(id) || 0),
      topFactories: top(activeSinvs, (r) => (r.factoryId != null ? factName.get(r.factoryId) : undefined) || "—", (id) => paidBySinv.get(id) || 0),
    });
  } catch (err) {
    console.error("Reports GET error:", err);
    return NextResponse.json({ error: "Failed to build reports" }, { status: 500 });
  }
}
