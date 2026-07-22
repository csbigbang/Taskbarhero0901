"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { createClient } from "@supabase/supabase-js";
import styles from "./StageWikiPro.module.css";
import { OFFICIAL_MONSTERS, OFFICIAL_MONSTER_NAMES_PT, OFFICIAL_STAGES } from "@/lib/tbh-official-stage-data";

type AnyRow = Record<string, any>;

type Props = {
  stages?: AnyRow[];
  drops?: AnyRow[];
  dropRows?: AnyRow[];
  monsters?: AnyRow[];
};

const DIFFICULTIES = ["Normal", "Nightmare", "Hell", "Torment"] as const;
const ACTS = [1, 2, 3] as const;

const ACT_MAPS: Record<number, string> = {
  1: "/tbh-real/stages/Act1_Bg.png",
  2: "/tbh-real/stages/Act2_Bg.png",
  3: "/tbh-real/stages/Act3_Bg.png",
};

const DIFFICULTY_LABELS: Record<string, string> = {
  Normal: "Normal",
  Nightmare: "Pesadelo",
  Hell: "Inferno",
  Torment: "Tormento",
};

const STAGE_NAMES_PT: Record<number, string[]> = {
  1: ["Pasto", "Prado Sombrio", "Terra Devastada", "Desfiladeiro Sinistro", "Entrada da Vila em Chamas", "Praça Rumstreet", "Arredores da Cidade", "Cemitério", "Terra Amaldiçoada", "Trono das Trevas"],
  2: ["Caminho do Oásis", "Vale da Tempestade de Areia", "Caverna Subterrânea do Deserto", "Ninho de Insetos", "Dunas Escaldantes", "Ruínas do Pôr do Sol", "Areias da Meia-Noite", "Túmulo Sagrado", "Cripta do Faraó", "Canal Subterrâneo do Faraó"],
  3: ["Posto Avançado Nevado", "Campo de Batalha Congelado", "Entrada da Caverna Glacial", "Caverna Glacial Congelada", "Portão do Inferno", "Desfiladeiro Ardente", "Planícies do Tormento", "Cidadela da Ruína", "Núcleo do Abismo", "Sala de Comando do Inferno"],
};

const NODE_POSITIONS = [
  { x: 47, y: 91 },
  { x: 47, y: 80 },
  { x: 48, y: 69 },
  { x: 48, y: 58 },
  { x: 52, y: 47 },
  { x: 52, y: 36 },
  { x: 60, y: 26 },
  { x: 55, y: 17 },
  { x: 43, y: 10 },
  { x: 50, y: 5 },
];

const MONSTER_NAMES: Record<string, string> = {
  "10011": "Slime",
  "10021": "Goblin",
  "10022": "Chefe Goblin",
  "10023": "Assassino Goblin",
  "10031": "Mago Goblin",
  "10041": "Orc Básico",
  "10042": "Guerreiro Orc",
  "10043": "Orc de Elite",
  "10051": "Esqueleto",
  "10052": "Arqueiro Esqueleto",
  "10053": "Cavaleiro Esqueleto",
  "10901": "Mago Antigo",
  "10902": "Chefe Orc",
  "10903": "Rei Goblin",
  "10904": "Rei Esqueleto",
  "20011": "Morcego",
  "20021": "Guerreiro Ratuno",
  "20022": "Arqueiro Ratuno",
  "20023": "Rato da Peste",
  "20024": "Berserker Ratuno",
  "20031": "Cobra",
  "20041": "Inseto Venenoso",
  "20042": "Lorde Venenoso",
  "20051": "Escorpião",
  "20061": "Guarda Kobold",
  "20062": "Atirador Kobold",
  "20071": "Gremlin",
  "20081": "Múmia Pequena",
  "20091": "Geonid",
  "20111": "Yeti",
  "20901": "Soberano do Deserto",
  "20902": "Soberano do Deserto",
  "20903": "Soberano do Deserto",
  "20904": "Soberano do Deserto",
  "30013": "Elmo do Anjo Caído",
  "30041": "Guerreiro da Montanha",
  "30042": "Arqueiro da Montanha",
  "30043": "Guarda da Montanha",
  "30044": "Mago da Montanha",
  "30061": "Ser de Lava",
  "30071": "Sacerdote de Sangue",
  "30081": "Soldado Demoníaco",
  "30082": "Comandante da Legião",
  "30083": "Tropa de Choque Demoníaca",
  "30101": "Sacerdote Infernal do Fogo",
  "30102": "Sacerdote Infernal do Gelo",
  "30103": "Sacerdote Infernal Elétrico",
  "30104": "Sacerdote Infernal do Caos",
  "30111": "Dedo da Morte",
};

