"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Permissions } from "@/lib/permissions";
import { getUserId } from "@/lib/getUserId";
import AuditInfo from "@/components/AuditInfo";
import IncotermsInput from "@/components/IncotermsInput";
import { CURRENCY_OPTIONS, UNIT_OPTIONS } from "@/lib/commerce";

// ---------- shared types ----------
interface InvoiceRow {
  id: number; invoiceNo?: string | null; invoiceType?: string | null; internalNo?: string | null; supplierInvoiceNo?: string | null;
  companyId: number | null; companyName: string | null;
  customerId?: number | null; customerName?: string | null; factoryId?: number | null; factoryName?: string | null;
  soId?: number | null; soNo?: string | null; poId?: number | null; poNo?: string | null; customerPoNo?: string | null;
  invoiceDate: string; dueDate: string | null; currency: string; vatRate: number | null;
  subtotal: number | null; vatAmount: number | null; total: number | null;
  status: string; notes: string | null; paid: number; outstanding: number;
  createdByName: string | null; updatedByName: string | null;
}
interface Line {
  yarnId: number | null; description: string; colorName: string; quantity: string;
  unitPrice: string; unit: string; weightBasis: string; incoterms: string;
}
interface Party { id: number; name: string; factoryName?: string }
interface OrderHead { id: number; soNo?: string; poNo?: string; customerId?: number; factoryId?: number; customerPoNo?: string; customerName?: string; factoryName?: string; items?: { yarnId: number; quantity: string; unitPrice: number; currency: string; unit: string; weightBasis: string; incoterms?: string; colorName?: string }[] }
interface Yarn { id: number; yarnName: string; yarnCount: string; factoryName: string }
interface Company { id: number; name: string; isDefault: boolean }
interface Toast { type: "success" | "error"; text: string }
interface DetailItem { id: number; yarnId: number | null; yarnName: string | null; yarnCount: string | null; factoryName?: string | null; description: string | null; colorName: string | null; quantity: string | null; unitPrice: number; unit: string; weightBasis: string; incoterms: string | null; amount: number }
interface DetailPayment { id: number; paymentDate: string; amount: number; currency: string | null; method: string | null; reference: string | null }
interface Detail extends InvoiceRow { items: DetailItem[]; payments: DetailPayment[] }

const SALES_STATUSES = ["Draft", "Sent", "Partially Paid", "Paid", "Cancelled"];
const SUPPLIER_STATUSES = ["Received", "Partially Paid", "Paid", "Cancelled"];

const INVOICE_TYPES = [
  "Proforma Invoice",
  "Deposit Invoice",
  "Commercial Invoice",
  "Balance Invoice",
  "Debit Note",
  "Credit Note",
];

const TYPE_COLORS: Record<string, string> = {
  "Proforma Invoice": "bg-purple-50 text-purple-700 border-purple-200",
  "Deposit Invoice": "bg-amber-50 text-amber-700 border-amber-200",
  "Commercial Invoice": "bg-blue-50 text-blue-700 border-blue-200",
  "Balance Invoice": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Debit Note": "bg-red-50 text-red-700 border-red-200",
  "Credit Note": "bg-slate-100 text-slate-700 border-slate-200",
};

const TYPE_SHORT: Record<string, string> = {
  "Proforma Invoice": "PI",
  "Deposit Invoice": "DEP",
  "Commercial Invoice": "INV",
  "Balance Invoice": "BAL",
  "Debit Note": "DN",
  "Credit Note": "CN",
};

const STATUS_COLORS: Record<string, string> = {
  Draft: "bg-slate-100 text-slate-600 border-slate-200",
  Sent: "bg-blue-50 text-blue-700 border-blue-200",
  Received: "bg-indigo-50 text-indigo-700 border-indigo-200",
  "Partially Paid": "bg-amber-50 text-amber-700 border-amber-200",
  Paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Cancelled: "bg-red-50 text-red-500 border-red-200 line-through",
};

