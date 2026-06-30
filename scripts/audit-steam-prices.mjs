#!/usr/bin/env node
import { formatBrl, requireSupabase } from "./steam-utils.mjs";

const db = requireSupabase();
const LIMIT = Number(process.argv[2] || "80");

function ageHours(date) {
  if (!date) return Infinity;
  const t = new Date(date).getTime();
  if (!Number.isFinite(t)) return Infinity;
  return (Date.now() - t) / 36e5;
}

const { data, error } = await db
  .from("tbh_market_prices")
  .select("item_key,market_hash_name,currency,success,lowest_price_text,median_price_text,lowest_price_brl,median_price_brl,volume,updated_at,last_success_at,last_error")
  .order("updated_at", { ascending: false, nullsFirst: false })
  .limit(LIMIT);

if (error) throw error;

console.log(`AUDITORIA STEAM PRICE — ${data?.length || 0} linhas`);
for (const row of data || []) {
  const price = Number(row.lowest_price_brl || 0);
  const age = ageHours(row.last_success_at || row.updated_at);
  const status = !row.success ? "ERRO" : row.currency !== 7 ? "MOEDA" : age > 12 ? "VELHO" : "OK";
  console.log(`${status.padEnd(6)} ${String(row.item_key).padEnd(10)} ${formatBrl(price).padEnd(12)} raw=${row.lowest_price_text || "-"} hash=${row.market_hash_name}`);
  if (row.last_error) console.log(`       erro=${row.last_error}`);
}
