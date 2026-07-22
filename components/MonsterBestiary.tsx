"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  DAMAGE_LABELS,
  DIFFICULTY_LABELS,
  MONSTERS,
  getMonsterAppearances,
  getMonsterByKey,
  monsterFarmScore,
  monsterPowerScore,
  type MonsterCodexEntry,
  type MonsterStageAppearance,
} from "@/lib/monster-codex-data";
import styles from "./MonsterBestiary.module.css";

type FilterRole = "all" | "wave" | "boss";
type MonsterBestiaryProps = { initialMonsterKey?: number };

const difficultyOrder = ["NORMAL", "NIGHTMARE", "HELL", "TORMENT"];
const roleLabels: Record<FilterRole, string> = { all: "Todos", wave: "Onda", boss: "Chefe" };

function formatDifficulty(value: string) { return DIFFICULTY_LABELS[value] ?? value; }
function formatDamage(value: string) { return DAMAGE_LABELS[value] ?? value; }
function compactNumber(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "-";
  return Intl.NumberFormat("pt-BR").format(value);
}
function unique<T>(values: T[]) { return Array.from(new Set(values)); }

const MONSTER_ASSET_ALIASES: Record<number, string[]> = {
  10011: ["BasicSlime_Idle_character", "BasicSlime_Walk_character", "BasicSlime_Attack1_merged"],
  10021: ["BasicGoblin_Idle_character", "BasicGoblin_Walk_character", "BasicGoblin_Attack1_character"],
  10022: ["AssassinGoblin_Idle_character", "AssassinGoblin_Walk_character", "AssassinGoblin_Attack1_Merged"],
  10023: ["ShamanGoblin_Idle_character", "ShamanGoblin_Walk_character", "ShamanGoblin_Attack1_character"],
  10031: ["BasicBat_Idle_character", "BasicBat_Walk_character", "BasicBat_Attack1_character"],
  10041: ["BasicOrc_Idle_character", "BasicOrc_Walk_character", "BasicOrc_Attack1_merged"],
  10042: ["ArmoredOrc_Idle_character", "ArmoredOrc_Walk_character", "ArmoredOrc_BaseAttack1_merged"],
  10043: ["EliteOrc_Idle_character", "EliteOrc_Walk_character", "EliteOrc_Attack1_merged"],
  10051: ["Skeleton_Idle_character", "Skeleton_Walk_character", "Skeleton_BaseAttack1_merged"],
  10052: ["SkeletonArcher_Idle_character", "SkeletonArcher_Walk_character", "SkeletonArcher_BaseAttack1_merged"],
  10053: ["SkeletonKnight_Idle_character", "SkeletonKnight_Walk_character", "SkeletonKnight_LightAttack_Merged"],
  10901: ["SkeletonKnight_Idle_character", "SkeletonKnight_HeavyAttack_character"],
  10902: ["SkeletonKnight_Idle_character", "SkeletonKnight_HeavyAttack_character"],
  10903: ["SkeletonKnight_Idle_character", "SkeletonKnight_HeavyAttack_character"],
  10904: ["SkeletonKnight_Idle_character", "SkeletonKnight_HeavyAttack_character"],

  20011: ["Scorpion_Idle_character", "Scorpion_Walk_character", "Scorpion_Attack_character"],
  20021: ["WarriorRatRace_Idle_character", "WarriorRatRace_Walk_character", "WarriorRatRace_Attack1_character"],
  20022: ["RangerRatRace_Idle_character", "RangerRatRace_Walk_character", "RangerRatRace_Attack_character"],
  20023: ["ZombieRatRace_Idle_character", "ZombieRatRace_Walk_character", "ZombieRatRace_Attack1_character"],
  20024: ["BerserkerRatRace_Idle_character", "BerserkerRatRace_Walk_character", "BerserkerRatRace_Attack1_character"],
  20031: ["Cobra_Idle_character", "Cobra_Walk_character", "Cobra_Attack_character"],
  20041: ["PoisonInsect_Idle_character", "PoisonInsect_Walk_character", "PoisonInsect_Attack_character"],
  20042: ["RedExplosionInsect_Idle_character", "RedExplosionInsect_Walk_character", "RedExplosionInsect_Attack_character"],
  20051: ["GiantFly_Idle_character", "GiantFly_Walk_character", "GiantFly_Attack_character"],
  20061: ["SpearKobolt_Idle_character", "SpearKobolt_Walk_character", "SpearKobolt_Attack_character"],
  20062: ["SlingerKobolt_Idle_character", "SlingerKobolt_Walk_character", "SlingerKobolt_Attack_character"],
  20071: ["Homunculus_Idle_character", "Homunculus_Walk_character", "Homunculus_Attack_character"],
  20081: ["Ghoul_Idle_character", "Ghoul_Walk_character", "Ghoul_Attack_character"],
  20091: ["FireElemental_Idle_character", "FireElemental_Walk_character", "FireElemental_Attack_character"],
  20111: ["SmallMummy_Idle_character", "SmallMummy_Walk_character", "SmallMummy_Attack_character"],
  20121: ["GiantTick_Idle_character", "GiantTick_Walk_character", "GiantTick_Attack1_character"],
  20901: ["Sibuna_Idle_Character", "Sibuna_Walk_Character", "Sibuna_leftStrike_character"],
  20902: ["Sibuna_Idle_Character", "Sibuna_Walk_Character", "Sibuna_rightStrike_character"],
  20903: ["Sibuna_Idle_Character", "Sibuna_Walk_Character", "Sibuna_DashAttack_Merged"],
  20904: ["Sibuna_Idle_Character", "Sibuna_Walk_Character", "Sibuna_HowlAttack_Merged"],

  30011: ["Gremlin_Idle_character", "Gremlin_Walk_character", "Gremlin_Attack_character"],
  30012: ["Geonid_Idle_character", "Geonid_Walk_character", "Geonid_Attack_character"],
  30013: ["AngelicHelm_Idle_character", "AngelicHelm_Walk_character", "AngelicHelm_Attack_character"],
  30021: ["Yeti_Idle_character", "Yeti_Walk_character", "Yeti_Attack1_character"],
  30031: ["DragonHatchling_Idle_character", "DragonHatchling_Walk_character", "DragonHatchling_Attack_character"],
  30041: ["FrozenWarrior_Idle_character", "FrozenWarrior_Walk_character", "FrozenWarrior_Attack_character"],
  30042: ["FrozenArcher_Idle_character", "FrozenArcher_Walk_character", "FrozenArcher_Attack1_character"],
  30043: ["FrozenSpearman_Idle_character", "FrozenSpearman_Walk_character", "FrozenSpearman_Attack1_character"],
  30044: ["FrozenWizard_Idle_character", "FrozenWizard_Walk_character", "FrozenWizard_Attack1_character"],
  30051: ["Ghost_Idle_character", "Ghost_Walk_character", "Ghost_Attack_character"],
  30061: ["MagmaHuman_Idle_character", "MagmaHuman_Walk_character", "MagmaHuman_Attack_character"],
  30071: ["BloodBender_Idle_character", "BloodBender_Walk_character", "BloodBender_Attack1_character"],
  30081: ["FireImp_Idle_character", "FireImp_Walk_character", "FireImp_Attack1_character"],
  30082: ["FireDemonTormentor_Idle_character", "FireDemonTormentor_Walk_character", "FireDemonTormentor_Attack1_character"],
  30083: ["FireDemoness_Idle_character", "FireDemoness_Walk_character", "FireDemoness_Attack1_character"],
  30084: ["FirePiglet_Idle_character", "FirePiglet_Walk_character", "FirePiglet_Attack_character"],
  30091: ["FireGolem_Idle_character", "FireGolem_Walk_character", "FireGolem_Attack1_character"],
  30101: ["Lich_Idle_character", "Lich_Walk_character", "Lich_ChaosAttack1_character"],
  30102: ["Lich_Idle_character", "Lich_Walk_character", "Lich_ChaosAttack1_character"],
  30103: ["Lich_Idle_character", "Lich_Walk_character", "Lich_ChaosAttack1_character"],
  30104: ["Lich_Idle_character", "Lich_Walk_character", "Lich_ChaosAttack1_character"],
  30111: ["UndeadHand_Idle_character", "UndeadHand_Walk_character", "UndeadHand_Attack_character"],
  30901: ["Sorcerer_Idle_Full", "Sorcerer_Walk_Full", "Sorcerer_Landing_merged"],
  30902: ["Sorcerer_Idle_Full", "Sorcerer_Walk_Full", "Sorcerer_Landing_merged"],
  30903: ["Sorcerer_Idle_Full", "Sorcerer_Walk_Full", "Sorcerer_Landing_merged"],
  30904: ["Sorcerer_Idle_Full", "Sorcerer_Walk_Full", "Sorcerer_Landing_merged"],
};



