"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import { MONSTER_SPRITE_META } from "@/lib/monster-sprite-meta";
import {
  OFFICIAL_MONSTERS,
  OFFICIAL_MONSTER_NAMES_PT,
  OFFICIAL_STAGES,
} from "@/lib/tbh-official-stage-data";
import styles from "./StagePortalGame.module.css";

type Row = Record<string, string>;
type Difficulty = "NORMAL" | "NIGHTMARE" | "HELL" | "TORMENT";

type Point = { x: number; y: number };

type DifficultyOption = {
  key: Difficulty;
  label: string;
  activeImage: string;
  inactiveImage: string;
  hoverImage: string;
  decorImage: string;
};

const DIFFICULTIES: DifficultyOption[] = [
  {
    key: "NORMAL",
    label: "Normal",
    activeImage: "/game-assets/stages/Button_Difficulty_Normal_Upward_Active.png",
    inactiveImage: "/game-assets/stages/Button_Difficulty_Normal_Downward_Active.png",
    hoverImage: "/game-assets/ui/Button_Difficulty_Normal_Downward_Hover.png",
    decorImage: "/game-assets/stages/Ui_Portal_Bg_Decor_Normal.png",
  },
  {
    key: "NIGHTMARE",
    label: "Pesadelo",
    activeImage: "/game-assets/stages/Button_Difficulty_Nightmare_Upward_Active.png",
    inactiveImage: "/game-assets/stages/Button_Difficulty_Nightmare_Downward_Active.png",
    hoverImage: "/game-assets/ui/Button_Difficulty_Nightmare_Downward_Hover.png",
    decorImage: "/game-assets/stages/Ui_Portal_Bg_Decor_Nightmare.png",
  },
  {
    key: "HELL",
    label: "Inferno",
    activeImage: "/game-assets/stages/Button_Difficulty_Hell_Upward_Active.png",
    inactiveImage: "/game-assets/stages/Button_Difficulty_Hell_Downward_Active.png",
    hoverImage: "/game-assets/ui/Button_Difficulty_Hell_Downward_Hover.png",
    decorImage: "/game-assets/stages/Ui_Portal_Bg_Decor_Hell.png",
  },
  {
    key: "TORMENT",
    label: "Tormento",
    activeImage: "/game-assets/stages/Button_Difficulty_Torment_Upward_Active.png",
    inactiveImage: "/game-assets/stages/Button_Difficulty_Torment_Downward_Active.png",
    hoverImage: "/game-assets/ui/Button_Difficulty_Torment_Downward_Hover.png",
    decorImage: "/game-assets/stages/Ui_Portal_Bg_Decor_Torment_Lock.png",
  },
];

const MAPS: Record<number, string> = {
  1: "/game-assets/stages/Act1_Bg.png",
  2: "/game-assets/stages/Act2_Bg.png",
  3: "/game-assets/stages/Act3_Bg.png",
};

const NODE_POSITIONS: Record<number, Point[]> = {
  1: [
    { x: 49.3, y: 91.6 },
    { x: 56.3, y: 84.9 },
    { x: 60.0, y: 75.8 },
    { x: 59.0, y: 67.2 },
    { x: 56.3, y: 58.4 },
    { x: 52.3, y: 49.5 },
    { x: 50.0, y: 41.2 },
    { x: 44.3, y: 33.7 },
    { x: 34.7, y: 29.5 },
    { x: 46.3, y: 23.5 },
  ],
  2: [
    { x: 44.3, y: 89.3 },
    { x: 53.0, y: 81.6 },
    { x: 57.3, y: 73.7 },
    { x: 66.3, y: 65.8 },
    { x: 55.0, y: 61.4 },
    { x: 46.7, y: 54.2 },
    { x: 42.7, y: 46.0 },
    { x: 51.7, y: 38.4 },
    { x: 53.7, y: 29.8 },
    { x: 53.3, y: 20.5 },
  ],
  3: [
    { x: 53.0, y: 89.1 },
    { x: 48.7, y: 80.5 },
    { x: 53.0, y: 71.2 },
    { x: 45.7, y: 63.0 },
    { x: 49.7, y: 54.2 },
    { x: 39.0, y: 48.6 },
    { x: 48.3, y: 42.6 },
    { x: 58.7, y: 37.0 },
    { x: 52.7, y: 29.1 },
    { x: 48.3, y: 20.2 },
  ],
};

