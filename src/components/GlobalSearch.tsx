"use client";

import { useEffect, useState, useRef } from "react";
import { Search, Loader2, ArrowRight } from "lucide-react";

interface SearchResult {
  type: string;
  id: number;
  title: string;
  subtitle: string;
}

const TYPE_LABELS: Record<string, string> = {
  so: "Sales Order",
  po: "Purchase Order",
  invoice: "Invoice",
  quotation: "Quotation",
  yarn: "Yarn",
  customer: "Client",
  factory: "Yarn Mill",
};

const PAGE_MAP: Record<string, string> = {
  yarn: "yarns",
  so: "sales-orders",
  po: "purchase-orders",
  invoice: "invoices",
  quotation: "quotations",
  customer: "customers",
  factory: "factories",
};

export default function GlobalSearch() {
  const [query, setQ] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
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

  const handleSelect = (item: SearchResult) => {
    const page = PAGE_MAP[item.type];
    if (!page) return;
    
    sessionStorage.setItem("scanTargetPage", page);
    sessionStorage.setItem("scanTargetId", String(item.id));
    
    setFocused(false);
    setQ("");
    
    window.dispatchEvent(new Event("storage"));
    window.location.reload(); 
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md z-30">
      <div className="relative">
        <input
          type="text"
          value={query}
          onFocus={() => setFocused(true)}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search everywhere... (Ctrl+K)"
          className="w-full bg-[#fcf8f5]/60 hover:bg-white focus:bg-white px-3 py-1.5 pl-10 border border-slate-200 focus:border-[#e5885d] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#f1c6b2]/50 transition-all text-slate-800"
        />
        <div className="absolute left-3.5 top-2.5 text-slate-400">
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-[#d97449]" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </div>
      </div>

      {focused && (results.length > 0 || query.trim().length >= 2) && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-80 overflow-y-auto p-2">
          {results.length === 0 && !loading && (
            <div className="text-center py-6 text-xs text-slate-400">
              No matching records found.
            </div>
          )}

          <div className="space-y-0.5">
            {results.map((item) => (
              <button
                key={`${item.type}-${item.id}`}
                type="button"
                onClick={() => handleSelect(item)}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 text-left transition-colors"
              >
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {TYPE_LABELS[item.type]}
                  </div>
                  <div className="text-sm font-bold text-slate-800 truncate mt-0.5">
                    {item.title}
                  </div>
                  <div className="text-xs text-slate-500 truncate">
                    {item.subtitle}
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
