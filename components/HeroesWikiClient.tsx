"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import type { HeroData, HeroKey } from "@/lib/heroes-data";
import styles from "./HeroesWikiClient.module.css";

type Props = {
  heroes: HeroData[];
  initialHero?: HeroKey | string;
};

type HeroAnimationConfig = {
  sheet: string;
  frames: number;
  steps: number;
  duration: string;
};

const HERO_ANIMATIONS: Record<HeroKey, HeroAnimationConfig> = {
  knight: {
    sheet: "/game-assets/heroes/animated/knight-idle-strip.png",
    frames: 9,
    steps: 8,
    duration: "1.05s",
  },
  ranger: {
    sheet: "/game-assets/heroes/animated/ranger-idle-strip.png",
    frames: 9,
    steps: 8,
    duration: "1.05s",
  },
  sorcerer: {
    sheet: "/game-assets/heroes/animated/sorcerer-idle-strip.png",
    frames: 9,
    steps: 8,
    duration: "1.05s",
  },
  priest: {
    sheet: "/game-assets/heroes/animated/priest-idle-strip.png",
    frames: 9,
    steps: 8,
    duration: "1.05s",
  },
  hunter: {
    sheet: "/game-assets/heroes/animated/hunter-idle-strip.png",
    frames: 9,
    steps: 8,
    duration: "1.05s",
  },
  slayer: {
    sheet: "/game-assets/heroes/animated/slayer-idle-strip.png",
    frames: 12,
    steps: 11,
    duration: "1.3s",
  },
};

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function heroStyle(hero: HeroData): CSSProperties {
  const animation = HERO_ANIMATIONS[hero.key];

  return {
    "--hero-color": hero.color,
    "--hero-accent": hero.accent,
    "--hero-sheet": `url(${animation.sheet})`,
    "--hero-sheet-size": `${animation.frames * 100}% 100%`,
    "--hero-step-count": String(animation.steps),
    "--hero-duration": animation.duration,
  } as CSSProperties;
}

function stat(hero: HeroData, label: string, fallback = "-") {
  return hero.stats.find((item) => item.label.toLowerCase() === label.toLowerCase())?.value ?? fallback;
}

function ptName(hero: HeroData) {
  const map: Record<string, string> = {
    knight: "Cavaleiro",
    ranger: "Ranger",
    sorcerer: "Feiticeiro",
    priest: "Sacerdote",
    hunter: "Caçador",
    slayer: "Matador",
  };
  return map[hero.key] || hero.namePt || hero.name;
}

function ptRole(hero: HeroData) {
  const map: Record<string, string> = {
    knight: "TANQUE",
    ranger: "DPS DISTÂNCIA",
    sorcerer: "MAGIA / ÁREA",
    priest: "SUPORTE",
    hunter: "CONTROLE",
    slayer: "EXECUTOR",
  };
  return map[hero.key] || hero.role.toUpperCase();
}

function ptWeapon(value: string) {
  const map: Record<string, string> = {
    Sword: "Espada",
    Shield: "Escudo",
    Bow: "Arco",
    Arrow: "Flecha",
    Staff: "Cajado",
    Orb: "Orbe",
    Scepter: "Cetro",
    Tome: "Tomo",
    Crossbow: "Besta",
    Bolt: "Virote",
    Axe: "Machado",
    Hatchet: "Machadinha",
  };
  return map[value] || value;
}

function HeroFigure({ hero, size = "card" }: { hero: HeroData; size?: "card" | "tooltip" | "detail" }) {
  return (
    <span
      className={cn(styles.figure, styles[`figure_${size}`])}
      style={heroStyle(hero)}
      role="img"
      aria-label={ptName(hero)}
    >
      <span className={styles.spriteSheet} aria-hidden="true" />
      <i aria-hidden="true" />
    </span>
  );
}

