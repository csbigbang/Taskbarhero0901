"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import styles from "./BuildDoctor.module.css";

type Goal = "dano" | "farm" | "boss" | "sobrevivencia" | "custo";
type Profile = "barato" | "balanceado" | "premium";

type SaveAnalysis = {
  ok: true;
  fileName: string;
  fileSize: number;
  version: string;
  savedAt: string | null;
  playTimeHours: number;
  steamIdMasked: string;
  heroes: Array<{
    heroKey: number;
    level: number;
    unlocked: boolean;
    abilityPoint: number;
    allocatedAbilityPoint: number;
    skillKeys: number[];
    equipped: Array<{
      slotIndex: number;
      slotLabel: string;
      uniqueId: string;
      itemKey: number | null;
      found: boolean;
      isChaotic?: boolean;
      isBlocked?: boolean;
      enchantCount?: number[];
    }>;
  }>;
  currencies: Array<{ key: number; quantity: number }>;
  inventoryItems: Array<{ slotIndex: number; uniqueId: string; itemKey: number | null }>;
  stashItems: Array<{ slotIndex: number; uniqueId: string; itemKey: number | null }>;
  tradingStashItems: Array<{ slotIndex: number; uniqueId: string; itemKey: number | null }>;
  itemCount: number;
  equippedCount: number;
  inventoryCount: number;
  stashCount: number;
  itemKeys: number[];
  notes: string[];
};

type ItemRow = Record<string, any>;
type ItemMap = Record<string, ItemRow>;

type DoctorSlot = {
  slotIndex: number;
  slotLabel: string;
  itemKey: number | null;
  row?: ItemRow;
  name: string;
  rarity: string;
  type: string;
  price: number;
  score: number;
  verdict: "manter" | "comparar" | "trocar" | "vazio";
  reason: string;
};

type UpgradePlan = {
  slot?: DoctorSlot;
  cheap?: ItemRow;
  premium?: ItemRow;
  action: string;
  reason: string;
};

type FarmHint = {
  itemKey: string;
  rows: Array<{ stageKey: string; stageName: string; source: string; weight: number }>;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
}) : null;

const GOALS: Array<{ key: Goal; label: string; desc: string }> = [
  { key: "dano", label: "Dano", desc: "prioriza arma, raridade e score bruto" },
  { key: "farm", label: "Farm", desc: "prioriza custo-benefício e itens fáceis de melhorar" },
  { key: "boss", label: "Chefe", desc: "prioriza itens fortes e raridade alta" },
  { key: "sobrevivencia", label: "Sobrevivência", desc: "prioriza armadura, botas, luvas e acessórios" },
  { key: "custo", label: "Custo-benefício", desc: "prioriza upgrade barato com retorno alto" },
];

const PROFILE_BUDGET: Record<Profile, number> = {
  barato: 8,
  balanceado: 25,
  premium: 80,
};

const HERO_NAMES: Record<number, string> = {
  101: "Knight",
  201: "Ranger",
  301: "Sorcerer",
  401: "Priest",
  501: "Hunter",
  601: "Slayer",
};

const RARITY_SCORE: Record<string, number> = {
  common: 8,
  normal: 10,
  uncommon: 18,
  rare: 34,
  epic: 48,
  unique: 58,
  legendary: 72,
  immortal: 84,
  arcana: 92,
  cosmic: 96,
  divine: 100,
  comum: 8,
  raro: 34,
  epico: 48,
  épico: 48,
  lendario: 72,
  lendário: 72,
};

function brMoney(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "sem preço";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function brDate(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

function safeNumber(value: any, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^0-9,.-]/g, "").replace(",", "."));
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function firstValue(row: ItemRow | undefined, keys: string[], fallback = "") {
  if (!row) return fallback;
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") return value;
  }
  return fallback;
}

function itemKey(row: ItemRow | undefined) {
  const raw = firstValue(row, ["item_key", "ItemKey", "item_id", "id", "key"]);
  return raw === "" ? "" : String(raw);
}

