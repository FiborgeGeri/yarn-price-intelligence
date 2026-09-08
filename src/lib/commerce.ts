/**
 * Shared commercial constants — single source of truth for
 * currencies and delivery terms across the whole app
 * (Add Price, Quotations, Sales Orders, Purchase Orders, Invoices).
 */

export const CURRENCY_OPTIONS = [
  "USD", "EUR", "GBP", "CNY", "HKD", "JPY",
  "THB", "INR", "KRW", "TWD", "AUD", "NZD", "CHF",
] as const;

export const UNIT_OPTIONS = ["per KG", "per LB", "per Cone"] as const;

export interface TermDef {
  code: string;
  name: string;
  group: "domestic" | "incoterms";
  /** true = seller delivers to destination */
  delivered: boolean;
}

/** Incoterms® 2020 — the 11 official rules, in order of increasing seller obligation. */
export const INCOTERMS_2020: TermDef[] = [
  { code: "EXW", name: "Ex Works", group: "incoterms", delivered: false },
  { code: "FCA", name: "Free Carrier", group: "incoterms", delivered: false },
  { code: "FAS", name: "Free Alongside Ship", group: "incoterms", delivered: false },
  { code: "FOB", name: "Free On Board", group: "incoterms", delivered: false },
  { code: "CFR", name: "Cost & Freight", group: "incoterms", delivered: false },
  { code: "CIF", name: "Cost, Insurance & Freight", group: "incoterms", delivered: false },
  { code: "CPT", name: "Carriage Paid To", group: "incoterms", delivered: false },
  { code: "CIP", name: "Carriage & Insurance Paid To", group: "incoterms", delivered: false },
  { code: "DAP", name: "Delivered at Place", group: "incoterms", delivered: true },
  { code: "DPU", name: "Delivered at Place Unloaded", group: "incoterms", delivered: true },
  { code: "DDP", name: "Delivered Duty Paid", group: "incoterms", delivered: true },
];

/** China domestic price terms — no customs/duty applies, only VAT & freight. */
export const DOMESTIC_TERMS: TermDef[] = [
  { code: "Delivered incl. VAT", name: "Seller delivers · VAT & freight included", group: "domestic", delivered: true },
  { code: "Delivered excl. VAT", name: "Seller delivers · freight incl., VAT excl.", group: "domestic", delivered: true },
  { code: "Ex-Works incl. VAT", name: "Buyer collects · VAT incl. (tax invoice)", group: "domestic", delivered: false },
  { code: "Ex-Works excl. VAT", name: "Buyer collects · no VAT", group: "domestic", delivered: false },
];

export const ALL_TERMS: TermDef[] = [...DOMESTIC_TERMS, ...INCOTERMS_2020];

export const INCOTERM_CODES = INCOTERMS_2020.map((t) => t.code);

export interface ParsedIncoterm {
  term: string;
  place: string;
}

/** Normalise for matching: uppercase, strip periods, collapse spaces. */
function norm(s: string): string {
  return s.toUpperCase().replace(/\./g, "").replace(/\s+/g, " ").trim();
}

/** Resolve a typed/selected term to its canonical casing if it is known. */
export function canonicalTerm(raw: string): string {
  const n = norm(raw);
  if (!n) return "";
  for (const t of ALL_TERMS) {
    if (norm(t.code) === n) return t.code;
  }
  return raw.trim().toUpperCase();
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Match a known term at the START of a value, tolerating case & missing periods. */
function matchTermPrefix(value: string, code: string): { term: string; rest: string } | null {
  const re = new RegExp(
    "^" + code.split(/\s+/).map((w) => escapeRe(w.replace(/\./g, ""))).join("\\s*\\.?\\s*") + "(\\s+|$)",
    "i"
  );
  const m = value.match(re);
  if (!m) return null;
  return { term: code, rest: value.slice(m[0].length).trim() };
}

/**
 * Split a stored term string into term + place:
 *   "CIF Shanghai"                 -> { term: "CIF", place: "Shanghai" }
 *   "Delivered incl. VAT Shanghai" -> { term: "Delivered incl. VAT", place: "Shanghai" }
 *   "DDP excl. VAT China"          -> { term: "DDP", place: "China" }   (legacy VAT qualifier dropped)
 * Legacy / free-text values are tolerated (first word = term).
 */
export function parseIncoterm(raw: string | null | undefined): ParsedIncoterm {
  const value = (raw || "").trim();
  if (!value) return { term: "", place: "" };

  // Domestic multi-word terms first (longest match wins)
  for (const t of DOMESTIC_TERMS) {
    const m = matchTermPrefix(value, t.code);
    if (m) return finishParse(m);
  }
  for (const code of INCOTERM_CODES) {
    const m = matchTermPrefix(value, code);
    if (m) return finishParse(m);
  }

  // Legacy / free text: first word = term
  const sp = value.indexOf(" ");
  if (sp === -1) return { term: value.toUpperCase(), place: "" };
  return { term: value.slice(0, sp).toUpperCase(), place: value.slice(sp + 1) };
}

function finishParse(m: { term: string; rest: string }): ParsedIncoterm {
  // A legacy value like "DDP excl. VAT China" keeps DDP and drops the VAT qualifier
  const place = m.rest.replace(/^(excl\.?|incl\.?)\s*vat\b[.:]?\s*/i, "").trim();
  return { term: m.term, place };
}
