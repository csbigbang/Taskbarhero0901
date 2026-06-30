import Link from "next/link";
import type { TbhFarmMarketStage } from "@/lib/types";
import { clean, moneyBRL, prettyCode } from "@/lib/format";

export function FarmValueCard({ stage, rank }: { stage: TbhFarmMarketStage; rank?: number }) {
  const title = clean(stage.stage_name_pt_br, stage.stage_name_en_us ?? "Fase");
  return (
    <article className="farm-card card small-card">
      <div className="market-rank">#{rank ?? "--"}</div>
      <div className="row-between">
        <div>
          <h3><Link href={`/stages/${encodeURIComponent(clean(stage.stage_key, ""))}`}>{title}</Link></h3>
          <p>Ato {clean(stage.act)}-{clean(stage.stage_no)} · {prettyCode(stage.source_type)}</p>
        </div>
        <span className="value-badge">{moneyBRL(stage.estimated_value_brl)}</span>
      </div>
      <div className="pill-row">
        <span className="pill">Itens no drop: {clean(stage.drop_items_count)}</span>
        <span className="pill">Com preço: {clean(stage.priced_items_count)}</span>
        <span className="pill">Maior preço: {moneyBRL(stage.best_single_price_brl)}</span>
        <span className="pill">Média: {moneyBRL(stage.avg_priced_item_brl)}</span>
        <span className="pill">Melhor item: {clean(stage.best_item_name_pt_br, "—")}</span>
        <span className="pill">Pontuação: {clean(stage.best_market_score)}</span>
      </div>
    </article>
  );
}
