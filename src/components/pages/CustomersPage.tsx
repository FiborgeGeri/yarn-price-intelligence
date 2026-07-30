"use client";
import { useState, useEffect } from "react";
import { Permissions } from "@/lib/permissions";

interface Customer { id: number; name: string; company: string; country: string; email: string; phone: string; notes: string; quoteCount: number; }
interface Props { permissions: Permissions; }

export default function CustomersPage({ permissions }: Props) {
  const [list, setList] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [toast, setToast] = useState<{ type: string; text: string } | null>(null);
  const [name, setName] = useState(""); const [company, setCompany] = useState(""); const [country, setCountry] = useState("");
  const [email, setEmail] = useState(""); const [phone, setPhone] = useState(""); const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => { setLoading(true); setList(await fetch("/api/customers").then((r) => r.json())); setLoading(false); };
  useEffect(() => { load(); }, []);

  const openForm = (c?: Customer) => {
    if (c) { setEditing(c); setName(c.name); setCompany(c.company || ""); setCountry(c.country || ""); setEmail(c.email || ""); setPhone(c.phone || ""); setNotes(c.notes || ""); }
    else { setEditing(null); setName(""); setCompany(""); setCountry(""); setEmail(""); setPhone(""); setNotes(""); }
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!name) return; setSaving(true);
    const res = await fetch("/api/customers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editing?.id, name, company, country, email, phone, notes }) });
    if (res.ok) { setToast({ type: "success", text: editing ? "Updated" : "Created" }); setShowForm(false); load(); }
    else setToast({ type: "error", text: "Failed" });
    setSaving(false); setTimeout(() => setToast(null), 3000);
  };

  const handleDelete = async (id: number) => { if (!confirm("Delete this customer and all their quotations?")) return; await fetch(`/api/customers?id=${id}`, { method: "DELETE" }); load(); };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-slate-900">Customers</h1><p className="text-sm text-slate-500">{list.length} customers</p></div>
        {permissions.canEdit && <button onClick={() => openForm()} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">+ Add Customer</button>}
      </div>
      {toast && <div className={`mb-4 p-3 rounded-lg text-sm ${toast.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{toast.text}</div>}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="bg-slate-50 text-left text-slate-600">
            <th className="px-4 py-3 font-medium">Name</th><th className="px-4 py-3 font-medium">Company</th><th className="px-4 py-3 font-medium">Country</th><th className="px-4 py-3 font-medium">Email</th><th className="px-4 py-3 font-medium">Phone</th><th className="px-4 py-3 font-medium text-center">Quotes</th>
            {(permissions.canEdit || permissions.canDelete) && <th className="px-4 py-3 font-medium w-20">Actions</th>}
          </tr></thead>
          <tbody>
            {list.length === 0 ? <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">No customers yet</td></tr> :
              list.map((c) => (
                <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-slate-600">{c.company || "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{c.country || "—"}</td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{c.email || "—"}</td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{c.phone || "—"}</td>
                  <td className="px-4 py-3 text-center">{c.quoteCount}</td>
                  {(permissions.canEdit || permissions.canDelete) && <td className="px-4 py-3"><div className="flex gap-2">
                    {permissions.canEdit && <button onClick={() => openForm(c)} className="text-blue-600 hover:text-blue-800 text-xs">Edit</button>}
                    {permissions.canDelete && <button onClick={() => handleDelete(c.id)} className="text-red-500 hover:text-red-700 text-xs">Del</button>}
                  </div></td>}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {showForm && permissions.canEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{editing ? "Edit Customer" : "Add Customer"}</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Name *</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" required /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Company</label><input type="text" value={company} onChange={(e) => setCompany(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Country</label><input type="text" value={country} onChange={(e) => setCountry(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Phone</label><input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
              </div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Notes</label><textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" rows={2} /></div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">{saving ? "Saving..." : editing ? "Update" : "Create"}</button>
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
