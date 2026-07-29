"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { IconSearch, IconTrash } from "@/components/Icons";
import { Permissions } from "@/lib/permissions";

interface Yarn {
  id: number;
  yarnName: string;
  factoryId: number;
  yarnCount: string;
  micron: string;
  treatmentId: number;
  origin: string;
  composition: string;
  notes: string;
  factoryName: string;
  relationship: string;
  treatmentName: string;
  certIds: number[];
  latestPrice: number | null;
  latestCurrency: string | null;
  latestUnit: string | null;
  latestPriceDate: string | null;
}

interface PriceRecord {
  id: number;
  yarnId: number;
  price: number;
  currency: string;
  unit: string;
  recordDate: string;
  incoterms: string;
  remarks: string;
  yarnName: string;
  yarnCount: string;
  micron: string;
  factoryName: string;
  relationship: string;
  treatmentName: string;
}

interface Certificate {
  id: number;
  certCode: string;
  certFullName: string;
}

interface Props {
  permissions: Permissions;
}

export default function SearchPage({ permissions }: Props) {
  const [yarns, setYarns] = useState<Yarn[]>([]);
  const [allCerts, setAllCerts] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState("");
  const [nameFilter, setNameFilter] = useState("");
  const [countFilter, setCountFilter] = useState("");
  const [micronFilter, setMicronFilter] = useState("");
  const [treatmentFilter, setTreatmentFilter] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [selectedYarn, setSelectedYarn] = useState<Yarn | null>(null);
  const [priceHistory, setPriceHistory] = useState<PriceRecord[]>([]);
  const [priceLoading, setPriceLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadBaseData = useCallback(async () => {
    const [y, c] = await Promise.all([
      fetch("/api/yarns?ts=" + Date.now()).then((r) => r.json()),
      fetch("/api/certificates").then((r) => r.json()),
    ]);
    setYarns(y);
    setAllCerts(c);
  }, []);

  useEffect(() => {
    loadBaseData()
      .then(() => setLoading(false))
      .catch(() => setLoading(false));
  }, [loadBaseData]);

  const loadYarnPriceHistory = useCallback(async (yarn: Yarn) => {
    setSelectedYarn(yarn);
    setPriceLoading(true);
    try {
      const res = await fetch(`/api/prices?yarnId=${yarn.id}`);
      const data = await res.json();
      setPriceHistory(data);
    } catch {
      setPriceHistory([]);
    }
    setPriceLoading(false);
  }, []);

  const normalizedQuery = query.trim().toLowerCase();

  const queryFilteredYarns = useMemo(() => {
    if (!normalizedQuery) return yarns;
    return yarns.filter((y) =>
      y.yarnName?.toLowerCase().includes(normalizedQuery) ||
      y.factoryName?.toLowerCase().includes(normalizedQuery) ||
      y.yarnCount?.toLowerCase().includes(normalizedQuery) ||
      y.micron?.toLowerCase().includes(normalizedQuery) ||
      (y.treatmentName || "Untreated").toLowerCase().includes(normalizedQuery) ||
      y.notes?.toLowerCase().includes(normalizedQuery) ||
      y.composition?.toLowerCase().includes(normalizedQuery)
    );
  }, [yarns, normalizedQuery]);

  // Cascading filter logic + query-aware options
  const yarnsForNameOptions = useMemo(() => {
    let r = queryFilteredYarns;
    if (countFilter) r = r.filter((y) => y.yarnCount === countFilter);
    if (micronFilter) r = r.filter((y) => y.micron === micronFilter);
    if (treatmentFilter) r = r.filter((y) => (y.treatmentName || "Untreated") === treatmentFilter);
    return r;
  }, [queryFilteredYarns, countFilter, micronFilter, treatmentFilter]);

  const yarnsForCountOptions = useMemo(() => {
    let r = queryFilteredYarns;
    if (nameFilter) r = r.filter((y) => y.yarnName === nameFilter);
    if (micronFilter) r = r.filter((y) => y.micron === micronFilter);
    if (treatmentFilter) r = r.filter((y) => (y.treatmentName || "Untreated") === treatmentFilter);
    return r;
  }, [queryFilteredYarns, nameFilter, micronFilter, treatmentFilter]);

  const yarnsForMicronOptions = useMemo(() => {
    let r = queryFilteredYarns;
    if (nameFilter) r = r.filter((y) => y.yarnName === nameFilter);
    if (countFilter) r = r.filter((y) => y.yarnCount === countFilter);
    if (treatmentFilter) r = r.filter((y) => (y.treatmentName || "Untreated") === treatmentFilter);
    return r;
  }, [queryFilteredYarns, nameFilter, countFilter, treatmentFilter]);

  const yarnsForTreatmentOptions = useMemo(() => {
    let r = queryFilteredYarns;
    if (nameFilter) r = r.filter((y) => y.yarnName === nameFilter);
    if (countFilter) r = r.filter((y) => y.yarnCount === countFilter);
    if (micronFilter) r = r.filter((y) => y.micron === micronFilter);
    return r;
  }, [queryFilteredYarns, nameFilter, countFilter, micronFilter]);

  const nameOptions = useMemo(() => [...new Set(yarnsForNameOptions.map((y) => y.yarnName))].sort(), [yarnsForNameOptions]);
  const countOptions = useMemo(() => [...new Set(yarnsForCountOptions.map((y) => y.yarnCount).filter(Boolean))].sort(), [yarnsForCountOptions]);
  const micronOptions = useMemo(() => [...new Set(yarnsForMicronOptions.map((y) => y.micron).filter(Boolean))].sort((a, b) => parseFloat(a) - parseFloat(b)), [yarnsForMicronOptions]);
  const treatmentOptions = useMemo(() => [...new Set(yarnsForTreatmentOptions.map((y) => y.treatmentName || "Untreated"))].sort(), [yarnsForTreatmentOptions]);

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

  const filtered = useMemo(() => {
    let result = queryFilteredYarns;
    if (nameFilter) result = result.filter((y) => y.yarnName === nameFilter);
    if (countFilter) result = result.filter((y) => y.yarnCount === countFilter);
    if (micronFilter) result = result.filter((y) => y.micron === micronFilter);
    if (treatmentFilter) result = result.filter((y) => (y.treatmentName || "Untreated") === treatmentFilter);
    return result;
  }, [queryFilteredYarns, nameFilter, countFilter, micronFilter, treatmentFilter]);

  const hasAnyFilter = Boolean(normalizedQuery || nameFilter || countFilter || micronFilter || treatmentFilter);

  const clearFilters = () => {
    setQuery("");
    setNameFilter("");
    setCountFilter("");
    setMicronFilter("");
    setTreatmentFilter("");
    setSelectedYarn(null);
    setPriceHistory([]);
  };

  const yarnCertNames = useMemo(() => {
    if (!selectedYarn) return [];
    return allCerts.filter((c) => selectedYarn.certIds.includes(c.id));
  }, [selectedYarn, allCerts]);

  const handleDeletePrice = async (record: PriceRecord) => {
    if (!permissions.canDelete) return;
    if (!confirm(`Delete price record dated ${record.recordDate}?`)) return;
    setDeletingId(record.id);
    try {
      const res = await fetch(`/api/prices?id=${record.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();

      const nextHistory = priceHistory.filter((p) => p.id !== record.id);
      setPriceHistory(nextHistory);
      setToast({ type: "success", text: "Price record deleted" });

      await loadBaseData();
      if (selectedYarn) {
        const refreshed = (await fetch("/api/yarns?ids=" + selectedYarn.id).then((r) => r.json())) as Yarn[];
        if (refreshed[0]) setSelectedYarn(refreshed[0]);
      }
      setTimeout(() => setToast(null), 3000);
    } catch {
      setToast({ type: "error", text: "Failed to delete price record" });
      setTimeout(() => setToast(null), 3000);
    }
    setDeletingId(null);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Search Yarn</h1>
        <p className="text-sm text-slate-500">Search by typing, then refine with filters if needed</p>
      </div>

      {toast && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${toast.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {toast.text}
        </div>
      )}

      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 mb-6">
        <div className="relative">
          <IconSearch className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedYarn(null); }}
            className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search yarn name, factory, count, micron, treatment, notes..."
          />
        </div>

        <div className="mt-3 flex items-center justify-between">
          <button
            onClick={() => setShowAdvanced((v) => !v)}
            className="text-sm text-slate-600 hover:text-slate-900"
          >
            {showAdvanced ? "Hide advanced filters" : "Show advanced filters"}
          </button>
          {hasAnyFilter && (
            <button onClick={clearFilters} className="text-sm text-blue-600 hover:underline">Clear All</button>
          )}
        </div>

        {showAdvanced && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3 pt-3 border-t border-slate-100">
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
        )}

        {hasAnyFilter && (
          <div className="mt-3 text-sm text-slate-600">{filtered.length} result(s)</div>
        )}
      </div>

      {!hasAnyFilter ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <IconSearch className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <h3 className="text-lg font-medium text-slate-600">Start by typing a yarn search</h3>
          <p className="text-sm text-slate-400 mt-1">Use the search box for quick finding, then open advanced filters if you need to refine results.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-3 border-b border-slate-200 bg-slate-50">
                <h3 className="text-sm font-semibold text-slate-700">{filtered.length} Yarn(s) Found</h3>
              </div>
              <div className="max-h-[60vh] overflow-y-auto divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-sm">
                    <IconSearch className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p>No yarns match your search</p>
                  </div>
                ) : (
                  filtered.map((y) => (
                    <button
                      key={y.id}
                      onClick={() => loadYarnPriceHistory(y)}
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

          <div className="lg:col-span-2">
            {!selectedYarn ? (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                <IconSearch className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <h3 className="text-lg font-medium text-slate-600">Select a yarn to view details</h3>
                <p className="text-sm text-slate-400 mt-1">Click a yarn name from the list on the left</p>
              </div>
            ) : (
              <div className="space-y-4">
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
                        <div className="text-lg font-bold font-mono text-slate-900">{selectedYarn.latestCurrency || "USD"} {selectedYarn.latestPrice.toFixed(2)}</div>
                        <div className="text-xs text-slate-500">{selectedYarn.latestUnit || "per KG"} · {selectedYarn.latestPriceDate}</div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <div><span className="text-slate-500 text-xs">Yarn Count</span><div className="font-medium">{selectedYarn.yarnCount || "—"}</div></div>
                    <div><span className="text-slate-500 text-xs">Micron</span><div className="font-medium">{selectedYarn.micron ? `${parseFloat(selectedYarn.micron).toFixed(1)}μm` : "—"}</div></div>
                    <div><span className="text-slate-500 text-xs">Treatment</span><div className="font-medium">{selectedYarn.treatmentName || "Untreated"}</div></div>
                    <div><span className="text-slate-500 text-xs">Composition</span><div className="font-medium">{selectedYarn.composition || "—"}</div></div>
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
                          <span key={c.id} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium" title={c.certFullName}>{c.certCode}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                  <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900">Price History</h3>
                    {permissions.canDelete && priceHistory.length > 0 && (
                      <span className="text-xs text-slate-400">Delete is available here too</span>
                    )}
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
                            {permissions.canDelete && <th className="px-4 py-3 font-medium w-10"></th>}
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
                                {permissions.canDelete && (
                                  <td className="px-4 py-3 text-right">
                                    <button
                                      onClick={() => handleDeletePrice(p)}
                                      disabled={deletingId === p.id}
                                      className="text-red-500 hover:text-red-700 disabled:opacity-50"
                                      title="Delete price record"
                                    >
                                      <IconTrash className="w-4 h-4" />
                                    </button>
                                  </td>
                                )}
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
