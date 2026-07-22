import Link from "next/link";
import { ItemImage } from "@/components/ItemImage";
import { MarketNotice } from "@/components/MarketNotice";
import { supabase } from "@/lib/supabase";
import styles from "./market.module.css";

export const dynamic = "force-dynamic";

type Props = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

type PriceRow = {
  item_key: string;
  market_hash_name: string | null;
  appid: number | null;
  currency: number | null;
  success: boolean | null;
  lowest_price_text: string | null;
  median_price_text: string | null;
  volume: string | null;
  lowest_price_brl: number | null;
  median_price_brl: number | null;
  last_error: string | null;
  last_success_at: string | null;
  updated_at?: string | null;
};

type ItemRow = {
  item_key: string;
  item_type?: string | null;
  grade?: string | null;
  parts?: string | null;
  gear_type?: string | null;
  gear_group?: string | null;
  level?: string | null;
  icon_path?: string | null;
  name_pt_br?: string | null;
  name_en_us?: string | null;
};

type HistoryRow = {
  item_key: string;
  created_at: string;
  lowest_price_brl: number | null;
};

type MarketRow = PriceRow & {
  item?: ItemRow;
  history24h: number[];
  spreadPercent: number | null;
  volumeNumber: number;
  title: string;
};

const SORTS = [
  { value: "volume", label: "Volume 24h" },
  { value: "lowest", label: "Menor preço" },
  { value: "median", label: "Mediana" },
  { value: "spread", label: "Spread" },
  { value: "updated", label: "Atualização mais recente" },
  { value: "name", label: "Nome" },
] as const;

type PreferenceOption = {
  code: string;
  label: string;
  active?: boolean;
};

const CURRENCY_OPTIONS: PreferenceOption[] = [
  { code: "BRL", label: "R$1,00", active: true },
  { code: "USD", label: "$1.00" },
  { code: "EUR", label: "1,00 €" },
  { code: "JPY", label: "¥1.00" },
  { code: "PHP", label: "₱1.00" },
  { code: "KRW", label: "₩1.00" },
];

const LANGUAGE_OPTIONS: PreferenceOption[] = [
  { code: "PT", label: "Português", active: true },
  { code: "EN", label: "English" },
  { code: "ES", label: "Español" },
  { code: "FR", label: "Français" },
  { code: "DE", label: "Deutsch" },
  { code: "PL", label: "Polski" },
  { code: "TR", label: "Türkçe" },
  { code: "RU", label: "Русский" },
  { code: "JA", label: "日本語" },
  { code: "KO", label: "한국어" },
  { code: "ZH", label: "简体中文" },
  { code: "TH", label: "ไทย" },
  { code: "VI", label: "Tiếng Việt" },
  { code: "ID", label: "Indonesia" },
];

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function normalize(value: unknown) {
  return String(value ?? "").trim();
}

function lower(value: unknown) {
  return normalize(value).toLowerCase();
}

