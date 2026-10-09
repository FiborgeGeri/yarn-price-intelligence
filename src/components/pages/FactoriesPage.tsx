"use client";

import { useEffect, useMemo, useState } from "react";
import { DirectoryCard, DirectoryContactsModal } from "@/components/CompanyDirectory";
import { getUserId } from "@/lib/getUserId";
import { Permissions } from "@/lib/permissions";
import FapiaoInfoSection from "@/components/FapiaoInfoSection";
import DirectoryViewModal from "@/components/DirectoryViewModal";
import BankAccountsModal from "@/components/BankAccountsModal";

interface Factory {
  id: number; factoryName: string; officialName: string; officialNameAlt?: string | null; country: string;
  addressLocal: string; addressEnglish: string; telephone: string; notes: string; relationship: string;
  parentFactoryId: number | null; status: string; yarnCount: number; certIds: number[]; certNames: string[];
  contactCount: number; createdByName: string; updatedByName: string; createdAt: string; updatedAt: string;
  fapiaoCompanyName?: string | null; fapiaoTaxId?: string | null; fapiaoAddress?: string | null;
  fapiaoPhone?: string | null; fapiaoFax?: string | null; fapiaoBankName?: string | null;
  fapiaoBankAccount?: string | null; fapiaoContact?: string | null;
}

interface Certificate { id: number; certCode: string; certFullName: string; }
interface Props { permissions: Permissions; }

