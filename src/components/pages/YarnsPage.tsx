"use client";
import { useState, useEffect, useMemo } from "react";
import { Permissions } from "@/lib/permissions";
import { IconTrash, IconUpload } from "@/components/Icons";

interface Yarn {
  id: number; yarnName: string; factoryId: number; yarnCount: string;
  micron: string; treatmentId: number; origin: string; composition: string;
  color: string; notes: string; factoryName: string; relationship: string;
  treatmentName: string; certIds: number[];
  latestPrice: number | null; latestCurrency: string | null;
  latestUnit: string | null; latestPriceDate: string | null;
}

interface Factory { id: number; factoryName: string; relationship: string; }
interface Treatment { id: number; name: string; }
interface Certificate { id: number; certCode: string; certFullName: string; category: string; }

interface Props {
  permissions: Permissions;
}

export default function YarnsPage({ permissions }: Props) {
  const [yarns, setYarns] = useState<Yarn[]>([]);
  const [factories, setFactories] = useState<Factory[]>([]);
  const [treatmentsList, setTreatments] = useState<Treatment[]>([]);
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [millFilter, setMillFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [editing, setEditing] = useState<Yarn | null>(null);
  const [toast, setToast] = useState<{ type: string; text: string } | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const [formName, setFormName] = useState("");
  const [formFactory, setFormFactory] = useState<number>(0);
  const [formCount, setFormCount] = useState("");
  const [formMicron, setFormMicron] = useState("");
  const [formTreatment, setFormTreatment] = useState<number>(0);
  const [formComposition, setFormComposition] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formCerts, setFormCerts] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  const [bulkText, setBulkText] = useState("");
  const [bulkSaving, setBulkSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [y, f, t, c] = await Promise.all([
        fetch("/api/yarns").then((r) => r.json()),
        fetch("/api/factories").then((r) => r.json()),
        fetch("/api/treatments").then((r) => r.json()),
        fetch("/api/certificates").then((r) => r.json()),
      ]);
      setYarns(y); setFactories(f); setTreatments(t); setCerts(c);
    } catch {}
    setLoading(false);
    setSelected(new Set());
  };

  useEffect(() => { loadData(); }, []);

  // Build filter options: groups + individual mills
  const filterOptions = useMemo(() => {
    const myMills = factories.filter((f) => f.relationship === "My Factory").sort((a, b) => a.factoryName.localeCompare(b.factoryName));
    const compMills = factories.filter((f) => f.relationship === "Competitor Factory").sort((a, b) => a.factoryName.localeCompare(b.factoryName));
    return { myMills, compMills };
  }, [factories]);

  const filtered = useMemo(() => {
    let result = yarns;
    if (millFilter === "my") {
      result = result.filter((y) => y.relationship === "My Factory");
    } else if (millFilter === "competitor") {
      result = result.filter((y) => y.relationship === "Competitor Factory");
    } else if (millFilter.startsWith("mill_")) {
      const millId = parseInt(millFilter.replace("mill_", ""));
      result = result.filter((y) => y.factoryId === millId);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((y) =>
        y.yarnName?.toLowerCase().includes(q) ||
        y.factoryName?.toLowerCase().includes(q) ||
        y.yarnCount?.toLowerCase().includes(q) ||
        y.treatmentName?.toLowerCase().includes(q) ||
        y.notes?.toLowerCase().includes(q) ||
        y.micron?.includes(q)
      );
    }
    return result;
  }, [yarns, search, millFilter]);

  const allSelected = filtered.length > 0 && filtered.every((y) => selected.has(y.id));
  const someSelected = selected.size > 0;

  const toggleSelectAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(filtered.map((y) => y.id)));
  };

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} selected yarn(s) and all their price records? This cannot be undone.`)) return;
    setBulkDeleting(true);
    try {
      for (const id of Array.from(selected)) {
        await fetch(`/api/yarns?id=${id}`, { method: "DELETE" });
      }
      setToast({ type: "success", text: `${selected.size} yarn(s) deleted` });
      setSelected(new Set());
      loadData();
    } catch {
      setToast({ type: "error", text: "Failed to delete some yarns" });
    }
    setBulkDeleting(false);
    setTimeout(() => setToast(null), 3000);
  };

  const openForm = (yarn?: Yarn) => {
    if (yarn) {
      setEditing(yarn); setFormName(yarn.yarnName); setFormFactory(yarn.factoryId);
      setFormCount(yarn.yarnCount || ""); setFormMicron(yarn.micron || "");
      setFormTreatment(yarn.treatmentId || 0); setFormComposition(yarn.composition || "");
      setFormNotes(yarn.notes || ""); setFormCerts(yarn.certIds || []);
    } else {
      setEditing(null); setFormName(""); setFormFactory(0); setFormCount(""); setFormMicron("");
      setFormTreatment(0); setFormComposition(""); setFormNotes(""); setFormCerts([]);
    }
    setShowForm(true);
  };

  const duplicateYarn = (yarn: Yarn) => {
    setEditing(null);
    setFormName(yarn.yarnName);
    setFormFactory(yarn.factoryId);
    setFormCount(yarn.yarnCount || "");
    setFormMicron(yarn.micron || "");
    setFormTreatment(yarn.treatmentId || 0);
    setFormComposition(yarn.composition || "");
    setFormNotes(yarn.notes || "");
    setFormCerts(yarn.certIds || []);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formFactory) { setToast({ type: "error", text: "Name and yarn mill are required" }); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/yarns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editing?.id, yarnName: formName, factoryId: formFactory,
          yarnCount: formCount, micron: formMicron, treatmentId: formTreatment || null,
          composition: formComposition, notes: formNotes, certIds: formCerts,
        }),
      });
      if (res.ok) { setToast({ type: "success", text: editing ? "Yarn updated" : "Yarn created" }); setShowForm(false); loadData(); }
      else { const d = await res.json(); setToast({ type: "error", text: d.error || "Failed" }); }
    } catch { setToast({ type: "error", text: "Error" }); }
    setSaving(false); setTimeout(() => setToast(null), 3000);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this yarn and all its price records?")) return;
    await fetch(`/api/yarns?id=${id}`, { method: "DELETE" });
    setYarns(yarns.filter((y) => y.id !== id));
  };

  const handleBulkImport = async () => {
    if (!bulkText.trim()) return;
    const lines = bulkText.trim().split("\n").filter((l) => l.trim());
    const rows: Array<{
      yarnName: string; factoryId: number; yarnCount: string;
      micron: string; treatmentId: number | null; composition: string; notes: string;
    }> = [];

    for (const line of lines) {
      const cols = line.split("\t");
      if (cols.length < 2) continue;
      const [yarnName, factoryStr, yarnCount, micron, treatmentStr, composition, notes] = cols;
      if (!yarnName?.trim()) continue;

      const factoryMatch = factories.find(
        (f) => f.factoryName.toLowerCase().includes((factoryStr || "").trim().toLowerCase())
      );
      if (!factoryMatch) continue;

      let treatmentId: number | null = null;
      if (treatmentStr?.trim()) {
        const tMatch = treatmentsList.find((t) => t.name.toLowerCase() === treatmentStr.trim().toLowerCase());
        if (tMatch) treatmentId = tMatch.id;
      }

      rows.push({
        yarnName: yarnName.trim(), factoryId: factoryMatch.id,
        yarnCount: yarnCount?.trim() || "", micron: micron?.trim() || "",
        treatmentId, composition: composition?.trim() || "", notes: notes?.trim() || "",
      });
    }

    if (rows.length === 0) {
      setToast({ type: "error", text: "No valid rows found. Make sure yarn mill names match existing mills." });
      setTimeout(() => setToast(null), 4000); return;
    }

    setBulkSaving(true);
    try {
      const res = await fetch("/api/yarns/bulk", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      if (res.ok) {
        const d = await res.json();
        setToast({ type: "success", text: `${d.inserted} yarn(s) imported!` });
        setBulkText(""); setShowBulk(false); loadData();
      } else { setToast({ type: "error", text: "Bulk import failed" }); }
    } catch { setToast({ type: "error", text: "Connection error" }); }
    setBulkSaving(false); setTimeout(() => setToast(null), 3000);
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Yarns</h1>
          <p className="text-sm text-slate-500">{filtered.length} yarns</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <a href="/api/export?type=yarns" className="px-3 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300 transition-colors">Export</a>
          {permissions.canEdit && (
            <>
              <button onClick={() => setShowBulk(true)} className="px-3 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300 transition-colors flex items-center gap-1.5">
                <IconUpload className="w-4 h-4" /> Bulk Import
              </button>
              <button onClick={() => openForm()} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">+ Add Yarn</button>
            </>
          )}
        </div>
      </div>

      {toast && <div className={`mb-4 p-3 rounded-lg text-sm ${toast.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>{toast.text}</div>}

      {someSelected && permissions.canDelete && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
          <span className="text-sm text-blue-800 font-medium">{selected.size} yarn(s) selected</span>
          <div className="flex gap-2">
            <button onClick={() => setSelected(new Set())} className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-800">Clear</button>
            <button onClick={handleBulkDelete} disabled={bulkDeleting} className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center gap-1.5 transition-colors">
              <IconTrash className="w-4 h-4" /> {bulkDeleting ? "Deleting..." : "Delete Selected"}
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Search yarn, yarn mill, count, micron, notes..." />
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
              {permissions.canDelete && (
                <th className="px-4 py-3 w-10"><input type="checkbox" checked={allSelected} onChange={toggleSelectAll} className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" /></th>
              )}
              <th className="px-4 py-3 font-medium">Yarn Name</th>
              <th className="px-4 py-3 font-medium">Yarn Mill</th>
              <th className="px-4 py-3 font-medium">Count</th>
              <th className="px-4 py-3 font-medium">Micron</th>
              <th className="px-4 py-3 font-medium">Treatment</th>
              <th className="px-4 py-3 font-medium text-right">Latest Price</th>
              <th className="px-4 py-3 font-medium">Notes</th>
              {(permissions.canEdit || permissions.canDelete) && <th className="px-4 py-3 font-medium w-28">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={10} className="px-4 py-8 text-center text-slate-400">No yarns found</td></tr>
            ) : filtered.map((y) => (
              <tr key={y.id} className={`border-t border-slate-100 hover:bg-slate-50 ${selected.has(y.id) ? "bg-blue-50/50" : ""}`}>
                {permissions.canDelete && (
                  <td className="px-4 py-3"><input type="checkbox" checked={selected.has(y.id)} onChange={() => toggleSelect(y.id)} className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" /></td>
                )}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${y.relationship === "My Factory" ? "bg-blue-500" : "bg-red-500"}`} />
                    <span className="font-medium">{y.yarnName}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600">{y.factoryName}</td>
                <td className="px-4 py-3 text-slate-600">{y.yarnCount || "—"}</td>
                <td className="px-4 py-3">{y.micron ? `${parseFloat(y.micron).toFixed(1)}μm` : "—"}</td>
                <td className="px-4 py-3 text-slate-600">{y.treatmentName || "—"}</td>
                <td className="px-4 py-3 text-right font-mono">
                  {y.latestPrice != null
                    ? <span className="font-medium">{y.latestCurrency || "USD"} {y.latestPrice.toFixed(2)}<span className="text-slate-400 font-normal text-xs">/{(y.latestUnit || "per KG").replace("per ", "")}</span></span>
                    : <span className="text-slate-400">—</span>}
                </td>
                <td className="px-4 py-3 text-slate-500 text-xs max-w-[200px] truncate">{y.notes || "—"}</td>
                {(permissions.canEdit || permissions.canDelete) && (
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {permissions.canEdit && <button onClick={() => openForm(y)} className="text-blue-600 hover:text-blue-800 text-xs px-1">Edit</button>}
                      {permissions.canEdit && <button onClick={() => duplicateYarn(y)} className="text-emerald-600 hover:text-emerald-800 text-xs px-1">Copy</button>}
                      {permissions.canDelete && <button onClick={() => handleDelete(y.id)} className="text-red-500 hover:text-red-700 text-xs px-1">Del</button>}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Single Yarn Form Modal */}
      {showForm && permissions.canEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{editing ? "Edit Yarn" : formName ? "Duplicate Yarn" : "Add Yarn"}</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg></button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Yarn Name *</label><input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" required /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Yarn Mill *</label>
                <select value={formFactory} onChange={(e) => setFormFactory(Number(e.target.value))} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" required>
                  <option value={0}>Select yarn mill...</option>
                  {factories.map((f) => <option key={f.id} value={f.id}>{f.factoryName} ({f.relationship === "My Factory" ? "Mine" : "Competitor"})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Yarn Count</label><input type="text" value={formCount} onChange={(e) => setFormCount(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="NM 48/2" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Micron</label><input type="text" value={formMicron} onChange={(e) => setFormMicron(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="19.5" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Treatment</label>
                  <select value={formTreatment} onChange={(e) => setFormTreatment(Number(e.target.value))} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"><option value={0}>None</option>{treatmentsList.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
                </div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Composition</label><input type="text" value={formComposition} onChange={(e) => setFormComposition(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="100% Wool" /></div>
              </div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Notes</label><textarea value={formNotes} onChange={(e) => setFormNotes(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" rows={2} /></div>
              {certs.length > 0 && (
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Certificates</label>
                  <div className="flex flex-wrap gap-2">{certs.map((c) => (
                    <button key={c.id} type="button" onClick={() => setFormCerts((prev) => prev.includes(c.id) ? prev.filter((x) => x !== c.id) : [...prev, c.id])} className={`px-2 py-1 rounded text-xs font-medium border transition-colors ${formCerts.includes(c.id) ? "bg-blue-100 text-blue-800 border-blue-300" : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"}`}>{c.certCode}</button>
                  ))}</div>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">{saving ? "Saving..." : editing ? "Update" : "Create"}</button>
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {showBulk && permissions.canEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Bulk Import Yarns</h2>
              <button onClick={() => setShowBulk(false)} className="text-slate-400 hover:text-slate-600"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg></button>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-sm text-slate-600">Paste tab-separated data. Columns: <strong>Yarn Name, Yarn Mill, Yarn Count, Micron, Treatment, Composition, Notes</strong></p>
              <p className="text-xs text-slate-500">Yarn mill names must match existing mills. Treatment names must match existing treatments. Notes column is optional.</p>
              <textarea value={bulkText} onChange={(e) => setBulkText(e.target.value)} className="w-full h-56 px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={"Yarn Name\tYarn Mill\tYarn Count\tMicron\tTreatment\tComposition\tNotes\nSIMPHONIE\tIndorama\tNM 30/2\t19.5\tUntreated\t100% Wool\tStandard quality\nBRISBANE\tIndorama\tNM 48/2\t20.5\tUntreated\t100% Wool\t"} />
              <div className="flex gap-3">
                <button onClick={handleBulkImport} disabled={bulkSaving || !bulkText.trim()} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">{bulkSaving ? "Importing..." : "Import Yarns"}</button>
                <a href="/api/export/template" className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300 transition-colors">Download Template</a>
                <button onClick={() => setShowBulk(false)} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300 transition-colors">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
