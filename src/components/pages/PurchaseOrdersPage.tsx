"use client";
import { useState, useEffect, useMemo } from "react";
import { Permissions } from "@/lib/permissions";
import { IconDownload } from "@/components/Icons";

interface POItem { id?: number; yarnId: number; yarnName?: string; yarnCount?: string; micron?: string; composition?: string; treatmentName?: string; color: string; quantity: string; unitPrice: string; notes: string; }
interface PO { id: number; poNo: string; factoryId: number; factoryName: string; customerId: number; customerName: string; contactPerson: string; quoteNo: string; currency: string; unit: string; poDate: string; deliveryDate: string; incoterms: string; status: string; notes: string; items: POItem[]; totalAmount: number; itemCount: number; }
interface Factory { id: number; factoryName: string; relationship: string; }
interface Customer { id: number; name: string; company: string; }
interface Yarn { id: number; yarnName: string; factoryName: string; yarnCount: string; micron: string; composition: string; treatmentName: string; latestPrice: number | null; latestCurrency: string | null; latestUnit: string | null; }
interface QuoteDoc { quoteNo: string; customerId: number; customerName: string; quoteDate: string; status: string; }
interface Props { permissions: Permissions; }
interface FormItem { yarnId: number; color: string; quantity: string; unitPrice: string; notes: string; }

const STATUS_COLORS: Record<string, string> = { Draft: "bg-slate-100 text-slate-700", Confirmed: "bg-blue-100 text-blue-800", Shipped: "bg-amber-100 text-amber-800", Received: "bg-green-100 text-green-800", Closed: "bg-slate-200 text-slate-600", Cancelled: "bg-red-100 text-red-800" };

function YarnPicker({ value, yarnList, onChange }: { value: number; yarnList: Yarn[]; onChange: (id: number) => void }) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const sel = yarnList.find((y) => y.id === value);
  useEffect(() => { if (sel && !focused) setQuery(`${sel.yarnName} · ${sel.yarnCount || "—"} · ${sel.composition || "—"}`); else if (!value && !focused) setQuery(""); }, [sel, value, focused]);
  const filtered = useMemo(() => { if (!query.trim()) return yarnList.slice(0, 20); const q = query.toLowerCase(); return yarnList.filter((y) => y.yarnName.toLowerCase().includes(q) || (y.yarnCount || "").toLowerCase().includes(q) || (y.micron || "").includes(q) || (y.composition || "").toLowerCase().includes(q) || (y.treatmentName || "").toLowerCase().includes(q) || y.factoryName.toLowerCase().includes(q)).slice(0, 20); }, [yarnList, query]);
  return (
    <div className="relative">
      <input type="text" value={query} onChange={(e) => { setQuery(e.target.value); if (value) onChange(0); }} onFocus={() => { setFocused(true); setQuery(""); }} onBlur={() => setTimeout(() => setFocused(false), 150)} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Search yarn..." />
      {focused && <div className="absolute z-30 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">{filtered.length === 0 ? <div className="px-3 py-2 text-xs text-slate-400">No match</div> : filtered.map((y) => <button key={y.id} type="button" onMouseDown={(e) => { e.preventDefault(); onChange(y.id); setQuery(`${y.yarnName} · ${y.yarnCount || "—"} · ${y.composition || "—"}`); setFocused(false); }} className="w-full text-left px-2 py-1.5 text-xs hover:bg-slate-50 border-b border-slate-50 last:border-0"><div className="font-medium">{y.yarnName}</div><div className="text-[10px] text-slate-500">{y.factoryName} · {y.yarnCount || "—"} · {y.micron ? y.micron + "μm" : "—"} · {y.composition || "—"} · {y.treatmentName || "Untreated"}</div></button>)}</div>}
    </div>
  );
}

