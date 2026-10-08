"use client";

import { useEffect, useMemo, useState } from "react";
import { DirectoryCard, DirectoryContactsModal } from "@/components/CompanyDirectory";
import { getUserId } from "@/lib/getUserId";
import { Permissions } from "@/lib/permissions";
import DirectoryViewModal from "@/components/DirectoryViewModal";

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
  officialNameAlt?: string | null;
  category: string;
  addressLocal: string;
  addressEnglish: string;
  country: string;
  telephone: string;
  notes: string;
  contactCount: number;
  createdAt: string;
  createdByName: string;
  updatedAt: string;
  updatedByName: string;
}

interface Props { permissions: Permissions; }

export default function ShipToPage({ permissions }: Props) {
  const [addresses, setAddresses] = useState<Address[]>([]);
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
      const data = await fetch("/api/ship-to-addresses").then((r) => r.json());
      setAddresses(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    let result = addresses;
    if (categoryFilter) result = result.filter((address) => address.category === categoryFilter);
    if (search.trim()) {
      const query = search.toLowerCase();
      result = result.filter((address) =>
        address.name?.toLowerCase().includes(query) ||
        address.officialName?.toLowerCase().includes(query) ||
        address.officialNameAlt?.toLowerCase().includes(query) ||
        address.category?.toLowerCase().includes(query) ||
        address.country?.toLowerCase().includes(query) ||
        address.addressEnglish?.toLowerCase().includes(query) ||
        address.addressLocal?.toLowerCase().includes(query) ||
        address.telephone?.toLowerCase().includes(query)
      );
    }
    return result;
  }, [addresses, categoryFilter, search]);

  const openForm = (address?: Address) => {
    setEditing(address || null);
    setName(address?.name || "");
    setOfficialName(address?.officialName || "");
    setOfficialNameAlt(address?.officialNameAlt || "");
    setCategory(address?.category || "");
    setAddressLocal(address?.addressLocal || "");
    setAddressEnglish(address?.addressEnglish || "");
    setCountry(address?.country || "");
    setTelephone(address?.telephone || "");
    setNotes(address?.notes || "");
    setShowForm(true);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const response = await fetch("/api/ship-to-addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editing?.id,
          name: name.trim(),
          officialName,
          officialNameAlt,
          category,
          addressLocal,
          addressEnglish,
          country,
          telephone,
          notes,
          userId: getUserId(),
        }),
      });
      if (response.ok) {
        setToast({ type: "success", text: editing ? "Ship-to address updated" : "Ship-to address created" });
        setShowForm(false);
        await load();
      } else {
        setToast({ type: "error", text: "Failed to save ship-to address" });
      }
    } finally {
      setSaving(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this address and all its contacts?")) return;
    const response = await fetch(`/api/ship-to-addresses?id=${id}`, { method: "DELETE" });
    if (response.ok) load();
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-[#d97449] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Ship-To Addresses</h1>
          <p className="text-sm text-slate-500">{filtered.length} address{filtered.length === 1 ? "" : "es"}</p>
        </div>
        {permissions.canEdit && <button onClick={() => openForm()} className="px-4 py-2 bg-[#d97449] hover:bg-[#b7492f] text-white rounded-lg text-sm font-semibold transition-colors">+ Add Address</button>}
      </div>

      {toast && <div className={`mb-4 p-3 rounded-lg text-sm ${toast.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>{toast.text}</div>}

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-[#f1c6b2]"
          placeholder="Search company, address, category, country or telephone..."
        />
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white min-w-[170px]">
          <option value="">All Categories</option>
          {CATEGORIES.map((value) => <option key={value}>{value}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-2 bg-white rounded-xl p-10 text-center border border-slate-200 text-slate-400">No addresses found</div>
        ) : filtered.map((address) => (
          <DirectoryCard
            key={address.id}
            name={address.name}
            officialName={address.officialNameAlt ? `${address.officialName || ""} (${address.officialNameAlt})`.trim() : address.officialName}
            badge={address.category ? { label: address.category, tone: "neutral" } : null}
            addressEnglish={address.addressEnglish}
            addressLocal={address.addressLocal}
            country={address.country}
            telephone={address.telephone}
            notes={address.notes}
            contactCount={address.contactCount || 0}
            createdByName={address.createdByName}
            updatedByName={address.updatedByName}
            createdAt={address.createdAt}
            updatedAt={address.updatedAt}
            permissions={permissions}
            onContacts={() => setViewingContacts(address)}
            onView={() => setViewingEntity(address)}
            onEdit={() => openForm(address)}
            onDelete={() => remove(address.id)}
          />
        ))}
      </div>

      {showForm && permissions.canEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{editing ? "Edit Address" : "Add Ship-To Address"}</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
            </div>
            <form onSubmit={save} className="p-4 space-y-4">
              {/* 1. Display Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Entity Name (Display / System) *
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  placeholder="請輸入系統顯示名稱 / System display name"
                  required
                />
              </div>

                            {/* 2. Official Name Primary & Secondary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Official Name (Primary)
                  </label>
                  <input
                    value={officialName}
                    onChange={(e) => setOfficialName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    placeholder="請輸入主要官方全名 / Primary official name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Official Name (Secondary)
                  </label>
                  <input
                    value={officialNameAlt}
                    onChange={(e) => setOfficialNameAlt(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    placeholder="Please enter secondary official name (optional)"
                  />
                </div>
              </div>

              {/* 3. Address Primary & Secondary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Address (Primary / Local)
                  </label>
                  <textarea 
                    value={addressLocal} 
                    onChange={(e) => setAddressLocal(e.target.value)} 
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" 
                    rows={2} 
                    placeholder="請輸入主要/本地語言詳細地址" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Address (Secondary / English)
                  </label>
                  <textarea 
                    value={addressEnglish} 
                    onChange={(e) => setAddressEnglish(e.target.value)} 
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" 
                    rows={2} 
                    placeholder="Please enter detailed English address" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">
                    <option value="">Select category...</option>
                    {CATEGORIES.map((value) => <option key={value}>{value}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Country</label>
                  <input value={country} onChange={(e) => setCountry(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="e.g. China / CN" />
                </div>
              </div>

              {/* 3. Address Primary & Secondary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Address (Primary / Local)</label>
                  <textarea value={addressLocal} onChange={(e) => setAddressLocal(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" rows={2} placeholder="請輸入主要/本地語言詳細地址" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Address (Secondary / English)</label>
                  <textarea value={addressEnglish} onChange={(e) => setAddressEnglish(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" rows={2} placeholder="Please enter detailed English address" />
                </div>
              </div>

              <div><label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">General Telephone</label><input value={telephone} onChange={(e) => setTelephone(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="請輸入總機電話 / General telephone" /></div>
              <div><label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Notes / Instructions</label><textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" rows={2} placeholder="請輸入備註或送貨指示 / Special instructions" /></div>
              
              <div className="flex gap-3 pt-2 border-t border-slate-200">
                <button type="submit" disabled={saving} className="px-4 py-2 bg-[#d97449] hover:bg-[#b7492f] text-white rounded-lg text-sm font-semibold disabled:opacity-50 transition-colors">{saving ? "Saving..." : editing ? "Update Address" : "Create Address"}</button>
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300">Cancel</button>
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