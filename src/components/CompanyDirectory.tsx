"use client";

import { useCallback, useEffect, useState } from "react";
import AuditInfo from "@/components/AuditInfo";
import { getUserId } from "@/lib/getUserId";
import { Permissions } from "@/lib/permissions";

export interface DirectoryContact {
  id: number;
  contactName: string;
  department?: string | null;
  position?: string | null;
  email?: string | null;
  phone?: string | null;
  cellPhone?: string | null;
  notes?: string | null;
}

interface DirectoryCardProps {
  name: string;
  officialName?: string | null;
  badge?: { label: string; tone?: "coral" | "sage" | "neutral" } | null;
  addressEnglish?: string | null;
  addressLocal?: string | null;
  country?: string | null;
  telephone?: string | null;
  summary?: string | null;
  chips?: string[];
  notes?: string | null;
  contactCount: number;
  bankAccountCount?: number;
  createdByName?: string | null;
  updatedByName?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  permissions: Permissions;
  onContacts: () => void;
  onBankAccounts?: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onView?: () => void;
}

const badgeTone = {
  coral: "bg-[#fff0e8] text-[#b8613f] border-[#f1c6b2]",
  sage: "bg-[#edf5f0] text-[#4d7d61] border-[#cfe3d7]",
  neutral: "bg-slate-100 text-slate-600 border-slate-200",
};

export function DirectoryCard({
  name,
  officialName,
  badge,
  addressEnglish,
  addressLocal,
  country,
  telephone,
  summary,
  chips = [],
  notes,
  contactCount = 0,
  bankAccountCount = 0,
  createdByName,
  updatedByName,
  createdAt,
  updatedAt,
  permissions,
  onContacts,
  onBankAccounts,
  onEdit,
  onDelete,
  onView, 
}: DirectoryCardProps) {
  return (
    <article className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 min-h-[230px]">
      <div className="flex items-start justify-between gap-4 h-full">
        <div className="flex-1 min-w-0 flex flex-col h-full">
          {/* 🆕 點擊公司名稱即可觸發 View */}
          <div className="font-semibold text-slate-900 truncate">
            {onView ? (
              <button 
                type="button" 
                onClick={onView} 
                className="text-left font-semibold text-slate-900 hover:text-blue-700 hover:underline focus:outline-none"
              >
                {name}
              </button>
            ) : (
              name
            )}
          </div>
          <div className="text-xs text-slate-400 mt-0.5 min-h-4 truncate">{officialName || " "}</div>

          {badge && (
            <div className="mt-1.5">
              <span className={`inline-flex px-2 py-0.5 border rounded text-[10px] font-semibold ${badgeTone[badge.tone || "neutral"]}`}>
                {badge.label}
              </span>
            </div>
          )}

          <div className="mt-3 space-y-1 text-xs">
            <div className="text-slate-600 whitespace-pre-line line-clamp-3">{addressEnglish || addressLocal || "No address recorded"}</div>
            {addressEnglish && addressLocal && addressEnglish !== addressLocal && (
              <div className="text-slate-400 whitespace-pre-line line-clamp-2">{addressLocal}</div>
            )}
            <div className="text-slate-500">{country || "Country not specified"}</div>
            <div className="text-slate-400">Tel: {telephone || "—"}</div>
          </div>

          {summary && <div className="text-xs text-slate-500 mt-2">{summary}</div>}
          {chips.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {chips.map((chip, index) => (
                <span key={`${chip}-${index}`} className="px-1.5 py-0.5 bg-[#fff0e8] text-[#b8613f] border border-[#f3d4c5] rounded text-[10px] font-medium">
                  {chip}
                </span>
              ))}
            </div>
          )}
          {notes && <div className="text-xs text-slate-400 mt-2 whitespace-pre-line line-clamp-2">{notes}</div>}

          <AuditInfo
            createdByName={createdByName}
            updatedByName={updatedByName}
            createdAt={createdAt}
            updatedAt={updatedAt}
            className="mt-auto pt-3 border-t border-slate-100"
          />
        </div>

        <div className="flex flex-col gap-1 shrink-0 items-end">
          <button onClick={onContacts} className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1 font-medium underline whitespace-nowrap">
            {contactCount} contact{contactCount !== 1 ? "s" : ""} →
          </button>
          {onBankAccounts && (
            <button onClick={onBankAccounts} className="text-emerald-700 hover:text-emerald-900 text-xs px-2 py-1 font-medium underline whitespace-nowrap">
              {bankAccountCount || 0} bank a/c{(bankAccountCount || 0) !== 1 ? "s" : ""} →
            </button>
          )}
          {onView && <button onClick={onView} className="text-slate-500 hover:text-slate-700 text-xs px-2 py-1">View</button>}
          {permissions.canEdit && <button onClick={onEdit} className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1">Edit</button>}
          {permissions.canDelete && <button onClick={onDelete} className="text-red-500 hover:text-red-700 text-xs px-2 py-1">Delete</button>}
        </div>
      </div>
    </article>
  );
}

