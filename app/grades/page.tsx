import Image from "next/image";
import Link from "next/link";
import { getGradeCounts } from "@/lib/data";
import { compactNumber } from "@/lib/format";
import { RARITIES } from "@/lib/rarity";
import styles from "./grades.module.css";

export const dynamic = "force-dynamic";

const gradeAssetMap: Record<string, string> = {
  COMMON: "/images/rarities/common.png",
  UNCOMMON: "/images/rarities/uncommon.png",
  RARE: "/images/rarities/rare.png",
  LEGENDARY: "/images/rarities/legendary.png",
  IMMORTAL: "/images/rarities/immortal.png",
  ARCANA: "/images/rarities/arcana.png",
  BEYOND: "/images/rarities/beyond.png",
  CELESTIAL: "/images/rarities/celestial.png",
  DIVINE: "/images/rarities/divine.png",
  COSMIC: "/images/rarities/cosmic.png",
};

const gradeSlotMap: Record<string, string> = {
  COMMON: "/game-assets/items/ItemSlot_GradeBg_NORMAL.png",
  UNCOMMON: "/game-assets/items/ItemSlot_GradeBg_UNCOMMON.png",
  RARE: "/game-assets/items/ItemSlot_GradeBg_RARE.png",
  LEGENDARY: "/game-assets/items/ItemSlot_GradeBg_LEGENDARY.png",
  IMMORTAL: "/game-assets/items/ItemSlot_GradeBg_IMMORTAL.png",
  ARCANA: "/game-assets/items/ItemSlot_GradeBg_ARCANA.png",
  BEYOND: "/game-assets/items/ItemSlot_GradeBg_BEYOND.png",
  CELESTIAL: "/game-assets/items/ItemSlot_GradeBg_CELESTIAL.png",
  DIVINE: "/game-assets/items/ItemSlot_GradeBg_DIVINE.png",
  COSMIC: "/game-assets/items/ItemSlot_GradeBg_COSMIC.png",
};

export default async function GradesPage() {
  const counts = await getGradeCounts();
  const totalItems = RARITIES.reduce((sum, rarity) => sum + (counts.get(rarity.key) ?? 0), 0);

  return (
    <main className="page-frame">
      <div className="page-banner">Raridades</div>
      <div className="page-body">
        <section className={styles.hero}>
          <div className={styles.heroText}>
            <span className={styles.eyebrow}>Escala de poder</span>
            <h1>Raridades</h1>
            <p>
              Visual pixelado com leitura melhor: cada raridade tem cor, ícone e faixa própria para facilitar a
              navegação no banco inteiro.
            </p>
            <div className={styles.heroStats}>
              <div className={styles.statBox}>
                <strong>{RARITIES.length}</strong>
                <span>raridades</span>
              </div>
              <div className={styles.statBox}>
                <strong>{compactNumber(totalItems)}</strong>
                <span>itens mapeados</span>
              </div>
            </div>
          </div>
          <div className={styles.heroStrip}>
            {RARITIES.map((rarity, index) => (
              <div key={rarity.key} className={styles.stripChip} title={rarity.pt}>
                <span className={styles.stripIndex}>{index + 1}</span>
                <Image src={gradeAssetMap[rarity.key]} alt={rarity.pt} width={30} height={30} unoptimized />
              </div>
            ))}
          </div>
        </section>

        <section className={styles.grid}>
          {RARITIES.map((rarity, index) => {
            const amount = counts.get(rarity.key) ?? 0;
            return (
              <article
                key={rarity.key}
                className={styles.card}
                style={{
                  ["--rarity-color" as string]: rarity.color,
                  ["--rarity-slot" as string]: `url(${gradeSlotMap[rarity.key]})`,
                }}
              >
                <div className={styles.cardGlow} />
                <div className={styles.cardHeader}>
                  <div className={styles.iconWrap}>
                    <div className={styles.slotBg} />
                    <Image src={gradeAssetMap[rarity.key]} alt={rarity.pt} width={54} height={54} unoptimized />
                  </div>

                  <div className={styles.headerText}>
                    <div className={styles.topline}>
                      <span className={styles.tierTag}>Tier {index + 1}</span>
                      <span className={styles.keyTag}>{rarity.key}</span>
                    </div>
                    <h3>{rarity.pt}</h3>
                    <p>{rarity.desc}</p>
                  </div>
                </div>

                <div className={styles.metaRow}>
                  <div className={styles.countBox}>
                    <span>Total</span>
                    <strong>{compactNumber(amount)}</strong>
                  </div>
                  <div className={styles.colorPill}>
                    <span className={styles.colorDot} />
                    <span>cor do filtro</span>
                  </div>
                </div>

                <div className={styles.actions}>
                  <Link className={styles.actionBtn} href={`/items?grade=${rarity.key}`}>
                    Ver itens
                  </Link>
                  <Link className={styles.actionBtnSecondary} href={`/drops?grade=${rarity.key}`}>
                    Ver drops
                  </Link>
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}
