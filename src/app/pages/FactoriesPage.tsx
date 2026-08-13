"use client";
import { useState, useEffect } from "react";
import { Permissions } from "@/lib/permissions";

interface Factory {
  id: number; factoryName: string; country: string; contactPerson: string;
  email: string; notes: string; relationship: string; parentFactoryId: number | null;
  status: string; yarnCount: number;
}

interface Props {
  permissions: Permissions;
}

export default function FactoriesPage({ permissions }: Props) {
  const [factories, setFactories] = useState<Factory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Factory | null>(null);
  const [toast, setToast] = useState<{ type: string; text: string } | null>(null);

  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [rel, setRel] = useState("My Factory");
  const [parentId, setParentId] = useState<number | null>(null);
  const [status, setStatus] = useState("Active");
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const data = await fetch("/api/factories").then((r) => r.json());
    setFactories(data);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const openForm = (f?: Factory) => {
    if (f) {
      setEditing(f);
      setName(f.factoryName); setCountry(f.country || ""); setContact(f.contactPerson || "");
      setEmail(f.email || ""); setNotes(f.notes || ""); setRel(f.relationship);
      setParentId(f.parentFactoryId); setStatus(f.status || "Active");
    } else {
      setEditing(null);
      setName(""); setCountry(""); setContact(""); setEmail(""); setNotes("");
      setRel("My Factory"); setParentId(null); setStatus("Active");
    }
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    setSaving(true);
    const res = await fetch("/api/factories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editing?.id, factoryName: name, country, contactPerson: contact,
        email, notes, relationship: rel, parentFactoryId: parentId, status,
      }),
    });
    if (res.ok) {
      setToast({ type: "success", text: editing ? "Updated" : "Created" });
      setShowForm(false);
      loadData();
    } else {
      setToast({ type: "error", text: "Failed" });
    }
    setSaving(false);
    setTimeout(() => setToast(null), 3000);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this yarn mill?")) return;
    await fetch(`/api/factories?id=${id}`, { method: "DELETE" });
    setFactories(factories.filter((f) => f.id !== id));
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  const myFactories = factories.filter((f) => f.relationship === "My Factory");
  const compFactories = factories.filter((f) => f.relationship === "Competitor Factory");

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Yarn Mills</h1>
          <p className="text-sm text-slate-500">{factories.length} yarn mills</p>
        </div>
        {permissions.canEdit && (
          <button onClick={() => openForm()} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">+ Add Yarn Mill</button>
        )}
      </div>

      {toast && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${toast.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{toast.text}</div>
      )}

      {/* My Yarn Mills */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-blue-500" /> My Yarn Mills ({myFactories.length})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {myFactories.map((f) => (
            <div key={f.id} className="bg-white rounded-xl p-4 shadow-sm border-2 border-blue-200">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-slate-900">{f.factoryName}</div>
                  <div className="text-sm text-slate-500 mt-1">{f.country || "—"}</div>
                  {f.contactPerson && <div className="text-xs text-slate-400 mt-1">Contact: {f.contactPerson}</div>}
                  <div className="text-xs text-slate-400 mt-1">{f.yarnCount} yarns</div>
                  {f.notes && <div className="text-xs text-slate-400 mt-2 whitespace-pre-line">{f.notes}</div>}
                </div>
                {(permissions.canEdit || permissions.canDelete) && (
                  <div className="flex gap-1">
                    {permissions.canEdit && (
                      <button onClick={() => openForm(f)} className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1">Edit</button>
                    )}
                    {permissions.canDelete && (
                      <button onClick={() => handleDelete(f.id)} className="text-red-500 hover:text-red-700 text-xs px-2 py-1">Del</button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Competitor Yarn Mills */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500" /> Competitor Yarn Mills ({compFactories.length})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {compFactories.map((f) => (
            <div key={f.id} className="bg-white rounded-xl p-4 shadow-sm border-2 border-red-200">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-slate-900">{f.factoryName}</div>
                  <div className="text-sm text-slate-500 mt-1">{f.country || "—"}</div>
                  <div className="text-xs text-slate-400 mt-1">{f.yarnCount} yarns</div>
                  {f.notes && <div className="text-xs text-slate-400 mt-2 whitespace-pre-line">{f.notes}</div>}
                </div>
                {(permissions.canEdit || permissions.canDelete) && (
                  <div className="flex gap-1">
                    {permissions.canEdit && (
                      <button onClick={() => openForm(f)} className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1">Edit</button>
                    )}
                    {permissions.canDelete && (
                      <button onClick={() => handleDelete(f.id)} className="text-red-500 hover:text-red-700 text-xs px-2 py-1">Del</button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {showForm && permissions.canEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{editing ? "Edit Yarn Mill" : "Add Yarn Mill"}</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Yarn Mill Name *</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Country</label>
                  <input type="text" value={country} onChange={(e) => setCountry(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Relationship</label>
                  <select value={rel} onChange={(e) => setRel(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                    <option>My Factory</option>
                    <option>Competitor Factory</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Contact Person</label>
                  <input type="text" value={contact} onChange={(e) => setContact(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Parent Yarn Mill</label>
                <select value={parentId || 0} onChange={(e) => setParentId(Number(e.target.value) || null)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                  <option value={0}>None</option>
                  {factories.filter((f) => f.id !== editing?.id).map((f) => <option key={f.id} value={f.id}>{f.factoryName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" rows={3} />
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
