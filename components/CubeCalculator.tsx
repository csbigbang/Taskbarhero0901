"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { CubeData, CubeItem } from "@/lib/cube-calculator";
import styles from "./CubeCalculator.module.css";

const GRADE_ORDER = ["COMMON", "UNCOMMON", "RARE", "LEGENDARY", "IMMORTAL", "ARCANA", "BEYOND", "CELESTIAL", "DIVINE", "COSMIC"];
const GRADE_LABEL: Record<string, string> = {
  COMMON: "Comum",
  UNCOMMON: "Incomum",
  RARE: "Raro",
  LEGENDARY: "Lendário",
  IMMORTAL: "Imortal",
  ARCANA: "Arcana",
  BEYOND: "Superior",
  CELESTIAL: "Celestial",
  DIVINE: "Divino",
  COSMIC: "Cósmico",
};
const BASE_ODDS: Record<string, number> = {
  COMMON: 72,
  UNCOMMON: 48,
  RARE: 24,
  LEGENDARY: 12,
  IMMORTAL: 6.5,
  ARCANA: 3.8,
  BEYOND: 2.2,
  CELESTIAL: 1.2,
  DIVINE: 0.55,
};
const FALLBACK_PRICE: Record<string, number> = {
  COMMON: 0.05,
  UNCOMMON: 0.08,
  RARE: 0.16,
  LEGENDARY: 0.45,
  IMMORTAL: 1.2,
  ARCANA: 2.5,
  BEYOND: 5,
  CELESTIAL: 10,
  DIVINE: 22,
  COSMIC: 55,
};

function normalize(value?: string | null) {
  return String(value ?? "").trim().toUpperCase();
}

function title(item: CubeItem) {
  return item.name_pt_br || item.name_en_us || item.item_key;
}

function price(item: CubeItem) {
  const value = Number(item.lowest_price_brl || item.median_price_brl || 0);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function brl(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number.isFinite(value) ? value : 0);
}

function pct(value: number) {
  return `${Math.max(0, Math.min(100, value)).toFixed(value < 10 ? 2 : 1)}%`;
}

function nextGrade(grade: string) {
  const index = GRADE_ORDER.indexOf(grade);
  return index >= 0 && index < GRADE_ORDER.length - 1 ? GRADE_ORDER[index + 1] : "COSMIC";
}

function gradeClass(grade?: string | null) {
  return `grade grade-${String(grade ?? "common").toLowerCase()}`;
}

function rarityStyle(grade?: string | null) {
  const key = normalize(grade).toLowerCase();
  return { "--rarity": `var(--${key || "common"}, #ffd66e)` } as React.CSSProperties;
}

function cleanIconName(value?: string | null) {
  return String(value ?? "").trim().replace(/[^a-zA-Z0-9_-]/g, "");
}

function CubeIcon({ item }: { item: CubeItem }) {
  const [hidden, setHidden] = useState(false);
  const icon = cleanIconName(item.icon_path || `Item_${item.item_key}`);
  if (!icon || hidden) return null;
  return (
    <span className={styles.iconBox}>
      <img src={`/images/items/${icon}.png`} alt={title(item)} loading="lazy" onError={() => setHidden(true)} />
    </span>
  );
}

function ItemRow({ item, suffix }: { item: CubeItem; suffix?: string }) {
  const value = price(item);
  return (
    <div className={styles.itemRow} style={rarityStyle(item.grade)}>
      <CubeIcon item={item} />
      <div className={styles.itemInfo}>
        <strong>
          <Link href={`/items/${encodeURIComponent(item.item_key)}`}>{title(item)}</Link>
        </strong>
        <span>{item.item_type || "Tipo ?"} · {item.gear_type || item.parts || "-"} · Nível {item.level || "?"}</span>
        <small>{item.item_key} {suffix ? `· ${suffix}` : ""}</small>
      </div>
      <div className={styles.priceTag}>{value > 0 ? brl(value) : "sem preço"}</div>
    </div>
  );
}

