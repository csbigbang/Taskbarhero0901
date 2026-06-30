"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { SafeItemAsset } from "@/components/SafeItemAsset";
import type { BuildPlannerItem, BuildPlannerStats } from "@/lib/build-planner";
import styles from "./BuildPlanner.module.css";

type Props = {
  items: BuildPlannerItem[];
  stats: BuildPlannerStats;
};

type Goal = "farm" | "boss" | "market" | "budget" | "survival";
type HeroClass = "knight" | "ranger" | "sorcerer" | "priest" | "hunter" | "slayer";
type Tier = "budget" | "balanced" | "premium";

const GRADE_SCORE: Record<string, number> = {
  COMMON: 8,
  UNCOMMON: 16,
  RARE: 28,
  LEGENDARY: 44,
  IMMORTAL: 58,
  ARCANA: 70,
  BEYOND: 82,
  CELESTIAL: 90,
  DIVINE: 96,
  COSMIC: 104
};

const GRADE_COLOR: Record<string, string> = {
  COMMON: "#a7adb7",
  UNCOMMON: "#4ade80",
  RARE: "#5aa7ff",
  LEGENDARY: "#ffaf2a",
  IMMORTAL: "#ff4d4d",
  ARCANA: "#b56cff",
  BEYOND: "#39e5ef",
  CELESTIAL: "#74c8ff",
  DIVINE: "#ffe45e",
  COSMIC: "#ff7ad9"
};

const classLabels: Record<HeroClass, string> = {
  knight: "Knight / espada e escudo",
  ranger: "Ranger / arco",
  sorcerer: "Sorcerer / cajado e orbe",
  priest: "Priest / cetro e tomo",
  hunter: "Hunter / besta",
  slayer: "Slayer / machado"
};

const goalLabels: Record<Goal, string> = {
  farm: "Farm rápido",
  boss: "Chefe / dano alto",
  market: "Valor de mercado",
  budget: "Custo-benefício",
  survival: "Sobrevivência"
};

const tierLabels: Record<Tier, string> = {
  budget: "Econômica",
  balanced: "Balanceada",
  premium: "Premium"
};

function money(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "sem preço";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value));
}

function title(item: BuildPlannerItem) {
  return item.name_pt_br || item.name_en_us || item.item_key;
}

function clean(value?: string | null, fallback = "-") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function norm(value?: string | null) {
  return String(value ?? "").toLowerCase();
}

function gradeScore(item: BuildPlannerItem) {
  return GRADE_SCORE[String(item.grade ?? "").toUpperCase()] ?? 5;
}

function rarityColor(item: BuildPlannerItem) {
  return GRADE_COLOR[String(item.grade ?? "").toUpperCase()] ?? "#7d879a";
}

function matchesClass(item: BuildPlannerItem, heroClass: HeroClass) {
  const text = `${item.name_pt_br ?? ""} ${item.name_en_us ?? ""} ${item.gear_type ?? ""} ${item.parts ?? ""}`.toLowerCase();

  const rules: Record<HeroClass, string[]> = {
    knight: ["sword", "shield", "espada", "escudo"],
    ranger: ["bow", "arrow", "arco", "flecha"],
    sorcerer: ["staff", "orb", "cajado"],
    priest: ["scepter", "tome", "cetro", "tomo"],
    hunter: ["crossbow", "bolt", "besta", "virote"],
    slayer: ["axe", "hatchet", "machado", "machadinha"]
  };

  return rules[heroClass].some((word) => text.includes(word));
}

function slotOf(item: BuildPlannerItem) {
  const text = `${item.item_type ?? ""} ${item.gear_type ?? ""} ${item.parts ?? ""} ${item.name_en_us ?? ""} ${item.name_pt_br ?? ""}`.toUpperCase();

  if (text.includes("MAIN_WEAPON") || text.includes("WEAPON") || text.includes("SWORD") || text.includes("BOW") || text.includes("STAFF")) return "Arma";
  if (text.includes("SUB_WEAPON") || text.includes("SHIELD")) return "Secundária";
  if (text.includes("ARMOR") || text.includes("BODY") || text.includes("HELM") || text.includes("BOOTS") || text.includes("GLOVE")) return "Armadura";
  if (text.includes("ACCESSORY") || text.includes("RING") || text.includes("NECK")) return "Acessório";
  if (text.includes("RUNE")) return "Runa";
  if (text.includes("MATERIAL")) return "Material";
  return "Extra";
}