function firstDefined<T>(items: Array<T | null | undefined | false | "">) { return items.filter(Boolean) as T[]; }

function monsterStageLabel(stage: MonsterStageAppearance) {
  const act = stage.act ?? "?";
  const no = stage.stageNo ?? "?";
  return `A${act}-${no} ${formatDifficulty(stage.difficulty)}`;
}

function getSpriteBases(monster: MonsterCodexEntry, frameIndex: number) {
  const key = monster.key;
  const slugPrefab = monster.prefabPath.replaceAll("/", "_");
  const slugAnim = monster.animatorPath.replaceAll("/", "_");
  const aliases = MONSTER_ASSET_ALIASES[key] ?? [];
  const preferred = aliases[frameIndex];
  return unique(firstDefined<string>([
    preferred,
    aliases[0],
    aliases[1],
    aliases[2],
    `Monster_${key}`,
    `${key}`,
    `Animation_Monster_${key}_Monster_${key}`,
    `Prefab_Monster_Monster_${key}`,
    slugPrefab,
    slugAnim,
    slugPrefab.toLowerCase(),
    slugAnim.toLowerCase(),
  ]));
}

function getSpritePaths(monster: MonsterCodexEntry, frameIndex: number) {
  // Hotfix 17.7: evita 404 em massa.
  // Depois de rodar scripts/link-monster-sprites.mjs, os frames ficam
  // sempre em caminhos locais determinísticos, sem testar .gif/.webp inexistentes.
  const frame = frameIndex === 1 ? "walk" : frameIndex === 2 ? "attack" : "idle";
  return [
    `/images/monsters/Monster_${monster.key}_${frame}.png`,
    `/images/monsters/Monster_${monster.key}.png`,
  ];
}


