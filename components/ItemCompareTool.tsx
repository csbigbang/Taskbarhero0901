"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import styles from "@/components/ItemCompareTool.module.css";
import {
  calculateItemScore,
  ComparableItem,
  compareValue,
  gradeKey,
  itemName,
  scoreLabel,
} from "@/lib/item-score";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

const ITEM_SELECT = `
  item_key,item_type,grade,parts,gear_type,gear_group,level,icon_path,name_pt_br,name_en_us
`;

const MARKET_SELECT = `
  item_key,item_type,grade,parts,gear_type,gear_group,level,icon_path,name_pt_br,name_en_us,market_hash_name,
  lowest_price_brl,median_price_brl,volume,market_score,cost_benefit_score,opportunity_score,drop_count,max_drop_weight_percent
`;

const GRADES = [
  "",
  "COMMON",
  "UNCOMMON",
  "RARE",
  "LEGENDARY",
  "IMMORTAL",
  "ARCANA",
  "BEYOND",
  "CELESTIAL",
  "DIVINE",
  "COSMIC",
];

function db() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
}

function clean(value?: string | number | null, fallback = "-") {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text.length ? text : fallback;
}

function money(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "-";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value));
}

function iconName(item: ComparableItem) {
  const raw = item.icon_path || (item.item_key ? `Item_${item.item_key}` : "");
  return String(raw).trim().replace(/[^a-zA-Z0-9_-]/g, "");
}

function ItemIcon({ item, big = false }: { item: ComparableItem; big?: boolean }) {
  const [failed, setFailed] = useState(false);
  const name = iconName(item);

  if (!name || failed) return null;

  return (
    <span className={`${styles.itemIcon} ${big ? styles.bigIcon : ""}`}>
      <img src={`/images/items/${name}.png`} alt="" onError={() => setFailed(true)} loading="lazy" />
    </span>
  );
}

function gradeClass(grade?: string | null) {
  return styles[gradeKey(grade).toLowerCase()] || styles.common;
}

function SuggestionCard({ item, onPickA, onPickB }: { item: ComparableItem; onPickA: () => void; onPickB: () => void }) {
  return (
    <article className={styles.suggestionCard}>
      <ItemIcon item={item} />
      <div className={styles.cardMain}>
        <strong>{itemName(item)}</strong>
        <p>{clean(item.name_en_us || item.market_hash_name)}</p>
        <span className={`${styles.grade} ${gradeClass(item.grade)}`}>{clean(item.grade, "?")}</span>
        <small>ID {item.item_key} · {clean(item.item_type)} · {money(item.lowest_price_brl)}</small>
        <div className={styles.cardActions}>
          <button type="button" className={styles.pickButton} onClick={onPickA}>Usar como A</button>
          <button type="button" className={styles.pickButton} onClick={onPickB}>Usar como B</button>
        </div>
      </div>
    </article>
  );
}

function SlotCard({ label, item, onClear }: { label: string; item: ComparableItem | null; onClear: () => void }) {
  const score = item ? calculateItemScore(item) : null;

  return (
    <article className={`${styles.slotCard} ${label === "A" ? styles.selectedA : styles.selectedB}`}>
      <div className={styles.slotHeader}>
        <span className={styles.slotBadge}>Item {label}</span>
        {item ? <button type="button" className={styles.clearButton} onClick={onClear}>Limpar</button> : null}
      </div>

      {!item ? (
        <div className={styles.emptySlot}>Escolha um item na busca acima.</div>
      ) : (
        <>
          <div className={styles.itemHeader}>
            <ItemIcon item={item} big />
            <div className={styles.cardMain}>
              <strong>{itemName(item)}</strong>
              <p>{clean(item.name_en_us || item.market_hash_name)}</p>
              <span className={`${styles.grade} ${gradeClass(item.grade)}`}>{clean(item.grade, "?")}</span>
              <div className="pill-row">
                <Link className="pill pill-link" href={`/items/${encodeURIComponent(item.item_key)}`}>Abrir item</Link>
                <Link className="pill pill-link" href={`/drops?q=${encodeURIComponent(itemName(item))}`}>Onde dropa</Link>
              </div>
            </div>
          </div>

          {score ? (
            <div className={styles.scoreBox}>
              <div className={styles.scoreTop}>
                <strong>Pontuação geral: {score.total}</strong>
                <span className={styles.scoreRank}>{scoreLabel(score.total)}</span>
              </div>
              <div className={styles.scoreBar}><span style={{ width: `${Math.min(100, score.total)}%` }} /></div>
              <div className={styles.breakdownGrid}>
                <div><strong>{score.rarity}</strong><span>raridade</span></div>
                <div><strong>{score.level}</strong><span>level</span></div>
                <div><strong>{score.market}</strong><span>mercado</span></div>
                <div><strong>{score.farm}</strong><span>farm</span></div>
                <div><strong>{score.liquidity}</strong><span>liquidez</span></div>
              </div>
            </div>
          ) : null}
        </>
      )}
    </article>
  );
}

