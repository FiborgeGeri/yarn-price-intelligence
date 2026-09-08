"use client";

import { useState, useEffect, useMemo } from "react";

interface SalesRow {
  soId: number; soNo: string | null; soDate: string; customerName: string; status: string;
  itemCount: number; orderedQty: number; deliveredQty: number;
  orderValue: number; currency: string; invoicedCount: number; invoicedTotal: number; paidTotal: number; outstanding: number;
}
interface PurchaseRow {
  poId: number; poNo: string | null; poDate: string; factoryName: string; status: string;
  itemCount: number; orderedQty: number; receivedQty: number;
  orderValue: number; currency: string; invoicedCount: number; invoicedTotal: number; paidTotal: number; outstanding: number;
}

function fmt(n: number, c?: string) { return `${c || ""} ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`.trim(); }
function qtyFmt(n: number) { return n.toLocaleString(undefined, { maximumFractionDigits: 1 }); }

function Ratio({ done, total, good = "bg-emerald-500" }: { done: number; total: number; good?: string }) {
  const pct = total > 0 ? Math.min(100, (done / total) * 100) : 0;
  return (
    <div className="min-w-[110px]">
      <div className="flex justify-between text-[11px] font-mono mb-0.5"><span>{qtyFmt(done)}</span><span className="text-slate-400">/ {qtyFmt(total)}</span></div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full ${good}`} style={{ width: `${pct}%` }} /></div>
    </div>
  );
}

function Badge({ label, cls }: { label: string; cls: string }) {
  return <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${cls}`}>{label}</span>;
}

function moneyBadge(base: number, invoiced: number, paid: number) {
  const inv = invoiced <= 0
    ? { label: "Not invoiced", cls: "bg-slate-100 text-slate-500" }
    : invoiced + 0.01 < base
      ? { label: "Partially invoiced", cls: "bg-amber-50 text-amber-700" }
      : { label: "Fully invoiced", cls: "bg-blue-50 text-blue-700" };
  const pay = invoiced <= 0
    ? { label: "—", cls: "bg-slate-50 text-slate-400" }
    : paid + 0.01 >= invoiced
      ? { label: "Paid", cls: "bg-emerald-50 text-emerald-700" }
      : paid > 0
        ? { label: "Partially paid", cls: "bg-amber-50 text-amber-700" }
        : { label: "Unpaid", cls: "bg-red-50 text-red-600" };
  return { inv, pay };
}

