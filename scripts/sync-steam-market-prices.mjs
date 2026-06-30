import { requireSupabase } from "./steam-utils.mjs";

const db = requireSupabase();

async function main() {
  console.log("Sincronizando preços descobertos para tbh_market_prices...");

  const { data: links, error: e1 } = await db
    .from("tbh_market_item_map")
    .select("item_key,market_hash_name,enabled")
    .eq("enabled", true)
    .limit(10000);
  if (e1) throw e1;

  const { data: marketItems, error: e2 } = await db
    .from("tbh_steam_market_items")
    .select("market_hash_name,sell_price_text,sale_price_text,lowest_price_brl,sell_listings,currency")
    .limit(10000);
  if (e2) throw e2;

  const byHash = new Map((marketItems || []).map((m) => [m.market_hash_name, m]));
  const now = new Date().toISOString();
  const rows = [];
  const history = [];

  for (const link of links || []) {
    const sm = byHash.get(link.market_hash_name);
    if (!sm) continue;
    const priceText = sm.sell_price_text || sm.sale_price_text || null;
    const success = sm.lowest_price_brl !== null && sm.lowest_price_brl !== undefined;
    rows.push({
      item_key: link.item_key,
      market_hash_name: link.market_hash_name,
      appid: Number(process.env.STEAM_APP_ID || "3678970"),
      currency: sm.currency || Number(process.env.STEAM_MARKET_CURRENCY || "7"),
      success,
      lowest_price_text: priceText,
      median_price_text: null,
      volume: sm.sell_listings ? String(sm.sell_listings) : null,
      lowest_price_brl: sm.lowest_price_brl,
      median_price_brl: null,
      last_error: success ? null : "sem preço no resultado de busca Steam",
      last_success_at: success ? now : null,
      updated_at: now
    });
    history.push({
      item_key: link.item_key,
      market_hash_name: link.market_hash_name,
      currency: sm.currency || Number(process.env.STEAM_MARKET_CURRENCY || "7"),
      lowest_price_text: priceText,
      median_price_text: null,
      volume: sm.sell_listings ? String(sm.sell_listings) : null,
      lowest_price_brl: sm.lowest_price_brl,
      median_price_brl: null,
      success,
      error: success ? null : "sem preço no resultado de busca Steam",
      created_at: now
    });
  }

  if (rows.length) {
    const { error } = await db.from("tbh_market_prices").upsert(rows, { onConflict: "item_key" });
    if (error) throw error;
  }

  if (history.length) {
    const { error } = await db.from("tbh_market_price_history").insert(history);
    if (error) console.warn("Histórico não gravado:", error.message);
  }

  console.log(`Links ativos: ${(links || []).length}`);
  console.log(`Preços sincronizados: ${rows.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