function drawBestFrameToCanvas(source: HTMLImageElement, canvas: HTMLCanvasElement) {
  const width = source.naturalWidth || source.width;
  const height = source.naturalHeight || source.height;
  if (!width || !height) return false;

  const temp = document.createElement("canvas");
  temp.width = width;
  temp.height = height;
  const ctx = temp.getContext("2d", { willReadFrequently: true });
  if (!ctx) return false;

  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(source, 0, 0);

  let data: ImageData;
  try {
    data = ctx.getImageData(0, 0, width, height);
  } catch {
    return false;
  }

  const tile = 6;
  const cols = Math.ceil(width / tile);
  const rows = Math.ceil(height / tile);
  const occupied = new Uint8Array(cols * rows);
  let globalMinX = width;
  let globalMinY = height;
  let globalMaxX = -1;
  let globalMaxY = -1;

  for (let y = 0; y < height; y++) {
    const row = y * width * 4;
    for (let x = 0; x < width; x++) {
      const a = data.data[row + x * 4 + 3];
      if (a > 18) {
        const gx = Math.floor(x / tile);
        const gy = Math.floor(y / tile);
        occupied[gy * cols + gx] = 1;
        if (x < globalMinX) globalMinX = x;
        if (y < globalMinY) globalMinY = y;
        if (x > globalMaxX) globalMaxX = x;
        if (y > globalMaxY) globalMaxY = y;
      }
    }
  }

  if (globalMaxX < 0 || globalMaxY < 0) return false;

  // Dilatação leve: une partes do mesmo monstro, mas mantém frames distantes separados.
  const expanded = new Uint8Array(occupied);
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (!occupied[y * cols + x]) continue;
      for (let oy = -1; oy <= 1; oy++) {
        for (let ox = -1; ox <= 1; ox++) {
          const nx = x + ox;
          const ny = y + oy;
          if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) expanded[ny * cols + nx] = 1;
        }
      }
    }
  }

  const visited = new Uint8Array(cols * rows);
  let best: null | { minX: number; minY: number; maxX: number; maxY: number; count: number; area: number } = null;

  for (let sy = 0; sy < rows; sy++) {
    for (let sx = 0; sx < cols; sx++) {
      const start = sy * cols + sx;
      if (!expanded[start] || visited[start]) continue;

      let minX = sx, maxX = sx, minY = sy, maxY = sy, count = 0;
      const stack: number[] = [start];
      visited[start] = 1;

      while (stack.length) {
        const cur = stack.pop()!;
        const cy = Math.floor(cur / cols);
        const cx = cur - cy * cols;
        count++;
        if (cx < minX) minX = cx;
        if (cx > maxX) maxX = cx;
        if (cy < minY) minY = cy;
        if (cy > maxY) maxY = cy;

        const next = [cur - 1, cur + 1, cur - cols, cur + cols];
        for (const n of next) {
          if (n < 0 || n >= expanded.length || visited[n] || !expanded[n]) continue;
          const ny = Math.floor(n / cols);
          const nx = n - ny * cols;
          if (Math.abs(nx - cx) + Math.abs(ny - cy) !== 1) continue;
          visited[n] = 1;
          stack.push(n);
        }
      }

      const pxMinX = Math.max(0, minX * tile - 4);
      const pxMinY = Math.max(0, minY * tile - 4);
      const pxMaxX = Math.min(width - 1, (maxX + 1) * tile + 4);
      const pxMaxY = Math.min(height - 1, (maxY + 1) * tile + 4);
      const area = (pxMaxX - pxMinX + 1) * (pxMaxY - pxMinY + 1);
      const box = { minX: pxMinX, minY: pxMinY, maxX: pxMaxX, maxY: pxMaxY, count, area };

      // Evita escolher pontinhos isolados ou efeitos minúsculos.
      if (count < 5 || area < 80) continue;
      if (!best || box.count > best.count || (box.count === best.count && box.area > best.area)) best = box;
    }
  }

  const crop = best ?? {
    minX: Math.max(0, globalMinX - 4),
    minY: Math.max(0, globalMinY - 4),
    maxX: Math.min(width - 1, globalMaxX + 4),
    maxY: Math.min(height - 1, globalMaxY + 4),
    count: 1,
    area: 1,
  };

  const cropW = Math.max(1, crop.maxX - crop.minX + 1);
  const cropH = Math.max(1, crop.maxY - crop.minY + 1);

  // Hotfix 17.5: os sprites reais do jogo são pequenos.
  // Renderizamos o frame recortado em escala interna maior, mantendo pixel art nítido.
  const target = 132;
  const safeMax = Math.max(cropW, cropH);
  const scale = Math.max(2, Math.min(8, Math.floor(target / Math.max(1, safeMax))));
  const outW = cropW * scale;
  const outH = cropH * scale;

  canvas.width = outW;
  canvas.height = outH;
  const out = canvas.getContext("2d");
  if (!out) return false;
  out.clearRect(0, 0, outW, outH);
  out.imageSmoothingEnabled = false;
  out.drawImage(temp, crop.minX, crop.minY, cropW, cropH, 0, 0, outW, outH);
  return true;
}