function HeroTooltip({ hero }: { hero: HeroData }) {
  return (
    <aside className={styles.tooltip} role="presentation" style={heroStyle(hero)}>
      <h3>{ptName(hero)}</h3>
      <div className={styles.tooltipTop}>
        <HeroFigure hero={hero} size="tooltip" />
        <div>
          <strong>{ptRole(hero)}</strong>
          <p>{hero.short}</p>
          <div className={styles.weaponChips}>
            <span>{ptWeapon(hero.mainWeapon)}</span>
            <span>{ptWeapon(hero.offHand)}</span>
          </div>
        </div>
      </div>

      <div className={styles.tooltipLine} />

      <h4>Atributos base</h4>
      <div className={styles.tooltipStats}>
        <span>PV <b>{stat(hero, "HP")}</b></span>
        <span>DPS <b>{stat(hero, "DPS base")}</b></span>
        <span>DEF <b>{stat(hero, "Armadura")}</b></span>
        <span>VEL <b>{stat(hero, "Move Speed")}</b></span>
        <span>CRIT <b>{stat(hero, "Crit Chance", String(stat(hero, "Crit Damage", "-")))}</b></span>
        <span>AS/Cast <b>{stat(hero, "Attack Speed", String(stat(hero, "Cast Speed", "-")))}</b></span>
      </div>
    </aside>
  );
}

export function HeroesWikiClient({ heroes, initialHero }: Props) {
  const [selectedKey, setSelectedKey] = useState<string>(String(initialHero || heroes[0]?.key || "knight"));
  const selected = useMemo(() => heroes.find((hero) => hero.key === selectedKey) || heroes[0], [heroes, selectedKey]);

  return (
    <section className={styles.shell}>
      <div className={styles.pageRibbon}>HERÓIS</div>

      <header className={styles.headerPanel}>
        <span className={styles.kicker}>Personagens</span>
        <div className={styles.headerContent}>
          <div>
            <h1>Heróis</h1>
            <p>As 6 classes jogáveis — atributos, armas e habilidades.</p>
          </div>
          <div className={styles.headerStats}>
            <span><b>6</b>Classes</span>
            <span><b>12</b>Armas</span>
            <span><b>214</b>Habilidades</span>
          </div>
        </div>
      </header>

      <div className={styles.heroGrid}>
        {heroes.map((hero) => {
          const active = hero.key === selected.key;
          return (
            <button
              key={hero.key}
              type="button"
              className={cn(styles.heroCard, active && styles.activeCard)}
              style={heroStyle(hero)}
              onMouseEnter={() => setSelectedKey(hero.key)}
              onFocus={() => setSelectedKey(hero.key)}
              onClick={() => setSelectedKey(hero.key)}
            >
              <HeroFigure hero={hero} />
              <strong>{ptName(hero)}</strong>
              <em>{hero.name}</em>
              <div className={styles.cardStats}>
                <span>PV {stat(hero, "HP")}</span>
                <span>⚔ {stat(hero, "DPS base")}</span>
                <span>🛡 {stat(hero, "Armadura")}</span>
              </div>
              <HeroTooltip hero={hero} />
            </button>
          );
        })}
      </div>

      <article className={styles.detailPanel} style={heroStyle(selected)}>
        <div className={styles.detailImageBox}>
          <HeroFigure hero={selected} size="detail" />
        </div>
        <div className={styles.detailBody}>
          <span className={styles.classTag}>{ptRole(selected)}</span>
          <h2>{ptName(selected)}</h2>
          <h3>{selected.name}</h3>
          <p>{selected.description}</p>

          <div className={styles.detailStats}>
            {selected.stats.map((item) => (
              <div key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>

          <div className={styles.bottomGrid}>
            <section>
              <h4>Armas</h4>
              <div className={styles.weaponChips}>
                <Link href={`/gear?q=${encodeURIComponent(selected.mainWeapon)}`}>{ptWeapon(selected.mainWeapon)}</Link>
                <Link href={`/gear?q=${encodeURIComponent(selected.offHand)}`}>{ptWeapon(selected.offHand)}</Link>
              </div>
            </section>
            <section>
              <h4>Atalhos</h4>
              <div className={styles.weaponChips}>
                <Link href={`/gear?q=${encodeURIComponent(selected.mainWeapon)}`}>Equipamentos</Link>
                <Link href={`/builds?class=${selected.key}`}>Builds</Link>
                <Link href={`/doctor?class=${selected.key}`}>Análise</Link>
                <Link href={`/progress?class=${selected.key}`}>Progressão</Link>
              </div>
            </section>
          </div>
        </div>
      </article>
    </section>
  );
}
