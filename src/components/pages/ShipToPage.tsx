"use client";
import { useState, useEffect, useMemo } from "react";
import { Permissions } from "@/lib/permissions";
import AuditInfo from "@/components/AuditInfo";

const CATEGORIES = [
  "Fabric Mill",
  "Garment Mill",
  "Dye House",
  "Knitting Mill",
  "Weaving Mill",
  "Spinning Mill",
  "Forwarder",
  "Warehouse",
  "Office",
  "Trading Company",
  "Agent",
  "Other",
];

interface Address {
  id: number;
  name: string;
  officialName: string;
  category: string;
  addressLocal: string;
  addressEnglish: string;
  country: string;
  telephone: string;
  notes: string;
  contactCount: number;
  createdAt: string;
  createdBy: number;
  createdByName: string;
  updatedAt: string;
  updatedBy: number;
  updatedByName: string;
}

interface Contact {
  id: number;
  shipToId: number;
  contactName: string;
  department: string;
  position: string;
  email: string;
  phone: string;
  cellPhone: string;
  notes: string;
}

interface Props { permissions: Permissions; }

export default function ShipToPage({ permissions }: Props) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);
  const [toast, setToast] = useState<{ type: string; text: string } | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [saving, setSaving] = useState(false);

  // Address form fields
  const [fName, setFName] = useState("");
  const [fOfficialName, setFOfficialName] = useState("");
  const [fCategory, setFCategory] = useState("");
  const [fAddressLocal, setFAddressLocal] = useState("");
  const [fAddressEnglish, setFAddressEnglish] = useState("");
  const [fCountry, setFCountry] = useState("");
  const [fTelephone, setFTelephone] = useState("");
  const [fNotes, setFNotes] = useState("");

  // Contacts
  const [viewingAddress, setViewingAddress] = useState<Address | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactLoading, setContactLoading] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [cName, setCName] = useState("");
  const [cDept, setCDept] = useState("");
  const [cPos, setCPos] = useState("");
  const [cEmail, setCEmail] = useState("");
  const [cPhone, setCPhone] = useState("");
  const [cCell, setCCell] = useState("");
  const [cNotes, setCNotes] = useState("");
  const [cSaving, setCSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const data = await fetch("/api/ship-to-addresses").then((r) => r.json());
    setAddresses(data);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const loadContacts = async (a: Address) => {
    setViewingAddress(a);
    setContactLoading(true);
    const data = await fetch(`/api/ship-to-contacts?shipToId=${a.id}`).then((r) => r.json());
    setContacts(data);
    setContactLoading(false);
  };

  const filtered = useMemo(() => {
    let r = addresses;
    if (categoryFilter) r = r.filter((a) => a.category === categoryFilter);
    if (search.trim()) {
      const s = search.toLowerCase();
      r = r.filter((a) =>
        a.name?.toLowerCase().includes(s) ||
        a.officialName?.toLowerCase().includes(s) ||
        a.addressLocal?.toLowerCase().includes(s) ||
        a.addressEnglish?.toLowerCase().includes(s) ||
        a.country?.toLowerCase().includes(s) ||
        a.category?.toLowerCase().includes(s)
      );
    }
    return r;
  }, [addresses, categoryFilter, search]);

  const openForm = (a?: Address) => {
    if (a) {
      setEditing(a);
      setFName(a.name);
      setFOfficialName(a.officialName || "");
      setFCategory(a.category || "");
      setFAddressLocal(a.addressLocal || "");
      setFAddressEnglish(a.addressEnglish || "");
      setFCountry(a.country || "");
      setFTelephone(a.telephone || "");
      setFNotes(a.notes || "");
    } else {
      setEditing(null);
      setFName("");
      setFOfficialName("");
      setFCategory("");
      setFAddressLocal("");
      setFAddressEnglish("");
      setFCountry("");
      setFTelephone("");
      setFNotes("");
    }
    setShowForm(true);
  };

  const getUserId = () => {
    try {
      const stored = localStorage.getItem("auth_user");
      if (stored) {
        const user = JSON.parse(stored);
        return user.id;
      }
    } catch {}
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fName) return;
    setSaving(true);
    const res = await fetch("/api/ship-to-addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editing?.id,
        name: fName,
        officialName: fOfficialName,
        category: fCategory,
        addressLocal: fAddressLocal,
        addressEnglish: fAddressEnglish,
        country: fCountry,
        telephone: fTelephone,
        notes: fNotes,
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
    if (!confirm("Delete this address and all its contacts?")) return;
    await fetch(`/api/ship-to-addresses?id=${id}`, { method: "DELETE" });
    load();
  };

  // Contact form handlers
  const openContactForm = (c?: Contact) => {
    if (c) {
      setEditingContact(c);
      setCName(c.contactName);
      setCDept(c.department || "");
      setCPos(c.position || "");
      setCEmail(c.email || "");
      setCPhone(c.phone || "");
      setCCell(c.cellPhone || "");
      setCNotes(c.notes || "");
    } else {
      setEditingContact(null);
      setCName("");
      setCDept("");
      setCPos("");
      setCEmail("");
      setCPhone("");
      setCCell("");
      setCNotes("");
    }
    setShowContactForm(true);
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cName || !viewingAddress) return;
    setCSaving(true);
    const res = await fetch("/api/ship-to-contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editingContact?.id,
        shipToId: viewingAddress.id,
        contactName: cName,
        department: cDept,
        position: cPos,
        email: cEmail,
        phone: cPhone,
        cellPhone: cCell,
        notes: cNotes,
        userId: getUserId(),
      }),
    });
    if (res.ok) {
      setShowContactForm(false);
      loadContacts(viewingAddress);
      load();
    }
    setCSaving(false);
  };

  const handleDeleteContact = async (id: number) => {
    if (!confirm("Delete this contact?")) return;
    await fetch(`/api/ship-to-contacts?id=${id}`, { method: "DELETE" });
    if (viewingAddress) {
      loadContacts(viewingAddress);
      load();
    }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Ship-To Addresses</h1>
          <p className="text-sm text-slate-500">{filtered.length} address(es)</p>
        </div>
        {permissions.canEdit && (
          <button onClick={() => openForm()} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            + Add Address
          </button>
        )}
      </div>

      {toast && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${toast.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {toast.text}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Search company, address, country..."
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white min-w-[160px]"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-2 bg-white rounded-xl p-10 text-center border border-slate-200 text-slate-400">No addresses found</div>
        ) : filtered.map((a) => (
          <div key={a.id} className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-900">{a.name}</div>
                {a.officialName && <div className="text-xs text-slate-400 mt-0.5">{a.officialName}</div>}
                {a.category && (
                  <span className="inline-block mt-1 px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">{a.category}</span>
                )}
                {(a.addressEnglish || a.addressLocal) && (
                  <div className="text-xs text-slate-500 mt-2 whitespace-pre-line">
                    {a.addressEnglish || a.addressLocal}
                  </div>
                )}
                {a.country && <div className="text-xs text-slate-500 mt-1">{a.country}</div>}
                {a.telephone && <div className="text-xs text-slate-400 mt-1">Tel: {a.telephone}</div>}
                {a.notes && <div className="text-xs text-slate-400 mt-2 whitespace-pre-line">{a.notes}</div>}
                <AuditInfo createdByName={a.createdByName} updatedByName={a.updatedByName} createdAt={a.createdAt} updatedAt={a.updatedAt} className="mt-3 pt-2 border-t border-slate-100" />
              </div>
              <div className="flex flex-col gap-1 shrink-0 ml-2 items-end">
                <button onClick={() => loadContacts(a)} className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1 font-medium underline">
                  {a.contactCount} contact{a.contactCount !== 1 ? "s" : ""} →
                </button>
                {permissions.canEdit && <button onClick={() => openForm(a)} className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1">Edit</button>}
                {permissions.canDelete && <button onClick={() => handleDelete(a.id)} className="text-red-500 hover:text-red-700 text-xs px-2 py-1">Del</button>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Address Form */}
      {showForm && permissions.canEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{editing ? "Edit Address" : "Add Ship-To Address"}</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Company Name (Display) *</label>
                  <input
                    type="text"
                    value={fName}
                    onChange={(e) => setFName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    placeholder="e.g. ABC Knitting"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Official Name</label>
                  <input
                    type="text"
                    value={fOfficialName}
                    onChange={(e) => setFOfficialName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    placeholder="Registered company name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                  <select
                    value={fCategory}
                    onChange={(e) => setFCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  >
                    <option value="">Select category...</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Country</label>
                  <input
                    type="text"
                    value={fCountry}
                    onChange={(e) => setFCountry(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Address (Local Language)</label>
                <textarea
                  value={fAddressLocal}
                  onChange={(e) => setFAddressLocal(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  rows={3}
                  placeholder="Full address in local language (e.g. Chinese, Japanese, Korean...)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Address (English)</label>
                <textarea
                  value={fAddressEnglish}
                  onChange={(e) => setFAddressEnglish(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  rows={3}
                  placeholder="Full address in English"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Telephone</label>
                <input
                  type="text"
                  value={fTelephone}
                  onChange={(e) => setFTelephone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <textarea
                  value={fNotes}
                  onChange={(e) => setFNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  rows={2}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "Saving..." : editing ? "Update" : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contacts Modal */}
      {viewingAddress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => { setViewingAddress(null); setShowContactForm(false); }}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Contacts — {viewingAddress.name}</h2>
                {viewingAddress.officialName && <p className="text-xs text-slate-500 mt-0.5">{viewingAddress.officialName}</p>}
              </div>
              <button onClick={() => { setViewingAddress(null); setShowContactForm(false); }} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
            </div>
            <div className="p-4">
              {contactLoading ? (
                <div className="flex justify-center py-8"><div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
              ) : (
                <>
                  {contacts.length === 0 && !showContactForm && (
                    <div className="text-center py-6 text-slate-400 text-sm">No contacts yet for this address.</div>
                  )}
                  <div className="space-y-3">
                    {contacts.map((c) => (
                      <div key={c.id} className="border border-slate-200 rounded-lg p-3 hover:border-slate-300 transition-colors">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-medium text-sm text-slate-900">{c.contactName}</div>
                            <div className="text-xs text-slate-500 mt-0.5">{[c.position, c.department].filter(Boolean).join(" · ") || "—"}</div>
                            <div className="text-xs text-slate-400 mt-1">{[c.email, c.phone, c.cellPhone].filter(Boolean).join(" · ") || "—"}</div>
                            {c.notes && <div className="text-xs text-slate-400 mt-1">{c.notes}</div>}
                          </div>
                          {(permissions.canEdit || permissions.canDelete) && (
                            <div className="flex gap-2 shrink-0">
                              {permissions.canEdit && <button onClick={() => openContactForm(c)} className="text-blue-600 hover:text-blue-800 text-xs">Edit</button>}
                              {permissions.canDelete && <button onClick={() => handleDeleteContact(c.id)} className="text-red-500 hover:text-red-700 text-xs">Del</button>}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {showContactForm ? (
                    <form onSubmit={handleContactSubmit} className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                      <h3 className="text-sm font-semibold text-slate-700">{editingContact ? "Edit Contact" : "Add Contact"}</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div><label className="block text-xs font-medium text-slate-600 mb-1">Name *</label><input type="text" value={cName} onChange={(e) => setCName(e.target.value)} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs" required /></div>
                        <div><label className="block text-xs font-medium text-slate-600 mb-1">Position</label><input type="text" value={cPos} onChange={(e) => setCPos(e.target.value)} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs" /></div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><label className="block text-xs font-medium text-slate-600 mb-1">Department</label><input type="text" value={cDept} onChange={(e) => setCDept(e.target.value)} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs" /></div>
                        <div><label className="block text-xs font-medium text-slate-600 mb-1">Email</label><input type="email" value={cEmail} onChange={(e) => setCEmail(e.target.value)} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs" /></div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><label className="block text-xs font-medium text-slate-600 mb-1">Phone</label><input type="text" value={cPhone} onChange={(e) => setCPhone(e.target.value)} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs" /></div>
                        <div><label className="block text-xs font-medium text-slate-600 mb-1">Cell Phone</label><input type="text" value={cCell} onChange={(e) => setCCell(e.target.value)} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs" /></div>
                      </div>
                      <div><label className="block text-xs font-medium text-slate-600 mb-1">Notes</label><input type="text" value={cNotes} onChange={(e) => setCNotes(e.target.value)} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs" /></div>
                      <div className="flex gap-2">
                        <button type="submit" disabled={cSaving} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50">{cSaving ? "Saving..." : editingContact ? "Update" : "Add"}</button>
                        <button type="button" onClick={() => setShowContactForm(false)} className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs">Cancel</button>
                      </div>
                    </form>
                  ) : permissions.canEdit && (
                    <button onClick={() => openContactForm()} className="mt-4 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 w-full">+ Add Contact</button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
