"use client";
import { useState, useEffect, useMemo } from "react";
import { Permissions } from "@/lib/permissions";
import { IconTrash, IconDownload } from "@/components/Icons";

interface PriceRecord {
  id: number; yarnId: number; price: number; currency: string; unit: string;
  recordDate: string; incoterms: string; remarks: string;
  yarnName: string; yarnCount: string; micron: string;
  factoryName: string; factoryId: number; relationship: string; treatmentName: string;
}

interface Factory { id: number; factoryName: string; relationship: string; }

interface GroupedRow {
  key: string;
  yarnId: number;
  yarnName: string;
  yarnCount: string;
  micron: string;
  factoryName: string;
  factoryId: number;
  relationship: string;
  treatmentName: string;
  recordDate: string;
  records: PriceRecord[];
}

interface Props { permissions: Permissions; }

export default function PriceHistoryPage({ permissions }: Props) {
  const [prices, setPrices] = useState<PriceRecord[]>([]);
  const [factories, setFactories] = useState<Factory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [millFilter, setMillFilter] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [editing, setEditing] = useState<PriceRecord | null>(null);
  const [viewing, setViewing] = useState<GroupedRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [editPrice, setEditPrice] = useState("");
  const [editCurrency, setEditCurrency] = useState("USD");
  const [editUnit, setEditUnit] = useState("per KG");
  const [editRecordDate, setEditRecordDate] = useState("");
  const [editIncoterms, setEditIncoterms] = useState("");
  const [editRemarks, setEditRemarks] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/prices").then((r) => r.json()),
      fetch("/api/factories").then((r) => r.json()),
    ]).then(([p, f]) => {
      setPrices(p);
      setFactories(f);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Build filter options: groups + individual mills
  const filterOptions = useMemo(() => {
    const myMills = factories.filter((f) => f.relationship === "My Factory").sort((a, b) => a.factoryName.localeCompare(b.factoryName));
    const compMills = factories.filter((f) => f.relationship === "Competitor Factory").sort((a, b) => a.factoryName.localeCompare(b.factoryName));
    return { myMills, compMills };
  }, [factories]);

  // Group records by yarnId + recordDate
  const grouped = useMemo(() => {
    const map = new Map<string, GroupedRow>();
    for (const p of prices) {
      const key = `${p.yarnId}_${p.recordDate}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          yarnId: p.yarnId,
          yarnName: p.yarnName,
          yarnCount: p.yarnCount,
          micron: p.micron,
          factoryName: p.factoryName,
          factoryId: p.factoryId,
          relationship: p.relationship,
          treatmentName: p.treatmentName,
          recordDate: p.recordDate,
          records: [],
        });
      }
      map.get(key)!.records.push(p);
    }
    const rows = Array.from(map.values());
    rows.sort((a, b) => {
      if (a.recordDate !== b.recordDate) return b.recordDate.localeCompare(a.recordDate);
      return a.yarnName.localeCompare(b.yarnName);
    });
    return rows;
  }, [prices]);

  const filtered = useMemo(() => {
    let result = grouped;
    if (millFilter === "my") {
      result = result.filter((g) => g.relationship === "My Factory");
    } else if (millFilter === "competitor") {
      result = result.filter((g) => g.relationship === "Competitor Factory");
    } else if (millFilter.startsWith("mill_")) {
      const millId = parseInt(millFilter.replace("mill_", ""));
      result = result.filter((g) => g.factoryId === millId);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((g) =>
        g.yarnName?.toLowerCase().includes(q) || g.factoryName?.toLowerCase().includes(q) ||
        g.yarnCount?.toLowerCase().includes(q) || g.treatmentName?.toLowerCase().includes(q) ||
        g.micron?.includes(q) ||
        g.records.some((r) => r.incoterms?.toLowerCase().includes(q) || r.currency?.toLowerCase().includes(q))
      );
    }
    return result;
  }, [grouped, search, millFilter]);

  const totalRecords = filtered.reduce((acc, g) => acc + g.records.length, 0);

  const allSelected = filtered.length > 0 && filtered.every((g) => selected.has(g.key));
  const someSelected = selected.size > 0;
  const toggleSelectAll = () => { if (allSelected) setSelected(new Set()); else setSelected(new Set(filtered.map((g) => g.key))); };
  const toggleSelect = (key: string) => { setSelected((prev) => { const n = new Set(prev); if (n.has(key)) n.delete(key); else n.add(key); return n; }); };

  const getSelectedIds = (): number[] => {
    const ids: number[] = [];
    for (const g of grouped) {
      if (selected.has(g.key)) {
        for (const r of g.records) ids.push(r.id);
      }
    }
    return ids;
  };

  const handleDeleteRecord = async (id: number) => {
    if (!confirm("Delete this price record?")) return;
    await fetch(`/api/prices?id=${id}`, { method: "DELETE" });
    setPrices((prev) => prev.filter((p) => p.id !== id));
  };

  const handleBulkDelete = async () => {
    const ids = getSelectedIds();
    if (ids.length === 0) return;
    if (!confirm(`Delete ${ids.length} selected price record(s)? This cannot be undone.`)) return;
    setBulkDeleting(true);
    try {
      for (const id of ids) await fetch(`/api/prices?id=${id}`, { method: "DELETE" });
      setPrices((prev) => prev.filter((p) => !ids.includes(p.id)));
      setToast({ type: "success", text: `${ids.length} price record(s) deleted` });
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
          <p className="text-sm text-slate-500">{filtered.length} items · {totalRecords} records</p>
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
          <span className="text-sm text-blue-800 font-medium">{selected.size} item(s) selected ({getSelectedIds().length} records)</span>
          <div className="flex gap-2">
            <button onClick={() => setSelected(new Set())} className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-800">Clear</button>
            <button onClick={handleBulkDelete} disabled={bulkDeleting} className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center gap-1.5 transition-colors">
              <IconTrash className="w-4 h-4" /> {bulkDeleting ? "Deleting..." : "Delete Selected"}
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Search yarn, yarn mill, count, micron, treatment, incoterms..." />
        <select value={millFilter} onChange={(e) => setMillFilter(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px]">
          <option value="all">All Yarn Mills</option>
          <option value="my">── My Yarn Mills ──</option>
          {filterOptions.myMills.map((f) => (
            <option key={f.id} value={`mill_${f.id}`}>&nbsp;&nbsp;{f.factoryName}</option>
          ))}
          <option value="competitor">── Competitor Yarn Mills ──</option>
          {filterOptions.compMills.map((f) => (
            <option key={f.id} value={`mill_${f.id}`}>&nbsp;&nbsp;{f.factoryName}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left text-slate-600">
              {permissions.canDelete && <th className="px-4 py-3 w-10"><input type="checkbox" checked={allSelected} onChange={toggleSelectAll} className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" /></th>}
              <th className="px-4 py-3 font-medium">Yarn</th>
              <th className="px-4 py-3 font-medium">Yarn Mill</th>
              <th className="px-4 py-3 font-medium">Count</th>
              <th className="px-4 py-3 font-medium">Micron</th>
              <th className="px-4 py-3 font-medium">Treatment</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Prices / Incoterms</th>
              <th className="px-4 py-3 font-medium w-20">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={permissions.canDelete ? 9 : 8} className="px-4 py-8 text-center text-slate-400">No price records found</td></tr>
            ) : filtered.map((g) => (
              <tr key={g.key} className={`border-t border-slate-100 hover:bg-slate-50 ${selected.has(g.key) ? "bg-blue-50/50" : ""}`}>
                {permissions.canDelete && <td className="px-4 py-3"><input type="checkbox" checked={selected.has(g.key)} onChange={() => toggleSelect(g.key)} className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" /></td>}
                <td className="px-4 py-3"><div className="flex items-center gap-2"><span className={`w-2 h-2 rounded-full shrink-0 ${g.relationship === "My Factory" ? "bg-blue-500" : "bg-red-500"}`} /><span className="font-medium">{g.yarnName}</span></div></td>
                <td className="px-4 py-3 text-slate-600">{g.factoryName}</td>
                <td className="px-4 py-3 text-slate-600">{g.yarnCount || "—"}</td>
                <td className="px-4 py-3">{g.micron ? `${parseFloat(g.micron).toFixed(1)}μm` : "—"}</td>
                <td className="px-4 py-3 text-slate-600">{g.treatmentName || "Untreated"}</td>
                <td className="px-4 py-3 text-slate-600">{g.recordDate}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    {g.records.map((r) => (
                      <span key={r.id} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 text-xs font-medium text-slate-700 border border-slate-200">
                        <span className="font-mono font-semibold">{r.currency} {r.price.toFixed(2)}</span>
                        <span className="text-slate-400">/</span>
                        <span className="text-slate-500">{(r.unit || "per KG").replace("per ", "")}</span>
                        {r.incoterms && (
                          <>
                            <span className="text-slate-300">·</span>
                            <span className="text-blue-600 font-semibold">{r.incoterms}</span>
                          </>
                        )}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => setViewing(g)} className="px-2.5 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors">
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* View modal */}
      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setViewing(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Price Record Detail</h2>
                <p className="text-sm text-slate-500 mt-0.5">{viewing.records.length} price entry{viewing.records.length > 1 ? "ies" : "y"} for this item</p>
              </div>
              <button onClick={() => setViewing(null)} className="text-slate-400 hover:text-slate-600 text-xl leading-none p-1">✕</button>
            </div>

            <div className="p-5 bg-slate-50 border-b border-slate-200">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                <div><span className="text-slate-500 text-xs block mb-0.5">Yarn</span><div className="font-semibold text-slate-900">{viewing.yarnName}</div></div>
                <div><span className="text-slate-500 text-xs block mb-0.5">Yarn Mill</span><div className="font-medium text-slate-700">{viewing.factoryName}</div></div>
                <div><span className="text-slate-500 text-xs block mb-0.5">Type</span><div className="font-medium"><span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${viewing.relationship === "My Factory" ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"}`}><span className={`w-1.5 h-1.5 rounded-full ${viewing.relationship === "My Factory" ? "bg-blue-500" : "bg-red-500"}`}/>{viewing.relationship === "My Factory" ? "Mine" : "Competitor"}</span></div></div>
                <div><span className="text-slate-500 text-xs block mb-0.5">Count</span><div className="font-medium text-slate-700">{viewing.yarnCount || "—"}</div></div>
                <div><span className="text-slate-500 text-xs block mb-0.5">Micron</span><div className="font-medium text-slate-700">{viewing.micron ? parseFloat(viewing.micron).toFixed(1) + "μm" : "—"}</div></div>
                <div><span className="text-slate-500 text-xs block mb-0.5">Treatment</span><div className="font-medium text-slate-700">{viewing.treatmentName || "Untreated"}</div></div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-200">
                <span className="text-slate-500 text-xs block mb-0.5">Record Date</span>
                <div className="font-semibold text-slate-900">{viewing.recordDate}</div>
              </div>
            </div>

            <div className="p-5 space-y-3">
              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Price Entries</h3>
              {viewing.records.map((r, idx) => (
                <div key={r.id} className="border border-slate-200 rounded-xl p-4 hover:border-slate-300 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="text-xl font-bold font-mono text-slate-900">{r.currency} {r.price.toFixed(2)}</div>
                        <span className="text-sm text-slate-500">{r.unit || "per KG"}</span>
                        {r.incoterms && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">{r.incoterms}</span>
                        )}
                      </div>
                      {r.remarks && (
                        <div className="mt-2 text-sm text-slate-600 bg-slate-50 rounded-lg p-2.5 whitespace-pre-line">{r.remarks}</div>
                      )}
                    </div>
                    {(permissions.canEdit || permissions.canDelete) && (
                      <div className="flex gap-2 shrink-0">
                        {permissions.canEdit && (
                          <button onClick={() => { setViewing(null); openEdit(r); }} className="px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">Edit</button>
                        )}
                        {permissions.canDelete && (
                          <button onClick={async () => { await handleDeleteRecord(r.id); setViewing((prev) => prev ? { ...prev, records: prev.records.filter((rec) => rec.id !== r.id) } : null); }} className="px-2.5 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors">Delete</button>
                        )}
                      </div>
                    )}
                  </div>
                  {viewing.records.length > 1 && (
                    <div className="mt-2 text-xs text-slate-400">Entry {idx + 1} of {viewing.records.length}</div>
                  )}
                </div>
              ))}
              {viewing.records.length === 0 && (
                <div className="text-center py-6 text-slate-400 text-sm">All records have been deleted.</div>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 flex justify-end">
              <button onClick={() => setViewing(null)} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300 transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setEditing(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
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
