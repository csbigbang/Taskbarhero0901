"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import styles from "./ProgressSimulator.module.css";

type Goal = "dano" | "farm" | "boss" | "sobrevivencia" | "custo";
type Profile = "free" | "balanceado" | "premium";
type Tempo = "curto" | "normal" | "longo";

type ProgressItem = {
  item_key: string;
  name_pt_br?: string | null;
  name_en_us?: string | null;
  market_hash_name?: string | null;
  icon_path?: string | null;
  grade?: string | null;
  item_type?: string | null;
  gear_type?: string | null;
  parts?: string | null;
  level?: string | null;
  lowest_price_brl?: number | null;
  median_price_brl?: number | null;
  volume?: string | null;
  last_success_at?: string | null;
  score?: number;
  reason?: string;
};

type FarmRow = {
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

type FarmHint = {
  itemKey: string;
  itemName: string;
  rows: FarmRow[];
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;

const GOALS: Array<{ key: Goal; label: string; desc: string }> = [
  { key: "dano", label: "Dano", desc: "arma, acessório e raridade alta" },
  { key: "farm", label: "Farm", desc: "custo baixo, liquidez e drops fáceis" },
  { key: "boss", label: "Chefe", desc: "itens fortes para dano constante" },
  { key: "sobrevivencia", label: "Sobrevivência", desc: "armadura, botas, luvas e escudo" },
  { key: "custo", label: "Custo-benefício", desc: "upgrade barato com retorno rápido" },
];

const CLASSES = [
  "Knight",
  "Ranger",
  "Sorcerer",
  "Priest",
  "Hunter",
  "Slayer",
];

const PROFILE_DEFAULT: Record<Profile, number> = {
  free: 5,
  balanceado: 25,
  premium: 90,
};

const GRADE_SCORE: Record<string, number> = {
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

const GRADE_ORDER = ["COMMON", "UNCOMMON", "RARE", "LEGENDARY", "IMMORTAL", "ARCANA", "BEYOND", "CELESTIAL", "DIVINE", "COSMIC"];

function asNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^0-9,.-]/g, "").replace(",", "."));
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function money(value?: number | null) {
  const n = asNumber(value);
  if (!n) return "sem preço";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
}

function itemName(item: Partial<ProgressItem>) {
  return item.name_pt_br || item.name_en_us || item.market_hash_name || item.item_key || "Item";
}

function gradeKey(value?: string | null) {
  return String(value || "").trim().toUpperCase();
}

function gradeScore(value?: string | null) {
  return GRADE_SCORE[gradeKey(value)] ?? 12;
}

function gradeIndex(value?: string | null) {
  const idx = GRADE_ORDER.indexOf(gradeKey(value));
  return idx < 0 ? 0 : idx;
}

function volumeNumber(value?: string | null) {
  return asNumber(String(value || "").replace(/[^0-9]/g, ""));
}

function stageName(row: FarmRow) {
  return row.stage_name_pt_br || row.stage_name_en_us || (row.act && row.stage_no ? `Ato ${row.act}-${row.stage_no}` : row.stage_key) || "Fase";
}

function normalize(text?: string | null) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function typeText(item: ProgressItem) {
  return normalize(`${item.item_type || ""} ${item.gear_type || ""} ${item.parts || ""} ${item.name_pt_br || ""} ${item.name_en_us || ""} ${item.market_hash_name || ""}`);
}

function isGear(item: ProgressItem) {
  const text = typeText(item);
  return text.includes("gear") || text.includes("bow") || text.includes("armor") || text.includes("ring") || text.includes("boots") || text.includes("glove") || text.includes("weapon") || text.includes("shield") || text.includes("scepter") || text.includes("tome") || text.includes("orb") || text.includes("bracelet") || text.includes("amulet") || text.includes("brinco") || text.includes("anel") || text.includes("arco") || text.includes("armadura") || text.includes("bota") || text.includes("luva");
}

function classWeaponBoost(text: string, classe: string) {
  const c = normalize(classe);
  const rules = [
    { key: "knight", words: ["sword", "shield", "espada", "escudo"] },
    { key: "ranger", words: ["bow", "arrow", "arco", "flecha"] },
    { key: "sorcerer", words: ["staff", "orb", "cajado"] },
    { key: "priest", words: ["scepter", "tome", "cetro", "tomo"] },
    { key: "hunter", words: ["crossbow", "bolt", "besta", "virote"] },
    { key: "slayer", words: ["axe", "hatchet", "machado", "machadinha"] },
  ];

  for (const rule of rules) {
    const hit = rule.words.some((word) => text.includes(word));
    if (!hit) continue;
    return c.includes(rule.key) ? 34 : 12;
  }

  return 0;
}