interface ContactsModalProps {
  entity: { id: number; name: string; officialName?: string | null } | null;
  endpoint: string;
  foreignKey: "factoryId" | "customerId" | "shipToId";
  permissions: Permissions;
  emptyText: string;
  onClose: () => void;
  onChanged: () => void;
}

export function DirectoryContactsModal({ entity, endpoint, foreignKey, permissions, emptyText, onClose, onChanged }: ContactsModalProps) {
  const [contacts, setContacts] = useState<DirectoryContact[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<DirectoryContact | null>(null);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [position, setPosition] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [cellPhone, setCellPhone] = useState("");
  const [notes, setNotes] = useState("");

  const load = useCallback(async () => {
    if (!entity) return;
    setLoading(true);
    try {
      const data = await fetch(`${endpoint}?${foreignKey}=${entity.id}`).then((r) => r.json());
      setContacts(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, [endpoint, entity, foreignKey]);

  useEffect(() => {
    if (entity) {
      setShowForm(false);
      setEditing(null);
      load();
    }
  }, [entity, load]);

  if (!entity) return null;

  const openForm = (contact?: DirectoryContact) => {
    const c = contact || null;
    setEditing(c);
    setName(c?.contactName || "");
    setDepartment(c?.department || "");
    setPosition(c?.position || "");
    setEmail(c?.email || "");
    setPhone(c?.phone || "");
    setCellPhone(c?.cellPhone || "");
    setNotes(c?.notes || "");
    setShowForm(true);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editing?.id,
          [foreignKey]: entity.id,
          contactName: name.trim(),
          department,
          position,
          email,
          phone,
          cellPhone,
          notes,
          userId: getUserId(),
        }),
      });
      if (response.ok) {
        setShowForm(false);
        setEditing(null);
        await load();
        onChanged();
      }
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this contact?")) return;
    const response = await fetch(`${endpoint}?id=${id}`, { method: "DELETE" });
    if (response.ok) {
      await load();
      onChanged();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Contacts — {entity.name}</h2>
            {entity.officialName && <p className="text-xs text-slate-500 mt-0.5">{entity.officialName}</p>}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
        </div>

        <div className="p-4">
          {loading ? (
            <div className="flex justify-center py-8"><div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : (
            <>
              {contacts.length === 0 && !showForm && <div className="text-center py-6 text-slate-400 text-sm">{emptyText}</div>}
              <div className="space-y-3">
                {contacts.map((contact) => (
                  <div key={contact.id} className="border border-slate-200 rounded-lg p-3 hover:border-slate-300 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium text-sm text-slate-900">{contact.contactName}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{[contact.position, contact.department].filter(Boolean).join(" · ") || "—"}</div>
                        <div className="text-xs text-slate-400 mt-1 break-words">{[contact.email, contact.phone, contact.cellPhone].filter(Boolean).join(" · ") || "—"}</div>
                        {contact.notes && <div className="text-xs text-slate-400 mt-1">{contact.notes}</div>}
                      </div>
                      {(permissions.canEdit || permissions.canDelete) && (
                        <div className="flex gap-2 shrink-0">
                          {permissions.canEdit && <button onClick={() => openForm(contact)} className="text-blue-600 hover:text-blue-800 text-xs">Edit</button>}
                          {permissions.canDelete && <button onClick={() => remove(contact.id)} className="text-red-500 hover:text-red-700 text-xs">Delete</button>}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {showForm ? (
                <form onSubmit={save} className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                  <h3 className="text-sm font-semibold text-slate-700">{editing ? "Edit Contact" : "Add Contact"}</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-xs font-medium text-slate-600 mb-1">Name *</label><input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs" required /></div>
                    <div><label className="block text-xs font-medium text-slate-600 mb-1">Position</label><input value={position} onChange={(e) => setPosition(e.target.value)} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-xs font-medium text-slate-600 mb-1">Department</label><input value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs" /></div>
                    <div><label className="block text-xs font-medium text-slate-600 mb-1">Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-xs font-medium text-slate-600 mb-1">Phone</label><input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs" /></div>
                    <div><label className="block text-xs font-medium text-slate-600 mb-1">Cell Phone</label><input value={cellPhone} onChange={(e) => setCellPhone(e.target.value)} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs" /></div>
                  </div>
                  <div><label className="block text-xs font-medium text-slate-600 mb-1">Notes</label><input value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs" /></div>
                  <div className="flex gap-2">
                    <button type="submit" disabled={saving} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50">{saving ? "Saving..." : editing ? "Update" : "Add"}</button>
                    <button type="button" onClick={() => setShowForm(false)} className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs">Cancel</button>
                  </div>
                </form>
              ) : permissions.canEdit && (
                <button onClick={() => openForm()} className="mt-4 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 w-full">+ Add Contact</button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