function SmartSpriteFrame({ paths, alt }: { paths: string[]; alt: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [index, setIndex] = useState(0);
  const [hidden, setHidden] = useState(false);
  const pathKey = paths.join("|");

  useEffect(() => {
    setIndex(0);
    setHidden(false);
  }, [pathKey]);

  useEffect(() => {
    if (hidden || !paths[index]) return;
    let cancelled = false;
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      if (cancelled) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ok = drawBestFrameToCanvas(img, canvas);
      if (!ok) {
        if (index < paths.length - 1) setIndex((value) => value + 1);
        else setHidden(true);
      }
    };
    img.onerror = () => {
      if (cancelled) return;
      if (index < paths.length - 1) setIndex((value) => value + 1);
      else setHidden(true);
    };
    img.src = paths[index];
    return () => { cancelled = true; };
  }, [hidden, index, paths, pathKey]);

  if (hidden) return null;
  return <canvas ref={canvasRef} className={styles.spriteCanvas} aria-label={alt} role="img" />;
}

function MonsterSprite({ monster, animated = false }: { monster: MonsterCodexEntry; animated?: boolean }) {
  const idle = useMemo(() => getSpritePaths(monster, 0), [monster]);
  const walk = useMemo(() => getSpritePaths(monster, 1), [monster]);
  const attack = useMemo(() => getSpritePaths(monster, 2), [monster]);
  return (
    <span className={animated ? `${styles.spriteStack} ${styles.spriteAnimated}` : styles.spriteStack}>
      <span className={`${styles.spriteFrame} ${styles.frameIdle}`}><SmartSpriteFrame paths={idle} alt={monster.namePt} /></span>
      <span className={`${styles.spriteFrame} ${styles.frameWalk}`}><SmartSpriteFrame paths={walk} alt={`${monster.namePt} andando`} /></span>
      <span className={`${styles.spriteFrame} ${styles.frameAttack}`}><SmartSpriteFrame paths={attack} alt={`${monster.namePt} atacando`} /></span>
    </span>
  );
}

