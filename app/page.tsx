import Link from "next/link";
import type { CSSProperties } from "react";
import { getStats } from "@/lib/data";
import styles from "./home.module.css";

export const revalidate = 3600;

type StatKey = "items" | "drops" | "stages";

type HomeStats = {
  items: number;
  drops: number;
  stages: number;
};

const animatedHeroes = [
  {
    key: "knight",
    name: "Cavaleiro",
    role: "Defesa",
    sprite: "/game-assets/heroes/animated/knight-idle-strip.png",
    frames: 9,
  },
  {
    key: "ranger",
    name: "Ranger",
    role: "Dano à distância",
    sprite: "/game-assets/heroes/animated/ranger-idle-strip.png",
    frames: 9,
  },
  {
    key: "sorcerer",
    name: "Mago",
    role: "Dano elemental",
    sprite: "/game-assets/heroes/animated/sorcerer-idle-strip.png",
    frames: 9,
  },
  {
    key: "priest",
    name: "Sacerdote",
    role: "Suporte",
    sprite: "/game-assets/heroes/animated/priest-idle-strip.png",
    frames: 9,
  },
  {
    key: "hunter",
    name: "Caçador",
    role: "Controle",
    sprite: "/game-assets/heroes/animated/hunter-idle-strip.png",
    frames: 9,
  },
  {
    key: "slayer",
    name: "Slayer",
    role: "Dano físico",
    sprite: "/game-assets/heroes/animated/slayer-idle-strip.png",
    frames: 12,
  },
] as const;

const primaryEntries = [
  {
    title: "Itens",
    description: "Equipamentos, materiais, níveis e raridades.",
    href: "/items",
    icon: "/game-assets/items/Icon_Gear_Active.png",
    stat: "items" as StatKey,
  },
  {
    title: "Drops",
    description: "Descubra onde cada item pode ser obtido.",
    href: "/drops",
    icon: "/game-assets/stages/MenuButton_Chest_Active.png",
    stat: "drops" as StatKey,
  },
  {
    title: "Fases",
    description: "Atos, dificuldades, chefes e recompensas.",
    href: "/stages",
    icon: "/game-assets/stages/MenuButton_Portal_Active.png",
    stat: "stages" as StatKey,
  },
  {
    title: "Mercado BR",
    description: "Preços, histórico e oportunidades em reais.",
    href: "/market",
    icon: "/game-assets/ui/Icon_Gold.png",
  },
  {
    title: "Heróis",
    description: "Classes, atributos e informações dos personagens.",
    href: "/heroes",
    icon: "/game-assets/heroes/Hero_101.png",
  },
  {
    title: "Cube",
    description: "Custos, probabilidades e simulação de melhorias.",
    href: "/cube",
    icon: "/game-assets/stages/MenuButton_Cube_Active.png",
  },
] as const;

const acts = [
  {
    name: "Ato 1",
    description: "Primeiras rotas, inimigos e recompensas do jogo.",
    image: "/game-assets/stages/Act1_Bg.png",
    href: "/stages?act=1",
  },
  {
    name: "Ato 2",
    description: "Novas regiões, chefes e progressão intermediária.",
    image: "/game-assets/stages/Act2_Bg.png",
    href: "/stages?act=2",
  },
  {
    name: "Ato 3",
    description: "Conteúdo avançado, desafios e recompensas finais.",
    image: "/game-assets/stages/Act3_Bg.png",
    href: "/stages?act=3",
  },
] as const;

const latestUpdates = [
  {
    version: "1.01.01",
    title: "Hotfix de ressurreicao e party",
    date: "22 jul. 2026",
    tone: "hotfix",
    highlights: [
      "Corrigido problema em que membros da party nao reviviam apos morrer.",
      "Corrigido membro morto sendo removido da party ao reiniciar a fase.",
      "Corrigida a skill Resurrection do Priest quando um aliado morria.",
    ],
  },
  {
    version: "1.01.00",
    title: "Mercado de alto grau e balanceamento",
    date: "21 jul. 2026",
    tone: "major",
    highlights: [
      "Materiais e equipamentos Celestial, Divine e Cosmic voltaram a ser negociados no Mercado Steam.",
      "Knight, Priest, Hunter e Slayer receberam ajustes de passivas, velocidade e requisitos de ataques basicos.",
      "Armaduras, reducao fisica, monstros ranged e opcoes de resistencia foram rebalanceados.",
    ],
  },
] as const;

function formatNumber(value: number) {
  return value > 0 ? value.toLocaleString("pt-BR") : "—";
}

function statValue(stats: HomeStats, key?: StatKey) {
  return key ? formatNumber(stats[key]) : null;
}

