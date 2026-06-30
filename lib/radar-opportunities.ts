import { supabase } from "@/lib/supabase";

export type RadarFilters = {
  budget?: number;
  focus?: string;
};

export type RadarMarketItem = {
  itemKey: string;
  name: string;
  nameEn: string | null;
  iconPath: string | null;
  grade: string | null;
  itemType: string | null;
  gearType: string | null;
  parts: string | null;
  level: string | null;
  marketHashName: string | null;
  priceBrl: number;
  medianBrl: number;
  priceText: string | null;
  medianText: string | null;
  volumeText: string | null;
  volume: number;
  updatedAt: string | null;
  discountPercent: number;
  radarScore: number;
  reason: string;
};

export type RadarFarm = {
  key: string;
  stageKey: string;
  stageName: string;
  act: string | null;
  stageNo: string | null;
  stageLevel: string | null;
  sourceType: string | null;
  estimatedValueBrl: number;
  bestPriceBrl: number;
  pricedDrops: number;
  totalDrops: number;
  score: number;
  bestItem: RadarMarketItem | null;
  topItems: RadarMarketItem[];
};

export type RadarAlert = {
  title: string;
  body: string;
  href: string;
  tone: "sell" | "buy" | "farm" | "cube";
};

export type RadarData = {
  summary: {
    pricedItems: number;
    updatedAt: string | null;
    bestDealPercent: number;
    bestFarmValue: number;
    budget: number;
  };
  sellNow: RadarMarketItem[];
  buyDeals: RadarMarketItem[];
  cubeTargets: RadarMarketItem[];
  farms: RadarFarm[];
  alerts: RadarAlert[];
};

type PriceRow = {
  item_key: string;
  market_hash_name: string | null;
  lowest_price_text: string | null;
  median_price_text: string | null;
  volume: string | null;
  lowest_price_brl: number | string | null;
  median_price_brl: number | string | null;
  updated_at: string | null;
  last_success_at: string | null;
};

type ItemRow = {
  item_key: string;
  icon_path: string | null;
  name_pt_br: string | null;
  name_en_us: string | null;
  grade: string | null;
  item_type: string | null;
  gear_type: string | null;
  parts: string | null;
  level: string | null;
};

type DropRow = {
  id: number;
  stage_key: string | null;
  stage_name_pt_br: string | null;
  stage_name_en_us: string | null;
  act: string | null;
  stage_no: string | null;
  stage_level: string | null;
  source_type: string | null;
  resolved_item_key: string | null;
  weight_percent_within_dropkey: number | string | null;
};

const GRADE_WEIGHT: Record<string, number> = {
  COMMON: 8,
  UNCOMMON: 14,
  RARE: 24,
  LEGENDARY: 42,
  IMMORTAL: 58,
  ARCANA: 72,
  BEYOND: 82,
  CELESTIAL: 90,
  DIVINE: 96,
  COSMIC: 100,
};

function asNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^0-9,.-]/g, "").replace(",", "."));
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function volumeNumber(value?: string | null) {
  const parsed = Number(String(value ?? "").replace(/[^0-9]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function gradeScore(grade?: string | null) {
  return GRADE_WEIGHT[String(grade ?? "").toUpperCase()] ?? 10;
}

function itemName(item?: ItemRow, price?: PriceRow) {
  return item?.name_pt_br || item?.name_en_us || price?.market_hash_name || price?.item_key || "Item";
}

function reasonFor(item: RadarMarketItem) {
  const rarity = String(item.grade ?? "").toUpperCase();
  const rare = ["LEGENDARY", "IMMORTAL", "ARCANA", "BEYOND", "CELESTIAL", "DIVINE", "COSMIC"].includes(rarity);
  if (item.discountPercent >= 25) return `abaixo da mediana em ${Math.round(item.discountPercent)}%`;
  if (item.priceBrl >= 20 && item.volume > 0) return "preço alto com mercado ativo";
  if (rare && item.priceBrl <= 8) return "raridade boa com preço baixo";
  if (item.priceBrl <= 3) return "baixo custo para Cube ou estoque";
  return "boa combinação de preço, raridade e liquidez";
}

function buildMarketItem(price: PriceRow, item?: ItemRow): RadarMarketItem {
  const priceBrl = asNumber(price.lowest_price_brl);
  const medianBrl = asNumber(price.median_price_brl);
  const volume = volumeNumber(price.volume);
  const discountPercent = medianBrl > priceBrl && priceBrl > 0 ? ((medianBrl - priceBrl) / medianBrl) * 100 : 0;
  const rarity = gradeScore(item?.grade);
  const liquidity = volume >= 3000 ? 24 : volume >= 1000 ? 18 : volume >= 300 ? 13 : volume >= 80 ? 8 : volume > 0 ? 4 : 0;
  const radarScore = Math.round((rarity * 0.55 + Math.min(priceBrl, 120) * 0.7 + discountPercent * 0.85 + liquidity) * 100) / 100;

  const result: RadarMarketItem = {
    itemKey: price.item_key,
    name: itemName(item, price),
    nameEn: item?.name_en_us ?? null,
    iconPath: item?.icon_path ?? null,
    grade: item?.grade ?? null,
    itemType: item?.item_type ?? null,
    gearType: item?.gear_type ?? null,
    parts: item?.parts ?? null,
    level: item?.level ?? null,
    marketHashName: price.market_hash_name,
    priceBrl,
    medianBrl,
    priceText: price.lowest_price_text,
    medianText: price.median_price_text,
    volumeText: price.volume,
    volume,
    updatedAt: price.last_success_at || price.updated_at,
    discountPercent: Math.max(0, discountPercent),
    radarScore,
    reason: "",
  };
  result.reason = reasonFor(result);
  return result;
}

function stageName(row: DropRow) {
  return row.stage_name_pt_br || row.stage_name_en_us || (row.act && row.stage_no ? `Ato ${row.act}-${row.stage_no}` : row.stage_key) || "Fase";
}

function uniqueByKey<T extends { itemKey: string }>(items: T[]) {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    if (seen.has(item.itemKey)) continue;
    seen.add(item.itemKey);
    out.push(item);
  }
  return out;
}

async function getPrices() {
  const db = supabase();
  const select = "item_key,market_hash_name,lowest_price_text,median_price_text,volume,lowest_price_brl,median_price_brl,updated_at,last_success_at";

  const [expensive, cheap, updated] = await Promise.all([
    db.from("tbh_market_prices").select(select).gt("lowest_price_brl", 0).order("lowest_price_brl", { ascending: false, nullsFirst: false }).limit(260),
    db.from("tbh_market_prices").select(select).gt("lowest_price_brl", 0).order("lowest_price_brl", { ascending: true, nullsFirst: false }).limit(260),
    db.from("tbh_market_prices").select(select).gt("lowest_price_brl", 0).order("updated_at", { ascending: false, nullsFirst: false }).limit(120),
  ]);

  if (expensive.error) throw expensive.error;
  if (cheap.error) throw cheap.error;
  if (updated.error) throw updated.error;

  const rows = [...((expensive.data ?? []) as PriceRow[]), ...((cheap.data ?? []) as PriceRow[]), ...((updated.data ?? []) as PriceRow[])];
  const map = new Map<string, PriceRow>();
  for (const row of rows) {
    if (!row.item_key) continue;
    const prev = map.get(row.item_key);
    if (!prev || asNumber(row.lowest_price_brl) > asNumber(prev.lowest_price_brl)) map.set(row.item_key, row);
  }
  return Array.from(map.values());
}

async function getItemMap(itemKeys: string[]) {
  if (!itemKeys.length) return new Map<string, ItemRow>();
  const db = supabase();
  const { data, error } = await db
    .from("tbh_items_full")
    .select("item_key,icon_path,name_pt_br,name_en_us,grade,item_type,gear_type,parts,level")
    .in("item_key", itemKeys.slice(0, 900));
  if (error) throw error;
  return new Map(((data ?? []) as ItemRow[]).map((item) => [item.item_key, item]));
}

async function getFarmRadar(items: RadarMarketItem[]) {
  const chosenKeys = uniqueByKey([
    ...items.filter((i) => i.priceBrl >= 5).sort((a, b) => b.priceBrl - a.priceBrl).slice(0, 140),
    ...items.filter((i) => i.discountPercent >= 15).sort((a, b) => b.discountPercent - a.discountPercent).slice(0, 80),
  ]).map((i) => i.itemKey);

  if (!chosenKeys.length) return [] as RadarFarm[];

  const db = supabase();
  const { data, error } = await db
    .from("tbh_stage_drop_items")
    .select("id,stage_key,stage_name_pt_br,stage_name_en_us,act,stage_no,stage_level,source_type,resolved_item_key,weight_percent_within_dropkey")
    .in("resolved_item_key", chosenKeys.slice(0, 220))
    .not("stage_key", "is", null)
    .order("weight_percent_within_dropkey", { ascending: false, nullsFirst: false })
    .limit(900);

  if (error) throw error;

  const itemMap = new Map(items.map((item) => [item.itemKey, item]));
  const farmMap = new Map<string, RadarFarm>();

  for (const row of (data ?? []) as DropRow[]) {
    if (!row.stage_key || !row.resolved_item_key) continue;
    const item = itemMap.get(row.resolved_item_key);
    if (!item) continue;
    const weight = Math.max(0.1, asNumber(row.weight_percent_within_dropkey, 0));
    const estimated = item.priceBrl * weight / 100;
    const key = `${row.stage_key}::${row.source_type || "DROP"}`;
    const current = farmMap.get(key) ?? {
      key,
      stageKey: row.stage_key,
      stageName: stageName(row),
      act: row.act,
      stageNo: row.stage_no,
      stageLevel: row.stage_level,
      sourceType: row.source_type,
      estimatedValueBrl: 0,
      bestPriceBrl: 0,
      pricedDrops: 0,
      totalDrops: 0,
      score: 0,
      bestItem: null,
      topItems: [],
    };

    current.totalDrops += 1;
    current.pricedDrops += item.priceBrl > 0 ? 1 : 0;
    current.estimatedValueBrl += estimated;
    current.bestPriceBrl = Math.max(current.bestPriceBrl, item.priceBrl);
    if (!current.bestItem || item.priceBrl > current.bestItem.priceBrl) current.bestItem = item;
    if (!current.topItems.find((top) => top.itemKey === item.itemKey)) current.topItems.push(item);
    farmMap.set(key, current);
  }

  return Array.from(farmMap.values())
    .map((farm) => {
      farm.estimatedValueBrl = Math.round(farm.estimatedValueBrl * 10000) / 10000;
      farm.topItems = farm.topItems.sort((a, b) => b.priceBrl - a.priceBrl).slice(0, 4);
      const coverage = farm.totalDrops ? farm.pricedDrops / farm.totalDrops : 0;
      farm.score = Math.round((farm.estimatedValueBrl * 35 + farm.bestPriceBrl * 0.8 + coverage * 18 + farm.pricedDrops * 1.1) * 100) / 100;
      return farm;
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);
}

function makeAlerts(data: Pick<RadarData, "sellNow" | "buyDeals" | "cubeTargets" | "farms">) {
  const alerts: RadarAlert[] = [];
  const sell = data.sellNow[0];
  const buy = data.buyDeals[0];
  const cube = data.cubeTargets[0];
  const farm = data.farms[0];

  if (sell) alerts.push({
    title: "Bom momento para vender",
    body: `${sell.name} aparece com preço forte e mercado ativo. Vale conferir antes de segurar no inventário.`,
    href: `/items/${encodeURIComponent(sell.itemKey)}`,
    tone: "sell",
  });

  if (buy && buy.discountPercent >= 15) alerts.push({
    title: "Possível compra barata",
    body: `${buy.name} está cerca de ${Math.round(buy.discountPercent)}% abaixo da mediana cacheada.`,
    href: `/items/${encodeURIComponent(buy.itemKey)}`,
    tone: "buy",
  });

  if (farm) alerts.push({
    title: "Farm em destaque",
    body: `${farm.stageName} tem bons drops com valor de mercado. Melhor item encontrado: ${farm.bestItem?.name ?? "item valioso"}.`,
    href: `/farm/optimizer?q=${encodeURIComponent(farm.stageName)}`,
    tone: "farm",
  });

  if (cube) alerts.push({
    title: "Material para Cube",
    body: `${cube.name} tem baixo custo e pode entrar na lista de sacrifício, se não for útil na build.`,
    href: `/cube?q=${encodeURIComponent(cube.itemKey)}`,
    tone: "cube",
  });

  return alerts;
}

export async function getRadarData(filters: RadarFilters = {}): Promise<RadarData> {
  const budget = Math.max(0.5, Math.min(999, Number(filters.budget || 10)));
  const priceRows = await getPrices();
  const itemMap = await getItemMap(priceRows.map((row) => row.item_key));
  const allItems = priceRows.map((row) => buildMarketItem(row, itemMap.get(row.item_key))).filter((item) => item.priceBrl > 0);

  const sellNow = uniqueByKey(allItems)
    .filter((item) => item.priceBrl >= Math.max(2, budget * 0.55))
    .sort((a, b) => b.radarScore - a.radarScore || b.priceBrl - a.priceBrl)
    .slice(0, 12);

  const buyDeals = uniqueByKey(allItems)
    .filter((item) => item.medianBrl > item.priceBrl && item.discountPercent >= 10)
    .sort((a, b) => b.discountPercent - a.discountPercent || b.radarScore - a.radarScore)
    .slice(0, 12);

  const cubeTargets = uniqueByKey(allItems)
    .filter((item) => item.priceBrl <= budget && !["DIVINE", "COSMIC", "CELESTIAL"].includes(String(item.grade ?? "").toUpperCase()))
    .sort((a, b) => (gradeScore(b.grade) / Math.max(b.priceBrl, 0.15)) - (gradeScore(a.grade) / Math.max(a.priceBrl, 0.15)))
    .slice(0, 12);

  const farms = await getFarmRadar([...sellNow, ...buyDeals, ...cubeTargets, ...allItems.slice(0, 100)]);
  const updatedAt = allItems.map((item) => item.updatedAt).filter(Boolean).sort().at(-1) ?? null;

  const result = {
    summary: {
      pricedItems: allItems.length,
      updatedAt,
      bestDealPercent: buyDeals[0]?.discountPercent ?? 0,
      bestFarmValue: farms[0]?.estimatedValueBrl ?? 0,
      budget,
    },
    sellNow,
    buyDeals,
    cubeTargets,
    farms,
    alerts: [] as RadarAlert[],
  };

  result.alerts = makeAlerts(result);
  return result;
}
