import { supabase } from "./supabase";
import type { TbhDrop, TbhItem, TbhStage } from "./types";

function safeQuery(value?: string | null) {
  if (!value) return "";
  return value.trim().replace(/[%(),]/g, "").slice(0, 100);
}

export async function getStats() {
  const db = supabase();
  const [items, stages, drops] = await Promise.all([
    db.from("tbh_items_full").select("item_key", { count: "exact", head: true }),
    db.from("tbh_stages_full").select("stage_key", { count: "exact", head: true }),
    db.from("tbh_stage_drop_items").select("id", { count: "exact", head: true })
  ]);

  return {
    items: items.count ?? 0,
    stages: stages.count ?? 0,
    drops: drops.count ?? 0
  };
}

export async function getItems(options?: { q?: string; grade?: string; type?: string; limit?: number }) {
  const q = safeQuery(options?.q);
  const grade = safeQuery(options?.grade).toUpperCase();
  const type = safeQuery(options?.type).toUpperCase();

  let req = supabase()
    .from("tbh_items_full")
    .select("item_key,item_type,grade,parts,gear_type,level,is_steam_item,icon_path,name_pt_br,name_en_us")
    .order("item_key", { ascending: true })
    .limit(options?.limit ?? 200);

  if (q) {
    req = req.or(`name_pt_br.ilike.%${q}%,name_en_us.ilike.%${q}%,item_key.ilike.%${q}%,gear_type.ilike.%${q}%,parts.ilike.%${q}%`);
  }

  if (grade) req = req.eq("grade", grade);
  if (type) req = req.eq("item_type", type);

  const { data, error } = await req;
  if (error) throw error;
  return (data ?? []) as TbhItem[];
}

export async function getItem(itemKey: string) {
  const { data, error } = await supabase()
    .from("tbh_items_full")
    .select("*")
    .eq("item_key", itemKey)
    .maybeSingle();

  if (error) throw error;
  return data as TbhItem | null;
}

export async function getItemDrops(itemKey: string) {
  const { data, error } = await supabase()
    .from("tbh_stage_drop_items")
    .select("*")
    .eq("resolved_item_key", itemKey)
    .order("stage_key", { ascending: true })
    .limit(500);

  if (error) throw error;
  return (data ?? []) as TbhDrop[];
}

export async function getStages(options?: { q?: string }) {
  const q = safeQuery(options?.q);
  let req = supabase()
    .from("tbh_stages_full")
    .select("*")
    .order("stage_key", { ascending: true })
    .limit(200);

  if (q) {
    req = req.or(`name_pt_br.ilike.%${q}%,name_en_us.ilike.%${q}%,stage_key.ilike.%${q}%,act.ilike.%${q}%,stage_no.ilike.%${q}%`);
  }

  const { data, error } = await req;
  if (error) throw error;
  return (data ?? []) as TbhStage[];
}

export async function getStage(stageKey: string) {
  const { data, error } = await supabase()
    .from("tbh_stages_full")
    .select("*")
    .eq("stage_key", stageKey)
    .maybeSingle();

  if (error) throw error;
  return data as TbhStage | null;
}

export async function getStageDrops(stageKey: string) {
  const { data, error } = await supabase()
    .from("tbh_stage_drop_items")
    .select("*")
    .eq("stage_key", stageKey)
    .order("source_type", { ascending: true })
    .order("item_name_pt_br", { ascending: true })
    .limit(1000);

  if (error) throw error;
  return (data ?? []) as TbhDrop[];
}

export async function getDrops(options?: { q?: string; grade?: string; source?: string; limit?: number }) {
  const q = safeQuery(options?.q);
  const grade = safeQuery(options?.grade).toUpperCase();
  const source = safeQuery(options?.source).toUpperCase();

  let req = supabase()
    .from("tbh_stage_drop_items")
    .select("*")
    .order("stage_key", { ascending: true })
    .limit(options?.limit ?? 300);

  if (q) {
    req = req.or(`item_name_pt_br.ilike.%${q}%,item_name_en_us.ilike.%${q}%,stage_name_pt_br.ilike.%${q}%,stage_name_en_us.ilike.%${q}%,resolved_item_key.ilike.%${q}%,source_item_name_pt_br.ilike.%${q}%`);
  }

  if (grade) req = req.eq("grade", grade);
  if (source) req = req.eq("source_type", source);

  const { data, error } = await req;
  if (error) throw error;
  return (data ?? []) as TbhDrop[];
}

