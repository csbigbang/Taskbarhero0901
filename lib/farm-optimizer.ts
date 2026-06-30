import { supabase } from "@/lib/supabase";

export type FarmOptimizerOptions = {
  q?: string;
  grade?: string;
  source?: string;
  type?: string;
  minPrice?: number;
  mode?: "value" | "score" | "price" | "weight";
  limit?: number;
};

type DropRow = {
  id: number;
  stage_key: string | null;
  stage_name_pt_br: string | null;
  stage_name_en_us: string | null;
  act: string | null;
  stage_no: string | null;
  stage_level: string | null;
  stage_type: string | null;
  source_type: string | null;
  source_item_name_pt_br: string | null;
  source_item_key: string | null;
  weight: string | null;
  weight_percent_within_dropkey: number | null;
  resolved_item_key: string | null;
  item_name_pt_br: string | null;
  item_name_en_us: string | null;
  item_type: string | null;
  grade: string | null;
  level: string | null;
  gear_type: string | null;
  parts: string | null;
};

type PriceRow = {
  item_key: string;
  market_hash_name: string | null;
  lowest_price_text: string | null;
  median_price_text: string | null;
  volume: string | null;
  lowest_price_brl: number | null;
  median_price_brl: number | null;
  updated_at: string | null;
  last_success_at?: string | null;
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

export type FarmDropOpportunity = {
  id: number;
  itemKey: string;
  itemName: string;
  itemNameEn: string | null;
  iconPath: string | null;
  grade: string | null;
  itemType: string | null;
  gearType: string | null;
  parts: string | null;
  level: string | null;
  stageKey: string;
  stageName: string;
  act: string | null;
  stageNo: string | null;
  stageLevel: string | null;
  sourceType: string | null;
  sourceName: string | null;
  weightPercent: number;
  priceBrl: number | null;
  medianBrl: number | null;
  priceText: string | null;
  volume: string | null;
  marketHashName: string | null;
  estimatedValueBrl: number;
  score: number;
  updatedAt: string | null;
};

export type FarmStageOpportunity = {
  key: string;
  stageKey: string;
  stageName: string;
  act: string | null;
  stageNo: string | null;
  stageLevel: string | null;
  sourceType: string | null;
  sourceName: string | null;
  totalDrops: number;
  pricedDrops: number;
  estimatedValueBrl: number;
  bestPriceBrl: number;
  bestWeightedValueBrl: number;
  averagePriceBrl: number;
  score: number;
  bestItem: FarmDropOpportunity | null;
  topDrops: FarmDropOpportunity[];
};

export type FarmOptimizerResult = {
  summary: {
    dropsRead: number;
    itemsPriced: number;
    stagesFound: number;
    bestEstimatedValueBrl: number;
  };
  stages: FarmStageOpportunity[];
  drops: FarmDropOpportunity[];
};

const GRADE_SCORE: Record<string, number> = {
  COMMON: 8,
  UNCOMMON: 14,
  RARE: 22,
  LEGENDARY: 34,
  IMMORTAL: 48,
  ARCANA: 60,
  BEYOND: 72,
  CELESTIAL: 82,
  DIVINE: 92,
  COSMIC: 100,
};

function safe(value?: string | null) {
  return String(value ?? "").trim().replace(/[%,()]/g, "").slice(0, 120);
}

function numberValue(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function stageTitle(row: Pick<DropRow, "stage_name_pt_br" | "stage_name_en_us" | "stage_key" | "act" | "stage_no">) {
  if (row.stage_name_pt_br) return row.stage_name_pt_br;
  if (row.stage_name_en_us) return row.stage_name_en_us;
  if (row.act && row.stage_no) return `Ato ${row.act}-${row.stage_no}`;
  return row.stage_key ?? "Fase desconhecida";
}

function itemTitle(row: Pick<DropRow, "item_name_pt_br" | "item_name_en_us" | "resolved_item_key">, item?: ItemRow) {
  return item?.name_pt_br || row.item_name_pt_br || item?.name_en_us || row.item_name_en_us || row.resolved_item_key || "Item desconhecido";
}

function scoreDrop(params: { grade?: string | null; price: number; weight: number; volume?: string | null; estimated: number }) {
  const gradeScore = GRADE_SCORE[String(params.grade ?? "").toUpperCase()] ?? 6;
  const volumeBonus = params.volume ? Math.min(String(params.volume).replace(/\D/g, "").length * 3, 18) : 0;
  return Number((gradeScore * 0.55 + Math.min(params.price, 120) * 0.55 + params.weight * 0.85 + params.estimated * 16 + volumeBonus).toFixed(2));
}

export async function getFarmOptimizerData(options: FarmOptimizerOptions): Promise<FarmOptimizerResult> {
  const db = supabase();
  const q = safe(options.q);
  const grade = safe(options.grade).toUpperCase();
  const source = safe(options.source).toUpperCase();
  const type = safe(options.type).toUpperCase();
  const minPrice = Math.max(0, Number(options.minPrice || 0));
  const limit = Math.min(Math.max(Number(options.limit || 700), 100), 1200);
  const mode = options.mode ?? "value";

  let req = db
    .from("tbh_stage_drop_items")
    .select("id,stage_key,stage_name_pt_br,stage_name_en_us,act,stage_no,stage_level,stage_type,source_type,source_item_name_pt_br,source_item_key,weight,weight_percent_within_dropkey,resolved_item_key,item_name_pt_br,item_name_en_us,item_type,grade,level,gear_type,parts")
    .not("resolved_item_key", "is", null)
    .order("weight_percent_within_dropkey", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (q) {
    req = req.or(`item_name_pt_br.ilike.%${q}%,item_name_en_us.ilike.%${q}%,stage_name_pt_br.ilike.%${q}%,stage_name_en_us.ilike.%${q}%,resolved_item_key.ilike.%${q}%,stage_key.ilike.%${q}%,source_item_name_pt_br.ilike.%${q}%`);
  }
  if (grade) req = req.eq("grade", grade);
  if (source) req = req.eq("source_type", source);
  if (type) req = req.eq("item_type", type);

  const { data: dropData, error: dropError } = await req;
  if (dropError) throw dropError;

  const drops = (dropData ?? []) as DropRow[];
  const itemKeys = Array.from(new Set(drops.map((d) => d.resolved_item_key).filter(Boolean))) as string[];

  let prices = new Map<string, PriceRow>();
  let items = new Map<string, ItemRow>();

  if (itemKeys.length) {
    const [priceRes, itemRes] = await Promise.all([
      db
        .from("tbh_market_prices")
        .select("item_key,market_hash_name,lowest_price_text,median_price_text,volume,lowest_price_brl,median_price_brl,updated_at,last_success_at")
        .in("item_key", itemKeys.slice(0, 1000)),
      db
        .from("tbh_items_full")
        .select("item_key,icon_path,name_pt_br,name_en_us,grade,item_type,gear_type,parts,level")
        .in("item_key", itemKeys.slice(0, 1000)),
    ]);

    if (priceRes.error) throw priceRes.error;
    if (itemRes.error) throw itemRes.error;

    prices = new Map(((priceRes.data ?? []) as PriceRow[]).map((p) => [p.item_key, p]));
    items = new Map(((itemRes.data ?? []) as ItemRow[]).map((i) => [i.item_key, i]));
  }

  const opportunities: FarmDropOpportunity[] = [];

  for (const row of drops) {
    if (!row.resolved_item_key || !row.stage_key) continue;
    const price = prices.get(row.resolved_item_key);
    const item = items.get(row.resolved_item_key);
    const lowest = numberValue(price?.lowest_price_brl, 0);
    if (minPrice > 0 && lowest < minPrice) continue;

    const weight = Math.max(0, numberValue(row.weight_percent_within_dropkey, 0));
    const estimated = lowest > 0 ? lowest * Math.max(weight, 0.1) / 100 : 0;
    const gradeFinal = item?.grade || row.grade;

    opportunities.push({
      id: row.id,
      itemKey: row.resolved_item_key,
      itemName: itemTitle(row, item),
      itemNameEn: item?.name_en_us || row.item_name_en_us,
      iconPath: item?.icon_path || null,
      grade: gradeFinal,
      itemType: item?.item_type || row.item_type,
      gearType: item?.gear_type || row.gear_type,
      parts: item?.parts || row.parts,
      level: item?.level || row.level,
      stageKey: row.stage_key,
      stageName: stageTitle(row),
      act: row.act,
      stageNo: row.stage_no,
      stageLevel: row.stage_level,
      sourceType: row.source_type,
      sourceName: row.source_item_name_pt_br,
      weightPercent: weight,
      priceBrl: lowest || null,
      medianBrl: numberValue(price?.median_price_brl, 0) || null,
      priceText: price?.lowest_price_text ?? null,
      volume: price?.volume ?? null,
      marketHashName: price?.market_hash_name ?? null,
      estimatedValueBrl: Number(estimated.toFixed(4)),
      score: scoreDrop({ grade: gradeFinal, price: lowest, weight, volume: price?.volume, estimated }),
      updatedAt: price?.last_success_at || price?.updated_at || null,
    });
  }

  const stageMap = new Map<string, FarmStageOpportunity>();
  for (const drop of opportunities) {
    const key = `${drop.stageKey}::${drop.sourceType || "SOURCE"}`;
    const current = stageMap.get(key) ?? {
      key,
      stageKey: drop.stageKey,
      stageName: drop.stageName,
      act: drop.act,
      stageNo: drop.stageNo,
      stageLevel: drop.stageLevel,
      sourceType: drop.sourceType,
      sourceName: drop.sourceName,
      totalDrops: 0,
      pricedDrops: 0,
      estimatedValueBrl: 0,
      bestPriceBrl: 0,
      bestWeightedValueBrl: 0,
      averagePriceBrl: 0,
      score: 0,
      bestItem: null,
      topDrops: [],
    };

    current.totalDrops += 1;
    if (drop.priceBrl) current.pricedDrops += 1;
    current.estimatedValueBrl += drop.estimatedValueBrl;
    current.bestPriceBrl = Math.max(current.bestPriceBrl, drop.priceBrl ?? 0);
    current.bestWeightedValueBrl = Math.max(current.bestWeightedValueBrl, drop.estimatedValueBrl);
    if (!current.bestItem || drop.score > current.bestItem.score) current.bestItem = drop;
    current.topDrops.push(drop);
    stageMap.set(key, current);
  }

  const stages = Array.from(stageMap.values()).map((stage) => {
    const priced = stage.topDrops.filter((d) => d.priceBrl);
    stage.topDrops = stage.topDrops.sort((a, b) => b.score - a.score).slice(0, 5);
    stage.estimatedValueBrl = Number(stage.estimatedValueBrl.toFixed(4));
    stage.averagePriceBrl = priced.length ? Number((priced.reduce((sum, d) => sum + (d.priceBrl ?? 0), 0) / priced.length).toFixed(2)) : 0;
    const coverage = stage.totalDrops ? stage.pricedDrops / stage.totalDrops : 0;
    stage.score = Number((stage.estimatedValueBrl * 20 + stage.bestPriceBrl * 0.8 + (stage.bestItem?.score ?? 0) * 0.5 + coverage * 18).toFixed(2));
    return stage;
  });

  const dropSorters = {
    value: (a: FarmDropOpportunity, b: FarmDropOpportunity) => b.estimatedValueBrl - a.estimatedValueBrl || b.score - a.score,
    score: (a: FarmDropOpportunity, b: FarmDropOpportunity) => b.score - a.score,
    price: (a: FarmDropOpportunity, b: FarmDropOpportunity) => (b.priceBrl ?? 0) - (a.priceBrl ?? 0),
    weight: (a: FarmDropOpportunity, b: FarmDropOpportunity) => b.weightPercent - a.weightPercent,
  } satisfies Record<NonNullable<FarmOptimizerOptions["mode"]>, (a: FarmDropOpportunity, b: FarmDropOpportunity) => number>;

  const stageSorters = {
    value: (a: FarmStageOpportunity, b: FarmStageOpportunity) => b.estimatedValueBrl - a.estimatedValueBrl || b.score - a.score,
    score: (a: FarmStageOpportunity, b: FarmStageOpportunity) => b.score - a.score,
    price: (a: FarmStageOpportunity, b: FarmStageOpportunity) => b.bestPriceBrl - a.bestPriceBrl,
    weight: (a: FarmStageOpportunity, b: FarmStageOpportunity) => b.bestWeightedValueBrl - a.bestWeightedValueBrl,
  } satisfies Record<NonNullable<FarmOptimizerOptions["mode"]>, (a: FarmStageOpportunity, b: FarmStageOpportunity) => number>;

  const sortedDrops = opportunities.sort(dropSorters[mode]).slice(0, 80);
  const sortedStages = stages.sort(stageSorters[mode]).slice(0, 60);

  return {
    summary: {
      dropsRead: drops.length,
      itemsPriced: opportunities.filter((d) => d.priceBrl).length,
      stagesFound: sortedStages.length,
      bestEstimatedValueBrl: sortedStages[0]?.estimatedValueBrl ?? 0,
    },
    stages: sortedStages,
    drops: sortedDrops,
  };
}
