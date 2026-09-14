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
  branch?: string | null;
  accountName?: string | null;
  accountNumber?: string | null;
  currency?: string | null;
  swiftCode?: string | null;
  iban?: string | null;
  bankAddress?: string | null;
  isDefault?: boolean | null;
  notes?: string | null;
  createdAt?: string;
  createdBy?: number | null;
  updatedAt?: string;
  updatedBy?: number | null;
}

interface BankAccountsModalProps {
  entityType: "customer" | "factory" | "company";
  entity: { id: number; name: string; officialName?: string | null } | null;
  entityLabel?: string; // 👈 加上這一行
  permissions: { canEdit: boolean; canDelete: boolean };
  onClose: () => void;
  onChanged?: () => void;
}

const COMMON_CURRENCIES = [
  "USD", "EUR", "CNY", "HKD", "JPY", "GBP", "CHF", "THB", "KRW", "AUD", "TWD", "CAD", "SGD"
];

export default function BankAccountsModal({
  entityType,
  entity,
  entityLabel, // 
  permissions,
  onClose,
  onChanged,
}: BankAccountsModalProps) {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [copyStatus, setCopyStatus] = useState<Record<string, boolean>>({});

  // Form states
  const [bankName, setBankName] = useState("");
  const [branch, setBranch] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [swiftCode, setSwiftCode] = useState("");
  const [iban, setIban] = useState("");
  const [bankAddress, setBankAddress] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (entity) {
      fetchAccounts();
    }
  }, [entity]);

  const fetchAccounts = async () => {
    if (!entity) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/bank-accounts?entityType=${entityType}&entityId=${entity.id}`);
      if (res.ok) {
        const data = await res.json();
        setAccounts(data);
      }
    } catch (err) {
      console.error("Failed to fetch bank accounts:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopyStatus((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setCopyStatus((prev) => ({ ...prev, [key]: false }));
    }, 1500);
  };

  const openAddForm = () => {
    setEditingAccount(null);
    setBankName("");
    setBranch("");
    setAccountName(entity?.name || "");
    setAccountNumber("");
    setCurrency("USD");
    setSwiftCode("");
    setIban("");
    setBankAddress("");
    setIsDefault(accounts.length === 0); // Default to true if first account
    setNotes("");
    setIsFormOpen(true);
  };

  const openEditForm = (acc: BankAccount) => {
    setEditingAccount(acc);
    setBankName(acc.bankName || "");
    setBranch(acc.branch || "");
    setAccountName(acc.accountName || "");
    setAccountNumber(acc.accountNumber || "");
    setCurrency(acc.currency || "USD");
    setSwiftCode(acc.swiftCode || "");
    setIban(acc.iban || "");
    setBankAddress(acc.bankAddress || "");
    setIsDefault(!!acc.isDefault);
    setNotes(acc.notes || "");
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entity || !bankName.trim()) return;

    const payload: BankAccount = {
      id: editingAccount?.id,
      entityType,
      entityId: entity.id,
      bankName,
      branch,
      accountName,
      accountNumber,
      currency,
      swiftCode,
      iban,
      bankAddress,
      isDefault,
      notes,
    };

    try {
      const res = await fetch("/api/bank-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsFormOpen(false);
        fetchAccounts();
        if (onChanged) onChanged();
      } else {
        alert("Failed to save bank account.");
      }
    } catch (err) {
      console.error(err);
      alert("Error occurred while saving.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this bank account?")) return;
    try {
      const res = await fetch(`/api/bank-accounts?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchAccounts();
        if (onChanged) onChanged();
      } else {
        alert("Failed to delete bank account.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!entity) return null;

  // Group accounts by bankName for cleaner interface
  const groupedAccounts = accounts.reduce<Record<string, BankAccount[]>>((groups, account) => {
    const bank = account.bankName || "Unknown Bank";
    if (!groups[bank]) groups[bank] = [];
    groups[bank].push(account);
    return groups;
  }, {});

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
              <Landmark className="h-5 w-5" />
            </div>
                        <div>
              <h3 className="text-lg font-bold text-slate-800">Bank Accounts</h3>
              <p className="text-xs text-slate-500">
                Manage accounts for {entityLabel || "this entity"}: <span className="font-semibold text-slate-700">{entity.name}</span>
                {entity.officialName && ` (${entity.officialName})`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {isFormOpen ? (
            /* Inline Form for Adding / Editing */
            <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
              <h4 className="text-sm font-semibold text-slate-700">
                {editingAccount ? "✏️ Edit Bank Account" : "➕ Add New Bank Account"}
              </h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-600">Bank Name *</label>
                  <input
                    type="text"
                    required
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g. HSBC, Citibank, Standard Chartered"
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600">Currency *</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {COMMON_CURRENCIES.map((cur) => (
                      <option key={cur} value={cur}>{cur}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600">Branch Name / Code</label>
                  <input
                    type="text"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    placeholder="e.g. Main Branch, Code 001"
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-600">Beneficiary Account Name</label>
                  <input
                    type="text"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="Account holder name"
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-600">Account Number *</label>
                  <input
                    type="text"
                    required
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="Account number"
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600">SWIFT Code</label>
                  <input
                    type="text"
                    value={swiftCode}
                    onChange={(e) => setSwiftCode(e.target.value)}
                    placeholder="SWIFT / BIC"
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600">IBAN</label>
                  <input
                    type="text"
                    value={iban}
                    onChange={(e) => setIban(e.target.value)}
                    placeholder="For international transfers"
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-600">Bank Address</label>
                  <textarea
                    rows={2}
                    value={bankAddress}
                    onChange={(e) => setBankAddress(e.target.value)}
                    placeholder="Full bank location address"
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-600">Private Memo / Notes</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Intermediary bank, routing details etc."
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="col-span-2 flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="isDefault"
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor="isDefault" className="text-xs font-medium text-slate-700 select-none cursor-pointer">
                    Set as default/primary bank account for this client
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                >
                  Save Account
                </button>
              </div>
            </form>
          ) : (
            /* Accounts List view */
            <div className="space-y-6">
              {loading ? (
                <div className="py-8 text-center text-sm text-slate-400">Loading bank accounts...</div>
              ) : Object.keys(groupedAccounts).length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 py-12 text-center">
                  <Landmark className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="mt-2 text-sm font-medium text-slate-500">No bank accounts registered</p>
                  {permissions.canEdit && (
                    <button
                      onClick={openAddForm}
                      className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add Bank Account
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(groupedAccounts).map(([bankName, accs]) => (
                    <div key={bankName} className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                      {/* Bank Header Section */}
                      <div className="flex items-center gap-2 border-b border-slate-100 pb-2 mb-3">
                        <Building className="h-4 w-4 text-slate-400" />
                        <h4 className="font-bold text-slate-800 text-sm">{bankName}</h4>
                        <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                          {accs.length} account{accs.length !== 1 ? "s" : ""}
                        </span>
                      </div>

                      {/* Currency / Accounts under this bank */}
                      <div className="space-y-3">
                        {accs.map((acc) => (
                          <div 
                            key={acc.id} 
                            className={`relative rounded-lg border bg-white p-3 shadow-sm transition-all ${
                              acc.isDefault ? "border-amber-300 ring-1 ring-amber-100" : "border-slate-150"
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="space-y-1 pr-16">
                                <div className="flex items-center gap-2">
                                  <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-extrabold text-emerald-800">
                                    {acc.currency}
                                  </span>
                                  {acc.isDefault && (
                                    <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                                      <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" /> PRIMARY
                                    </span>
                                  )}
                                  {acc.branch && (
                                    <span className="text-[11px] text-slate-400">({acc.branch})</span>
                                  )}
                                </div>

                                <div className="text-xs text-slate-500 font-medium">
                                  A/C Name: <span className="text-slate-700 font-semibold">{acc.accountName || "N/A"}</span>
                                </div>

                                <div className="flex items-center gap-1.5 text-sm font-mono font-bold text-slate-800">
                                  <span>{acc.accountNumber}</span>
                                  <button
                                    onClick={() => handleCopy(acc.accountNumber || "", `num-${acc.id}`)}
                                    className="text-slate-400 hover:text-slate-600 p-0.5"
                                    title="Copy Account Number"
                                  >
                                    {copyStatus[`num-${acc.id}`] ? (
                                      <Check className="h-3.5 w-3.5 text-green-500" />
                                    ) : (
                                      <Copy className="h-3.5 w-3.5" />
                                    )}
                                  </button>
                                </div>

                                {/* SWIFT & IBAN details */}
                                <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-slate-500 pt-1 font-mono">
                                  {acc.swiftCode && (
                                    <div className="flex items-center gap-1">
                                      <span className="text-slate-400 font-sans">SWIFT:</span>
                                      <span className="text-slate-700 font-semibold">{acc.swiftCode}</span>
                                      <button 
                                        type="button" 
                                        onClick={() => handleCopy(acc.swiftCode || "", `swift-${acc.id}`)}
                                        className="text-slate-300 hover:text-slate-500"
                                      >
                                        {copyStatus[`swift-${acc.id}`] ? <Check className="h-2.5 w-2.5 text-green-500" /> : <Copy className="h-2.5 w-2.5" />}
                                      </button>
                                    </div>
                                  )}
                                  {acc.iban && (
                                    <div className="flex items-center gap-1">
                                      <span className="text-slate-400 font-sans">IBAN:</span>
                                      <span className="text-slate-700 font-semibold">{acc.iban}</span>
                                    </div>
                                  )}
                                </div>

                                {acc.bankAddress && (
                                  <div className="text-[11px] text-slate-400 font-sans pt-1">
                                    <span className="font-medium text-slate-500">Bank Addr:</span> {acc.bankAddress}
                                  </div>
                                )}
                                {acc.notes && (
                                  <div className="text-[11px] text-slate-500 font-sans italic bg-slate-50 px-2 py-1 rounded mt-1">
                                    Note: {acc.notes}
                                  </div>
                                )}
                              </div>

                              {/* Actions menu */}
                              {permissions.canEdit && (
                                <div className="absolute right-3 top-3 flex items-center gap-1">
                                  <button
                                    onClick={() => openEditForm(acc)}
                                    className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                                    title="Edit"
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </button>
                                  {permissions.canDelete && (
                                    <button
                                      onClick={() => handleDelete(acc.id!)}
                                      className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                                      title="Delete"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!isFormOpen && permissions.canEdit && (
          <div className="flex justify-between border-t bg-slate-50 px-6 py-4">
            <p className="text-xs text-slate-400 flex items-center">
              * Multiple currencies per bank is supported.
            </p>
            <button
              onClick={openAddForm}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4" /> Add Bank Account
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
