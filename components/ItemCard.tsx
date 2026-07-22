import Link from "next/link";
import { ItemImage } from "@/components/ItemImage";
import type { TbhItem } from "@/lib/types";
import { clean, inferIconPath, itemTitle, prettyCode } from "@/lib/format";
import { rarityClass } from "@/lib/rarity";

export function ItemCard({ item }: { item: TbhItem }) {
  const title = itemTitle(item);
  const grade = rarityClass(item.grade);
  const itemHref = `/items/${encodeURIComponent(item.item_key)}`;
  const dropHref = `/drops?q=${encodeURIComponent(title)}`;

  return (
    <article className={`small-card item-card rarity-${grade}`}>
      <div className="item-card-top">
        <Link href={itemHref} aria-label={`Abrir ${title}`}>
          <ItemImage iconPath={inferIconPath(item.icon_path, item.item_key)} alt={title} itemKey={item.item_key} />
        </Link>

        <div className="item-card-main">
          <div className="row-between">
            <h3><Link href={itemHref}>{title}</Link></h3>
            <span className={`grade grade-${grade}`}>{clean(item.grade, "?")}</span>
          </div>

          <p>{clean(item.name_en_us, "Nome em inglês não cadastrado")}</p>

          <div className="pill-row">
            <span className="pill">Tipo: {prettyCode(item.item_type)}</span>
            <span className="pill">Categoria: {prettyCode(item.gear_type)}</span>
            <span className="pill">Parte: {prettyCode(item.parts)}</span>
            <span className="pill">Nível: {clean(item.level)}</span>
          </div>

          <div className="item-card-actions">
            <Link href={itemHref}>Detalhes</Link>
            <Link href={dropHref}>Drops</Link>
          </div>
        </div>
      </div>
    </article>
  );
}