export async function getGradeCounts() {
  const { data, error } = await supabase()
    .from("tbh_items_full")
    .select("grade,item_key")
    .not("grade", "is", null)
    .limit(10000);

  if (error) throw error;
  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const grade = String(row.grade ?? "").toUpperCase();
    if (!grade) continue;
    counts.set(grade, (counts.get(grade) ?? 0) + 1);
  }
  return counts;
}

export async function getMarketItems(options?: {
  q?: string;
  grade?: string;
  mode?: "valuable" | "benefit" | "opportunity" | "recent" | "missing";
  limit?: number;
}) {
  const q = safeQuery(options?.q);
  const grade = safeQuery(options?.grade).toUpperCase();
  const mode = options?.mode ?? "valuable";

  let req = supabase()
    .from("tbh_market_items_view")
    .select("*")
    .limit(options?.limit ?? 100);

  if (q) {
    req = req.or(`name_pt_br.ilike.%${q}%,name_en_us.ilike.%${q}%,item_key.ilike.%${q}%,market_hash_name.ilike.%${q}%,gear_type.ilike.%${q}%,parts.ilike.%${q}%`);
  }

  if (grade) req = req.eq("grade", grade);

  if (mode === "valuable") req = req.order("lowest_price_brl", { ascending: false, nullsFirst: false }).order("market_score", { ascending: false });
  if (mode === "benefit") req = req.order("cost_benefit_score", { ascending: false, nullsFirst: false });
  if (mode === "opportunity") req = req.order("opportunity_score", { ascending: false, nullsFirst: false });
  if (mode === "recent") req = req.order("price_updated_at", { ascending: false, nullsFirst: false });
  if (mode === "missing") req = req.is("lowest_price_brl", null).order("rarity_score", { ascending: false });

  const { data, error } = await req;
  if (error) throw error;
  return (data ?? []) as import("./types").TbhMarketItem[];
}

export async function getMarketStats() {
  const db = supabase();
  const [mapped, priced, recent, missing] = await Promise.all([
    db.from("tbh_market_item_map").select("item_key", { count: "exact", head: true }).eq("enabled", true),
    db.from("tbh_market_prices").select("item_key", { count: "exact", head: true }).not("lowest_price_brl", "is", null),
    db.from("tbh_market_prices").select("item_key", { count: "exact", head: true }).not("last_success_at", "is", null),
    db.from("tbh_market_items_view").select("item_key", { count: "exact", head: true }).is("lowest_price_brl", null)
  ]);

  return {
    mapped: mapped.count ?? 0,
    priced: priced.count ?? 0,
    updated: recent.count ?? 0,
    missing: missing.count ?? 0
  };
}

export async function getFarmMarketStages(options?: { q?: string; source?: string; limit?: number }) {
  const q = safeQuery(options?.q);
  const source = safeQuery(options?.source).toUpperCase();

  let req = supabase()
    .from("tbh_farm_market_view")
    .select("*")
    .order("estimated_value_brl", { ascending: false, nullsFirst: false })
    .order("best_market_score", { ascending: false, nullsFirst: false })
    .limit(options?.limit ?? 120);

  if (q) {
    req = req.or(`stage_name_pt_br.ilike.%${q}%,stage_name_en_us.ilike.%${q}%,stage_key.ilike.%${q}%,best_item_name_pt_br.ilike.%${q}%`);
  }

  if (source) req = req.eq("source_type", source);

  const { data, error } = await req;
  if (error) throw error;
  return (data ?? []) as import("./types").TbhFarmMarketStage[];
}
