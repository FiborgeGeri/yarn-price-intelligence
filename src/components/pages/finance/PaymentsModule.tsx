"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Permissions } from "@/lib/permissions";
import { getUserId } from "@/lib/getUserId";
import ImageUploader from "@/components/ImageUploader";

interface DocRow {
  id: number; invoiceNo?: string | null; internalNo?: string | null; supplierInvoiceNo?: string | null;
  customerName?: string | null; factoryName?: string | null;
  invoiceDate: string; dueDate: string | null; currency: string; total: number | null;
  status: string; paid: number; outstanding: number;
}
interface PayRow {
  id: number; invoiceId?: number; supplierInvoiceId?: number;
  invoiceNo?: string | null; supplierInvoiceNo?: string | null; internalNo?: string | null;
  customerName?: string | null; factoryName?: string | null;
  paymentDate: string; amount: number; currency: string | null; method: string | null; reference: string | null; notes: string | null;
  receiptImagePath?: string | null;
  createdByName: string | null;
}
interface Toast { type: "success" | "error"; text: string }

const METHODS = ["Bank Transfer / TT", "Letter of Credit (LC)", "DP / DA", "Cheque", "Cash", "Offset / Credit Note", "Other"];

function fmt(n: number | null | undefined, c?: string | null) {
  const v = n ?? 0;
  return `${c || ""} ${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`.trim();
}
function agingBucket(dueDate: string | null): { label: string; cls: string } {
  if (!dueDate) return { label: "No due date", cls: "bg-slate-100 text-slate-500" };
  const today = new Date().toISOString().slice(0, 10);
  if (dueDate >= today) return { label: "Current", cls: "bg-emerald-50 text-emerald-700" };
  const days = Math.floor((Date.parse(today) - Date.parse(dueDate)) / 86400000);
  if (days <= 30) return { label: `1–30 d`, cls: "bg-amber-50 text-amber-700" };
  if (days <= 60) return { label: `31–60 d`, cls: "bg-orange-50 text-orange-700" };
  if (days <= 90) return { label: `61–90 d`, cls: "bg-red-50 text-red-600" };
  return { label: `90+ d`, cls: "bg-red-100 text-red-700 font-semibold" };
}

