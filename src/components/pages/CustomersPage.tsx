"use client";

import { useEffect, useMemo, useState } from "react";
import { DirectoryCard, DirectoryContactsModal } from "@/components/CompanyDirectory";
import { getUserId } from "@/lib/getUserId";
import { Permissions } from "@/lib/permissions";
import FapiaoInfoSection from "@/components/FapiaoInfoSection";
import DirectoryViewModal from "@/components/DirectoryViewModal";
import BankAccountsModal from "@/components/BankAccountsModal";

interface Client {
  id: number; name: string; officialName: string; officialNameAlt?: string | null; country: string; addressLocal: string; addressEnglish: string; telephone: string; notes: string; createdByName: string; updatedByName: string; createdAt: string; updatedAt: string;
  fapiaoCompanyName?: string | null; fapiaoTaxId?: string | null; fapiaoAddress?: string | null; fapiaoPhone?: string | null; fapiaoFax?: string | null; fapiaoBankName?: string | null; fapiaoBankAccount?: string | null; fapiaoContact?: string | null;
}
interface ClientContact { id: number; customerId: number; contactName: string; email?: string | null; phone?: string | null; cellPhone?: string | null; }
interface Props { permissions: Permissions; }

export default function ClientsPage({ permissions }: Props) {
  const [clients, setClients] = useState<Client[]>([]);
  const [allContacts, setAllContacts] = useState<ClientContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [viewingContacts, setViewingContacts] = useState<Client | null>(null);
  const [viewingEntity, setViewingEntity] = useState<Client | null>(null);
  const [managingBanks, setManagingBanks] = useState<{ id: number; name: string; officialName: string } | null>(null); // 🟢 包含 officialName
  const [toast, setToast] = useState<{ type: string; text: string } | null>(null);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState(""); const [officialName, setOfficialName] = useState(""); const [officialNameAlt, setOfficialNameAlt] = useState("");
  const [country, setCountry] = useState(""); const [addressLocal, setAddressLocal] = useState(""); const [addressEnglish, setAddressEnglish] = useState("");
  const [telephone, setTelephone] = useState(""); const [notes, setNotes] = useState("");
  const [fapiao, setFapiao] = useState({ fapiaoCompanyName: "", fapiaoTaxId: "", fapiaoAddress: "", fapiaoPhone: "", fapiaoFax: "", fapiaoBankName: "", fapiaoBankAccount: "", fapiaoContact: "" });

  const load = async () => {
    setLoading(true);
    try {
      const [cData, contData] = await Promise.all([ fetch("/api/customers").then(r => r.json()), fetch("/api/customer-contacts").then(r => r.json()) ]);
      setClients(Array.isArray(cData) ? cData : []); setAllContacts(Array.isArray(contData) ? contData : []);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const contactCountMap = useMemo(() => { const map: Record<number, number> = {}; for (const c of allContacts) map[c.customerId] = (map[c.customerId] || 0) + 1; return map; }, [allContacts]);
  const filtered = useMemo(() => {
    if (!search.trim()) return clients;
    const q = search.toLowerCase();
    return clients.filter(c => c.name?.toLowerCase().includes(q) || c.officialName?.toLowerCase().includes(q) || c.country?.toLowerCase().includes(q));
  }, [clients, search]);

  const openForm = (c?: Client) => {
    setEditing(c || null);
    setName(c?.name || ""); setOfficialName(c?.officialName || ""); setOfficialNameAlt(c?.officialNameAlt || "");
    setCountry(c?.country || ""); setAddressLocal(c?.addressLocal || ""); setAddressEnglish(c?.addressEnglish || "");
    setTelephone(c?.telephone || ""); setNotes(c?.notes || "");
    setFapiao({ fapiaoCompanyName: c?.fapiaoCompanyName || "", fapiaoTaxId: c?.fapiaoTaxId || "", fapiaoAddress: c?.fapiaoAddress || "", fapiaoPhone: c?.fapiaoPhone || "", fapiaoFax: c?.fapiaoFax || "", fapiaoBankName: c?.fapiaoBankName || "", fapiaoBankAccount: c?.fapiaoBankAccount || "", fapiaoContact: c?.fapiaoContact || "" });
    setShowForm(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      await fetch("/api/customers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editing?.id, name: name.trim(), officialName, officialNameAlt, country, addressLocal, addressEnglish, telephone, notes, ...fapiao, userId: getUserId() }) });
      setShowForm(false); load();
    } finally { setSaving(false); }
  };

  const remove = async (id: number) => { if (!confirm("Delete?")) return; await fetch(`/api/customers?id=${id}`, { method: "DELETE" }); load(); };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-[#d97449] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
        <div><h1 className="text-2xl font-bold text-slate-900">Clients</h1></div>
        {permissions.canEdit && <button onClick={() => openForm()} className="px-4 py-2 bg-[#d97449] hover:bg-[#b7492f] text-white rounded-lg text-sm font-semibold">+ Add Client</button>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(c => (
          <DirectoryCard
            key={c.id} name={c.name} officialName={c.officialNameAlt ? `${c.officialName || ""} (${c.officialNameAlt})`.trim() : c.officialName}
            badge={{ label: "Client", tone: "coral" }} addressEnglish={c.addressEnglish} addressLocal={c.addressLocal} country={c.country} telephone={c.telephone} notes={c.notes}
            contactCount={contactCountMap[c.id] || 0} permissions={permissions}
            onView={() => setViewingEntity(c)}
            onContacts={() => setViewingContacts(c)}
            onEdit={() => openForm(c)}
            onDelete={() => remove(c.id)}
            // 🟢 Bank Accounts 帶入官方名稱
            onManageBanks={() => setManagingBanks({ id: c.id, name: c.name, officialName: c.officialName })}
          />
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-200 flex items-center justify-between"><h2 className="text-lg font-semibold">{editing ? "Edit Client" : "Add Client"}</h2><button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button></div>
            <form onSubmit={save} className="p-4 space-y-4">
              <div><label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Name (Display) *</label><input value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" required /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Official Name (Primary)</label><input value={officialName} onChange={e => setOfficialName(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div><div><label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Official Name (Secondary)</label><input value={officialNameAlt} onChange={e => setOfficialNameAlt(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3"><div><label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Address (Primary / Local)</label><textarea value={addressLocal} onChange={e => setAddressLocal(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" rows={2} /></div><div><label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Address (Secondary / English)</label><textarea value={addressEnglish} onChange={e => setAddressEnglish(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" rows={2} /></div></div>
              <div className="flex justify-end pt-4 border-t border-slate-200"><button type="submit" disabled={saving} className="px-5 py-2 bg-[#d97449] text-white rounded-lg text-sm font-semibold">Save</button></div>
            </form>
          </div>
        </div>
      )}

      {managingBanks && <BankAccountsModal entity={{ id: managingBanks.id, name: managingBanks.officialName || managingBanks.name }} entityType="customer" permissions={permissions} onClose={() => setManagingBanks(null)} />}
      <DirectoryContactsModal entity={viewingContacts ? { id: viewingContacts.id, name: viewingContacts.name, officialName: viewingContacts.officialName } : null} endpoint="/api/customer-contacts" foreignKey="customerId" permissions={permissions} emptyText="No contacts yet." onClose={() => setViewingContacts(null)} onChanged={load} />
      <DirectoryViewModal entity={viewingEntity ? { ...viewingEntity } : null} entityType="customer" entityLabel="Client" contactsEndpoint="/api/customer-contacts" contactsForeignKey="customerId" onClose={() => setViewingEntity(null)} />
    </div>
  );
}