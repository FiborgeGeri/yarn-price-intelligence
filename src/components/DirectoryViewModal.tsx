"use client";

import { useEffect, useState } from "react";

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

interface BankAccount {
  id: number;
  bankName: string;
  bankCode?: string | null;
  branch?: string | null;
  accountName?: string | null;
  accountNumber?: string | null;
  currency?: string | null;
  swiftCode?: string | null;
  iban?: string | null;
  isDefault?: boolean | null;
}

interface Entity {
  id: number;
  name: string;
  officialName?: string | null;
  country?: string | null;
  addressLocal?: string | null;
  addressEnglish?: string | null;
  telephone?: string | null;
  notes?: string | null;
  relationship?: string | null;
  status?: string | null;
  category?: string | null;
  isDefault?: boolean | null;
  logoPath?: string | null;
  certNames?: string[];
  createdByName?: string | null;
  updatedByName?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
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
  entity: Entity | null;
  entityType: "customer" | "factory" | "company" | "shipTo";
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
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!entity) return;
    const load = async () => {
      setLoading(true);
      try {
        // 讀取聯絡人
        const promises: Promise<any>[] = [];
        if (contactsEndpoint && contactsForeignKey) {
          promises.push(
            fetch(`${contactsEndpoint}?${contactsForeignKey}=${entity.id}`)
              .then((r) => r.json())
              .catch(() => [])
          );
        } else {
          promises.push(Promise.resolve([]));
        }
        // 讀取銀行帳戶（company/customer/factory 有；shipTo 沒有）
        if (entityType !== "shipTo") {
          promises.push(
            fetch(`/api/bank-accounts?entityType=${entityType}&entityId=${entity.id}`)
              .then((r) => r.json())
              .catch(() => [])
          );
        } else {
          promises.push(Promise.resolve([]));
        }
        const [c, b] = await Promise.all(promises);
        setContacts(Array.isArray(c) ? c : []);
        setBankAccounts(Array.isArray(b) ? b : []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [entity, entityType, contactsEndpoint, contactsForeignKey]);

  if (!entity) return null;

  const isChina = (() => {
    if (!entity.country) return false;
    const c = entity.country.trim().toLowerCase();
    return c === "china" || c === "中國" || c === "中国" || c === "cn" || c === "prc";
  })();

  const hasFapiao =
    entity.fapiaoCompanyName ||
    entity.fapiaoTaxId ||
    entity.fapiaoAddress ||
    entity.fapiaoBankName ||
    entity.fapiaoBankAccount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            {entity.logoPath && (
              <img
                src={entity.logoPath}
                alt=""
                className="w-10 h-10 object-contain rounded"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            )}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-slate-900">{entity.name}</h2>
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-medium">
                  {entityLabel}
                </span>
                {entity.isDefault && (
                  <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[10px] font-semibold">
                    Default
                  </span>
                )}
                {entity.status && entity.status !== "Active" && (
                  <span className="px-2 py-0.5 bg-red-50 text-red-600 border border-red-200 rounded text-[10px] font-semibold">
                    {entity.status}
                  </span>
                )}
              </div>
              {entity.officialName && (
                <p className="text-xs text-slate-500 mt-0.5">{entity.officialName}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-xl"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Basic Info */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
              Basic Information
            </h3>
            <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm">
              {entity.country && (
                <div className="flex">
                  <span className="text-slate-500 w-32 shrink-0">Country</span>
                  <span className="text-slate-900 font-medium">{entity.country}</span>
                </div>
              )}
              {entity.category && (
                <div className="flex">
                  <span className="text-slate-500 w-32 shrink-0">Category</span>
                  <span className="text-slate-900">{entity.category}</span>
                </div>
              )}
              {entity.relationship && (
                <div className="flex">
                  <span className="text-slate-500 w-32 shrink-0">Relationship</span>
                  <span className="text-slate-900">{entity.relationship}</span>
                </div>
              )}
              {entity.telephone && (
                <div className="flex">
                  <span className="text-slate-500 w-32 shrink-0">Telephone</span>
                  <span className="text-slate-900 font-mono">{entity.telephone}</span>
                </div>
              )}
              {entity.addressEnglish && (
                <div className="flex">
                  <span className="text-slate-500 w-32 shrink-0">Address (EN)</span>
                  <span className="text-slate-900 whitespace-pre-line flex-1">{entity.addressEnglish}</span>
                </div>
              )}
              {entity.addressLocal && entity.addressLocal !== entity.addressEnglish && (
                <div className="flex">
                  <span className="text-slate-500 w-32 shrink-0">Address (Local)</span>
                  <span className="text-slate-900 whitespace-pre-line flex-1">{entity.addressLocal}</span>
                </div>
              )}
              {entity.certNames && entity.certNames.length > 0 && (
                <div className="flex">
                  <span className="text-slate-500 w-32 shrink-0">Certifications</span>
                  <div className="flex flex-wrap gap-1 flex-1">
                    {entity.certNames.map((c) => (
                      <span
                        key={c}
                        className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-xs font-medium"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {entity.notes && (
                <div className="flex">
                  <span className="text-slate-500 w-32 shrink-0">Notes</span>
                  <span className="text-slate-700 whitespace-pre-line flex-1">{entity.notes}</span>
                </div>
              )}
            </div>
          </section>

          {/* Contacts */}
          {contactsEndpoint && (
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
                Contacts {loading ? "" : `(${contacts.length})`}
              </h3>
              {loading ? (
                <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-400 text-center">Loading…</div>
              ) : contacts.length === 0 ? (
                <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-400 text-center">No contacts</div>
              ) : (
                <div className="space-y-2">
                  {contacts.map((c) => (
                    <div key={c.id} className="bg-white border border-slate-200 rounded-lg p-3 text-sm">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-slate-900">{c.contactName}</span>
                        {c.position && (
                          <span className="text-slate-500 text-xs">· {c.position}</span>
                        )}
                        {c.department && (
                          <span className="text-slate-400 text-xs">· {c.department}</span>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                        {c.email && <span>📧 {c.email}</span>}
                        {c.phone && <span>☎️ {c.phone}</span>}
                        {c.cellPhone && <span>📱 {c.cellPhone}</span>}
                      </div>
                      {c.notes && <div className="mt-1 text-xs text-slate-500 italic">{c.notes}</div>}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Bank Accounts */}
          {entityType !== "shipTo" && (
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
                Bank Accounts {loading ? "" : `(${bankAccounts.length})`}
              </h3>
              {loading ? (
                <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-400 text-center">Loading…</div>
              ) : bankAccounts.length === 0 ? (
                <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-400 text-center">No bank accounts</div>
              ) : (
                <div className="space-y-2">
                  {bankAccounts.map((b) => {
                    const currencies = (b.currency || "").split(",").map((c) => c.trim()).filter(Boolean);
                    return (
                      <div
                        key={b.id}
                        className={`bg-white border rounded-lg p-3 text-sm ${
                          b.isDefault ? "border-amber-300 ring-1 ring-amber-100" : "border-slate-200"
                        }`}
                      >
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-semibold text-slate-900">{b.bankName}</span>
                          {b.bankCode && (
                            <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-mono rounded">
                              Code: {b.bankCode}
                            </span>
                          )}
                          {currencies.map((c) => (
                            <span
                              key={c}
                              className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-extrabold rounded"
                            >
                              {c}
                            </span>
                          ))}
                          {b.isDefault && (
                            <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[10px] font-bold">
                              PRIMARY
                            </span>
                          )}
                        </div>
                        {b.branch && (
                          <div className="text-xs text-slate-500">Branch: {b.branch}</div>
                        )}
                        {b.accountName && (
                          <div className="text-xs text-slate-600">
                            A/C Name: <span className="font-medium">{b.accountName}</span>
                          </div>
                        )}
                        {b.accountNumber && (
                          <div className="text-sm font-mono font-bold text-slate-800 mt-1">
                            {b.accountNumber}
                          </div>
                        )}
                        <div className="flex flex-wrap gap-x-4 text-xs text-slate-500 font-mono mt-1">
                          {b.swiftCode && <span>SWIFT: <span className="text-slate-700 font-semibold">{b.swiftCode}</span></span>}
                          {b.iban && <span>IBAN: <span className="text-slate-700 font-semibold">{b.iban}</span></span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* China VAT Fapiao Info */}
          {isChina && hasFapiao && (
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
                <span className="inline-block px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 text-xs font-semibold">
                  增值稅開票資料 (China VAT Invoice Info)
                </span>
              </h3>
              <div className="bg-red-50/40 border border-red-100 rounded-lg p-4 space-y-2 text-sm">
                {entity.fapiaoCompanyName && (
                  <div className="flex">
                    <span className="text-slate-500 w-32 shrink-0">公司名稱</span>
                    <span className="text-slate-900 font-medium">{entity.fapiaoCompanyName}</span>
                  </div>
                )}
                {entity.fapiaoTaxId && (
                  <div className="flex">
                    <span className="text-slate-500 w-32 shrink-0">納稅人識別號</span>
                    <span className="text-slate-900 font-mono">{entity.fapiaoTaxId}</span>
                  </div>
                )}
                {entity.fapiaoAddress && (
                  <div className="flex">
                    <span className="text-slate-500 w-32 shrink-0">地址</span>
                    <span className="text-slate-900 whitespace-pre-line flex-1">{entity.fapiaoAddress}</span>
                  </div>
                )}
                {entity.fapiaoPhone && (
                  <div className="flex">
                    <span className="text-slate-500 w-32 shrink-0">電話</span>
                    <span className="text-slate-900 font-mono">{entity.fapiaoPhone}</span>
                  </div>
                )}
                {entity.fapiaoFax && (
                  <div className="flex">
                    <span className="text-slate-500 w-32 shrink-0">傳真</span>
                    <span className="text-slate-900 font-mono">{entity.fapiaoFax}</span>
                  </div>
                )}
                {entity.fapiaoBankName && (
                  <div className="flex">
                    <span className="text-slate-500 w-32 shrink-0">開戶行</span>
                    <span className="text-slate-900">{entity.fapiaoBankName}</span>
                  </div>
                )}
                {entity.fapiaoBankAccount && (
                  <div className="flex">
                    <span className="text-slate-500 w-32 shrink-0">帳號</span>
                    <span className="text-slate-900 font-mono">{entity.fapiaoBankAccount}</span>
                  </div>
                )}
                {entity.fapiaoContact && (
                  <div className="flex">
                    <span className="text-slate-500 w-32 shrink-0">聯繫人</span>
                    <span className="text-slate-900">{entity.fapiaoContact}</span>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Audit Info */}
          {(entity.createdByName || entity.updatedByName) && (
            <section className="border-t border-slate-100 pt-3">
              <div className="flex justify-between text-[11px] text-slate-400">
                {entity.createdByName && (
                  <span>Created by <span className="text-slate-500">{entity.createdByName}</span></span>
                )}
                {entity.updatedByName && (
                  <span>Last updated by <span className="text-slate-500">{entity.updatedByName}</span></span>
                )}
              </div>
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end sticky bottom-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