const CHEST_NAMES: Record<string, string> = {
  NORMAL_MONSTER_BOX: "Baú de Monstro",
  NORMAL_BOSS_BOX: "Baú de Chefe",
  STAGE_BOSS_BOX: "Baú de Chefe",
  FIRST_CLEAR: "Primeira Conclusão",
  ACT_BOSS_BOX: "Baú de Chefe do Ato",
};

function pick(row: AnyRow | undefined, keys: string[], fallback: any = undefined) {
  if (!row) return fallback;
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && row[key] !== "") return row[key];
  }
  return fallback;
}

function asNumber(value: any, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeDifficulty(value: any) {
  const raw = String(value ?? "").toLowerCase();
  if (raw.includes("torment") || raw.includes("tormento") || raw === "4") return "Torment";
  if (raw.includes("hell") || raw.includes("inferno") || raw === "3") return "Hell";
  if (raw.includes("night") || raw.includes("pesadelo") || raw === "2") return "Nightmare";
  return "Normal";
}

function difficultyLabel(value: string) {
  return DIFFICULTY_LABELS[value] ?? value;
}

function stageKey(row: AnyRow) {
  return String(pick(row, ["stage_key", "StageKey", "stageKey", "key", "Key", "id", "ID", "stage_id", "StageID"], ""));
}

function getStageAct(row: AnyRow) {
  const direct = asNumber(pick(row, ["act", "Act", "act_no", "ActNo"]), 0);
  if (direct) return direct;
  const key = stageKey(row).replace(/\D/g, "");
  return key.length >= 1 ? asNumber(key.slice(0, 1), 1) : 1;
}

function getStageNo(row: AnyRow) {
  const direct = asNumber(pick(row, ["stage_no", "StageNo", "no", "No", "stage", "Stage"]), 0);
  if (direct) return direct;
  const key = stageKey(row).replace(/\D/g, "");
  if (key.length >= 4) return asNumber(key.slice(-2), 1);
  const m = key.match(/(\d)$/);
  return m ? asNumber(m[1], 1) : 1;
}

function getStageLevel(row: AnyRow) {
  const direct = asNumber(pick(row, ["stage_level", "StageLevel", "required_level", "RequiredLevel", "level", "Level", "lv", "Lv"]), 0);
  return direct || getStageNo(row);
}

function getStageDifficulty(row: AnyRow) {
  const direct = pick(row, ["stage_difficulty", "StageDifficulty", "difficulty", "Difficulty", "mode", "Mode", "difficulty_name", "DifficultyName"], "");
  if (direct) return normalizeDifficulty(direct);
  const key = stageKey(row).replace(/\D/g, "");
  const mode = key.length >= 2 ? key[1] : "";
  if (mode === "4") return "Torment";
  if (mode === "3") return "Hell";
  if (mode === "2") return "Nightmare";
  return "Normal";
}

function getStageTitle(row: AnyRow) {
  const ptName = pick(row, ["name_pt_br", "stage_name_pt_br", "name_pt", "display_name_pt_br", "name_ptbr"], "");
  if (ptName) return String(ptName);
  const act = getStageAct(row);
  const no = getStageNo(row);
  const raw = String(pick(row, ["name", "Name", "stage_name", "StageName", "title", "Title", "name_en_us", "stage_name_en_us"], "") ?? "").trim();
  if (!raw || /^act\s*\d+[-–]\d+$/i.test(raw) || /^stage\s*\d+/i.test(raw)) return STAGE_NAMES_PT[act]?.[no - 1] ?? `Ato ${act}-${no}`;
  return raw;
}

function monsterName(id: any) {
  const key = String(id ?? "");
  return OFFICIAL_MONSTER_NAMES_PT[key] ?? MONSTER_NAMES[key] ?? `Monstro #${key}`;
}

function findMonster(monsters: AnyRow[], id: any) {
  const key = String(id ?? "");
  return (
    monsters.find((m) => String(pick(m, ["monster_key", "MonsterKey", "key", "Key", "id", "ID"], "")) === key) ??
    OFFICIAL_MONSTERS.find((m) => String(m.monster_key) === key)
  );
}

function monsterSprite(id: any, variant: "idle" | "base" = "idle") {
  const key = String(id ?? "").trim();
  return variant === "idle" ? `/images/monsters/Monster_${key}_idle.png` : `/images/monsters/Monster_${key}.png`;
}

function extractMonsterIds(value: any) {
  const raw = String(value ?? "").trim();
  if (!raw) return [];
  const ids: string[] = [];
  for (const token of raw.split(/[\s,;|]+/)) {
    const cleaned = token.trim();
    if (!cleaned) continue;
    const beforeWeight = cleaned.split("_")[0];
    if (/^\d{4,}$/.test(beforeWeight)) ids.push(beforeWeight);
  }
  return Array.from(new Set(ids));
}

function getMonsterIds(stage: AnyRow, drops: AnyRow[] = []) {
  const raw = pick(stage, ["monsters", "Monsters", "monster_keys", "MonsterKeys", "mobs", "Mobs", "mob_keys", "MobKeys", "monster_list", "MonsterList"], "");
  let ids = extractMonsterIds(raw);

  if (!ids.length) {
    ids = drops.flatMap((d) => extractMonsterIds(pick(d, ["monster_key", "MonsterKey", "mob_key", "MobKey", "source_key", "SourceKey"], "")));
  }

  return Array.from(new Set(ids)).slice(0, 8);
}

function getBossId(stage: AnyRow) {
  const boss = pick(stage, ["boss_monster_key", "BossMonsterKey", "boss_key", "BossKey", "boss", "Boss", "boss_id", "BossID"], "");
  if (boss) return String(boss);
  return "";
}

function dropStageKey(row: AnyRow) {
  return String(pick(row, ["stage_key", "StageKey", "stageKey", "stage_id", "StageID"], ""));
}

function sourceType(row: AnyRow) {
  return String(pick(row, ["source_type", "SourceType", "type", "Type", "drop_type", "DropType"], "DROP"));
}

function dropKey(row: AnyRow) {
  return String(pick(row, ["drop_key", "DropKey", "item_key", "ItemKey", "reward_key", "RewardKey", "key", "Key"], ""));
}

function getRate(row: AnyRow) {
  return pick(row, ["source_rate", "SourceRate", "rate", "Rate", "weight", "Weight", "drop_rate", "DropRate", "chance", "Chance"], "");
}

function chestIcon(type: string) {
  const raw = String(type ?? "").toUpperCase();
  if (raw.includes("ACT")) return "/tbh-real/ui/Chest_ActBoss_Possessed.png";
  if (raw.includes("BOSS") || raw.includes("FIRST")) return "/tbh-real/ui/Chest_NormalBoss_Possessed.png";
  return "/tbh-real/ui/Chest_Normal_Possessed.png";
}

function lootPriority(row: AnyRow) {
  const type = sourceType(row).toUpperCase();
  if (type.includes("MONSTER")) return 1;
  if (type.includes("BOSS")) return 2;
  if (type.includes("FIRST")) return 3;
  if (type.includes("ACT")) return 4;
  return 9;
}

function stageLootRows(stage: AnyRow) {
  const rows: AnyRow[] = [
    {
      source_type: "NORMAL_MONSTER_BOX",
      drop_key: pick(stage, ["monster_drop_item_key", "MonsterDropItemKey"], ""),
      source_rate: pick(stage, ["monster_drop_item_rate", "MonsterDropItemRate"], ""),
    },
    {
      source_type: "STAGE_BOSS_BOX",
      drop_key: pick(stage, ["boss_drop_item_key", "BossDropItemKey"], ""),
      source_rate: pick(stage, ["boss_drop_item_rate", "BossDropItemRate"], ""),
    },
    {
      source_type: "FIRST_CLEAR",
      drop_key: pick(stage, ["first_clear_drop_key", "FirstClearDropKey"], ""),
      source_rate: "1x",
    },
  ];
  return rows.filter((row) => dropKey(row));
}

function compactLootRows(stage: AnyRow, liveDrops: AnyRow[]) {
  const source = stageLootRows(stage).length ? stageLootRows(stage) : liveDrops;
  const map = new Map<string, AnyRow>();
  for (const row of source) {
    const type = sourceType(row).toUpperCase();
    const key = dropKey(row);
    if (!key) continue;
    const bucket = type.includes("MONSTER") ? "MONSTER" : type.includes("BOSS") ? "BOSS" : type.includes("FIRST") ? "FIRST" : type.includes("ACT") ? "ACT" : type;
    if (!map.has(bucket)) map.set(bucket, row);
  }
  return Array.from(map.values()).sort((a, b) => lootPriority(a) - lootPriority(b)).slice(0, 4);
}

function monsterSpawnPercent(stage: AnyRow, id: any) {
  const raw = String(pick(stage, ["monsters", "Monsters", "monster_keys", "MonsterKeys", "mobs", "Mobs", "mob_keys", "MobKeys", "monster_list", "MonsterList"], ""));
  const entries = raw
    .split(/[\s,;|]+/)
    .map((token) => token.trim())
    .filter(Boolean)
    .map((token) => {
      const [key, weight] = token.split("_");
      return { key, weight: Number(weight || 1000) || 1000 };
    })
    .filter((entry) => /^\d{4,}$/.test(entry.key));

  const total = entries.reduce((sum, entry) => sum + entry.weight, 0);
  const found = entries.find((entry) => entry.key === String(id));
  if (!found || !total) return "100%";
  return `${Math.max(1, Math.round((found.weight / total) * 100))}%`;
}

function monsterStat(monster: AnyRow | undefined, keys: string[], fallback = "-") {
  const value = pick(monster, keys, fallback);
  const text = String(value ?? "").trim();
  return text || fallback;
}

function translateElement(value: any) {
  const raw = String(value ?? "").toLowerCase();
  if (raw.includes("fire") || raw.includes("fogo")) return "Fogo";
  if (raw.includes("ice") || raw.includes("gelo")) return "Gelo";
  if (raw.includes("light") || raw.includes("thunder") || raw.includes("raio")) return "Raio";
  if (raw.includes("poison") || raw.includes("veneno")) return "Veneno";
  if (raw.includes("chaos") || raw.includes("caos")) return "Caos";
  if (raw.includes("dark") || raw.includes("sombra")) return "Sombrio";
  return raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : "Físico";
}

function stageIndexFromNo(no: number) {
  return Math.max(0, Math.min(9, no - 1));
}

function localStagesForActMode(stages: AnyRow[], act: number, difficulty: string) {
  return stages
    .filter((s) => getStageAct(s) === act && getStageDifficulty(s) === difficulty)
    .sort((a, b) => getStageNo(a) - getStageNo(b));
}

function getStageKind(stage: AnyRow) {
  const raw = String(pick(stage, ["stage_type", "StageType", "type", "Type"], "NORMAL")).toUpperCase();
  if (raw.includes("ACTBOSS")) return "Chefe do Ato";
  if (raw.includes("BOSS")) return "Chefe";
  return "Normal";
}

function RealImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return <img src={src} alt={alt} className={className} loading="lazy" onError={() => setFailed(true)} />;
}

