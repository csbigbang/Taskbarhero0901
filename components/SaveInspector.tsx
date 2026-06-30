"use client";

import { useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import styles from "./SaveInspector.module.css";

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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

function brBytes(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(2)} MB`;
}

function brMoney(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);
}

function brDate(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

function itemKeyOf(row: ItemRow | undefined) {
  return row?.item_key ?? row?.ItemKey ?? row?.item_id ?? row?.id ?? null;
}

function itemName(row: ItemRow | undefined, itemKey?: number | null) {
  if (!row) return itemKey ? `Item ${itemKey}` : "Item não encontrado";
  return row.name_ptbr || row.name_pt_br || row.item_name_ptbr || row.item_name || row.name || row.market_hash_name || `Item ${itemKeyOf(row) || itemKey || ""}`;
}

function itemGrade(row: ItemRow | undefined) {
  if (!row) return "-";
  return row.grade || row.rarity || row.item_grade || row.Grade || "-";
}

function itemType(row: ItemRow | undefined) {
  if (!row) return "-";
  return row.type || row.item_type || row.gear_type || row.part || row.category || "-";
}

function itemPrice(row: ItemRow | undefined) {
  if (!row) return 0;
  const candidates = [row.lowest_price_brl, row.price_brl, row.median_price_brl, row.market_price_brl, row.sell_price_brl];
  for (const value of candidates) {
    const n = typeof value === "number" ? value : Number(value);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return 0;
}

function iconUrl(row: ItemRow | undefined, itemKey?: number | null) {
  const raw = row?.icon_path || row?.icon || row?.image || row?.image_path;
  if (typeof raw === "string" && raw.trim()) {
    if (raw.startsWith("/")) return raw;
    if (raw.endsWith(".png") || raw.endsWith(".webp") || raw.endsWith(".jpg")) return `/images/items/${raw}`;
    return `/images/items/${raw}.png`;
  }
  if (itemKey) return `/images/items/Item_${itemKey}.png`;
  return "";
}

function heroName(heroKey: number) {
  const names: Record<number, string> = {
    101: "Knight",
    201: "Ranger",
    301: "Sorcerer",
    401: "Priest",
    501: "Hunter",
    601: "Slayer",
  };
  return names[heroKey] || `Herói ${heroKey}`;
}

function useEquippedValue(analysis: SaveAnalysis | null, items: ItemMap) {
  return useMemo(() => {
    if (!analysis) return 0;
    let total = 0;
    for (const hero of analysis.heroes) {
      for (const equipped of hero.equipped) {
        if (!equipped.itemKey) continue;
        total += itemPrice(items[String(equipped.itemKey)]);
      }
    }
    return total;
  }, [analysis, items]);
}

async function loadItemRows(itemKeys: number[]) {
  if (!supabase || !itemKeys.length) return {} as ItemMap;
  const keys = Array.from(new Set(itemKeys)).slice(0, 500);

  const tryLoad = async (table: string) => {
    const { data, error } = await supabase.from(table).select("*").in("item_key", keys).limit(500);
    if (error) throw error;
    return data || [];
  };

  let rows: ItemRow[] = [];
  try {
    rows = await tryLoad("tbh_market_items_view");
  } catch {
    try {
      rows = await tryLoad("tbh_items_full");
    } catch {
      rows = [];
    }
  }

  const map: ItemMap = {};
  for (const row of rows) {
    const key = itemKeyOf(row);
    if (key !== null && key !== undefined) map[String(key)] = row;
  }
  return map;
}

function ItemIcon({ row, itemKey }: { row?: ItemRow; itemKey?: number | null }) {
  const [failed, setFailed] = useState(false);
  const src = iconUrl(row, itemKey);
  if (!src || failed) return null;
  return <img className={styles.itemIcon} src={src} alt="" onError={() => setFailed(true)} />;
}

function MiniItem({ itemKey, items }: { itemKey: number | null; items: ItemMap }) {
  const row = itemKey ? items[String(itemKey)] : undefined;
  const price = itemPrice(row);
  return (
    <div className={styles.miniItem}>
      <ItemIcon row={row} itemKey={itemKey} />
      <div>
        <strong>{itemName(row, itemKey)}</strong>
        <span>{itemKey ? `ID ${itemKey}` : "Item sem cadastro"} · {itemGrade(row)} · {itemType(row)}</span>
      </div>
      <em>{price > 0 ? brMoney(price) : "sem preço"}</em>
    </div>
  );
}

function HeroCard({ hero, items }: { hero: SaveAnalysis["heroes"][number]; items: ItemMap }) {
  const value = hero.equipped.reduce((sum, row) => sum + (row.itemKey ? itemPrice(items[String(row.itemKey)]) : 0), 0);
  return (
    <article className={styles.heroCard}>
      <div className={styles.heroTop}>
        <div>
          <span className={styles.kind}>{hero.unlocked ? "Desbloqueado" : "Bloqueado"}</span>
          <h3>{heroName(hero.heroKey)}</h3>
          <p>Hero Key {hero.heroKey}</p>
        </div>
        <div className={styles.heroStats}>
          <strong>Nível {hero.level}</strong>
          <span>{hero.equipped.length} equipado(s)</span>
          <span>{value > 0 ? brMoney(value) : "sem valor"}</span>
        </div>
      </div>

      {hero.equipped.length > 0 ? (
        <div className={styles.equipGrid}>
          {hero.equipped.map((slot) => (
            <div className={styles.slot} key={`${hero.heroKey}-${slot.slotIndex}-${slot.uniqueId}`}>
              <span>{slot.slotLabel}</span>
              <MiniItem itemKey={slot.itemKey} items={items} />
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.emptyBox}>Nenhum item equipado nesse personagem.</div>
      )}
    </article>
  );
}

export function SaveInspector() {
  const [analysis, setAnalysis] = useState<SaveAnalysis | null>(null);
  const [items, setItems] = useState<ItemMap>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const equippedValue = useEquippedValue(analysis, items);

  async function analyzeFile(file: File | null) {
    if (!file) return;
    setLoading(true);
    setError("");
    setAnalysis(null);
    setItems({});

    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch("/api/save/analyze", { method: "POST", body: form });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.error || "Falha ao ler o save.");

      setAnalysis(payload as SaveAnalysis);
      const map = await loadItemRows((payload as SaveAnalysis).itemKeys);
      setItems(map);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao analisar save.");
    } finally {
      setLoading(false);
    }
  }

  function copyReport() {
    if (!analysis) return;
    const lines = [
      "TBH Analisador de Salvamento BR",
      `Arquivo: ${analysis.fileName}`,
      `Versão: ${analysis.version}`,
      `Salvo em: ${brDate(analysis.savedAt)}`,
      `Horas jogadas: ${analysis.playTimeHours}`,
      `Personagens: ${analysis.heroes.length}`,
      `Equipamentos: ${analysis.equippedCount}`,
      `Valor equipado: ${brMoney(equippedValue)}`,
      "",
      ...analysis.heroes.map((hero) => {
        const equip = hero.equipped.map((slot) => `${slot.slotLabel}: ${itemName(slot.itemKey ? items[String(slot.itemKey)] : undefined, slot.itemKey)}`).join(" | ");
        return `${heroName(hero.heroKey)} Nível ${hero.level} -> ${equip || "sem equipamentos"}`;
      }),
    ];
    navigator.clipboard.writeText(lines.join("\n"));
  }

  return (
    <div className={styles.wrap}>
      <section className={`panel ${styles.uploadPanel}`}>
        <div className={styles.headerRow}>
          <div>
            <span className="eyebrow">🧩 Analisador de Salvamento</span>
            <h1>Analisar save</h1>
            <p>Envie o <strong>SaveFile_Live.es3</strong> para o site ler seus personagens e itens equipados.</p>
          </div>
          <div className={styles.statusBox}>
            <strong>{analysis ? "SAVE LIDO" : "AGUARDANDO"}</strong>
            <span>{analysis ? analysis.fileName : "Selecione seu save"}</span>
          </div>
        </div>

        <label className={styles.dropZone}>
          <input type="file" accept=".es3,.bak" onChange={(event) => analyzeFile(event.target.files?.[0] || null)} />
          <span>Selecionar salvamento</span>
          <small>Use o arquivo da pasta AppData/LocalLow/TesseractStudio/TaskBarHero</small>
        </label>

        <div className={styles.actions}>
          <button type="button" className="btn primary" onClick={copyReport} disabled={!analysis}>Copiar análise</button>
          <button type="button" className="btn ghost" onClick={() => { setAnalysis(null); setItems({}); setError(""); }} disabled={!analysis && !error}>Limpar</button>
        </div>

        {loading && <div className={styles.notice}>Lendo save e buscando itens no banco...</div>}
        {error && <div className={styles.error}>{error}</div>}
      </section>

      {analysis && (
        <>
          <section className={`panel ${styles.summaryPanel}`}>
            <div className="section-title-row">
              <h2>Resultado do save</h2>
              <span className="pill">{brBytes(analysis.fileSize)}</span>
            </div>
            <div className={styles.summaryGrid}>
              <div><strong>{analysis.heroes.length}</strong><span>personagens</span></div>
              <div><strong>{analysis.equippedCount}</strong><span>itens equipados</span></div>
              <div><strong>{analysis.itemCount}</strong><span>itens únicos</span></div>
              <div><strong>{brMoney(equippedValue)}</strong><span>valor equipado</span></div>
              <div><strong>{analysis.inventoryCount}</strong><span>inventário</span></div>
              <div><strong>{analysis.stashCount}</strong><span>stash</span></div>
              <div><strong>{analysis.playTimeHours}h</strong><span>tempo jogado</span></div>
              <div><strong>{analysis.version}</strong><span>versão do save</span></div>
            </div>
            <div className={styles.infoLine}>Salvo em: <strong>{brDate(analysis.savedAt)}</strong> · Steam: <strong>{analysis.steamIdMasked}</strong></div>
          </section>

          <section className={styles.heroesList}>
            <div className="section-title-row">
              <h2>Personagens e equipamentos</h2>
              <span className="pill">{analysis.equippedCount} equipado(s)</span>
            </div>
            <div className={styles.heroList}>
              {analysis.heroes.map((hero) => <HeroCard key={hero.heroKey} hero={hero} items={items} />)}
            </div>
          </section>

          <section className={`panel ${styles.extraPanel}`}>
            <h2>Resumo extra</h2>
            <div className={styles.extraGrid}>
              <div>
                <strong>Moedas</strong>
                {analysis.currencies.length ? (
                  <ul>{analysis.currencies.map((row) => <li key={row.key}>Key {row.key}: {row.quantity.toLocaleString("pt-BR")}</li>)}</ul>
                ) : <p>Nenhuma moeda detectada.</p>}
              </div>
              <div>
                <strong>Próxima melhoria</strong>
                <p>Agora o site consegue ler os equipados. O próximo passo é cruzar isso com o Planejador de Builds e sugerir upgrade automático por classe.</p>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
