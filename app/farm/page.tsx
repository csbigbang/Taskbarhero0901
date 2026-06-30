import Link from "next/link";
import styles from "./farm-light.module.css";

export const dynamic = "force-static";

const tools = [
  {
    title: "Otimizador de Farm Pro",
    text: "Busca o melhor lugar para farmar por item, raridade, fonte, preço e valor estimado.",
    href: "/farm/optimizer",
    tag: "Principal",
  },
  {
    title: "Radar do Dia",
    text: "Veja oportunidades do dia: itens para vender, comprar barato e melhores rotas por cache atual.",
    href: "/radar",
    tag: "Oportunidades",
  },
  {
    title: "Drops",
    text: "Consulte drops por fase, item, baú, fonte e stage.",
    href: "/drops",
    tag: "Banco de Dados",
  },
  {
    title: "Fases",
    text: "Abra o mapa de stages, escolha act/dificuldade e veja monstros, boss e loot.",
    href: "/stages",
    tag: "Mapa",
  },
];

export default function FarmPage() {
  return (
    <main className="page-frame">
      <div className="page-banner">Farm</div>
      <div className="page-body">
        <section className={`panel ${styles.heroPanel}`}>
          <span className="eyebrow">Central de farm BR</span>
          <h1>Escolha como quer analisar seu farm</h1>
          <p>
            Esta página foi otimizada para abrir rápido. A consulta antiga de valor por fase era pesada e podia causar timeout no Supabase.
            Use o Otimizador de Farm Pro para análise completa.
          </p>

          <div className={styles.heroActions}>
            <Link className="btn primary" href="/farm/optimizer">Abrir Otimizador de Farm</Link>
            <Link className="btn ghost" href="/drops">Ver drops</Link>
            <Link className="btn ghost" href="/stages">Ver stages</Link>
          </div>
        </section>

        <section className={styles.toolGrid}>
          {tools.map((tool) => (
            <Link key={tool.href} className={`small-card ${styles.toolCard}`} href={tool.href}>
              <span className={styles.toolTag}>{tool.tag}</span>
              <h2>{tool.title}</h2>
              <p>{tool.text}</p>
              <strong>Abrir →</strong>
            </Link>
          ))}
        </section>

        <section className={`panel ${styles.notePanel}`}>
          <span className="eyebrow">Performance</span>
          <h2>Por que mudou?</h2>
          <p>
            O cálculo completo de farm combina stages, drops, itens e preços. Quando tudo é calculado direto na abertura da página,
            o Supabase pode cancelar a consulta por tempo. Agora o caminho pesado fica dentro do otimizador, com filtros e limite de dados.
          </p>
        </section>
      </div>
    </main>
  );
}