function MonsterSprite({ id, className }: { id: any; className?: string }) {
  const [variant, setVariant] = useState<"idle" | "base" | "off">("idle");
  if (variant === "off") return <span className={styles.mobFallback}>?</span>;
  return (
    <img
      src={monsterSprite(id, variant)}
      alt={monsterName(id)}
      className={className}
      loading="lazy"
      onError={() => setVariant(variant === "idle" ? "base" : "off")}
    />
  );
}

function StageTooltip({ stage, difficulty, monsters }: { stage: AnyRow; difficulty: string; monsters: AnyRow[] }) {
  const act = getStageAct(stage);
  const no = getStageNo(stage);
  const level = getStageLevel(stage);
  const mobs = getMonsterIds(stage).slice(0, 4);
  const bossId = getBossId(stage);
  const title = getStageTitle(stage);
  const waves = pick(stage, ["wave_amount", "WaveAmount", "waves", "Ondas", "wave_count", "OndaCount", "Onda", "wave"], "—");
  const mobsPerWave = pick(stage, ["wave_monster_amount", "WaveMonsterAmount", "mobs_per_wave", "MobsPerOnda", "mob_per_wave", "MobPerOnda"], "—");
  const mobTypes = mobs.length || pick(stage, ["mob_types", "MobTypes", "monster_types", "MonsterTypes"], "—");
  const focusMob = bossId || mobs[0] || "";
  const focusMonster = findMonster(monsters, focusMob);

  return (
    <div className={`${styles.stageTooltip} ${getStageKind(stage) !== "Normal" ? styles.stageTooltipBoss : ""}`}>
      <div className={styles.tooltipTop}>
        <div className={styles.tooltipPortrait}>{focusMob ? <MonsterSprite id={focusMob} className={styles.tooltipPortraitSprite} /> : null}</div>
        <div className={styles.tooltipTitleBlock}>
          <span>ATO {act} | FASE {no}</span>
          <b>{difficultyLabel(difficulty)} | Nv. {level}</b>
          <strong>{title}</strong>
          {focusMob ? <em>{monsterName(focusMob)}</em> : null}
        </div>
      </div>

      <div className={styles.tooltipStatsGrid}>
        <span>Ondas <b>{waves || "—"}</b></span>
        <span>Mobs / onda <b>{mobsPerWave || "—"}</b></span>
        <span>Tipos <b>{mobTypes}</b></span>
        <span>Tipo <b>{getStageKind(stage)}</b></span>
      </div>

      <div className={styles.tooltipMobs}>
        {mobs.map((id) => {
          const monster = findMonster(monsters, id);
          return (
            <a href={`/monsters/${id}`} key={id} className={styles.tooltipMob} title={monsterName(id)}>
              <MonsterSprite id={id} className={styles.tooltipMobSprite} />
              <span>{monsterName(id)}</span>
              <small>{monsterStat(monster, ["max_life", "MaxLife", "hp", "HP", "health", "Health"])} HP</small>
            </a>
          );
        })}
        {bossId ? (
          <a href={`/monsters/${bossId}`} className={`${styles.tooltipMob} ${styles.tooltipBossMob}`} title={monsterName(bossId)}>
            <MonsterSprite id={bossId} className={styles.tooltipMobSprite} />
            <span>{monsterName(bossId)}</span>
            <small>{monsterStat(focusMonster, ["max_life", "MaxLife", "hp", "HP", "health", "Health"])} HP</small>
          </a>
        ) : null}
      </div>
    </div>
  );
}