function priorityMatch(item: ProgressItem, goal: Goal, classe: string) {
  const text = typeText(item);
  let score = 0;

  if (goal === "dano" || goal === "boss") {
    score += classWeaponBoost(text, classe);
    if (text.includes("weapon") || text.includes("arma")) score += 10;
    if (text.includes("ring") || text.includes("amulet") || text.includes("bracelet") || text.includes("brinco") || text.includes("anel")) score += 18;
  }

  if (goal === "sobrevivencia") {
    if (text.includes("armor") || text.includes("armadura")) score += 28;
    if (text.includes("boots") || text.includes("glove") || text.includes("shield") || text.includes("bota") || text.includes("luva") || text.includes("escudo")) score += 24;
    if (text.includes("ring") || text.includes("amulet") || text.includes("brinco") || text.includes("anel")) score += 12;
  }

  if (goal === "farm") {
    if (text.includes("material") || text.includes("gem") || text.includes("ore") || text.includes("ingot")) score += 20;
    if (text.includes("ring") || text.includes("amulet") || text.includes("bracelet") || text.includes("brinco") || text.includes("anel")) score += 12;
    if (text.includes("bow") || text.includes("weapon") || text.includes("armor")) score += 10;
  }

  if (goal === "custo") {
    if (text.includes("gem") || text.includes("material")) score += 12;
    if (text.includes("ring") || text.includes("armor") || text.includes("bow") || text.includes("weapon")) score += 13;
  }

  return score;
}

function targetGrades(level: number, profile: Profile) {
  if (profile === "premium") {
    if (level >= 100) return ["BEYOND", "CELESTIAL", "DIVINE", "COSMIC"];
    if (level >= 80) return ["ARCANA", "BEYOND", "CELESTIAL"];
    if (level >= 60) return ["IMMORTAL", "ARCANA", "BEYOND"];
    return ["LEGENDARY", "IMMORTAL", "ARCANA"];
  }

  if (profile === "balanceado") {
    if (level >= 100) return ["ARCANA", "BEYOND", "CELESTIAL"];
    if (level >= 80) return ["IMMORTAL", "ARCANA", "BEYOND"];
    if (level >= 60) return ["LEGENDARY", "IMMORTAL", "ARCANA"];
    return ["RARE", "LEGENDARY", "IMMORTAL"];
  }

  if (level >= 100) return ["IMMORTAL", "ARCANA", "BEYOND"];
  if (level >= 80) return ["LEGENDARY", "IMMORTAL", "ARCANA"];
  if (level >= 60) return ["RARE", "LEGENDARY", "IMMORTAL"];
  return ["UNCOMMON", "RARE", "LEGENDARY"];
}

function levelWindow(level: number, profile: Profile) {
  if (profile === "premium") return { min: Math.max(1, level - 25), max: level + 25 };
  if (profile === "balanceado") return { min: Math.max(1, level - 18), max: level + 18 };
  return { min: Math.max(1, level - 12), max: level + 12 };
}

function tempoPlan(tempo: Tempo, minutes: number) {
  if (tempo === "curto" || minutes < 45) {
    return {
      label: "Rota curta",
      desc: "foco em 1 upgrade barato por vez e farm rápido",
      daily: "20 a 40 minutos: faça runs curtas, venda materiais e guarde acessórios raros.",
    };
  }
  if (tempo === "longo" || minutes >= 120) {
    return {
      label: "Rota forte",
      desc: "farm de valor + compra planejada no mercado",
      daily: "2h ou mais: rode a melhor fase do dia, confira Radar e compre apenas abaixo da mediana.",
    };
  }
  return {
    label: "Rota equilibrada",
    desc: "mistura farm, mercado e troca gradual de slots",
    daily: "45 a 90 minutos: faça o farm recomendado, depois compare 2 upgrades antes de comprar.",
  };
}

