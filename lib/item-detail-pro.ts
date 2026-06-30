export type AnyRow = Record<string, any>;

export function firstValue(row: AnyRow | null | undefined, keys: string[], fallback = "") {
  if (!row) return fallback;
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") return value;
  }
  return fallback;
}

export function normalizeText(value: any) {
  return String(value ?? "").trim();
}

export function normalizeNumber(value: any, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/[^0-9,.-]/g, "").replace(",", ".");
    const parsed = Number(cleaned);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

export function itemKeyOf(row: AnyRow | null | undefined) {
  return normalizeText(firstValue(row, ["item_key", "itemKey", "key", "item_id", "itemId", "id", "code", "Code"]));
}

export function itemNameOf(row: AnyRow | null | undefined) {
  return normalizeText(firstValue(row, [
    "name_ptbr",
    "name_pt",
    "display_name_ptbr",
    "display_name",
    "item_name_ptbr",
    "item_name",
    "name",
    "Name",
    "market_hash_name",
  ], "Item desconhecido"));
}

export function rarityOf(row: AnyRow | null | undefined) {
  const raw = normalizeText(firstValue(row, ["rarity", "grade", "item_grade", "grade_name", "Grade", "tier"]));
  return raw || "Sem raridade";
}

export function typeOfItem(row: AnyRow | null | undefined) {
  const raw = normalizeText(firstValue(row, ["item_type", "type", "category", "kind", "item_kind", "gear_type", "part", "slot"]));
  return raw || "Item";
}

export function levelOf(row: AnyRow | null | undefined) {
  return normalizeNumber(firstValue(row, ["level", "required_level", "req_level", "item_level", "Level"]), 0);
}

export function priceOf(row: AnyRow | null | undefined) {
  return normalizeNumber(firstValue(row, [
    "lowest_price_brl",
    "price_brl",
    "lowest_price",
    "median_price_brl",
    "median_price",
    "market_price",
    "value_brl",
  ]), 0);
}

export function volumeOf(row: AnyRow | null | undefined) {
  return normalizeNumber(firstValue(row, ["volume", "steam_volume", "sell_listings", "listings", "market_volume"]), 0);
}

export function formatBRL(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "sem preço";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export function scoreLabel(score: number) {
  if (score >= 90) return "Excelente";
  if (score >= 78) return "Muito bom";
  if (score >= 62) return "Bom";
  if (score >= 45) return "Médio";
  return "Baixo";
}

const RARITY_WEIGHT: Record<string, number> = {
  common: 10,
  normal: 10,
  uncommon: 18,
  rare: 35,
  epic: 54,
  unique: 62,
  legendary: 75,
  immortal: 88,
  arcana: 96,
  mythic: 98,
  divine: 100,
  comum: 10,
  raro: 35,
  épico: 54,
  epico: 54,
  lendário: 75,
  lendario: 75,
};

export function calculateItemDetailScore(item: AnyRow, market?: AnyRow | null, drops: AnyRow[] = []) {
  const rarity = rarityOf(item).toLowerCase();
  const rarityScore = Object.entries(RARITY_WEIGHT).find(([key]) => rarity.includes(key))?.[1] ?? 35;
  const levelScore = Math.min(100, Math.max(0, levelOf(item)));
  const price = priceOf(market || item);
  const marketScore = price > 0 ? Math.min(100, 35 + Math.log10(price + 1) * 30) : 18;
  const volume = volumeOf(market || item);
  const liquidityScore = volume > 0 ? Math.min(100, 30 + Math.log10(volume + 1) * 25) : 20;
  const farmScore = drops.length > 0 ? Math.max(25, Math.min(100, 105 - drops.length * 1.35)) : 35;

  const finalScore = Math.round(
    rarityScore * 0.32 +
      levelScore * 0.16 +
      marketScore * 0.2 +
      liquidityScore * 0.12 +
      farmScore * 0.2,
  );

  return {
    finalScore: Math.max(1, Math.min(100, finalScore)),
    rarityScore: Math.round(rarityScore),
    levelScore: Math.round(levelScore),
    marketScore: Math.round(marketScore),
    liquidityScore: Math.round(liquidityScore),
    farmScore: Math.round(farmScore),
  };
}

export function recommendationFor(item: AnyRow, market?: AnyRow | null, drops: AnyRow[] = []) {
  const score = calculateItemDetailScore(item, market, drops).finalScore;
  const price = priceOf(market || item);
  const rarity = rarityOf(item).toLowerCase();
  const type = typeOfItem(item).toLowerCase();
  const highRarity = ["arcana", "immortal", "legendary", "lendário", "lendario", "divine", "mythic"].some((r) => rarity.includes(r));
  const gear = type.includes("gear") || type.includes("weapon") || type.includes("armor") || type.includes("ring") || type.includes("amulet") || type.includes("arma") || type.includes("armadura");

  if (score >= 84 && highRarity) return "Guardar. Item forte para build e comparação de upgrade.";
  if (price >= 10 && !highRarity) return "Analisar venda. Tem preço de mercado e pode render bem.";
  if (gear && score >= 65) return "Comparar com sua build antes de vender ou usar no Cube.";
  if (price <= 0 && !highRarity) return "Bom candidato para Cube ou descarte, se não for útil na sua build.";
  return "Analisar junto com sua classe, build e preço atual de mercado.";
}

export function cubeAdviceFor(item: AnyRow, market?: AnyRow | null) {
  const price = priceOf(market || item);
  const rarity = rarityOf(item).toLowerCase();
  const highRarity = ["arcana", "immortal", "legendary", "lendário", "lendario", "divine", "mythic"].some((r) => rarity.includes(r));
  if (highRarity) return "Não usar no Cube sem comparar antes.";
  if (price >= 8) return "Evite sacrificar: tem valor de mercado.";
  if (price > 0) return "Pode testar no Cube se o retorno esperado compensar.";
  return "Candidato para Cube se estiver sobrando.";
}

export function buildAdviceFor(item: AnyRow) {
  const type = typeOfItem(item).toLowerCase();
  const rarity = rarityOf(item).toLowerCase();
  const gear = type.includes("gear") || type.includes("weapon") || type.includes("armor") || type.includes("ring") || type.includes("amulet") || type.includes("arma") || type.includes("armadura") || type.includes("accessory");
  const highRarity = ["arcana", "immortal", "legendary", "lendário", "lendario", "divine", "mythic"].some((r) => rarity.includes(r));
  if (gear && highRarity) return "Provável item de build. Compare com sua classe.";
  if (gear) return "Pode servir em build intermediária ou como item temporário.";
  return "Item mais útil para farm, mercado, craft ou Cube.";
}

export function stageNameOf(stage: AnyRow | null | undefined, fallback = "Fase desconhecida") {
  return normalizeText(firstValue(stage, ["stage_name", "name_ptbr", "name_pt", "display_name", "name", "StageName", "stage"], fallback));
}

export function dropSourceOf(drop: AnyRow | null | undefined) {
  return normalizeText(firstValue(drop, ["source_name", "source_type", "drop_source", "monster_name", "box_name", "drop_type", "source"], "Drop"));
}

export function dropWeightOf(drop: AnyRow | null | undefined) {
  return normalizeNumber(firstValue(drop, ["weight", "drop_weight", "chance", "rate", "probability", "drop_rate"]), 0);
}

export function safeSlug(value: any) {
  return encodeURIComponent(String(value ?? "").trim());
}
