"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { Permissions } from "@/lib/permissions";
import { IconDownload } from "@/components/Icons";

interface QuoteRow {
  id: number; quoteNo: string | null; customerId: number; customerName: string; customerCompany: string;
  yarnId: number; yarnName: string; yarnCount: string; micron: string; composition: string;
  factoryName: string; treatmentName: string;
  costPrice: number; quotedPrice: number; currency: string; unit: string;
  quoteDate: string; validUntil: string; incoterms: string; status: string; notes: string;
}
interface Customer { id: number; name: string; company: string; }
interface Yarn { id: number; yarnName: string; factoryName: string; yarnCount: string; micron: string; composition: string; treatmentName: string; latestPrice: number | null; latestCurrency: string | null; latestUnit: string | null; }
interface Props { permissions: Permissions; }
interface LineItem { id?: number; yarnId: number; costPrice: string; quotedPrice: string; currency: string; unit: string; incoterms: string; notes: string; }
interface QuoteGroup {
  quoteNo: string; customerId: number; customerName: string; customerCompany: string;
  quoteDate: string; validUntil: string; status: string;
  rows: QuoteRow[]; totalCost: number; totalQuoted: number; margin: number; marginPct: number;
}

const STATUS_COLORS: Record<string, string> = { Draft: "bg-slate-100 text-slate-700", Sent: "bg-blue-100 text-blue-800", Accepted: "bg-green-100 text-green-800", Rejected: "bg-red-100 text-red-800", Expired: "bg-amber-100 text-amber-800" };

function getEffectiveStatus(status: string, validUntil?: string) {
  if (!validUntil || !/^\d{4}-\d{2}-\d{2}$/.test(validUntil)) return status || "Draft";
  const today = new Date(); const todayIso = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())).toISOString().slice(0, 10);
  if (status !== "Accepted" && status !== "Rejected" && validUntil < todayIso) return "Expired";
  return status || "Draft";
}

function createQuoteNo() { const d = new Date(); return `QT-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`; }

