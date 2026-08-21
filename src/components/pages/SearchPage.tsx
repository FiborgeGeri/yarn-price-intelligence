"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { IconSearch, IconTrash } from "@/components/Icons";
import { Permissions } from "@/lib/permissions";
import { useYarnDetail, YarnDetailModal } from "@/components/YarnDetailModal";

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

interface Certificate { id: number; certCode: string; certFullName: string; }
interface Props { permissions: Permissions; }

function SearchInput({
  label,
  value,
  onChange,
  options,
  placeholder,
  onClearSelection,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
  onClearSelection: () => void;
}) {
  const [focused, setFocused] = useState(false);
  const showSuggestions = focused && options.length > 0 && options.length <= 30;

  return (
    <div className="relative">
      <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => { onChange(e.target.value); onClearSelection(); }}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        placeholder={placeholder}
      />
      {value && (
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            onChange("");
            onClearSelection();
          }}
          className="absolute right-2 top-[26px] text-slate-400 hover:text-slate-600 text-xs"
        >
          ✕
        </button>
      )}
      {showSuggestions && (
        <div className="absolute z-30 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(opt);
                onClearSelection();
                setFocused(false);
              }}
              className="w-full text-left px-3 py-1.5 text-sm hover:bg-slate-50 border-b border-slate-50 last:border-0"
            >
              {opt}
            </button>
          ))}
        </div>
      )}
      {!showSuggestions && focused && value && options.length === 0 && (
        <div className="absolute z-30 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2 text-xs text-slate-400">
          No matches
        </div>
      )}
    </div>
  );
}

