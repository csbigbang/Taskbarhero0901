import { ItemCompareTool } from "@/components/ItemCompareTool";

export const dynamic = "force-dynamic";

export default function ComparePage() {
  return (
    <main className="page-frame">
      <div className="page-banner">Comparador BR</div>
      <div className="page-body">
        <section className="panel">
          <span className="eyebrow">Bloco 7</span>
          <h1>Comparador de itens</h1>
          <p>
            Compare dois itens lado a lado usando raridade, tipo, nível, preço em R$, drops, pontuação de mercado,
            custo-benefício e potencial de farm. Feito para decidir o que equipar, vender ou guardar.
          </p>
          <ItemCompareTool />
        </section>
      </div>
    </main>
  );
}