const STAGE_NAMES_PT: Record<number, string[]> = {
  1: [
    "Pasto",
    "Prado Sombrio",
    "Terra Devastada",
    "Desfiladeiro Sinistro",
    "Entrada da Vila em Chamas",
    "Praça Rumstreet",
    "Arredores da Cidade",
    "Cemitério",
    "Terra Amaldiçoada",
    "Trono das Trevas",
  ],
  2: [
    "Caminho do Oásis",
    "Vale da Tempestade de Areia",
    "Caverna Subterrânea do Deserto",
    "Ninho de Insetos",
    "Dunas Escaldantes",
    "Ruínas do Pôr do Sol",
    "Areias da Meia-Noite",
    "Túmulo Sagrado",
    "Cripta do Faraó",
    "Canal Subterrâneo do Faraó",
  ],
  3: [
    "Posto Avançado Nevado",
    "Campo de Batalha Congelado",
    "Entrada da Caverna Glacial",
    "Caverna Glacial Congelada",
    "Portão do Inferno",
    "Desfiladeiro Ardente",
    "Planícies do Tormento",
    "Cidadela da Ruína",
    "Núcleo do Abismo",
    "Sala de Comando do Inferno",
  ],
};

function stageKey(stage: Row) {
  return String(stage.stage_key ?? "");
}

function stageAct(stage: Row) {
  return Number(stage.act || stageKey(stage).slice(0, 1) || 1);
}

function stageNo(stage: Row) {
  return Number(stage.stage_no || stageKey(stage).slice(-2) || 1);
}

function stageTitle(stage: Row) {
  const act = stageAct(stage);
  const no = stageNo(stage);
  return STAGE_NAMES_PT[act]?.[no - 1] ?? `Ato ${act}-${no}`;
}

function stageDifficulty(stage: Row): Difficulty {
  const raw = String(stage.stage_difficulty ?? "NORMAL").toUpperCase();
  if (raw.includes("TORMENT")) return "TORMENT";
  if (raw.includes("HELL")) return "HELL";
  if (raw.includes("NIGHT")) return "NIGHTMARE";
  return "NORMAL";
}

function difficultyLabel(difficulty: Difficulty) {
  return DIFFICULTIES.find((item) => item.key === difficulty)?.label ?? difficulty;
}

function difficultyDecor(difficulty: Difficulty) {
  return DIFFICULTIES.find((item) => item.key === difficulty)?.decorImage ?? DIFFICULTIES[0].decorImage;
}

function monsterIds(stage: Row) {
  const entries = String(stage.monsters ?? "")
    .split(/[\s,;|]+/)
    .map((token) => token.split("_")[0].trim())
    .filter((token) => /^\d{4,}$/.test(token));
  return Array.from(new Set(entries)).slice(0, 5);
}

function monsterName(id: string) {
  return OFFICIAL_MONSTER_NAMES_PT[id] ?? `Monstro #${id}`;
}

function monsterRecord(id: string) {
  return OFFICIAL_MONSTERS.find((monster) => String(monster.monster_key) === id);
}

function monsterHp(id: string) {
  return monsterRecord(id)?.max_life || "—";
}

function stageType(stage: Row) {
  const raw = String(stage.stage_type ?? "NORMAL").toUpperCase();
  if (raw.includes("ACTBOSS")) return "Chefe do ato";
  if (raw.includes("BOSS")) return "Chefe";
  return "Normal";
}

function stageChests(stage: Row) {
  const rows = [
    {
      key: stage.monster_drop_item_key,
      label: "Baú de monstros",
      rate: stage.monster_drop_item_rate,
      sprite: "/game-assets/stages/rewards/chest-normal-strip.png",
      tone: "normal" as const,
      frames: 12,
    },
    {
      key: stage.boss_drop_item_key,
      label: "Baú de chefe",
      rate: stage.boss_drop_item_rate,
      sprite: "/game-assets/stages/rewards/chest-boss-strip.png",
      tone: "boss" as const,
      frames: 12,
    },
    {
      key: stage.first_clear_drop_key,
      label: "Primeira conclusão",
      rate: "1x",
      sprite: "/game-assets/stages/rewards/chest-act-strip.png",
      tone: "act" as const,
      frames: 12,
    },
  ];
  return rows.filter((row) => row.key).slice(0, 3);
}

function MonsterSprite({ id, className }: { id: string; className?: string }) {
  const meta = MONSTER_SPRITE_META[id];

  if (!meta) {
    return <span className={styles.monsterFallback}>?</span>;
  }

  return (
    <span
      className={`${styles.monsterAnimation} ${className ?? ""}`}
      role="img"
      aria-label={monsterName(id)}
      style={
        {
          "--monster-sheet": `url(${meta.src})`,
          "--monster-frames": String(meta.frames),
          "--monster-steps": String(Math.max(meta.frames - 1, 1)),
          "--monster-ratio": `${meta.width} / ${meta.height}`,
          "--monster-duration": `${Math.max(0.72, meta.frames * 0.11)}s`,
        } as CSSProperties
      }
    />
  );
}