function scoreItem(item: ProgressItem, goal: Goal, classe: string, level: number, budget: number, profile: Profile) {
  const price = asNumber(item.lowest_price_brl);
  const rarity = gradeScore(item.grade);
  const itemLevel = asNumber(item.level);
  const volume = volumeNumber(item.volume);
  const priority = priorityMatch(item, goal, classe);
  const grades = targetGrades(level, profile);
  const gradeBonus = grades.includes(gradeKey(item.grade)) ? 22 : Math.max(0, 12 - Math.abs(gradeIndex(item.grade) - gradeIndex(grades[1] || grades[0])) * 4);
  const priceBonus = !price ? 3 : price <= budget ? 28 : Math.max(-18, 16 - (price - budget) * 0.7);
  const levelFit = !itemLevel ? 10 : Math.max(-16, 22 - Math.abs(itemLevel - level) * 0.65);
  const market = volume >= 3000 ? 18 : volume >= 1000 ? 14 : volume >= 300 ? 9 : volume > 0 ? 4 : 0;
  return Math.round((rarity * 0.4 + priority + gradeBonus + priceBonus + levelFit + market) * 100) / 100;
}

function buildReason(item: ProgressItem, goal: Goal, budget: number) {
  const price = asNumber(item.lowest_price_brl);
  const grade = gradeKey(item.grade) || "RARIDADE";
  if (goal === "custo" && price && price <= budget) return `${grade} dentro do orçamento, bom para evoluir sem travar coins.`;
  if (goal === "farm") return `${grade} com boa utilidade para farm, venda ou rotação de Cube.`;
  if (goal === "sobrevivencia") return `${grade} para segurar avanço de fase com mais segurança.`;
  if (goal === "boss") return `${grade} para fortalecer dano em alvo único e chefes.`;
  return `${grade} com prioridade alta para melhorar o dano da build.`;
}

async function getProgressItems() {
  if (!supabase) throw new Error("Supabase não configurado.");

  const priceSelect = "item_key,market_hash_name,lowest_price_brl,median_price_brl,volume,last_success_at";
  const itemSelect = "item_key,name_pt_br,name_en_us,icon_path,grade,item_type,gear_type,parts,level";

  const [pricesHigh, pricesLow, fallbackItems] = await Promise.all([
    supabase.from("tbh_market_prices").select(priceSelect).gt("lowest_price_brl", 0).order("lowest_price_brl", { ascending: false, nullsFirst: false }).limit(900),
    supabase.from("tbh_market_prices").select(priceSelect).gt("lowest_price_brl", 0).order("lowest_price_brl", { ascending: true, nullsFirst: false }).limit(900),
    supabase.from("tbh_items_full").select(itemSelect).or("item_type.eq.GEAR,item_type.eq.MATERIAL,item_type.eq.RUNE").limit(1600),
  ]);

  const priceRows = [...(pricesHigh.data ?? []), ...(pricesLow.data ?? [])] as ProgressItem[];
  const uniquePrices = new Map<string, ProgressItem>();
  for (const row of priceRows) {
    const key = String(row.item_key || "");
    if (!key) continue;
    const prev = uniquePrices.get(key);
    if (!prev || asNumber(row.lowest_price_brl) > 0) uniquePrices.set(key, row);
  }

  const keys = Array.from(uniquePrices.keys()).slice(0, 1000);
  let itemRows: ProgressItem[] = [];
  if (keys.length) {
    const { data, error } = await supabase.from("tbh_items_full").select(itemSelect).in("item_key", keys);
    if (!error) itemRows = (data ?? []) as ProgressItem[];
  }

  const itemMap = new Map<string, ProgressItem>();
  for (const row of [...((fallbackItems.data ?? []) as ProgressItem[]), ...itemRows]) {
    itemMap.set(String(row.item_key), row);
  }

  const combined = new Map<string, ProgressItem>();
  for (const [key, price] of uniquePrices) {
    combined.set(key, { ...itemMap.get(key), ...price, item_key: key });
  }
  for (const [key, item] of itemMap) {
    if (!combined.has(key)) combined.set(key, item);
  }

  return Array.from(combined.values()).filter((item) => item.item_key && (isGear(item) || normalize(item.item_type).includes("material") || normalize(item.market_hash_name).includes("gem")));
}

