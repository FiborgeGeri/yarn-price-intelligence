"use client";

import { useEffect, useMemo, useState } from "react";
import { DirectoryCard, DirectoryContactsModal } from "@/components/CompanyDirectory";
import { getUserId } from "@/lib/getUserId";
import { Permissions } from "@/lib/permissions";
import FapiaoInfoSection from "@/components/FapiaoInfoSection";

interface Factory {
  id: number;
  factoryName: string;
  officialName: string;
  country: string;
  addressLocal: string;
  addressEnglish: string;
  telephone: string;
  notes: string;
  relationship: string;
  parentFactoryId: number | null;
  status: string;
  yarnCount: number;
  certIds: number[];
  certNames: string[];
  contactCount: number;
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

interface Certificate { id: number; certCode: string; certFullName: string; }
interface Props { permissions: Permissions; }

export default function FactoriesPage({ permissions }: Props) {
  const [factories, setFactories] = useState<Factory[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Factory | null>(null);
  const [viewingContacts, setViewingContacts] = useState<Factory | null>(null);
  const [toast, setToast] = useState<{ type: string; text: string } | null>(null);
  const [search, setSearch] = useState("");
  const [relationshipFilter, setRelationshipFilter] = useState("");
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [officialName, setOfficialName] = useState("");
  const [country, setCountry] = useState("");
  const [addressLocal, setAddressLocal] = useState("");
  const [addressEnglish, setAddressEnglish] = useState("");
  const [telephone, setTelephone] = useState("");
  const [notes, setNotes] = useState("");
  const [relationship, setRelationship] = useState("My Factory");
  const [parentId, setParentId] = useState<number | null>(null);
  const [status, setStatus] = useState("Active");
  const [formCertificates, setFormCertificates] = useState<number[]>([]);
  const [fapiao, setFapiao] = useState({
    fapiaoCompanyName: "", fapiaoTaxId: "", fapiaoAddress: "",
    fapiaoPhone: "", fapiaoFax: "", fapiaoBankName: "",
    fapiaoBankAccount: "", fapiaoContact: "",
  });

  const load = async () => {
    setLoading(true);
    try {
      const [factoryData, certificateData] = await Promise.all([
        fetch("/api/factories").then((r) => r.json()),
        fetch("/api/certificates").then((r) => r.json()),
      ]);
      setFactories(Array.isArray(factoryData) ? factoryData : []);
      setCertificates(Array.isArray(certificateData) ? certificateData : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    let result = factories;
    if (relationshipFilter) result = result.filter((factory) => factory.relationship === relationshipFilter);
    if (search.trim()) {
      const query = search.toLowerCase();
      result = result.filter((factory) =>
        factory.factoryName?.toLowerCase().includes(query) ||
        factory.officialName?.toLowerCase().includes(query) ||
        factory.country?.toLowerCase().includes(query) ||
        factory.addressEnglish?.toLowerCase().includes(query) ||
        factory.addressLocal?.toLowerCase().includes(query) ||
        factory.telephone?.toLowerCase().includes(query) ||
        factory.certNames?.some((certificate) => certificate.toLowerCase().includes(query))
      );
    }
    return result;
  }, [factories, relationshipFilter, search]);

  const openForm = (factory?: Factory) => {
    setEditing(factory || null);
    setName(factory?.factoryName || "");
    setOfficialName(factory?.officialName || "");
    setCountry(factory?.country || "");
    setAddressLocal(factory?.addressLocal || "");
    setAddressEnglish(factory?.addressEnglish || "");
    setTelephone(factory?.telephone || "");
    setNotes(factory?.notes || "");
    setRelationship(factory?.relationship || "My Factory");
    setParentId(factory?.parentFactoryId || null);
    setStatus(factory?.status || "Active");
    setFormCertificates(factory?.certIds || []);
    setFapiao({
      fapiaoCompanyName: factory?.fapiaoCompanyName || "",
      fapiaoTaxId: factory?.fapiaoTaxId || "",
      fapiaoAddress: factory?.fapiaoAddress || "",
      fapiaoPhone: factory?.fapiaoPhone || "",
      fapiaoFax: factory?.fapiaoFax || "",
      fapiaoBankName: factory?.fapiaoBankName || "",
      fapiaoBankAccount: factory?.fapiaoBankAccount || "",
      fapiaoContact: factory?.fapiaoContact || "",
    });
    setShowForm(true);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const response = await fetch("/api/factories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editing?.id,
          factoryName: name.trim(),
          officialName,
          country,
          addressLocal,
          addressEnglish,
          telephone,
          notes,
          relationship,
          parentFactoryId: parentId,
          status,
          certIds: formCertificates,
          ...fapiao,
          userId: getUserId(),
        }),
      });
      if (response.ok) {
        setToast({ type: "success", text: editing ? "Yarn mill updated" : "Yarn mill created" });
        setShowForm(false);
        await load();
      } else {
        setToast({ type: "error", text: "Failed to save yarn mill" });
      }
    } finally {
      setSaving(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this yarn mill and all its contacts?")) return;
    const response = await fetch(`/api/factories?id=${id}`, { method: "DELETE" });
    if (response.ok) load();
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Yarn Mills</h1>
          <p className="text-sm text-slate-500">{filtered.length} yarn mill{filtered.length === 1 ? "" : "s"}</p>
        </div>
        {permissions.canEdit && <button onClick={() => openForm()} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">+ Add Yarn Mill</button>}
      </div>

      {toast && <div className={`mb-4 p-3 rounded-lg text-sm ${toast.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{toast.text}</div>}

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Search mill, address, country, telephone or certificate..."
        />
        <select value={relationshipFilter} onChange={(e) => setRelationshipFilter(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white min-w-[180px]">
          <option value="">All Relationships</option>
          <option value="My Factory">My Yarn Mills</option>
          <option value="Competitor Factory">Competitor Yarn Mills</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-2 bg-white rounded-xl p-10 text-center border border-slate-200 text-slate-400">No yarn mills found</div>
        ) : filtered.map((factory) => (
          <DirectoryCard
            key={factory.id}
            name={factory.factoryName}
            officialName={factory.officialName}
            badge={{
              label: factory.relationship === "My Factory" ? "My Yarn Mill" : "Competitor Yarn Mill",
              tone: factory.relationship === "My Factory" ? "coral" : "sage",
            }}
            addressEnglish={factory.addressEnglish}
            addressLocal={factory.addressLocal}
            country={factory.country}
            telephone={factory.telephone}
            summary={`${factory.yarnCount || 0} yarn${factory.yarnCount === 1 ? "" : "s"} · ${factory.status || "Active"}`}
            chips={factory.certNames || []}
            notes={factory.notes}
            contactCount={factory.contactCount || 0}
            createdByName={factory.createdByName}
            updatedByName={factory.updatedByName}
            createdAt={factory.createdAt}
            updatedAt={factory.updatedAt}
            permissions={permissions}
            onContacts={() => setViewingContacts(factory)}
            onEdit={() => openForm(factory)}
            onDelete={() => remove(factory.id)}
          />
        ))}
      </div>

      {showForm && permissions.canEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{editing ? "Edit Yarn Mill" : "Add Yarn Mill"}</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
            </div>
            <form onSubmit={save} className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Name (Display) *</label><input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" required /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Official Name</label><input value={officialName} onChange={(e) => setOfficialName(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="Registered company name" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Relationship</label><select value={relationship} onChange={(e) => setRelationship(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"><option value="My Factory">Mine</option><option value="Competitor Factory">Competitor</option></select></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Country</label><input value={country} onChange={(e) => setCountry(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
              </div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Address (Local Language)</label><textarea value={addressLocal} onChange={(e) => setAddressLocal(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" rows={3} /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Address (English)</label><textarea value={addressEnglish} onChange={(e) => setAddressEnglish(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" rows={3} /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Telephone</label><input value={telephone} onChange={(e) => setTelephone(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Parent Yarn Mill</label><select value={parentId || 0} onChange={(e) => setParentId(Number(e.target.value) || null)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"><option value={0}>None</option>{factories.filter((factory) => factory.id !== editing?.id).map((factory) => <option key={factory.id} value={factory.id}>{factory.factoryName}</option>)}</select></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Status</label><select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"><option>Active</option><option>Inactive</option></select></div>

              {certificates.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Certifications</label>
                  <div className="flex flex-wrap gap-2">
                    {certificates.map((certificate) => (
                      <button
                        key={certificate.id}
                        type="button"
                        onClick={() => setFormCertificates((previous) => previous.includes(certificate.id) ? previous.filter((id) => id !== certificate.id) : [...previous, certificate.id])}
                        className={`px-2 py-1 rounded text-xs font-medium border ${formCertificates.includes(certificate.id) ? "bg-[#fff0e8] text-[#b8613f] border-[#f1c6b2]" : "bg-slate-50 text-slate-600 border-slate-200"}`}
                      >
                        {certificate.certCode}
                      </button>
                    ))}
                  </div>
                </div>
              )}

               <FapiaoInfoSection
                country={country}
                values={fapiao}
                onChange={(field, value) => setFapiao((prev) => ({ ...prev, [field]: value }))}
              />

              <div><label className="block text-sm font-medium text-slate-700 mb-1">Notes</label><textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" rows={2} /></div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">{saving ? "Saving..." : editing ? "Update" : "Create"}</button>
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DirectoryContactsModal
        entity={viewingContacts ? { id: viewingContacts.id, name: viewingContacts.factoryName, officialName: viewingContacts.officialName } : null}
        endpoint="/api/factory-contacts"
        foreignKey="factoryId"
        permissions={permissions}
        emptyText="No contacts yet for this yarn mill."
        onClose={() => setViewingContacts(null)}
        onChanged={load}
      />
    </div>
  );
}
