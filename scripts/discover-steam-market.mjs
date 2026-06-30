#!/usr/bin/env node
import { APP_ID, CURRENCY, COUNTRY, DELAY_MS, LANGUAGE, compactSteamIconUrl, parseSteamPrice, requireSupabase, sleep } from "./steam-utils.mjs";

const db = requireSupabase();
const MAX = Number(process.env.STEAM_DISCOVER_MAX || "1000");
const COUNT = Math.min(Number(process.env.STEAM_DISCOVER_COUNT || "100"), 100);

async function fetchPage(start) {
  const url = new URL("https://steamcommunity.com/market/search/render/");
  url.searchParams.set("query", "");
  url.searchParams.set("start", String(start));
  url.searchParams.set("count", String(COUNT));
  url.searchParams.set("search_descriptions", "0");
  url.searchParams.set("sort_column", "popular");
  url.searchParams.set("sort_dir", "desc");
  url.searchParams.set("appid", String(APP_ID));
  url.searchParams.set("norender", "1");
  url.searchParams.set("currency", String(CURRENCY));
  url.searchParams.set("cc", COUNTRY.toLowerCase());
  url.searchParams.set("country", COUNTRY);
  url.searchParams.set("l", LANGUAGE);

  const res = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0 TBH-Database-BR/1.0 market discovery",
      "accept": "application/json,text/plain,*/*",
      "accept-language": "pt-BR,pt;q=0.9,en-US;q=0.7,en;q=0.5"
    }
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Steam Market search falhou: HTTP ${res.status} ${body.slice(0, 120)}`);
  }

  const json = await res.json();
  if (!json.success) throw new Error(`Steam Market retornou success=false: ${JSON.stringify(json).slice(0, 200)}`);
  return json;
}

function rowFromResult(r) {
  const asset = r.asset_description || {};
  const marketHash = r.hash_name || asset.market_hash_name || r.name;
  const iconUrl = compactSteamIconUrl(asset.icon_url || asset.icon_url_large || r.icon_url);
  const priceText = r.sell_price_text || r.sale_price_text || r.lowest_price || null;
  const priceBrl = parseSteamPrice(priceText, CURRENCY);

  return {
    market_hash_name: marketHash,
    appid: APP_ID,
    name: r.name || asset.name || marketHash,
    type: asset.type || r.app_name || null,
    icon_url: iconUrl,
    sell_listings: typeof r.sell_listings === "number" ? r.sell_listings : Number(String(r.sell_listings || "0").replace(/[^0-9]/g, "")),
    sell_price: typeof r.sell_price === "number" ? r.sell_price : null,
    sell_price_text: r.sell_price_text || null,
    sale_price_text: r.sale_price_text || null,
    lowest_price_brl: priceBrl,
    currency: CURRENCY,
    raw: r,
    updated_at: new Date().toISOString()
  };
}

async function main() {
  console.log(`Descobrindo Steam Market: appid=${APP_ID}, currency=${CURRENCY}, country=${COUNTRY}, max=${MAX}, count=${COUNT}`);

  let start = 0;
  let total = null;
  let imported = 0;
  const seen = new Set();

  while (start < MAX) {
    const page = await fetchPage(start);
    const results = Array.isArray(page.results) ? page.results : [];
    total = typeof page.total_count === "number" ? page.total_count : total;
    if (!results.length) break;

    const rows = results.map(rowFromResult).filter((r) => r.market_hash_name && !seen.has(r.market_hash_name));
    for (const r of rows) seen.add(r.market_hash_name);

    if (rows.length) {
      const { error } = await db.from("tbh_steam_market_items").upsert(rows, { onConflict: "market_hash_name" });
      if (error) throw error;
      imported += rows.length;
    }

    console.log(`start=${start} resultados=${results.length} novos=${rows.length} total_steam=${total ?? "?"}`);

    // A Steam às vezes retorna 10 mesmo pedindo 100. Por isso anda pelo total REAL retornado.
    start += results.length || 10;
    if (total !== null && start >= total) break;
    if (start >= MAX) break;
    await sleep(DELAY_MS);
  }

  console.log(`Finalizado. Importados/atualizados: ${imported}. Total estimado Steam: ${total ?? "desconhecido"}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