function itemName(row: ItemRow | undefined, fallbackKey?: number | string | null) {
  if (!row) return fallbackKey ? `Item ${fallbackKey}` : "Item não encontrado";
  return String(firstValue(row, [
    "name_ptbr",
    "name_pt_br",
    "display_name_ptbr",
    "display_name",
    "item_name_ptbr",
    "item_name",
    "name",
    "Name",
    "market_hash_name",
  ], fallbackKey ? `Item ${fallbackKey}` : "Item"));
}

function itemRarity(row: ItemRow | undefined) {
  return String(firstValue(row, ["rarity", "grade", "item_grade", "grade_name", "Grade", "tier"], "Sem raridade"));
}

function itemType(row: ItemRow | undefined) {
  return String(firstValue(row, ["item_type", "type", "category", "kind", "item_kind", "gear_type", "part", "slot"], "Item"));
}

function itemLevel(row: ItemRow | undefined) {
  return safeNumber(firstValue(row, ["level", "required_level", "req_level", "item_level", "Level"]), 0);
}

function itemPrice(row: ItemRow | undefined) {
  if (!row) return 0;
  return safeNumber(firstValue(row, [
    "lowest_price_brl",
    "price_brl",
    "median_price_brl",
    "lowest_price",
    "median_price",
    "market_price",
    "value_brl",
    "sell_price_brl",
  ]), 0);
}

function itemVolume(row: ItemRow | undefined) {
  if (!row) return 0;
  return safeNumber(firstValue(row, ["volume", "steam_volume", "sell_listings", "listings", "market_volume"]), 0);
}

function rarityScore(rarity: string) {
  const text = rarity.toLowerCase();
  const match = Object.entries(RARITY_SCORE).find(([key]) => text.includes(key));
  return match?.[1] ?? 28;
}

function slotCategoryFromText(text: string) {
  const value = text.toLowerCase();
  const groups = [
    ["arco", "bow", "flecha"],
    ["espada", "sword", "machado", "axe", "cajado", "staff", "lança", "lanca", "spear", "arma", "weapon"],
    ["elmo", "helm", "helmet", "capacete"],
    ["armadura", "armor", "robe", "peitoral"],
    ["luva", "glove"],
    ["bota", "boot"],
    ["anel", "ring"],
    ["amuleto", "amulet", "colar", "neck"],
    ["brinco", "earring"],
    ["bracelete", "bracelet", "pulseira"],
  ];
  for (const group of groups) {
    if (group.some((word) => value.includes(word))) return group[0];
  }
  return "gear";
}

function scoreItem(row: ItemRow | undefined, goal: Goal, heroLevel = 1) {
  if (!row) return 0;
  const rarity = rarityScore(itemRarity(row));
  const level = Math.min(100, Math.max(0, itemLevel(row) || Math.min(100, heroLevel)));
  const price = itemPrice(row);
  const volume = itemVolume(row);
  const priceScore = price > 0 ? Math.min(100, 32 + Math.log10(price + 1) * 30) : 16;
  const volumeScore = volume > 0 ? Math.min(100, 28 + Math.log10(volume + 1) * 22) : 18;
  const type = `${itemName(row)} ${itemType(row)}`.toLowerCase();

  let goalBonus = 0;
  if (goal === "dano" && /(arco|bow|sword|espada|weapon|arma|staff|cajado|axe|machado)/.test(type)) goalBonus += 8;
  if (goal === "sobrevivencia" && /(armor|armadura|bota|boot|luva|glove|helmet|elmo|ring|anel|amulet|amuleto)/.test(type)) goalBonus += 7;
  if (goal === "farm" && price > 0 && price <= 15) goalBonus += 7;
  if (goal === "boss" && rarity >= 72) goalBonus += 8;
  if (goal === "custo" && price > 0 && price <= 10 && rarity >= 55) goalBonus += 10;

  const total = rarity * 0.42 + level * 0.18 + priceScore * 0.2 + volumeScore * 0.1 + goalBonus;
  return Math.max(1, Math.min(100, Math.round(total)));
}