export default function ReconciliationPage() {
  const [data, setData] = useState<{ sales: SalesRow[]; purchases: PurchaseRow[] }>({ sales: [], purchases: [] });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"sales" | "purchases">("sales");
  const [search, setSearch] = useState("");
  const [onlyOpen, setOnlyOpen] = useState(true);

  useEffect(() => {
    fetch("/api/reconciliation").then((r) => r.json()).then((d) => {
      setData({ sales: d.sales || [], purchases: d.purchases || [] });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const sales = useMemo(() => data.sales.filter((r) => {
    const q = search.toLowerCase();
    const matchQ = !q || (r.soNo || "").toLowerCase().includes(q) || r.customerName.toLowerCase().includes(q);
    const open = !onlyOpen || r.outstanding > 0.005 || r.deliveredQty < r.orderedQty - 0.005 || r.invoicedTotal < r.orderValue - 0.01;
    return matchQ && open;
  }), [data.sales, search, onlyOpen]);

  const purchases = useMemo(() => data.purchases.filter((r) => {
    const q = search.toLowerCase();
    const matchQ = !q || (r.poNo || "").toLowerCase().includes(q) || r.factoryName.toLowerCase().includes(q);
    const open = !onlyOpen || r.outstanding > 0.005 || r.receivedQty < r.orderedQty - 0.005 || r.invoicedTotal < r.orderValue - 0.01;
    return matchQ && open;
  }), [data.purchases, search, onlyOpen]);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h2 className="text-lg font-semibold text-slate-900">Reconciliation</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Cross-check the full chain — Sales: order → delivery → invoice → payment · Purchasing: order → goods receipt → supplier invoice → payment.
          Amounts are in each document&apos;s own currency.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center gap-3">
          <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
            <button onClick={() => setTab("sales")} className={`px-3 py-1.5 rounded-md text-sm font-medium ${tab === "sales" ? "bg-white shadow-sm text-slate-900" : "text-slate-500"}`}>Sales (SO → DN → INV → Paid)</button>
            <button onClick={() => setTab("purchases")} className={`px-3 py-1.5 rounded-md text-sm font-medium ${tab === "purchases" ? "bg-white shadow-sm text-slate-900" : "text-slate-500"}`}>Purchasing (PO → GR → S.INV → Paid)</button>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
            <input type="checkbox" checked={onlyOpen} onChange={(e) => setOnlyOpen(e.target.checked)} className="rounded border-slate-300" />
            Needs attention only
          </label>
          <div className="flex-1" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search no. / party…" className="px-3 py-2 border border-slate-300 rounded-lg text-sm w-56" />
        </div>

        {tab === "sales" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-100">
                  <th className="px-4 py-3 font-medium">SO No.</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Client</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Delivered / Ordered</th>
                  <th className="px-4 py-3 font-medium text-right">Order Value</th>
                  <th className="px-4 py-3 font-medium text-right">Invoiced</th>
                  <th className="px-4 py-3 font-medium text-right">Received</th>
                  <th className="px-4 py-3 font-medium text-right">Outstanding</th>
                  <th className="px-4 py-3 font-medium">Invoicing</th>
                  <th className="px-4 py-3 font-medium">Payment</th>
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={11} className="px-4 py-10 text-center text-slate-400">Loading…</td></tr>}
                {!loading && sales.length === 0 && <tr><td colSpan={11} className="px-4 py-10 text-center text-slate-400">Nothing to reconcile — all chains closed.</td></tr>}
                {sales.map((r) => {
                  const { inv, pay } = moneyBadge(r.orderValue, r.invoicedTotal, r.paidTotal);
                  return (
                    <tr key={r.soId} className="border-t border-slate-100 hover:bg-slate-50/60">
                      <td className="px-4 py-3 font-mono text-blue-600">{r.soNo || `#${r.soId}`}</td>
                      <td className="px-4 py-3">{r.soDate}</td>
                      <td className="px-4 py-3 font-medium">{r.customerName}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{r.status}</td>
                      <td className="px-4 py-3"><Ratio done={r.deliveredQty} total={r.orderedQty} /></td>
                      <td className="px-4 py-3 text-right font-mono">{fmt(r.orderValue, r.currency)}</td>
                      <td className="px-4 py-3 text-right font-mono">{r.invoicedCount > 0 ? fmt(r.invoicedTotal, r.currency) : "—"}</td>
                      <td className="px-4 py-3 text-right font-mono text-emerald-600">{r.paidTotal > 0 ? fmt(r.paidTotal, r.currency) : "—"}</td>
                      <td className={`px-4 py-3 text-right font-mono font-medium ${r.outstanding > 0 ? "text-amber-600" : "text-slate-400"}`}>{r.invoicedTotal > 0 ? fmt(r.outstanding, r.currency) : "—"}</td>
                      <td className="px-4 py-3"><Badge label={inv.label} cls={inv.cls} /></td>
                      <td className="px-4 py-3"><Badge label={pay.label} cls={pay.cls} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-100">
                  <th className="px-4 py-3 font-medium">PO No.</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Yarn Mill</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Received / Ordered</th>
                  <th className="px-4 py-3 font-medium text-right">Order Value</th>
                  <th className="px-4 py-3 font-medium text-right">Supplier Invoiced</th>
                  <th className="px-4 py-3 font-medium text-right">Paid</th>
                  <th className="px-4 py-3 font-medium text-right">Outstanding</th>
                  <th className="px-4 py-3 font-medium">Invoicing</th>
                  <th className="px-4 py-3 font-medium">Payment</th>
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={11} className="px-4 py-10 text-center text-slate-400">Loading…</td></tr>}
                {!loading && purchases.length === 0 && <tr><td colSpan={11} className="px-4 py-10 text-center text-slate-400">Nothing to reconcile — all chains closed.</td></tr>}
                {purchases.map((r) => {
                  const { inv, pay } = moneyBadge(r.orderValue, r.invoicedTotal, r.paidTotal);
                  return (
                    <tr key={r.poId} className="border-t border-slate-100 hover:bg-slate-50/60">
                      <td className="px-4 py-3 font-mono text-blue-600">{r.poNo || `#${r.poId}`}</td>
                      <td className="px-4 py-3">{r.poDate}</td>
                      <td className="px-4 py-3 font-medium">{r.factoryName}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{r.status}</td>
                      <td className="px-4 py-3"><Ratio done={r.receivedQty} total={r.orderedQty} good="bg-indigo-500" /></td>
                      <td className="px-4 py-3 text-right font-mono">{fmt(r.orderValue, r.currency)}</td>
                      <td className="px-4 py-3 text-right font-mono">{r.invoicedCount > 0 ? fmt(r.invoicedTotal, r.currency) : "—"}</td>
                      <td className="px-4 py-3 text-right font-mono text-emerald-600">{r.paidTotal > 0 ? fmt(r.paidTotal, r.currency) : "—"}</td>
                      <td className={`px-4 py-3 text-right font-mono font-medium ${r.outstanding > 0 ? "text-amber-600" : "text-slate-400"}`}>{r.invoicedTotal > 0 ? fmt(r.outstanding, r.currency) : "—"}</td>
                      <td className="px-4 py-3"><Badge label={inv.label} cls={inv.cls} /></td>
                      <td className="px-4 py-3"><Badge label={pay.label} cls={pay.cls} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