export default function PurchaseOrdersPage({ permissions }: Props) {
  const [pos, setPOs] = useState<PO[]>([]);
  const [factoryList, setFactoryList] = useState<Factory[]>([]);
  const [customerList, setCustomerList] = useState<Customer[]>([]);
  const [yarnList, setYarnList] = useState<Yarn[]>([]);
  const [allQuotes, setAllQuotes] = useState<QuoteDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPO, setEditingPO] = useState<PO | null>(null);
  const [viewing, setViewing] = useState<PO | null>(null);
  const [toast, setToast] = useState<{ type: string; text: string } | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [saving, setSaving] = useState(false);

  const [fFactory, setFFactory] = useState(0);
  const [fCustomer, setFCustomer] = useState(0);
  const [fContactPerson, setFContactPerson] = useState("");
  const [fQuoteNo, setFQuoteNo] = useState("");
  const [fCurrency, setFCurrency] = useState("USD");
  const [fUnit, setFUnit] = useState("per KG");
  const [fPoDate, setFPoDate] = useState(new Date().toISOString().split("T")[0]);
  const [fDeliveryDate, setFDeliveryDate] = useState("");
  const [fIncoterms, setFIncoterms] = useState("");
  const [fStatus, setFStatus] = useState("Draft");
  const [fNotes, setFNotes] = useState("");
  const [fItems, setFItems] = useState<FormItem[]>([{ yarnId: 0, color: "", quantity: "", unitPrice: "", notes: "" }]);

  const load = async () => {
    setLoading(true);
    const [p, f, c, y, q] = await Promise.all([
      fetch("/api/purchase-orders").then((r) => r.json()),
      fetch("/api/factories").then((r) => r.json()),
      fetch("/api/customers").then((r) => r.json()),
      fetch("/api/yarns").then((r) => r.json()),
      fetch("/api/quotations").then((r) => r.json()),
    ]);
    setPOs(p); setFactoryList(f); setCustomerList(c); setYarnList(y);
    // Build unique quote docs from raw quotation rows
    const qMap: Record<string, QuoteDoc> = {};
    for (const row of q) {
      const no = row.quoteNo || `LEGACY-${row.id}`;
      if (!qMap[no]) qMap[no] = { quoteNo: no, customerId: row.customerId, customerName: row.customerName, quoteDate: row.quoteDate, status: row.status };
    }
    setAllQuotes(Object.values(qMap));
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filteredQuotes = useMemo(() => {
    if (!fCustomer) return allQuotes;
    return allQuotes.filter((q) => q.customerId === fCustomer);
  }, [allQuotes, fCustomer]);

  const filtered = useMemo(() => {
    let r = pos;
    if (statusFilter) r = r.filter((p) => p.status === statusFilter);
    if (search.trim()) { const s = search.toLowerCase(); r = r.filter((p) => (p.poNo || "").toLowerCase().includes(s) || (p.factoryName || "").toLowerCase().includes(s) || (p.customerName || "").toLowerCase().includes(s) || (p.contactPerson || "").toLowerCase().includes(s) || p.items.some((i) => (i.yarnName || "").toLowerCase().includes(s) || (i.color || "").toLowerCase().includes(s))); }
    return r;
  }, [pos, statusFilter, search]);

  const openForm = (po?: PO) => {
    if (po) {
      setEditingPO(po); setFFactory(po.factoryId); setFCustomer(po.customerId || 0); setFContactPerson(po.contactPerson || ""); setFQuoteNo(po.quoteNo || "");
      setFCurrency(po.currency || "USD"); setFUnit(po.unit || "per KG"); setFPoDate(po.poDate); setFDeliveryDate(po.deliveryDate || "");
      setFIncoterms(po.incoterms || ""); setFStatus(po.status || "Draft"); setFNotes(po.notes || "");
      setFItems(po.items.map((i) => ({ yarnId: i.yarnId, color: i.color || "", quantity: i.quantity || "", unitPrice: String(i.unitPrice), notes: i.notes || "" })));
    } else {
      setEditingPO(null); setFFactory(0); setFCustomer(0); setFContactPerson(""); setFQuoteNo(""); setFCurrency("USD"); setFUnit("per KG");
      setFPoDate(new Date().toISOString().split("T")[0]); setFDeliveryDate(""); setFIncoterms(""); setFStatus("Draft"); setFNotes("");
      setFItems([{ yarnId: 0, color: "", quantity: "", unitPrice: "", notes: "" }]);
    }
    setShowForm(true);
  };

  const updateItem = (idx: number, field: keyof FormItem, value: string) => setFItems((p) => p.map((l, i) => i === idx ? { ...l, [field]: value } : l));
  const addItem = () => setFItems((p) => [...p, { yarnId: 0, color: "", quantity: "", unitPrice: "", notes: "" }]);
  const removeItem = (idx: number) => setFItems((p) => p.filter((_, i) => i !== idx));
  const handleItemYarnChange = (idx: number, yarnId: number) => {
    const yarn = yarnList.find((y) => y.id === yarnId);
    setFItems((p) => p.map((l, i) => i !== idx ? l : { ...l, yarnId, unitPrice: yarn?.latestPrice != null ? String(yarn.latestPrice) : "" }));
  };
  const validItemCount = fItems.filter((i) => i.yarnId && i.unitPrice).length;

  const handleSubmit = async () => {
    if (!fFactory || !fPoDate) { setToast({ type: "error", text: "Factory and PO date are required" }); return; }
    const validItems = fItems.filter((i) => i.yarnId && i.unitPrice);
    if (validItems.length === 0) { setToast({ type: "error", text: "Add at least one item" }); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/purchase-orders", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingPO?.id, poNo: editingPO?.poNo, factoryId: fFactory, customerId: fCustomer || null, contactPerson: fContactPerson, quoteNo: fQuoteNo, currency: fCurrency, unit: fUnit, poDate: fPoDate, deliveryDate: fDeliveryDate, incoterms: fIncoterms, status: fStatus, notes: fNotes, items: validItems }),
      });
      if (res.ok) {
        const d = await res.json();
        setToast({ type: "success", text: `${editingPO ? "Updated" : "Created"} PO ${d.poNo || ""}` });
        setShowForm(false); load();
      } else {
        const d = await res.json().catch(() => ({ error: "Failed" }));
        setToast({ type: "error", text: d.error || "Failed" });
      }
    } catch { setToast({ type: "error", text: "Connection error" }); }
    setSaving(false); setTimeout(() => setToast(null), 4000);
  };

  const handleDelete = async (id: number) => { if (!confirm("Delete this purchase order and all its items?")) return; await fetch(`/api/purchase-orders?id=${id}`, { method: "DELETE" }); load(); };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
        <div><h1 className="text-2xl font-bold text-slate-900">Purchase Orders</h1><p className="text-sm text-slate-500">{filtered.length} order(s)</p></div>
        {permissions.canEdit && <button onClick={() => openForm()} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">+ New PO</button>}
      </div>
      {toast && <div className={`mb-4 p-3 rounded-lg text-sm ${toast.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>{toast.text}</div>}

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Search PO no, factory, customer, contact, yarn, color..." />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"><option value="">All Status</option><option>Draft</option><option>Confirmed</option><option>Shipped</option><option>Received</option><option>Closed</option><option>Cancelled</option></select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="bg-slate-50 text-left text-slate-600"><th className="px-4 py-3 font-medium">PO No.</th><th className="px-4 py-3 font-medium">Factory</th><th className="px-4 py-3 font-medium">Customer</th><th className="px-4 py-3 font-medium">Contact</th><th className="px-4 py-3 font-medium text-center">Items</th><th className="px-4 py-3 font-medium">PO Date</th><th className="px-4 py-3 font-medium">Delivery</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium w-32">Actions</th></tr></thead>
          <tbody>
            {filtered.length === 0 ? <tr><td colSpan={9} className="px-4 py-8 text-center text-slate-400">No purchase orders</td></tr> :
              filtered.map((p) => (
                <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{p.poNo}</td>
                  <td className="px-4 py-3">{p.factoryName || "—"}</td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{p.customerName || "—"}</td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{p.contactPerson || "—"}</td>
                  <td className="px-4 py-3 text-center">{p.itemCount}</td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{p.poDate}</td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{p.deliveryDate || "—"}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[p.status] || "bg-slate-100 text-slate-700"}`}>{p.status}</span></td>
                  <td className="px-4 py-3"><div className="flex gap-2 flex-wrap">
                    <button onClick={() => setViewing(p)} className="text-slate-600 hover:text-slate-900 text-xs">View</button>
                    <a href={`/api/export/po?id=${p.id}`} className="text-slate-600 hover:text-slate-900 text-xs inline-flex items-center gap-1"><IconDownload className="w-3 h-3" />Export</a>
                    {permissions.canEdit && <button onClick={() => openForm(p)} className="text-blue-600 hover:text-blue-800 text-xs">Edit</button>}
                    {permissions.canDelete && <button onClick={() => handleDelete(p.id)} className="text-red-500 hover:text-red-700 text-xs">Del</button>}
                  </div></td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* View modal */}
      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between"><div><h2 className="text-lg font-semibold">Purchase Order Detail</h2><p className="text-xs text-slate-500 mt-0.5">{viewing.poNo}</p></div><button onClick={() => setViewing(null)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button></div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div><span className="text-slate-500 text-xs block">Factory</span><div className="font-medium">{viewing.factoryName || "—"}</div></div>
                <div><span className="text-slate-500 text-xs block">Customer</span><div className="font-medium">{viewing.customerName || "—"}</div></div>
                <div><span className="text-slate-500 text-xs block">Contact Person</span><div className="font-medium">{viewing.contactPerson || "—"}</div></div>
                <div><span className="text-slate-500 text-xs block">Status</span><div><span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[viewing.status] || ""}`}>{viewing.status}</span></div></div>
                <div><span className="text-slate-500 text-xs block">PO Date</span><div>{viewing.poDate}</div></div>
                <div><span className="text-slate-500 text-xs block">Delivery Date</span><div>{viewing.deliveryDate || "—"}</div></div>
                <div><span className="text-slate-500 text-xs block">Incoterms</span><div>{viewing.incoterms || "—"}</div></div>
                {viewing.quoteNo && <div><span className="text-slate-500 text-xs block">Linked Quote</span><div>{viewing.quoteNo}</div></div>}
              </div>
              <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-slate-600"><th className="px-4 py-3 font-medium">Yarn</th><th className="px-4 py-3 font-medium">Count</th><th className="px-4 py-3 font-medium">Composition</th><th className="px-4 py-3 font-medium">Treatment</th><th className="px-4 py-3 font-medium">Color</th><th className="px-4 py-3 font-medium">Quantity</th><th className="px-4 py-3 font-medium text-right">Unit Price</th><th className="px-4 py-3 font-medium">Notes</th></tr></thead>
                  <tbody>
                    {viewing.items.map((item, i) => (
                      <tr key={i} className="border-t border-slate-200">
                        <td className="px-4 py-3 font-medium">{item.yarnName || "—"}</td>
                        <td className="px-4 py-3">{item.yarnCount || "—"}</td>
                        <td className="px-4 py-3">{item.composition || "—"}</td>
                        <td className="px-4 py-3">{item.treatmentName || "Untreated"}</td>
                        <td className="px-4 py-3 font-medium">{item.color || "—"}</td>
                        <td className="px-4 py-3">{item.quantity || "—"}</td>
                        <td className="px-4 py-3 text-right font-mono">{viewing.currency} {Number(item.unitPrice).toFixed(2)}<span className="text-slate-400 text-xs font-normal">/{(viewing.unit || "per KG").replace("per ", "")}</span></td>
                        <td className="px-4 py-3 text-xs text-slate-500 max-w-[180px] whitespace-pre-line">{item.notes || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {viewing.notes && <div className="border-t border-slate-200 pt-3"><span className="text-slate-500 text-xs block mb-1">PO Notes</span><div className="text-sm text-slate-700 whitespace-pre-line bg-slate-50 rounded-lg p-3">{viewing.notes}</div></div>}
              <div className="pt-2 flex gap-2">
                <a href={`/api/export/po?id=${viewing.id}`} className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-300 inline-flex items-center gap-1.5"><IconDownload className="w-3.5 h-3.5" /> Export PO</a>
                {permissions.canEdit && <button onClick={() => { setViewing(null); openForm(viewing); }} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700">Edit PO</button>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit form */}
      {showForm && permissions.canEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between"><div><h2 className="text-lg font-semibold">{editingPO ? "Edit Purchase Order" : "New Purchase Order"}</h2>{editingPO && <p className="text-xs text-slate-500 mt-0.5">{editingPO.poNo}</p>}</div><button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button></div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Factory *</label><select value={fFactory} onChange={(e) => setFFactory(Number(e.target.value))} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"><option value={0}>Select factory...</option>{factoryList.map((f) => <option key={f.id} value={f.id}>{f.factoryName} ({f.relationship})</option>)}</select></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Customer Company</label><select value={fCustomer} onChange={(e) => { setFCustomer(Number(e.target.value)); setFQuoteNo(""); }} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"><option value={0}>None</option>{customerList.map((c) => <option key={c.id} value={c.id}>{c.name}{c.company ? ` — ${c.company}` : ""}</option>)}</select></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Contact Person</label><input type="text" value={fContactPerson} onChange={(e) => setFContactPerson(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="Contact name for this PO" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Linked Quotation</label>
                  <select value={fQuoteNo} onChange={(e) => setFQuoteNo(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">
                    <option value="">None</option>
                    {filteredQuotes.map((q) => <option key={q.quoteNo} value={q.quoteNo}>{q.quoteNo} — {q.customerName} ({q.quoteDate})</option>)}
                  </select>
                  {fCustomer > 0 && filteredQuotes.length === 0 && <p className="text-xs text-slate-400 mt-1">No quotations for this customer</p>}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">PO Date *</label><input type="date" value={fPoDate} onChange={(e) => setFPoDate(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Delivery Date</label><input type="date" value={fDeliveryDate} onChange={(e) => setFDeliveryDate(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Incoterms</label><input type="text" value={fIncoterms} onChange={(e) => setFIncoterms(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Status</label><select value={fStatus} onChange={(e) => setFStatus(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"><option>Draft</option><option>Confirmed</option><option>Shipped</option><option>Received</option><option>Closed</option><option>Cancelled</option></select></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Currency</label><select value={fCurrency} onChange={(e) => setFCurrency(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"><option>USD</option><option>EUR</option><option>GBP</option><option>CNY</option><option>JPY</option></select></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Unit</label><select value={fUnit} onChange={(e) => setFUnit(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"><option>per KG</option><option>per LB</option><option>per Cone</option></select></div>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Items ({fItems.length})</h3>
                <div className="space-y-3">
                  {fItems.map((item, idx) => {
                    const yarn = yarnList.find((y) => y.id === item.yarnId);
                    return (
                      <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="flex items-center justify-between mb-2"><span className="text-xs font-medium text-slate-500">Item {idx + 1}</span>{fItems.length > 1 && <button type="button" onClick={() => removeItem(idx)} className="text-xs text-red-500 hover:text-red-700">Remove</button>}</div>
                        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                          <div className="sm:col-span-2">
                            <YarnPicker value={item.yarnId} yarnList={yarnList} onChange={(id) => handleItemYarnChange(idx, id)} />
                            {yarn?.latestPrice != null && <p className="text-[10px] text-slate-400 mt-0.5">Latest: {yarn.latestCurrency} {yarn.latestPrice.toFixed(2)}</p>}
                          </div>
                          <div><input type="text" value={item.color} onChange={(e) => updateItem(idx, "color", e.target.value)} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs" placeholder="Color" /></div>
                          <div><input type="text" value={item.quantity} onChange={(e) => updateItem(idx, "quantity", e.target.value)} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs" placeholder="Qty e.g. 500 KG" /></div>
                          <div><input type="number" step="0.01" value={item.unitPrice} onChange={(e) => updateItem(idx, "unitPrice", e.target.value)} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs" placeholder="Unit Price" /></div>
                        </div>
                        {yarn?.composition && <div className="mt-1 text-[10px] text-slate-500">Quality: {yarn.composition} · {yarn.treatmentName || "Untreated"}</div>}
                        <input type="text" value={item.notes} onChange={(e) => updateItem(idx, "notes", e.target.value)} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs mt-2" placeholder="Notes (optional)" />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div><label className="block text-sm font-medium text-slate-700 mb-1">PO Notes</label><textarea value={fNotes} onChange={(e) => setFNotes(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" rows={2} /></div>

              <div className="flex gap-3 pt-2 border-t border-slate-200">
                <button onClick={handleSubmit} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">{saving ? "Saving..." : `${editingPO ? "Update" : "Create"} PO (${validItemCount} items)`}</button>
                <button type="button" onClick={addItem} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300">+ Add Item</button>
                <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
