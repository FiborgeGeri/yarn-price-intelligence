"use client";
import { useState, useEffect, useMemo } from "react";

interface Yarn {
  id: number; yarnName: string; factoryName: string; micron: string;
  yarnCount: string; relationship: string; treatmentName: string;
}

interface PriceRow {
  id: number; yarnId: number; price: number; currency: string;
  recordDate: string; yarnName: string; micron: string;
  factoryName: string; relationship: string; yarnCount: string;
}

function getMicronGrade(m: number) {
  if (m < 15) return "Ultra Fine";
  if (m <= 16.5) return "Super 150's-180's";
  if (m <= 18.5) return "Super 100's-130's";
  if (m <= 20) return "Super 80's-90's";
  if (m <= 23) return "Medium";
  return "Strong";
}

function getGradeColor(grade: string) {
  switch (grade) {
    case "Ultra Fine": return "bg-purple-100 text-purple-800 border-purple-200";
    case "Super 150's-180's": return "bg-indigo-100 text-indigo-800 border-indigo-200";
    case "Super 100's-130's": return "bg-blue-100 text-blue-800 border-blue-200";
    case "Super 80's-90's": return "bg-green-100 text-green-800 border-green-200";
    case "Medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "Strong": return "bg-orange-100 text-orange-800 border-orange-200";
    default: return "bg-slate-100 text-slate-800 border-slate-200";
  }
}

export default function MicronAnalysisPage() {
  const [prices, setPrices] = useState<PriceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("micron-asc");

  useEffect(() => {
    fetch("/api/prices")
      .then((r) => r.json())
      .then((d) => { setPrices(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Group by micron grade
  const gradeData = useMemo(() => {
    const groups: Record<string, { grade: string; yarns: PriceRow[]; minPrice: number; maxPrice: number; avgPrice: number }> = {};
    for (const p of prices) {
      if (!p.micron) continue;
      const grade = getMicronGrade(parseFloat(p.micron));
      if (!groups[grade]) {
        groups[grade] = { grade, yarns: [], minPrice: Infinity, maxPrice: 0, avgPrice: 0 };
      }
      groups[grade].yarns.push(p);
      groups[grade].minPrice = Math.min(groups[grade].minPrice, p.price);
      groups[grade].maxPrice = Math.max(groups[grade].maxPrice, p.price);
    }
    for (const g of Object.values(groups)) {
      g.avgPrice = g.yarns.reduce((sum, y) => sum + y.price, 0) / g.yarns.length;
    }
    return Object.values(groups).sort((a, b) => a.minPrice - b.minPrice);
  }, [prices]);

  const micronValues = useMemo(() => {
    return [...new Set(prices.map((p) => p.micron).filter(Boolean))]
      .map((m) => parseFloat(m))
      .sort((a, b) => a - b);
  }, [prices]);

  const countValues = useMemo(() => {
    return [...new Set(prices.map((p) => p.yarnCount).filter(Boolean))].sort();
  }, [prices]);

  // Sort prices for table
  const sortedPrices = useMemo(() => {
    const arr = prices.filter((p) => p.micron);
    switch (sortBy) {
      case "micron-asc":
        return arr.sort((a, b) => parseFloat(a.micron) - parseFloat(b.micron));
      case "micron-desc":
        return arr.sort((a, b) => parseFloat(b.micron) - parseFloat(a.micron));
      case "price-asc":
        return arr.sort((a, b) => a.price - b.price);
      case "price-desc":
        return arr.sort((a, b) => b.price - a.price);
      default:
        return arr;
    }
  }, [prices, sortBy]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Micron Analysis</h1>
        <p className="text-sm text-slate-500">Analyze yarn prices by micron grade and fineness</p>
      </div>

      {/* Grade summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {gradeData.map((g) => (
          <div key={g.grade} className={`rounded-xl p-4 border ${getGradeColor(g.grade)}`}>
            <div className="font-semibold text-sm">{g.grade}</div>
            <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="opacity-60">Min</span>
                <div className="font-mono font-bold">${g.minPrice.toFixed(2)}</div>
              </div>
              <div>
                <span className="opacity-60">Avg</span>
                <div className="font-mono font-bold">${g.avgPrice.toFixed(2)}</div>
              </div>
              <div>
                <span className="opacity-60">Max</span>
                <div className="font-mono font-bold">${g.maxPrice.toFixed(2)}</div>
              </div>
            </div>
            <div className="text-xs mt-2 opacity-70">{g.yarns.length} price records</div>
          </div>
        ))}
      </div>

      {/* Micron vs Price scatter / table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-semibold">Micron vs Price Detail</h2>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm"
          >
            <option value="micron-asc">Micron ↑</option>
            <option value="micron-desc">Micron ↓</option>
            <option value="price-asc">Price ↑</option>
            <option value="price-desc">Price ↓</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-slate-600">
                <th className="px-4 py-3 font-medium">Yarn</th>
                <th className="px-4 py-3 font-medium">Factory</th>
                <th className="px-4 py-3 font-medium">Count</th>
                <th className="px-4 py-3 font-medium">Micron</th>
                <th className="px-4 py-3 font-medium">Grade</th>
                <th className="px-4 py-3 font-medium text-right">Price</th>
                <th className="px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {sortedPrices.slice(0, 50).map((p) => {
                const grade = getMicronGrade(parseFloat(p.micron));
                return (
                  <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${p.relationship === "My Factory" ? "bg-blue-500" : "bg-red-500"}`} />
                        <span className="font-medium">{p.yarnName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{p.factoryName}</td>
                    <td className="px-4 py-3 text-slate-600">{p.yarnCount || "—"}</td>
                    <td className="px-4 py-3 font-mono">{parseFloat(p.micron).toFixed(1)}μm</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getGradeColor(grade).split(" border")[0]}`}>
                        {grade}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-medium">${p.price.toFixed(2)}</td>
                    <td className="px-4 py-3 text-slate-600">{p.recordDate}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
