import Link from "next/link";
import { MarketItemCard } from "@/components/MarketItemCard";
import { getMarketItems } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function RankingPage() {
  const [valuable, benefit, opportunity] = await Promise.all([
    getMarketItems({ mode: "valuable", limit: 8 }),
    getMarketItems({ mode: "benefit", limit: 8 }),
    getMarketItems({ mode: "opportunity", limit: 8 })
  ]);

  return (
    <main className="page-frame">
      <div className="page-banner">Ranking BR</div>
      <div className="page-body">
        <section className="panel">
          <span className="eyebrow">Decisão rápida</span>
          <h1>Rankings inteligentes</h1>
          <p>Três rankings para o jogador decidir: item mais caro, melhor custo-benefício e oportunidade de farm/compra.</p>
          <div className="hero-actions compact-actions">
            <Link className="btn primary" href="/market">Mercado completo</Link>
            <Link className="btn" href="/farm">Farm por valor</Link>
          </div>
        </section>

        <section className="ranking-columns">
          <div className="ranking-column">
            <h2>Mais valiosos</h2>
            <div className="list">{valuable.map((item, i) => <MarketItemCard key={item.item_key} item={item} rank={i + 1} />)}</div>
          </div>
          <div className="ranking-column">
            <h2>Custo-benefício</h2>
            <div className="list">{benefit.map((item, i) => <MarketItemCard key={item.item_key} item={item} rank={i + 1} />)}</div>
          </div>
          <div className="ranking-column">
            <h2>Oportunidades</h2>
            <div className="list">{opportunity.map((item, i) => <MarketItemCard key={item.item_key} item={item} rank={i + 1} />)}</div>
          </div>
        </section>
      </div>
    </main>
  );
}