function iconUrl(row: ItemRow | undefined, key?: number | string | null) {
  const raw = firstValue(row, ["icon_path", "icon", "image", "image_path", "asset", "asset_name"]);
  if (typeof raw === "string" && raw.trim()) {
    if (raw.startsWith("/")) return raw;
    if (/\.(png|webp|jpg|jpeg)$/i.test(raw)) return `/images/items/${raw}`;
    return `/images/items/${raw}.png`;
  }
  const fallback = key || itemKey(row);
  return fallback ? `/images/items/Item_${fallback}.png` : "";
}

function heroName(heroKey: number) {
  return HERO_NAMES[heroKey] || `Herói ${heroKey}`;
}

async function loadItemRows(itemKeys: number[]) {
  if (!supabase || !itemKeys.length) return {} as ItemMap;
  const keys = Array.from(new Set(itemKeys.filter(Boolean))).slice(0, 750);
  const map: ItemMap = {};

  const mergeRows = (rows: ItemRow[]) => {
    for (const row of rows || []) {
      const key = itemKey(row);
      if (key) map[key] = { ...(map[key] || {}), ...row };
    }
  };

  try {
    const { data } = await supabase.from("tbh_items_full").select("*").in("item_key", keys).limit(750);
    mergeRows((data || []) as ItemRow[]);
  } catch {
    // mantém vazio e tenta a view abaixo
  }

  try {
    const { data } = await supabase.from("tbh_market_items_view").select("*").in("item_key", keys).limit(750);
    mergeRows((data || []) as ItemRow[]);
  } catch {
    // alguns projetos ainda não têm a view de mercado
  }

  return map;
}

async function loadCandidateRows() {
  if (!supabase) return [] as ItemRow[];
  try {
    const { data } = await supabase.from("tbh_market_items_view").select("*").limit(900);
    if (data?.length) return data as ItemRow[];
  } catch {
    // fallback abaixo
  }

  try {
    const { data } = await supabase.from("tbh_items_full").select("*").limit(900);
    return (data || []) as ItemRow[];
  } catch {
    return [];
  }
}

async function loadFarmHintFor(itemKeyValue: string) {
  if (!supabase || !itemKeyValue) return null;
  try {
    const { data: drops } = await supabase
      .from("tbh_stage_drop_items")
      .select("*")
      .eq("item_key", itemKeyValue)
      .limit(30);

    const dropRows = (drops || []) as ItemRow[];
    const stageKeys = Array.from(new Set(dropRows.map((drop) => String(firstValue(drop, ["stage_key", "stage_id", "stage", "map_key"]))).filter(Boolean))).slice(0, 30);
    const stageMap: Record<string, ItemRow> = {};

    if (stageKeys.length) {
      const { data: stages } = await supabase.from("tbh_stages_full").select("*").in("stage_key", stageKeys).limit(30);
      for (const stage of (stages || []) as ItemRow[]) {
        const key = String(firstValue(stage, ["stage_key", "stage_id", "id", "key"]));
        if (key) stageMap[key] = stage;
      }
    }

    const rows = dropRows.slice(0, 6).map((drop) => {
      const stageKey = String(firstValue(drop, ["stage_key", "stage_id", "stage", "map_key"]));
      const stage = stageMap[stageKey];
      return {
        stageKey,
        stageName: String(firstValue(stage, ["stage_name", "name_ptbr", "name_pt", "display_name", "name", "StageName", "stage"], stageKey ? `Fase ${stageKey}` : "Fase desconhecida")),
        source: String(firstValue(drop, ["source_name", "source_type", "drop_source", "monster_name", "box_name", "drop_type", "source"], "Drop")),
        weight: safeNumber(firstValue(drop, ["weight", "drop_weight", "chance", "rate", "probability", "drop_rate"]), 0),
      };
    });

    return { itemKey: itemKeyValue, rows } as FarmHint;
  } catch {
    return null;
  }
}