function StageSelectedCard({ stage, difficulty, drops, monsters }: { stage: AnyRow; difficulty: string; drops: AnyRow[]; monsters: AnyRow[] }) {
  const act = getStageAct(stage);
  const no = getStageNo(stage);
  const level = getStageLevel(stage);
  const monsterIds = getMonsterIds(stage, drops).slice(0, 4);
  const bossId = getBossId(stage);
  const waves = pick(stage, ["wave_amount", "WaveAmount", "waves", "Ondas", "wave_count", "OndaCount", "Onda", "wave"], "—");
  const mobsPerWave = pick(stage, ["wave_monster_amount", "WaveMonsterAmount", "mobs_per_wave", "MobsPerOnda", "mob_per_wave", "MobPerOnda"], "—");

  return (
    <aside className={styles.selectedCard} aria-label="Fase selecionada">
      <div className={styles.selectedCardHead}>
        <div>
          <span>ATO {act} | FASE {no}</span>
          <b>{difficultyLabel(difficulty)} | Nv. {level}</b>
          <strong>{getStageTitle(stage)}</strong>
        </div>
        <a href={`/stages/${encodeURIComponent(stageKey(stage))}`}>abrir ↗</a>
      </div>

      <div className={styles.selectedStats}>
        <span>Ondas <b>{waves || "—"}</b></span>
        <span>Mobs / onda <b>{mobsPerWave || "—"}</b></span>
        <span>Tipos <b>{monsterIds.length || "—"}</b></span>
        <span>Tipo <b>{getStageKind(stage)}</b></span>
      </div>

      <div className={styles.selectedMobs}>
        {monsterIds.map((id) => (
          <a href={`/monsters/${id}`} key={id} title={monsterName(id)}>
            <MonsterSprite id={id} className={styles.selectedMobSprite} />
            <span>{monsterName(id)}</span>
          </a>
        ))}
        {bossId ? (
          <a href={`/monsters/${bossId}`} className={styles.selectedBossMob} title={monsterName(bossId)}>
            <MonsterSprite id={bossId} className={styles.selectedMobSprite} />
            <span>{monsterName(bossId)}</span>
          </a>
        ) : null}
      </div>
    </aside>
  );
}