type Row = {
  label: string;
  a: string;
  b: string;
  numeric?: [number | null | undefined, number | null | undefined];
  higherIsBetter?: boolean;
};

function comparisonRows(a: ComparableItem, b: ComparableItem): Row[] {
  const sa = calculateItemScore(a);
  const sb = calculateItemScore(b);

  return [
    { label: "Pontuação geral", a: String(sa.total), b: String(sb.total), numeric: [sa.total, sb.total], higherIsBetter: true },
    { label: "Raridade", a: clean(a.grade), b: clean(b.grade), numeric: [sa.rarity, sb.rarity], higherIsBetter: true },
    { label: "Preço mínimo", a: money(a.lowest_price_brl), b: money(b.lowest_price_brl), numeric: [a.lowest_price_brl, b.lowest_price_brl], higherIsBetter: true },
    { label: "Mediana", a: money(a.median_price_brl), b: money(b.median_price_brl), numeric: [a.median_price_brl, b.median_price_brl], higherIsBetter: true },
    { label: "Volume", a: clean(a.volume), b: clean(b.volume) },
    { label: "Drops encontrados", a: clean(a.drop_count), b: clean(b.drop_count), numeric: [a.drop_count, b.drop_count], higherIsBetter: true },
    { label: "Custo-benefício", a: clean(a.cost_benefit_score), b: clean(b.cost_benefit_score), numeric: [a.cost_benefit_score, b.cost_benefit_score], higherIsBetter: true },
    { label: "Oportunidade", a: clean(a.opportunity_score), b: clean(b.opportunity_score), numeric: [a.opportunity_score, b.opportunity_score], higherIsBetter: true },
    { label: "Tipo", a: clean(a.item_type), b: clean(b.item_type) },
    { label: "Parte", a: clean(a.parts), b: clean(b.parts) },
    { label: "Tipo de equipamento", a: clean(a.gear_type), b: clean(b.gear_type) },
    { label: "Nível", a: clean(a.level), b: clean(b.level), numeric: [Number(a.level || 0), Number(b.level || 0)], higherIsBetter: true },
  ];
}

function cellClass(row: Row, side: "a" | "b") {
  if (!row.numeric) return "";
  const cmp = compareValue(row.numeric[0], row.numeric[1]);
  if (cmp === 0) return "";
  const aWins = row.higherIsBetter ? cmp > 0 : cmp < 0;
  if (side === "a") return aWins ? styles.win : styles.lose;
  return aWins ? styles.lose : styles.win;
}

function Verdict({ a, b }: { a: ComparableItem; b: ComparableItem }) {
  const scoreA = calculateItemScore(a);
  const scoreB = calculateItemScore(b);
  const general = scoreA.total >= scoreB.total ? a : b;
  const valuable = compareValue(a.lowest_price_brl, b.lowest_price_brl) >= 0 ? a : b;
  const farm = compareValue(a.drop_count, b.drop_count) >= 0 ? a : b;

  return (
    <div className={styles.verdictGrid}>
      <div className={styles.verdictCard}><strong>Melhor geral</strong><span>{itemName(general)}</span></div>
      <div className={styles.verdictCard}><strong>Mais valioso</strong><span>{itemName(valuable)}</span></div>
      <div className={styles.verdictCard}><strong>Mais farmável</strong><span>{itemName(farm)}</span></div>
    </div>
  );
}

