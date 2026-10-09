"use client";

import { useEffect, useState } from "react";
import { getUserId } from "@/lib/getUserId";
import { Permissions } from "@/lib/permissions";
import ImageUploader from "@/components/ImageUploader";
import FapiaoInfoSection from "@/components/FapiaoInfoSection";
import BankAccountsModal from "@/components/BankAccountsModal";

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
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: string; text: string } | null>(null);
  const [managingBanks, setManagingBanks] = useState<{ id: number; name: string } | null>(null);

  // Form states
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
      if (res.ok) {
        const data = await res.json();
        setCompanies(Array.isArray(data) ? data : []);
      }
    } catch {
      setCompanies([]);
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
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editing?.id,
          name: name.trim(),
          officialName: officialName.trim() || null,
          officialNameAlt: officialNameAlt.trim() || null,
          addressLocal: addressLocal.trim() || null,
          addressEnglish: addressEnglish.trim() || null,
          telephone: telephone.trim() || null,
          country: country.trim() || null,
          logoPath: logoPath.trim() || null,
          isDefault,
          notes: notes.trim() || null,
          ...fapiao,
          userId: getUserId(),
        }),
      });

      if (res.ok) {
        setToast({ type: "success", text: editing ? "Company updated" : "Company created" });
        setShowForm(false);
        load();
      } else {
        setToast({ type: "error", text: "Failed to save company" });
      }
    } catch {
      setToast({ type: "error", text: "Connection error" });
    }
    setSaving(false);
    setTimeout(() => setToast(null), 3000);
  };

  const remove = async (id: number) => {
    if (!confirm("Are you sure you want to delete this company?")) return;
    try {
      const res = await fetch(`/api/companies?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setToast({ type: "success", text: "Company deleted" });
        load();
      } else {
        setToast({ type: "error", text: "Failed to delete" });
      }
    } catch {
      setToast({ type: "error", text: "Connection error" });
    }
    setTimeout(() => setToast(null), 3000);
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-[#e5885d] border-t-transparent rounded-full animate-spin mx-auto" /></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Companies</h1>
          <p className="text-sm text-slate-500">Manage internal corporate entities for invoicing and document headers.</p>
        </div>
        {permissions.canManageUsers && (
          <button onClick={() => openForm()} className="px-4 py-2 bg-[#d97449] hover:bg-[#b7492f] text-white rounded-lg text-sm font-semibold transition-colors">
            + Add Company
          </button>
        )}
      </div>

      {toast && (
        <div className={`p-3 rounded-lg text-sm ${toast.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {toast.text}
        </div>
      )}

      {companies.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <h3 className="text-lg font-medium text-slate-900 mb-2">No companies configured</h3>
          <p className="text-slate-500 text-sm mb-4">You need at least one company to generate POs, Invoices, and Quotations.</p>
          {permissions.canManageUsers && (
            <button onClick={() => openForm()} className="px-4 py-2 bg-[#d97449] text-white rounded-lg text-sm font-medium hover:bg-[#b7492f] transition-colors">
              Add your first company
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {companies.map((comp) => (
            <div key={comp.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col relative group">
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-3 items-center">
                  {comp.logoPath ? (
                    <img src={comp.logoPath} alt="Logo" className="w-12 h-12 object-contain bg-slate-50 rounded border border-slate-100" />
                  ) : (
                    <div className="w-12 h-12 bg-slate-100 rounded border border-slate-200 flex items-center justify-center text-slate-400 text-xs">No Logo</div>
                  )}
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      {comp.name}
                      {comp.isDefault && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#fdeae2] text-[#b7492f] border border-[#f4c9b6]">DEFAULT</span>}
                    </h3>
                    {comp.officialName && <p className="text-xs text-slate-500 mt-0.5">{comp.officialName}</p>}
                    {comp.officialNameAlt && <p className="text-[11px] text-slate-400">{comp.officialNameAlt}</p>}
                  </div>
                </div>
              </div>

              <div className="text-xs text-slate-600 space-y-1.5 mb-4 flex-1">
                {comp.country && <div><span className="text-slate-400 w-16 inline-block">Country:</span> {comp.country}</div>}
                {comp.telephone && <div><span className="text-slate-400 w-16 inline-block">Phone:</span> {comp.telephone}</div>}
                {(comp.addressLocal || comp.addressEnglish) && (
                  <div className="flex">
                    <span className="text-slate-400 w-16 inline-block shrink-0">Address:</span>
                    <span className="truncate">{comp.addressLocal || comp.addressEnglish}</span>
                  </div>
                )}
              </div>

              {permissions.canManageUsers && (
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setManagingBanks({ id: comp.id, name: comp.name })}
                    className="text-xs font-semibold text-slate-600 hover:text-emerald-700 transition-colors"
                  >
                    Bank Accounts
                  </button>
                  <div className="flex items-center gap-3">
                    <button onClick={() => openForm(comp)} className="text-xs font-semibold text-blue-600 hover:text-blue-800">Edit</button>
                    <button onClick={() => remove(comp.id)} className="text-xs font-semibold text-red-500 hover:text-red-700">Delete</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{editing ? "Edit Company" : "Add Company"}</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
            </div>
            <form onSubmit={save} className="p-4 space-y-4">

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Name (Display / System) *
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  placeholder="e.g. System display name"
                  required
                />
              </div>

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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Country</label>
                  <input value={country} onChange={(e) => setCountry(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="e.g. China / CN" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">General Telephone</label>
                  <input value={telephone} onChange={(e) => setTelephone(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="請輸入總機電話 / General telephone" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Address (Primary / Local)</label>
                  <textarea value={addressLocal} onChange={(e) => setAddressLocal(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" rows={2} placeholder="請輸入主要/本地語言詳細地址" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Address (Secondary / English)</label>
                  <textarea value={addressEnglish} onChange={(e) => setAddressEnglish(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" rows={2} placeholder="Please enter detailed English address" />
                </div>
              </div>

              <FapiaoInfoSection
                country={country}
                values={fapiao}
                defaultCompanyName={officialName}
                defaultAddress={addressLocal}
                onChange={(field, value) => setFapiao((prev) => ({ ...prev, [field]: value }))}
              />

              <div className="pt-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} className="w-4 h-4 text-[#d97449] rounded border-slate-300 focus:ring-[#f1c6b2]" />
                  Set as default company for new documents
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Company Logo (Optional)</label>
                <div className="flex gap-4 items-start">
                  <ImageUploader
                    value={logoPath}
                    onChange={(val: string | string[]) => {
                      const url = Array.isArray(val) ? val[0] || "" : val;
                      setLogoPath(url);
                    }}
                    folder="fiborge/logos"
                  />
                  {logoPath && <div className="flex-1 bg-slate-50 p-2 rounded-lg border border-slate-200"><img src={logoPath} alt="Logo preview" className="h-12 object-contain" /></div>}
                </div>
                <div className="mt-2 flex gap-2"><input type="text" value={logoPath} onChange={(e) => setLogoPath(e.target.value)} className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono text-slate-500" placeholder="Or paste direct image URL..." /></div>
              </div>

              <div><label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Internal Notes</label><textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" rows={2} /></div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300">Cancel</button>
                <button type="submit" disabled={saving} className="px-5 py-2 bg-[#d97449] text-white rounded-lg text-sm font-semibold hover:bg-[#b7492f] disabled:opacity-50 transition-colors">{saving ? "Saving..." : "Save Company"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {managingBanks && (
        <BankAccountsModal
          entity={{ id: managingBanks.id, name: managingBanks.name }}
          entityType="company"
          permissions={permissions}
          onClose={() => setManagingBanks(null)}
        />
      )}
    </div>
  );
}