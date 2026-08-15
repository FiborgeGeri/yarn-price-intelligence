// Commercial Moisture Regain (%) by fibre and spinning system
// Source: IWTO-31, ISO 6741-4, BISFA, GB/T 9994

export type SpinningCategory = "worsted" | "semi-worsted" | "woollen" | "all";

interface RegainEntry {
  keywords: string[];
  regain: Record<string, number>; // spinning category → regain %
}

const REGAIN_TABLE: RegainEntry[] = [
  // 1.1 Animal Fibres
  { keywords: ["wool", "merino", "recycled wool"], regain: { worsted: 18.25, "semi-worsted": 17.0, woollen: 17.0, all: 18.25 } },
  { keywords: ["cashmere"], regain: { worsted: 17.0, "semi-worsted": 15.5, woollen: 15.5, all: 17.0 } },
  { keywords: ["mohair"], regain: { worsted: 15.0, "semi-worsted": 14.0, woollen: 14.0, all: 15.0 } },
  { keywords: ["alpaca", "llama"], regain: { worsted: 15.0, "semi-worsted": 14.0, woollen: 14.0, all: 15.0 } },
  { keywords: ["camel"], regain: { worsted: 15.0, "semi-worsted": 14.0, woollen: 14.0, all: 15.0 } },
  { keywords: ["yak"], regain: { worsted: 17.0, "semi-worsted": 15.5, woollen: 15.5, all: 17.0 } },
  { keywords: ["angora"], regain: { worsted: 15.0, "semi-worsted": 14.0, woollen: 14.0, all: 15.0 } },
  { keywords: ["silk"], regain: { worsted: 11.0, "semi-worsted": 11.0, woollen: 11.0, all: 11.0 } },
  { keywords: ["vicuña", "vicuna", "guanaco", "qiviut"], regain: { worsted: 15.0, "semi-worsted": 15.0, woollen: 15.0, all: 15.0 } },
  { keywords: ["pashmina"], regain: { worsted: 17.0, "semi-worsted": 15.5, woollen: 15.5, all: 17.0 } },

  // 1.2 Plant Fibres
  { keywords: ["cotton", "recycled cotton", "organic cotton"], regain: { worsted: 8.5, "semi-worsted": 8.5, woollen: 8.5, all: 8.5 } },
  { keywords: ["linen", "flax"], regain: { worsted: 12.0, "semi-worsted": 12.0, woollen: 12.0, all: 12.0 } },
  { keywords: ["ramie"], regain: { worsted: 12.0, "semi-worsted": 12.0, woollen: 12.0, all: 12.0 } },
  { keywords: ["hemp"], regain: { worsted: 12.0, "semi-worsted": 12.0, woollen: 12.0, all: 12.0 } },
  { keywords: ["jute"], regain: { worsted: 13.75, "semi-worsted": 13.75, woollen: 13.75, all: 13.75 } },
  { keywords: ["sisal"], regain: { worsted: 12.0, "semi-worsted": 12.0, woollen: 12.0, all: 12.0 } },
  { keywords: ["coir"], regain: { worsted: 12.0, "semi-worsted": 12.0, woollen: 12.0, all: 12.0 } },
  { keywords: ["kapok"], regain: { worsted: 10.0, "semi-worsted": 10.0, woollen: 10.0, all: 10.0 } },
  { keywords: ["kenaf"], regain: { worsted: 12.0, "semi-worsted": 12.0, woollen: 12.0, all: 12.0 } },
  { keywords: ["abaca", "manila"], regain: { worsted: 12.0, "semi-worsted": 12.0, woollen: 12.0, all: 12.0 } },
  { keywords: ["pineapple", "piña"], regain: { worsted: 12.0, "semi-worsted": 12.0, woollen: 12.0, all: 12.0 } },
  { keywords: ["banana fibre", "banana fiber"], regain: { worsted: 12.0, "semi-worsted": 12.0, woollen: 12.0, all: 12.0 } },

  // 1.3 Regenerated Cellulosic
  { keywords: ["viscose", "rayon"], regain: { worsted: 13.0, "semi-worsted": 13.0, woollen: 13.0, all: 13.0 } },
  { keywords: ["modal"], regain: { worsted: 13.0, "semi-worsted": 13.0, woollen: 13.0, all: 13.0 } },
  { keywords: ["lyocell", "tencel"], regain: { worsted: 13.0, "semi-worsted": 13.0, woollen: 13.0, all: 13.0 } },
  { keywords: ["cupro", "cuprammonium", "bemberg"], regain: { worsted: 12.5, "semi-worsted": 12.5, woollen: 12.5, all: 12.5 } },
  { keywords: ["acetate"], regain: { worsted: 6.5, "semi-worsted": 6.5, woollen: 6.5, all: 6.5 } },
  { keywords: ["triacetate"], regain: { worsted: 3.5, "semi-worsted": 3.5, woollen: 3.5, all: 3.5 } },
  { keywords: ["bamboo viscose", "bamboo rayon"], regain: { worsted: 13.0, "semi-worsted": 13.0, woollen: 13.0, all: 13.0 } },
  { keywords: ["seacell"], regain: { worsted: 13.0, "semi-worsted": 13.0, woollen: 13.0, all: 13.0 } },
  { keywords: ["ecovero"], regain: { worsted: 13.0, "semi-worsted": 13.0, woollen: 13.0, all: 13.0 } },

  // 1.4 Synthetic Fibres
  { keywords: ["polyester", "pet", "rPET", "trevira"], regain: { worsted: 0.4, "semi-worsted": 0.4, woollen: 0.4, all: 0.4 } },
  { keywords: ["nylon 6,6", "nylon 66", "polyamide 6,6", "polyamide 66"], regain: { worsted: 4.0, "semi-worsted": 4.0, woollen: 4.0, all: 4.0 } },
  { keywords: ["nylon 6", "nylon6", "polyamide 6", "polyamide6"], regain: { worsted: 4.5, "semi-worsted": 4.5, woollen: 4.5, all: 4.5 } },
  { keywords: ["nylon 4,6", "polyamide 4,6"], regain: { worsted: 4.5, "semi-worsted": 4.5, woollen: 4.5, all: 4.5 } },
  { keywords: ["nylon", "polyamide"], regain: { worsted: 4.5, "semi-worsted": 4.5, woollen: 4.5, all: 4.5 } }, // generic nylon fallback
  { keywords: ["acrylic"], regain: { worsted: 2.0, "semi-worsted": 2.0, woollen: 2.0, all: 2.0 } },
  { keywords: ["modacrylic"], regain: { worsted: 2.0, "semi-worsted": 2.0, woollen: 2.0, all: 2.0 } },
  { keywords: ["polypropylene", "pp fibre", "pp fiber"], regain: { worsted: 0.05, "semi-worsted": 0.05, woollen: 0.05, all: 0.05 } },
  { keywords: ["polyethylene", "pe fibre", "pe fiber"], regain: { worsted: 0.0, "semi-worsted": 0.0, woollen: 0.0, all: 0.0 } },
  { keywords: ["pla", "polylactic", "ingeo"], regain: { worsted: 0.5, "semi-worsted": 0.5, woollen: 0.5, all: 0.5 } },
  { keywords: ["elastane", "spandex", "lycra"], regain: { worsted: 1.3, "semi-worsted": 1.3, woollen: 1.3, all: 1.3 } },
  { keywords: ["aramid", "nomex"], regain: { worsted: 6.5, "semi-worsted": 6.5, woollen: 6.5, all: 6.5 } },
  { keywords: ["kevlar"], regain: { worsted: 7.0, "semi-worsted": 7.0, woollen: 7.0, all: 7.0 } },
  { keywords: ["pbi", "polybenzimidazole"], regain: { worsted: 15.0, "semi-worsted": 15.0, woollen: 15.0, all: 15.0 } },
  { keywords: ["pbo", "zylon"], regain: { worsted: 2.0, "semi-worsted": 2.0, woollen: 2.0, all: 2.0 } },
  { keywords: ["uhmwpe", "dyneema", "spectra"], regain: { worsted: 0.0, "semi-worsted": 0.0, woollen: 0.0, all: 0.0 } },
  { keywords: ["ptfe", "teflon"], regain: { worsted: 0.0, "semi-worsted": 0.0, woollen: 0.0, all: 0.0 } },
  { keywords: ["carbon fibre", "carbon fiber"], regain: { worsted: 0.0, "semi-worsted": 0.0, woollen: 0.0, all: 0.0 } },
  { keywords: ["glass fibre", "glass fiber"], regain: { worsted: 0.0, "semi-worsted": 0.0, woollen: 0.0, all: 0.0 } },

  // 1.5 Specialty / Bio-Based
  { keywords: ["soy protein", "soy fibre", "soy fiber"], regain: { worsted: 8.5, "semi-worsted": 8.5, woollen: 8.5, all: 8.5 } },
  { keywords: ["milk protein", "casein fibre", "casein fiber"], regain: { worsted: 7.0, "semi-worsted": 7.0, woollen: 7.0, all: 7.0 } },
  { keywords: ["chitosan"], regain: { worsted: 10.0, "semi-worsted": 10.0, woollen: 10.0, all: 10.0 } },
  { keywords: ["bamboo"], regain: { worsted: 12.0, "semi-worsted": 12.0, woollen: 12.0, all: 12.0 } },
];

