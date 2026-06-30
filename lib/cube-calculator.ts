import { supabase } from "@/lib/supabase";

export type CubeItem = {
  item_key: string;
  name_pt_br: string | null;
  name_en_us: string | null;
  grade: string | null;
  item_type: string | null;
  gear_type: string | null;
  parts: string | null;
  level: string | null;
  icon_path: string | null;
  lowest_price_brl: number | null;
  median_price_brl: number | null;
  volume: string | null;
  market_hash_name: string | null;
  drop_count: number | null;
  market_score: number | null;
};

export type CubeData = {
  items: CubeItem[];
  summary: {
    totalItems: number;
    pricedItems: number;
    grades: string[];
    types: string[];
  };
};

const SELECT_MARKET_VIEW = "item_key,name_pt_br,name_en_us,grade,item_type,gear_type,parts,level,icon_path,lowest_price_brl,median_price_brl,volume,market_hash_name,drop_count,market_score";
const SELECT_ITEMS = "item_key,name_pt_br,name_en_us,grade,item_type,gear_type,parts,level,icon_path";
const SELECT_PRICES = "item_key,lowest_price_brl,median_price_brl,volume,market_hash_name";

function toNumber(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function normalizeItem(row: Record<string, unknown>): CubeItem {
  return {
    item_key: String(row.item_key ?? ""),
    name_pt_br: (row.name_pt_br as string | null) ?? null,
    name_en_us: (row.name_en_us as string | null) ?? null,
    grade: (row.grade as string | null) ?? null,
    item_type: (row.item_type as string | null) ?? null,
    gear_type: (row.gear_type as string | null) ?? null,
    parts: (row.parts as string | null) ?? null,
    level: row.level === null || row.level === undefined ? null : String(row.level),
    icon_path: (row.icon_path as string | null) ?? null,
    lowest_price_brl: toNumber(row.lowest_price_brl),
    median_price_brl: toNumber(row.median_price_brl),
    volume: row.volume === null || row.volume === undefined ? null : String(row.volume),
    market_hash_name: (row.market_hash_name as string | null) ?? null,
    drop_count: toNumber(row.drop_count),
    market_score: toNumber(row.market_score),
  };
}

function uniqueSorted(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map((v) => String(v ?? "").trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

async function readMarketView(): Promise<CubeItem[] | null> {
  const db = supabase();
  const { data, error } = await db
    .from("tbh_market_items_view")
    .select(SELECT_MARKET_VIEW)
    .not("grade", "is", null)
    .order("lowest_price_brl", { ascending: false, nullsFirst: false })
    .limit(1800);

  if (error) return null;
  return ((data ?? []) as Array<Record<string, unknown>>).map(normalizeItem).filter((item) => item.item_key);
}

async function readItemsFallback(): Promise<CubeItem[]> {
  const db = supabase();
  const { data: itemData, error: itemError } = await db
    .from("tbh_items_full")
    .select(SELECT_ITEMS)
    .not("grade", "is", null)
    .limit(2200);

  if (itemError) throw itemError;

  const items = ((itemData ?? []) as Array<Record<string, unknown>>).map(normalizeItem).filter((item) => item.item_key);
  const keys = items.map((item) => item.item_key).slice(0, 1000);

  if (!keys.length) return items;

  const { data: priceData } = await db
    .from("tbh_market_prices")
    .select(SELECT_PRICES)
    .in("item_key", keys);

  const priceMap = new Map<string, Record<string, unknown>>();
  for (const row of (priceData ?? []) as Array<Record<string, unknown>>) {
    if (row.item_key) priceMap.set(String(row.item_key), row);
  }

  return items.map((item) => {
    const price = priceMap.get(item.item_key);
    if (!price) return item;
    return normalizeItem({ ...item, ...price });
  });
}

export async function getCubeCalculatorData(): Promise<CubeData> {
  const fromView = await readMarketView();
  const items = fromView && fromView.length ? fromView : await readItemsFallback();
  const grades = uniqueSorted(items.map((item) => item.grade));
  const types = uniqueSorted(items.map((item) => item.item_type));
  const pricedItems = items.filter((item) => Number(item.lowest_price_brl || item.median_price_brl || 0) > 0).length;

  return {
    items,
    summary: {
      totalItems: items.length,
      pricedItems,
      grades,
      types,
    },
  };
}