function average(values: number[]) {
  const list = values.filter((value) => Number.isFinite(value) && value > 0);
  if (!list.length) return 0;
  return list.reduce((sum, value) => sum + value, 0) / list.length;
}

function median(values: number[]) {
  const list = values.filter((value) => Number.isFinite(value) && value > 0).sort((a, b) => a - b);
  if (!list.length) return 0;
  const mid = Math.floor(list.length / 2);
  return list.length % 2 ? list[mid] : (list[mid - 1] + list[mid]) / 2;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function CubeCalculator({ data }: { data: CubeData }) {
  const availableGrades = useMemo(() => GRADE_ORDER.filter((grade) => data.summary.grades.includes(grade)), [data.summary.grades]);
  const [fromGrade, setFromGrade] = useState(availableGrades.includes("RARE") ? "RARE" : availableGrades[0] || "COMMON");
  const [toGrade, setToGrade] = useState(nextGrade(availableGrades.includes("RARE") ? "RARE" : availableGrades[0] || "COMMON"));
  const [itemType, setItemType] = useState("ALL");
  const [amount, setAmount] = useState(3);
  const [profile, setProfile] = useState("balanced");
  const [budget, setBudget] = useState(50);
  const [copied, setCopied] = useState(false);

  const typeOptions = useMemo(() => ["ALL", ...data.summary.types], [data.summary.types]);

  const filteredFrom = useMemo(() => {
    return data.items.filter((item) => normalize(item.grade) === fromGrade && (itemType === "ALL" || item.item_type === itemType));
  }, [data.items, fromGrade, itemType]);

  const filteredTo = useMemo(() => {
    return data.items.filter((item) => normalize(item.grade) === toGrade && (itemType === "ALL" || item.item_type === itemType));
  }, [data.items, toGrade, itemType]);

  const sacrificeItems = useMemo(() => {
    return [...filteredFrom].sort((a, b) => {
      const pa = price(a) || FALLBACK_PRICE[fromGrade] || 0;
      const pb = price(b) || FALLBACK_PRICE[fromGrade] || 0;
      const da = Number(a.drop_count || 0);
      const db = Number(b.drop_count || 0);
      return pa - pb || db - da || title(a).localeCompare(title(b));
    }).slice(0, 8);
  }, [filteredFrom, fromGrade]);

  const protectedItems = useMemo(() => {
    return [...filteredFrom]
      .filter((item) => price(item) > 0)
      .sort((a, b) => price(b) - price(a))
      .slice(0, 8);
  }, [filteredFrom]);

  const targetItems = useMemo(() => {
    return [...filteredTo].sort((a, b) => {
      const pa = price(a) || FALLBACK_PRICE[toGrade] || 0;
      const pb = price(b) || FALLBACK_PRICE[toGrade] || 0;
      return pb - pa || title(a).localeCompare(title(b));
    }).slice(0, 10);
  }, [filteredTo, toGrade]);

  const fromPrices = filteredFrom.map((item) => price(item)).filter(Boolean);
  const toPrices = filteredTo.map((item) => price(item)).filter(Boolean);
  const fallbackFrom = FALLBACK_PRICE[fromGrade] || 0.1;
  const fallbackTo = FALLBACK_PRICE[toGrade] || fallbackFrom * 2;
  const materialPrice = median(fromPrices) || average(fromPrices) || fallbackFrom;
  const targetAverage = average(toPrices.slice(0, 30)) || median(toPrices) || fallbackTo;

  const amountMultiplier = amount <= 3 ? 1 : amount <= 5 ? 1.32 : amount <= 10 ? 2.05 : 2.35;
  const profileMultiplier = profile === "safe" ? 0.82 : profile === "aggressive" ? 1.18 : 1;
  const baseChance = BASE_ODDS[fromGrade] ?? 2;
  const chance = clamp(baseChance * amountMultiplier * profileMultiplier, 0.05, 95);
  const cost = materialPrice * amount;
  const expectedReturn = targetAverage * (chance / 100);
  const expectedProfit = expectedReturn - cost;
  const risk = clamp(100 - chance + Math.max(0, cost - budget) * 1.8, 1, 100);
  const valueScore = clamp((expectedReturn / Math.max(cost, 0.01)) * 38 + chance * 0.42 - risk * 0.18, 0, 100);

  const status = valueScore >= 68 ? "bom" : valueScore >= 42 ? "médio" : "arriscado";
  const statusClass = valueScore >= 68 ? styles.statusGood : valueScore >= 42 ? styles.statusMid : styles.statusBad;
  const copy = `TBH BR Cube: ${GRADE_LABEL[fromGrade] || fromGrade} -> ${GRADE_LABEL[toGrade] || toGrade} | ${amount} itens | chance estimada ${pct(chance)} | custo ${brl(cost)} | retorno esperado ${brl(expectedReturn)} | situação ${status.toUpperCase()}`;

  async function copyResult() {
    await navigator.clipboard.writeText(copy);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  function updateFromGrade(value: string) {
    setFromGrade(value);
    const next = nextGrade(value);
    setToGrade(next);
  }

  return (
    <div className={styles.cubeRoot}>
      <section className={`panel ${styles.heroPanel}`}>
        <div className={styles.heroText}>
          <span className="eyebrow">🧪 Ferramenta BR</span>
          <h1>Calculadora do Cube</h1>
          <p>
            Simule upgrades de raridade usando preço BR cacheado, raridade, quantidade de itens e possíveis retornos.
            A calculadora usa estimativa estratégica para ajudar o jogador a decidir se vale arriscar ou vender.
          </p>
          <p className={styles.note}>
            Não é chance oficial do jogo. É uma ferramenta de decisão baseada em dados do banco, raridade e mercado.
          </p>
        </div>
        <div className={styles.heroStats}>
          <div className={styles.statBox}><strong>{data.summary.totalItems}</strong><span>itens analisados</span></div>
          <div className={styles.statBox}><strong>{data.summary.pricedItems}</strong><span>com preço/cache</span></div>
          <div className={styles.statBox}><strong>{availableGrades.length}</strong><span>raridades</span></div>
          <div className={styles.statBox}><strong>{data.summary.types.length}</strong><span>tipos de item</span></div>
        </div>
      </section>

      <section className="panel">
        <div className={styles.controls}>
          <div className={styles.control}>
            <label>Raridade atual</label>
            <select value={fromGrade} onChange={(e) => updateFromGrade(e.target.value)}>
              {GRADE_ORDER.slice(0, -1).map((grade) => <option key={grade} value={grade}>{GRADE_LABEL[grade] || grade}</option>)}
            </select>
          </div>
          <div className={styles.control}>
            <label>Raridade alvo</label>
            <select value={toGrade} onChange={(e) => setToGrade(e.target.value)}>
              {GRADE_ORDER.slice(1).map((grade) => <option key={grade} value={grade}>{GRADE_LABEL[grade] || grade}</option>)}
            </select>
          </div>
          <div className={styles.control}>
            <label>Tipo</label>
            <select value={itemType} onChange={(e) => setItemType(e.target.value)}>
              {typeOptions.map((type) => <option key={type} value={type}>{type === "ALL" ? "Todos" : type}</option>)}
            </select>
          </div>
          <div className={styles.control}>
            <label>Quantidade</label>
            <select value={amount} onChange={(e) => setAmount(Number(e.target.value))}>
              <option value={3}>3 itens</option>
              <option value={5}>5 itens</option>
              <option value={10}>10 itens</option>
              <option value={12}>12 itens</option>
            </select>
          </div>
          <div className={styles.control}>
            <label>Perfil</label>
            <select value={profile} onChange={(e) => setProfile(e.target.value)}>
              <option value="safe">Seguro</option>
              <option value="balanced">Balanceado</option>
              <option value="aggressive">Agressivo</option>
            </select>
          </div>
          <div className={styles.control}>
            <label>Orçamento R$</label>
            <input type="number" min="0" step="1" value={budget} onChange={(e) => setBudget(Number(e.target.value || 0))} />
          </div>
        </div>
      </section>

      <section className={styles.resultGrid}>
        <div className={`panel ${styles.recommendation}`}>
          <div className={styles.recommendationHeader}>
            <h2>Resultado da simulação</h2>
            <span className={`${styles.statusBadge} ${statusClass}`}>{status}</span>
          </div>

          <div className={styles.mainNumbers}>
            <div className={styles.numberBox}><strong>{pct(chance)}</strong><span>chance estimada</span></div>
            <div className={styles.numberBox}><strong>{brl(cost)}</strong><span>custo estimado</span></div>
            <div className={styles.numberBox}><strong>{brl(expectedReturn)}</strong><span>retorno esperado</span></div>
            <div className={styles.numberBox}><strong>{brl(expectedProfit)}</strong><span>lucro esperado</span></div>
          </div>

          <div className={styles.progressShell}>
            <div className={styles.progressLabel}><span>Pontuação custo-benefício</span><strong>{valueScore.toFixed(0)}/100</strong></div>
            <div className={styles.progressBar}><span style={{ width: `${valueScore}%` }} /></div>
          </div>
          <div className={styles.progressShell}>
            <div className={styles.progressLabel}><span>Risco da tentativa</span><strong>{risk.toFixed(0)}/100</strong></div>
            <div className={styles.progressBar}><span style={{ width: `${risk}%` }} /></div>
          </div>

          <div className={styles.copyBox}>
            <span className={styles.copyText}>{copy}</span>
            <button className={styles.copyButton} onClick={copyResult}>{copied ? "Copiado" : "Copiar"}</button>
          </div>
        </div>

        <div className="panel">
          <div className={styles.sectionTitle}>
            <h2>Possíveis retornos</h2>
            <span className={gradeClass(toGrade)}>{GRADE_LABEL[toGrade] || toGrade}</span>
          </div>
          <div className={styles.itemList}>
            {targetItems.length ? targetItems.map((item) => <ItemRow key={item.item_key} item={item} suffix="alvo possível" />) : <div className={styles.empty}>Nenhum item alvo encontrado para esse filtro.</div>}
          </div>
        </div>
      </section>

      <section className={styles.sectionGrid}>
        <div className="panel">
          <div className={styles.sectionTitle}>
            <h2>Melhores sacrifícios</h2>
          </div>
          <div className={styles.itemList}>
            {sacrificeItems.length ? sacrificeItems.map((item) => <ItemRow key={item.item_key} item={item} suffix="baixo custo" />) : <div className={styles.empty}>Nenhum item encontrado.</div>}
          </div>
        </div>

        <div className="panel">
          <div className={styles.sectionTitle}>
            <h2>Não sacrificar</h2>
          </div>
          <div className={styles.itemList}>
            {protectedItems.length ? protectedItems.map((item) => <ItemRow key={item.item_key} item={item} suffix="valor alto" />) : <div className={styles.empty}>Sem itens caros nesse filtro.</div>}
          </div>
        </div>

        <div className="panel">
          <div className={styles.sectionTitle}>
            <h2>Como usar</h2>
          </div>
          <div className={styles.note}>
            <strong>1.</strong> Escolha a raridade atual dos itens que você pretende usar.<br />
            <strong>2.</strong> Escolha a raridade alvo e o tipo de item.<br />
            <strong>3.</strong> Compare custo estimado, chance e retorno esperado.<br />
            <strong>4.</strong> Se o risco estiver alto, venda os itens ou procure sacrifícios mais baratos.
          </div>
        </div>
      </section>
    </div>
  );
}
