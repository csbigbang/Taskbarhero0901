import Link from "next/link";
import { RARITIES } from "@/lib/rarity";
import styles from "./RarityStrip.module.css";

type Props = {
  mode?: "items" | "drops";
  active?: string;
};

const RARITY_ICONS: Record<string, string> = {
  COMMON: "/tbh-real/rarities/common.png",
  UNCOMMON: "/tbh-real/rarities/uncommon.png",
  RARE: "/tbh-real/rarities/rare.png",
  LEGENDARY: "/tbh-real/rarities/legendary.png",
  IMMORTAL: "/tbh-real/rarities/immortal.png",
  ARCANA: "/tbh-real/rarities/arcana.png",
  BEYOND: "/tbh-real/rarities/beyond.png",
  CELESTIAL: "/tbh-real/rarities/celestial.png",
  DIVINE: "/tbh-real/rarities/divine.png",
  COSMIC: "/tbh-real/rarities/cosmic.png",
};

function cx(...values: Array<string | false | undefined>) {
  return values.filter(Boolean).join(" ");
}

function iconFor(key: string) {
  return RARITY_ICONS[key.toUpperCase()] || "";
}

export function RarityStrip({ mode = "items", active = "" }: Props) {
  const activeKey = active.toUpperCase();

  return (
    <div className={styles.strip} aria-label="Filtro rápido por raridade">
      <Link
        className={cx(styles.chip, styles.allChip, !activeKey && styles.active)}
        href={`/${mode}`}
      >
        <span className={styles.iconBox}>
          <img src="/tbh-real/ui/rarity-all.png" alt="" loading="lazy" decoding="async" />
        </span>
        <span>Todas</span>
      </Link>

      {RARITIES.map((rarity) => {
        const key = rarity.key.toUpperCase();
        const lower = key.toLowerCase();
        return (
          <Link
            key={rarity.key}
            href={`/${mode}?grade=${rarity.key}`}
            className={cx(styles.chip, styles[lower], activeKey === key && styles.active)}
          >
            <span className={styles.iconBox}>
              <img
                src={iconFor(key)}
                alt=""
                loading="lazy"
                decoding="async"
                width={32}
                height={32}
              />
            </span>
            <span>{rarity.pt}</span>
          </Link>
        );
      })}
    </div>
  );
}
