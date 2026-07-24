"use client";
import { useState, useEffect } from "react";
import { Permissions } from "@/lib/permissions";

interface Treatment {
  id: number; name: string; yarnCount: number;
}

interface Props {
  permissions: Permissions;
}

export default function TreatmentsPage({ permissions }: Props) {
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Treatment | null>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: string; text: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    const data = await fetch("/api/treatments").then((r) => r.json());
    setTreatments(data);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const openForm = (t?: Treatment) => {
    if (t) { setEditing(t); setName(t.name); }
    else { setEditing(null); setName(""); }
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    setSaving(true);
    const res = await fetch("/api/treatments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editing?.id, name }),
    });
    if (res.ok) {
      setToast({ type: "success", text: editing ? "Updated" : "Created" });
      setShowForm(false); loadData();
    }
    setSaving(false);
    setTimeout(() => setToast(null), 3000);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this treatment?")) return;
    await fetch(`/api/treatments?id=${id}`, { method: "DELETE" });
    setTreatments(treatments.filter((t) => t.id !== id));
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Treatments</h1>
          <p className="text-sm text-slate-500">{treatments.length} treatments</p>
        </div>
        {permissions.canEdit && (
          <button onClick={() => openForm()} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">+ Add Treatment</button>
        )}
      </div>

      {toast && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${toast.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{toast.text}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {treatments.map((t) => (
          <div key={t.id} className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-semibold">{t.name}</div>
                <div className="text-sm text-slate-500 mt-1">{t.yarnCount} yarns using this treatment</div>
              </div>
              {(permissions.canEdit || permissions.canDelete) && (
                <div className="flex gap-1">
                  {permissions.canEdit && (
                    <button onClick={() => openForm(t)} className="text-blue-600 text-xs px-2 py-1">Edit</button>
                  )}
                  {permissions.canDelete && (
                    <button onClick={() => handleDelete(t.id)} className="text-red-500 text-xs px-2 py-1">Del</button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {showForm && permissions.canEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{editing ? "Edit Treatment" : "Add Treatment"}</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Treatment Name *</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" required />
              </div>
              <div className="flex gap-3">
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
