import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  salesOrders, soItems, customers, deliveryNotes, dnItems,
  purchaseOrders, poItems, factories, goodsReceipts, grItems,
  invoices, payments, supplierInvoices, supplierPayments,
} from "@/db/schema";
import { eq, desc } from "drizzle-orm";

function qty(v: string | null | undefined): number {
  if (!v) return 0;
  const n = parseFloat(String(v).replace(/[, ]/g, ""));
  return isNaN(n) ? 0 : n;
}

export async function GET() {
  try {
    const [sos, soi, custs, dns, dni, invs, pays, pos, poi, facts, grs, gri, sinvs, spays] = await Promise.all([
      db.select().from(salesOrders).orderBy(desc(salesOrders.soDate)).limit(300),
      db.select().from(soItems),
      db.select({ id: customers.id, name: customers.name }).from(customers),
      db.select().from(deliveryNotes),
      db.select().from(dnItems),
      db.select().from(invoices),
      db.select().from(payments),
      db.select().from(purchaseOrders).orderBy(desc(purchaseOrders.poDate)).limit(300),
      db.select().from(poItems),
      db.select({ id: factories.id, name: factories.factoryName }).from(factories),
      db.select().from(goodsReceipts),
      db.select().from(grItems),
      db.select().from(supplierInvoices),
      db.select().from(supplierPayments),
    ]);

    const custName = new Map(custs.map((c) => [c.id, c.name]));
    const factName = new Map(facts.map((f) => [f.id, f.name]));

    // ---- Sales side: SO -> DN -> Invoice -> Payments
    const dnBySo = new Map<number, number[]>(); // soId -> dnIds
    for (const dn of dns) {
      if (dn.soId == null) continue;
      dnBySo.set(dn.soId, [...(dnBySo.get(dn.soId) || []), dn.id]);
    }
    const dnIdSet = new Set(dns.map((d) => d.id));
    const deliveredByDn = new Map<number, number>();
    for (const it of dni) {
      if (it.dnId == null || !dnIdSet.has(it.dnId)) continue;
      deliveredByDn.set(it.dnId, (deliveredByDn.get(it.dnId) || 0) + qty(it.quantity));
    }
    const invBySo = new Map<number, typeof invs>();
    for (const iv of invs) {
      if (iv.soId == null) continue;
      invBySo.set(iv.soId, [...(invBySo.get(iv.soId) || []), iv]);
    }
    const paidByInv = new Map<number, number>();
    for (const p of pays) {
      if (p.invoiceId == null) continue;
      paidByInv.set(p.invoiceId, (paidByInv.get(p.invoiceId) || 0) + (p.amount || 0));
    }

    const sales = sos.map((so) => {
      const items = soi.filter((i) => i.soId === so.id);
      const orderedQty = items.reduce((s, i) => s + qty(i.quantity), 0);
      const dnIds = dnBySo.get(so.id) || [];
      const deliveredQty = dnIds.reduce((s, id) => s + (deliveredByDn.get(id) || 0), 0);
      const ivs = invBySo.get(so.id) || [];
      const invoicedTotal = ivs.filter((i) => i.status !== "Cancelled").reduce((s, i) => s + (i.total || 0), 0);
      const paidTotal = ivs.reduce((s, i) => s + (paidByInv.get(i.id) || 0), 0);
      const orderValue = items.reduce((s, i) => s + qty(i.quantity) * (i.unitPrice || 0), 0);
      return {
        soId: so.id,
        soNo: so.soNo,
        soDate: so.soDate,
        customerName: so.customerId != null ? custName.get(so.customerId) || "—" : "—",
        status: so.status,
        itemCount: items.length,
        orderedQty, deliveredQty,
        orderValue: Math.round(orderValue * 100) / 100,
        currency: items[0]?.currency || "USD",
        invoicedCount: ivs.length,
        invoicedTotal: Math.round(invoicedTotal * 100) / 100,
        paidTotal: Math.round(paidTotal * 100) / 100,
        outstanding: Math.round((invoicedTotal - paidTotal) * 100) / 100,
      };
    });

    // ---- Purchase side: PO -> GR -> Supplier Invoice -> Supplier Payments
    const grByPo = new Map<number, number[]>();
    for (const gr of grs) {
      if (gr.poId == null) continue;
      grByPo.set(gr.poId, [...(grByPo.get(gr.poId) || []), gr.id]);
    }
    const grIdSet = new Set(grs.map((g) => g.id));
    const recvByGr = new Map<number, number>();
    for (const it of gri) {
      if (it.grId == null || !grIdSet.has(it.grId)) continue;
      recvByGr.set(it.grId, (recvByGr.get(it.grId) || 0) + qty(it.quantityReceived));
    }
    const sinvByPo = new Map<number, typeof sinvs>();
    for (const iv of sinvs) {
      if (iv.poId == null) continue;
      sinvByPo.set(iv.poId, [...(sinvByPo.get(iv.poId) || []), iv]);
    }
    const paidBySinv = new Map<number, number>();
    for (const p of spays) {
      if (p.supplierInvoiceId == null) continue;
      paidBySinv.set(p.supplierInvoiceId, (paidBySinv.get(p.supplierInvoiceId) || 0) + (p.amount || 0));
    }

    const purchases = pos.map((po) => {
      const items = poi.filter((i) => i.poId === po.id);
      const orderedQty = items.reduce((s, i) => s + qty(i.quantity), 0);
      const grIds = grByPo.get(po.id) || [];
      const receivedQty = grIds.reduce((s, id) => s + (recvByGr.get(id) || 0), 0);
      const ivs = sinvByPo.get(po.id) || [];
      const invoicedTotal = ivs.filter((i) => i.status !== "Cancelled").reduce((s, i) => s + (i.total || 0), 0);
      const paidTotal = ivs.reduce((s, i) => s + (paidBySinv.get(i.id) || 0), 0);
      const orderValue = items.reduce((s, i) => s + qty(i.quantity) * (i.unitPrice || 0), 0);
      return {
        poId: po.id,
        poNo: po.poNo,
        poDate: po.poDate,
        factoryName: po.factoryId != null ? factName.get(po.factoryId) || "—" : "—",
        status: po.status,
        itemCount: items.length,
        orderedQty, receivedQty,
        orderValue: Math.round(orderValue * 100) / 100,
        currency: items[0]?.currency || po.currency || "USD",
        invoicedCount: ivs.length,
        invoicedTotal: Math.round(invoicedTotal * 100) / 100,
        paidTotal: Math.round(paidTotal * 100) / 100,
        outstanding: Math.round((invoicedTotal - paidTotal) * 100) / 100,
      };
    });

    return NextResponse.json({ sales, purchases });
  } catch (err) {
    console.error("Reconciliation GET error:", err);
    return NextResponse.json({ sales: [], purchases: [] }, { status: 500 });
  }
}
