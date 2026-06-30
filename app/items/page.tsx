import { EmptyState } from "@/components/EmptyState";
import { ItemCard } from "@/components/ItemCard";
import { RarityStrip } from "@/components/RarityStrip";
import { SearchForm } from "@/components/SearchForm";
import { getItems } from "@/lib/data";
import { RARITIES } from "@/lib/rarity";

const types = ["", "GEAR", "MATERIAL", "STAGEBOX", "RUNE", "CURRENCY", "PET", "PCSKIN"];

type Props = { searchParams?: Promise<Record<string, string | string[] | undefined>> };
function first(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }
export const dynamic = "force-dynamic";

export default async function ItemsPage({ searchParams }: Props) {
  const sp = (await searchParams) ?? {};
  const q = first(sp.q) ?? "";
  const grade = first(sp.grade) ?? "";
  const type = first(sp.type) ?? "";
  const items = await getItems({ q, grade, type, limit: 240 });

  return (
    <main className="page-frame">
      <div className="page-banner">Itens</div>
      <div className="page-body">
        <section className="panel">
          <span className="eyebrow">Catálogo</span>
          <h1>Itens</h1>
          <p>Busque por nome em PT-BR, inglês, ID, tipo, parte ou gear type. Cada raridade tem cor própria.</p>
          <RarityStrip mode="items" active={grade.toUpperCase()} />
          <SearchForm placeholder="Ex: Espada Longa, Cósmico, Arco, 300001..." defaultValue={q} resetHref="/items" extra={
            <>
              <select name="grade" defaultValue={grade}>
                <option value="">Todas raridades</option>
                {RARITIES.map((g) => <option key={g.key} value={g.key}>{g.pt} / {g.key}</option>)}
              </select>
              <select name="type" defaultValue={type}>
                {types.map((t) => <option key={t} value={t}>{t || "Todos tipos"}</option>)}
              </select>
            </>
          } />
          <p className="result-line">{items.length} resultado(s). Limite visual: 240 por busca.</p>
        </section>

        <section className="section">
          {items.length ? (
            <div className="grid item-grid">
              {items.map((item) => <ItemCard key={item.item_key} item={item} />)}
            </div>
          ) : (
            <EmptyState title="Nada encontrado" text="Tente limpar os filtros ou pesquisar por outro nome/ID." />
          )}
        </section>
      </div>
    </main>
  );
}
