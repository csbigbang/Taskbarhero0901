import Link from "next/link";
import { EmptyState } from "@/components/EmptyState";
import { ItemCard } from "@/components/ItemCard";
import { SearchForm } from "@/components/SearchForm";
import { getItems } from "@/lib/data";
import { RARITIES } from "@/lib/rarity";
import styles from "./items.module.css";

const types = ["", "GEAR", "MATERIAL", "STAGEBOX", "RUNE", "CURRENCY", "PET", "PCSKIN"];

type Props = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

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

function buildHref(q: string, grade: string, type: string) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (grade) params.set("grade", grade);
  if (type) params.set("type", type);
  const query = params.toString();
  return query ? `/items?${query}` : "/items";
}

export const dynamic = "force-dynamic";

export default async function ItemsPage({ searchParams }: Props) {
  const sp = (await searchParams) ?? {};
  const q = first(sp.q) ?? "";
  const grade = first(sp.grade) ?? "";
  const type = first(sp.type) ?? "";
  let loadError = false;
  const items = await getItems({ q, grade, type, limit: 240 }).catch((error) => {
    loadError = true;
    console.error("[items] Falha ao carregar itens:", error);
    return [];
  });
  const activeGrade = grade.toUpperCase();

  return (
    <main className={styles.itemsPage}>
      <section className={styles.hero}>
        <div className={styles.heroText}>
          <span className={styles.eyebrow}>TBH Database · Itens</span>
          <h1>Itens</h1>
          <p>
            Catálogo visual com assets reais do jogo. Busque por nome, tipo, parte, raridade ou ID interno.
          </p>
        </div>

        <div className={styles.heroStats}>
          <div><strong>{items.length}</strong><span>resultado(s)</span></div>
          <div><strong>240</strong><span>limite visual</span></div>
        </div>
      </section>

      <section className={styles.filtersPanel}>
        <div className={styles.rarityGrid} aria-label="Filtro rápido de raridade">
          <Link className={!activeGrade ? `${styles.rarityChip} ${styles.active}` : styles.rarityChip} href={buildHref(q, "", type)}>
            <span className={styles.rarityIcon}><img src="/game/ui/rarity-all.png" alt="" /></span>
            <span>Todas</span>
          </Link>

          {RARITIES.map((rarity) => {
            const active = activeGrade === rarity.key;
            return (
              <Link
                key={rarity.key}
                className={active ? `${styles.rarityChip} ${styles.active}` : styles.rarityChip}
                href={buildHref(q, rarity.key, type)}
              >
                <span className={styles.rarityIcon}><img src={rarityIcons[rarity.key]} alt="" /></span>
                <span>{rarity.pt}</span>
              </Link>
            );
          })}
        </div>

        <SearchForm
          placeholder="Ex: Espada Longa, Rubi, Cósmico, Arco..."
          defaultValue={q}
          resetHref="/items"
          extra={
            <>
              <select name="grade" defaultValue={grade}>
                <option value="">Todas as raridades</option>
                {RARITIES.map((g) => <option key={g.key} value={g.key}>{g.pt}</option>)}
              </select>

              <select name="type" defaultValue={type}>
                {types.map((t) => <option key={t} value={t}>{t || "Todos os tipos"}</option>)}
              </select>
            </>
          }
        />

        {loadError ? (
          <p className={styles.loadWarning}>
            O banco de itens está temporariamente indisponível. A página continua funcionando e pode ser recarregada em instantes.
          </p>
        ) : (
          <p className={styles.resultLine}>
            {items.length} resultado(s). Cards exibem só dados úteis; IDs técnicos ficam ocultos na interface.
          </p>
        )}
      </section>

      <section className={styles.gridSection}>
        {items.length ? (
          <div className={styles.itemGrid}>
            {items.map((item) => <ItemCard key={item.item_key} item={item} />)}
          </div>
        ) : (
          <EmptyState title="Nada encontrado" text="Tente limpar os filtros ou pesquisar por outro nome." />
        )}
      </section>
    </main>
  );
}
