/**
 * Shared commercial constants & helpers — single source of truth for
 * currencies, units and Incoterms® 2020 handling across the whole app
 * (Add Price, Quotations, Sales Orders, Purchase Orders, Invoices).
 */

export const CURRENCY_OPTIONS = [
  "USD", "EUR", "GBP", "CNY", "JPY", "THB",
  "INR", "KRW", "TWD", "AUD", "NZD", "CHF",
] as const;

export const UNIT_OPTIONS = ["per KG", "per LB", "per Cone"] as const;

export type VatMode = "" | "excl" | "incl";

export interface IncotermDef {
  code: string;
  name: string;
  /** true = seller delivers to destination (D-terms), VAT wording most relevant */
  delivered: boolean;
}

/** Incoterms® 2020 — the 11 official rules, in order of increasing seller obligation. */
export const INCOTERMS_2020: IncotermDef[] = [
  { code: "EXW", name: "Ex Works", delivered: false },
  { code: "FCA", name: "Free Carrier", delivered: false },
  { code: "FAS", name: "Free Alongside Ship", delivered: false },
  { code: "FOB", name: "Free On Board", delivered: false },
  { code: "CFR", name: "Cost & Freight", delivered: false },
  { code: "CIF", name: "Cost, Insurance & Freight", delivered: false },
  { code: "CPT", name: "Carriage Paid To", delivered: false },
  { code: "CIP", name: "Carriage & Insurance Paid To", delivered: false },
  { code: "DAP", name: "Delivered at Place", delivered: true },
  { code: "DPU", name: "Delivered at Place Unloaded", delivered: true },
  { code: "DDP", name: "Delivered Duty Paid", delivered: true },
];

export const INCOTERM_CODES = INCOTERMS_2020.map((t) => t.code);

export interface ParsedIncoterm {
  term: string;
  vat: VatMode;
  place: string;
}

/**
 * Parse a stored incoterm string like:
 *   "CIF Shanghai"            -> { term: "CIF", vat: "", place: "Shanghai" }
 *   "DDP excl. VAT China"     -> { term: "DDP", vat: "excl", place: "China" }
 *   "DAP incl. VAT Bangkok"   -> { term: "DAP", vat: "incl", place: "Bangkok" }
 * Legacy / free-text values are tolerated (first word becomes the term).
 */
export function parseIncoterm(raw: string | null | undefined): ParsedIncoterm {
  const value = (raw || "").trim();
  if (!value) return { term: "", vat: "", place: "" };

  const upper = value.toUpperCase();
  let term = "";
  for (const code of INCOTERM_CODES) {
    if (upper === code || upper.startsWith(code + " ")) {
      term = code;
      break;
    }
  }

  if (!term) {
    // Legacy / custom value: first token = term, rest = place
    const sp = value.indexOf(" ");
    if (sp === -1) return { term: value.toUpperCase(), vat: "", place: "" };
    return { term: value.slice(0, sp).toUpperCase(), vat: "", place: value.slice(sp + 1) };
  }

  let rest = value.slice(term.length).trim();
  let vat: VatMode = "";
  const vatMatch = rest.match(/^(excl\.?|incl\.?)\s*vat\b[.:]?\s*/i);
  if (vatMatch) {
    vat = vatMatch[1].toLowerCase().startsWith("incl") ? "incl" : "excl";
    rest = rest.slice(vatMatch[0].length).trim();
  }
  return { term, vat, place: rest };
}

/** Serialize back to the stored string format. */
export function formatIncoterm(term: string, vat: VatMode, place: string): string {
  const parts: string[] = [];
  if (term.trim()) parts.push(term.trim().toUpperCase());
  if (vat === "excl") parts.push("excl. VAT");
  if (vat === "incl") parts.push("incl. VAT");
  if (place.trim()) parts.push(place.trim());
  return parts.join(" ");
}

/** Human explanation of the VAT variants, also used for tooltips. */
export const INCOTERM_VAT_LABELS: Record<Exclude<VatMode, "">, string> = {
  excl: "Delivered to destination, WITHOUT VAT — buyer settles import VAT & duty",
  incl: "Delivered to destination, VAT INCLUDED — seller bears import VAT & duty",
};

/** Short inline description of what a parsed incoterm means. */
export function describeIncoterm(raw: string | null | undefined): string {
  const p = parseIncoterm(raw);
  if (!p.term) return "";
  const def = INCOTERMS_2020.find((t) => t.code === p.term);
  const bits = [def ? `${p.term} — ${def.name}` : p.term];
  if (p.vat === "excl") bits.push("delivered to destination without VAT (buyer pays import VAT/duty)");
  if (p.vat === "incl") bits.push("delivered to destination with VAT included (seller pays import VAT/duty)");
  if (p.place) bits.push(`at ${p.place}`);
  return bits.join(" · ");
}
