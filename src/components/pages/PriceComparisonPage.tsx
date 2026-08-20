"use client";
import { useState, useEffect, useMemo } from "react";

// ── conversion helpers ──
// Normalize any price to "per KG" so diffs are always apples-to-apples.
const LB_PER_KG = 2.20462;

function toPerKg(price: number, unit: string): number {
  const u = (unit || "per KG").toLowerCase();
  if (u.includes("lb")) return price * LB_PER_KG; // price/LB × LB/KG = price/KG
  return price; // already per KG (or per Cone – treat as-is)
}

// ── types ──
interface PricedYarn {
  yarnName: string;
  factoryName: string;
  yarnCount: string;
  micron: string;
  treatment: string;
  price: number;
  currency: string;
  unit: string;
  date: string;
}

interface MatchRow {
  micron: string;
  yarnCount: string;
  treatment: string;
  myYarnName: string;
  myFactory: string;
  myPrice: number;
  myCurrency: string;
  myUnit: string;
  myDate: string;
  compYarnName: string;
  compFactory: string;
  compPrice: number;
  compCurrency: string;
  compUnit: string;
  compDate: string;
}

interface CompData {
  matches: MatchRow[];
  myYarns: PricedYarn[];
  compYarns: PricedYarn[];
}

export default function PriceComparisonPage() {
  const [data, setData] = useState<CompData | null>(null);
  const [loading, setLoading] = useState(true);
  const [micronFilter, setMicronFilter] = useState("");
  const [countFilter, setCountFilter] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"price-asc" | "price-desc" | "name" | "micron">("price-asc");
  const [showSectors, setShowSectors] = useState(true);

  useEffect(() => {
    fetch("/api/comparison")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // ── derived filter options ──
  const microns = useMemo(() => {
    if (!data) return [];
    const all = [...data.myYarns.map((y) => y.micron), ...data.compYarns.map((y) => y.micron)].filter(Boolean);
    return [...new Set(all)].sort((a, b) => parseFloat(a) - parseFloat(b));
  }, [data]);

  const counts = useMemo(() => {
    if (!data) return [];
    const all = [...data.myYarns.map((y) => y.yarnCount), ...data.compYarns.map((y) => y.yarnCount)].filter(Boolean);
    return [...new Set(all)].sort();
  }, [data]);

  // ── filtered lists ──
  const applyFilter = (list: PricedYarn[]) => {
    let r = list;
    if (micronFilter) r = r.filter((y) => y.micron === micronFilter);
    if (countFilter) r = r.filter((y) => y.yarnCount === countFilter);
    if (search.trim()) {
      const s = search.toLowerCase();
      r = r.filter((y) =>
        y.yarnName?.toLowerCase().includes(s) ||
        y.factoryName?.toLowerCase().includes(s) ||
        y.yarnCount?.toLowerCase().includes(s) ||
        y.treatment?.toLowerCase().includes(s) ||
        (y.micron || "").includes(s)
      );
    }
    const sorted = [...r];
    if (sortBy === "price-asc") sorted.sort((a, b) => toPerKg(a.price, a.unit) - toPerKg(b.price, b.unit));
    else if (sortBy === "price-desc") sorted.sort((a, b) => toPerKg(b.price, b.unit) - toPerKg(a.price, a.unit));
    else if (sortBy === "name") sorted.sort((a, b) => a.yarnName.localeCompare(b.yarnName));
    else sorted.sort((a, b) => parseFloat(a.micron || "99") - parseFloat(b.micron || "99") || a.yarnName.localeCompare(b.yarnName));
    return sorted;
  };

  const filteredMy = useMemo(() => applyFilter(data?.myYarns ?? []), [data, micronFilter, countFilter, search, sortBy]);
  const filteredComp = useMemo(() => applyFilter(data?.compYarns ?? []), [data, micronFilter, countFilter, search, sortBy]);

  const filteredMatches = useMemo(() => {
    if (!data) return [];
    let r = data.matches;
    if (micronFilter) r = r.filter((m) => m.micron === micronFilter);
    if (countFilter) r = r.filter((m) => m.yarnCount === countFilter);
    return r.sort((a, b) => parseFloat(a.micron) - parseFloat(b.micron) || a.yarnCount.localeCompare(b.yarnCount) || a.treatment.localeCompare(b.treatment));
  }, [data, micronFilter, countFilter]);

  // ── render ──
  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (!data || (data.myYarns.length === 0 && data.compYarns.length === 0)) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Price Comparison</h1>
          <p className="text-sm text-slate-500">Compare your yarn prices with competitor prices</p>
        </div>
        <div className="bg-white rounded-xl p-12 shadow-sm border border-slate-200 text-center">
          <svg className="w-12 h-12 text-slate-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M3 9l3-6 3 6M15 9l3-6 3 6M3 9h6M15 9h6" /></svg>
          <h3 className="text-lg font-medium text-slate-700 mb-2">No comparison data available</h3>
          <p className="text-sm text-slate-500">Add prices for both your factory yarns and competitor yarns to see comparisons.</p>
        </div>
      </div>
    );
  }

  // ── sector table helper ──
  const SectorTable = ({ rows, color }: { rows: PricedYarn[]; color: "blue" | "red" }) => (
    <div className={`bg-white rounded-xl shadow-sm border-2 ${color === "blue" ? "border-blue-200" : "border-red-200"}`}>
      {rows.length === 0 ? (
        <div className="p-6 text-center text-slate-400 text-sm">No priced yarns match the current filters</div>
      ) : (
        <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead className="sticky top-0 z-10">
              <tr className={`text-left text-slate-600 ${color === "blue" ? "bg-blue-50" : "bg-red-50"}`}>
                <th className="px-3 py-2.5 font-medium">Yarn</th>
                <th className="px-3 py-2.5 font-medium">Factory</th>
                <th className="px-3 py-2.5 font-medium whitespace-nowrap">Count</th>
                <th className="px-3 py-2.5 font-medium whitespace-nowrap">Micron</th>
                <th className="px-3 py-2.5 font-medium">Treatment</th>
                <th className="px-3 py-2.5 font-medium text-right whitespace-nowrap">Price</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((y, i) => (
                <tr key={i} className={`border-t border-slate-100 ${color === "blue" ? "hover:bg-blue-50/30" : "hover:bg-red-50/30"}`}>
                  <td className="px-3 py-2.5 font-medium">{y.yarnName}</td>
                  <td className="px-3 py-2.5 text-slate-600 text-xs">{y.factoryName}</td>
                  <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{y.yarnCount || "—"}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap">{y.micron ? `${parseFloat(y.micron).toFixed(1)}μm` : "—"}</td>
                  <td className="px-3 py-2.5 text-slate-600">{y.treatment}</td>
                  <td className="px-3 py-2.5 text-right font-mono font-semibold whitespace-nowrap">
                    {y.currency} {y.price.toFixed(2)}<span className="text-slate-400 font-normal text-xs">/{y.unit.replace("per ", "")}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Price Comparison</h1>
        <p className="text-sm text-slate-500">Compare your yarn prices with competitor prices side by side</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm flex-1 min-w-[220px] focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Search yarn, mill, count, treatment..."
        />
        <select value={micronFilter} onChange={(e) => setMicronFilter(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
          <option value="">All Microns</option>
          {microns.map((m) => <option key={m} value={m}>{parseFloat(m).toFixed(1)}μm</option>)}
        </select>
        <select value={countFilter} onChange={(e) => setCountFilter(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
          <option value="">All Counts</option>
          {counts.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
          <option value="price-asc">Sort: Price ↑</option>
          <option value="price-desc">Sort: Price ↓</option>
          <option value="name">Sort: Yarn Name</option>
          <option value="micron">Sort: Micron</option>
        </select>
        <button onClick={() => setShowSectors(!showSectors)} className="px-3 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300">
          {showSectors ? "Hide" : "Show"} Mill Lists
        </button>
        {(micronFilter || countFilter || search) && (
          <button onClick={() => { setMicronFilter(""); setCountFilter(""); setSearch(""); }} className="text-sm text-blue-600 hover:underline">Clear</button>
        )}
      </div>

      {/* Two sectors — stacked full width so price column is always visible */}
      {showSectors && (
        <div className="space-y-6 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-3 h-3 rounded-full bg-blue-500" />
              <h2 className="text-lg font-semibold text-slate-900">My Yarn Mills</h2>
              <span className="text-sm text-slate-500">({filteredMy.length})</span>
            </div>
            <SectorTable rows={filteredMy} color="blue" />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-3 h-3 rounded-full bg-red-500" />
              <h2 className="text-lg font-semibold text-slate-900">Competitor Yarn Mills</h2>
              <span className="text-sm text-slate-500">({filteredComp.length})</span>
            </div>
            <SectorTable rows={filteredComp} color="red" />
          </div>
        </div>
      )}

      {/* Head-to-Head */}
      {filteredMatches.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-lg font-semibold text-slate-900">Head-to-Head Comparison</h2>
            <span className="text-sm text-slate-500">(matched by micron + count + treatment)</span>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-slate-600">
                  <th className="px-3 py-3 font-medium">Micron</th>
                  <th className="px-3 py-3 font-medium">Count</th>
                  <th className="px-3 py-3 font-medium">Treatment</th>
                  <th className="pl-3 pr-2 py-3 font-medium">
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500" />My Yarn</span>
                  </th>
                  <th className="px-2 py-3 font-medium text-right">My Price</th>
                  <th className="px-2 py-3 font-medium text-center w-px text-slate-400">vs</th>
                  <th className="px-2 py-3 font-medium text-left">Comp Price</th>
                  <th className="pl-2 pr-3 py-3 font-medium">
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500" />Competitor</span>
                  </th>
                  <th className="px-3 py-3 font-medium text-right">Diff (per KG)</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredMatches.map((m, i) => {
                  // Normalize both to per-KG for a fair comparison
                  const myKg = toPerKg(m.myPrice, m.myUnit);
                  const compKg = toPerKg(m.compPrice, m.compUnit);
                  const diff = myKg - compKg;
                  const pct = compKg ? (diff / compKg) * 100 : 0;
                  const unitsMismatch = m.myUnit !== m.compUnit;

                  return (
                    <tr key={i} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-3 py-3">{parseFloat(m.micron).toFixed(1)}μm</td>
                      <td className="px-3 py-3 text-slate-600">{m.yarnCount}</td>
                      <td className="px-3 py-3 text-slate-600">{m.treatment}</td>
                      <td className="pl-3 pr-2 py-3">
                        <div className="font-medium">{m.myYarnName}</div>
                        <div className="text-xs text-slate-400 font-normal">{m.myFactory}</div>
                      </td>
                      <td className="px-2 py-3 text-right font-mono font-medium text-blue-700">
                        {m.myCurrency} {m.myPrice.toFixed(2)}
                        <span className="text-slate-400 font-normal text-xs">/{m.myUnit.replace("per ", "")}</span>
                      </td>
                      <td className="px-2 py-3 text-center text-slate-300 text-xs">vs</td>
                      <td className="px-2 py-3 text-left font-mono font-medium text-red-600">
                        {m.compCurrency} {m.compPrice.toFixed(2)}
                        <span className="text-slate-400 font-normal text-xs">/{m.compUnit.replace("per ", "")}</span>
                      </td>
                      <td className="pl-2 pr-3 py-3">
                        <div className="font-medium">{m.compYarnName}</div>
                        <div className="text-xs text-slate-400">{m.compFactory}</div>
                      </td>
                      <td className={`px-3 py-3 text-right font-mono text-xs font-medium ${diff < -0.005 ? "text-green-600" : diff > 0.005 ? "text-red-600" : "text-slate-500"}`}>
                        <div>
                          {diff > 0 ? "+" : ""}{diff.toFixed(2)}/KG
                          <span className="text-slate-400 font-normal ml-1">({pct > 0 ? "+" : ""}{pct.toFixed(1)}%)</span>
                        </div>
                        {unitsMismatch && (
                          <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                            normalized: {m.myCurrency} {myKg.toFixed(2)} vs {m.compCurrency} {compKg.toFixed(2)} /KG
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          diff < -0.005 ? "bg-green-100 text-green-800" : diff > 0.005 ? "bg-red-100 text-red-800" : "bg-slate-100 text-slate-600"
                        }`}>
                          {diff < -0.005 ? "Lower" : diff > 0.005 ? "Higher" : "Equal"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Diff = My Price − Competitor Price, both normalized to per KG (1 KG = 2.205 LB).
            Negative (green) = your price is lower. Positive (red) = your price is higher.
          </p>
        </div>
      )}
    </div>
  );
}