export default function PaymentsModule({ kind, permissions }: { kind: "sales" | "supplier"; permissions: Permissions }) {
  const isSales = kind === "sales";
  const docsApi = isSales ? "/api/invoices" : "/api/supplier-invoices";
  const paysApi = isSales ? "/api/payments" : "/api/supplier-payments";
  const idField = isSales ? "invoiceId" : "supplierInvoiceId";
  const partyLabel = isSales ? "Client" : "Yarn Mill";
  const direction = isSales ? "received from clients" : "paid to yarn mills";

  const [docs, setDocs] = useState<DocRow[]>([]);
  const [pays, setPays] = useState<PayRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<Toast | null>(null);
  const [tab, setTab] = useState<"outstanding" | "history">("outstanding");

  // Modal states
  const [payingDoc, setPayingDoc] = useState<DocRow | null>(null);
  const [viewingPay, setViewingPay] = useState<PayRow | null>(null);
  const [editingPay, setEditingPay] = useState<PayRow | null>(null);

  const [pDate, setPDate] = useState(new Date().toISOString().slice(0, 10));
  const [pAmount, setPAmount] = useState("");
  const [pMethod, setPMethod] = useState(METHODS[0]);
  const [pRef, setPRef] = useState("");
  const [pNotes, setPNotes] = useState("");
  const [pReceipt, setPReceipt] = useState("");
  const [saving, setSaving] = useState(false);

  const showToast = useCallback((t: Toast) => { setToast(t); setTimeout(() => setToast(null), 3500); }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [d, p] = await Promise.all([fetch(docsApi).then((r) => r.json()), fetch(paysApi).then((r) => r.json())]);
      setDocs(Array.isArray(d) ? d : []);
      setPays(Array.isArray(p) ? p : []);
    } catch { showToast({ type: "error", text: "Failed to load" }); }
    setLoading(false);
  }, [docsApi, paysApi, showToast]);

  useEffect(() => { load(); }, [load]);

  const docNo = (d: DocRow) => (isSales ? d.invoiceNo : (d.supplierInvoiceNo || d.internalNo)) || `#${d.id}`;
  const partyOf = (d: DocRow) => (isSales ? d.customerName : d.factoryName) || "—";

  const outstanding = useMemo(() => docs.filter((d) => d.outstanding > 0 && d.status !== "Cancelled" && d.status !== "Draft"), [docs]);
  const filteredOutstanding = useMemo(() => outstanding.filter((d) => {
    const q = search.toLowerCase();
    return !q || docNo(d).toLowerCase().includes(q) || partyOf(d).toLowerCase().includes(q);
  }), [outstanding, search]);
  const filteredPays = useMemo(() => pays.filter((p) => {
    const q = search.toLowerCase();
    const no = (isSales ? p.invoiceNo : (p.supplierInvoiceNo || p.internalNo)) || "";
    const party = (isSales ? p.customerName : p.factoryName) || "";
    return !q || no.toLowerCase().includes(q) || party.toLowerCase().includes(q) || (p.reference || "").toLowerCase().includes(q);
  }), [pays, search, isSales]);

  const summary = useMemo(() => {
    const totalOut = outstanding.reduce((s, d) => s + d.outstanding, 0);
    const today = new Date().toISOString().slice(0, 10);
    const overdue = outstanding.filter((d) => d.dueDate && d.dueDate < today).reduce((s, d) => s + d.outstanding, 0);
    const thisMonth = today.slice(0, 7);
    const monthTotal = pays.filter((p) => (p.paymentDate || "").startsWith(thisMonth)).reduce((s, p) => s + p.amount, 0);
    return { totalOut, overdue, monthTotal, count: outstanding.length };
  }, [outstanding, pays]);

  const openPay = (d: DocRow) => {
    setPayingDoc(d);
    setEditingPay(null);
    setPAmount(d.outstanding.toFixed(2));
    setPDate(new Date().toISOString().slice(0, 10));
    setPMethod(METHODS[0]); setPRef(""); setPNotes(""); setPReceipt("");
  };

  const openEdit = (p: PayRow) => {
    setEditingPay(p);
    setPayingDoc(null);
    setViewingPay(null);
    setPDate(p.paymentDate);
    setPAmount(String(p.amount));
    setPMethod(p.method || METHODS[0]);
    setPRef(p.reference || "");
    setPNotes(p.notes || "");
    setPReceipt(p.receiptImagePath || "");
  };

  const submitPay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!(parseFloat(pAmount) > 0)) return;
    setSaving(true);

    let res;
    if (editingPay) {
      const linkedId = isSales ? editingPay.invoiceId : editingPay.supplierInvoiceId;
      res = await fetch(paysApi, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingPay.id,
          [idField]: linkedId,
          paymentDate: pDate,
          amount: pAmount,
          currency: editingPay.currency,
          method: pMethod,
          reference: pRef,
          notes: pNotes,
          receiptImagePath: pReceipt || null,
          userId: getUserId(),
        }),
      });
    } else if (payingDoc) {
      res = await fetch(paysApi, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          [idField]: payingDoc.id,
          paymentDate: pDate,
          amount: pAmount,
          currency: payingDoc.currency,
          method: pMethod,
          reference: pRef,
          notes: pNotes,
          receiptImagePath: pReceipt || null,
          userId: getUserId(),
        }),
      });
    } else {
      setSaving(false);
      return;
    }

    if (res.ok) {
      showToast({ type: "success", text: editingPay ? "Payment updated" : "Payment recorded" });
      setPayingDoc(null);
      setEditingPay(null);
      load();
    } else {
      const d = await res.json().catch(() => ({ error: "Failed" }));
      showToast({ type: "error", text: d.error || "Failed" });
    }
    setSaving(false);
  };

  const deletePay = async (p: PayRow) => {
    if (!permissions.canDelete) return;
    if (!confirm(`Delete this payment of ${fmt(p.amount, p.currency)}?`)) return;
    const res = await fetch(`${paysApi}?id=${p.id}`, { method: "DELETE" });
    if (res.ok) { showToast({ type: "success", text: "Deleted" }); load(); }
    else showToast({ type: "error", text: "Delete failed" });
  };

  const modalIsOpen = payingDoc || editingPay;
  const modalTitle = editingPay ? "Edit Payment" : "Record Payment";
  const modalContext = editingPay
    ? { docNo: (isSales ? editingPay.invoiceNo : (editingPay.supplierInvoiceNo || editingPay.internalNo)) || `#${editingPay.id}`, party: (isSales ? editingPay.customerName : editingPay.factoryName) || "—", currency: editingPay.currency || "USD" }
    : payingDoc
    ? { docNo: docNo(payingDoc), party: partyOf(payingDoc), currency: payingDoc.currency }
    : null;

  return (
    <div className="space-y-4">
      {toast && <div className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium ${toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"}`}>{toast.text}</div>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4"><div className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">Open Documents</div><div className="text-2xl font-bold text-slate-900 mt-1">{summary.count}</div></div>
        <div className="bg-white rounded-xl border border-amber-200 p-4"><div className="text-[11px] uppercase tracking-wide text-amber-500 font-semibold">Outstanding</div><div className="text-2xl font-bold text-amber-600 mt-1">{summary.totalOut.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div></div>
        <div className="bg-white rounded-xl border border-red-200 p-4"><div className="text-[11px] uppercase tracking-wide text-red-400 font-semibold">Overdue</div><div className="text-2xl font-bold text-red-500 mt-1">{summary.overdue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div></div>
        <div className="bg-white rounded-xl border border-emerald-200 p-4"><div className="text-[11px] uppercase tracking-wide text-emerald-500 font-semibold">{isSales ? "Received" : "Paid"} this month</div><div className="text-2xl font-bold text-emerald-600 mt-1">{summary.monthTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div></div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center gap-3">
          <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
            <button onClick={() => setTab("outstanding")} className={`px-3 py-1.5 rounded-md text-sm font-medium ${tab === "outstanding" ? "bg-white shadow-sm text-slate-900" : "text-slate-500"}`}>Outstanding ({outstanding.length})</button>
            <button onClick={() => setTab("history")} className={`px-3 py-1.5 rounded-md text-sm font-medium ${tab === "history" ? "bg-white shadow-sm text-slate-900" : "text-slate-500"}`}>Payment History ({pays.length})</button>
          </div>
          <div className="flex-1" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`Search ${isSales ? "invoice" : "supplier invoice"} / party…`} className="px-3 py-2 border border-slate-300 rounded-lg text-sm w-64" />
        </div>

        {tab === "outstanding" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-100">
                  <th className="px-4 py-3 font-medium">Invoice</th>
                  <th className="px-4 py-3 font-medium">{partyLabel}</th>
                  <th className="px-4 py-3 font-medium">Due Date</th>
                  <th className="px-4 py-3 font-medium">Aging</th>
                  <th className="px-4 py-3 font-medium text-right">Total</th>
                  <th className="px-4 py-3 font-medium text-right">Paid</th>
                  <th className="px-4 py-3 font-medium text-right">Outstanding</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  {permissions.canEdit && <th className="px-4 py-3 font-medium text-right">Action</th>}
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={9} className="px-4 py-10 text-center text-slate-400">Loading…</td></tr>}
                {!loading && filteredOutstanding.length === 0 && <tr><td colSpan={9} className="px-4 py-10 text-center text-slate-400">Nothing outstanding — all settled.</td></tr>}
                {filteredOutstanding.map((d) => {
                  const ag = agingBucket(d.dueDate);
                  const pct = d.total ? Math.min(100, (d.paid / d.total) * 100) : 0;
                  return (
                    <tr key={d.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                      {/* 🆕 點擊未結算發票號碼：直接定位觸發 openPay(d) 進行收款/付款 */}
                      <td className="px-4 py-3 font-mono text-blue-600">
                        <button 
                          onClick={() => openPay(d)}
                          className="font-mono text-blue-600 hover:text-blue-800 hover:underline text-left focus:outline-none"
                        >
                          {docNo(d)}
                        </button>
                      </td>
                      <td className="px-4 py-3 font-medium">{partyOf(d)}</td>
                      <td className="px-4 py-3">{d.dueDate || "—"}</td>
                      <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs ${ag.cls}`}>{ag.label}</span></td>
                      <td className="px-4 py-3 text-right font-mono">{fmt(d.total, d.currency)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="font-mono text-emerald-600">{fmt(d.paid, d.currency)}</div>
                        <div className="w-24 ml-auto h-1 mt-1 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500" style={{ width: `${pct}%` }} /></div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-amber-600">{fmt(d.outstanding, d.currency)}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{d.status}</td>
                      {permissions.canEdit && <td className="px-4 py-3 text-right"><button onClick={() => openPay(d)} className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700">Record Payment</button></td>}
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
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Invoice</th>
                  <th className="px-4 py-3 font-medium">{partyLabel}</th>
                  <th className="px-4 py-3 font-medium text-right">Amount</th>
                  <th className="px-4 py-3 font-medium">Method</th>
                  <th className="px-4 py-3 font-medium">Reference</th>
                  <th className="px-4 py-3 font-medium">By</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-400">Loading…</td></tr>}
                {!loading && filteredPays.length === 0 && <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-400">No payments recorded yet.</td></tr>}
                {filteredPays.map((p) => (
                  <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                    <td className="px-4 py-3">{p.paymentDate}</td>
                    <td className="px-4 py-3 font-mono text-blue-600">
                      <button 
                        onClick={() => setViewingPay(p)}
                        className="font-mono text-blue-600 hover:text-blue-800 hover:underline text-left focus:outline-none"
                      >
                        {(isSales ? p.invoiceNo : (p.supplierInvoiceNo || p.internalNo)) || "—"}
                      </button>
                    </td>
                    <td className="px-4 py-3 font-medium">{(isSales ? p.customerName : p.factoryName) || "—"}</td>
                    <td className="px-4 py-3 text-right font-mono font-medium text-emerald-600">{fmt(p.amount, p.currency)}</td>
                    <td className="px-4 py-3 text-xs">{p.method || "—"}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{p.reference || "—"}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">{p.createdByName || "—"}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button onClick={() => setViewingPay(p)} className="text-slate-500 hover:text-slate-700 text-xs mr-2">View</button>
                      {permissions.canEdit && <button onClick={() => openEdit(p)} className="text-blue-600 hover:text-blue-800 text-xs mr-2">Edit</button>}
                      {permissions.canDelete && <button onClick={() => deletePay(p)} className="text-red-500 hover:text-red-700 text-xs">Delete</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-slate-400">Payments {direction}. Recording a payment automatically advances the invoice status to Partially Paid / Paid.</p>

      {/* View payment modal */}
      {viewingPay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setViewingPay(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Payment Detail</h2>
                <p className="text-xs text-slate-500 mt-0.5 font-mono">
                  {(isSales ? viewingPay.invoiceNo : (viewingPay.supplierInvoiceNo || viewingPay.internalNo)) || `#${viewingPay.id}`} · {(isSales ? viewingPay.customerName : viewingPay.factoryName) || "—"}
                </p>
              </div>
              <button onClick={() => setViewingPay(null)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
            </div>
            <div className="p-4 space-y-3 text-sm">
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                <div className="text-xs text-emerald-600 font-medium mb-1">Amount</div>
                <div className="text-2xl font-bold font-mono text-emerald-700">{fmt(viewingPay.amount, viewingPay.currency)}</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-slate-500 mb-1">Payment Date</div>
                  <div className="font-medium">{viewingPay.paymentDate}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1">Method</div>
                  <div className="font-medium">{viewingPay.method || "—"}</div>
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">Reference</div>
                <div className="font-mono text-sm">{viewingPay.reference || "—"}</div>
              </div>
              {viewingPay.notes && (
                <div>
                  <div className="text-xs text-slate-500 mb-1">Notes</div>
                  <div className="bg-slate-50 rounded p-2 text-slate-700 whitespace-pre-line text-xs">{viewingPay.notes}</div>
                </div>
              )}

              {/* 🆕 顯示水單附件 */}
              {viewingPay.receiptImagePath && (
                <div>
                  <div className="text-xs text-slate-500 mb-1">Payment Receipt / Remittance Slip</div>
                  <a href={viewingPay.receiptImagePath} target="_blank" rel="noopener noreferrer">
                    <img 
                      src={viewingPay.receiptImagePath} 
                      alt="Receipt" 
                      className="max-w-full h-auto max-h-48 object-cover rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-zoom-in" 
                    />
                  </a>
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span>Recorded by: {viewingPay.createdByName || "—"}</span>
                <div className="flex gap-2">
                  {permissions.canEdit && (
                    <button onClick={() => openEdit(viewingPay)} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700">Edit</button>
                  )}
                  <button onClick={() => setViewingPay(null)} className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-300">Close</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Record / Edit payment modal */}
      {modalIsOpen && permissions.canEdit && modalContext && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => { setPayingDoc(null); setEditingPay(null); }}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">{modalTitle}</h2>
                <p className="text-xs text-slate-500 mt-0.5 font-mono">{modalContext.docNo} · {modalContext.party}</p>
              </div>
              <button onClick={() => { setPayingDoc(null); setEditingPay(null); }} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
            </div>
            <form onSubmit={submitPay} className="p-4 space-y-3">
              {payingDoc && !editingPay && (
                <div className="bg-slate-50 rounded-lg border border-slate-200 p-3 text-sm space-y-1 font-mono">
                  <div className="flex justify-between"><span className="text-slate-500">Invoice total</span><span>{fmt(payingDoc.total, payingDoc.currency)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Already paid</span><span className="text-emerald-600">{fmt(payingDoc.paid, payingDoc.currency)}</span></div>
                  <div className="flex justify-between font-semibold"><span>Outstanding</span><span className="text-amber-600">{fmt(payingDoc.outstanding, payingDoc.currency)}</span></div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date *</label>
                  <input type="date" value={pDate} onChange={(e) => setPDate(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Amount ({modalContext.currency}) *</label>
                  <input type="number" step="0.01" min="0.01" value={pAmount} onChange={(e) => setPAmount(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Method</label>
                <select value={pMethod} onChange={(e) => setPMethod(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">{METHODS.map((m) => <option key={m}>{m}</option>)}</select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Reference</label>
                <input type="text" value={pRef} onChange={(e) => setPRef(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="Bank ref / remittance no." />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <input type="text" value={pNotes} onChange={(e) => setPNotes(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
              </div>

              {/* 🆕 水單上傳組件 (一次只能上傳一張水單) */}
              <ImageUploader
                label="Payment Receipt / Remittance Slip"
                folder="receipts"
                multiple={false}
                value={pReceipt}
                onChange={(val) => setPReceipt(typeof val === "string" ? val : (val[0] || ""))}
                hint="Upload bank transfer receipt or remittance slip image"
              />

              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={saving} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">
                  {saving ? "Saving…" : editingPay ? "Save Changes" : "Record Payment"}
                </button>
                <button type="button" onClick={() => { setPayingDoc(null); setEditingPay(null); }} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export function PaymentsPage({ permissions }: { permissions: Permissions }) {
  return <PaymentsModule kind="sales" permissions={permissions} />;
}
export function PayablesPage({ permissions }: { permissions: Permissions }) {
  return <PaymentsModule kind="supplier" permissions={permissions} />;
}