function ChestSprite({
  sprite,
  frames,
  tone,
}: {
  sprite: string;
  frames: number;
  tone: "normal" | "boss" | "act";
}) {
  return (
    <span
      className={`${styles.chestSprite} ${styles[`chestSprite_${tone}`]}`}
      aria-hidden="true"
      style={
        {
          "--chest-sheet": `url(${sprite})`,
          "--chest-frames": String(frames),
          "--chest-steps": String(Math.max(frames - 1, 1)),
        } as CSSProperties
      }
    />
  );
}

function StageInspector({
  stage,
  selected,
  difficulty,
}: {
  stage: Row;
  selected: boolean;
  difficulty: Difficulty;
}) {
  const act = stageAct(stage);
  const no = stageNo(stage);
  const monsters = monsterIds(stage);
  const bossId = String(stage.boss_monster_key ?? "");
  const chests = stageChests(stage);

  return (
    <aside
      className={styles.stageInspector}
      style={{ "--portal-decor": `url(${difficultyDecor(difficulty)})` } as CSSProperties}
      aria-live="polite"
    >
      <div className={styles.inspectorDecor} aria-hidden="true" />

      <div className={styles.inspectorHeader}>
        <div>
          <span>ATO {act} · FASE {no}</span>
          <b>{difficultyLabel(difficulty)} · Nv. {stage.stage_level || no}</b>
          <h2>{stageTitle(stage)}</h2>
        </div>
        <span className={selected ? styles.fixedBadge : styles.previewBadge}>
          {selected ? "Selecionada" : "Prévia"}
        </span>
      </div>

      <div className={styles.stageMetrics}>
        <div><span>Ondas</span><strong>{stage.wave_amount || "—"}</strong></div>
        <div><span>Mobs / onda</span><strong>{stage.wave_monster_amount || "—"}</strong></div>
        <div><span>Tipos</span><strong>{monsters.length || "—"}</strong></div>
        <div><span>Tipo</span><strong>{stageType(stage)}</strong></div>
      </div>

      <section className={styles.inspectorSection}>
        <div className={styles.sectionTitle}>
          <span>Monstros da fase</span>
          <i />
        </div>
        <div className={styles.monsterGrid}>
          {monsters.map((id) => (
            <Link href={`/monsters/${id}`} className={styles.monsterCard} key={id}>
              <MonsterSprite id={id} className={styles.monsterSprite} />
              <strong>{monsterName(id)}</strong>
              <small>{monsterHp(id)} PV</small>
            </Link>
          ))}
        </div>
      </section>

      {bossId ? (
        <section className={styles.bossPanel}>
          <MonsterSprite id={bossId} className={styles.bossSprite} />
          <div>
            <span>Chefe da fase</span>
            <strong>{monsterName(bossId)}</strong>
            <small>{monsterHp(bossId)} PV</small>
          </div>
        </section>
      ) : null}

      <section className={styles.inspectorSection}>
        <div className={styles.sectionTitle}>
          <span>Recompensas</span>
          <i />
        </div>
        <div className={styles.chestGrid}>
          {chests.map((chest) => (
            <Link
              href={`/drops?stage=${encodeURIComponent(stageKey(stage))}&drop=${encodeURIComponent(chest.key || "")}`}
              className={styles.chestCard}
              key={`${chest.label}-${chest.key}`}
            >
              <ChestSprite sprite={chest.sprite} frames={chest.frames} tone={chest.tone} />
              <span>
                <strong>{chest.label}</strong>
                <small>{chest.rate ? `Taxa ${chest.rate}` : "Ver conteúdo"}</small>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <div className={styles.inspectorActions}>
        <Link className={styles.startButton} href={`/stages/${encodeURIComponent(stageKey(stage))}`}>
          Abrir fase
        </Link>
        <Link className={styles.secondaryButton} href={`/drops?stage=${encodeURIComponent(stageKey(stage))}`}>
          Ver drops
        </Link>
      </div>
    </aside>
  );
}

export default function StagePortalGame() {
  const [difficulty, setDifficulty] = useState<Difficulty>("NORMAL");
  const [act, setAct] = useState(1);
  const [selectedKey, setSelectedKey] = useState("");
  const [hoverKey, setHoverKey] = useState("");

  const stages = useMemo(
    () =>
      (OFFICIAL_STAGES as Row[])
        .filter((stage) => stageAct(stage) === act && stageDifficulty(stage) === difficulty)
        .sort((left, right) => stageNo(left) - stageNo(right)),
    [act, difficulty],
  );

  useEffect(() => {
    if (!stages.length) return;
    if (!stages.some((stage) => stageKey(stage) === selectedKey)) {
      setSelectedKey(stageKey(stages[0]));
    }
  }, [stages, selectedKey]);

  const selected = stages.find((stage) => stageKey(stage) === selectedKey) ?? stages[0];
  const hovered = stages.find((stage) => stageKey(stage) === hoverKey);
  const preview = hovered ?? selected;

  if (!selected || !preview) {
    return <section className={styles.emptyState}>Não foi possível carregar as fases.</section>;
  }

  return (
    <section className={styles.stagePage}>
      <header className={styles.pageHeader}>
        <div>
          <span>DATABASE</span>
          <h1>Fases</h1>
          <p>Seleção de fases inspirada diretamente na interface do jogo, usando apenas assets oficiais.</p>
        </div>
        <div className={styles.headerStats}>
          <span><b>3</b> atos</span>
          <span><b>4</b> dificuldades</span>
          <span><b>120</b> fases</span>
        </div>
      </header>

      <div className={styles.portalShell}>
        <div className={styles.toolbar}>
          <div className={styles.difficultyTabs} aria-label="Selecionar dificuldade">
            {DIFFICULTIES.map((option) => {
              const active = option.key === difficulty;
              return (
                <button
                  key={option.key}
                  type="button"
                  className={active ? styles.difficultyActive : ""}
                  style={
                    {
                      "--difficulty-image": `url(${active ? option.activeImage : option.inactiveImage})`,
                      "--difficulty-hover": `url(${option.hoverImage})`,
                    } as CSSProperties
                  }
                  onClick={() => {
                    setDifficulty(option.key);
                    setHoverKey("");
                  }}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          <div className={styles.actTabs} aria-label="Selecionar ato">
            {[1, 2, 3].map((value) => (
              <button
                key={value}
                type="button"
                className={act === value ? styles.actActive : ""}
                onClick={() => {
                  setAct(value);
                  setHoverKey("");
                }}
              >
                Ato {value}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.portalBody}>
          <section className={styles.mapPanel}>
            <div className={styles.mapTopLabel}>
              <img src="/game-assets/stages/Icon_Portal_NormalStage.png" alt="" aria-hidden="true" />
              <span>Ato {act}</span>
              <strong>{difficultyLabel(difficulty)}</strong>
            </div>

            <div
              className={styles.mapViewport}
              onMouseLeave={() => setHoverKey("")}
              aria-label={`Mapa do Ato ${act}`}
            >
              <img className={styles.mapImage} src={MAPS[act]} alt={`Mapa do Ato ${act}`} />

              {stages.map((stage) => {
                const no = stageNo(stage);
                const position = NODE_POSITIONS[act]?.[no - 1] ?? { x: 50, y: 50 };
                const isSelected = stageKey(stage) === stageKey(selected);
                const isHovered = stageKey(stage) === hoverKey;

                return (
                  <button
                    key={stageKey(stage)}
                    type="button"
                    className={`${styles.stageNode} ${isSelected ? styles.stageNodeSelected : ""} ${isHovered ? styles.stageNodeHovered : ""}`}
                    style={{ left: `${position.x}%`, top: `${position.y}%` }}
                    aria-label={`Selecionar Ato ${act}, fase ${no}: ${stageTitle(stage)}`}
                    title={`${act}-${no} · ${stageTitle(stage)}`}
                    onMouseEnter={() => setHoverKey(stageKey(stage))}
                    onFocus={() => setHoverKey(stageKey(stage))}
                    onBlur={() => setHoverKey("")}
                    onClick={() => setSelectedKey(stageKey(stage))}
                  >
                    {!isSelected ? <span className={styles.hoverMarker} aria-hidden="true" /> : null}
                    {isSelected ? (
                      <>
                        <span className={styles.activeBase} aria-hidden="true" />
                        <span className={styles.activeFlag} aria-hidden="true" />
                      </>
                    ) : null}
                    <small>{act}-{no}</small>
                  </button>
                );
              })}
            </div>

            <div className={styles.mapFooter}>
              <span>Fase selecionada</span>
              <strong>{act}-{stageNo(selected)} · {stageTitle(selected)}</strong>
            </div>
          </section>

          <StageInspector
            stage={preview}
            selected={stageKey(preview) === stageKey(selected)}
            difficulty={difficulty}
          />
        </div>

        <p className={styles.helpText}>
          Passe o mouse para visualizar. Clique em um nó para mover a bandeira e fixar a fase.
        </p>
      </div>
    </section>
  );
}