export default function FactoriesPage({ permissions }: Props) {
  const [factories, setFactories] = useState<Factory[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Factory | null>(null);
  const [viewingContacts, setViewingContacts] = useState<Factory | null>(null);
  const [viewingEntity, setViewingEntity] = useState<Factory | null>(null);
  const [managingBanks, setManagingBanks] = useState<{ id: number; name: string; officialName: string } | null>(null); // 🟢 包含 officialName
  const [toast, setToast] = useState<{ type: string; text: string } | null>(null);
  const [search, setSearch] = useState("");
  const [relationshipFilter, setRelationshipFilter] = useState("");
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [officialName, setOfficialName] = useState("");
  const [officialNameAlt, setOfficialNameAlt] = useState("");
  const [country, setCountry] = useState("");
  const [addressLocal, setAddressLocal] = useState("");
  const [addressEnglish, setAddressEnglish] = useState("");
  const [telephone, setTelephone] = useState("");
  const [notes, setNotes] = useState("");
  const [relationship, setRelationship] = useState("My Factory");
  const [parentId, setParentId] = useState<number | null>(null);
  const [status, setStatus] = useState("Active");
  const [formCertificates, setFormCertificates] = useState<number[]>([]);
  const [fapiao, setFapiao] = useState({ fapiaoCompanyName: "", fapiaoTaxId: "", fapiaoAddress: "", fapiaoPhone: "", fapiaoFax: "", fapiaoBankName: "", fapiaoBankAccount: "", fapiaoContact: "" });

  const load = async () => {
    setLoading(true);
    try {
      const [facData, certData] = await Promise.all([ fetch("/api/factories").then(r => r.json()), fetch("/api/certificates").then(r => r.json()) ]);
      setFactories(Array.isArray(facData) ? facData : []);
      setCertificates(Array.isArray(certData) ? certData : []);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    let result = factories;
    if (relationshipFilter) result = result.filter(f => f.relationship === relationshipFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(f => f.factoryName?.toLowerCase().includes(q) || f.officialName?.toLowerCase().includes(q) || f.country?.toLowerCase().includes(q) || f.telephone?.toLowerCase().includes(q));
    }
    return result;
  }, [factories, relationshipFilter, search]);

  const openForm = (f?: Factory) => {
    setEditing(f || null);
    setName(f?.factoryName || ""); setOfficialName(f?.officialName || ""); setOfficialNameAlt(f?.officialNameAlt || "");
    setCountry(f?.country || ""); setAddressLocal(f?.addressLocal || ""); setAddressEnglish(f?.addressEnglish || "");
    setTelephone(f?.telephone || ""); setNotes(f?.notes || ""); setRelationship(f?.relationship || "My Factory");
    setParentId(f?.parentFactoryId || null); setStatus(f?.status || "Active"); setFormCertificates(f?.certIds || []);
    setFapiao({ fapiaoCompanyName: f?.fapiaoCompanyName || "", fapiaoTaxId: f?.fapiaoTaxId || "", fapiaoAddress: f?.fapiaoAddress || "", fapiaoPhone: f?.fapiaoPhone || "", fapiaoFax: f?.fapiaoFax || "", fapiaoBankName: f?.fapiaoBankName || "", fapiaoBankAccount: f?.fapiaoBankAccount || "", fapiaoContact: f?.fapiaoContact || "" });
    setShowForm(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/factories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editing?.id, factoryName: name.trim(), officialName, officialNameAlt, country, addressLocal, addressEnglish, telephone, notes, relationship, parentFactoryId: parentId, status, certIds: formCertificates, ...fapiao, userId: getUserId() }) });
      if (res.ok) { setToast({ type: "success", text: "Saved successfully" }); setShowForm(false); await load(); }
      else setToast({ type: "error", text: "Failed to save" });
    } finally { setSaving(false); setTimeout(() => setToast(null), 3000); }
  };
  const remove = async (id: number) => { if (!confirm("Delete this yarn mill?")) return; await fetch(`/api/factories?id=${id}`, { method: "DELETE" }); load(); };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-[#e5885d] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
        <div><h1 className="text-2xl font-bold text-slate-900">Yarn Mills</h1><p className="text-sm text-slate-500">{filtered.length} yarn mill(s)</p></div>
        {permissions.canEdit && <button onClick={() => openForm()} className="px-4 py-2 bg-[#d97449] hover:bg-[#b7492f] text-white rounded-lg text-sm font-medium transition-colors">+ Add Yarn Mill</button>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(f => (
          <DirectoryCard
            key={f.id}
            name={f.factoryName}
            officialName={f.officialNameAlt ? `${f.officialName || ""} (${f.officialNameAlt})`.trim() : f.officialName}
            badge={{ label: f.relationship === "My Factory" ? "My Yarn Mill" : "Competitor Yarn Mill", tone: f.relationship === "My Factory" ? "coral" : "sage" }}
            addressEnglish={f.addressEnglish} addressLocal={f.addressLocal} country={f.country} telephone={f.telephone}
            summary={`${f.yarnCount || 0} yarns`} chips={f.certNames || []} notes={f.notes} contactCount={f.contactCount || 0}
            permissions={permissions}
            onView={() => setViewingEntity(f)}
            onContacts={() => setViewingContacts(f)}
            onEdit={() => openForm(f)}
            onDelete={() => remove(f.id)}
            // 🟢 Bank Accounts 帶入官方名稱
            onManageBanks={() => setManagingBanks({ id: f.id, name: f.factoryName, officialName: f.officialName })}
          />
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-200 flex items-center justify-between"><h2 className="text-lg font-semibold">{editing ? "Edit Yarn Mill" : "Add Yarn Mill"}</h2><button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">✕</button></div>
            <form onSubmit={save} className="p-4 space-y-4">
              <div><label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Name (Display / System) *</label><input value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" required /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Official Name (Primary)</label><input value={officialName} onChange={e => setOfficialName(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
                <div><label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Official Name (Secondary)</label><input value={officialNameAlt} onChange={e => setOfficialNameAlt(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                <div><label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Address (Primary / Local)</label><textarea value={addressLocal} onChange={e => setAddressLocal(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" rows={2} /></div>
                <div><label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Address (Secondary / English)</label><textarea value={addressEnglish} onChange={e => setAddressEnglish(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" rows={2} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4"><div><label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Country</label><input value={country} onChange={e => setCountry(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div><div><label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">General Telephone</label><input value={telephone} onChange={e => setTelephone(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div></div>
              <FapiaoInfoSection country={country} values={fapiao} defaultCompanyName={officialName} defaultAddress={addressLocal} onChange={(field, value) => setFapiao(prev => ({ ...prev, [field]: value }))} />
              <div className="flex justify-end pt-4 border-t border-slate-200"><button type="submit" disabled={saving} className="px-5 py-2 bg-[#d97449] text-white rounded-lg text-sm font-semibold">Save</button></div>
            </form>
          </div>
        </div>
      )}

      {managingBanks && (
        <BankAccountsModal 
          // 🟢 傳入 entity={{id, name}}，name 優先使用官方名稱
          entity={{ id: managingBanks.id, name: managingBanks.officialName || managingBanks.name }} 
          entityType="factory" permissions={permissions} onClose={() => setManagingBanks(null)} 
        />
      )}
      
      <DirectoryContactsModal entity={viewingContacts ? { id: viewingContacts.id, name: viewingContacts.factoryName, officialName: viewingContacts.officialName } : null} endpoint="/api/factory-contacts" foreignKey="factoryId" permissions={permissions} emptyText="No contacts yet." onClose={() => setViewingContacts(null)} onChanged={load} />
      <DirectoryViewModal entity={viewingEntity ? { ...viewingEntity, name: viewingEntity.factoryName } : null} entityType="factory" entityLabel="Yarn Mill" contactsEndpoint="/api/factory-contacts" contactsForeignKey="factoryId" onClose={() => setViewingEntity(null)} />
    </div>
  );
}