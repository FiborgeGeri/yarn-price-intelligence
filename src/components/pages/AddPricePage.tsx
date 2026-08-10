"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { Permissions } from "@/lib/permissions";

interface Yarn {
  id: number;
  yarnName: string;
  factoryId: number;
  yarnCount: string;
  micron: string;
  factoryName: string;
  relationship: string;
  treatmentName: string;
}

interface Toast {
  type: "success" | "error";
  text: string;
}

interface Props {
  permissions: Permissions;
  onNavigate: (page: string) => void;
}

function yarnDisplayText(y: Yarn) {
  return `${y.factoryName} | ${y.yarnName} | ${y.yarnCount || "—"} | ${y.micron ? y.micron + "μm" : "—"} | ${y.treatmentName || "Untreated"}`;
}

function normalizeRecordDate(input: string | undefined | null): string | null {
  if (!input) return null;
  const value = input.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const slash = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (slash) {
    const [, dd, mm, yyyy] = slash;
    return `${yyyy}-${mm}-${dd}`;
  }
  const dash = value.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (dash) {
    const [, dd, mm, yyyy] = dash;
    return `${yyyy}-${mm}-${dd}`;
  }
  return null;
}

function FilterInput({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
}) {
  const [focused, setFocused] = useState(false);
  const show = focused && options.length > 0 && options.length <= 20;

  return (
    <div className="relative">
      <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder={placeholder}
      />
      {value && (
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); onChange(""); }}
          className="absolute right-2 top-[26px] text-slate-400 hover:text-slate-600 text-xs"
        >
          ✕
        </button>
      )}
      {show && (
        <div className="absolute z-30 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
          {options.map((o) => (
            <button
              key={o}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); onChange(o); setFocused(false); }}
              className="w-full text-left px-3 py-1.5 text-sm hover:bg-slate-50 border-b border-slate-50 last:border-0"
            >
              {o}
            </button>
          ))}
        </div>
      )}
      {!show && focused && value && options.length === 0 && (
        <div className="absolute z-30 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2 text-xs text-slate-400">
          No matches
        </div>
      )}
    </div>
  );
}

