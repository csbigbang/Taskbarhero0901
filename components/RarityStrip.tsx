import Link from "next/link";
import { RARITIES } from "@/lib/rarity";

type Props = {
  mode?: "items" | "drops";
  active?: string;
};

function iconFor(key: string) {
  return `/images/rarities/${key.toLowerCase()}.png`;
}

export function RarityStrip({ mode = "items", active = "" }: Props) {
  return (
    <div className="rarity-strip pixel-rarity-strip" aria-label="Filtro rápido por raridade">
      <Link className={!active ? "rarity-chip pixel-rarity-chip active" : "rarity-chip pixel-rarity-chip"} href={`/${mode}`}>
        <span className="pixel-rarity-icon pixel-rarity-all" aria-hidden="true" />
        <span>Todas</span>
      </Link>

      {RARITIES.map((rarity) => {
        const key = rarity.key.toLowerCase();
        return (
          <Link
            key={rarity.key}
            href={`/${mode}?grade=${rarity.key}`}
            className={`rarity-chip pixel-rarity-chip grade-border-${key} rarity-${key} ${active === rarity.key ? "active" : ""}`}
          >
            <img
              src={iconFor(rarity.key)}
              alt=""
              className="pixel-rarity-icon"
              loading="lazy"
              decoding="async"
              width={24}
              height={24}
            />
            <span>{rarity.pt}</span>
          </Link>
        );
      })}
    </div>
  );
}