function parseVolume(value: string | null | undefined) {
  const raw = normalize(value).replace(/,/g, "").replace(/\./g, "");
  const n = Number(raw.replace(/[^0-9]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function compactVolume(value: string | null | undefined) {
  const n = parseVolume(value);
  if (!n) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}m`;
  if (n >= 1000) return `${Math.round(n / 1000)}k`;
  return String(n);
}

function moneyText(text: string | null | undefined, value: number | null | undefined) {
  if (text) return text.replace("R$", "R$");
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return "—";
  return Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function spread(lowest: number | null | undefined, median: number | null | undefined) {
  const low = Number(lowest ?? 0);
  const med = Number(median ?? 0);
  if (!low || !med || med <= low) return null;
  return ((med - low) / low) * 100;
}

function gradeLabel(value: string | null | undefined) {
  const grade = normalize(value).toUpperCase();
  return grade || "SEM RARIDADE";
}

function gradeClass(value: string | null | undefined) {
  return gradeLabel(value).replace(/[^A-Z0-9]+/g, "_").toLowerCase();
}

function itemTitle(row: PriceRow, item?: ItemRow) {
  return normalize(item?.name_pt_br) || normalize(item?.name_en_us) || normalize(row.market_hash_name) || row.item_key;
}

function timeAgo(value: string | null | undefined) {
  if (!value) return "sem atualização";
  const ms = Date.now() - new Date(value).getTime();
  if (!Number.isFinite(ms) || ms < 0) return "agora";
  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "há 1 dia" : `há ${days} dias`;
}

function Sparkline({ values }: { values: number[] }) {
  const clean = values.filter((v) => Number.isFinite(v) && v > 0).slice(-48);
  if (!clean.length) return <span className={styles.emptySpark}>—</span>;

  if (clean.length === 1) {
    return (
      <svg className={styles.sparkline} viewBox="0 0 96 34" aria-label="Histórico de preços das últimas 24 horas">
        <line x1="8" y1="17" x2="88" y2="17" />
        <circle cx="88" cy="17" r="2.5" />
      </svg>
    );
  }

  const min = Math.min(...clean);
  const max = Math.max(...clean);
  const range = Math.max(max - min, 0.0001);
  const points = clean.map((value, index) => {
    const x = 6 + (index / Math.max(clean.length - 1, 1)) * 84;
    const y = 28 - ((value - min) / range) * 22;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(" ");

  return (
    <svg className={styles.sparkline} viewBox="0 0 96 34" aria-label="Histórico de preços das últimas 24 horas">
      <polyline points={points} />
    </svg>
  );
}

function marketLoadMessage(error: unknown) {
  const raw = error instanceof Error ? error.message : String(error ?? "");

  if (/ENOTFOUND|getaddrinfo|fetch failed/i.test(raw)) {
    return "Não foi possível conectar ao banco de dados. Confirme o endereço do projeto Supabase e se o projeto está ativo.";
  }

  if (/timeout|aborted/i.test(raw)) {
    return "A conexão com o banco de dados demorou além do esperado. Tente novamente em alguns instantes.";
  }

  return "O mercado está temporariamente indisponível. Tente novamente em alguns instantes.";
}

async function getMarketData() {
  const db = supabase();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [pricesRes, itemsRes, historyRes] = await Promise.all([
    db
      .from("tbh_market_prices")
      .select("*")
      .eq("success", true)
      .not("lowest_price_brl", "is", null)
      .limit(1500),
    db
      .from("tbh_market_items_view")
      .select("*")
      .limit(2000),
    db
      .from("tbh_market_price_history")
      .select("item_key,created_at,lowest_price_brl")
      .eq("success", true)
      .not("lowest_price_brl", "is", null)
      .gte("created_at", since)
      .order("created_at", { ascending: true })
      .limit(50000),
  ]);

  if (pricesRes.error) throw pricesRes.error;
  if (itemsRes.error) throw itemsRes.error;
  if (historyRes.error) throw historyRes.error;

  const itemMap = new Map<string, ItemRow>();
  for (const item of (itemsRes.data ?? []) as ItemRow[]) {
    if (item.item_key) itemMap.set(String(item.item_key), item);
  }

  const historyMap = new Map<string, number[]>();
  for (const point of (historyRes.data ?? []) as HistoryRow[]) {
    if (!point.item_key || point.lowest_price_brl === null) continue;
    const list = historyMap.get(point.item_key) ?? [];
    list.push(Number(point.lowest_price_brl));
    historyMap.set(point.item_key, list);
  }

  const rows: MarketRow[] = ((pricesRes.data ?? []) as PriceRow[])
    .filter((row) => row.item_key && row.lowest_price_brl !== null)
    .map((row) => {
      const item = itemMap.get(String(row.item_key));
      const history24h = historyMap.get(String(row.item_key)) ?? [];
      const current = Number(row.lowest_price_brl ?? 0);
      return {
        ...row,
        item,
        title: itemTitle(row, item),
        history24h: history24h.length ? history24h : current ? [current] : [],
        spreadPercent: spread(row.lowest_price_brl, row.median_price_brl),
        volumeNumber: parseVolume(row.volume),
      };
    });

  return rows;
}

function sortRows(rows: MarketRow[], sort: string) {
  const list = [...rows];
  if (sort === "lowest") return list.sort((a, b) => Number(b.lowest_price_brl ?? 0) - Number(a.lowest_price_brl ?? 0));
  if (sort === "median") return list.sort((a, b) => Number(b.median_price_brl ?? 0) - Number(a.median_price_brl ?? 0));
  if (sort === "spread") return list.sort((a, b) => Number(b.spreadPercent ?? -1) - Number(a.spreadPercent ?? -1));
  if (sort === "updated") return list.sort((a, b) => new Date(b.last_success_at ?? 0).getTime() - new Date(a.last_success_at ?? 0).getTime());
  if (sort === "name") return list.sort((a, b) => a.title.localeCompare(b.title, "pt-BR"));
  return list.sort((a, b) => b.volumeNumber - a.volumeNumber || Number(b.lowest_price_brl ?? 0) - Number(a.lowest_price_brl ?? 0));
}

export default async function MarketPage({ searchParams }: Props) {
  const sp = (await searchParams) ?? {};
  const q = lower(first(sp.q));
  const grade = normalize(first(sp.grade)).toUpperCase();
  const sort = normalize(first(sp.sort)) || "volume";

  let loadError: string | null = null;
  const allRows = await getMarketData().catch((error) => {
    loadError = marketLoadMessage(error);
    console.error("[market] Falha ao carregar dados do Supabase:", error);
    return [] as MarketRow[];
  });
  const grades = Array.from(new Set(allRows.map((row) => gradeLabel(row.item?.grade)).filter(Boolean))).sort();

  const filtered = allRows.filter((row) => {
    const haystack = lower(`${row.title} ${row.market_hash_name} ${row.item_key} ${row.item?.item_type ?? ""} ${row.item?.grade ?? ""}`);
    if (q && !haystack.includes(q)) return false;
    if (grade && gradeLabel(row.item?.grade) !== grade) return false;
    return true;
  });

  const rows = sortRows(filtered, sort).slice(0, 150);
  const withHistory = allRows.filter((row) => row.history24h.length > 1).length;
  const lastUpdate = allRows
    .map((row) => row.last_success_at)
    .filter(Boolean)
    .sort()
    .at(-1) ?? null;

  const totalVolume = allRows.reduce((sum, row) => sum + row.volumeNumber, 0);
  const avgLowest = allRows.length ? allRows.reduce((sum, row) => sum + Number(row.lowest_price_brl ?? 0), 0) / allRows.length : 0;

  return (
    <main className={styles.marketPage}>
      <section className={styles.marketHero}>
        <div>
          <span className={styles.kicker}>Mercado Steam · BRL</span>
          <h1>Mercado</h1>
          <p>Preços armazenados da Steam com menor preço, mediana, volume, diferença percentual e histórico das últimas 24 horas.</p>
          <details className={styles.preferenceMenu}>
            <summary>
              <span>BRL</span>
              <strong>Português</strong>
            </summary>
            <div className={styles.preferencePanel}>
              <section>
                <h2>Currency</h2>
                <div className={styles.preferenceGrid}>
                  {CURRENCY_OPTIONS.map((option) => (
                    <span className={option.active ? styles.preferenceActive : undefined} key={option.code}>
                      <em>{option.code}</em>
                      <strong>{option.label}</strong>
                    </span>
                  ))}
                </div>
              </section>
              <section>
                <h2>Language</h2>
                <div className={styles.preferenceGrid}>
                  {LANGUAGE_OPTIONS.map((option) => (
                    <span className={option.active ? styles.preferenceActive : undefined} key={option.code}>
                      <em>{option.code}</em>
                      <strong>{option.label}</strong>
                    </span>
                  ))}
                </div>
              </section>
              <p>Conversão e idiomas extras entram depois. Hoje o mercado usa BRL oficial da Steam e interface PT-BR.</p>
            </div>
          </details>
        </div>
        <div className={styles.heroStats}>
          <div><strong>{allRows.length}</strong><span>itens com preço</span></div>
          <div><strong>{compactVolume(String(totalVolume))}</strong><span>volume total</span></div>
          <div><strong>{moneyText(null, avgLowest)}</strong><span>média do menor preço</span></div>
          <div><strong>{withHistory}</strong><span>com histórico de 24 h</span></div>
        </div>
      </section>

      <MarketNotice />

      {loadError ? (
        <section className={styles.connectionWarning} role="status" aria-live="polite">
          <strong>Mercado temporariamente indisponível</strong>
          <p>{loadError}</p>
        </section>
      ) : null}

      <form className={styles.marketFilters} action="/market">
        <label>
          <span>Buscar</span>
          <input name="q" defaultValue={first(sp.q) ?? ""} placeholder="Soulstone, Arcane Ore, Amber Gem..." />
        </label>
        <label>
          <span>Raridade</span>
          <select name="grade" defaultValue={grade}>
            <option value="">Todas</option>
            {grades.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <label>
          <span>Ordenar</span>
          <select name="sort" defaultValue={sort}>
            {SORTS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </label>
        <button type="submit">Filtrar</button>
        <Link href="/market">Limpar</Link>
      </form>

      <section className={styles.marketPanel}>
        <div className={styles.panelHead}>
          <div>
            <strong>{rows.length}</strong>
            <span>itens exibidos</span>
          </div>
          <p>Última atualização: {timeAgo(lastUpdate)}</p>
        </div>

        <div className={styles.marketTable}>
          <div className={styles.tableHeader}>
            <span>Item</span>
            <span>Menor preço</span>
            <span>Mediana</span>
            <span>Volume em 24 h</span>
            <span>Diferença</span>
            <span>Histórico de 24 h</span>
          </div>

          {rows.map((row) => {
            const item = row.item;
            const title = row.title;
            return (
              <article className={styles.marketRow} key={row.item_key}>
                <div className={styles.itemCell}>
                  <ItemImage iconPath={item?.icon_path} itemKey={row.item_key} alt={title} size="sm" />
                  <div>
                    <Link href={`/items/${encodeURIComponent(row.item_key)}`}>{title}</Link>
                    <p>
                      <span className={`${styles.grade} ${styles[`grade_${gradeClass(item?.grade)}`] ?? ""}`}>{gradeLabel(item?.grade)}</span>
                      <em> · Atualizado {timeAgo(row.last_success_at)}</em>
                    </p>
                  </div>
                </div>
                <strong className={styles.priceMain}>{moneyText(row.lowest_price_text, row.lowest_price_brl)}</strong>
                <span className={styles.priceMuted}>{moneyText(row.median_price_text, row.median_price_brl)}</span>
                <span className={styles.volume}>{compactVolume(row.volume)}</span>
                <span className={styles.spread}>{row.spreadPercent === null ? "—" : `${row.spreadPercent.toFixed(1)}%`}</span>
                <Sparkline values={row.history24h} />
              </article>
            );
          })}
        </div>

        {!rows.length ? (
          <div className={styles.emptyState}>
            <strong>Nenhum item encontrado</strong>
            <p>Limpe os filtros ou aguarde a próxima atualização dos preços.</p>
          </div>
        ) : null}
      </section>
    </main>
  );
}
