"use client";
import { useState, useEffect, useMemo } from "react";
import { IconSearch } from "@/components/Icons";

interface Yarn {
  id: number; yarnName: string; factoryId: number; yarnCount: string;
  micron: string; treatmentId: number; origin: string; composition: string;
  notes: string; factoryName: string; relationship: string;
  treatmentName: string; certIds: number[];
  latestPrice: number | null; latestCurrency: string | null;
  latestUnit: string | null; latestPriceDate: string | null;
}

interface PriceRecord {
  id: number; yarnId: number; price: number; currency: string; unit: string;
  recordDate: string; incoterms: string; remarks: string;
  yarnName: string; yarnCount: string; micron: string;
  factoryName: string; relationship: string;
}

interface Certificate { id: number; certCode: string; certFullName: string; }

export default function SearchPage() {
  const [yarns, setYarns] = useState<Yarn[]>([]);
  const [allCerts, setAllCerts] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  const [nameFilter, setNameFilter] = useState("");
  const [countFilter, setCountFilter] = useState("");
  const [micronFilter, setMicronFilter] = useState("");
  const [treatmentFilter, setTreatmentFilter] = useState("");

  const [selectedYarn, setSelectedYarn] = useState<Yarn | null>(null);
  const [priceHistory, setPriceHistory] = useState<PriceRecord[]>([]);
  const [priceLoading, setPriceLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/yarns").then((r) => r.json()),
      fetch("/api/certificates").then((r) => r.json()),
    ]).then(([y, c]) => { setYarns(y); setAllCerts(c); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // ── Cascading filter logic ──
  // Each dropdown's options come from yarns that pass the OTHER three filters.
  // This way picking any filter immediately narrows down all other dropdowns.

  const yarnsForNameOptions = useMemo(() => {
    let r = yarns;
    if (countFilter) r = r.filter((y) => y.yarnCount === countFilter);
    if (micronFilter) r = r.filter((y) => y.micron === micronFilter);
    if (treatmentFilter) r = r.filter((y) => y.treatmentName === treatmentFilter);
    return r;
  }, [yarns, countFilter, micronFilter, treatmentFilter]);

  const yarnsForCountOptions = useMemo(() => {
    let r = yarns;
    if (nameFilter) r = r.filter((y) => y.yarnName === nameFilter);
    if (micronFilter) r = r.filter((y) => y.micron === micronFilter);
    if (treatmentFilter) r = r.filter((y) => y.treatmentName === treatmentFilter);
    return r;
  }, [yarns, nameFilter, micronFilter, treatmentFilter]);

  const yarnsForMicronOptions = useMemo(() => {
    let r = yarns;
    if (nameFilter) r = r.filter((y) => y.yarnName === nameFilter);
    if (countFilter) r = r.filter((y) => y.yarnCount === countFilter);
    if (treatmentFilter) r = r.filter((y) => y.treatmentName === treatmentFilter);
    return r;
  }, [yarns, nameFilter, countFilter, treatmentFilter]);

  const yarnsForTreatmentOptions = useMemo(() => {
    let r = yarns;
    if (nameFilter) r = r.filter((y) => y.yarnName === nameFilter);
    if (countFilter) r = r.filter((y) => y.yarnCount === countFilter);
    if (micronFilter) r = r.filter((y) => y.micron === micronFilter);
    return r;
  }, [yarns, nameFilter, countFilter, micronFilter]);

  const nameOptions = useMemo(() => [...new Set(yarnsForNameOptions.map((y) => y.yarnName))].sort(), [yarnsForNameOptions]);
  const countOptions = useMemo(() => [...new Set(yarnsForCountOptions.map((y) => y.yarnCount).filter(Boolean))].sort(), [yarnsForCountOptions]);
  const micronOptions = useMemo(() => [...new Set(yarnsForMicronOptions.map((y) => y.micron).filter(Boolean))].sort((a, b) => parseFloat(a) - parseFloat(b)), [yarnsForMicronOptions]);
  const treatmentOptions = useMemo(() => [...new Set(yarnsForTreatmentOptions.map((y) => y.treatmentName).filter(Boolean))].sort(), [yarnsForTreatmentOptions]);

  // If a currently-selected filter value no longer exists in the available options, clear it
  useEffect(() => {
    if (nameFilter && !nameOptions.includes(nameFilter)) setNameFilter("");
  }, [nameFilter, nameOptions]);
  useEffect(() => {
    if (countFilter && !countOptions.includes(countFilter)) setCountFilter("");
  }, [countFilter, countOptions]);
  useEffect(() => {
    if (micronFilter && !micronOptions.includes(micronFilter)) setMicronFilter("");
  }, [micronFilter, micronOptions]);
  useEffect(() => {
    if (treatmentFilter && !treatmentOptions.includes(treatmentFilter)) setTreatmentFilter("");
  }, [treatmentFilter, treatmentOptions]);

  // ── The result list uses ALL four filters ──
  const filtered = useMemo(() => {
    let result = yarns;
    if (nameFilter) result = result.filter((y) => y.yarnName === nameFilter);
    if (countFilter) result = result.filter((y) => y.yarnCount === countFilter);
    if (micronFilter) result = result.filter((y) => y.micron === micronFilter);
    if (treatmentFilter) result = result.filter((y) => y.treatmentName === treatmentFilter);
    return result;
  }, [yarns, nameFilter, countFilter, micronFilter, treatmentFilter]);

  const hasAnyFilter = nameFilter || countFilter || micronFilter || treatmentFilter;

  const selectYarn = async (yarn: Yarn) => {
    setSelectedYarn(yarn);
    setPriceLoading(true);
    try {
      const res = await fetch(`/api/prices?yarnId=${yarn.id}`);
      const data = await res.json();
      setPriceHistory(data);
    } catch { setPriceHistory([]); }
    setPriceLoading(false);
  };

  const clearFilters = () => {
    setNameFilter(""); setCountFilter(""); setMicronFilter(""); setTreatmentFilter("");
    setSelectedYarn(null); setPriceHistory([]);
  };

  const yarnCertNames = useMemo(() => {
    if (!selectedYarn) return [];
    return allCerts.filter((c) => selectedYarn.certIds.includes(c.id));
  }, [selectedYarn, allCerts]);

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Search Yarn</h1>
        <p className="text-sm text-slate-500">Find a specific yarn and view its full details and price history</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Yarn Name</label>
            <select value={nameFilter} onChange={(e) => { setNameFilter(e.target.value); setSelectedYarn(null); }} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="">All Names ({nameOptions.length})</option>
              {nameOptions.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Yarn Count</label>
            <select value={countFilter} onChange={(e) => { setCountFilter(e.target.value); setSelectedYarn(null); }} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="">All Counts ({countOptions.length})</option>
              {countOptions.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Micron</label>
            <select value={micronFilter} onChange={(e) => { setMicronFilter(e.target.value); setSelectedYarn(null); }} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="">All Microns ({micronOptions.length})</option>
              {micronOptions.map((m) => <option key={m} value={m}>{parseFloat(m).toFixed(1)}μm</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Treatment</label>
            <select value={treatmentFilter} onChange={(e) => { setTreatmentFilter(e.target.value); setSelectedYarn(null); }} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="">All Treatments ({treatmentOptions.length})</option>
              {treatmentOptions.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        {hasAnyFilter && (
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm text-slate-600">{filtered.length} result(s)</span>
            <button onClick={clearFilters} className="text-sm text-blue-600 hover:underline">Clear All Filters</button>
          </div>
        )}
      </div>

      {!hasAnyFilter ? (
        /* No filters active — show blank prompt */
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <IconSearch className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <h3 className="text-lg font-medium text-slate-600">Search for a yarn</h3>
          <p className="text-sm text-slate-400 mt-1">Use the filters above to narrow down yarns by name, count, micron, or treatment</p>
        </div>
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Results list */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-3 border-b border-slate-200 bg-slate-50">
              <h3 className="text-sm font-semibold text-slate-700">
                {filtered.length} Yarn(s) Found
              </h3>
            </div>
            <div className="max-h-[60vh] overflow-y-auto divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-sm">
                  <IconSearch className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p>No yarns match your filters</p>
                </div>
              ) : (
                filtered.map((y) => (
                  <button
                    key={y.id}
                    onClick={() => selectYarn(y)}
                    className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors ${selectedYarn?.id === y.id ? "bg-blue-50 border-l-4 border-blue-500" : ""}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${y.relationship === "My Factory" ? "bg-blue-500" : "bg-red-500"}`} />
                      <span className="font-medium text-sm text-blue-700 hover:underline">{y.yarnName}</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1 ml-4">
                      {y.factoryName} · {y.yarnCount || "—"} · {y.micron ? y.micron + "μm" : "—"} · {y.treatmentName || "Untreated"}
                    </div>
                    {y.latestPrice != null && (
                      <div className="text-xs font-mono text-slate-600 mt-0.5 ml-4">
                        {y.latestCurrency || "USD"} {y.latestPrice.toFixed(2)}/{(y.latestUnit || "per KG").replace("per ", "")}
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Detail panel */}
        <div className="lg:col-span-2">
          {!selectedYarn ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
              <IconSearch className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <h3 className="text-lg font-medium text-slate-600">Select a yarn to view details</h3>
              <p className="text-sm text-slate-400 mt-1">Click a yarn name from the list on the left</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Yarn info card */}
              <div className={`bg-white rounded-xl shadow-sm border-2 p-5 ${selectedYarn.relationship === "My Factory" ? "border-blue-200" : "border-red-200"}`}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-3 h-3 rounded-full ${selectedYarn.relationship === "My Factory" ? "bg-blue-500" : "bg-red-500"}`} />
                      <h2 className="text-xl font-bold text-slate-900">{selectedYarn.yarnName}</h2>
                    </div>
                    <p className="text-sm text-slate-500">{selectedYarn.factoryName} · {selectedYarn.relationship}</p>
                  </div>
                  {selectedYarn.latestPrice != null && (
                    <div className="text-right">
                      <div className="text-lg font-bold font-mono text-slate-900">
                        {selectedYarn.latestCurrency || "USD"} {selectedYarn.latestPrice.toFixed(2)}
                      </div>
                      <div className="text-xs text-slate-500">
                        {(selectedYarn.latestUnit || "per KG")} · {selectedYarn.latestPriceDate}
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500 text-xs">Yarn Count</span>
                    <div className="font-medium">{selectedYarn.yarnCount || "—"}</div>
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs">Micron</span>
                    <div className="font-medium">{selectedYarn.micron ? `${parseFloat(selectedYarn.micron).toFixed(1)}μm` : "—"}</div>
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs">Treatment</span>
                    <div className="font-medium">{selectedYarn.treatmentName || "—"}</div>
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs">Composition</span>
                    <div className="font-medium">{selectedYarn.composition || "—"}</div>
                  </div>
                </div>

                {selectedYarn.notes && (
                  <div className="mt-4 pt-3 border-t border-slate-200">
                    <span className="text-slate-500 text-xs">Notes</span>
                    <p className="text-sm text-slate-700 mt-0.5 whitespace-pre-line">{selectedYarn.notes}</p>
                  </div>
                )}

                {yarnCertNames.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <span className="text-slate-500 text-xs">Certificates</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {yarnCertNames.map((c) => (
                        <span key={c.id} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium" title={c.certFullName}>
                          {c.certCode}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Price history */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="p-4 border-b border-slate-200">
                  <h3 className="font-semibold text-slate-900">Price History</h3>
                </div>
                {priceLoading ? (
                  <div className="p-8 flex justify-center"><div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
                ) : priceHistory.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-sm">No price records for this yarn</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 text-left text-slate-600">
                          <th className="px-4 py-3 font-medium">Date</th>
                          <th className="px-4 py-3 font-medium text-right">Price</th>
                          <th className="px-4 py-3 font-medium">Incoterms</th>
                          <th className="px-4 py-3 font-medium">Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {priceHistory.map((p, i) => {
                          const prevPrice = priceHistory[i + 1]?.price;
                          const diff = prevPrice != null ? p.price - prevPrice : null;
                          return (
                            <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50">
                              <td className="px-4 py-3 text-slate-600">{p.recordDate}</td>
                              <td className="px-4 py-3 text-right">
                                <span className="font-mono font-medium">{p.currency} {p.price.toFixed(2)}</span>
                                <span className="text-slate-400 text-xs font-normal">/{(p.unit || "per KG").replace("per ", "")}</span>
                                {diff != null && (
                                  <span className={`ml-2 text-xs font-medium ${diff > 0 ? "text-red-500" : diff < 0 ? "text-green-600" : "text-slate-400"}`}>
                                    {diff > 0 ? "+" : ""}{diff.toFixed(2)}
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-slate-600">{p.incoterms || "—"}</td>
                              <td className="px-4 py-3 text-slate-500 text-xs max-w-[200px] truncate">{p.remarks || "—"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
}
