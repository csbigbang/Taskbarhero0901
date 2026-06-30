import { supabase } from "@/lib/supabase";

export type BuildPlannerItem = {
  item_key: string;
  item_type: string | null;
  grade: string | null;
  parts: string | null;
  gear_type: string | null;
  level: string | null;
  icon_path: string | null;
  name_pt_br: string | null;
  name_en_us: string | null;
  lowest_price_brl: number | null;
  median_price_brl: number | null;
  volume: string | null;
  market_hash_name: string | null;
  last_success_at: string | null;
};

export type BuildPlannerStats = {
  items: number;
  priced: number;
  marketable: number;
  generatedAt: string;
};

const SELECT_ITEMS = "item_key,item_type,grade,parts,gear_type,level,icon_path,name_pt_br,name_en_us,is_steam_item,is_can_exchange_marketable";
const SELECT_PRICES = "item_key,market_hash_name,lowest_price_brl,median_price_brl,volume,last_success_at";

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function keyOf(row: { item_key?: string | null }) {
  return String(row.item_key ?? "").trim();
}

export async function getBuildPlannerData(): Promise<{ items: BuildPlannerItem[]; stats: BuildPlannerStats }> {
  const db = supabase();

  const [itemsResult, pricesResult, itemCountResult, pricedCountResult] = await Promise.all([
    db
      .from("tbh_items_full")
      .select(SELECT_ITEMS)
      .or("item_type.eq.GEAR,item_type.eq.MATERIAL,item_type.eq.RUNE,item_type.eq.CONSUMABLE,item_type.eq.STAGEBOX")
      .order("item_key", { ascending: true })
      .limit(2200),
    db
      .from("tbh_market_prices")
      .select(SELECT_PRICES)
      .not("lowest_price_brl", "is", null)
      .order("lowest_price_brl", { ascending: false, nullsFirst: false })
      .limit(1600),
    db.from("tbh_items_full").select("item_key", { count: "exact", head: true }),
    db.from("tbh_market_prices").select("item_key", { count: "exact", head: true }).not("lowest_price_brl", "is", null)
  ]);

  if (itemsResult.error) throw itemsResult.error;
  if (pricesResult.error) {
    // O planner funciona mesmo sem mercado. Nesse caso os valores ficam nulos.
    console.warn("Build planner: preços não carregados", pricesResult.error.message);
  }

  const priceMap = new Map<string, any>();
  for (const price of pricesResult.data ?? []) {
    priceMap.set(keyOf(price), price);
  }

  const items = (itemsResult.data ?? []).map((row: any) => {
    const price = priceMap.get(keyOf(row));
    return {
      item_key: keyOf(row),
      item_type: row.item_type ?? null,
      grade: row.grade ?? null,
      parts: row.parts ?? null,
      gear_type: row.gear_type ?? null,
      level: row.level ?? null,
      icon_path: row.icon_path ?? null,
      name_pt_br: row.name_pt_br ?? null,
      name_en_us: row.name_en_us ?? null,
      lowest_price_brl: toNumber(price?.lowest_price_brl),
      median_price_brl: toNumber(price?.median_price_brl),
      volume: price?.volume ?? null,
      market_hash_name: price?.market_hash_name ?? null,
      last_success_at: price?.last_success_at ?? null
    } satisfies BuildPlannerItem;
  });

  return {
    items,
    stats: {
      items: itemCountResult.count ?? items.length,
      priced: pricedCountResult.count ?? priceMap.size,
      marketable: priceMap.size,
      generatedAt: new Date().toISOString()
    }
  };
}
