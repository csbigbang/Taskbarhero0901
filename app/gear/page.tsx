import GearWikiClient, { type GearWikiItem, type GearWikiPrice } from "@/components/GearWikiClient";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const GEAR_SELECT =
  "item_key,item_type,grade,parts,gear_type,gear_group,item_synthesis_type,level,is_steam_item,is_can_exchange_marketable,icon_path,name_pt_br,name_en_us";

function getDb() {
  try {
    return supabase();
  } catch (error) {
    console.error("[gear] Supabase não configurado:", error);
    return null;
  }
}

async function fetchAllGear(): Promise<GearWikiItem[]> {
  const db = getDb();
  if (!db) return [];

  const pageSize = 500;
  const maxRows = 2500;
  const rows: GearWikiItem[] = [];

  for (let from = 0; from < maxRows; from += pageSize) {
    const to = from + pageSize - 1;

    const { data, error } = await db
      .from("tbh_items_full")
      .select(GEAR_SELECT)
      .eq("item_type", "GEAR")
      .order("item_key", { ascending: true })
      .range(from, to);

    if (error) {
      console.error("[gear] Falha ao carregar equipamentos:", error.message);

      // Fallback ainda mais simples para evitar 500 na rota.
      if (!rows.length) {
        const fallback = await db
          .from("tbh_items_full")
          .select(GEAR_SELECT)
          .eq("item_type", "GEAR")
          .limit(300);

        if (!fallback.error) return (fallback.data ?? []) as GearWikiItem[];

        console.error("[gear] Fallback também falhou:", fallback.error.message);
      }

      break;
    }

    const batch = (data ?? []) as GearWikiItem[];
    rows.push(...batch);

    if (batch.length < pageSize) break;
  }

  return rows;
}

async function fetchPrices(): Promise<Record<string, GearWikiPrice>> {
  const db = getDb();
  const map: Record<string, GearWikiPrice> = {};
  if (!db) return map;

  // Fonte definitiva de preço atual: tbh_market_prices.
  // A view tbh_market_items_view não possui updated_at no banco atual, então ela fica apenas como fallback.
  const direct = await db
    .from("tbh_market_prices")
    .select("item_key,market_hash_name,lowest_price_brl,median_price_brl,volume,last_success_at,success")
    .eq("success", true)
    .not("lowest_price_brl", "is", null)
    .limit(2500);

  if (!direct.error) {
    for (const row of direct.data ?? []) {
      const data = row as GearWikiPrice & { last_success_at?: string | null };
      const key = String(data.item_key ?? "");
      if (!key) continue;
      map[key] = {
        ...data,
        updated_at: data.updated_at ?? data.last_success_at ?? null,
      };
    }
    return map;
  }

  console.warn("[gear] Tabela de preços indisponível:", direct.error.message);

  // Fallback seguro: usa a view sem solicitar updated_at, pois essa coluna não existe nela.
  const view = await db
    .from("tbh_market_items_view")
    .select("item_key,market_hash_name,lowest_price_brl,median_price_brl,volume")
    .not("lowest_price_brl", "is", null)
    .limit(2500);

  if (!view.error) {
    for (const row of view.data ?? []) {
      const key = String((row as any).item_key ?? "");
      if (!key) continue;
      map[key] = row as GearWikiPrice;
    }
  } else {
    console.warn("[gear] View de mercado indisponível:", view.error.message);
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
    fetchAllGear().catch((error) => {
      console.error("[gear] Erro final carregando equipamentos:", error);
      return [] as GearWikiItem[];
    }),
    fetchPrices().catch((error) => {
      console.error("[gear] Erro final carregando preços:", error);
      return {} as Record<string, GearWikiPrice>;
    }),
  ]);

  return <GearWikiClient items={items} prices={prices} initialGrade={initialGrade} initialSlot={initialSlot} initialQ={initialQ} />;
}
