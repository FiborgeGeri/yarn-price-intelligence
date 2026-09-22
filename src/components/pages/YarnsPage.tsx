"use client";
import { useState, useEffect, useMemo } from "react";
import { Permissions } from "@/lib/permissions";
import { getUserId } from "@/lib/getUserId";
import AuditInfo from "@/components/AuditInfo";
import { IconTrash, IconUpload } from "@/components/Icons";
import QRCodeBadge from "@/components/QRCodeBadge";
import ImageUploader from "@/components/ImageUploader";

const ANIMAL_FIBERS = ["wool", "merino", "cashmere", "mohair", "alpaca", "angora", "camel", "yak", "silk", "vicuña", "vicuna", "llama", "qiviut", "pashmina", "shahtoosh", "guanaco", "bison", "musk ox"];
const WORSTED_MILLS = ["indorama", "schoeller", "suedwolle"];

function detectAnimalFibers(composition: string): string[] {
  if (!composition) return [];
  const lower = composition.toLowerCase();
  return ANIMAL_FIBERS.filter((f) => lower.includes(f));
}
function formatFiberLabel(fiber: string): string { return fiber.charAt(0).toUpperCase() + fiber.slice(1); }

// Convert a Google Drive share link or JSON array to a direct image URL.
function toImageUrl(link: string): string {
  if (!link) return "";
  try {
    const parsed = JSON.parse(link);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return toImageUrl(parsed[0]);
    }
  } catch {}
  const match = link.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (match) {
    return `https://drive.google.com/uc?export=view&id=${match[1]}`;
  }
  const openMatch = link.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
  if (openMatch) {
    return `https://drive.google.com/uc?export=view&id=${openMatch[1]}`;
  }
  return link;
}

// Get all image URLs from a JSON string or single URL
function getAllImages(link: string): string[] {
  if (!link) return [];
  try {
    const parsed = JSON.parse(link);
    if (Array.isArray(parsed)) return parsed.filter(Boolean);
  } catch {}
  return [link];
}

interface Yarn {
  id: number; yarnName: string; factoryId: number; yarnCount: string;
  yarnTypeId: number; yarnTypeName: string;
  spinningTypeId: number; spinningTypeName: string;
  micron: string; treatmentId: number; composition: string;
  notes: string; factoryName: string; relationship: string;
  treatmentName: string; certIds: number[]; dyeMethodIds: number[]; dyeMethodNames: string[];
  latestPrice: number | null; latestCurrency: string | null;
  latestUnit: string | null; latestPriceDate: string | null;
  imagePath: string | null;
  createdByName: string; updatedByName: string; createdAt: string; updatedAt: string;
}
interface Factory { id: number; factoryName: string; relationship: string; }
interface Treatment { id: number; name: string; }
interface Certificate { id: number; certCode: string; certFullName: string; category: string; }
interface YarnTypeOpt { id: number; name: string; }
interface SpinningTypeOpt { id: number; name: string; }
interface DyeMethodOpt { id: number; name: string; }
interface Props { permissions: Permissions; }

