import Link from "next/link";
import { getGradeCounts } from "@/lib/data";
import { compactNumber } from "@/lib/format";
import { RARITIES } from "@/lib/rarity";

export const dynamic = "force-dynamic";

export default async function GradesPage() {
  const counts = await getGradeCounts();

  return (
    <main className="page-frame">
      <div className="page-banner">Raridades</div>
      <div className="page-body">
        <section className="panel">
          <span className="eyebrow">Escala de poder</span>
          <h1>Raridades</h1>
          <p>Cada raridade tem sua cor própria aplicada nos cards, etiquetas e filtros do site inteiro.</p>
        </section>

        <section className="section">
          <div className="grid rarity-grid">
            {RARITIES.map((rarity) => (
              <article className={`small-card rarity-card rarity-${rarity.key.toLowerCase()}`} key={rarity.key}>
                <div className="row-between">
                  <div>
                    <span className="eyebrow">{rarity.key}</span>
                    <h3>{rarity.pt}</h3>
                  </div>
                  <span className={`grade grade-${rarity.key.toLowerCase()}`}>{rarity.key}</span>
                </div>
                <p>{rarity.desc}</p>
                <div className="pill-row">
                  <span className="pill">Itens: {compactNumber(counts.get(rarity.key) ?? 0)}</span>
                  <Link className="pill pill-link" href={`/items?grade=${rarity.key}`}>Ver itens</Link>
                  <Link className="pill pill-link" href={`/drops?grade=${rarity.key}`}>Ver drops</Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