// Yarn filter picker with 3 cascading search boxes
function YarnFilterPicker({ yarnList, value, onChange }: { yarnList: Yarn[]; value: number; onChange: (id: number) => void }) {
  const [nameQ, setNameQ] = useState("");
  const [countQ, setCountQ] = useState("");
  const [factoryQ, setFactoryQ] = useState("");
  const sel = yarnList.find((y) => y.id === value);

  const applyOther = useCallback((exclude: string) => {
    let r = yarnList;
    if (exclude !== "name" && nameQ) r = r.filter((y) => y.yarnName.toLowerCase().includes(nameQ.toLowerCase()));
    if (exclude !== "count" && countQ) r = r.filter((y) => (y.yarnCount || "").toLowerCase().includes(countQ.toLowerCase()));
    if (exclude !== "factory" && factoryQ) r = r.filter((y) => y.factoryName.toLowerCase().includes(factoryQ.toLowerCase()));
    return r;
  }, [yarnList, nameQ, countQ, factoryQ]);

  const nameOpts = useMemo(() => { const p = applyOther("name"); const n = [...new Set(p.map((y) => y.yarnName))].sort(); return nameQ ? n.filter((x) => x.toLowerCase().includes(nameQ.toLowerCase())) : n; }, [applyOther, nameQ]);
  const countOpts = useMemo(() => { const p = applyOther("count"); const c = [...new Set(p.map((y) => y.yarnCount).filter(Boolean))].sort(); return countQ ? c.filter((x) => x.toLowerCase().includes(countQ.toLowerCase())) : c; }, [applyOther, countQ]);
  const factoryOpts = useMemo(() => { const p = applyOther("factory"); const f = [...new Set(p.map((y) => y.factoryName))].sort(); return factoryQ ? f.filter((x) => x.toLowerCase().includes(factoryQ.toLowerCase())) : f; }, [applyOther, factoryQ]);

  const matched = useMemo(() => {
    let r = yarnList;
    if (nameQ) r = r.filter((y) => y.yarnName.toLowerCase().includes(nameQ.toLowerCase()));
    if (countQ) r = r.filter((y) => (y.yarnCount || "").toLowerCase().includes(countQ.toLowerCase()));
    if (factoryQ) r = r.filter((y) => y.factoryName.toLowerCase().includes(factoryQ.toLowerCase()));
    return r;
  }, [yarnList, nameQ, countQ, factoryQ]);

  const hasInput = nameQ || countQ || factoryQ;

  return (
    <div className="space-y-2">
      {sel && <div className="text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded flex items-center justify-between"><span>{sel.yarnName} · {sel.yarnCount || "—"} · {sel.factoryName} · {sel.composition || "—"} · {sel.treatmentName || "Untreated"}</span><button type="button" onClick={() => { onChange(0); setNameQ(""); setCountQ(""); setFactoryQ(""); }} className="text-blue-500 hover:text-blue-700 ml-2 text-xs">✕</button></div>}
      {!sel && (
        <>
          <div className="grid grid-cols-3 gap-1.5">
            <FilterInput label="Yarn Name" value={nameQ} onChange={(v) => { setNameQ(v); onChange(0); }} options={nameOpts} />
            <FilterInput label="Yarn Count" value={countQ} onChange={(v) => { setCountQ(v); onChange(0); }} options={countOpts} />
            <FilterInput label="Yarn Mill" value={factoryQ} onChange={(v) => { setFactoryQ(v); onChange(0); }} options={factoryOpts} />
          </div>
          {hasInput && matched.length > 0 && matched.length <= 15 && (
            <div className="bg-white border border-slate-200 rounded-lg max-h-32 overflow-y-auto">
              {matched.map((y) => (
                <button key={y.id} type="button" onClick={() => { onChange(y.id); setNameQ(y.yarnName); setCountQ(y.yarnCount || ""); setFactoryQ(y.factoryName); }} className="w-full text-left px-2 py-1.5 text-xs hover:bg-slate-50 border-b border-slate-50 last:border-0">
                  <span className="font-medium">{y.yarnName}</span>
                  <span className="text-slate-500"> · {y.yarnCount || "—"} · {y.factoryName} · {y.composition || "—"} · {y.treatmentName || "Untreated"}</span>
                </button>
              ))}
            </div>
          )}
          {hasInput && matched.length === 0 && <div className="text-xs text-slate-400 px-1">No yarn matches</div>}
          {hasInput && matched.length > 15 && <div className="text-xs text-slate-400 px-1">{matched.length} matches — type more to narrow down</div>}
        </>
      )}
    </div>
  );
}

function FilterInput({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  const [focused, setFocused] = useState(false);
  const show = focused && options.length > 0 && options.length <= 20;
  return (
    <div className="relative">
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} onFocus={() => setFocused(true)} onBlur={() => setTimeout(() => setFocused(false), 150)} className="w-full px-2 py-1 border border-slate-300 rounded text-[11px] bg-white focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder={label} />
      {show && (
        <div className="absolute z-40 w-full mt-0.5 bg-white border border-slate-200 rounded shadow-lg max-h-32 overflow-y-auto">
          {options.map((o) => <button key={o} type="button" onMouseDown={(e) => { e.preventDefault(); onChange(o); setFocused(false); }} className="w-full text-left px-2 py-1 text-[11px] hover:bg-slate-50 border-b border-slate-50 last:border-0">{o}</button>)}
        </div>
      )}
    </div>
  );
}

