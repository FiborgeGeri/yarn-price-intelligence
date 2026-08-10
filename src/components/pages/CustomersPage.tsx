"use client";
import { useState, useEffect } from "react";
import { Permissions } from "@/lib/permissions";

interface Customer { id: number; name: string; company: string; country: string; email: string; phone: string; notes: string; }
interface Contact { id: number; customerId: number; contactName: string; department: string; position: string; email: string; phone: string; notes: string; }
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

  // Contacts
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [cName, setCName] = useState(""); const [cDept, setCDept] = useState(""); const [cPos, setCPos] = useState("");
  const [cEmail, setCEmail] = useState(""); const [cPhone, setCPhone] = useState(""); const [cNotes, setCNotes] = useState("");
  const [cSaving, setCSaving] = useState(false);

  const load = async () => { setLoading(true); setList(await fetch("/api/customers").then((r) => r.json())); setLoading(false); };
  useEffect(() => { load(); }, []);

  const loadContacts = async (c: Customer) => {
    setViewingCustomer(c); setContactsLoading(true);
    setContacts(await fetch(`/api/customer-contacts?customerId=${c.id}`).then((r) => r.json()));
    setContactsLoading(false);
  };

  const openForm = (c?: Customer) => {
    if (c) { setEditing(c); setName(c.name); setCompany(c.company || ""); setCountry(c.country || ""); setEmail(c.email || ""); setPhone(c.phone || ""); setNotes(c.notes || ""); }
    else { setEditing(null); setName(""); setCompany(""); setCountry(""); setEmail(""); setPhone(""); setNotes(""); }
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!name) return; setSaving(true);
    const res = await fetch("/api/customers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editing?.id, name, company, country, email, phone, notes }) });
    if (res.ok) { setToast({ type: "success", text: editing ? "Updated" : "Created" }); setShowForm(false); load(); } else setToast({ type: "error", text: "Failed" });
    setSaving(false); setTimeout(() => setToast(null), 3000);
  };

  const handleDelete = async (id: number) => { if (!confirm("Delete this customer?")) return; await fetch(`/api/customers?id=${id}`, { method: "DELETE" }); load(); };

  const openContactForm = (ct?: Contact) => {
    if (ct) { setEditingContact(ct); setCName(ct.contactName); setCDept(ct.department || ""); setCPos(ct.position || ""); setCEmail(ct.email || ""); setCPhone(ct.phone || ""); setCNotes(ct.notes || ""); }
    else { setEditingContact(null); setCName(""); setCDept(""); setCPos(""); setCEmail(""); setCPhone(""); setCNotes(""); }
    setShowContactForm(true);
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!viewingCustomer || !cName) return; setCSaving(true);
    const res = await fetch("/api/customer-contacts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editingContact?.id, customerId: viewingCustomer.id, contactName: cName, department: cDept, position: cPos, email: cEmail, phone: cPhone, notes: cNotes }) });
    if (res.ok) { setShowContactForm(false); loadContacts(viewingCustomer); } setCSaving(false);
  };

  const handleContactDelete = async (id: number) => { if (!confirm("Delete this contact?")) return; await fetch(`/api/customer-contacts?id=${id}`, { method: "DELETE" }); if (viewingCustomer) loadContacts(viewingCustomer); };

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
          <thead><tr className="bg-slate-50 text-left text-slate-600"><th className="px-4 py-3 font-medium">Name</th><th className="px-4 py-3 font-medium">Company</th><th className="px-4 py-3 font-medium">Country</th><th className="px-4 py-3 font-medium">Email</th><th className="px-4 py-3 font-medium">Phone</th><th className="px-4 py-3 font-medium w-28">Actions</th></tr></thead>
          <tbody>
            {list.length === 0 ? <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No customers yet</td></tr> :
              list.map((c) => (
                <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-slate-600">{c.company || "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{c.country || "—"}</td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{c.email || "—"}</td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{c.phone || "—"}</td>
                  <td className="px-4 py-3"><div className="flex gap-2">
                    <button onClick={() => loadContacts(c)} className="text-slate-600 hover:text-slate-900 text-xs">Contacts</button>
                    {permissions.canEdit && <button onClick={() => openForm(c)} className="text-blue-600 hover:text-blue-800 text-xs">Edit</button>}
                    {permissions.canDelete && <button onClick={() => handleDelete(c.id)} className="text-red-500 hover:text-red-700 text-xs">Del</button>}
                  </div></td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Customer form */}
      {showForm && permissions.canEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between"><h2 className="text-lg font-semibold">{editing ? "Edit Customer" : "Add Customer"}</h2><button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button></div>
          <form onSubmit={handleSubmit} className="p-4 space-y-3">
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Name *</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" required /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Company</label><input type="text" value={company} onChange={(e) => setCompany(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
            <div className="grid grid-cols-2 gap-3"><div><label className="block text-sm font-medium text-slate-700 mb-1">Country</label><input type="text" value={country} onChange={(e) => setCountry(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div><div><label className="block text-sm font-medium text-slate-700 mb-1">Phone</label><input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Notes</label><textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" rows={2} /></div>
            <div className="flex gap-3 pt-2"><button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">{saving ? "Saving..." : editing ? "Update" : "Create"}</button><button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300">Cancel</button></div>
          </form>
        </div></div>
      )}

      {/* Contacts modal */}
      {viewingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between"><div><h2 className="text-lg font-semibold">Contacts</h2><p className="text-xs text-slate-500 mt-0.5">{viewingCustomer.name}{viewingCustomer.company ? ` — ${viewingCustomer.company}` : ""}</p></div><button onClick={() => setViewingCustomer(null)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button></div>
          <div className="p-4">
            {permissions.canEdit && <div className="mb-4"><button onClick={() => openContactForm()} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700">+ Add Contact</button></div>}
            {contactsLoading ? <div className="py-8 text-center text-slate-400">Loading...</div> : contacts.length === 0 ? <div className="py-8 text-center text-slate-400 text-sm">No contacts yet</div> : (
              <div className="space-y-3">
                {contacts.map((ct) => (
                  <div key={ct.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium text-sm">{ct.contactName}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{[ct.position, ct.department].filter(Boolean).join(" · ") || "—"}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{[ct.email, ct.phone].filter(Boolean).join(" · ") || "—"}</div>
                        {ct.notes && <div className="text-xs text-slate-400 mt-1">{ct.notes}</div>}
                      </div>
                      {(permissions.canEdit || permissions.canDelete) && <div className="flex gap-2">{permissions.canEdit && <button onClick={() => openContactForm(ct)} className="text-blue-600 text-xs">Edit</button>}{permissions.canDelete && <button onClick={() => handleContactDelete(ct.id)} className="text-red-500 text-xs">Del</button>}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div></div>
      )}

      {/* Contact form */}
      {showContactForm && permissions.canEdit && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"><div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between"><h2 className="text-lg font-semibold">{editingContact ? "Edit Contact" : "Add Contact"}</h2><button onClick={() => setShowContactForm(false)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button></div>
          <form onSubmit={handleContactSubmit} className="p-4 space-y-3">
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Contact Name *</label><input type="text" value={cName} onChange={(e) => setCName(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" required /></div>
            <div className="grid grid-cols-2 gap-3"><div><label className="block text-sm font-medium text-slate-700 mb-1">Position</label><input type="text" value={cPos} onChange={(e) => setCPos(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="e.g. Buyer" /></div><div><label className="block text-sm font-medium text-slate-700 mb-1">Department</label><input type="text" value={cDept} onChange={(e) => setCDept(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="e.g. Sourcing" /></div></div>
            <div className="grid grid-cols-2 gap-3"><div><label className="block text-sm font-medium text-slate-700 mb-1">Email</label><input type="email" value={cEmail} onChange={(e) => setCEmail(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div><div><label className="block text-sm font-medium text-slate-700 mb-1">Phone</label><input type="text" value={cPhone} onChange={(e) => setCPhone(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Notes</label><textarea value={cNotes} onChange={(e) => setCNotes(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" rows={2} /></div>
            <div className="flex gap-3 pt-2"><button type="submit" disabled={cSaving} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">{cSaving ? "Saving..." : editingContact ? "Update" : "Create"}</button><button type="button" onClick={() => setShowContactForm(false)} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300">Cancel</button></div>
          </form>
        </div></div>
      )}
    </div>
  );
}
