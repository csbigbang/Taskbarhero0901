export type InventoryItem = {
  item_key: string;
  item_type?: string | null;
  grade?: string | null;
  parts?: string | null;
  gear_type?: string | null;
  level?: string | null;
  icon_path?: string | null;
  name_pt_br?: string | null;
  name_en_us?: string | null;
  market_hash_name?: string | null;
  lowest_price_brl?: number | null;
  median_price_brl?: number | null;
  volume?: number | null;
  market_score?: number | null;
  cost_benefit_score?: number | null;
  opportunity_score?: number | null;
  drop_count?: number | null;
  max_drop_weight_percent?: number | null;
};

export type InventoryEntry = {
  item: InventoryItem;
  qty: number;
  locked?: boolean;
  note?: string;
};

const GRADE_VALUE: Record<string, number> = {
  COMMON: 1,
  UNCOMMON: 2,
  RARE: 3,
  LEGENDARY: 5,
  IMMORTAL: 7,
  ARCANA: 9,
  BEYOND: 12,
  CELESTIAL: 15,
  DIVINE: 20,
  COSMIC: 28,
};

const FALLBACK_PRICE: Record<string, number> = {
  COMMON: 0.04,
  UNCOMMON: 0.07,
  RARE: 0.14,
  LEGENDARY: 0.38,
  IMMORTAL: 0.95,
  ARCANA: 2.1,
  BEYOND: 4.5,
  CELESTIAL: 8.5,
  DIVINE: 18,
  COSMIC: 45,
};

export function normalize(value?: string | null) {
  return String(value ?? "").trim().toUpperCase();
}

export function itemTitle(item: InventoryItem) {
  return item.name_pt_br || item.name_en_us || item.market_hash_name || item.item_key || "Item";
}

export function gradeValue(grade?: string | null) {
  return GRADE_VALUE[normalize(grade)] ?? 1;
}

export function itemPrice(item: InventoryItem, useFallback = false) {
  const direct = Number(item.lowest_price_brl || item.median_price_brl || 0);
  if (Number.isFinite(direct) && direct > 0) return direct;
  if (!useFallback) return 0;
  return FALLBACK_PRICE[normalize(item.grade)] ?? 0;
}

export function entryValue(entry: InventoryEntry, useFallback = false) {
  return itemPrice(entry.item, useFallback) * Math.max(0, Number(entry.qty || 0));
}

export function liquidityScore(item: InventoryItem) {
  const volume = Number(item.volume || 0);
  const price = itemPrice(item);
  const market = Number(item.market_score || 0);
  return Math.max(0, Math.min(100, volume * 1.3 + market * 0.55 + (price > 0 ? 15 : 0)));
}

export function inventoryAction(entry: InventoryEntry) {
  const item = entry.item;
  const grade = normalize(item.grade);
  const price = itemPrice(item);
  const qty = Number(entry.qty || 0);
  const gv = gradeValue(grade);
  const liquidity = liquidityScore(item);
  const isGear = normalize(item.item_type) === "GEAR" || Boolean(item.gear_type || item.parts);
  const isHighGrade = gv >= GRADE_VALUE.ARCANA;
  const isVeryHighGrade = gv >= GRADE_VALUE.DIVINE;

  if (entry.locked) return { label: "Guardado", tone: "hold", reason: "Você marcou este item como guardado." };
  if (isVeryHighGrade || price >= 25) return { label: "Guardar", tone: "hold", reason: "Item de alto valor ou raridade muito alta." };
  if (price >= 8 && liquidity >= 45) return { label: "Vender", tone: "sell", reason: "Bom valor e liquidez aceitável no mercado." };
  if (qty >= 3 && !isHighGrade && price < 2.5) return { label: "Cube", tone: "cube", reason: "Item barato/repetido; pode servir para tentativa no Cube." };
  if (isGear && gv >= GRADE_VALUE.LEGENDARY) return { label: "Build", tone: "build", reason: "Equipamento utilizável para build ou comparação." };
  return { label: "Analisar", tone: "neutral", reason: "Sem preço forte; avalie drop, build ou mercado." };
}

export function portfolioSummary(entries: InventoryEntry[]) {
  const totalQty = entries.reduce((sum, entry) => sum + Math.max(0, Number(entry.qty || 0)), 0);
  const totalMarket = entries.reduce((sum, entry) => sum + entryValue(entry, false), 0);
  const totalEstimated = entries.reduce((sum, entry) => sum + entryValue(entry, true), 0);
  const pricedQty = entries.reduce((sum, entry) => sum + (itemPrice(entry.item) > 0 ? Math.max(0, Number(entry.qty || 0)) : 0), 0);
  const unique = entries.length;

  const byGrade = new Map<string, { qty: number; value: number }>();
  const byAction = new Map<string, { qty: number; value: number }>();

  for (const entry of entries) {
    const grade = normalize(entry.item.grade) || "SEM RARIDADE";
    const value = entryValue(entry, true);
    const qty = Math.max(0, Number(entry.qty || 0));
    const current = byGrade.get(grade) || { qty: 0, value: 0 };
    current.qty += qty;
    current.value += value;
    byGrade.set(grade, current);

    const action = inventoryAction(entry).label;
    const actionData = byAction.get(action) || { qty: 0, value: 0 };
    actionData.qty += qty;
    actionData.value += value;
    byAction.set(action, actionData);
  }

  return {
    totalQty,
    unique,
    pricedQty,
    totalMarket,
    totalEstimated,
    byGrade: Array.from(byGrade.entries()).map(([grade, data]) => ({ grade, ...data })).sort((a, b) => gradeValue(b.grade) - gradeValue(a.grade)),
    byAction: Array.from(byAction.entries()).map(([action, data]) => ({ action, ...data })).sort((a, b) => b.value - a.value),
  };
}

export function compactInventory(entries: InventoryEntry[]) {
  return entries.map((entry) => ({
    item_key: entry.item.item_key,
    name: itemTitle(entry.item),
    grade: entry.item.grade,
    qty: entry.qty,
    price_brl: itemPrice(entry.item),
    total_brl: entryValue(entry, false),
    action: inventoryAction(entry).label,
  }));
}