function scoreItem(item: BuildPlannerItem, heroClass: HeroClass, goal: Goal, budget: number, tier: Tier) {
  const price = item.lowest_price_brl ?? 0;
  let score = gradeScore(item);

  if (matchesClass(item, heroClass)) score += 22;

  const hasPrice = item.lowest_price_brl !== null && item.lowest_price_brl !== undefined;
  const volume = Number(String(item.volume ?? "").replace(/[^0-9]/g, "")) || 0;

  if (goal === "market") score += Math.min(price * 2.5, 80) + Math.min(volume / 80, 22);
  if (goal === "budget") score += hasPrice ? Math.max(0, 42 - price * 2.2) : 8;
  if (goal === "farm") score += Math.min(volume / 120, 18) + (hasPrice ? Math.min(price, 25) : 0);
  if (goal === "boss") score += slotOf(item) === "Arma" ? 25 : 0;
  if (goal === "survival") score += ["Armadura", "Secundária", "Acessório"].includes(slotOf(item)) ? 22 : 0;

  if (budget > 0 && hasPrice) {
    if (price <= budget) score += 12;
    if (price > budget) score -= Math.min(60, (price - budget) * 3);
  }

  if (tier === "budget" && hasPrice) score += Math.max(0, 24 - price * 2);
  if (tier === "premium") score += gradeScore(item) * 0.45 + Math.min(price, 80) * 0.4;
  if (tier === "balanced") score += gradeScore(item) * 0.2 + (hasPrice ? Math.max(0, 18 - price) : 3);

  return Math.round(score * 100) / 100;
}

function isUsefulItem(item: BuildPlannerItem) {
  const itemType = norm(item.item_type);
  const gear = norm(item.gear_type);
  const parts = norm(item.parts);
  const name = norm(`${item.name_pt_br ?? ""} ${item.name_en_us ?? ""}`);

  if (itemType.includes("gear") || itemType.includes("rune") || itemType.includes("material")) return true;
  if (gear && gear !== "-") return true;
  if (parts && parts !== "-") return true;
  return ["sword", "bow", "staff", "rune", "ring", "neck", "armor", "shield", "gem", "ruby", "sapphire", "diamond"].some((w) => name.includes(w));
}

