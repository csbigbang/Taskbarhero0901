import Link from "next/link";
import { ItemImage } from "@/components/ItemImage";
import type { TbhDrop } from "@/lib/types";
import { clean, inferIconPath, percent, prettyCode } from "@/lib/format";
import { rarityClass } from "@/lib/rarity";

export function DropCard({ drop }: { drop: TbhDrop }) {
  const itemName = clean(drop.item_name_pt_br || drop.item_name_en_us || drop.resolved_item_key, "Item sem nome");
  const stageName = clean(drop.stage_name_pt_br || drop.stage_name_en_us || drop.stage_key, "Fase sem nome");
  const itemHref = drop.resolved_item_key ? `/items/${encodeURIComponent(drop.resolved_item_key)}` : "/items";
  const stageHref = drop.stage_key ? `/stages/${encodeURIComponent(drop.stage_key)}` : "/stages";
  const grade = rarityClass(drop.grade);

  return (
    <article className={`small-card drop-card rarity-${grade}`}>
      <div className="item-card-top">
        <Link href={itemHref} aria-label={`Abrir ${itemName}`}>
          <ItemImage iconPath={inferIconPath(null, drop.resolved_item_key)} alt={itemName} itemKey={drop.resolved_item_key || ""} size="sm" />
        </Link>

        <div className="item-card-main">
          <div className="row-between">
            <h3><Link href={itemHref}>{itemName}</Link></h3>
            <span className={`grade grade-${grade}`}>{clean(drop.grade, "?")}</span>
          </div>

          <p>
            Drop em <Link className="text-link" href={stageHref}>{stageName}</Link>
            {drop.act && drop.stage_no ? ` · Ato ${drop.act}-${drop.stage_no}` : ""}
          </p>

          <div className="pill-row">
            <span className="pill">Fonte: {prettyCode(drop.source_type)}</span>
            <span className="pill">Baú/Fonte: {clean(drop.source_item_name_pt_br || drop.source_item_key)}</span>
            <span className="pill">Peso: {clean(drop.weight)}</span>
            <span className="pill">DropKey: {percent(drop.weight_percent_within_dropkey)}</span>
            <span className="pill">Tipo: {prettyCode(drop.item_type)}</span>
            <span className="pill">Parte: {prettyCode(drop.parts)}</span>
          </div>
        </div>
      </div>
    </article>
  );
}
