"use client";

import { useEffect, useMemo, useState } from "react";
import { DirectoryCard, DirectoryContactsModal } from "@/components/CompanyDirectory";
import { getUserId } from "@/lib/getUserId";
import { Permissions } from "@/lib/permissions";
import FapiaoInfoSection from "@/components/FapiaoInfoSection";
import DirectoryViewModal from "@/components/DirectoryViewModal";

interface Client {
  id: number;
  name: string;
  officialName: string;
  officialNameAlt?: string | null; // 🆕 次要官方全名
  country: string;
  addressLocal: string;
  addressEnglish: string;
  telephone: string;
  notes: string;
  createdByName: string;
  updatedByName: string;
  createdAt: string;
  updatedAt: string;
  fapiaoCompanyName?: string | null;
  fapiaoTaxId?: string | null;
  fapiaoAddress?: string | null;
  fapiaoPhone?: string | null;
  fapiaoFax?: string | null;
  fapiaoBankName?: string | null;
  fapiaoBankAccount?: string | null;
  fapiaoContact?: string | null;
}

interface ClientContact {
  id: number;
  customerId: number;
  contactName: string;
  email?: string | null;
  phone?: string | null;
  cellPhone?: string | null;
}

interface Props { permissions: Permissions; }

export default function ClientsPage({ permissions }: Props) {
  const [clients, setClients] = useState<Client[]>([]);
  const [allContacts, setAllContacts] = useState<ClientContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [viewingContacts, setViewingContacts] = useState<Client | null>(null);
  const [viewingEntity, setViewingEntity] = useState<Client | null>(null);
  const [toast, setToast] = useState<{ type: string; text: string } | null>(null);
  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [officialName, setOfficialName] = useState("");
  const [officialNameAlt, setOfficialNameAlt] = useState(""); // 🆕 次要名稱
  const [country, setCountry] = useState("");
  const [addressLocal, setAddressLocal] = useState("");
  const [addressEnglish, setAddressEnglish] = useState("");
  const [telephone, setTelephone] = useState("");
  const [notes, setNotes] = useState("");
  const [fapiao, setFapiao] = useState({
    fapiaoCompanyName: "", fapiaoTaxId: "", fapiaoAddress: "",
    fapiaoPhone: "", fapiaoFax: "", fapiaoBankName: "",
    fapiaoBankAccount: "", fapiaoContact: "",
  });

  const load = async () => {
    setLoading(true);
    try {
      const [clientData, contactData] = await Promise.all([
        fetch("/api/customers").then((r) => r.json()),
        fetch("/api/customer-contacts").then((r) => r.json()),
      ]);
      setClients(Array.isArray(clientData) ? clientData : []);
      setAllContacts(Array.isArray(contactData) ? contactData : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const countries = useMemo(
    () => [...new Set(clients.map((client) => client.country).filter(Boolean))].sort(),
    [clients]
  );

  const contactCountMap = useMemo(() => {
    const map: Record<number, number> = {};
    for (const contact of allContacts) map[contact.customerId] = (map[contact.customerId] || 0) + 1;
    return map;
  }, [allContacts]);

  const contactSearchMap = useMemo(() => {
    const map: Record<number, string> = {};
    for (const contact of allContacts) {
      map[contact.customerId] = `${map[contact.customerId] || ""} ${contact.contactName || ""} ${contact.email || ""} ${contact.phone || ""} ${contact.cellPhone || ""}`.toLowerCase();
    }
    return map;
  }, [allContacts]);

  const filtered = useMemo(() => {
    let result = clients;
    if (countryFilter) result = result.filter((client) => client.country === countryFilter);
    if (search.trim()) {
      const query = search.toLowerCase();
      result = result.filter((client) =>
        client.name?.toLowerCase().includes(query) ||
        client.officialName?.toLowerCase().includes(query) ||
        client.officialNameAlt?.toLowerCase().includes(query) ||
        client.country?.toLowerCase().includes(query) ||
        client.addressEnglish?.toLowerCase().includes(query) ||
        client.addressLocal?.toLowerCase().includes(query) ||
        client.telephone?.toLowerCase().includes(query) ||
        contactSearchMap[client.id]?.includes(query)
      );
    }
    return result;
  }, [clients, countryFilter, search, contactSearchMap]);

  const openForm = (client?: Client) => {
    setEditing(client || null);
    setName(client?.name || "");
    setOfficialName(client?.officialName || "");
    setOfficialNameAlt(client?.officialNameAlt || ""); // 🆕 回填次要名稱
    setCountry(client?.country || "");
    setAddressLocal(client?.addressLocal || "");
    setAddressEnglish(client?.addressEnglish || "");
    setTelephone(client?.telephone || "");
    setNotes(client?.notes || "");
    setFapiao({
      fapiaoCompanyName: client?.fapiaoCompanyName || "",
      fapiaoTaxId: client?.fapiaoTaxId || "",
      fapiaoAddress: client?.fapiaoAddress || "",
      fapiaoPhone: client?.fapiaoPhone || "",
      fapiaoFax: client?.fapiaoFax || "",
      fapiaoBankName: client?.fapiaoBankName || "",
      fapiaoBankAccount: client?.fapiaoBankAccount || "",
      fapiaoContact: client?.fapiaoContact || "",
    });
    setShowForm(true);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editing?.id,
          name: name.trim(),
          officialName,
          officialNameAlt, // 🆕 送出次要名稱
          country,
          addressLocal,
          addressEnglish,
          telephone,
          notes,
          ...fapiao,
          userId: getUserId(),
        }),
      });
      if (response.ok) {
        setToast({ type: "success", text: editing ? "Client updated" : "Client created" });
        setShowForm(false);
        await load();
      } else {
        setToast({ type: "error", text: "Failed to save client" });
      }
    } finally {
      setSaving(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this client and all its contacts?")) return;
    const response = await fetch(`/api/customers?id=${id}`, { method: "DELETE" });
    if (response.ok) load();
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-[#d97449] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clients</h1>
          <p className="text-sm text-slate-500">{filtered.length} client{filtered.length === 1 ? "" : "s"}</p>
        </div>
        {permissions.canEdit && <button onClick={() => openForm()} className="px-4 py-2 bg-[#d97449] hover:bg-[#b7492f] text-white rounded-lg text-sm font-semibold transition-colors">+ Add Client</button>}
      </div>

      {toast && <div className={`mb-4 p-3 rounded-lg text-sm ${toast.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{toast.text}</div>}

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-[#f1c6b2]"
          placeholder="Search company, address, country, telephone or contact..."
        />
        <select value={countryFilter} onChange={(e) => setCountryFilter(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white min-w-[170px]">
          <option value="">All Countries</option>
          {countries.map((value) => <option key={value}>{value}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-2 bg-white rounded-xl p-10 text-center border border-slate-200 text-slate-400">No clients found</div>
        ) : filtered.map((client) => (
          <DirectoryCard
            key={client.id}
            name={client.name}
            officialName={client.officialName}
            badge={{ label: "Client", tone: "coral" }}
            addressEnglish={client.addressEnglish}
            addressLocal={client.addressLocal}
            country={client.country}
            telephone={client.telephone}
            notes={client.notes}
            contactCount={contactCountMap[client.id] || 0}
            createdByName={client.createdByName}
            updatedByName={client.updatedByName}
            createdAt={client.createdAt}
            updatedAt={client.updatedAt}
            permissions={permissions}
            onContacts={() => setViewingContacts(client)}
            onEdit={() => openForm(client)}
            onDelete={() => remove(client.id)}
            onView={() => setViewingEntity(client)}
          />
        ))}
      </div>

      {showForm && permissions.canEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{editing ? "Edit Client" : "Add Client"}</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
            </div>
            <form onSubmit={save} className="p-4 space-y-4">
              {/* 1. Display Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Name (Display / System) *
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  placeholder="System display name (e.g. Client A)"
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
                <div><label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Country</label><input value={country} onChange={(e) => setCountry(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
                <div><label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">General Telephone</label><input value={telephone} onChange={(e) => setTelephone(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="Company main switchboard" /></div>
              </div>

              {/* 3. Address Primary & Secondary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
  <div>
    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
      Address (Primary / Local)
    </label>
    <textarea
      value={addressLocal}
      onChange={(e) => setAddressLocal(e.target.value)}
      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
      rows={2}
      placeholder="請輸入主要/本地語言詳細地址, Primary or local language detail address"
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
      placeholder="請輸入次要語言詳細地址, Please enter alternative detailed English address (optional)"
    />
  </div>
</div>
              
              <FapiaoInfoSection
                country={country}
                values={fapiao}
                defaultCompanyName={officialName}
                defaultAddress={addressLocal}
                onChange={(field, value) => setFapiao((prev) => ({ ...prev, [field]: value }))}
              />
              
              <div><label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Notes</label><textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" rows={2} /></div>
              
              <div className="flex gap-3 pt-2 border-t border-slate-200">
                <button type="submit" disabled={saving} className="px-4 py-2 bg-[#d97449] hover:bg-[#b7492f] text-white rounded-lg text-sm font-semibold disabled:opacity-50 transition-colors">{saving ? "Saving..." : editing ? "Update Client" : "Create Client"}</button>
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DirectoryContactsModal
        entity={viewingContacts ? { id: viewingContacts.id, name: viewingContacts.name, officialName: viewingContacts.officialName } : null}
        endpoint="/api/customer-contacts"
        foreignKey="customerId"
        permissions={permissions}
        emptyText="No contacts yet for this client."
        onClose={() => setViewingContacts(null)}
        onChanged={load}
      />
      <DirectoryViewModal
        entity={viewingEntity ? {
          ...viewingEntity,
          addressLocal: viewingEntity.addressLocal,
          addressEnglish: viewingEntity.addressEnglish,
        } : null}
        entityType="customer"
        entityLabel="Client"
        contactsEndpoint="/api/customer-contacts"
        contactsForeignKey="customerId"
        onClose={() => setViewingEntity(null)}
      />
    </div>
  );
}