/**
 * Parse composition string like "50% Wool / 30% Polyester / 20% Nylon"
 * Returns array of { fibre, percentage }
 */
export function parseComposition(composition: string): Array<{ fibre: string; percentage: number }> {
  if (!composition) return [];

  const input = composition.trim();
  const result: Array<{ fibre: string; percentage: number }> = [];

  // 1) First try to parse repeated "NN% Fibre" segments across the whole string.
  // Handles compact inputs like:
  // - "55%Polyester 45%Wool"
  // - "55% Polyester / 45% Wool"
  // - "40% Wool 30% Polyester 30% Nylon 6,6"
  const segmentRegex = /(\d+(?:\.\d+)?)\s*%?\s*([^/;,]+?)(?=\s*[/;,]?\s*\d+(?:\.\d+)?\s*%?|$)/g;
  let match: RegExpExecArray | null;
  while ((match = segmentRegex.exec(input)) !== null) {
    const percentage = parseFloat(match[1]);
    const fibre = match[2].trim();
    if (!Number.isNaN(percentage) && fibre) {
      result.push({ percentage, fibre });
    }
  }

  if (result.length > 0) return result;

  // 2) Fallback: split by separators and parse each part.
  const parts = input.split(/[/;,]+/).map((s) => s.trim()).filter(Boolean);
  for (const part of parts) {
    const match1 = part.match(/^(\d+(?:\.\d+)?)\s*%?\s*(.+)$/);
    const match2 = part.match(/^(.+?)\s+(\d+(?:\.\d+)?)\s*%?$/);

    if (match1 && match1[2].trim()) {
      result.push({ percentage: parseFloat(match1[1]), fibre: match1[2].trim() });
    } else if (match2 && match2[1].trim()) {
      result.push({ percentage: parseFloat(match2[2]), fibre: match2[1].trim() });
    }
  }

  // 3) Final fallback: single fibre without percentage => assume 100%
  if (result.length === 0 && input) {
    result.push({ percentage: 100, fibre: input.replace(/\d+%?\s*/g, "").trim() || input });
  }

  return result;
}

