#!/usr/bin/env node
import { APP_ID, CURRENCY, COUNTRY, LANGUAGE, DELAY_MS, detectCurrency, marketListingUrl, parseSteamPrice, requireSupabase, sleep } from "./steam-utils.mjs";

const db = requireSupabase();

function argValue(name, fallback = null) {
  const idx = process.argv.indexOf(name);
  if (idx >= 0 && process.argv[idx + 1]) return process.argv[idx + 1];
  const eq = process.argv.find((x) => x.startsWith(`${name}=`));
  if (eq) return eq.slice(name.length + 1);
  return fallback;
}

const LIMIT = Number(argValue("--limit", process.env.STEAM_MARKET_LIMIT || "200"));
const OFFSET = Number(argValue("--offset", "0"));
const ONLY_HASH = argValue("--hash", null);
const ALL = process.argv.includes("--all");
const STRICT_BRL = !process.argv.includes("--allow-other-currency");
const RAW_MAP = process.argv.includes("--raw-map");
const RUN_LIMIT = ALL ? 10000 : Math.max(1, LIMIT);

async function fetchPriceOverview(marketHashName) {
  const url = new URL("https://steamcommunity.com/market/priceoverview/");
  url.searchParams.set("appid", String(APP_ID));
  url.searchParams.set("currency", String(CURRENCY));
  url.searchParams.set("country", COUNTRY);
  url.searchParams.set("cc", COUNTRY.toLowerCase());
  url.searchParams.set("l", LANGUAGE);
  url.searchParams.set("market_hash_name", marketHashName);

  const res = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0 TBH-Database-BR/1.0 priceoverview linked sync",
      "accept": "application/json,text/plain,*/*",
      "accept-language": "pt-BR,pt;q=0.9,en-US;q=0.7,en;q=0.5"
    }
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 160)}`);

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Steam não retornou JSON: ${text.slice(0, 160)}`);
  }
}

async function getSteamNameSet() {
  const { data, error } = await db
    .from("tbh_steam_market_items")
    .select("market_hash_name")
    .range(0, 4999);
  if (error) throw error;
  return new Set((data || []).map((x) => x.market_hash_name).filter(Boolean));
}

async function getAcceptedCandidates() {
  const { data, error } = await db
    .from("tbh_steam_market_candidates")
    .select("item_key,market_hash_name,score,status,reason")
    .eq("status", "accepted")
    .order("score", { ascending: false })
    .range(0, 4999);
  if (error) throw error;
  return data || [];
}

async function getMapCandidates() {
  const { data, error } = await db
    .from("tbh_market_item_map")
    .select("item_key,market_hash_name,enabled,notes")
    .eq("enabled", true)
    .range(0, 4999);
  if (error) throw error;
  return data || [];
}

function dedupeCandidates(rows) {
  const seenHash = new Set();
  const seenItem = new Set();
  const out = [];

  for (const row of rows || []) {
    const hash = row.market_hash_name;
    const itemKey = row.item_key;
    if (!hash || !itemKey) continue;

    // Evita consultar o mesmo anúncio várias vezes e evita sobrescrever o mesmo item_key em sequência.
    const hKey = String(hash).toLowerCase();
    const iKey = String(itemKey).toLowerCase();
    if (seenHash.has(hKey)) continue;
    if (seenItem.has(iKey)) continue;

    seenHash.add(hKey);
    seenItem.add(iKey);
    out.push({
      item_key: itemKey,
      market_hash_name: hash,
      score: row.score ?? null,
      reason: row.reason || row.notes || null
    });
  }

  return out;
}

async function getCandidates() {
  if (ONLY_HASH) {
    const { data, error } = await db
      .from("tbh_steam_market_candidates")
      .select("item_key,market_hash_name,score,status,reason")
      .eq("market_hash_name", ONLY_HASH)
      .order("score", { ascending: false })
      .limit(1);
    if (error) throw error;
    if (data?.length) return data;
    return [{ item_key: ONLY_HASH, market_hash_name: ONLY_HASH, score: null, reason: "hash manual" }];
  }

  const steamNames = await getSteamNameSet();
  console.log(`Nomes reais Steam carregados: ${steamNames.size}`);

  let sourceRows;

  if (RAW_MAP) {
    sourceRows = await getMapCandidates();
    console.log("Fonte dos candidatos: tbh_market_item_map --raw-map");
  } else {
    const accepted = await getAcceptedCandidates();
    console.log(`Links aceitos pelo market:link: ${accepted.length}`);

    sourceRows = accepted;

    if (!sourceRows.length) {
      console.log("Nenhum candidato accepted encontrado; usando fallback do mapa ativo filtrado pela lista real da Steam.");
      sourceRows = await getMapCandidates();
    } else {
      console.log("Fonte dos candidatos: tbh_steam_market_candidates status=accepted");
    }
  }

  const onlyRealSteamNames = (sourceRows || []).filter((row) => steamNames.has(row.market_hash_name));
  const removed = (sourceRows?.length || 0) - onlyRealSteamNames.length;
  if (removed > 0) {
    console.log(`Ignorados ${removed} vínculos com market_hash_name que NÃO existe na lista real da Steam.`);
    console.log("Exemplo do problema antigo: Normal Monster Box, Stage Boss Box e nomes internos do jogo.");
  }

  const unique = dedupeCandidates(onlyRealSteamNames);
  return unique.slice(OFFSET, OFFSET + RUN_LIMIT);
}