function AddPriceYarnPicker({
  yarns,
  value,
  onChange,
}: {
  yarns: Yarn[];
  value: number | null;
  onChange: (id: number | null) => void;
}) {
  const [factoryQ, setFactoryQ] = useState("");
  const [nameQ, setNameQ] = useState("");
  const [countQ, setCountQ] = useState("");

  const selected = yarns.find((y) => y.id === value) || null;

  useEffect(() => {
    if (selected) {
      setFactoryQ(selected.factoryName || "");
      setNameQ(selected.yarnName || "");
      setCountQ(selected.yarnCount || "");
    }
  }, [selected]);

  const applyOther = useCallback((exclude: "factory" | "name" | "count") => {
    let r = yarns;
    if (exclude !== "factory" && factoryQ) r = r.filter((y) => y.factoryName.toLowerCase().includes(factoryQ.toLowerCase()));
    if (exclude !== "name" && nameQ) r = r.filter((y) => y.yarnName.toLowerCase().includes(nameQ.toLowerCase()));
    if (exclude !== "count" && countQ) r = r.filter((y) => (y.yarnCount || "").toLowerCase().includes(countQ.toLowerCase()));
    return r;
  }, [yarns, factoryQ, nameQ, countQ]);

  const factoryOptions = useMemo(() => {
    const pool = applyOther("factory");
    const vals = [...new Set(pool.map((y) => y.factoryName))].sort();
    return factoryQ ? vals.filter((v) => v.toLowerCase().includes(factoryQ.toLowerCase())) : vals;
  }, [applyOther, factoryQ]);

  const nameOptions = useMemo(() => {
    const pool = applyOther("name");
    const vals = [...new Set(pool.map((y) => y.yarnName))].sort();
    return nameQ ? vals.filter((v) => v.toLowerCase().includes(nameQ.toLowerCase())) : vals;
  }, [applyOther, nameQ]);

  const countOptions = useMemo(() => {
    const pool = applyOther("count");
    const vals = [...new Set(pool.map((y) => y.yarnCount).filter(Boolean))].sort();
    return countQ ? vals.filter((v) => v.toLowerCase().includes(countQ.toLowerCase())) : vals;
  }, [applyOther, countQ]);

  const matched = useMemo(() => {
    let r = yarns;
    if (factoryQ) r = r.filter((y) => y.factoryName.toLowerCase().includes(factoryQ.toLowerCase()));
    if (nameQ) r = r.filter((y) => y.yarnName.toLowerCase().includes(nameQ.toLowerCase()));
    if (countQ) r = r.filter((y) => (y.yarnCount || "").toLowerCase().includes(countQ.toLowerCase()));
    return r;
  }, [yarns, factoryQ, nameQ, countQ]);

  const hasInput = factoryQ || nameQ || countQ;

  return (
    <div className="space-y-3">
      {selected ? (
        <div className="text-sm text-blue-700 bg-blue-50 px-3 py-2 rounded-lg flex items-center justify-between">
          <span className="truncate mr-3">{yarnDisplayText(selected)}</span>
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setFactoryQ("");
              setNameQ("");
              setCountQ("");
            }}
            className="text-blue-500 hover:text-blue-700 text-xs shrink-0"
          >
            ✕
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FilterInput label="Factory" value={factoryQ} onChange={(v) => { setFactoryQ(v); onChange(null); }} options={factoryOptions} placeholder="Type factory..." />
            <FilterInput label="Yarn" value={nameQ} onChange={(v) => { setNameQ(v); onChange(null); }} options={nameOptions} placeholder="Type yarn name..." />
            <FilterInput label="Yarn Count" value={countQ} onChange={(v) => { setCountQ(v); onChange(null); }} options={countOptions} placeholder="Type count..." />
          </div>

          {hasInput && matched.length > 0 && matched.length <= 20 && (
            <div className="bg-white border border-slate-200 rounded-lg max-h-52 overflow-y-auto">
              {matched.map((y) => (
                <button
                  key={y.id}
                  type="button"
                  onClick={() => onChange(y.id)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 border-b border-slate-50 last:border-0"
                >
                  <div className="font-medium">{y.yarnName}</div>
                  <div className="text-xs text-slate-500">{y.factoryName} · {y.yarnCount || "—"} · {y.micron ? y.micron + "μm" : "—"} · {y.treatmentName || "Untreated"}</div>
                </button>
              ))}
            </div>
          )}

          {hasInput && matched.length === 0 && (
            <div className="text-xs text-slate-400 px-1">No yarn matches</div>
          )}

          {hasInput && matched.length > 20 && (
            <div className="text-xs text-slate-400 px-1">{matched.length} matches — type more to narrow down</div>
          )}
        </>
      )}
    </div>
  );
}

