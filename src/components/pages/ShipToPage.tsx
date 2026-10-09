"use client";

import { useEffect, useMemo, useState } from "react";
import { DirectoryCard, DirectoryContactsModal } from "@/components/CompanyDirectory";
import { getUserId } from "@/lib/getUserId";
import { Permissions } from "@/lib/permissions";
import DirectoryViewModal from "@/components/DirectoryViewModal";
// ShipTo 不需要 Bank Accounts 和 Fapiao，因此保持輕量

const CATEGORIES = [
  "Fabric Mill", "Garment Mill", "Dye House", "Knitting Mill",
  "Weaving Mill", "Spinning Mill", "Forwarder", "Warehouse",
  "Office", "Trading Company", "Agent", "Other",
];

interface Address {
  id: number; name: string; officialName: string; officialNameAlt?: string | null;
  category: string; addressLocal: string; addressEnglish: string; country: string;
  telephone: string; notes: string; createdAt: string; createdByName: string;
  updatedAt: string; updatedByName: string;
}

interface ShipToContact {
  id: number; shipToId: number; contactName: string;
}

interface Props { permissions: Permissions; }

export default function ShipToPage({ permissions }: Props) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [allContacts, setAllContacts] = useState<ShipToContact[]>([]); // 🆕 加入聯絡人狀態
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);
  const [viewingContacts, setViewingContacts] = useState<Address | null>(null);
  const [viewingEntity, setViewingEntity] = useState<Address | null>(null);
  const [toast, setToast] = useState<{ type: string; text: string } | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [officialName, setOfficialName] = useState("");
  const [officialNameAlt, setOfficialNameAlt] = useState("");
  const [category, setCategory] = useState("");
  const [addressLocal, setAddressLocal] = useState("");
  const [addressEnglish, setAddressEnglish] = useState("");
  const [country, setCountry] = useState("");
  const [telephone, setTelephone] = useState("");
  const [notes, setNotes] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [addrData, contactData] = await Promise.all([
        fetch("/api/ship-to-addresses").then((r) => r.json()),
        fetch("/api/ship-to-contacts").then((r) => r.json()), // 🆕 同步撈取聯絡人
      ]);
      setAddresses(Array.isArray(addrData) ? addrData : []);
      setAllContacts(Array.isArray(contactData) ? contactData : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // 🆕 精準計算每個 ShipTo 的聯絡人數
  const contactCountMap = useMemo(() => {
    const map: Record<number, number> = {};
    for (const c of allContacts) {
      if (c.shipToId) map[c.shipToId] = (map[c.shipToId] || 0) + 1;
    }
    return map;
  }, [allContacts]);

  const filtered = useMemo(() => {
    let result = addresses;
    if (categoryFilter) result = result.filter((a) => a.category === categoryFilter);
    if (search.trim()) {
      const query = search.toLowerCase();
      result = result.filter((a) =>
        a.name?.toLowerCase().includes(query) ||
        a.officialName?.toLowerCase().includes(query) ||
        a.officialNameAlt?.toLowerCase().includes(query) ||
        a.category?.toLowerCase().includes(query) ||
        a.country?.toLowerCase().includes(query) ||
        a.addressEnglish?.toLowerCase().includes(query) ||
        a.addressLocal?.toLowerCase().includes(query) ||
        a.telephone?.toLowerCase().includes(query)
      );
    }
    return result;
  }, [addresses, categoryFilter, search]);

  const openForm = (address?: Address) => {
    setEditing(address || null);
    setName(address?.name || ""); setOfficialName(address?.officialName || ""); setOfficialNameAlt(address?.officialNameAlt || "");
    setCategory(address?.category || ""); setAddressLocal(address?.addressLocal || ""); setAddressEnglish(address?.addressEnglish || "");
    setCountry(address?.country || ""); setTelephone(address?.telephone || ""); setNotes(address?.notes || "");
    setShowForm(true);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/ship-to-addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editing?.id, name: name.trim(), officialName, officialNameAlt, category,
          addressLocal, addressEnglish, country, telephone, notes, userId: getUserId(),
        }),
      });
      if (res.ok) { setToast({ type: "success", text: editing ? "Updated" : "Created" }); setShowForm(false); await load(); }
      else { setToast({ type: "error", text: "Failed to save" }); }
    } finally {
      setSaving(false); setTimeout(() => setToast(null), 3000);
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this address and all its contacts?")) return;
    const res = await fetch(`/api/ship-to-addresses?id=${id}`, { method: "DELETE" });
    if (res.ok) load();
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-[#d97449] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
        <div><h1 className="text-2xl font-bold text-slate-900">Ship-To Addresses</h1><p className="text-sm text-slate-500">{filtered.length} address(es)</p></div>
        {permissions.canEdit && <button onClick={() => openForm()} className="px-4 py-2 bg-[#d97449] hover:bg-[#b7492f] text-white rounded-lg text-sm font-semibold transition-colors">+ Add Address</button>}
      </div>

      {toast && <div className={`mb-4 p-3 rounded-lg text-sm ${toast.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{toast.text}</div>}

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input value={search} onChange={(e) => setSearch(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm flex-1 focus:ring-[#f1c6b2]" placeholder="Search company, address, country..." />
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white min-w-[170px]">
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((addr) => (
          <DirectoryCard
            key={addr.id}
            name={addr.name}
            officialName={addr.officialNameAlt ? `${addr.officialName || ""} (${addr.officialNameAlt})`.trim() : addr.officialName}
            badge={addr.category ? { label: addr.category, tone: "neutral" } : null}
            addressEnglish={addr.addressEnglish} addressLocal={addr.addressLocal} country={addr.country} telephone={addr.telephone} notes={addr.notes}
            contactCount={contactCountMap[addr.id] || 0} // 🟢 現在聯絡人數會 100% 正確顯示！
            permissions={permissions}
            onContacts={() => setViewingContacts(addr)}
            onView={() => setViewingEntity(addr)}
            onEdit={() => openForm(addr)}
            onDelete={() => remove(addr.id)}
          />
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{editing ? "Edit Address" : "Add Ship-To Address"}</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
            </div>
            <form onSubmit={save} className="p-4 space-y-4">
              <div><label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Entity Name (Display / System) *</label><input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="e.g. Warehouse 1" required /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Official Name (Primary)</label><input value={officialName} onChange={(e) => setOfficialName(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="Primary official name" /></div>
                <div><label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Official Name (Secondary)</label><input value={officialNameAlt} onChange={(e) => setOfficialNameAlt(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="Secondary official name" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Category</label><select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"><option value="">Select...</option>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div>
                <div><label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Country</label><input value={country} onChange={(e) => setCountry(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Address (Primary / Local)</label><textarea value={addressLocal} onChange={(e) => setAddressLocal(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" rows={2} /></div>
                <div><label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Address (Secondary / English)</label><textarea value={addressEnglish} onChange={(e) => setAddressEnglish(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" rows={2} /></div>
              </div>
              <div><label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">General Telephone</label><input value={telephone} onChange={(e) => setTelephone(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
              <div><label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Notes / Instructions</label><textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" rows={2} /></div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium">Cancel</button>
                <button type="submit" disabled={saving} className="px-5 py-2 bg-[#d97449] text-white rounded-lg text-sm font-semibold">{saving ? "Saving..." : "Save Address"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DirectoryViewModal
        entity={viewingEntity}
        entityType="shipTo"
        entityLabel="Ship-To Address"
        contactsEndpoint="/api/ship-to-contacts"
        contactsForeignKey="shipToId"
        onClose={() => setViewingEntity(null)}
      />
      <DirectoryContactsModal
        entity={viewingContacts ? { id: viewingContacts.id, name: viewingContacts.name, officialName: viewingContacts.officialName } : null}
        endpoint="/api/ship-to-contacts"
        foreignKey="shipToId"
        permissions={permissions}
        emptyText="No contacts yet for this address."
        onClose={() => setViewingContacts(null)}
        onChanged={load}
      />
    </div>
  );
}