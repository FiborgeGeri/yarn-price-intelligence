"use client";
import { useState, useEffect, useMemo } from "react";
import { Permissions } from "@/lib/permissions";
import { IconTrash, IconDownload } from "@/components/Icons";

interface PriceRecord {
  id: number; yarnId: number; price: number; currency: string; unit: string;
  recordDate: string; incoterms: string; remarks: string;
  yarnName: string; yarnCount: string; micron: string;
  factoryName: string; relationship: string; treatmentName: string;
}

interface Props { permissions: Permissions; }

export default function PriceHistoryPage({ permissions }: Props) {
  const [prices, setPrices] = useState<PriceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [relFilter, setRelFilter] = useState("all");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [editing, setEditing] = useState<PriceRecord | null>(null);
  const [viewing, setViewing] = useState<PriceRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [editPrice, setEditPrice] = useState("");
  const [editCurrency, setEditCurrency] = useState("USD");
  const [editUnit, setEditUnit] = useState("per KG");
  const [editRecordDate, setEditRecordDate] = useState("");
  const [editIncoterms, setEditIncoterms] = useState("");
  const [editRemarks, setEditRemarks] = useState("");

  useEffect(() => {
    fetch("/api/prices").then((r) => r.json()).then((d) => { setPrices(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let result = prices;
    if (relFilter !== "all") result = result.filter((p) => p.relationship === relFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((p) =>
        p.yarnName?.toLowerCase().includes(q) || p.factoryName?.toLowerCase().includes(q) ||
        p.yarnCount?.toLowerCase().includes(q) || p.treatmentName?.toLowerCase().includes(q) || p.micron?.includes(q)
      );
    }
    return result;
  }, [prices, search, relFilter]);

  const allSelected = filtered.length > 0 && filtered.every((p) => selected.has(p.id));
  const someSelected = selected.size > 0;
  const toggleSelectAll = () => { if (allSelected) setSelected(new Set()); else setSelected(new Set(filtered.map((p) => p.id))); };
  const toggleSelect = (id: number) => { setSelected((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; }); };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this price record?")) return;
    await fetch(`/api/prices?id=${id}`, { method: "DELETE" });
    setPrices((prev) => prev.filter((p) => p.id !== id));
    setSelected((prev) => { const n = new Set(prev); n.delete(id); return n; });
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} selected price record(s)? This cannot be undone.`)) return;
    setBulkDeleting(true);
    try {
      for (const id of Array.from(selected)) await fetch(`/api/prices?id=${id}`, { method: "DELETE" });
      setPrices((prev) => prev.filter((p) => !selected.has(p.id)));
      setToast({ type: "success", text: `${selected.size} price record(s) deleted` });
      setSelected(new Set());
    } catch { setToast({ type: "error", text: "Failed to delete some records" }); }
    setBulkDeleting(false);
    setTimeout(() => setToast(null), 3000);
  };

  const openEdit = (r: PriceRecord) => {
    setEditing(r); setEditPrice(String(r.price)); setEditCurrency(r.currency || "USD");
    setEditUnit(r.unit || "per KG"); setEditRecordDate(r.recordDate || "");
    setEditIncoterms(r.incoterms || ""); setEditRemarks(r.remarks || "");
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      const res = await fetch("/api/prices", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editing.id, price: editPrice, currency: editCurrency, unit: editUnit, recordDate: editRecordDate, incoterms: editIncoterms, remarks: editRemarks }),
      });
      if (res.ok) {
        setPrices((prev) => prev.map((p) => p.id === editing.id ? { ...p, price: parseFloat(editPrice), currency: editCurrency, unit: editUnit, recordDate: editRecordDate, incoterms: editIncoterms, remarks: editRemarks } : p));
        setToast({ type: "success", text: "Price updated" }); setEditing(null);
        setTimeout(() => setToast(null), 3000);
      } else { const d = await res.json(); setToast({ type: "error", text: d.error || "Failed" }); }
    } catch { setToast({ type: "error", text: "Connection error" }); }
    setSaving(false);
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Price History</h1>
          <p className="text-sm text-slate-500">{filtered.length} records</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <a href="/api/export?type=prices" className="px-3 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300 transition-colors">Export CSV</a>
          <a href="/api/export/report" className="px-3 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300 transition-colors flex items-center gap-1.5">
            <IconDownload className="w-4 h-4" /> Analysis Report
          </a>
        </div>
      </div>

      {toast && <div className={`mb-4 p-3 rounded-lg text-sm ${toast.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>{toast.text}</div>}

      {someSelected && permissions.canDelete && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
          <span className="text-sm text-blue-800 font-medium">{selected.size} selected</span>
          <div className="flex gap-2">
            <button onClick={() => setSelected(new Set())} className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-800">Clear</button>
            <button onClick={handleBulkDelete} disabled={bulkDeleting} className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center gap-1.5 transition-colors">
              <IconTrash className="w-4 h-4" /> {bulkDeleting ? "Deleting..." : "Delete Selected"}
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Search yarn, factory, count, micron, treatment..." />
        <select value={relFilter} onChange={(e) => setRelFilter(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="all">All Factories</option><option value="My Factory">My Factories</option><option value="Competitor Factory">Competitor Factories</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left text-slate-600">
              {permissions.canDelete && <th className="px-4 py-3 w-10"><input type="checkbox" checked={allSelected} onChange={toggleSelectAll} className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" /></th>}
              <th className="px-4 py-3 font-medium">Yarn</th>
              <th className="px-4 py-3 font-medium">Factory</th>
              <th className="px-4 py-3 font-medium">Count</th>
              <th className="px-4 py-3 font-medium">Micron</th>
              <th className="px-4 py-3 font-medium">Treatment</th>
              <th className="px-4 py-3 font-medium text-right">Price</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Incoterms</th>
              <th className="px-4 py-3 font-medium">Remarks</th>
              <th className="px-4 py-3 font-medium w-24">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={11} className="px-4 py-8 text-center text-slate-400">No price records found</td></tr>
            ) : filtered.map((p) => (
              <tr key={p.id} className={`border-t border-slate-100 hover:bg-slate-50 ${selected.has(p.id) ? "bg-blue-50/50" : ""}`}>
                {permissions.canDelete && <td className="px-4 py-3"><input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleSelect(p.id)} className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" /></td>}
                <td className="px-4 py-3"><div className="flex items-center gap-2"><span className={`w-2 h-2 rounded-full ${p.relationship === "My Factory" ? "bg-blue-500" : "bg-red-500"}`} /><span className="font-medium">{p.yarnName}</span></div></td>
                <td className="px-4 py-3 text-slate-600">{p.factoryName}</td>
                <td className="px-4 py-3 text-slate-600">{p.yarnCount || "—"}</td>
                <td className="px-4 py-3">{p.micron ? `${parseFloat(p.micron).toFixed(1)}μm` : "—"}</td>
                <td className="px-4 py-3 text-slate-600">{p.treatmentName || "Untreated"}</td>
                <td className="px-4 py-3 text-right font-mono font-medium">{p.currency} {p.price.toFixed(2)}<span className="text-slate-400 font-normal text-xs">/{(p.unit || "per KG").replace("per ", "")}</span></td>
                <td className="px-4 py-3 text-slate-600">{p.recordDate}</td>
                <td className="px-4 py-3 text-slate-600">{p.incoterms || "—"}</td>
                <td className="px-4 py-3 text-slate-500 text-xs max-w-[150px] truncate">{p.remarks || "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => setViewing(p)} className="text-slate-600 hover:text-slate-900 text-xs">View</button>
                    {permissions.canEdit && <button onClick={() => openEdit(p)} className="text-blue-600 hover:text-blue-800 text-xs">Edit</button>}
                    {permissions.canDelete && <button onClick={() => handleDelete(p.id)} className="text-red-500 hover:text-red-700 text-xs">Del</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* View modal */}
      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Price Record Detail</h2>
              <button onClick={() => setViewing(null)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-slate-500 text-xs block">Yarn</span><div className="font-medium">{viewing.yarnName}</div></div>
                <div><span className="text-slate-500 text-xs block">Factory</span><div className="font-medium">{viewing.factoryName}</div></div>
                <div><span className="text-slate-500 text-xs block">Count</span><div className="font-medium">{viewing.yarnCount || "—"}</div></div>
                <div><span className="text-slate-500 text-xs block">Micron</span><div className="font-medium">{viewing.micron ? parseFloat(viewing.micron).toFixed(1) + "μm" : "—"}</div></div>
                <div><span className="text-slate-500 text-xs block">Treatment</span><div className="font-medium">{viewing.treatmentName || "Untreated"}</div></div>
                <div><span className="text-slate-500 text-xs block">Type</span><div className="font-medium">{viewing.relationship}</div></div>
              </div>
              <div className="border-t border-slate-200 pt-4 grid grid-cols-3 gap-4 text-sm">
                <div><span className="text-slate-500 text-xs block">Price</span><div className="font-mono font-bold text-lg">{viewing.currency} {viewing.price.toFixed(2)}</div><div className="text-xs text-slate-400">{viewing.unit || "per KG"}</div></div>
                <div><span className="text-slate-500 text-xs block">Record Date</span><div className="font-medium">{viewing.recordDate}</div></div>
                <div><span className="text-slate-500 text-xs block">Incoterms</span><div className="font-medium">{viewing.incoterms || "—"}</div></div>
              </div>
              <div className="border-t border-slate-200 pt-4">
                <span className="text-slate-500 text-xs block mb-1">Remarks</span>
                <div className="text-sm text-slate-700 whitespace-pre-line bg-slate-50 rounded-lg p-3 min-h-[60px]">
                  {viewing.remarks || "No remarks"}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div><h2 className="text-lg font-semibold">Edit Price</h2><p className="text-xs text-slate-500 mt-0.5">{editing.yarnName} · {editing.factoryName}</p></div>
              <button onClick={() => setEditing(null)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
            </div>
            <form onSubmit={handleEditSave} className="p-4 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Price</label><input type="number" step="0.01" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" required /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Currency</label><select value={editCurrency} onChange={(e) => setEditCurrency(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"><option>USD</option><option>EUR</option><option>GBP</option><option>CNY</option><option>JPY</option></select></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Unit</label><select value={editUnit} onChange={(e) => setEditUnit(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"><option>per KG</option><option>per LB</option><option>per Cone</option></select></div>
              </div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Date</label><input type="date" value={editRecordDate} onChange={(e) => setEditRecordDate(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" required /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Incoterms</label><input type="text" value={editIncoterms} onChange={(e) => setEditIncoterms(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Remarks</label><textarea value={editRemarks} onChange={(e) => setEditRemarks(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" rows={4} /></div>
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">{saving ? "Saving..." : "Save Changes"}</button>
                <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