function payloadFromPrice(item, price, now) {
  const lowestText = price?.lowest_price ?? null;
  const medianText = price?.median_price ?? null;
  const volume = price?.volume ?? null;
  const lowestCurrency = detectCurrency(lowestText);
  const medianCurrency = detectCurrency(medianText);
  const lowest = parseSteamPrice(lowestText, CURRENCY);
  const median = parseSteamPrice(medianText, CURRENCY);

  let success = Boolean(price?.success && (lowestText || medianText) && (lowest || median));
  let lastError = null;

  if (!price?.success) {
    lastError = JSON.stringify(price || {}).slice(0, 500) || "Steam retornou success=false";
    success = false;
  }

  if (STRICT_BRL && CURRENCY === 7) {
    const wrongLowest = lowestText && lowestCurrency !== "BRL" && lowestCurrency !== "unknown";
    const wrongMedian = medianText && medianCurrency !== "BRL" && medianCurrency !== "unknown";
    if (wrongLowest || wrongMedian) {
      success = false;
      lastError = `Steam respondeu moeda diferente de BRL. lowest=${lowestText || "-"} median=${medianText || "-"}`;
    }
  }

  return {
    item_key: item.item_key,
    market_hash_name: item.market_hash_name,
    appid: APP_ID,
    currency: CURRENCY,
    success,
    lowest_price_text: lowestText,
    median_price_text: medianText,
    volume,
    lowest_price_brl: success ? lowest : null,
    median_price_brl: success ? median : null,
    last_error: success ? null : lastError,
    last_success_at: success ? now : null,
    updated_at: now
  };
}

async function main() {
  console.log(`Steam Price Sync REAL 14.2: appid=${APP_ID}, currency=${CURRENCY}, country=${COUNTRY}, language=${LANGUAGE}`);
  console.log(`Modo: ${ALL ? "TODOS" : `limit=${LIMIT} offset=${OFFSET}`}${ONLY_HASH ? ` hash=${ONLY_HASH}` : ""}`);
  console.log("Fonte de verdade: SOMENTE market_hash_name real descoberto na Steam + link aceito pelo market:link.");

  const candidates = await getCandidates();
  console.log(`Candidatos finais para preço: ${candidates.length}`);

  if (!candidates.length) {
    console.log("Nenhum candidato real encontrado. Rode primeiro: npm run market:discover e depois npm run market:link");
    return;
  }

  let ok = 0;
  let fail = 0;

  for (const [index, item] of candidates.entries()) {
    const hash = item.market_hash_name;
    if (!hash) continue;
    console.log(`[${index + 1}/${candidates.length}] ${item.item_key} => ${hash}${item.score ? ` score=${item.score}` : ""}`);

    const now = new Date().toISOString();
    let payload;

    try {
      const price = await fetchPriceOverview(hash);
      payload = payloadFromPrice(item, price, now);
      if (payload.success) ok++;
      else fail++;
      console.log(`  Steam: lowest=${payload.lowest_price_text || "-"} median=${payload.median_price_text || "-"} volume=${payload.volume || "-"}`);
      if (payload.last_error) console.log(`  Aviso: ${payload.last_error}`);
    } catch (err) {
      fail++;
      payload = {
        item_key: item.item_key,
        market_hash_name: hash,
        appid: APP_ID,
        currency: CURRENCY,
        success: false,
        lowest_price_text: null,
        median_price_text: null,
        volume: null,
        lowest_price_brl: null,
        median_price_brl: null,
        last_error: String(err?.message ?? err).slice(0, 500),
        updated_at: now
      };
      console.log(`  ERRO: ${payload.last_error}`);
    }

    const up = await db.from("tbh_market_prices").upsert(payload, { onConflict: "item_key" });
    if (up.error) console.error("  Erro upsert:", up.error.message);

    const hist = await db.from("tbh_market_price_history").insert({
      item_key: payload.item_key,
      market_hash_name: payload.market_hash_name,
      currency: payload.currency,
      lowest_price_text: payload.lowest_price_text,
      median_price_text: payload.median_price_text,
      volume: payload.volume,
      lowest_price_brl: payload.lowest_price_brl,
      median_price_brl: payload.median_price_brl,
      success: payload.success,
      error: payload.last_error,
      created_at: now
    });
    if (hist.error) console.error("  Histórico não gravado:", hist.error.message);

    console.log(`  Link: ${marketListingUrl(hash)}`);
    if (index < candidates.length - 1) await sleep(DELAY_MS);
  }

  console.log(`Finalizado. OK=${ok} Falhas=${fail}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
