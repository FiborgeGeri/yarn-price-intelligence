"use client";
import { useState, useEffect } from "react";
import { Permissions } from "@/lib/permissions";
import { IconFactory, IconSearch, IconDollar, IconStar, IconTrendUp, IconYarn, IconPlus, IconClipboard } from "@/components/Icons";

interface Mover {
  yarnId: number; yarnName: string; factoryName: string; relationship: string;
  yarnCount: string; micron: string; latestPrice: number; prevPrice: number;
  currency: string; unit: string; change: number; pctChange: number; date: string;
}
interface NoPriceYarn {
  yarnId: number; yarnName: string; factoryName: string; relationship: string;
  yarnCount: string; micron: string;
}
interface StalePrice {
  yarnId: number; yarnName: string; factoryName: string; relationship: string;
  lastDate: string; lastPrice: number; currency: string; unit: string;
}
interface RecentPrice {
  id: number; price: number; currency: string; unit: string; recordDate: string;
  yarnName: string; yarnCount: string; micron: string; factoryName: string;
  relationship: string; incoterms: string;
}

interface DashboardData {
  kpi: {
    myFactories: number; competitorFactories: number; totalYarns: number;
    pricesThisWeek: number; pricesTrend: number; myYarnCount: number;
    compYarnCount: number; competitorCountries: number; superGradesCount: number;
    totalPriceRecords: number; yarnsWithPrices: number;
    yarnsWithoutPrices: number; stalePriceCount: number;
  };
  movers: Mover[];
  yarnsNoPrice: NoPriceYarn[];
  stalePrices: StalePrice[];
  recentPrices: RecentPrice[];
}

function getMicronGrade(m: number) {
  if (m < 15) return "Ultra Fine";
  if (m <= 16.5) return "Super 150's-180's";
  if (m <= 18.5) return "Super 100's-130's";
  if (m <= 20) return "Super 80's-90's";
  if (m <= 23) return "Medium";
  return "Strong";
}
function getMicronColor(grade: string) {
  switch (grade) {
    case "Ultra Fine": return "bg-purple-100 text-purple-800";
    case "Super 150's-180's": return "bg-indigo-100 text-indigo-800";
    case "Super 100's-130's": return "bg-blue-100 text-blue-800";
    case "Super 80's-90's": return "bg-green-100 text-green-800";
    case "Medium": return "bg-yellow-100 text-yellow-800";
    case "Strong": return "bg-orange-100 text-orange-800";
    default: return "bg-slate-100 text-slate-800";
  }
}

interface Props { onNavigate: (page: string) => void; permissions: Permissions; }

