import Link from "next/link";
import { ItemImage } from "@/components/ItemImage";
import type { TbhMarketItem } from "@/lib/types";
import { clean, dateBR, itemTitle, moneyBRL, prettyCode } from "@/lib/format";

export function MarketItemCard({ item, rank }: { item: TbhMarketItem; rank?: number }) {
  const title = itemTitle(item);
  const grade = clean(item.grade, "unknown").toLowerCase();
  const hasPrice = item.lowest_price_brl !== null && item.lowest_price_brl !== undefined;

  return (
    <article className="market-card card small-card">
      <div className="market-rank">#{rank ?? "--"}</div>
      <div className="item-card-top">
        <ItemImage iconPath={item.icon_path} alt={title} itemKey={item.item_key} />
        <div className="item-card-main">
          <div className="row-between">
            <h3><Link href={`/items/${encodeURIComponent(item.item_key)}`}>{title}</Link></h3>
            <span className={`grade grade-${grade}`}>{clean(item.grade, "?")}</span>
          </div>
          <p>{clean(item.name_en_us, item.market_hash_name ?? "Sem nome EN-US")}</p>
          <div className="market-price-row">
            <div className="price-box main-price">
              <strong>{hasPrice ? moneyBRL(item.lowest_price_brl) : "Sem preço"}</strong>
              <span>menor preço</span>
            </div>
            <div className="price-box">
              <strong>{item.median_price_brl ? moneyBRL(item.median_price_brl) : clean(item.median_price_text, "—")}</strong>
              <span>mediana</span>
            </div>
            <div className="price-box">
              <strong>{clean(item.volume, "—")}</strong>
              <span>volume</span>
            </div>
          </div>
          <div className="score-meter" title={`Pontuação ${item.market_score ?? 0}`}>
            <span style={{ width: `${Math.min(100, Number(item.market_score ?? 0))}%` }} />
          </div>
          <div className="pill-row">
            <span className="pill">ID: {item.item_key}</span>
            <span className="pill">Hash: {clean(item.market_hash_name)}</span>
            <span className="pill">Pontuação: {clean(item.market_score)}</span>
            <span className="pill">Custo-benefício: {clean(item.cost_benefit_score)}</span>
            <span className="pill">Drops: {clean(item.drop_count)}</span>
            <span className="pill">Atualizado: {dateBR(item.last_success_at)}</span>
            <span className="pill">Tipo: {prettyCode(item.item_type)}</span>
          </div>
          {!hasPrice && item.last_error ? <p className="market-error">Erro/cache vazio: {item.last_error}</p> : null}
        </div>
      </div>
    </article>
  );
}
