"use client";

import { useState, useEffect } from "react";
import { Permissions } from "@/lib/permissions";
import { getUserId } from "@/lib/getUserId";

interface Badge {
  label: string;
  tone: "coral" | "sage" | "neutral";
}

export interface DirectoryCardProps {
  name: string;
  officialName?: string | null;
  badge?: Badge | null;
  addressEnglish?: string | null;
  addressLocal?: string | null;
  country?: string | null;
  telephone?: string | null;
  summary?: string | null;
  chips?: string[];
  notes?: string | null;
  contactCount: number;
  createdByName?: string | null; // 🟢 補回 Audit 欄位
  updatedByName?: string | null; // 🟢 補回 Audit 欄位
  createdAt?: string | null;     // 🟢 補回 Audit 欄位
  updatedAt?: string | null;     // 🟢 補回 Audit 欄位
  permissions: Permissions;
  onContacts?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onView?: () => void;
  onManageBanks?: () => void;
}

export function DirectoryCard({
  name,
  officialName,
  badge,
  addressEnglish,
  addressLocal,
  country,
  telephone,
  summary,
  chips,
  notes,
  contactCount,
  createdByName,
  updatedByName,
  createdAt,
  updatedAt,
  permissions,
  onContacts,
  onEdit,
  onDelete,
  onView,
  onManageBanks,
}: DirectoryCardProps) {
  const badgeStyle = {
    coral: "bg-[#fdeae2] text-[#b7492f] border border-[#f4c9b6]",
    sage: "bg-[#f0f5ee] text-[#4d7d41] border border-[#c2d9b8]",
    neutral: "bg-slate-100 text-slate-600 border border-slate-200",
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 flex flex-col hover:border-slate-300 hover:shadow-md transition-all group overflow-hidden h-full">
      {/* 上方可點擊區域 (查看詳情) */}
      <div 
        onClick={(e) => {
          e.stopPropagation();
          if (onView) onView();
        }}
        className="p-5 flex-1 cursor-pointer"
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 leading-tight mb-1 group-hover:text-[#d97449] transition-colors">{name}</h3>
            {officialName && <p className="text-[11px] text-slate-500 max-w-[280px] truncate">{officialName}</p>}
          </div>
          {badge && (
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${badgeStyle[badge.tone]}`}>
              {badge.label}
            </span>
          )}
        </div>

        <div className="space-y-2 mb-4">
          <div className="text-xs text-slate-600">
            {(addressLocal || addressEnglish) && (
              <div className="flex gap-2">
                <span className="text-slate-400 w-16 shrink-0">Address:</span>
                <span className="truncate">{addressLocal || addressEnglish}</span>
              </div>
            )}
            {country && (
              <div className="flex gap-2 mt-1.5">
                <span className="text-slate-400 w-16 shrink-0">Country:</span>
                <span>{country}</span>
              </div>
            )}
            {telephone && (
              <div className="flex gap-2 mt-1.5">
                <span className="text-slate-400 w-16 shrink-0">Tel:</span>
                <span>{telephone}</span>
              </div>
            )}
          </div>

          {summary && <div className="text-xs font-semibold text-slate-700 mt-2">{summary}</div>}

          {chips && chips.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {chips.map((c, i) => (
                <span key={i} className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-50 text-slate-500 border border-slate-200">
                  {c}
                </span>
              ))}
            </div>
          )}
        </div>

        {notes && (
          <div className="text-[11px] text-slate-500 p-2 bg-slate-50 rounded-lg italic line-clamp-2">
            {notes}
          </div>
        )}
      </div>

      {/* 下方按鈕區 (獨立事件範圍) */}
      <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (onContacts) onContacts();
          }}
          className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
          {contactCount} Contact{contactCount === 1 ? "" : "s"}
        </button>
        
        <div className="flex items-center gap-4">
          {permissions.canEdit && onManageBanks && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onManageBanks();
              }}
              className="text-xs font-semibold text-slate-500 hover:text-emerald-700 transition-colors"
            >
              Bank Accounts
            </button>
          )}
          {permissions.canEdit && onEdit && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEdit();
              }}
              className="text-xs font-semibold text-[#d97449] hover:text-[#b7492f] transition-colors"
            >
              Edit
            </button>
          )}
          {permissions.canDelete && onDelete && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete();
              }}
              className="text-xs font-semibold text-red-400 hover:text-red-600 transition-colors"
            >
              Del
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// DirectoryContactsModal
// ----------------------------------------------------------------------

interface Contact {
  id: number;
  contactName: string;
  department?: string | null;
  position?: string | null;
  email?: string | null;
  phone?: string | null;
  cellPhone?: string | null;
  notes?: string | null;
}

interface ContactsModalProps {
  entity: { id: number; name: string; officialName?: string | null } | null;
  endpoint: string;
  foreignKey: string;
  permissions: Permissions;
  emptyText: string;
  onClose: () => void;
  onChanged: () => void;
}

export function DirectoryContactsModal({
  entity,
  endpoint,
  foreignKey,
  permissions,
  emptyText,
  onClose,
  onChanged,
}: ContactsModalProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [saving, setSaving] = useState(false);

  const [contactName, setContactName] = useState("");
  const [department, setDepartment] = useState("");
  const [position, setPosition] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [cellPhone, setCellPhone] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (entity) {
      setLoading(true);
      fetch(`${endpoint}?${foreignKey}=${entity.id}`)
        .then((r) => r.json())
        .then((data) => {
          setContacts(Array.isArray(data) ? data : []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [entity, endpoint, foreignKey]);

  const openForm = (c?: Contact) => {
    setEditing(c || null);
    setContactName(c?.contactName || "");
    setDepartment(c?.department || "");
    setPosition(c?.position || "");
    setEmail(c?.email || "");
    setPhone(c?.phone || "");
    setCellPhone(c?.cellPhone || "");
    setNotes(c?.notes || "");
    setShowForm(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editing?.id,
          [foreignKey]: entity!.id,
          contactName: contactName.trim(),
          department,
          position,
          email,
          phone,
          cellPhone,
          notes,
          userId: getUserId(),
        }),
      });
      if (res.ok) {
        setShowForm(false);
        const data = await fetch(`${endpoint}?${foreignKey}=${entity!.id}`).then((r) => r.json());
        setContacts(Array.isArray(data) ? data : []);
        onChanged();
      }
    } catch {}
    setSaving(false);
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this contact?")) return;
    const res = await fetch(`${endpoint}?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setContacts((prev) => prev.filter((c) => c.id !== id));
      onChanged();
    }
  };

  if (!entity) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-slate-200 flex items-start justify-between bg-slate-50/50 rounded-t-xl">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{entity.name} — Contacts</h2>
            {entity.officialName && <p className="text-xs text-slate-500 mt-0.5">{entity.officialName}</p>}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100 transition-colors">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {showForm ? (
            <form onSubmit={save} className="bg-white border border-[#f4c9b6] rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <h3 className="font-semibold text-slate-800">{editing ? "Edit Contact" : "Add New Contact"}</h3>
                <button type="button" onClick={() => setShowForm(false)} className="text-xs text-slate-500 hover:text-slate-700">Cancel</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Name *</label><input value={contactName} onChange={(e) => setContactName(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-[#f1c6b2] focus:border-[#e5885d]" required /></div>
                <div><label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Position / Title</label><input value={position} onChange={(e) => setPosition(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
                <div><label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Department</label><input value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
                <div><label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
                <div><label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Cell Phone (Mobile)</label><input value={cellPhone} onChange={(e) => setCellPhone(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
                <div><label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Direct Phone</label><input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
              </div>
              <div className="mt-4"><label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Notes</label><textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" rows={2} /></div>
              <div className="flex justify-end pt-4 mt-4 border-t border-slate-100">
                <button type="submit" disabled={saving} className="px-5 py-2 bg-[#d97449] hover:bg-[#b7492f] text-white rounded-lg text-sm font-semibold disabled:opacity-50 transition-colors">
                  {saving ? "Saving..." : "Save Contact"}
                </button>
              </div>
            </form>
          ) : (
            <>
              {permissions.canEdit && (
                <div className="mb-4">
                  <button onClick={() => openForm()} className="px-4 py-2 bg-[#fdeae2] text-[#b7492f] border border-[#f4c9b6] rounded-lg text-sm font-semibold hover:bg-[#fef5ef] transition-colors">
                    + Add New Contact
                  </button>
                </div>
              )}
              {loading ? (
                <div className="py-12 text-center text-slate-400">Loading contacts...</div>
              ) : contacts.length === 0 ? (
                <div className="py-12 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">{emptyText}</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {contacts.map((c) => (
                    <div key={c.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm relative group">
                      <div className="mb-3">
                        <div className="font-bold text-slate-900">{c.contactName}</div>
                        {(c.position || c.department) && (
                          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
                            {[c.position, c.department].filter(Boolean).join(" · ")}
                          </div>
                        )}
                      </div>
                      <div className="space-y-1.5 text-xs text-slate-600">
                        {c.cellPhone && <div className="flex items-center gap-2"><span className="text-slate-400 w-12 shrink-0">Mobile:</span><span className="font-mono">{c.cellPhone}</span></div>}
                        {c.phone && <div className="flex items-center gap-2"><span className="text-slate-400 w-12 shrink-0">Direct:</span><span className="font-mono">{c.phone}</span></div>}
                        {c.email && <div className="flex items-center gap-2"><span className="text-slate-400 w-12 shrink-0">Email:</span><a href={`mailto:${c.email}`} className="text-blue-600 hover:underline truncate">{c.email}</a></div>}
                        {c.notes && <div className="mt-2 text-[11px] text-slate-500 italic border-l-2 border-slate-200 pl-2 py-0.5">{c.notes}</div>}
                      </div>
                      {permissions.canEdit && (
                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                          <button onClick={() => openForm(c)} className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded">Edit</button>
                          {permissions.canDelete && <button onClick={() => remove(c.id)} className="text-[11px] font-semibold text-red-500 hover:text-red-700 bg-red-50 px-2 py-1 rounded">Del</button>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
