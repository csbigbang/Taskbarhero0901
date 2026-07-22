"use client";

import { useMemo, useState, type CSSProperties } from "react";
import styles from "./StageMapTest.module.css";
import {
  OFFICIAL_MONSTERS,
  OFFICIAL_MONSTER_NAMES_PT,
  OFFICIAL_STAGES,
  type OfficialMonsterRow,
  type OfficialStageRow,
} from "@/lib/tbh-official-stage-data";
import { STAGE_NODE_POSITIONS, STAGE_TEST_ASSETS } from "@/lib/tbh-stage-map-manifest";

const DIFFICULTIES = ["NORMAL", "NIGHTMARE", "HELL", "TORMENT"] as const;
const ACTS = [1, 2, 3] as const;

type Difficulty = (typeof DIFFICULTIES)[number];
type MonsterEntry = { id: string; weight: number };

const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  NORMAL: "Normal",
  NIGHTMARE: "Pesadelo",
  HELL: "Inferno",
  TORMENT: "Tormento",
};

const STAGE_NAMES_PT: Record<number, string[]> = {
  1: ["Pasto", "Prado Sombrio", "Terra Devastada", "Desfiladeiro Sinistro", "Entrada da Vila em Chamas", "Praça Rumstreet", "Arredores da Cidade", "Cemitério", "Terra Amaldiçoada", "Trono das Trevas"],
  2: ["Caminho do Oásis", "Vale da Tempestade de Areia", "Caverna Subterrânea do Deserto", "Ninho de Insetos", "Dunas Escaldantes", "Ruínas do Pôr do Sol", "Areias da Meia-Noite", "Túmulo Sagrado", "Cripta do Faraó", "Canal Subterrâneo do Faraó"],
  3: ["Posto Avançado Nevado", "Campo de Batalha Congelado", "Entrada da Caverna Glacial", "Caverna Glacial Congelada", "Portão do Inferno", "Desfiladeiro Ardente", "Planícies do Tormento", "Cidadela da Ruína", "Núcleo do Abismo", "Sala de Comando do Inferno"],
};

function n(value: string | undefined, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function stageName(stage: OfficialStageRow) {
  const direct = stage.stage_name_pt_br || stage.name_pt_br || stage.name;
  if (direct) return direct;
  return STAGE_NAMES_PT[n(stage.act, 1)]?.[n(stage.stage_no, 1) - 1] ?? `Ato ${stage.act}-${stage.stage_no}`;
}

function stageKind(stage: OfficialStageRow) {
  const type = String(stage.stage_type || "NORMAL").toUpperCase();
  if (type.includes("ACTBOSS")) return "Chefe do Ato";
  if (type.includes("BOSS")) return "Chefe";
  return "Normal";
}

function parseMonsters(stage: OfficialStageRow): MonsterEntry[] {
  return String(stage.monsters || "")
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [id, weight] = part.split("_");
      return { id, weight: Number(weight || 1000) || 1000 };
    })
    .filter((entry) => /^\d{4,}$/.test(entry.id));
}

function monsterName(id: string) {
  return OFFICIAL_MONSTER_NAMES_PT[id] ?? `Monstro #${id}`;
}

function monsterById(id: string): OfficialMonsterRow | undefined {
  return OFFICIAL_MONSTERS.find((monster) => monster.monster_key === id);
}

function percent(entries: MonsterEntry[], id: string) {
  const total = entries.reduce((sum, item) => sum + item.weight, 0);
  const current = entries.find((item) => item.id === id);
  if (!current || !total) return "—";
  return `${Math.max(1, Math.round((current.weight / total) * 100))}%`;
}

function MonsterSprite({ id, className }: { id: string; className?: string }) {
  const [src, setSrc] = useState(`/images/monsters/Monster_${id}_idle.png`);
  const [failed, setFailed] = useState(false);

  if (failed) return <span className={styles.mobFallback}>?</span>;

  return (
    <img
      src={src}
      alt={monsterName(id)}
      className={className}
      loading="lazy"
      draggable={false}
      onDragStart={(event) => event.preventDefault()}
      onError={() => {
        if (src.endsWith("_idle.png")) setSrc(`/images/monsters/Monster_${id}.png`);
        else setFailed(true);
      }}
    />
  );
}

