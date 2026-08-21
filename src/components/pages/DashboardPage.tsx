"use client";
import { useState, useEffect } from "react";
import { Permissions } from "@/lib/permissions";

interface Mover {
  yarnId: number; yarnName: string; factoryName: string; relationship: string;
  yarnCount: string; micron: string; latestPrice: number; prevPrice: number;
  currency: string; unit: string; incoterms: string; change: number; changePct: number;
  latestDate: string; prevDate: string;
}
interface NoPriceYarn { yarnId: number; yarnName: string; factoryName: string; relationship: string; yarnCount: string; micron: string; }
interface RecentPrice { id: number; price: number; currency: string | null; unit: string | null; recordDate: string; incoterms: string | null; yarnName: string | null; yarnCount: string | null; factoryName: string | null; relationship: string | null; }
interface DeliveryItem { id: number; soNo: string | null; deliveryDate: string | null; status: string | null; daysOverdue?: number }
interface NewOrder { id: number; soNo: string | null; soDate: string | null; status: string | null }
interface NewYarn { id: number; yarnName: string; yarnCount: string; factoryName: string; relationship: string }

interface Kpi {
  totalYarns: number; pricesThisWeek: number; totalPriceRecords: number;
  yarnsWithPrices: number; yarnsWithoutPrices: number; stalePriceCount: number;
  quotations: number; expiringQuotes: number;
  salesOrders: number; salesOrdersOpen: number; purchaseOrders: number; purchaseOrdersOpen: number;
  goodsReceipts: number; goodsReceiptsInTransit: number; deliveryNotes: number; deliveryNotesPending: number;
  overdueCount: number; newYarnCount: number; newOrderCount: number;
}

interface DashData {
  kpi: Kpi; movers: Mover[]; yarnsNoPrice: NoPriceYarn[];
  recentPrices: RecentPrice[]; upcomingDeliveries: DeliveryItem[]; overdueDeliveries: DeliveryItem[];
  newOrders: NewOrder[]; newYarns: NewYarn[];
}

interface Props { onNavigate: (page: string) => void; permissions: Permissions; }