export default function QuotationsPage({ permissions }: Props) {
  const [rows, setRows] = useState<QuoteRow[]>([]);
  const [customerList, setCustomerList] = useState<Customer[]>([]);
  const [yarnList, setYarnList] = useState<Yarn[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showMulti, setShowMulti] = useState(false);
  const [editing, setEditing] = useState<QuoteRow | null>(null);
  const [editingGroup, setEditingGroup] = useState<QuoteGroup | null>(null);
  const [viewing, setViewing] = useState<QuoteGroup | null>(null);
  const [toast, setToast] = useState<{ type: string; text: string } | null>(null);
  const [search, setSearch] = useState(""); const [statusFilter, setStatusFilter] = useState(""); const [customerFilter, setCustomerFilter] = useState("");

  const [fCustomer, setFCustomer] = useState(0); const [fYarn, setFYarn] = useState(0); const [fCostPrice, setFCostPrice] = useState("");
  const [fQuotedPrice, setFQuotedPrice] = useState(""); const [fCurrency, setFCurrency] = useState("USD"); const [fUnit, setFUnit] = useState("per KG");
  const [fQuoteDate, setFQuoteDate] = useState(new Date().toISOString().split("T")[0]); const [fValidUntil, setFValidUntil] = useState("");
  const [fIncoterms, setFIncoterms] = useState(""); const [fStatus, setFStatus] = useState("Draft"); const [fNotes, setFNotes] = useState(""); const [saving, setSaving] = useState(false);

  const [mCustomer, setMCustomer] = useState(0);
  const [mQuoteDate, setMQuoteDate] = useState(new Date().toISOString().split("T")[0]); const [mValidUntil, setMValidUntil] = useState("");
  const [mStatus, setMStatus] = useState("Draft");
  const [mLines, setMLines] = useState<LineItem[]>([{ yarnId: 0, costPrice: "", quotedPrice: "", currency: "USD", unit: "per KG", incoterms: "", notes: "" }]);
  const [mSaving, setMSaving] = useState(false);

  const load = async () => { setLoading(true); const [q, c, y] = await Promise.all([fetch("/api/quotations").then((r) => r.json()), fetch("/api/customers").then((r) => r.json()), fetch("/api/yarns").then((r) => r.json())]); setRows(q); setCustomerList(c); setYarnList(y); setLoading(false); };
  useEffect(() => { load(); }, []);

  const groups = useMemo(() => {
    const map: Record<string, QuoteGroup> = {};
    for (const r of rows) { const qn = r.quoteNo || `LEGACY-${r.id}`; if (!map[qn]) { map[qn] = { quoteNo: qn, customerId: r.customerId, customerName: r.customerName, customerCompany: r.customerCompany, quoteDate: r.quoteDate, validUntil: r.validUntil, status: r.status, rows: [], totalCost: 0, totalQuoted: 0, margin: 0, marginPct: 0 }; } map[qn].rows.push(r); map[qn].totalCost += r.costPrice; map[qn].totalQuoted += r.quotedPrice; }
    for (const g of Object.values(map)) { g.margin = g.totalQuoted - g.totalCost; g.marginPct = g.totalCost ? (g.margin / g.totalCost) * 100 : 0; }
    return Object.values(map).sort((a, b) => b.quoteDate.localeCompare(a.quoteDate) || b.quoteNo.localeCompare(a.quoteNo));
  }, [rows]);

  const filtered = useMemo(() => {
    let r = groups;
    if (statusFilter) r = r.filter((q) => q.status === statusFilter);
    if (customerFilter) r = r.filter((q) => String(q.customerId) === customerFilter);
    if (search.trim()) { const s = search.toLowerCase(); r = r.filter((q) => q.customerName?.toLowerCase().includes(s) || q.quoteNo.toLowerCase().includes(s) || q.rows.some((row) => row.yarnName?.toLowerCase().includes(s) || row.factoryName?.toLowerCase().includes(s) || (row.composition || "").toLowerCase().includes(s))); }
    return r;
  }, [groups, statusFilter, customerFilter, search]);

  const selectedYarnData = useMemo(() => yarnList.find((y) => y.id === fYarn), [yarnList, fYarn]);
  useEffect(() => { if (selectedYarnData?.latestPrice != null && !editing) { setFCostPrice(String(selectedYarnData.latestPrice)); if (selectedYarnData.latestCurrency) setFCurrency(selectedYarnData.latestCurrency); if (selectedYarnData.latestUnit) setFUnit(selectedYarnData.latestUnit); } }, [selectedYarnData, editing]);
  const margin = fCostPrice && fQuotedPrice ? parseFloat(fQuotedPrice) - parseFloat(fCostPrice) : null;
  const marginPct = margin != null && parseFloat(fCostPrice) ? (margin / parseFloat(fCostPrice)) * 100 : null;

  const openForm = (r?: QuoteRow) => { if (r) { setEditing(r); setFCustomer(r.customerId); setFYarn(r.yarnId); setFCostPrice(String(r.costPrice)); setFQuotedPrice(String(r.quotedPrice)); setFCurrency(r.currency || "USD"); setFUnit(r.unit || "per KG"); setFQuoteDate(r.quoteDate); setFValidUntil(r.validUntil || ""); setFIncoterms(r.incoterms || ""); setFStatus(r.status || "Draft"); setFNotes(r.notes || ""); } else { setEditing(null); setFCustomer(0); setFYarn(0); setFCostPrice(""); setFQuotedPrice(""); setFCurrency("USD"); setFUnit("per KG"); setFQuoteDate(new Date().toISOString().split("T")[0]); setFValidUntil(""); setFIncoterms(""); setFStatus("Draft"); setFNotes(""); } setShowForm(true); };

  const openMultiForm = (group?: QuoteGroup) => {
    if (group) {
      setEditingGroup(group); setMCustomer(group.customerId);
      setMQuoteDate(group.quoteDate || new Date().toISOString().split("T")[0]); setMValidUntil(group.validUntil || "");
      setMStatus(group.status || "Draft");
      setMLines(group.rows.map((r) => ({ id: r.id, yarnId: r.yarnId, costPrice: String(r.costPrice), quotedPrice: String(r.quotedPrice), currency: r.currency || "USD", unit: r.unit || "per KG", incoterms: r.incoterms || "", notes: r.notes || "" })));
    } else {
      setEditingGroup(null); setMCustomer(0);
      setMQuoteDate(new Date().toISOString().split("T")[0]); setMValidUntil("");
      setMStatus("Draft");
      setMLines([{ yarnId: 0, costPrice: "", quotedPrice: "", currency: "USD", unit: "per KG", incoterms: "", notes: "" }]);
    }
    setShowMulti(true);
  };

  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); if (!fCustomer || !fYarn || !fCostPrice || !fQuotedPrice) return; setSaving(true); const res = await fetch("/api/quotations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editing?.id, quoteNo: editing?.quoteNo, customerId: fCustomer, yarnId: fYarn, costPrice: fCostPrice, quotedPrice: fQuotedPrice, currency: fCurrency, unit: fUnit, quoteDate: fQuoteDate, validUntil: fValidUntil, incoterms: fIncoterms, status: fStatus, notes: fNotes }) }); if (res.ok) { setToast({ type: "success", text: editing ? "Updated" : "Created" }); setShowForm(false); load(); } else { const d = await res.json().catch(() => ({ error: "Failed" })); setToast({ type: "error", text: d.error || "Failed" }); } setSaving(false); setTimeout(() => setToast(null), 3000); };

  const updateLine = (idx: number, field: keyof LineItem, value: string) => setMLines((p) => p.map((l, i) => i === idx ? { ...l, [field]: value } : l));
  const addLine = () => setMLines((p) => [...p, { yarnId: 0, costPrice: "", quotedPrice: "", currency: "USD", unit: "per KG", incoterms: "", notes: "" }]);
  const removeLine = (idx: number) => setMLines((p) => p.filter((_, i) => i !== idx));
  const handleLineYarnChange = (idx: number, yarnId: number) => { const yarn = yarnList.find((y) => y.id === yarnId); setMLines((p) => p.map((l, i) => i !== idx ? l : { ...l, yarnId, costPrice: yarn?.latestPrice != null ? String(yarn.latestPrice) : "" })); };
  const validLineCount = mLines.filter((l) => l.yarnId && l.costPrice && l.quotedPrice).length;

  const handleMultiSubmit = async () => {
    if (!mCustomer) { setToast({ type: "error", text: "Select a customer" }); return; }
    const validLines = mLines.filter((l) => l.yarnId && l.costPrice && l.quotedPrice);
    if (validLines.length === 0) { setToast({ type: "error", text: "Add at least one yarn with prices" }); return; }
    const quoteNo = editingGroup?.quoteNo || createQuoteNo(); setMSaving(true);
    try {
      if (editingGroup) { const origIds = editingGroup.rows.map((r) => r.id); const curIds = validLines.map((l) => l.id).filter(Boolean) as number[]; for (const id of origIds.filter((id) => !curIds.includes(id))) await fetch(`/api/quotations?id=${id}`, { method: "DELETE" }); }
      let processed = 0; let firstError = "";
      for (const line of validLines) { const res = await fetch("/api/quotations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: line.id, quoteNo, customerId: mCustomer, yarnId: line.yarnId, costPrice: line.costPrice, quotedPrice: line.quotedPrice, currency: line.currency, unit: line.unit, quoteDate: mQuoteDate, validUntil: mValidUntil, incoterms: line.incoterms, status: mStatus, notes: line.notes }) }); if (res.ok) processed++; else if (!firstError) { const d = await res.json().catch(() => ({ error: "Failed" })); firstError = d.error || "Failed"; } }
      if (processed === 0) { setToast({ type: "error", text: firstError || "Failed" }); } else { setToast({ type: "success", text: `${editingGroup ? "Updated" : "Created"} ${quoteNo} (${processed} items)` }); setShowMulti(false); setEditingGroup(null); setMLines([{ yarnId: 0, costPrice: "", quotedPrice: "", currency: "USD", unit: "per KG", incoterms: "", notes: "" }]); load(); }
    } catch { setToast({ type: "error", text: "Failed to save" }); }
    setMSaving(false); setTimeout(() => setToast(null), 4000);
  };

  const handleDelete = async (quoteNo: string) => { if (!confirm(`Delete ${quoteNo}?`)) return; await fetch(`/api/quotations?quoteNo=${encodeURIComponent(quoteNo)}`, { method: "DELETE" }); load(); };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
        <div><h1 className="text-2xl font-bold text-slate-900">Quotations</h1><p className="text-sm text-slate-500">{filtered.length} quotation(s)</p></div>
        <div className="flex gap-2 flex-wrap">{permissions.canEdit && (<><button onClick={() => openMultiForm()} className="px-3 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300">+ Multi-Item Quote</button><button onClick={() => openForm()} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">+ New Quote</button></>)}</div>
      </div>
      {toast && <div className={`mb-4 p-3 rounded-lg text-sm ${toast.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>{toast.text}</div>}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Search quotation no, customer, yarn, yarn mill..." />
        <select value={customerFilter} onChange={(e) => setCustomerFilter(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"><option value="">All Customers</option>{customerList.map((c) => <option key={c.id} value={String(c.id)}>{c.name}</option>)}</select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"><option value="">All Status</option><option>Draft</option><option>Sent</option><option>Accepted</option><option>Rejected</option><option>Expired</option></select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="bg-slate-50 text-left text-slate-600"><th className="px-4 py-3 font-medium">Quotation No.</th><th className="px-4 py-3 font-medium">Customer</th><th className="px-4 py-3 font-medium text-center">Items</th><th className="px-4 py-3 font-medium">Quality</th><th className="px-4 py-3 font-medium">Quote Date</th><th className="px-4 py-3 font-medium">Valid Until</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium w-32">Actions</th></tr></thead>
          <tbody>
            {filtered.length === 0 ? <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400">No quotations</td></tr> : filtered.map((q) => { const ds = getEffectiveStatus(q.status, q.validUntil); return (
              <tr key={q.quoteNo} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">{q.quoteNo}</td>
                <td className="px-4 py-3"><div className="font-medium">{q.customerName}</div><div className="text-xs text-slate-500">{q.customerCompany || ""}</div></td>
                <td className="px-4 py-3 text-center">{q.rows.length}</td>
                <td className="px-4 py-3 text-slate-600 text-xs max-w-[320px]"><div className="space-y-1">{q.rows.map((r) => <div key={r.id} className="truncate">{r.yarnCount || "—"} · {r.composition || "—"} · {r.micron ? `${r.micron}μm` : "—"} · {r.treatmentName || "Untreated"}</div>)}</div></td>
                <td className="px-4 py-3 text-slate-600 text-xs">{q.quoteDate}</td>
                <td className="px-4 py-3 text-slate-600 text-xs">{q.validUntil || "—"}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[ds] || "bg-slate-100 text-slate-700"}`}>{ds}</span></td>
                <td className="px-4 py-3"><div className="flex gap-2 flex-wrap"><button onClick={() => setViewing(q)} className="text-slate-600 hover:text-slate-900 text-xs">View</button><a href={`/api/export/quotation?quoteNo=${encodeURIComponent(q.quoteNo)}`} className="text-slate-600 hover:text-slate-900 text-xs inline-flex items-center gap-1"><IconDownload className="w-3 h-3" />Export</a>{permissions.canEdit && <button onClick={() => openMultiForm(q)} className="text-blue-600 hover:text-blue-800 text-xs">Edit</button>}{permissions.canDelete && <button onClick={() => handleDelete(q.quoteNo)} className="text-red-500 hover:text-red-700 text-xs">Del</button>}</div></td>
              </tr>); })}
          </tbody>
        </table>
      </div>

      {/* View */}
      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setViewing(null)}><div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <div className="p-4 border-b border-slate-200 flex items-center justify-between"><div><h2 className="text-lg font-semibold">Quotation Detail</h2><p className="text-xs text-slate-500 mt-0.5">{viewing.quoteNo}</p></div><button onClick={() => setViewing(null)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button></div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm"><div><span className="text-slate-500 text-xs block">Customer</span><div className="font-medium">{viewing.customerName}</div><div className="text-xs text-slate-400">{viewing.customerCompany || ""}</div></div><div><span className="text-slate-500 text-xs block">Status</span><div><span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[getEffectiveStatus(viewing.status, viewing.validUntil)] || ""}`}>{getEffectiveStatus(viewing.status, viewing.validUntil)}</span></div></div><div><span className="text-slate-500 text-xs block">Quote Date</span><div>{viewing.quoteDate}</div></div><div><span className="text-slate-500 text-xs block">Valid Until</span><div>{viewing.validUntil || "—"}</div></div></div>
            <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-slate-600"><th className="px-4 py-3 font-medium">Yarn</th><th className="px-4 py-3 font-medium">Count</th><th className="px-4 py-3 font-medium">Micron</th><th className="px-4 py-3 font-medium">Composition</th><th className="px-4 py-3 font-medium">Treatment</th><th className="px-4 py-3 font-medium">Incoterms</th><th className="px-4 py-3 font-medium text-right">Cost</th><th className="px-4 py-3 font-medium text-right">Quoted</th><th className="px-4 py-3 font-medium text-right">Margin</th><th className="px-4 py-3 font-medium">Notes</th></tr></thead><tbody>
              {viewing.rows.map((r) => { const m = r.quotedPrice - r.costPrice; const mp = r.costPrice ? (m / r.costPrice) * 100 : 0; return (<tr key={r.id} className="border-t border-slate-200"><td className="px-4 py-3"><div className="font-medium">{r.yarnName}</div><div className="text-xs text-slate-400">{r.factoryName}</div></td><td className="px-4 py-3">{r.yarnCount || "—"}</td><td className="px-4 py-3">{r.micron ? r.micron + "μm" : "—"}</td><td className="px-4 py-3">{r.composition || "—"}</td><td className="px-4 py-3">{r.treatmentName || "Untreated"}</td><td className="px-4 py-3"><span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs font-medium border border-blue-200">{r.incoterms || "—"}</span></td><td className="px-4 py-3 text-right font-mono text-slate-500">{r.currency} {r.costPrice.toFixed(2)}<span className="text-slate-400 text-[10px]">/{(r.unit || "per KG").replace("per ", "")}</span></td><td className="px-4 py-3 text-right font-mono font-medium">{r.currency} {r.quotedPrice.toFixed(2)}<span className="text-slate-400 text-[10px]">/{(r.unit || "per KG").replace("per ", "")}</span></td><td className={`px-4 py-3 text-right font-mono text-xs font-medium ${m > 0 ? "text-green-600" : "text-red-500"}`}>{m > 0 ? "+" : ""}{m.toFixed(2)} ({mp.toFixed(1)}%)</td><td className="px-4 py-3 text-xs text-slate-500 max-w-[220px] whitespace-pre-line">{r.notes || "—"}</td></tr>); })}
            </tbody></table></div>
            <div className="pt-2 flex gap-2"><a href={`/api/export/quotation?quoteNo=${encodeURIComponent(viewing.quoteNo)}`} className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-300 inline-flex items-center gap-1.5"><IconDownload className="w-3.5 h-3.5" /> Export</a>{permissions.canEdit && <button onClick={() => { setViewing(null); openMultiForm(viewing); }} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700">Edit</button>}</div>
          </div>
        </div></div>
      )}

      {/* Single form */}
      {showForm && permissions.canEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowForm(false)}><div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <div className="p-4 border-b border-slate-200 flex items-center justify-between"><h2 className="text-lg font-semibold">{editing ? "Edit Quote Item" : "New Quote Item"}</h2><button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button></div>
          <form onSubmit={handleSubmit} className="p-4 space-y-3">
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Customer *</label><select value={fCustomer} onChange={(e) => setFCustomer(Number(e.target.value))} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" required><option value={0}>Select...</option>{customerList.map((c) => <option key={c.id} value={c.id}>{c.name}{c.company ? ` — ${c.company}` : ""}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Yarn *</label><YarnFilterPicker yarnList={yarnList} value={fYarn} onChange={setFYarn} />{selectedYarnData?.latestPrice != null && !editing && <p className="text-xs text-slate-500 mt-1">Latest cost: {selectedYarnData.latestCurrency} {selectedYarnData.latestPrice.toFixed(2)}/{(selectedYarnData.latestUnit || "per KG").replace("per ", "")}</p>}</div>
            <div className="grid grid-cols-2 gap-3"><div><label className="block text-sm font-medium text-slate-700 mb-1">Cost *</label><input type="number" step="0.01" value={fCostPrice} onChange={(e) => setFCostPrice(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" required /></div><div><label className="block text-sm font-medium text-slate-700 mb-1">Quoted *</label><input type="number" step="0.01" value={fQuotedPrice} onChange={(e) => setFQuotedPrice(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" required /></div></div>
            {margin != null && <div className={`p-2 rounded-lg text-sm font-mono ${margin > 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>Margin: {margin > 0 ? "+" : ""}{margin.toFixed(2)} {fCurrency}/{fUnit.replace("per ", "")} ({marginPct?.toFixed(1)}%)</div>}
            <div className="grid grid-cols-3 gap-3"><div><label className="block text-sm font-medium text-slate-700 mb-1">Currency</label><select value={fCurrency} onChange={(e) => setFCurrency(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"><option>USD</option><option>EUR</option><option>GBP</option><option>CNY</option><option>JPY</option></select></div><div><label className="block text-sm font-medium text-slate-700 mb-1">Unit</label><select value={fUnit} onChange={(e) => setFUnit(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"><option>per KG</option><option>per LB</option><option>per Cone</option></select></div><div><label className="block text-sm font-medium text-slate-700 mb-1">Incoterms</label><input type="text" value={fIncoterms} onChange={(e) => setFIncoterms(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div></div>
            <div className="grid grid-cols-2 gap-3"><div><label className="block text-sm font-medium text-slate-700 mb-1">Quote Date *</label><input type="date" value={fQuoteDate} onChange={(e) => setFQuoteDate(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" required /></div><div><label className="block text-sm font-medium text-slate-700 mb-1">Valid Until</label><input type="date" value={fValidUntil} onChange={(e) => setFValidUntil(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Status</label><select value={fStatus} onChange={(e) => setFStatus(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"><option>Draft</option><option>Sent</option><option>Accepted</option><option>Rejected</option><option>Expired</option></select></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Notes</label><textarea value={fNotes} onChange={(e) => setFNotes(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" rows={3} /></div>
            <div className="flex gap-3 pt-2"><button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">{saving ? "Saving..." : editing ? "Update" : "Create Quote"}</button><button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300">Cancel</button></div>
          </form>
        </div></div>
      )}

      {/* Multi form — each line has its own currency/unit/incoterms */}
      {showMulti && permissions.canEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => { setShowMulti(false); setEditingGroup(null); }}><div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <div className="p-4 border-b border-slate-200 flex items-center justify-between"><div><h2 className="text-lg font-semibold">{editingGroup ? "Edit Quotation" : "Multi-Item Quotation"}</h2>{editingGroup && <p className="text-xs text-slate-500 mt-0.5">{editingGroup.quoteNo}</p>}</div><button onClick={() => { setShowMulti(false); setEditingGroup(null); }} className="text-slate-400 hover:text-slate-600 text-xl">✕</button></div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Customer *</label><select value={mCustomer} onChange={(e) => setMCustomer(Number(e.target.value))} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"><option value={0}>Select...</option>{customerList.map((c) => <option key={c.id} value={c.id}>{c.name}{c.company ? ` — ${c.company}` : ""}</option>)}</select></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Quote Date</label><input type="date" value={mQuoteDate} onChange={(e) => setMQuoteDate(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Valid Until</label><input type="date" value={mValidUntil} onChange={(e) => setMValidUntil(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select value={mStatus} onChange={(e) => setMStatus(e.target.value)} className="w-48 px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"><option>Draft</option><option>Sent</option><option>Accepted</option><option>Rejected</option><option>Expired</option></select>
            </div>

            <div className="border-t border-slate-200 pt-4">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Items ({mLines.length})</h3>
              <div className="space-y-3">
                {mLines.map((line, idx) => {
                  const yarn = yarnList.find((y) => y.id === line.yarnId);
                  const lm = line.costPrice && line.quotedPrice ? parseFloat(line.quotedPrice) - parseFloat(line.costPrice) : null;
                  const lmp = lm != null && parseFloat(line.costPrice) ? (lm / parseFloat(line.costPrice)) * 100 : null;
                  return (
                    <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="flex items-center justify-between mb-2"><span className="text-xs font-medium text-slate-500">Item {idx + 1}</span>{mLines.length > 1 && <button type="button" onClick={() => removeLine(idx)} className="text-xs text-red-500 hover:text-red-700">Remove</button>}</div>
                      <YarnFilterPicker yarnList={yarnList} value={line.yarnId} onChange={(id) => handleLineYarnChange(idx, id)} />
                      {yarn?.latestPrice != null && <p className="text-[10px] text-slate-400 mt-1">Latest: {yarn.latestCurrency} {yarn.latestPrice.toFixed(2)}</p>}
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div><input type="number" step="0.01" value={line.costPrice} onChange={(e) => updateLine(idx, "costPrice", e.target.value)} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs" placeholder="Cost" /></div>
                        <div><input type="number" step="0.01" value={line.quotedPrice} onChange={(e) => updateLine(idx, "quotedPrice", e.target.value)} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs" placeholder="Quoted" /></div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        <div><select value={line.currency} onChange={(e) => updateLine(idx, "currency", e.target.value)} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"><option>USD</option><option>EUR</option><option>GBP</option><option>CNY</option><option>JPY</option></select></div>
                        <div><select value={line.unit} onChange={(e) => updateLine(idx, "unit", e.target.value)} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"><option>per KG</option><option>per LB</option><option>per Cone</option></select></div>
                        <div><input type="text" value={line.incoterms} onChange={(e) => updateLine(idx, "incoterms", e.target.value)} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs" placeholder="Incoterms (e.g. FOB)" /></div>
                      </div>
                      {lm != null && <div className={`mt-1 text-xs font-mono ${lm > 0 ? "text-green-600" : "text-red-500"}`}>Margin: {lm > 0 ? "+" : ""}{lm.toFixed(2)} {line.currency}/{line.unit.replace("per ", "")} ({lmp?.toFixed(1)}%)</div>}
                      <input type="text" value={line.notes} onChange={(e) => updateLine(idx, "notes", e.target.value)} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs mt-2" placeholder="Notes (optional)" />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-3 pt-2 border-t border-slate-200"><button onClick={handleMultiSubmit} disabled={mSaving} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">{mSaving ? "Saving..." : `${editingGroup ? "Update" : "Create"} ${validLineCount} Item(s)`}</button><button type="button" onClick={addLine} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300">+ Add Item</button><button onClick={() => { setShowMulti(false); setEditingGroup(null); }} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300">Cancel</button></div>
          </div>
        </div></div>
      )}
    </div>
  );
}
