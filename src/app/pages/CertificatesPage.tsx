"use client";
import { useState, useEffect } from "react";
import { Permissions } from "@/lib/permissions";

interface Certificate {
  id: number; certCode: string; certFullName: string; category: string;
  issuingBody: string; description: string;
  yarns: Array<{ yarnId: number; yarnName: string }>;
}

interface Props {
  permissions: Permissions;
}

export default function CertificatesPage({ permissions }: Props) {
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Certificate | null>(null);
  const [toast, setToast] = useState<{ type: string; text: string } | null>(null);

  const [code, setCode] = useState("");
  const [fullName, setFullName] = useState("");
  const [category, setCategory] = useState("Animal Fiber");
  const [issuingBody, setIssuingBody] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const data = await fetch("/api/certificates").then((r) => r.json());
    setCerts(data);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const openForm = (c?: Certificate) => {
    if (c) {
      setEditing(c); setCode(c.certCode); setFullName(c.certFullName || "");
      setCategory(c.category || "Animal Fiber"); setIssuingBody(c.issuingBody || "");
      setDescription(c.description || "");
    } else {
      setEditing(null); setCode(""); setFullName(""); setCategory("Animal Fiber");
      setIssuingBody(""); setDescription("");
    }
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;
    setSaving(true);
    const res = await fetch("/api/certificates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editing?.id, certCode: code, certFullName: fullName, category, issuingBody, description }),
    });
    if (res.ok) {
      setToast({ type: "success", text: editing ? "Updated" : "Created" });
      setShowForm(false); loadData();
    }
    setSaving(false);
    setTimeout(() => setToast(null), 3000);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this certificate?")) return;
    await fetch(`/api/certificates?id=${id}`, { method: "DELETE" });
    setCerts(certs.filter((c) => c.id !== id));
  };

  const categories = [...new Set(certs.map((c) => c.category).filter(Boolean))];

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Certificates</h1>
          <p className="text-sm text-slate-500">{certs.length} certificates</p>
        </div>
        {permissions.canEdit && (
          <button onClick={() => openForm()} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">+ Add Certificate</button>
        )}
      </div>

      {toast && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${toast.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{toast.text}</div>
      )}

      {categories.map((cat) => (
        <div key={cat} className="mb-6">
          <h2 className="text-lg font-semibold text-slate-700 mb-3">{cat}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {certs.filter((c) => c.category === cat).map((c) => (
              <div key={c.id} className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-sm">{c.certCode}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{c.certFullName}</div>
                    {c.issuingBody && <div className="text-xs text-slate-400 mt-1">By: {c.issuingBody}</div>}
                    {c.yarns.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {c.yarns.map((y) => (
                          <span key={y.yarnId} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">{y.yarnName}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  {(permissions.canEdit || permissions.canDelete) && (
                    <div className="flex gap-1">
                      {permissions.canEdit && (
                        <button onClick={() => openForm(c)} className="text-blue-600 text-xs px-1">Edit</button>
                      )}
                      {permissions.canDelete && (
                        <button onClick={() => handleDelete(c.id)} className="text-red-500 text-xs px-1">Del</button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {showForm && permissions.canEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{editing ? "Edit Certificate" : "Add Certificate"}</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Code *</label>
                  <input type="text" value={code} onChange={(e) => setCode(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                    <option>Animal Fiber</option><option>Textile</option><option>Quality</option><option>Social</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Issuing Body</label>
                <input type="text" value={issuingBody} onChange={(e) => setIssuingBody(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                  {saving ? "Saving..." : editing ? "Update" : "Create"}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
