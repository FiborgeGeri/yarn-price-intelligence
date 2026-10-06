"use client";
import { useState, useEffect } from "react";
import { Permissions } from "@/lib/permissions";
import {
  ScrollText,
  ShoppingBag,
  ShoppingCart,
  PackageCheck,
  Truck,
  Layers3,
  Database,
  BadgeCheck,
  TimerOff,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Flame,
  Clock,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";

interface Mover {
  yarnId: number;
  yarnName: string;
  factoryName: string;
  relationship: string;
  yarnCount: string;
  micron: string;
  latestPrice: number;
  prevPrice: number;
  currency: string;
  unit: string;
  incoterms: string;
  change: number;
  pctChange: number;
  date: string;
  prevDate: string;
}

interface NoPriceYarn {
  yarnId: number;
  yarnName: string;
  factoryName: string;
  relationship: string;
  yarnCount: string;
  micron: string;
}

interface RecentPrice {
  id: number;
  price: number;
  currency: string | null;
  unit: string | null;
  recordDate: string;
  incoterms: string | null;
  yarnName: string | null;
  yarnCount: string | null;
  factoryName: string | null;
  relationship: string | null;
}

interface DeliveryItem {
  id: number;
  soNo: string | null;
  deliveryDate: string | null;
  status: string | null;
  daysOverdue?: number;
}

interface NewOrder {
  id: number;
  soNo: string | null;
  soDate: string | null;
  status: string | null;
}

interface NewYarn {
  id: number;
  yarnName: string;
  yarnCount: string;
  factoryName: string;
  relationship: string;
}

interface Kpi {
  totalYarns: number;
  pricesThisWeek: number;
  totalPriceRecords: number;
  yarnsWithPrices: number;
  yarnsWithoutPrices: number;
  stalePriceCount: number;
  quotations: number;
  expiringQuotes: number;
  salesOrders: number;
  salesOrdersOpen: number;
  purchaseOrders: number;
  purchaseOrdersOpen: number;
  goodsReceipts: number;
  goodsReceiptsInTransit: number;
  deliveryNotes: number;
  deliveryNotesPending: number;
  overdueCount: number;
  newYarnCount: number;
  newOrderCount: number;
}

interface YarnTrend {
  yarnId: number;
  yarnName: string;
  factoryName: string;
  currency: string;
  priceHistory: Array<{ date: string; price: number }>;
  firstPrice: number;
  latestPrice: number;
  changePct: number;
}

interface DashData {
  kpi: Kpi;
  revenue?: {
    thisMonth: Record<string, number>;
    lastMonth: Record<string, number>;
    thisMonthCost: Record<string, number>;
  };
  statusDistribution?: {
    so: Record<string, number>;
    po: Record<string, number>;
  };
  stageBoard?: {
    distribution: Record<string, number>;
    total: number;
    bottleneck: string;
    stageOrder: string[];
  };
  topYarnTrends?: YarnTrend[];
  movers: Mover[];
  yarnsNoPrice: NoPriceYarn[];
  recentPrices: RecentPrice[];
  upcomingDeliveries: DeliveryItem[];
  overdueDeliveries: DeliveryItem[];
  newOrders: NewOrder[];
  newYarns: NewYarn[];
}

interface Props {
  onNavigate: (page: string) => void;
  permissions: Permissions;
}

const STAT_ICONS: Record<string, LucideIcon> = {
  Quotations: ScrollText,
  "Sales Orders": ShoppingBag,
  "Purchase Orders": ShoppingCart,
  "Goods Receipts": PackageCheck,
  "Delivery Notes": Truck,
  "Total Yarns": Layers3,
  "Price Records": Database,
  "Yarns Priced": BadgeCheck,
  "Stale Prices": TimerOff,
};

const STAGE_COLORS: Record<string, { bg: string; border: string; text: string; bar: string }> = {
  "Order Confirmed": { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", bar: "bg-blue-500" },
  "Lab Dip Confirmed": { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700", bar: "bg-purple-500" },
  "Dyeing": { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", bar: "bg-amber-500" },
  "Lot Confirmed": { bg: "bg-indigo-50", border: "border-indigo-200", text: "text-indigo-700", bar: "bg-indigo-500" },
  "Packing": { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700", bar: "bg-orange-500" },
  "Ready to Ship": { bg: "bg-cyan-50", border: "border-cyan-200", text: "text-cyan-700", bar: "bg-cyan-500" },
  "Ex Mill": { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", bar: "bg-emerald-500" },
};

function StatCard({
  label,
  value,
  sub,
  accent,
  onClick,
  badge,
}: {
  label: string;
  value: number | string;
  sub?: string;
  accent: string;
  onClick?: () => void;
  badge?: string;
}) {
  const Icon = STAT_ICONS[label];
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`group text-left bg-white rounded-2xl border border-slate-200 p-4 shadow-sm transition-all duration-200 ${
        onClick ? "hover:shadow-md hover:border-[#e8b8a0] cursor-pointer" : "cursor-default"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            {Icon && (
              <Icon className="w-3.5 h-3.5 text-[#d89673] group-hover:text-[#d96f3c] transition-colors" strokeWidth={1.8} />
            )}
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 truncate">{label}</span>
          </div>
          <div className={`font-display tnum text-[1.7rem] leading-tight mt-1.5 ${accent}`}>{value}</div>
          {sub && <div className="text-[11px] text-slate-400 mt-0.5 truncate">{sub}</div>}
        </div>
        {badge && (
          <span className="shrink-0 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-[#fdeae2] text-[#b7492f] ring-1 ring-[#f4c9b6]">
            {badge}
          </span>
        )}
      </div>
    </button>
  );
}

function SectionCard({
  title,
  action,
  onAction,
  badge,
  children,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-[linear-gradient(180deg,rgba(255,246,240,0.5),transparent)]">
        <div className="flex items-center gap-2">
          <h3 className="text-[13px] font-semibold tracking-wide text-slate-800">{title}</h3>
          {badge && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-100 text-amber-800 border border-amber-200">
              {badge}
            </span>
          )}
        </div>
        {action && (
          <button onClick={onAction} className="text-xs text-[#d9774d] hover:text-[#a75334] font-medium transition-colors flex items-center gap-0.5">
            <span>{action}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

export default function DashboardPage({ onNavigate, permissions }: Props) {
  const [data, setData] = useState<DashData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/dashboard?ts=${Date.now()}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-4 border-[#e5885d] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data?.kpi) {
    return <div className="text-center py-20 text-slate-400">Unable to load dashboard</div>;
  }

  const k = data.kpi;
  const canOrders = permissions.canViewQuotations;

  // 財務營收試算 (以主要貨幣 USD / 首個有值的貨幣為準)
  const revCurrencies = Object.keys(data.revenue?.thisMonth || {});
  const mainCurrency = revCurrencies.includes("USD") ? "USD" : revCurrencies[0] || "USD";
  const thisMonthRev = data.revenue?.thisMonth?.[mainCurrency] || 0;
  const lastMonthRev = data.revenue?.lastMonth?.[mainCurrency] || 0;
  const revGrowthPct = lastMonthRev > 0 ? Math.round(((thisMonthRev - lastMonthRev) / lastMonthRev) * 100) : null;

  return (
    <div className="space-y-6">
      {/* 標題與簡介 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="font-display text-[1.9rem] text-slate-900 leading-tight">Sales & Sourcing Hub</h1>
          <p className="text-[13px] text-slate-500 mt-0.5">Live operational command center and worsted wool intelligence</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => onNavigate("add-price")}
            className="px-3 py-1.5 bg-[#d97449] hover:bg-[#b7492f] text-white text-xs font-semibold rounded-xl shadow-sm transition-all flex items-center gap-1.5"
          >
            <span>+ Add Price</span>
          </button>
        </div>
      </div>

      {/* 🚨 Alerts 警示條 */}
      {(k.overdueCount > 0 || k.expiringQuotes > 0 || k.stalePriceCount > 0) && (
        <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-3.5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-3 h-3" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900">Action Required</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {k.overdueCount > 0 && (
              <button
                onClick={() => onNavigate("sales-orders")}
                className="flex items-center justify-between p-2 rounded-xl bg-white border border-red-200 hover:bg-red-50/50 text-left transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 shrink-0 animate-pulse" />
                  <span className="text-xs text-slate-700 font-medium">{k.overdueCount} Overdue Deliveries</span>
                </div>
                <ArrowRight className="w-3 h-3 text-slate-400" />
              </button>
            )}
            {k.expiringQuotes > 0 && (
              <button
                onClick={() => onNavigate("quotations")}
                className="flex items-center justify-between p-2 rounded-xl bg-white border border-amber-200 hover:bg-amber-50/50 text-left transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  <span className="text-xs text-slate-700 font-medium">{k.expiringQuotes} Quotes Expiring (14d)</span>
                </div>
                <ArrowRight className="w-3 h-3 text-slate-400" />
              </button>
            )}
            {k.stalePriceCount > 0 && (
              <button
                onClick={() => onNavigate("price-history")}
                className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-left transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
                  <span className="text-xs text-slate-700 font-medium">{k.stalePriceCount} Stale Prices (&gt;30d)</span>
                </div>
                <ArrowRight className="w-3 h-3 text-slate-400" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* 💰 模組 1：財務與核心營運 KPI Hero 卡片 */}
      {canOrders && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 本月營收 */}
          <div className="bg-gradient-to-br from-emerald-500 to-teal-700 rounded-2xl p-4 text-white shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-100">Monthly Revenue</span>
              <DollarSign className="w-4 h-4 text-emerald-200" />
            </div>
            <div className="my-2">
              <div className="text-2xl font-bold font-mono">
                {mainCurrency} {thisMonthRev.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </div>
              <div className="text-xs text-emerald-100 mt-0.5 flex items-center gap-1">
                {revGrowthPct !== null ? (
                  <>
                    {revGrowthPct >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    <span>{revGrowthPct >= 0 ? `+${revGrowthPct}%` : `${revGrowthPct}%`} vs last month</span>
                  </>
                ) : (
                  <span>Based on active invoices</span>
                )}
              </div>
            </div>
            <button onClick={() => onNavigate("invoices")} className="text-[11px] text-emerald-100 hover:text-white font-medium underline text-left">
              View Invoices →
            </button>
          </div>

          {/* 待出貨/進行中訂單 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active Sales Orders</span>
              <ShoppingBag className="w-4 h-4 text-[#d97449]" />
            </div>
            <div className="my-2">
              <div className="text-2xl font-bold text-slate-800 font-mono">{k.salesOrdersOpen}</div>
              <div className="text-xs text-slate-500 mt-0.5">{k.salesOrders} total orders in system</div>
            </div>
            <button onClick={() => onNavigate("sales-orders")} className="text-[11px] text-[#d97449] hover:underline font-medium text-left">
              Open Sales Orders →
            </button>
          </div>

          {/* 進行中採購單 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active Mill POs</span>
              <ShoppingCart className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="my-2">
              <div className="text-2xl font-bold text-slate-800 font-mono">{k.purchaseOrdersOpen}</div>
              <div className="text-xs text-slate-500 mt-0.5">{k.goodsReceiptsInTransit} incoming shipments in transit</div>
            </div>
            <button onClick={() => onNavigate("purchase-orders")} className="text-[11px] text-indigo-600 hover:underline font-medium text-left">
              Open Purchase Orders →
            </button>
          </div>

          {/* 待出貨單 (Delivery Notes Pending) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pending Deliveries</span>
              <Truck className="w-4 h-4 text-cyan-500" />
            </div>
            <div className="my-2">
              <div className="text-2xl font-bold text-slate-800 font-mono">{k.deliveryNotesPending}</div>
              <div className="text-xs text-slate-500 mt-0.5">{k.deliveryNotes} delivery notes total</div>
            </div>
            <button onClick={() => onNavigate("delivery-notes")} className="text-[11px] text-cyan-600 hover:underline font-medium text-left">
              Manage Deliveries →
            </button>
          </div>
        </div>
      )}

      {/* 🏭 模組 2：生產進度看板（Stage Board & Bottleneck） */}
      {canOrders && data.stageBoard && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-800">Production Stage Pipeline</h3>
              <span className="text-xs text-slate-500 font-medium">({data.stageBoard.total} active items across open orders)</span>
            </div>
            {data.stageBoard.bottleneck && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                <Flame className="w-3.5 h-3.5 text-amber-600" />
                <span>Bottleneck: <strong>{data.stageBoard.bottleneck}</strong> ({data.stageBoard.distribution[data.stageBoard.bottleneck]} items)</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {data.stageBoard.stageOrder.map((stage) => {
              const count = data.stageBoard?.distribution[stage] || 0;
              const isBottleneck = stage === data.stageBoard?.bottleneck && count > 0;
              const theme = STAGE_COLORS[stage] || STAGE_COLORS["Order Confirmed"];
              const pct = data.stageBoard?.total ? Math.round((count / data.stageBoard.total) * 100) : 0;

              return (
                <div
                  key={stage}
                  className={`p-2.5 rounded-xl border transition-all ${
                    isBottleneck ? "border-amber-400 bg-amber-50/40 ring-2 ring-amber-200" : `${theme.border} ${theme.bg}`
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[10px] font-bold uppercase truncate ${theme.text}`}>{stage}</span>
                    <span className="text-xs font-bold font-mono text-slate-800">{count}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200/80 rounded-full overflow-hidden mt-1.5">
                    <div className={`h-full rounded-full ${theme.bar}`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="text-[9px] text-slate-400 text-right mt-1 font-mono">{pct}% of active</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 📈 模組 3 & 5：訂單狀態分佈 + 核心紗線價格趨勢 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* SO / PO 狀態分佈 */}
        {canOrders && (
          <SectionCard title="Order Status Breakdown" action="Sales Orders" onAction={() => onNavigate("sales-orders")}>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                  <span>Sales Orders (SO) Status</span>
                  <span>{k.salesOrders} total</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {Object.entries(data.statusDistribution?.so || {}).map(([st, cnt]) => (
                    <div key={st} className="bg-slate-50 border border-slate-200/80 rounded-xl p-2 text-center">
                      <div className="text-[10px] font-medium text-slate-500 truncate">{st}</div>
                      <div className="text-sm font-bold text-slate-800 font-mono mt-0.5">{cnt}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                  <span>Purchase Orders (PO) Status</span>
                  <span>{k.purchaseOrders} total</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {Object.entries(data.statusDistribution?.po || {}).map(([st, cnt]) => (
                    <div key={st} className="bg-slate-50 border border-slate-200/80 rounded-xl p-2 text-center">
                      <div className="text-[10px] font-medium text-slate-500 truncate">{st}</div>
                      <div className="text-sm font-bold text-slate-800 font-mono mt-0.5">{cnt}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </SectionCard>
        )}

        {/* 核心紗線價格趨勢 (Top Movers & Trends) */}
        <SectionCard title="Key Yarn Price Trends (12-Week Movers)" action="Price History" onAction={() => onNavigate("price-history")}>
          {data.topYarnTrends && data.topYarnTrends.length > 0 ? (
            <div className="space-y-2.5">
              {data.topYarnTrends.map((t) => (
                <div key={t.yarnId} className="flex items-center justify-between gap-3 text-xs border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-800 truncate">{t.yarnName}</div>
                    <div className="text-[10px] text-slate-400 truncate">{t.factoryName} · {t.priceHistory.length} price points</div>
                  </div>
                  <div className="text-right shrink-0 flex items-center gap-2">
                    <div className="text-right">
                      <div className="font-mono font-bold text-slate-800">{t.currency} {t.latestPrice.toFixed(2)}</div>
                      <div className="text-[10px] text-slate-400">from {t.currency} {t.firstPrice.toFixed(2)}</div>
                    </div>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono shrink-0 flex items-center gap-0.5 ${
                        t.changePct > 0 ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"
                      }`}
                    >
                      {t.changePct > 0 ? "▲" : "▼"} {Math.abs(t.changePct).toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : data.movers?.length ? (
            <div className="space-y-2">
              {data.movers.slice(0, 5).map((m) => (
<div key={`${m.yarnId}-${m.date}`} className="flex items-center justify-between gap-2 text-xs border-b border-slate-100 pb-2 last:border-0 last:pb-0">                  <div className="min-w-0">
                    <div className="font-medium text-slate-800 truncate">{m.yarnName}</div>
                    <div className="text-[10px] text-slate-400 truncate">{m.factoryName} · {m.yarnCount}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono font-semibold text-slate-800">{m.currency} {m.latestPrice.toFixed(2)}</div>
                    <div className={`text-[10px] font-semibold font-mono ${m.change > 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {m.change > 0 ? "▲" : "▼"} {Math.abs(m.pctChange).toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-slate-400 py-4 text-center">No significant price movements recorded recently</div>
          )}
        </SectionCard>
      </div>

      {/* 📦 產品與情報統計卡 */}
      <div>
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Catalog & Price Intelligence</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Total Yarns" value={k.totalYarns} sub={`${k.newYarnCount} added in 30 days`} accent="text-slate-900" onClick={() => onNavigate("yarns")} />
          <StatCard label="Price Records" value={k.totalPriceRecords} sub={`${k.pricesThisWeek} updated this week`} accent="text-slate-900" onClick={() => onNavigate("price-history")} />
          <StatCard label="Yarns Priced" value={k.yarnsWithPrices} sub={`${k.yarnsWithoutPrices} missing price`} accent="text-emerald-600" onClick={() => onNavigate("price-history")} />
          <StatCard label="Stale Prices" value={k.stalePriceCount} sub="Older than 30 days" accent={k.stalePriceCount ? "text-amber-600" : "text-slate-900"} onClick={() => onNavigate("price-history")} />
        </div>
      </div>

      {/* ⚠️ 模組 4：交期預警與即將到期明細面板 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {canOrders && data.overdueDeliveries?.length > 0 && (
          <SectionCard title="Overdue Deliveries" action="Sales Orders" onAction={() => onNavigate("sales-orders")} badge={`${data.overdueDeliveries.length} Critical`}>
            <div className="space-y-2">
              {data.overdueDeliveries.map((d) => (
                <div key={d.id} className="flex items-center justify-between gap-2 text-xs border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                  <span className="font-medium text-slate-800">{d.soNo}</span>
                  <span className="text-slate-500">{d.deliveryDate}</span>
                  <span className="px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 font-bold shrink-0">{d.daysOverdue}d late</span>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {canOrders && (
          <SectionCard title="Upcoming Deliveries (Next 30 Days)" action="Sales Orders" onAction={() => onNavigate("sales-orders")}>
            {data.upcomingDeliveries?.length ? (
              <div className="space-y-2">
                {data.upcomingDeliveries.map((d) => (
                  <div key={d.id} className="flex items-center justify-between gap-2 text-xs border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                    <span className="font-medium text-slate-800">{d.soNo}</span>
                    <span className="text-slate-500">{d.deliveryDate}</span>
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-medium shrink-0">{d.status}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-400 py-3 text-center">No deliveries scheduled in the next 30 days</div>
            )}
          </SectionCard>
        )}

        {/* 最新價格更新明細 */}
        <SectionCard title="Latest Price Entries" action="Price History" onAction={() => onNavigate("price-history")}>
          {data.recentPrices?.length ? (
            <div className="space-y-2">
              {data.recentPrices.slice(0, 6).map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-2 text-xs border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                  <div className="min-w-0">
                    <div className="font-medium text-slate-800 truncate">{p.yarnName}</div>
                    <div className="text-[10px] text-slate-400 truncate">{p.factoryName} · {p.recordDate}</div>
                  </div>
                  <div className="font-mono font-semibold text-slate-800 shrink-0">{p.currency} {p.price.toFixed(2)}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-slate-400 py-3 text-center">No price records yet</div>
          )}
        </SectionCard>

        {/* 新增紗線紀錄 */}
        <SectionCard title="Newly Cataloged Yarns (30 Days)" action="All Yarns" onAction={() => onNavigate("yarns")}>
          {data.newYarns?.length ? (
            <div className="space-y-2">
              {data.newYarns.map((y) => (
                <div key={y.id} className="flex items-center justify-between gap-2 text-xs border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                  <div className="min-w-0 flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${y.relationship === "My Factory" ? "bg-[#e5885d]" : "bg-emerald-500"}`} />
                    <span className="font-medium text-slate-800 truncate">{y.yarnName}</span>
                  </div>
                  <span className="text-slate-400 truncate shrink-0">{y.yarnCount} · {y.factoryName}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-slate-400 py-3 text-center">No yarns added in the last 30 days</div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