function getBestDifficulty(monster: MonsterCodexEntry) {
  for (const difficulty of [...difficultyOrder].reverse()) if (monster.difficulties.includes(difficulty)) return difficulty;
  return monster.difficulties[0] ?? "NORMAL";
}

function groupAppearances(appearances: MonsterStageAppearance[]) {
  const groups = new Map<string, MonsterStageAppearance[]>();
  appearances.forEach((stage) => {
    const key = `${stage.difficulty}-${stage.role}`;
    const list = groups.get(key) ?? [];
    list.push(stage);
    groups.set(key, list);
  });
  return Array.from(groups.entries()).sort(([a], [b]) => {
    const [ad, ar] = a.split("-");
    const [bd, br] = b.split("-");
    const diff = difficultyOrder.indexOf(ad) - difficultyOrder.indexOf(bd);
    if (diff !== 0) return diff;
    return ar.localeCompare(br);
  });
}

function MonsterTooltip({ monster }: { monster: MonsterCodexEntry }) {
  const appearances = getMonsterAppearances(monster.key);
  const stages = unique(appearances.map(monsterStageLabel)).slice(0, 4);
  const extra = Math.max(0, unique(appearances.map((stage) => stage.stageKey)).length - stages.length);
  return (
    <span className={styles.tooltip} role="tooltip">
      <span className={styles.tooltipTitle}>{monster.namePt}</span>
      <span className={styles.tooltipIntro}>
        <span className={styles.tooltipSprite}><MonsterSprite monster={monster} animated /></span>
        <span>
          <b>MONSTRO</b>
          <em>{monster.nameEn !== monster.namePt ? monster.nameEn : formatDamage(monster.damageType)}</em>
        </span>
      </span>
      <span className={styles.tooltipSection}>
        <b>Combate</b>
        <span><em>HP</em><strong>{compactNumber(monster.hp)}</strong><em>ATK</em><strong>{compactNumber(monster.attack)}</strong></span>
        <span><em>Vel.</em><strong>{compactNumber(monster.attackSpeed)}</strong><em>Mov.</em><strong>{compactNumber(monster.moveSpeed)}</strong></span>
      </span>
      <span className={styles.tooltipSection}>
        <b>Ataque</b>
        <span><em>Tipo</em><strong>{monster.delivery || "Baseattack"}</strong></span>
        <span><em>Elemento</em><strong>{formatDamage(monster.damageType)}</strong></span>
        <span><em>Alcance</em><strong>{compactNumber(monster.range)}</strong></span>
        <span><em>Poder</em><strong>{monsterPowerScore(monster)}%</strong></span>
      </span>
      <span className={styles.tooltipSection}>
        <b>Recompensas</b>
        <span><em>Gold</em><strong>{compactNumber(monster.gold)}</strong><em>Exp</em><strong>{compactNumber(monster.exp)}</strong></span>
      </span>
      <span className={styles.tooltipSection}>
        <b>Aparece em</b>
        <span className={styles.stageTags}>
          {stages.map((stage) => <i key={stage}>{stage}</i>)}
          {extra > 0 ? <i>+{extra} fases</i> : null}
        </span>
      </span>
    </span>
  );
}

