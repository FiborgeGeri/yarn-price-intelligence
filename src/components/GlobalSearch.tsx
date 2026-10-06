"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { 
  Search, 
  Loader2, 
  ArrowRight, 
  Camera,
  FileText,
  ShoppingBag,
  ShoppingCart,
  Truck,
  Package,
  Receipt,
  Layers,
  Users,
  Building2,
  type LucideIcon
} from "lucide-react";
import dynamic from "next/dynamic";

// 動態載入 QR 掃描器
const QRScanner = dynamic(() => import("./QRScanner"), { ssr: false });

interface SearchResult {
  type: string;
  id: number;
  title: string;
  subtitle: string;
}

// 🆕 將 Emojis 改為高質感的 Lucide 極簡線條 Icons
const TYPE_META: Record<string, { label: string; icon: LucideIcon; color: string; page: string }> = {
  quotation:         { label: "Quotation",         icon: FileText,         color: "text-amber-700 bg-amber-50",   page: "quotations" },
  so:                { label: "Sales Order",       icon: ShoppingBag,      color: "text-blue-700 bg-blue-50",     page: "sales-orders" },
  po:                { label: "Purchase Order",    icon: ShoppingCart,     color: "text-indigo-700 bg-indigo-50", page: "purchase-orders" },
  dn:                { label: "Delivery Note",     icon: Truck,            color: "text-cyan-700 bg-cyan-50",     page: "delivery-notes" },
  gr:                { label: "Goods Receipt",     icon: Package,          color: "text-teal-700 bg-teal-50",     page: "goods-receipts" },
  invoice:           { label: "Sales Invoice",     icon: Receipt,          color: "text-emerald-700 bg-emerald-50", page: "invoices" },
  "supplier-invoice":{ label: "Supplier Invoice",  icon: Receipt,          color: "text-rose-700 bg-rose-50",     page: "supplier-invoices" },
  yarn:              { label: "Yarn",              icon: Layers,           color: "text-purple-700 bg-purple-50", page: "yarns" },
  customer:          { label: "Client",            icon: Users,            color: "text-slate-700 bg-slate-100",  page: "customers" },
  factory:           { label: "Yarn Mill",         icon: Building2,        color: "text-stone-700 bg-stone-100",  page: "factories" },
};

const TYPE_ORDER = ["quotation", "so", "po", "dn", "gr", "invoice", "supplier-invoice", "yarn", "customer", "factory"];

export default function GlobalSearch() {
  const [query, setQ] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleShortcut = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        const input = containerRef.current?.querySelector("input");
        if (input) input.focus();
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/global-search?q=${encodeURIComponent(query)}`);
        if (res.ok) setResults(await res.json());
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // 將結果按類型分組
  const grouped = useMemo(() => {
    const groups: Record<string, SearchResult[]> = {};
    for (const r of results) {
      if (!groups[r.type]) groups[r.type] = [];
      groups[r.type].push(r);
    }
    return groups;
  }, [results]);

  const handleSelect = (item: SearchResult) => {
    const meta = TYPE_META[item.type];
    if (!meta) return;

    sessionStorage.setItem("scanTargetPage", meta.page);
    sessionStorage.setItem("scanTargetId", String(item.id));

    setFocused(false);
    setQ("");

    window.dispatchEvent(new CustomEvent("fib-navigate", { detail: { page: meta.page } }));
  };

  const handleQRScan = (type: string, id: number) => {
    setShowScanner(false);

    const typeToPage: Record<string, string> = {
      yarn: "yarns",
      so: "sales-orders",
      po: "purchase-orders",
      dn: "delivery-notes",
      gr: "goods-receipts",
      invoice: "invoices",
      "supplier-invoice": "supplier-invoices",
      quotation: "quotations",
    };

    const page = typeToPage[type];
    if (page) {
      sessionStorage.setItem("scanTargetPage", page);
      sessionStorage.setItem("scanTargetId", String(id));
      window.dispatchEvent(new CustomEvent("fib-navigate", { detail: { page } }));
    }
  };

  // 高亮關鍵字
  const highlight = (text: string, keyword: string) => {
    if (!keyword || !text) return text;
    const parts = text.split(new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
    return parts.map((p, i) =>
      p.toLowerCase() === keyword.toLowerCase() ? (
        <mark key={i} className="bg-yellow-200 text-slate-900 px-0.5 rounded">{p}</mark>
      ) : (
        <span key={i}>{p}</span>
      )
    );
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md z-[100]">
      <div className="relative">
        <input
          type="text"
          value={query}
          onFocus={() => setFocused(true)}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search everywhere... (Ctrl+K)"
          className="w-full bg-[#fcf8f5]/60 hover:bg-white focus:bg-white px-3 py-1.5 pl-10 pr-10 border border-slate-200 focus:border-[#e5885d] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#f1c6b2]/50 transition-all text-slate-800"
        />
        
        {/* 左側：放大鏡 / Loading 圖示 */}
        <div className="absolute left-3.5 top-2.5 text-slate-400">
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-[#d97449]" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </div>

        {/* 右側：相機掃描按鈕 */}
        <button
          type="button"
          onClick={() => setShowScanner(true)}
          className="absolute right-2 top-1.5 w-7 h-7 rounded-lg bg-[#fef7f3] hover:bg-[#fdeae2] border border-[#f4d9c9] flex items-center justify-center transition-colors animate-fade-in"
          title="Scan QR Code"
        >
          <Camera className="w-3.5 h-3.5 text-[#d97449]" />
        </button>
      </div>

      {focused && (results.length > 0 || query.trim().length >= 2) && (
        <div
          className="fixed left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-2xl max-h-[70vh] overflow-y-auto p-2 z-[9999] animate-fade-in"
          style={{ top: "56px", maxWidth: "32rem", marginLeft: "auto", marginRight: "auto" }}
        >
          {results.length === 0 && !loading && (
            <div className="text-center py-6 text-xs text-slate-400">
              No matching records found.
            </div>
          )}

          {results.length > 0 && (
            <div className="px-2 pt-1 pb-2 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
              {results.length} result{results.length > 1 ? "s" : ""} found
            </div>
          )}

          {TYPE_ORDER.filter((t) => grouped[t]?.length).map((type) => {
            const meta = TYPE_META[type];
            const items = grouped[type];
            const Icon = meta.icon; // 取得 Lucide 元件

            return (
              <div key={type} className="mb-2">
                <div className={`flex items-center gap-2 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded ${meta.color}`}>
                  {/* 🆕 渲染精準極簡向量線條 Icon */}
                  <Icon className="w-3.5 h-3.5 stroke-[1.8]" />
                  <span>{meta.label}</span>
                  <span className="ml-auto opacity-60 font-mono">{items.length}</span>
                </div>
                <div className="space-y-0.5 mt-1">
                  {items.map((item) => (
                    <button
                      key={`${item.type}-${item.id}`}
                      type="button"
                      onClick={() => handleSelect(item)}
                      className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 text-left transition-all group"
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="text-sm font-semibold text-slate-800 truncate">
                          {highlight(item.title || "(no title)", query)}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {highlight(item.subtitle || "", query)}
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300 shrink-0 group-hover:text-[#d97449] group-hover:translate-x-0.5 transition-all" />
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 掃描相機彈窗 */}
      {showScanner && (
        <QRScanner
          onScan={handleQRScan}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
}