function ItemIcon({ row, itemKeyValue, className = styles.itemIcon }: { row?: ItemRow; itemKeyValue?: number | string | null; className?: string }) {
  const [failed, setFailed] = useState(false);
  const src = iconUrl(row, itemKeyValue);
  if (!src || failed) return null;
  return <img className={className} src={src} alt="" loading="lazy" onError={() => setFailed(true)} />;
}

function buildSlots(hero: SaveAnalysis["heroes"][number], items: ItemMap, goal: Goal): DoctorSlot[] {
  const slots: DoctorSlot[] = [];
  for (const equipped of hero.equipped) {
    const row = equipped.itemKey ? items[String(equipped.itemKey)] : undefined;
    const score = scoreItem(row, goal, hero.level);
    const price = itemPrice(row);
    const rarity = itemRarity(row);
    const rarityValue = rarityScore(rarity);
    let verdict: DoctorSlot["verdict"] = "comparar";
    let reason = "Comparar com opções de mercado antes de mexer.";

    if (!equipped.itemKey || !row) {
      verdict = "vazio";
      reason = "O save tem o slot, mas o item não foi encontrado no banco.";
    } else if (score >= 78 || rarityValue >= 84) {
      verdict = "manter";
      reason = "Bom item para manter por enquanto.";
    } else if (hero.level >= 70 && (score < 54 || rarityValue < 48)) {
      verdict = "trocar";
      reason = "Abaixo do ideal para o nível do personagem.";
    } else if (price <= 0 && rarityValue < 72) {
      verdict = "trocar";
      reason = "Sem preço e sem raridade alta; pode ser slot de upgrade.";
    }

    slots.push({
      slotIndex: equipped.slotIndex,
      slotLabel: equipped.slotLabel,
      itemKey: equipped.itemKey,
      row,
      name: itemName(row, equipped.itemKey),
      rarity,
      type: itemType(row),
      price,
      score,
      verdict,
      reason,
    });
  }
  return slots.sort((a, b) => a.slotIndex - b.slotIndex);
}

function heroScore(slots: DoctorSlot[], heroLevel: number) {
  if (!slots.length) return Math.max(10, Math.min(45, Math.round(heroLevel * 0.32)));
  const avg = slots.reduce((sum, slot) => sum + slot.score, 0) / slots.length;
  const filled = Math.min(10, slots.length) / 10;
  const levelBoost = Math.min(12, heroLevel / 10);
  const total = avg * 0.78 + filled * 12 + levelBoost;
  return Math.max(1, Math.min(100, Math.round(total)));
}

function scoreLabel(score: number) {
  if (score >= 88) return "Excelente";
  if (score >= 76) return "Forte";
  if (score >= 62) return "Bom";
  if (score >= 45) return "Intermediário";
  return "Precisa melhorar";
}

function itemMatchesSlot(candidate: ItemRow, slot: DoctorSlot) {
  const slotCat = slotCategoryFromText(`${slot.name} ${slot.type}`);
  const candidateText = `${itemName(candidate)} ${itemType(candidate)}`.toLowerCase();
  if (slotCat === "gear") return /gear|weapon|armor|ring|amulet|accessory|arma|armadura|anel|amuleto|brinco|bota|luva|elmo/.test(candidateText);
  return candidateText.includes(slotCat);
}