function MonsterCard({ monster, selected, onSelect }: { monster: MonsterCodexEntry; selected: boolean; onSelect: () => void }) {
  return (
    <button className={selected ? `${styles.wikiCard} ${styles.cardActive}` : styles.wikiCard} onClick={onSelect} type="button">
      <span className={styles.cardImage}><MonsterSprite monster={monster} animated /></span>
      <span className={styles.cardType}>MONSTRO</span>
      <span className={styles.cardName}>{monster.namePt}</span>
      <span className={styles.cardStats}>
        <span><b>HP</b> {compactNumber(monster.hp)}</span>
        <span><b>ATK</b> {compactNumber(monster.attack)}</span>
      </span>
      <span className={styles.elementBadge}>{formatDamage(monster.damageType)}</span>
      {monster.bossCount ? <span className={styles.bossBadge}>Chefe</span> : null}
      <MonsterTooltip monster={monster} />
    </button>
  );
}

function DetailPanel({ monster }: { monster: MonsterCodexEntry | null }) {
  const appearances = monster ? getMonsterAppearances(monster.key) : [];
  const grouped = groupAppearances(appearances);
  if (!monster) return null;
  const waveStages = appearances.filter((stage) => stage.role === "wave");
  const bossStages = appearances.filter((stage) => stage.role === "boss");
  return (
    <section className={styles.detailPanel}>
      <div className={styles.detailHeader}>
        <div className={styles.detailSprite}><MonsterSprite monster={monster} animated /></div>
        <div>
          <span className={styles.kicker}>MONSTRO</span>
          <h2>{monster.namePt}</h2>
          <p>{monster.nameEn !== monster.namePt ? monster.nameEn : "Dados extraídos do jogo"}</p>
          <div className={styles.badges}>
            <span>{formatDamage(monster.damageType)}</span>
            <span>{monster.bossCount ? "Aparece como chefe" : "Mob de onda"}</span>
            <span>{formatDifficulty(getBestDifficulty(monster))}</span>
          </div>
        </div>
        <div className={styles.detailScoreBox}>
          <strong>{monsterPowerScore(monster)}</strong><span>ameaça</span><em>{monsterFarmScore(monster)} farm</em>
        </div>
      </div>
      <div className={styles.statsGrid}>
        <div><span>HP</span><strong>{compactNumber(monster.hp)}</strong></div>
        <div><span>ATK</span><strong>{compactNumber(monster.attack)}</strong></div>
        <div><span>Vel. ATK</span><strong>{compactNumber(monster.attackSpeed)}</strong></div>
        <div><span>Movimento</span><strong>{compactNumber(monster.moveSpeed)}</strong></div>
        <div><span>Gold</span><strong>{compactNumber(monster.gold)}</strong></div>
        <div><span>EXP</span><strong>{compactNumber(monster.exp)}</strong></div>
        <div><span>Range</span><strong>{compactNumber(monster.range)}</strong></div>
        <div><span>Skill</span><strong>{monster.skillKey ?? "-"}</strong></div>
      </div>
      <div className={styles.detailActions}>
        <Link href={`/monsters/${monster.key}`}>Abrir página</Link>
        <Link href={`/stages?monster=${monster.key}`}>Ver fases</Link>
        <Link href={`/drops?monster=${monster.key}`}>Ver drops</Link>
        <Link href={`/farm/optimizer?monster=${monster.key}`}>Farmar</Link>
      </div>
      <div className={styles.appearanceSummary}>
        <div><strong>{waveStages.length}</strong><span>waves</span></div>
        <div><strong>{bossStages.length}</strong><span>boss</span></div>
        <div><strong>{unique(appearances.map((stage) => stage.stageKey)).length}</strong><span>fases</span></div>
        <div><strong>{monster.difficulties.length}</strong><span>modos</span></div>
      </div>
      <div className={styles.stageGroups}>
        {grouped.slice(0, 4).map(([groupKey, stages]) => {
          const [diff, role] = groupKey.split("-");
          return (
            <div className={styles.stageGroup} key={groupKey}>
              <h3>{formatDifficulty(diff)} · {role === "boss" ? "Chefe" : "Onda"}</h3>
              <div className={styles.stageList}>
                {stages.slice(0, 10).map((stage) => (
                  <Link className={styles.stagePill} key={`${stage.stageKey}-${stage.role}`} href={`/stages?stage=${stage.stageKey}`}>
                    <strong>Ato {stage.act}-{stage.stageNo}</strong><span>{stage.namePt}</span><em>{stage.role === "boss" ? "Chefe" : `${stage.weight ?? "?"} peso`}</em>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function MonsterBestiary({ initialMonsterKey }: MonsterBestiaryProps) {
  const initial = initialMonsterKey ? getMonsterByKey(initialMonsterKey) : null;
  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState("all");
  const [damage, setDamage] = useState("all");
  const [role, setRole] = useState<FilterRole>("all");
  const [act, setAct] = useState("all");
  const [selectedKey, setSelectedKey] = useState<number | null>(initial?.key ?? MONSTERS[0]?.key ?? null);
  const damageTypes = useMemo(() => unique(MONSTERS.map((monster) => monster.damageType)).sort(), []);
  const acts = useMemo(() => {
    const all = MONSTERS.flatMap((monster) => getMonsterAppearances(monster.key).map((stage) => stage.act).filter(Boolean) as number[]);
    return unique(all).sort((a, b) => a - b);
  }, []);
  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase();
    return MONSTERS.filter((monster) => {
      const appearances = getMonsterAppearances(monster.key);
      const matchesText = !text || `${monster.namePt} ${monster.nameEn} ${monster.key}`.toLowerCase().includes(text);
      const matchesDifficulty = difficulty === "all" || monster.difficulties.includes(difficulty);
      const matchesDamage = damage === "all" || monster.damageType === damage;
      const matchesRole = role === "all" || appearances.some((stage) => stage.role === role);
      const matchesAct = act === "all" || appearances.some((stage) => String(stage.act) === act);
      return matchesText && matchesDifficulty && matchesDamage && matchesRole && matchesAct;
    }).sort((a, b) => monsterPowerScore(b) - monsterPowerScore(a));
  }, [query, difficulty, damage, role, act]);
  const selected = getMonsterByKey(selectedKey ?? 0) ?? filtered[0] ?? null;
  const bosses = MONSTERS.filter((monster) => monster.bossCount > 0).length;
  return (
    <main className={styles.shell}>
      <section className={styles.heroPanel}>
        <div>
          <span className={styles.kicker}>Fases e Monstros</span>
          <h1>Monstros</h1>
          <p>61 inimigos com sprites reais, animação ao passar o mouse, estatísticas, recompensas e fases onde aparecem.</p>
        </div>
        <div className={styles.heroStats}>
          <div><strong>{MONSTERS.length}</strong><span>monstros</span></div>
          <div><strong>{bosses}</strong><span>chefes</span></div>
          <div><strong>{filtered.length}</strong><span>visíveis</span></div>
        </div>
      </section>
      <section className={styles.filtersPanel}>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar monstro, ID, slime, goblin, boss..." />
        <select value={difficulty} onChange={(event) => setDifficulty(event.target.value)}>
          <option value="all">Todos os modos</option>
          {difficultyOrder.map((item) => <option key={item} value={item}>{formatDifficulty(item)}</option>)}
        </select>
        <select value={role} onChange={(event) => setRole(event.target.value as FilterRole)}>
          {Object.entries(roleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <select value={damage} onChange={(event) => setDamage(event.target.value)}>
          <option value="all">Todos os elementos</option>
          {damageTypes.map((item) => <option key={item} value={item}>{formatDamage(item)}</option>)}
        </select>
        <select value={act} onChange={(event) => setAct(event.target.value)}>
          <option value="all">Todos os atos</option>
          {acts.map((item) => <option key={item} value={item}>Ato {item}</option>)}
        </select>
      </section>
      <section className={styles.modeStrip} aria-label="Filtros rápidos">
        <button className={difficulty === "all" ? styles.modeActive : ""} onClick={() => setDifficulty("all")} type="button">Todos os monstros</button>
        {difficultyOrder.map((item) => <button key={item} className={difficulty === item ? styles.modeActive : ""} onClick={() => setDifficulty(item)} type="button">{formatDifficulty(item)}</button>)}
        <button className={role === "boss" ? styles.modeActive : ""} onClick={() => setRole(role === "boss" ? "all" : "boss")} type="button">Chefes do ato</button>
      </section>
      <section className={styles.wikiGridPanel}>
        <div className={styles.resultsHeader}><h2>Todos os monstros</h2><span>{filtered.length} resultado(s)</span></div>
        <div className={styles.wikiGrid}>
          {filtered.map((monster) => <MonsterCard key={monster.key} monster={monster} selected={selected?.key === monster.key} onSelect={() => setSelectedKey(monster.key)} />)}
        </div>
      </section>
      <DetailPanel monster={selected} />
    </main>
  );
}