function parseQtyNum(q: string): number { const n = parseFloat(String(q).replace(/[, ]/g, "")); return isNaN(n) ? 0 : n; }
function fmt(n: number | null | undefined, c?: string | null) {
  const v = n ?? 0;
  return `${c || ""} ${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`.trim();
}
const emptyLine = (): Line => ({ yarnId: null, description: "", colorName: "", quantity: "", unitPrice: "", unit: "per KG", weightBasis: "condition", incoterms: "" });

// ---------- configurable module ----------
export default function InvoiceModule({ kind, permissions }: { kind: "sales" | "supplier"; permissions: Permissions }) {
  const isSales = kind === "sales";
  const api = isSales ? "/api/invoices" : "/api/supplier-invoices";
  const orderApi = isSales ? "/api/sales-orders" : "/api/purchase-orders";
  const partyApi = isSales ? "/api/customers" : "/api/factories";
  const partyLabel = isSales ? "Client" : "Yarn Mill";
  const orderLabel = isSales ? "Sales Order" : "Purchase Order";
  const docLabel = isSales ? "Invoice" : "Supplier Invoice";
  const statuses = isSales ? SALES_STATUSES : SUPPLIER_STATUSES;

  const [rows, setRows] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [toast, setToast] = useState<Toast | null>(null);

  const [partyList, setPartyList] = useState<Party[]>([]);
  const [orderList, setOrderList] = useState<OrderHead[]>([]);
  const [yarnList, setYarnList] = useState<Yarn[]>([]);
  const [companyList, setCompanyList] = useState<Company[]>([]);
  const [defaultVat, setDefaultVat] = useState("0");
  const [defaultCurrency, setDefaultCurrency] = useState("USD");
  const [defaultPayDays, setDefaultPayDays] = useState(30);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<InvoiceRow | null>(null);
  const [viewing, setViewing] = useState<Detail | null>(null);
  const [saving, setSaving] = useState(false);

  // form state
  const [fCompany, setFCompany] = useState(0);
  const [fParty, setFParty] = useState(0);
  const [fOrderId, setFOrderId] = useState(0);
  const [fInvoiceType, setFInvoiceType] = useState("Commercial Invoice");
  const [fSupplierInvNo, setFSupplierInvNo] = useState("");
  const [fDate, setFDate] = useState(new Date().toISOString().slice(0, 10));
  const [fDue, setFDue] = useState("");
  const [fCurrency, setFCurrency] = useState("USD");
  const [fVatRate, setFVatRate] = useState("0");
  const [fStatus, setFStatus] = useState(isSales ? "Draft" : "Received");
  const [fNotes, setFNotes] = useState("");
  const [lines, setLines] = useState<Line[]>([emptyLine()]);

  const showToast = useCallback((t: Toast) => { setToast(t); setTimeout(() => setToast(null), 3500); }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(api);
      setRows(await res.json());
    } catch { showToast({ type: "error", text: "Failed to load" }); }
    setLoading(false);
  }, [api, showToast]);

  useEffect(() => {
    load();
    fetch(partyApi).then((r) => r.json()).then((d) => setPartyList(Array.isArray(d) ? d : [])).catch(() => {});
    fetch(orderApi).then((r) => r.json()).then((d) => setOrderList(Array.isArray(d) ? d : [])).catch(() => {});
    fetch("/api/yarns").then((r) => r.json()).then((d) => setYarnList(Array.isArray(d) ? d : [])).catch(() => {});
    fetch("/api/companies").then((r) => r.json()).then((d) => setCompanyList(Array.isArray(d) ? d : [])).catch(() => {});
    fetch("/api/system-settings").then((r) => r.json()).then((d: { key: string; value: string }[]) => {
      if (!Array.isArray(d)) return;
      const vat = d.find((s) => s.key === "default_vat_rate")?.value;
      const cur = d.find((s) => s.key === "default_currency")?.value;
      const days = d.find((s) => s.key === "default_payment_days")?.value;
      if (vat) { setDefaultVat(vat); setFVatRate(vat); }
      if (cur) { setDefaultCurrency(cur); setFCurrency((p) => (editing ? p : cur)); }
      if (days) setDefaultPayDays(parseInt(days) || 30);
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load]);

  const filtered = useMemo(() => rows.filter((r) => {
    const docNo = (isSales ? r.invoiceNo : (r.supplierInvoiceNo || r.internalNo)) || "";
    const party = (isSales ? r.customerName : r.factoryName) || "";
    const order = (r.soNo || r.poNo || "") + (r.customerPoNo || "");
    const q = search.toLowerCase();
    const matchType = !isSales || !typeFilter || r.invoiceType === typeFilter;
    return (!q || docNo.toLowerCase().includes(q) || party.toLowerCase().includes(q) || order.toLowerCase().includes(q))
      && (!statusFilter || r.status === statusFilter)
      && matchType;
  }), [rows, search, statusFilter, typeFilter, isSales]);

  const totals = useMemo(() => {
    const subtotal = lines.reduce((s, l) => s + parseQtyNum(l.quantity) * (parseFloat(l.unitPrice) || 0), 0);
    const rate = parseFloat(fVatRate) || 0;
    const vat = Math.round(subtotal * (rate / 100) * 100) / 100;
    return { subtotal: Math.round(subtotal * 100) / 100, vat, total: Math.round((subtotal + vat) * 100) / 100 };
  }, [lines, fVatRate]);

  const summary = useMemo(() => ({
    docs: filtered.length,
    outstanding: filtered.filter((r) => r.status !== "Cancelled").reduce((s, r) => s + (r.outstanding || 0), 0),
    overdue: filtered.filter((r) => r.status !== "Cancelled" && r.dueDate && r.dueDate < new Date().toISOString().slice(0, 10)).reduce((s, r) => s + (r.outstanding || 0), 0),
  }), [filtered]);

  const suggestDue = (dateStr: string) => {
    if (!dateStr || fDue) return;
    const d = new Date(dateStr);
    d.setDate(d.getDate() + defaultPayDays);
    setFDue(d.toISOString().slice(0, 10));
  };

  const openForm = (r?: InvoiceRow) => {
    if (r) {
      setEditing(r);
      setFCompany(r.companyId || 0);
      setFParty((isSales ? r.customerId : r.factoryId) || 0);
      setFOrderId((isSales ? r.soId : r.poId) || 0);
      setFInvoiceType(r.invoiceType || "Commercial Invoice");
      setFSupplierInvNo(r.supplierInvoiceNo || "");
      setFDate(r.invoiceDate);
      setFDue(r.dueDate || "");
      setFCurrency(r.currency || "USD");
      setFVatRate(String(r.vatRate ?? 0));
      setFStatus(r.status);
      setFNotes(r.notes || "");
      // load existing items
      fetch(`${api}?id=${r.id}`).then((x) => x.json()).then((d: Detail) => {
        setLines(d.items.length ? d.items.map((it) => ({
          yarnId: it.yarnId, description: it.description || it.yarnName || "", colorName: it.colorName || "",
          quantity: it.quantity || "", unitPrice: String(it.unitPrice), unit: it.unit || "per KG",
          weightBasis: it.weightBasis || "condition", incoterms: it.incoterms || "",
        })) : [emptyLine()]);
      });
    } else {
      setEditing(null);
      setFCompany(companyList.find((c) => c.isDefault)?.id || 0);
      setFParty(0); setFOrderId(0); setFSupplierInvNo("");
      setFInvoiceType("Commercial Invoice");
      setFDate(new Date().toISOString().slice(0, 10)); setFDue("");
      setFCurrency(defaultCurrency); setFVatRate(defaultVat);
      setFStatus(isSales ? "Draft" : "Received"); setFNotes("");
      setLines([emptyLine()]);
    }
    setShowForm(true);
  };

  // Prefill from a linked order (new docs only)
  const onOrderChange = (orderId: number) => {
    setFOrderId(orderId);
    if (!orderId || editing) return;
    const o = orderList.find((x) => x.id === orderId);
    if (!o) return;
    setFParty((isSales ? o.customerId : o.factoryId) || 0);
    if (o.items?.length) {
      const cur = o.items[0].currency;
      if (cur) setFCurrency(cur);
      setLines(o.items.map((it) => ({
        yarnId: it.yarnId ?? null,
        description: yarnList.find((y) => y.id === it.yarnId)?.yarnName || "",
        colorName: it.colorName || "",
        quantity: it.quantity || "", unitPrice: String(it.unitPrice ?? ""),
        unit: it.unit || "per KG", weightBasis: it.weightBasis || "condition", incoterms: it.incoterms || "",
      })));
    }
  };

  const updateLine = (idx: number, field: keyof Line, value: string | number | null) =>
    setLines((p) => p.map((l, i) => (i === idx ? { ...l, [field]: value } : l)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fParty || !fDate) return;
    setSaving(true);
    const order = orderList.find((o) => o.id === fOrderId);
    const payload = {
      id: editing?.id,
      companyId: fCompany || null,
      ...(isSales
        ? { invoiceType: fInvoiceType, customerId: fParty, soId: fOrderId || null, soNo: order?.soNo || null, customerPoNo: order?.customerPoNo || null }
        : { supplierInvoiceNo: fSupplierInvNo || null, factoryId: fParty, poId: fOrderId || null, poNo: order?.poNo || null }),
      invoiceDate: fDate, dueDate: fDue || null,
      currency: fCurrency, vatRate: fVatRate, status: fStatus, notes: fNotes,
      items: lines.filter((l) => parseFloat(l.unitPrice) > 0),
      userId: getUserId(),
    };
    const res = await fetch(api, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (res.ok) {
      showToast({ type: "success", text: editing ? "Updated" : "Created" });
      setShowForm(false); setEditing(null); load();
    } else {
      const d = await res.json().catch(() => ({ error: "Failed" }));
      showToast({ type: "error", text: d.error || "Failed to save" });
    }
    setSaving(false);
  };

  const handleDelete = async (r: InvoiceRow) => {
    if (!permissions.canDelete) return;
    if (!confirm(`Delete ${docLabel} ${(isSales ? r.invoiceNo : r.supplierInvoiceNo || r.internalNo) || r.id}? Linked payments will also be removed.`)) return;
    const res = await fetch(`${api}?id=${r.id}`, { method: "DELETE" });
    if (res.ok) { showToast({ type: "success", text: "Deleted" }); load(); }
    else showToast({ type: "error", text: "Delete failed" });
  };

  const openView = (r: InvoiceRow) => fetch(`${api}?id=${r.id}`).then((x) => x.json()).then(setViewing).catch(() => {});

  const docNoOf = (r: InvoiceRow) => (isSales ? r.invoiceNo : (r.supplierInvoiceNo || r.internalNo)) || `#${r.id}`;
  const partyOf = (r: InvoiceRow) => (isSales ? r.customerName : r.factoryName) || "—";
  const orderOf = (r: InvoiceRow) => r.soNo || r.poNo || "—";

  return (
    <div className="space-y-4">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium ${toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"}`}>{toast.text}</div>
      )}

      {/* summary chips */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4"><div className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">Documents</div><div className="text-2xl font-bold text-slate-900 mt-1">{summary.docs}</div></div>
        <div className="bg-white rounded-xl border border-slate-200 p-4"><div className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">Total Invoiced</div><div className="text-2xl font-bold text-slate-900 mt-1">{filtered.filter((r) => r.status !== "Cancelled").reduce((s, r) => s + (r.total || 0), 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div></div>
        <div className="bg-white rounded-xl border border-amber-200 p-4"><div className="text-[11px] uppercase tracking-wide text-amber-500 font-semibold">Outstanding</div><div className="text-2xl font-bold text-amber-600 mt-1">{summary.outstanding.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div></div>
        <div className="bg-white rounded-xl border border-red-200 p-4"><div className="text-[11px] uppercase tracking-wide text-red-400 font-semibold">Overdue</div><div className="text-2xl font-bold text-red-500 mt-1">{summary.overdue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div></div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px]">
            <h2 className="text-lg font-semibold text-slate-900">{docLabel}s</h2>
            <p className="text-xs text-slate-400">{isSales ? "Bill clients for delivered yarn — supports Proforma, Deposit, Commercial, Balance, Debit & Credit Notes." : "Record yarn mill invoices against purchase orders."}</p>
          </div>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search no. / party / order…" className="px-3 py-2 border border-slate-300 rounded-lg text-sm w-56" />
          {isSales && (
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">
              <option value="">All types</option>
              {INVOICE_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          )}
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">
            <option value="">All statuses</option>
            {statuses.map((s) => <option key={s}>{s}</option>)}
          </select>
          {permissions.canEdit && <button onClick={() => openForm()} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">+ New {docLabel}</button>}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-100">
                <th className="px-4 py-3 font-medium">No.</th>
                {isSales && <th className="px-4 py-3 font-medium">Type</th>}
                <th className="px-4 py-3 font-medium">{partyLabel}</th>
                <th className="px-4 py-3 font-medium">{orderLabel}</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Due</th>
                <th className="px-4 py-3 font-medium text-right">Subtotal</th>
                <th className="px-4 py-3 font-medium text-right">VAT</th>
                <th className="px-4 py-3 font-medium text-right">Total</th>
                <th className="px-4 py-3 font-medium text-right">Paid</th>
                <th className="px-4 py-3 font-medium text-right">Outstanding</th>
                <th className="px-4 py-3 font-medium">Status</th>
                {permissions.canEdit && <th className="px-4 py-3 font-medium text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={13} className="px-4 py-10 text-center text-slate-400">Loading…</td></tr>}
              {!loading && filtered.length === 0 && <tr><td colSpan={13} className="px-4 py-10 text-center text-slate-400">No {docLabel.toLowerCase()}s yet{permissions.canEdit ? ` — click “New ${docLabel}” to create one.` : "."}</td></tr>}
              {filtered.map((r) => {
                const overdue = r.dueDate && r.dueDate < new Date().toISOString().slice(0, 10) && r.outstanding > 0 && r.status !== "Cancelled";
                const typeLabel = r.invoiceType || "Commercial Invoice";
                return (
                  <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                    <td className="px-4 py-3"><button onClick={() => openView(r)} className="font-mono text-blue-600 hover:underline text-left">{docNoOf(r)}</button>{!isSales && r.internalNo && r.supplierInvoiceNo && <div className="text-[10px] text-slate-400 font-mono">{r.internalNo}</div>}</td>
                    {isSales && (
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${TYPE_COLORS[typeLabel] || "bg-slate-100 text-slate-600 border-slate-200"}`} title={typeLabel}>
                          {TYPE_SHORT[typeLabel] || typeLabel}
                        </span>
                      </td>
                    )}
                    <td className="px-4 py-3 font-medium">{partyOf(r)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{orderOf(r)}</td>
                    <td className="px-4 py-3">{r.invoiceDate}</td>
                    <td className={`px-4 py-3 ${overdue ? "text-red-500 font-semibold" : ""}`}>{r.dueDate || "—"}{overdue && <span className="ml-1 text-[9px] uppercase">overdue</span>}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-500">{fmt(r.subtotal, r.currency)}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-500">{r.vatRate ? `${fmt(r.vatAmount, r.currency)} (${r.vatRate}%)` : "—"}</td>
                    <td className="px-4 py-3 text-right font-mono font-semibold">{fmt(r.total, r.currency)}</td>
                    <td className="px-4 py-3 text-right font-mono text-emerald-600">{fmt(r.paid, r.currency)}</td>
                    <td className={`px-4 py-3 text-right font-mono font-medium ${r.outstanding > 0 && r.status !== "Cancelled" ? "text-amber-600" : "text-slate-400"}`}>{fmt(r.outstanding, r.currency)}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs font-medium border ${STATUS_COLORS[r.status] || "bg-slate-100 text-slate-600 border-slate-200"}`}>{r.status}</span></td>
                    {permissions.canEdit && (
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button onClick={() => openView(r)} className="text-slate-500 hover:text-slate-700 text-xs mr-2">View</button>
                        <button onClick={() => openForm(r)} className="text-blue-600 hover:text-blue-800 text-xs mr-2">Edit</button>
                        {permissions.canDelete && <button onClick={() => handleDelete(r)} className="text-red-500 hover:text-red-700 text-xs">Delete</button>}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============ View modal ============ */}
      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setViewing(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold">{docLabel} {docNoOf(viewing)}</h2>
                  {isSales && viewing.invoiceType && (
                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${TYPE_COLORS[viewing.invoiceType] || "bg-slate-100 text-slate-600 border-slate-200"}`}>
                      {viewing.invoiceType}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{partyOf(viewing)} · {viewing.invoiceDate}{viewing.dueDate ? ` · due ${viewing.dueDate}` : ""}</p>
              </div>
              <button onClick={() => setViewing(null)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div><span className="text-slate-500 text-xs block">{partyLabel}</span><div className="font-medium">{partyOf(viewing)}</div></div>
                <div><span className="text-slate-500 text-xs block">{orderLabel}</span><div className="font-mono text-xs mt-0.5">{orderOf(viewing)}</div></div>
                <div><span className="text-slate-500 text-xs block">Status</span><span className={`px-2 py-0.5 rounded text-xs font-medium border ${STATUS_COLORS[viewing.status] || ""}`}>{viewing.status}</span></div>
                <div><span className="text-slate-500 text-xs block">Currency / VAT</span><div>{viewing.currency} · {viewing.vatRate || 0}%</div></div>
              </div>
              <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-slate-600"><th className="px-4 py-2.5 font-medium">Item</th><th className="px-4 py-2.5 font-medium">Color</th><th className="px-4 py-2.5 font-medium text-right">Qty</th><th className="px-4 py-2.5 font-medium text-right">Unit Price</th><th className="px-4 py-2.5 font-medium text-right">Amount</th><th className="px-4 py-2.5 font-medium">Incoterms</th></tr></thead>
                  <tbody>
                    {viewing.items.map((it) => (
                      <tr key={it.id} className="border-t border-slate-200">
                        <td className="px-4 py-2.5"><div className="font-medium">{it.yarnName || it.description || "—"}</div><div className="text-xs text-slate-400">{it.yarnCount || ""}</div></td>
                        <td className="px-4 py-2.5">{it.colorName || "—"}</td>
                        <td className="px-4 py-2.5 text-right font-mono">{it.quantity || "—"}</td>
                        <td className="px-4 py-2.5 text-right font-mono">{it.unitPrice.toFixed(2)}</td>
                        <td className="px-4 py-2.5 text-right font-mono font-medium">{it.amount.toFixed(2)}</td>
                        <td className="px-4 py-2.5 text-xs text-slate-500">{it.incoterms || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-slate-300 text-sm"><td colSpan={4} className="px-4 py-2 text-right text-slate-500">Subtotal</td><td className="px-4 py-2 text-right font-mono">{fmt(viewing.subtotal, viewing.currency)}</td><td /></tr>
                    <tr className="text-sm"><td colSpan={4} className="px-4 py-2 text-right text-slate-500">VAT ({viewing.vatRate || 0}%)</td><td className="px-4 py-2 text-right font-mono">{fmt(viewing.vatAmount, viewing.currency)}</td><td /></tr>
                    <tr className="text-base font-semibold"><td colSpan={4} className="px-4 py-2 text-right">Total</td><td className="px-4 py-2 text-right font-mono">{fmt(viewing.total, viewing.currency)}</td><td /></tr>
                    <tr className="text-sm text-emerald-700"><td colSpan={4} className="px-4 py-2 text-right">Paid</td><td className="px-4 py-2 text-right font-mono">{fmt(viewing.paid, viewing.currency)}</td><td /></tr>
                    <tr className="text-sm font-semibold text-amber-700"><td colSpan={4} className="px-4 py-2 text-right">Outstanding</td><td className="px-4 py-2 text-right font-mono">{fmt(viewing.outstanding, viewing.currency)}</td><td /></tr>
                  </tfoot>
                </table>
              </div>
              {viewing.payments.length > 0 && (
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Payment History</div>
                  <div className="rounded-lg border border-slate-200 divide-y divide-slate-100">
                    {viewing.payments.map((p) => (
                      <div key={p.id} className="px-4 py-2 text-sm flex flex-wrap gap-x-6 gap-y-1">
                        <span className="text-slate-500">{p.paymentDate}</span>
                        <span className="font-mono font-medium">{fmt(p.amount, p.currency || viewing.currency)}</span>
                        <span className="text-slate-500">{p.method || ""}</span>
                        <span className="text-slate-400 font-mono text-xs">{p.reference || ""}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {viewing.notes && <div className="text-sm text-slate-600 whitespace-pre-line bg-slate-50 rounded-lg p-3 border border-slate-100">{viewing.notes}</div>}
              <AuditInfo createdByName={viewing.createdByName} updatedByName={viewing.updatedByName} />
            </div>
          </div>
        </div>
      )}

      {/* ============ Form modal ============ */}
      {showForm && permissions.canEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => { setShowForm(false); setEditing(null); }}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">{editing ? `Edit ${docLabel}` : `New ${docLabel}`}</h2>
                {editing && <p className="text-xs text-slate-500 mt-0.5 font-mono">{docNoOf(editing)}</p>}
              </div>
              <button onClick={() => { setShowForm(false); setEditing(null); }} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {isSales && (
                <div className="bg-slate-50 rounded-lg border border-slate-200 p-3">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Invoice Type *</label>
                  <div className="flex flex-wrap gap-2">
                    {INVOICE_TYPES.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setFInvoiceType(t)}
                        className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition ${
                          fInvoiceType === t
                            ? `${TYPE_COLORS[t]} ring-2 ring-offset-1 ring-current`
                            : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2">
                    {fInvoiceType === "Proforma Invoice" && "Formal quote / used for LC opening or advance payment request."}
                    {fInvoiceType === "Deposit Invoice" && "Bill client for advance/deposit payment (e.g. 30% before production)."}
                    {fInvoiceType === "Commercial Invoice" && "Official invoice for customs, export documents and full-amount billing."}
                    {fInvoiceType === "Balance Invoice" && "Bill client for remaining balance after deposit has been paid."}
                    {fInvoiceType === "Debit Note" && "Charge client additional amount (e.g. price adjustment, extra fees)."}
                    {fInvoiceType === "Credit Note" && "Refund or credit client (e.g. return, discount, overcharge correction)."}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{partyLabel} *</label>
                  <select value={fParty} onChange={(e) => setFParty(Number(e.target.value))} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white" required>
                    <option value={0}>Select…</option>
                    {partyList.map((p) => <option key={p.id} value={p.id}>{p.name || p.factoryName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Link {orderLabel} (optional — prefills items)</label>
                  <select value={fOrderId} onChange={(e) => onOrderChange(Number(e.target.value))} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">
                    <option value={0}>— None —</option>
                    {orderList.map((o) => <option key={o.id} value={o.id}>{(isSales ? o.soNo : o.poNo) || `#${o.id}`}{o.customerName || o.factoryName ? ` — ${o.customerName || o.factoryName}` : ""}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Company</label>
                  <select value={fCompany} onChange={(e) => setFCompany(Number(e.target.value))} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">
                    <option value={0}>— Default —</option>
                    {companyList.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {!isSales && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Supplier Invoice No.</label>
                    <input type="text" value={fSupplierInvNo} onChange={(e) => setFSupplierInvNo(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="Mill's own invoice no." />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Invoice Date *</label>
                  <input type="date" value={fDate} onChange={(e) => { setFDate(e.target.value); suggestDue(e.target.value); }} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
                  <input type="date" value={fDue} onChange={(e) => setFDue(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Currency</label>
                  <select value={fCurrency} onChange={(e) => setFCurrency(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">{CURRENCY_OPTIONS.map((c) => <option key={c}>{c}</option>)}</select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">VAT rate %</label>
                  <input type="number" step="0.01" min="0" value={fVatRate} onChange={(e) => setFVatRate(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select value={fStatus} onChange={(e) => setFStatus(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">{statuses.map((s) => <option key={s}>{s}</option>)}</select>
                </div>
              </div>

              {/* items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Items</h3>
                    <p className="text-xs text-slate-400">Amount is computed as quantity × unit price.</p>
                  </div>
                  <button type="button" onClick={() => setLines((p) => [...p, emptyLine()])} className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300">+ Add Line</button>
                </div>
                <div className="space-y-3">
                  {lines.map((l, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-slate-500">Line {idx + 1}</span>
                        {lines.length > 1 && <button type="button" onClick={() => setLines((p) => p.filter((_, i) => i !== idx))} className="text-xs text-red-500 hover:text-red-700">Remove</button>}
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                        <div className="col-span-2">
                          <select value={l.yarnId || 0} onChange={(e) => { const id = Number(e.target.value) || null; updateLine(idx, "yarnId", id); const y = yarnList.find((x) => x.id === id); if (y) updateLine(idx, "description", y.yarnName); }} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs bg-white">
                            <option value={0}>— Yarn (optional) —</option>
                            {yarnList.map((y) => <option key={y.id} value={y.id}>{y.yarnName}{y.yarnCount ? ` · ${y.yarnCount}` : ""}{y.factoryName ? ` · ${y.factoryName}` : ""}</option>)}
                          </select>
                        </div>
                        <div><input type="text" value={l.colorName} onChange={(e) => updateLine(idx, "colorName", e.target.value)} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs" placeholder="Color" /></div>
                        <div><input type="text" value={l.quantity} onChange={(e) => updateLine(idx, "quantity", e.target.value)} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs" placeholder="Qty" /></div>
                        <div><input type="number" step="0.01" value={l.unitPrice} onChange={(e) => updateLine(idx, "unitPrice", e.target.value)} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs" placeholder="Unit price" /></div>
                        <div><select value={l.unit} onChange={(e) => updateLine(idx, "unit", e.target.value)} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs bg-white">{UNIT_OPTIONS.map((u) => <option key={u}>{u}</option>)}</select></div>
                        <div><select value={l.weightBasis} onChange={(e) => updateLine(idx, "weightBasis", e.target.value)} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"><option value="condition">Cond. Wt</option><option value="net">Net Wt</option></select></div>
                        <div className="col-span-2"><input type="text" value={l.description} onChange={(e) => updateLine(idx, "description", e.target.value)} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs" placeholder="Description (auto from yarn)" /></div>
                        <div className="col-span-2 sm:col-span-3"><IncotermsInput compact value={l.incoterms} onChange={(v) => updateLine(idx, "incoterms", v)} /></div>
                        <div className="flex items-center justify-end text-xs font-mono text-slate-600">= {(parseQtyNum(l.quantity) * (parseFloat(l.unitPrice) || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* totals */}
              <div className="bg-slate-50 rounded-lg border border-slate-200 p-3 space-y-1 text-sm font-mono">
                <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span>{fmt(totals.subtotal, fCurrency)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">VAT ({parseFloat(fVatRate) || 0}%)</span><span>{fmt(totals.vat, fCurrency)}</span></div>
                <div className="flex justify-between text-base font-bold border-t border-slate-200 pt-1"><span>Total</span><span>{fmt(totals.total, fCurrency)}</span></div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <textarea value={fNotes} onChange={(e) => setFNotes(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" rows={2} />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">{saving ? "Saving…" : editing ? "Save Changes" : `Create ${docLabel}`}</button>
                <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export function InvoicesPage({ permissions }: { permissions: Permissions }) {
  return <InvoiceModule kind="sales" permissions={permissions} />;
}
export function SupplierInvoicesPage({ permissions }: { permissions: Permissions }) {
  return <InvoiceModule kind="supplier" permissions={permissions} />;
}