export default function SearchPage({ permissions }: Props) {
  const [yarns, setYarns] = useState<Yarn[]>([]);
  const [allCerts, setAllCerts] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  const [millQuery, setMillQuery] = useState("");
  const [nameQuery, setNameQuery] = useState("");
  const [countQuery, setCountQuery] = useState("");
  const [micronQuery, setMicronQuery] = useState("");
  const [treatmentQuery, setTreatmentQuery] = useState("");

  const [selectedYarn, setSelectedYarn] = useState<Yarn | null>(null);
  const [priceHistory, setPriceHistory] = useState<PriceRecord[]>([]);
  const [priceLoading, setPriceLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [viewing, setViewing] = useState<PriceRecord | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const { viewingYarn, setViewingYarn, openYarnDetail, allCerts: yarnCertsAll } = useYarnDetail();

  const loadBaseData = useCallback(async () => {
    const [y, c] = await Promise.all([
      fetch("/api/yarns?ts=" + Date.now()).then((r) => r.json()),
      fetch("/api/certificates").then((r) => r.json()),
    ]);
    setYarns(y);
    setAllCerts(c);
  }, []);

  useEffect(() => {
    loadBaseData().then(() => setLoading(false)).catch(() => setLoading(false));
  }, [loadBaseData]);

  const loadYarnPriceHistory = useCallback(async (yarn: Yarn) => {
    setSelectedYarn(yarn);
    setPriceLoading(true);
    try {
      const res = await fetch(`/api/prices?yarnId=${yarn.id}`);
      setPriceHistory(await res.json());
    } catch {
      setPriceHistory([]);
    }
    setPriceLoading(false);
  }, []);

  const applyOtherFilters = useCallback((exclude: "mill" | "name" | "count" | "micron" | "treatment") => {
    let r = yarns;
    if (exclude !== "mill" && millQuery) r = r.filter((y) => y.factoryName.toLowerCase().includes(millQuery.toLowerCase()));
    if (exclude !== "name" && nameQuery) r = r.filter((y) => y.yarnName.toLowerCase().includes(nameQuery.toLowerCase()));
    if (exclude !== "count" && countQuery) r = r.filter((y) => (y.yarnCount || "").toLowerCase().includes(countQuery.toLowerCase()));
    if (exclude !== "micron" && micronQuery) r = r.filter((y) => (y.micron || "").includes(micronQuery));
    if (exclude !== "treatment" && treatmentQuery) r = r.filter((y) => (y.treatmentName || "Untreated").toLowerCase().includes(treatmentQuery.toLowerCase()));
    return r;
  }, [yarns, millQuery, nameQuery, countQuery, micronQuery, treatmentQuery]);

  const millOptions = useMemo(() => {
    const pool = applyOtherFilters("mill");
    const mills = [...new Set(pool.map((y) => y.factoryName))].sort();
    if (!millQuery) return mills;
    const q = millQuery.toLowerCase();
    return mills.filter((m) => m.toLowerCase().includes(q));
  }, [applyOtherFilters, millQuery]);

  const nameOptions = useMemo(() => {
    const pool = applyOtherFilters("name");
    const names = [...new Set(pool.map((y) => y.yarnName))].sort();
    if (!nameQuery) return names;
    const q = nameQuery.toLowerCase();
    return names.filter((n) => n.toLowerCase().includes(q));
  }, [applyOtherFilters, nameQuery]);

  const countOptions = useMemo(() => {
    const pool = applyOtherFilters("count");
    const counts = [...new Set(pool.map((y) => y.yarnCount).filter(Boolean))].sort();
    if (!countQuery) return counts;
    const q = countQuery.toLowerCase();
    return counts.filter((c) => c.toLowerCase().includes(q));
  }, [applyOtherFilters, countQuery]);

  const micronOptions = useMemo(() => {
    const pool = applyOtherFilters("micron");
    const microns = [...new Set(pool.map((y) => y.micron).filter(Boolean))].sort((a, b) => parseFloat(a) - parseFloat(b));
    if (!micronQuery) return microns;
    return microns.filter((m) => m.includes(micronQuery));
  }, [applyOtherFilters, micronQuery]);

  const treatmentOptions = useMemo(() => {
    const pool = applyOtherFilters("treatment");
    const treats = [...new Set(pool.map((y) => y.treatmentName || "Untreated"))].sort();
    if (!treatmentQuery) return treats;
    const q = treatmentQuery.toLowerCase();
    return treats.filter((t) => t.toLowerCase().includes(q));
  }, [applyOtherFilters, treatmentQuery]);

  const filtered = useMemo(() => {
    let r = yarns;
    if (millQuery) r = r.filter((y) => y.factoryName.toLowerCase().includes(millQuery.toLowerCase()));
    if (nameQuery) r = r.filter((y) => y.yarnName.toLowerCase().includes(nameQuery.toLowerCase()));
    if (countQuery) r = r.filter((y) => (y.yarnCount || "").toLowerCase().includes(countQuery.toLowerCase()));
    if (micronQuery) r = r.filter((y) => (y.micron || "").includes(micronQuery));
    if (treatmentQuery) r = r.filter((y) => (y.treatmentName || "Untreated").toLowerCase().includes(treatmentQuery.toLowerCase()));
    return r;
  }, [yarns, millQuery, nameQuery, countQuery, micronQuery, treatmentQuery]);

  const hasAnyInput = Boolean(millQuery || nameQuery || countQuery || micronQuery || treatmentQuery);

  const clearAll = () => {
    setMillQuery("");
    setNameQuery("");
    setCountQuery("");
    setMicronQuery("");
    setTreatmentQuery("");
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
      setPriceHistory((prev) => prev.filter((p) => p.id !== record.id));
      setToast({ type: "success", text: "Price record deleted" });
      await loadBaseData();
      if (selectedYarn) {
        const refreshed = (await fetch("/api/yarns?ids=" + selectedYarn.id).then((r) => r.json())) as Yarn[];
        if (refreshed[0]) setSelectedYarn(refreshed[0]);
      }
    } catch {
      setToast({ type: "error", text: "Failed to delete" });
    }
    setDeletingId(null);
    setTimeout(() => setToast(null), 3000);
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-[#e5885d] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Search Yarn</h1>
        <p className="text-sm text-slate-500">Type in any box — the other boxes will show only related options</p>
      </div>

      {toast && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${toast.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-[#3a6650] border border-[#cde3d3]"}`}>{toast.text}</div>
      )}

      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <SearchInput label="Yarn Mill" value={millQuery} onChange={setMillQuery} options={millOptions} placeholder="Type yarn mill..." onClearSelection={() => setSelectedYarn(null)} />
          <SearchInput label="Yarn Name" value={nameQuery} onChange={setNameQuery} options={nameOptions} placeholder="Type yarn name..." onClearSelection={() => setSelectedYarn(null)} />
          <SearchInput label="Yarn Count" value={countQuery} onChange={setCountQuery} options={countOptions} placeholder="Type count e.g. NM 48/2" onClearSelection={() => setSelectedYarn(null)} />
          <SearchInput label="Micron" value={micronQuery} onChange={setMicronQuery} options={micronOptions} placeholder="Type micron e.g. 19.5" onClearSelection={() => setSelectedYarn(null)} />
          <SearchInput label="Treatment" value={treatmentQuery} onChange={setTreatmentQuery} options={treatmentOptions} placeholder="Type treatment..." onClearSelection={() => setSelectedYarn(null)} />
        </div>
        <div className="mt-3 flex items-center justify-between">
          {hasAnyInput ? (
            <>
              <span className="text-sm text-slate-600">{filtered.length} result(s)</span>
              <button onClick={clearAll} className="text-sm text-[#d9774d] hover:underline">Clear All</button>
            </>
          ) : (
            <span className="text-sm text-slate-400">Type in any box to start searching</span>
          )}
        </div>
      </div>

      {!hasAnyInput ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <IconSearch className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <h3 className="text-lg font-medium text-slate-600">Search for a yarn</h3>
          <p className="text-sm text-slate-400 mt-1">Type in any of the 5 boxes above — results will appear here</p>
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
                    <button key={y.id} onClick={() => loadYarnPriceHistory(y)} className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors ${selectedYarn?.id === y.id ? "bg-blue-50 border-l-4 border-[#e5885d]" : ""}`}>
                      <div className="flex items-center gap-2"><span className={`w-2 h-2 rounded-full shrink-0 ${y.relationship === "My Factory" ? "bg-[#e5885d]" : "bg-[#4d7d61]"}`} /><span className="font-medium text-sm text-[#c4683f]">{y.yarnName}</span></div>
                      <div className="text-xs text-slate-500 mt-1 ml-4">{y.factoryName} · {y.yarnCount || "—"} · {y.micron ? y.micron + "μm" : "—"} · {y.treatmentName || "Untreated"}</div>
                      {y.latestPrice != null && <div className="text-xs font-mono text-slate-600 mt-0.5 ml-4">{y.latestCurrency || "USD"} {y.latestPrice.toFixed(2)}/{(y.latestUnit || "per KG").replace("per ", "")}</div>}
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
                <div className={`bg-white rounded-xl shadow-sm border-2 p-5 ${selectedYarn.relationship === "My Factory" ? "border-[#f5c5ae]" : "border-[#cde3d3]"}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1"><span className={`w-3 h-3 rounded-full ${selectedYarn.relationship === "My Factory" ? "bg-[#e5885d]" : "bg-[#4d7d61]"}`} /><button onClick={() => openYarnDetail(selectedYarn.id)} className="text-xl font-bold text-[#c4683f] hover:underline text-left">{selectedYarn.yarnName}</button></div>
                      <p className="text-sm text-slate-500">{selectedYarn.factoryName} · {selectedYarn.relationship === "My Factory" ? "Mine" : "Competitor"}</p>
                    </div>
                    {selectedYarn.latestPrice != null && <div className="text-right"><div className="text-lg font-bold font-mono text-slate-900">{selectedYarn.latestCurrency || "USD"} {selectedYarn.latestPrice.toFixed(2)}</div><div className="text-xs text-slate-500">{selectedYarn.latestUnit || "per KG"} · {selectedYarn.latestPriceDate}</div></div>}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <div><span className="text-slate-500 text-xs">Yarn Count</span><div className="font-medium">{selectedYarn.yarnCount || "—"}</div></div>
                    <div><span className="text-slate-500 text-xs">Micron</span><div className="font-medium">{selectedYarn.micron ? `${parseFloat(selectedYarn.micron).toFixed(1)}μm` : "—"}</div></div>
                    <div><span className="text-slate-500 text-xs">Treatment</span><div className="font-medium">{selectedYarn.treatmentName || "Untreated"}</div></div>
                    <div><span className="text-slate-500 text-xs">Composition</span><div className="font-medium">{selectedYarn.composition || "—"}</div></div>
                  </div>
                  {selectedYarn.notes && <div className="mt-4 pt-3 border-t border-slate-200"><span className="text-slate-500 text-xs">Notes</span><p className="text-sm text-slate-700 mt-0.5 whitespace-pre-line">{selectedYarn.notes}</p></div>}
                  {yarnCertNames.length > 0 && <div className="mt-3 pt-3 border-t border-slate-200"><span className="text-slate-500 text-xs">Certificates</span><div className="flex flex-wrap gap-1.5 mt-1">{yarnCertNames.map((c) => <span key={c.id} className="px-2 py-0.5 bg-blue-50 text-[#c4683f] rounded text-xs font-medium" title={c.certFullName}>{c.certCode}</span>)}</div></div>}
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                  <div className="p-4 border-b border-slate-200"><h3 className="font-semibold text-slate-900">Price History</h3></div>
                  {priceLoading ? (
                    <div className="p-8 flex justify-center"><div className="w-6 h-6 border-4 border-[#e5885d] border-t-transparent rounded-full animate-spin" /></div>
                  ) : priceHistory.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-sm">No price records for this yarn</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead><tr className="bg-slate-50 text-left text-slate-600"><th className="px-4 py-3 font-medium">Date</th><th className="px-4 py-3 font-medium text-right">Price</th><th className="px-4 py-3 font-medium">Incoterms</th><th className="px-4 py-3 font-medium">Remarks</th><th className="px-4 py-3 font-medium w-20">Actions</th></tr></thead>
                        <tbody>
                          {priceHistory.map((p, i) => {
                            // Only compare with previous price that has same currency+unit+incoterms
                            const sameTermsPrev = priceHistory.slice(i + 1).find((prev) => prev.currency === p.currency && prev.unit === p.unit && (prev.incoterms || "") === (p.incoterms || ""));
                            const prevPrice = sameTermsPrev?.price ?? null;
                            const diff = prevPrice != null ? p.price - prevPrice : null;
                            return (
                              <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50">
                                <td className="px-4 py-3 text-slate-600">{p.recordDate}</td>
                                <td className="px-4 py-3 text-right"><span className="font-mono font-medium">{p.currency} {p.price.toFixed(2)}</span><span className="text-slate-400 text-xs font-normal">/{(p.unit || "per KG").replace("per ", "")}</span>{diff != null && <span className={`ml-2 text-xs font-medium ${diff > 0 ? "text-red-500" : diff < 0 ? "text-green-600" : "text-slate-400"}`}>{diff > 0 ? "+" : ""}{diff.toFixed(2)}</span>}</td>
                                <td className="px-4 py-3 text-slate-600">{p.incoterms || "—"}</td>
                                <td className="px-4 py-3 text-slate-500 text-xs max-w-[200px] truncate">{p.remarks || "—"}</td>
                                <td className="px-4 py-3"><div className="flex gap-2"> <button onClick={() => setViewing(p)} className="text-slate-600 hover:text-slate-900 text-xs">View</button>{permissions.canDelete && <button onClick={() => handleDeletePrice(p)} disabled={deletingId === p.id} className="text-red-500 hover:text-[#3a6650] disabled:opacity-50 text-xs">Del</button>}</div></td>
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

      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setViewing(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-200 flex items-center justify-between"><h2 className="text-lg font-semibold">Price Record Detail</h2><button onClick={() => setViewing(null)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button></div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm"><div><span className="text-slate-500 text-xs block">Yarn</span><div className="font-medium">{viewing.yarnName}</div></div><div><span className="text-slate-500 text-xs block">Yarn Mill</span><div className="font-medium">{viewing.factoryName}</div></div><div><span className="text-slate-500 text-xs block">Count</span><div className="font-medium">{viewing.yarnCount || "—"}</div></div><div><span className="text-slate-500 text-xs block">Micron</span><div className="font-medium">{viewing.micron ? parseFloat(viewing.micron).toFixed(1) + "μm" : "—"}</div></div><div><span className="text-slate-500 text-xs block">Treatment</span><div className="font-medium">{viewing.treatmentName || "Untreated"}</div></div><div><span className="text-slate-500 text-xs block">Type</span><div className="font-medium">{viewing.relationship === "My Factory" ? "Mine" : "Competitor"}</div></div></div>
              <div className="border-t border-slate-200 pt-4 grid grid-cols-3 gap-4 text-sm"><div><span className="text-slate-500 text-xs block">Price</span><div className="font-mono font-bold text-lg">{viewing.currency} {viewing.price.toFixed(2)}</div><div className="text-xs text-slate-400">{viewing.unit || "per KG"}</div></div><div><span className="text-slate-500 text-xs block">Record Date</span><div className="font-medium">{viewing.recordDate}</div></div><div><span className="text-slate-500 text-xs block">Incoterms</span><div className="font-medium">{viewing.incoterms || "—"}</div></div></div>
              <div className="border-t border-slate-200 pt-4"><span className="text-slate-500 text-xs block mb-1">Remarks</span><div className="text-sm text-slate-700 whitespace-pre-line bg-slate-50 rounded-lg p-3 min-h-[60px]">{viewing.remarks || "No remarks"}</div></div>
            </div>
          </div>
        </div>
      )}
      {viewingYarn && <YarnDetailModal yarn={viewingYarn} certs={yarnCertsAll} onClose={() => setViewingYarn(null)} />}
    </div>
  );
}
