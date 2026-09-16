"use client";
import { useState, useEffect } from "react";
import { Permissions } from "@/lib/permissions";
import { getUserId } from "@/lib/getUserId";
import AuditInfo from "@/components/AuditInfo";
import FapiaoInfoSection from "@/components/FapiaoInfoSection";

interface Company {
  id: number;
  name: string;
  officialName: string;
  addressLocal: string;
  addressEnglish: string;
  country: string;
  telephone: string;
  logoPath: string;
  isDefault: boolean;
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

interface Props { permissions: Permissions; }

/**
 * Convert a Google Drive share link to a direct image URL.
 * Supports: https://drive.google.com/file/d/FILE_ID/view?usp=sharing
 * Returns the original string if it's not a Drive link.
 */
function toImageUrl(link: string): string {
  if (!link) return "";
  const match = link.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (match) {
    return `https://drive.google.com/uc?export=view&id=${match[1]}`;
  }
  // Also handle open?id= format
  const openMatch = link.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
  if (openMatch) {
    return `https://drive.google.com/uc?export=view&id=${openMatch[1]}`;
  }
  return link;
}

export default function CompaniesPage({ permissions }: Props) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Company | null>(null);
  const [toast, setToast] = useState<{ type: string; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [officialName, setOfficialName] = useState("");
  const [addressLocal, setAddressLocal] = useState("");
  const [addressEnglish, setAddressEnglish] = useState("");
  const [country, setCountry] = useState("");
  const [telephone, setTelephone] = useState("");
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
      const data = await fetch("/api/companies").then((r) => r.json());
      setCompanies(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openForm = (company?: Company) => {
    setEditing(company || null);
    setName(company?.name || "");
    setOfficialName(company?.officialName || "");
    setAddressLocal(company?.addressLocal || "");
    setAddressEnglish(company?.addressEnglish || "");
    setCountry(company?.country || "");
    setTelephone(company?.telephone || "");
    setLogoPath(company?.logoPath || "");
    setIsDefault(company?.isDefault || false);
    setNotes(company?.notes || "");
    setFapiao({
      fapiaoCompanyName: company?.fapiaoCompanyName || "",
      fapiaoTaxId: company?.fapiaoTaxId || "",
      fapiaoAddress: company?.fapiaoAddress || "",
      fapiaoPhone: company?.fapiaoPhone || "",
      fapiaoFax: company?.fapiaoFax || "",
      fapiaoBankName: company?.fapiaoBankName || "",
      fapiaoBankAccount: company?.fapiaoBankAccount || "",
      fapiaoContact: company?.fapiaoContact || "",
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
          officialName,
          addressLocal,
          addressEnglish,
          country,
          telephone,
          logoPath,
          isDefault,
          notes,
          ...fapiao,
          userId: getUserId(),
        }),
      });
      if (res.ok) {
        setToast({ type: "success", text: editing ? "Company updated" : "Company created" });
        setShowForm(false);
        await load();
      } else {
        setToast({ type: "error", text: "Failed to save" });
      }
    } finally {
      setSaving(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this company? Existing orders will lose their company tag.")) return;
    await fetch(`/api/companies?id=${id}`, { method: "DELETE" });
    load();
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Companies</h1>
          <p className="text-sm text-slate-500">{companies.length} legal entit{companies.length === 1 ? "y" : "ies"}</p>
        </div>
        {permissions.canEdit && <button onClick={() => openForm()} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">+ Add Company</button>}
      </div>

      {toast && <div className={`mb-4 p-3 rounded-lg text-sm ${toast.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{toast.text}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {companies.length === 0 ? (
          <div className="col-span-2 bg-white rounded-xl p-10 text-center border border-slate-200 text-slate-400">No companies yet</div>
        ) : companies.map((company) => (
          <div key={company.id} className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {company.logoPath && <img src={toImageUrl(company.logoPath)} alt="" className="w-8 h-8 object-contain rounded" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
                  <span className="font-semibold text-slate-900">{company.name}</span>
                  {company.isDefault && <span className="px-2 py-0.5 bg-[#fff0e8] text-[#b8613f] border border-[#f1c6b2] rounded text-[10px] font-semibold">Default</span>}
                </div>
                {company.officialName && <div className="text-xs text-slate-400 mt-0.5">{company.officialName}</div>}
                {company.addressEnglish && <div className="text-xs text-slate-500 mt-2 whitespace-pre-line">{company.addressEnglish}</div>}
                {company.addressLocal && company.addressLocal !== company.addressEnglish && <div className="text-xs text-slate-400 mt-1 whitespace-pre-line">{company.addressLocal}</div>}
                {company.country && <div className="text-xs text-slate-400 mt-1">Country: {company.country}</div>}
                {company.telephone && <div className="text-xs text-slate-400 mt-1">Tel: {company.telephone}</div>}
                {company.notes && <div className="text-xs text-slate-400 mt-2">{company.notes}</div>}
                <AuditInfo createdByName={company.createdByName} updatedByName={company.updatedByName} className="mt-3 pt-2 border-t border-slate-100" />
              </div>
              <div className="flex flex-col gap-1 shrink-0 items-end">
                {permissions.canEdit && <button onClick={() => openForm(company)} className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1">Edit</button>}
                {permissions.canDelete && <button onClick={() => handleDelete(company.id)} className="text-red-500 hover:text-red-700 text-xs px-2 py-1">Delete</button>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showForm && permissions.canEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{editing ? "Edit Company" : "Add Company"}</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Company Name (Display) *</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" required placeholder="e.g. Fiborge" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Official Name</label>
                  <input value={officialName} onChange={(e) => setOfficialName(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="e.g. Fiborge Company Limited" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Address (Local Language)</label>
                <textarea value={addressLocal} onChange={(e) => setAddressLocal(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" rows={3} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Address (English)</label>
                <textarea value={addressEnglish} onChange={(e) => setAddressEnglish(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Country</label>
                  <input value={country} onChange={(e) => setCountry(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="e.g. China, Hong Kong" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Telephone</label>
                  <input value={telephone} onChange={(e) => setTelephone(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Logo URL or Path</label>
                <input value={logoPath} onChange={(e) => setLogoPath(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="https://drive.google.com/file/d/... or /images/logo.png" />
                <p className="text-[10px] text-slate-400 mt-1">Paste a Google Drive share link or an app path like /images/logo.png</p>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} className="w-4 h-4 rounded border-slate-300" />
                <span>Set as default company for new orders</span>
              </label>

             <FapiaoInfoSection
                country={country}
                values={fapiao}
                defaultCompanyName={officialName}
                defaultAddress={addressLocal}
                onChange={(field, value) => setFapiao((prev) => ({ ...prev, [field]: value }))}
              />

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" rows={2} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">{saving ? "Saving..." : editing ? "Update" : "Create"}</button>
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