function StageTooltip({ stage, position }: { stage: OfficialStageRow; position: { x: number; y: number } }) {
  const entries = parseMonsters(stage);
  const mobs = entries.slice(0, 3);
  const bossId = stage.boss_monster_key || "";
  const mainMob = bossId || mobs[0]?.id || "";
  const tooltipX = Math.min(76, Math.max(34, position.x + 20));
  const tooltipY = Math.min(78, Math.max(18, position.y - 4));

  return (
    <div className={styles.tooltip} style={{ "--tooltip-x": `${tooltipX}%`, "--tooltip-y": `${tooltipY}%` } as CSSProperties}>
      <div className={styles.tooltipTop}>
        <div className={styles.tooltipIcon}>{mainMob ? <MonsterSprite id={mainMob} className={styles.tooltipIconImg} /> : null}</div>
        <div>
          <b>ATO {stage.act} | FASE {stage.stage_no}</b>
          <span>{DIFFICULTY_LABEL[stage.stage_difficulty as Difficulty] ?? stage.stage_difficulty} | Nv.{stage.stage_level}</span>
          <strong>{bossId ? monsterName(bossId) : stageName(stage)}</strong>
        </div>
      </div>
      <div className={styles.tooltipStats}>
        <span>Ondas <b>{stage.wave_amount || "—"}</b></span>
        <span>Mobs/onda <b>{stage.wave_monster_amount || "—"}</b></span>
        <span>Tipos <b>{mobs.length || "—"}</b></span>
        <span>Tipo <b>{stageKind(stage)}</b></span>
      </div>
      <div className={styles.tooltipMobs}>
        {mobs.map((mob) => (
          <a href={`/monsters/${mob.id}`} key={mob.id} title={monsterName(mob.id)}>
            <MonsterSprite id={mob.id} className={styles.tooltipMobImg} />
            <span>{monsterName(mob.id)}</span>
            <em>{percent(entries, mob.id)} · HP {monsterById(mob.id)?.max_life || "—"}</em>
          </a>
        ))}
      </div>
    </div>
  );
}

function StageMiniPanel({ stage }: { stage: OfficialStageRow }) {
  const entries = parseMonsters(stage).slice(0, 3);
  const bossId = stage.boss_monster_key || "";

  return (
    <aside className={styles.miniPanel}>
      <span>Fase selecionada</span>
      <strong>{stageName(stage)}</strong>
      <b>ATO {stage.act}-{stage.stage_no} · Nv. {stage.stage_level} · {stageKind(stage)}</b>
      <div className={styles.miniStats}>
        <em>Ondas {stage.wave_amount || "—"}</em>
        <em>Mobs/onda {stage.wave_monster_amount || "—"}</em>
        <em>Tipos {entries.length || "—"}</em>
      </div>
      <div className={styles.miniMobs}>
        {entries.map((mob) => (
          <a href={`/monsters/${mob.id}`} key={mob.id} title={monsterName(mob.id)}>
            <MonsterSprite id={mob.id} className={styles.miniMobImg} />
          </a>
        ))}
        {bossId ? (
          <a href={`/monsters/${bossId}`} title={monsterName(bossId)} className={styles.miniBoss}>
            <MonsterSprite id={bossId} className={styles.miniMobImg} />
          </a>
        ) : null}
      </div>
      <div className={styles.miniActions}>
        <a href={`/stages/${stage.stage_key}`}>Página</a>
        <a href={`/drops?stage=${stage.stage_key}`}>Drops</a>
        <a href={`/farm?stage=${stage.stage_key}`}>Farm</a>
      </div>
    </aside>
  );
}