function buildUpgradePlan(slots: DoctorSlot[], candidates: ItemRow[], goal: Goal, budget: number, profile: Profile): UpgradePlan {
  const sortedProblems = slots
    .filter((slot) => slot.verdict === "trocar" || slot.verdict === "comparar" || slot.verdict === "vazio")
    .sort((a, b) => a.score - b.score);

  const target = sortedProblems[0] || slots.slice().sort((a, b) => a.score - b.score)[0];
  if (!target) {
    return { action: "Equipe itens primeiro", reason: "Não encontrei equipamentos suficientes nesse personagem." };
  }

  const targetCategory = slotCategoryFromText(`${target.name} ${target.type}`);
  const cleanCandidates = candidates
    .filter((row) => itemKey(row) && String(itemKey(row)) !== String(target.itemKey || ""))
    .filter((row) => itemMatchesSlot(row, target))
    .map((row) => ({ row, score: scoreItem(row, goal, 100), price: itemPrice(row), rarity: rarityScore(itemRarity(row)) }))
    .filter((entry) => entry.score >= Math.max(55, target.score + 3))
    .sort((a, b) => b.score - a.score || b.rarity - a.rarity);

  const cheapBudget = profile === "barato" ? budget : Math.max(8, Math.min(budget, PROFILE_BUDGET.balanceado));
  const cheap = cleanCandidates
    .filter((entry) => entry.price > 0 && entry.price <= cheapBudget)
    .sort((a, b) => (b.score / Math.max(1, b.price)) - (a.score / Math.max(1, a.price)))[0]?.row;

  const premium = cleanCandidates
    .filter((entry) => profile === "premium" ? entry.price <= Math.max(budget, PROFILE_BUDGET.premium) || entry.price <= 0 : entry.price <= budget || entry.price <= 0)
    .sort((a, b) => b.score - a.score)[0]?.row;

  return {
    slot: target,
    cheap,
    premium,
    action: target.verdict === "vazio" ? `Preencher ${target.slotLabel}` : `Melhorar ${target.slotLabel}`,
    reason: targetCategory === "gear"
      ? "Esse é o ponto mais fraco detectado na build atual. Compare com itens de raridade maior."
      : `O site detectou ${targetCategory} como o próximo slot mais interessante para melhorar.`,
  };
}

function pickKeepAndCubeItems(analysis: SaveAnalysis | null, items: ItemMap, goal: Goal) {
  if (!analysis) return { keep: [] as ItemRow[], cube: [] as ItemRow[], sell: [] as ItemRow[] };
  const allKeys = Array.from(new Set([
    ...analysis.inventoryItems.map((row) => row.itemKey).filter(Boolean),
    ...analysis.stashItems.map((row) => row.itemKey).filter(Boolean),
    ...analysis.tradingStashItems.map((row) => row.itemKey).filter(Boolean),
  ])) as number[];

  const rows = allKeys.map((key) => items[String(key)]).filter(Boolean);
  const keep = rows
    .filter((row) => rarityScore(itemRarity(row)) >= 72 || itemPrice(row) >= 10 || scoreItem(row, goal, 100) >= 75)
    .sort((a, b) => scoreItem(b, goal, 100) - scoreItem(a, goal, 100))
    .slice(0, 8);

  const cube = rows
    .filter((row) => rarityScore(itemRarity(row)) < 58 && itemPrice(row) <= 3 && scoreItem(row, goal, 100) < 58)
    .sort((a, b) => scoreItem(a, goal, 100) - scoreItem(b, goal, 100))
    .slice(0, 8);

  const sell = rows
    .filter((row) => itemPrice(row) >= 5 && rarityScore(itemRarity(row)) < 84)
    .sort((a, b) => itemPrice(b) - itemPrice(a))
    .slice(0, 8);

  return { keep, cube, sell };
}

function MiniItem({ row, fallbackKey, showScore, goal }: { row?: ItemRow; fallbackKey?: number | string | null; showScore?: boolean; goal: Goal }) {
  const key = fallbackKey || itemKey(row);
  const price = itemPrice(row);
  const score = scoreItem(row, goal, 100);
  return (
    <div className={styles.miniItem}>
      <ItemIcon row={row} itemKeyValue={key} />
      <div>
        <strong>{itemName(row, key)}</strong>
        <span>ID {key || "-"} · {itemRarity(row)} · {itemType(row)}</span>
      </div>
      <em>{showScore ? `${score}/100` : brMoney(price)}</em>
    </div>
  );
}