async function getFarmHints(keys: string[], items: ProgressItem[]) {
  if (!supabase || !keys.length) return [] as FarmHint[];
  const { data, error } = await supabase
    .from("tbh_stage_drop_items")
    .select("stage_key,stage_name_pt_br,stage_name_en_us,act,stage_no,stage_level,source_type,resolved_item_key,weight_percent_within_dropkey")
    .in("resolved_item_key", keys.slice(0, 12))
    .not("stage_key", "is", null)
    .order("weight_percent_within_dropkey", { ascending: false, nullsFirst: false })
    .limit(420);

  if (error) return [];
  const itemMap = new Map(items.map((item) => [item.item_key, item]));
  const grouped = new Map<string, FarmRow[]>();
  for (const row of (data ?? []) as FarmRow[]) {
    const key = String(row.resolved_item_key || "");
    if (!key) continue;
    const rows = grouped.get(key) ?? [];
    if (rows.length < 4) rows.push(row);
    grouped.set(key, rows);
  }

  return Array.from(grouped.entries()).map(([itemKey, rows]) => ({
    itemKey,
    itemName: itemName(itemMap.get(itemKey) ?? { item_key: itemKey }),
    rows,
  }));
}

function ItemIcon({ item }: { item: ProgressItem }) {
  const [failed, setFailed] = useState(false);
  if (!item.icon_path || failed) return null;
  return <img src={`/images/items/${item.icon_path}.png`} alt="" onError={() => setFailed(true)} />;
}