export default function DashboardPage({ onNavigate, permissions }: Props) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/dashboard?ts=${Date.now()}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, []);

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (error || !data) return <div className="flex flex-col items-center justify-center py-16 text-slate-500"><div className="text-lg font-medium">Failed to load dashboard</div></div>;

  const { kpi } = data;

  return (
    <div>
      {/* Header + Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500">Yarn Price Intelligence Overview</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => onNavigate("search")} className="px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-sm">
            <IconSearch className="w-4 h-4" /> Search
          </button>
          {permissions.canEdit && (
            <button onClick={() => onNavigate("add-price")} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-1.5 shadow-sm">
              <IconPlus className="w-4 h-4" /> Add Price
            </button>
          )}
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <button onClick={() => onNavigate("yarns")} className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 text-left hover:border-blue-300 transition-colors group">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-500 uppercase tracking-wide">Total Yarns</span>
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors"><IconYarn className="w-4 h-4 text-blue-600" /></div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{kpi.totalYarns}</div>
          <div className="text-xs text-slate-500 mt-0.5">{kpi.myYarnCount} mine · {kpi.compYarnCount} competitor</div>
        </button>

        <button onClick={() => onNavigate("factories")} className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 text-left hover:border-blue-300 transition-colors group">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-500 uppercase tracking-wide">Factories</span>
            <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center group-hover:bg-green-100 transition-colors"><IconFactory className="w-4 h-4 text-green-600" /></div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{kpi.myFactories + kpi.competitorFactories}</div>
          <div className="text-xs text-slate-500 mt-0.5">{kpi.myFactories} mine · {kpi.competitorFactories} competitor</div>
        </button>

        <button onClick={() => onNavigate("price-history")} className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 text-left hover:border-blue-300 transition-colors group">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-500 uppercase tracking-wide">Price Records</span>
            <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center group-hover:bg-amber-100 transition-colors"><IconDollar className="w-4 h-4 text-amber-600" /></div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{kpi.totalPriceRecords}</div>
          <div className="text-xs text-slate-500 mt-0.5">
            {kpi.pricesThisWeek} this week
            {kpi.pricesTrend !== 0 && (
              <span className={kpi.pricesTrend > 0 ? "text-green-600 ml-1" : "text-red-500 ml-1"}>
                {kpi.pricesTrend > 0 ? "+" : ""}{kpi.pricesTrend}
              </span>
            )}
          </div>
        </button>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-500 uppercase tracking-wide">Coverage</span>
            <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center"><IconStar className="w-4 h-4 text-purple-600" /></div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{kpi.yarnsWithPrices}<span className="text-sm font-normal text-slate-400">/{kpi.totalYarns}</span></div>
          <div className="text-xs text-slate-500 mt-0.5">yarns with prices · {kpi.superGradesCount} super grades</div>
        </div>
      </div>

      {/* Alerts Row */}
      {(kpi.yarnsWithoutPrices > 0 || kpi.stalePriceCount > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {kpi.yarnsWithoutPrices > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                <div className="text-sm font-semibold text-amber-900">{kpi.yarnsWithoutPrices} yarn(s) without any price</div>
                <p className="text-xs text-amber-700 mt-0.5">These yarns have no price records yet. Add prices to include them in analysis.</p>
              </div>
            </div>
          )}
          {kpi.stalePriceCount > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              </div>
              <div>
                <div className="text-sm font-semibold text-orange-900">{kpi.stalePriceCount} yarn(s) with stale prices</div>
                <p className="text-xs text-orange-700 mt-0.5">Latest price is over 30 days old. Consider updating.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Content: 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3): Price Movers + Recent Prices */}
        <div className="lg:col-span-2 space-y-6">

          {/* Price Movers */}
          {data.movers.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="p-4 border-b border-slate-200 flex items-center gap-2">
                <IconTrendUp className="w-4 h-4 text-slate-500" />
                <h2 className="font-semibold text-slate-900">Price Movers</h2>
                <span className="text-xs text-slate-500">Latest vs previous price</span>
              </div>
              <div className="divide-y divide-slate-100">
                {data.movers.map((m) => (
                  <div key={m.yarnId} className="px-4 py-3 flex items-center gap-3 hover:bg-slate-50">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${m.relationship === "My Factory" ? "bg-blue-500" : "bg-red-500"}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{m.yarnName}</div>
                      <div className="text-xs text-slate-500">{m.factoryName} · {m.yarnCount || "—"} · {m.micron ? m.micron + "μm" : "—"}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-mono font-medium">{m.currency} {m.latestPrice.toFixed(2)}<span className="text-slate-400 text-xs font-normal">/{(m.unit).replace("per ","")}</span></div>
                      <div className={`text-xs font-medium ${m.change > 0 ? "text-red-500" : "text-green-600"}`}>
                        {m.change > 0 ? "+" : ""}{m.change.toFixed(2)} ({m.pctChange > 0 ? "+" : ""}{m.pctChange.toFixed(1)}%)
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Prices */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IconClipboard className="w-4 h-4 text-slate-500" />
                <h2 className="font-semibold text-slate-900">Recent Prices</h2>
              </div>
              <button onClick={() => onNavigate("price-history")} className="text-xs text-blue-600 hover:underline">View All</button>
            </div>
            {data.recentPrices.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                No prices recorded yet.
                {permissions.canEdit && (
                  <button onClick={() => onNavigate("add-price")} className="block mx-auto mt-2 text-blue-600 hover:underline text-sm">Add your first price</button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-left text-slate-600">
                      <th className="px-4 py-2.5 font-medium">Yarn</th>
                      <th className="px-4 py-2.5 font-medium">Factory</th>
                      <th className="px-4 py-2.5 font-medium">Count</th>
                      <th className="px-4 py-2.5 font-medium">Micron</th>
                      <th className="px-4 py-2.5 font-medium text-right">Price</th>
                      <th className="px-4 py-2.5 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentPrices.map((p) => {
                      const micronVal = p.micron ? parseFloat(p.micron) : null;
                      const grade = micronVal ? getMicronGrade(micronVal) : null;
                      return (
                        <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50">
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full shrink-0 ${p.relationship === "My Factory" ? "bg-blue-500" : "bg-red-500"}`} />
                              <span className="font-medium">{p.yarnName}</span>
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-slate-600 text-xs">{p.factoryName}</td>
                          <td className="px-4 py-2.5 text-slate-600">{p.yarnCount || "—"}</td>
                          <td className="px-4 py-2.5">
                            {micronVal ? (
                              <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${getMicronColor(grade!)}`}>
                                {micronVal.toFixed(1)}μm
                              </span>
                            ) : "—"}
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono font-medium">
                            {p.currency} {p.price.toFixed(2)}<span className="text-slate-400 font-normal text-xs">/{(p.unit || "per KG").replace("per ", "")}</span>
                          </td>
                          <td className="px-4 py-2.5 text-slate-500 text-xs">{p.recordDate}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1/3): Attention items */}
        <div className="space-y-6">
          {/* Needs Attention: No Price */}
          {data.yarnsNoPrice.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="p-4 border-b border-slate-200">
                <h3 className="font-semibold text-sm text-slate-900">Needs Price</h3>
                <p className="text-xs text-slate-500 mt-0.5">Yarns without any price record</p>
              </div>
              <div className="divide-y divide-slate-100">
                {data.yarnsNoPrice.map((y) => (
                  <div key={y.yarnId} className="px-4 py-2.5 flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${y.relationship === "My Factory" ? "bg-blue-500" : "bg-red-500"}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{y.yarnName}</div>
                      <div className="text-xs text-slate-500 truncate">{y.factoryName} · {y.yarnCount || "—"} · {y.micron ? y.micron + "μm" : "—"}</div>
                    </div>
                    {permissions.canEdit && (
                      <button onClick={() => onNavigate("add-price")} className="text-xs text-blue-600 hover:underline shrink-0">Add</button>
                    )}
                  </div>
                ))}
              </div>
              {kpi.yarnsWithoutPrices > data.yarnsNoPrice.length && (
                <div className="px-4 py-2 border-t border-slate-100 text-center">
                  <button onClick={() => onNavigate("yarns")} className="text-xs text-blue-600 hover:underline">
                    +{kpi.yarnsWithoutPrices - data.yarnsNoPrice.length} more
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Stale Prices */}
          {data.stalePrices.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="p-4 border-b border-slate-200">
                <h3 className="font-semibold text-sm text-slate-900">Stale Prices</h3>
                <p className="text-xs text-slate-500 mt-0.5">Last updated over 30 days ago</p>
              </div>
              <div className="divide-y divide-slate-100">
                {data.stalePrices.map((s) => (
                  <div key={s.yarnId} className="px-4 py-2.5 flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${s.relationship === "My Factory" ? "bg-blue-500" : "bg-red-500"}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{s.yarnName}</div>
                      <div className="text-xs text-slate-500 truncate">
                        {s.currency} {s.lastPrice.toFixed(2)} · last {s.lastDate}
                      </div>
                    </div>
                    {permissions.canEdit && (
                      <button onClick={() => onNavigate("add-price")} className="text-xs text-blue-600 hover:underline shrink-0">Update</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Links */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <h3 className="font-semibold text-sm text-slate-900 mb-3">Quick Links</h3>
            <div className="space-y-1.5">
              {[
                { key: "comparison", label: "Price Comparison", icon: <IconSearch className="w-4 h-4" /> },
                { key: "trends", label: "Trend Analysis", icon: <IconTrendUp className="w-4 h-4" /> },
                { key: "micron", label: "Micron Analysis", icon: <IconStar className="w-4 h-4" /> },
              ].map((l) => (
                <button
                  key={l.key}
                  onClick={() => onNavigate(l.key)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
                >
                  <span className="text-slate-400">{l.icon}</span>
                  {l.label}
                  <svg className="w-3.5 h-3.5 text-slate-300 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polyline points="9 18 15 12 9 6" /></svg>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