function SlotCard({ slot }: { slot: DoctorSlot }) {
  return (
    <div className={`${styles.slotCard} ${styles[slot.verdict]}`}>
      <div className={styles.slotHead}>
        <span>{slot.slotLabel}</span>
        <em>{slot.score}/100</em>
      </div>
      <MiniItem row={slot.row} fallbackKey={slot.itemKey} goal="dano" />
      <p>{slot.reason}</p>
    </div>
  );
}

function FarmHints({ hint }: { hint: FarmHint | null }) {
  if (!hint || !hint.rows.length) {
    return <p className={styles.softText}>Sem rota de drop detectada para o upgrade principal.</p>;
  }
  return (
    <div className={styles.farmList}>
      {hint.rows.slice(0, 4).map((row, index) => (
        <a key={`${row.stageKey}-${index}`} href={`/drops?stage=${encodeURIComponent(row.stageKey)}`} className={styles.farmRow}>
          <strong>{row.stageName}</strong>
          <span>{row.source}{row.weight ? ` · peso ${row.weight}` : ""}</span>
        </a>
      ))}
    </div>
  );
}

export function BuildDoctor() {
  const [analysis, setAnalysis] = useState<SaveAnalysis | null>(null);
  const [items, setItems] = useState<ItemMap>({});
  const [candidates, setCandidates] = useState<ItemRow[]>([]);
  const [selectedHeroKey, setSelectedHeroKey] = useState<number | null>(null);
  const [goal, setGoal] = useState<Goal>("dano");
  const [profile, setProfile] = useState<Profile>("balanceado");
  const [budget, setBudget] = useState(PROFILE_BUDGET.balanceado);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [farmHint, setFarmHint] = useState<FarmHint | null>(null);

  async function analyzeFile(file: File | null) {
    if (!file) return;
    setLoading(true);
    setError("");
    setAnalysis(null);
    setItems({});
    setFarmHint(null);

    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch("/api/save/analyze", { method: "POST", body: form });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.error || "Falha ao ler o save.");

      const parsed = payload as SaveAnalysis;
      const map = await loadItemRows(parsed.itemKeys);
      const candidateRows = await loadCandidateRows();

      setAnalysis(parsed);
      setItems(map);
      setCandidates(candidateRows);
      setSelectedHeroKey(parsed.heroes.find((hero) => hero.unlocked)?.heroKey || parsed.heroes[0]?.heroKey || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao analisar o save.");
    } finally {
      setLoading(false);
    }
  }

  const selectedHero = useMemo(() => {
    if (!analysis) return null;
    return analysis.heroes.find((hero) => hero.heroKey === selectedHeroKey) || analysis.heroes.find((hero) => hero.unlocked) || analysis.heroes[0] || null;
  }, [analysis, selectedHeroKey]);

  const slots = useMemo(() => {
    return selectedHero ? buildSlots(selectedHero, items, goal) : [];
  }, [selectedHero, items, goal]);

  const buildScore = useMemo(() => {
    return selectedHero ? heroScore(slots, selectedHero.level) : 0;
  }, [selectedHero, slots]);

  const plan = useMemo(() => buildUpgradePlan(slots, candidates, goal, budget, profile), [slots, candidates, goal, budget, profile]);
  const lists = useMemo(() => pickKeepAndCubeItems(analysis, items, goal), [analysis, items, goal]);

  useEffect(() => {
    const key = itemKey(plan.cheap || plan.premium);
    if (!key) {
      setFarmHint(null);
      return;
    }
    let alive = true;
    loadFarmHintFor(key).then((hint) => {
      if (alive) setFarmHint(hint);
    });
    return () => { alive = false; };
  }, [plan.cheap, plan.premium]);

  function applyProfile(value: Profile) {
    setProfile(value);
    setBudget(PROFILE_BUDGET[value]);
  }

  function copyDoctorReport() {
    if (!analysis || !selectedHero) return;
    const lines = [
      "TBH Analisador de Builds BR",
      `Arquivo: ${analysis.fileName}`,
      `Personagem: ${heroName(selectedHero.heroKey)} Nível ${selectedHero.level}`,
      `Objetivo: ${GOALS.find((entry) => entry.key === goal)?.label}`,
      `Nota: ${buildScore}/100 - ${scoreLabel(buildScore)}`,
      `Ação principal: ${plan.action}`,
      plan.slot ? `Slot: ${plan.slot.slotLabel} - ${plan.slot.name}` : "",
      plan.cheap ? `Melhoria barata: ${itemName(plan.cheap)} - ${brMoney(itemPrice(plan.cheap))}` : "Melhoria barata: não encontrado",
      plan.premium ? `Melhoria forte: ${itemName(plan.premium)} - ${brMoney(itemPrice(plan.premium))}` : "Melhoria forte: não encontrado",
      "",
      "Piores slots:",
      ...slots.slice().sort((a, b) => a.score - b.score).slice(0, 4).map((slot) => `${slot.slotLabel}: ${slot.name} (${slot.score}/100)`),
    ].filter(Boolean);
    navigator.clipboard.writeText(lines.join("\n"));
  }

  return (
    <div className={styles.wrap}>
      <section className={styles.heroPanel}>
        <div>
          <span className={styles.eyebrow}>🩺 Analisador de Builds</span>
          <h1>Descubra o próximo upgrade da sua conta</h1>
          <p>Envie seu <strong>SaveFile_Live.es3</strong>. O site analisa seus personagens, equipamentos, mercado, inventário e entrega um plano direto do que melhorar.</p>
        </div>
        <div className={styles.heroBadge}>
          <strong>{analysis ? "SAVE LIDO" : "NOVO"}</strong>
          <span>{analysis ? `${analysis.heroes.length} personagens` : "consulta automática"}</span>
        </div>
      </section>

      <section className={styles.controlPanel}>
        <label className={styles.dropZone}>
          <input type="file" accept=".es3,.bak" onChange={(event) => analyzeFile(event.target.files?.[0] || null)} />
          <span>Selecionar save</span>
          <small>Arquivo: AppData/LocalLow/TesseractStudio/TaskBarHero/SaveFile_Live.es3</small>
        </label>

        <div className={styles.settingsGrid}>
          <div>
            <label>Objetivo</label>
            <select value={goal} onChange={(event) => setGoal(event.target.value as Goal)}>
              {GOALS.map((entry) => <option key={entry.key} value={entry.key}>{entry.label}</option>)}
            </select>
            <small>{GOALS.find((entry) => entry.key === goal)?.desc}</small>
          </div>

          <div>
            <label>Perfil</label>
            <select value={profile} onChange={(event) => applyProfile(event.target.value as Profile)}>
              <option value="barato">Barato</option>
              <option value="balanceado">Balanceado</option>
              <option value="premium">Premium</option>
            </select>
            <small>controla o tipo de upgrade sugerido</small>
          </div>

          <div>
            <label>Orçamento por item</label>
            <input type="number" min="0" step="1" value={budget} onChange={(event) => setBudget(Number(event.target.value) || 0)} />
            <small>usado para filtrar upgrade barato</small>
          </div>
        </div>

        <div className={styles.actions}>
          <button type="button" onClick={copyDoctorReport} disabled={!analysis}>Copiar diagnóstico</button>
          <button type="button" onClick={() => { setAnalysis(null); setItems({}); setCandidates([]); setError(""); setFarmHint(null); }} disabled={!analysis && !error}>Limpar</button>
        </div>

        {loading && <div className={styles.notice}>Lendo save, buscando itens e montando diagnóstico...</div>}
        {error && <div className={styles.error}>{error}</div>}
      </section>

      {analysis && selectedHero && (
        <>
          <section className={styles.heroSelector}>
            {analysis.heroes.map((hero) => {
              const heroSlots = buildSlots(hero, items, goal);
              const score = heroScore(heroSlots, hero.level);
              return (
                <button
                  type="button"
                  key={hero.heroKey}
                  onClick={() => setSelectedHeroKey(hero.heroKey)}
                  className={hero.heroKey === selectedHero.heroKey ? styles.heroButtonActive : styles.heroButton}
                >
                  <strong>{heroName(hero.heroKey)}</strong>
                  <span>Nível {hero.level} · {hero.equipped.length} equipados</span>
                  <em>{score}/100</em>
                </button>
              );
            })}
          </section>

          <section className={styles.resultGrid}>
            <article className={styles.scorePanel}>
              <span>Nota da build</span>
              <strong>{buildScore}</strong>
              <em>{scoreLabel(buildScore)}</em>
              <p>{heroName(selectedHero.heroKey)} Nível {selectedHero.level} · salvo em {brDate(analysis.savedAt)}</p>
            </article>

            <article className={styles.planPanel}>
              <span>Próximo passo</span>
              <h2>{plan.action}</h2>
              <p>{plan.reason}</p>
              {plan.slot && <div className={styles.problemLine}>Alvo: <strong>{plan.slot.name}</strong> · {plan.slot.score}/100</div>}
            </article>

            <article className={styles.planPanel}>
              <span>Melhoria barata</span>
              {plan.cheap ? <MiniItem row={plan.cheap} goal={goal} /> : <p className={styles.softText}>Não encontrei upgrade com preço dentro do orçamento.</p>}
            </article>

            <article className={styles.planPanel}>
              <span>Melhoria forte</span>
              {plan.premium ? <MiniItem row={plan.premium} goal={goal} showScore /> : <p className={styles.softText}>Não encontrei upgrade forte no banco atual.</p>}
            </article>
          </section>

          <section className={styles.mainGrid}>
            <article className={styles.panelWide}>
              <div className={styles.titleRow}>
                <h2>Slots analisados</h2>
                <span>{slots.length} equipado(s)</span>
              </div>
              <div className={styles.slotGrid}>
                {slots.length ? slots.map((slot) => <SlotCard key={`${slot.slotIndex}-${slot.itemKey}`} slot={slot} />) : <div className={styles.emptyBox}>Nenhum item equipado detectado nesse personagem.</div>}
              </div>
            </article>

            <aside className={styles.sideColumn}>
              <article className={styles.panelBox}>
                <h2>Farm do upgrade</h2>
                <FarmHints hint={farmHint} />
              </article>

              <article className={styles.panelBox}>
                <h2>Plano rápido</h2>
                <ol className={styles.todoList}>
                  <li>Melhore o pior slot primeiro.</li>
                  <li>Compare a melhoria barata com o item atual.</li>
                  <li>Farmar o item sugerido antes de comprar.</li>
                  <li>Use o Cube só em item barato e de baixa raridade.</li>
                </ol>
              </article>
            </aside>
          </section>

          <section className={styles.threeColumns}>
            <article className={styles.panelBox}>
              <h2>Não vender</h2>
              {lists.keep.length ? lists.keep.map((row) => <MiniItem key={`keep-${itemKey(row)}`} row={row} goal={goal} showScore />) : <p className={styles.softText}>Nenhum item crítico detectado no inventário/stash.</p>}
            </article>

            <article className={styles.panelBox}>
              <h2>Bons para o Cube</h2>
              {lists.cube.length ? lists.cube.map((row) => <MiniItem key={`cube-${itemKey(row)}`} row={row} goal={goal} />) : <p className={styles.softText}>Nenhum candidato claro para o Cube.</p>}
            </article>

            <article className={styles.panelBox}>
              <h2>Possível venda</h2>
              {lists.sell.length ? lists.sell.map((row) => <MiniItem key={`sell-${itemKey(row)}`} row={row} goal={goal} />) : <p className={styles.softText}>Nenhum item com preço interessante para venda.</p>}
            </article>
          </section>
        </>
      )}
    </div>
  );
}