export default function YarnsPage({ permissions }: Props) {
  const [yarns, setYarns] = useState<Yarn[]>([]);
  const [factories, setFactories] = useState<Factory[]>([]);
  const [treatmentsList, setTreatments] = useState<Treatment[]>([]);
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [yarnTypeOpts, setYarnTypeOpts] = useState<YarnTypeOpt[]>([]);
  const [spinningTypeOpts, setSpinningTypeOpts] = useState<SpinningTypeOpt[]>([]);
  const [dyeMethodOpts, setDyeMethodOpts] = useState<DyeMethodOpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [millFilter, setMillFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [editing, setEditing] = useState<Yarn | null>(null);
  const [viewing, setViewing] = useState<Yarn | null>(null);
  const [toast, setToast] = useState<{ type: string; text: string } | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const [formName, setFormName] = useState("");
  const [formFactory, setFormFactory] = useState<number>(0);
  const [formCount, setFormCount] = useState("");
  const [formYarnType, setFormYarnType] = useState<number>(0);
  const [formSpinningType, setFormSpinningType] = useState<number>(0);
  const [formDyeMethods, setFormDyeMethods] = useState<number[]>([]);
  const [formMicron, setFormMicron] = useState("");
  const [formTreatment, setFormTreatment] = useState<number>(0);
  const [formComposition, setFormComposition] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formCerts, setFormCerts] = useState<number[]>([]);
  const [formImagePath, setFormImagePath] = useState("");
  const [saving, setSaving] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkSaving, setBulkSaving] = useState(false);

  const detectedFibers = useMemo(() => detectAnimalFibers(formComposition), [formComposition]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [y, f, t, c, yt, st, dm] = await Promise.all([
        fetch("/api/yarns").then((r) => r.json()),
        fetch("/api/factories").then((r) => r.json()),
        fetch("/api/treatments").then((r) => r.json()),
        fetch("/api/certificates").then((r) => r.json()),
        fetch("/api/yarn-types").then((r) => r.json()),
        fetch("/api/spinning-types").then((r) => r.json()),
        fetch("/api/dye-methods").then((r) => r.json()),
      ]);
      setYarns(y); setFactories(f); setTreatments(t); setCerts(c); setYarnTypeOpts(yt); setSpinningTypeOpts(st); setDyeMethodOpts(dm);
    } catch {}
    setLoading(false); setSelected(new Set());
  };
  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (yarns.length > 0) {
      const targetId = sessionStorage.getItem("scanTargetId");
      if (targetId) {
        const numId = Number(targetId);
        const matched = yarns.find((y) => y.id === numId);
        if (matched) {
          setViewing(matched);
        }
        sessionStorage.removeItem("scanTargetId");
      }
    }
  }, [yarns]);

  const filterOptions = useMemo(() => {
    const myMills = factories.filter((f) => f.relationship === "My Factory").sort((a, b) => a.factoryName.localeCompare(b.factoryName));
    const compMills = factories.filter((f) => f.relationship === "Competitor Factory").sort((a, b) => a.factoryName.localeCompare(b.factoryName));
    return { myMills, compMills };
  }, [factories]);

  const filtered = useMemo(() => {
    let result = yarns;
    if (millFilter === "my") result = result.filter((y) => y.relationship === "My Factory");
    else if (millFilter === "competitor") result = result.filter((y) => y.relationship === "Competitor Factory");
    else if (millFilter.startsWith("mill_")) { const millId = parseInt(millFilter.replace("mill_", "")); result = result.filter((y) => y.factoryId === millId); }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((y) => y.yarnName?.toLowerCase().includes(q) || y.factoryName?.toLowerCase().includes(q) || y.yarnCount?.toLowerCase().includes(q) || y.treatmentName?.toLowerCase().includes(q) || y.composition?.toLowerCase().includes(q) || y.notes?.toLowerCase().includes(q) || y.micron?.includes(q) || y.yarnTypeName?.toLowerCase().includes(q) || y.dyeMethodNames?.some((d) => d.toLowerCase().includes(q)));
    }
    return result;
  }, [yarns, search, millFilter]);

  const allSelected = filtered.length > 0 && filtered.every((y) => selected.has(y.id));
  const someSelected = selected.size > 0;
  const toggleSelectAll = () => { if (allSelected) setSelected(new Set()); else setSelected(new Set(filtered.map((y) => y.id))); };
  const toggleSelect = (id: number) => { setSelected((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; }); };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} selected yarn(s) and all their price records?`)) return;
    setBulkDeleting(true);
    try { for (const id of Array.from(selected)) await fetch(`/api/yarns?id=${id}`, { method: "DELETE" }); setToast({ type: "success", text: `${selected.size} yarn(s) deleted` }); setSelected(new Set()); loadData(); }
    catch { setToast({ type: "error", text: "Failed to delete some yarns" }); }
    setBulkDeleting(false); setTimeout(() => setToast(null), 3000);
  };

  const autoSetWorsted = (factoryId: number) => {
    const fac = factories.find((f) => f.id === factoryId);
    if (fac && WORSTED_MILLS.some((m) => fac.factoryName.toLowerCase().includes(m))) {
      const worsted = yarnTypeOpts.find((t) => t.name.toLowerCase() === "worsted");
      if (worsted) setFormYarnType(worsted.id);
      const spinWorsted = spinningTypeOpts.find((t) => t.name.toLowerCase().includes("worsted") && !t.name.toLowerCase().includes("semi"));
      if (spinWorsted) setFormSpinningType(spinWorsted.id);
    }
  };

  const openForm = (yarn?: Yarn) => {
    if (yarn) {
      setEditing(yarn); setFormName(yarn.yarnName); setFormFactory(yarn.factoryId);
      setFormCount(yarn.yarnCount || ""); setFormYarnType(yarn.yarnTypeId || 0);
      setFormSpinningType(yarn.spinningTypeId || 0);
      setFormDyeMethods(yarn.dyeMethodIds || []);
      setFormMicron(yarn.micron || "");
      setFormTreatment(yarn.treatmentId || 0); setFormComposition(yarn.composition || "");
      setFormNotes(yarn.notes || ""); setFormCerts(yarn.certIds || []);
      setFormImagePath(yarn.imagePath || "");
    } else {
      setEditing(null); setFormName(""); setFormFactory(0); setFormCount(""); setFormYarnType(0);
      setFormSpinningType(0);
      setFormDyeMethods([]); setFormMicron("");
      setFormTreatment(0); setFormComposition(""); setFormNotes(""); setFormCerts([]);
      setFormImagePath("");
    }
    setShowForm(true);
  };

  const duplicateYarn = (yarn: Yarn) => {
    setEditing(null); setFormName(yarn.yarnName); setFormFactory(yarn.factoryId);
    setFormCount(yarn.yarnCount || ""); setFormYarnType(yarn.yarnTypeId || 0);
    setFormSpinningType(yarn.spinningTypeId || 0);
    setFormDyeMethods(yarn.dyeMethodIds || []);
    setFormMicron(yarn.micron || "");
    setFormTreatment(yarn.treatmentId || 0); setFormComposition(yarn.composition || "");
    setFormNotes(yarn.notes || ""); setFormCerts(yarn.certIds || []);
    setFormImagePath(yarn.imagePath || "");
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formFactory) { setToast({ type: "error", text: "Name and yarn mill are required" }); return; }
    if (formComposition.trim()) {
      const pcts = formComposition.match(/(\d+(?:\.\d+)?)\s*%/g);
      if (pcts) {
        const total = pcts.reduce((sum, p) => sum + parseFloat(p), 0);
        if (Math.abs(total - 100) > 0.5) {
          alert(`Composition totals ${total.toFixed(1)}%\n\nIt must equal 100%. Please fix the composition before saving.`);
          return;
        }
      }
    }
    setSaving(true);
    try {
      const res = await fetch("/api/yarns", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editing?.id, yarnName: formName, factoryId: formFactory,
          yarnCount: formCount, yarnTypeId: formYarnType || null,
          spinningTypeId: formSpinningType || null,
          micron: formMicron, treatmentId: formTreatment || null,
          composition: formComposition, notes: formNotes, certIds: formCerts,
          dyeMethodIds: formDyeMethods,
          imagePath: formImagePath || null,
          userId: getUserId(),
        }),
      });
      if (res.ok) { setToast({ type: "success", text: editing ? "Yarn updated" : "Yarn created" }); setShowForm(false); loadData(); }
      else { const d = await res.json(); setToast({ type: "error", text: d.error || "Failed" }); }
    } catch { setToast({ type: "error", text: "Error" }); }
    setSaving(false); setTimeout(() => setToast(null), 3000);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this yarn and all its price records?")) return;
    await fetch(`/api/yarns?id=${id}`, { method: "DELETE" }); setYarns(yarns.filter((y) => y.id !== id));
  };

  const handleBulkImport = async () => {
    if (!bulkText.trim()) return;
    const lines = bulkText.trim().split("\n").filter((l) => l.trim());
    const rows: Array<{ yarnName: string; factoryId: number; yarnCount: string; micron: string; treatmentId: number | null; composition: string; notes: string; }> = [];
    for (const line of lines) {
      const cols = line.split("\t"); if (cols.length < 2) continue;
      const [yarnName, factoryStr, yarnCount, micron, treatmentStr, composition, notes] = cols;
      if (!yarnName?.trim()) continue;
      const factoryMatch = factories.find((f) => f.factoryName.toLowerCase().includes((factoryStr || "").trim().toLowerCase()));
      if (!factoryMatch) continue;
      let treatmentId: number | null = null;
      if (treatmentStr?.trim()) { const tMatch = treatmentsList.find((t) => t.name.toLowerCase() === treatmentStr.trim().toLowerCase()); if (tMatch) treatmentId = tMatch.id; }
      rows.push({ yarnName: yarnName.trim(), factoryId: factoryMatch.id, yarnCount: yarnCount?.trim() || "", micron: micron?.trim() || "", treatmentId, composition: composition?.trim() || "", notes: notes?.trim() || "" });
    }
    if (rows.length === 0) { setToast({ type: "error", text: "No valid rows found." }); setTimeout(() => setToast(null), 4000); return; }
    setBulkSaving(true);
    try {
      const res = await fetch("/api/yarns/bulk", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rows }) });
      if (res.ok) { const d = await res.json(); setToast({ type: "success", text: `${d.inserted} yarn(s) imported!` }); setBulkText(""); setShowBulk(false); loadData(); }
      else setToast({ type: "error", text: "Bulk import failed" });
    } catch { setToast({ type: "error", text: "Connection error" }); }
    setBulkSaving(false); setTimeout(() => setToast(null), 3000);
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-[#e5885d] border-t-transparent rounded-full animate-spin mx-auto" /></div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
        <div><h1 className="text-2xl font-bold text-slate-900">Yarns</h1><p className="text-sm text-slate-500">{filtered.length} yarns</p></div>
        <div className="flex gap-2 flex-wrap">
          <a href="/api/export?type=yarns" className="px-3 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300 transition-colors">Export</a>
          {permissions.canEdit && (<>
            <button onClick={() => setShowBulk(true)} className="px-3 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300 transition-colors flex items-center gap-1.5"><IconUpload className="w-4 h-4" /> Bulk Import</button>
            <button onClick={() => openForm()} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">+ Add Yarn</button>
          </>)}
        </div>
      </div>

      {toast && <div className={`mb-4 p-3 rounded-lg text-sm ${toast.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>{toast.text}</div>}

      {someSelected && permissions.canDelete && (
        <div className="mb-4 p-3 bg-blue-50 border border-slate-200 rounded-lg flex items-center justify-between">
          <span className="text-sm text-slate-700 font-medium">{selected.size} yarn(s) selected</span>
          <div className="flex gap-2">
            <button onClick={() => setSelected(new Set())} className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-800">Clear</button>
            <button onClick={handleBulkDelete} disabled={bulkDeleting} className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center gap-1.5 transition-colors"><IconTrash className="w-4 h-4" /> {bulkDeleting ? "Deleting..." : "Delete Selected"}</button>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Search yarn, yarn mill, count, micron, composition, dye method..." />
        <select value={millFilter} onChange={(e) => setMillFilter(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px]">
          <option value="all">All Yarn Mills</option>
          <option value="my">── My Yarn Mills ──</option>
          {filterOptions.myMills.map((f) => <option key={f.id} value={`mill_${f.id}`}>&nbsp;&nbsp;{f.factoryName}</option>)}
          <option value="competitor">── Competitor Yarn Mills ──</option>
          {filterOptions.compMills.map((f) => <option key={f.id} value={`mill_${f.id}`}>&nbsp;&nbsp;{f.factoryName}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="bg-slate-50 text-left text-slate-600">
            {permissions.canDelete && <th className="px-4 py-3 w-10"><input type="checkbox" checked={allSelected} onChange={toggleSelectAll} className="w-4 h-4 rounded border-slate-300 text-[#d9774d] focus:ring-blue-500 cursor-pointer" /></th>}
            <th className="px-4 py-3 font-medium">Yarn Name</th>
            <th className="px-4 py-3 font-medium">Yarn Mill</th>
            <th className="px-4 py-3 font-medium">Composition</th>
            <th className="px-4 py-3 font-medium">Count</th>
            <th className="px-4 py-3 font-medium">Micron</th>
            <th className="px-4 py-3 font-medium">Type</th>
            <th className="px-4 py-3 font-medium">Spinning</th>
            <th className="px-4 py-3 font-medium">Dye Method</th>
            <th className="px-4 py-3 font-medium">Treatment</th>
            {(permissions.canEdit || permissions.canDelete) && <th className="px-4 py-3 font-medium w-28">Actions</th>}
          </tr></thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={11} className="px-4 py-8 text-center text-slate-400">No yarns found</td></tr>
            ) : filtered.map((y) => (
              <tr key={y.id} className={`border-t border-slate-100 hover:bg-slate-50 ${selected.has(y.id) ? "bg-blue-50/50" : ""}`}>
                {permissions.canDelete && <td className="px-4 py-3"><input type="checkbox" checked={selected.has(y.id)} onChange={() => toggleSelect(y.id)} className="w-4 h-4 rounded border-slate-300 text-[#d9774d] focus:ring-blue-500 cursor-pointer" /></td>}
                <td className="px-4 py-3">
                  <button onClick={() => setViewing(y)} className="flex items-center gap-2 text-left group">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${y.relationship === "My Factory" ? "bg-[#e5885d]" : "bg-[#4d7d61]"}`} />
                    {y.imagePath && <img src={toImageUrl(y.imagePath)} alt="" className="w-6 h-6 object-cover rounded" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
                    <span className="font-medium text-[#c4683f] group-hover:underline">{y.yarnName}</span>
                  </button>
                </td>
                <td className="px-4 py-3 text-slate-600 text-xs">{y.factoryName}</td>
                <td className="px-4 py-3 text-slate-600 text-xs">{y.composition || "—"}</td>
                <td className="px-4 py-3 text-slate-600 text-xs">{y.yarnCount || "—"}</td>
                <td className="px-4 py-3 text-xs">{y.micron ? `${parseFloat(y.micron).toFixed(1)}μm` : "—"}</td>
                <td className="px-4 py-3 text-slate-600 text-xs">{y.yarnTypeName || "—"}</td>
                <td className="px-4 py-3 text-slate-600 text-xs">{y.spinningTypeName || "—"}</td>
                <td className="px-4 py-3 text-xs">{y.dyeMethodNames?.length ? y.dyeMethodNames.join(", ") : "—"}</td>
                <td className="px-4 py-3 text-slate-600 text-xs">{y.treatmentName || "—"}</td>
                {(permissions.canEdit || permissions.canDelete) && (
                  <td className="px-4 py-3"><div className="flex gap-1">
                    {permissions.canEdit && <button onClick={() => openForm(y)} className="text-[#d9774d] hover:text-[#a75334] text-xs px-1">Edit</button>}
                    {permissions.canEdit && <button onClick={() => duplicateYarn(y)} className="text-emerald-600 hover:text-emerald-800 text-xs px-1">Copy</button>}
                    {permissions.canDelete && <button onClick={() => handleDelete(y.id)} className="text-red-500 hover:text-[#3a6650] text-xs px-1">Del</button>}
                  </div></td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* View Detail Card */}
      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setViewing(null)}>
          <div className={`bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto border-t-4 ${viewing.relationship === "My Factory" ? "border-[#e5885d]" : "border-[#4d7d61]"}`} onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-slate-200 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2"><span className={`w-3 h-3 rounded-full ${viewing.relationship === "My Factory" ? "bg-[#e5885d]" : "bg-[#4d7d61]"}`} /><h2 className="text-xl font-bold text-slate-900">{viewing.yarnName}</h2></div>
                <p className="text-sm text-slate-500 mt-1">{viewing.factoryName} · {viewing.relationship === "My Factory" ? "Mine" : "Competitor"}</p>
              </div>
              <button onClick={() => setViewing(null)} className="text-slate-400 hover:text-slate-600 text-xl leading-none p-1">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <div className="flex gap-4 items-start">
                  <div className="flex-1">
                    {(() => {
                      const imgs = getAllImages(viewing.imagePath || "");
                      if (imgs.length === 0) return <div className="w-24 h-24 bg-slate-200 rounded-lg flex items-center justify-center text-xs text-slate-400">No Image</div>;
                      return (
                        <div className="flex gap-2 flex-wrap">
                          {imgs.map((img, i) => (
                            <a key={i} href={toImageUrl(img)} target="_blank" rel="noopener noreferrer">
                              <img src={toImageUrl(img)} alt="" className="w-20 h-20 object-cover rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-zoom-in" />
                            </a>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                  <QRCodeBadge type="yarn" id={viewing.id} reference={viewing.yarnName} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-slate-500 text-xs block mb-0.5">Composition</span><div className="font-medium">{viewing.composition || "—"}</div></div>
                <div><span className="text-slate-500 text-xs block mb-0.5">Yarn Count</span><div className="font-medium">{viewing.yarnCount || "—"}</div></div>
                <div><span className="text-slate-500 text-xs block mb-0.5">Micron</span><div className="font-medium">{viewing.micron ? `${viewing.micron}μm` : "—"}</div></div>
                <div><span className="text-slate-500 text-xs block mb-0.5">Treatment</span><div className="font-medium">{viewing.treatmentName || "—"}</div></div>
                <div><span className="text-slate-500 text-xs block mb-0.5">Yarn Type</span><div className="font-medium">{viewing.yarnTypeName || "—"}</div></div>
                <div><span className="text-slate-500 text-xs block mb-0.5">Spinning Type</span><div className="font-medium">{viewing.spinningTypeName || "—"}</div></div>
                <div><span className="text-slate-500 text-xs block mb-0.5">Dye Method</span><div className="font-medium">{viewing.dyeMethodNames?.length ? viewing.dyeMethodNames.join(", ") : "—"}</div></div>
              </div>
              {viewing.latestPrice != null && (
                <div className="border-t border-slate-200 pt-4"><span className="text-slate-500 text-xs block mb-0.5">Latest Price</span><div className="text-lg font-bold font-mono">{viewing.latestCurrency || "USD"} {viewing.latestPrice.toFixed(2)} <span className="text-sm font-normal text-slate-500">{viewing.latestUnit || "per KG"}</span></div><div className="text-xs text-slate-400">{viewing.latestPriceDate}</div></div>
              )}
              {viewing.certIds?.length > 0 && (
                <div className="border-t border-slate-200 pt-4"><span className="text-slate-500 text-xs block mb-1">Certificates</span><div className="flex flex-wrap gap-1.5">{certs.filter((c) => viewing.certIds.includes(c.id)).map((c) => <span key={c.id} className="px-2 py-0.5 bg-blue-50 text-[#c4683f] rounded text-xs font-medium">{c.certCode}</span>)}</div></div>
              )}
              {viewing.notes && <div className="border-t border-slate-200 pt-4"><span className="text-slate-500 text-xs block mb-0.5">Notes</span><p className="text-sm text-slate-700 whitespace-pre-line">{viewing.notes}</p></div>}
              <AuditInfo createdByName={viewing.createdByName} updatedByName={viewing.updatedByName} createdAt={viewing.createdAt} updatedAt={viewing.updatedAt} className="border-t border-slate-200 pt-3" />
            </div>
            <div className="p-4 border-t border-slate-200 flex gap-2 justify-end">
              {permissions.canEdit && <button onClick={() => { setViewing(null); openForm(viewing); }} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700">Edit</button>}
              {permissions.canEdit && <button onClick={() => { setViewing(null); duplicateYarn(viewing); }} className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700">Copy</button>}
              <button onClick={() => setViewing(null)} className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-300">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && permissions.canEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{editing ? "Edit Yarn" : formName ? "Duplicate Yarn" : "Add Yarn"}</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Yarn Name *</label><input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" required /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Yarn Mill *</label>
                <select value={formFactory} onChange={(e) => { const v = Number(e.target.value); setFormFactory(v); if (!editing) autoSetWorsted(v); }} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" required>
                  <option value={0}>Select yarn mill...</option>
                  {factories.map((f) => <option key={f.id} value={f.id}>{f.factoryName} ({f.relationship === "My Factory" ? "Mine" : "Competitor"})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Yarn Count</label><input type="text" value={formCount} onChange={(e) => setFormCount(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="NM 48/2" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Yarn Type</label>
                  <select value={formYarnType} onChange={(e) => setFormYarnType(Number(e.target.value))} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                    <option value={0}>—</option>{yarnTypeOpts.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Spinning Type</label>
                  <select value={formSpinningType} onChange={(e) => setFormSpinningType(Number(e.target.value))} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                    <option value={0}>—</option>{spinningTypeOpts.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Treatment</label>
                  <select value={formTreatment} onChange={(e) => setFormTreatment(Number(e.target.value))} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"><option value={0}>None</option>{treatmentsList.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
                </div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Composition</label><input type="text" value={formComposition} onChange={(e) => setFormComposition(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="e.g. 50% Wool / 50% Nylon" />
                  {(() => { const pcts = formComposition.match(/(\d+(?:\.\d+)?)\s*%/g); if (!pcts) return null; const total = pcts.reduce((s, p) => s + parseFloat(p), 0); const ok = Math.abs(total - 100) <= 0.5; return <div className={`mt-1 text-xs font-medium ${ok ? "text-green-600" : "text-[#4d7d61]"}`}>{ok ? `✓ Total: ${total}%` : `⚠ Total: ${total}% — must be 100%`}</div>; })()}
                </div>
              </div>

              {/* Smart Micron */}
              {detectedFibers.length > 0 ? (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Micron <span className="text-xs text-slate-400 font-normal">({detectedFibers.length} animal fiber{detectedFibers.length > 1 ? "s" : ""} detected)</span></label>
                  {detectedFibers.length === 1 ? (
                    <input type="text" value={formMicron} onChange={(e) => setFormMicron(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder={`Micron for ${formatFiberLabel(detectedFibers[0])}`} />
                  ) : (
                    <div className="space-y-1.5">
                      <div className="text-xs text-slate-500">Enter micron for each fiber in the same order as your composition, separated by &quot;/&quot;</div>
                      <input type="text" value={formMicron} onChange={(e) => setFormMicron(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder={detectedFibers.map((f) => `${formatFiberLabel(f)} μm`).join(" / ")} />
                      <div className="flex flex-wrap gap-1.5">{detectedFibers.map((f, i) => <span key={i} className="text-[10px] px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded border border-amber-200">{i + 1}. {formatFiberLabel(f)}</span>)}</div>
                    </div>
                  )}
                </div>
              ) : formComposition ? (
                <div className="text-xs text-slate-400 bg-slate-50 px-3 py-2 rounded-lg">No animal fiber detected — micron not required for synthetic fibers</div>
              ) : null}

              {/* Dye Methods (multi-select like certificates) */}
              {dyeMethodOpts.length > 0 && (
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Dye Method(s)</label>
                  <div className="flex flex-wrap gap-2">{dyeMethodOpts.map((d) => (
                    <button key={d.id} type="button" onClick={() => setFormDyeMethods((prev) => prev.includes(d.id) ? prev.filter((x) => x !== d.id) : [...prev, d.id])} className={`px-2 py-1 rounded text-xs font-medium border transition-colors ${formDyeMethods.includes(d.id) ? "bg-purple-100 text-purple-800 border-purple-300" : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"}`}>{d.name}</button>
                  ))}</div>
                </div>
              )}

              {certs.length > 0 && (
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Certificates</label>
                  <div className="flex flex-wrap gap-2">{certs.map((c) => (
                    <button key={c.id} type="button" onClick={() => setFormCerts((prev) => prev.includes(c.id) ? prev.filter((x) => x !== c.id) : [...prev, c.id])} className={`px-2 py-1 rounded text-xs font-medium border transition-colors ${formCerts.includes(c.id) ? "bg-[#fce8df] text-[#a75334] border-[#edab8e]" : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"}`}>{c.certCode}</button>
                  ))}</div>
                </div>
              )}

              {/* 🆕 產品圖片上傳組件 (替換掉了原本的文字 Input，全面整合 Cloudinary) */}
              <ImageUploader
                label="Yarn Images"
                folder="yarns"
                multiple
                maxImages={5}
                value={(() => { 
                  try { 
                    const p = JSON.parse(formImagePath || "[]"); 
                    return Array.isArray(p) ? p : (formImagePath ? [formImagePath] : []); 
                  } catch { 
                    return formImagePath ? [formImagePath] : []; 
                  } 
                })()}
                onChange={(val) => { 
                  const arr = Array.isArray(val) ? val : [val]; 
                  setFormImagePath(arr.length > 0 ? JSON.stringify(arr) : ""); 
                }}
                hint="Upload yarn photos (front, side, close-up, color card, etc.)"
              />

              <div><label className="block text-sm font-medium text-slate-700 mb-1">Notes</label><textarea value={formNotes} onChange={(e) => setFormNotes(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" rows={2} /></div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">{saving ? "Saving..." : editing ? "Update" : "Create"}</button>
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import */}
      {showBulk && permissions.canEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowBulk(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-200 flex items-center justify-between"><h2 className="text-lg font-semibold">Bulk Import Yarns</h2><button onClick={() => setShowBulk(false)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button></div>
            <div className="p-4 space-y-4">
              <p className="text-sm text-slate-600">Paste tab-separated data from Excel. Columns:</p>
              <div className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-3 font-mono">Yarn Name | Yarn Mill | Yarn Count | Micron | Treatment | Composition | Notes</div>
              <div className="flex gap-2 items-center">
                <a href="/api/export/template?type=yarns" className="text-xs text-[#d9774d] hover:underline">↓ Download Excel template</a>
                <span className="text-xs text-slate-400">Copy from Excel and paste below</span>
              </div>
              <textarea value={bulkText} onChange={(e) => setBulkText(e.target.value)} className="w-full h-56 px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder={"SIMPHONIE\tIndorama\tNM 48/2\t19.5\tUntreated\t100% Wool\tSample yarn\nBRISBANE\tIndorama\tNM 60/2\t20.5\tAnti-Shrinkage\t100% Wool\t"} />
              <div className="flex gap-3">
                <button onClick={handleBulkImport} disabled={bulkSaving || !bulkText.trim()} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">{bulkSaving ? "Importing..." : "Import Yarns"}</button>
                <button onClick={() => setShowBulk(false)} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300 transition-colors">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
