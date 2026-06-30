import Link from "next/link";
import styles from "./audit.module.css";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Auditoria da Steam | TBH Banco de Dados BR",
  description: "Conferência dos preços do Mercado Steam usados pelo site.",
};

type Props = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

type PriceRow = {
  item_key: string;
  market_hash_name: string | null;
  appid: number | string | null;
  currency: number | string | null;
  success: boolean | null;
  lowest_price_text: string | null;
  median_price_text: string | null;
  volume: string | null;
  lowest_price_brl: number | string | null;
  median_price_brl: number | string | null;
  updated_at: string | null;
  last_success_at: string | null;
  last_error: string | null;
};

type ItemRow = {
  item_key: string;
  name_pt_br: string | null;
  name_en_us: string | null;
  icon_path: string | null;
  grade: string | null;
  item_type: string | null;
};

type SteamRow = {
  market_hash_name: string;
  sell_price_text: string | null;
  sale_price_text: string | null;
  lowest_price_brl: number | string | null;
  currency: number | string | null;
  updated_at: string | null;
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function brl(value: unknown) {
  const n = typeof value === "number" ? value : Number(String(value ?? "").replace(/[^0-9,.-]/g, "").replace(",", "."));
  if (!Number.isFinite(n) || n <= 0) return "sem preço";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
}

function hoursOld(date?: string | null) {
  if (!date) return Infinity;
  const t = new Date(date).getTime();
  if (!Number.isFinite(t)) return Infinity;
  return (Date.now() - t) / 36e5;
}

function itemName(item?: ItemRow, price?: PriceRow) {
  return item?.name_pt_br || item?.name_en_us || price?.market_hash_name || price?.item_key || "Item";
}

function steamUrl(hash?: string | null) {
  if (!hash) return "https://steamcommunity.com/market/search?appid=3678970";
  return `https://steamcommunity.com/market/listings/3678970/${encodeURIComponent(hash)}`;
}

function statusFor(row: PriceRow, steam?: SteamRow) {
  const age = hoursOld(row.last_success_at || row.updated_at);
  const text = `${row.lowest_price_text || ""} ${row.median_price_text || ""}`;
  const hasEuro = /€|EUR/i.test(text);
  const wrongCurrency = String(row.currency ?? "7") !== "7" || hasEuro;
  const price = Number(row.lowest_price_brl || 0);
  const steamPrice = Number(steam?.lowest_price_brl || 0);
  const diff = price > 0 && steamPrice > 0 ? Math.abs(price - steamPrice) / Math.max(price, steamPrice) : 0;

  if (!row.success || row.last_error) return { label: "ERRO", tone: "bad" as const, detail: row.last_error || "Sem sucesso no preço" };
  if (wrongCurrency) return { label: "MOEDA", tone: "bad" as const, detail: "Preço não está em BRL/currency=7" };
  if (!price) return { label: "SEM PREÇO", tone: "warn" as const, detail: "Sem lowest_price salvo" };
  if (diff > 0.08) return { label: "DIFERENTE", tone: "warn" as const, detail: "Preço salvo difere do discovery" };
  if (age > 24) return { label: "VELHO", tone: "warn" as const, detail: `Atualizado há ${Math.round(age)}h` };
  if (age > 6) return { label: "OK/ANTIGO", tone: "info" as const, detail: `Atualizado há ${Math.round(age)}h` };
  return { label: "OK", tone: "ok" as const, detail: "Preço recente em BRL" };
}

async function getAuditRows(query: string, status: string, limit: number) {
  const db = supabase();
  let req = db
    .from("tbh_market_prices")
    .select("item_key,market_hash_name,appid,currency,success,lowest_price_text,median_price_text,volume,lowest_price_brl,median_price_brl,updated_at,last_success_at,last_error")
    .order("updated_at", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (query) {
    req = req.or(`item_key.ilike.%${query}%,market_hash_name.ilike.%${query}%`);
  }

  const { data, error } = await req;
  if (error) throw error;
  const prices = (data ?? []) as PriceRow[];

  const itemKeys = Array.from(new Set(prices.map((p) => p.item_key).filter(Boolean))).slice(0, 900);
  const hashes = Array.from(new Set(prices.map((p) => p.market_hash_name).filter(Boolean) as string[])).slice(0, 900);

  const [itemsRes, steamRes] = await Promise.all([
    itemKeys.length
      ? db.from("tbh_items_full").select("item_key,name_pt_br,name_en_us,icon_path,grade,item_type").in("item_key", itemKeys)
      : Promise.resolve({ data: [], error: null }),
    hashes.length
      ? db.from("tbh_steam_market_items").select("market_hash_name,sell_price_text,sale_price_text,lowest_price_brl,currency,updated_at").in("market_hash_name", hashes)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (itemsRes.error) throw itemsRes.error;
  if (steamRes.error) throw steamRes.error;

  const itemMap = new Map(((itemsRes.data ?? []) as ItemRow[]).map((item) => [item.item_key, item]));
  const steamMap = new Map(((steamRes.data ?? []) as SteamRow[]).map((item) => [item.market_hash_name, item]));

  const rows = prices.map((price) => {
    const item = itemMap.get(price.item_key);
    const steam = price.market_hash_name ? steamMap.get(price.market_hash_name) : undefined;
    const state = statusFor(price, steam);
    return { price, item, steam, state };
  });

  if (status && status !== "all") {
    return rows.filter((row) => row.state.label.toLowerCase().includes(status.toLowerCase()));
  }

  return rows;
}

async function getSummary() {
  const db = supabase();
  const { data, error } = await db
    .from("tbh_market_prices")
    .select("success,currency,lowest_price_text,lowest_price_brl,updated_at,last_success_at,last_error")
    .limit(1000);
  if (error) throw error;
  const rows = (data ?? []) as PriceRow[];
  const total = rows.length;
  const ok = rows.filter((r) => r.success && Number(r.lowest_price_brl || 0) > 0 && String(r.currency ?? "7") === "7" && !/€|EUR/i.test(`${r.lowest_price_text || ""}`)).length;
  const old = rows.filter((r) => hoursOld(r.last_success_at || r.updated_at) > 24).length;
  const bad = rows.filter((r) => r.last_error || !r.success || /€|EUR/i.test(`${r.lowest_price_text || ""}`)).length;
  const last = rows.map((r) => r.updated_at).filter(Boolean).sort().at(-1) || null;
  return { total, ok, old, bad, last };
}

export default async function MarketAuditPage({ searchParams }: Props) {
  const params = (await searchParams) ?? {};
  const q = first(params.q) || "";
  const status = first(params.status) || "all";
  const limit = Math.min(Number(first(params.limit) || "250"), 500);

  const [rows, summary] = await Promise.all([getAuditRows(q, status, limit), getSummary()]);

  return (
    <main className={styles.auditShell}>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>Mercado Steam</p>
        <h1>Auditoria de preços</h1>
        <p>
          Página interna para conferir se o preço salvo no site está igual ao preço real usado pela Steam em R$.
          Use isso quando notar diferença entre o site e o Mercado.
        </p>
      </section>

      <section className={styles.cards}>
        <div className={styles.card}><strong>{summary.total}</strong><span>preços no cache</span></div>
        <div className={styles.card}><strong>{summary.ok}</strong><span>aparentemente OK</span></div>
        <div className={styles.card}><strong>{summary.old}</strong><span>com mais de 24h</span></div>
        <div className={styles.card}><strong>{summary.bad}</strong><span>com erro/moeda errada</span></div>
      </section>

      <section className={styles.toolbar}>
        <form>
          <input className={styles.input} name="q" placeholder="Buscar item ou nome na Steam" defaultValue={q} />
          <select className={styles.select} name="status" defaultValue={status}>
            <option value="all">Todos</option>
            <option value="erro">Erro</option>
            <option value="moeda">Moeda errada</option>
            <option value="velho">Velho</option>
            <option value="diferente">Diferente</option>
            <option value="ok">OK</option>
          </select>
          <select className={styles.select} name="limit" defaultValue={String(limit)}>
            <option value="100">100</option>
            <option value="250">250</option>
            <option value="500">500</option>
          </select>
          <button className={styles.button}>Filtrar</button>
        </form>
        <Link className={styles.linkButton} href="/market">Voltar ao mercado</Link>
      </section>

      <section className={styles.codeBox}>
        <strong>Comando recomendado para corrigir o cache:</strong>
        <pre>{`node scripts/refresh-steam-market-real.mjs --all`}</pre>
        <span className={styles.small}>Para testar poucos itens primeiro: node scripts/refresh-steam-market-real.mjs --limit 25</span>
      </section>

      <section className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Item</th>
              <th>Situação</th>
              <th>Preço salvo</th>
              <th>Mediana</th>
              <th>Volume</th>
              <th>Nome na Steam</th>
              <th>Atualização</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ price, item, steam, state }) => (
              <tr key={`${price.item_key}-${price.market_hash_name}`}>
                <td>
                  <div className={styles.itemCell}>
                    {item?.icon_path ? <img className={styles.icon} src={`/images/items/${String(item.icon_path).replace(/[^a-zA-Z0-9_-]/g, "")}.png`} alt="" /> : null}
                    <div>
                      <div className={styles.itemName}>{itemName(item, price)}</div>
                      <span className={styles.itemMeta}>{price.item_key} · {item?.grade || "sem raridade"} · {item?.item_type || "item"}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`${styles.status} ${styles[state.tone]}`}>{state.label}</span>
                  <span className={styles.raw}>{state.detail}</span>
                </td>
                <td>
                  <span className={styles.price}>{brl(price.lowest_price_brl)}</span>
                  <span className={styles.raw}>raw: {price.lowest_price_text || "-"}</span>
                  {steam?.lowest_price_brl ? <span className={styles.raw}>discovery: {brl(steam.lowest_price_brl)}</span> : null}
                </td>
                <td>
                  <span className={styles.price}>{brl(price.median_price_brl)}</span>
                  <span className={styles.raw}>raw: {price.median_price_text || "-"}</span>
                </td>
                <td>{price.volume || "-"}</td>
                <td className={styles.hash}>{price.market_hash_name || "-"}</td>
                <td>
                  <div>{price.last_success_at ? new Date(price.last_success_at).toLocaleString("pt-BR") : "sem sucesso"}</div>
                  <span className={styles.raw}>cache: {price.updated_at ? new Date(price.updated_at).toLocaleString("pt-BR") : "-"}</span>
                </td>
                <td>
                  <Link className={styles.linkButton} href={steamUrl(price.market_hash_name)} target="_blank">Steam</Link>
                </td>
              </tr>
            ))}
            {!rows.length ? (
              <tr><td colSpan={8}>Nenhum preço encontrado com esse filtro.</td></tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </main>
  );
}
