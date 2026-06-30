import Link from "next/link";
import { EmptyState } from "@/components/EmptyState";
import { MarketItemCard } from "@/components/MarketItemCard";
import { MarketNotice } from "@/components/MarketNotice";
import { SearchForm } from "@/components/SearchForm";
import { getMarketItems, getMarketStats } from "@/lib/data";
import { compactNumber } from "@/lib/format";
import { RARITIES } from "@/lib/rarity";

export const dynamic = "force-dynamic";
type Props = { searchParams?: Promise<Record<string, string | string[] | undefined>> };
function first(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }

const modes = [
  { value: "valuable", label: "Mais valiosos" },
  { value: "benefit", label: "Custo-benefício" },
  { value: "opportunity", label: "Oportunidades" },
  { value: "recent", label: "Atualizados" },
  { value: "missing", label: "Sem preço" }
];

export default async function MarketPage({ searchParams }: Props) {
  const sp = (await searchParams) ?? {};
  const q = first(sp.q) ?? "";
  const grade = first(sp.grade) ?? "";
  const mode = (first(sp.mode) ?? "valuable") as "valuable" | "benefit" | "opportunity" | "recent" | "missing";

  const [stats, items] = await Promise.all([
    getMarketStats(),
    getMarketItems({ q, grade, mode, limit: 120 })
  ]);

  return (
    <main className="page-frame">
      <div className="page-banner">Mercado BR</div>
      <div className="page-body">
        <section className="panel">
          <span className="eyebrow">Bloco 3</span>
          <h1>Mercado & valor dos itens</h1>
          <p>
            Ranking de itens por preço cacheado, raridade, procura, drops e custo-benefício para ajudar jogadores BR a decidir o que farmar, vender ou guardar.
          </p>
          <div className="market-stat-grid">
            <div className="stat"><strong>{compactNumber(stats.mapped)}</strong><span>itens mapeados</span></div>
            <div className="stat"><strong>{compactNumber(stats.priced)}</strong><span>com preço</span></div>
            <div className="stat"><strong>{compactNumber(stats.missing)}</strong><span>sem preço</span></div>
            <div className="stat"><strong>{compactNumber(stats.updated)}</strong><span>atualizados</span></div>
          </div>
          <MarketNotice />
          <SearchForm placeholder="Ex: Cósmico, Espada, Rubi, 110001, nome do mercado..." defaultValue={q} resetHref="/market" extra={
            <>
              <select name="mode" defaultValue={mode}>
                {modes.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
              <select name="grade" defaultValue={grade}>
                <option value="">Todas raridades</option>
                {RARITIES.map((g) => <option key={g.key} value={g.key}>{g.pt} / {g.key}</option>)}
              </select>
            </>
          } />
          <div className="hero-actions compact-actions">
            <Link className="btn" href="/ranking">Abrir rankings</Link>
            <Link className="btn" href="/farm">Farm por valor</Link>
            <Link className="btn ghost" href="/assets/map">Checar assets</Link>
          </div>
        </section>

        <section className="section">
          {items.length ? (
            <div className="list market-list">
              {items.map((item, index) => <MarketItemCard key={item.item_key} item={item} rank={index + 1} />)}
            </div>
          ) : (
            <EmptyState title="Nada encontrado" text="Execute o SQL do Bloco 3 e rode o script de atualização de preços, ou limpe os filtros." />
          )}
        </section>
      </div>
    </main>
  );
}