export function ProgressSimulator() {
  const [classe, setClasse] = useState("Ranger");
  const [level, setLevel] = useState(80);
  const [goal, setGoal] = useState<Goal>("dano");
  const [profile, setProfile] = useState<Profile>("balanceado");
  const [budget, setBudget] = useState(PROFILE_DEFAULT.balanceado);
  const [tempo, setTempo] = useState<Tempo>("normal");
  const [minutes, setMinutes] = useState(60);
  const [items, setItems] = useState<ProgressItem[]>([]);
  const [farmHints, setFarmHints] = useState<FarmHint[]>([]);
  const [loading, setLoading] = useState(true);
  const [farmLoading, setFarmLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getProgressItems()
      .then((rows) => {
        if (cancelled) return;
        setItems(rows);
        setError("");
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.message || "Não foi possível carregar os dados.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const plan = useMemo(() => {
    const range = levelWindow(level, profile);
    const grades = targetGrades(level, profile);
    const priced = items.filter((item) => asNumber(item.lowest_price_brl) > 0);
    const base = items
      .filter((item) => {
        const itemLevel = asNumber(item.level);
        const price = asNumber(item.lowest_price_brl);
        const isWithinLevel = !itemLevel || (itemLevel >= range.min && itemLevel <= range.max);
        const isWithinPrice = !price || price <= budget * (profile === "premium" ? 1.8 : profile === "balanceado" ? 1.35 : 1.15);
        const isTargetGrade = grades.includes(gradeKey(item.grade)) || gradeScore(item.grade) >= gradeScore(grades[0]);
        return isWithinLevel && isWithinPrice && isTargetGrade;
      })
      .map((item) => ({
        ...item,
        score: scoreItem(item, goal, classe, level, budget, profile),
        reason: buildReason(item, goal, budget),
      }))
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

    const upgrades = base.filter(isGear).slice(0, 8);
    const farmTargets = base
      .filter((item) => asNumber(item.lowest_price_brl) >= Math.min(3, budget) || goal === "farm")
      .slice(0, 10);
    const cheapCube = priced
      .filter((item) => asNumber(item.lowest_price_brl) > 0 && asNumber(item.lowest_price_brl) <= Math.max(2.5, budget * 0.18))
      .sort((a, b) => gradeScore(b.grade) - gradeScore(a.grade) || asNumber(a.lowest_price_brl) - asNumber(b.lowest_price_brl))
      .slice(0, 6);
    const avoid = priced
      .filter((item) => asNumber(item.lowest_price_brl) > budget * 2.5 && gradeScore(item.grade) < 84)
      .sort((a, b) => asNumber(b.lowest_price_brl) - asNumber(a.lowest_price_brl))
      .slice(0, 5);

    const score = Math.max(36, Math.min(96, Math.round(42 + level * 0.22 + (profile === "premium" ? 16 : profile === "balanceado" ? 9 : 3) + (goal === "custo" ? 3 : 0))));
    const tempoInfo = tempoPlan(tempo, minutes);

    return { range, grades, upgrades, farmTargets, cheapCube, avoid, score, tempoInfo };
  }, [items, level, profile, budget, goal, classe, tempo, minutes]);

  const farmKeyString = plan.farmTargets.map((item) => item.item_key).slice(0, 8).join(",");

  useEffect(() => {
    let cancelled = false;
    const keys = farmKeyString.split(",").filter(Boolean);
    if (!keys.length || !items.length) {
      setFarmHints([]);
      return;
    }
    setFarmLoading(true);
    getFarmHints(keys, items)
      .then((rows) => {
        if (!cancelled) setFarmHints(rows);
      })
      .finally(() => {
        if (!cancelled) setFarmLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [farmKeyString, items]);

  function handleProfile(next: Profile) {
    setProfile(next);
    setBudget(PROFILE_DEFAULT[next]);
  }

  const report = useMemo(() => {
    const top = plan.upgrades[0];
    const farm = farmHints[0];
    return [
      `TBH BR - Simulador de Progressão`,
      `Classe: ${classe}`,
      `Nível atual: ${level}`,
      `Objetivo: ${GOALS.find((g) => g.key === goal)?.label}`,
      `Perfil: ${profile}`,
      `Orçamento por item: ${money(budget)}`,
      `Nota estimada da rota: ${plan.score}/100`,
      top ? `Próximo upgrade: ${itemName(top)} (${money(top.lowest_price_brl)})` : "Próximo upgrade: sem sugestão",
      farm ? `Farm sugerido: ${farm.itemName} em ${stageName(farm.rows[0])}` : "Farm sugerido: sem rota encontrada",
      plan.tempoInfo.daily,
    ].join("\n");
  }, [classe, level, goal, profile, budget, plan, farmHints]);

  async function copyReport() {
    await navigator.clipboard?.writeText(report);
  }

  return (
    <div className={styles.wrap}>
      <section className={styles.heroPanel}>
        <div>
          <span className={styles.eyebrow}>Ferramenta BR</span>
          <h1>O que fazer agora para evoluir melhor?</h1>
          <p>
            Escolha sua classe, level, objetivo e orçamento. O simulador monta uma rota com upgrade, farm,
            mercado e prioridade de gastos usando os dados do site.
          </p>
        </div>
        <div className={styles.heroBadge}>
          <strong>{plan.score}/100</strong>
          <span>nota da rota</span>
        </div>
      </section>

      <section className={styles.controls}>
        <div>
          <label>Classe</label>
          <select value={classe} onChange={(e) => setClasse(e.target.value)}>
            {CLASSES.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
        </div>
        <div>
          <label>Nível atual</label>
          <input type="number" min="1" max="200" value={level} onChange={(e) => setLevel(asNumber(e.target.value, 1))} />
        </div>
        <div>
          <label>Objetivo</label>
          <select value={goal} onChange={(e) => setGoal(e.target.value as Goal)}>
            {GOALS.map((g) => <option key={g.key} value={g.key}>{g.label}</option>)}
          </select>
        </div>
        <div>
          <label>Perfil</label>
          <select value={profile} onChange={(e) => handleProfile(e.target.value as Profile)}>
            <option value="free">Barato</option>
            <option value="balanceado">Balanceado</option>
            <option value="premium">Premium</option>
          </select>
        </div>
        <div>
          <label>Orçamento por item</label>
          <input type="number" min="0" step="1" value={budget} onChange={(e) => setBudget(asNumber(e.target.value))} />
        </div>
        <div>
          <label>Tempo por dia</label>
          <select value={tempo} onChange={(e) => setTempo(e.target.value as Tempo)}>
            <option value="curto">Curto</option>
            <option value="normal">Normal</option>
            <option value="longo">Longo</option>
          </select>
        </div>
        <div>
          <label>Minutos por dia</label>
          <input type="number" min="10" max="600" value={minutes} onChange={(e) => setMinutes(asNumber(e.target.value, 60))} />
        </div>
        <div className={styles.copyBox}>
          <button onClick={copyReport}>Copiar rota</button>
        </div>
      </section>

      {loading && <div className={styles.notice}>Carregando dados do banco...</div>}
      {error && <div className={styles.error}>{error}</div>}

      <section className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <span>Meta de raridade</span>
          <strong>{plan.grades.join(" / ")}</strong>
          <small>faixa recomendada para o seu level e perfil</small>
        </div>
        <div className={styles.summaryCard}>
          <span>Faixa de level</span>
          <strong>{plan.range.min} - {plan.range.max}</strong>
          <small>evita gastar em item muito fora da sua progressão</small>
        </div>
        <div className={styles.summaryCard}>
          <span>{plan.tempoInfo.label}</span>
          <strong>{minutes} min/dia</strong>
          <small>{plan.tempoInfo.desc}</small>
        </div>
      </section>

      <section className={styles.routePanel}>
        <h2>Rota recomendada</h2>
        <div className={styles.routeSteps}>
          <div><strong>1</strong><span>Troque primeiro o slot com maior impacto para seu objetivo.</span></div>
          <div><strong>2</strong><span>Compre apenas item dentro do orçamento ou abaixo da mediana.</span></div>
          <div><strong>3</strong><span>Use o farm sugerido para buscar item caro ou material vendável.</span></div>
          <div><strong>4</strong><span>Use Cube só com item barato ou repetido. Não queime item de build.</span></div>
        </div>
        <p>{plan.tempoInfo.daily}</p>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelTitle}>
          <h2>Próximos upgrades</h2>
          <span>{plan.upgrades.length} sugestões</span>
        </div>
        <div className={styles.itemGrid}>
          {plan.upgrades.map((item) => (
            <article className={styles.itemCard} key={item.item_key}>
              <div className={styles.itemIcon}><ItemIcon item={item} /></div>
              <div>
                <strong>{itemName(item)}</strong>
                <small>ID {item.item_key} · {item.grade || "sem raridade"} · Nível {item.level || "-"}</small>
                <p>{item.reason}</p>
              </div>
              <div className={styles.itemMeta}>
                <b>{money(item.lowest_price_brl)}</b>
                <em>score {Math.round(item.score ?? 0)}</em>
              </div>
              <div className={styles.cardLinks}>
                <Link href={`/items/${item.item_key}`}>Item</Link>
                <Link href={`/compare?item=${item.item_key}`}>Comparar</Link>
                <Link href={`/drops?item=${item.item_key}`}>Drops</Link>
              </div>
            </article>
          ))}
          {!loading && plan.upgrades.length === 0 && <div className={styles.empty}>Nenhum upgrade encontrado com esses filtros. Aumente o orçamento ou mude o perfil.</div>}
        </div>
      </section>

      <section className={styles.twoCols}>
        <div className={styles.panelBox}>
          <div className={styles.panelTitle}>
            <h2>Farm recomendado</h2>
            <span>{farmLoading ? "carregando" : `${farmHints.length} rotas`}</span>
          </div>
          <div className={styles.farmList}>
            {farmHints.slice(0, 5).map((hint) => (
              <div className={styles.farmCard} key={hint.itemKey}>
                <strong>{hint.itemName}</strong>
                {hint.rows.slice(0, 3).map((row, index) => (
                  <span key={`${hint.itemKey}-${row.stage_key}-${index}`}>
                    {stageName(row)} · {row.source_type || "drop"} · peso {asNumber(row.weight_percent_within_dropkey).toFixed(2)}%
                  </span>
                ))}
                <Link href={`/farm/optimizer?item=${hint.itemKey}`}>Abrir farm</Link>
              </div>
            ))}
            {!farmLoading && farmHints.length === 0 && <div className={styles.empty}>Sem rota de farm encontrada para os itens sugeridos.</div>}
          </div>
        </div>

        <div className={styles.panelBox}>
          <div className={styles.panelTitle}>
            <h2>Cube e gastos</h2>
            <span>controle</span>
          </div>
          <div className={styles.smallList}>
            <h3>Bons para o Cube barato</h3>
            {plan.cheapCube.slice(0, 4).map((item) => (
              <Link href={`/cube?item=${item.item_key}`} key={item.item_key}>
                <span>{itemName(item)}</span>
                <b>{money(item.lowest_price_brl)}</b>
              </Link>
            ))}
            <h3>Evitar comprar agora</h3>
            {plan.avoid.slice(0, 4).map((item) => (
              <Link href={`/items/${item.item_key}`} key={item.item_key}>
                <span>{itemName(item)}</span>
                <b>{money(item.lowest_price_brl)}</b>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
