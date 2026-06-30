import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { clean, compactNumber, moneyBRL } from "@/lib/format";

export const dynamic = "force-dynamic";

type Props = { searchParams?: Promise<Record<string, string | string[] | undefined>> };
function first(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }


async function getMapData(q: string, mode: string) {
  const db = supabase();
  const [{ data: summary }, query] = await Promise.all([
    db.from("tbh_steam_market_summary_view").select("*").maybeSingle(),
    Promise.resolve(null)
  ]);

  let req = db
    .from("tbh_steam_market_mapping_view")
    .select("*")
    .order("lowest_price_brl", { ascending: false, nullsFirst: false })
    .order("candidate_score", { ascending: false, nullsFirst: false })
    .limit(200);

  if (q) {
    const safe = q.trim().replace(/[%(),]/g, "").slice(0, 80);
    req = req.or(`market_hash_name.ilike.%${safe}%,steam_name.ilike.%${safe}%,item_name_pt_br.ilike.%${safe}%,item_name_en_us.ilike.%${safe}%,candidate_item_key.ilike.%${safe}%`);
  }

  if (mode === "linked") req = req.eq("linked", true);
  if (mode === "suggested") req = req.eq("linked", false).not("candidate_item_key", "is", null);
  if (mode === "missing") req = req.eq("linked", false).is("candidate_item_key", null);
  if (mode === "priced") req = req.not("lowest_price_brl", "is", null);

  const { data, error } = await req;
  if (error) throw error;
  return { summary: summary as any, rows: (data ?? []) as any[] };
}

export default async function SteamMarketMapPage({ searchParams }: Props) {
  const sp = (await searchParams) ?? {};
  const q = first(sp.q) ?? "";
  const mode = first(sp.mode) ?? "all";
  const { summary, rows } = await getMapData(q, mode);

  return (
    <main className="page-frame">
      <div className="page-banner">Mapa do Mercado Steam</div>
      <div className="page-body">
        <section className="panel">
          <span className="eyebrow">Bloco 4</span>
          <h1>Vincular Mercado Steam com itens do jogo</h1>
          <p>
            Esta tela mostra os itens realmente encontrados no Mercado Steam e os possíveis vínculos com o banco do jogo. Quando o vínculo existe, o preço entra nos rankings e no Valor de Farm.
          </p>

          <div className="market-stat-grid">
            <div className="stat"><strong>{compactNumber(summary?.steam_items ?? 0)}</strong><span>itens da Steam</span></div>
            <div className="stat"><strong>{compactNumber(summary?.candidates ?? 0)}</strong><span>candidatos</span></div>
            <div className="stat"><strong>{compactNumber(summary?.active_links ?? 0)}</strong><span>links ativos</span></div>
            <div className="stat"><strong>{compactNumber(summary?.priced_items ?? 0)}</strong><span>com preço</span></div>
          </div>

          <form className="searchbar" action="/market/map">
            <input name="q" placeholder="Buscar nome da Steam, item local, ID..." defaultValue={q} />
            <select name="mode" defaultValue={mode}>
              <option value="all">Todos</option>
              <option value="priced">Com preço</option>
              <option value="linked">Já vinculados</option>
              <option value="suggested">Com sugestão</option>
              <option value="missing">Sem sugestão</option>
            </select>
            <button className="btn primary" type="submit">Filtrar</button>
            <Link className="btn ghost" href="/market/map">Limpar</Link>
          </form>

        </section>

        <section className="section">
          <div className="list market-list">
            {rows.map((row) => {
              const candidate = row.candidate_item_key ? `${row.candidate_item_key} · ${clean(row.item_name_pt_br || row.item_name_en_us, "sem nome")}` : "Sem candidato local";
              return (
                <article className="card small-card" key={`${row.market_hash_name}-${row.candidate_item_key ?? "none"}`}>
                  <div className="row-between">
                    <div>
                      <h3>{row.steam_name || row.market_hash_name}</h3>
                      <p>{row.market_hash_name}</p>
                    </div>
                    <span className={row.linked ? "grade grade-uncommon" : "grade grade-common"}>{row.linked ? "LINKADO" : "PENDENTE"}</span>
                  </div>

                  <div className="pill-row">
                    <span className="pill">Preço: {row.lowest_price_brl ? moneyBRL(row.lowest_price_brl) : clean(row.sell_price_text || row.sale_price_text, "sem preço")}</span>
                    <span className="pill">Vendas: {clean(row.sell_listings, "-")}</span>
                    <span className="pill">Candidato: {candidate}</span>
                    <span className="pill">Pontuação: {clean(row.candidate_score, "0")}</span>
                    <span className="pill">Motivo: {clean(row.candidate_reason, "-")}</span>
                  </div>

                  <div className="hero-actions compact-actions">
                    {row.candidate_item_key ? <Link className="btn" href={`/items/${encodeURIComponent(row.candidate_item_key)}`}>Abrir item local</Link> : null}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