export default function StageMapTest() {
  const [difficulty, setDifficulty] = useState<Difficulty>("NORMAL");
  const [act, setAct] = useState<1 | 2 | 3>(1);
  const [selectedKey, setSelectedKey] = useState("1101");
  const [hoverKey, setHoverKey] = useState("");

  const stages = useMemo(() => {
    return OFFICIAL_STAGES
      .filter((stage) => n(stage.act) === act && stage.stage_difficulty === difficulty)
      .sort((a, b) => n(a.stage_no) - n(b.stage_no));
  }, [act, difficulty]);

  const selected = useMemo(() => stages.find((stage) => stage.stage_key === selectedKey) ?? stages[0], [selectedKey, stages]);
  const hovered = hoverKey ? stages.find((stage) => stage.stage_key === hoverKey) : undefined;
  const hoveredPosition = hovered ? STAGE_NODE_POSITIONS[act].find((pos) => pos.stageNo === n(hovered.stage_no)) : undefined;

  function selectAct(nextAct: 1 | 2 | 3) {
    setAct(nextAct);
    const first = OFFICIAL_STAGES.find((stage) => n(stage.act) === nextAct && stage.stage_difficulty === difficulty);
    if (first) setSelectedKey(first.stage_key);
  }

  function selectDifficulty(nextDifficulty: Difficulty) {
    setDifficulty(nextDifficulty);
    const first = OFFICIAL_STAGES.find((stage) => n(stage.act) === act && stage.stage_difficulty === nextDifficulty);
    if (first) setSelectedKey(first.stage_key);
  }

  return (
    <section className={styles.pageShell}>
      <div className={styles.stageCard}>
        <header className={styles.compactHeader}>
          <span>STAGES</span>
          <b>Mapa interativo</b>
        </header>

        <div className={styles.contentGrid}>
          <div className={styles.browser}>
            <div className={styles.toolbar}>
              <label className={styles.difficultySelect}>
                <select value={difficulty} onChange={(event) => selectDifficulty(event.target.value as Difficulty)}>
                  {DIFFICULTIES.map((mode) => <option key={mode} value={mode}>{DIFFICULTY_LABEL[mode]}</option>)}
                </select>
              </label>
              <div className={styles.actTabs}>
                {ACTS.map((number) => (
                  <button key={number} type="button" className={act === number ? styles.activeAct : ""} onClick={() => selectAct(number)}>
                    ATO {number}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.mapFrame}>
              <img
                className={styles.mapImage}
                src={STAGE_TEST_ASSETS.actMaps[act]}
                alt={`Mapa do Ato ${act}`}
                draggable={false}
                onDragStart={(event) => event.preventDefault()}
              />
              {stages.map((stage) => {
                const pos = STAGE_NODE_POSITIONS[act].find((node) => node.stageNo === n(stage.stage_no));
                if (!pos) return null;
                const stageNo = n(stage.stage_no);
                const active = selected?.stage_key === stage.stage_key;
                const boss = stageNo === 10 || stageKind(stage) !== "Normal";
                return (
                  <button
                    key={stage.stage_key}
                    type="button"
                    aria-label={`Ato ${act} fase ${stage.stage_no}`}
                    className={`${styles.stageNode} ${active ? styles.stageNodeActive : ""} ${boss ? styles.stageNodeBoss : ""}`}
                    style={{ "--x": `${pos.x}%`, "--y": `${pos.y}%` } as CSSProperties}
                    onMouseEnter={() => setHoverKey(stage.stage_key)}
                    onMouseLeave={() => setHoverKey("")}
                    onFocus={() => setHoverKey(stage.stage_key)}
                    onBlur={() => setHoverKey("")}
                    onClick={() => setSelectedKey(stage.stage_key)}
                  >
                    <span className={`${styles.nodeBase} ${active ? styles.nodeBaseActive : ""} ${boss && !active ? styles.nodeBaseBoss : ""}`} />
                    {active ? <span className={styles.nodeFlag} /> : null}
                    <span className={styles.nodeHover} />
                    <span className={styles.nodeLabel}>[{act}-{stageNo}]</span>
                  </button>
                );
              })}
              {hovered && hoveredPosition ? <StageTooltip stage={hovered} position={hoveredPosition} /> : null}
              <div className={styles.actBadge}>ATO {act}</div>
            </div>

            <p className={styles.hint}>Passe o mouse nos nós para ver os mobs. Clique para mover a bandeira.</p>
          </div>

          {selected ? <StageMiniPanel stage={selected} /> : null}
        </div>
      </div>
    </section>
  );
}
