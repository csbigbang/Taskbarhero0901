export type ScoreGrade =
  | "COMMON"
  | "UNCOMMON"
  | "RARE"
  | "LEGENDARY"
  | "IMMORTAL"
  | "ARCANA"
  | "BEYOND"
  | "CELESTIAL"
  | "DIVINE"
  | "COSMIC";

export const RARITY_SCORE: Record<string, number> = {
  COMMON: 10,
  UNCOMMON: 18,
  RARE: 28,
  LEGENDARY: 42,
  IMMORTAL: 56,
  ARCANA: 68,
  BEYOND: 78,
  CELESTIAL: 86,
  DIVINE: 94,
  COSMIC: 100,
};

export const RARITY_ORDER = [
  "COMMON",
  "UNCOMMON",
  "RARE",
  "LEGENDARY",
  "IMMORTAL",
  "ARCANA",
  "BEYOND",
  "CELESTIAL",
  "DIVINE",
  "COSMIC",
];

export type ComparableItem = {
  item_key: string;
  item_type?: string | null;
  grade?: string | null;
  parts?: string | null;
  gear_type?: string | null;
  gear_group?: string | null;
  level?: string | null;
  icon_path?: string | null;
  name_pt_br?: string | null;
  name_en_us?: string | null;
  market_hash_name?: string | null;
  lowest_price_brl?: number | null;
  median_price_brl?: number | null;
  volume?: string | null;
  market_score?: number | null;
  cost_benefit_score?: number | null;
  opportunity_score?: number | null;
  drop_count?: number | null;
  max_drop_weight_percent?: number | null;
};

export type ItemScoreBreakdown = {
  rarity: number;
  level: number;
  market: number;
  farm: number;
  liquidity: number;
  total: number;
};

function numberOrZero(value: unknown) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export function itemName(item: Partial<ComparableItem>) {
  return item.name_pt_br || item.name_en_us || item.market_hash_name || item.item_key || "Item";
}

export function gradeKey(value?: string | null) {
  return String(value || "").trim().toUpperCase();
}

export function rarityScore(value?: string | null) {
  return RARITY_SCORE[gradeKey(value)] ?? 6;
}

export function levelScore(value?: string | null) {
  const n = numberOrZero(value);
  if (!n) return 0;
  return Math.min(100, Math.max(0, n));
}

export function liquidityScore(volume?: string | null) {
  const raw = String(volume || "").replace(/[^0-9]/g, "");
  const n = numberOrZero(raw);
  if (!n) return 0;
  if (n >= 3000) return 100;
  if (n >= 1000) return 82;
  if (n >= 300) return 64;
  if (n >= 100) return 48;
  if (n >= 30) return 32;
  return 15;
}

export function farmScore(item: Partial<ComparableItem>) {
  const drops = numberOrZero(item.drop_count);
  const weight = numberOrZero(item.max_drop_weight_percent);
  return Math.min(100, drops * 0.9 + weight * 1.3);
}

export function marketPowerScore(item: Partial<ComparableItem>) {
  const cached = numberOrZero(item.market_score);
  if (cached > 0) return Math.min(100, cached);

  const price = numberOrZero(item.lowest_price_brl);
  const rarity = rarityScore(item.grade);
  if (!price) return rarity * 0.6;
  return Math.min(100, rarity * 0.45 + Math.min(price, 120) * 0.75);
}

export function calculateItemScore(item: Partial<ComparableItem>): ItemScoreBreakdown {
  const rarity = rarityScore(item.grade);
  const level = levelScore(item.level);
  const market = marketPowerScore(item);
  const farm = farmScore(item);
  const liquidity = liquidityScore(item.volume);

  const total = Math.round((rarity * 0.34 + level * 0.12 + market * 0.25 + farm * 0.17 + liquidity * 0.12) * 100) / 100;

  return { rarity, level, market, farm, liquidity, total };
}

export function scoreLabel(total: number) {
  if (total >= 86) return "S+";
  if (total >= 76) return "S";
  if (total >= 64) return "A";
  if (total >= 52) return "B";
  if (total >= 38) return "C";
  return "D";
}

export function compareValue(a?: number | null, b?: number | null) {
  const na = numberOrZero(a);
  const nb = numberOrZero(b);
  if (na === nb) return 0;
  return na > nb ? 1 : -1;
}

export function compareText(a?: string | null, b?: string | null) {
  const aa = String(a || "").trim();
  const bb = String(b || "").trim();
  if (aa === bb) return 0;
  if (!aa) return -1;
  if (!bb) return 1;
  return aa.localeCompare(bb, "pt-BR");
}
