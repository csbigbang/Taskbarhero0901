import Link from "next/link";
import { DropCard } from "@/components/DropCard";
import { EmptyState } from "@/components/EmptyState";
import { SearchForm } from "@/components/SearchForm";
import { getDrops } from "@/lib/data";
import { RARITIES } from "@/lib/rarity";
import styles from "./drops.module.css";

const sources = ["", "NORMAL_MONSTER_BOX", "BOSS_MONSTER_BOX", "FIRST_CLEAR", "BOSS_DROP", "MONSTER_DROP"];

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

const rarityIcons: Record<string, string> = {
  COMMON: "/game/ui/rarity-common.png",
  UNCOMMON: "/game/ui/rarity-uncommon.png",
  RARE: "/game/ui/rarity-rare.png",
  LEGENDARY: "/game/ui/rarity-legendary.png",
  IMMORTAL: "/game/ui/rarity-immortal.png",
  ARCANA: "/game/ui/rarity-arcana.png",
  BEYOND: "/game/ui/rarity-beyond.png",
  CELESTIAL: "/game/ui/rarity-celestial.png",
  DIVINE: "/game/ui/rarity-divine.png",
  COSMIC: "/game/ui/rarity-cosmic.png",
};

type Props = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function buildHref(q: string, grade: string, source: string) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (grade) params.set("grade", grade);
  if (source) params.set("source", source);
  const query = params.toString();
  return query ? `/drops?${query}` : "/drops";
}

export const dynamic = "force-dynamic";

export default async function DropsPage({ searchParams }: Props) {
  const sp = (await searchParams) ?? {};
  const q = first(sp.q) ?? "";
  const grade = first(sp.grade) ?? "";
  const source = first(sp.source) ?? "";
  const drops = await getDrops({ q, grade, source, limit: 350 });
  const activeGrade = grade.toUpperCase();
  const activeSource = source.toUpperCase();

  return (
    <main className={styles.dropsPage}>
      <section className={styles.hero}>
        <div className={styles.heroText}>
          <span className={styles.eyebrow}>TBH Database · Drops</span>
          <h1>Drops</h1>
          <p>
            Localizador de farm com assets reais do jogo. Encontre item, fase, fonte de saque e chance sem poluir a tela com IDs técnicos.
          </p>
        </div>

        <div className={styles.heroStats}>
          <div><strong>{drops.length}</strong><span>resultado(s)</span></div>
          <div><strong>350</strong><span>limite visual</span></div>
        </div>
      </section>

      <section className={styles.filtersPanel}>
        <div className={styles.rarityGrid} aria-label="Filtro rápido de raridade">
          <Link className={!activeGrade ? `${styles.rarityChip} ${styles.active}` : styles.rarityChip} href={buildHref(q, "", source)}>
            <span className={styles.rarityIcon}><img src="/game/ui/rarity-all.png" alt="" /></span>
            <span>Todas</span>
          </Link>

          {RARITIES.map((rarity) => {
            const active = activeGrade === rarity.key;
            return (
              <Link
                key={rarity.key}
                className={active ? `${styles.rarityChip} ${styles.active}` : styles.rarityChip}
                href={buildHref(q, rarity.key, source)}
              >
                <span className={styles.rarityIcon}><img src={rarityIcons[rarity.key]} alt="" /></span>
                <span>{rarity.pt}</span>
              </Link>
            );
          })}
        </div>

        <div className={styles.sourceGrid} aria-label="Filtro rápido de fonte">
          <Link className={!activeSource ? `${styles.sourceChip} ${styles.activeSource}` : styles.sourceChip} href={buildHref(q, grade, "")}>
            <span className={styles.sourceIcon}><img src="/game/ui/chest-normal.png" alt="" /></span>
            <span>Todas fontes</span>
          </Link>

          {sources.filter(Boolean).map((item) => (
            <Link
              key={item}
              className={activeSource === item ? `${styles.sourceChip} ${styles.activeSource}` : styles.sourceChip}
              href={buildHref(q, grade, item)}
            >
              <span className={styles.sourceIcon}><img src={sourceIcons[item]} alt="" /></span>
              <span>{sourceLabels[item] ?? item}</span>
            </Link>
          ))}
        </div>

        <SearchForm
          placeholder="Ex: Espada Longa, Pasto, Baú de Chefe, Divino..."
          defaultValue={q}
          resetHref="/drops"
          extra={
            <>
              <select name="grade" defaultValue={grade}>
                <option value="">Todas as raridades</option>
                {RARITIES.map((g) => <option key={g.key} value={g.key}>{g.pt}</option>)}
              </select>

              <select name="source" defaultValue={source}>
                {sources.map((s) => <option key={s} value={s}>{s ? sourceLabels[s] ?? s : "Todas fontes"}</option>)}
              </select>
            </>
          }
        />

        <p className={styles.resultLine}>
          {drops.length} resultado(s). Mostrando fonte, fase e chance de forma limpa para montar rota de farm.
        </p>
      </section>

      <section className={styles.gridSection}>
        {drops.length ? (
          <div className={styles.dropGrid}>
            {drops.map((drop) => <DropCard key={drop.id} drop={drop} />)}
          </div>
        ) : (
          <EmptyState title="Nenhum drop encontrado" text="Tente buscar pelo nome do item, fase, raridade ou fonte." />
        )}
      </section>
    </main>
  );
}
