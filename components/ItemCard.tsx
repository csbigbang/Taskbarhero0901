import Link from "next/link";
import { ItemImage } from "@/components/ItemImage";
import type { TbhItem } from "@/lib/types";
import { clean, inferIconPath, itemTitle, prettyCode } from "@/lib/format";
import { rarityClass } from "@/lib/rarity";

export function ItemCard({ item }: { item: TbhItem }) {
  const title = itemTitle(item);
  const grade = rarityClass(item.grade);

  return (
    <article className={`small-card item-card rarity-${grade}`}>
      <Link className="card-hit" href={`/items/${encodeURIComponent(item.item_key)}`} aria-label={`Abrir ${title}`} />
      <div className="item-card-top">
        <ItemImage iconPath={inferIconPath(item.icon_path, item.item_key)} alt={title} itemKey={item.item_key} />
        <div className="item-card-main">
          <div className="row-between">
            <h3>{title}</h3>
            <span className={`grade grade-${grade}`}>{clean(item.grade, "?")}</span>
          </div>
          <p>{clean(item.name_en_us, "Sem nome EN-US")}</p>
          <div className="pill-row">
            <span className="pill">ID: {item.item_key}</span>
            <span className="pill">Tipo: {prettyCode(item.item_type)}</span>
            <span className="pill">Equipamento: {prettyCode(item.gear_type)}</span>
            <span className="pill">Parte: {prettyCode(item.parts)}</span>
            <span className="pill">Nível: {clean(item.level)}</span>
          </div>
        </div>
      </div>
    </article>
  );
}
