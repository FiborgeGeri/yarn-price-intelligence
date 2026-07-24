"use client";
import { useState, useEffect, useMemo } from "react";
import { Permissions } from "@/lib/permissions";

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

interface Props {
  permissions: Permissions;
}

export default function PriceHistoryPage({ permissions }: Props) {
  const [prices, setPrices] = useState<PriceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [relFilter, setRelFilter] = useState("all");

  useEffect(() => {
    fetch("/api/prices")
      .then((r) => r.json())
      .then((d) => { setPrices(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let result = prices;
    if (relFilter !== "all") {
      result = result.filter((p) => p.relationship === relFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((p) =>
        p.yarnName?.toLowerCase().includes(q) ||
        p.factoryName?.toLowerCase().includes(q) ||
        p.yarnCount?.toLowerCase().includes(q) ||
        p.treatmentName?.toLowerCase().includes(q) ||
        p.micron?.includes(q)
      );
    }
    return result;
  }, [prices, search, relFilter]);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this price record?")) return;
    await fetch(`/api/prices?id=${id}`, { method: "DELETE" });
    setPrices(prices.filter((p) => p.id !== id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Price History</h1>
          <p className="text-sm text-slate-500">{filtered.length} records</p>
        </div>
        <div className="flex gap-2">
          <a
            href="/api/export?type=prices"
            className="px-3 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300 transition-colors"
          >
            Export CSV
          </a>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Search yarn, factory, count, micron, treatment..."
        />
        <select
          value={relFilter}
          onChange={(e) => setRelFilter(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Factories</option>
          <option value="My Factory">My Factories</option>
          <option value="Competitor Factory">Competitor Factories</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left text-slate-600">
              <th className="px-4 py-3 font-medium">Yarn</th>
              <th className="px-4 py-3 font-medium">Factory</th>
              <th className="px-4 py-3 font-medium">Count</th>
              <th className="px-4 py-3 font-medium">Micron</th>
              <th className="px-4 py-3 font-medium">Treatment</th>
              <th className="px-4 py-3 font-medium text-right">Price</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Incoterms</th>
              <th className="px-4 py-3 font-medium">Remarks</th>
              {permissions.canDelete && <th className="px-4 py-3 font-medium w-10"></th>}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={permissions.canDelete ? 10 : 9} className="px-4 py-8 text-center text-slate-400">No price records found</td></tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${p.relationship === "My Factory" ? "bg-blue-500" : "bg-red-500"}`} />
                      <span className="font-medium">{p.yarnName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{p.factoryName}</td>
                  <td className="px-4 py-3 text-slate-600">{p.yarnCount || "—"}</td>
                  <td className="px-4 py-3">{p.micron ? `${parseFloat(p.micron).toFixed(1)}μm` : "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{p.treatmentName || "Untreated"}</td>
                  <td className="px-4 py-3 text-right font-mono font-medium">
                    {p.currency} {p.price.toFixed(2)}<span className="text-slate-400 font-normal text-xs">/{(p.unit || "per KG").replace("per ", "")}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{p.recordDate}</td>
                  <td className="px-4 py-3 text-slate-600">{p.incoterms || "—"}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs max-w-[150px] truncate">{p.remarks || "—"}</td>
                  {permissions.canDelete && (
                    <td className="px-4 py-3">
                      <button onClick={() => handleDelete(p.id)} className="text-red-500 hover:text-red-700 text-xs">✕</button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
