import type { Metadata } from "next";
import { BuildPlanner } from "@/components/BuildPlanner";
import { getBuildPlannerData } from "@/lib/build-planner";
import styles from "./builds-page.module.css";

export const metadata: Metadata = {
  title: "Planejador de Builds BR",
  description: "Monte builds de TBH: Task Bar Hero com itens, raridade, preço de mercado e objetivo de gameplay."
};

export const dynamic = "force-dynamic";

export default async function BuildsPage() {
  const data = await getBuildPlannerData();

  return (
    <main className="page-frame">
      <div className="page-banner">Planejador de Builds BR</div>

      <div className={`page-body ${styles.pageBody}`}>
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <span className={styles.eyebrow}>Ferramenta BR</span>
            <h1>Builds inteligentes</h1>
            <p>
              Escolha classe, objetivo, perfil de investimento, raridade mínima e orçamento.
              O planner sugere combinações usando dados do banco, raridade e preço cacheado do mercado.
            </p>
          </div>
        </section>

        <section className={styles.plannerWrap}>
          <BuildPlanner items={data.items} stats={data.stats} />
        </section>
      </div>
    </main>
  );
}