function StageMiniPanel({ stage, difficulty, drops, monsters }: { stage: AnyRow; difficulty: string; drops: AnyRow[]; monsters: AnyRow[] }) {
  const act = getStageAct(stage);
  const no = getStageNo(stage);
  const level = getStageLevel(stage);
  const monsterIds = getMonsterIds(stage, drops);
  const bossId = getBossId(stage);
  const lootRows = compactLootRows(stage, drops);
  const waves = pick(stage, ["wave_amount", "WaveAmount", "waves", "Ondas", "wave_count", "OndaCount", "Onda", "wave"], "—");
  const mobsPerWave = pick(stage, ["wave_monster_amount", "WaveMonsterAmount", "mobs_per_wave", "MobsPerOnda", "mob_per_wave", "MobPerOnda"], "—");

  return (
    <article className={styles.detailPanel}>
      <div className={styles.detailHead}>
        <div>
          <span>ATO {act}-{no} | Nv. {level}</span>
          <h2>{getStageTitle(stage)}</h2>
          <p>{difficultyLabel(difficulty)} · {getStageKind(stage)}</p>
        </div>
        <a href={`/stages/${encodeURIComponent(stageKey(stage))}`}>Página completa ↗</a>
      </div>

      <div className={styles.stageDataGrid}>
        <div><span>Ondas</span><b>{waves || "—"}</b></div>
        <div><span>Mobs / onda</span><b>{mobsPerWave || "—"}</b></div>
        <div><span>Tipos</span><b>{monsterIds.length || "—"}</b></div>
        <div><span>Tipo</span><b>{getStageKind(stage)}</b></div>
      </div>

      <section className={styles.detailBlock}>
        <h3>Monstros da fase</h3>
        <div className={styles.mobCardGrid}>
          {monsterIds.length ? monsterIds.slice(0, 6).map((id) => {
            const monster = findMonster(monsters, id);
            return (
              <a href={`/monsters/${id}`} key={id} className={styles.mobCard}>
                <MonsterSprite id={id} className={styles.mobCardSprite} />
                <span>{monsterName(id)}</span>
                <small>{monsterSpawnPercent(stage, id)} · HP {monsterStat(monster, ["max_life", "MaxLife", "hp", "HP", "health", "Health"])}</small>
              </a>
            );
          }) : <p className={styles.empty}>Nenhum monstro encontrado.</p>}
        </div>
      </section>

      {bossId ? (
        <section className={styles.detailBlock}>
          <h3>Chefe</h3>
          <a href={`/monsters/${bossId}`} className={styles.bossCard}>
            <MonsterSprite id={bossId} className={styles.bossSprite} />
            <span>
              <b>{monsterName(bossId)}</b>
              <small>Chefe vinculado à fase</small>
            </span>
          </a>
        </section>
      ) : null}

      <section className={styles.detailBlock}>
        <h3>Baús e saque</h3>
        <div className={styles.lootGrid}>
          {lootRows.length ? lootRows.map((row, index) => {
            const type = sourceType(row).toUpperCase();
            const key = dropKey(row);
            const name = CHEST_NAMES[type] ?? type.replace(/_/g, " ");
            const rate = getRate(row);
            return (
              <a key={`${type}-${key}-${index}`} href={`/drops?stage=${encodeURIComponent(stageKey(stage))}&drop=${encodeURIComponent(key)}`} className={styles.lootCard}>
                <RealImage src={chestIcon(type)} alt={name} className={styles.lootSprite} />
                <span>
                  <b>{name}</b>
                  <small>{key ? `Chave ${key}` : "Saque da fase"}{rate ? ` · taxa ${rate}` : ""}</small>
                </span>
              </a>
            );
          }) : <p className={styles.empty}>Drops não encontrados no cache local.</p>}
        </div>
      </section>

      <div className={styles.actions}>
        <a href={`/drops?stage=${encodeURIComponent(stageKey(stage))}`}>Ver drops</a>
        <a href={`/farm?stage=${encodeURIComponent(stageKey(stage))}`}>Farmar</a>
        {bossId ? <a href={`/monsters/${bossId}`}>Abrir chefe</a> : null}
      </div>
    </article>
  );
}