export default function AddPricePage({ permissions, onNavigate }: Props) {
  const [yarns, setYarns] = useState<Yarn[]>([]);
  const [yarnId, setYarnId] = useState<number | null>(null);
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [unit, setUnit] = useState("per KG");
  const [recordDate, setRecordDate] = useState(new Date().toISOString().split("T")[0]);
  const [incoterms, setIncoterms] = useState("");
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkResult, setBulkResult] = useState<{ count: number } | null>(null);
  const [singleSuccess, setSingleSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/yarns").then((r) => r.json()).then(setYarns);
  }, []);

  const selectedYarn = yarns.find((y) => y.id === yarnId) || null;

  if (!permissions.canEdit) {
    return (
      <div className="max-w-3xl">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
          <svg className="w-8 h-8 text-yellow-500 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
          <h2 className="text-lg font-semibold text-yellow-800">Access Restricted</h2>
          <p className="text-sm text-yellow-700 mt-1">You don&apos;t have permission to add prices. Contact an admin to request editor access.</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!yarnId || !price || !recordDate) {
      setToast({ type: "error", text: "Please fill required fields" });
      return;
    }
    setSaving(true);
    setSingleSuccess(false);
    try {
      const res = await fetch("/api/prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ yarnId, price, currency, unit, recordDate, incoterms, remarks }),
      });
      if (res.ok) {
        setSingleSuccess(true);
        setToast({ type: "success", text: "Price saved successfully!" });
        setPrice("");
        setRemarks("");
      } else {
        const d = await res.json();
        setToast({ type: "error", text: d.error || "Failed to save" });
      }
    } catch {
      setToast({ type: "error", text: "Connection error" });
    }
    setSaving(false);
  };

  const handleBulkSubmit = async () => {
    if (!bulkText.trim()) return;
    setBulkResult(null);
    const lines = bulkText.trim().split("\n").filter((l) => l.trim());
    const rows: Array<{ yarnId: number; price: string; currency: string; unit: string; recordDate: string; incoterms: string; remarks: string; }> = [];

    for (const line of lines) {
      const cols = line.split("\t");
      if (cols.length < 6) continue;
      const [yarnName, csvFactory, csvYarnCount, csvMicron, csvTreatment, priceStr, curr, unitStr, dateStr, inc, rem] = cols;

      let matched: Yarn | null = null;
      let bestScore = 0;
      const searchName = yarnName?.trim().toLowerCase() || "";
      const searchFactory = csvFactory?.trim().toLowerCase() || "";
      const searchCount = csvYarnCount?.trim().toLowerCase() || "";
      const searchMicron = csvMicron?.trim() || "";
      const searchTreatment = csvTreatment?.trim().toLowerCase() || "";

      for (const y of yarns) {
        let score = 0;
        const yn = y.yarnName.toLowerCase();
        if (yn === searchName) score += 10;
        else if (yn.includes(searchName) || searchName.includes(yn)) score += 5;
        else continue;
        if (searchFactory && y.factoryName?.toLowerCase().includes(searchFactory)) score += 3;
        if (searchCount && y.yarnCount?.toLowerCase() === searchCount) score += 4;
        if (searchMicron && y.micron === searchMicron) score += 4;
        if (searchTreatment) {
          const yt = (y.treatmentName || "untreated").toLowerCase();
          if (yt === searchTreatment) score += 5;
          else if (yt.includes(searchTreatment) || searchTreatment.includes(yt)) score += 2;
        }
        if (score > bestScore) { bestScore = score; matched = y; }
      }

      const normalizedDate = normalizeRecordDate(dateStr?.trim() || new Date().toISOString().split("T")[0]);
      if (matched && priceStr && normalizedDate) {
        rows.push({ yarnId: matched.id, price: priceStr.trim(), currency: curr?.trim() || "USD", unit: unitStr?.trim() || "per KG", recordDate: normalizedDate, incoterms: inc?.trim() || "", remarks: rem?.trim() || "" });
      }
    }

    if (rows.length === 0) {
      setToast({ type: "error", text: "No valid rows found" });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/prices/bulk", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rows }) });
      if (res.ok) {
        const d = await res.json();
        setBulkResult({ count: d.inserted });
        setBulkText("");
        setToast(null);
      } else {
        setToast({ type: "error", text: "Bulk import failed" });
      }
    } catch {
      setToast({ type: "error", text: "Connection error" });
    }
    setSaving(false);
  };

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Add Price</h1>
          <p className="text-sm text-slate-500">Record a new yarn price entry</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setBulkMode(false); setBulkResult(null); setSingleSuccess(false); setToast(null); }} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${!bulkMode ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-700"}`}>Single</button>
          <button onClick={() => { setBulkMode(true); setBulkResult(null); setSingleSuccess(false); setToast(null); }} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${bulkMode ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-700"}`}>Bulk Import</button>
        </div>
      </div>

      {toast && toast.type === "error" && <div className="mb-4 p-3 rounded-lg text-sm bg-red-50 text-red-700 border border-red-200">{toast.text}</div>}

      {bulkMode ? (
        <>
          {bulkResult && (
            <div className="mb-4 p-4 rounded-xl bg-green-50 border border-green-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0"><svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polyline points="20 6 9 17 4 12" /></svg></div>
                <div className="flex-1"><div className="text-sm font-semibold text-green-800">{bulkResult.count} price(s) imported successfully</div><p className="text-xs text-green-700 mt-0.5">All price records have been saved to the database.</p></div>
              </div>
              <div className="flex gap-2 mt-3 ml-[52px]">
                <button onClick={() => onNavigate("price-history")} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">View Price History</button>
                <button onClick={() => onNavigate("search")} className="px-3 py-1.5 bg-white text-green-700 border border-green-300 rounded-lg text-sm font-medium hover:bg-green-50 transition-colors">Search Yarn</button>
                <button onClick={() => setBulkResult(null)} className="px-3 py-1.5 text-green-700 text-sm font-medium hover:underline">Add More</button>
              </div>
            </div>
          )}

          {!bulkResult && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <h2 className="text-lg font-semibold mb-3">Bulk Price Import</h2>
              <p className="text-sm text-slate-500 mb-3">Paste tab-separated data. Columns: <strong>Yarn Name, Factory, Yarn Count, Micron, Treatment, Price, Currency, Unit, Date, Incoterms, Remarks</strong></p>
              <p className="text-xs text-slate-400 mb-3">Treatment is used to match the correct yarn variant. Accepted date formats: <strong>yyyy-mm-dd</strong> or <strong>dd/mm/yyyy</strong>. All imported dates are saved as <strong>yyyy-mm-dd</strong>.</p>
              <textarea value={bulkText} onChange={(e) => setBulkText(e.target.value)} className="w-full h-48 px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder={"Yarn Name\tFactory\tYarn Count\tMicron\tTreatment\tPrice\tCurrency\tUnit\tRecord Date\tIncoterms\tRemarks\nSIMPHONIE\tIndorama\tNM 30/2\t19.5\tUntreated\t27.85\tUSD\tper KG\t2026-07-20\tCIF Shanghai\tNote here\nCAIRNS\tIndorama\tNM 48/2\t19.5\tAnti-Shrinkage\t30.50\tUSD\tper KG\t24/07/2025\tCIF Shanghai\t"} />
              <div className="flex gap-3 mt-4"><button onClick={handleBulkSubmit} disabled={saving || !bulkText.trim()} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">{saving ? "Importing..." : "Import Prices"}</button><a href="/api/export/price-template" className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300 transition-colors">Download Template</a></div>
            </div>
          )}
        </>
      ) : (
        <>
          {singleSuccess && toast?.type === "success" && (
            <div className="mb-4 p-4 rounded-xl bg-green-50 border border-green-200"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0"><svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polyline points="20 6 9 17 4 12" /></svg></div><div className="flex-1"><div className="text-sm font-semibold text-green-800">{toast.text}</div><p className="text-xs text-green-700 mt-0.5">The price has been recorded. You can add another or view it.</p></div></div><div className="flex gap-2 mt-3 ml-[52px]"><button onClick={() => onNavigate("price-history")} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">View Price History</button><button onClick={() => onNavigate("search")} className="px-3 py-1.5 bg-white text-green-700 border border-green-300 rounded-lg text-sm font-medium hover:bg-green-50 transition-colors">Search Yarn</button><button onClick={() => { setSingleSuccess(false); setToast(null); }} className="px-3 py-1.5 text-green-700 text-sm font-medium hover:underline">Add Another</button></div></div>
          )}

          <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Yarn *</label>
              <AddPriceYarnPicker yarns={yarns} value={yarnId} onChange={setYarnId} />
              {selectedYarn && <p className="text-xs text-slate-500 mt-2">Selected: {yarnDisplayText(selectedYarn)}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Price *</label><input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="27.85" required /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Currency</label><select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"><option>USD</option><option>EUR</option><option>GBP</option><option>CNY</option><option>JPY</option></select></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Unit</label><select value={unit} onChange={(e) => setUnit(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"><option>per KG</option><option>per LB</option><option>per Cone</option></select></div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Record Date *</label><input type="date" value={recordDate} onChange={(e) => setRecordDate(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Incoterms</label><input type="text" value={incoterms} onChange={(e) => setIncoterms(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="CIF Shanghai" /></div>
            </div>

            <div><label className="block text-sm font-medium text-slate-700 mb-1">Remarks</label><input type="text" value={remarks} onChange={(e) => setRemarks(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Optional notes" /></div>

            <button type="submit" disabled={saving || !yarnId || !price} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">{saving ? "Saving..." : "Save Price"}</button>
          </form>
        </>
      )}
    </div>
  );
}