export function ItemCompareTool() {
  const [query, setQuery] = useState("");
  const [grade, setGrade] = useState("");
  const [kind, setKind] = useState("");
  const [items, setItems] = useState<ComparableItem[]>([]);
  const [a, setA] = useState<ComparableItem | null>(null);
  const [b, setB] = useState<ComparableItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    const timer = window.setTimeout(async () => {
      const client = db();
      if (!client) {
        setError("Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.");
        return;
      }

      setLoading(true);
      setError("");

      const q = query.trim();
      const pattern = q ? `%${q}%` : "%";

      let request = client
        .from("tbh_market_items_view")
        .select(MARKET_SELECT)
        .limit(18);

      if (q) {
        request = request.or(`item_key.ilike.${pattern},name_pt_br.ilike.${pattern},name_en_us.ilike.${pattern},market_hash_name.ilike.${pattern},item_type.ilike.${pattern},gear_type.ilike.${pattern},parts.ilike.${pattern}`);
      }
      if (grade) request = request.eq("grade", grade);
      if (kind) request = request.eq("item_type", kind);

      request = request.order("market_score", { ascending: false, nullsFirst: false });

      const marketResult = await request;
      let data = marketResult.data as ComparableItem[] | null;
      let err = marketResult.error;

      if (err) {
        let fallback = client.from("tbh_items_full").select(ITEM_SELECT).limit(18);
        if (q) {
          fallback = fallback.or(`item_key.ilike.${pattern},name_pt_br.ilike.${pattern},name_en_us.ilike.${pattern},item_type.ilike.${pattern},gear_type.ilike.${pattern},parts.ilike.${pattern}`);
        }
        if (grade) fallback = fallback.eq("grade", grade);
        if (kind) fallback = fallback.eq("item_type", kind);
        fallback = fallback.order("item_key", { ascending: true });
        const fallbackResult = await fallback;
        data = fallbackResult.data as ComparableItem[] | null;
        err = fallbackResult.error;
      }

      if (!alive) return;
      if (err) {
        setError(err.message || "Erro ao buscar itens.");
        setItems([]);
      } else {
        setItems(data ?? []);
      }
      setLoading(false);
    }, 260);

    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [query, grade, kind]);

  const rows = useMemo(() => (a && b ? comparisonRows(a, b) : []), [a, b]);

  async function copyCompare() {
    if (!a || !b) return;
    const scoreA = calculateItemScore(a);
    const scoreB = calculateItemScore(b);
    const text = [
      "Comparação TBH BR",
      `A: ${itemName(a)} | Pontuação ${scoreA.total} | ${clean(a.grade)} | ${money(a.lowest_price_brl)}`,
      `B: ${itemName(b)} | Pontuação ${scoreB.total} | ${clean(b.grade)} | ${money(b.lowest_price_brl)}`,
      `Vencedor geral: ${scoreA.total >= scoreB.total ? itemName(a) : itemName(b)}`,
    ].join("\n");
    await navigator.clipboard.writeText(text);
  }

  return (
    <div className={styles.compareShell}>
      <section className={styles.compareSearchPanel}>
        <div className={styles.controls}>
          <label className={styles.inputWrap}>
            <span>▶</span>
            <input
              className={styles.input}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar item: espada, bow, rubi, cosmic, 110001..."
            />
          </label>

          <select className={styles.select} value={grade} onChange={(e) => setGrade(e.target.value)}>
            {GRADES.map((g) => <option key={g || "all"} value={g}>{g ? g : "Todas raridades"}</option>)}
          </select>

          <select className={styles.select} value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="">Todos tipos</option>
            <option value="GEAR">Equipamento</option>
            <option value="MATERIAL">Material</option>
            <option value="STAGEBOX">Baú de fase</option>
            <option value="RUNE">Rune</option>
          </select>
        </div>

        <div className={styles.statusLine}>
          {loading ? "Buscando..." : error ? `Erro: ${error}` : `${items.length} item(ns) encontrados. Escolha A e B para comparar.`}
        </div>

        <div className={styles.suggestionGrid}>
          {items.map((item) => (
            <SuggestionCard
              key={item.item_key}
              item={item}
              onPickA={() => setA(item)}
              onPickB={() => setB(item)}
            />
          ))}
        </div>
      </section>

      <section className={styles.compareSlots}>
        <SlotCard label="A" item={a} onClear={() => setA(null)} />
        <SlotCard label="B" item={b} onClear={() => setB(null)} />
      </section>

      {a && b ? (
        <section className={styles.compareResultPanel}>
          <h2>Resultado da comparação</h2>
          <Verdict a={a} b={b} />
          <div className={styles.tableWrap}>
            <table className={styles.compareTable}>
              <thead>
                <tr>
                  <th>Atributo</th>
                  <th>{itemName(a)}</th>
                  <th>{itemName(b)}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.label}>
                    <th>{row.label}</th>
                    <td className={cellClass(row, "a")}>{row.a}</td>
                    <td className={cellClass(row, "b")}>{row.b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className={styles.footerActions}>
            <button type="button" className={styles.copyButton} onClick={copyCompare}>Copiar comparação</button>
            <Link className="btn" href={`/drops?q=${encodeURIComponent(itemName(a))}`}>Drops do item A</Link>
            <Link className="btn" href={`/drops?q=${encodeURIComponent(itemName(b))}`}>Drops do item B</Link>
          </div>
        </section>
      ) : null}
    </div>
  );
}
