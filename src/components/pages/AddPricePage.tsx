"use client";
import { useState, useEffect, useRef, useMemo } from "react";
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
  return `${y.yarnName} | ${y.factoryName} | ${y.yarnCount || "—"} | ${y.micron ? y.micron + "μm" : "—"} | ${y.treatmentName || "Untreated"}`;
}

export default function AddPricePage({ permissions, onNavigate }: Props) {
  const [yarns, setYarns] = useState<Yarn[]>([]);
  const [yarnId, setYarnId] = useState<number | null>(null);
  const [yarnSearch, setYarnSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
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
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/yarns").then((r) => r.json()).then(setYarns);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
          inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filteredYarns = useMemo(() => {
    if (!yarnSearch.trim()) return yarns.slice(0, 30);
    const q = yarnSearch.toLowerCase();
    return yarns.filter((y) =>
      y.yarnName?.toLowerCase().includes(q) ||
      y.factoryName?.toLowerCase().includes(q) ||
      y.yarnCount?.toLowerCase().includes(q) ||
      y.treatmentName?.toLowerCase().includes(q) ||
      y.micron?.includes(q)
    ).slice(0, 30);
  }, [yarns, yarnSearch]);

  const selectedYarn = yarns.find((y) => y.id === yarnId);

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
    const rows: Array<{
      yarnId: number; price: string; currency: string; unit: string;
      recordDate: string; incoterms: string; remarks: string;
    }> = [];

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

      if (matched && priceStr) {
        rows.push({
          yarnId: matched.id,
          price: priceStr.trim(),
          currency: curr?.trim() || "USD",
          unit: unitStr?.trim() || "per KG",
          recordDate: dateStr?.trim() || new Date().toISOString().split("T")[0],
          incoterms: inc?.trim() || "",
          remarks: rem?.trim() || "",
        });
      }
    }

    if (rows.length === 0) {
      setToast({ type: "error", text: "No valid rows found" });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/prices/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });
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
          <button
            onClick={() => { setBulkMode(false); setBulkResult(null); setSingleSuccess(false); setToast(null); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${!bulkMode ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-700"}`}
          >
            Single
          </button>
          <button
            onClick={() => { setBulkMode(true); setBulkResult(null); setSingleSuccess(false); setToast(null); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${bulkMode ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-700"}`}
          >
            Bulk Import
          </button>
        </div>
      </div>

      {/* Error toast */}
      {toast && toast.type === "error" && (
        <div className="mb-4 p-3 rounded-lg text-sm bg-red-50 text-red-700 border border-red-200">{toast.text}</div>
      )}

      {bulkMode ? (
        <>
          {/* Bulk success banner */}
          {bulkResult && (
            <div className="mb-4 p-4 rounded-xl bg-green-50 border border-green-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polyline points="20 6 9 17 4 12" /></svg>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-green-800">{bulkResult.count} price(s) imported successfully</div>
                  <p className="text-xs text-green-700 mt-0.5">All price records have been saved to the database.</p>
                </div>
              </div>
              <div className="flex gap-2 mt-3 ml-[52px]">
                <button onClick={() => onNavigate("price-history")} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
                  View Price History
                </button>
                <button onClick={() => onNavigate("search")} className="px-3 py-1.5 bg-white text-green-700 border border-green-300 rounded-lg text-sm font-medium hover:bg-green-50 transition-colors">
                  Search Yarn
                </button>
                <button onClick={() => setBulkResult(null)} className="px-3 py-1.5 text-green-700 text-sm font-medium hover:underline">
                  Add More
                </button>
              </div>
            </div>
          )}

          {!bulkResult && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <h2 className="text-lg font-semibold mb-3">Bulk Price Import</h2>
              <p className="text-sm text-slate-500 mb-3">
                Paste tab-separated data. Columns: <strong>Yarn Name, Factory, Yarn Count, Micron, Treatment, Price, Currency, Unit, Date, Incoterms, Remarks</strong>
              </p>
              <p className="text-xs text-slate-400 mb-3">
                Treatment is used to match the correct yarn variant. If two yarns have the same name/count/micron but different treatments, the Treatment column determines which one gets the price.
              </p>
              <textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                className="w-full h-48 px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={"Yarn Name\tFactory\tYarn Count\tMicron\tTreatment\tPrice\tCurrency\tUnit\tRecord Date\tIncoterms\tRemarks\nSIMPHONIE\tIndorama\tNM 30/2\t19.5\tUntreated\t27.85\tUSD\tper KG\t2026-07-20\tCIF Shanghai\tNote here\nCAIRNS\tIndorama\tNM 48/2\t19.5\tAnti-Shrinkage\t30.50\tUSD\tper KG\t2026-07-20\tCIF Shanghai\t"}
              />
              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleBulkSubmit}
                  disabled={saving || !bulkText.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {saving ? "Importing..." : "Import Prices"}
                </button>
                <a
                  href="/api/export/price-template"
                  className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300 transition-colors"
                >
                  Download Template
                </a>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Single success banner */}
          {singleSuccess && toast?.type === "success" && (
            <div className="mb-4 p-4 rounded-xl bg-green-50 border border-green-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polyline points="20 6 9 17 4 12" /></svg>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-green-800">{toast.text}</div>
                  <p className="text-xs text-green-700 mt-0.5">The price has been recorded. You can add another or view it.</p>
                </div>
              </div>
              <div className="flex gap-2 mt-3 ml-[52px]">
                <button onClick={() => onNavigate("price-history")} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
                  View Price History
                </button>
                <button onClick={() => onNavigate("search")} className="px-3 py-1.5 bg-white text-green-700 border border-green-300 rounded-lg text-sm font-medium hover:bg-green-50 transition-colors">
                  Search Yarn
                </button>
                <button onClick={() => { setSingleSuccess(false); setToast(null); }} className="px-3 py-1.5 text-green-700 text-sm font-medium hover:underline">
                  Add Another
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 space-y-4">
            {/* Yarn selector */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Yarn *</label>
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={yarnSearch}
                  onChange={(e) => { setYarnSearch(e.target.value); setShowDropdown(true); }}
                  onFocus={() => setShowDropdown(true)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Search yarn name, factory, count, treatment..."
                />
                {selectedYarn && !showDropdown && (
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-sm truncate right-3">
                    {yarnDisplayText(selectedYarn)}
                  </div>
                )}
                {showDropdown && (
                  <div ref={dropdownRef} className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredYarns.length === 0 ? (
                      <div className="px-3 py-4 text-sm text-slate-400 text-center">No yarns found</div>
                    ) : (
                      filteredYarns.map((y) => (
                        <button
                          key={y.id}
                          type="button"
                          onClick={() => {
                            setYarnId(y.id);
                            setYarnSearch(yarnDisplayText(y));
                            setShowDropdown(false);
                          }}
                          className="w-full px-3 py-2 text-left hover:bg-slate-50 text-sm flex items-center gap-2 border-b border-slate-50 last:border-0"
                        >
                          <span className={`w-2 h-2 rounded-full shrink-0 ${y.relationship === "My Factory" ? "bg-blue-500" : "bg-red-500"}`} />
                          <div className="min-w-0">
                            <div className="font-medium">{y.yarnName}</div>
                            <div className="text-xs text-slate-500">
                              {y.factoryName} · {y.yarnCount || "—"} · {y.micron ? y.micron + "μm" : "—"} · {y.treatmentName || "Untreated"}
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Price *</label>
                <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="27.85" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Currency</label>
                <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>USD</option><option>EUR</option><option>GBP</option><option>CNY</option><option>JPY</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Unit</label>
                <select value={unit} onChange={(e) => setUnit(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>per KG</option><option>per LB</option><option>per Cone</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Record Date *</label>
                <input type="date" value={recordDate} onChange={(e) => setRecordDate(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Incoterms</label>
                <input type="text" value={incoterms} onChange={(e) => setIncoterms(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="CIF Shanghai" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Remarks</label>
              <input type="text" value={remarks} onChange={(e) => setRemarks(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Optional notes" />
            </div>

            <button type="submit" disabled={saving || !yarnId || !price} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {saving ? "Saving..." : "Save Price"}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
