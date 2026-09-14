"use client";

import React, { useEffect, useState } from "react";
import {
  X, Plus, Pencil, Trash2, Star, Copy, Check, Landmark, Building
} from "lucide-react";

interface BankAccount {
  id?: number;
  entityType: string;
  entityId: number;
  bankName: string;
  bankCode?: string | null;
  branch?: string | null;
  accountName?: string | null;
  accountNumber?: string | null;
  currency?: string | null;
  swiftCode?: string | null;
  iban?: string | null;
  bankAddress?: string | null;
  isDefault?: boolean | null;
  notes?: string | null;
}

interface BankAccountsModalProps {
  entityType: "customer" | "factory" | "company";
  entity: { id: number; name: string; officialName?: string | null } | null;
  entityLabel?: string;
  permissions: { canEdit: boolean; canDelete: boolean };
  onClose: () => void;
  onChanged?: () => void;
}

const COMMON_CURRENCIES = [
  "USD", "EUR", "CNY", "HKD", "JPY", "GBP", "CHF", "THB",
  "KRW", "AUD", "TWD", "CAD", "SGD", "INR", "IDR", "VND", "MYR"
];

function getUserId(): number | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("userId");
  return raw ? Number(raw) : null;
}

export default function BankAccountsModal({
  entityType, entity, entityLabel, permissions, onClose, onChanged,
}: BankAccountsModalProps) {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [copyStatus, setCopyStatus] = useState<Record<string, boolean>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [bankName, setBankName] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [branch, setBranch] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [currencies, setCurrencies] = useState<string[]>(["USD"]);
  const [swiftCode, setSwiftCode] = useState("");
  const [iban, setIban] = useState("");
  const [bankAddress, setBankAddress] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [notes, setNotes] = useState("");

  useEffect(() => { if (entity) fetchAccounts(); }, [entity]);

  const fetchAccounts = async () => {
    if (!entity) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/bank-accounts?entityType=${entityType}&entityId=${entity.id}`);
      if (res.ok) setAccounts(await res.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopyStatus((p) => ({ ...p, [key]: true }));
    setTimeout(() => setCopyStatus((p) => ({ ...p, [key]: false })), 1500);
  };

  const resetForm = () => {
    setBankName(""); setBankCode(""); setBranch("");
    setAccountName(entity?.officialName || entity?.name || "");
    setAccountNumber(""); setCurrencies(["USD"]);
    setSwiftCode(""); setIban(""); setBankAddress("");
    setIsDefault(accounts.length === 0); setNotes("");
    setSaveError(null);
  };

  const openAddForm = () => { setEditingAccount(null); resetForm(); setIsFormOpen(true); };

  const openEditForm = (acc: BankAccount) => {
    setEditingAccount(acc);
    setBankName(acc.bankName || "");
    setBankCode(acc.bankCode || "");
    setBranch(acc.branch || "");
    setAccountName(acc.accountName || "");
    setAccountNumber(acc.accountNumber || "");
    setCurrencies(acc.currency ? acc.currency.split(",").map(c => c.trim()).filter(Boolean) : ["USD"]);
    setSwiftCode(acc.swiftCode || "");
    setIban(acc.iban || "");
    setBankAddress(acc.bankAddress || "");
    setIsDefault(!!acc.isDefault);
    setNotes(acc.notes || "");
    setSaveError(null);
    setIsFormOpen(true);
  };

  const toggleCurrency = (cur: string) => {
    setCurrencies((prev) =>
      prev.includes(cur) ? (prev.length === 1 ? prev : prev.filter(c => c !== cur)) : [...prev, cur]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entity || !bankName.trim()) return;
    setSaving(true); setSaveError(null);

    try {
      const res = await fetch("/api/bank-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingAccount?.id, entityType, entityId: entity.id,
          bankName: bankName.trim(), bankCode: bankCode.trim() || null,
          branch: branch.trim() || null, accountName: accountName.trim() || null,
          accountNumber: accountNumber.trim() || null, currency: currencies.join(","),
          swiftCode: swiftCode.trim() || null, iban: iban.trim() || null,
          bankAddress: bankAddress.trim() || null, isDefault,
          notes: notes.trim() || null, userId: getUserId(),
        }),
      });
      if (res.ok) {
        setIsFormOpen(false); await fetchAccounts(); if (onChanged) onChanged();
      } else {
        const err = await res.json().catch(() => ({}));
        setSaveError(err.error || `Failed to save (status ${res.status})`);
      }
    } catch (err: any) { setSaveError(err?.message || "Network error"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this bank account?")) return;
    const res = await fetch(`/api/bank-accounts?id=${id}`, { method: "DELETE" });
    if (res.ok) { fetchAccounts(); if (onChanged) onChanged(); }
  };

  if (!entity) return null;

  const grouped = accounts.reduce<Record<string, BankAccount[]>>((g, a) => {
    const b = a.bankName || "Unknown"; if (!g[b]) g[b] = []; g[b].push(a); return g;
  }, {});

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600"><Landmark className="h-5 w-5" /></div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Bank Accounts</h3>
              <p className="text-xs text-slate-500">
                {entityLabel || "Entity"}: <span className="font-semibold text-slate-700">{entity.name}</span>
                {entity.officialName && ` (${entity.officialName})`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {isFormOpen ? (
            <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
              <h4 className="text-sm font-semibold text-slate-700">
                {editingAccount ? "✏️ Edit Bank Account" : "➕ Add New Bank Account"}
              </h4>
              {saveError && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">⚠️ {saveError}</div>}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-600">Bank Name *</label>
                  <input type="text" required value={bankName} onChange={e => setBankName(e.target.value)}
                    placeholder="e.g. HSBC, Bank of China" className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600">Bank Code</label>
                  <input type="text" value={bankCode} onChange={e => setBankCode(e.target.value)}
                    placeholder="e.g. 004 (HSBC HK)" className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600">Branch Code / Name</label>
                  <input type="text" value={branch} onChange={e => setBranch(e.target.value)}
                    placeholder="e.g. 809 or Central" className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">
                    Currencies * <span className="text-slate-400 font-normal">(click to select multiple)</span>
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {COMMON_CURRENCIES.map(cur => (
                      <button key={cur} type="button" onClick={() => toggleCurrency(cur)}
                        className={`rounded-md border px-2.5 py-1 text-xs font-semibold transition ${
                          currencies.includes(cur) ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-600 border-slate-200 hover:border-emerald-300"
                        }`}>{cur}</button>
                    ))}
                  </div>
                  {currencies.length > 1 && (
                    <p className="mt-1.5 text-[11px] text-emerald-700">💡 Multi-currency: {currencies.join(", ")}</p>
                  )}
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-600">Beneficiary Name</label>
                  <input type="text" value={accountName} onChange={e => setAccountName(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-600">Account Number *</label>
                  <input type="text" value={accountNumber} onChange={e => setAccountNumber(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600">SWIFT / BIC</label>
                  <input type="text" value={swiftCode} onChange={e => setSwiftCode(e.target.value.toUpperCase())}
                    placeholder="e.g. HSBCHKHHHKH" className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600">IBAN</label>
                  <input type="text" value={iban} onChange={e => setIban(e.target.value.toUpperCase())}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-600">Bank Address</label>
                  <textarea rows={2} value={bankAddress} onChange={e => setBankAddress(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-600">Notes</label>
                  <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
                    placeholder="Intermediary bank, routing info etc." className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div className="col-span-2 flex items-center gap-2 pt-1">
                  <input type="checkbox" id="isDefault" checked={isDefault} onChange={e => setIsDefault(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                  <label htmlFor="isDefault" className="text-xs font-medium text-slate-700 cursor-pointer">Set as primary/default account</label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsFormOpen(false)} disabled={saving}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={saving}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
                  {saving ? "Saving..." : "Save Account"}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              {loading ? (
                <div className="py-8 text-center text-sm text-slate-400">Loading...</div>
              ) : Object.keys(grouped).length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 py-12 text-center">
                  <Landmark className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="mt-2 text-sm font-medium text-slate-500">No bank accounts yet</p>
                  {permissions.canEdit && (
                    <button onClick={openAddForm} className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100">
                      <Plus className="h-3.5 w-3.5" /> Add Bank Account
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(grouped).map(([bName, accs]) => (
                    <div key={bName} className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                      <div className="flex items-center gap-2 border-b border-slate-100 pb-2 mb-3">
                        <Building className="h-4 w-4 text-slate-400" />
                        <h4 className="font-bold text-slate-800 text-sm">{bName}</h4>
                        {accs[0]?.bankCode && <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-slate-700">Code: {accs[0].bankCode}</span>}
                      </div>
                      <div className="space-y-3">
                        {accs.map(acc => {
                          const curList = (acc.currency || "").split(",").map(c => c.trim()).filter(Boolean);
                          return (
                            <div key={acc.id} className={`relative rounded-lg border bg-white p-3 shadow-sm ${acc.isDefault ? "border-amber-300 ring-1 ring-amber-100" : "border-slate-200"}`}>
                              <div className="flex items-start justify-between">
                                <div className="space-y-1 pr-16 flex-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    {curList.map(c => <span key={c} className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-extrabold text-emerald-800">{c}</span>)}
                                    {curList.length > 1 && <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200">MULTI-CCY</span>}
                                    {acc.isDefault && <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200"><Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" /> PRIMARY</span>}
                                    {acc.branch && <span className="text-[11px] text-slate-400">Branch: {acc.branch}</span>}
                                  </div>
                                  <div className="text-xs text-slate-500">A/C: <span className="text-slate-700 font-semibold">{acc.accountName || "N/A"}</span></div>
                                  <div className="flex items-center gap-1.5 text-sm font-mono font-bold text-slate-800">
                                    {acc.accountNumber}
                                    <button onClick={() => handleCopy(acc.accountNumber || "", `n-${acc.id}`)} className="text-slate-400 hover:text-slate-600 p-0.5">
                                      {copyStatus[`n-${acc.id}`] ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                                    </button>
                                  </div>
                                  <div className="flex flex-wrap gap-x-4 text-xs text-slate-500 font-mono">
                                    {acc.swiftCode && <span>SWIFT: <span className="text-slate-700 font-semibold">{acc.swiftCode}</span></span>}
                                    {acc.iban && <span>IBAN: <span className="text-slate-700 font-semibold">{acc.iban}</span></span>}
                                  </div>
                                  {acc.notes && <div className="text-[11px] text-slate-500 italic bg-slate-50 px-2 py-1 rounded mt-1">Note: {acc.notes}</div>}
                                </div>
                                {permissions.canEdit && (
                                  <div className="absolute right-3 top-3 flex items-center gap-1">
                                    <button onClick={() => openEditForm(acc)} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"><Pencil className="h-3.5 w-3.5" /></button>
                                    {permissions.canDelete && <button onClick={() => handleDelete(acc.id!)} className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {!isFormOpen && permissions.canEdit && (
          <div className="flex justify-between border-t bg-slate-50 px-6 py-4">
            <p className="text-xs text-slate-400">💡 One account can accept multiple currencies.</p>
            <button onClick={openAddForm} className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700">
              <Plus className="h-4 w-4" /> Add Bank Account
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