/**
 * Find the regain % for a given fibre name and spinning type
 */
function findRegain(fibre: string, spinningType: string): number | null {
  const lower = fibre.toLowerCase();
  const spinCat = normalizeSpinning(spinningType);

  // Try specific nylon types first (nylon 6,6 before generic nylon)
  const sorted = [...REGAIN_TABLE].sort((a, b) => {
    const aSpec = a.keywords.some((k) => k.includes(",") || k.includes("6"));
    const bSpec = b.keywords.some((k) => k.includes(",") || k.includes("6"));
    return (bSpec ? 1 : 0) - (aSpec ? 1 : 0);
  });

  for (const entry of sorted) {
    if (entry.keywords.some((k) => lower.includes(k))) {
      return entry.regain[spinCat] ?? entry.regain["all"] ?? null;
    }
  }
  return null;
}

function normalizeSpinning(spinningType: string): string {
  if (!spinningType) return "all";
  const lower = spinningType.toLowerCase();
  if (lower.includes("worsted") && (lower.includes("semi") || lower.includes("half"))) return "semi-worsted";
  if (lower.includes("woollen") || lower.includes("woolen")) return "woollen";
  if (lower.includes("worsted")) return "worsted";
  return "all";
}

export interface RegainResult {
  blendedRegain: number;
  components: Array<{
    fibre: string;
    percentage: number;
    regain: number | null;
    contribution: number | null;
  }>;
  hasUnknown: boolean;
}

/**
 * Calculate blended commercial moisture regain
 * R_blend = Σ (P_i × R_i)
 */
export function calculateMoistureRegain(composition: string, spinningType: string): RegainResult | null {
  const parsed = parseComposition(composition);
  if (parsed.length === 0) return null;

  let blendedRegain = 0;
  let hasUnknown = false;
  const components = parsed.map((p) => {
    const regain = findRegain(p.fibre, spinningType);
    const pct = p.percentage / 100;
    const contribution = regain != null ? pct * regain : null;
    if (regain == null) hasUnknown = true;
    else blendedRegain += contribution!;
    return { fibre: p.fibre, percentage: p.percentage, regain, contribution };
  });

  return { blendedRegain, components, hasUnknown };
}

/**
 * Convert between net weight price and condition weight price
 * Condition Weight = Net Weight × (1 + R/100)
 * Price_condition = Price_net / (1 + R/100)
 * Price_net = Price_condition × (1 + R/100)
 */
export function netToCondition(netPrice: number, regainPct: number): number {
  return netPrice / (1 + regainPct / 100);
}

export function conditionToNet(conditionPrice: number, regainPct: number): number {
  return conditionPrice * (1 + regainPct / 100);
}
