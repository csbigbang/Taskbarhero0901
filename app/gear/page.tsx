import GearWikiClient, { type GearWikiItem, type GearWikiPrice } from "@/components/GearWikiClient";
import { supabase } from "@/lib/supabase";

export const revalidate = 900;

async function fetchAllGear(): Promise<GearWikiItem[]> {
  const db = supabase();
  const pageSize = 1000;
  const rows: GearWikiItem[] = [];

  for (let from = 0; from < 7000; from += pageSize) {
    const to = from + pageSize - 1;
    const { data, error } = await db
      .from("tbh_items_full")
      .select("item_key,item_type,grade,parts,gear_type,gear_group,item_synthesis_type,level,is_steam_item,is_can_exchange_marketable,icon_path,name_pt_br,name_en_us,description_pt_br,description_en_us")
      .eq("item_type", "GEAR")
      .order("item_key", { ascending: true })
      .range(from, to);

    if (error) throw error;
    const batch = (data ?? []) as GearWikiItem[];
    rows.push(...batch);
    if (batch.length < pageSize) break;
  }

  return rows;
}

async function fetchPrices(): Promise<Record<string, GearWikiPrice>> {
  const db = supabase();
  const map: Record<string, GearWikiPrice> = {};

  // Preferência: view consolidada do mercado, quando existir.
  const view = await db
    .from("tbh_market_items_view")
    .select("item_key,market_hash_name,lowest_price_brl,median_price_brl,volume,updated_at")
    .limit(5000);

  if (!view.error) {
    for (const row of view.data ?? []) {
      const key = String((row as any).item_key ?? "");
      if (!key) continue;
      map[key] = row as GearWikiPrice;
    }
    return map;
  }

  // Fallback: tabela de preços direta.
  const direct = await db
    .from("tbh_market_prices")
    .select("item_key,market_hash_name,lowest_price_brl,median_price_brl,volume,updated_at,success")
    .eq("success", true)
    .limit(5000);

  if (!direct.error) {
    for (const row of direct.data ?? []) {
      const key = String((row as any).item_key ?? "");
      if (!key) continue;
      map[key] = row as GearWikiPrice;
    }
  }

  return map;
}

type Props = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function GearPage({ searchParams }: Props) {
  const sp = (await searchParams) ?? {};
  const initialGrade = first(sp.grade) ?? "ALL";
  const initialSlot = first(sp.slot) ?? "ALL";
  const initialQ = first(sp.q) ?? "";

  const [items, prices] = await Promise.all([
    fetchAllGear(),
    fetchPrices().catch(() => ({})),
  ]);

  return <GearWikiClient items={items} prices={prices} initialGrade={initialGrade} initialSlot={initialSlot} initialQ={initialQ} />;
}
