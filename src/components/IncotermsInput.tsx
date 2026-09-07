"use client";

import { useState } from "react";
import {
  INCOTERMS_2020,
  INCOTERM_VAT_LABELS,
  parseIncoterm,
  formatIncoterm,
  type VatMode,
} from "@/lib/commerce";

/**
 * Shared Incoterms® 2020 picker used across Add Price, Quotations, Sales
 * Orders and Purchase Orders.
 *
 * Three parts: [ Term ] [ VAT treatment ] [ Named place ]
 *  - Term: any of the 11 Incoterms 2020 rules (with friendly full names)
 *  - VAT : "excl. VAT" = delivered to destination WITHOUT VAT (buyer pays
 *          import VAT/duty) · "incl. VAT" = delivered WITH VAT included
 *          (seller bears import VAT/duty)
 *  - Place: e.g. Shanghai, Hong Kong, Laem Chabang
 *
 * The value is stored as one string, e.g. "DDP excl. VAT Shanghai",
 * fully backward compatible with existing data like "CIF Shanghai".
 */
export default function IncotermsInput({
  value,
  onChange,
  compact = false,
}: {
  value: string;
  onChange: (v: string) => void;
  compact?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const { term, vat, place } = parseIncoterm(value);
  const filtered = INCOTERMS_2020.filter(
    (t) => !term || t.code.includes(term.toUpperCase()) || t.name.toUpperCase().includes(term.toUpperCase())
  );
  const show = focused && filtered.length > 0;

  const emit = (t: string, v: VatMode, p: string) => onChange(formatIncoterm(t, v, p));

  const inputCls = compact
    ? "px-2 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
    : "px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
  const btnBase = compact ? "px-1.5 py-1.5 text-[10px]" : "px-2 py-2 text-[11px]";

  const vatBtn = (mode: VatMode, label: string, title: string) => (
    <button
      key={mode || "none"}
      type="button"
      title={title}
      onClick={() => emit(term, mode, place)}
      className={`${btnBase} font-semibold whitespace-nowrap border transition-colors ${
        vat === mode
          ? mode === "incl"
            ? "bg-emerald-50 border-emerald-300 text-emerald-700"
            : mode === "excl"
              ? "bg-amber-50 border-amber-300 text-amber-700"
              : "bg-slate-200 border-slate-300 text-slate-700"
          : "bg-white border-slate-300 text-slate-400 hover:text-slate-600 hover:border-slate-400"
      } ${mode === "" ? "rounded-l-lg" : mode === "incl" ? "rounded-r-lg border-l-0" : "border-l-0"}`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex gap-2">
      <div className={`relative ${compact ? "w-20" : "w-28"} shrink-0`}>
        <input
          type="text"
          value={term}
          onChange={(e) => emit(e.target.value.toUpperCase(), vat, place)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          className={`w-full ${inputCls}`}
          placeholder="e.g. CIF"
        />
        {show && (
          <div className="absolute z-30 left-0 min-w-full w-max max-w-[280px] mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
            {filtered.map((t) => (
              <button
                key={t.code}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  emit(t.code, vat, place);
                  setFocused(false);
                }}
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-blue-50 border-b border-slate-50 last:border-0 flex items-baseline gap-2"
              >
                <span className="font-mono font-bold text-slate-800">{t.code}</span>
                <span className="text-slate-500 truncate">{t.name}</span>
                {t.delivered && <span className="ml-auto text-[9px] uppercase tracking-wide text-blue-400 shrink-0">Delivered</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* VAT treatment — applies to every term */}
      <div className="flex shrink-0" role="group" aria-label="VAT treatment">
        {vatBtn("", "VAT —", "VAT treatment not specified")}
        {vatBtn("excl", "excl. VAT", INCOTERM_VAT_LABELS.excl)}
        {vatBtn("incl", "incl. VAT", INCOTERM_VAT_LABELS.incl)}
      </div>

      <input
        type="text"
        value={place}
        onChange={(e) => emit(term, vat, e.target.value)}
        className={`flex-1 min-w-0 ${inputCls}`}
        placeholder={compact ? "Place" : "Named place e.g. Shanghai, Hong Kong"}
      />
    </div>
  );
}
