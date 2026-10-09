"use client";

import { useEffect, useState } from "react";
import { getUserId } from "@/lib/getUserId";
import { Permissions } from "@/lib/permissions";
import ImageUploader from "@/components/ImageUploader";
import FapiaoInfoSection from "@/components/FapiaoInfoSection";
import BankAccountsModal from "@/components/BankAccountsModal";
import DirectoryViewModal from "@/components/DirectoryViewModal";

interface Company {
  id: number;
  name: string;
  officialName: string | null;
  officialNameAlt?: string | null;
  addressLocal: string | null;
  addressEnglish: string | null;
  telephone: string | null;
  country: string | null;
  logoPath: string | null;
  isDefault: boolean;
  notes: string | null;
  fapiaoCompanyName?: string | null;
  fapiaoTaxId?: string | null;
  fapiaoAddress?: string | null;
  fapiaoPhone?: string | null;
  fapiaoFax?: string | null;
  fapiaoBankName?: string | null;
  fapiaoBankAccount?: string | null;
  fapiaoContact?: string | null;
}

interface Props {
  permissions: Permissions;
}

export default function CompaniesPage({ permissions }: Props) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Company | null>(null);
  const [viewingEntity, setViewingEntity] = useState<Company | null>(null); // 🆕 允許查看詳情
  const [saving, setSaving] = useState(false);
  const [managingBanks, setManagingBanks] = useState<{ id: number; name: string } | null>(null);

  const [name, setName] = useState("");
  const [officialName, setOfficialName] = useState("");
  const [officialNameAlt, setOfficialNameAlt] = useState("");
  const [addressLocal, setAddressLocal] = useState("");
  const [addressEnglish, setAddressEnglish] = useState("");
  const [telephone, setTelephone] = useState("");
  const [country, setCountry] = useState("");
  const [logoPath, setLogoPath] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [notes, setNotes] = useState("");
  const [fapiao, setFapiao] = useState({
    fapiaoCompanyName: "", fapiaoTaxId: "", fapiaoAddress: "",
    fapiaoPhone: "", fapiaoFax: "", fapiaoBankName: "",
    fapiaoBankAccount: "", fapiaoContact: "",
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/companies");
      if (res.ok) setCompanies(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openForm = (comp?: Company) => {
    setEditing(comp || null);
    setName(comp?.name || "");
    setOfficialName(comp?.officialName || "");
    setOfficialNameAlt(comp?.officialNameAlt || "");
    setAddressLocal(comp?.addressLocal || "");
    setAddressEnglish(comp?.addressEnglish || "");
    setTelephone(comp?.telephone || "");
    setCountry(comp?.country || "");
    setLogoPath(comp?.logoPath || "");
    setIsDefault(comp?.isDefault || false);
    setNotes(comp?.notes || "");
    setFapiao({
      fapiaoCompanyName: comp?.fapiaoCompanyName || "",
      fapiaoTaxId: comp?.fapiaoTaxId || "",
      fapiaoAddress: comp?.fapiaoAddress || "",
      fapiaoPhone: comp?.fapiaoPhone || "",
      fapiaoFax: comp?.fapiaoFax || "",
      fapiaoBankName: comp?.fapiaoBankName || "",
      fapiaoBankAccount: comp?.fapiaoBankAccount || "",
      fapiaoContact: comp?.fapiaoContact || "",
    });
    setShowForm(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editing?.id, name: name.trim(), officialName, officialNameAlt, addressLocal, addressEnglish, telephone, country, logoPath, isDefault, notes, ...fapiao, userId: getUserId(),
        }),
      });
      if (res.ok) { setShowForm(false); load(); }
    } finally { setSaving(false); }
  };

  const remove = async (id: number) => {
    if (!confirm("Are you sure you want to delete this company?")) return;
    const res = await fetch(`/api/companies?id=${id}`, { method: "DELETE" });
    if (res.ok) load();
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-[#e5885d] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Companies</h1>
          <p className="text-sm text-slate-500">Manage internal corporate entities for invoicing and documents.</p>
        </div>
        {permissions.canManageUsers && (
          <button onClick={() => openForm()} className="px-4 py-2 bg-[#d97449] hover:bg-[#b7492f] text-white rounded-lg text-sm font-semibold transition-colors">
            + Add Company
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {companies.map((comp) => (
          <div key={comp.id} className="bg-white rounded-2xl border border-slate-200 flex flex-col hover:border-slate-300 hover:shadow-md transition-all group h-full">
            <div onClick={() => setViewingEntity(comp)} className="p-5 flex-1 cursor-pointer">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight mb-1 group-hover:text-[#d97449] transition-colors">
                    {comp.name} {comp.isDefault && <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#fdeae2] text-[#b7492f] border border-[#f4c9b6]">DEFAULT</span>}
                  </h3>
                  {comp.officialName && <p className="text-[11px] text-slate-500 max-w-[280px] truncate">{comp.officialName}</p>}
                </div>
              </div>

              <div className="text-xs text-slate-600 space-y-1.5 mb-4">
                {(comp.addressLocal || comp.addressEnglish) && (
                  <div className="flex gap-2"><span className="text-slate-400 w-16 shrink-0">Address:</span><span className="truncate">{comp.addressLocal || comp.addressEnglish}</span></div>
                )}
                {comp.country && <div className="flex gap-2"><span className="text-slate-400 w-16 shrink-0">Country:</span><span>{comp.country}</span></div>}
                {comp.telephone && <div className="flex gap-2"><span className="text-slate-400 w-16 shrink-0">Tel:</span><span>{comp.telephone}</span></div>}
              </div>
            </div>

            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
              {permissions.canManageUsers && (
                <button onClick={(e) => { e.stopPropagation(); setManagingBanks({ id: comp.id, name: comp.name }); }} className="text-xs font-semibold text-slate-500 hover:text-emerald-700 transition-colors">
                  Bank Accounts
                </button>
              )}
              <div className="flex gap-3">
                {permissions.canManageUsers && <button onClick={(e) => { e.stopPropagation(); openForm(comp); }} className="text-xs font-semibold text-[#d97449] hover:text-[#b7492f]">Edit</button>}
                {permissions.canManageUsers && !comp.isDefault && <button onClick={(e) => { e.stopPropagation(); remove(comp.id); }} className="text-xs font-semibold text-red-400 hover:text-red-600">Del</button>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{editing ? "Edit Company" : "Add Company"}</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
            </div>
            <form onSubmit={save} className="p-4 space-y-4">
              <div><label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Name (Display / System) *</label><input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="e.g. System display name" required /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Official Name (Primary)</label><input value={officialName} onChange={(e) => setOfficialName(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="請輸入主要官方全名 / Primary official name" /></div>
                <div><label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Official Name (Secondary)</label><input value={officialNameAlt} onChange={(e) => setOfficialNameAlt(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="Please enter secondary official name (optional)" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Country</label><input value={country} onChange={(e) => setCountry(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
                <div><label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">General Telephone</label><input value={telephone} onChange={(e) => setTelephone(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Address (Primary / Local)</label><textarea value={addressLocal} onChange={(e) => setAddressLocal(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" rows={2} /></div>
                <div><label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Address (Secondary / English)</label><textarea value={addressEnglish} onChange={(e) => setAddressEnglish(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" rows={2} /></div>
              </div>
              
              <FapiaoInfoSection country={country} values={fapiao} defaultCompanyName={officialName} defaultAddress={addressLocal} onChange={(field, value) => setFapiao((prev) => ({ ...prev, [field]: value }))} />

              <div className="pt-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} className="w-4 h-4 text-[#d97449] rounded border-slate-300 focus:ring-[#f1c6b2]" />
                  Set as default company for new documents
                </label>
              </div>

              {/* 🟢 Logo 只有在編輯彈窗才顯示 */}
              <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Company Logo (Optional)</label>
                <div className="flex gap-4 items-start">
                  <ImageUploader value={logoPath} onChange={(val: string | string[]) => setLogoPath(Array.isArray(val) ? val[0] || "" : val)} folder="fiborge/logos" />
                  {logoPath && <img src={logoPath} alt="Logo preview" className="h-12 object-contain bg-white p-1 border border-slate-200 rounded" />}
                </div>
                <input type="text" value={logoPath} onChange={(e) => setLogoPath(e.target.value)} className="mt-3 w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono text-slate-500" placeholder="Or paste direct image URL..." />
              </div>

              <div><label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Internal Notes</label><textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" rows={2} /></div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium">Cancel</button>
                <button type="submit" disabled={saving} className="px-5 py-2 bg-[#d97449] text-white rounded-lg text-sm font-semibold disabled:opacity-50">{saving ? "Saving..." : "Save Company"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DirectoryViewModal
        entity={viewingEntity ? { ...viewingEntity, addressLocal: viewingEntity.addressLocal, addressEnglish: viewingEntity.addressEnglish } : null}
        entityType="company"
        entityLabel="Company"
        contactsEndpoint=""
        contactsForeignKey=""
        onClose={() => setViewingEntity(null)}
      />

      {managingBanks && <BankAccountsModal entity={{ id: managingBanks.id, name: managingBanks.name }} entityType="company" permissions={permissions} onClose={() => setManagingBanks(null)} />}
    </div>
  );
}