function StatCard({ label, value, sub, accent, onClick, badge }: { label: string; value: number | string; sub?: string; accent: string; onClick?: () => void; badge?: string }) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`text-left bg-white rounded-xl border border-slate-200 p-4 shadow-sm transition-all ${onClick ? "hover:shadow-md hover:border-slate-300 cursor-pointer" : "cursor-default"}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-xs font-medium text-slate-500 truncate">{label}</div>
          <div className={`text-2xl font-bold mt-1 ${accent}`}>{value}</div>
          {sub && <div className="text-[11px] text-slate-400 mt-0.5 truncate">{sub}</div>}
        </div>
        {badge && <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#dceae0] text-[#3a6650]">{badge}</span>}
      </div>
    </button>
  );
}

function SectionCard({ title, action, onAction, children }: { title: string; action?: string; onAction?: () => void; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
        {action && <button onClick={onAction} className="text-xs text-[#d9774d] hover:text-[#a75334] font-medium">{action} →</button>}
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
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-[#e5885d] border-t-transparent rounded-full animate-spin" /></div>;
  if (!data?.kpi) return <div className="text-center py-20 text-slate-400">Unable to load dashboard</div>;

  const k = data.kpi;
  const canOrders = permissions.canViewQuotations;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">Live status of your orders, shipments and yarn pricing</p>
      </div>

      {/* Alerts */}
      {(k.overdueCount > 0 || k.expiringQuotes > 0 || k.stalePriceCount > 0) && (
        <div className="bg-white/70 backdrop-blur-xl rounded-xl border border-slate-200 shadow-sm p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-5 rounded-full bg-red-50 border border-[#cde3d3] flex items-center justify-center shrink-0"><svg className="w-3 h-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg></div>
            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">Alerts</span>
          </div>
          <div className="space-y-1.5">
            {k.overdueCount > 0 && (
              <button onClick={() => onNavigate("sales-orders")} className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-red-50/60 transition-colors text-left">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                <span className="text-xs text-slate-700"><strong className="text-[#4d7d61]">{k.overdueCount}</strong> overdue delivery{k.overdueCount > 1 ? "ies" : ""} need attention</span>
              </button>
            )}
            {k.expiringQuotes > 0 && (
              <button onClick={() => onNavigate("quotations")} className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-amber-50/60 transition-colors text-left">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                <span className="text-xs text-slate-700"><strong className="text-amber-600">{k.expiringQuotes}</strong> quotation{k.expiringQuotes > 1 ? "s" : ""} expiring within 14 days</span>
              </button>
            )}
            {k.stalePriceCount > 0 && (
              <button onClick={() => onNavigate("price-history")} className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-100/60 transition-colors text-left">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                <span className="text-xs text-slate-700"><strong className="text-slate-600">{k.stalePriceCount}</strong> price{k.stalePriceCount > 1 ? "s" : ""} not updated in 30+ days</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Order Flow */}
      {canOrders && (
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Order Flow</div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <StatCard label="Quotations" value={k.quotations} sub={k.expiringQuotes ? `${k.expiringQuotes} expiring soon` : "All active"} accent="text-slate-900" onClick={() => onNavigate("quotations")} badge={k.expiringQuotes ? String(k.expiringQuotes) : undefined} />
            <StatCard label="Sales Orders" value={k.salesOrders} sub={`${k.salesOrdersOpen} open · ${k.newOrderCount} new (14d)`} accent="text-[#d9774d]" onClick={() => onNavigate("sales-orders")} />
            <StatCard label="Purchase Orders" value={k.purchaseOrders} sub={`${k.purchaseOrdersOpen} open`} accent="text-indigo-600" onClick={() => onNavigate("purchase-orders")} />
            <StatCard label="Goods Receipts" value={k.goodsReceipts} sub={`${k.goodsReceiptsInTransit} in transit`} accent="text-cyan-600" onClick={() => onNavigate("goods-receipts")} />
            <StatCard label="Delivery Notes" value={k.deliveryNotes} sub={`${k.deliveryNotesPending} pending`} accent="text-emerald-600" onClick={() => onNavigate("delivery-notes")} />
          </div>
        </div>
      )}

      {/* Products & Pricing */}
      <div>
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Products &amp; Pricing</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Total Yarns" value={k.totalYarns} sub={`${k.newYarnCount} added in 30 days`} accent="text-slate-900" onClick={() => onNavigate("yarns")} />
          <StatCard label="Price Records" value={k.totalPriceRecords} sub={`${k.pricesThisWeek} updated this week`} accent="text-slate-900" onClick={() => onNavigate("price-history")} />
          <StatCard label="Yarns Priced" value={k.yarnsWithPrices} sub={`${k.yarnsWithoutPrices} still missing price`} accent="text-green-600" onClick={() => onNavigate("price-history")} />
          <StatCard label="Stale Prices" value={k.stalePriceCount} sub="Older than 30 days" accent={k.stalePriceCount ? "text-amber-600" : "text-slate-900"} onClick={() => onNavigate("price-history")} />
        </div>
      </div>

      {/* Detail panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {canOrders && data.overdueDeliveries?.length > 0 && (
          <SectionCard title="Overdue Deliveries" action="Sales Orders" onAction={() => onNavigate("sales-orders")}>
            <div className="space-y-2">
              {data.overdueDeliveries.map((d) => (
                <div key={d.id} className="flex items-center justify-between gap-2 text-xs border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                  <span className="font-medium text-slate-800">{d.soNo}</span>
                  <span className="text-slate-500">{d.deliveryDate}</span>
                  <span className="px-2 py-0.5 rounded bg-[#dceae0] text-[#3a6650] font-bold shrink-0">{d.daysOverdue}d late</span>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {canOrders && (
          <SectionCard title="Upcoming Shipments (30 days)" action="Sales Orders" onAction={() => onNavigate("sales-orders")}>
            {data.upcomingDeliveries?.length ? (
              <div className="space-y-2">
                {data.upcomingDeliveries.map((d) => (
                  <div key={d.id} className="flex items-center justify-between gap-2 text-xs border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                    <span className="font-medium text-slate-800">{d.soNo}</span>
                    <span className="text-slate-500">{d.deliveryDate}</span>
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-[#c4683f] font-medium shrink-0">{d.status}</span>
                  </div>
                ))}
              </div>
            ) : <div className="text-xs text-slate-400">No shipments scheduled in the next 30 days</div>}
          </SectionCard>
        )}

        {canOrders && (
          <SectionCard title="New Sales Orders (14 days)" action="Sales Orders" onAction={() => onNavigate("sales-orders")}>
            {data.newOrders?.length ? (
              <div className="space-y-2">
                {data.newOrders.map((o) => (
                  <div key={o.id} className="flex items-center justify-between gap-2 text-xs border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                    <span className="font-medium text-slate-800">{o.soNo}</span>
                    <span className="text-slate-500">{o.soDate}</span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium shrink-0">{o.status}</span>
                  </div>
                ))}
              </div>
            ) : <div className="text-xs text-slate-400">No new orders in the last 14 days</div>}
          </SectionCard>
        )}

        <SectionCard title="Recent Price Movements" action="Price History" onAction={() => onNavigate("price-history")}>
          {data.movers?.length ? (
            <div className="space-y-2">
              {data.movers.slice(0, 6).map((m) => (
                <div key={`${m.yarnId}-${m.latestDate}`} className="flex items-center justify-between gap-2 text-xs border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                  <div className="min-w-0">
                    <div className="font-medium text-slate-800 truncate">{m.yarnName}</div>
                    <div className="text-[10px] text-slate-400 truncate">{m.factoryName} · {m.yarnCount}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono font-semibold text-slate-800">{m.currency} {m.latestPrice.toFixed(2)}</div>
                    <div className={`text-[10px] font-medium ${m.change > 0 ? "text-[#4d7d61]" : "text-green-600"}`}>
                      {m.change > 0 ? "▲" : "▼"} {Math.abs(m.changePct).toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : <div className="text-xs text-slate-400">No price movements recorded</div>}
        </SectionCard>

        <SectionCard title="Latest Price Updates" action="Price History" onAction={() => onNavigate("price-history")}>
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
          ) : <div className="text-xs text-slate-400">No price records yet</div>}
        </SectionCard>

        <SectionCard title="Newly Added Yarns (30 days)" action="All Yarns" onAction={() => onNavigate("yarns")}>
          {data.newYarns?.length ? (
            <div className="space-y-2">
              {data.newYarns.map((y) => (
                <div key={y.id} className="flex items-center justify-between gap-2 text-xs border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                  <div className="min-w-0 flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${y.relationship === "My Factory" ? "bg-[#e5885d]" : "bg-[#4d7d61]"}`} />
                    <span className="font-medium text-slate-800 truncate">{y.yarnName}</span>
                  </div>
                  <span className="text-slate-400 truncate shrink-0">{y.yarnCount} · {y.factoryName}</span>
                </div>
              ))}
            </div>
          ) : <div className="text-xs text-slate-400">No yarns added in the last 30 days</div>}
        </SectionCard>

        {data.yarnsNoPrice?.length > 0 && (
          <SectionCard title="Yarns Without Price" action="All Yarns" onAction={() => onNavigate("yarns")}>
            <div className="space-y-2">
              {data.yarnsNoPrice.slice(0, 6).map((y) => (
                <div key={y.yarnId} className="flex items-center justify-between text-xs border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                  <span className="font-medium text-slate-800 truncate">{y.yarnName}</span>
                  <span className="text-slate-400 truncate">{y.factoryName}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        )}
      </div>
    </div>
  );
}
