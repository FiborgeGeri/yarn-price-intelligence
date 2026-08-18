"use client";
import { useState, useEffect, useMemo } from "react";
import { Permissions } from "@/lib/permissions";
import { getUserId } from "@/lib/getUserId";
import { IconSearch } from "@/components/Icons";

interface CertYarn { yarnId: number; yarnName: string; factoryName: string; yarnCount: string; composition: string; }
interface CertFactory { factoryId: number; factoryName: string; }
interface Certificate {
  id: number; certCode: string; certFullName: string; category: string;
  issuingBody: string; description: string;
  yarns: CertYarn[]; factories: CertFactory[];
}
interface Props { permissions: Permissions; }

const CAT_COLORS: Record<string, string> = {
  "Animal Fiber": "border-l-amber-500",
  "Textile": "border-l-blue-500",
  "Quality": "border-l-green-500",
  "Social": "border-l-purple-500",
};

export default function CertificatesPage({ permissions }: Props) {
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Certificate | null>(null);
  const [toast, setToast] = useState<{ type: string; text: string } | null>(null);
  const [viewingCert, setViewingCert] = useState<Certificate | null>(null);
  const [yarnSearch, setYarnSearch] = useState("");

  const [code, setCode] = useState("");
  const [fullName, setFullName] = useState("");
  const [category, setCategory] = useState("Animal Fiber");
  const [issuingBody, setIssuingBody] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const loadData = async () => { setLoading(true); setCerts(await fetch("/api/certificates").then((r) => r.json())); setLoading(false); };
  useEffect(() => { loadData(); }, []);

  const openForm = (c?: Certificate) => {
    if (c) { setEditing(c); setCode(c.certCode); setFullName(c.certFullName || ""); setCategory(c.category || "Animal Fiber"); setIssuingBody(c.issuingBody || ""); setDescription(c.description || ""); }
    else { setEditing(null); setCode(""); setFullName(""); setCategory("Animal Fiber"); setIssuingBody(""); setDescription(""); }
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!code) return; setSaving(true);
    const res = await fetch("/api/certificates", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editing?.id, certCode: code, certFullName: fullName, category, issuingBody, description, userId: getUserId() }) });
    if (res.ok) { setToast({ type: "success", text: editing ? "Updated" : "Created" }); setShowForm(false); loadData(); }
    setSaving(false); setTimeout(() => setToast(null), 3000);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this certificate?")) return;
    await fetch(`/api/certificates?id=${id}`, { method: "DELETE" }); setCerts(certs.filter((c) => c.id !== id));
  };

  const categories = [...new Set(certs.map((c) => c.category).filter(Boolean))].sort();

  const filteredViewYarns = useMemo(() => {
    if (!viewingCert) return [];
    if (!yarnSearch.trim()) return viewingCert.yarns;
    const q = yarnSearch.toLowerCase();
    return viewingCert.yarns.filter((y) => y.yarnName.toLowerCase().includes(q) || y.factoryName.toLowerCase().includes(q) || y.yarnCount?.toLowerCase().includes(q) || y.composition?.toLowerCase().includes(q));
  }, [viewingCert, yarnSearch]);

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-slate-900">Certificates</h1><p className="text-sm text-slate-500">{certs.length} certificates</p></div>
        {permissions.canEdit && <button onClick={() => openForm()} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">+ Add Certificate</button>}
      </div>

      {toast && <div className={`mb-4 p-3 rounded-lg text-sm ${toast.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{toast.text}</div>}

      {categories.map((cat) => (
        <div key={cat} className="mb-8">
          <h2 className="text-lg font-semibold text-slate-700 mb-3">{cat}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {certs.filter((c) => c.category === cat).map((c) => (
              <div key={c.id} className={`bg-white rounded-xl shadow-sm border border-slate-200 border-l-4 ${CAT_COLORS[cat] || "border-l-slate-400"} overflow-hidden`}>
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{c.certCode}</span>
                        {c.yarns.length > 0 && (
                          <button onClick={() => { setViewingCert(c); setYarnSearch(""); }} className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-semibold hover:bg-blue-100 transition-colors">
                            {c.yarns.length} yarn{c.yarns.length !== 1 ? "s" : ""}
                          </button>
                        )}
                        {c.factories.length > 0 && (
                          <span className="px-2 py-0.5 bg-green-50 text-green-600 rounded-full text-[10px] font-semibold">
                            {c.factories.length} mill{c.factories.length !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">{c.certFullName || ""}</div>
                      {c.issuingBody && <div className="text-xs text-slate-400 mt-1">Issued by: {c.issuingBody}</div>}
                      {c.description && <div className="mt-2 text-sm text-slate-600 bg-slate-50 rounded-lg p-2.5 whitespace-pre-line">{c.description}</div>}
                    </div>
                    {(permissions.canEdit || permissions.canDelete) && (
                      <div className="flex gap-1 shrink-0 ml-2">
                        {permissions.canEdit && <button onClick={() => openForm(c)} className="text-blue-600 text-xs px-1 hover:text-blue-800">Edit</button>}
                        {permissions.canDelete && <button onClick={() => handleDelete(c.id)} className="text-red-500 text-xs px-1 hover:text-red-700">Del</button>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Yarn list modal */}
      {viewingCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setViewingCert(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-200 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold">{viewingCert.certCode}</h2>
                <p className="text-xs text-slate-500 mt-0.5">{viewingCert.certFullName}</p>
              </div>
              <button onClick={() => setViewingCert(null)} className="text-slate-400 hover:text-slate-600 text-xl leading-none p-1">✕</button>
            </div>
            {viewingCert.description && (
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Requirements / Qualification</span>
                <p className="text-sm text-slate-700 mt-1 whitespace-pre-line">{viewingCert.description}</p>
              </div>
            )}
            <div className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="relative flex-1">
                  <IconSearch className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input type="text" value={yarnSearch} onChange={(e) => setYarnSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Search yarns..." />
                </div>
                <span className="text-sm text-slate-500 shrink-0">{filteredViewYarns.length} yarn{filteredViewYarns.length !== 1 ? "s" : ""}</span>
              </div>
              {filteredViewYarns.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-sm">No yarns match your search</div>
              ) : (
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead><tr className="bg-slate-50 text-left text-slate-600"><th className="px-3 py-2 font-medium text-xs">Yarn Name</th><th className="px-3 py-2 font-medium text-xs">Yarn Mill</th><th className="px-3 py-2 font-medium text-xs">Count</th><th className="px-3 py-2 font-medium text-xs">Composition</th></tr></thead>
                    <tbody>
                      {filteredViewYarns.map((y) => (
                        <tr key={y.yarnId} className="border-t border-slate-100 hover:bg-slate-50">
                          <td className="px-3 py-2 font-medium text-slate-900">{y.yarnName}</td>
                          <td className="px-3 py-2 text-slate-600 text-xs">{y.factoryName || "—"}</td>
                          <td className="px-3 py-2 text-slate-600 text-xs">{y.yarnCount || "—"}</td>
                          <td className="px-3 py-2 text-slate-600 text-xs">{y.composition || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {viewingCert.factories.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Certified Yarn Mills</span>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {viewingCert.factories.map((f) => <span key={f.factoryId} className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs font-medium border border-green-200">{f.factoryName}</span>)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && permissions.canEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{editing ? "Edit Certificate" : "Add Certificate"}</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Code *</label><input type="text" value={code} onChange={(e) => setCode(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" required placeholder="e.g. RWS" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"><option>Animal Fiber</option><option>Textile</option><option>Quality</option><option>Social</option></select>
                </div>
              </div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label><input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="e.g. Responsible Wool Standard" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Issuing Body</label><input type="text" value={issuingBody} onChange={(e) => setIssuingBody(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="e.g. Textile Exchange" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Description / Requirements</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" rows={4} placeholder="What does this certificate mean? What are the requirements or qualifications to obtain it?" /></div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">{saving ? "Saving..." : editing ? "Update" : "Create"}</button>
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
