"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import styles from "./InventoryValueTool.module.css";
import {
  compactInventory,
  entryValue,
  inventoryAction,
  InventoryEntry,
  InventoryItem,
  itemPrice,
  itemTitle,
  normalize,
  portfolioSummary,
} from "@/lib/inventory-score";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const STORAGE_KEY = "tbh-br-inventory-v1";

const MARKET_SELECT = `
  item_key,item_type,grade,parts,gear_type,level,icon_path,name_pt_br,name_en_us,market_hash_name,
  lowest_price_brl,median_price_brl,volume,market_score,cost_benefit_score,opportunity_score,drop_count,max_drop_weight_percent
`;

const ITEM_SELECT = `
  item_key,item_type,grade,parts,gear_type,level,icon_path,name_pt_br,name_en_us
`;

const GRADES = ["", "COMMON", "UNCOMMON", "RARE", "LEGENDARY", "IMMORTAL", "ARCANA", "BEYOND", "CELESTIAL", "DIVINE", "COSMIC"];
const TYPES = ["", "GEAR", "MATERIAL", "STAGEBOX", "RUNE", "SKILL", "ETC"];

function db() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
}

function brl(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number.isFinite(value) ? value : 0);
}

function number(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value || 0);
}

function clean(value?: string | number | null, fallback = "-") {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text.length ? text : fallback;
}

function iconName(item: InventoryItem) {
  const raw = item.icon_path || (item.item_key ? `Item_${item.item_key}` : "");
  return String(raw).trim().replace(/[^a-zA-Z0-9_-]/g, "");
}

function ItemIcon({ item, large = false }: { item: InventoryItem; large?: boolean }) {
  const [failed, setFailed] = useState(false);
  const name = iconName(item);
  if (!name || failed) return null;
  return (
    <span className={`${styles.itemIcon} ${large ? styles.itemIconLarge : ""}`}>
      <img src={`/images/items/${name}.png`} alt="" loading="lazy" onError={() => setFailed(true)} />
    </span>
  );
}

function gradeClass(grade?: string | null) {
  const key = normalize(grade).toLowerCase() || "common";
  return `grade grade-${key}`;
}

function actionClass(tone: string) {
  return styles[`action_${tone}`] || styles.action_neutral;
}