export function BuildPlanner({ items, stats }: Props) {
  const [heroClass, setHeroClass] = useState<HeroClass>("ranger");
  const [goal, setGoal] = useState<Goal>("farm");
  const [tier, setTier] = useState<Tier>("balanced");
  const [budget, setBudget] = useState(25);
  const [minGrade, setMinGrade] = useState("RARE");
  const [copied, setCopied] = useState(false);

  const gradeMinScore = GRADE_SCORE[minGrade] ?? 0;

  const scored = useMemo(() => {
    return items
      .filter(isUsefulItem)
      .filter((item) => gradeScore(item) >= gradeMinScore)
      .map((item) => ({ item, score: scoreItem(item, heroClass, goal, budget, tier), slot: slotOf(item) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 80);
  }, [items, heroClass, goal, budget, tier, gradeMinScore]);

  const chosen = useMemo(() => {
    const slots = ["Arma", "Secundária", "Armadura", "Acessório", "Runa", "Material", "Extra"];
    const selected: typeof scored = [];

    for (const slot of slots) {
      const match = scored.find((entry) => entry.slot === slot && !selected.some((s) => s.item.item_key === entry.item.item_key));
      if (match) selected.push(match);
    }

    return selected.slice(0, 8);
  }, [scored]);

  const totalPrice = chosen.reduce((sum, entry) => sum + (entry.item.lowest_price_brl ?? 0), 0);
  const avgScore = chosen.length ? chosen.reduce((sum, entry) => sum + entry.score, 0) / chosen.length : 0;
  const pricedCount = chosen.filter((entry) => entry.item.lowest_price_brl !== null).length;

  const alternatives = scored.filter((entry) => !chosen.some((c) => c.item.item_key === entry.item.item_key)).slice(0, 12);

  async function copyBuild() {
    const text = [
      `TBH BR - Planejador de Builds ${classLabels[heroClass]}`,
      `Objetivo: ${goalLabels[goal]}`,
      `Perfil: ${tierLabels[tier]}`,
      `Orçamento alvo: ${money(budget)}`,
      "",
      ...chosen.map((entry, index) => `${index + 1}. [${entry.slot}] ${title(entry.item)} - ${clean(entry.item.grade)} - ${money(entry.item.lowest_price_brl)} - Pontuação ${entry.score}`),
      "",
      `Total estimado: ${money(totalPrice)}`
    ].join("\n");

    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className={styles.planner}>
      <div className={styles.notice}>
        <strong>Planejador de Builds BR</strong>
        <span>Ferramenta de recomendação por score: combina raridade, tipo do item, classe, objetivo, preço em BRL e liquidez. Não altera o banco e não depende de login.</span>
      </div>

      <section className={styles.controlPanel} aria-label="Filtros da build">
        <div className={styles.field}>
          <label>Classe</label>
          <select value={heroClass} onChange={(e) => setHeroClass(e.target.value as HeroClass)}>
            {Object.entries(classLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>

        <div className={styles.field}>
          <label>Objetivo</label>
          <select value={goal} onChange={(e) => setGoal(e.target.value as Goal)}>
            {Object.entries(goalLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>

        <div className={styles.field}>
          <label>Perfil</label>
          <select value={tier} onChange={(e) => setTier(e.target.value as Tier)}>
            {Object.entries(tierLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>

        <div className={styles.field}>
          <label>Raridade mínima</label>
          <select value={minGrade} onChange={(e) => setMinGrade(e.target.value)}>
            {Object.keys(GRADE_SCORE).map((grade) => <option key={grade} value={grade}>{grade}</option>)}
          </select>
        </div>

        <div className={styles.field}>
          <label>Orçamento por item</label>
          <input type="number" min="0" step="1" value={budget} onChange={(e) => setBudget(Number(e.target.value || 0))} />
        </div>
      </section>

      <section className={styles.summaryGrid}>
        <div className={styles.summaryBox}><strong>{chosen.length}</strong><span>itens na build sugerida</span></div>
        <div className={styles.summaryBox}><strong>{money(totalPrice)}</strong><span>total estimado com preços cacheados</span></div>
        <div className={styles.summaryBox}><strong>{avgScore.toFixed(1)}</strong><span>score médio da build</span></div>
        <div className={styles.summaryBox}><strong>{pricedCount}/{chosen.length}</strong><span>itens com preço de mercado</span></div>
      </section>

      <div className={styles.toolsRow}>
        <button className={styles.toolButton} type="button" onClick={copyBuild}>{copied ? "Copiado!" : "Copiar build"}</button>
        <Link href="/market" className={styles.toolButton}>Ver mercado</Link>
        <Link href="/farm" className={styles.toolButton}>Ver farms valiosos</Link>
      </div>

      <section className={styles.columns}>
        <div>
          <h2>Build recomendada</h2>
          <div className={styles.buildList}>
            {chosen.map((entry) => <BuildCard key={entry.item.item_key} entry={entry} />)}
          </div>
        </div>

        <aside className={styles.sidePanel}>
          <h2>Alternativas</h2>
          <div className={styles.tierTabs}>
            {Object.entries(tierLabels).map(([value, label]) => (
              <button key={value} type="button" onClick={() => setTier(value as Tier)} className={`${styles.tierTab} ${tier === value ? styles.tierTabActive : ""}`}>{label}</button>
            ))}
          </div>
          <div className={styles.sideList}>
            {alternatives.slice(0, 8).map((entry) => <BuildCard key={entry.item.item_key} entry={entry} compact />)}
          </div>
          <p className={styles.smallText}>Base atual: {stats.items.toLocaleString("pt-BR")} itens cadastrados, {stats.priced.toLocaleString("pt-BR")} com preço cacheado.</p>
        </aside>
      </section>
    </div>
  );
}

function BuildCard({ entry, compact = false }: { entry: { item: BuildPlannerItem; score: number; slot: string }; compact?: boolean }) {
  const item = entry.item;
  const color = rarityColor(item);
  const width = Math.min(100, Math.max(5, entry.score));

  return (
    <article className={compact ? styles.sideCard : styles.buildCard} style={{ "--rarity-color": color } as React.CSSProperties}>
      <div className={styles.iconBox}>
        <SafeItemAsset iconPath={item.icon_path} itemKey={item.item_key} alt={title(item)} />
      </div>

      <div className={styles.cardMain}>
        <h3>{title(item)}</h3>
        <p>{clean(item.name_en_us, clean(item.market_hash_name, "sem nome EN"))}</p>
        <div className={styles.pills}>
          <span>{entry.slot}</span>
          <span>ID: {item.item_key}</span>
          <span>{money(item.lowest_price_brl)}</span>
          <span>Pontuação: {entry.score}</span>
          <Link href={`/items/${encodeURIComponent(item.item_key)}`}>Detalhes</Link>
          <Link href={`/drops?q=${encodeURIComponent(title(item))}`}>Onde dropa</Link>
        </div>
        <div className={styles.scoreBar}><span style={{ width: `${width}%` }} /></div>
      </div>

      <span className={styles.gradeBadge} style={{ "--rarity-color": color } as React.CSSProperties}>{clean(item.grade, "?")}</span>
    </article>
  );
}
