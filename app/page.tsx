import Link from "next/link";
import { getStats } from "@/lib/data";
import { HomeFeatureIcon } from "@/components/HomeFeatureIcon";
import styles from "./home.module.css";

export const revalidate = 3600;

const featureCards = [
  {
    title: "Itens",
    text: "Consulte equipamentos, materiais, raridades e IDs do banco.",
    href: "/items",
    icon: "/images/rarities/divine.png",
  },
  {
    title: "Localizador de Drops",
    text: "Encontre onde cada item cai e qual fonte gera a recompensa.",
    href: "/drops",
    icon: "/images/rarities/beyond.png",
  },
  {
    title: "Mercado BR",
    text: "Preços em R$, cache local e itens com maior liquidez.",
    href: "/market",
    icon: "/images/rarities/legendary.png",
  },
  {
    title: "Valor de Farm",
    text: "Ranking de fases com maior valor estimado por drop.",
    href: "/farm/optimizer",
    icon: "/images/rarities/cosmic.png",
  },
  {
    title: "Radar do Dia",
    text: "Oportunidades para vender, comprar, farmar e usar no Cube.",
    href: "/radar",
    icon: "/images/rarities/immortal.png",
  },
  {
    title: "Analisador de Builds",
    text: "Analise personagem, slots fracos e próximos upgrades.",
    href: "/doctor",
    icon: "/images/rarities/celestial.png",
  },
  {
    title: "Progressão",
    text: "Rota de evolução por classe, orçamento e objetivo.",
    href: "/progress",
    icon: "/images/rarities/arcana.png",
  },
  {
    title: "Situação do Jogo",
    text: "Atividade do jogo, SteamDB e status do cache do site.",
    href: "/status",
    icon: "/images/rarities/rare.png",
  },
];

const quickCards = [
  {
    title: "Comparador",
    text: "Compare dois itens por score, valor, raridade e utilidade.",
    href: "/compare",
    icon: "/images/rarities/uncommon.png",
  },
  {
    title: "Inventário",
    text: "Calcule valor, itens para guardar, vender ou usar no Cube.",
    href: "/inventory",
    icon: "/images/rarities/common.png",
  },
  {
    title: "Analisador de Salvamento",
    text: "Envie o save e veja personagens, equipamentos e análise da conta.",
    href: "/save",
    icon: "/images/rarities/all.png",
  },
];

function formatNumber(value: number) {
  return value.toLocaleString("pt-BR");
}

export default async function HomePage() {
  const stats = await getStats().catch(() => ({ items: 0, stages: 0, drops: 0 }));

  return (
    <main className={styles.homeShell}>
      <section className={styles.heroPanel}>
        <span className={styles.heroBadge}>Fan site BR</span>
        <h1 className={styles.heroTitle}>
          TASK BAR HERO BR
          <strong>DATABASE</strong>
        </h1>
        <p className={styles.heroText}>
          Central brasileira para consultar itens, drops, fases, raridades, mercado em R$, rotas de farm,
          builds e ferramentas úteis para evoluir melhor no Task Bar Hero.
        </p>

        <form className={styles.searchRow} action="/items" method="get">
          <input
            className={styles.searchInput}
            name="q"
            placeholder="Buscar item, fase, boss, material, raridade ou ID..."
            autoComplete="off"
          />
          <button className={styles.searchButton} type="submit">Buscar</button>
        </form>

        <div className={styles.ctaRow}>
          <Link className={`${styles.ctaButton} ${styles.ctaButtonPrimary}`} href="/drops">Procurar drops</Link>
          <Link className={styles.ctaButton} href="/items">Ver itens</Link>
          <Link className={styles.ctaButton} href="/market">Mercado BR</Link>
          <Link className={styles.ctaButton} href="/farm/optimizer">Valor de Farm</Link>
        </div>

        <div className={styles.metricRow} aria-label="Números do banco">
          <div className={styles.metricBox}><strong>{formatNumber(stats.items)}</strong><span>itens</span></div>
          <div className={styles.metricBox}><strong>{formatNumber(stats.drops)}</strong><span>drops</span></div>
          <div className={styles.metricBox}><strong>{formatNumber(stats.stages)}</strong><span>fases</span></div>
          <div className={styles.metricBox}><strong>BR</strong><span>mercado</span></div>
        </div>
      </section>

      <section className={styles.playerPanel}>
        <div className={styles.sectionTitle}>
          <div>
            <span className={styles.sectionBadge}>Central do jogador</span>
            <h2>Ferramentas principais</h2>
          </div>
        </div>

        <div className={styles.featureGrid}>
          {featureCards.map((card) => (
            <Link key={card.href} className={styles.featureCard} href={card.href}>
              <HomeFeatureIcon src={card.icon} alt="" size="md" />
              <div>
                <h3>{card.title}</h3>
                <p>{card.text}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.quickPanel}>
        <div className={styles.sectionTitle}>
          <div>
            <span className={styles.sectionBadge}>Análise avançada</span>
            <h2>Recursos para impressionar</h2>
          </div>
        </div>

        <div className={styles.quickGrid}>
          {quickCards.map((card) => (
            <Link key={card.href} className={styles.quickCard} href={card.href}>
              <HomeFeatureIcon src={card.icon} alt="" size="lg" />
              <div>
                <h3>{card.title}</h3>
                <p>{card.text}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
