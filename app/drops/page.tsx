import { DropCard } from "@/components/DropCard";
import { EmptyState } from "@/components/EmptyState";
import { RarityStrip } from "@/components/RarityStrip";
import { SearchForm } from "@/components/SearchForm";
import { getDrops } from "@/lib/data";
import { RARITIES } from "@/lib/rarity";

const sources = ["", "NORMAL_MONSTER_BOX", "BOSS_MONSTER_BOX", "FIRST_CLEAR", "BOSS_DROP", "MONSTER_DROP"];

type Props = { searchParams?: Promise<Record<string, string | string[] | undefined>> };
function first(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }
export const dynamic = "force-dynamic";

export default async function DropsPage({ searchParams }: Props) {
  const sp = (await searchParams) ?? {};
  const q = first(sp.q) ?? "";
  const grade = first(sp.grade) ?? "";
  const source = first(sp.source) ?? "";
  const drops = await getDrops({ q, grade, source, limit: 350 });

  return (
    <main className="page-frame">
      <div className="page-banner">Localizador de Farm</div>
      <div className="page-body">
        <section className="panel">
          <span className="eyebrow">Loot table</span>
          <h1>Drops</h1>
          <p>Pesquise por item, fase, baú/fonte, ID do item ou nome em inglês.</p>
          <RarityStrip mode="drops" active={grade.toUpperCase()} />
          <SearchForm placeholder="Ex: Espada Longa, Pasto, Divino, Baú de Monstro Normal..." defaultValue={q} resetHref="/drops" extra={
            <>
              <select name="grade" defaultValue={grade}>
                <option value="">Todas raridades</option>
                {RARITIES.map((g) => <option key={g.key} value={g.key}>{g.pt} / {g.key}</option>)}
              </select>
              <select name="source" defaultValue={source}>
                {sources.map((s) => <option key={s} value={s}>{s || "Todas fontes"}</option>)}
              </select>
            </>
          } />
          <p className="result-line">{drops.length} resultado(s). Limite visual: 350 por busca.</p>
        </section>

        <section className="section">
          {drops.length ? (
            <div className="list">
              {drops.map((drop) => <DropCard key={drop.id} drop={drop} />)}
            </div>
          ) : (
            <EmptyState title="Nenhum drop encontrado" text="Tente buscar pelo nome em inglês/PT-BR, fase ou ID do item." />
          )}
        </section>
      </div>
    </main>
  );
}