export default async function HomePage() {
  const stats = await getStats().catch<HomeStats>(() => ({ items: 0, drops: 0, stages: 0 }));

  return (
    <main className={styles.homeShell}>
      <section className={styles.heroStage} aria-labelledby="home-title">
        <div className={styles.heroFrame} aria-hidden="true" />
        <div className={styles.heroAtmosphere} aria-hidden="true" />

        <div className={styles.heroContent}>
          <span className={styles.fanBadge}>Fan site brasileiro não oficial</span>
          <img
            className={styles.gameLogo}
            src="/game-assets/branding/LogoTextImage_TBH.png"
            alt="Task Bar Hero"
          />
          <h1 id="home-title" className={styles.siteTitle}>Database BR</h1>
          <p className={styles.heroDescription}>
            Consulte itens, drops, fases, monstros, heróis, raridades e preços do mercado usando informações e imagens reais de Task Bar Hero.
          </p>

          <form className={styles.searchForm} action="/items" method="get">
            <label className={styles.srOnly} htmlFor="home-search">Pesquisar no banco de dados</label>
            <input
              id="home-search"
              className={styles.searchInput}
              name="q"
              placeholder="Digite o nome ou o ID de um item..."
              autoComplete="off"
            />
            <button className={styles.searchButton} type="submit">Pesquisar</button>
          </form>

          <div className={styles.heroActions}>
            <Link className={styles.primaryButton} href="/drops">Localizar drops</Link>
            <Link className={styles.secondaryButton} href="/items">Abrir catálogo</Link>
            <Link className={styles.secondaryButton} href="/market">Consultar mercado</Link>
          </div>
        </div>

        <div className={styles.heroParty} aria-label="Heróis de Task Bar Hero">
          <div className={styles.partyLogo}>
            <img src="/game-assets/branding/textImage_GameTitle.png" alt="Task Bar Hero" />
          </div>
          <div className={styles.partyHeading}>
            <span>Heróis do jogo</span>
            <strong>Passe o mouse para animar</strong>
          </div>
          <div className={styles.partyScene}>
            {animatedHeroes.map((hero) => (
              <Link
                className={styles.heroCharacter}
                data-frames={hero.frames}
                href={`/heroes/${hero.key}`}
                key={hero.key}
                aria-label={`Conhecer ${hero.name}, função ${hero.role}`}
                style={
                  {
                    "--hero-sheet": `url(${hero.sprite})`,
                    "--hero-sheet-size": `${hero.frames * 100}% 100%`,
                  } as CSSProperties
                }
              >
                <span className={styles.heroSprite} aria-hidden="true" />
                <span className={styles.heroIdentity}>
                  <strong>{hero.name}</strong>
                  <small>{hero.role}</small>
                </span>
              </Link>
            ))}
          </div>
          <div className={styles.partyGrass} aria-hidden="true" />
        </div>
      </section>

      <section className={styles.updateSection} aria-labelledby="updates-title">
        <div className={styles.sectionHeading}>
          <span>Ultimas atualizacoes</span>
          <h2 id="updates-title">Patch 1.01.01 ja refletido no Database BR</h2>
          <p>Resumo em PT-BR das mudancas oficiais recentes de Task Bar Hero, com foco no que afeta build, party e mercado.</p>
        </div>

        <div className={styles.updateGrid}>
          {latestUpdates.map((update) => (
            <article className={`${styles.updateCard} ${styles[`update_${update.tone}`]}`} key={update.version}>
              <div className={styles.updateHead}>
                <span>Ver {update.version}</span>
                <em>{update.date}</em>
              </div>
              <h3>{update.title}</h3>
              <ul>
                {update.highlights.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </article>
          ))}
        </div>

        <div className={styles.updateActions}>
          <Link href="/market">Abrir mercado atualizado</Link>
          <a href="https://steamcommunity.com/app/3678970/allnews/" target="_blank" rel="noreferrer">
            Ver noticias oficiais
          </a>
        </div>
      </section>

      <section className={styles.quickSection} aria-labelledby="quick-title">
        <div className={styles.sectionHeading}>
          <span>Acesso rápido</span>
          <h2 id="quick-title">Consulte o banco de dados</h2>
          <p>Todos os ícones e elementos visuais abaixo foram extraídos dos arquivos reais do jogo.</p>
        </div>

        <div className={styles.entryGrid}>
          {primaryEntries.map((entry) => {
            const value = statValue(stats, "stat" in entry ? entry.stat : undefined);
            return (
              <Link className={styles.entryCard} href={entry.href} key={entry.title}>
                <span className={styles.entryIcon}>
                  <img src={entry.icon} alt="" aria-hidden="true" />
                </span>
                <span className={styles.entryCopy}>
                  <strong>{entry.title}</strong>
                  <small>{entry.description}</small>
                </span>
                {value && <em>{value}</em>}
              </Link>
            );
          })}
        </div>
      </section>

      <section className={styles.actsSection} aria-labelledby="acts-title">
        <div className={styles.sectionHeading}>
          <span>Mapas do jogo</span>
          <h2 id="acts-title">Explore os atos</h2>
          <p>Mapas originais de progressão, sem ilustrações genéricas ou imagens substitutas.</p>
        </div>

        <div className={styles.actsGrid}>
          {acts.map((act) => (
            <Link className={styles.actCard} href={act.href} key={act.name}>
              <div className={styles.actMap}>
                <img src={act.image} alt={`Mapa do ${act.name}`} />
              </div>
              <div className={styles.actCopy}>
                <strong>{act.name}</strong>
                <p>{act.description}</p>
                <span>Ver fases</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.toolsPanel} aria-labelledby="tools-title">
        <div className={styles.toolsArt} aria-hidden="true">
          <img src="/game-assets/stages/MenuButton_Stat_Active.png" alt="" />
          <img src="/game-assets/stages/MenuButton_Temple_Active.png" alt="" />
          <img src="/game-assets/items/ItemSlot_GradeBg_DIVINE.png" alt="" />
        </div>
        <div className={styles.toolsCopy}>
          <span>Ferramentas do jogador</span>
          <h2 id="tools-title">Planeje a evolução do seu personagem</h2>
          <p>Compare equipamentos, analise sua build, estime o valor do farm e acompanhe a progressão.</p>
        </div>
        <div className={styles.toolsActions}>
          <Link href="/doctor">Analisar build</Link>
          <Link href="/compare">Comparar itens</Link>
          <Link href="/farm/optimizer">Calcular farm</Link>
        </div>
      </section>
    </main>
  );
}
