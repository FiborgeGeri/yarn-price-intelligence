"use client";

import { useEffect, useState } from "react";

interface BankAccount {
  id: number;
  bankName: string;
  accountName?: string | null;
  accountNumber?: string | null;
  currency?: string | null;
  swiftCode?: string | null;
  iban?: string | null;
  branch?: string | null;
  isDefault?: boolean;
}

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

interface Props {
  entity: any | null;
  entityType: "factory" | "customer" | "company" | "shipTo";
  entityLabel: string;
  contactsEndpoint?: string;
  contactsForeignKey?: string;
  onClose: () => void;
}

export default function DirectoryViewModal({
  entity,
  entityType,
  entityLabel,
  contactsEndpoint,
  contactsForeignKey,
  onClose,
}: Props) {
  const [banks, setBanks] = useState<BankAccount[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingBanks, setLoadingBanks] = useState(false);
  const [loadingContacts, setLoadingContacts] = useState(false);

  useEffect(() => {
    if (entity?.id) {
      // 1. 自動撈取該實體的銀行帳戶
      setLoadingBanks(true);
      fetch(`/api/bank-accounts?entityType=${entityType}&entityId=${entity.id}`)
        .then((r) => r.json())
        .then((d) => {
          setBanks(Array.isArray(d) ? d : []);
          setLoadingBanks(false);
        })
        .catch(() => setLoadingBanks(false));

      // 2. 自動撈取該實體的聯絡人團隊
      if (contactsEndpoint && contactsForeignKey) {
        setLoadingContacts(true);
        fetch(`${contactsEndpoint}?${contactsForeignKey}=${entity.id}`)
          .then((r) => r.json())
          .then((d) => {
            setContacts(Array.isArray(d) ? d : []);
            setLoadingContacts(false);
          })
          .catch(() => setLoadingContacts(false));
      }
    }
  }, [entity, entityType, contactsEndpoint, contactsForeignKey]);

  if (!entity) return null;

  const displayName = entity.name || entity.factoryName || "";
  const officialPrimary = entity.officialName || "";
  const officialSecondary = entity.officialNameAlt || "";

  const hasFapiao = entity.fapiaoTaxId || entity.fapiaoCompanyName || entity.fapiaoBankName;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header 頂部 */}
        <div className="px-6 py-4 border-b border-slate-200 bg-[#fef7f3] flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#fdeae2] text-[#b7492f] border border-[#f4c9b6]">
                {entityLabel}
              </span>
              <h2 className="text-xl font-bold text-slate-900">{displayName}</h2>
            </div>
            {officialPrimary && <p className="text-xs font-medium text-slate-600 mt-1">{officialPrimary}</p>}
            {officialSecondary && <p className="text-xs text-slate-400 font-mono mt-0.5">{officialSecondary}</p>}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Modal 內容區 */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-700 text-xs">
          {/* 1. 基本資訊與地址 */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Address & General Info</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-slate-400 block mb-0.5">Primary Address (Local):</span>
                <span className="font-medium text-slate-800">{entity.addressLocal || "—"}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Secondary Address (English):</span>
                <span className="font-medium text-slate-800">{entity.addressEnglish || "—"}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Country:</span>
                <span className="font-semibold text-slate-800">{entity.country || "—"}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">General Telephone:</span>
                <span className="font-mono font-semibold text-slate-800">{entity.telephone || "—"}</span>
              </div>
            </div>
          </div>

          {/* 2. 🏦 銀行帳戶資料 (Bank Accounts) */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                <span>🏦 Bank Accounts</span>
                <span className="text-[10px] text-slate-400 font-normal">({banks.length})</span>
              </h3>
            </div>
            {loadingBanks ? (
              <div className="text-slate-400 py-3 text-center">Loading bank details...</div>
            ) : banks.length === 0 ? (
              <div className="text-slate-400 py-3 text-center bg-slate-50 rounded-lg italic">No bank accounts configured</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {banks.map((b) => (
                  <div key={b.id} className="p-3 rounded-xl border border-emerald-100 bg-emerald-50/30 space-y-1">
                    <div className="font-bold text-slate-800 flex items-center justify-between">
                      <span>{b.bankName}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">{b.currency || "USD"}</span>
                    </div>
                    {b.accountName && <div className="text-slate-600">A/C Name: <strong className="text-slate-800">{b.accountName}</strong></div>}
                    {b.accountNumber && <div className="font-mono text-slate-800 font-semibold">A/C No: {b.accountNumber}</div>}
                    {b.swiftCode && <div className="font-mono text-slate-500 text-[11px]">SWIFT: {b.swiftCode}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. 🧾 中國增值稅開票資料 (Fapiao Info) */}
          {hasFapiao && (
            <div className="border border-amber-200 rounded-xl p-4 bg-[#fef5e7]/40 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#8b6914] mb-3">
                🧾 China VAT Invoice Info (增值稅開票資料)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div><span className="text-slate-400">公司名稱:</span> <strong className="text-slate-800">{entity.fapiaoCompanyName || "—"}</strong></div>
                <div><span className="text-slate-400">納稅人識別號:</span> <strong className="font-mono text-slate-800">{entity.fapiaoTaxId || "—"}</strong></div>
                <div><span className="text-slate-400">開戶銀行:</span> <span className="text-slate-800">{entity.fapiaoBankName || "—"}</span></div>
                <div><span className="text-slate-400">銀行帳號:</span> <span className="font-mono text-slate-800">{entity.fapiaoBankAccount || "—"}</span></div>
                <div className="col-span-full"><span className="text-slate-400">地址電話:</span> <span className="text-slate-800">{entity.fapiaoAddress} {entity.fapiaoPhone}</span></div>
              </div>
            </div>
          )}

          {/* 4. 👥 聯絡人團隊 (Contacts List) */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-800 mb-3 flex items-center gap-1.5">
              <span>👥 Contacts Team</span>
              <span className="text-[10px] text-slate-400 font-normal">({contacts.length})</span>
            </h3>
            {loadingContacts ? (
              <div className="text-slate-400 py-3 text-center">Loading contacts...</div>
            ) : contacts.length === 0 ? (
              <div className="text-slate-400 py-3 text-center bg-slate-50 rounded-lg italic">No contacts registered</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {contacts.map((c) => (
                  <div key={c.id} className="p-3 rounded-xl border border-blue-100 bg-blue-50/20 space-y-1">
                    <div className="font-bold text-slate-900 text-sm">{c.contactName}</div>
                    {(c.position || c.department) && (
                      <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                        {[c.position, c.department].filter(Boolean).join(" · ")}
                      </div>
                    )}
                    <div className="space-y-0.5 pt-1 text-[11px]">
                      {c.cellPhone && <div>Mobile: <span className="font-mono font-semibold text-slate-800">{c.cellPhone}</span></div>}
                      {c.phone && <div>Direct: <span className="font-mono text-slate-700">{c.phone}</span></div>}
                      {c.email && <div>Email: <a href={`mailto:${c.email}`} className="text-blue-600 hover:underline">{c.email}</a></div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 備註 */}
          {entity.notes && (
            <div>
              <span className="text-slate-400 text-xs block mb-1">Notes:</span>
              <div className="bg-slate-50 p-3 rounded-xl text-slate-600 italic border border-slate-200 whitespace-pre-line">
                {entity.notes}
              </div>
            </div>
          )}
        </div>

        {/* Footer 底部 */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}