function save(entries: InventoryEntry[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function load(): InventoryEntry[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((row) => row?.item?.item_key)
      .map((row) => ({ item: row.item, qty: Math.max(1, Number(row.qty || 1)), locked: Boolean(row.locked), note: String(row.note || "") }));
  } catch {
    return [];
  }
}

function entryKey(item: InventoryItem) {
  return String(item.item_key || item.market_hash_name || itemTitle(item));
}

function SearchResultCard({ item, onAdd }: { item: InventoryItem; onAdd: () => void }) {
  return (
    <article className={styles.searchCard}>
      <ItemIcon item={item} />
      <div className={styles.searchInfo}>
        <strong>{itemTitle(item)}</strong>
        <span>{clean(item.name_en_us || item.market_hash_name)}</span>
        <div className={styles.badgeRow}>
          <span className={gradeClass(item.grade)}>{clean(item.grade, "?")}</span>
          <span className="pill">{clean(item.item_type)}</span>
          <span className="pill">{itemPrice(item) > 0 ? brl(itemPrice(item)) : "sem preço"}</span>
        </div>
      </div>
      <button type="button" className="btn primary" onClick={onAdd}>Adicionar</button>
    </article>
  );
}

function InventoryRow({ entry, onQty, onRemove, onToggleLock, onNote }: {
  entry: InventoryEntry;
  onQty: (qty: number) => void;
  onRemove: () => void;
  onToggleLock: () => void;
  onNote: (note: string) => void;
}) {
  const action = inventoryAction(entry);
  const unit = itemPrice(entry.item);
  const total = entryValue(entry, false);
  const estimated = entryValue(entry, true);

  return (
    <article className={styles.inventoryRow}>
      <ItemIcon item={entry.item} />
      <div className={styles.rowMain}>
        <div className={styles.rowTitleLine}>
          <strong>{itemTitle(entry.item)}</strong>
          <span className={gradeClass(entry.item.grade)}>{clean(entry.item.grade, "?")}</span>
        </div>
        <div className={styles.rowMeta}>
          <span>ID {entry.item.item_key}</span>
          <span>{clean(entry.item.item_type)}</span>
          <span>{clean(entry.item.gear_type || entry.item.parts)}</span>
          <span>{unit > 0 ? `${brl(unit)} un.` : "sem preço"}</span>
        </div>
        <input
          className={styles.noteInput}
          value={entry.note || ""}
          onChange={(e) => onNote(e.target.value)}
          placeholder="Anotação opcional: vender acima de X, guardar para build..."
        />
      </div>
      <div className={styles.qtyBox}>
        <label>Qtd</label>
        <input type="number" min="1" value={entry.qty} onChange={(e) => onQty(Math.max(1, Number(e.target.value || 1)))} />
      </div>
      <div className={styles.valueBox}>
        <strong>{total > 0 ? brl(total) : brl(estimated)}</strong>
        <span>{total > 0 ? "valor mercado" : "estimativa"}</span>
      </div>
      <div className={styles.actionBox}>
        <span className={`${styles.actionBadge} ${actionClass(action.tone)}`}>{action.label}</span>
        <small>{action.reason}</small>
      </div>
      <div className={styles.rowActions}>
        <Link className="pill pill-link" href={`/items/${encodeURIComponent(entry.item.item_key)}`}>Item</Link>
        <Link className="pill pill-link" href={`/drops?q=${encodeURIComponent(itemTitle(entry.item))}`}>Drop</Link>
        <button type="button" className="pill pill-button" onClick={onToggleLock}>{entry.locked ? "Destravar" : "Guardar"}</button>
        <button type="button" className="pill pill-button" onClick={onRemove}>Remover</button>
      </div>
    </article>
  );
}

function SummaryPanel({ entries }: { entries: InventoryEntry[] }) {
  const summary = portfolioSummary(entries);
  const mostValuable = [...entries].sort((a, b) => entryValue(b, true) - entryValue(a, true)).slice(0, 5);

  return (
    <section className={`panel ${styles.summaryPanel}`}>
      <div className={styles.summaryHeader}>
        <div>
          <span className="eyebrow">💰 Carteira BR</span>
          <h1>Valor do Inventário</h1>
          <p>Monte sua lista manualmente, calcule valor estimado em R$, veja o que vender, guardar ou usar no Cube.</p>
        </div>
        <div className={styles.totalValue}>
          <span>Valor com preço</span>
          <strong>{brl(summary.totalMarket)}</strong>
          <small>Estimado total: {brl(summary.totalEstimated)}</small>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div><strong>{number(summary.unique)}</strong><span>itens únicos</span></div>
        <div><strong>{number(summary.totalQty)}</strong><span>quantidade total</span></div>
        <div><strong>{number(summary.pricedQty)}</strong><span>com preço</span></div>
        <div><strong>{brl(summary.totalEstimated)}</strong><span>estimativa geral</span></div>
      </div>

      <div className={styles.summaryColumns}>
        <div>
          <h3>Por raridade</h3>
          <div className={styles.miniList}>
            {summary.byGrade.length ? summary.byGrade.map((row) => (
              <div key={row.grade}>
                <span className={gradeClass(row.grade)}>{row.grade}</span>
                <strong>{row.qty}x</strong>
                <em>{brl(row.value)}</em>
              </div>
            )) : <p>Nenhum item ainda.</p>}
          </div>
        </div>
        <div>
          <h3>Por recomendação</h3>
          <div className={styles.miniList}>
            {summary.byAction.length ? summary.byAction.map((row) => (
              <div key={row.action}>
                <span>{row.action}</span>
                <strong>{row.qty}x</strong>
                <em>{brl(row.value)}</em>
              </div>
            )) : <p>Nenhum item ainda.</p>}
          </div>
        </div>
        <div>
          <h3>Mais valiosos</h3>
          <div className={styles.miniList}>
            {mostValuable.length ? mostValuable.map((entry) => (
              <div key={entry.item.item_key}>
                <span>{itemTitle(entry.item)}</span>
                <strong>{entry.qty}x</strong>
                <em>{brl(entryValue(entry, true))}</em>
              </div>
            )) : <p>Nenhum item ainda.</p>}
          </div>
        </div>
      </div>
    </section>
  );
}

export function InventoryValueTool() {
  const [entries, setEntries] = useState<InventoryEntry[]>([]);
  const [query, setQuery] = useState("");
  const [grade, setGrade] = useState("");
  const [type, setType] = useState("");
  const [results, setResults] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [importText, setImportText] = useState("");

  useEffect(() => {
    setEntries(load());
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") save(entries);
  }, [entries]);

  useEffect(() => {
    let alive = true;
    const timer = window.setTimeout(async () => {
      const client = db();
      if (!client) {
        setError("Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.");
        return;
      }

      const q = query.trim();
      setLoading(true);
      setError("");

      try {
        let request = client.from("tbh_market_items_view").select(MARKET_SELECT).limit(18);
        if (q) {
          const pattern = `%${q}%`;
          request = request.or(`item_key.ilike.${pattern},name_pt_br.ilike.${pattern},name_en_us.ilike.${pattern},market_hash_name.ilike.${pattern},item_type.ilike.${pattern},gear_type.ilike.${pattern},parts.ilike.${pattern}`);
        }
        if (grade) request = request.eq("grade", grade);
        if (type) request = request.eq("item_type", type);
        request = request.order("lowest_price_brl", { ascending: false, nullsFirst: false });

        const market = await request;
        let data = market.data as InventoryItem[] | null;
        let err = market.error;

        if (err) {
          let fallback = client.from("tbh_items_full").select(ITEM_SELECT).limit(18);
          if (q) {
            const pattern = `%${q}%`;
            fallback = fallback.or(`item_key.ilike.${pattern},name_pt_br.ilike.${pattern},name_en_us.ilike.${pattern},item_type.ilike.${pattern},gear_type.ilike.${pattern},parts.ilike.${pattern}`);
          }
          if (grade) fallback = fallback.eq("grade", grade);
          if (type) fallback = fallback.eq("item_type", type);
          fallback = fallback.order("item_key", { ascending: true });
          const basic = await fallback;
          data = basic.data as InventoryItem[] | null;
          err = basic.error;
        }

        if (!alive) return;
        if (err) throw err;
        setResults(data ?? []);
      } catch (e) {
        if (!alive) return;
        setError(e instanceof Error ? e.message : "Erro ao buscar itens.");
        setResults([]);
      } finally {
        if (alive) setLoading(false);
      }
    }, 320);

    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [query, grade, type]);

  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => entryValue(b, true) - entryValue(a, true) || itemTitle(a.item).localeCompare(itemTitle(b.item), "pt-BR"));
  }, [entries]);

  function addItem(item: InventoryItem) {
    setEntries((current) => {
      const key = entryKey(item);
      const exists = current.find((entry) => entryKey(entry.item) === key);
      if (exists) {
        return current.map((entry) => entryKey(entry.item) === key ? { ...entry, qty: entry.qty + 1 } : entry);
      }
      return [...current, { item, qty: 1 }];
    });
  }

  function updateEntry(itemKey: string, patch: Partial<InventoryEntry>) {
    setEntries((current) => current.map((entry) => entry.item.item_key === itemKey ? { ...entry, ...patch } : entry));
  }

  function removeEntry(itemKey: string) {
    setEntries((current) => current.filter((entry) => entry.item.item_key !== itemKey));
  }

  async function copyInventory() {
    const payload = {
      generated_by: "TBH Banco de Dados BR",
      total_market_brl: portfolioSummary(entries).totalMarket,
      total_estimated_brl: portfolioSummary(entries).totalEstimated,
      items: compactInventory(entries),
    };
    await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  function exportFile() {
    const blob = new Blob([JSON.stringify(entries, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tbh-inventario-br.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function importInventory() {
    try {
      const parsed = JSON.parse(importText);
      const source = Array.isArray(parsed) ? parsed : Array.isArray(parsed.items) ? parsed.items : [];
      const mapped = source
        .filter((row: any) => row?.item?.item_key || row?.item_key)
        .map((row: any) => ({
          item: row.item || { item_key: row.item_key, name_pt_br: row.name, grade: row.grade },
          qty: Math.max(1, Number(row.qty || 1)),
          locked: Boolean(row.locked),
          note: String(row.note || ""),
        }));
      if (!mapped.length) throw new Error("Nenhum item válido encontrado.");
      setEntries(mapped);
      setImportText("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "JSON inválido.");
    }
  }

  return (
    <div className={styles.inventoryRoot}>
      <SummaryPanel entries={entries} />

      <section className="panel">
        <div className="section-title-row">
          <div>
            <span className="eyebrow">🎒 Adicionar itens</span>
            <h2>Buscar no database</h2>
            <p>Pesquise pelo nome, ID, tipo ou parte. O inventário fica salvo no navegador.</p>
          </div>
          <div className={styles.topActions}>
            <button type="button" className="btn" onClick={copyInventory}>{copied ? "Copiado" : "Copiar resumo"}</button>
            <button type="button" className="btn" onClick={exportFile}>Exportar JSON</button>
            <button type="button" className="btn danger" onClick={() => setEntries([])}>Limpar</button>
          </div>
        </div>

        <div className={styles.searchGrid}>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ex: Rubi, Cósmico, espada, Item_110001..." />
          <select value={grade} onChange={(e) => setGrade(e.target.value)}>
            {GRADES.map((value) => <option key={value || "all"} value={value}>{value || "Todas raridades"}</option>)}
          </select>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            {TYPES.map((value) => <option key={value || "all"} value={value}>{value || "Todos tipos"}</option>)}
          </select>
        </div>

        {error ? <div className="notice">{error}</div> : null}
        <p className={styles.resultLine}>{loading ? "Buscando..." : `${results.length} resultado(s)`}</p>

        <div className={styles.searchResults}>
          {results.map((item) => <SearchResultCard key={item.item_key} item={item} onAdd={() => addItem(item)} />)}
        </div>
      </section>

      <section className="panel">
        <div className="section-title-row">
          <div>
            <span className="eyebrow">📦 Seu inventário</span>
            <h2>Itens adicionados</h2>
            <p>Use as ações para decidir o que vender, guardar, usar no Cube ou testar em build.</p>
          </div>
        </div>

        <div className={styles.inventoryList}>
          {sortedEntries.length ? sortedEntries.map((entry) => (
            <InventoryRow
              key={entry.item.item_key}
              entry={entry}
              onQty={(qty) => updateEntry(entry.item.item_key, { qty })}
              onRemove={() => removeEntry(entry.item.item_key)}
              onToggleLock={() => updateEntry(entry.item.item_key, { locked: !entry.locked })}
              onNote={(note) => updateEntry(entry.item.item_key, { note })}
            />
          )) : <div className={styles.empty}>Nenhum item adicionado ainda. Busque um item acima e clique em adicionar.</div>}
        </div>
      </section>

      <section className="panel">
        <div className="section-title-row">
          <div>
            <span className="eyebrow">⬇️ Importar lista</span>
            <h2>Restaurar inventário</h2>
            <p>Cole aqui um JSON exportado anteriormente pelo site.</p>
          </div>
        </div>
        <textarea className={styles.importBox} value={importText} onChange={(e) => setImportText(e.target.value)} placeholder="Cole aqui o JSON exportado..." />
        <div className={styles.topActions}>
          <button type="button" className="btn primary" onClick={importInventory}>Importar JSON</button>
        </div>
      </section>
    </div>
  );
}
