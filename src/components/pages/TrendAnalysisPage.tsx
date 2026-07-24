"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from "recharts";

interface Yarn {
  id: number; yarnName: string; factoryName: string; micron: string;
  yarnCount: string; relationship: string; treatmentName: string;
  latestPrice: number | null; latestCurrency: string | null;
  latestUnit: string | null;
}

interface TrendPoint {
  recordDate: string; price: number; currency: string; unit: string;
  yarnId: number; yarnName: string; yarnCount: string; micron: string;
  factoryName: string; relationship: string; treatmentName: string;
}

const COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

function yarnLabel(y: { yarnName: string; factoryName: string; yarnCount: string; treatmentName: string }) {
  const treat = y.treatmentName && y.treatmentName !== "Untreated" ? ` [${y.treatmentName}]` : "";
  return `${y.yarnName} · ${y.factoryName} · ${y.yarnCount || "—"}${treat}`;
}

export default function TrendAnalysisPage() {
  const [yarns, setYarns] = useState<Yarn[]>([]);
  const [yarnsLoading, setYarnsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [trendData, setTrendData] = useState<TrendPoint[]>([]);
  const [trendLoading, setTrendLoading] = useState(false);

  const [nameFilter, setNameFilter] = useState("");
  const [countFilter, setCountFilter] = useState("");
  const [micronFilter, setMicronFilter] = useState("");
  const [treatmentFilter, setTreatmentFilter] = useState("");
  const [relFilter, setRelFilter] = useState("");

  useEffect(() => {
    fetch("/api/yarns").then((r) => r.json()).then((d) => { setYarns(d); setYarnsLoading(false); });
  }, []);

  useEffect(() => {
    if (selectedIds.length === 0) { setTrendData([]); return; }
    setTrendLoading(true);
    fetch(`/api/trends?yarnIds=${selectedIds.join(",")}`)
      .then((r) => r.json())
      .then((d) => { setTrendData(d); setTrendLoading(false); })
      .catch(() => setTrendLoading(false));
  }, [selectedIds]);

  // Cascading filter options — each dropdown excludes its own filter
  const applyOtherFilters = useCallback((excludeField: string) => {
    let r = yarns;
    if (excludeField !== "name" && nameFilter) r = r.filter((y) => y.yarnName === nameFilter);
    if (excludeField !== "count" && countFilter) r = r.filter((y) => y.yarnCount === countFilter);
    if (excludeField !== "micron" && micronFilter) r = r.filter((y) => y.micron === micronFilter);
    if (excludeField !== "treatment" && treatmentFilter) r = r.filter((y) => (y.treatmentName || "Untreated") === treatmentFilter);
    if (excludeField !== "rel" && relFilter) r = r.filter((y) => y.relationship === relFilter);
    return r;
  }, [yarns, nameFilter, countFilter, micronFilter, treatmentFilter, relFilter]);

  const nameOpts = useMemo(() => [...new Set(applyOtherFilters("name").map((y) => y.yarnName))].sort(), [applyOtherFilters]);
  const countOpts = useMemo(() => [...new Set(applyOtherFilters("count").map((y) => y.yarnCount).filter(Boolean))].sort(), [applyOtherFilters]);
  const micronOpts = useMemo(() => [...new Set(applyOtherFilters("micron").map((y) => y.micron).filter(Boolean))].sort((a, b) => parseFloat(a) - parseFloat(b)), [applyOtherFilters]);
  const treatmentOpts = useMemo(() => [...new Set(applyOtherFilters("treatment").map((y) => y.treatmentName || "Untreated"))].sort(), [applyOtherFilters]);

  // Auto-clear orphaned
  useEffect(() => { if (nameFilter && !nameOpts.includes(nameFilter)) setNameFilter(""); }, [nameFilter, nameOpts]);
  useEffect(() => { if (countFilter && !countOpts.includes(countFilter)) setCountFilter(""); }, [countFilter, countOpts]);
  useEffect(() => { if (micronFilter && !micronOpts.includes(micronFilter)) setMicronFilter(""); }, [micronFilter, micronOpts]);
  useEffect(() => { if (treatmentFilter && !treatmentOpts.includes(treatmentFilter)) setTreatmentFilter(""); }, [treatmentFilter, treatmentOpts]);

  const filteredYarns = useMemo(() => {
    let r = yarns;
    if (nameFilter) r = r.filter((y) => y.yarnName === nameFilter);
    if (countFilter) r = r.filter((y) => y.yarnCount === countFilter);
    if (micronFilter) r = r.filter((y) => y.micron === micronFilter);
    if (treatmentFilter) r = r.filter((y) => (y.treatmentName || "Untreated") === treatmentFilter);
    if (relFilter) r = r.filter((y) => y.relationship === relFilter);
    return r;
  }, [yarns, nameFilter, countFilter, micronFilter, treatmentFilter, relFilter]);

  const toggleYarn = (id: number) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const selectAll = () => {
    const ids = filteredYarns.map((y) => y.id);
    setSelectedIds((prev) => { const next = new Set(prev); ids.forEach((id) => next.add(id)); return [...next]; });
  };

  const clearSelection = () => setSelectedIds([]);

  const selectedYarns = useMemo(() => yarns.filter((y) => selectedIds.includes(y.id)), [yarns, selectedIds]);

  const labelMap = useMemo(() => {
    const m: Record<number, string> = {};
    for (const y of selectedYarns) m[y.id] = yarnLabel(y);
    return m;
  }, [selectedYarns]);

  const chartData = useMemo(() => {
    if (trendData.length === 0) return [];
    const dateMap: Record<string, Record<string, number>> = {};
    for (const p of trendData) {
      if (!dateMap[p.recordDate]) dateMap[p.recordDate] = {};
      const label = labelMap[p.yarnId] || p.yarnName;
      dateMap[p.recordDate][label] = p.price;
    }
    return Object.entries(dateMap).sort(([a], [b]) => a.localeCompare(b)).map(([date, values]) => ({ date, ...values }));
  }, [trendData, labelMap]);

  const lineKeys = useMemo(() => [...new Set(trendData.map((p) => labelMap[p.yarnId] || p.yarnName))], [trendData, labelMap]);

  const yarnStats = useMemo(() => {
    const stats: Record<number, { prices: number[]; dates: string[]; label: string; yarn: Yarn }> = {};
    for (const y of selectedYarns) stats[y.id] = { prices: [], dates: [], label: labelMap[y.id], yarn: y };
    for (const p of trendData) { if (stats[p.yarnId]) { stats[p.yarnId].prices.push(p.price); stats[p.yarnId].dates.push(p.recordDate); } }
    return Object.values(stats).map((s) => {
      const p = s.prices;
      if (p.length === 0) return { ...s, min: 0, max: 0, avg: 0, latest: 0, first: 0, change: 0, pctChange: 0, count: 0 };
      const min = Math.min(...p), max = Math.max(...p), avg = p.reduce((a, b) => a + b, 0) / p.length;
      const latest = p[p.length - 1], first = p[0], change = latest - first, pctChange = first ? (change / first) * 100 : 0;
      return { ...s, min, max, avg, latest, first, change, pctChange, count: p.length };
    });
  }, [selectedYarns, trendData, labelMap]);

  if (yarnsLoading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Trend Analysis</h1>
        <p className="text-sm text-slate-500">Track price trends over time — filter, select, and compare</p>
      </div>

      {/* Filter & Select Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Yarn Name</label>
            <select value={nameFilter} onChange={(e) => setNameFilter(e.target.value)} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All ({nameOpts.length})</option>
              {nameOpts.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Yarn Count</label>
            <select value={countFilter} onChange={(e) => setCountFilter(e.target.value)} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All ({countOpts.length})</option>
              {countOpts.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Micron</label>
            <select value={micronFilter} onChange={(e) => setMicronFilter(e.target.value)} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All ({micronOpts.length})</option>
              {micronOpts.map((m) => <option key={m} value={m}>{parseFloat(m).toFixed(1)}μm</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Treatment</label>
            <select value={treatmentFilter} onChange={(e) => setTreatmentFilter(e.target.value)} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All ({treatmentOpts.length})</option>
              {treatmentOpts.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Factory Type</label>
            <select value={relFilter} onChange={(e) => setRelFilter(e.target.value)} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All</option>
              <option value="My Factory">My Factory</option>
              <option value="Competitor Factory">Competitor</option>
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button onClick={selectAll} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors whitespace-nowrap">
              + Add All ({filteredYarns.length})
            </button>
            {selectedIds.length > 0 && (
              <button onClick={clearSelection} className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-300 transition-colors whitespace-nowrap">Clear</button>
            )}
          </div>
        </div>

        {/* Yarn chips */}
        <div className="border-t border-slate-100 pt-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium text-slate-500">Select yarns to compare ({filteredYarns.length} available, {selectedIds.length} selected):</span>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
            {filteredYarns.map((y) => {
              const active = selectedIds.includes(y.id);
              const treat = y.treatmentName && y.treatmentName !== "Untreated" ? y.treatmentName : "";
              return (
                <button
                  key={y.id}
                  onClick={() => toggleYarn(y.id)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                    active ? "bg-blue-100 text-blue-800 border-blue-300" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${y.relationship === "My Factory" ? "bg-blue-500" : "bg-red-500"}`} />
                  {y.yarnName}
                  <span className="text-[10px] opacity-60">
                    {y.yarnCount || ""} {y.micron ? y.micron + "μm" : ""}{treat ? " · " + treat : ""}
                  </span>
                  {active && <span className="ml-0.5 opacity-50">✕</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Chart + Stats */}
      {selectedIds.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <svg className="w-12 h-12 text-slate-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <polyline strokeLinecap="round" strokeLinejoin="round" points="23 6 13.5 15.5 8.5 10.5 1 18" />
            <polyline strokeLinecap="round" strokeLinejoin="round" points="17 6 23 6 23 12" />
          </svg>
          <h3 className="text-lg font-medium text-slate-600">Select yarns to view price trends</h3>
          <p className="text-sm text-slate-400 mt-1">Use the filters above, then click yarn chips to add them</p>
        </div>
      ) : trendLoading ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-16 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {chartData.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
              <h3 className="font-semibold text-slate-900 mb-4">Price Trend</h3>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748b" }} tickFormatter={(v: string) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 11, fill: "#64748b" }} tickFormatter={(v: number) => v.toFixed(0)} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
                    formatter={(value) => [`$${Number(value).toFixed(2)}`]}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Legend wrapperStyle={{ fontSize: 10, lineHeight: "18px" }} />
                  {lineKeys.map((key, i) => (
                    <Line key={key} type="monotone" dataKey={key} stroke={COLORS[i % COLORS.length]} strokeWidth={2}
                      dot={{ r: 4, fill: COLORS[i % COLORS.length] }} activeDot={{ r: 6 }} connectNulls />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Stats cards */}
          {yarnStats.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {yarnStats.map((s, i) => (
                <div key={s.yarn.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                  <div className="flex items-start gap-2 mb-3">
                    <span className="w-3 h-3 rounded-full shrink-0 mt-0.5" style={{ background: COLORS[i % COLORS.length] }} />
                    <div className="min-w-0">
                      <div className="font-semibold text-sm truncate">{s.yarn.yarnName}</div>
                      <div className="text-xs text-slate-500 truncate">{s.yarn.factoryName} · {s.yarn.yarnCount || "—"} · {s.yarn.micron ? s.yarn.micron + "μm" : "—"}</div>
                      <div className="text-xs text-slate-400 truncate">Treatment: {s.yarn.treatmentName || "Untreated"}</div>
                    </div>
                  </div>
                  {s.count === 0 ? (
                    <div className="text-xs text-slate-400">No price data</div>
                  ) : (
                    <>
                      <div className="grid grid-cols-4 gap-2 text-center">
                        <div><div className="text-[10px] text-slate-500 uppercase">Latest</div><div className="text-sm font-bold font-mono">${s.latest.toFixed(2)}</div></div>
                        <div><div className="text-[10px] text-slate-500 uppercase">Min</div><div className="text-sm font-mono text-green-700">${s.min.toFixed(2)}</div></div>
                        <div><div className="text-[10px] text-slate-500 uppercase">Max</div><div className="text-sm font-mono text-red-600">${s.max.toFixed(2)}</div></div>
                        <div><div className="text-[10px] text-slate-500 uppercase">Avg</div><div className="text-sm font-mono">${s.avg.toFixed(2)}</div></div>
                      </div>
                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs text-slate-500">{s.count} records</span>
                        <span className={`text-xs font-medium ${s.change > 0 ? "text-red-500" : s.change < 0 ? "text-green-600" : "text-slate-500"}`}>
                          {s.change > 0 ? "+" : ""}{s.change.toFixed(2)} ({s.pctChange > 0 ? "+" : ""}{s.pctChange.toFixed(1)}%)
                        </span>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Data table */}
          {chartData.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="p-4 border-b border-slate-200">
                <h3 className="font-semibold text-slate-900">Price Data</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-left text-slate-600">
                      <th className="px-4 py-2.5 font-medium">Date</th>
                      {lineKeys.map((k, i) => (
                        <th key={k} className="px-4 py-2.5 font-medium text-right">
                          <span className="inline-flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                            <span className="truncate max-w-[140px]" title={k}>{k.split(" · ")[0]}</span>
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {chartData.map((d) => (
                      <tr key={d.date} className="border-t border-slate-100 hover:bg-slate-50">
                        <td className="px-4 py-2 text-slate-600">{d.date}</td>
                        {lineKeys.map((k) => {
                          const val = (d as Record<string, unknown>)[k] as number | undefined;
                          return (
                            <td key={k} className="px-4 py-2 text-right font-mono">
                              {val !== undefined ? `$${val.toFixed(2)}` : <span className="text-slate-300">—</span>}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
