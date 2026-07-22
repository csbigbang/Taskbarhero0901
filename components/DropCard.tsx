import Link from "next/link";
import { ItemImage } from "@/components/ItemImage";
import type { TbhDrop } from "@/lib/types";
import { clean, inferIconPath, percent, prettyCode } from "@/lib/format";
import { rarityClass } from "@/lib/rarity";

const sourceLabels: Record<string, string> = {
  NORMAL_MONSTER_BOX: "Baú de Monstro",
  BOSS_MONSTER_BOX: "Baú de Chefe",
  FIRST_CLEAR: "Primeira conclusão",
  BOSS_DROP: "Drop de Chefe",
  MONSTER_DROP: "Drop de Monstro",
};

const sourceIcons: Record<string, string> = {
  NORMAL_MONSTER_BOX: "/game/ui/chest-normal.png",
  BOSS_MONSTER_BOX: "/game/ui/chest-boss.png",
  FIRST_CLEAR: "/game/ui/chest-first.png",
  BOSS_DROP: "/game/ui/chest-boss.png",
  MONSTER_DROP: "/game/ui/chest-normal.png",
};

function sourceLabel(value?: string | null) {
  const key = String(value ?? "").toUpperCase();
  return sourceLabels[key] ?? prettyCode(value);
}

function sourceIcon(value?: string | null) {
  const key = String(value ?? "").toUpperCase();
  return sourceIcons[key] ?? "/game/ui/chest-normal.png";
}

export function DropCard({ drop }: { drop: TbhDrop }) {
  const itemName = clean(drop.item_name_pt_br || drop.item_name_en_us || drop.resolved_item_key, "Item sem nome");
  const stageName = clean(drop.stage_name_pt_br || drop.stage_name_en_us || drop.stage_key, "Fase sem nome");
  const itemHref = drop.resolved_item_key ? `/items/${encodeURIComponent(drop.resolved_item_key)}` : "/items";
  const stageHref = drop.stage_key ? `/stages/${encodeURIComponent(drop.stage_key)}` : "/stages";
  const farmHref = `/farm?q=${encodeURIComponent(stageName)}`;
  const grade = rarityClass(drop.grade);
  const source = sourceLabel(drop.source_type);
  const chance = percent(drop.weight_percent_within_dropkey);
  const stageInfo = drop.act && drop.stage_no ? `Ato ${drop.act}-${drop.stage_no}` : clean(drop.stage_key, "");

  return (
    <article className={`drop-card drop-card-pro rarity-${grade}`}>
      <div className="drop-source-icon" aria-hidden="true">
        <img src={sourceIcon(drop.source_type)} alt="" loading="lazy" decoding="async" />
      </div>

      <Link href={itemHref} className="drop-item-icon" aria-label={`Abrir ${itemName}`}>
        <ItemImage iconPath={inferIconPath(null, drop.resolved_item_key)} alt={itemName} itemKey={drop.resolved_item_key || ""} size="sm" />
      </Link>

      <div className="drop-card-main">
        <div className="drop-card-head">
          <div>
            <span className="drop-source-label">{source}</span>
            <h3><Link href={itemHref}>{itemName}</Link></h3>
          </div>
          <span className={`grade grade-${grade}`}>{clean(drop.grade, "?")}</span>
        </div>

        <p>
          Drop em <Link className="text-link" href={stageHref}>{stageName}</Link>
          {stageInfo ? ` · ${stageInfo}` : ""}
        </p>

        <div className="pill-row">
          <span className="pill">Chance: {chance}</span>
          <span className="pill">Fonte: {source}</span>
          {drop.level ? <span className="pill">Nível: {clean(drop.level)}</span> : null}
          {drop.item_type ? <span className="pill">Tipo: {prettyCode(drop.item_type)}</span> : null}
          {drop.parts ? <span className="pill">Parte: {prettyCode(drop.parts)}</span> : null}
        </div>

        <div className="drop-card-actions">
          <Link href={itemHref}>Abrir item</Link>
          <Link href={stageHref}>Abrir fase</Link>
          <Link href={farmHref}>Farm</Link>
        </div>
      </div>
    </article>
  );
}
