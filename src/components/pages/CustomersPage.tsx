"use client";
import { useState, useEffect, useMemo } from "react";
import { Permissions } from "@/lib/permissions";
import { getUserId } from "@/lib/getUserId";
import AuditInfo from "@/components/AuditInfo";

interface Customer {
  id: number;
  name: string;
  officialName: string;
  country: string;
  addressLocal: string;
  addressEnglish: string;
  telephone: string;
  notes: string;
  createdByName: string;
  updatedByName: string;
  createdAt: string;
  updatedAt: string;
}
interface Contact {
  id: number;
  customerId: number;
  contactName: string;
  department: string;
  position: string;
  email: string;
  phone: string;
  cellPhone: string;
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
  const [officialName, setOfficialName] = useState("");
  const [country, setCountry] = useState("");
  const [addressLocal, setAddressLocal] = useState("");
  const [addressEnglish, setAddressEnglish] = useState("");
  const [telephone, setTelephone] = useState("");
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
  const [cCellPhone, setCCellPhone] = useState("");
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
        c.officialName?.toLowerCase().includes(s) ||
        c.country?.toLowerCase().includes(s) ||
        c.addressLocal?.toLowerCase().includes(s) ||
        c.addressEnglish?.toLowerCase().includes(s) ||
        contacts.some((ct) => ct.contactName?.toLowerCase().includes(s) || ct.email?.toLowerCase().includes(s) || ct.phone?.toLowerCase().includes(s) || ct.cellPhone?.toLowerCase().includes(s));
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
      setName(c.name || "");
      setOfficialName(c.officialName || "");
      setCountry(c.country || "");
      setAddressLocal(c.addressLocal || "");
      setAddressEnglish(c.addressEnglish || "");
      setTelephone(c.telephone || "");
      setNotes(c.notes || "");
    } else {
      setEditing(null);
      setName("");
      setOfficialName("");
      setCountry("");
      setAddressLocal("");
      setAddressEnglish("");
      setTelephone("");
      setNotes("");
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
      body: JSON.stringify({
        id: editing?.id,
        name,
        officialName,
        country,
        addressLocal,
        addressEnglish,
        telephone,
        notes,
        userId: getUserId(),
      }),
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
    if (!confirm("Delete this customer?")) return;
    await fetch(`/api/customers?id=${id}`, { method: "DELETE" });
    load();
  };

  const openContactForm = (customer: Customer, ct?: Contact) => {
    setViewingCustomer(customer);
    if (ct) {
      setEditingContact(ct);
      setCName(ct.contactName || "");
      setCDept(ct.department || "");
      setCPos(ct.position || "");
      setCEmail(ct.email || "");
      setCPhone(ct.phone || "");
      setCCellPhone(ct.cellPhone || "");
      setCNotes(ct.notes || "");
    } else {
      setEditingContact(null);
      setCName("");
      setCDept("");
      setCPos("");
      setCEmail("");
      setCPhone("");
      setCCellPhone("");
      setCNotes("");
    }
    setShowContactForm(true);
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewingCustomer || !cName) return;
    setCSaving(true);
    const res = await fetch("/api/customer-contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editingContact?.id,
        customerId: viewingCustomer.id,
        contactName: cName,
        department: cDept,
        position: cPos,
        email: cEmail,
        phone: cPhone,
        cellPhone: cCellPhone,
        notes: cNotes,
        userId: getUserId(),
      }),
    });
    if (res.ok) {
      setShowContactForm(false);
      load();
    }
    setCSaving(false);
  };

  const handleContactDelete = async (id: number) => {
    if (!confirm("Delete this contact?")) return;
    await fetch(`/api/customer-contacts?id=${id}`, { method: "DELETE" });
    load();
  };

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
                  <div className="mb-1">
                    <h3 className="text-lg font-semibold text-slate-900">{c.name}</h3>
                    {c.officialName && <div className="text-sm text-slate-500 mt-0.5">Official: {c.officialName}</div>}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 text-sm">
                    <div>
                      <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">Company Info</div>
                      <div className="space-y-1 text-slate-600">
                        <div>Country: {c.country || "—"}</div>
                        <div>Phone: {c.telephone || "—"}</div>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">Address</div>
                      <div className="space-y-1 text-slate-600 text-xs">
                        {c.addressEnglish && <div className="whitespace-pre-line">{c.addressEnglish}</div>}
                        {c.addressLocal && c.addressLocal !== c.addressEnglish && (
                          <div className="whitespace-pre-line text-slate-400 mt-1">{c.addressLocal}</div>
                        )}
                        {!c.addressEnglish && !c.addressLocal && <div>—</div>}
                      </div>
                    </div>
                  </div>
                  {c.notes && <div className="mt-3 text-sm text-slate-600"><span className="text-xs uppercase tracking-wide text-slate-500 block mb-1">Notes</span>{c.notes}</div>}
                  <AuditInfo createdByName={c.createdByName} updatedByName={c.updatedByName} createdAt={c.createdAt} updatedAt={c.updatedAt} className="mt-3 pt-2 border-t border-slate-100" />
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
                            <div className="text-xs text-slate-500 mt-1 break-words">Email: {ct.email || "—"}</div>
                            <div className="text-xs text-slate-500">Phone: {ct.phone || "—"}</div>
                            <div className="text-xs text-slate-500">Cell: {ct.cellPhone || "—"}</div>
                            {ct.notes && <div className="text-xs text-slate-400 mt-1">{ct.notes}</div>}
                          </div>
                          {(permissions.canEdit || permissions.canDelete) && (
                            <div className="flex gap-2 shrink-0">
                              {permissions.canEdit && <button onClick={() => openContactForm(c, ct)} className="text-blue-600 text-xs">Edit</button>}
                              {permissions.canDelete && <button onClick={() => handleContactDelete(ct.id)} className="text-red-500 text-xs">Del</button>}
                            </div>
                          )}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{editing ? "Edit Customer" : "Add Customer"}</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Customer Name (Display) *</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Official Name</label>
                <input type="text" value={officialName} onChange={(e) => setOfficialName(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="Registered company / legal entity name" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Country</label>
                  <input type="text" value={country} onChange={(e) => setCountry(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                  <input type="text" value={telephone} onChange={(e) => setTelephone(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Address (Local Language)</label>
                <textarea
                  value={addressLocal}
                  onChange={(e) => setAddressLocal(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  rows={3}
                  placeholder="Full address in local language"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Address (English)</label>
                <textarea
                  value={addressEnglish}
                  onChange={(e) => setAddressEnglish(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  rows={3}
                  placeholder="Full address in English"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" rows={2} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">{saving ? "Saving..." : editing ? "Update" : "Create"}</button>
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showContactForm && permissions.canEdit && viewingCustomer && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{editingContact ? "Edit Contact" : "Add Contact"}</h2>
              <button onClick={() => setShowContactForm(false)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
            </div>
            <form onSubmit={handleContactSubmit} className="p-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Contact Name *</label>
                <input type="text" value={cName} onChange={(e) => setCName(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                  <input type="text" value={cPos} onChange={(e) => setCPos(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="e.g. Senior Buyer" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                  <input type="text" value={cDept} onChange={(e) => setCDept(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="e.g. Sourcing" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input type="email" value={cEmail} onChange={(e) => setCEmail(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                  <input type="text" value={cPhone} onChange={(e) => setCPhone(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Cell Phone</label>
                  <input type="text" value={cCellPhone} onChange={(e) => setCCellPhone(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <textarea value={cNotes} onChange={(e) => setCNotes(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" rows={2} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={cSaving} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">{cSaving ? "Saving..." : editingContact ? "Update" : "Create"}</button>
                <button type="button" onClick={() => setShowContactForm(false)} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