export default function StageWikiPro(props: Props) {
  const [stages, setStages] = useState<AnyRow[]>(OFFICIAL_STAGES);
  const [drops, setDrops] = useState<AnyRow[]>(props.drops ?? props.dropRows ?? []);
  const monsters = props.monsters?.length ? props.monsters : OFFICIAL_MONSTERS;
  const [difficulty, setDifficulty] = useState<string>("Normal");
  const [act, setAct] = useState<number>(1);
  const [selectedKey, setSelectedKey] = useState<string>("");
  const [hoverKey, setHoverKey] = useState<string>("");

  useEffect(() => {
    if ((props.stages?.length ?? 0) >= 120) setStages(props.stages ?? OFFICIAL_STAGES);
  }, [props.stages]);

  const visibleStages = useMemo(() => {
    const source = stages.length ? stages : OFFICIAL_STAGES;
    return localStagesForActMode(source, act, difficulty);
  }, [stages, act, difficulty]);

  const selected = useMemo(() => {
    const byKey = visibleStages.find((s) => stageKey(s) === selectedKey);
    return byKey ?? visibleStages[0] ?? null;
  }, [visibleStages, selectedKey]);

  const hoverStage = useMemo(() => {
    if (!hoverKey) return null;
    return visibleStages.find((s) => stageKey(s) === hoverKey) ?? null;
  }, [visibleStages, hoverKey]);

  useEffect(() => {
    if (visibleStages.length && !visibleStages.some((stage) => stageKey(stage) === selectedKey)) {
      setSelectedKey(stageKey(visibleStages[0]));
    }
  }, [visibleStages, selectedKey]);

  useEffect(() => {
    if (!selected) return;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anon) return;
    const key = stageKey(selected);
    if (!key || drops.some((d) => dropStageKey(d) === key)) return;

    const supabase = createClient(url, anon, { auth: { persistSession: false } });
    let cancelled = false;
    async function run() {
      const { data } = await supabase.from("tbh_stage_drop_items").select("*").eq("stage_key", key).limit(500);
      if (!cancelled && data?.length) setDrops((old) => [...old.filter((d) => dropStageKey(d) !== key), ...data]);
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [selectedKey]);

  if (!selected) {
    return (
      <section className={styles.stageWrap}>
        <div className={styles.emptyPanel}>Não foi possível carregar as fases.</div>
      </section>
    );
  }

  const selectedDrops = drops.filter((d) => dropStageKey(d) === stageKey(selected));
  const tooltipStage = hoverStage;
  const tooltipNo = tooltipStage ? getStageNo(tooltipStage) : 1;
  const tooltipPos = NODE_POSITIONS[stageIndexFromNo(tooltipNo)] ?? NODE_POSITIONS[0];
  const tooltipStyle = tooltipStage
    ? {
        left: `${tooltipPos.x >= 62 ? tooltipPos.x - 24 : tooltipPos.x + 19}%`,
        top: `${Math.min(76, Math.max(18, tooltipPos.y - 8))}%`,
      }
    : undefined;

  return (
    <section className={styles.stageWrap}>
      <header className={styles.stageHeader}>
        <div className={styles.stageHeaderTitle}>
          <span>Database</span>
          <h1>Fases</h1>
          <p>Mapa interativo com bandeiras, mobs, chefes e baús por dificuldade.</p>
        </div>
        <div className={styles.headerStats}>
          <b>3</b><span>Atos</span>
          <b>4</b><span>Dificuldades</span>
          <b>120</b><span>Fases</span>
        </div>
      </header>

      <div className={styles.mainGrid}>
        <section className={styles.mapPanel}>
          <div className={styles.mapToolbar}>
            <label className={styles.modeSelector}>
              <select value={difficulty} onChange={(event) => setDifficulty(event.target.value)} aria-label="Selecionar dificuldade">
                {DIFFICULTIES.map((mode) => (
                  <option key={mode} value={mode}>{difficultyLabel(mode)}</option>
                ))}
              </select>
              <b>▼</b>
            </label>

            <div className={styles.actTabs} aria-label="Selecionar ato">
              {ACTS.map((n) => (
                <button key={n} type="button" className={act === n ? styles.actActive : ""} onClick={() => setAct(n)}>ATO {n}</button>
              ))}
            </div>
          </div>

          <div className={styles.stageMapLayout}>
            <div className={styles.mapFrame} onMouseLeave={() => setHoverKey("")}>
              <RealImage src={ACT_MAPS[act]} alt={`Mapa do Ato ${act}`} className={styles.actMapImage} />
              <div className={styles.mapOverlayLabel}>ATO {act}</div>

              {visibleStages.map((stage) => {
                const no = getStageNo(stage);
                const pos = NODE_POSITIONS[stageIndexFromNo(no)];
                const active = stageKey(stage) === stageKey(selected);
                const hovered = stageKey(stage) === hoverKey;
                const boss = getStageKind(stage) !== "Normal" || no === 10;
                return (
                  <button
                    key={stageKey(stage)}
                    type="button"
                    aria-label={`Ato ${act} fase ${no}: ${getStageTitle(stage)}`}
                    title={`Ato ${act}-${no} · ${getStageTitle(stage)}`}
                    className={`${styles.stageNode} ${active ? styles.stageNodeActive : ""} ${hovered ? styles.stageNodeHover : ""} ${boss ? styles.stageNodeBoss : ""}`}
                    style={{ left: `${pos.x}%`, top: `${pos.y}%` } as CSSProperties}
                    onMouseEnter={() => setHoverKey(stageKey(stage))}
                    onFocus={() => setHoverKey(stageKey(stage))}
                    onBlur={() => setHoverKey("")}
                    onClick={() => setSelectedKey(stageKey(stage))}
                  >
                    <span className={styles.stageBase} />
                    <span className={styles.stageFlag} />
                    <small>{act}-{no}</small>
                  </button>
                );
              })}

              {tooltipStage ? (
                <div className={styles.tooltipWrap} style={tooltipStyle}>
                  <StageTooltip stage={tooltipStage} difficulty={difficulty} monsters={monsters} />
                </div>
              ) : null}
            </div>

            <StageSelectedCard stage={selected} difficulty={difficulty} drops={selectedDrops} monsters={monsters} />
          </div>

          <p className={styles.mapHint}>Passe o mouse na bandeira para ver os mobs. Clique para fixar a fase.</p>
        </section>
      </div>
    </section>
  );
}
