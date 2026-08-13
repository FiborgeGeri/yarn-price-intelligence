"use client";
import { useState, useEffect } from "react";
import { Permissions } from "@/lib/permissions";

interface Factory {
  id: number; factoryName: string; legitName: string; country: string;
  addressLine1: string; addressLine2: string; city: string; state: string; postalCode: string;
  telephone: string; notes: string; relationship: string; parentFactoryId: number | null;
  status: string; yarnCount: number; certIds: number[]; certNames: string[]; contactCount: number;
}
interface Certificate { id: number; certCode: string; certFullName: string; }
interface Contact { id: number; factoryId: number; contactName: string; department: string; position: string; email: string; phone: string; cellPhone: string; notes: string; }
interface Props { permissions: Permissions; }

export default function FactoriesPage({ permissions }: Props) {
  const [factories, setFactories] = useState<Factory[]>([]);
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Factory | null>(null);
  const [toast, setToast] = useState<{ type: string; text: string } | null>(null);

  // Factory form
  const [name, setName] = useState(""); const [legitName, setLegitName] = useState("");
  const [country, setCountry] = useState(""); const [line1, setLine1] = useState(""); const [line2, setLine2] = useState("");
  const [city, setCity] = useState(""); const [fState, setFState] = useState(""); const [postal, setPostal] = useState("");
  const [telephone, setTelephone] = useState(""); const [notes, setNotes] = useState("");
  const [rel, setRel] = useState("My Factory"); const [parentId, setParentId] = useState<number | null>(null);
  const [status, setStatus] = useState("Active"); const [formCerts, setFormCerts] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  // Contacts
  const [viewingFactory, setViewingFactory] = useState<Factory | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactLoading, setContactLoading] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [cName, setCName] = useState(""); const [cDept, setCDept] = useState(""); const [cPos, setCPos] = useState("");
  const [cEmail, setCEmail] = useState(""); const [cPhone, setCPhone] = useState(""); const [cCell, setCCell] = useState(""); const [cNotes, setCNotes] = useState("");
  const [cSaving, setCSaving] = useState(false);

  const loadData = async () => { setLoading(true); const [f, c] = await Promise.all([fetch("/api/factories").then((r) => r.json()), fetch("/api/certificates").then((r) => r.json())]); setFactories(f); setCerts(c); setLoading(false); };
  useEffect(() => { loadData(); }, []);

  const loadContacts = async (f: Factory) => { setViewingFactory(f); setContactLoading(true); const data = await fetch(`/api/factory-contacts?factoryId=${f.id}`).then((r) => r.json()); setContacts(data); setContactLoading(false); };

  const openForm = (f?: Factory) => {
    if (f) { setEditing(f); setName(f.factoryName); setLegitName(f.legitName || ""); setCountry(f.country || ""); setLine1(f.addressLine1 || ""); setLine2(f.addressLine2 || ""); setCity(f.city || ""); setFState(f.state || ""); setPostal(f.postalCode || ""); setTelephone(f.telephone || ""); setNotes(f.notes || ""); setRel(f.relationship); setParentId(f.parentFactoryId); setStatus(f.status || "Active"); setFormCerts(f.certIds || []); }
    else { setEditing(null); setName(""); setLegitName(""); setCountry(""); setLine1(""); setLine2(""); setCity(""); setFState(""); setPostal(""); setTelephone(""); setNotes(""); setRel("My Factory"); setParentId(null); setStatus("Active"); setFormCerts([]); }
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!name) return; setSaving(true);
    const res = await fetch("/api/factories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editing?.id, factoryName: name, legitName, country, addressLine1: line1, addressLine2: line2, city, state: fState, postalCode: postal, telephone, notes, relationship: rel, parentFactoryId: parentId, status, certIds: formCerts }) });
    if (res.ok) { setToast({ type: "success", text: editing ? "Updated" : "Created" }); setShowForm(false); loadData(); }
    else setToast({ type: "error", text: "Failed" });
    setSaving(false); setTimeout(() => setToast(null), 3000);
  };

  const handleDelete = async (id: number) => { if (!confirm("Delete this yarn mill?")) return; await fetch(`/api/factories?id=${id}`, { method: "DELETE" }); loadData(); };

  // Contact form
  const openContactForm = (c?: Contact) => {
    if (c) { setEditingContact(c); setCName(c.contactName); setCDept(c.department || ""); setCPos(c.position || ""); setCEmail(c.email || ""); setCPhone(c.phone || ""); setCCell(c.cellPhone || ""); setCNotes(c.notes || ""); }
    else { setEditingContact(null); setCName(""); setCDept(""); setCPos(""); setCEmail(""); setCPhone(""); setCCell(""); setCNotes(""); }
    setShowContactForm(true);
  };
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!cName || !viewingFactory) return; setCSaving(true);
    const res = await fetch("/api/factory-contacts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editingContact?.id, factoryId: viewingFactory.id, contactName: cName, department: cDept, position: cPos, email: cEmail, phone: cPhone, cellPhone: cCell, notes: cNotes }) });
    if (res.ok) { setShowContactForm(false); loadContacts(viewingFactory); loadData(); }
    setCSaving(false);
  };
  const handleDeleteContact = async (id: number) => { if (!confirm("Delete this contact?")) return; await fetch(`/api/factory-contacts?id=${id}`, { method: "DELETE" }); if (viewingFactory) { loadContacts(viewingFactory); loadData(); } };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;

  const myMills = factories.filter((f) => f.relationship === "My Factory");
  const compMills = factories.filter((f) => f.relationship === "Competitor Factory");

  const formatAddress = (f: Factory) => {
    const parts = [f.addressLine1, f.addressLine2, [f.city, f.state, f.postalCode].filter(Boolean).join(" "), f.country].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : null;
  };

  const MillCard = ({ f, borderColor }: { f: Factory; borderColor: string }) => (
    <div className={`bg-white rounded-xl p-4 shadow-sm border-2 ${borderColor}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-slate-900">{f.factoryName}</div>
          {f.legitName && <div className="text-xs text-slate-400 mt-0.5">{f.legitName}</div>}
          {formatAddress(f) && <div className="text-xs text-slate-500 mt-1">{formatAddress(f)}</div>}
          {f.telephone && <div className="text-xs text-slate-400 mt-1">Tel: {f.telephone}</div>}
          <div className="text-xs text-slate-400 mt-1">{f.yarnCount} yarns</div>
          {f.certNames?.length > 0 && <div className="flex flex-wrap gap-1 mt-2">{f.certNames.map((c, i) => <span key={i} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-medium">{c}</span>)}</div>}
          {f.notes && <div className="text-xs text-slate-400 mt-2 whitespace-pre-line">{f.notes}</div>}
        </div>
        <div className="flex flex-col gap-1 shrink-0 ml-2 items-end">
          <button onClick={() => loadContacts(f)} className="text-slate-600 hover:text-slate-900 text-xs px-2 py-1">{f.contactCount} contact{f.contactCount !== 1 ? "s" : ""}</button>
          {permissions.canEdit && <button onClick={() => openForm(f)} className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1">Edit</button>}
          {permissions.canDelete && <button onClick={() => handleDelete(f.id)} className="text-red-500 hover:text-red-700 text-xs px-2 py-1">Del</button>}
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-slate-900">Yarn Mills</h1><p className="text-sm text-slate-500">{factories.length} yarn mills</p></div>
        {permissions.canEdit && <button onClick={() => openForm()} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">+ Add Yarn Mill</button>}
      </div>
      {toast && <div className={`mb-4 p-3 rounded-lg text-sm ${toast.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{toast.text}</div>}

      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-500" /> Mine ({myMills.length})</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{myMills.map((f) => <MillCard key={f.id} f={f} borderColor="border-blue-200" />)}</div>
      </div>
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500" /> Competitor ({compMills.length})</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{compMills.map((f) => <MillCard key={f.id} f={f} borderColor="border-red-200" />)}</div>
      </div>

      {/* Add/Edit Yarn Mill */}
      {showForm && permissions.canEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-200 flex items-center justify-between"><h2 className="text-lg font-semibold">{editing ? "Edit Yarn Mill" : "Add Yarn Mill"}</h2><button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button></div>
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Name (Display) *</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" required placeholder="e.g. Indorama" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Legal Name</label><input type="text" value={legitName} onChange={(e) => setLegitName(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="Official registered name" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Relationship</label>
                  <select value={rel} onChange={(e) => setRel(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"><option value="My Factory">Mine</option><option value="Competitor Factory">Competitor</option></select>
                </div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Telephone</label><input type="text" value={telephone} onChange={(e) => setTelephone(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
              </div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Address Line 1</label><input type="text" value={line1} onChange={(e) => setLine1(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Address Line 2</label><input type="text" value={line2} onChange={(e) => setLine2(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">City</label><input type="text" value={city} onChange={(e) => setCity(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">State / Province</label><input type="text" value={fState} onChange={(e) => setFState(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Postal Code</label><input type="text" value={postal} onChange={(e) => setPostal(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
              </div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Country</label><input type="text" value={country} onChange={(e) => setCountry(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Parent Yarn Mill</label>
                <select value={parentId || 0} onChange={(e) => setParentId(Number(e.target.value) || null)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"><option value={0}>None</option>{factories.filter((f) => f.id !== editing?.id).map((f) => <option key={f.id} value={f.id}>{f.factoryName}</option>)}</select>
              </div>
              {certs.length > 0 && (
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Certifications</label>
                  <div className="flex flex-wrap gap-2">{certs.map((c) => (
                    <button key={c.id} type="button" onClick={() => setFormCerts((prev) => prev.includes(c.id) ? prev.filter((x) => x !== c.id) : [...prev, c.id])} className={`px-2 py-1 rounded text-xs font-medium border transition-colors ${formCerts.includes(c.id) ? "bg-blue-100 text-blue-800 border-blue-300" : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"}`}>{c.certCode}</button>
                  ))}</div>
                </div>
              )}
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Notes</label><textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" rows={2} /></div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">{saving ? "Saving..." : editing ? "Update" : "Create"}</button>
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contacts Modal */}
      {viewingFactory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => { setViewingFactory(null); setShowContactForm(false); }}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div><h2 className="text-lg font-semibold">Contacts — {viewingFactory.factoryName}</h2><p className="text-xs text-slate-500 mt-0.5">{viewingFactory.legitName || ""}</p></div>
              <button onClick={() => { setViewingFactory(null); setShowContactForm(false); }} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
            </div>
            <div className="p-4">
              {contactLoading ? <div className="flex justify-center py-8"><div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div> : (
                <>
                  {contacts.length === 0 && !showContactForm && <div className="text-center py-6 text-slate-400 text-sm">No contacts yet for this yarn mill.</div>}
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
                      <div className="flex gap-2"><button type="submit" disabled={cSaving} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50">{cSaving ? "Saving..." : editingContact ? "Update" : "Add"}</button><button type="button" onClick={() => setShowContactForm(false)} className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs">Cancel</button></div>
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
