"use client";
import { useState, useEffect } from "react";
import { Permissions } from "@/lib/permissions";

interface SpinningType { id: number; name: string; }
interface Props { permissions: Permissions; }

export default function SpinningTypesPage({ permissions }: Props) {
  const [items, setItems] = useState<SpinningType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<SpinningType | null>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: string; text: string } | null>(null);

  const load = async () => {
    setLoading(true);
    setItems(await fetch("/api/spinning-types").then((r) => r.json()));
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openForm = (item?: SpinningType) => {
    setEditing(item || null);
    setName(item?.name || "");
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    const res = await fetch("/api/spinning-types", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editing?.id, name: name.trim() }),
    });
    if (res.ok) {
      setToast({ type: "success", text: editing ? "Updated" : "Created" });
      setShowForm(false);
      load();
    } else {
      setToast({ type: "error", text: "Failed" });
    }
    setSaving(false);
    setTimeout(() => setToast(null), 3000);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this spinning type?")) return;
    await fetch(`/api/spinning-types?id=${id}`, { method: "DELETE" });
    load();
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Spinning Types</h1>
          <p className="text-sm text-slate-500">{items.length} spinning types</p>
        </div>
        {permissions.canEdit && (
          <button onClick={() => openForm()} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            + Add Spinning Type
          </button>
        )}
      </div>

      {toast && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${toast.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {toast.text}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="divide-y divide-slate-100">
          {items.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-sm">No spinning types yet. Add one to get started.</div>
          ) : items.map((item) => (
            <div key={item.id} className="px-4 py-3 flex items-center justify-between hover:bg-slate-50">
              <span className="text-sm font-medium text-slate-900">{item.name}</span>
              {(permissions.canEdit || permissions.canDelete) && (
                <div className="flex gap-2">
                  {permissions.canEdit && <button onClick={() => openForm(item)} className="text-blue-600 hover:text-blue-800 text-xs">Edit</button>}
                  {permissions.canDelete && <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-700 text-xs">Del</button>}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {showForm && permissions.canEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{editing ? "Edit Spinning Type" : "Add Spinning Type"}</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" required autoFocus />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                  {saving ? "Saving..." : editing ? "Update" : "Create"}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
