"use client";

import { useState } from "react";
import { ALL_TERMS, INCOTERMS_2020, DOMESTIC_TERMS, parseIncoterm, canonicalTerm } from "@/lib/commerce";

/**
 * Delivery-term picker used across Add Price, Quotations, Sales Orders,
 * Purchase Orders and Price History:
 *
 *   [ Term ] [ Named place, e.g. Shanghai / Hong Kong ]
 *
 * Two groups in the dropdown:
 *   - China Domestic (Delivered/Ex-Works × incl./excl. VAT)
 *   - Incoterms® 2020 (EXW … DDP) for international deals
 *
 * The value is stored as one plain string, e.g. "CIF Shanghai" or
 * "Delivered incl. VAT Shanghai".
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
  const { term, place } = parseIncoterm(value);
  const q = term.trim().toUpperCase().replace(/\./g, "");
  const matches = (t: { code: string; name: string }) => {
    const c = t.code.toUpperCase().replace(/\./g, "");
    return !q || c.includes(q) || t.name.toUpperCase().includes(q);
  };
  const domestic = DOMESTIC_TERMS.filter(matches);
  const intl = INCOTERMS_2020.filter(matches);
  const show = focused && domestic.length + intl.length > 0;

  const emit = (t: string, p: string) =>
    onChange([canonicalTerm(t), p.trim()].filter(Boolean).join(" "));

  const inputCls = compact
    ? "px-2 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
    : "px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  const row = (t: (typeof ALL_TERMS)[number]) => (
    <button
      key={t.code}
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        emit(t.code, place);
        setFocused(false);
      }}
      className="w-full text-left px-3 py-1.5 text-xs hover:bg-blue-50 border-b border-slate-50 last:border-0 flex items-baseline gap-2"
    >
      <span className="font-mono font-bold text-slate-800 whitespace-nowrap">{t.code}</span>
      <span className="text-slate-500 truncate">{t.name}</span>
      {t.delivered && (
        <span className="ml-auto text-[9px] uppercase tracking-wide text-blue-400 shrink-0">Delivered</span>
      )}
    </button>
  );

  return (
    <div className="flex gap-2">
      <div className={`relative ${compact ? "w-44" : "w-52"} shrink-0`}>
        <input
          type="text"
          value={term}
          onChange={(e) => emit(e.target.value, place)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          className={`w-full ${inputCls}`}
          placeholder="e.g. CIF"
        />
        {show && (
          <div className="absolute z-30 left-0 min-w-full w-max max-w-[340px] mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
            {domestic.length > 0 && (
              <>
                <div className="px-3 py-1 text-[9px] font-semibold uppercase tracking-wider text-amber-600 bg-amber-50/60 sticky top-0">China Domestic</div>
                {domestic.map(row)}
              </>
            )}
            {intl.length > 0 && (
              <>
                <div className="px-3 py-1 text-[9px] font-semibold uppercase tracking-wider text-slate-400 bg-slate-50 sticky top-0">Incoterms® 2020</div>
                {intl.map(row)}
              </>
            )}
          </div>
        )}
      </div>

      <input
        type="text"
        value={place}
        onChange={(e) => emit(term, e.target.value)}
        className={`flex-1 min-w-0 ${inputCls}`}
        placeholder={compact ? "Place" : "Place e.g. Shanghai, Hong Kong"}
      />
    </div>
  );
}
