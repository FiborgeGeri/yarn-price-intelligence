"use client";
import { useState, useEffect, useMemo } from "react";

interface Quote {
  id: number; customerName: string; customerCompany: string;
  yarnName: string; yarnCount: string; micron: string; treatmentName: string; factoryName: string;
  costPrice: number; quotedPrice: number; currency: string; unit: string;
  quoteDate: string; status: string;
}

export default function MarginAnalysisPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupBy, setGroupBy] = useState<"yarn" | "customer">("yarn");

  useEffect(() => { fetch("/api/quotations").then((r) => r.json()).then((d) => { setQuotes(d); setLoading(false); }).catch(() => setLoading(false)); }, []);

  const acceptedQuotes = useMemo(() => quotes.filter((q) => q.status === "Accepted"), [quotes]);
  const allActive = useMemo(() => quotes.filter((q) => q.status !== "Rejected" && q.status !== "Expired"), [quotes]);

  const totalRevenue = useMemo(() => allActive.reduce((s, q) => s + q.quotedPrice, 0), [allActive]);
  const totalCost = useMemo(() => allActive.reduce((s, q) => s + q.costPrice, 0), [allActive]);
  const avgMarginPct = totalCost ? ((totalRevenue - totalCost) / totalCost) * 100 : 0;

  const grouped = useMemo(() => {
    const map: Record<string, { label: string; quotes: Quote[]; totalCost: number; totalQuoted: number }> = {};
    for (const q of allActive) {
      const key = groupBy === "yarn" ? `${q.yarnName} · ${q.yarnCount || "—"} · ${q.treatmentName || "Untreated"}` : q.customerName;
      if (!map[key]) map[key] = { label: key, quotes: [], totalCost: 0, totalQuoted: 0 };
      map[key].quotes.push(q);
      map[key].totalCost += q.costPrice;
      map[key].totalQuoted += q.quotedPrice;
    }
    return Object.values(map).sort((a, b) => {
      const ma = a.totalCost ? ((a.totalQuoted - a.totalCost) / a.totalCost) * 100 : 0;
      const mb = b.totalCost ? ((b.totalQuoted - b.totalCost) / b.totalCost) * 100 : 0;
      return mb - ma;
    });
  }, [allActive, groupBy]);

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-[#e5885d] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
        <div><h1 className="text-2xl font-bold text-slate-900">Margin Analysis</h1><p className="text-sm text-slate-500">Analyze profitability across yarns and customers</p></div>
        <select value={groupBy} onChange={(e) => setGroupBy(e.target.value as "yarn" | "customer")} className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">
          <option value="yarn">Group by Yarn</option><option value="customer">Group by Client</option>
        </select>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
          <div className="text-xs text-slate-500 uppercase">Total Quotes</div>
          <div className="text-2xl font-bold text-slate-900">{quotes.length}</div>
          <div className="text-xs text-slate-500">{acceptedQuotes.length} accepted</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
          <div className="text-xs text-slate-500 uppercase">Avg Cost</div>
          <div className="text-2xl font-bold text-slate-900">{allActive.length ? (totalCost / allActive.length).toFixed(2) : "—"}</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
          <div className="text-xs text-slate-500 uppercase">Avg Quoted</div>
          <div className="text-2xl font-bold text-slate-900">{allActive.length ? (totalRevenue / allActive.length).toFixed(2) : "—"}</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
          <div className="text-xs text-slate-500 uppercase">Avg Margin</div>
          <div className={`text-2xl font-bold ${avgMarginPct > 0 ? "text-green-600" : "text-red-500"}`}>{avgMarginPct.toFixed(1)}%</div>
        </div>
      </div>

      {/* Grouped breakdown */}
      {allActive.length === 0 ? (
        <div className="bg-white rounded-xl p-12 shadow-sm border border-slate-200 text-center">
          <h3 className="text-lg font-medium text-slate-600">No active quotations</h3>
          <p className="text-sm text-slate-400 mt-1">Create some quotations first to see margin analysis</p>
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map((g) => {
            const margin = g.totalQuoted - g.totalCost;
            const pct = g.totalCost ? (margin / g.totalCost) * 100 : 0;
            const avgCost = g.totalCost / g.quotes.length;
            const avgQuoted = g.totalQuoted / g.quotes.length;
            return (
              <div key={g.label} className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-semibold text-slate-900">{g.label}</div>
                    <div className="text-xs text-slate-500">{g.quotes.length} quote(s)</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold font-mono ${pct > 0 ? "text-green-600" : "text-red-500"}`}>{pct > 0 ? "+" : ""}{pct.toFixed(1)}%</div>
                    <div className="text-xs text-slate-500">avg margin</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center text-sm">
                  <div><div className="text-xs text-slate-500">Avg Cost</div><div className="font-mono">{avgCost.toFixed(2)}</div></div>
                  <div><div className="text-xs text-slate-500">Avg Quoted</div><div className="font-mono font-medium">{avgQuoted.toFixed(2)}</div></div>
                  <div><div className="text-xs text-slate-500">Avg Margin</div><div className={`font-mono font-medium ${margin > 0 ? "text-green-600" : "text-red-500"}`}>{(avgQuoted - avgCost).toFixed(2)}</div></div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
