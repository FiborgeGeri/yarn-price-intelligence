"use client";
import { useState, useEffect, useMemo } from "react";
import { Permissions } from "@/lib/permissions";

interface Customer {
  id: number;
  name: string;
  company: string;
  country: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  notes: string;
}
interface Contact {
  id: number;
  customerId: number;
  contactName: string;
  department: string;
  position: string;
  email: string;
  phone: string;
  notes: string;
}
interface Props { permissions: Permissions; }

export default function CustomersPage({ permissions }: Props) {
  const [list, setList] = useState<Customer[]>([]);
  const [allContacts, setAllContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [toast, setToast] = useState<{ type: string; text: string } | null>(null);
  const [search, setSearch] = useState("");

  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [country, setCountry] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Contacts management
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [cName, setCName] = useState("");
  const [cDept, setCDept] = useState("");
  const [cPos, setCPos] = useState("");
  const [cEmail, setCEmail] = useState("");
  const [cPhone, setCPhone] = useState("");
  const [cNotes, setCNotes] = useState("");
  const [cSaving, setCSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const [customersData, contactsData] = await Promise.all([
      fetch("/api/customers").then((r) => r.json()),
      fetch("/api/customer-contacts").then((r) => r.json()),
    ]);
    setList(customersData);
    setAllContacts(contactsData);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return list;
    const s = search.toLowerCase();
    return list.filter((c) => {
      const contacts = allContacts.filter((ct) => ct.customerId === c.id);
      return c.name?.toLowerCase().includes(s) ||
        c.company?.toLowerCase().includes(s) ||
        c.country?.toLowerCase().includes(s) ||
        c.city?.toLowerCase().includes(s) ||
        c.addressLine1?.toLowerCase().includes(s) ||
        contacts.some((ct) => ct.contactName?.toLowerCase().includes(s) || ct.email?.toLowerCase().includes(s) || ct.phone?.toLowerCase().includes(s));
    });
  }, [list, allContacts, search]);

  const contactsByCustomer = useMemo(() => {
    const map: Record<number, Contact[]> = {};
    for (const ct of allContacts) {
      if (!map[ct.customerId]) map[ct.customerId] = [];
      map[ct.customerId].push(ct);
    }
    return map;
  }, [allContacts]);

  const openForm = (c?: Customer) => {
    if (c) {
      setEditing(c);
      setName(c.name || ""); setCompany(c.company || ""); setCountry(c.country || "");
      setEmail(c.email || ""); setPhone(c.phone || "");
      setAddressLine1(c.addressLine1 || ""); setAddressLine2(c.addressLine2 || "");
      setCity(c.city || ""); setState(c.state || ""); setPostalCode(c.postalCode || "");
      setNotes(c.notes || "");
    } else {
      setEditing(null);
      setName(""); setCompany(""); setCountry(""); setEmail(""); setPhone("");
      setAddressLine1(""); setAddressLine2(""); setCity(""); setState(""); setPostalCode(""); setNotes("");
    }
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    setSaving(true);
    const res = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editing?.id, name, company, country, email, phone, addressLine1, addressLine2, city, state, postalCode, notes }),
    });
    if (res.ok) { setToast({ type: "success", text: editing ? "Updated" : "Created" }); setShowForm(false); load(); }
    else setToast({ type: "error", text: "Failed" });
    setSaving(false); setTimeout(() => setToast(null), 3000);
  };

  const handleDelete = async (id: number) => { if (!confirm("Delete this customer?")) return; await fetch(`/api/customers?id=${id}`, { method: "DELETE" }); load(); };

  const openContactForm = (customer: Customer, ct?: Contact) => {
    setViewingCustomer(customer);
    if (ct) {
      setEditingContact(ct);
      setCName(ct.contactName || ""); setCDept(ct.department || ""); setCPos(ct.position || "");
      setCEmail(ct.email || ""); setCPhone(ct.phone || ""); setCNotes(ct.notes || "");
    } else {
      setEditingContact(null);
      setCName(""); setCDept(""); setCPos(""); setCEmail(""); setCPhone(""); setCNotes("");
    }
    setShowContactForm(true);
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!viewingCustomer || !cName) return; setCSaving(true);
    const res = await fetch("/api/customer-contacts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editingContact?.id, customerId: viewingCustomer.id, contactName: cName, department: cDept, position: cPos, email: cEmail, phone: cPhone, notes: cNotes }) });
    if (res.ok) { setShowContactForm(false); load(); }
    setCSaving(false);
  };

  const handleContactDelete = async (id: number) => { if (!confirm("Delete this contact?")) return; await fetch(`/api/customer-contacts?id=${id}`, { method: "DELETE" }); load(); };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
        <div><h1 className="text-2xl font-bold text-slate-900">Customers</h1><p className="text-sm text-slate-500">{filtered.length} customer record(s)</p></div>
        <div className="flex gap-2">
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Search company, address, contact..." />
          {permissions.canEdit && <button onClick={() => openForm()} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">+ Add Customer</button>}
        </div>
      </div>
      {toast && <div className={`mb-4 p-3 rounded-lg text-sm ${toast.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{toast.text}</div>}

      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl p-10 text-center border border-slate-200 text-slate-400">No customers found</div>
        ) : filtered.map((c) => {
          const contacts = contactsByCustomer[c.id] || [];
          return (
            <div key={c.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-slate-900">{c.name}</h3>
                    {c.company && <span className="text-sm text-slate-500">— {c.company}</span>}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 text-sm">
                    <div>
                      <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">Company Info</div>
                      <div className="space-y-1 text-slate-600">
                        <div>Country: {c.country || "—"}</div>
                        <div>Email: {c.email || "—"}</div>
                        <div>Phone: {c.phone || "—"}</div>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">Address</div>
                      <div className="space-y-1 text-slate-600">
                        <div>{c.addressLine1 || "—"}</div>
                        {c.addressLine2 && <div>{c.addressLine2}</div>}
                        <div>{[c.city, c.state, c.postalCode].filter(Boolean).join(", ") || "—"}</div>
                        <div>{c.country || "—"}</div>
                      </div>
                    </div>
                  </div>
                  {c.notes && <div className="mt-3 text-sm text-slate-600"><span className="text-xs uppercase tracking-wide text-slate-500 block mb-1">Notes</span>{c.notes}</div>}
                </div>
                <div className="flex gap-2 shrink-0">
                  {permissions.canEdit && <button onClick={() => openContactForm(c)} className="text-slate-600 hover:text-slate-900 text-sm">+ Contact</button>}
                  {permissions.canEdit && <button onClick={() => openForm(c)} className="text-blue-600 hover:text-blue-800 text-sm">Edit</button>}
                  {permissions.canDelete && <button onClick={() => handleDelete(c.id)} className="text-red-500 hover:text-red-700 text-sm">Delete</button>}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="text-xs uppercase tracking-wide text-slate-500 mb-2">Contacts</div>
                {contacts.length === 0 ? (
                  <div className="text-sm text-slate-400">No contacts yet</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {contacts.map((ct) => (
                      <div key={ct.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="font-medium text-sm text-slate-900">{ct.contactName}</div>
                            <div className="text-xs text-slate-500 mt-0.5">{[ct.position, ct.department].filter(Boolean).join(" · ") || "—"}</div>
                            <div className="text-xs text-slate-500 mt-1 break-words">{ct.email || "—"}</div>
                            <div className="text-xs text-slate-500">{ct.phone || "—"}</div>
                            {ct.notes && <div className="text-xs text-slate-400 mt-1">{ct.notes}</div>}
                          </div>
                          {(permissions.canEdit || permissions.canDelete) && <div className="flex gap-2 shrink-0">{permissions.canEdit && <button onClick={() => openContactForm(c, ct)} className="text-blue-600 text-xs">Edit</button>}{permissions.canDelete && <button onClick={() => handleContactDelete(ct.id)} className="text-red-500 text-xs">Del</button>}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showForm && permissions.canEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between"><h2 className="text-lg font-semibold">{editing ? "Edit Customer" : "Add Customer"}</h2><button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button></div>
          <form onSubmit={handleSubmit} className="p-4 space-y-3">
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Name *</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" required /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Company</label><input type="text" value={company} onChange={(e) => setCompany(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
            <div className="grid grid-cols-2 gap-3"><div><label className="block text-sm font-medium text-slate-700 mb-1">Country</label><input type="text" value={country} onChange={(e) => setCountry(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div><div><label className="block text-sm font-medium text-slate-700 mb-1">Phone</label><input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Address Line 1</label><input type="text" value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Address Line 2</label><input type="text" value={addressLine2} onChange={(e) => setAddressLine2(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
            <div className="grid grid-cols-3 gap-3"><div><label className="block text-sm font-medium text-slate-700 mb-1">City</label><input type="text" value={city} onChange={(e) => setCity(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div><div><label className="block text-sm font-medium text-slate-700 mb-1">State</label><input type="text" value={state} onChange={(e) => setState(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div><div><label className="block text-sm font-medium text-slate-700 mb-1">Postal Code</label><input type="text" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Notes</label><textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" rows={2} /></div>
            <div className="flex gap-3 pt-2"><button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">{saving ? "Saving..." : editing ? "Update" : "Create"}</button><button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300">Cancel</button></div>
          </form>
        </div></div>
      )}

      {showContactForm && permissions.canEdit && viewingCustomer && (
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
