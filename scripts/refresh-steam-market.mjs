#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return;
  const text = fs.readFileSync(file, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx < 0) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    value = value.replace(/^['"]|['"]$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(path.resolve(process.cwd(), ".env.local"));
loadEnvFile(path.resolve(process.cwd(), ".env"));

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const APPID = Number(process.env.STEAM_APP_ID || "3678970");
const CURRENCY = Number(process.env.STEAM_MARKET_CURRENCY || "7");
const LIMIT = Number(process.env.STEAM_MARKET_LIMIT || "25");
const DELAY_MS = Number(process.env.STEAM_MARKET_DELAY_MS || "3500");

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Faltou NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY no .env.local");
  console.error("A service_role é só para script/servidor. Nunca coloque ela em variável NEXT_PUBLIC.");
  process.exit(1);
}

const db = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  realtime: {
    transport: WebSocket,
  },
});

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseBRL(text) {
  if (!text) return null;
  const cleaned = String(text)
    .replace(/[^0-9,.-]/g, "")
    .replace(/\.(?=\d{3}(\D|$))/g, "")
    .replace(",", ".");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

async function fetchPrice(marketHashName) {
  const url = new URL("https://steamcommunity.com/market/priceoverview/");
  url.searchParams.set("appid", String(APPID));
  url.searchParams.set("currency", String(CURRENCY));
  url.searchParams.set("market_hash_name", marketHashName);

  const res = await fetch(url, {
    headers: {
      "user-agent": "TBH-Database-BR/1.0 fan-site price cache"
    }
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  const json = await res.json();
  return json;
}

async function getCandidates() {
  let { data, error } = await db
    .from("tbh_market_item_map")
    .select("item_key,market_hash_name,enabled")
    .eq("enabled", true)
    .limit(LIMIT);

  if (error) throw error;
  if (data?.length) return data;

  console.log("Nenhum item em tbh_market_item_map. Tentando criar seed a partir de tbh_items_full...");
  const items = await db
    .from("tbh_items_full")
    .select("item_key,name_en_us,name_pt_br,is_steam_item,is_can_exchange_marketable")
    .limit(1000);
  if (items.error) throw items.error;

  const rows = (items.data ?? [])
    .filter((item) => /true|1|yes/i.test(String(item.is_steam_item ?? "")) || /true|1|yes/i.test(String(item.is_can_exchange_marketable ?? "")))
    .map((item) => ({
      item_key: item.item_key,
      market_hash_name: item.name_en_us || item.name_pt_br || item.item_key,
      enabled: true
    }))
    .slice(0, LIMIT);

  if (rows.length) {
    const up = await db.from("tbh_market_item_map").upsert(rows, { onConflict: "item_key" });
    if (up.error) throw up.error;
  }

  return rows;
}

async function main() {
  console.log(`Atualizando preços: appid=${APPID}, currency=${CURRENCY}, limit=${LIMIT}, delay=${DELAY_MS}ms`);
  const candidates = await getCandidates();
  console.log(`Candidatos: ${candidates.length}`);

  let ok = 0;
  let fail = 0;

  for (const [index, item] of candidates.entries()) {
    const hash = item.market_hash_name;
    console.log(`[${index + 1}/${candidates.length}] ${item.item_key} => ${hash}`);

    let payload;
    try {
      const price = await fetchPrice(hash);
      const success = Boolean(price.success && (price.lowest_price || price.median_price));
      payload = {
        item_key: item.item_key,
        market_hash_name: hash,
        appid: APPID,
        currency: CURRENCY,
        success,
        lowest_price_text: price.lowest_price ?? null,
        median_price_text: price.median_price ?? null,
        volume: price.volume ?? null,
        lowest_price_brl: parseBRL(price.lowest_price),
        median_price_brl: parseBRL(price.median_price),
        last_error: success ? null : JSON.stringify(price).slice(0, 500),
        last_success_at: success ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      };
      success ? ok++ : fail++;
    } catch (err) {
      payload = {
        item_key: item.item_key,
        market_hash_name: hash,
        appid: APPID,
        currency: CURRENCY,
        success: false,
        last_error: String(err?.message ?? err).slice(0, 500),
        updated_at: new Date().toISOString()
      };
      fail++;
    }

    const up = await db.from("tbh_market_prices").upsert(payload, { onConflict: "item_key" });
    if (up.error) {
      console.error("Erro upsert price:", up.error.message);
    }

    const hist = await db.from("tbh_market_price_history").insert({
      item_key: payload.item_key,
      market_hash_name: payload.market_hash_name,
      currency: payload.currency,
      lowest_price_text: payload.lowest_price_text ?? null,
      median_price_text: payload.median_price_text ?? null,
      volume: payload.volume ?? null,
      lowest_price_brl: payload.lowest_price_brl ?? null,
      median_price_brl: payload.median_price_brl ?? null,
      success: payload.success,
      error: payload.last_error ?? null
    });
    if (hist.error) console.error("Erro history:", hist.error.message);

    if (index < candidates.length - 1) await sleep(DELAY_MS);
  }

  console.log(`Finalizado. OK=${ok} Falhas/Sem preço=${fail}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
