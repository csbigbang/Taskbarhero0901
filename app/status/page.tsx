import Link from "next/link";
import styles from "./status.module.css";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Situação do Jogo | TBH Banco de Dados BR",
  description: "Situação pública do Task Bar Hero, SteamDB e cache do TBH Banco de Dados BR.",
};

type CountResult = {
  ok: boolean;
  count: number;
  error?: string;
};

type PriceRow = {
  updated_at: string | null;
  last_success_at: string | null;
  success: boolean | null;
  lowest_price_brl: number | string | null;
  last_error: string | null;
};

async function safeCount(table: string, filter?: (query: any) => any): Promise<CountResult> {
  try {
    const db = supabase();
    let req = db.from(table).select("*", { count: "exact", head: true });
    if (filter) req = filter(req);
    const { count, error } = await req;
    if (error) return { ok: false, count: 0, error: error.message };
    return { ok: true, count: count ?? 0 };
  } catch (error) {
    return { ok: false, count: 0, error: error instanceof Error ? error.message : "erro desconhecido" };
  }
}

async function getLatestPrices() {
  try {
    const db = supabase();
    const { data, error } = await db
      .from("tbh_market_prices")
      .select("updated_at,last_success_at,success,lowest_price_brl,last_error")
      .order("updated_at", { ascending: false, nullsFirst: false })
      .limit(1000);

    if (error) throw error;

    const rows = (data ?? []) as PriceRow[];
    const latest = rows
      .map((row) => row.last_success_at || row.updated_at)
      .filter(Boolean)
      .sort()
      .at(-1) || null;

    const ok = rows.filter((row) => row.success && Number(row.lowest_price_brl || 0) > 0 && !row.last_error).length;
    const errors = rows.filter((row) => row.last_error || row.success === false).length;

    return { ok: true, totalSample: rows.length, okPrices: ok, errors, latest, error: null as string | null };
  } catch (error) {
    return {
      ok: false,
      totalSample: 0,
      okPrices: 0,
      errors: 0,
      latest: null as string | null,
      error: error instanceof Error ? error.message : "erro desconhecido",
    };
  }
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value);
}

function formatDate(value?: string | null) {
  if (!value) return "sem atualização";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "sem atualização";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function ageHours(value?: string | null) {
  if (!value) return Infinity;
  const date = new Date(value).getTime();
  if (!Number.isFinite(date)) return Infinity;
  return (Date.now() - date) / 36e5;
}

function cacheState(latest?: string | null, okPrices = 0) {
  const age = ageHours(latest);
  if (!okPrices) return { label: "Aguardando", tone: "warn" as const, text: "Nenhum preço válido encontrado no cache." };
  if (age <= 6) return { label: "Online", tone: "ok" as const, text: "Cache de mercado recente no site." };
  if (age <= 24) return { label: "Estável", tone: "info" as const, text: "Cache válido, mas já pode ser atualizado depois." };
  return { label: "Antigo", tone: "warn" as const, text: "Cache com mais de 24h. Atualize quando a Steam liberar." };
}

export default async function StatusPage() {
  const [steamItems, acceptedLinks, localItems, priceCount, prices] = await Promise.all([
    safeCount("tbh_steam_market_items"),
    safeCount("tbh_steam_market_candidates", (req) => req.eq("status", "accepted")),
    safeCount("tbh_items_full"),
    safeCount("tbh_market_prices"),
    getLatestPrices(),
  ]);

  const state = cacheState(prices.latest, prices.okPrices);

  return (
    <main className={styles.statusShell}>
      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Situação do jogo</p>
          <h1>Situação do Task Bar Hero</h1>
          <p>
            Área pública para acompanhar o status geral do jogo, atividade na SteamDB e situação do cache usado pelo TBH Banco de Dados BR.
          </p>
        </div>
        <div className={`${styles.statusBadge} ${styles[state.tone]}`}>
          <strong>{state.label}</strong>
          <span>{state.text}</span>
        </div>
      </section>

      <section className={styles.quickGrid}>
        <article className={styles.card}>
          <span>Itens da Steam detectados</span>
          <strong>{steamItems.ok ? formatNumber(steamItems.count) : "--"}</strong>
          <em>Lista real do Mercado Steam</em>
        </article>
        <article className={styles.card}>
          <span>Itens mapeados</span>
          <strong>{acceptedLinks.ok ? formatNumber(acceptedLinks.count) : "--"}</strong>
          <em>Vínculos aceitos com o banco local</em>
        </article>
        <article className={styles.card}>
          <span>Banco local</span>
          <strong>{localItems.ok ? formatNumber(localItems.count) : "--"}</strong>
          <em>Itens importados do jogo</em>
        </article>
        <article className={styles.card}>
          <span>Preços em cache</span>
          <strong>{priceCount.ok ? formatNumber(priceCount.count) : "--"}</strong>
          <em>Última atualização: {formatDate(prices.latest)}</em>
        </article>
      </section>

      <section className={styles.embedPanel}>
        <div className={styles.panelHeader}>
          <div>
            <p className={styles.eyebrow}>SteamDB</p>
            <h2>Atividade pública do jogo</h2>
          </div>
          <div className={styles.actions}>
            <a href="https://store.steampowered.com/app/3678970" target="_blank" rel="noreferrer">Abrir Steam</a>
            <a href="https://steamcommunity.com/market/search?appid=3678970" target="_blank" rel="noreferrer">Abrir Mercado</a>
            <a href="https://steamdb.info/app/3678970" target="_blank" rel="noreferrer">Abrir SteamDB</a>
          </div>
        </div>

        <div className={styles.iframeWrap}>
          <iframe
            title="SteamDB Task Bar Hero"
            src="https://steamdb.info/embed/?appid=3678970"
            height="389"
            loading="lazy"
          />
        </div>
      </section>

      <section className={styles.cachePanel}>
        <div>
          <p className={styles.eyebrow}>TBH Banco de Dados BR</p>
          <h2>Situação do cache do site</h2>
          <p>
            Esta área não busca preço individual na Steam. Ela mostra apenas a situação dos dados já salvos no nosso banco.
          </p>
        </div>

        <div className={styles.cacheGrid}>
          <div className={styles.cacheItem}>
            <span>Preços válidos</span>
            <strong>{formatNumber(prices.okPrices)}</strong>
          </div>
          <div className={styles.cacheItem}>
            <span>Erros recentes</span>
            <strong>{formatNumber(prices.errors)}</strong>
          </div>
          <div className={styles.cacheItem}>
            <span>Última atualização</span>
            <strong>{formatDate(prices.latest)}</strong>
          </div>
        </div>

      </section>

      <section className={styles.linkPanel}>
        <Link href="/market/audit">Auditoria do mercado</Link>
        <Link href="/market/map">Mapa Steam ↔ Itens</Link>
        <Link href="/radar">Radar do Dia</Link>
      </section>
    </main>
  );
}
