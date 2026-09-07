"use client";

import { useState, useEffect, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { IconDownload } from "@/components/Icons";

interface Kpis {
  invoicedSales: number; receivedTotal: number; receivable: number; overdueReceivable: number; vatOutput: number;
  supplierInvoiced: number; supplierPaidTotal: number; payable: number; overduePayable: number; vatInput: number;
  invoiceCount: number; supplierInvoiceCount: number; salesOrders: number; purchaseOrders: number; quotations: number;
}
interface MonthRow { month: string; invoiced: number; received: number; supplierInvoiced: number; supplierPaid: number }
interface TopRow { name: string; total: number; paid: number; outstanding: number }
interface CurAmt { currency: string; amount: number }
interface ReportData {
  kpis: Kpis; monthly: MonthRow[]; topCustomers: TopRow[]; topFactories: TopRow[];
  receivableByCurrency: CurAmt[]; payableByCurrency: CurAmt[];
}

function money(n: number) { return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function moneyShort(n: number) {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toFixed(0);
}

function KpiCard({ label, value, sub, tone = "slate" }: { label: string; value: string; sub?: string; tone?: "slate" | "amber" | "red" | "emerald" | "blue" | "indigo" }) {
  const tones: Record<string, string> = {
    slate: "border-slate-200 text-slate-900", amber: "border-amber-200 text-amber-600",
    red: "border-red-200 text-red-500", emerald: "border-emerald-200 text-emerald-600",
    blue: "border-blue-200 text-blue-600", indigo: "border-indigo-200 text-indigo-600",
  };
  return (
    <div className={`bg-white rounded-xl border p-4 ${tones[tone].split(" ")[0]}`}>
      <div className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">{label}</div>
      <div className={`text-xl font-bold mt-1 ${tones[tone].split(" ").slice(1).join(" ")}`}>{value}</div>
      {sub && <div className="text-[11px] text-slate-400 mt-0.5">{sub}</div>}
    </div>
  );
}

function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows.map((r) => r.map((c) => { const s = String(c ?? ""); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; }).join(",")).join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

function CurChips({ title, items, tone }: { title: string; items: CurAmt[]; tone: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold mb-2">{title}</div>
      {items.length === 0 ? <div className="text-sm text-slate-400">All settled.</div> : (
        <div className="flex flex-wrap gap-2">
          {items.map((x) => (
            <span key={x.currency} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sm font-mono font-medium border ${tone}`}>
              <span className="font-sans font-semibold">{x.currency}</span>{money(x.amount)}
            </span>
          ))}
        </div>
      )}
      <p className="text-[10px] text-slate-400 mt-2">Outstanding amounts grouped per document currency (no FX conversion applied).</p>
    </div>
  );
}

function TopTable({ title, rows, empty }: { title: string; rows: TopRow[]; empty: string }) {
  const max = Math.max(1, ...rows.map((r) => r.total));
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="text-sm font-semibold text-slate-900 mb-3">{title}</div>
      {rows.length === 0 ? <div className="text-sm text-slate-400">{empty}</div> : (
        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r.name} className="group">
              <div className="flex justify-between text-sm mb-0.5">
                <span className="font-medium text-slate-700 truncate pr-3">{r.name}</span>
                <span className="font-mono text-slate-600 shrink-0">{money(r.total)}{r.outstanding > 0 && <span className="text-amber-600 ml-2">out {money(r.outstanding)}</span>}</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden flex">
                <div className="h-full bg-slate-300" style={{ width: `${(r.total / max) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports").then((r) => r.json()).then((d) => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const k = data?.kpis;
  const monthlySales = useMemo(() => (data?.monthly || []).map((m) => ({ ...m, month: m.month.slice(2) })), [data]);

  const exportMonthly = () => {
    if (!data) return;
    downloadCsv("finance-monthly.csv", [
      ["Month", "Invoiced (Sales)", "Received", "Supplier Invoiced", "Supplier Paid"],
      ...data.monthly.map((m) => [m.month, m.invoiced, m.received, m.supplierInvoiced, m.supplierPaid]),
    ]);
  };
  const exportTop = () => {
    if (!data) return;
    downloadCsv("counterparty-balances.csv", [
      ["Type", "Name", "Total Invoiced", "Paid", "Outstanding"],
      ...data.topCustomers.map((r) => ["Client", r.name, r.total, r.paid, r.outstanding] as (string | number)[]),
      ...data.topFactories.map((r) => ["Yarn Mill", r.name, r.total, r.paid, r.outstanding] as (string | number)[]),
    ]);
  };

  if (loading) return <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-400">Building reports…</div>;
  if (!k) return <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-400">Failed to load reports.</div>;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap items-center gap-3">
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-slate-900">Finance Reports</h2>
          <p className="text-xs text-slate-400 mt-0.5">Sales invoicing, receivables, supplier costs and payables. Document counts include quotations, orders and invoices across the app.</p>
        </div>
        <button onClick={exportMonthly} className="flex items-center gap-2 px-3 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300"><IconDownload className="w-4 h-4" /> Monthly CSV</button>
        <button onClick={exportTop} className="flex items-center gap-2 px-3 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300"><IconDownload className="w-4 h-4" /> Balances CSV</button>
      </div>

      <div>
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Sales & Receivables ({k.invoiceCount} invoices)</div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <KpiCard label="Invoiced" value={moneyShort(k.invoicedSales)} sub="excl. cancelled" tone="blue" />
          <KpiCard label="Received" value={moneyShort(k.receivedTotal)} tone="emerald" />
          <KpiCard label="Receivable" value={moneyShort(k.receivable)} tone="amber" />
          <KpiCard label="Overdue" value={moneyShort(k.overdueReceivable)} tone="red" />
          <KpiCard label="Output VAT" value={moneyShort(k.vatOutput)} sub="on sales invoices" tone="slate" />
        </div>
      </div>

      <div>
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Purchasing & Payables ({k.supplierInvoiceCount} supplier invoices)</div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <KpiCard label="Supplier Invoiced" value={moneyShort(k.supplierInvoiced)} tone="indigo" />
          <KpiCard label="Paid to Mills" value={moneyShort(k.supplierPaidTotal)} tone="emerald" />
          <KpiCard label="Payable" value={moneyShort(k.payable)} tone="amber" />
          <KpiCard label="Overdue" value={moneyShort(k.overduePayable)} tone="red" />
          <KpiCard label="Input VAT" value={moneyShort(k.vatInput)} sub="on supplier invoices" tone="slate" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <CurChips title="Receivable by currency" items={data.receivableByCurrency} tone="bg-amber-50 border-amber-200 text-amber-700" />
        <CurChips title="Payable by currency" items={data.payableByCurrency} tone="bg-indigo-50 border-indigo-200 text-indigo-700" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-sm font-semibold text-slate-900 mb-3">Sales: Invoiced vs Received (12 months)</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlySales} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis tickFormatter={moneyShort} tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <Tooltip formatter={(v) => money(Number(v ?? 0))} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="invoiced" name="Invoiced" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                <Bar dataKey="received" name="Received" fill="#10b981" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-sm font-semibold text-slate-900 mb-3">Purchasing: Supplier Invoiced vs Paid (12 months)</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlySales} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis tickFormatter={moneyShort} tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <Tooltip formatter={(v) => money(Number(v ?? 0))} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="supplierInvoiced" name="Supplier Invoiced" fill="#6366f1" radius={[3, 3, 0, 0]} />
                <Bar dataKey="supplierPaid" name="Paid" fill="#f59e0b" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <TopTable title="Top Clients by Invoiced Value" rows={data.topCustomers} empty="No invoices yet — figures appear once invoices are created." />
        <TopTable title="Top Yarn Mills by Invoiced Value" rows={data.topFactories} empty="No supplier invoices yet." />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <KpiCard label="Quotations (all time)" value={String(k.quotations)} tone="slate" />
        <KpiCard label="Sales Orders" value={String(k.salesOrders)} tone="slate" />
        <KpiCard label="Purchase Orders" value={String(k.purchaseOrders)} tone="slate" />
      </div>
    </div>
  );
}
